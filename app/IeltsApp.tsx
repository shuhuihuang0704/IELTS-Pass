"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  connectedSpeechPhrases,
  dailyVocabulary,
  getDailyVocabulary,
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
  localDayKey,
  localWeekKey,
  mergeStoredProgress,
  rateReviewWord,
  reviewIntervals,
  scheduleWordForReview,
  type LearningProgress,
  type NotebookEntry,
  type WordRating,
} from "./learning-state";

type View = "today" | "practice" | "official-test" | "scene" | "review" | "profile";
type Feedback = { tone: "success" | "error" | "neutral"; text: string } | null;
type NotebookDraft = Omit<NotebookEntry, "createdAt" | "note">;

const storageKey = "ielts-ai-learning-progress-v1";

function toggleNotebookEntry(progress: LearningProgress, draft: NotebookDraft): LearningProgress {
  const existing = progress.notebook.find((entry) => entry.id === draft.id);
  if (existing) return { ...progress, notebook: progress.notebook.filter((entry) => entry.id !== draft.id) };
  return {
    ...progress,
    notebook: [{ ...draft, note: "", createdAt: new Date().toISOString() }, ...progress.notebook],
  };
}

type OfficialTestSession = {
  id: string;
  isoDay: number;
  dayLabel: string;
  time: string;
  title: string;
  duration: string;
  durationMinutes: number;
  source: string;
  setCode: string;
  description: string;
  materials: OfficialTestMaterial[];
};

type OfficialAudioTrack = { label: string; url: string };
type OfficialAnswer = {
  number: string;
  accepted: string[];
  displayAnswer: string;
  choices?: string[];
  group?: string;
};
type OfficialTaskSegment = {
  id: string;
  label: string;
  questionLabel: string;
  questionPage: number;
  answerPage?: number;
  transcriptPage?: number;
  audioTrackIndex?: number;
  answerLabel?: string;
  minimumWords?: number;
  answers?: OfficialAnswer[];
};
type OfficialTestMaterial = {
  id: string;
  label: string;
  pdfUrl: string;
  passagePdfUrl?: string;
  answerPdfUrl?: string;
  tasks: OfficialTaskSegment[];
  audioTracks?: OfficialAudioTrack[];
};

