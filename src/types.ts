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
  freqRank: number;
}

/** 학습 모드. DB의 study_events.mode로 바꾸는 규칙은 api.ts에 있다. */
export type StudyMode = "learn" | "review" | "wrong";
