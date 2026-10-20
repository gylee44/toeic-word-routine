// Short-lived study session state (quiz queue & last result), kept in sessionStorage.
import type { StudyMode } from "@/types";

export interface QuizResult { mode: StudyMode; total: number; correct: number; wrongIds: string[] }

const QK = "dr-quiz-ids";
const RK = "dr-quiz-result";

export function setQuizQueue(ids: string[]) { sessionStorage.setItem(QK, JSON.stringify(ids)); }
export function getQuizQueue(): string[] {
  try { return JSON.parse(sessionStorage.getItem(QK) || "[]"); } catch { return []; }
}
export function setQuizResult(r: QuizResult) { sessionStorage.setItem(RK, JSON.stringify(r)); }
export function getQuizResult(): QuizResult | null {
  try { return JSON.parse(sessionStorage.getItem(RK) || "null"); } catch { return null; }
}
