import type { Skill } from "./learning-data";

export type WordRating = "known" | "fuzzy" | "unfamiliar";

export type ReviewScheduleItem = {
  dueDate: string;
  stage: number;
  lastRating: WordRating;
  lapses: number;
};

export type NotebookEntry = {
  id: string;
  kind: "word" | "question";
  title: string;
  detail: string;
  source: string;
  note: string;
  createdAt: string;
  media?: {
    kind: "audio" | "speech";
    label: string;
    url?: string;
    text?: string;
    startSeconds?: number;
    endSeconds?: number;
    segmentIndex?: number;
    segmentCount?: number;
  };
  reference?: {
    label: string;
    url: string;
    page: number;
  };
};

export type PersonalWordbookEntry = {
  word: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  addedAt: string;
};

export type PointReward = {
  id: string;
  label: string;
  points: number;
  category: "daily" | "official" | "carryover";
  earnedAt: string;
};

export type OfficialTaskResult = {
  score: number | null;
  total: number;
  responses: Record<string, string>;
  completedAt: string;
};

export type DailyStudyActivity = {
  id: string;
  label: string;
  minutes: number;
  seconds?: number;
};

export type StudyTimeCategory = Skill | "official-test" | "review" | "ai";

const studyTimeLabels: Record<StudyTimeCategory, string> = {
  vocabulary: "词汇",
  listening: "听力",
  reading: "阅读",
  speaking: "口语",
  "official-test": "套题训练",
  review: "笔记与复习",
  ai: "AI 学习",
};

export type DailyStudyRecord = {
  date: string;
  minutes: number;
  activeSeconds: number;
  activities: DailyStudyActivity[];
};

export type LearningProgress = {
  vocabularyLibraryVersion: string;
  targetBandScore: number;
  studyPlanDays: number;
  studyPlanStartedAt: string;
  completed: Record<Skill, boolean>;
  masteredWords: string[];
  reviewWords: string[];
  reviewSchedule: Record<string, ReviewScheduleItem>;
  notebook: NotebookEntry[];
  personalWordbook: PersonalWordbookEntry[];
  points: number;
  pointRewards: PointReward[];
  dailyVocabularyDate: string;
  dailyVocabularySeen: string[];
  dailyVocabularyKnown: string[];
  dailyVocabularyRatings: Record<string, WordRating>;
  dailyVocabularyAttempts: Record<string, number>;
  dailyDictationSeen: string[];
  connectedSpeechSeen: string[];
  dailyVocabularyCompleted: boolean;
  dailyDictationCompleted: boolean;
  listeningCorrect: boolean | null;
  listeningScore: number | null;
  readingScore: number | null;
  speakingTurns: number;
  speakingPart3Turns: number;
  speakingTurnsByDate: Record<string, number>;
  officialPracticeCompleted: string[];
  officialTaskResults: Record<string, OfficialTaskResult>;
  officialTaskAttemptHistory: Record<string, OfficialTaskResult[]>;
  dailyStudyHistory: Record<string, DailyStudyRecord>;
  carryoverTasks: Skill[];
  carryoverTaskDates: Partial<Record<Skill, string>>;
  activeStudySeconds: number;
  minutes: number;
  streak: number;
};

export const vocabularyLibraryVersion = "3600-v2-listening-corpus";
export const vocabularyPlanSize = 3600;

export function normalizeStudyPlanDays(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(30, Math.min(180, Math.round(value)))
    : 36;
}

function targetScoreWorkloadFactor(targetBandScore: number) {
  const score = normalizeTargetBandScore(targetBandScore);
  return 1 + (score - 7) * .12;
}

export function dailyVocabularyTarget(planDays: number, targetBandScore = 7) {
  const scaledTarget = vocabularyPlanSize / normalizeStudyPlanDays(planDays) * targetScoreWorkloadFactor(targetBandScore);
  return Math.max(15, Math.min(160, Math.round(scaledTarget / 5) * 5));
}

export function dailyDictationTarget(planDays: number, targetBandScore = 7) {
  const scaledTarget = 80 * 36 / normalizeStudyPlanDays(planDays) * targetScoreWorkloadFactor(targetBandScore);
  return Math.max(20, Math.min(120, Math.round(scaledTarget / 5) * 5));
}

