import { env } from "cloudflare:workers";
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";

type AuthEnvironment = {
  DB?: D1Database;
  WECHAT_APP_ID?: string;
  WECHAT_APP_SECRET?: string;
  BREVO_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
  AUTH_EMAIL_FROM_NAME?: string;
  AUTH_OTP_SECRET?: string;
};

export type AuthProvider = "email" | "phone" | "wechat" | "guest";

export type AuthUser = {
  id: string;
  provider: AuthProvider;
  identifier: string;
  displayName: string;
  avatarUrl: string | null;
  targetBandScore: number | null;
  studyPlanDays: number | null;
  examDate: string | null;
};

type AuthUserRow = AuthUser & { progressJson: string | null };

const sessionCookie = "ielts_pass_session";
const wechatStateCookieName = "ielts_pass_wechat_state";
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;
const passwordHashIterations = 210_000;
const maximumSupportedPasswordHashIterations = 1_000_000;
const emailCodeLifetimeMs = 10 * 60 * 1000;
const emailCodeCooldownMs = 60 * 1000;
const emailCodeHourlyLimit = 5;
const ipHourlyLimit = 20;
const maximumCodeAttempts = 5;

function authEnvironment() {
  return env as unknown as AuthEnvironment;
}

function database() {
  const databaseBinding = authEnvironment().DB;
  if (!databaseBinding) throw new Error("账号数据库尚未配置");
  return databaseBinding;
}

export function wechatIsConfigured() {
  const runtime = authEnvironment();
  return Boolean(runtime.WECHAT_APP_ID && runtime.WECHAT_APP_SECRET);
}

export function emailCodeIsConfigured() {
  const runtime = authEnvironment();
  return Boolean(runtime.BREVO_API_KEY && runtime.AUTH_EMAIL_FROM && runtime.AUTH_OTP_SECRET && runtime.AUTH_OTP_SECRET.length >= 32);
}

