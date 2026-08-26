"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
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

function aiReply(message: string) {
  const normalized = message.toLowerCase();
  if (/rent|cost|price|month/.test(normalized)) {
    return "The rent is £680 per month, including water and internet.";
  }
  if (/deposit|advance/.test(normalized)) {
    return "The deposit is one month's rent, and it is refundable.";
  }
  if (/available|move|date|when/.test(normalized)) {
    return "The room is available from the fifteenth of September.";
  }
  return "Of course. You can ask me about the rent, the deposit, or the move-in date.";
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
  onNavigate,
}: {
  percent: number;
  completedCount: number;
  progress: LearningProgress;
  onStart: () => void;
  onNavigate: (view: View) => void;
}) {
  const nextSkill = skills.find((skill) => !progress.completed[skill.id]) ?? skills[0];
  return (
    <>
      <PageHeader eyebrow="DAY 06 · 距离考试还有 86 天" title="把今天，练成一句" accent="流利的英语。" />
      <div className="dashboard-grid">
        <section className="scene-stage">
          <div className="scene-watermark" aria-hidden="true">RENT<br />LIFE</div>
          <div className="scene-heading"><span>SCENE 04 · LONDON</span><span>约 27 分钟</span></div>
          <h2>第一次<br />在英国租房</h2><p>一段真实场景，串联四项能力</p>
          <button className="voice-orb" aria-label="试听场景" onClick={() => speak("Hello, I'm calling about the room for rent.")}><i /><b>AI</b></button>
          <div className="learning-path" aria-label="今日场景学习路径">
            {skills.map((skill, index) => (
              <button
                className={`path-step ${progress.completed[skill.id] ? "is-done" : ""} ${nextSkill.id === skill.id ? "is-current" : ""}`}
                key={skill.id}
                onClick={() => onStart()}
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
  return (
    <>
      <PageHeader eyebrow="SCENE 04 · RENTING A HOME" title="第一次在英国" accent="租房。" />
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
        {activeSkill === "vocabulary" && <VocabularyPractice progress={progress} onComplete={() => onComplete("vocabulary", 6)} updateProgress={updateProgress} />}
        {activeSkill === "listening" && <ListeningPractice onComplete={(correct) => {
          updateProgress((current) => ({ ...current, listeningCorrect: correct }));
          onComplete("listening", 8);
        }} />}
        {activeSkill === "speaking" && <SpeakingPractice progress={progress} updateProgress={updateProgress} onComplete={() => onComplete("speaking", 6)} />}
        {activeSkill === "reading" && <ReadingPractice onComplete={(score) => {
          updateProgress((current) => ({ ...current, readingScore: score }));
          onComplete("reading", 7);
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
  const [messages, setMessages] = useState<Array<{ from: "ai" | "user"; text: string }>>([{ from: "ai", text: speakingScenario.opening }]);
  const [draft, setDraft] = useState("");
  const [micStatus, setMicStatus] = useState("");

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const reply = aiReply(text);
    setMessages((current) => [...current, { from: "user", text }, { from: "ai", text: reply }]);
    setDraft("");
    const nextTurns = progress.speakingTurns + 1;
    updateProgress((current) => ({ ...current, speakingTurns: current.speakingTurns + 1 }));
    speak(reply);
    if (nextTurns >= 3) onComplete();
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
        <div className="exercise-kicker"><span>AI 角色对话 · Demo</span><span>{Math.min(progress.speakingTurns, 3)} / 3 轮</span></div>
        <h2>{speakingScenario.title}</h2>
        <div className="conversation" aria-live="polite">
          {messages.map((message, index) => <div className={`message ${message.from}`} key={`${message.from}-${index}`}><span>{message.from === "ai" ? "AI 房东" : "你"}</span><p>{message.text}</p></div>)}
        </div>
        <form className="speaking-form" onSubmit={send}><button type="button" className="mic-button" onClick={startMicrophone} aria-label="开始语音输入">●</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="用英语询问房租、押金或入住日期…" aria-label="口语回答" /><button type="submit">发送</button></form>
        <div className="mic-status" aria-live="polite">{micStatus || "支持语音输入；不支持时可直接打字测试对话。"}</div>
      </div>
      <aside className="exercise-context"><span>本次任务</span><ul>{speakingScenario.goals.map((goal, index) => <li className={progress.speakingTurns > index ? "is-done" : ""} key={goal}>{progress.speakingTurns > index ? "✓" : index + 1} · {goal}</li>)}</ul><p className="demo-note">当前使用本地场景逻辑，正式 AI 接口可以替换这一层而不改变学习流程。</p></aside>
    </div>
  );
}

function ReadingPractice({ onComplete }: { onComplete: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const submit = () => {
    const nextScore = readingExercise.questions.filter((question) => answers[question.id] === question.answer).length;
    setScore(nextScore); onComplete(nextScore);
  };
  return (
    <div className="reading-layout">
      <article className="reading-passage"><div className="exercise-kicker"><span>Reading passage</span><span>约 320 词</span></div><h2>{readingExercise.title}</h2><p>{readingExercise.passage}</p></article>
      <section className="reading-questions"><div className="exercise-kicker"><span>Questions 1–3</span><span>建议 5 分钟</span></div>
        {readingExercise.questions.map((question, index) => (
          <fieldset className="reading-question" key={question.id}><legend>{index + 1}. {question.prompt}</legend>{question.options.map((option) => <label className={answers[question.id] === option ? "is-selected" : ""} key={option}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} />{option}</label>)}</fieldset>
        ))}
        {score !== null && <div className={`answer-feedback ${score === readingExercise.questions.length ? "success" : "neutral"}`}>得分 {score} / {readingExercise.questions.length}。{score < 3 ? "重新定位文中的数字、费用和限制条件。" : "信息定位准确。"}</div>}
        <button className="secondary-action reading-submit" disabled={Object.keys(answers).length < readingExercise.questions.length} onClick={submit}>提交全部答案 →</button>
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
          const word = vocabulary.find((entry) => entry.word === item);
          return <div className="review-item" key={item}><span><strong>{item}</strong><small>{word?.meaning ?? "场景词汇"}</small></span><button onClick={() => { speak(item, .75); updateProgress((current) => ({ ...current, reviewWords: current.reviewWords.filter((wordItem) => wordItem !== item), masteredWords: Array.from(new Set([...current.masteredWords, item])) })); }}>已掌握</button></div>;
        })}
      </div>
    </>
  );
}

function ProfileView({ progress, percent, onReset }: { progress: LearningProgress; percent: number; onReset: () => void }) {
  const stats = useMemo(() => [
    ["今日完成度", `${percent}%`],
    ["累计学习", `${progress.minutes} 分钟`],
    ["掌握词汇", `${progress.masteredWords.length}`],
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
