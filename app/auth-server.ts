import { env } from "cloudflare:workers";

type AuthEnvironment = {
  DB?: D1Database;
  WECHAT_APP_ID?: string;
  WECHAT_APP_SECRET?: string;
};

export type AuthProvider = "email" | "phone" | "wechat";

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
    db.prepare(`CREATE TABLE IF NOT EXISTS auth_recovery_codes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      used_at INTEGER
    )`),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_recovery_codes_code_hash ON auth_recovery_codes(code_hash)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_auth_recovery_codes_user_id ON auth_recovery_codes(user_id)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_provider_identities (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      PRIMARY KEY(provider, provider_user_id)
    )`),
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

const recoveryCodeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function recoveryCode() {
  const random = crypto.getRandomValues(new Uint8Array(12));
  const body = Array.from(random, (byte) => recoveryCodeAlphabet[byte % recoveryCodeAlphabet.length]).join("");
  return `IP-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8)}`;
}

export function normalizeRecoveryCode(value: unknown) {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function hashRecoveryCode(value: unknown) {
  const normalized = normalizeRecoveryCode(value);
  if (!/^IP[2-9A-HJ-NP-Z]{12}$/.test(normalized)) return "";
  return sha256(normalized);
}

export async function replaceRecoveryCodes(userId: string, count = 8) {
  const codes = Array.from({ length: count }, () => recoveryCode());
  const hashes = await Promise.all(codes.map((code) => hashRecoveryCode(code)));
  const now = Date.now();
  const db = database();
  await db.batch([
    db.prepare("DELETE FROM auth_recovery_codes WHERE user_id = ?").bind(userId),
    ...hashes.map((hash) => db.prepare("INSERT INTO auth_recovery_codes (id, user_id, code_hash, created_at) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), userId, hash, now)),
  ]);
  return codes;
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
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const iterations = 210_000;
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, 256);
  return `pbkdf2$${iterations}$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(derived))}`;
}

export async function verifyPassword(passwordValue: unknown, storedHash: string | null) {
  if (!storedHash) return false;
  const [algorithm, iterationsText, saltHex, expectedHex] = storedHash.split("$");
  if (algorithm !== "pbkdf2" || !iterationsText || !saltHex || !expectedHex) return false;
  const password = String(passwordValue ?? "");
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: Number(iterationsText) }, material, 256));
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
