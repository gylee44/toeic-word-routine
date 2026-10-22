# CLAUDE.md

이 파일은 이 프로젝트의 **기본 지침서**다. 매 작업마다 이 파일을 기준으로 판단한다.
세부 명세는 `docs/PRD.md`에 있으며, 필요한 섹션만 골라 읽는다. (아래 "토큰 효율" 참고)

## 1. 프로젝트 개요

- 토익 빈출 단어를 플래시카드 → 4지선다 퀴즈 → 자동 복습(SRS) → 오답노트로 학습하는 **모바일 우선 반응형 웹서비스**
- 모든 학습 기능은 **로그인 필수** (게스트 모드 없음)
- 목표: **10/23(금) Demo Day까지 MVP 배포 완료**
- 현재 상태: DB는 Supabase에 구축 완료, 프론트엔드도 Supabase 연동 완료(mock·localStorage 제거). 토스페이먼츠 Pro 이용권 결제(테스트 키)까지 구현했다. 배포 전 화면 검증 단계

### 구현 현황 (2026-10-22)

| 영역 | 상태 |
|---|---|
| Supabase DB | 완료. 테이블 5개(`profiles`, `words`, `user_word_progress`, `study_events`, `payment_orders`), RLS, 가입 트리거, RPC 6개 + 결제 RPC 4개, 단어 400개(tier당 80개, AI 초안, 사람 검수 전) |
| 결제 (PRD v0.9) | 구현 완료, 실결제 흐름 검증 전(10/22). 결제 RPC·상한 판정 함수(`has_unlimited_learning`), 승인 Edge Function `payments-confirm`(MCP 배포, `verify_jwt` false), Pro·결제 결과 화면. 남은 일: Edge Function Secrets에 `TOSS_SECRET_KEY` 등록, 브라우저 테스트 결제 |
| 마이그레이션 | `supabase/migrations/` 9개. Supabase CLI는 설치하지 않았고 MCP `apply_migration`으로 적용한 뒤 로컬 파일명을 원격 버전에 맞췄다 |
| 검증 | DB 쪽 CRUD, RLS, 하루 상한, 복습 분산, 관리자 무제한을 테스트 계정으로 확인했다. 항목별 결과는 `docs/acceptance-checklist.md` |
| 프론트엔드 | `api.ts`를 Supabase로 교체했다(이메일 인증, Google 로그인, 학습·퀴즈·복습·오답노트·홈). Day 목록 화면과 mock 단어는 삭제했다. 실제 Supabase로 `api.ts` 전 함수를 테스트 계정으로 검증했다. 단어장 화면(`/words`), 브라우저 음성 발음 듣기, 퀴즈 이어 풀기를 추가했다(PRD v0.8). Pro 이용권 화면(`/pro`)과 결제 결과 화면(`/payments/success`, `/payments/fail`)을 추가했다(PRD v0.9) |
| 남은 일 | 토스 테스트 결제 성공 경로 실결제 확인(결제창에서 끝까지 결제), 브라우저 화면 검증(모바일·데스크톱), Google 로그인 실제 확인, Supabase Redirect URLs 설정, 데모 계정 시드, 단어 검수, 배포·CI, 라이선스 화면(P1) |

## 2. 응답 및 작업 규칙

- **모든 답변은 한국어로만 작성한다.** 코드, 명령어, 파일 경로, 식별자, 에러 메시지 원문은 그대로 둔다.
- 코드 주석과 커밋 메시지도 한국어로 작성한다. (변수명·함수명은 영어)
- 작업 전 짧게 계획을 말하고, 작업 후 변경한 파일과 확인 방법을 요약한다. 변경 내용 전체를 다시 출력하지 않는다.
- 요구사항이 PRD와 충돌하거나 불명확하면 추측해서 구현하지 말고 먼저 질문한다.
- 요청받지 않은 기능, 라이브러리, 리팩터링을 추가하지 않는다.

## 3. 문서 구조와 역할

