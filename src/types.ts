export type Pos = "noun" | "verb" | "adj" | "adv";

export interface Profile {
  userId: string;
  name: string;
  email: string;
  targetScore: number | null;
  dailyGoal: number | null;
  startTier: number | null;
  onboarded: boolean;
}

export interface Word {
  id: string;
  headword: string;
  pos: Pos;
  meaningKo: string;
  exampleEn: string;
  exampleKo: string;
  tier: number;
  dayNo: number;
  freqRank: number;
}

export interface WordProgress {
  wordId: string;
  box: number; // 0-4
  status: "learning" | "mastered";
  firstStudiedAt: string; // YYYY-MM-DD KST
  nextReviewAt: string;
  wrongCount: number;
  correctStreak: number;
  lastWrongAt: string | null;
  updatedAt: number;
}

export type StudyMode = "learn" | "review" | "wrong" | "day";

export interface StudyEvent {
  id: string;
  wordId: string;
  type: "flashcard" | "quiz";
  mode: StudyMode;
  correct: boolean;
  date: string; // KST
  at: number;
}