export function dailyConnectedSpeechTarget(planDays: number, targetBandScore = 7) {
  const scaledTarget = 24 * 36 / normalizeStudyPlanDays(planDays) * (1 + (normalizeTargetBandScore(targetBandScore) - 7) * .14);
  return Math.max(6, Math.min(30, Math.round(scaledTarget)));
}

export function dailyReviewTarget(planDays: number, targetBandScore = 7) {
  const score = normalizeTargetBandScore(targetBandScore);
  const reviewRatio = .15 + (score - 5.5) * .04;
  return Math.max(5, Math.round(dailyVocabularyTarget(planDays, score) * reviewRatio));
}

export function targetPlanFocus(targetBandScore: number) {
  const score = normalizeTargetBandScore(targetBandScore);
  if (score >= 8) return { label: "高分精炼", listening: "弱读、转折与多重干扰", speaking: "抽象论证、追问与自然表达", reading: "复杂匹配、隐含观点与限时定位", writing: "精准论证、句式控制与高阶改写" };
  if (score >= 7.5) return { label: "高阶提分", listening: "同义替换、连读与干扰项", speaking: "观点展开、例证与互动追问", reading: "段落匹配、判断与快速定位", writing: "论证推进、衔接与词汇准确性" };
  if (score >= 6.5) return { label: "均衡提分", listening: "场景细节、拼写与题型切换", speaking: "完整回答、原因与例子", reading: "关键词定位、判断与摘要填空", writing: "任务回应、段落结构与常用论证" };
  return { label: "基础巩固", listening: "高频场景、数字与基础拼写", speaking: "清晰短句、常用话题与基本展开", reading: "主旨、事实信息与基础定位", writing: "完整句、基础结构与切题表达" };
}

export function officialSessionsPerWeek(planDays: number) {
  const days = normalizeStudyPlanDays(planDays);
  return days <= 45 ? 4 : days <= 90 ? 3 : 2;
}

export function estimatedDailyMinutes(planDays: number, targetBandScore = 7) {
  return 35 + Math.ceil(dailyVocabularyTarget(planDays, targetBandScore) * .15);
}

export function normalizeTargetBandScore(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 7;
  return Math.max(5.5, Math.min(8.5, Math.round(value * 2) / 2));
}

export type DailyDifficultyBand = 6 | 7 | 8;
export type DailyDifficultyStage = 1 | 2 | 3 | 4;

export type DailyDifficultyProfile = {
  band: DailyDifficultyBand;
  targetScore: number;
  label: string;
  summary: string;
  stage: DailyDifficultyStage;
  stageLabel: string;
  planDay: number;
  planDays: number;
  progressPercent: number;
  listening: { rate: number; passScore: number; focus: string; format: string };
  reading: { minutes: number; passScore: number; focus: string; format: string };
  speaking: { minimumWords: number; requireDevelopment: boolean; requireCounterpoint: boolean; focus: string; format: string };
};

type DailyDifficultyBaseProfile = Omit<DailyDifficultyProfile, "targetScore" | "stage" | "stageLabel" | "planDay" | "planDays" | "progressPercent">;

export const dailyDifficultyProfiles: Record<DailyDifficultyBand, DailyDifficultyBaseProfile> = {
  6: {
    band: 6,
    label: "基础准确",
    summary: "使用清晰定位信号建立正确率，再逐日增加同义替换和时间压力。",
    listening: { rate: .9, passScore: 6, focus: "数字、拼写与明确转折", format: "10 题连续作答 · 填空、多选、匹配、单选 · 答案按录音顺序出现" },
    reading: { minutes: 24, passScore: 7, focus: "关键词定位与事实判断", format: "Academic Passage 模式 · 匹配、选择、判断、摘要填空 · 原文与答题区并列" },
    speaking: { minimumWords: 10, requireDevelopment: false, requireCounterpoint: false, focus: "直接回答并说明一个原因", format: "Speaking Part 3 模式 · 无准备时间 · 考官逐题提问并根据回答追问" },
  },
  7: {
    band: 7,
    label: "考试节奏",
    summary: "使用自然语速、标准限时和更密集的同义替换完成训练。",
    listening: { rate: .96, passScore: 7, focus: "同义替换、连读与干扰项", format: "10 题连续作答 · 填空、多选、匹配、单选 · 含修正信息和干扰项" },
    reading: { minutes: 21, passScore: 8, focus: "段落匹配、判断与快速定位", format: "Academic Passage 模式 · 11 题混合题型 · 按 IELTS 题目指令限时作答" },
    speaking: { minimumWords: 18, requireDevelopment: true, requireCounterpoint: false, focus: "观点、原因和例子完整展开", format: "Speaking Part 3 模式 · 4–5 分钟 · 考官连续追问理由和例证" },
  },
  8: {
    band: 8,
    label: "高分压力",
    summary: "从自然考试语速起步，逐日提升对隐含信息、多重干扰和抽象论证的处理压力。",
    listening: { rate: 1, passScore: 8, focus: "弱读、快速修正与多重干扰", format: "10 题连续作答 · 高密度同义替换 · 重点处理限定词和说话者修正" },
    reading: { minutes: 18, passScore: 9, focus: "隐含观点、复杂匹配与高压定位", format: "Academic Passage 模式 · 复杂匹配与 NOT GIVEN 核验 · 严格限时" },
    speaking: { minimumWords: 28, requireDevelopment: true, requireCounterpoint: true, focus: "抽象论证、例证、让步与进一步追问", format: "Speaking Part 3 模式 · 抽象社会议题 · 考官基于回答动态追问" },
  },
};

