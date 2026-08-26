import type { Skill } from "./learning-data";

export type LearningProgress = {
  completed: Record<Skill, boolean>;
  masteredWords: string[];
  reviewWords: string[];
  dailyVocabularyDate: string;
  dailyVocabularySeen: string[];
  dailyVocabularyKnown: string[];
  listeningCorrect: boolean | null;
  readingScore: number | null;
  speakingTurns: number;
  minutes: number;
  streak: number;
};

export function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const defaultProgress: LearningProgress = {
  completed: { vocabulary: false, listening: false, speaking: false, reading: false },
  masteredWords: [],
  reviewWords: [],
  dailyVocabularyDate: localDayKey(),
  dailyVocabularySeen: [],
  dailyVocabularyKnown: [],
  listeningCorrect: null,
  readingScore: null,
  speakingTurns: 0,
  minutes: 12,
  streak: 6,
};

export function completionPercent(progress: LearningProgress) {
  const completedCount = Object.values(progress.completed).filter(Boolean).length;
  return Math.round((completedCount / 4) * 100);
}

export function mergeStoredProgress(value: unknown): LearningProgress {
  if (!value || typeof value !== "object") return defaultProgress;
  const stored = value as Partial<LearningProgress>;
  const today = localDayKey();
  const isCurrentVocabularyDay = stored.dailyVocabularyDate === today;
  return {
    ...defaultProgress,
    ...stored,
    completed: { ...defaultProgress.completed, ...(stored.completed ?? {}) },
    masteredWords: Array.isArray(stored.masteredWords) ? stored.masteredWords : [],
    reviewWords: Array.isArray(stored.reviewWords) ? stored.reviewWords : [],
    dailyVocabularyDate: today,
    dailyVocabularySeen: isCurrentVocabularyDay && Array.isArray(stored.dailyVocabularySeen) ? stored.dailyVocabularySeen : [],
    dailyVocabularyKnown: isCurrentVocabularyDay && Array.isArray(stored.dailyVocabularyKnown) ? stored.dailyVocabularyKnown : [],
  };
}