| 파일 | 역할 | 읽는 시점 |
|---|---|---|
| `CLAUDE.md` | 기본 지침서. 핵심 규칙과 요약 | 항상 (자동 로드) |
| `docs/PRD.md` | 상세 명세 (화면, 기능 요구사항, 수용 기준, 데이터 모델) | 해당 기능을 구현할 때 관련 섹션만 |
| `docs/acceptance-checklist.md` | 수용 기준 체크리스트와 검증 결과 | 구현 완료 확인 시 |

### PRD 섹션 인덱스

| 섹션 | 내용 | 주로 필요한 작업 |
|---|---|---|
| 5. MVP Scope | P0/P1 기능 목록, Later, Out of Scope | 범위 판단 |
| 7. User Flow | 화면 이동, 분기, 예외 처리 | 라우팅, 화면 흐름 |
| 8. Screens | 화면별 구성 요소와 동작 | UI 구현 |
| 9. Functional Requirements | FR-01 ~ FR-12 상세 규칙 (FR-12 결제) | 로직 구현 |
| 10. Acceptance Criteria | AC-01 ~ AC-11 체크리스트 (AC-11 결제) | 구현 완료 확인 |
| 11. Data Requirements | 테이블, RLS, 서버 함수(RPC), 11.10 결제 주문 | DB, 마이그레이션, API |
| 12. Design Direction | 색상, 레이아웃, UX 원칙 | 스타일 작업 |
| 13. Technical Stack | 개발 워크플로우, 배포·운영, 일정 | 배포, CI |

## 4. 토큰 효율 규칙

- **`docs/PRD.md` 전체를 읽지 않는다.** 먼저 `grep -n "^## \|^### " docs/PRD.md`로 위치를 찾고, 필요한 섹션의 줄 범위만 읽는다.
- 같은 세션에서 이미 읽은 PRD 섹션은 다시 읽지 않는다.
- 이 파일(CLAUDE.md)의 요약만으로 판단할 수 있는 작업이면 PRD를 열지 않는다.
- 파일 탐색은 `grep`, `glob`으로 위치를 먼저 좁힌 뒤 필요한 파일만 읽는다. 큰 파일은 필요한 줄 범위만 읽는다.
- 읽지 않는 경로: `node_modules/`, `dist/`, `.git/`, `package-lock.json`, `bun.lockb`, `src/components/ui/` (shadcn 기본 컴포넌트, 수정할 때만)
- 파일 수정은 전체 재작성 대신 필요한 부분만 편집한다.
- 답변에서 코드나 문서 내용을 불필요하게 반복 인용하지 않는다.
- 같은 검사 명령(타입 검사, 빌드)을 변경 없이 반복 실행하지 않는다.

## 5. 기술 스택과 명령어

- React + TypeScript + Vite, Tailwind CSS, shadcn/ui, TanStack Router(TanStack Start, 파일 기반 라우팅)
- Supabase (Auth, PostgreSQL, RLS, RPC), 마이그레이션은 Supabase CLI
- 배포: Vercel 또는 AWS Amplify, CI: GitHub Actions

```bash
npm run dev            # 개발 서버
npm run build          # 빌드
npx tsc --noEmit       # 타입 검사
npm run lint           # 린트
node seed/build-candidates.mjs   # NGSL/TSL 원본(seed/raw)에서 후보 단어 목록 생성
node seed/build-words.mjs        # 후보와 seed/word-content.mjs를 합쳐 seed/words.csv 생성·검증
```

> 패키지 매니저와 스크립트는 `package.json` 기준으로 확인한다. 잠금 파일은 `bun.lock`이다. `npm install`로 패키지를 추가하면 `package-lock.json`이 생기므로 지우고 `npx bun install --lockfile-only`로 `bun.lock`을 갱신한다.
> 마이그레이션은 Supabase CLI가 설치되어 있지 않아 MCP `apply_migration`으로 적용한다. 적용 후 `list_migrations`의 버전에 맞춰 로컬 파일명을 바꾼다. (CLI를 쓰게 되면 `supabase db push`)
> 단어 적재는 `seed/words.csv`를 기준으로 `on conflict (headword, pos) do update` upsert를 실행한다(단어 id 유지).

## 6. 디렉토리 구조