export function targetDailyDifficultyBand(targetBandScore: number): DailyDifficultyBand {
  const target = normalizeTargetBandScore(targetBandScore);
  if (target <= 6) return 6;
  if (target <= 7) return 7;
  return 8;
}

export function dailyDifficultyProfileForDate(planStartedAt: string, contentDate: string, planDays: number, targetBandScore: number): DailyDifficultyProfile {
  const normalizedDays = normalizeStudyPlanDays(planDays);
  const startedAt = /^\d{4}-\d{2}-\d{2}$/.test(planStartedAt) ? planStartedAt : contentDate;
  const trainingDate = /^\d{4}-\d{2}-\d{2}$/.test(contentDate) ? contentDate : startedAt;
  const elapsedDays = Math.max(0, Math.floor((new Date(`${trainingDate}T12:00:00`).getTime() - new Date(`${startedAt}T12:00:00`).getTime()) / 86_400_000));
  const planDay = Math.min(normalizedDays, elapsedDays + 1);
  const progressRatio = Math.min(1, elapsedDays / Math.max(1, normalizedDays - 1));
  const progressPercent = Math.round(progressRatio * 100);
  const stage = Math.min(4, Math.floor(progressRatio * 4) + 1) as DailyDifficultyStage;
  const stageLabels: Record<DailyDifficultyStage, string> = { 1: "题型校准", 2: "稳定提升", 3: "考试强化", 4: "目标冲刺" };
  const stageFocus: Record<DailyDifficultyStage, string> = {
    1: "先熟悉本档题型与作答节奏",
    2: "增加同义替换并减少反应时间",
    3: "加强干扰信息、限时定位与连续表达",
    4: "按目标分数要求完成高压模拟",
  };
  const band = targetDailyDifficultyBand(targetBandScore);
  const base = dailyDifficultyProfiles[band];
  const rateIncrease = band === 8 ? .1 : .08;
  const readingTimeReduction = 4;
  const speakingWordIncrease = band === 6 ? 8 : band === 7 ? 12 : 17;
  return {
    ...base,
    targetScore: normalizeTargetBandScore(targetBandScore),
    stage,
    stageLabel: stageLabels[stage],
    planDay,
    planDays: normalizedDays,
    progressPercent,
    summary: `${base.summary} 今日阶段：${stageFocus[stage]}。`,
    listening: {
      ...base.listening,
      rate: Math.round((base.listening.rate + progressRatio * rateIncrease) * 100) / 100,
      passScore: Math.min(10, base.listening.passScore + Math.round(progressRatio * 2)),
      focus: `${base.listening.focus}；${stageFocus[stage]}`,
    },
    reading: {
      ...base.reading,
      minutes: Math.max(14, Math.round(base.reading.minutes - progressRatio * readingTimeReduction)),
      passScore: Math.min(10, base.reading.passScore + Math.round(progressRatio)),
      focus: `${base.reading.focus}；${stageFocus[stage]}`,
    },
    speaking: {
      ...base.speaking,
      minimumWords: Math.round(base.speaking.minimumWords + progressRatio * speakingWordIncrease),
      requireDevelopment: base.speaking.requireDevelopment || (band === 6 && stage >= 3),
      requireCounterpoint: band === 8 && stage >= 3,
      focus: `${base.speaking.focus}；${stageFocus[stage]}`,
    },
  };
}

