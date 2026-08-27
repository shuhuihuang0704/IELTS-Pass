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
  officialPracticeCompleted: string[];
  officialTaskResults: Record<string, OfficialTaskResult>;
  officialTaskAttemptHistory: Record<string, OfficialTaskResult[]>;
  dailyStudyHistory: Record<string, DailyStudyRecord>;
  carryoverTasks: Skill[];
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

export function dailyVocabularyTarget(planDays: number) {
  return Math.ceil(vocabularyPlanSize / normalizeStudyPlanDays(planDays));
}

export function dailyDictationTarget(planDays: number) {
  const scaledTarget = 80 * 36 / normalizeStudyPlanDays(planDays);
  return Math.max(20, Math.min(100, Math.round(scaledTarget / 10) * 10));
}

export function dailyConnectedSpeechTarget(planDays: number) {
  const scaledTarget = 24 * 36 / normalizeStudyPlanDays(planDays);
  return Math.max(6, Math.min(30, Math.round(scaledTarget)));
}

export function officialSessionsPerWeek(planDays: number) {
  const days = normalizeStudyPlanDays(planDays);
  return days <= 45 ? 4 : days <= 90 ? 3 : 2;
}

export function estimatedDailyMinutes(planDays: number) {
  return 35 + Math.ceil(dailyVocabularyTarget(planDays) * .15);
}

export function normalizeTargetBandScore(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 7;
  return Math.max(5.5, Math.min(8.5, Math.round(value * 2) / 2));
}

export function targetOfficialSessionsPerWeek(planDays: number, targetBandScore: number) {
  const score = normalizeTargetBandScore(targetBandScore);
  const scoreBonus = score >= 8 ? 2 : score >= 7.5 ? 1 : 0;
  return Math.min(4, officialSessionsPerWeek(planDays) + scoreBonus);
}

export function targetEstimatedDailyMinutes(planDays: number, targetBandScore: number) {
  const score = normalizeTargetBandScore(targetBandScore);
  return Math.max(30, estimatedDailyMinutes(planDays) + Math.round((score - 7) * 8));
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
  const activeDays = records.filter((record) => record.activeSeconds >= 60 || record.activities.some((activity) => activity.id !== "app-active-time")).length;
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
  officialPracticeCompleted: [],
  officialTaskResults: {},
  officialTaskAttemptHistory: {},
  dailyStudyHistory: {},
  carryoverTasks: [],
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

export function recordAppStudyTime(
  progress: LearningProgress,
  elapsedSeconds: number,
  date = localDayKey(),
): LearningProgress {
  const secondsToAdd = Math.max(0, Math.floor(elapsedSeconds));
  if (secondsToAdd === 0) return progress;
  const currentRecord = progress.dailyStudyHistory[date] ?? { date, minutes: 0, activeSeconds: 0, activities: [] };
  const activeSeconds = (currentRecord.activeSeconds ?? 0) + secondsToAdd;
  const activeMinutes = Math.floor(activeSeconds / 60);
  const timeActivity: DailyStudyActivity = { id: "app-active-time", label: "App 内有效学习", minutes: activeMinutes };
  const dailyStudyHistory = {
    ...progress.dailyStudyHistory,
    [date]: {
      ...currentRecord,
      minutes: activeMinutes,
      activeSeconds,
      activities: currentRecord.activities.some((activity) => activity.id === timeActivity.id)
        ? currentRecord.activities.map((activity) => activity.id === timeActivity.id ? timeActivity : activity)
        : [timeActivity, ...currentRecord.activities],
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
  const validSkills: Skill[] = ["vocabulary", "listening", "speaking", "reading"];
  const previousCarryover = Array.isArray(stored.carryoverTasks)
    ? stored.carryoverTasks.filter((skill): skill is Skill => validSkills.includes(skill as Skill) && !stored.completed?.[skill as Skill])
    : [];
  const newlyMissedTasks = isCurrentDay
    ? []
    : validSkills.filter((skill) => !stored.completed?.[skill]);
  const carryoverTasks = Array.from(new Set([...previousCarryover, ...newlyMissedTasks]));
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
    const activities = Array.isArray(record.activities) ? record.activities.map((activity) => activity.id === "app-active-time"
      ? { ...activity, minutes: Math.floor(activeSeconds / 60) }
      : { ...activity, minutes: 0 }) : [];
    return [date, { date, activeSeconds, minutes: Math.floor(activeSeconds / 60), activities }];
  })) as Record<string, DailyStudyRecord>;
  const activeStudySeconds = Object.values(dailyStudyHistory).reduce((total, record) => total + record.activeSeconds, 0);
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
    officialPracticeCompleted: Array.isArray(stored.officialPracticeCompleted) ? stored.officialPracticeCompleted : [],
    officialTaskResults: stored.officialTaskResults && typeof stored.officialTaskResults === "object" ? stored.officialTaskResults : {},
    officialTaskAttemptHistory: stored.officialTaskAttemptHistory && typeof stored.officialTaskAttemptHistory === "object" ? stored.officialTaskAttemptHistory : {},
    dailyStudyHistory,
    activeStudySeconds,
    minutes: Math.floor(activeStudySeconds / 60),
    streak: calculateStudyStreak(dailyStudyHistory, today),
    carryoverTasks,
  };
}
