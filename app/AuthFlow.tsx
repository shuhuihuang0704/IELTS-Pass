"use client";

import { useMemo, useState } from "react";
import type { AuthUser } from "./auth-server";
import { AccountAvatar, AccountAvatarPicker, defaultAccountAvatar } from "./AccountAvatar";

type StudyPeriodMode = "days" | "exam-date";

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
  onCompleteOnboarding,
}: {
  user: AuthUser | null;
  onCompleteOnboarding: (targetBandScore: number, displayName: string, avatarUrl: string, studyPlanDays: number, examDate: string | null) => Promise<void>;
}) {
  const [targetBandScore, setTargetBandScore] = useState<number | null>(user?.targetBandScore ?? null);
  const [profileName, setProfileName] = useState(user?.displayName ?? "");
  const [avatarChoice, setAvatarChoice] = useState(user?.avatarUrl ?? defaultAccountAvatar);
  const [studyPeriodMode, setStudyPeriodMode] = useState<StudyPeriodMode>(user?.examDate ? "exam-date" : "days");
  const [studyPlanDays, setStudyPlanDays] = useState(String(user?.studyPlanDays ?? 90));
  const [examDate, setExamDate] = useState(user?.examDate ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const targetOptions = useMemo(() => [5.5, 6, 6.5, 7, 7.5, 8, 8.5], []);

  const completeOnboarding = async () => {
    if (targetBandScore === null) return;
    const nextDisplayName = profileName.trim();
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
      await onCompleteOnboarding(targetBandScore, nextDisplayName, avatarChoice, resolvedPlanDays, resolvedExamDate);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "计划创建失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <header className="onboarding-brand"><span>IP</span><strong>IELTS PASS</strong></header>
        <div className="onboarding-progress"><i /></div>
        <span className="onboarding-kicker">CREATE YOUR STUDY PROFILE</span>
        <h1>设置你的头像、名字与目标。</h1>
        <p>无需注册或登录。完成设置后即可开始学习，资料与进度会保存在当前设备。</p>
        <section className="onboarding-profile-editor">
          <div className="onboarding-profile-preview"><AccountAvatar avatarUrl={avatarChoice} displayName={profileName || "学习者"} /><label><span>你的名字</span><input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="怎么称呼你" maxLength={40} autoComplete="name" /></label></div>
          <AccountAvatarPicker value={avatarChoice} displayName={profileName || "学习者"} onChange={setAvatarChoice} />
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
        <small className="onboarding-footnote">头像、名字、目标分数和备考周期之后仍可在“我的”页面调整。</small>
      </section>
    </main>
  );
}