export function dailyDifficultyBandForDate(planStartedAt: string, contentDate: string, planDays: number, targetBandScore: number): DailyDifficultyBand {
  return dailyDifficultyProfileForDate(planStartedAt, contentDate, planDays, targetBandScore).band;
}

export function targetOfficialSessionsPerWeek(planDays: number, targetBandScore: number) {
  const score = normalizeTargetBandScore(targetBandScore);
  const scoreBonus = score >= 8 ? 2 : score >= 7.5 ? 1 : 0;
  return Math.min(4, officialSessionsPerWeek(planDays) + scoreBonus);
}

export function targetEstimatedDailyMinutes(planDays: number, targetBandScore: number) {
  const score = normalizeTargetBandScore(targetBandScore);
  return Math.max(30, estimatedDailyMinutes(planDays, score) + Math.round((score - 7) * 4));
}

export function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localWeekKey(date = new Date()) {
  const monday = new Date(date);
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return localDayKey(monday);
}

export const reviewIntervals = [1, 3, 7, 14, 30, 60] as const;

export function dayKeyAfter(days: number, from = localDayKey()) {
  const date = new Date(`${from}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDayKey(date);
}

export type PlanProgressDetails = {
  percent: number;
  expectedPercent: number;
  planDay: number;
  remainingDays: number;
  vocabularyPercent: number;
  dailyTaskPercent: number;
  officialPracticePercent: number;
  consistencyPercent: number;
  completedDailyTasks: number;
  completedOfficialSessions: number;
  plannedOfficialSessions: number;
};

export function overallPlanProgress(progress: LearningProgress, today = localDayKey()): PlanProgressDetails {
  const planDays = normalizeStudyPlanDays(progress.studyPlanDays);
  const targetScore = normalizeTargetBandScore(progress.targetBandScore);
  const startedAt = /^\d{4}-\d{2}-\d{2}$/.test(progress.studyPlanStartedAt) ? progress.studyPlanStartedAt : today;
  const planEnd = dayKeyAfter(planDays - 1, startedAt);
  const elapsedDays = Math.floor((new Date(`${today}T12:00:00`).getTime() - new Date(`${startedAt}T12:00:00`).getTime()) / 86_400_000) + 1;
  const planDay = Math.min(planDays, Math.max(1, elapsedDays));
  const records = Object.values(progress.dailyStudyHistory).filter((record) => record.date >= startedAt && record.date <= today && record.date <= planEnd);
  const completedDailyTasks = records.reduce((total, record) => total + Math.min(4, new Set(record.activities
    .filter((activity) => activity.id.startsWith("daily-skill:"))
    .map((activity) => activity.id)).size), 0);
  const officialSessionIds = new Set(records.flatMap((record) => record.activities
    .filter((activity) => activity.id.startsWith("official-session:"))
    .map((activity) => activity.id)));
  const activeDays = records.filter((record) => record.activeSeconds >= 60 || record.activities.some((activity) => activity.id !== "app-active-time" && !activity.id.startsWith("study-time:"))).length;
  const plannedOfficialSessions = Math.max(1, Math.ceil(planDays / 7) * targetOfficialSessionsPerWeek(planDays, targetScore));
  const vocabularyPercent = Math.min(100, progress.masteredWords.length / vocabularyPlanSize * 100);
  const dailyTaskPercent = Math.min(100, completedDailyTasks / (planDays * 4) * 100);
  const officialPracticePercent = Math.min(100, officialSessionIds.size / plannedOfficialSessions * 100);
  const consistencyPercent = Math.min(100, activeDays / planDays * 100);
  const weights = targetScore >= 8
    ? { vocabulary: 25, daily: 30, official: 35, consistency: 10 }
    : targetScore >= 7.5
      ? { vocabulary: 30, daily: 35, official: 25, consistency: 10 }
      : targetScore >= 6.5
        ? { vocabulary: 35, daily: 35, official: 20, consistency: 10 }
        : { vocabulary: 40, daily: 40, official: 10, consistency: 10 };
  const percent = Math.min(100, Math.round(
    vocabularyPercent * weights.vocabulary / 100
    + dailyTaskPercent * weights.daily / 100
    + officialPracticePercent * weights.official / 100
    + consistencyPercent * weights.consistency / 100,
  ));
  return {
    percent,
    expectedPercent: Math.min(100, Math.round(planDay / planDays * 100)),
    planDay,
    remainingDays: Math.max(0, planDays - planDay),
    vocabularyPercent: Math.round(vocabularyPercent),
    dailyTaskPercent: Math.round(dailyTaskPercent),
    officialPracticePercent: Math.round(officialPracticePercent),
    consistencyPercent: Math.round(consistencyPercent),
    completedDailyTasks,
    completedOfficialSessions: officialSessionIds.size,
    plannedOfficialSessions,
  };
}

export function calculateStudyStreak(
  history: Record<string, DailyStudyRecord>,
  today = localDayKey(),
) {
  const activeDays = new Set(Object.entries(history)
    .filter(([, record]) => (record.activeSeconds ?? record.minutes * 60) >= 60)
    .map(([date]) => date));
  let cursor = activeDays.has(today) ? today : dayKeyAfter(-1, today);
  if (!activeDays.has(cursor)) return 0;
  let streak = 0;
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = dayKeyAfter(-1, cursor);
  }
  return streak;
}

export const defaultProgress: LearningProgress = {
  vocabularyLibraryVersion,
  targetBandScore: 7,
  studyPlanDays: 36,
  studyPlanStartedAt: localDayKey(),
  completed: { vocabulary: false, listening: false, speaking: false, reading: false },
  masteredWords: [],
  reviewWords: [],
  reviewSchedule: {},
  notebook: [],
  personalWordbook: [],
  points: 0,
  pointRewards: [],
  dailyVocabularyDate: localDayKey(),
  dailyVocabularySeen: [],
  dailyVocabularyKnown: [],
  dailyVocabularyRatings: {},
  dailyVocabularyAttempts: {},
  dailyDictationSeen: [],
  connectedSpeechSeen: [],
  dailyVocabularyCompleted: false,
  dailyDictationCompleted: false,
  listeningCorrect: null,
  listeningScore: null,
  readingScore: null,
  speakingTurns: 0,
  speakingPart3Turns: 0,
  speakingTurnsByDate: {},
  officialPracticeCompleted: [],
  officialTaskResults: {},
  officialTaskAttemptHistory: {},
  dailyStudyHistory: {},
  carryoverTasks: [],
  carryoverTaskDates: {},
  activeStudySeconds: 0,
  minutes: 0,
  streak: 0,
};

export function recordStudyActivity(
  progress: LearningProgress,
  activity: DailyStudyActivity,
  date = localDayKey(),
): LearningProgress {
  const currentRecord = progress.dailyStudyHistory[date] ?? { date, minutes: 0, activeSeconds: 0, activities: [] };
  if (currentRecord.activities.some((item) => item.id === activity.id)) return progress;
  const dailyStudyHistory = {
    ...progress.dailyStudyHistory,
    [date]: {
      ...currentRecord,
      activities: [...currentRecord.activities, { ...activity, minutes: 0 }],
    },
  };

  return {
    ...progress,
    dailyStudyHistory,
    streak: calculateStudyStreak(dailyStudyHistory),
  };
}

export function grantPoints(
  progress: LearningProgress,
  reward: Omit<PointReward, "earnedAt">,
): LearningProgress {
  if (progress.pointRewards.some((item) => item.id === reward.id)) return progress;
  const pointReward: PointReward = { ...reward, earnedAt: new Date().toISOString() };
  return {
    ...progress,
    points: progress.points + reward.points,
    pointRewards: [pointReward, ...progress.pointRewards],
  };
}

export function recordAppStudyTime(
  progress: LearningProgress,
  elapsedSeconds: number,
  date = localDayKey(),
  category?: StudyTimeCategory,
): LearningProgress {
  if (!category) return progress;
  const secondsToAdd = Math.max(0, Math.floor(elapsedSeconds));
  if (secondsToAdd === 0) return progress;
  const currentRecord = progress.dailyStudyHistory[date] ?? { date, minutes: 0, activeSeconds: 0, activities: [] };
  const activeSeconds = (currentRecord.activeSeconds ?? 0) + secondsToAdd;
  const activeMinutes = Math.floor(activeSeconds / 60);
  const timeActivity: DailyStudyActivity = { id: "app-active-time", label: "App 内有效学习", minutes: activeMinutes, seconds: activeSeconds };
  const existingCategoryActivity = category
    ? currentRecord.activities.find((activity) => activity.id === `study-time:${category}`)
    : undefined;
  const existingCategorySeconds = existingCategoryActivity?.seconds ?? (existingCategoryActivity ? existingCategoryActivity.minutes * 60 : 0);
  const categorySeconds = category ? existingCategorySeconds + secondsToAdd : 0;
  const categoryActivity: DailyStudyActivity | undefined = category ? {
    id: `study-time:${category}`,
    label: studyTimeLabels[category],
    minutes: Math.floor(categorySeconds / 60),
    seconds: categorySeconds,
  } : undefined;
  let activities = currentRecord.activities.some((activity) => activity.id === timeActivity.id)
    ? currentRecord.activities.map((activity) => activity.id === timeActivity.id ? timeActivity : activity)
    : [timeActivity, ...currentRecord.activities];
  if (categoryActivity) {
    activities = activities.some((activity) => activity.id === categoryActivity.id)
      ? activities.map((activity) => activity.id === categoryActivity.id ? categoryActivity : activity)
      : [...activities, categoryActivity];
  }
  const dailyStudyHistory = {
    ...progress.dailyStudyHistory,
    [date]: {
      ...currentRecord,
      minutes: activeMinutes,
      activeSeconds,
      activities,
    },
  };
  const activeStudySeconds = (progress.activeStudySeconds ?? 0) + secondsToAdd;
  return {
    ...progress,
    activeStudySeconds,
    minutes: Math.floor(activeStudySeconds / 60),
    dailyStudyHistory,
    streak: calculateStudyStreak(dailyStudyHistory),
  };
}

export function scheduleWordForReview(
  progress: LearningProgress,
  word: string,
  rating: Exclude<WordRating, "known">,
  dueInDays = 1,
): LearningProgress {
  const existing = progress.reviewSchedule[word];
  return {
    ...progress,
    reviewWords: Array.from(new Set([...progress.reviewWords, word])),
    reviewSchedule: {
      ...progress.reviewSchedule,
      [word]: {
        dueDate: dayKeyAfter(dueInDays),
        stage: rating === "unfamiliar" ? 0 : Math.max(0, existing?.stage ?? 0),
        lastRating: rating,
        lapses: (existing?.lapses ?? 0) + (rating === "unfamiliar" ? 1 : 0),
      },
    },
  };
}

export function rateReviewWord(progress: LearningProgress, word: string, rating: WordRating): LearningProgress {
  const existing = progress.reviewSchedule[word] ?? { dueDate: localDayKey(), stage: 0, lastRating: "unfamiliar" as const, lapses: 0 };
  if (rating === "known" && existing.stage >= reviewIntervals.length - 1) {
    const { [word]: _graduated, ...reviewSchedule } = progress.reviewSchedule;
    void _graduated;
    return {
      ...progress,
      reviewWords: progress.reviewWords.filter((item) => item !== word),
      reviewSchedule,
      masteredWords: Array.from(new Set([...progress.masteredWords, word])),
    };
  }

  const nextStage = rating === "known" ? Math.min(existing.stage + 1, reviewIntervals.length - 1) : rating === "fuzzy" ? Math.max(0, existing.stage - 1) : 0;
  const dueInDays = rating === "known" ? reviewIntervals[nextStage] : rating === "fuzzy" ? 1 : 0;
  return {
    ...progress,
    reviewWords: Array.from(new Set([...progress.reviewWords, word])),
    reviewSchedule: {
      ...progress.reviewSchedule,
      [word]: {
        dueDate: dayKeyAfter(dueInDays),
        stage: nextStage,
        lastRating: rating,
        lapses: existing.lapses + (rating === "unfamiliar" ? 1 : 0),
      },
    },
    masteredWords: rating === "known" ? Array.from(new Set([...progress.masteredWords, word])) : progress.masteredWords,
  };
}

export function completionPercent(progress: LearningProgress) {
  const completedCount = Object.values(progress.completed).filter(Boolean).length;
  return Math.round((completedCount / 4) * 100);
}

export function mergeStoredProgress(value: unknown): LearningProgress {
  if (!value || typeof value !== "object") return defaultProgress;
  const stored = value as Partial<LearningProgress>;
  const today = localDayKey();
  const isCurrentDay = stored.dailyVocabularyDate === today;
  const isCurrentVocabularyLibrary = stored.vocabularyLibraryVersion === vocabularyLibraryVersion;
  const studyPlanDays = normalizeStudyPlanDays(stored.studyPlanDays);
  const targetBandScore = normalizeTargetBandScore(stored.targetBandScore);
  const studyPlanStartedAt = typeof stored.studyPlanStartedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(stored.studyPlanStartedAt)
    ? stored.studyPlanStartedAt
    : today;
  const isCurrentVocabularyDay = isCurrentDay && isCurrentVocabularyLibrary;
  const completed = isCurrentDay
    ? { ...defaultProgress.completed, ...(stored.completed ?? {}) }
    : { ...defaultProgress.completed };
  const dailySkillOrder: Skill[] = ["vocabulary", "listening", "reading", "speaking"];
  const previousCarryover = Array.isArray(stored.carryoverTasks)
    ? stored.carryoverTasks.filter((skill): skill is Skill => dailySkillOrder.includes(skill as Skill) && !stored.completed?.[skill as Skill])
    : [];
  const newlyMissedTasks = isCurrentDay
    ? []
    : dailySkillOrder.filter((skill) => !stored.completed?.[skill]);
  const carryoverTasks = dailySkillOrder.filter(
    (skill) => previousCarryover.includes(skill) || newlyMissedTasks.includes(skill),
  );
  const storedCarryoverTaskDates = stored.carryoverTaskDates && typeof stored.carryoverTaskDates === "object"
    ? stored.carryoverTaskDates
    : {};
  const previousStudyDate = typeof stored.dailyVocabularyDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(stored.dailyVocabularyDate)
    ? stored.dailyVocabularyDate
    : dayKeyAfter(-1, today);
  const carryoverTaskDates = Object.fromEntries(carryoverTasks.map((skill) => {
    const existingDate = storedCarryoverTaskDates[skill];
    const sourceDate = typeof existingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(existingDate)
      ? existingDate
      : isCurrentDay ? dayKeyAfter(-1, today) : previousStudyDate;
    return [skill, sourceDate];
  })) as Partial<Record<Skill, string>>;
  completed.vocabulary = Boolean(
    isCurrentVocabularyDay && stored.dailyVocabularyCompleted && stored.dailyDictationCompleted,
  );
  const reviewWords = Array.isArray(stored.reviewWords) ? stored.reviewWords : [];
  const storedReviewSchedule = stored.reviewSchedule && typeof stored.reviewSchedule === "object" ? stored.reviewSchedule : {};
  const reviewSchedule = Object.fromEntries(reviewWords.map((word) => [word, storedReviewSchedule[word] ?? {
    dueDate: today,
    stage: 0,
    lastRating: "unfamiliar",
    lapses: 0,
  }])) as Record<string, ReviewScheduleItem>;
  const storedDailyStudyHistory = stored.dailyStudyHistory && typeof stored.dailyStudyHistory === "object" ? stored.dailyStudyHistory : {};
  const dailyStudyHistory = Object.fromEntries(Object.entries(storedDailyStudyHistory).map(([date, record]) => {
    const activeSeconds = typeof record.activeSeconds === "number" ? Math.max(0, Math.floor(record.activeSeconds)) : 0;
    const activities = Array.isArray(record.activities) ? record.activities.map((activity) => {
      if (activity.id === "app-active-time") return { ...activity, minutes: Math.floor(activeSeconds / 60), seconds: activeSeconds };
      if (activity.id.startsWith("study-time:")) {
        const seconds = typeof activity.seconds === "number"
          ? Math.max(0, Math.floor(activity.seconds))
          : Math.max(0, Math.floor(activity.minutes * 60));
        return { ...activity, minutes: Math.floor(seconds / 60), seconds };
      }
      return { ...activity, minutes: 0 };
    }) : [];
    return [date, { date, activeSeconds, minutes: Math.floor(activeSeconds / 60), activities }];
  })) as Record<string, DailyStudyRecord>;
  const activeStudySeconds = Object.values(dailyStudyHistory).reduce((total, record) => total + record.activeSeconds, 0);
  const pointRewards = Array.isArray(stored.pointRewards)
    ? stored.pointRewards.filter((reward): reward is PointReward => Boolean(
      reward
      && typeof reward === "object"
      && typeof (reward as PointReward).id === "string"
      && typeof (reward as PointReward).label === "string"
      && typeof (reward as PointReward).points === "number"
      && typeof (reward as PointReward).earnedAt === "string",
    ))
    : [];
  const points = pointRewards.reduce((total, reward) => total + Math.max(0, Math.floor(reward.points)), 0);
  return {
    ...defaultProgress,
    ...stored,
    vocabularyLibraryVersion,
    targetBandScore,
    studyPlanDays,
    studyPlanStartedAt,
    completed,
    masteredWords: Array.isArray(stored.masteredWords) ? stored.masteredWords : [],
    reviewWords,
    reviewSchedule,
    notebook: Array.isArray(stored.notebook)
      ? stored.notebook.filter((entry): entry is NotebookEntry => Boolean(
        entry
        && typeof entry === "object"
        && typeof (entry as NotebookEntry).id === "string"
        && ((entry as NotebookEntry).kind === "word" || (entry as NotebookEntry).kind === "question"),
      ))
      : [],
    personalWordbook: Array.isArray(stored.personalWordbook)
      ? stored.personalWordbook.filter((entry): entry is PersonalWordbookEntry => Boolean(
        entry
        && typeof entry === "object"
        && typeof (entry as PersonalWordbookEntry).word === "string"
        && typeof (entry as PersonalWordbookEntry).meaning === "string"
        && typeof (entry as PersonalWordbookEntry).partOfSpeech === "string"
        && typeof (entry as PersonalWordbookEntry).example === "string"
        && typeof (entry as PersonalWordbookEntry).addedAt === "string",
      ))
      : [],
    points,
    pointRewards,
    dailyVocabularyDate: today,
    dailyVocabularySeen: isCurrentVocabularyDay && Array.isArray(stored.dailyVocabularySeen) ? stored.dailyVocabularySeen : [],
    dailyVocabularyKnown: isCurrentVocabularyDay && Array.isArray(stored.dailyVocabularyKnown) ? stored.dailyVocabularyKnown : [],
    dailyVocabularyRatings: isCurrentVocabularyDay && stored.dailyVocabularyRatings && typeof stored.dailyVocabularyRatings === "object" ? stored.dailyVocabularyRatings : {},
    dailyVocabularyAttempts: isCurrentVocabularyDay && stored.dailyVocabularyAttempts && typeof stored.dailyVocabularyAttempts === "object" ? stored.dailyVocabularyAttempts : {},
    dailyDictationSeen: isCurrentVocabularyDay && Array.isArray(stored.dailyDictationSeen) ? stored.dailyDictationSeen : [],
    connectedSpeechSeen: isCurrentVocabularyDay && Array.isArray(stored.connectedSpeechSeen) ? stored.connectedSpeechSeen : [],
    dailyVocabularyCompleted: isCurrentVocabularyDay ? Boolean(stored.dailyVocabularyCompleted) : false,
    dailyDictationCompleted: isCurrentVocabularyDay ? Boolean(stored.dailyDictationCompleted) : false,
    listeningCorrect: isCurrentDay ? (stored.listeningCorrect ?? null) : null,
    listeningScore: isCurrentDay ? (stored.listeningScore ?? null) : null,
    readingScore: isCurrentDay ? (stored.readingScore ?? null) : null,
    speakingTurns: isCurrentDay ? (stored.speakingTurns ?? 0) : 0,
    speakingPart3Turns: isCurrentDay ? (stored.speakingPart3Turns ?? 0) : 0,
    speakingTurnsByDate: stored.speakingTurnsByDate && typeof stored.speakingTurnsByDate === "object"
      ? stored.speakingTurnsByDate
      : isCurrentDay && (stored.speakingPart3Turns ?? 0) > 0
        ? { [today]: stored.speakingPart3Turns ?? 0 }
        : {},
    officialPracticeCompleted: Array.isArray(stored.officialPracticeCompleted) ? stored.officialPracticeCompleted : [],
    officialTaskResults: stored.officialTaskResults && typeof stored.officialTaskResults === "object" ? stored.officialTaskResults : {},
    officialTaskAttemptHistory: stored.officialTaskAttemptHistory && typeof stored.officialTaskAttemptHistory === "object" ? stored.officialTaskAttemptHistory : {},
    dailyStudyHistory,
    activeStudySeconds,
    minutes: Math.floor(activeStudySeconds / 60),
    streak: calculateStudyStreak(dailyStudyHistory, today),
    carryoverTasks,
    carryoverTaskDates,
  };
}
