"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  dailyVocabulary,
  listeningExercise,
  readingExercise,
  skills,
  speakingScenario,
  vocabulary,
  type Skill,
} from "./learning-data";
import {
  completionPercent,
  defaultProgress,
  mergeStoredProgress,
  type LearningProgress,
} from "./learning-state";

type View = "today" | "practice" | "scene" | "review" | "profile";
type Feedback = { tone: "success" | "error" | "neutral"; text: string } | null;

const storageKey = "ielts-ai-learning-progress-v1";

function speak(text: string, rate = 0.9) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
  return true;
}

export default function IeltsApp() {
  const [view, setView] = useState<View>("today");
  const [activeSkill, setActiveSkill] = useState<Skill>("vocabulary");
  const [progress, setProgress] = useState<LearningProgress>(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        setProgress(mergeStoredProgress(stored ? JSON.parse(stored) : null));
      } catch {
        setProgress(defaultProgress);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updateProgress = (updater: (current: LearningProgress) => LearningProgress) => {
    setProgress((current) => {
      const next = updater(current);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const completeSkill = (skill: Skill, minutes: number) => {
    updateProgress((current) => ({
      ...current,
      completed: { ...current.completed, [skill]: true },
      minutes: current.completed[skill] ? current.minutes : current.minutes + minutes,
    }));
  };

  const percent = completionPercent(progress);
  const completedCount = Object.values(progress.completed).filter(Boolean).length;

  const openSkill = (skill: Skill) => {
    setActiveSkill(skill);
    setView("scene");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetProgress = () => {
    window.localStorage.removeItem(storageKey);
    setProgress(defaultProgress);
    setView("today");
  };

  return (
    <main className="app-shell" data-ready={hydrated}>
      <Sidebar view={view} progress={progress} onNavigate={setView} />
      <section className="workspace">
        {view === "today" && (
          <TodayView
            percent={percent}
            completedCount={completedCount}
            progress={progress}
            onStart={() => openSkill(skills.find((skill) => !progress.completed[skill.id])?.id ?? "vocabulary")}
            onVocabulary={() => openSkill("vocabulary")}
            onOpenSkill={openSkill}
            onNavigate={setView}
          />
        )}
        {view === "practice" && <PracticeView progress={progress} onOpen={openSkill} />}
        {view === "scene" && (
          <SceneView
            activeSkill={activeSkill}
            progress={progress}
            onSelectSkill={setActiveSkill}
            onComplete={completeSkill}
            updateProgress={updateProgress}
          />
        )}
        {view === "review" && <ReviewView progress={progress} updateProgress={updateProgress} />}
        {view === "profile" && <ProfileView progress={progress} percent={percent} onReset={resetProgress} />}
      </section>
      <MobileNavigation view={view} onNavigate={setView} />
    </main>
  );
}

function Sidebar({
  view,
  progress,
  onNavigate,
}: {
  view: View;
  progress: LearningProgress;
  onNavigate: (view: View) => void;
}) {
  const nav: Array<{ id: View; label: string }> = [
    { id: "today", label: "今天" },
    { id: "practice", label: "专项练习" },
    { id: "scene", label: "AI 场景" },
    { id: "review", label: "复习" },
    { id: "profile", label: "我的" },
  ];
  const weeklyPercent = Math.min(100, Math.round((progress.minutes / 260) * 100));
  return (
    <aside className="side-rail">
      <button className="brand-lockup" onClick={() => onNavigate("today")}>
        <span className="brand-mark">IA</span>
        <span><strong>IELTS AI</strong><small>Your daily English flow</small></span>
      </button>
      <nav className="desktop-nav" aria-label="主导航">
        {nav.map((item, index) => (
          <button className={view === item.id ? "is-active" : ""} key={item.id} onClick={() => onNavigate(item.id)}>
            <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
          </button>
        ))}
      </nav>
      <div className="weekly-rail-progress">
        <span>本周目标</span><strong>{progress.minutes} / 260 分钟</strong>
        <div className="mini-track"><i style={{ width: `${weeklyPercent}%` }} /></div>
      </div>
    </aside>
  );
}

function MobileNavigation({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  const nav: Array<{ id: View; label: string }> = [
    { id: "today", label: "今天" },
    { id: "practice", label: "专项" },
    { id: "scene", label: "AI" },
    { id: "review", label: "复习" },
    { id: "profile", label: "我的" },
  ];
  return (
    <nav className="mobile-nav" aria-label="移动端主导航">
      {nav.map((item) => (
        <button
          className={`${view === item.id ? "is-active " : ""}${item.id === "scene" ? "mobile-ai" : ""}`}
          key={item.id}
          onClick={() => onNavigate(item.id)}
        >{item.label}</button>
      ))}
    </nav>
  );
}

function PageHeader({ eyebrow, title, accent }: { eyebrow: string; title: string; accent?: string }) {
  return (
    <header className="topbar">
      <div><p>{eyebrow}</p><h1>{title}{accent && <span>{accent}</span>}</h1></div>
      <span className="profile-button" aria-label="当前用户">LI</span>
    </header>
  );
}

function TodayView({
  percent,
  completedCount,
  progress,
  onStart,
  onVocabulary,
  onOpenSkill,
  onNavigate,
}: {
  percent: number;
  completedCount: number;
  progress: LearningProgress;
  onStart: () => void;
  onVocabulary: () => void;
  onOpenSkill: (skill: Skill) => void;
  onNavigate: (view: View) => void;
}) {
  const nextSkill = skills.find((skill) => !progress.completed[skill.id]) ?? skills[0];
  return (
    <>
      <PageHeader eyebrow="DAY 06 · 距离考试还有 86 天" title="把今天，练成一句" accent="流利的英语。" />
      <div className="dashboard-grid">
        <section className="scene-stage">
          <div className="scene-watermark" aria-hidden="true">TEST<br />FLOW</div>
          <div className="scene-heading"><span>TODAY PLAN · IELTS ACADEMIC</span><span>约 46 分钟</span></div>
          <h2>今天完成<br />一轮雅思训练</h2><p>100 词 + 听力场景 + 口语 Part 3 + Academic Reading</p>
          <button className="voice-orb" aria-label="试听场景" onClick={() => speak("Hello, I'm calling about the room for rent.")}><i /><b>AI</b></button>
          <div className="learning-path" aria-label="今日场景学习路径">
            {skills.map((skill, index) => (
              <button
                className={`path-step ${progress.completed[skill.id] ? "is-done" : ""} ${nextSkill.id === skill.id ? "is-current" : ""}`}
                key={skill.id}
                onClick={() => onOpenSkill(skill.id)}
              >
                <span>{progress.completed[skill.id] ? "✓" : index + 1}</span><strong>{skill.short}</strong><small>{skill.duration}</small>
              </button>
            ))}
          </div>
          <button className="primary-action" onClick={onStart}>{completedCount === 4 ? "再练一次场景" : `继续${nextSkill.label}`}<span>→</span></button>
        </section>
        <aside className="progress-panel" aria-label="学习进度">
          <div className="progress-intro">
            <span>今日完成度</span><strong>{percent}<small>%</small></strong>
            <div className="progress-track"><i style={{ width: `${percent}%` }} /></div>
            <p>{completedCount === 4 ? "今日场景已完成，复习会让记忆更稳定。" : `已完成 ${completedCount} / 4 项，下一项是${nextSkill.label}。`}</p>
          </div>
          <button className="daily-word-row" onClick={onVocabulary}>
            <span><small>TODAY&apos;S WORDS</small><strong>{progress.dailyVocabularySeen.length}<b>/100</b></strong></span>
            <span className="daily-word-copy"><strong>每日高频词</strong><small>5 组 × 20 词 · 先眼熟，再记牢</small></span>
            <b>→</b>
          </button>
          <div className="streak-row"><span className="streak-mark">{progress.streak}</span><span><strong>连续学习 {progress.streak} 天</strong><small>本周已学习 {progress.minutes} 分钟</small></span></div>
          <button className="memory-row" onClick={() => onNavigate("review")}>
            <span><strong>记忆回流</strong><small>{progress.reviewWords.length} 个待复习词 · 来自真实错误</small></span><b>→</b>
          </button>
        </aside>
      </div>
    </>
  );
}

function PracticeView({ progress, onOpen }: { progress: LearningProgress; onOpen: (skill: Skill) => void }) {
  return (
    <>
      <PageHeader eyebrow="FOCUSED PRACTICE" title="选择一项，进行" accent="专项练习。" />
      <div className="practice-grid">
        {skills.map((skill, index) => (
          <button className="practice-card" key={skill.id} onClick={() => onOpen(skill.id)}>
            <span className="practice-number">0{index + 1}</span><span className="practice-glyph">{skill.short}</span>
            <strong>{skill.label}</strong><p>{skill.description}</p>
            <span className={progress.completed[skill.id] ? "skill-status is-complete" : "skill-status"}>
              {progress.completed[skill.id] ? "今日已完成" : skill.duration}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function SceneView({
  activeSkill,
  progress,
  onSelectSkill,
  onComplete,
  updateProgress,
}: {
  activeSkill: Skill;
  progress: LearningProgress;
  onSelectSkill: (skill: Skill) => void;
  onComplete: (skill: Skill, minutes: number) => void;
  updateProgress: (updater: (current: LearningProgress) => LearningProgress) => void;
}) {
  const headers: Record<Skill, { eyebrow: string; title: string; accent: string }> = {
    vocabulary: { eyebrow: "DAILY VOCABULARY", title: "每天 100 词，", accent: "先眼熟再记牢。" },
    listening: { eyebrow: "LISTENING · SECTION 1", title: "听清细节，", accent: "再做选择。" },
    speaking: { eyebrow: "SPEAKING · PART 3", title: "像面对考官一样，", accent: "展开观点。" },
    reading: { eyebrow: "ACADEMIC READING", title: "按真实题型，", accent: "完成定位。" },
  };
  const header = headers[activeSkill];
  return (
    <>
      <PageHeader eyebrow={header.eyebrow} title={header.title} accent={header.accent} />
      <div className="scene-tabs" role="tablist" aria-label="场景训练步骤">
        {skills.map((skill, index) => (
          <button
            role="tab"
            aria-selected={activeSkill === skill.id}
            className={activeSkill === skill.id ? "is-active" : ""}
            key={skill.id}
            onClick={() => onSelectSkill(skill.id)}
          ><span>{progress.completed[skill.id] ? "✓" : index + 1}</span>{skill.label}</button>
        ))}
      </div>
      <section className="exercise-surface">
        {activeSkill === "vocabulary" && <VocabularyPractice progress={progress} onComplete={() => onComplete("vocabulary", 15)} updateProgress={updateProgress} />}
        {activeSkill === "listening" && <ListeningPractice onComplete={(correct) => {
          updateProgress((current) => ({ ...current, listeningCorrect: correct }));
          onComplete("listening", 8);
        }} />}
        {activeSkill === "speaking" && <SpeakingPractice progress={progress} updateProgress={updateProgress} onComplete={() => onComplete("speaking", 5)} />}
        {activeSkill === "reading" && <ReadingPractice onComplete={(score) => {
          updateProgress((current) => ({ ...current, readingScore: score }));
          onComplete("reading", 18);
        }} />}
      </section>
    </>
  );
}

function VocabularyPractice({
  progress,
  onComplete,
  updateProgress,
}: {
  progress: LearningProgress;
  onComplete: () => void;
  updateProgress: (updater: (current: LearningProgress) => LearningProgress) => void;
}) {
  const [mode, setMode] = useState<"daily" | "typing">("daily");
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showHint, setShowHint] = useState(false);
  const word = vocabulary[index];

  const check = (event?: FormEvent) => {
    event?.preventDefault();
    const correct = value.trim().toLowerCase() === word.word;
    setFeedback({ tone: correct ? "success" : "error", text: correct ? `正确：${word.word} ${word.phonetic}` : `再试一次。${word.hint}` });
    updateProgress((current) => ({
      ...current,
      masteredWords: correct ? Array.from(new Set([...current.masteredWords, word.word])) : current.masteredWords,
      reviewWords: correct ? current.reviewWords.filter((item) => item !== word.word) : Array.from(new Set([...current.reviewWords, word.word])),
    }));
  };

  const next = () => {
    if (index === vocabulary.length - 1) {
      onComplete();
      setFeedback({ tone: "success", text: "本组完成。结果已同步到今日进度和复习。" });
      return;
    }
    setIndex((current) => current + 1);
    setValue(""); setFeedback(null); setShowHint(false);
  };

  return (
    <>
      <div className="vocabulary-mode-switch" role="tablist" aria-label="词汇练习模式">
        <button role="tab" aria-selected={mode === "daily"} className={mode === "daily" ? "is-active" : ""} onClick={() => setMode("daily")}>每日 100 词</button>
        <button role="tab" aria-selected={mode === "typing"} className={mode === "typing" ? "is-active" : ""} onClick={() => setMode("typing")}>场景听写</button>
      </div>
      {mode === "daily" ? (
        <DailyVocabularySprint progress={progress} onComplete={onComplete} updateProgress={updateProgress} />
      ) : (
        <div className="exercise-layout">
      <div className="exercise-main typing-practice">
        <div className="exercise-kicker"><span>听音拼写</span><span>{index + 1} / {vocabulary.length}</span></div>
        <h2>听发音，输入对应的英文单词</h2><p>电脑端直接打字并按 Enter；手机端也可以使用键盘完成。</p>
        <button className="audio-control" onClick={() => speak(word.word, 0.72)}><span>▶</span>播放英式发音</button>
        <div className="word-meaning">{word.meaning}</div>
        <form className="typing-form" onSubmit={check}>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                check();
              }
            }}
            spellCheck={false}
            placeholder="输入英文单词…"
            aria-label="输入英文单词"
          />
          <button type="submit">检查</button>
        </form>
        <div className={`answer-feedback ${feedback?.tone ?? ""}`} aria-live="polite">{feedback?.text ?? (showHint ? word.hint : "先听发音，尽量不看提示。")}</div>
        <div className="exercise-actions"><button className="text-action" onClick={() => setShowHint(true)}>显示提示</button><button className="secondary-action" onClick={next}>{index === vocabulary.length - 1 ? "完成本组" : "下一个"} →</button></div>
      </div>
      <aside className="exercise-context">
        <span>场景例句</span><p>{word.example}</p><button onClick={() => speak(word.example)}>播放例句</button>
        <div className="context-stat"><strong>{progress.masteredWords.length}</strong><span>累计掌握词汇</span></div>
      </aside>
        </div>
      )}
    </>
  );
}

function DailyVocabularySprint({
  progress,
  onComplete,
  updateProgress,
}: {
  progress: LearningProgress;
  onComplete: () => void;
  updateProgress: (updater: (current: LearningProgress) => LearningProgress) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const total = dailyVocabulary.length;
  const seenCount = Math.min(progress.dailyVocabularySeen.length, total);
  const finished = seenCount >= total;
  const word = dailyVocabulary[Math.min(seenCount, total - 1)];

  const markWord = (known: boolean) => {
    const isLastWord = seenCount === total - 1;
    updateProgress((current) => ({
      ...current,
      dailyVocabularySeen: Array.from(new Set([...current.dailyVocabularySeen, word.word])),
      dailyVocabularyKnown: known
        ? Array.from(new Set([...current.dailyVocabularyKnown, word.word]))
        : current.dailyVocabularyKnown.filter((item) => item !== word.word),
      reviewWords: known
        ? current.reviewWords.filter((item) => item !== word.word)
        : Array.from(new Set([...current.reviewWords, word.word])),
    }));
    setRevealed(false);
    if (isLastWord) onComplete();
  };

  if (finished) {
    return (
      <div className="daily-complete">
        <span className="daily-complete-mark">100</span>
        <div><p>DAILY VOCABULARY COMPLETE</p><h2>今天的 100 个词，已经全部眼熟。</h2>
          <span>熟悉 {progress.dailyVocabularyKnown.length} 个 · 待强化 {total - progress.dailyVocabularyKnown.length} 个</span>
        </div>
      </div>
    );
  }

  const round = Math.floor(seenCount / 20) + 1;
  return (
    <div className="exercise-layout daily-vocabulary-layout">
      <div className="exercise-main daily-vocabulary-main">
        <div className="exercise-kicker"><span>每日 100 词 · 第 {round} 组</span><span>{seenCount + 1} / {total}</span></div>
        <div className="word-rounds" aria-label={`已浏览 ${seenCount} / ${total} 个词`}>
          {Array.from({ length: 5 }, (_, index) => {
            const completed = Math.max(0, Math.min(20, seenCount - index * 20));
            return <span key={index}><i style={{ width: `${completed * 5}%` }} /></span>;
          })}
        </div>
        <section className={`daily-word-card ${revealed ? "is-revealed" : ""}`}>
          <div><span>{word.category}</span><button onClick={() => speak(word.word, .76)} aria-label={`播放 ${word.word} 的发音`}>▶ 发音</button></div>
          <h2>{word.word}</h2>
          <p className="word-collocation">{word.collocation}</p>
          <div className="daily-word-answer" aria-live="polite">
            {revealed ? <strong>{word.meaning}</strong> : <button onClick={() => setRevealed(true)}>点击查看中文含义</button>}
          </div>
        </section>
        {!revealed ? (
          <button className="reveal-action" onClick={() => setRevealed(true)}>翻开答案</button>
        ) : (
          <div className="word-judgement">
            <button onClick={() => markWord(false)}><span>↺</span>还不熟</button>
            <button onClick={() => markWord(true)}><span>✓</span>认识</button>
          </div>
        )}
      </div>
      <aside className="exercise-context daily-vocabulary-context">
        <span>今天的目标</span>
        <strong>{seenCount}<small>/100</small></strong>
        <p>先完成快速辨认。标记“还不熟”的词会自动进入复习，不要求第一次就完全拼写正确。</p>
        <div><b>{progress.dailyVocabularyKnown.length}</b><small>已经认识</small></div>
        <div><b>{progress.reviewWords.length}</b><small>等待强化</small></div>
      </aside>
    </div>
  );
}

function ListeningPractice({ onComplete }: { onComplete: (correct: boolean) => void }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const correct = answer === listeningExercise.answer;
  return (
    <div className="exercise-layout">
      <div className="exercise-main">
        <div className="exercise-kicker"><span>Section 1 · 单选题</span><span>01 / 01</span></div>
        <h2>{listeningExercise.title}</h2><p>先完整听一遍，再选择答案。你可以重复播放。</p>
        <button className="listening-player" onClick={() => speak(listeningExercise.script, 0.84)}><span>▶</span><i /><strong>播放录音</strong><small>约 24 秒</small></button>
        <fieldset className="question-block">
          <legend>{listeningExercise.question}</legend>
          {listeningExercise.options.map((option) => (
            <label className={answer === option ? "is-selected" : ""} key={option}><input type="radio" name="listening" value={option} checked={answer === option} onChange={() => { setAnswer(option); setChecked(false); }} /><span>{option}</span></label>
          ))}
        </fieldset>
        {checked && <div className={`answer-feedback ${correct ? "success" : "error"}`}>{correct ? "回答正确。" : `正确答案是“${listeningExercise.answer}”。`} {listeningExercise.explanation}</div>}
        <div className="exercise-actions"><button className="text-action" onClick={() => setShowTranscript((current) => !current)}>{showTranscript ? "隐藏原文" : "查看原文"}</button><button className="secondary-action" disabled={!answer} onClick={() => { setChecked(true); onComplete(correct); }}>提交答案 →</button></div>
      </div>
      <aside className="exercise-context transcript-panel"><span>听力原文</span><p>{showTranscript ? listeningExercise.script : "提交前可以选择不看原文，模拟真实考试。"}</p></aside>
    </div>
  );
}

function SpeakingPractice({
  progress,
  updateProgress,
  onComplete,
}: {
  progress: LearningProgress;
  updateProgress: (updater: (current: LearningProgress) => LearningProgress) => void;
  onComplete: () => void;
}) {
  const questionIndex = Math.min(progress.speakingPart3Turns, speakingScenario.questions.length - 1);
  const [messages, setMessages] = useState<Array<{ from: "ai" | "user"; text: string }>>([
    { from: "ai", text: speakingScenario.opening },
    { from: "ai", text: speakingScenario.questions[questionIndex] },
  ]);
  const [draft, setDraft] = useState("");
  const [micStatus, setMicStatus] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState("");

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const hasDevelopment = /because|since|for example|for instance|however|although|whereas|therefore|so that/i.test(text);
    if (wordCount < 10) {
      const reply = "Could you explain that in a little more detail?";
      setMessages((current) => [...current, { from: "user", text }, { from: "ai", text: reply }]);
      setDraft("");
      setAnswerFeedback("回答偏短：Part 3 需要观点 + 原因，尽量再展开 2–3 句。");
      speak(reply);
      return;
    }
    const nextTurns = progress.speakingPart3Turns + 1;
    const finished = nextTurns >= speakingScenario.questions.length;
    const reply = finished
      ? "Thank you. That is the end of the speaking test."
      : speakingScenario.questions[nextTurns];
    setMessages((current) => [...current, { from: "user", text }, { from: "ai", text: reply }]);
    setDraft("");
    setAnswerFeedback(hasDevelopment
      ? `本轮完成：${wordCount} 词，并使用了展开信号。继续保持观点—原因—例子的结构。`
      : `本轮完成：${wordCount} 词。下一题可加入 because、for example 或 however，让论证更清楚。`);
    updateProgress((current) => ({ ...current, speakingPart3Turns: current.speakingPart3Turns + 1 }));
    speak(reply);
    if (finished) onComplete();
  };

  const startMicrophone = () => {
    type RecognitionEvent = { results: { 0: { 0: { transcript: string } } } };
    type Recognition = { lang: string; interimResults: boolean; start: () => void; onresult: ((event: RecognitionEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
    type RecognitionConstructor = new () => Recognition;
    const speechWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) { setMicStatus("当前浏览器不支持语音识别，请使用文字输入。建议在 Chrome 中测试。"); return; }
    const recognition = new Constructor();
    recognition.lang = "en-GB"; recognition.interimResults = false;
    recognition.onresult = (event) => { setDraft(event.results[0][0].transcript); setMicStatus("已识别，请确认后发送。"); };
    recognition.onerror = () => setMicStatus("没有识别成功，请重试或使用文字输入。");
    recognition.onend = () => setMicStatus((current) => current || "录音已结束。");
    setMicStatus("正在听，请用英语说话…"); recognition.start();
  };

  return (
    <div className="exercise-layout speaking-layout">
      <div className="exercise-main conversation-panel">
        <div className="exercise-kicker"><span>{speakingScenario.part}</span><span>{Math.min(progress.speakingPart3Turns, speakingScenario.questions.length)} / {speakingScenario.questions.length} 问</span></div>
        <h2>{speakingScenario.title}</h2>
        <div className="conversation" aria-live="polite">
          {messages.map((message, index) => <div className={`message ${message.from}`} key={`${message.from}-${index}`}><span>{message.from === "ai" ? "考官" : "你"}</span><p>{message.text}</p></div>)}
        </div>
        <form className="speaking-form" onSubmit={send}><button type="button" className="mic-button" onClick={startMicrophone} aria-label="开始语音输入">●</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="用英语回答考官，尽量说明原因并举例…" aria-label="口语回答" /><button type="submit">回答</button></form>
        <div className="mic-status" aria-live="polite">{micStatus || "支持语音输入；也可以打字模拟回答。"}</div>
        {answerFeedback && <div className="speaking-feedback" aria-live="polite">{answerFeedback}</div>}
      </div>
      <aside className="exercise-context speaking-exam-card"><span>真实考试结构</span><strong>{speakingScenario.duration}</strong><p>Part 3 与 Part 2 主题相关，但问题会转向更普遍、抽象的社会讨论。考官负责提问，不扮演场景角色。</p><ul>{speakingScenario.goals.map((goal, index) => <li className={progress.speakingPart3Turns > index ? "is-done" : ""} key={goal}>{progress.speakingPart3Turns > index ? "✓" : index + 1} · {goal}</li>)}</ul><p className="demo-note">当前反馈检查回答长度和展开信号，不冒充官方 IELTS 分数。</p></aside>
    </div>
  );
}

function ReadingPractice({ onComplete }: { onComplete: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const answerKey = useMemo(() => Object.fromEntries([
    ...readingExercise.matchingHeadings,
    ...readingExercise.matchingInformation,
    ...readingExercise.multipleChoice,
    ...readingExercise.trueFalseNotGiven,
    ...readingExercise.summary.questions,
  ].map((question) => [question.id, question.answer])), []);
  const totalQuestions = Object.keys(answerKey).length;
  const answeredCount = Object.keys(answers).filter((id) => answers[id]).length;

  const setAnswer = (id: string, answer: string) => {
    setAnswers((current) => ({ ...current, [id]: answer }));
    setScore(null);
  };

  const submit = () => {
    const nextScore = Object.entries(answerKey).filter(([id, answer]) => answers[id] === answer).length;
    setScore(nextScore); onComplete(nextScore);
  };
  const answerClass = (id: string) => score === null ? "" : answers[id] === answerKey[id] ? "is-correct" : "is-incorrect";

  return (
    <div className="reading-layout">
      <article className="reading-passage">
        <div className="exercise-kicker"><span>Academic Reading passage</span><span>约 500 词</span></div>
        <h2>{readingExercise.title}</h2><span className="reading-subtitle">{readingExercise.subtitle}</span>
        <div className="reading-paragraphs">
          {readingExercise.paragraphs.map((paragraph) => <section key={paragraph.label}><strong>{paragraph.label}</strong><p>{paragraph.text}</p></section>)}
        </div>
      </article>
      <section className="reading-questions">
        <div className="exercise-kicker"><span>Questions 1–{totalQuestions}</span><span>建议 18 分钟</span></div>
        <div className="reading-progress-line"><i style={{ width: `${Math.round(answeredCount / totalQuestions * 100)}%` }} /><span>{answeredCount}/{totalQuestions}</span></div>

        <section className="reading-question-group">
          <div className="question-type"><span>Questions 1–4</span><strong>Matching Headings</strong><p>Choose the correct heading for paragraphs A–D. There are more headings than you need.</p></div>
          <ol className="heading-bank">{readingExercise.headings.map((heading) => <li key={heading.id}><b>{heading.id}</b>{heading.text}</li>)}</ol>
          {readingExercise.matchingHeadings.map((question, index) => (
            <label className={`matching-row ${answerClass(question.id)}`} key={question.id}>
              <span>{index + 1}. Paragraph {question.paragraph}</span>
              <select value={answers[question.id] ?? ""} onChange={(event) => setAnswer(question.id, event.target.value)} aria-label={`Question ${index + 1}, paragraph ${question.paragraph}`}>
                <option value="">Select</option>
                {readingExercise.headings.map((heading) => <option value={heading.id} key={heading.id}>{heading.id}</option>)}
              </select>
            </label>
          ))}
        </section>

        <section className="reading-question-group">
          <div className="question-type"><span>Questions 5–6</span><strong>Matching Information</strong><p>Which paragraph contains the following information? You may use any letter more than once.</p></div>
          {readingExercise.matchingInformation.map((question, index) => (
            <label className={`matching-row information-row ${answerClass(question.id)}`} key={question.id}>
              <span>{index + 5}. {question.prompt}</span>
              <select value={answers[question.id] ?? ""} onChange={(event) => setAnswer(question.id, event.target.value)} aria-label={`Question ${index + 5}`}>
                <option value="">Select</option>
                {readingExercise.paragraphs.map((paragraph) => <option value={paragraph.label} key={paragraph.label}>{paragraph.label}</option>)}
              </select>
            </label>
          ))}
        </section>

        <section className="reading-question-group">
          <div className="question-type"><span>Question 7</span><strong>Multiple Choice</strong><p>Choose the correct letter, A, B, C or D.</p></div>
          {readingExercise.multipleChoice.map((question) => <fieldset className={`reading-question ${answerClass(question.id)}`} key={question.id}><legend>7. {question.prompt}</legend>{question.options.map((option, index) => <label className={answers[question.id] === option ? "is-selected" : ""} key={option}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswer(question.id, option)} /><b>{String.fromCharCode(65 + index)}</b>{option}</label>)}</fieldset>)}
        </section>

        <section className="reading-question-group">
          <div className="question-type"><span>Questions 8–9</span><strong>True / False / Not Given</strong><p>Do the statements agree with the information in the passage?</p></div>
          {readingExercise.trueFalseNotGiven.map((question, index) => <fieldset className={`reading-question ${answerClass(question.id)}`} key={question.id}><legend>{index + 8}. {question.prompt}</legend>{question.options.map((option) => <label className={answers[question.id] === option ? "is-selected" : ""} key={option}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswer(question.id, option)} />{option}</label>)}</fieldset>)}
        </section>

        <section className="reading-question-group">
          <div className="question-type"><span>Questions 10–11</span><strong>Summary Completion</strong><p>{readingExercise.summary.instruction}</p></div>
          <div className="summary-word-bank">{readingExercise.summary.wordBank.map((word) => <span key={word}>{word}</span>)}</div>
          <p className="summary-question">{readingExercise.summary.textBeforeFirstGap}
            <select className={answerClass("s1")} value={answers.s1 ?? ""} onChange={(event) => setAnswer("s1", event.target.value)} aria-label="Question 10">
              <option value="">10</option>{readingExercise.summary.wordBank.map((word) => <option value={word} key={word}>{word}</option>)}
            </select>
            {readingExercise.summary.textBetweenGaps}
            <select className={answerClass("s2")} value={answers.s2 ?? ""} onChange={(event) => setAnswer("s2", event.target.value)} aria-label="Question 11">
              <option value="">11</option>{readingExercise.summary.wordBank.map((word) => <option value={word} key={word}>{word}</option>)}
            </select>
            {readingExercise.summary.textAfterSecondGap}
          </p>
        </section>

        {score !== null && <div className={`answer-feedback ${score >= 9 ? "success" : "neutral"}`}>得分 {score} / {totalQuestions}。{score < 9 ? "检查段落主旨与细节定位；红色项目可以重新选择后再提交。" : "主旨和细节定位都很准确。"}</div>}
        <button className="secondary-action reading-submit" disabled={answeredCount < totalQuestions} onClick={submit}>提交 {totalQuestions} 道答案 →</button>
      </section>
    </div>
  );
}

function ReviewView({ progress, updateProgress }: { progress: LearningProgress; updateProgress: (updater: (current: LearningProgress) => LearningProgress) => void }) {
  const reviewItems = progress.reviewWords;
  return (
    <>
      <PageHeader eyebrow="MEMORY LOOP" title="把错误，变成" accent="长期记忆。" />
      <section className="review-hero"><div><span>今日待复习</span><strong>{reviewItems.length}</strong><p>这里只出现你在真实练习中答错或标记过的内容。</p></div><span className="review-loop" aria-hidden="true">↺</span></section>
      <div className="review-list">
        {reviewItems.length === 0 ? <div className="empty-state"><strong>暂时没有待复习内容</strong><p>去完成一次词汇练习，错误会自动回到这里。</p></div> : reviewItems.map((item) => {
          const word = vocabulary.find((entry) => entry.word === item) ?? dailyVocabulary.find((entry) => entry.word === item);
          return <div className="review-item" key={item}><span><strong>{item}</strong><small>{word?.meaning ?? "场景词汇"}</small></span><button onClick={() => { speak(item, .75); updateProgress((current) => ({ ...current, reviewWords: current.reviewWords.filter((wordItem) => wordItem !== item), masteredWords: Array.from(new Set([...current.masteredWords, item])) })); }}>已掌握</button></div>;
        })}
      </div>
    </>
  );
}

function ProfileView({ progress, percent, onReset }: { progress: LearningProgress; percent: number; onReset: () => void }) {
  const stats = useMemo(() => [
    ["今日完成度", `${percent}%`],
    ["今日词汇", `${progress.dailyVocabularySeen.length} / 100`],
    ["累计学习", `${progress.minutes} 分钟`],
    ["待强化词汇", `${progress.reviewWords.length}`],
    ["连续学习", `${progress.streak} 天`],
  ], [percent, progress]);
  return (
    <>
      <PageHeader eyebrow="LEARNING PROFILE" title="你的目标是" accent="雅思 7.0。" />
      <div className="profile-grid">{stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <section className="profile-settings"><div><strong>本机测试数据</strong><p>当前版本把进度保存在这个浏览器中。登录和跨设备云同步会在后续接入。</p></div><button onClick={onReset}>重置学习进度</button></section>
    </>
  );
}
