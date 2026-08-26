import type { Skill } from "./learning-data";

export type LearningProgress = {
  completed: Record<Skill, boolean>;
  masteredWords: string[];
  reviewWords: string[];
  listeningCorrect: boolean | null;
  readingScore: number | null;
  speakingTurns: number;
  minutes: number;
  streak: number;
};

export const defaultProgress: LearningProgress = {
  completed: { vocabulary: false, listening: false, speaking: false, reading: false },
  masteredWords: [],
  reviewWords: [],
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
  return {
    ...defaultProgress,
    ...stored,
    completed: { ...defaultProgress.completed, ...(stored.completed ?? {}) },
    masteredWords: Array.isArray(stored.masteredWords) ? stored.masteredWords : [],
    reviewWords: Array.isArray(stored.reviewWords) ? stored.reviewWords : [],
  };
}