```
docs/PRD.md                 상세 명세
src/lib/api.ts              모든 데이터 접근 (UI는 이 파일의 함수만 호출)
src/routes/                 화면 (TanStack Router 파일 기반 라우팅, 로그인 필요 화면은 _authenticated/)
src/components/             공용 컴포넌트 (Container, SiteHeader, AuthLayout, BottomNav, 진행 바 등)
src/styles.css              디자인 토큰 (색상 oklch, 서체)
src/lib/constants.ts        학습 규칙 상수
src/lib/supabase.ts         Supabase 클라이언트 (PKCE, api.ts에서만 사용)
src/lib/speech.ts           발음 듣기 (브라우저 Web Speech API, SpeakButton에서 사용)
src/lib/session.ts          퀴즈 대기열·결과·이어 풀기 기록 (sessionStorage)
src/lib/toss.ts             토스 결제창 (Client 키만 사용, api.ts에서만 사용)
src/routes/auth.callback.tsx  Google 로그인·이메일 인증 링크가 돌아오는 페이지
src/types.ts                공용 타입
supabase/migrations/        스키마, RLS, RPC (SQL, 적용 완료 9개)
supabase/functions/payments-confirm/  토스 결제 승인 Edge Function (Deno, MCP deploy_edge_function으로 배포)
seed/                       (NGSL/TSL의 CC BY-SA 라이선스 확인 전이라 폴더 전체를 gitignore하고 로컬에만 둔다)
seed/config.mjs             시드 상수 (tier 경계, 데모 단어 수, 제외 기능어)
seed/build-candidates.mjs   NGSL/TSL에서 후보 단어 선정
seed/word-content.mjs       단어별 품사·뜻·예문 (AI 초안, 검수 대상)
seed/build-words.mjs        최종 seed/words.csv 생성
seed/raw/                   NGSL·TSL 원본 (gitignore, 저장소에 올리지 않음)
```

## 7. 핵심 구현 규칙

### 데이터 접근
- UI 컴포넌트는 Supabase를 직접 호출하지 않는다. **`src/lib/api.ts`의 함수만 사용**한다.
- `api.ts` 함수 이름과 반환 형태는 유지하고, 내부 구현만 mock → Supabase로 교체한다.
- RPC 대응: `saveOnboarding` → `save_onboarding`, `getTodayWords` → `get_today_words`, `recordFlashcard` → `record_flashcard`, `getQuizChoices` → `get_quiz_choices`, `recordQuizAnswer` → `record_quiz_answer`, `getHomeSummary` → `get_home_summary`
- `getHomeSummary`는 최근 7일 학습 날짜 `studiedDates`, 하루 상한 `dailyCap`, 오늘 남은 신규 학습 수 `remainingNew`(관리자는 null)도 반환한다. RPC 응답은 snake_case이므로 `api.ts`에서 camelCase로 바꾼다. `getTodayLearnedWords` 등 나머지 조회는 RLS 테이블 직접 조회다(PRD 11.5).
- RPC 오류: 하루 상한 초과와 온보딩 미완료는 `P0001`, 존재하지 않는 단어나 학습 기록 없는 단어의 퀴즈는 `P0002`, 잘못된 인자는 `22023`, 비로그인은 `28000`이다. 오류 메시지는 한국어이며 FR-11 오류 처리로 안내한다.
- `getQuizChoices`는 `(id, meaning_ko)`만 반환하고 정답 표시는 없다. `recordQuizAnswer`는 정답 여부(boolean)를 반환한다.

### 학습 규칙 (상세는 PRD 9장)
- SRS 간격: box 0~4 → `[0, 1, 3, 7, 14]`일. 서버 SQL이 기준이고, `constants.ts`는 화면 표시용으로 같은 값을 유지한다.
- 퀴즈 정답 box+1 (최대 4, box 4 정답 시 mastered) / 오답 box 0. 퀴즈는 진행 정보가 있는 단어만 대상
- 단계 상승은 단어마다 하루(KST) 한 번만. 같은 날 다시 맞히면 기록만 남고 box·복습일·`correct_streak`는 그대로다. 그래서 오답노트 해제(연속 2회 정답)도 서로 다른 날 맞혀야 한다
- 플래시카드(첫 학습만): 알아요 → box 1, +1일 / 모르겠어요 → box 0, 당일. 이미 학습한 단어는 box를 바꾸지 않고 기록만 남김
- 복습 대상: `next_review_at <= 오늘` (mastered 포함)
- 오답노트: `wrong_count > 0 AND correct_streak < 2`, `last_wrong_at` 내림차순
- 오늘 학습량: `first_studied_date`가 오늘(KST)이고 `target_score`가 현재 목표 점수인 단어 수. 복습은 제외
- 하루 신규 학습 상한: 40개(하루 목표 포함, 서버 SQL이 기준). 목표 점수를 바꾸면 새 목표로 다시 40개. 관리자(`role = 'admin'`)와 Pro 이용 중(`pro_until > now()`)은 무제한, 복습은 상한 제외

