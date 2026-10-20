export const SRS_INTERVALS = [0, 1, 3, 7, 14]; // days per box 0-4
export const WRONG_NOTE_CLEAR_STREAK = 2;
export const DAILY_GOALS = [10, 20, 30] as const;
export const START_TIER_BY_TARGET: Record<number, number> = { 500: 500, 600: 500, 700: 600, 800: 700, 900: 800 };
export const TARGET_SCORES = [
  { value: 500, label: "500 이하" },
  { value: 600, label: "600" },
  { value: 700, label: "700" },
  { value: 800, label: "800" },
  { value: 900, label: "900+" },
];
export const TIERS = [500, 600, 700, 800, 900];
export const POS_KO: Record<string, string> = { noun: "명사", verb: "동사", adj: "형용사", adv: "부사" };
