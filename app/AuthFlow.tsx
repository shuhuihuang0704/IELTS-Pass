"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AuthUser } from "./auth-server";
import { AccountAvatar, AccountAvatarPicker, defaultAccountAvatar } from "./AccountAvatar";

type AuthMethod = "phone" | "email";
type StudyPeriodMode = "days" | "exam-date";
type AuthResponse = {
  user?: AuthUser;
  progress?: unknown;
  isNew?: boolean;
  message?: string;
};

function localDateKeyAfter(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysUntilDate(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 0;
  const [year, month, day] = dateKey.split("-").map(Number);
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const targetUtc = Date.UTC(year, month - 1, day);
  return Math.round((targetUtc - todayUtc) / 86_400_000);
}

export default function AuthFlow({
  user,
  onAuthenticated,
  onCompleteOnboarding,
}: {
  user: AuthUser | null;
  onAuthenticated: (response: AuthResponse) => void;
  onCompleteOnboarding: (targetBandScore: number, displayName: string, avatarUrl: string, studyPlanDays: number, examDate: string | null) => Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [identifier, setIdentifier] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [targetBandScore, setTargetBandScore] = useState<number | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarChoice, setAvatarChoice] = useState<string | null>(null);
  const [studyPeriodMode, setStudyPeriodMode] = useState<StudyPeriodMode>("days");
  const [studyPlanDays, setStudyPlanDays] = useState("90");
  const [examDate, setExamDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
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
      if (mode === "login") setPassword("");
      setMessage(error instanceof Error ? error.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const completeOnboarding = async () => {
    if (targetBandScore === null) return;
    const nextDisplayName = (profileName ?? user?.displayName ?? "").trim();
    const nextAvatar = avatarChoice ?? user?.avatarUrl ?? defaultAccountAvatar;
    if (!nextDisplayName) {
      setMessage("请输入你的名字或昵称");
      return;
    }
    let resolvedPlanDays = Math.round(Number(studyPlanDays));
    let resolvedExamDate: string | null = null;
    if (studyPeriodMode === "exam-date") {
      resolvedPlanDays = daysUntilDate(examDate);
      resolvedExamDate = examDate;
      if (!examDate) {
        setMessage("请选择考试日期");
        return;
      }
    }
    if (!Number.isFinite(resolvedPlanDays) || resolvedPlanDays < 7 || resolvedPlanDays > 365) {
      setMessage(studyPeriodMode === "exam-date" ? "考试日期需要在 7–365 天以内" : "学习周期需要在 7–365 天之间");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      await onCompleteOnboarding(targetBandScore, nextDisplayName, nextAvatar, resolvedPlanDays, resolvedExamDate);
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
        <span className="onboarding-kicker">CREATE YOUR STUDY PROFILE</span>
        <h1>设置你的头像、名字与目标。</h1>
        <p>这些资料会显示在“我的”页面；目标分数会调整每日词汇量、听读说难度和套题频率。</p>
        <section className="onboarding-profile-editor">
          <div className="onboarding-profile-preview"><AccountAvatar avatarUrl={avatarChoice ?? user.avatarUrl ?? defaultAccountAvatar} displayName={profileName ?? user.displayName} /><label><span>你的名字</span><input value={profileName ?? user.displayName} onChange={(event) => setProfileName(event.target.value)} maxLength={40} autoComplete="name" /></label></div>
          <AccountAvatarPicker value={avatarChoice ?? user.avatarUrl ?? defaultAccountAvatar} displayName={profileName ?? user.displayName} onChange={setAvatarChoice} />
        </section>
        <div className="onboarding-score-heading"><strong>选择目标分数</strong><small>之后仍可在“我的”页面修改</small></div>
        <div className="onboarding-band-grid" role="radiogroup" aria-label="选择 IELTS 目标分数">
          {targetOptions.map((score) => <button type="button" role="radio" aria-checked={targetBandScore === score} className={targetBandScore === score ? "is-selected" : ""} onClick={() => setTargetBandScore(score)} key={score}><strong>{score.toFixed(1)}</strong><small>{score <= 6 ? "基础巩固" : score <= 7 ? "均衡提分" : score <= 7.5 ? "高阶强化" : "高分精炼"}</small></button>)}
        </div>
        <section className="onboarding-study-period">
          <header><div><strong>设置备考周期 · 二选一</strong><small>按学习天数制定计划，或输入考试日期自动计算</small></div><div className="onboarding-period-tabs" role="tablist" aria-label="选择一种备考周期设置方式"><button type="button" role="tab" aria-selected={studyPeriodMode === "days"} className={studyPeriodMode === "days" ? "is-active" : ""} onClick={() => { setStudyPeriodMode("days"); setExamDate(""); setMessage(""); }}>按学习天数</button><button type="button" role="tab" aria-selected={studyPeriodMode === "exam-date"} className={studyPeriodMode === "exam-date" ? "is-active" : ""} onClick={() => { setStudyPeriodMode("exam-date"); setMessage(""); }}>按考试日期</button></div></header>
          {studyPeriodMode === "days" ? <div className="onboarding-days-selector"><div>{[30, 60, 90, 120, 180].map((days) => <button type="button" className={Number(studyPlanDays) === days ? "is-selected" : ""} onClick={() => setStudyPlanDays(String(days))} key={days}>{days}<small>天</small></button>)}</div><label><span>自定义</span><input type="number" min="7" max="365" value={studyPlanDays} onChange={(event) => setStudyPlanDays(event.target.value)} aria-label="自定义学习天数" /><small>天</small></label></div> : <div className="onboarding-exam-date"><label><span>IELTS 考试日期</span><input type="date" min={localDateKeyAfter(7)} max={localDateKeyAfter(365)} value={examDate} onChange={(event) => setExamDate(event.target.value)} /></label><div><span>{examDate && daysUntilDate(examDate) > 0 ? `还有 ${daysUntilDate(examDate)} 天` : "选择日期后自动计算"}</span><small>计划持续到考试前一天</small></div></div>}
        </section>
        {message && <p className="auth-message" role="alert">{message}</p>}
        <button className="onboarding-submit" disabled={targetBandScore === null || submitting} onClick={completeOnboarding}>{submitting ? "正在创建计划…" : "创建我的学习计划 →"}</button>
        <small className="onboarding-footnote">备考周期和考试日期之后仍可在“我的”页面调整。</small>
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
