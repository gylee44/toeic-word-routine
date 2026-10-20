import { createFileRoute } from "@tanstack/react-router";
import { QuizByMode } from "./quiz.index";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "오늘의 복습 | 단어루틴" }, { name: "description", content: "복습할 단어 퀴즈" }] }),
  component: () => <QuizByMode mode="review" />,
});
