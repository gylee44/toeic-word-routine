# Toeic Word Routine

Build a mobile-first TOEIC vocabulary learning web app (React + TypeScript + Vite + Tailwind + shadcn/ui + React Router). Complete the whole app in this single pass. All UI text must be in Korean.

## IMPORTANT: Frontend only

- Do NOT connect Supabase or any backend. Use a mock data layer with localStorage persistence.

- Put ALL data access in src/lib/api.ts as async functions with exactly these names, so they can later be swapped to Supabase RPCs without touching UI code:

  signUp(name,email,password), signIn(email,password), signOut(), getSession(), getProfile(), saveOnboarding(targetScore,dailyGoal), getTodayWords(), recordFlashcard(wordId,known,mode), getQuizChoices(wordId), recordQuizAnswer(wordId,choiceWordId,mode) -> {isCorrect}, getReviewWords(), getWrongNotes(), getDays(), getDayWords(dayNo), getHomeSummary() -> {todayLearned,dailyGoal,reviewDue,streak}

- Put rules in src/lib/constants.ts: SRS_INTERVALS=[0,1,3,7,14] (days per box 0-4), WRONG_NOTE_CLEAR_STREAK=2, DAILY_GOALS=[10,20,30], START_TIER_BY_TARGET={500:500,600:500,700:600,800:700,900:800}.

- Types in src/types.ts: Profile, Word, WordProgress, StudyEvent.

- Seed src/data/words.ts with 40 sample words: 8 per tier (500/600/700/800/900), fields id, headword, pos (noun/verb/adj/adv), meaningKo, exampleEn, exampleKo, tier, dayNo, freqRank. Write ORIGINAL business-English examples.

- All dates use KST (Asia/Seoul) via a single helper todayKST().

## Learning rules (implement in the mock layer)

- Word has no progress = new. Today's words = new words ordered by tier → dayNo → freqRank starting from profile.startTier, count = dailyGoal − todayLearned.

- Flashcard: first study sets firstStudiedAt. "알아요" → box 1, next review +1 day. "모르겠어요" → box 0, review today. Log a StudyEvent.

- Quiz: 4 choices (1 correct + 3 wrong meanings, same POS preferred, no duplicate meanings, shuffled). Correct → box+1 (max 4, box 4 correct → status mastered). Wrong → box 0, wrongCount+1, correctStreak=0. nextReviewAt = today + SRS_INTERVALS[box]. Log a StudyEvent.

- Review due = nextReviewAt <= today. Wrong notes = wrongCount > 0 AND correctStreak < 2.

- todayLearned = words whose firstStudiedAt is today. Streak = consecutive days with ≥1 StudyEvent.

## Routes & access

- Public: / (landing), /signup, /login. Logged-in users visiting these go to /home.

- Protected (redirect to /login and return to original page after login): /onboarding, /home, /days, /days/:dayNo, /learn, /quiz, /quiz/result, /review, /wrong-notes, /more. If not onboarded, redirect to /onboarding.

- 404 page for unknown routes or invalid dayNo.

## Screens

1. Landing: logo + service name "단어루틴"(placeholder), tagline "토익 빈출 단어, 하루 10분 자동 복습", buttons 시작하기(→/signup), 로그인. Footer disclaimer: "TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다."

2. Signup: 이름, 이메일, 비밀번호(8자 이상), 비밀번호 확인. Inline validation, duplicate email error. Success → /onboarding.

3. Login: 이메일, 비밀번호, error message on failure.

4. Onboarding: target score chips (500 이하/600/700/800/900+), daily goal chips (10/20/30). Show "OOO점 구간부터 시작해요" based on START_TIER_BY_TARGET. 시작하기 disabled until both selected.

5. Home: greeting with name and target score, progress card (todayLearned / dailyGoal with progress bar), "오늘의 학습 시작" (or "이어서 학습"; when goal met show "오늘 목표 완료!" + 추가 학습), review card ("오늘 복습할 단어 N개" + 복습 시작, empty: "오늘 복습할 단어가 없어요"), streak badge, wrong-notes shortcut.

6. Days: sections per tier, Day cards (Day 번호, 학습한 단어 수/전체, 정답률), current start tier highlighted.

7. Flashcard (/learn and /days/:dayNo): top progress "5 / 20" + exit (confirm dialog). Card front: big headword + POS; tap or Space flips to back: meaningKo, exampleEn, exampleKo. Bottom buttons 모르겠어요 / 알아요 (disabled while saving). After last card → "퀴즈 시작" screen.

8. Quiz (/quiz, reused by review and wrong-note modes): headword, 4 choice buttons, instant correct/wrong state (green/red + icon + text, not color only), 다음 button, prevent double submit.

9. Quiz result: score X / Y, wrong word list with meanings, buttons 틀린 단어 다시 학습, 홈으로.

10. Review: same quiz component with header "오늘의 복습 N개".

11. Wrong notes: list (headword, meaning, 오답 N회), recent first, "오답 단어 다시 학습" button, empty state.

12. More: change target score / daily goal, 로그아웃, 라이선스 및 출처 (simple page listing data sources), disclaimer.

## Layout & design

- Mobile-first, centered single column max-width 480px on desktop. Bottom tab bar on Home/Days/Wrong notes/More (홈, Day, 오답노트, 더보기); hide it on flashcard/quiz screens.

- Learning screens: progress top, card/question center, main buttons at bottom in thumb zone, touch targets ≥ 44px.

- Clean, light, encouraging. White background, dark gray text, one trustworthy blue accent, green=correct, red=wrong, light gray cards. Font: Pretendard (fallback Noto Sans KR, sans-serif). Rounded cards, subtle shadows, smooth flip animation.

- Loading skeletons, error toasts with retry, empty states everywhere. Visible keyboard focus, good contrast.

- Reuse components: Flashcard, QuizQuestion, ProgressBar, StreakBadge, EmptyState, BottomNav, ProtectedRoute.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/76f008bd-72cb-5f2d-bb6f-514bef215c4e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
