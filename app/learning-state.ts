import type { Skill } from "./learning-data";

export type WordRating = "known" | "fuzzy" | "unfamiliar";

export type ReviewScheduleItem = {
  dueDate: string;
  stage: number;
  lastRating: WordRating;
  lapses: number;
};

export type LearningProgress = {
  completed: Record<Skill, boolean>;
  masteredWords: string[];
  reviewWords: string[];
  reviewSchedule: Record<string, ReviewScheduleItem>;
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
  carryoverTasks: Skill[];
  minutes: number;
  streak: number;
};

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

export const defaultProgress: LearningProgress = {
  completed: { vocabulary: false, listening: false, speaking: false, reading: false },
  masteredWords: [],
  reviewWords: [],
  reviewSchedule: {},
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
  carryoverTasks: [],
  minutes: 12,
  streak: 6,
};

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
  const isCurrentVocabularyDay = stored.dailyVocabularyDate === today;
  const completed = isCurrentVocabularyDay
    ? { ...defaultProgress.completed, ...(stored.completed ?? {}) }
    : { ...defaultProgress.completed };
  const validSkills: Skill[] = ["vocabulary", "listening", "speaking", "reading"];
  const previousCarryover = Array.isArray(stored.carryoverTasks)
    ? stored.carryoverTasks.filter((skill): skill is Skill => validSkills.includes(skill as Skill) && !stored.completed?.[skill as Skill])
    : [];
  const newlyMissedTasks = isCurrentVocabularyDay
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
  return {
    ...defaultProgress,
    ...stored,
    completed,
    masteredWords: Array.isArray(stored.masteredWords) ? stored.masteredWords : [],
    reviewWords,
    reviewSchedule,
    dailyVocabularyDate: today,
    dailyVocabularySeen: isCurrentVocabularyDay && Array.isArray(stored.dailyVocabularySeen) ? stored.dailyVocabularySeen : [],
    dailyVocabularyKnown: isCurrentVocabularyDay && Array.isArray(stored.dailyVocabularyKnown) ? stored.dailyVocabularyKnown : [],
    dailyVocabularyRatings: isCurrentVocabularyDay && stored.dailyVocabularyRatings && typeof stored.dailyVocabularyRatings === "object" ? stored.dailyVocabularyRatings : {},
    dailyVocabularyAttempts: isCurrentVocabularyDay && stored.dailyVocabularyAttempts && typeof stored.dailyVocabularyAttempts === "object" ? stored.dailyVocabularyAttempts : {},
    dailyDictationSeen: isCurrentVocabularyDay && Array.isArray(stored.dailyDictationSeen) ? stored.dailyDictationSeen : [],
    connectedSpeechSeen: isCurrentVocabularyDay && Array.isArray(stored.connectedSpeechSeen) ? stored.connectedSpeechSeen : [],
    dailyVocabularyCompleted: isCurrentVocabularyDay ? Boolean(stored.dailyVocabularyCompleted) : false,
    dailyDictationCompleted: isCurrentVocabularyDay ? Boolean(stored.dailyDictationCompleted) : false,
    listeningCorrect: isCurrentVocabularyDay ? (stored.listeningCorrect ?? null) : null,
    listeningScore: isCurrentVocabularyDay ? (stored.listeningScore ?? null) : null,
    readingScore: isCurrentVocabularyDay ? (stored.readingScore ?? null) : null,
    speakingTurns: isCurrentVocabularyDay ? (stored.speakingTurns ?? 0) : 0,
    speakingPart3Turns: isCurrentVocabularyDay ? (stored.speakingPart3Turns ?? 0) : 0,
    officialPracticeCompleted: Array.isArray(stored.officialPracticeCompleted) ? stored.officialPracticeCompleted : [],
    carryoverTasks,
  };
}
