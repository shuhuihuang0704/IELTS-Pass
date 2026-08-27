import {
  authDb,
  clearSessionCookie,
  createSession,
  currentUser,
  deleteCurrentSession,
  ensureAuthSchema,
  hashPassword,
  normalizeIdentifier,
  publicAuthPayload,
  requestWechatState,
  verifyPassword,
  wechatIsConfigured,
  wechatRuntime,
  wechatStateCookie,
  type AuthProvider,
} from "../../auth-server";

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

function errorResponse(error: unknown, status = 400) {
  return json({ message: error instanceof Error ? error.message : "请求失败，请稍后重试" }, status);
}

const avatarPresetIds = new Set(["preset:violet", "preset:ocean", "preset:mint", "preset:sunset", "preset:rose", "preset:ink"]);

function profileFields(body: Record<string, unknown>, currentAvatar: string | null) {
  const displayName = String(body.displayName ?? "").trim().slice(0, 40);
  if (!displayName) throw new Error("请输入你的名字或昵称");
  const requestedAvatar = String(body.avatarUrl ?? "");
  const avatarUrl = avatarPresetIds.has(requestedAvatar) ? requestedAvatar : currentAvatar;
  return { displayName, avatarUrl };
}

export async function GET(request: Request) {
  const action = new URL(request.url).searchParams.get("action") ?? "session";
  try {
    await ensureAuthSchema();
    if (action === "session") {
      const row = await currentUser(request);
      return json({ ...(row ? publicAuthPayload(row) : { user: null, progress: null }), wechatEnabled: wechatIsConfigured() });
    }
    if (action === "wechat-start") {
      if (!wechatIsConfigured()) return errorResponse(new Error("微信登录尚未配置开放平台 AppID"), 503);
      const { appId } = wechatRuntime();
      const state = crypto.randomUUID().replaceAll("-", "");
      const currentUrl = new URL(request.url);
      const redirectUri = `${currentUrl.origin}/api/auth?action=wechat-callback`;
      const authorizationUrl = new URL("https://open.weixin.qq.com/connect/qrconnect");
      authorizationUrl.searchParams.set("appid", appId);
      authorizationUrl.searchParams.set("redirect_uri", redirectUri);
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("scope", "snsapi_login");
      authorizationUrl.searchParams.set("state", state);
      return new Response(null, { status: 302, headers: { location: `${authorizationUrl.toString()}#wechat_redirect`, "set-cookie": wechatStateCookie(request, state) } });
    }
    if (action === "wechat-callback") {
      const url = new URL(request.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state || state !== requestWechatState(request)) return Response.redirect(`${url.origin}/?auth_error=wechat_state`, 302);
      const { appId, appSecret } = wechatRuntime();
      const tokenUrl = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
      tokenUrl.searchParams.set("appid", appId);
      tokenUrl.searchParams.set("secret", appSecret);
      tokenUrl.searchParams.set("code", code);
      tokenUrl.searchParams.set("grant_type", "authorization_code");
      const tokenResponse = await fetch(tokenUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      const token = await tokenResponse.json() as { access_token?: string; openid?: string; unionid?: string; errcode?: number };
      if (!tokenResponse.ok || !token.access_token || !token.openid) return Response.redirect(`${url.origin}/?auth_error=wechat_token`, 302);
      const profileUrl = new URL("https://api.weixin.qq.com/sns/userinfo");
      profileUrl.searchParams.set("access_token", token.access_token);
      profileUrl.searchParams.set("openid", token.openid);
      profileUrl.searchParams.set("lang", "zh_CN");
      const profileResponse = await fetch(profileUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      const profile = await profileResponse.json() as { nickname?: string; headimgurl?: string; unionid?: string };
      const identifier = profile.unionid ?? token.unionid ?? token.openid;
      const now = Date.now();
      let user = await authDb().prepare("SELECT id, provider, identifier, display_name AS displayName, avatar_url AS avatarUrl, target_band_score AS targetBandScore, study_plan_days AS studyPlanDays, progress_json AS progressJson FROM users WHERE provider = 'wechat' AND identifier = ?")
        .bind(identifier).first<Record<string, unknown>>();
      if (!user) {
        const id = crypto.randomUUID();
        await authDb().prepare("INSERT INTO users (id, provider, identifier, display_name, avatar_url, created_at, updated_at) VALUES (?, 'wechat', ?, ?, ?, ?, ?)")
          .bind(id, identifier, profile.nickname?.trim() || "微信用户", profile.headimgurl ?? null, now, now).run();
        user = { id };
      }
      const cookie = await createSession(request, String(user.id));
      const headers = new Headers({ location: url.origin });
      headers.append("set-cookie", cookie);
      headers.append("set-cookie", wechatStateCookie(request, "", 0));
      return new Response(null, { status: 302, headers });
    }
    return errorResponse(new Error("不支持的登录操作"), 404);
  } catch (error) {
    return errorResponse(error, 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return errorResponse(new Error("请求内容格式错误")); }
  const action = String(body.action ?? "");
  try {
    await ensureAuthSchema();
    if (action === "register") {
      const provider = String(body.provider ?? "") as AuthProvider;
      if (provider !== "email" && provider !== "phone") throw new Error("请选择手机号或 Email 注册");
      const identifier = normalizeIdentifier(provider, body.identifier);
      const displayName = String(body.displayName ?? "").trim().slice(0, 40) || (provider === "email" ? identifier.split("@")[0] : `用户${identifier.slice(-4)}`);
      const passwordHash = await hashPassword(body.password);
      const exists = await authDb().prepare("SELECT id FROM users WHERE provider = ? AND identifier = ?").bind(provider, identifier).first();
      if (exists) return errorResponse(new Error("该账号已经注册，请直接登录"), 409);
      const id = crypto.randomUUID();
      const now = Date.now();
      await authDb().prepare("INSERT INTO users (id, provider, identifier, password_hash, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id, provider, identifier, passwordHash, displayName, now, now).run();
      const cookie = await createSession(request, id);
      return json({ user: { id, provider, identifier, displayName, avatarUrl: null, targetBandScore: null, studyPlanDays: null }, progress: null, isNew: true, wechatEnabled: wechatIsConfigured() }, 201, { "set-cookie": cookie });
    }
    if (action === "login") {
      const provider = String(body.provider ?? "") as AuthProvider;
      if (provider !== "email" && provider !== "phone") throw new Error("请选择手机号或 Email 登录");
      const identifier = normalizeIdentifier(provider, body.identifier);
      const row = await authDb().prepare("SELECT id, provider, identifier, password_hash AS passwordHash, display_name AS displayName, avatar_url AS avatarUrl, target_band_score AS targetBandScore, study_plan_days AS studyPlanDays, progress_json AS progressJson FROM users WHERE provider = ? AND identifier = ?")
        .bind(provider, identifier).first<Record<string, unknown>>();
      if (!row || !await verifyPassword(body.password, typeof row.passwordHash === "string" ? row.passwordHash : null)) return errorResponse(new Error("账号或密码不正确"), 401);
      const cookie = await createSession(request, String(row.id));
      return json({ ...publicAuthPayload(row as never), isNew: false, wechatEnabled: wechatIsConfigured() }, 200, { "set-cookie": cookie });
    }
    if (action === "logout") {
      await deleteCurrentSession(request);
      return json({ ok: true }, 200, { "set-cookie": clearSessionCookie(request) });
    }
    const row = await currentUser(request);
    if (!row) return errorResponse(new Error("请先登录"), 401);
    if (action === "onboarding") {
      const targetBandScore = Math.max(5.5, Math.min(8.5, Math.round(Number(body.targetBandScore) * 2) / 2));
      const studyPlanDays = Math.max(30, Math.min(180, Math.round(Number(body.studyPlanDays) || 90)));
      if (!Number.isFinite(targetBandScore)) throw new Error("请选择目标分数");
      const { displayName, avatarUrl } = profileFields(body, row.avatarUrl);
      const progressJson = body.progress && typeof body.progress === "object" ? JSON.stringify(body.progress) : null;
      await authDb().prepare("UPDATE users SET display_name = ?, avatar_url = ?, target_band_score = ?, study_plan_days = ?, progress_json = COALESCE(?, progress_json), updated_at = ? WHERE id = ?")
        .bind(displayName, avatarUrl, targetBandScore, studyPlanDays, progressJson, Date.now(), row.id).run();
      return json({ user: { ...publicAuthPayload(row).user, displayName, avatarUrl, targetBandScore, studyPlanDays }, progress: body.progress ?? publicAuthPayload(row).progress });
    }
    if (action === "profile") {
      const { displayName, avatarUrl } = profileFields(body, row.avatarUrl);
      await authDb().prepare("UPDATE users SET display_name = ?, avatar_url = ?, updated_at = ? WHERE id = ?")
        .bind(displayName, avatarUrl, Date.now(), row.id).run();
      return json({ user: { ...publicAuthPayload(row).user, displayName, avatarUrl } });
    }
    if (action === "progress") {
      if (!body.progress || typeof body.progress !== "object") throw new Error("学习进度格式错误");
      const progress = body.progress as Record<string, unknown>;
      const nextTarget = Number(progress.targetBandScore);
      const nextPlanDays = Number(progress.studyPlanDays);
      const targetBandScore = Number.isFinite(nextTarget) ? Math.max(5.5, Math.min(8.5, Math.round(nextTarget * 2) / 2)) : null;
      const studyPlanDays = Number.isFinite(nextPlanDays) ? Math.max(30, Math.min(180, Math.round(nextPlanDays))) : null;
      await authDb().prepare("UPDATE users SET progress_json = ?, target_band_score = COALESCE(?, target_band_score), study_plan_days = COALESCE(?, study_plan_days), updated_at = ? WHERE id = ?")
        .bind(JSON.stringify(progress), targetBandScore, studyPlanDays, Date.now(), row.id).run();
      return json({ ok: true });
    }
    return errorResponse(new Error("不支持的账号操作"), 404);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
