# 단어루틴

토익 빈출 단어를 하루 10분 학습하고, 틀린 단어는 자동으로 복습하는 반응형 웹서비스.

> TOEIC은 ETS의 등록상표이며, 본 서비스는 ETS와 무관합니다.

## 주요 기능

- 로그인 후 목표 점수와 하루 학습량 설정
- 플래시카드 → 4지선다 퀴즈(정답 해설 포함)
- 간격 반복(SRS) 기반 자동 복습, 오답노트
- 홈 화면: 오늘 학습 진행률, 복습 대기 수, 연속 학습일과 이번 주 요일별 기록
- Day별 단어장: 점수 구간과 무관한 번호 순서, 진행 중인 Day 강조

## 화면과 반응형

| 구분 | 기준 | 구성 |
|---|---|---|
| 모바일 | 1024px 미만 | 하단 탭, 최대 480px 단일 컬럼 |
| 데스크톱 | 1024px 이상 | 상단 메뉴, 최대 1120px 콘텐츠, 화면별 다단 |

320px ~ 1920px에서 가로 스크롤이 생기지 않는다. 화면별 구성은 [`docs/PRD.md`](docs/PRD.md) 12.3절에 있다.

디자인은 플럼 포인트 컬러와 종이색 바탕을 쓰고, 단어와 큰 숫자는 세리프(Source Serif 4)로 표시한다. 색상과 서체 토큰은 `src/styles.css`에서 관리한다.

## 기술 스택

React, TypeScript, Vite, TanStack Start(Router), Tailwind CSS, shadcn/ui

현재는 localStorage mock 데이터로 동작하며, Supabase(Auth, PostgreSQL, RLS, RPC) 연동으로 전환 중이다. 모든 데이터 접근은 `src/lib/api.ts`를 거친다.

## 시작하기

```bash
npm install
npm run dev
```

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (http://localhost:8080) |
| `npm run build` | 프로덕션 빌드 |
| `npx tsc --noEmit` | 타입 검사 |
| `npm run lint` | 린트 |
| `npm run test` | 테스트 |

## 폴더 구조

| 경로 | 설명 |
|---|---|
| `src/routes/` | 화면. 로그인이 필요한 화면은 `_authenticated/` |
| `src/components/` | 공용 컴포넌트 (레이아웃, 진행 바, 플래시카드, 퀴즈 등) |
| `src/lib/api.ts` | 데이터 접근 (mock, 이후 Supabase RPC로 교체) |
| `src/lib/constants.ts` | 학습 규칙 상수 |
| `src/styles.css` | 디자인 토큰 |
| `docs/` | PRD, 수용 기준 체크리스트 |

## 문서

- [`docs/PRD.md`](docs/PRD.md): 상세 명세
- [`docs/acceptance-checklist.md`](docs/acceptance-checklist.md): 수용 기준 체크리스트
- [`CLAUDE.md`](CLAUDE.md): 개발 지침

이 프로젝트는 [Lovable](https://lovable.dev)로 시작했다.
