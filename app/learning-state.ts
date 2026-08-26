import type { Skill } from "./learning-data";

export type LearningProgress = {
  completed: Record<Skill, boolean>;
  masteredWords: string[];
  reviewWords: string[];
  dailyVocabularyDate: string;
  dailyVocabularySeen: string[];
  dailyVocabularyKnown: string[];
  dailyDictationSeen: string[];
  connectedSpeechSeen: string[];
  dailyVocabularyCompleted: boolean;
  dailyDictationCompleted: boolean;
  listeningCorrect: boolean | null;
  listeningScore: number | null;
  readingScore: number | null;
  speakingTurns: number;
  speakingPart3Turns: number;
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
  dailyDictationSeen: [],
  connectedSpeechSeen: [],
  dailyVocabularyCompleted: false,
  dailyDictationCompleted: false,
  listeningCorrect: null,
  listeningScore: null,
  readingScore: null,
  speakingTurns: 0,
  speakingPart3Turns: 0,
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
  const completed = isCurrentVocabularyDay
    ? { ...defaultProgress.completed, ...(stored.completed ?? {}) }
    : { ...defaultProgress.completed };
  completed.vocabulary = Boolean(
    isCurrentVocabularyDay && stored.dailyVocabularyCompleted && stored.dailyDictationCompleted,
  );
  return {
    ...defaultProgress,
    ...stored,
    completed,
    masteredWords: Array.isArray(stored.masteredWords) ? stored.masteredWords : [],
    reviewWords: Array.isArray(stored.reviewWords) ? stored.reviewWords : [],
    dailyVocabularyDate: today,
    dailyVocabularySeen: isCurrentVocabularyDay && Array.isArray(stored.dailyVocabularySeen) ? stored.dailyVocabularySeen : [],
    dailyVocabularyKnown: isCurrentVocabularyDay && Array.isArray(stored.dailyVocabularyKnown) ? stored.dailyVocabularyKnown : [],
    dailyDictationSeen: isCurrentVocabularyDay && Array.isArray(stored.dailyDictationSeen) ? stored.dailyDictationSeen : [],
    connectedSpeechSeen: isCurrentVocabularyDay && Array.isArray(stored.connectedSpeechSeen) ? stored.connectedSpeechSeen : [],
    dailyVocabularyCompleted: isCurrentVocabularyDay ? Boolean(stored.dailyVocabularyCompleted) : false,
    dailyDictationCompleted: isCurrentVocabularyDay ? Boolean(stored.dailyDictationCompleted) : false,
    listeningCorrect: isCurrentVocabularyDay ? (stored.listeningCorrect ?? null) : null,
    listeningScore: isCurrentVocabularyDay ? (stored.listeningScore ?? null) : null,
    readingScore: isCurrentVocabularyDay ? (stored.readingScore ?? null) : null,
    speakingTurns: isCurrentVocabularyDay ? (stored.speakingTurns ?? 0) : 0,
    speakingPart3Turns: isCurrentVocabularyDay ? (stored.speakingPart3Turns ?? 0) : 0,
  };
}