### 결제 (상세는 PRD FR-12, 11.10)
- 상품은 Pro 이용권(`pro_pass`) 하나. 1,000원, 30일 기간제, 혜택은 하루 신규 학습 상한 해제. 다시 사면 남은 기간 뒤로 연장
- 금액·기간은 주문 생성 RPC가 서버에서 정한다. 클라이언트 값과 성공 URL 쿼리 값은 신뢰하지 않는다
- 토스 승인 API 호출과 Pro 부여는 Edge Function(`payments-confirm`)과 service_role 전용 RPC에서만 한다
- 토스 Secret 키는 Supabase Edge Function Secrets(`TOSS_SECRET_KEY`)에만 둔다. `VITE_` 접두사, `.env`, 코드, DB, 로그, 대화에 두지 않는다. Client 키만 `VITE_TOSS_CLIENT_KEY`
- 플래시카드 "알아요"의 첫 복습일은 +1일/+2일을 번갈아 배정(복습 분산)
- 연속 학습일(Day): `study_events.study_date` 연속 일수. 하루 1개이며 추가 학습·목표 점수 변경과 무관하다. `words.day_no`와 Day 목록은 없다
- 목표 점수 → 시작 구간: `START_TIER_BY_TARGET` 상수 사용 (확정: 목표 점수는 시작 tier만 정하고 tier → freq_rank 순으로 진행 후 다음 tier로, PRD FR-03·11.2)
- 모든 날짜는 KST. DB에서는 `(now() at time zone 'Asia/Seoul')::date`