const listeningMaterial: OfficialTestMaterial = {
  id: "listening",
  label: "Listening",
  pdfUrl: "https://ielts.org/cdn/ielts-sample-tests/ielts-listening-sample-tasks-2023.pdf",
  audioTracks: [
    { label: "Task 1 · Form Completion", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-listening/ielts-listening-sample-task-1-form-completion.mp3" },
    { label: "Task 2 · Multiple Choice", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-listening/ielts-listening-sample-task-2-multiple-choice.mp3" },
    { label: "Task 3 · Short-answer Questions", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-listening/ielts-listening-sample-task-3-short-answer-questions.mp3" },
    { label: "Task 4 · Sentence Completion", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-listening/ielts-listening-sample-task-4-sentence-completion.mp3" },
    { label: "Task 5 · Matching 1", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-listening/ielts-listening-sample-task-5-matching.mp3" },
    { label: "Task 6 · Matching 2", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-listening/ielts-listening-sample-task-6-matching.mp3" },
    { label: "Task 7 · Map Labelling", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-listening/ielts-listening-sample-task-7-plan-map-diagram-labelling.mp3" },
    { label: "Task 8 · Note Completion", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-listening/ielts-listening-sample-task-8-note-completion.mp3" },
  ],
  tasks: [
    { id: "form-completion", label: "Form Completion", questionLabel: "Questions 1–8", questionPage: 3, transcriptPage: 4, answerPage: 7, audioTrackIndex: 0, answers: [
      { number: "1", accepted: ["Mkere"], displayAnswer: "Mkere" },
      { number: "2", accepted: ["Westall"], displayAnswer: "Westall" },
      { number: "3", accepted: ["BS8 9PU"], displayAnswer: "BS8 9PU" },
      { number: "4", accepted: ["0.75 m", "0.75 metre", "0.75 metres", "0.75 meter", "0.75 meters", "three quarters of a metre", "three quarters of a meter", "75 cm", "75 cms"], displayAnswer: "0.75 m / 75 cm" },
      { number: "5", accepted: ["0.5 m", "0.5 metre", "0.5 metres", "0.5 meter", "0.5 meters", "half a metre", "half a meter", "50 cm", "50 cms"], displayAnswer: "0.5 m / 50 cm" },
      { number: "6", accepted: ["books", "toys"], displayAnswer: "books / toys（顺序不限）", group: "6-7" },
      { number: "7", accepted: ["books", "toys"], displayAnswer: "books / toys（顺序不限）", group: "6-7" },
      { number: "8", accepted: ["1,700", "1700"], displayAnswer: "1,700" },
    ] },
    { id: "multiple-choice", label: "Multiple Choice", questionLabel: "Questions 9–10", questionPage: 8, transcriptPage: 9, answerPage: 10, audioTrackIndex: 1, answers: [
      { number: "9", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C"] },
      { number: "10", accepted: ["A"], displayAnswer: "A", choices: ["A", "B", "C"] },
    ] },
    { id: "short-answer", label: "Short-answer Questions", questionLabel: "Questions 11–16", questionPage: 11, transcriptPage: 12, answerPage: 13, audioTrackIndex: 2, answers: [
      { number: "11", accepted: ["language", "customs"], displayAnswer: "language / customs（顺序不限）", group: "11-12" },
      { number: "12", accepted: ["language", "customs"], displayAnswer: "language / customs（顺序不限）", group: "11-12" },
      { number: "13", accepted: ["music", "music groups", "local history", "local history groups"], displayAnswer: "music (groups) / local history (groups)（顺序不限）", group: "13-14" },
      { number: "14", accepted: ["music", "music groups", "local history", "local history groups"], displayAnswer: "music (groups) / local history (groups)（顺序不限）", group: "13-14" },
      { number: "15", accepted: ["library", "libraries", "public library", "public libraries", "town hall"], displayAnswer: "(public) library / town hall（顺序不限）", group: "15-16" },
      { number: "16", accepted: ["library", "libraries", "public library", "public libraries", "town hall"], displayAnswer: "(public) library / town hall（顺序不限）", group: "15-16" },
    ] },
    { id: "sentence-completion", label: "Sentence Completion", questionLabel: "Questions 27–30", questionPage: 14, transcriptPage: 15, answerPage: 17, audioTrackIndex: 3, answers: [
      { number: "27", accepted: ["motivation"], displayAnswer: "motivation" },
      { number: "28", accepted: ["time management", "time-management"], displayAnswer: "time-management" },
      { number: "29", accepted: ["modules"], displayAnswer: "modules" },
      { number: "30", accepted: ["summer school", "summer schools"], displayAnswer: "summer school(s)" },
    ] },
    { id: "matching-one", label: "Matching 1", questionLabel: "Questions 21–25", questionPage: 18, transcriptPage: 19, answerPage: 21, audioTrackIndex: 4, answers: [
      { number: "21", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C"] }, { number: "22", accepted: ["A"], displayAnswer: "A", choices: ["A", "B", "C"] }, { number: "23", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C"] }, { number: "24", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C"] }, { number: "25", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C"] },
    ] },
    { id: "matching-two", label: "Matching 2", questionLabel: "Questions 1–4", questionPage: 22, transcriptPage: 23, answerPage: 25, audioTrackIndex: 5, answers: [
      { number: "1", accepted: ["E"], displayAnswer: "E", choices: ["A", "B", "C", "D", "E"] }, { number: "2", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C", "D", "E"] }, { number: "3", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C", "D", "E"] }, { number: "4", accepted: ["A"], displayAnswer: "A", choices: ["A", "B", "C", "D", "E"] },
    ] },
    { id: "map-labelling", label: "Map Labelling", questionLabel: "Questions 11–15", questionPage: 26, transcriptPage: 27, answerPage: 28, audioTrackIndex: 6, answers: [
      { number: "11", accepted: ["H"], displayAnswer: "H", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] }, { number: "12", accepted: ["G"], displayAnswer: "G", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] }, { number: "13", accepted: ["D"], displayAnswer: "D", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] }, { number: "14", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] }, { number: "15", accepted: ["F"], displayAnswer: "F", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
    ] },
    { id: "note-completion", label: "Note Completion", questionLabel: "Questions 11–20", questionPage: 29, transcriptPage: 31, answerPage: 33, audioTrackIndex: 7, answers: [
      { number: "11", accepted: ["classical music", "classical music concerts", "music concerts", "concerts"], displayAnswer: "classical music (concerts)" }, { number: "12", accepted: ["bookshop", "bookstore", "a bookshop", "a bookstore"], displayAnswer: "(a) bookshop / bookstore" }, { number: "13", accepted: ["planned"], displayAnswer: "planned" }, { number: "14", accepted: ["1983", "1980s", "the 1980s"], displayAnswer: "1983 / (the) 1980s" }, { number: "15", accepted: ["city council", "the city council"], displayAnswer: "(the) City Council" }, { number: "16", accepted: ["363"], displayAnswer: "363" }, { number: "17", accepted: ["garden hall", "the garden hall"], displayAnswer: "(the) Garden Hall" }, { number: "18", accepted: ["three lives"], displayAnswer: "Three Lives" }, { number: "19", accepted: ["£4.50", "4.50"], displayAnswer: "£4.50" }, { number: "20", accepted: ["faces of china"], displayAnswer: "Faces of China" },
    ] },
  ],
};
const readingMaterial: OfficialTestMaterial = {
  id: "reading-full-40",
  label: "Reading",
  pdfUrl: "https://cdn.ielts.org/ielts-access-arrangements-sample-tests/ielts-modified-large-print/ielts-academic-reading-access-arrangement-modified-large-print-question-booklet.pdf",
  passagePdfUrl: "https://ielts.org/cdn/ielts-access-arrangements-sample-tests/ielts-modified-large-print/ielts-academic-reading-access-arrangement-modified-large-print-text-booklet.pdf",
  answerPdfUrl: "https://ielts.org/cdn/ielts-access-arrangements-sample-tests/ielts-modified-large-print/ielts-academic-reading-access-arrangement-modified-large-print-sample-test-answer-key.pdf",
  tasks: [
    { id: "full-reading-test", label: "完整 Academic Reading Sample Test", questionLabel: "Questions 1–40 · 3 Passages", questionPage: 4, answerPage: 1, answers: [
      { number: "1", accepted: ["FALSE"], displayAnswer: "FALSE", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "2", accepted: ["TRUE"], displayAnswer: "TRUE", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "3", accepted: ["NOT GIVEN"], displayAnswer: "NOT GIVEN", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "4", accepted: ["TRUE"], displayAnswer: "TRUE", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "5", accepted: ["TRUE"], displayAnswer: "TRUE", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "6", accepted: ["FALSE"], displayAnswer: "FALSE", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "7", accepted: ["light"], displayAnswer: "light" },
      { number: "8", accepted: ["shells"], displayAnswer: "shells" },
      { number: "9", accepted: ["mineralisation", "mineralization"], displayAnswer: "mineralisation / mineralization" },
      { number: "10", accepted: ["histidine"], displayAnswer: "histidine" },
      { number: "11", accepted: ["gills"], displayAnswer: "gills" },
      { number: "12", accepted: ["fangs"], displayAnswer: "fangs" },
      { number: "13", accepted: ["aircraft"], displayAnswer: "aircraft" },
      { number: "14", accepted: ["YES"], displayAnswer: "YES", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "15", accepted: ["NOT GIVEN"], displayAnswer: "NOT GIVEN", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "16", accepted: ["NO"], displayAnswer: "NO", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "17", accepted: ["NOT GIVEN"], displayAnswer: "NOT GIVEN", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "18", accepted: ["NO"], displayAnswer: "NO", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "19", accepted: ["D", "E"], displayAnswer: "D / E（顺序不限）", choices: ["A", "B", "C", "D", "E"], group: "19-20" },
      { number: "20", accepted: ["D", "E"], displayAnswer: "D / E（顺序不限）", choices: ["A", "B", "C", "D", "E"], group: "19-20" },
      { number: "21", accepted: ["C", "D"], displayAnswer: "C / D（顺序不限）", choices: ["A", "B", "C", "D", "E"], group: "21-22" },
      { number: "22", accepted: ["C", "D"], displayAnswer: "C / D（顺序不限）", choices: ["A", "B", "C", "D", "E"], group: "21-22" },
      { number: "23", accepted: ["oral histories"], displayAnswer: "oral histories" },
      { number: "24", accepted: ["humanistic study", "historical discipline"], displayAnswer: "humanistic study / historical discipline（顺序不限）", group: "24-25" },
      { number: "25", accepted: ["humanistic study", "historical discipline"], displayAnswer: "humanistic study / historical discipline（顺序不限）", group: "24-25" },
      { number: "26", accepted: ["scientist"], displayAnswer: "scientist" },
      { number: "27", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C", "D"] },
      { number: "28", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C", "D"] },
      { number: "29", accepted: ["A"], displayAnswer: "A", choices: ["A", "B", "C", "D"] },
      { number: "30", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C", "D"] },
      { number: "31", accepted: ["A"], displayAnswer: "A", choices: ["A", "B", "C", "D"] },
      { number: "32", accepted: ["D"], displayAnswer: "D", choices: ["A", "B", "C", "D"] },
      { number: "33", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C", "D"] },
      { number: "34", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
      { number: "35", accepted: ["G"], displayAnswer: "G", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
      { number: "36", accepted: ["E"], displayAnswer: "E", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
      { number: "37", accepted: ["F"], displayAnswer: "F", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
      { number: "38", accepted: ["B", "C"], displayAnswer: "B / C（顺序不限）", choices: ["A", "B", "C", "D", "E"], group: "38-39" },
      { number: "39", accepted: ["B", "C"], displayAnswer: "B / C（顺序不限）", choices: ["A", "B", "C", "D", "E"], group: "38-39" },
      { number: "40", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C", "D"] },
    ] },
  ],
};
const writingMaterial: OfficialTestMaterial = {
  id: "writing",
  label: "Academic Writing · Task 1 + Task 2",
  pdfUrl: "https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf",
  tasks: [
    { id: "task-1a", label: "Writing Task 1", questionLabel: "Task 1 · Visual information", questionPage: 3, answerPage: 9, answerLabel: "查看范文与考官评语", minimumWords: 150 },
    { id: "task-2a", label: "Writing Task 2", questionLabel: "Task 2 · Essay", questionPage: 6, answerPage: 18, answerLabel: "查看范文与考官评语", minimumWords: 250 },
  ],
};
const speakingMaterial: OfficialTestMaterial = {
  id: "speaking",
  label: "Speaking",
  pdfUrl: "https://ielts.org/cdn/ielts-sample-tests/ielts-speaking-sample-tasks-2023.pdf",
  audioTracks: [
    { label: "Part 1 · Introduction and interview", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-speaking/ielts-speaking-part-1-sample-recording.mp3" },
    { label: "Part 2 · Long turn", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-speaking/ielts-speaking-part-2-sample-recording.mp3" },
    { label: "Part 3 · Two-way discussion", url: "https://ielts.org/cdn/ielts-sample-tests/ielts-speaking/ielts-speaking-part-3-sample-recording.mp3" },
  ],
  tasks: [
    { id: "part-1", label: "Part 1 · Introduction and interview", questionLabel: "Part 1", questionPage: 3, audioTrackIndex: 0 },
    { id: "part-2", label: "Part 2 · Long turn", questionLabel: "Part 2", questionPage: 5, audioTrackIndex: 1 },
    { id: "part-3", label: "Part 3 · Two-way discussion", questionLabel: "Part 3", questionPage: 6, audioTrackIndex: 2 },
  ],
};

const officialTestSchedule: OfficialTestSession[] = [
  { id: "reading", isoDay: 2, dayLabel: "周二", time: "20:00", title: "Official Academic Reading Full Sample Test", duration: "60 分钟", durationMinutes: 60, source: "IELTS.org 官方完整样题", setCode: "IELTS-OFFICIAL-AR-MLP-01", description: "完整 3 篇 Academic Reading，题号从 1 连续到 40；全部填写并提交后自动记录完成。", materials: [readingMaterial] },
  { id: "listening", isoDay: 4, dayLabel: "周四", time: "20:00", title: "Official Listening Sample Tasks 2023", duration: "40 分钟", durationMinutes: 40, source: "IELTS.org 官方公开材料", setCode: "IELTS-OFFICIAL-L-2023-01", description: "内置官方题目 PDF 与 8 段对应录音，覆盖填空、单选、简答、匹配和地图题。", materials: [listeningMaterial] },
  { id: "writing", isoDay: 6, dayLabel: "周六", time: "09:30", title: "Official Academic Writing Sample Test 2023", duration: "60 分钟", durationMinutes: 60, source: "IELTS.org 官方公开材料", setCode: "IELTS-OFFICIAL-AW-2023-01", description: "独立 Writing 训练：完成 Task 1（至少 150 词）与 Task 2（至少 250 词），不再重复周二 Reading 或周四 Listening。", materials: [writingMaterial] },
  { id: "speaking-review", isoDay: 7, dayLabel: "周日", time: "19:30", title: "Official Speaking Sample Tasks 2023", duration: "55 分钟", durationMinutes: 55, source: "IELTS.org 官方公开材料", setCode: "IELTS-OFFICIAL-S-2023-01", description: "内置官方 Speaking Part 1–3 题目与示范录音，完成后复盘本周错题。", materials: [speakingMaterial] },
];

function officialPracticeRecordId(session: OfficialTestSession, weekKey = localWeekKey()) {
  return `${weekKey}:${session.id}:${session.setCode}`;
}

function speak(text: string, rate = 0.9) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
  return true;
}

function normalizeOfficialAnswer(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/^(some|the|an|a)\s+/, "")
    .replace(/\s+(wide|high|deep)$/, "")
    .replaceAll("¾", "0.75")
    .replaceAll("½", "0.5")
    .replace(/[^a-z0-9]+/g, "");
}

function officialAnswerIsCorrect(answer: OfficialAnswer, taskAnswers: OfficialAnswer[], responses: Record<string, string>, taskKey: string) {
  const responseFor = (item: OfficialAnswer) => normalizeOfficialAnswer(responses[`${taskKey}:${item.number}`] ?? "");
  const acceptedFor = (item: OfficialAnswer) => item.accepted.map(normalizeOfficialAnswer);
  if (!answer.group) return acceptedFor(answer).includes(responseFor(answer));
  const groupAnswers = taskAnswers.filter((item) => item.group === answer.group);
  const groupResponses = groupAnswers.map(responseFor);
  return groupResponses.every((response, index) => response && acceptedFor(groupAnswers[index]).includes(response))
    && new Set(groupResponses).size === groupResponses.length;
}

export default function IeltsApp() {
  const [view, setView] = useState<View>("today");
  const [activeSkill, setActiveSkill] = useState<Skill>("vocabulary");
  const [activeOfficialSessionId, setActiveOfficialSessionId] = useState(officialTestSchedule[0].id);
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
      carryoverTasks: current.carryoverTasks.filter((item) => item !== skill),
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

  const openOfficialTest = (sessionId: string) => {
    setActiveOfficialSessionId(sessionId);
    setView("official-test");
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
            onStart={() => openSkill(progress.carryoverTasks.find((skill) => !progress.completed[skill]) ?? skills.find((skill) => !progress.completed[skill.id])?.id ?? "vocabulary")}
            onVocabulary={() => openSkill("vocabulary")}
            onOpenSkill={openSkill}
            onNavigate={setView}
          />
        )}
        {view === "practice" && <PracticeView progress={progress} onOpen={openSkill} onOpenOfficialTest={openOfficialTest} />}
        {view === "official-test" && <OfficialTestRunner session={officialTestSchedule.find((session) => session.id === activeOfficialSessionId) ?? officialTestSchedule[0]} progress={progress} onBack={() => setView("practice")} updateProgress={updateProgress} />}
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
    { id: "review", label: "笔记与复习" },
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
    { id: "review", label: "笔记" },
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
  const carryoverSkill = progress.carryoverTasks.find((skill) => !progress.completed[skill]);
  const nextSkill = skills.find((skill) => skill.id === carryoverSkill)
    ?? skills.find((skill) => !progress.completed[skill.id])
    ?? skills[0];
  const todayWordSet = new Set(getDailyVocabulary(progress.dailyVocabularyDate).map((word) => word.word));
  const todaySeenCount = progress.dailyVocabularyKnown.filter((word) => todayWordSet.has(word)).length;
  const dueReviewCount = progress.reviewWords.filter((word) => (progress.reviewSchedule[word]?.dueDate ?? localDayKey()) <= localDayKey()).length;
  const weekKey = localWeekKey();
  const completedOfficialSessions = officialTestSchedule.filter((session) => progress.officialPracticeCompleted.includes(officialPracticeRecordId(session, weekKey)));
  const todayIsoDay = ((new Date().getDay() + 6) % 7) + 1;
  const nextOfficialSession = officialTestSchedule.find((session) => session.isoDay >= todayIsoDay && !progress.officialPracticeCompleted.includes(officialPracticeRecordId(session, weekKey)))
    ?? officialTestSchedule.find((session) => !progress.officialPracticeCompleted.includes(officialPracticeRecordId(session, weekKey)))
    ?? officialTestSchedule[0];
  return (
    <>
      <PageHeader eyebrow="DAY 06 · 距离考试还有 86 天" title="把今天，练成一句" accent="流利的英语。" />
      {progress.carryoverTasks.length > 0 ? (
        <section className="carryover-strip">
          <div><span>ROLLED OVER FROM YESTERDAY</span><strong>先补完昨天没有完成的任务</strong><p>补做任务不会自动打勾；完成完整专项后才会从这里移除。</p></div>
          <div className="carryover-task-list">{progress.carryoverTasks.map((skillId) => { const skill = skills.find((item) => item.id === skillId); return skill ? <button onClick={() => onOpenSkill(skill.id)} key={skill.id}><span>{skill.short}</span><strong>{skill.label}</strong><small>{progress.completed[skill.id] ? "✓ 已补完" : "昨日未完成 →"}</small></button> : null; })}</div>
        </section>
      ) : (
        <section className="carryover-strip is-empty">
          <div><span>TASK ROLLOVER</span><strong>今天没完成的任务，会自动进入明天</strong><p>目前没有昨日待补做任务；完成度不会因为任务顺延而自动增加。</p></div>
          <div className="carryover-empty-count"><strong>0</strong><span>待补做</span></div>
        </section>
      )}
      <div className="dashboard-grid">
        <section className="scene-stage">
          <div className="scene-watermark" aria-hidden="true">TEST<br />FLOW</div>
          <div className="scene-heading"><span>TODAY PLAN · IELTS ACADEMIC</span><span>约 50 分钟</span></div>
          <h2>今天完成<br />一轮雅思训练</h2><p>100 词 + 听力场景 + 口语 Part 3 + Academic Reading</p>
          <button className="voice-orb" aria-label="试听场景" onClick={() => speak("Hello, I'm calling about the room for rent.")}><i /><b>AI</b></button>
          <div className="learning-path" aria-label="今日场景学习路径">
            {skills.map((skill, index) => (
              <button
                className={`path-step ${progress.completed[skill.id] ? "is-done" : ""} ${nextSkill.id === skill.id ? "is-current" : ""}`}
                key={skill.id}
                onClick={() => onOpenSkill(skill.id)}
              >
                <span>{progress.completed[skill.id] ? "✓" : index + 1}</span><strong>{skill.short}</strong><small>{progress.carryoverTasks.includes(skill.id) ? "昨日未完成" : skill.duration}</small>
              </button>
            ))}
          </div>
          <button className="primary-action" onClick={onStart}>{completedCount === 4 ? "再练一次场景" : `继续${nextSkill.label}`}<span>→</span></button>
        </section>
        <aside className="progress-panel" aria-label="学习进度">
          <div className="progress-intro">
            <span>今日完成度</span><strong>{percent}<small>%</small></strong>
            <div className="progress-track"><i style={{ width: `${percent}%` }} /></div>
            <p>{completedCount === 4 ? "今日场景已完成，复习会让记忆更稳定。" : progress.carryoverTasks.includes(nextSkill.id) ? `已完成 ${completedCount} / 4 项，先补做昨天的${nextSkill.label}。` : `已完成 ${completedCount} / 4 项，下一项是${nextSkill.label}。`}</p>
          </div>
          <button className="daily-word-row" onClick={onVocabulary}>
            <span><small>TODAY&apos;S WORDS</small><strong>{todaySeenCount}<b>/100</b></strong></span>
            <span className="daily-word-copy"><strong>每日高频词</strong><small>300 词核心库轮换 · 每天 5 × 20</small></span>
            <b>→</b>
          </button>
          <div className="streak-row"><span className="streak-mark">{progress.streak}</span><span><strong>连续学习 {progress.streak} 天</strong><small>本周已学习 {progress.minutes} 分钟</small></span></div>
          <button className="memory-row" onClick={() => onNavigate("review")}>
            <span><strong>笔记与复习</strong><small>{progress.notebook.length} 条笔记 · {dueReviewCount} 个今日到期</small></span><b>→</b>
          </button>
        </aside>
      </div>
      <section className="official-plan-strip">
        <div><span>WEEKLY OFFICIAL PRACTICE</span><strong>本周官方套题训练</strong><p>下一项：{nextOfficialSession.dayLabel} {nextOfficialSession.time} · {nextOfficialSession.title}</p></div>
        <div className="official-plan-progress"><strong>{completedOfficialSessions.length}<small>/4</small></strong><span>本周已完成</span></div>
        <button onClick={() => onNavigate("practice")}>查看官方套题计划 <span>→</span></button>
      </section>
    </>
  );
}

function PracticeView({
  progress,
  onOpen,
  onOpenOfficialTest,
}: {
  progress: LearningProgress;
  onOpen: (skill: Skill) => void;
  onOpenOfficialTest: (sessionId: string) => void;
}) {
  return (
    <>
      <PageHeader eyebrow="FOCUSED PRACTICE" title="选择一项，进行" accent="专项练习。" />
      <div className="practice-grid">
        {skills.map((skill, index) => (
          <button className="practice-card" key={skill.id} onClick={() => onOpen(skill.id)}>
            <span className="practice-number">0{index + 1}</span><span className="practice-glyph">{skill.short}</span>
            <strong>{skill.label}</strong><p>{skill.description}</p>
            <span className={progress.completed[skill.id] ? "skill-status is-complete" : "skill-status"}>
              {progress.completed[skill.id] ? "今日已完成" : progress.carryoverTasks.includes(skill.id) ? `昨日未完成 · ${skill.duration}` : skill.duration}
            </span>
          </button>
        ))}
      </div>
      <OfficialPracticePlan progress={progress} onOpenOfficialTest={onOpenOfficialTest} />
    </>
  );
}

function OfficialPracticePlan({
  progress,
  onOpenOfficialTest,
}: {
  progress: LearningProgress;
  onOpenOfficialTest: (sessionId: string) => void;
}) {
  const weekKey = localWeekKey();
  const completedCount = officialTestSchedule.filter((session) => progress.officialPracticeCompleted.includes(officialPracticeRecordId(session, weekKey))).length;

  return (
    <section className="official-practice-plan">
      <header className="official-practice-heading">
        <div><span>OFFICIAL SAMPLE TEST WEEK</span><h2>官方套题训练计划</h2><p>每周 4 次 · 共约 3.5 小时 · 独立于每日基础训练</p></div>
        <strong>{completedCount}<small>/4</small></strong>
      </header>
      <div className="official-source-note"><b>内容来源说明</b><p>Reading 使用 IELTS.org 官方完整 Academic Reading Sample Test（3 篇、1–40 题）。这是官方样题，不等同于已正式考过的 Cambridge 历年原卷；App 不会把两者混淆。</p></div>
      <div className="official-session-list">
        {officialTestSchedule.map((session, index) => {
          const recordId = officialPracticeRecordId(session, weekKey);
          const completed = progress.officialPracticeCompleted.includes(recordId);
          return (
            <article className={completed ? "official-session is-complete" : "official-session"} key={session.id}>
              <div className="official-session-date"><span>{session.dayLabel}</span><strong>{session.time}</strong></div>
              <div className="official-session-copy"><small>0{index + 1} · {session.source}</small><h3>{session.title}</h3><p>{session.description}</p><b>{session.setCode} · {session.duration}</b></div>
              <div className="official-session-actions">
                <button onClick={() => onOpenOfficialTest(session.id)}>{completed ? "查看本套 · 已完成" : "开始本套 →"}</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function OfficialTestRunner({
  session,
  progress,
  onBack,
  updateProgress,
}: {
  session: OfficialTestSession;
  progress: LearningProgress;
  onBack: () => void;
  updateProgress: (updater: (current: LearningProgress) => LearningProgress) => void;
}) {
  const [taskIndex, setTaskIndex] = useState(0);
  const [paperMode, setPaperMode] = useState<"questions" | "answers">("questions");
  const [audioTrackIndex, setAudioTrackIndex] = useState(0);
  const [readingSectionIndex, setReadingSectionIndex] = useState(0);
  const [officialResponses, setOfficialResponses] = useState<Record<string, string>>({});
  const [submittedTasks, setSubmittedTasks] = useState<Record<string, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(session.durationMinutes * 60);
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const material = session.materials[0];
  const task = material.tasks[taskIndex];
  const audioTrack = material.audioTracks?.[audioTrackIndex];
  const displayPage = paperMode === "answers" && task.answerPage ? task.answerPage : task.questionPage;
  const displayPdfUrl = paperMode === "answers" && material.answerPdfUrl ? material.answerPdfUrl : material.pdfUrl;
  const fullReadingSections = [
    { label: "Passage 1", range: "Q1–13", passagePage: 2, questionPage: 4 },
    { label: "Passage 2", range: "Q14–26", passagePage: 5, questionPage: 7 },
    { label: "Passage 3", range: "Q27–40", passagePage: 9, questionPage: 11 },
  ];
  const readingSection = fullReadingSections[readingSectionIndex];
  const taskKey = `${material.id}:${task.id}`;
  const taskAnswers = task.answers ?? [];
  const openResponseKey = `${taskKey}:open-response`;
  const openResponse = officialResponses[openResponseKey] ?? "";
  const openResponseWordCount = openResponse.trim() ? openResponse.trim().split(/\s+/).length : 0;
  const taskRequiresSubmission = taskAnswers.length > 0 || Boolean(task.minimumWords);
  const answeredCount = taskAnswers.filter((answer) => (officialResponses[`${taskKey}:${answer.number}`] ?? "").trim()).length;
  const allAnswersFilled = taskAnswers.length > 0 && answeredCount === taskAnswers.length;
  const taskSubmitted = submittedTasks[taskKey] ?? false;
  const correctAnswerCount = taskSubmitted ? taskAnswers.filter((answer) => officialAnswerIsCorrect(answer, taskAnswers, officialResponses, taskKey)).length : 0;
  const requiredTasks = session.materials.flatMap((sessionMaterial) => sessionMaterial.tasks
    .filter((sessionTask) => (sessionTask.answers?.length ?? 0) > 0 || Boolean(sessionTask.minimumWords))
    .map((sessionTask) => ({ key: `${sessionMaterial.id}:${sessionTask.id}`, questionCount: (sessionTask.answers?.length ?? 0) || 1 })));
  const requiredQuestionCount = requiredTasks.reduce((total, requiredTask) => total + requiredTask.questionCount, 0);
  const submittedRequiredTaskCount = requiredTasks.filter((requiredTask) => submittedTasks[requiredTask.key]).length;
  const materialRequiredTasks = material.tasks.filter((materialTask) => (materialTask.answers?.length ?? 0) > 0 || Boolean(materialTask.minimumWords));
  const materialQuestionCount = materialRequiredTasks.reduce((total, materialTask) => total + ((materialTask.answers?.length ?? 0) || 1), 0);
  const submittedMaterialTaskCount = materialRequiredTasks.filter((materialTask) => submittedTasks[`${material.id}:${materialTask.id}`]).length;
  const recordId = officialPracticeRecordId(session);
  const completed = progress.officialPracticeCompleted.includes(recordId);

  useEffect(() => {
    if (timerState !== "running") return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimerState("finished");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerState]);

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  const toggleTimer = () => {
    if (timerState === "running") setTimerState("paused");
    else if (timerState !== "finished") setTimerState("running");
  };
  const resetTimer = () => {
    setRemainingSeconds(session.durationMinutes * 60);
    setTimerState("idle");
  };
  const submitCurrentTask = () => {
    const nextSubmittedTasks = { ...submittedTasks, [taskKey]: true };
    setSubmittedTasks(nextSubmittedTasks);
    updateProgress((current) => {
      const notebook = current.notebook.map((entry) => {
        const answer = taskAnswers.find((item) => entry.id === `question:${session.setCode}:${task.id}:${item.number}`);
        if (!answer) return entry;
        const response = officialResponses[`${taskKey}:${answer.number}`] || "未作答";
        return { ...entry, detail: `我的答案：${response}\n正确答案：${answer.displayAnswer}` };
      });
      const allRequiredSubmitted = requiredTasks.length > 0 && requiredTasks.every((requiredTask) => nextSubmittedTasks[requiredTask.key]);
      return {
        ...current,
        notebook,
        officialPracticeCompleted: allRequiredSubmitted && !current.officialPracticeCompleted.includes(recordId)
          ? [...current.officialPracticeCompleted, recordId]
          : current.officialPracticeCompleted,
      };
    });
  };
  const changeTask = (index: number) => {
    const nextTask = material.tasks[index];
    setTaskIndex(index);
    setPaperMode("questions");
    setReadingSectionIndex(0);
    setAudioTrackIndex(nextTask.audioTrackIndex ?? 0);
  };

  return (
    <>
      <div className="official-runner-bar">
        <button onClick={onBack}>← 返回官方套题计划</button>
        <div><span>当前套题</span><strong>{session.title}</strong><small>{session.source}</small></div>
        <span className="official-set-badge">{session.setCode}</span>
      </div>
      <div className="official-runner-layout">
        <aside className="official-runner-sidebar">
          <span>套题计时</span><strong className={timerState === "paused" ? "is-paused" : ""}>{minutes}:{seconds}</strong><small>{timerState === "running" ? "计时进行中" : timerState === "paused" ? "计时已暂停" : timerState === "finished" ? "本套计时结束" : `建议用时 ${session.duration}`}</small>
          <button className="runner-timer-primary" disabled={timerState === "finished"} onClick={toggleTimer}>{timerState === "running" ? "Ⅱ 暂停计时" : timerState === "paused" ? "▶ 继续计时" : "▶ 开始计时"}</button>
          <button className="runner-timer-reset" onClick={resetTimer}>重新计时</button>
          <div className="official-runner-rights"><b>IELTS 官方公开样题</b><p>题目与录音由 IELTS.org 提供。本 App 仅在学习界面中加载原始官方文件并保存你的进度。</p></div>
          <div className={completed ? "runner-completion-status is-complete" : "runner-completion-status"}><b>{completed ? "✓ 本套已完成" : "等待完整提交"}</b><p>{completed ? `全部 ${requiredQuestionCount} 题已提交，系统已自动记录。` : requiredTasks.length > 0 ? `${submittedRequiredTaskCount}/${requiredTasks.length} 个必做 Task 已提交；完成全部 ${requiredQuestionCount} 题后自动记录。` : "本套没有可自动判定的客观题，当前不会记录为完成。"}</p></div>
        </aside>
        <section className="official-paper-panel">
          <header><div><strong>{task.questionLabel}</strong></div><small>官方原始题号 · 当前显示 P{displayPage}</small></header>
          <div className={material.tasks.length > 1 ? "official-task-controls" : "official-task-controls is-single"}>
            {material.tasks.length > 1 && <label>选择 Task<select value={taskIndex} onChange={(event) => changeTask(Number(event.target.value))}>{material.tasks.map((item, index) => <option value={index} key={item.id}>{index + 1}. {item.label} · {item.questionLabel}</option>)}</select></label>}
            <div className="official-paper-switch" aria-label="题目与答案切换">
              <button className={paperMode === "questions" ? "is-active" : ""} onClick={() => setPaperMode("questions")}>查看题目 · P{task.questionPage}</button>
              {task.answerPage && <button className={paperMode === "answers" ? "is-active" : ""} disabled={taskRequiresSubmission && !taskSubmitted} onClick={() => setPaperMode("answers")}>{taskRequiresSubmission && !taskSubmitted ? "提交后查看答案" : task.answerLabel ?? "查看答案"} · P{task.answerPage}</button>}
            </div>
          </div>
          {material.tasks.length > 1 && (
            <section className="official-task-map" aria-label="官方练习任务导航">
              <header><div><span>{material.audioTracks ? "LISTENING TASK MAP" : "PRACTICE TASK MAP"}</span><b>{material.tasks.length} 个独立 Task{materialQuestionCount > 0 ? ` · 共 ${materialQuestionCount} 个必做项` : ""}</b><small>{material.audioTracks ? "题号来自不同 Sample Task，会重复；请选择 Task 逐个完成。" : "所有科目沿用与第一份阅读一致的材料区 + 答题区模板。"}</small></div><strong>{materialRequiredTasks.length > 0 ? `${submittedMaterialTaskCount}/${materialRequiredTasks.length}` : `${taskIndex + 1}/${material.tasks.length}`}</strong></header>
              <div>{material.tasks.map((materialTask, index) => {
                const materialTaskKey = `${material.id}:${materialTask.id}`;
                const materialTaskSubmitted = submittedTasks[materialTaskKey] ?? false;
                const materialTaskSize = (materialTask.answers?.length ?? 0) > 0 ? `${materialTask.answers?.length} 题` : materialTask.minimumWords ? `至少 ${materialTask.minimumWords} 词` : "开放练习";
                return <button className={taskIndex === index ? "is-active" : materialTaskSubmitted ? "is-complete" : ""} onClick={() => changeTask(index)} type="button" key={materialTask.id}><span>Task {index + 1}</span><b>{materialTask.label}</b><small>{materialTaskSize} {materialTaskSubmitted ? "· 已提交" : ""}</small></button>;
              })}</div>
            </section>
          )}
          <div className={material.passagePdfUrl && paperMode === "questions" ? "official-full-reading-body" : "official-standard-paper-body"}>
          {taskAnswers.length > 0 ? (
            <form className="official-answer-sheet" onSubmit={(event) => {
              event.preventDefault();
              if (!allAnswersFilled) return;
              submitCurrentTask();
            }}>
              <header>
                <div><span>COMPUTER-DELIVERED ANSWER SHEET</span><strong>电子答题卡</strong><small>按官方题号填写，提交前不会显示答案</small></div>
                <b className={taskSubmitted ? "is-scored" : ""}>{taskSubmitted ? `${correctAnswerCount} / ${taskAnswers.length}` : `${answeredCount} / ${taskAnswers.length}`}</b>
              </header>
              <div className="official-answer-grid">
                {taskAnswers.map((answer) => {
                  const responseKey = `${taskKey}:${answer.number}`;
                  const correct = taskSubmitted && officialAnswerIsCorrect(answer, taskAnswers, officialResponses, taskKey);
                  const noteId = `question:${session.setCode}:${task.id}:${answer.number}`;
                  const savedToNotebook = progress.notebook.some((entry) => entry.id === noteId);
                  return (
                    <div className={`official-answer-item ${taskSubmitted ? correct ? "is-correct" : "is-wrong" : ""}`} key={answer.number}>
                      <span>Q{answer.number}</span>
                      {answer.choices ? (
                        <select aria-label={`Question ${answer.number}`} disabled={taskSubmitted} value={officialResponses[responseKey] ?? ""} onChange={(event) => setOfficialResponses((current) => ({ ...current, [responseKey]: event.target.value }))}>
                          <option value="">请选择</option>
                          {answer.choices.map((choice) => <option value={choice} key={choice}>{choice}</option>)}
                        </select>
                      ) : (
                        <input aria-label={`Question ${answer.number}`} autoComplete="off" disabled={taskSubmitted} placeholder="输入答案" value={officialResponses[responseKey] ?? ""} onChange={(event) => setOfficialResponses((current) => ({ ...current, [responseKey]: event.target.value }))} />
                      )}
                      <button
                        className={savedToNotebook ? "question-note-button is-saved" : "question-note-button"}
                        type="button"
                        onClick={() => updateProgress((current) => toggleNotebookEntry(current, {
                          id: noteId,
                          kind: "question",
                          title: `Q${answer.number} · ${task.label}`,
                          detail: taskSubmitted ? `我的答案：${officialResponses[responseKey] || "未作答"}\n正确答案：${answer.displayAnswer}` : "已标记，提交后会自动补充你的答案和正确答案。",
                          source: `${session.title} · ${session.setCode}`,
                        }))}
                      >{savedToNotebook ? "★ 已加入" : taskSubmitted && !correct ? "☆ 加入错题本" : "☆ 标记"}</button>
                      {taskSubmitted && <small><b>{correct ? "✓ 正确" : "✕ 错误"}</b><em>正确答案：{answer.displayAnswer}</em></small>}
                    </div>
                  );
                })}
              </div>
              <footer>
                <span>{taskSubmitted ? `本 Task 得分 ${correctAnswerCount}/${taskAnswers.length}；每题旁已显示官方答案。` : allAnswersFilled ? "答案已全部填写，可以提交判分。" : `还需完成 ${taskAnswers.length - answeredCount} 题后才能提交。`}</span>
                {taskSubmitted ? <button type="button" onClick={() => { setSubmittedTasks((current) => ({ ...current, [taskKey]: false })); setPaperMode("questions"); }}>修改答案</button> : <button type="submit" disabled={!allAnswersFilled}>提交全部答案</button>}
              </footer>
            </form>
          ) : task.minimumWords ? (
            <form className="official-writing-response" onSubmit={(event) => {
              event.preventDefault();
              if (openResponseWordCount < task.minimumWords!) return;
              submitCurrentTask();
            }}>
              <header><div><span>COMPUTER-DELIVERED WRITING</span><strong>{task.label} 作答区</strong><small>最低要求 {task.minimumWords} 词；提交后解锁官方范文与考官评语</small></div><b>{openResponseWordCount}<small> words</small></b></header>
              <textarea aria-label={`${task.label} answer`} disabled={taskSubmitted} placeholder="在这里输入你的英文答案……" value={openResponse} onChange={(event) => setOfficialResponses((current) => ({ ...current, [openResponseKey]: event.target.value }))} />
              <footer><span>{taskSubmitted ? `已提交 ${openResponseWordCount} 词，可以查看官方范文进行复盘。` : openResponseWordCount >= task.minimumWords ? "已达到最低词数，可以提交本 Task。" : `还需至少 ${task.minimumWords - openResponseWordCount} 词。`}</span>{taskSubmitted ? <button type="button" onClick={() => { setSubmittedTasks((current) => ({ ...current, [taskKey]: false })); setPaperMode("questions"); }}>继续修改</button> : <button type="submit" disabled={openResponseWordCount < task.minimumWords}>提交本 Task</button>}</footer>
            </form>
          ) : (
            <div className="official-open-response-note"><b>开放作答题</b><span>Speaking / Writing 没有唯一官方答案，因此不显示虚假的对错判定；可通过官方示范录音或范文复盘。</span></div>
          )}
          {material.audioTracks && audioTrack && (
            <div className="official-audio-dock">
              <label>选择 Task 与官方录音<select value={audioTrackIndex} onChange={(event) => changeTask(Number(event.target.value))}>{material.audioTracks.map((track, index) => <option value={index} key={track.url}>{track.label}</option>)}</select></label>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption -- The official transcript is included in the embedded source PDF. */}
              <audio key={audioTrack.url} controls preload="metadata" src={audioTrack.url}>当前浏览器不支持音频播放；对应原文位于官方 PDF。</audio>
            </div>
          )}
          {material.passagePdfUrl && paperMode === "questions" ? (
            <div className="official-reading-booklet">
              <header>
                <div className="official-reading-sections" aria-label="阅读文章分段">{fullReadingSections.map((section, index) => <button className={readingSectionIndex === index ? "is-active" : ""} onClick={() => setReadingSectionIndex(index)} type="button" key={section.label}>{section.label}<small>{section.range}</small></button>)}</div>
                <span>文章 + 对应题目连续显示</span>
              </header>
              <section className="official-reading-pair" key={readingSection.label}>
                <header><b>{readingSection.label} · 阅读文章</b><small>先阅读本篇原文</small></header>
                <iframe className="official-paper-frame" title={`${readingSection.label} · 阅读文章`} src={`${material.passagePdfUrl}#page=${readingSection.passagePage}&toolbar=1&navpanes=0&view=FitH`} />
                <div className="official-reading-continue"><span>接着完成</span><b>{readingSection.range}</b></div>
                <header><b>{readingSection.label} · 对应题目</b><small>题目紧接文章，无需切换题册</small></header>
                <iframe className="official-paper-frame" title={`${readingSection.label} · 对应题目`} src={`${material.pdfUrl}#page=${readingSection.questionPage}&toolbar=1&navpanes=0&view=FitH`} />
              </section>
            </div>
          ) : (
            <section className="official-source-document">
              <header><div><span>{paperMode === "answers" ? "OFFICIAL REVIEW MATERIAL" : "OFFICIAL SOURCE MATERIAL"}</span><b>{paperMode === "answers" ? task.answerLabel ?? "官方答案" : `${task.label} · 官方题目`}</b></div><small>PDF P{displayPage}</small></header>
              <iframe key={`${material.id}-${task.id}-${paperMode}`} className="official-paper-frame" title={`${session.title} · ${task.label} · ${paperMode === "answers" ? "答案" : "题目"}`} src={`${displayPdfUrl}#page=${displayPage}&toolbar=1&navpanes=0&view=FitH`} />
            </section>
          )}
          {task.transcriptPage && (
            <section className={taskSubmitted ? "official-listening-transcript is-unlocked" : "official-listening-transcript"}>
              <header><div><span>OFFICIAL TAPESCRIPT</span><b>{task.label} · 听力原文</b></div><small>{taskSubmitted ? `已解锁 · 官方 PDF P${task.transcriptPage}` : "提交当前 Task 后解锁"}</small></header>
              {taskSubmitted ? <iframe className="official-paper-frame" title={`${task.label} · 听力原文`} src={`${material.pdfUrl}#page=${task.transcriptPage}&toolbar=1&navpanes=0&view=FitH`} /> : <div><b>原文暂未显示</b><p>请先听完录音、填写当前 Task 的全部答案并提交；判分后这里会自动出现官方 Tapescript。</p></div>}
            </section>
          )}
          </div>
        </section>
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
  const completeVocabularySection = (section: "daily" | "dictation") => {
    updateProgress((current) => {
      const dailyVocabularyCompleted = section === "daily" || current.dailyVocabularyCompleted;
      const dailyDictationCompleted = section === "dictation" || current.dailyDictationCompleted;
      const fullyCompleted = dailyVocabularyCompleted && dailyDictationCompleted;
      return {
        ...current,
        dailyVocabularyCompleted,
        dailyDictationCompleted,
        completed: { ...current.completed, vocabulary: fullyCompleted },
        carryoverTasks: fullyCompleted ? current.carryoverTasks.filter((item) => item !== "vocabulary") : current.carryoverTasks,
        minutes: fullyCompleted && !current.completed.vocabulary ? current.minutes + 15 : current.minutes,
      };
    });
  };
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
        {activeSkill === "vocabulary" && <VocabularyPractice progress={progress} onSectionComplete={completeVocabularySection} updateProgress={updateProgress} />}
        {activeSkill === "listening" && <ListeningPractice onComplete={(score) => {
          updateProgress((current) => ({ ...current, listeningCorrect: score === 10, listeningScore: score }));
          onComplete("listening", 12);
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
  onSectionComplete,
  updateProgress,
}: {
  progress: LearningProgress;
  onSectionComplete: (section: "daily" | "dictation") => void;
  updateProgress: (updater: (current: LearningProgress) => LearningProgress) => void;
}) {
  const [mode, setMode] = useState<"daily" | "typing" | "phrases">("daily");
  const [index, setIndex] = useState(() => Math.min(
    vocabulary.filter((item) => progress.dailyDictationSeen.includes(item.word)).length,
    vocabulary.length - 1,
  ));
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const word = vocabulary[index];

  const check = (event?: FormEvent) => {
    event?.preventDefault();
    const correct = value.trim().toLowerCase() === word.word;
    setFeedback({ tone: correct ? "success" : "error", text: correct ? "拼写正确，答案已经揭晓。" : "拼写有误，已加入需要复习的词汇。" });
    updateProgress((current) => {
      const next = {
        ...current,
        masteredWords: correct ? Array.from(new Set([...current.masteredWords, word.word])) : current.masteredWords,
        reviewWords: current.reviewWords,
      };
      return correct ? next : scheduleWordForReview(next, word.word, "unfamiliar", 0);
    });
  };

  const next = () => {
    if (!feedback) return;
    updateProgress((current) => ({
      ...current,
      dailyDictationSeen: Array.from(new Set([...current.dailyDictationSeen, word.word])),
    }));
    if (index === vocabulary.length - 1) {
      onSectionComplete("dictation");
      setFeedback({ tone: "success", text: "本组完成。结果已同步到今日进度和复习。" });
      return;
    }
    setIndex((current) => current + 1);
    setValue(""); setFeedback(null);
  };

  return (
    <>
      <div className="vocabulary-mode-switch" role="tablist" aria-label="词汇练习模式">
        <button role="tab" aria-selected={mode === "daily"} className={mode === "daily" ? "is-active" : ""} onClick={() => setMode("daily")}>每日 100 词 {progress.dailyVocabularyCompleted ? "✓" : ""}</button>
        <button role="tab" aria-selected={mode === "typing"} className={mode === "typing" ? "is-active" : ""} onClick={() => setMode("typing")}>场景听写 80 词 {progress.dailyDictationCompleted ? "✓" : ""}</button>
        <button role="tab" aria-selected={mode === "phrases"} className={mode === "phrases" ? "is-active" : ""} onClick={() => setMode("phrases")}>吞音词组 {connectedSpeechPhrases.length}</button>
      </div>
      <p className="completion-requirement">完成每日 100 词和场景听写 80 词后，词汇任务才会打勾；吞音词组为专项加练。</p>
      {mode === "daily" ? (
        <DailyVocabularySprint progress={progress} onComplete={() => onSectionComplete("daily")} updateProgress={updateProgress} />
      ) : mode === "typing" ? (
        <div className="exercise-layout">
      <div className="exercise-main typing-practice">
        <div className="exercise-kicker"><span>听音拼写 · 第 {Math.floor(index / 10) + 1} / 8 组</span><span>{progress.dailyDictationSeen.length + (feedback ? 1 : 0)} / {vocabulary.length}</span></div>
        <h2>只听声音，输入对应的英文单词</h2><p>提交检查前不显示中文、拼写和例句。</p>
        <button className="audio-control" onClick={() => speak(word.word, 0.72)}><span>▶</span>播放英式发音</button>
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
        <div className={`answer-feedback ${feedback?.tone ?? ""}`} aria-live="polite">{feedback?.text ?? "先听发音再输入；检查后才会显示答案。"}</div>
        {feedback && <div className="dictation-reveal"><span>正确拼写</span><strong>{word.word}</strong><p>{word.meaning}</p><button className={progress.notebook.some((entry) => entry.id === `word:${word.word.toLowerCase()}`) ? "inline-note-button is-saved" : "inline-note-button"} onClick={() => updateProgress((current) => toggleNotebookEntry(current, { id: `word:${word.word.toLowerCase()}`, kind: "word", title: word.word, detail: `${word.meaning}\n${word.example}`, source: "场景听写" }))}>{progress.notebook.some((entry) => entry.id === `word:${word.word.toLowerCase()}`) ? "★ 已加入笔记" : "☆ 加入笔记"}</button></div>}
        <div className="exercise-actions"><button className="secondary-action" disabled={!feedback} onClick={next}>{index === vocabulary.length - 1 ? "完成听写" : "下一个"} →</button></div>
      </div>
      <aside className="exercise-context">
        <span>{feedback ? "场景例句" : "盲听规则"}</span><p>{feedback ? word.example : "中文释义、正确拼写和例句会在检查后出现。拼写错误的单词将自动进入复习。"}</p>{feedback && <button onClick={() => speak(word.example)}>播放例句</button>}
        <div className="context-stat"><strong>{progress.masteredWords.length}</strong><span>累计掌握词汇</span></div>
      </aside>
        </div>
      ) : (
        <ConnectedSpeechPractice progress={progress} updateProgress={updateProgress} />
      )}
    </>
  );
}

function ConnectedSpeechPractice({
  progress,
  updateProgress,
}: {
  progress: LearningProgress;
  updateProgress: (updater: (current: LearningProgress) => LearningProgress) => void;
}) {
  const completedCount = connectedSpeechPhrases.filter((item) => progress.connectedSpeechSeen.includes(item.phrase)).length;
  const [index, setIndex] = useState(() => Math.min(completedCount, connectedSpeechPhrases.length - 1));
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const phrase = connectedSpeechPhrases[index];
  const finished = completedCount >= connectedSpeechPhrases.length;
  const normalize = (text: string) => text.trim().toLowerCase().replace(/[.,?!]/g, "").replace(/\s+/g, " ");

  const check = (event?: FormEvent) => {
    event?.preventDefault();
    const correct = normalize(value) === normalize(phrase.phrase);
    setFeedback({ tone: correct ? "success" : "error", text: correct ? "词组听写正确。" : "词组拼写有误，已加入复习。" });
    updateProgress((current) => {
      const next = {
        ...current,
        masteredWords: correct ? Array.from(new Set([...current.masteredWords, phrase.phrase])) : current.masteredWords,
        reviewWords: current.reviewWords,
      };
      return correct ? next : scheduleWordForReview(next, phrase.phrase, "unfamiliar", 0);
    });
  };

  const next = () => {
    if (!feedback) return;
    updateProgress((current) => ({ ...current, connectedSpeechSeen: Array.from(new Set([...current.connectedSpeechSeen, phrase.phrase])) }));
    if (index < connectedSpeechPhrases.length - 1) setIndex((current) => current + 1);
    setValue("");
    setFeedback(null);
  };

  if (finished) {
    return <div className="daily-complete"><span className="daily-complete-mark">{connectedSpeechPhrases.length}</span><div><p>CONNECTED SPEECH COMPLETE</p><h2>今天的连读与吞音词组已经练完。</h2><span>拼错的词组已经进入复习，可以随时回听。</span></div></div>;
  }

  return (
    <div className="exercise-layout connected-speech-layout">
      <div className="exercise-main typing-practice">
        <div className="exercise-kicker"><span>连读 / 弱读 / 失爆</span><span>{completedCount + (feedback ? 1 : 0)} / {connectedSpeechPhrases.length}</span></div>
        <h2>听自然语流，写出完整词组</h2><p>先听自然语速；需要时再听慢速，不显示文字提示。</p>
        <div className="phrase-audio-actions"><button className="audio-control" onClick={() => speak(phrase.phrase, .98)}><span>▶</span>自然语速</button><button className="audio-control" onClick={() => speak(phrase.phrase, .62)}>慢速拆听</button></div>
        <form className="typing-form" onSubmit={check}><input value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} placeholder="输入听到的完整词组…" aria-label="输入听到的完整词组" /><button type="submit">检查</button></form>
        <div className={`answer-feedback ${feedback?.tone ?? ""}`} aria-live="polite">{feedback?.text ?? "检查后显示完整词组、中文和语流现象。"}</div>
        {feedback && <div className="dictation-reveal phrase-reveal"><span>{phrase.feature}</span><strong>{phrase.phrase}</strong><p>{phrase.meaning}</p><small>{phrase.note}</small><button className={progress.notebook.some((entry) => entry.id === `word:${phrase.phrase.toLowerCase()}`) ? "inline-note-button is-saved" : "inline-note-button"} onClick={() => updateProgress((current) => toggleNotebookEntry(current, { id: `word:${phrase.phrase.toLowerCase()}`, kind: "word", title: phrase.phrase, detail: `${phrase.meaning}\n${phrase.note}`, source: `吞音词组 · ${phrase.feature}` }))}>{progress.notebook.some((entry) => entry.id === `word:${phrase.phrase.toLowerCase()}`) ? "★ 已加入笔记" : "☆ 加入笔记"}</button></div>}
        <div className="exercise-actions"><button className="secondary-action" disabled={!feedback} onClick={next}>{index === connectedSpeechPhrases.length - 1 ? "完成加练" : "下一个"} →</button></div>
      </div>
      <aside className="exercise-context"><span>听音重点</span><p>{feedback ? phrase.note : "不要尝试把每个词切开听。先抓重读词，再从弱读、连读和辅音变化中还原完整词组。"}</p><div className="context-stat"><strong>{connectedSpeechPhrases.length}</strong><span>真实场景高频词组</span></div></aside>
    </div>
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
  const dailyWords = useMemo(() => getDailyVocabulary(progress.dailyVocabularyDate), [progress.dailyVocabularyDate]);
  const total = dailyWords.length;
  const dailyWordSet = useMemo(() => new Set(dailyWords.map((item) => item.word)), [dailyWords]);
  const [queue, setQueue] = useState(() => dailyWords.filter((item) => !progress.dailyVocabularyKnown.includes(item.word)));
  const [pendingRating, setPendingRating] = useState<WordRating | null>(null);
  const knownCount = progress.dailyVocabularyKnown.filter((item) => dailyWordSet.has(item)).length;
  const finished = queue.length === 0;
  const word = queue[0];
  const wordNoteId = `word:${word?.word.toLowerCase()}`;
  const wordSaved = Boolean(word && progress.notebook.some((entry) => entry.id === wordNoteId));
  const fuzzyCount = dailyWords.filter((item) => progress.dailyVocabularyRatings[item.word] === "fuzzy").length;
  const unfamiliarCount = dailyWords.filter((item) => progress.dailyVocabularyRatings[item.word] === "unfamiliar").length;

  useEffect(() => {
    if (finished && !progress.dailyVocabularyCompleted) onComplete();
  }, [finished, onComplete, progress.dailyVocabularyCompleted]);

  const commitRating = (rating: WordRating) => {
    updateProgress((current) => {
      const next = {
        ...current,
        dailyVocabularySeen: Array.from(new Set([...current.dailyVocabularySeen, word.word])),
        dailyVocabularyKnown: rating === "known"
          ? Array.from(new Set([...current.dailyVocabularyKnown, word.word]))
          : current.dailyVocabularyKnown.filter((item) => item !== word.word),
        dailyVocabularyRatings: { ...current.dailyVocabularyRatings, [word.word]: rating },
        dailyVocabularyAttempts: { ...current.dailyVocabularyAttempts, [word.word]: (current.dailyVocabularyAttempts[word.word] ?? 0) + 1 },
        masteredWords: rating === "known" ? Array.from(new Set([...current.masteredWords, word.word])) : current.masteredWords,
      };
      return rating === "known" ? next : scheduleWordForReview(next, word.word, rating, 1);
    });

    setQueue((current) => {
      if (rating === "known") return current.slice(1);
      const repeatGap = rating === "unfamiliar" ? 3 : 7;
      const [currentWord, ...remaining] = current;
      const insertAt = Math.min(repeatGap, remaining.length);
      return [...remaining.slice(0, insertAt), currentWord, ...remaining.slice(insertAt)];
    });
    setPendingRating(null);
  };

  const continueRound = () => {
    if (pendingRating) commitRating(pendingRating);
  };

  if (finished) {
    return (
      <div className="daily-complete">
        <span className="daily-complete-mark">100</span>
        <div><p>DAILY VOCABULARY COMPLETE</p><h2>今天的 100 个词，已经全部眼熟。</h2>
          <span>全部达到“一眼认识” · 待复习词已按间隔计划保存</span>
        </div>
      </div>
    );
  }

  const round = Math.min(5, Math.floor(knownCount / 20) + 1);
  return (
    <div className="exercise-layout daily-vocabulary-layout">
      <div className="exercise-main daily-vocabulary-main">
        <div className="exercise-kicker"><span>每日 100 词 · 第 {round} 组</span><span>已确认 {knownCount} / {total}</span></div>
        <div className="word-rounds" aria-label={`已认识 ${knownCount} / ${total} 个词`}>
          {Array.from({ length: 5 }, (_, index) => {
            const completed = Math.max(0, Math.min(20, knownCount - index * 20));
            return <span key={index}><i style={{ width: `${completed * 5}%` }} /></span>;
          })}
        </div>
        <section className={`daily-word-card ${pendingRating ? "is-revealed" : ""}`}>
          <div><span className="word-source"><b>{word.category}</b><small>{word.source}</small></span><div className="word-card-tools"><button onClick={() => speak(word.word, .76)} aria-label={`播放 ${word.word} 的发音`}>▶ 发音</button><button className={wordSaved ? "is-saved" : ""} onClick={() => updateProgress((current) => toggleNotebookEntry(current, { id: wordNoteId, kind: "word", title: word.word, detail: `${word.meaning}\n${word.collocation}`, source: `${word.category} · ${word.source}` }))}>{wordSaved ? "★ 已加入笔记" : "☆ 加入笔记"}</button></div></div>
          <h2>{word.word}</h2>
          <p className="word-collocation">{pendingRating ? word.collocation : "看到单词后，凭第一反应选择熟悉程度"}</p>
          <div className="daily-word-answer" aria-live="polite">
            {pendingRating ? <strong>{word.meaning}</strong> : <span>本轮已出现 {progress.dailyVocabularyAttempts[word.word] ?? 0} 次</span>}
          </div>
        </section>
        {!pendingRating ? (
          <div className="word-rating-actions">
            <button onClick={() => setPendingRating("known")}><span>✓</span><strong>认识</strong><small>先核对中文含义</small></button>
            <button onClick={() => setPendingRating("fuzzy")}><span>≈</span><strong>模糊</strong><small>核对后再次出现</small></button>
            <button onClick={() => setPendingRating("unfamiliar")}><span>↺</span><strong>不熟悉</strong><small>核对后很快再现</small></button>
          </div>
        ) : pendingRating === "known" ? (
          <div className="word-confirm-actions">
            <button onClick={() => commitRating("unfamiliar")}>↺ 记错了 · 加入复习</button>
            <button onClick={() => commitRating("known")}>确认认识 · 下一个 →</button>
          </div>
        ) : (
          <button className="reveal-action" onClick={continueRound}>记住含义，继续本轮 →</button>
        )}
      </div>
      <aside className="exercise-context daily-vocabulary-context">
        <span>今天的目标</span>
        <strong>{knownCount}<small>/100</small></strong>
        <p>先核对中文含义再确认认识；若点了“记错了”，该词会回到本轮并进入遗忘曲线复习。</p>
        <div><b>{dailyVocabulary.length}</b><small>高频核心词库</small></div>
        <div><b>{fuzzyCount}</b><small>本轮模糊</small></div>
        <div><b>{unfamiliarCount}</b><small>本轮不熟悉</small></div>
        <div><b>{progress.reviewWords.length}</b><small>已进入间隔复习</small></div>
      </aside>
    </div>
  );
}

function ListeningPractice({ onComplete }: { onComplete: (score: number) => void }) {
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  const [choiceAnswers, setChoiceAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playerState, setPlayerState] = useState<"idle" | "playing" | "paused">("idle");
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const listeningAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => {
    listeningAudio.current?.pause();
  }, []);

  const toggleListening = () => {
    const audio = listeningAudio.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const restartListening = () => {
    const audio = listeningAudio.current;
    if (!audio) return;
    audio.currentTime = 0;
    setAudioTime(0);
    void audio.play();
  };

  const formatAudioTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

  const normalize = (value: string) => value.trim().toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ");
  const formCorrect = (id: string) => {
    const question = listeningExercise.formCompletion.find((item) => item.id === id);
    return question?.answers.includes(normalize(formAnswers[id] ?? "")) ?? false;
  };
  const answeredCount =
    listeningExercise.formCompletion.filter((question) => formAnswers[question.id]?.trim()).length +
    selectedFacilities.length +
    listeningExercise.matching.questions.filter((question) => matchingAnswers[question.id]).length +
    listeningExercise.multipleChoice.filter((question) => choiceAnswers[question.id]).length;

  const toggleFacility = (option: string) => {
    setScore(null);
    setSelectedFacilities((current) => current.includes(option)
      ? current.filter((item) => item !== option)
      : current.length < 2 ? [...current, option] : current);
  };

  const submit = () => {
    if (answeredCount < 10) return;
    const formScore = listeningExercise.formCompletion.filter((question) => formCorrect(question.id)).length;
    const facilityScore = selectedFacilities.filter((answer) => listeningExercise.multipleSelect.answers.includes(answer)).length;
    const matchingScore = listeningExercise.matching.questions.filter((question) => matchingAnswers[question.id] === question.answer).length;
    const choiceScore = listeningExercise.multipleChoice.filter((question) => choiceAnswers[question.id] === question.answer).length;
    const nextScore = formScore + facilityScore + matchingScore + choiceScore;
    setScore(nextScore);
    onComplete(nextScore);
  };

  return (
    <div className="exercise-layout listening-exam-layout">
      <div className="exercise-main listening-exam-main">
        <div className="exercise-kicker"><span>{listeningExercise.subtitle}</span><span>Questions 1–10</span></div>
        <h2>{listeningExercise.title}</h2><p>正式考试录音只播放一次；Demo 可以重播以便精听复盘。</p>
        <div className="listening-controls">
          <audio ref={listeningAudio} src="/listening-section-1.wav" preload="metadata" onLoadedMetadata={(event) => setAudioDuration(event.currentTarget.duration)} onTimeUpdate={(event) => setAudioTime(event.currentTarget.currentTime)} onPlay={() => setPlayerState("playing")} onPause={(event) => setPlayerState(event.currentTarget.currentTime === 0 || event.currentTarget.ended ? "idle" : "paused")} onEnded={() => setPlayerState("idle")}><track kind="captions" src="/listening-section-1.vtt" srcLang="en" label="English" /></audio>
          <div className={`listening-player is-${playerState}`}>
            <button className="listening-toggle" onClick={toggleListening} aria-label={playerState === "playing" ? "暂停录音" : "播放录音"}>{playerState === "playing" ? "Ⅱ" : "▶"}</button>
            <input className="listening-scrubber" type="range" min="0" max={Math.max(audioDuration, 1)} step="0.1" value={audioTime} onChange={(event) => { const nextTime = Number(event.target.value); if (listeningAudio.current) listeningAudio.current.currentTime = nextTime; setAudioTime(nextTime); }} aria-label="拖动听力录音进度" />
            <span className="listening-player-copy"><strong>{playerState === "playing" ? "正在播放" : playerState === "paused" ? "已暂停" : "播放完整录音"}</strong><small>{formatAudioTime(audioTime)} / {formatAudioTime(audioDuration)}</small></span>
          </div>
          <button className="listening-replay" disabled={audioTime === 0 && playerState === "idle"} onClick={restartListening}>↺ 从头重播</button>
        </div>
        <div className="listening-answer-progress"><i style={{ width: `${answeredCount * 10}%` }} /><span>{answeredCount}/10</span></div>

        <section className="listening-question-group">
          <div className="question-type"><span>Questions 1–4</span><strong>Form Completion</strong><p>Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.</p></div>
          <div className="listening-form-card">
            <h3>WESTBRIDGE RESIDENCE APPLICATION</h3>
            {listeningExercise.formCompletion.map((question, index) => (
              <label className={score === null ? "" : formCorrect(question.id) ? "is-correct" : "is-incorrect"} key={question.id}>
                <span>{index + 1}. {question.label}</span>
                <input value={formAnswers[question.id] ?? ""} onChange={(event) => { setScore(null); setFormAnswers((current) => ({ ...current, [question.id]: event.target.value })); }} aria-label={`Question ${index + 1}, ${question.label}`} />
              </label>
            ))}
          </div>
        </section>

        <section className="listening-question-group">
          <div className="question-type"><span>Questions 5–6</span><strong>Multiple Choice · Choose TWO</strong><p>{listeningExercise.multipleSelect.prompt}</p></div>
          <div className="listening-checkboxes">
            {listeningExercise.multipleSelect.options.map((option, index) => {
              const selected = selectedFacilities.includes(option);
              const resultClass = score === null ? "" : listeningExercise.multipleSelect.answers.includes(option) ? "is-correct" : selected ? "is-incorrect" : "";
              return <label className={`${selected ? "is-selected " : ""}${resultClass}`} key={option}><input type="checkbox" checked={selected} disabled={!selected && selectedFacilities.length >= 2} onChange={() => toggleFacility(option)} /><b>{String.fromCharCode(65 + index)}</b>{option}</label>;
            })}
          </div>
          <small className="selection-count">已选择 {selectedFacilities.length} / 2 项</small>
        </section>

        <section className="listening-question-group">
          <div className="question-type"><span>Questions 7–8</span><strong>Matching</strong><p>{listeningExercise.matching.prompt}</p></div>
          <div className="matching-option-bank">{listeningExercise.matching.options.map((option) => <span key={option.id}><b>{option.id}</b>{option.label}</span>)}</div>
          {listeningExercise.matching.questions.map((question, index) => {
            const resultClass = score === null ? "" : matchingAnswers[question.id] === question.answer ? "is-correct" : "is-incorrect";
            return <label className={`matching-row ${resultClass}`} key={question.id}><span>{index + 7}. {question.label}</span><select value={matchingAnswers[question.id] ?? ""} onChange={(event) => { setScore(null); setMatchingAnswers((current) => ({ ...current, [question.id]: event.target.value })); }} aria-label={`Question ${index + 7}`}><option value="">Select</option>{listeningExercise.matching.options.map((option) => <option value={option.id} key={option.id}>{option.id}</option>)}</select></label>;
          })}
        </section>

        <section className="listening-question-group">
          <div className="question-type"><span>Questions 9–10</span><strong>Multiple Choice · Choose ONE</strong><p>Choose the correct letter, A, B or C.</p></div>
          {listeningExercise.multipleChoice.map((question, index) => {
            const resultClass = score === null ? "" : choiceAnswers[question.id] === question.answer ? "is-correct" : "is-incorrect";
            return <fieldset className={`question-block ${resultClass}`} key={question.id}><legend>{index + 9}. {question.prompt}</legend>{question.options.map((option, optionIndex) => <label className={choiceAnswers[question.id] === option ? "is-selected" : ""} key={option}><input type="radio" name={question.id} value={option} checked={choiceAnswers[question.id] === option} onChange={() => { setScore(null); setChoiceAnswers((current) => ({ ...current, [question.id]: option })); }} /><b>{String.fromCharCode(65 + optionIndex)}</b><span>{option}</span></label>)}</fieldset>;
          })}
        </section>

        {score !== null && <div className={`answer-feedback ${score >= 8 ? "success" : "neutral"}`}>得分 {score} / 10。{score < 8 ? "建议打开原文，重点检查拼写、同义替换和转折后的信息。" : "细节定位和拼写表现良好。"}</div>}
        <div className="exercise-actions"><button className="text-action" onClick={() => setShowTranscript((current) => !current)}>{showTranscript ? "隐藏原文" : "查看原文复盘"}</button><button className="secondary-action" disabled={answeredCount < 10} onClick={submit}>提交 10 道答案 →</button></div>
      </div>
      <aside className="exercise-context transcript-panel listening-transcript"><span>听力原文</span><p>{showTranscript ? listeningExercise.script : "正式训练建议只听一次并完成全部答案。提交后再打开原文，标记没有听到的拼写和同义替换。"}</p></aside>
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
  const [showExaminerSubtitles, setShowExaminerSubtitles] = useState(false);
  const [speakingStarted, setSpeakingStarted] = useState(false);
  const [examinerAudioState, setExaminerAudioState] = useState<"idle" | "playing" | "paused">("idle");
  const examinerUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const [activeExaminerPrompt, setActiveExaminerPrompt] = useState(() => `${speakingScenario.opening} ${speakingScenario.questions[questionIndex]}`);

  useEffect(() => () => {
    if (examinerUtterance.current) {
      examinerUtterance.current.onend = null;
      examinerUtterance.current.onerror = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const playExaminerPrompt = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    if (examinerUtterance.current) {
      examinerUtterance.current.onend = null;
      examinerUtterance.current.onerror = null;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = .88;
    examinerUtterance.current = utterance;
    setExaminerAudioState("playing");
    utterance.onend = () => {
      if (examinerUtterance.current === utterance) {
        examinerUtterance.current = null;
        setExaminerAudioState("idle");
      }
    };
    utterance.onerror = utterance.onend;
    window.speechSynthesis.speak(utterance);
  };

  const toggleExaminerPause = () => {
    if (!("speechSynthesis" in window)) return;
    if (examinerAudioState === "playing") {
      window.speechSynthesis.pause();
      setExaminerAudioState("paused");
    } else if (examinerAudioState === "paused") {
      window.speechSynthesis.resume();
      setExaminerAudioState("playing");
    }
  };

  const startSpeaking = () => {
    setSpeakingStarted(true);
    setShowExaminerSubtitles(false);
    playExaminerPrompt(activeExaminerPrompt);
  };

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!speakingStarted || !text) return;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const hasDevelopment = /because|since|for example|for instance|however|although|whereas|therefore|so that/i.test(text);
    if (wordCount < 10) {
      const reply = "Could you explain that in a little more detail?";
      setMessages((current) => [...current, { from: "user", text }, { from: "ai", text: reply }]);
      setDraft("");
      setAnswerFeedback("回答偏短：Part 3 需要观点 + 原因，尽量再展开 2–3 句。");
      setActiveExaminerPrompt(reply);
      setShowExaminerSubtitles(false);
      playExaminerPrompt(reply);
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
    setActiveExaminerPrompt(reply);
    setShowExaminerSubtitles(false);
    playExaminerPrompt(reply);
    if (finished) onComplete();
  };

  const startMicrophone = () => {
    if (!speakingStarted) return;
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
        <div className="speaking-audio-controls">
          <button className={!speakingStarted ? "speaking-start" : ""} onClick={speakingStarted ? () => playExaminerPrompt(activeExaminerPrompt) : startSpeaking}>{speakingStarted ? "↺ 重听当前问题" : "▶ 开始口语模拟"}</button>
          <button disabled={examinerAudioState === "idle"} onClick={toggleExaminerPause}>{examinerAudioState === "paused" ? "▶ 继续播放" : "Ⅱ 暂停"}</button>
          <button disabled={!speakingStarted} onClick={() => setShowExaminerSubtitles((current) => !current)}>{showExaminerSubtitles ? "隐藏字幕" : "听不懂？显示字幕"}</button>
        </div>
        <div className="conversation" aria-live="polite">
          {messages.map((message, index) => <div className={`message ${message.from}`} key={`${message.from}-${index}`}><span>{message.from === "ai" ? "考官" : "你"}</span><p className={message.from === "ai" && !showExaminerSubtitles ? "examiner-subtitle-hidden" : ""}>{message.from === "ai" && !speakingStarted ? "点击“开始口语模拟”后，考官会用语音提问" : message.from === "ai" && !showExaminerSubtitles ? examinerAudioState === "paused" ? "⏸ 考官音频已暂停 · 字幕已隐藏" : "🔊 考官问题 · 字幕已隐藏" : message.text}</p></div>)}
        </div>
        <form className="speaking-form" onSubmit={send}><button disabled={!speakingStarted} type="button" className="mic-button" onClick={startMicrophone} aria-label="开始语音输入">●</button><input disabled={!speakingStarted} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={speakingStarted ? "用英语回答考官，尽量说明原因并举例…" : "请先点击开始口语模拟"} aria-label="口语回答" /><button disabled={!speakingStarted} type="submit">回答</button></form>
        <div className="mic-status" aria-live="polite">{micStatus || (speakingStarted ? "支持语音输入；也可以打字模拟回答。" : "点击开始后，考官会先读出问题。")}</div>
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
    if (answeredCount < totalQuestions) return;
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
  const [mode, setMode] = useState<"notebook" | "review">("notebook");
  const today = localDayKey();
  const reviewItems = progress.reviewWords.filter((item) => (progress.reviewSchedule[item]?.dueDate ?? today) <= today);
  const scheduledCount = progress.reviewWords.length - reviewItems.length;
  const wordNotes = progress.notebook.filter((entry) => entry.kind === "word").length;
  const questionNotes = progress.notebook.length - wordNotes;
  const rateItem = (item: string, rating: WordRating) => {
    updateProgress((current) => {
      const rated = rateReviewWord(current, item, rating);
      return rating === "unfamiliar"
        ? { ...rated, reviewWords: [...rated.reviewWords.filter((word) => word !== item), item] }
        : rated;
    });
  };
  return (
    <>
      <PageHeader eyebrow="MY NOTEBOOK" title="把不会的，留在" accent="自己的笔记里。" />
      <div className="review-mode-tabs" role="tablist" aria-label="笔记与复习">
        <button role="tab" aria-selected={mode === "notebook"} className={mode === "notebook" ? "is-active" : ""} onClick={() => setMode("notebook")}>我的笔记 <span>{progress.notebook.length}</span></button>
        <button role="tab" aria-selected={mode === "review"} className={mode === "review" ? "is-active" : ""} onClick={() => setMode("review")}>到期复习 <span>{reviewItems.length}</span></button>
      </div>
      {mode === "notebook" ? (
        <section className="notebook-section">
          <header className="notebook-summary"><div><span>PERSONAL KNOWLEDGE BASE</span><strong>{progress.notebook.length} 条笔记</strong><p>{wordNotes} 个词汇 · {questionNotes} 道题目</p></div><span className="notebook-mark" aria-hidden="true">✦</span></header>
          <div className="notebook-list">
            {progress.notebook.length === 0 ? (
              <div className="empty-state"><strong>笔记本还是空的</strong><p>在单词卡点击“加入笔记”，或在真题答题卡点击“标记”，内容就会保存在这里。</p></div>
            ) : progress.notebook.map((entry) => (
              <article className="notebook-entry" key={entry.id}>
                <header><span className={`notebook-kind ${entry.kind}`}>{entry.kind === "word" ? "词汇" : "错题"}</span><small>{entry.source}</small><button onClick={() => updateProgress((current) => ({ ...current, notebook: current.notebook.filter((item) => item.id !== entry.id) }))} aria-label={`删除笔记 ${entry.title}`}>删除</button></header>
                <div className="notebook-entry-body"><div><h2>{entry.title}</h2><p>{entry.detail}</p></div>{entry.kind === "word" && <button className="review-audio" onClick={() => speak(entry.title, .78)} aria-label={`播放 ${entry.title}`}>▶</button>}</div>
                <label><span>我的补充</span><textarea value={entry.note} placeholder="记录为什么容易错、同义替换或自己的例句……" onChange={(event) => {
                  const note = event.target.value;
                  updateProgress((current) => ({ ...current, notebook: current.notebook.map((item) => item.id === entry.id ? { ...item, note } : item) }));
                }} /></label>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="review-hero"><div><span>今日到期复习</span><strong>{reviewItems.length}</strong><p>{scheduledCount} 个词已安排在未来出现 · 间隔按 1、3、7、14、30、60 天递增</p></div><span className="review-loop" aria-hidden="true">↺</span></section>
          <div className="review-list">
        {reviewItems.length === 0 ? <div className="empty-state"><strong>今天没有到期内容</strong><p>{scheduledCount > 0 ? `${scheduledCount} 个词已按记忆间隔排到后续日期。` : "模糊、不熟悉和拼错的内容会自动进入这里。"}</p></div> : reviewItems.map((item) => {
          const word = vocabulary.find((entry) => entry.word === item) ?? dailyVocabulary.find((entry) => entry.word === item);
          const phrase = connectedSpeechPhrases.find((entry) => entry.phrase === item);
          const schedule = progress.reviewSchedule[item];
          const interval = reviewIntervals[Math.min(schedule?.stage ?? 0, reviewIntervals.length - 1)];
          return <article className="review-item" key={item}>
            <div className="review-word"><span>当前间隔 {interval} 天 · 遗忘 {schedule?.lapses ?? 0} 次</span><strong>{item}</strong><details><summary>查看释义</summary><small>{word?.meaning ?? phrase?.meaning ?? "场景词汇"}</small></details></div>
            <button className="review-audio" onClick={() => speak(item, phrase ? .95 : .75)} aria-label={`播放 ${item}`}>▶</button>
            <div className="review-rating-actions"><button onClick={() => rateItem(item, "known")}>认识</button><button onClick={() => rateItem(item, "fuzzy")}>模糊</button><button onClick={() => rateItem(item, "unfamiliar")}>不熟悉</button></div>
          </article>;
        })}
          </div>
        </>
      )}
    </>
  );
}

function ProfileView({ progress, percent, onReset }: { progress: LearningProgress; percent: number; onReset: () => void }) {
  const stats = useMemo(() => [
    ["今日完成度", `${percent}%`],
    ["今日词汇", `${progress.dailyVocabularyKnown.length} / 100`],
    ["累计学习", `${progress.minutes} 分钟`],
    ["待强化词汇", `${progress.reviewWords.length}`],
    ["我的笔记", `${progress.notebook.length}`],
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