export async function ensureAuthSchema() {
  const db = database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      provider TEXT NOT NULL,
      identifier TEXT NOT NULL,
      password_hash TEXT,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      target_band_score REAL,
      study_plan_days INTEGER,
      exam_date TEXT,
      progress_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_identifier ON users(provider, identifier)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(token_hash)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_provider_identities (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      PRIMARY KEY(provider, provider_user_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS email_login_codes (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0 NOT NULL,
      consumed_at INTEGER,
      request_ip_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_email_login_codes_email_created ON email_login_codes(email, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_email_login_codes_ip_created ON email_login_codes(request_ip_hash, created_at)"),
  ]);
  const userColumns = await db.prepare("PRAGMA table_info(users)").all<{ name: string }>();
  if (!userColumns.results.some((column) => column.name === "exam_date")) {
    try {
      await db.prepare("ALTER TABLE users ADD COLUMN exam_date TEXT").run();
    } catch (error) {
      const refreshedColumns = await db.prepare("PRAGMA table_info(users)").all<{ name: string }>();
      if (!refreshedColumns.results.some((column) => column.name === "exam_date")) throw error;
    }
  }
}

function parseCookies(request: Request) {
  return Object.fromEntries((request.headers.get("cookie") ?? "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf("=");
    return separator === -1 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
  }));
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken(byteLength = 32) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function sha256(value: string) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

async function hmacSha256(value: string) {
  const secret = authEnvironment().AUTH_OTP_SECRET ?? "";
  if (secret.length < 32) throw new Error("邮箱验证码密钥尚未安全配置");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

function randomSixDigitCode() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
}

function requestClientAddress(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

type EmailCodePurpose = "login" | "register";

function emailRuntime() {
  const runtime = authEnvironment();
  if (!emailCodeIsConfigured()) throw new Error("邮箱验证码服务尚未配置完成");
  return {
    apiKey: runtime.BREVO_API_KEY ?? "",
    from: runtime.AUTH_EMAIL_FROM ?? "",
    fromName: runtime.AUTH_EMAIL_FROM_NAME?.trim() || "IELTS PASS",
  };
}

async function sendCodeEmail(email: string, code: string) {
  const runtime = emailRuntime();
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { accept: "application/json", "api-key": runtime.apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { email: runtime.from, name: runtime.fromName },
      to: [{ email }],
      subject: `${code} · IELTS PASS 登录验证码`,
      htmlContent: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:auto;padding:32px;color:#29262d"><div style="font-size:13px;font-weight:800;letter-spacing:1px;color:#5d54c9">IELTS PASS</div><h1 style="font-size:24px;margin:24px 0 8px">你的登录验证码</h1><p style="color:#6d6873;line-height:1.6">请在 IELTS PASS 中输入下面的 6 位验证码：</p><div style="margin:24px 0;padding:18px;border-radius:14px;background:#f1effc;color:#443ca5;font-size:34px;font-weight:800;letter-spacing:8px;text-align:center">${code}</div><p style="color:#8c8791;font-size:13px;line-height:1.6">验证码 10 分钟内有效，且只能使用一次。若不是你本人操作，请忽略这封邮件。</p></div>`,
      textContent: `IELTS PASS 验证码：${code}。10 分钟内有效，且只能使用一次。若不是你本人操作，请忽略。`,
      tags: ["auth-otp"],
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const details = await response.text();
    console.error("Brevo email delivery failed", response.status, details.slice(0, 300));
    throw new Error("验证码邮件发送失败，请稍后重试");
  }
}

export async function issueEmailCode(request: Request, email: string, purpose: EmailCodePurpose) {
  emailRuntime();
  const db = database();
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const ipHash = await hmacSha256(`ip:${requestClientAddress(request)}`);
  const latest = await db.prepare("SELECT created_at AS createdAt FROM email_login_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1")
    .bind(email).first<{ createdAt: number }>();
  if (latest && now - Number(latest.createdAt) < emailCodeCooldownMs) {
    const retryAfterSeconds = Math.ceil((emailCodeCooldownMs - (now - Number(latest.createdAt))) / 1000);
    throw new Error(`请等待 ${retryAfterSeconds} 秒后再发送`);
  }
  const [emailCountRow, ipCountRow] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM email_login_codes WHERE email = ? AND created_at > ?").bind(email, hourAgo).first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) AS count FROM email_login_codes WHERE request_ip_hash = ? AND created_at > ?").bind(ipHash, hourAgo).first<{ count: number }>(),
  ]);
  if (Number(emailCountRow?.count ?? 0) >= emailCodeHourlyLimit) throw new Error("发送次数过多，请一小时后再试");
  if (Number(ipCountRow?.count ?? 0) >= ipHourlyLimit) throw new Error("当前网络请求过于频繁，请一小时后再试");
  const id = crypto.randomUUID();
  const code = randomSixDigitCode();
  const codeHash = await hmacSha256(`${id}:${email}:${purpose}:${code}`);
  await db.prepare("DELETE FROM email_login_codes WHERE created_at < ?").bind(now - 24 * 60 * 60 * 1000).run();
  await db.prepare("INSERT INTO email_login_codes (id, email, purpose, code_hash, expires_at, attempts, consumed_at, request_ip_hash, created_at) VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?)")
    .bind(id, email, purpose, codeHash, now + emailCodeLifetimeMs, ipHash, now).run();
  try {
    await sendCodeEmail(email, code);
  } catch (error) {
    await db.prepare("DELETE FROM email_login_codes WHERE id = ?").bind(id).run();
    throw error;
  }
  return { retryAfterSeconds: emailCodeCooldownMs / 1000 };
}

export async function consumeEmailCode(email: string, purpose: EmailCodePurpose, codeValue: unknown) {
  const code = String(codeValue ?? "").trim();
  if (!/^\d{6}$/.test(code)) throw new Error("请输入邮件中的 6 位验证码");
  const db = database();
  const now = Date.now();
  const row = await db.prepare(`SELECT id, code_hash AS codeHash, attempts, expires_at AS expiresAt
    FROM email_login_codes WHERE email = ? AND purpose = ? AND consumed_at IS NULL
    ORDER BY created_at DESC LIMIT 1`).bind(email, purpose).first<{ id: string; codeHash: string; attempts: number; expiresAt: number }>();
  if (!row || Number(row.expiresAt) <= now) throw new Error("验证码已失效，请重新获取");
  if (Number(row.attempts) >= maximumCodeAttempts) throw new Error("验证码尝试次数过多，请重新获取");
  const candidateHash = await hmacSha256(`${row.id}:${email}:${purpose}:${code}`);
  if (candidateHash !== row.codeHash) {
    await db.prepare("UPDATE email_login_codes SET attempts = attempts + 1 WHERE id = ? AND consumed_at IS NULL").bind(row.id).run();
    throw new Error("验证码不正确，请检查后重试");
  }
  const consumed = await db.prepare("UPDATE email_login_codes SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL AND expires_at > ? AND attempts < ?")
    .bind(now, row.id, now, maximumCodeAttempts).run();
  if (!consumed.meta.changes) throw new Error("验证码已使用或已失效，请重新获取");
}