### 보안
- 모든 테이블에 RLS 적용. `words`는 authenticated 읽기 전용
- `profiles`, `user_word_progress`, `study_events` 쓰기는 트리거와 security definer RPC로만 한다(테이블 쓰기 권한 회수). RPC는 `auth.uid()` 기준이며 사용자 ID를 인자로 받지 않고, `set search_path = public`을 지정한다.
- 채점, SRS 갱신, 퀴즈 보기 생성은 서버(RPC)에서 처리한다.
- 프론트엔드 환경변수는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`(구 anon 키)만 사용한다. 키 이름만 `.env.example`에 두고 값은 `.env`(gitignore)에만 둔다.
- service role 키는 필요할 때만 `seed/.env`(gitignore)에 둔다. 코드, 저장소, 로그, 대화에 출력하지 않는다. 현재 단어 적재는 MCP로 하므로 service role 키를 쓰지 않는다.
- `.mcp.json`(Supabase 프로젝트 ref 포함), `seed/`(라이선스 확인 전), 설치형 스킬(`.agents/`, `.claude/skills/`), 디자인 점검 도구 산출물(`.impeccable/`)은 gitignore 대상이다.
- 스키마 변경은 반드시 `supabase/migrations`에 SQL 파일로 작성한다. 대시보드 직접 수정 금지

### 테스트 계정
- 화면·API 검증용 계정은 `design-test@toeic-routine.test`다. 비밀번호는 이 파일이 GitHub로 올라가므로 적지 않고, Claude 자동 메모리의 `figma-file-and-test-account`에 둔다.
- 비밀번호를 바꾸면 그 메모리를 즉시 갱신한다. 실제 사용자 계정은 건드리지 않고, 테스트로 바꾼 상태(Pro 기간, 결제 주문)는 끝나면 되돌린다.

### UI
- 모든 화면 문구는 한국어
- 메뉴는 홈 / 단어장 / 오답노트 / 더보기 4개 (`BottomNav.tsx`의 `NAV_TABS`)
- 발음 듣기는 브라우저 음성 합성만 쓴다(외부 TTS API·키 없음). 미지원 환경에서는 버튼을 숨긴다
- 모바일 우선. 데스크톱(lg, 1024px 이상)은 상단 메뉴 + 최대 1120px 콘텐츠 (상세는 PRD 12.3). 320px ~ 1920px에서 가로 스크롤이 없어야 한다.
- 색상과 서체는 `src/styles.css` 토큰만 쓴다. 포인트 컬러는 플럼(`primary`), 단어와 큰 숫자는 `font-serif`(Source Serif 4). 하드코딩한 색상값을 쓰지 않는다.
- 로딩, 오류(재시도), 빈 화면 상태를 빠짐없이 처리한다.
- 정답/오답은 색상과 함께 아이콘·문구로도 구분한다.
- 면책 문구: "TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다." (랜딩, 더보기)

## 8. 작업 우선순위

- **P0(데모 필수)를 먼저 끝낸다.** P1은 P0 완료 후 진행한다.
- 목요일(10/22) 오전까지 P0가 끝나지 않으면 P1을 중단하고 배포를 우선한다.
- P0: 이메일 인증, 온보딩, 오늘의 학습, 플래시카드, 퀴즈, SRS 복습, 오답노트 목록, 홈 진행률·복습 대기 수, RLS, 반응형, 면책 문구
- P1: 소셜 로그인, 오답 다시 학습, 연속 학습일, 설정 변경, 라이선스 화면, 단어장, 발음 듣기

## 9. Git 규칙

- `main`에 직접 커밋하지 않는다. `feat/*`, `fix/*` 브랜치에서 작업 후 PR
- 커밋 메시지: `타입: 한국어 요약` (예: `feat: 퀴즈 보기 생성 RPC 연동`)
  - 타입: feat, fix, refactor, style, docs, chore, db
  - 커밋 메시지와 PR 본문에 `Co-Authored-By: Claude ...`, "Generated with Claude Code" 같은 AI 작성자 표시를 넣지 않는다. 작성자는 저장소 사용자 한 명으로만 남긴다.
- 커밋 전 `npx tsc --noEmit`과 `npm run build`가 통과해야 한다.
- `.env`는 커밋하지 않는다. 새 환경변수는 `.env.example`에 키만 추가한다.

## 10. 마크다운 파일 작성 규칙

- 모든 `.md` 파일은 **한국어로 작성**한다. (코드, 명령어, 식별자는 원문)
- 문서는 `docs/` 아래에 둔다. 예외: 루트의 `CLAUDE.md`, `README.md`
- 파일 이름은 영어 kebab-case (예: `docs/deploy-guide.md`)
- 제목 구조: 파일당 `#` 제목 1개, 이후 `##`, `###` 순서로 단계를 건너뛰지 않는다.
- 비교·목록형 정보는 표로, 절차는 번호 목록으로, 명령어와 코드는 언어를 지정한 코드 블록으로 작성한다.
- 문장은 짧고 단정하게 쓴다 ("~한다" 체). 이모지는 사용하지 않는다.
- **요청받지 않은 문서(작업 요약, 보고서, 변경 기록 등)를 새로 만들지 않는다.**
- 기능 명세가 바뀌면 `docs/PRD.md`의 해당 섹션과 상단 변경 요약을 함께 수정하고, 핵심 규칙이 바뀌면 이 파일(CLAUDE.md)도 갱신한다.
- `CLAUDE.md`는 요약 지침만 유지한다. 상세 내용은 PRD에 두고 이 파일에 복사하지 않는다.

## 11. 완료 기준

기능 하나를 마칠 때마다 확인한다.

1. 타입 검사와 빌드 통과
2. PRD 10장의 해당 AC 항목 충족
3. 모바일(375px)과 데스크톱(1440px)에서 동작 확인, 가로 스크롤 없음
4. 로딩·오류·빈 화면 처리 확인
5. RLS 관련 변경이면 다른 사용자 데이터 접근 불가 확인
