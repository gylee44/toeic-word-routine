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

// 풀던 퀴즈의 진행 기록. 나갔다가 같은 단어 목록으로 다시 들어오면 이어 푼다.
export interface QuizProgress { mode: StudyMode; ids: string[]; results: { id: string; ok: boolean }[] }
const PK = "dr-quiz-progress";
export function setQuizProgress(p: QuizProgress) { sessionStorage.setItem(PK, JSON.stringify(p)); }
export function clearQuizProgress() { sessionStorage.removeItem(PK); }
/** 같은 모드·같은 단어 목록으로 풀던 기록이 남아 있으면 돌려준다 (다 푼 기록은 없는 것으로 본다) */
export function getQuizProgress(mode: StudyMode, ids: string[]): QuizProgress | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(PK) || "null") as QuizProgress | null;
    if (!p || p.mode !== mode || p.ids.length !== ids.length || p.ids.some((id, i) => id !== ids[i])) return null;
    return p.results.length > 0 && p.results.length < ids.length ? p : null;
  } catch { return null; }
}
