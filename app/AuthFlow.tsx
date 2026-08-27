"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AuthUser } from "./auth-server";

type AuthMethod = "phone" | "email";
type AuthResponse = {
  user?: AuthUser;
  progress?: unknown;
  isNew?: boolean;
  wechatEnabled?: boolean;
  message?: string;
};

export default function AuthFlow({
  user,
  wechatEnabled,
  onAuthenticated,
  onCompleteOnboarding,
}: {
  user: AuthUser | null;
  wechatEnabled: boolean;
  onAuthenticated: (response: AuthResponse) => void;
  onCompleteOnboarding: (targetBandScore: number) => Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [identifier, setIdentifier] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [targetBandScore, setTargetBandScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("auth_error") ? "微信登录没有完成，请重新尝试。" : "");
  const targetOptions = useMemo(() => [5.5, 6, 6.5, 7, 7.5, 8, 8.5], []);

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: mode, provider: method, identifier, password, displayName }),
      });
      const result = await response.json() as AuthResponse;
      if (!response.ok || !result.user) throw new Error(result.message || "登录失败，请稍后重试");
      onAuthenticated(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const completeOnboarding = async () => {
    if (targetBandScore === null) return;
    setSubmitting(true);
    setMessage("");
    try {
      await onCompleteOnboarding(targetBandScore);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "计划创建失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (user) return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <header className="onboarding-brand"><span>IP</span><strong>IELTS PASS</strong></header>
        <div className="onboarding-progress"><i /><i className="is-active" /></div>
        <span className="onboarding-kicker">WELCOME, {user.displayName.toUpperCase()}</span>
        <h1>你的目标分数是？</h1>
        <p>我们会依据目标分数调整每日词汇量、听读说难度和套题频率。之后仍可在“我的”页面修改。</p>
        <div className="onboarding-band-grid" role="radiogroup" aria-label="选择 IELTS 目标分数">
          {targetOptions.map((score) => <button type="button" role="radio" aria-checked={targetBandScore === score} className={targetBandScore === score ? "is-selected" : ""} onClick={() => setTargetBandScore(score)} key={score}><strong>{score.toFixed(1)}</strong><small>{score <= 6 ? "基础巩固" : score <= 7 ? "均衡提分" : score <= 7.5 ? "高阶强化" : "高分精炼"}</small></button>)}
        </div>
        {message && <p className="auth-message" role="alert">{message}</p>}
        <button className="onboarding-submit" disabled={targetBandScore === null || submitting} onClick={completeOnboarding}>{submitting ? "正在创建计划…" : "创建我的学习计划 →"}</button>
        <small className="onboarding-footnote">默认先生成 90 天计划，备考周期可以随时调整。</small>
      </section>
    </main>
  );

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <header><span className="auth-brand-mark">IP</span><div><strong>IELTS PASS</strong><small>Daily study system</small></div></header>
        <div className="auth-story-copy"><span>PERSONALISED IELTS PLAN</span><h1>让每一天的练习，都更接近你的目标。</h1><p>词汇、听力、阅读与口语会按照目标分数和学习进度持续调整。</p></div>
        <div className="auth-water-visual" aria-hidden="true"><i /><i /><i /><strong>7.0</strong><small>TARGET BAND</small></div>
        <footer><span>01 目标驱动</span><span>02 每日递升</span><span>03 进度同步</span></footer>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <header><span>欢迎使用 IELTS PASS</span><h2>{mode === "register" ? "创建你的学习账户" : "继续你的学习计划"}</h2><p>{mode === "register" ? "注册后只需选择目标分数，即可生成个人学习路线。" : "登录后恢复你的目标、笔记与学习进度。"}</p></header>
          <div className="auth-mode-tabs" role="tablist" aria-label="登录或注册">
            <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "is-active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>注册</button>
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>登录</button>
          </div>
          <button type="button" className="wechat-auth-button" disabled={!wechatEnabled} onClick={() => { window.location.href = "/api/auth?action=wechat-start"; }}><span>微</span>{wechatEnabled ? "使用微信继续" : "微信登录 · 等待开放平台配置"}</button>
          <div className="auth-divider"><span>或使用账号</span></div>
          <div className="auth-method-tabs" role="tablist" aria-label="选择账号方式">
            <button type="button" role="tab" aria-selected={method === "phone"} className={method === "phone" ? "is-active" : ""} onClick={() => { setMethod("phone"); setIdentifier(""); setMessage(""); }}>手机号</button>
            <button type="button" role="tab" aria-selected={method === "email"} className={method === "email" ? "is-active" : ""} onClick={() => { setMethod("email"); setIdentifier(""); setMessage(""); }}>Email</button>
          </div>
          <form className="auth-form" onSubmit={submitCredentials}>
            {mode === "register" && <label><span>昵称</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="怎么称呼你" autoComplete="name" /></label>}
            <label><span>{method === "phone" ? "手机号" : "Email"}</span><input type={method === "email" ? "email" : "tel"} value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={method === "phone" ? "+86 138 0000 0000" : "name@example.com"} autoComplete={method === "email" ? "email" : "tel"} required /></label>
            <label><span>密码</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 个字符" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} required /></label>
            {message && <p className="auth-message" role="alert">{message}</p>}
            <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? "请稍候…" : mode === "register" ? "注册并选择目标分数 →" : "登录 →"}</button>
          </form>
          <p className="auth-legal">继续即表示你同意服务条款与隐私政策。账号密码经过加盐加密保存，不会明文存储。</p>
        </div>
      </section>
    </main>
  );
}