export function normalizeIdentifier(provider: "email" | "phone", value: unknown) {
  const identifier = String(value ?? "").trim();
  if (provider === "email") {
    const email = identifier.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) throw new Error("请输入有效的 Email 地址");
    return email;
  }
  const phone = identifier.replace(/[\s()-]/g, "");
  if (!/^\+?[1-9]\d{6,14}$/.test(phone)) throw new Error("请输入带国家区号的有效手机号");
  return phone.startsWith("+") ? phone : `+86${phone}`;
}

export async function hashPassword(passwordValue: unknown) {
  const password = String(passwordValue ?? "");
  if (password.length < 8 || password.length > 128) throw new Error("密码需要 8–128 个字符");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2Async(nobleSha256, password, salt, {
    c: passwordHashIterations,
    dkLen: 32,
    asyncTick: 8,
  });
  return `pbkdf2$${passwordHashIterations}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}

export async function verifyPassword(passwordValue: unknown, storedHash: string | null) {
  if (!storedHash) return false;
  const [algorithm, iterationsText, saltHex, expectedHex] = storedHash.split("$");
  if (algorithm !== "pbkdf2" || !iterationsText || !saltHex || !expectedHex) return false;
  const iterations = Number(iterationsText);
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > maximumSupportedPasswordHashIterations) return false;
  if (!/^[0-9a-f]{32}$/i.test(saltHex) || !/^[0-9a-f]{64}$/i.test(expectedHex)) return false;
  const password = String(passwordValue ?? "");
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
  const derived = await pbkdf2Async(nobleSha256, password, salt, {
    c: iterations,
    dkLen: 32,
    asyncTick: 8,
  });
  const expected = new Uint8Array(expectedHex.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
  if (derived.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < derived.length; index += 1) difference |= derived[index] ^ expected[index];
  return difference === 0;
}

function sessionCookieHeader(request: Request, token: string, maxAge = sessionLifetimeSeconds) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookie(request: Request) {
  return sessionCookieHeader(request, "", 0);
}

export async function createSession(request: Request, userId: string) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const now = Date.now();
  await database().prepare("INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), userId, tokenHash, now + sessionLifetimeSeconds * 1000, now).run();
  return sessionCookieHeader(request, token);
}

export async function deleteCurrentSession(request: Request) {
  const token = parseCookies(request)[sessionCookie];
  if (token) await database().prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
}

export async function currentUser(request: Request) {
  const token = parseCookies(request)[sessionCookie];
  if (!token) return undefined;
  const row = await database().prepare(`SELECT
      users.id, users.provider, users.identifier, users.display_name AS displayName,
      users.avatar_url AS avatarUrl, users.target_band_score AS targetBandScore,
      users.study_plan_days AS studyPlanDays, users.exam_date AS examDate,
      users.progress_json AS progressJson
    FROM auth_sessions JOIN users ON users.id = auth_sessions.user_id
    WHERE auth_sessions.token_hash = ? AND auth_sessions.expires_at > ?`)
    .bind(await sha256(token), Date.now()).first<AuthUserRow>();
  return row ?? undefined;
}

export function publicAuthPayload(row: AuthUserRow | AuthUser) {
  const user: AuthUser = {
    id: row.id,
    provider: row.provider,
    identifier: row.identifier,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    targetBandScore: row.targetBandScore,
    studyPlanDays: row.studyPlanDays,
    examDate: row.examDate,
  };
  let progress: unknown = null;
  if ("progressJson" in row && row.progressJson) {
    try { progress = JSON.parse(row.progressJson); } catch { progress = null; }
  }
  return { user, progress };
}

export function wechatStateCookie(request: Request, state: string, maxAge = 600) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${wechatStateCookieName}=${encodeURIComponent(state)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function requestWechatState(request: Request) {
  return parseCookies(request)[wechatStateCookieName];
}

export function authDb() {
  return database();
}

export function wechatRuntime() {
  const runtime = authEnvironment();
  return { appId: runtime.WECHAT_APP_ID ?? "", appSecret: runtime.WECHAT_APP_SECRET ?? "" };
}
