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
  recordAppStudyTime,
  recordStudyActivity,
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
type ElectronicWritingModel = {
  title: string;
  wordCount: number;
  paragraphs: string[];
  analysis: string[];
};
type WritingFeedback = {
  metrics: { label: string; value: string; tone: "good" | "watch" }[];
  strengths: string[];
  priorities: string[];
  annotations: WritingAnnotation[];
  ideaBank: { title: string; point: string; example: string }[];
};
type WritingAnnotation = {
  id: string;
  text: string;
  tone: "good" | "improve" | "neutral";
  label: string;
  reason: string;
  example: string;
};
type OfficialAnswer = {
  number: string;
  accepted: string[];
  displayAnswer: string;
  explanation?: string;
  choices?: string[];
  group?: string;
};
type ReadingSourceEvidence = {
  location: string;
  excerpt: string;
};
type SpeakingTopicTemplate = {
  title: string;
  steps: { label: string; prompt: string; example: string }[];
  usefulPhrases: string[];
};
type OfficialSpeakingPrompt = {
  examinerQuestion: string;
  supportingQuestions: string[];
  cuePoints?: string[];
  preparationSeconds: number;
  targetSeconds: number;
  examNote: string;
  topicTemplate: SpeakingTopicTemplate;
};
type OfficialTaskSegment = {
  id: string;
  label: string;
  questionLabel: string;
  questionPage: number;
  questionPages?: number[];
  passagePages?: number[];
  answerPage?: number;
  answerPages?: number[];
  transcriptPage?: number;
  transcriptPages?: number[];
  audioTrackIndex?: number;
  answerLabel?: string;
  minimumWords?: number;
  electronicModel?: ElectronicWritingModel;
  speakingPrompt?: OfficialSpeakingPrompt;
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
    { id: "form-completion", label: "Form Completion", questionLabel: "Questions 1–8", questionPage: 3, questionPages: [3], transcriptPage: 4, transcriptPages: [4, 5, 6], answerPage: 7, audioTrackIndex: 0, answers: [
      { number: "1", accepted: ["Mkere"], displayAnswer: "Mkere" },
      { number: "2", accepted: ["Westall"], displayAnswer: "Westall" },
      { number: "3", accepted: ["BS8 9PU"], displayAnswer: "BS8 9PU" },
      { number: "4", accepted: ["0.75 m", "0.75 metre", "0.75 metres", "0.75 meter", "0.75 meters", "three quarters of a metre", "three quarters of a meter", "75 cm", "75 cms"], displayAnswer: "0.75 m / 75 cm" },
      { number: "5", accepted: ["0.5 m", "0.5 metre", "0.5 metres", "0.5 meter", "0.5 meters", "half a metre", "half a meter", "50 cm", "50 cms"], displayAnswer: "0.5 m / 50 cm" },
      { number: "6", accepted: ["books", "toys"], displayAnswer: "books / toys（顺序不限）", group: "6-7" },
      { number: "7", accepted: ["books", "toys"], displayAnswer: "books / toys（顺序不限）", group: "6-7" },
      { number: "8", accepted: ["1,700", "1700"], displayAnswer: "1,700" },
    ] },
    { id: "multiple-choice", label: "Multiple Choice", questionLabel: "Questions 9–10", questionPage: 8, questionPages: [8], transcriptPage: 9, transcriptPages: [9], answerPage: 10, audioTrackIndex: 1, answers: [
      { number: "9", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C"] },
      { number: "10", accepted: ["A"], displayAnswer: "A", choices: ["A", "B", "C"] },
    ] },
    { id: "short-answer", label: "Short-answer Questions", questionLabel: "Questions 11–16", questionPage: 11, questionPages: [11], transcriptPage: 12, transcriptPages: [12], answerPage: 13, audioTrackIndex: 2, answers: [
      { number: "11", accepted: ["language", "customs"], displayAnswer: "language / customs（顺序不限）", group: "11-12" },
      { number: "12", accepted: ["language", "customs"], displayAnswer: "language / customs（顺序不限）", group: "11-12" },
      { number: "13", accepted: ["music", "music groups", "local history", "local history groups"], displayAnswer: "music (groups) / local history (groups)（顺序不限）", group: "13-14" },
      { number: "14", accepted: ["music", "music groups", "local history", "local history groups"], displayAnswer: "music (groups) / local history (groups)（顺序不限）", group: "13-14" },
      { number: "15", accepted: ["library", "libraries", "public library", "public libraries", "town hall"], displayAnswer: "(public) library / town hall（顺序不限）", group: "15-16" },
      { number: "16", accepted: ["library", "libraries", "public library", "public libraries", "town hall"], displayAnswer: "(public) library / town hall（顺序不限）", group: "15-16" },
    ] },
    { id: "sentence-completion", label: "Sentence Completion", questionLabel: "Questions 27–30", questionPage: 14, questionPages: [14], transcriptPage: 15, transcriptPages: [15, 16], answerPage: 17, audioTrackIndex: 3, answers: [
      { number: "27", accepted: ["motivation"], displayAnswer: "motivation" },
      { number: "28", accepted: ["time management", "time-management"], displayAnswer: "time-management" },
      { number: "29", accepted: ["modules"], displayAnswer: "modules" },
      { number: "30", accepted: ["summer school", "summer schools"], displayAnswer: "summer school(s)" },
    ] },
    { id: "matching-one", label: "Matching 1", questionLabel: "Questions 21–25", questionPage: 18, questionPages: [18], transcriptPage: 19, transcriptPages: [19, 20], answerPage: 21, audioTrackIndex: 4, answers: [
      { number: "21", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C"] }, { number: "22", accepted: ["A"], displayAnswer: "A", choices: ["A", "B", "C"] }, { number: "23", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C"] }, { number: "24", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C"] }, { number: "25", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C"] },
    ] },
    { id: "matching-two", label: "Matching 2", questionLabel: "Questions 1–4", questionPage: 22, questionPages: [22], transcriptPage: 23, transcriptPages: [23, 24], answerPage: 25, audioTrackIndex: 5, answers: [
      { number: "1", accepted: ["E"], displayAnswer: "E", choices: ["A", "B", "C", "D", "E"] }, { number: "2", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C", "D", "E"] }, { number: "3", accepted: ["C"], displayAnswer: "C", choices: ["A", "B", "C", "D", "E"] }, { number: "4", accepted: ["A"], displayAnswer: "A", choices: ["A", "B", "C", "D", "E"] },
    ] },
    { id: "map-labelling", label: "Map Labelling", questionLabel: "Questions 11–15", questionPage: 26, questionPages: [26], transcriptPage: 27, transcriptPages: [27], answerPage: 28, audioTrackIndex: 6, answers: [
      { number: "11", accepted: ["H"], displayAnswer: "H", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] }, { number: "12", accepted: ["G"], displayAnswer: "G", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] }, { number: "13", accepted: ["D"], displayAnswer: "D", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] }, { number: "14", accepted: ["B"], displayAnswer: "B", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] }, { number: "15", accepted: ["F"], displayAnswer: "F", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
    ] },
    { id: "note-completion", label: "Note Completion", questionLabel: "Questions 11–20", questionPage: 29, questionPages: [29, 30], transcriptPage: 31, transcriptPages: [31, 32], answerPage: 33, audioTrackIndex: 7, answers: [
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
    { id: "reading-passage-1", label: "Reading Passage 1", questionLabel: "Passage 1 · Questions 1–13", questionPage: 4, questionPages: [4, 5, 6], passagePages: [2, 3, 4], answers: [
      { number: "1", accepted: ["FALSE"], displayAnswer: "FALSE", explanation: "首段说动物界很少会首先进入工程师的考虑范围，与题干的 often the first place 相反。", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "2", accepted: ["TRUE"], displayAnswer: "TRUE", explanation: "首段明确举例：蜘蛛丝比钢更强，并已用于防弹衣，对应 specialist clothing。", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "3", accepted: ["NOT GIVEN"], displayAnswer: "NOT GIVEN", explanation: "原文只说渔民知道沙蚕会咬人，没有比较北大西洋沙蚕数量是否增加。", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "4", accepted: ["TRUE"], displayAnswer: "TRUE", explanation: "原文称 jaws 是 otherwise squishy animal 唯一坚硬的部分，因此身体其余部分柔软。", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "5", accepted: ["TRUE"], displayAnswer: "TRUE", explanation: "原文说沙蚕颚的硬度 exceeds the hardness of many synthetic plastics。", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "6", accepted: ["FALSE"], displayAnswer: "FALSE", explanation: "洁净水域中的沙蚕颚也含有相近数量的锌，并不是更少。", choices: ["TRUE", "FALSE", "NOT GIVEN"] },
      { number: "7", accepted: ["light"], displayAnswer: "light", explanation: "研究发现这种材料 as strong as aluminium and impressively light；题目要求原文一个词。" },
      { number: "8", accepted: ["shells"], displayAnswer: "shells", explanation: "原文以 shells 为其他高度矿化的坚硬生物结构示例。" },
      { number: "9", accepted: ["mineralisation", "mineralization"], displayAnswer: "mineralisation / mineralization", explanation: "X-ray 检测 found no sign of mineralisation at all，对应 no … had taken place。" },
      { number: "10", accepted: ["histidine"], displayAnswer: "histidine", explanation: "原文指出蛋白质中大量存在的氨基酸叫 histidine。" },
      { number: "11", accepted: ["gills"], displayAnswer: "gills", explanation: "沙蚕靠身体两侧像腿一样工作的微小结构移动，而这些结构实际上是 gills。" },
      { number: "12", accepted: ["fangs"], displayAnswer: "fangs", explanation: "原文说头部前方的 curved fangs 用来捕捉并撕碎猎物。" },
      { number: "13", accepted: ["aircraft"], displayAnswer: "aircraft", explanation: "这种轻而坚固的材料尤其适合 aircraft，研究因此被交给 NASA 继续开发。" },
    ] },
    { id: "reading-passage-2", label: "Reading Passage 2", questionLabel: "Passage 2 · Questions 14–26", questionPage: 7, questionPages: [7, 8, 9, 10], passagePages: [5, 6, 7, 8], answers: [
      { number: "14", accepted: ["YES"], displayAnswer: "YES", explanation: "开篇把考古学描述为科学分析工作，也包括 creative imagination，完全支持题干。", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "15", accepted: ["NOT GIVEN"], displayAnswer: "NOT GIVEN", explanation: "文章讨论考古工作的范围，但没有说考古学家必须翻译古代语言。", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "16", accepted: ["NO"], displayAnswer: "NO", explanation: "作者说影视中的考古形象 may be far from reality，因此并非真实写照。", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "17", accepted: ["NOT GIVEN"], displayAnswer: "NOT GIVEN", explanation: "文章解释考古学与人类学的关系，没有比较哪一门更困难。", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "18", accepted: ["NO"], displayAnswer: "NO", explanation: "约公元前 3000 年开始的是西亚的书面记录；世界其他多数地区更晚，题干把范围扩大了。", choices: ["YES", "NO", "NOT GIVEN"] },
      { number: "19", accepted: ["D", "E"], displayAnswer: "D / E（顺序不限）", explanation: "D：人类学因范围广而被分成三个分支；E：体质人类学研究人类身体特征及其演化。", choices: ["A", "B", "C", "D", "E"], group: "19-20" },
      { number: "20", accepted: ["D", "E"], displayAnswer: "D / E（顺序不限）", explanation: "本题与 Q19 为双选组合，D 和 E 都在原文中被明确陈述，顺序不限且不能重复。", choices: ["A", "B", "C", "D", "E"], group: "19-20" },
      { number: "21", accepted: ["C", "D"], displayAnswer: "C / D（顺序不限）", explanation: "C 对应研究住宅为何有圆形或方形；D 对应研究社会如何制作和使用物质文化。", choices: ["A", "B", "C", "D", "E"], group: "21-22" },
      { number: "22", accepted: ["C", "D"], displayAnswer: "C / D（顺序不限）", explanation: "本题与 Q21 为双选组合；原文只直接提到 C、D 两项任务，顺序不限且不能重复。", choices: ["A", "B", "C", "D", "E"], group: "21-22" },
      { number: "23", accepted: ["oral histories"], displayAnswer: "oral histories", explanation: "原文说书面记录之外，oral histories 也包含有用信息；题目要求不超过两个词。" },
      { number: "24", accepted: ["humanistic study", "historical discipline"], displayAnswer: "humanistic study / historical discipline（顺序不限）", explanation: "末段把考古学同时定义为 a humanistic study 和 a historical discipline。", group: "24-25" },
      { number: "25", accepted: ["humanistic study", "historical discipline"], displayAnswer: "humanistic study / historical discipline（顺序不限）", explanation: "本题与 Q24 为成组填空，两个原文短语可以交换顺序，但不能重复。", group: "24-25" },
      { number: "26", accepted: ["scientist"], displayAnswer: "scientist", explanation: "作者将考古学家的工作方式比作收集数据、检验假设并建立模型的 scientist。" },
    ] },
    { id: "reading-passage-3", label: "Reading Passage 3", questionLabel: "Passage 3 · Questions 27–40", questionPage: 11, questionPages: [11, 12, 13, 14], passagePages: [9, 10, 11, 12], answers: [
      { number: "27", accepted: ["B"], displayAnswer: "B", explanation: "Jocelyn Penna 强调既要设定具体目标，也要考虑通往目标的一系列较小成功。", choices: ["A", "B", "C", "D"] },
      { number: "28", accepted: ["B"], displayAnswer: "B", explanation: "Penna 建议在挑战前告诉自己已经计划并尽了最大努力，对应充分准备带来成功。", choices: ["A", "B", "C", "D"] },
      { number: "29", accepted: ["A"], displayAnswer: "A", explanation: "Gavin Freeman 把人分为 motivated to succeed 与 motivated to avoid failure 两类。", choices: ["A", "B", "C", "D"] },
      { number: "30", accepted: ["C"], displayAnswer: "C", explanation: "Clark Perry 认为人要训练自己不害怕失败，直接对应面对对失败的恐惧。", choices: ["A", "B", "C", "D"] },
      { number: "31", accepted: ["A"], displayAnswer: "A", explanation: "Freeman 说逃避失败的人会选择没有挑战、保证成功的情境。", choices: ["A", "B", "C", "D"] },
      { number: "32", accepted: ["D"], displayAnswer: "D", explanation: "Jeff Bond 说高成就者会主动创造机会，并接触能帮助自己发挥潜力的训练、人员和材料。", choices: ["A", "B", "C", "D"] },
      { number: "33", accepted: ["C"], displayAnswer: "C", explanation: "Perry 的 centred breathing 要求人专注当前时刻，而不是接下来要做什么。", choices: ["A", "B", "C", "D"] },
      { number: "34", accepted: ["B"], displayAnswer: "B", explanation: "B 段用滑雪运动员 Alisa Camplin 膝伤后积极调整训练的经历说明这一点。", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
      { number: "35", accepted: ["G"], displayAnswer: "G", explanation: "G 段直接出现 losing streaks，并解释它指连续不顺的时期。", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
      { number: "36", accepted: ["E"], displayAnswer: "E", explanation: "E 段依次给出识别内心对话、找出触发情境、设计提示词或动作三个步骤。", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
      { number: "37", accepted: ["F"], displayAnswer: "F", explanation: "F 段列举求职面试、绩效评估和第一次约会造成的紧张生理反应。", choices: ["A", "B", "C", "D", "E", "F", "G", "H"] },
      { number: "38", accepted: ["B", "C"], displayAnswer: "B / C（顺序不限）", explanation: "B：长期保持动力非常困难；C：属于追求成功或逃避失败的类型会深刻影响成功机会。", choices: ["A", "B", "C", "D", "E"], group: "38-39" },
      { number: "39", accepted: ["B", "C"], displayAnswer: "B / C（顺序不限）", explanation: "本题与 Q38 为双选组合；Gavin Freeman 明确表达的是 B、C，顺序不限且不能重复。", choices: ["A", "B", "C", "D", "E"], group: "38-39" },
      { number: "40", accepted: ["C"], displayAnswer: "C", explanation: "全文由多位运动心理学家说明普通人能从顶尖运动员的思维中学到什么，C 最能概括主旨。", choices: ["A", "B", "C", "D"] },
    ] },
  ],
};
const readingSourceEvidence: Record<string, ReadingSourceEvidence> = {
  "reading-passage-1:1": { location: "第 1 段，第 1–3 行 · 官方文章册 P2", excerpt: "When it comes to looking for advanced engineering materials, the animal kingdom rarely comes to mind." },
  "reading-passage-1:2": { location: "第 1 段，第 5–7 行 · 官方文章册 P2", excerpt: "Spider-silk, for example, is stronger than steel, and is now finding its way into bulletproof jackets." },
  "reading-passage-1:3": { location: "第 2 段，第 8–11 行 · 官方文章册 P2", excerpt: "NEREIS VIRENS, also known as the sandworm or ragworm, is a burrowing marine worm found in shallow waters in the North Atlantic region." },
  "reading-passage-1:4": { location: "第 2 段，第 11–13 行 · 官方文章册 P2", excerpt: "Dr Broomell and Dr Waite were curious about the composition of the only hard parts of an otherwise squishy animal." },
  "reading-passage-1:5": { location: "第 2 段，第 13–15 行 · 官方文章册 P2", excerpt: "the remarkable toughness of its jaws, which rivals that of human teeth and exceeds the hardness of many synthetic plastics" },
  "reading-passage-1:6": { location: "第 4 段，第 1–4 行 · 官方文章册 P3", excerpt: "the jaws of worms from clean water, too, were stuffed with similar quantities of zinc" },
  "reading-passage-1:7": { location: "第 5 段，第 1–5 行 · 官方文章册 P3", excerpt: "This revealed that the material from which they are made is as strong as aluminium and impressively light." },
  "reading-passage-1:8": { location: "第 5 段，第 5–7 行 · 官方文章册 P3", excerpt: "Most strong biological structures of this sort, such as shells, are highly mineralised." },
  "reading-passage-1:9": { location: "第 5 段，第 12–14 行 · 官方文章册 P3", excerpt: "when Dr Broomell and Dr Waite stuck ragworm jaws in an X-ray spectroscope they found no sign of mineralisation at all" },
  "reading-passage-1:10": { location: "第 7 段，第 1–4 行 · 官方文章册 P4", excerpt: "The protein in question contains a lot of an amino acid called histidine." },
  "reading-passage-1:11": { location: "第 6 段，第 5–8 行 · 官方文章册 P4", excerpt: "tiny structures along the sides of their bodies that work like legs, but are in fact gills" },
  "reading-passage-1:12": { location: "第 6 段，第 8–10 行 · 官方文章册 P4", excerpt: "At the front of their bulbous blue heads they have curved fangs that they use to capture and tear apart their crustaceous prey." },
  "reading-passage-1:13": { location: "第 8 段，第 1–4 行 · 官方文章册 P4", excerpt: "These qualities are a desirable combination in an engineering material – and particularly so in those materials used in aircraft." },
  "reading-passage-2:14": { location: "第 1 段，第 1–3 行 · 官方文章册 P5", excerpt: "Archaeology is partly the discovery of the treasures of the past, partly the careful work of the scientific analyst, partly the exercise of the creative imagination." },
  "reading-passage-2:15": { location: "第 1 段，第 6–10 行 · 官方文章册 P5 · NOT GIVEN 核验范围", excerpt: "But it is also the painstaking task of interpretation, so that we come to understand what these things mean for the human story." },
  "reading-passage-2:16": { location: "第 2 段，第 5–8 行 · 官方文章册 P5", excerpt: "However far from reality such portrayals are, they capture the essential truth that archaeology is an exciting quest" },
  "reading-passage-2:17": { location: "第 3–5 段 · 官方文章册 P5–P6 · NOT GIVEN 核验范围", excerpt: "But how does archaeology relate to disciplines such as anthropology and history that are also concerned with the human story?" },
  "reading-passage-2:18": { location: "第 8 段，第 7–10 行 · 官方文章册 P7", excerpt: "written records around 3000 BC in Western Asia, and much later in most other parts of the world" },
  "reading-passage-2:19": { location: "第 4 段，第 9–12 行；第 5 段，第 1–4 行 · 官方文章册 P6", excerpt: "Anthropology is thus a broad discipline – so broad that it is generally broken down into three smaller disciplines ... Physical anthropology ... concerns the study of human biological or physical characteristics and how they evolved." },
  "reading-passage-2:20": { location: "第 4 段，第 9–12 行；第 5 段，第 1–4 行 · 官方文章册 P6", excerpt: "Anthropology is thus a broad discipline – so broad that it is generally broken down into three smaller disciplines ... Physical anthropology ... concerns the study of human biological or physical characteristics and how they evolved." },
  "reading-passage-2:21": { location: "第 7 段，第 1–9 行 · 官方文章册 P7", excerpt: "Why are some dwellings round and others square? ... learning how such societies use material culture – how they make their tools and weapons, why they build their settlements where they do" },
  "reading-passage-2:22": { location: "第 7 段，第 1–9 行 · 官方文章册 P7", excerpt: "Why are some dwellings round and others square? ... learning how such societies use material culture – how they make their tools and weapons, why they build their settlements where they do" },
  "reading-passage-2:23": { location: "第 9 段，第 6–8 行 · 官方文章册 P8", excerpt: "in no way lessens the importance of the useful information contained in oral histories" },
  "reading-passage-2:24": { location: "第 10 段，第 1–3 行 · 官方文章册 P8", excerpt: "Since the aim of archaeology is the understanding of humankind, it is a humanistic study, and since it deals with the human past, it is a historical discipline." },
  "reading-passage-2:25": { location: "第 10 段，第 1–3 行 · 官方文章册 P8", excerpt: "Since the aim of archaeology is the understanding of humankind, it is a humanistic study, and since it deals with the human past, it is a historical discipline." },
  "reading-passage-2:26": { location: "第 10 段，第 8–13 行 · 官方文章册 P8", excerpt: "the practice of the archaeologist is rather like that of the scientist who collects data, conducts experiments, formulates a hypothesis, tests the hypothesis against more data" },
  "reading-passage-3:27": { location: "E 段，第 5–8 行 · 官方文章册 P11", excerpt: "It's important to have specific goals ... you need to think about the series of smaller triumphs which will get you there." },
  "reading-passage-3:28": { location: "D 段，第 7–10 行 · 官方文章册 P10", excerpt: "When approaching an event, you need to say, ‘I've planned for this, and I've tried my best.’" },
  "reading-passage-3:29": { location: "B 段，第 9–12 行 · 官方文章册 P9", excerpt: "Freeman believes that we all fall into one of two categories: those motivated to succeed and those motivated to avoid failure." },
  "reading-passage-3:30": { location: "F 段，第 10–14 行 · 官方文章册 P11", excerpt: "Perry believes we need to train ourselves not to be afraid of failure." },
  "reading-passage-3:31": { location: "C 段，第 1–6 行 · 官方文章册 P10", excerpt: "those motivated to avoid failure ... put themselves in non-challenging situations where they're guaranteed success" },
  "reading-passage-3:32": { location: "G 段，第 9–13 行 · 官方文章册 P12", excerpt: "High achievers create opportunities. They expose themselves to the training, the people and the materials that help them reach their potential." },
  "reading-passage-3:33": { location: "F 段，第 6–9 行 · 官方文章册 P11", excerpt: "The technique of centred breathing makes you concentrate on the rise and fall of your breath. Focus on the present moment" },
  "reading-passage-3:34": { location: "B 段，第 13–16 行 · 官方文章册 P9–P10", excerpt: "Australian skier Alisa Camplin tore a knee ligament four months before the Winter Olympics: rather than give up, she redirected her amazing ability to concentrate" },
  "reading-passage-3:35": { location: "G 段，第 1–3 行 · 官方文章册 P11", excerpt: "Sometimes when things go continuously awry, they are known in sport as ‘losing streaks’." },
  "reading-passage-3:36": { location: "E 段，第 1–6 行 · 官方文章册 P10–P11", excerpt: "First, identify what your internal dialogue is saying ... take note of the external situations ... Thirdly, come up with cue words or actions" },
  "reading-passage-3:37": { location: "F 段，第 1–4 行 · 官方文章册 P11", excerpt: "Job interviews, performance reviews and even first dates can all create stomach-churning tension." },
  "reading-passage-3:38": { location: "B 段，第 8–13 行 · 官方文章册 P9", excerpt: "Maintaining motivation is one of the most difficult long-term tasks we face ... The type we are has a profound impact on how we approach challenges and our chances of success." },
  "reading-passage-3:39": { location: "B 段，第 8–13 行 · 官方文章册 P9", excerpt: "Maintaining motivation is one of the most difficult long-term tasks we face ... The type we are has a profound impact on how we approach challenges and our chances of success." },
  "reading-passage-3:40": { location: "A 段，第 1–6 行；B 段，第 1–3 行 · 官方文章册 P9", excerpt: "our lives and those of elite sporting champions are not without parallel ... The psychological tools used to develop personal drive and self-belief to record levels can be applied effectively to ordinary situations." },
};
const writingMaterial: OfficialTestMaterial = {
  id: "writing",
  label: "Academic Writing · Task 1 + Task 2",
  pdfUrl: "https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf",
  tasks: [
    { id: "task-1a", label: "Writing Task 1", questionLabel: "Task 1 · Visual information", questionPage: 3, questionPages: [3], answerPage: 9, answerLabel: "查看本 Task 电子范文与解析", minimumWords: 150, electronicModel: {
      title: "Further education in Britain",
      wordCount: 184,
      paragraphs: [
        "The bar chart compares the numbers of men and women in Britain who participated in further education on either a full-time or part-time basis in 1970/71, 1980/81 and 1990/91. Figures are given in thousands.",
        "Overall, part-time study was considerably more common than full-time education throughout the period. Male participation in part-time courses fell and then recovered slightly, whereas the corresponding figure for women rose steadily and eventually became the highest total shown. Full-time enrolments increased for both sexes.",
        "In 1970/71, about one million men studied part-time, compared with roughly 700,000 women. The male figure declined to around 850,000 in 1980/81 before edging up to approximately 900,000 by 1990/91. By contrast, the number of female part-time students climbed from about 700,000 to just over 800,000, then reached approximately 1.1 million in the final period.",
        "Full-time participation was much lower. The number of men rose from around 100,000 in 1970/71 to about 150,000 ten years later and roughly 250,000 in 1990/91. For women, the increase was more pronounced, from only about 50,000 at the beginning to around 200,000 in 1980/81 and approximately 250,000 by the end.",
      ],
      analysis: [
        "四段结构：改写题目 → 总览 → 男性数据 → 女性及全日制数据。",
        "总览只抓两条主趋势：非全日制始终占多数；女性参与人数增长更明显。",
        "数据使用 about、roughly、approximately，避免把图表估值写成绝对精确数字。",
        "关键比较表达：whereas、by contrast、compared with、the corresponding figure。",
      ],
    } },
    { id: "task-2a", label: "Writing Task 2", questionLabel: "Task 2 · Essay", questionPage: 6, questionPages: [6], answerPage: 18, answerLabel: "查看本 Task 电子范文与解析", minimumWords: 250, electronicModel: {
      title: "Family income and preparation for adult life",
      wordCount: 295,
      paragraphs: [
        "It is sometimes argued that children from low-income families are better equipped to handle adult difficulties than those raised by wealthy parents. Although financial constraints can teach useful lessons, I do not agree that a family's income alone determines how well a child is prepared for later life.",
        "There are clear reasons why growing up with limited money may encourage practical strengths. Children in such households often learn that resources are finite, so they may become careful consumers and understand the importance of saving. They may also be expected to contribute at home or take part-time work when they are older. These experiences can develop independence, patience and resilience. For example, a teenager who has to budget a small weekly allowance is likely to understand the consequences of unnecessary spending earlier than someone whose purchases are always funded by parents.",
        "However, wealth does not inevitably produce dependence or poor judgement. Affluent parents can deliberately give their children responsibilities, require them to manage an allowance and allow them to experience the consequences of mistakes. In addition, greater financial resources may provide access to education, travel and extracurricular activities that build confidence, communication skills and problem-solving ability. Conversely, poverty can sometimes make preparation for adulthood harder: persistent financial stress may disrupt education, reduce access to opportunities and force young people to focus on immediate survival rather than long-term development.",
        "In my view, parenting and experience are more influential than income itself. Children from any economic background can become capable adults if they are given age-appropriate responsibilities, encouraged to solve problems independently and protected from neither effort nor failure. Therefore, while a modest upbringing may offer valuable lessons about money and resilience, it does not automatically prepare a person for adult life better than a wealthy upbringing does.",
      ],
      analysis: [
        "立场在引言和结论中保持一致：承认贫困可能培养能力，但反对收入决定论。",
        "主体一解释支持题干的理由；主体二反驳绝对化结论，并讨论贫困可能带来的负面影响。",
        "每个观点都包含解释或例子，符合 Task Response 对论证展开的要求。",
        "可借鉴表达：financial constraints、resources are finite、age-appropriate responsibilities、does not inevitably。",
      ],
    } },
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
    { id: "part-1", label: "Part 1 · Introduction and interview", questionLabel: "Part 1 · Home town", questionPage: 3, audioTrackIndex: 0, speakingPrompt: {
      examinerQuestion: "Let's talk about your home town or village. What kind of place is it?",
      supportingQuestions: [
        "What's the most interesting part of your town or village?",
        "What kind of jobs do the people in your town or village do?",
        "Would you say it's a good place to live? Why?",
        "Tell me about the kind of accommodation you live in.",
      ],
      preparationSeconds: 60,
      targetSeconds: 35,
      examNote: "正式 Part 1 通常需要直接回答，没有固定准备时间；这里的 60 秒是 App 强化训练模式。",
      topicTemplate: {
        title: "Part 1 · 直接回答 — 细节 — 感受",
        steps: [
          { label: "1 · Direct answer", prompt: "先用一句话直接回答地点和类型。", example: "I come from a medium-sized coastal city in southern China." },
          { label: "2 · Specific detail", prompt: "补充一个可见、可感受的具体特点。", example: "It is best known for its long waterfront and a fairly relaxed pace of life." },
          { label: "3 · Personal feeling", prompt: "说明这个特点对你的影响。", example: "What I like most is that I can get away from the busy centre within a few minutes." },
        ],
        usefulPhrases: ["It is best known for…", "What stands out is…", "The thing I like most is…", "Compared with larger cities…"],
      },
    } },
    { id: "part-2", label: "Part 2 · Individual long turn", questionLabel: "Part 2 · An important possession", questionPage: 5, audioTrackIndex: 1, speakingPrompt: {
      examinerQuestion: "Describe something you own which is very important to you.",
      supportingQuestions: ["Is it valuable in terms of money?", "Would it be easy to replace?"],
      cuePoints: ["where you got it from", "how long you have had it", "what you use it for", "and explain why it is important to you"],
      preparationSeconds: 60,
      targetSeconds: 100,
      examNote: "正式 Part 2 会给 1 分钟准备，并要求连续陈述 1–2 分钟；本训练与正式流程一致。",
      topicTemplate: {
        title: "Part 2 · 物品故事五步法",
        steps: [
          { label: "1 · Identify", prompt: "点明物品并给它一个鲜明特征。", example: "The possession I'd like to talk about is an old digital camera that I still use." },
          { label: "2 · Origin", prompt: "交代来源、时间和当时的情境。", example: "My father gave it to me before my first solo trip, about six years ago." },
          { label: "3 · Use", prompt: "描述你怎样使用它，加入一次具体经历。", example: "I used it to photograph a sunrise during that trip, and the picture is still on my desk." },
          { label: "4 · Meaning", prompt: "从实用价值转向情感意义。", example: "It matters to me because it represents both his trust and my growing independence." },
          { label: "5 · Reflection", prompt: "用现在与未来收尾。", example: "Even though my phone is more convenient, I would never replace it voluntarily." },
        ],
        usefulPhrases: ["I'd like to talk about…", "What makes it irreplaceable is…", "It reminds me of…", "From a practical point of view…"],
      },
    } },
    { id: "part-3", label: "Part 3 · Two-way discussion", questionLabel: "Part 3 · Status and values", questionPage: 6, audioTrackIndex: 2, speakingPrompt: {
      examinerQuestion: "What kind of things give status to people in your country?",
      supportingQuestions: ["Have things changed since your parents' time?", "Do you think advertising influences what people buy?"],
      preparationSeconds: 60,
      targetSeconds: 55,
      examNote: "正式 Part 3 是即时双向讨论，没有固定准备时间；这里的 60 秒用于训练观点组织。",
      topicTemplate: {
        title: "Part 3 · 观点 — 原因 — 例子 — 限定",
        steps: [
          { label: "1 · Position", prompt: "先给清晰但不过度绝对的观点。", example: "In many cases, visible signs of wealth still give people status." },
          { label: "2 · Reason", prompt: "解释背后的社会或心理原因。", example: "This is partly because expensive goods are an easy way to signal success to strangers." },
          { label: "3 · Example", prompt: "给出国家、群体或代际层面的例子。", example: "For instance, luxury cars and designer labels are often displayed on social media." },
          { label: "4 · Qualification", prompt: "加入例外、变化或另一面。", example: "That said, younger people also admire expertise, creativity and social influence." },
        ],
        usefulPhrases: ["In many cases…", "This is largely because…", "A clear example would be…", "That said…", "Over time, this may change because…"],
      },
    } },
  ],
};

const officialTestSchedule: OfficialTestSession[] = [
  { id: "reading", isoDay: 2, dayLabel: "周二", time: "20:00", title: "Official Academic Reading Full Sample Test", duration: "60 分钟", durationMinutes: 60, source: "IELTS.org 官方完整样题", setCode: "IELTS-OFFICIAL-AR-MLP-01", description: "完整 3 篇 Academic Reading，题号从 1 连续到 40；全部填写并提交后自动记录完成。", materials: [readingMaterial] },
  { id: "listening", isoDay: 4, dayLabel: "周四", time: "20:00", title: "Official Listening Sample Tasks 2023", duration: "40 分钟", durationMinutes: 40, source: "IELTS.org 官方公开材料", setCode: "IELTS-OFFICIAL-L-2023-01", description: "内置官方题目 PDF 与 8 段对应录音，覆盖填空、单选、简答、匹配和地图题。", materials: [listeningMaterial] },
  { id: "writing", isoDay: 6, dayLabel: "周六", time: "09:30", title: "Official Academic Writing Sample Test 2023", duration: "60 分钟", durationMinutes: 60, source: "IELTS.org 官方公开材料", setCode: "IELTS-OFFICIAL-AW-2023-01", description: "独立 Writing 训练：完成 Task 1（至少 150 词）与 Task 2（至少 250 词），不再重复周二 Reading 或周四 Listening。", materials: [writingMaterial] },
  { id: "speaking-review", isoDay: 7, dayLabel: "周日", time: "19:30", title: "Official Speaking Sample Tasks 2023", duration: "25 分钟", durationMinutes: 25, source: "IELTS.org 官方公开材料", setCode: "IELTS-OFFICIAL-S-2023-01", description: "25 分钟完成 Speaking Part 1–3 的连续问答、录音提交与整组反馈。", materials: [speakingMaterial] },
];

function officialPracticeRecordId(session: OfficialTestSession, weekKey = localWeekKey()) {
  return `${weekKey}:${session.id}:${session.setCode}`;
}

function officialTaskRecordId(session: OfficialTestSession, material: OfficialTestMaterial, task: OfficialTaskSegment) {
  return `${session.setCode}:${material.id}:${task.id}`;
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

function readingAnalysisMethod(answer: OfficialAnswer) {
  const accepted = answer.accepted.map((item) => item.toUpperCase());
  if (accepted.includes("NOT GIVEN")) return "先在定位范围内寻找题干的比较对象与判断关系；原文没有提供该项比较，不能凭常识补全，所以选 NOT GIVEN。";
  if (accepted.includes("FALSE") || accepted.includes("NO")) return "把题干主干与高亮原句逐项对照；两者方向或范围直接冲突，因此判为 FALSE / NO，而不是信息缺失。";
  if (accepted.includes("TRUE") || accepted.includes("YES")) return "高亮原句与题干表达的是同一事实，差别只是同义替换或句式变化，因此判为 TRUE / YES。";
  if (answer.group) return "这是成组答案：分别核对两处高亮信息，并确认两个作答位没有重复；只有组合和顺序规则同时满足才得分。";
  if (!answer.choices) return "答案来自高亮原句的原词复现；回填后还要检查题目词数限制、单复数和拼写。";
  return "先用题干关键词定位，再比较各选项与高亮句的主语、动作、范围和因果关系；只选择被原文直接支持的一项。";
}

const writingStopWords = new Set([
  "about", "after", "also", "and", "are", "because", "been", "before", "being", "between", "both", "but", "can", "children", "could", "does", "education", "families", "family", "from", "have", "into", "more", "most", "other", "people", "should", "some", "such", "than", "that", "their", "them", "there", "these", "they", "this", "those", "through", "very", "what", "when", "where", "which", "while", "will", "with", "women", "would", "your",
]);

function writingSentenceUnits(response: string) {
  return response.split(/\n+/).flatMap((paragraph, paragraphIndex) => {
    const sentences = splitWritingParagraph(paragraph);
    return sentences.map((sentence, sentenceIndex) => ({
      id: `${paragraphIndex + 1}-${sentenceIndex + 1}`,
      text: sentence.trim(),
      paragraphIndex,
    })).filter((sentence) => sentence.text);
  });
}

function splitWritingParagraph(paragraph: string) {
  const sentences: string[] = [];
  let sentenceStart = 0;
  for (let index = 0; index < paragraph.length; index += 1) {
    const character = paragraph[index];
    if (![".", "!", "?"].includes(character)) continue;
    const isDecimalPoint = character === "." && /\d/.test(paragraph[index - 1] ?? "") && /\d/.test(paragraph[index + 1] ?? "");
    if (isDecimalPoint) continue;
    let sentenceEnd = index + 1;
    while ([".", "!", "?"].includes(paragraph[sentenceEnd] ?? "")) sentenceEnd += 1;
    sentences.push(paragraph.slice(sentenceStart, sentenceEnd));
    sentenceStart = sentenceEnd;
    index = sentenceEnd - 1;
  }
  if (paragraph.slice(sentenceStart).trim()) sentences.push(paragraph.slice(sentenceStart));
  return sentences;
}

function splitLongWritingSentence(sentence: string) {
  const splitPatterns = [", which ", ", while ", ", whereas ", ", and ", "; "];
  const lower = sentence.toLowerCase();
  const splitAt = splitPatterns.map((pattern) => ({ pattern, index: lower.indexOf(pattern) })).find(({ index }) => index > 24);
  if (!splitAt) return "先保留一个中心意思，再把原因或结果移到下一句。例如：Main point. This is because [reason], which leads to [result].";
  const first = sentence.slice(0, splitAt.index).trim().replace(/[.!?]+$/, "");
  const second = sentence.slice(splitAt.index + splitAt.pattern.length).trim().replace(/[.!?]+$/, "");
  return `${first}. ${second.charAt(0).toUpperCase()}${second.slice(1)}.`;
}

function buildWritingAnnotations(response: string, isTaskOne: boolean): WritingAnnotation[] {
  return writingSentenceUnits(response).map(({ id, text }) => {
    const words = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
    const lower = text.toLowerCase();
    const hasConnector = /\b(however|although|overall|therefore|moreover|furthermore|whereas|while|consequently|nevertheless|in addition|by contrast|in conclusion)\b/.test(lower);
    const hasExample = /\b(for example|for instance|such as)\b/.test(lower);
    const hasPosition = /\b(i agree|i disagree|i believe|in my view|i would argue|my view is)\b/.test(lower);
    const hasComparison = /\b(whereas|while|compared|higher|lower|more than|less than|respectively)\b/.test(lower);
    const hasData = /\b\d+(?:\.\d+)?(?:,\d{3})?\b|\b(?:million|thousand|percent|approximately|roughly)\b/.test(lower);
    const vagueMatch = text.match(/\b(a lot of|lots of|many things|good things|bad things|very (?:good|bad|big|important)|people say|nowadays)\b/i);

    if (words.length > 34) return {
      id, text, tone: "improve", label: "长句需要拆分",
      reason: `这句话有 ${words.length} 词，多个信息挤在一起，主干和逻辑关系容易失焦。`,
      example: splitLongWritingSentence(text),
    };
    if (vagueMatch) return {
      id, text, tone: "improve", label: "表达过于笼统",
      reason: `“${vagueMatch[0]}”没有说明具体对象、程度或结果。雅思写作需要把抽象判断变成可验证的因果或数据。`,
      example: isTaskOne
        ? "可改为：The figure rose by approximately 20%, with the sharpest increase occurring in the final period."
        : "可改为：This policy can reduce household expenditure because families spend less on transport and childcare.",
    };
    if (isTaskOne && (hasComparison || hasData)) return {
      id, text, tone: "good", label: hasComparison ? "有效数据比较" : "使用具体数据",
      reason: hasComparison ? "这句话没有孤立罗列数字，而是明确写出了组别或时间之间的关系。" : "具体数据让描述可核验；继续确保数字服务于主要趋势。",
      example: "可沿用结构：By contrast, [A] stood at about [X], compared with [Y] for [B].",
    };
    if (words.length > 0 && words.length < 8) return {
      id, text, tone: "improve", label: "观点展开不足",
      reason: `这句话只有 ${words.length} 词，通常只给出判断，没有解释 why / how 或产生的结果。`,
      example: isTaskOne
        ? `${text.replace(/[.!?]+$/, "")}, rising from approximately [X] to [Y] over the period.`
        : `${text.replace(/[.!?]+$/, "")}. This is because [具体机制], which can lead to [直接结果].`,
    };
    if (hasPosition) return {
      id, text, tone: "good", label: "立场表达清楚",
      reason: "读者可以直接识别你的中心立场，这有助于 Task Response 和全文一致性。",
      example: "可沿用结构：In my view, [立场], primarily because [理由 1] and [理由 2].",
    };
    if (hasExample) return {
      id, text, tone: "good", label: "使用例证展开",
      reason: "这句话用具体例子支撑前面的判断，使观点不只停留在抽象层面。",
      example: "下一步可在例子后补一句：This illustrates that [例子如何证明本段观点].",
    };
    if (hasConnector) return {
      id, text, tone: "good", label: "逻辑衔接明确",
      reason: "连接词表达了真实的转折、对比或结果关系，而不是机械堆叠。",
      example: "保留连接词，同时确保它连接的是两个完整且逻辑相反或递进的观点。",
    };
    return {
      id, text, tone: "neutral", label: "可继续展开",
      reason: "句子结构基本清楚，但暂未检测到具体数据、例证、明确立场或显性的逻辑关系。",
      example: isTaskOne
        ? "下一句可补充最重要的比较或极值，并使用准确数据支持。"
        : "下一句可按“原因 → 机制 → 结果 → 例子”的顺序展开本观点。",
    };
  });
}

function buildWritingIdeaBank(isTaskOne: boolean) {
  return isTaskOne ? [
    { title: "Overview 观点", point: "只写最显著的两项总体特征，不在总览堆细节数字。", example: "Overall, participation increased in both groups, although the rise was considerably stronger among part-time students." },
    { title: "数据分组", point: "按趋势相似性分组，而不是按图表从左到右逐项抄写。", example: "Group the two rising categories in one paragraph, then contrast them with the stable or declining category." },
    { title: "比较链", point: "每个主体段至少形成一次 A 与 B、起点与终点或最高与最低的直接比较。", example: "By 1990, the figure for women was roughly twice that of men, at about X and Y respectively." },
  ] : [
    { title: "中心立场", point: "引言直接回答题目，并预告两个支撑理由，避免只改写题干。", example: "I largely disagree because financial background is less influential than parental guidance and access to practical responsibility." },
    { title: "论点展开", point: "主体段按“判断—原因—机制—结果—例子”推进，不要连续写多个没有解释的观点。", example: "One reason is that responsibility develops through repeated decision-making. When teenagers manage a fixed budget, they learn to prioritise needs and accept the consequences of poor choices." },
    { title: "反方回应", point: "先承认对方合理的一部分，再解释为什么不足以推翻你的立场。", example: "Admittedly, limited income can encourage careful spending. However, this benefit is not automatic, because persistent poverty may instead restrict education and long-term planning." },
  ];
}

function analyzeWritingResponse(response: string, minimumWords: number): WritingFeedback {
  const words = response.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  const lowercaseWords = words.map((word) => word.toLowerCase());
  const paragraphs = response.split(/\n+/).map((paragraph) => paragraph.trim()).filter((paragraph) => paragraph.length > 20);
  const sentences = response.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
  const averageSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
  const longSentenceCount = sentences.filter((sentence) => (sentence.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length > 34).length;
  const connectorMatches = response.match(/\b(however|although|overall|therefore|moreover|furthermore|whereas|while|consequently|nevertheless|in addition|by contrast|for example|for instance|on the other hand|in conclusion)\b/gi) ?? [];
  const frequency = lowercaseWords.reduce<Record<string, number>>((counts, word) => {
    if (word.length >= 5 && !writingStopWords.has(word)) counts[word] = (counts[word] ?? 0) + 1;
    return counts;
  }, {});
  const repeatedWords = Object.entries(frequency).filter(([, count]) => count >= 4).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const uniqueRatio = words.length > 0 ? new Set(lowercaseWords).size / words.length : 0;
  const lower = response.toLowerCase();
  const opening = lower.slice(0, 650);
  const ending = lower.slice(-650);
  const strengths: string[] = [];
  const priorities: string[] = [];
  const isTaskOne = minimumWords === 150;
  const annotations = buildWritingAnnotations(response, isTaskOne);

  strengths.push(`已达到最低词数要求，目前共 ${words.length} 词。`);
  if (paragraphs.length >= 4) strengths.push(`文章分为 ${paragraphs.length} 个有效段落，结构容易识别。`);
  else priorities.push(`目前只能识别出 ${paragraphs.length || 1} 个段落。建议使用“引言—主体 1—主体 2—结论/总览”的四段结构，并用空行分段。`);

  if (connectorMatches.length >= 4) strengths.push(`检测到 ${connectorMatches.length} 处明确衔接表达，段落关系较清楚。`);
  else priorities.push("衔接表达偏少。下一轮至少加入 4 个有实际逻辑作用的连接方式，例如 however、whereas、therefore 和 by contrast。");

  if (averageSentenceLength >= 13 && averageSentenceLength <= 28 && longSentenceCount <= 1) strengths.push(`平均句长约 ${averageSentenceLength} 词，长短控制较稳。`);
  else if (longSentenceCount > 1 || averageSentenceLength > 28) priorities.push(`检测到 ${longSentenceCount} 个超过 34 词的长句，平均句长约 ${averageSentenceLength} 词。优先拆分主从关系不清的长句。`);
  else priorities.push(`平均句长约 ${averageSentenceLength} 词。可以适量合并过短句，并加入定语从句或让步结构。`);

  if (uniqueRatio >= 0.43) strengths.push("实词变化度较好，没有明显依赖少量基础词反复表达。");
  if (repeatedWords.length > 0) priorities.push(`重复较明显的词：${repeatedWords.map(([word, count]) => `${word} ×${count}`).join("、")}。保留必要关键词，其余位置尝试同义替换或改写句型。`);

  if (isTaskOne) {
    const hasOverview = /\b(overall|in general|it is clear|it can be seen|on the whole)\b/.test(lower);
    const comparisonCount = (lower.match(/\b(whereas|while|compared|higher|lower|more than|less than|by contrast|respectively)\b/g) ?? []).length;
    const dataCount = (response.match(/\b\d+(?:\.\d+)?(?:,\d{3})?\b|\b(?:million|thousand|percent|approximately|roughly|about|around)\b/gi) ?? []).length;
    if (hasOverview) strengths.push("检测到独立总览信号，符合 Task 1 先概括主趋势的要求。");
    else priorities.unshift("Task 1 缺少清晰总览。请在引言后增加 Overall 段，只概括两项最重要趋势，不堆数字。");
    if (comparisonCount >= 3) strengths.push(`包含 ${comparisonCount} 处比较表达，能够把数据关系写出来。`);
    else priorities.push("数据描述多、比较不足。至少补充三组横向或纵向比较，而不是逐根柱子罗列数字。");
    if (dataCount < 5) priorities.push("具体数据支撑偏少。主体段应选择关键年份和极值，并用 about / approximately 表示图表估值。");
  } else {
    const hasPosition = /\b(i agree|i disagree|i believe|in my view|i would argue|my view is)\b/.test(opening);
    const hasConclusion = /\b(in conclusion|to conclude|in summary|overall)\b/.test(ending);
    const exampleCount = (lower.match(/\b(for example|for instance|such as)\b/g) ?? []).length;
    const balanceCount = (lower.match(/\b(however|although|nevertheless|on the other hand|while)\b/g) ?? []).length;
    if (hasPosition) strengths.push("引言中能够识别出明确立场，读者不需要猜测你的观点。");
    else priorities.unshift("Task 2 引言中的立场不够明确。请直接写 I agree / disagree，或说明你在多大程度上同意。");
    if (hasConclusion) strengths.push("结尾包含明确总结信号，能够回扣中心立场。");
    else priorities.push("结尾缺少可识别的结论。用 1–2 句重新回答题目，不要在结论引入新论点。");
    if (exampleCount > 0) strengths.push(`检测到 ${exampleCount} 处举例信号，论点有展开意识。`);
    else priorities.push("主体段缺少明确例证。每个核心论点至少补充一个现实例子或具体因果过程。");
    if (balanceCount === 0) priorities.push("论证目前较单向。可以加入一次让步或反方回应，再解释为什么你的立场仍然成立。");
  }

  if (priorities.length === 0) priorities.push("核心结构已经达标。下一轮重点逐句检查冠词、主谓一致和单复数，并尝试让每个主体段的主题句更直接地回答题目。");

  return {
    metrics: [
      { label: "词数", value: `${words.length}/${minimumWords}+`, tone: words.length >= minimumWords ? "good" : "watch" },
      { label: "段落", value: `${paragraphs.length || 1}`, tone: paragraphs.length >= 4 ? "good" : "watch" },
      { label: "衔接表达", value: `${connectorMatches.length}`, tone: connectorMatches.length >= 4 ? "good" : "watch" },
      { label: "长句风险", value: `${longSentenceCount}`, tone: longSentenceCount <= 1 ? "good" : "watch" },
    ],
    strengths: strengths.slice(0, 6),
    priorities: priorities.slice(0, 5),
    annotations,
    ideaBank: buildWritingIdeaBank(isTaskOne),
  };
}

function WritingFeedbackPanel({ response, minimumWords }: { response: string; minimumWords: number }) {
  const feedback = analyzeWritingResponse(response, minimumWords);
  const annotationMap = new Map(feedback.annotations.map((annotation) => [annotation.id, annotation]));
  const importantAnnotations = feedback.annotations.filter((annotation) => annotation.tone !== "neutral");
  const displayedAnnotations = (importantAnnotations.length > 0 ? importantAnnotations : feedback.annotations).slice(0, 10);
  return (
    <section className="official-writing-feedback" aria-label="个性化写作建议">
      <header><div><span>PERSONALISED WRITING REVIEW</span><b>根据本次作文生成的改进建议</b></div><small>即时诊断 · 非官方评分</small></header>
      <div className="official-writing-feedback-metrics">{feedback.metrics.map((metric) => <div className={metric.tone === "good" ? "is-good" : "needs-work"} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</div>
      <section className="official-writing-annotated">
        <header><div><span>SENTENCE-BY-SENTENCE</span><b>用户原文逐句标注</b></div><div className="official-writing-legend"><span className="is-good">写得好</span><span className="needs-work">需要改进</span></div></header>
        <article>{response.split(/\n+/).map((paragraph, paragraphIndex) => {
          const sentences = splitWritingParagraph(paragraph);
          return <p key={`annotated-paragraph-${paragraphIndex}`}>{sentences.map((sentence, sentenceIndex) => {
            const annotation = annotationMap.get(`${paragraphIndex + 1}-${sentenceIndex + 1}`);
            const text = sentence.trim();
            if (!annotation || annotation.tone === "neutral") return <span key={`${paragraphIndex}-${sentenceIndex}`}>{text} </span>;
            return <mark className={annotation.tone === "good" ? "is-good" : "needs-work"} title={annotation.label} key={`${paragraphIndex}-${sentenceIndex}`}>{text}<sup>{displayedAnnotations.findIndex((item) => item.id === annotation.id) + 1 || ""}</sup></mark>;
          })}</p>;
        })}</article>
        <div className="official-writing-annotation-list">{displayedAnnotations.map((annotation, index) => <section className={annotation.tone === "good" ? "is-good" : "needs-work"} key={annotation.id}><header><span>{index + 1}</span><b>{annotation.label}</b></header><blockquote>{annotation.text}</blockquote><p>{annotation.reason}</p><div><strong>{annotation.tone === "good" ? "继续提升" : "改写例句"}</strong><span>{annotation.example}</span></div></section>)}</div>
      </section>
      <div className="official-writing-feedback-columns">
        <section><b>这次做得好的地方</b><ul>{feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section><b>下一轮优先修改</b><ol>{feedback.priorities.map((item) => <li key={item}>{item}</li>)}</ol></section>
      </div>
      <section className="official-writing-idea-bank"><header><span>IDEA DEVELOPMENT</span><b>{minimumWords === 150 ? "Task 1 数据组织与句型建议" : "Task 2 观点、论证与例证建议"}</b></header><div>{feedback.ideaBank.map((idea) => <article key={idea.title}><strong>{idea.title}</strong><p>{idea.point}</p><blockquote>{idea.example}</blockquote></article>)}</div></section>
      <p>说明：荧光标注来自用户本次输入的逐句结构、词汇和逻辑信号分析，可以用于快速复盘；它不能可靠识别所有语法错误，也不能替代 IELTS 考官对任务回应、准确性和 Band 分数的人工判断。</p>
    </section>
  );
}

export default function IeltsApp() {
  const [view, setView] = useState<View>("today");
  const [activeSkill, setActiveSkill] = useState<Skill>("vocabulary");
  const [activeOfficialSessionId, setActiveOfficialSessionId] = useState(officialTestSchedule[0].id);
  const [progress, setProgress] = useState<LearningProgress>(defaultProgress);
  const progressRef = useRef<LearningProgress>(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        const next = mergeStoredProgress(stored ? JSON.parse(stored) : null);
        progressRef.current = next;
        setProgress(next);
      } catch {
        progressRef.current = defaultProgress;
        setProgress(defaultProgress);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!hydrated) return;
    let unsavedSeconds = 0;
    let lastTick = Date.now();
    const persistTime = () => {
      const seconds = Math.floor(unsavedSeconds);
      if (seconds <= 0) return;
      unsavedSeconds -= seconds;
      const next = recordAppStudyTime(progressRef.current, seconds);
      progressRef.current = next;
      setProgress(next);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    };
    const captureVisibleTime = () => {
      const now = Date.now();
      if (document.visibilityState === "visible") unsavedSeconds += Math.min(5, Math.max(0, (now - lastTick) / 1000));
      lastTick = now;
      if (unsavedSeconds >= 10) persistTime();
    };
    const timer = window.setInterval(captureVisibleTime, 1000);
    const handleVisibilityChange = () => {
      captureVisibleTime();
      if (document.visibilityState !== "visible") persistTime();
      lastTick = Date.now();
    };
    const handlePageHide = () => {
      captureVisibleTime();
      persistTime();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      captureVisibleTime();
      persistTime();
    };
  }, [hydrated]);

  const updateProgress = (updater: (current: LearningProgress) => LearningProgress) => {
    setProgress((current) => {
      const next = updater(current);
      progressRef.current = next;
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const completeSkill = (skill: Skill, minutes: number) => {
    updateProgress((current) => {
      const next = {
        ...current,
        completed: { ...current.completed, [skill]: true },
        carryoverTasks: current.carryoverTasks.filter((item) => item !== skill),
      };
      if (current.completed[skill]) return next;
      return recordStudyActivity(next, {
        id: `daily-skill:${skill}`,
        label: skills.find((item) => item.id === skill)?.label ?? skill,
        minutes,
      });
    });
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
    progressRef.current = defaultProgress;
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
  const [showStudyHistory, setShowStudyHistory] = useState(false);
  const [showExtraStudy, setShowExtraStudy] = useState(false);
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
          <button
            className="primary-action"
            aria-expanded={completedCount === 4 ? showExtraStudy : undefined}
            aria-controls={completedCount === 4 ? "extra-study-menu" : undefined}
            onClick={completedCount === 4 ? () => setShowExtraStudy((current) => !current) : onStart}
          >{completedCount === 4 ? showExtraStudy ? "收起加练选择" : "继续增加学习" : `继续${nextSkill.label}`}<span>{completedCount === 4 && showExtraStudy ? "↑" : "→"}</span></button>
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
          <button className="streak-row" onClick={() => setShowStudyHistory(true)} aria-expanded={showStudyHistory} aria-haspopup="dialog"><span className="streak-mark">{progress.streak}</span><span><strong>连续学习 {progress.streak} 天</strong><small>本周已学习 {progress.minutes} 分钟 · 查看每日记录</small></span><b>→</b></button>
          <button className="memory-row" onClick={() => onNavigate("review")}>
            <span><strong>笔记与复习</strong><small>{progress.notebook.length} 条笔记 · {dueReviewCount} 个今日到期</small></span><b>→</b>
          </button>
        </aside>
      </div>
      {completedCount === 4 && showExtraStudy && (
        <section className="extra-study-panel" id="extra-study-menu" aria-label="今日加练选择">
          <header>
            <div><span>KEEP GOING</span><h2>今天还想多练一点？</h2><p>任选一项继续学习。今日基础完成度保持 100%，实际学习时间会继续累计。</p></div>
            <strong>已完成今日计划 ✓</strong>
          </header>
          <div className="extra-study-options">
            <button onClick={() => onNavigate("review")}>
              <span>08 MIN</span><b>复习错词与笔记</b><small>{dueReviewCount > 0 ? `${dueReviewCount} 个词今日到期` : `${progress.notebook.length} 条个人笔记可复盘`}</small><em>开始复习 →</em>
            </button>
            <button onClick={() => onOpenSkill("listening")}>
              <span>12 MIN</span><b>再练一组听力</b><small>填空、多选、匹配与单选</small><em>开始听力 →</em>
            </button>
            <button onClick={() => onOpenSkill("speaking")}>
              <span>05 MIN</span><b>继续 AI 口语</b><small>考官式提问与互动追问</small><em>开始口语 →</em>
            </button>
            <button onClick={() => onOpenSkill("reading")}>
              <span>18 MIN</span><b>再练一篇阅读</b><small>匹配、判断与摘要填空</small><em>开始阅读 →</em>
            </button>
            <button className="is-official" onClick={() => onNavigate("practice")}>
              <span>FULL TEST</span><b>进入套题训练</b><small>{nextOfficialSession.setCode} · {nextOfficialSession.title}</small><em>选择套题 →</em>
            </button>
          </div>
        </section>
      )}
      <section className="official-plan-strip">
        <div><span>WEEKLY OFFICIAL PRACTICE</span><strong>本周官方套题训练</strong><p>下一项：{nextOfficialSession.dayLabel} {nextOfficialSession.time} · {nextOfficialSession.title}</p></div>
        <div className="official-plan-progress"><strong>{completedOfficialSessions.length}<small>/4</small></strong><span>本周已完成</span></div>
        <button onClick={() => onNavigate("practice")}>查看官方套题计划 <span>→</span></button>
      </section>
      {showStudyHistory && <StudyHistoryDialog progress={progress} onClose={() => setShowStudyHistory(false)} />}
    </>
  );
}

function StudyHistoryDialog({ progress, onClose }: { progress: LearningProgress; onClose: () => void }) {
  const today = localDayKey();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const key = localDayKey(date);
    return { key, date, record: progress.dailyStudyHistory[key] };
  }).reverse();
  const maxDailyMinutes = Math.max(1, ...days.map(({ record }) => record?.minutes ?? 0));
  const linePoints = days.map(({ record }, index) => {
    const x = 30 + index * 90;
    const y = 132 - ((record?.minutes ?? 0) / maxDailyMinutes) * 102;
    return { x, y, minutes: record?.minutes ?? 0 };
  });
  const monthTotals = Object.values(progress.dailyStudyHistory).reduce<Record<string, number>>((totals, record) => {
    const month = record.date.slice(0, 7);
    totals[month] = (totals[month] ?? 0) + record.minutes;
    return totals;
  }, {});
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const key = localDayKey(date).slice(0, 7);
    return { key, label: date.toLocaleDateString("zh-CN", { year: "numeric", month: "short" }), minutes: monthTotals[key] ?? 0 };
  });
  const maxMonthlyMinutes = Math.max(1, ...months.map((month) => month.minutes));
  const currentMonthMinutes = months.at(-1)?.minutes ?? 0;
  const activeDaysThisMonth = Object.values(progress.dailyStudyHistory).filter((record) => record.date.startsWith(today.slice(0, 7)) && record.minutes > 0).length;

  return (
    <div className="study-history-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="study-history-dialog" role="dialog" aria-modal="true" aria-labelledby="study-history-title">
        <header>
          <div><span>STUDY HISTORY</span><h2 id="study-history-title">每日学习记录</h2><p>页面在前台可见时累计学习时间；切到后台、锁屏或关闭页面时暂停并保存。</p></div>
          <button onClick={onClose} aria-label="关闭每日学习记录">×</button>
        </header>
        <div className="study-history-summary">
          <div><span>本月累计</span><strong>{currentMonthMinutes}<small> 分钟</small></strong></div>
          <div><span>本月学习天数</span><strong>{activeDaysThisMonth}<small> 天</small></strong></div>
          <div><span>最近 7 天</span><strong>{days.reduce((total, day) => total + (day.record?.minutes ?? 0), 0)}<small> 分钟</small></strong></div>
        </div>
        <section className="study-history-chart-card">
          <header><div><span>DAILY BARS</span><strong>最近 7 天学习时间</strong></div><small>柱状图 · 分钟</small></header>
          <div className="study-history-bar-chart" aria-label="最近七天每日学习分钟柱状图">
            {days.map(({ key, date, record }) => {
              const minutes = record?.minutes ?? 0;
              return <div className={minutes > 0 ? "has-study" : ""} key={`bar-${key}`}><span>{minutes}</span><i style={{ height: `${Math.max(minutes > 0 ? 8 : 2, (minutes / maxDailyMinutes) * 100)}%` }} /><small>{date.toLocaleDateString("zh-CN", { weekday: "short" })}</small></div>;
            })}
          </div>
        </section>
        <section className="study-history-chart-card is-line-chart">
          <header><div><span>DAILY TREND</span><strong>每日学习趋势</strong></div><small>折线图 · 分钟</small></header>
          <svg viewBox="0 0 600 165" role="img" aria-label="最近七天每日学习时间折线图">
            <line x1="30" x2="570" y1="30" y2="30" /><line x1="30" x2="570" y1="81" y2="81" /><line x1="30" x2="570" y1="132" y2="132" />
            <polyline points={linePoints.map(({ x, y }) => `${x},${y}`).join(" ")} />
            {linePoints.map(({ x, y, minutes }, index) => <g key={`point-${days[index].key}`}><circle cx={x} cy={y} r="5" /><text x={x} y={Math.max(15, y - 10)} textAnchor="middle">{minutes}</text></g>)}
          </svg>
          <div className="study-history-line-labels">{days.map(({ key, date }) => <span key={`line-label-${key}`}>{date.toLocaleDateString("zh-CN", { weekday: "short" })}</span>)}</div>
        </section>
        <section className="study-history-chart-card is-monthly-chart">
          <header><div><span>MONTHLY TOTAL</span><strong>每月累计学习时间</strong></div><small>最近 6 个月</small></header>
          <div>{months.map((month) => <article key={month.key}><span>{month.label}</span><i><b style={{ width: `${(month.minutes / maxMonthlyMinutes) * 100}%` }} /></i><strong>{month.minutes}<small> 分钟</small></strong></article>)}</div>
        </section>
        <div className="study-history-list-heading"><strong>每日学习内容</strong><span>停留时间与已完成任务</span></div>
        <div className="study-history-list">
          {[...days].reverse().map(({ key, date, record }) => {
            const dateLabel = date.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
            return (
              <article className={record ? "has-study" : ""} key={key}>
                <div className="study-history-date"><span>{key === today ? "今天" : dateLabel}</span><strong>{record?.minutes ?? 0}<small> 分钟</small></strong></div>
                <div className="study-history-activities">
                  {record?.activities.length ? record.activities.map((activity) => <span key={activity.id}><b>{activity.label}</b><small>{activity.id === "app-active-time" ? record.activeSeconds < 60 ? "不足 1 分钟" : `${activity.minutes} 分钟` : "已完成"}</small></span>) : <p>{key === today ? "今天还没有产生有效停留时间" : "暂无可用的每日明细"}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
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
  const material = session.materials[0];
  const [taskIndex, setTaskIndex] = useState(0);
  const [paperMode, setPaperMode] = useState<"questions" | "answers">("questions");
  const [audioTrackIndex, setAudioTrackIndex] = useState(0);
  const [officialResponses, setOfficialResponses] = useState<Record<string, string>>(() => {
    const responses: Record<string, string> = {};
    for (const sessionMaterial of session.materials) {
      for (const sessionTask of sessionMaterial.tasks) {
        const result = progress.officialTaskResults[officialTaskRecordId(session, sessionMaterial, sessionTask)];
        if (!result) continue;
        for (const [responseId, value] of Object.entries(result.responses)) responses[`${sessionMaterial.id}:${sessionTask.id}:${responseId}`] = value;
      }
    }
    return responses;
  });
  const [submittedTasks, setSubmittedTasks] = useState<Record<string, boolean>>(() => Object.fromEntries(session.materials.flatMap((sessionMaterial) => sessionMaterial.tasks.map((sessionTask) => [
    `${sessionMaterial.id}:${sessionTask.id}`,
    Boolean(progress.officialTaskResults[officialTaskRecordId(session, sessionMaterial, sessionTask)]),
  ]))));
  const [remainingSeconds, setRemainingSeconds] = useState(session.durationMinutes * 60);
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const [showAttemptHistory, setShowAttemptHistory] = useState(false);
  const [activeReadingQuestion, setActiveReadingQuestion] = useState<string | null>(null);
  const readingBookletRef = useRef<HTMLDivElement>(null);
  const task = material.tasks[taskIndex];
  const taskUnitLabel = task.speakingPrompt ? "Part" : material.passagePdfUrl ? "Passage" : "Task";
  const audioTrack = material.audioTracks?.[audioTrackIndex];
  const displayPage = paperMode === "answers" && task.answerPage ? task.answerPage : task.questionPage;
  const displayPdfUrl = paperMode === "answers" && material.answerPdfUrl ? material.answerPdfUrl : material.pdfUrl;
  const taskKey = `${material.id}:${task.id}`;
  const taskRecordKey = officialTaskRecordId(session, material, task);
  const taskAttemptHistory = progress.officialTaskAttemptHistory[taskRecordKey] ?? [];
  const taskAnswers = task.answers ?? [];
  const activeReadingAnswer = taskAnswers.find((answer) => answer.number === (activeReadingQuestion ?? taskAnswers[0]?.number));
  const activeReadingEvidence = activeReadingAnswer ? readingSourceEvidence[`${task.id}:${activeReadingAnswer.number}`] : undefined;
  const openResponseKey = `${taskKey}:open-response`;
  const openResponse = officialResponses[openResponseKey] ?? "";
  const openResponseWordCount = openResponse.trim() ? openResponse.trim().split(/\s+/).length : 0;
  const taskRequiresSubmission = taskAnswers.length > 0 || Boolean(task.minimumWords) || Boolean(task.speakingPrompt);
  const answeredCount = taskAnswers.filter((answer) => (officialResponses[`${taskKey}:${answer.number}`] ?? "").trim()).length;
  const allAnswersFilled = taskAnswers.length > 0 && answeredCount === taskAnswers.length;
  const taskSubmitted = submittedTasks[taskKey] ?? false;
  const isolateOfficialTaskPages = Boolean((material.audioTracks && task.transcriptPage) || task.minimumWords || task.speakingPrompt);
  const officialTaskPaperPages = paperMode === "answers" && task.answerPage
    ? task.answerPages ?? [task.answerPage]
    : task.questionPages ?? [task.questionPage];
  const questionPageLabel = (task.questionPages ?? [task.questionPage]).join("–");
  const answerPageLabel = (task.answerPages ?? (task.answerPage ? [task.answerPage] : [])).join("–");
  const correctAnswerCount = taskSubmitted ? taskAnswers.filter((answer) => officialAnswerIsCorrect(answer, taskAnswers, officialResponses, taskKey)).length : 0;
  const requiredTasks = session.materials.flatMap((sessionMaterial) => sessionMaterial.tasks
    .filter((sessionTask) => (sessionTask.answers?.length ?? 0) > 0 || Boolean(sessionTask.minimumWords) || Boolean(sessionTask.speakingPrompt))
    .map((sessionTask) => ({ key: `${sessionMaterial.id}:${sessionTask.id}`, questionCount: (sessionTask.answers?.length ?? 0) || 1 })));
  const requiredQuestionCount = requiredTasks.reduce((total, requiredTask) => total + requiredTask.questionCount, 0);
  const submittedRequiredTaskCount = requiredTasks.filter((requiredTask) => submittedTasks[requiredTask.key]).length;
  const materialRequiredTasks = material.tasks.filter((materialTask) => (materialTask.answers?.length ?? 0) > 0 || Boolean(materialTask.minimumWords) || Boolean(materialTask.speakingPrompt));
  const writingTaskMode = materialRequiredTasks.some((materialTask) => Boolean(materialTask.minimumWords));
  const speakingTaskMode = materialRequiredTasks.some((materialTask) => Boolean(materialTask.speakingPrompt));
  const requiredCompletionLabel = speakingTaskMode ? `${requiredTasks.length} 个 Speaking Part` : writingTaskMode ? `${requiredTasks.length} 个 Writing Task` : `${requiredQuestionCount} 题`;
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
  const submitCurrentTask = (responseOverride?: Record<string, string>) => {
    const nextSubmittedTasks = { ...submittedTasks, [taskKey]: true };
    const taskResponses = taskAnswers.length > 0
      ? Object.fromEntries(taskAnswers.map((answer) => [answer.number, officialResponses[`${taskKey}:${answer.number}`] ?? ""]))
      : responseOverride ?? { "open-response": openResponse };
    const taskScore = taskAnswers.length > 0
      ? taskAnswers.filter((answer) => officialAnswerIsCorrect(answer, taskAnswers, officialResponses, taskKey)).length
      : null;
    setSubmittedTasks(nextSubmittedTasks);
    if (material.passagePdfUrl && taskAnswers[0]) setActiveReadingQuestion(taskAnswers[0].number);
    updateProgress((current) => {
      const notebook = current.notebook.map((entry) => {
        const answer = taskAnswers.find((item) => entry.id === `question:${session.setCode}:${task.id}:${item.number}`);
        if (!answer) return entry;
        const response = officialResponses[`${taskKey}:${answer.number}`] || "未作答";
        return { ...entry, detail: `我的答案：${response}\n正确答案：${answer.displayAnswer}` };
      });
      const allRequiredSubmitted = requiredTasks.length > 0 && requiredTasks.every((requiredTask) => nextSubmittedTasks[requiredTask.key]);
      const isFirstSessionCompletion = allRequiredSubmitted && !current.officialPracticeCompleted.includes(recordId);
      const next = {
        ...current,
        notebook,
        officialTaskResults: {
          ...current.officialTaskResults,
          [taskRecordKey]: {
            score: taskScore,
            total: taskAnswers.length || 1,
            responses: taskResponses,
            completedAt: new Date().toISOString(),
          },
        },
        officialPracticeCompleted: isFirstSessionCompletion
          ? [...current.officialPracticeCompleted, recordId]
          : current.officialPracticeCompleted,
      };
      return isFirstSessionCompletion
        ? recordStudyActivity(next, { id: `official-session:${recordId}`, label: `套题 · ${session.title}`, minutes: session.durationMinutes })
        : next;
    });
  };
  const changeTask = (index: number) => {
    const nextTask = material.tasks[index];
    setTaskIndex(index);
    setPaperMode("questions");
    setShowAttemptHistory(false);
    setActiveReadingQuestion(null);
    setAudioTrackIndex(nextTask.audioTrackIndex ?? 0);
  };
  const showReadingEvidence = (questionNumber: string) => {
    setActiveReadingQuestion(questionNumber);
    window.setTimeout(() => readingBookletRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };
  const continueEditingCurrentTask = () => {
    setSubmittedTasks((current) => ({ ...current, [taskKey]: false }));
    setPaperMode("questions");
    updateProgress((current) => ({
      ...current,
      officialTaskResults: Object.fromEntries(Object.entries(current.officialTaskResults).filter(([key]) => key !== taskRecordKey)),
      officialPracticeCompleted: current.officialPracticeCompleted.filter((item) => item !== recordId),
    }));
  };
  const redoCurrentTask = () => {
    setSubmittedTasks((current) => ({ ...current, [taskKey]: false }));
    setPaperMode("questions");
    setShowAttemptHistory(false);
    setOfficialResponses((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${taskKey}:`))));
    updateProgress((current) => {
      const previousResult = current.officialTaskResults[taskRecordKey];
      return {
        ...current,
        officialTaskResults: Object.fromEntries(Object.entries(current.officialTaskResults).filter(([key]) => key !== taskRecordKey)),
        officialTaskAttemptHistory: previousResult ? {
          ...current.officialTaskAttemptHistory,
          [taskRecordKey]: [...(current.officialTaskAttemptHistory[taskRecordKey] ?? []), previousResult],
        } : current.officialTaskAttemptHistory,
        officialPracticeCompleted: current.officialPracticeCompleted.filter((item) => item !== recordId),
      };
    });
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
          <div className={completed ? "runner-completion-status is-complete" : "runner-completion-status"}><b>{completed ? "✓ 本套已完成" : "等待完整提交"}</b><p>{completed ? `全部 ${requiredCompletionLabel} 已提交，系统已自动记录。` : requiredTasks.length > 0 ? `${submittedRequiredTaskCount}/${requiredTasks.length} 个必做 ${taskUnitLabel} 已提交；完成全部 ${requiredCompletionLabel} 后自动记录。` : "本套没有可自动判定的客观题，当前不会记录为完成。"}</p></div>
        </aside>
        <section className="official-paper-panel">
          <header><div><strong>{task.questionLabel}</strong></div><small>{task.electronicModel && paperMode === "answers" ? "电子参考范文 · 清晰排版" : `官方原始题号 · 当前显示 P${displayPage}`}</small></header>
          <div className={material.tasks.length > 1 ? "official-task-controls" : "official-task-controls is-single"}>
            {material.tasks.length > 1 && <label>选择 {taskUnitLabel}<select value={taskIndex} onChange={(event) => changeTask(Number(event.target.value))}>{material.tasks.map((item, index) => <option value={index} key={item.id}>{index + 1}. {item.label} · {item.questionLabel}</option>)}</select></label>}
            <div className="official-paper-switch" aria-label="题目与答案切换">
              <button className={paperMode === "questions" ? "is-active" : ""} onClick={() => setPaperMode("questions")}>查看题目 · P{questionPageLabel}</button>
              {task.answerPage && <button className={paperMode === "answers" ? "is-active" : ""} disabled={taskRequiresSubmission && !taskSubmitted} onClick={() => setPaperMode("answers")}>{taskRequiresSubmission && !taskSubmitted ? "提交后查看答案" : task.answerLabel ?? "查看答案"}{task.electronicModel ? "" : ` · P${answerPageLabel}`}</button>}
            </div>
          </div>
          {material.tasks.length > 1 && (
            <section className="official-task-map" aria-label="官方练习任务导航">
              <header><div><span>{speakingTaskMode ? "3 INDEPENDENT SPEAKING PARTS" : material.audioTracks ? "8 INDEPENDENT LISTENING TASKS" : material.passagePdfUrl ? "3 INDEPENDENT READING PASSAGES" : writingTaskMode ? "2 INDEPENDENT WRITING TASKS" : "PRACTICE TASK MAP"}</span><b>{material.tasks.length} 个相互独立的 {speakingTaskMode ? "Speaking Part" : material.passagePdfUrl ? "Passage" : "Task"}{materialQuestionCount > 0 ? ` · 共 ${materialQuestionCount} 个练习项` : ""}</b><small>{speakingTaskMode ? "每个 Part 独立完成考官提问、60 秒准备、录音提交与反馈；提交一个不会完成另外两个。" : material.audioTracks ? "每个 Task 独立保存答案、得分、完成状态和原文解锁；题号重复也不会串联。" : material.passagePdfUrl ? "每个 Passage 独立保存答案、得分和完成状态；提交一篇不会显示另外两篇的答案。" : writingTaskMode ? "每个 Writing Task 独立保存作文与完成状态；提交一个不会显示另一个的题目或范文。" : "所有科目沿用与第一份阅读一致的材料区 + 答题区模板。"}</small></div><strong>{materialRequiredTasks.length > 0 ? `${submittedMaterialTaskCount}/${materialRequiredTasks.length}` : `${taskIndex + 1}/${material.tasks.length}`}</strong></header>
              <div>{material.tasks.map((materialTask, index) => {
                const materialTaskKey = `${material.id}:${materialTask.id}`;
                const materialTaskSubmitted = submittedTasks[materialTaskKey] ?? false;
                const materialTaskSize = (materialTask.answers?.length ?? 0) > 0 ? `${materialTask.answers?.length} 题` : materialTask.minimumWords ? `至少 ${materialTask.minimumWords} 词` : materialTask.speakingPrompt ? `目标 ${materialTask.speakingPrompt.targetSeconds} 秒` : "开放练习";
                return <button className={`${taskIndex === index ? "is-active " : ""}${materialTaskSubmitted ? "is-complete" : ""}`} onClick={() => changeTask(index)} type="button" key={materialTask.id}><span>{materialTask.speakingPrompt ? "独立 Part" : material.passagePdfUrl ? "独立 Passage" : material.audioTracks ? "独立 Task" : "Task"} {index + 1}</span><b>{materialTask.label}</b><small>{materialTaskSize} {materialTaskSubmitted ? "· ✓ 已单独提交" : "· 未完成"}</small></button>;
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
                <div><span>COMPUTER-DELIVERED ANSWER SHEET</span><strong>电子答题卡</strong><small>{material.passagePdfUrl ? "固定在右侧 · 可独立滚动完成当前 Passage 全部题目" : "按官方题号填写，提交前不会显示答案"}</small></div>
                <b className={taskSubmitted ? "is-scored" : ""}>{taskSubmitted ? `${correctAnswerCount} / ${taskAnswers.length}` : `${answeredCount} / ${taskAnswers.length}`}</b>
              </header>
              <div className="official-answer-grid">
                {taskAnswers.map((answer) => {
                  const responseKey = `${taskKey}:${answer.number}`;
                  const correct = taskSubmitted && officialAnswerIsCorrect(answer, taskAnswers, officialResponses, taskKey);
                  const noteId = `question:${session.setCode}:${task.id}:${answer.number}`;
                  const savedToNotebook = progress.notebook.some((entry) => entry.id === noteId);
                  const sourceEvidence = readingSourceEvidence[`${task.id}:${answer.number}`];
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
                      {taskSubmitted && <small><b>{correct ? "✓ 正确" : "✕ 错误"}</b><em>正确答案：{answer.displayAnswer}</em>{answer.explanation && <div className="official-reading-analysis"><div><strong>原文定位</strong><span>{sourceEvidence?.location ?? "当前题暂无精确定位"}</span></div><p><strong>判断依据</strong><span>{answer.explanation}</span></p><p><strong>解题方法</strong><span>{readingAnalysisMethod(answer)}</span></p>{sourceEvidence && <button type="button" onClick={() => showReadingEvidence(answer.number)}>荧光笔定位原文 →</button>}</div>}</small>}
                    </div>
                  );
                })}
              </div>
              <footer>
                <span>{taskSubmitted ? `本 ${taskUnitLabel} 得分 ${correctAnswerCount}/${taskAnswers.length}；每题旁已显示官方答案。` : allAnswersFilled ? "答案已全部填写，可以提交判分。" : `还需完成 ${taskAnswers.length - answeredCount} 题后才能提交。`}</span>
                {taskSubmitted ? <button type="button" onClick={redoCurrentTask}>再做一次</button> : <button type="submit" disabled={!allAnswersFilled}>提交全部答案</button>}
              </footer>
              {taskAttemptHistory.length > 0 && (
                <section className="official-attempt-history">
                  <button type="button" onClick={() => setShowAttemptHistory((current) => !current)}>{showAttemptHistory ? "收起历史答案" : `查看历史答案（${taskAttemptHistory.length}）`}</button>
                  {showAttemptHistory && <div>{taskAttemptHistory.map((attempt, attemptIndex) => {
                    const historicalResponses = Object.fromEntries(Object.entries(attempt.responses).map(([number, value]) => [`${taskKey}:${number}`, value]));
                    return <article key={`${attempt.completedAt}-${attemptIndex}`}>
                      <header><b>第 {attemptIndex + 1} 次作答</b><span>{attempt.completedAt.replace("T", " ").slice(0, 16)} · {attempt.score ?? 0}/{attempt.total}</span></header>
                      <div>{taskAnswers.map((answer) => {
                        const response = attempt.responses[answer.number] || "未作答";
                        const correct = officialAnswerIsCorrect(answer, taskAnswers, historicalResponses, taskKey);
                        return <p className={correct ? "is-correct" : "is-wrong"} key={answer.number}><b>Q{answer.number}</b><span>我的答案：{response}</span><em>正确答案：{answer.displayAnswer}</em></p>;
                      })}</div>
                    </article>;
                  })}</div>}
                </section>
              )}
            </form>
          ) : task.speakingPrompt ? (
            <OfficialSpeakingResponse
              key={taskKey}
              task={task}
              submitted={taskSubmitted}
              storedResponses={progress.officialTaskResults[taskRecordKey]?.responses}
              onSubmit={submitCurrentTask}
              onRedo={redoCurrentTask}
            />
          ) : task.minimumWords ? (
            <form className="official-writing-response" onSubmit={(event) => {
              event.preventDefault();
              if (openResponseWordCount < task.minimumWords!) return;
              submitCurrentTask();
            }}>
              <header><div><span>COMPUTER-DELIVERED WRITING</span><strong>{task.label} 作答区</strong><small>最低要求 {task.minimumWords} 词；提交后解锁官方范文与考官评语</small></div><b>{openResponseWordCount}<small> words</small></b></header>
              <textarea aria-label={`${task.label} answer`} disabled={taskSubmitted} placeholder="在这里输入你的英文答案……" value={openResponse} onChange={(event) => setOfficialResponses((current) => ({ ...current, [openResponseKey]: event.target.value }))} />
              <footer><span>{taskSubmitted ? `已提交 ${openResponseWordCount} 词；下方已生成个性化建议，也可以打开电子范文对照。` : openResponseWordCount >= task.minimumWords ? "已达到最低词数，可以提交本 Task。" : `还需至少 ${task.minimumWords - openResponseWordCount} 词。`}</span>{taskSubmitted ? <button type="button" onClick={continueEditingCurrentTask}>根据建议继续修改</button> : <button type="submit" disabled={openResponseWordCount < task.minimumWords}>提交本 Task</button>}</footer>
              {taskSubmitted && <WritingFeedbackPanel response={openResponse} minimumWords={task.minimumWords} />}
            </form>
          ) : writingTaskMode && paperMode === "answers" && task.electronicModel ? (
            <section className="official-writing-model">
              <header><div><span>ELECTRONIC MODEL ANSWER</span><b>{task.label} · 电子参考范文</b><small>{task.electronicModel.title}</small></div><strong>约 {task.electronicModel.wordCount} 词</strong></header>
              <div className="official-writing-model-note"><b>清晰电子稿</b><span>可直接选中文字阅读和复制；这是依据当前官方题目编写的原创参考范文，并非对官方手写考生稿的逐字转录。</span></div>
              <article>{task.electronicModel.paragraphs.map((paragraph, index) => <p key={`${task.id}-model-${index}`}>{paragraph}</p>)}</article>
              <aside><b>写作解析</b><ul>{task.electronicModel.analysis.map((point) => <li key={point}>{point}</li>)}</ul></aside>
            </section>
          ) : (
            <div className="official-open-response-note"><b>开放作答题</b><span>Speaking / Writing 没有唯一官方答案，因此不显示虚假的对错判定；可通过官方示范录音或范文复盘。</span></div>
          )}
          {material.audioTracks && audioTrack && (!speakingTaskMode || taskSubmitted) && (
            <div className="official-audio-dock">
              <label>{speakingTaskMode ? "当前 Part 的官方示范录音" : "当前独立 Task 的官方录音"}<select value={audioTrackIndex} onChange={(event) => changeTask(Number(event.target.value))}>{material.audioTracks.map((track, index) => <option value={index} key={track.url}>{track.label}</option>)}</select></label>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption -- The official transcript is included in the embedded source PDF. */}
              <audio key={audioTrack.url} controls preload="metadata" src={audioTrack.url}>当前浏览器不支持音频播放；对应原文位于官方 PDF。</audio>
            </div>
          )}
          {material.passagePdfUrl && paperMode === "questions" ? (
            <div className="official-reading-booklet" ref={readingBookletRef}>
              <header>
                <div className="official-reading-task-status"><strong>{task.label}</strong><small>{taskSubmitted ? "✓ 本 Passage 已单独提交" : "独立作答 · 不影响其他 Passage"}</small></div>
                <span>{task.questionLabel}</span>
              </header>
              {taskSubmitted && activeReadingAnswer && activeReadingEvidence && (
                <section className="official-reading-evidence" id="official-reading-evidence" aria-live="polite">
                  <header><div><span>HIGHLIGHTED SOURCE</span><strong>Q{activeReadingAnswer.number} · 原文荧光定位</strong></div><button type="button" onClick={() => setActiveReadingQuestion(null)} aria-label="关闭原文荧光定位">×</button></header>
                  <div className="official-reading-location"><span>定位</span><b>{activeReadingEvidence.location}</b></div>
                  <blockquote><mark>{activeReadingEvidence.excerpt}</mark></blockquote>
                  <div className="official-reading-reasoning"><strong>为什么是这个答案</strong><p>{activeReadingAnswer.explanation}</p><small>{readingAnalysisMethod(activeReadingAnswer)}</small></div>
                </section>
              )}
              <section className="official-reading-pair" key={task.id}>
                <header><b>{task.label} · 阅读文章</b><small>仅显示当前 Passage</small></header>
                <div className="official-reading-page-stack">{(task.passagePages ?? [2]).map((page) => <div className="official-pdf-page-lock" key={`passage-${page}`}><iframe className="official-paper-frame" tabIndex={-1} title={`${task.label} · 阅读文章 · P${page}`} src={`${material.passagePdfUrl}#page=${page}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`} /></div>)}</div>
                <div className="official-reading-continue"><span>接着完成</span><b>{task.questionLabel}</b></div>
                <header><b>{task.label} · 对应题目</b><small>只包含本 Passage 的题目页</small></header>
                <div className="official-reading-page-stack">{(task.questionPages ?? [task.questionPage]).map((page) => <div className="official-pdf-page-lock" key={`questions-${page}`}><iframe className="official-paper-frame" tabIndex={-1} title={`${task.label} · 对应题目 · P${page}`} src={`${material.pdfUrl}#page=${page}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`} /></div>)}</div>
              </section>
            </div>
          ) : task.speakingPrompt && !taskSubmitted ? (
            <section className="official-speaking-material-lock">
              <span>REVIEW MATERIAL LOCKED</span>
              <strong>先完成自己的回答</strong>
              <p>当前只通过考官语音接收题目。提交本 Part 后，才会显示语音不足分析、针对性改进练习、话题模板、官方样题页与示范录音，避免提前照着答案说。</p>
            </section>
          ) : (
            <section className={isolateOfficialTaskPages ? "official-source-document is-page-locked" : "official-source-document"}>
              <header><div><span>{paperMode === "answers" ? "OFFICIAL REVIEW MATERIAL" : "OFFICIAL SOURCE MATERIAL"}</span><b>{paperMode === "answers" ? task.answerLabel ?? "官方答案" : `${task.label} · 官方题目`}</b></div><small>{isolateOfficialTaskPages ? `仅显示当前 Task · P${officialTaskPaperPages.join("–")}` : `PDF P${displayPage}`}</small></header>
              {isolateOfficialTaskPages ? (
                <div className="official-task-page-stack">
                  {officialTaskPaperPages.map((page, index) => <div className="official-pdf-page-lock" key={`${paperMode}-${page}`}>
                    <iframe className="official-paper-frame" tabIndex={-1} title={`${session.title} · ${task.label} · ${paperMode === "answers" ? "答案" : "题目"} · P${page}`} src={`${displayPdfUrl}#page=${page}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`} />
                    {index === 0 && paperMode === "questions" && !taskSubmitted && <div className="official-page-lock-badge"><span>{task.speakingPrompt ? "🔒 当前 Part 独立显示" : "🔒 当前 Task 独立显示"}</span><small>{task.speakingPrompt ? "录音提交后生成本 Part 的复盘建议" : material.audioTracks ? "提交后只解锁本 Task 的听力原文" : "提交后只解锁本 Task 的范文与考官评语"}</small></div>}
                  </div>)}
                </div>
              ) : (
                <iframe className="official-paper-frame" title={`${session.title} · ${task.label} · ${paperMode === "answers" ? "答案" : "题目"}`} src={`${displayPdfUrl}#page=${displayPage}&toolbar=1&navpanes=0&scrollbar=1&view=FitH`} />
              )}
            </section>
          )}
          {task.transcriptPage && !taskSubmitted && <div className="official-transcript-lock-note"><b>🔒 听力原文尚未开放</b><span>请先填写当前 Task 的全部答案并提交判分。</span></div>}
          {task.transcriptPage && taskSubmitted && (
            <section className="official-listening-transcript is-unlocked">
              <header><div><span>OFFICIAL TAPESCRIPT</span><b>{task.label} · 听力原文</b></div><small>仅解锁当前 Task · P{(task.transcriptPages ?? [task.transcriptPage]).join("–")}</small></header>
              <div className="official-task-page-stack">{(task.transcriptPages ?? [task.transcriptPage]).map((page) => <div className="official-pdf-page-lock" key={`transcript-${page}`}><iframe className="official-paper-frame" tabIndex={-1} title={`${task.label} · 听力原文 · P${page}`} src={`${material.pdfUrl}#page=${page}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`} /></div>)}</div>
            </section>
          )}
          </div>
        </section>
      </div>
    </>
  );
}

type SpeakingAudioMetrics = { rms: number; quietRatio: number; clipRatio: number };
type SpeakingTurnResult = {
  question: string;
  transcript: string;
  prepNotes: string;
  durationSeconds: number;
  pauseCount: number;
  audioMetrics: SpeakingAudioMetrics;
};

function analyzeOfficialSpeakingResponse(
  transcript: string,
  durationSeconds: number,
  pauseCount: number,
  audioMetrics: SpeakingAudioMetrics,
  targetSeconds: number,
) {
  const words = transcript.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  const uniqueWords = new Set(words);
  const fillerCount = (transcript.match(/\b(?:um|uh|er|you know|basically|actually)\b/gi) ?? []).length;
  const connectorCount = (transcript.match(/\b(?:because|for example|for instance|however|although|whereas|therefore|that said|on the other hand)\b/gi) ?? []).length;
  const wordsPerMinute = durationSeconds > 0 ? Math.round(words.length / durationSeconds * 60) : 0;
  const strengths: string[] = [];
  const priorities: string[] = [];

  if (durationSeconds >= targetSeconds * .75) strengths.push(`回答持续 ${durationSeconds} 秒，已接近本 Part 的 ${targetSeconds} 秒训练目标。`);
  else priorities.push(`回答只有 ${durationSeconds} 秒；用“观点—原因—例子—补充”再扩展约 ${Math.max(10, targetSeconds - durationSeconds)} 秒。`);
  if (connectorCount >= 2) strengths.push(`识别稿中检测到 ${connectorCount} 个展开或转折信号，答案结构较清楚。`);
  else priorities.push("加入 because、for example、that said 等连接信号，让考官听清观点如何展开。");
  if (fillerCount <= 2) strengths.push("明显填充词较少，表达比反复使用 um / actually 更利落。");
  else priorities.push(`识别到约 ${fillerCount} 个填充词；卡顿时短暂停顿，比连续说 um / actually 更自然。`);
  if (audioMetrics.quietRatio > 0 && audioMetrics.quietRatio <= .38) strengths.push("录音中的有效声音占比较稳定，没有出现大段无声区间。");
  else if (audioMetrics.quietRatio > .38) priorities.push(`约 ${Math.round(audioMetrics.quietRatio * 100)}% 的录音处于低音量区间；把麦克风放近一些，并用意群而不是单词逐个停顿。`);
  if (audioMetrics.rms > 0 && audioMetrics.rms < .025) priorities.push("整体音量偏低；回听时检查句尾是否越说越轻，下一轮让关键词保持清晰。");
  if (audioMetrics.clipRatio > .01) priorities.push("录音出现削波迹象，可能离麦克风过近；稍微拉开距离再录一次。");
  if (pauseCount > 2) priorities.push(`本次手动暂停了 ${pauseCount} 次；正式考试不能暂停，下一轮尝试用完整意群连续作答。`);
  if (!transcript.trim()) priorities.push("浏览器没有生成可靠识别稿；请先回听录音，再在识别稿框补充关键内容，才能获得词汇与结构分析。");
  if (words.length > 0 && uniqueWords.size / words.length >= .62) strengths.push("识别稿的词汇重复度较低，表达有一定变化。");
  if (wordsPerMinute > 0 && (wordsPerMinute < 90 || wordsPerMinute > 175)) priorities.push(`当前约 ${wordsPerMinute} 词/分钟；建议保持约 100–160 词/分钟，并优先保证清楚。`);

  return {
    metrics: [
      { label: "回答长度", value: `${durationSeconds}s / ${targetSeconds}s` },
      { label: "估算语速", value: wordsPerMinute ? `${wordsPerMinute} wpm` : "待补识别稿" },
      { label: "低音量区间", value: audioMetrics.quietRatio ? `${Math.round(audioMetrics.quietRatio * 100)}%` : "未检测" },
      { label: "词汇变化", value: words.length ? `${Math.round(uniqueWords.size / words.length * 100)}%` : "待补识别稿" },
    ],
    strengths: strengths.length ? strengths.slice(0, 3) : ["录音已完整保存于当前页面，可以通过回听进行自我复盘。"],
    priorities: priorities.length ? priorities.slice(0, 4) : ["下一轮尝试加入一个更具体的个人例子，并让结尾句明确回扣问题。"],
  };
}

function buildSpeakingImprovementDrills(
  transcript: string,
  durationSeconds: number,
  pauseCount: number,
  audioMetrics: SpeakingAudioMetrics,
  targetSeconds: number,
  template: SpeakingTopicTemplate,
) {
  const words = transcript.match(/[a-z]+(?:'[a-z]+)?/gi) ?? [];
  const fillerCount = (transcript.match(/\b(?:um|uh|er|you know|basically|actually)\b/gi) ?? []).length;
  const wordsPerMinute = durationSeconds > 0 ? Math.round(words.length / durationSeconds * 60) : 0;
  const modelSentence = template.steps[0]?.example ?? template.usefulPhrases[0];
  const chunkedModel = modelSentence.split(/\s+/).reduce((groups, word, index) => {
    const groupIndex = Math.floor(index / 4);
    groups[groupIndex] = groups[groupIndex] ? `${groups[groupIndex]} ${word}` : word;
    return groups;
  }, [] as string[]).join(" / ");
  const drills: { title: string; reason: string; action: string; example: string }[] = [];

  if ((audioMetrics.quietRatio > .38) || (audioMetrics.rms > 0 && audioMetrics.rms < .025)) {
    drills.push({ title: "音量与句尾清晰度", reason: "本次录音的低音量区间偏多，句尾可能不够清楚。", action: "麦克风保持一拳距离，把每句最后一个关键词说完整；先慢读两遍，再按正常速度录一遍。", example: modelSentence });
  } else {
    drills.push({ title: "重音与自然节奏", reason: "音量基本稳定，下一步把重点从“每个词都一样重”改为突出内容词。", action: "朗读例句三遍，每次只重读名词、动词和形容词，功能词保持轻短。", example: modelSentence });
  }
  if (fillerCount > 2 || pauseCount > 2 || (wordsPerMinute > 0 && (wordsPerMinute < 90 || wordsPerMinute > 175))) {
    drills.push({ title: "停顿与意群训练", reason: `本次检测到 ${fillerCount} 个明显填充词、${pauseCount} 次手动暂停，估算语速 ${wordsPerMinute || 0} wpm。`, action: "按照斜线分意群朗读；每个意群一口气说完，斜线处安静停半秒，不用 um 填空。", example: chunkedModel });
  } else {
    drills.push({ title: "连续表达训练", reason: "语速和明显停顿处于可控范围，可以进一步提高答案连贯度。", action: "不看完整稿，只看 4 个关键词，连续说两遍；第二遍增加一个 because 和一个具体例子。", example: `${template.usefulPhrases.slice(0, 3).join(" → ")}` });
  }
  if (durationSeconds < targetSeconds * .75) {
    drills.push({ title: "答案展开训练", reason: `本次回答 ${durationSeconds} 秒，距离 ${targetSeconds} 秒目标仍有空间。`, action: "用模板的前三步各说 1–2 句，最后补充一个真实细节；不要重复同一句观点。", example: template.steps.slice(0, 3).map((step) => step.label.replace(/^\d+ · /, "")).join(" → ") });
  } else {
    drills.push({ title: "结尾回扣训练", reason: "回答长度已经接近目标，重点应转向结尾是否明确回应问题。", action: "保留原答案主体，只重录最后两句：先总结判断，再说明它为什么重要或可能怎样变化。", example: "Overall, I would say… / The main reason is that…" });
  }
  return drills;
}

function SpeakingTranscriptHighlight({ transcript }: { transcript: string }) {
  if (!transcript.trim()) return <p className="speaking-transcript-empty">暂无可靠识别稿，可回听录音后手动补充再重做一次。</p>;
  const highlighted = transcript.split(/(\b(?:because|for example|for instance|however|although|whereas|therefore|that said|on the other hand)\b|\b(?:um|uh|er|you know|basically|actually)\b)/gi);
  return <p>{highlighted.map((part, index) => {
    if (/^(?:because|for example|for instance|however|although|whereas|therefore|that said|on the other hand)$/i.test(part)) return <mark className="is-good" key={`${part}-${index}`}>{part}</mark>;
    if (/^(?:um|uh|er|you know|basically|actually)$/i.test(part)) return <mark className="needs-work" key={`${part}-${index}`}>{part}</mark>;
    return <span key={`${part}-${index}`}>{part}</span>;
  })}</p>;
}

function buildAdaptiveSpeakingFollowUp(
  taskId: string,
  transcript: string,
  fallbackQuestion: string,
  followUpIndex: number,
) {
  const stopWords = new Set(["about", "actually", "also", "because", "been", "being", "could", "from", "have", "just", "like", "more", "people", "really", "that", "their", "there", "these", "they", "thing", "think", "this", "very", "what", "when", "which", "with", "would"]);
  const words = transcript.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  const candidates = words.filter((word) => word.length > 3 && !stopWords.has(word));
  if (candidates.length < 1) return fallbackQuestion;
  const counts = candidates.reduce((result, word) => ({ ...result, [word]: (result[word] ?? 0) + 1 }), {} as Record<string, number>);
  const keyword = Object.entries(counts).sort((left, right) => (right[1] * 3 + right[0].length) - (left[1] * 3 + left[0].length))[0]?.[0];
  if (!keyword) return fallbackQuestion;
  const answerReference = `the idea of “${keyword}”`;

  if (taskId === "part-1") {
    const questions = [
      `You mentioned ${answerReference}. How does that affect daily life in your home town?`,
      `Thinking about ${answerReference}, what kind of work or opportunities are common there?`,
      `Does ${answerReference} make your home town a good place for young people to live? Why or why not?`,
      `Has your experience of ${answerReference} influenced the kind of accommodation you would like in the future?`,
    ];
    return questions[followUpIndex] ?? `You mentioned ${answerReference}. ${fallbackQuestion}`;
  }
  if (taskId === "part-2") {
    const questions = [
      `You mentioned ${answerReference}. Is its value mainly financial, emotional, or both?`,
      `If you lost the item connected with ${answerReference}, what exactly would be hardest to replace?`,
    ];
    return questions[followUpIndex] ?? `You mentioned ${answerReference}. ${fallbackQuestion}`;
  }
  if (taskId === "part-3") {
    const questions = [
      `You connected status with ${answerReference}. Is that different from what gave people status in your parents' generation?`,
      `How might advertising influence people's desire for things associated with ${answerReference}?`,
    ];
    return questions[followUpIndex] ?? `You mentioned ${answerReference}. ${fallbackQuestion}`;
  }
  return `You mentioned ${answerReference}. ${fallbackQuestion}`;
}

function OfficialSpeakingResponse({
  task,
  submitted,
  storedResponses,
  onSubmit,
  onRedo,
}: {
  task: OfficialTaskSegment;
  submitted: boolean;
  storedResponses?: Record<string, string>;
  onSubmit: (responses: Record<string, string>) => void;
  onRedo: () => void;
}) {
  const prompt = task.speakingPrompt!;
  const allQuestions = [prompt.examinerQuestion, ...prompt.supportingQuestions];
  const storedTurnQuestions = allQuestions.map((_, index) => storedResponses?.[`turn-${index + 1}-question`]).filter((question): question is string => Boolean(question));
  const [questionIndex, setQuestionIndex] = useState(submitted ? allQuestions.length - 1 : 0);
  const [askedQuestions, setAskedQuestions] = useState<string[]>(submitted ? (storedTurnQuestions.length === allQuestions.length ? storedTurnQuestions : allQuestions) : [prompt.examinerQuestion]);
  const [turnResults, setTurnResults] = useState<SpeakingTurnResult[]>([]);
  const currentQuestion = askedQuestions[questionIndex] ?? allQuestions[questionIndex];
  const followUpTargetSeconds = task.id === "part-3" ? 50 : 30;
  const currentTargetSeconds = questionIndex === 0 ? prompt.targetSeconds : followUpTargetSeconds;
  const totalTargetSeconds = prompt.targetSeconds + prompt.supportingQuestions.length * followUpTargetSeconds;
  const [phase, setPhase] = useState<"idle" | "asking" | "preparing" | "ready" | "recording" | "recorded">(submitted ? "recorded" : "idle");
  const [prepRemaining, setPrepRemaining] = useState(prompt.preparationSeconds);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [examinerAudioState, setExaminerAudioState] = useState<"idle" | "playing" | "paused">("idle");
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "finished">(submitted ? "finished" : "idle");
  const [durationSeconds, setDurationSeconds] = useState(Number(storedResponses?.durationSeconds ?? 0));
  const [pauseCount, setPauseCount] = useState(Number(storedResponses?.pauseCount ?? 0));
  const [transcript, setTranscript] = useState(storedResponses?.transcript ?? "");
  const [prepNotes, setPrepNotes] = useState(storedResponses?.prepNotes ?? "");
  const [audioUrl, setAudioUrl] = useState("");
  const [status, setStatus] = useState(submitted ? "本 Part 已提交。录音文件只保留在录制时的当前页面，识别稿和分析已保存。" : "先播放考官问题，问题结束后开始 60 秒准备。");
  const [audioMetrics, setAudioMetrics] = useState<SpeakingAudioMetrics>({
    rms: Number(storedResponses?.audioRms ?? 0),
    quietRatio: Number(storedResponses?.quietRatio ?? 0),
    clipRatio: Number(storedResponses?.clipRatio ?? 0),
  });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef("");
  const examinerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  type RecognitionResultEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
  type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((event: RecognitionResultEvent) => void) | null; onerror: (() => void) | null };
  type RecognitionConstructor = new () => Recognition;
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => {
    if (phase !== "preparing") return;
    const timer = window.setTimeout(() => setPrepRemaining((current) => {
      if (current <= 1) {
        setPhase("ready");
        setStatus("准备时间结束，可以开始录音。");
        return 0;
      }
      return current - 1;
    }), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, prepRemaining]);

  useEffect(() => {
    if (recordingState !== "recording") return;
    const timer = window.setInterval(() => setDurationSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recordingState]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    if (examinerUtteranceRef.current) {
      examinerUtteranceRef.current.onend = null;
      examinerUtteranceRef.current.onerror = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const beginPreparation = () => {
    setExaminerAudioState("idle");
    setPrepRemaining(prompt.preparationSeconds);
    setPhase("preparing");
    setStatus("准备计时已开始。可在下方记录关键词，不要写完整稿。");
  };

  const playExaminerQuestion = (question = currentQuestion) => {
    if (submitted || recordingState === "recording" || recordingState === "paused") return;
    setShowSubtitles(false);
    setPhase("asking");
    setStatus("考官正在提问；听不懂时可以打开字幕或暂停。");
    if (!("speechSynthesis" in window)) {
      setShowSubtitles(true);
      beginPreparation();
      return;
    }
    if (examinerUtteranceRef.current) {
      examinerUtteranceRef.current.onend = null;
      examinerUtteranceRef.current.onerror = null;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = "en-GB";
    utterance.rate = .86;
    examinerUtteranceRef.current = utterance;
    setExaminerAudioState("playing");
    utterance.onend = beginPreparation;
    utterance.onerror = beginPreparation;
    window.speechSynthesis.speak(utterance);
  };

  const toggleExaminerAudio = () => {
    if (!("speechSynthesis" in window)) return;
    if (examinerAudioState === "playing") {
      window.speechSynthesis.pause();
      setExaminerAudioState("paused");
    } else if (examinerAudioState === "paused") {
      window.speechSynthesis.resume();
      setExaminerAudioState("playing");
    }
  };

  const startRecognition = () => {
    const speechWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.lang = "en-GB";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let nextText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) nextText += `${event.results[index][0].transcript} `;
      }
      if (nextText) setTranscript((current) => `${current} ${nextText}`.trim());
    };
    recognition.onerror = () => setStatus("录音仍在继续，但浏览器没有可靠生成识别稿；结束后可手动补充。");
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { /* Speech recognition is optional; recording still continues. */ }
  };

  const analyseAudio = async (blob: Blob) => {
    try {
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
      const samples = audioBuffer.getChannelData(0);
      let squareSum = 0;
      let clipped = 0;
      let quietWindows = 0;
      let windows = 0;
      for (let offset = 0; offset < samples.length; offset += 1024) {
        let windowSquareSum = 0;
        const end = Math.min(samples.length, offset + 1024);
        for (let index = offset; index < end; index += 1) {
          const value = samples[index];
          squareSum += value * value;
          windowSquareSum += value * value;
          if (Math.abs(value) > .98) clipped += 1;
        }
        const windowRms = Math.sqrt(windowSquareSum / Math.max(1, end - offset));
        if (windowRms < .015) quietWindows += 1;
        windows += 1;
      }
      setAudioMetrics({
        rms: Math.sqrt(squareSum / Math.max(1, samples.length)),
        quietRatio: quietWindows / Math.max(1, windows),
        clipRatio: clipped / Math.max(1, samples.length),
      });
      await audioContext.close();
    } catch {
      setStatus("录音已完成，但当前浏览器无法读取音量数据；仍可回听并提交识别稿分析。");
    }
  };

  const startRecording = async () => {
    if (submitted || !navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      setStatus("当前浏览器不支持网页录音；请使用最新版 Chrome 或 Safari 并允许麦克风权限。");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
      setAudioUrl("");
      setTranscript("");
      setDurationSeconds(0);
      setPauseCount(0);
      setAudioMetrics({ rms: 0, quietRatio: 0, clipRatio: 0 });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioUrl(url);
        setRecordingState("finished");
        setPhase("recorded");
        setStatus("录音完成。请先回听并检查识别稿，再提交本 Part。");
        stream.getTracks().forEach((track) => track.stop());
        void analyseAudio(blob);
      };
      recorder.start(500);
      startRecognition();
      setRecordingState("recording");
      setPhase("recording");
      setStatus("正在录音。正式考试不能暂停；这里保留暂停键用于训练和设备检查。");
    } catch {
      setStatus("无法使用麦克风。请在浏览器地址栏允许麦克风权限后重试。");
    }
  };

  const toggleRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recordingState === "recording") {
      recorder.pause();
      setPauseCount((current) => current + 1);
      setRecordingState("paused");
      setStatus("录音已暂停；继续后会录在同一段音频中。");
    } else if (recordingState === "paused") {
      recorder.resume();
      setRecordingState("recording");
      setStatus("录音已继续。");
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  };

  const feedback = analyzeOfficialSpeakingResponse(transcript, durationSeconds, pauseCount, audioMetrics, submitted ? totalTargetSeconds : currentTargetSeconds);
  const improvementDrills = buildSpeakingImprovementDrills(transcript, durationSeconds, pauseCount, audioMetrics, submitted ? totalTargetSeconds : currentTargetSeconds, prompt.topicTemplate);
  const submitRecording = () => {
    if (!audioUrl || durationSeconds < 3) return;
    const currentTurn: SpeakingTurnResult = { question: currentQuestion, transcript, prepNotes, durationSeconds, pauseCount, audioMetrics };
    const completedTurns = [...turnResults, currentTurn];
    if (questionIndex < allQuestions.length - 1) {
      const nextQuestionIndex = questionIndex + 1;
      const nextQuestion = buildAdaptiveSpeakingFollowUp(task.id, transcript, prompt.supportingQuestions[questionIndex], questionIndex);
      setTurnResults(completedTurns);
      setQuestionIndex(nextQuestionIndex);
      setAskedQuestions((current) => [...current, nextQuestion]);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
      setAudioUrl("");
      setTranscript("");
      setPrepNotes("");
      setDurationSeconds(0);
      setPauseCount(0);
      setAudioMetrics({ rms: 0, quietRatio: 0, clipRatio: 0 });
      setRecordingState("idle");
      playExaminerQuestion(nextQuestion);
      return;
    }
    const totalDuration = completedTurns.reduce((sum, turn) => sum + turn.durationSeconds, 0);
    const totalPauses = completedTurns.reduce((sum, turn) => sum + turn.pauseCount, 0);
    const aggregateMetrics = completedTurns.reduce((metrics, turn) => ({
      rms: metrics.rms + turn.audioMetrics.rms * turn.durationSeconds / Math.max(1, totalDuration),
      quietRatio: metrics.quietRatio + turn.audioMetrics.quietRatio * turn.durationSeconds / Math.max(1, totalDuration),
      clipRatio: metrics.clipRatio + turn.audioMetrics.clipRatio * turn.durationSeconds / Math.max(1, totalDuration),
    }), { rms: 0, quietRatio: 0, clipRatio: 0 });
    const aggregateTranscript = completedTurns.map((turn) => turn.transcript).filter(Boolean).join("\n\n");
    const responses: Record<string, string> = {
      transcript: aggregateTranscript,
      prepNotes: completedTurns.map((turn) => turn.prepNotes).filter(Boolean).join(" | "),
      durationSeconds: String(totalDuration),
      pauseCount: String(totalPauses),
      audioRms: String(aggregateMetrics.rms),
      quietRatio: String(aggregateMetrics.quietRatio),
      clipRatio: String(aggregateMetrics.clipRatio),
      turnCount: String(completedTurns.length),
      followUpMode: "answer-aware",
    };
    completedTurns.forEach((turn, index) => {
      responses[`turn-${index + 1}-question`] = turn.question;
      responses[`turn-${index + 1}-transcript`] = turn.transcript;
      responses[`turn-${index + 1}-duration`] = String(turn.durationSeconds);
    });
    setTurnResults(completedTurns);
    setTranscript(aggregateTranscript);
    setDurationSeconds(totalDuration);
    setPauseCount(totalPauses);
    setAudioMetrics(aggregateMetrics);
    onSubmit(responses);
  };
  const restartPractice = () => {
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = "";
    setAudioUrl("");
    setQuestionIndex(0);
    setAskedQuestions([prompt.examinerQuestion]);
    setTurnResults([]);
    setPhase("idle");
    setRecordingState("idle");
    setPrepRemaining(prompt.preparationSeconds);
    setDurationSeconds(0);
    setPauseCount(0);
    setTranscript("");
    setPrepNotes("");
    setAudioMetrics({ rms: 0, quietRatio: 0, clipRatio: 0 });
    setStatus("先播放考官问题，问题结束后开始 60 秒准备。");
    onRedo();
  };

  return (
    <section className="official-speaking-response">
      <header><div><span>COMPUTER-DELIVERED SPEAKING PRACTICE</span><strong>{task.label} · 语音作答区</strong><small>每次提交后考官继续追问；全部回答后才生成反馈</small></div><b>{submitted ? "✓ 已提交" : recordingState === "recording" ? `● ${durationSeconds}s` : `${currentTargetSeconds}s 目标`}</b></header>
      <div className="speaking-question-progress"><span>本 Part 问题进度</span><b>{submitted ? allQuestions.length : questionIndex + 1} / {allQuestions.length}</b><div>{allQuestions.map((_, index) => <i className={submitted || index < questionIndex ? "is-done" : index === questionIndex ? "is-current" : ""} title={askedQuestions[index] ?? "等待上一轮回答后生成"} key={`speaking-question-${index}`} />)}</div></div>
      <div className="speaking-examiner-card">
        <div className="speaking-examiner-avatar">EX</div>
        <div><span>EXAMINER · {questionIndex > 0 ? "ANSWER-AWARE FOLLOW-UP" : `QUESTION ${questionIndex + 1}`}</span>{questionIndex > 0 && <small className="speaking-adaptive-badge">根据你上一轮的回答追问</small>}<p className={showSubtitles ? "" : "is-hidden"}>{showSubtitles ? currentQuestion : phase === "idle" ? "点击播放后，考官会用英语提问。" : phase === "asking" ? "🔊 考官问题正在播放 · 字幕已隐藏" : "考官问题已播放 · 字幕已隐藏"}</p></div>
        <div className="speaking-examiner-actions"><button type="button" disabled={submitted || recordingState === "recording" || recordingState === "paused"} onClick={() => playExaminerQuestion()}>{phase === "idle" ? "▶ 播放考官问题" : "↺ 重听当前问题"}</button><button type="button" disabled={examinerAudioState === "idle"} onClick={toggleExaminerAudio}>{examinerAudioState === "paused" ? "▶ 继续" : "Ⅱ 暂停"}</button><button type="button" onClick={() => setShowSubtitles((current) => !current)}>{showSubtitles ? "隐藏字幕" : "显示字幕"}</button></div>
      </div>
      {(phase === "preparing" || phase === "ready") && !submitted && <div className="speaking-prep-panel"><header><div><span>PREPARATION</span><strong>{phase === "ready" ? "准备结束" : "60 秒准备中"}</strong></div><b>{String(prepRemaining).padStart(2, "0")}<small>s</small></b></header><div><i style={{ width: `${prepRemaining / prompt.preparationSeconds * 100}%` }} /></div>{questionIndex === 0 && prompt.cuePoints && <ul>{prompt.cuePoints.map((point) => <li key={point}>{point}</li>)}</ul>}<textarea aria-label="Speaking preparation notes" placeholder="只记关键词，例如：camera · father · first trip · independence" value={prepNotes} onChange={(event) => setPrepNotes(event.target.value)} /><button type="button" onClick={startRecording}>{phase === "ready" ? "● 开始录音" : "准备好了，提前开始录音"}</button></div>}
      <div className="official-speaking-recorder">
        <div className={`speaking-recording-orb ${recordingState === "recording" ? "is-recording" : ""}`}><span>{recordingState === "recording" ? "●" : recordingState === "paused" ? "Ⅱ" : "◉"}</span><b>{String(Math.floor(durationSeconds / 60)).padStart(2, "0")}:{String(durationSeconds % 60).padStart(2, "0")}</b><small>{recordingState === "recording" ? "Recording" : recordingState === "paused" ? "Paused" : recordingState === "finished" ? "Ready to review" : "Not started"}</small></div>
        <div className="speaking-recorder-actions">{phase === "idle" && !submitted && <button type="button" disabled>请先听考官提问</button>}{(phase === "preparing" || phase === "ready") && !submitted && <button type="button" onClick={startRecording}>● 开始录音</button>}{(recordingState === "recording" || recordingState === "paused") && <><button type="button" onClick={toggleRecording}>{recordingState === "paused" ? "▶ 继续录音" : "Ⅱ 暂停录音"}</button><button type="button" className="is-danger" onClick={stopRecording}>■ 结束录音</button></>}{recordingState === "finished" && !submitted && <button type="button" onClick={startRecording}>↺ 重新录制</button>}{/* eslint-disable jsx-a11y/media-has-caption */}{audioUrl && <audio controls src={audioUrl}>当前浏览器不支持录音回放。</audio>}{/* eslint-enable jsx-a11y/media-has-caption */}</div>
      </div>
      <div className="speaking-recording-status" aria-live="polite">{status}</div>
      {(recordingState === "finished" || submitted) && <div className="speaking-transcript-editor"><label htmlFor={`speaking-transcript-${task.id}`}>语音识别稿 <small>可修正浏览器识别错误；修改后再提交会让词汇与结构分析更准确</small></label><textarea id={`speaking-transcript-${task.id}`} disabled={submitted} value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="浏览器未生成识别稿时，可以在回听后补充主要内容……" /></div>}
      {!submitted && recordingState === "finished" && <footer><span>{durationSeconds < 3 ? "录音过短，请至少说 3 秒。" : questionIndex < allQuestions.length - 1 ? `提交后考官会自动提出第 ${questionIndex + 2} 个问题，本 Part 暂时不会完成。` : "这是最后一个问题；提交后生成整组反馈与话题模板。"}</span><button type="button" disabled={!audioUrl || durationSeconds < 3} onClick={submitRecording}>{questionIndex < allQuestions.length - 1 ? "提交本题，听下一问" : "提交最后一题并生成反馈"}</button></footer>}
      {submitted && <section className="official-speaking-feedback"><header><div><span>PERSONALISED SPEAKING REVIEW</span><strong>回答完成后生成的语音不足与改进建议</strong></div><button type="button" onClick={restartPractice}>再做一次</button></header><div className="speaking-feedback-metrics">{feedback.metrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><b>{metric.value}</b></article>)}</div><div className="speaking-feedback-columns"><article><strong>这次做得好</strong><ul>{feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul></article><article><strong>语音不足与下一轮改进</strong><ul>{feedback.priorities.map((item) => <li key={item}>{item}</li>)}</ul></article></div><section className="speaking-improvement-drills"><header><span>TARGETED VOICE PRACTICE</span><strong>根据本次回答安排的 3 个改进练习</strong></header><div>{improvementDrills.map((drill) => <article key={drill.title}><b>{drill.title}</b><p>{drill.reason}</p><strong>怎么练</strong><p>{drill.action}</p><blockquote>{drill.example}</blockquote></article>)}</div></section><div className="speaking-transcript-highlight"><header><b>识别稿荧光复盘</b><small><i className="good" /> 展开词 · <i className="watch" /> 填充词</small></header><SpeakingTranscriptHighlight transcript={transcript} /></div><p className="speaking-feedback-limit">本地分析会检查时长、语速、停顿区间、音量和语言结构，但不能可靠判断单个音素是否准确，也不冒充 IELTS 官方分数。请结合录音回听和官方示范录音复盘发音。</p></section>}
      {submitted && <section className="speaking-topic-template"><header><div><span>TOPIC TEMPLATE · UNLOCKED</span><strong>{prompt.topicTemplate.title}</strong></div><small>整组问题完成后解锁；用于重做时组织观点</small></header><div>{prompt.topicTemplate.steps.map((step) => <article key={step.label}><b>{step.label}</b><p>{step.prompt}</p><blockquote>{step.example}</blockquote></article>)}</div><aside><b>可替换表达</b><p>{prompt.topicTemplate.usefulPhrases.join(" · ")}</p></aside><div className="speaking-follow-up"><b>本轮考官实际提出的问题</b>{askedQuestions.map((question, index) => <p key={`${question}-${index}`}>{index + 1}. “{question}”{index > 0 ? <small>根据上一轮回答生成</small> : null}</p>)}</div><p className="speaking-exam-note">{prompt.examNote}</p></section>}
    </section>
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
      const next = {
        ...current,
        dailyVocabularyCompleted,
        dailyDictationCompleted,
        completed: { ...current.completed, vocabulary: fullyCompleted },
        carryoverTasks: fullyCompleted ? current.carryoverTasks.filter((item) => item !== "vocabulary") : current.carryoverTasks,
      };
      return fullyCompleted && !current.completed.vocabulary
        ? recordStudyActivity(next, { id: "daily-skill:vocabulary", label: "词汇训练", minutes: 15 })
        : next;
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

  const invalidateSubmission = () => {
    setScore(null);
    setShowTranscript(false);
  };

  const toggleFacility = (option: string) => {
    invalidateSubmission();
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
    setShowTranscript(false);
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
                <input value={formAnswers[question.id] ?? ""} onChange={(event) => { invalidateSubmission(); setFormAnswers((current) => ({ ...current, [question.id]: event.target.value })); }} aria-label={`Question ${index + 1}, ${question.label}`} />
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
            return <label className={`matching-row ${resultClass}`} key={question.id}><span>{index + 7}. {question.label}</span><select value={matchingAnswers[question.id] ?? ""} onChange={(event) => { invalidateSubmission(); setMatchingAnswers((current) => ({ ...current, [question.id]: event.target.value })); }} aria-label={`Question ${index + 7}`}><option value="">Select</option>{listeningExercise.matching.options.map((option) => <option value={option.id} key={option.id}>{option.id}</option>)}</select></label>;
          })}
        </section>

        <section className="listening-question-group">
          <div className="question-type"><span>Questions 9–10</span><strong>Multiple Choice · Choose ONE</strong><p>Choose the correct letter, A, B or C.</p></div>
          {listeningExercise.multipleChoice.map((question, index) => {
            const resultClass = score === null ? "" : choiceAnswers[question.id] === question.answer ? "is-correct" : "is-incorrect";
            return <fieldset className={`question-block ${resultClass}`} key={question.id}><legend>{index + 9}. {question.prompt}</legend>{question.options.map((option, optionIndex) => <label className={choiceAnswers[question.id] === option ? "is-selected" : ""} key={option}><input type="radio" name={question.id} value={option} checked={choiceAnswers[question.id] === option} onChange={() => { invalidateSubmission(); setChoiceAnswers((current) => ({ ...current, [question.id]: option })); }} /><b>{String.fromCharCode(65 + optionIndex)}</b><span>{option}</span></label>)}</fieldset>;
          })}
        </section>

        {score !== null && <div className={`answer-feedback ${score >= 8 ? "success" : "neutral"}`}>得分 {score} / 10。{score < 8 ? "建议打开原文，重点检查拼写、同义替换和转折后的信息。" : "细节定位和拼写表现良好。"}</div>}
        <div className="exercise-actions"><button className="text-action" disabled={score === null} onClick={() => setShowTranscript((current) => !current)}>{score === null ? "提交后解锁原文" : showTranscript ? "隐藏原文" : "查看原文复盘"}</button><button className="secondary-action" disabled={answeredCount < 10} onClick={submit}>提交 10 道答案 →</button></div>
      </div>
      <aside className={`exercise-context transcript-panel listening-transcript ${score === null ? "is-locked" : "is-unlocked"}`}><span>{score === null ? "听力原文 · 未解锁" : "听力原文 · 已解锁"}</span><p>{score === null ? "请先完成全部 10 道题并提交。判分前不会显示原文，避免提前看到答案线索。" : showTranscript ? listeningExercise.script : "已经完成提交。点击“查看原文复盘”，标记没有听到的拼写、连读和同义替换。"}</p></aside>
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

type WordbookEntry = {
  word: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  category: string;
  collection: "core" | "listening";
};

const mixedWordParts: Record<string, string> = {
  access: "n. / v.", alternative: "n. / adj.", approximate: "adj. / v.", attribute: "n. / v.", benefit: "n. / v.",
  code: "n. / v.", comment: "n. / v.", commission: "n. / v.", consent: "n. / v.", constant: "adj. / n.",
  contract: "n. / v.", contrast: "n. / v.", coordinate: "v. / n.", core: "n. / adj.", cycle: "n. / v.",
  debate: "n. / v.", design: "n. / v.", document: "n. / v.", estimate: "v. / n.", export: "n. / v.",
  feature: "n. / v.", final: "adj. / n.", finance: "n. / v.", focus: "n. / v.", function: "n. / v.",
  fund: "n. / v.", graduate: "n. / v.", grant: "n. / v.", impact: "n. / v.", implement: "v. / n.",
  individual: "n. / adj.", initial: "adj. / n.", institute: "n. / v.", label: "n. / v.", link: "n. / v.",
  major: "adj. / n. / v.", manufacture: "v. / n.", output: "n. / v.", parallel: "adj. / n.", partner: "n. / v.",
  potential: "adj. / n.", principal: "adj. / n.", process: "n. / v.", project: "n. / v.", purchase: "v. / n.",
  range: "n. / v.", register: "v. / n.", research: "n. / v.", secure: "v. / adj.", select: "v. / adj.",
  shift: "n. / v.", survey: "n. / v.", transfer: "v. / n.", transport: "n. / v.", waste: "n. / v.",
};

const verbWords = new Set(`analyse assess assume conduct constitute consume contaminate define derive establish indicate interpret recycle educate evaluate motivate participate automate communicate manufacture replace achieve acquire administrate affect assist compute conclude consist construct equate injure invest maintain obtain perceive regulate reside restrict seek compensate constrain contribute convene correspond deduce demonstrate dominate ensure exclude illustrate imply interact justify locate maximise negate publish react rely remove specify commit concentrate confer emerge implicate impose integrate investigate occupy predict promote resolve retain create distribute identify involve legislate occur proceed require respond vary`.split(" "));

function inferPartOfSpeech(word: string, meaning: string) {
  if (mixedWordParts[word]) return mixedWordParts[word];
  if (word === "despite") return "prep.";
  if (word === "hence") return "adv.";
  if (verbWords.has(word) || /(ate|fy|ise|ize)$/.test(word)) return "v.";
  if (/(tion|sion|ment|ness|ity|ance|ence|ism|ship|ure|acy|ics|logy|graphy)$/.test(word)) return "n.";
  if (meaning.includes("的") || /(able|ible|al|ant|ent|ary|ic|ive|ous|ful|less|ory)$/.test(word)) return "adj.";
  return "n.";
}

const wordbookEntries: WordbookEntry[] = Array.from(new Map([
  ...dailyVocabulary.map((entry) => ({
    word: entry.word,
    meaning: entry.meaning,
    partOfSpeech: inferPartOfSpeech(entry.word, entry.meaning),
    example: entry.collocation,
    category: entry.category,
    collection: "core" as const,
  })),
  ...vocabulary.map((entry) => ({
    word: entry.word,
    meaning: entry.meaning,
    partOfSpeech: inferPartOfSpeech(entry.word, entry.meaning),
    example: entry.example,
    category: "场景听写",
    collection: "listening" as const,
  })),
].map((entry) => [entry.word.toLowerCase(), entry])).values()).sort((a, b) => a.word.localeCompare(b.word));

function WordbookView({ progress, onBack }: { progress: LearningProgress; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<"all" | "core" | "listening">("all");
  const [visibleCount, setVisibleCount] = useState(60);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredWords = useMemo(() => wordbookEntries.filter((entry) => {
    const matchesCollection = collection === "all" || entry.collection === collection;
    const matchesQuery = !normalizedQuery || `${entry.word} ${entry.meaning} ${entry.category}`.toLowerCase().includes(normalizedQuery);
    return matchesCollection && matchesQuery;
  }), [collection, normalizedQuery]);
  const visibleWords = filteredWords.slice(0, visibleCount);
  const coreCount = wordbookEntries.filter((entry) => entry.collection === "core").length;
  const listeningCount = wordbookEntries.filter((entry) => entry.collection === "listening").length;

  const selectCollection = (next: "all" | "core" | "listening") => {
    setCollection(next);
    setVisibleCount(60);
  };

  return (
    <>
      <button className="wordbook-back" onClick={onBack}>← 返回“我的”</button>
      <PageHeader eyebrow="MY WORDBOOK" title="把全部词汇，装进" accent="一本单词本。" />
      <section className="wordbook-hero">
        <div><span>IELTS LEARNING LIBRARY</span><strong>{wordbookEntries.length}<small> 个待学习词汇</small></strong><p>包含 {coreCount} 个高频核心词与 {listeningCount} 个去重后的场景听写补充词。</p></div>
        <div className="wordbook-hero-stats"><span><b>{progress.reviewWords.length}</b>待复习</span><span><b>{progress.masteredWords.length}</b>已掌握</span></div>
      </section>
      <section className="wordbook-toolbar" aria-label="单词本筛选">
        <label><span>搜索单词或中文意思</span><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(60); }} placeholder="例如：environment / 环境" /></label>
        <div role="tablist" aria-label="词库分类">
          <button role="tab" aria-selected={collection === "all"} className={collection === "all" ? "is-active" : ""} onClick={() => selectCollection("all")}>全部 {wordbookEntries.length}</button>
          <button role="tab" aria-selected={collection === "core"} className={collection === "core" ? "is-active" : ""} onClick={() => selectCollection("core")}>高频核心 {coreCount}</button>
          <button role="tab" aria-selected={collection === "listening"} className={collection === "listening" ? "is-active" : ""} onClick={() => selectCollection("listening")}>场景听写 {listeningCount}</button>
        </div>
      </section>
      <div className="wordbook-result-line"><span>当前找到 {filteredWords.length} 个词</span><small>按字母顺序排列</small></div>
      <section className="wordbook-list" aria-label="全部学习词汇">
        {visibleWords.length === 0 ? <div className="empty-state"><strong>没有找到对应单词</strong><p>试试英文、中文意思或主题名称。</p></div> : visibleWords.map((entry) => {
          const isReview = progress.reviewWords.includes(entry.word);
          const isMastered = progress.masteredWords.includes(entry.word);
          return <article className="wordbook-entry" key={entry.word}>
            <header><span>{entry.category}</span>{isReview ? <b className="needs-review">待复习</b> : isMastered ? <b className="is-mastered">已掌握</b> : <b>待学习</b>}</header>
            <div className="wordbook-word"><div><h2>{entry.word}</h2><em>{entry.partOfSpeech}</em></div><button onClick={() => speak(entry.word, .76)} aria-label={`播放 ${entry.word}`}>▶</button></div>
            <p className="wordbook-meaning">{entry.meaning}</p>
            <div className="wordbook-example"><span>例句 / 常用搭配</span><p>{entry.example}</p></div>
          </article>;
        })}
      </section>
      {visibleCount < filteredWords.length && <button className="wordbook-more" onClick={() => setVisibleCount((current) => current + 60)}>继续显示更多 <span>{filteredWords.length - visibleCount}</span></button>}
    </>
  );
}

function ProfileView({ progress, percent, onReset }: { progress: LearningProgress; percent: number; onReset: () => void }) {
  const [showWordbook, setShowWordbook] = useState(false);
  const stats = useMemo(() => [
    ["今日完成度", `${percent}%`],
    ["今日词汇", `${progress.dailyVocabularyKnown.length} / 100`],
    ["累计学习", `${progress.minutes} 分钟`],
    ["待强化词汇", `${progress.reviewWords.length}`],
    ["我的笔记", `${progress.notebook.length}`],
    ["连续学习", `${progress.streak} 天`],
  ], [percent, progress]);
  if (showWordbook) return <WordbookView progress={progress} onBack={() => setShowWordbook(false)} />;
  return (
    <>
      <PageHeader eyebrow="LEARNING PROFILE" title="你的目标是" accent="雅思 7.0。" />
      <div className="profile-grid">{stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <button className="profile-wordbook" onClick={() => setShowWordbook(true)}>
        <span className="profile-wordbook-mark">Aa</span>
        <span><small>MY WORDBOOK</small><strong>我的单词本</strong><p>{wordbookEntries.length} 个完整学习词汇 · 中文意思、词性、例句与发音</p></span>
        <b>进入单词本 →</b>
      </button>
      <section className="profile-settings"><div><strong>本机测试数据</strong><p>当前版本把进度保存在这个浏览器中。登录和跨设备云同步会在后续接入。</p></div><button onClick={onReset}>重置学习进度</button></section>
    </>
  );
}
