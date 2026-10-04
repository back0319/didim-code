# DidimCode Build & Deployment Guide

이 문서는 현재 Next.js·Vercel Sandbox 기반 DidimCode의 로컬 실행, 검증, 데이터 준비와 Vercel 배포를 관리하는 canonical 문서입니다.

## 프로덕션 아키텍처

```mermaid
flowchart LR
    A["Browser"] --> B["Vercel<br/>Next.js"]
    B --> C["Neon Postgres<br/>공개 문제"]
    B --> D["Neon Postgres<br/>숨은 테스트"]
    B --> E["Vercel Sandbox<br/>Python 실행"]
    E --> F["실행 trace와 판정"]
    F --> B
    B --> G["OpenAI API<br/>단일 힌트"]
    B --> A
```

브라우저 요청은 Next.js page와 API route가 함께 처리합니다. 데이터베이스는 서버에서만 접속하며 서버 API만 숨은 채점 데이터, Vercel Sandbox와 OpenAI API에 접근하며 브라우저에는 필요한 결과만 반환합니다.

## 요구 환경

- Node.js 24.x
- npm
- Vercel 프로젝트와 Sandbox 사용 권한
- Neon Postgres 프로젝트
- OpenAI API key

## 로컬 실행

```bash
git clone https://github.com/back0319/didim-code.git
cd didim-code/frontend
npm ci
cp .env.example .env.local
npm run dev
```

브라우저에서 http://localhost:3000을 엽니다. 로컬에서도 코드 실행·시각화·제출을 확인하려면 Vercel Sandbox와 외부 서비스 환경 변수가 필요합니다.

## 환경 변수

`frontend/.env.example`을 복사해 `.env.local`을 만들고 실제 값은 Git에 커밋하지 않습니다.

| 변수 | 공개 범위 | 설명 |
| --- | --- | --- |
| `DATABASE_URL` | Secret | 읽기 전용 `didim_app` role의 Neon pooled 연결 문자열 |
| `OPENAI_API_KEY` | Secret | 힌트 생성 API key |
| `OPENAI_MODEL` | Server only | 사용할 모델의 선택적 override |

`DATABASE_URL`, `OPENAI_API_KEY`는 Next.js API route에서만 읽고 브라우저 번들이나 Git 기록에 포함하지 않습니다.

## 검증과 빌드

```bash
cd frontend
npm ci
npm run lint
npx tsc --noEmit
npm run build
```

실제 실행 경로는 다음을 추가로 확인합니다.

1. 공개 문제 목록이 `DATABASE_URL`로 조회되는지 확인합니다.
2. `/api/run`이 제출 코드를 Sandbox에서 실행하고 정리하는지 확인합니다.
3. `/api/visualize`가 실행 trace를 반환하는지 확인합니다.
4. `/api/submit`이 숨은 테스트를 서버에서만 읽고 판정을 반환하는지 확인합니다.
5. 오답 제출에서 정답 코드 대신 핵심 힌트 하나만 반환되는지 확인합니다.

## 문제 데이터와 마이그레이션

- 문제 원본: [db/seed-data/problems.json](../db/seed-data/problems.json)
- 스키마와 seed: [db/migrations](../db/migrations)
- seed 생성기: [db/scripts/generate-problem-seed.mjs](../db/scripts/generate-problem-seed.mjs)
- migration 실행기: [frontend/scripts/migrate.mjs](../frontend/scripts/migrate.mjs)

문제 원본을 수정한 뒤 SQL을 다시 생성합니다.

```bash
cd frontend
npm run data:seed-sql
```

생성된 migration을 검토한 뒤 Neon에 적용합니다. migration은 스키마 소유자(`neondb_owner`)의 direct 연결로 실행하며, 적용 이력은 `public.schema_migrations`에 기록됩니다.

```bash
cd frontend
MIGRATION_DATABASE_URL='postgresql://neondb_owner:...@ep-....neon.tech/neondb?sslmode=require' npm run db:migrate
```

앱 런타임은 `didim_app` role로 접속합니다. 이 role은 `problems`, `problem_test_cases`, `problem_feedback_configs`의 `SELECT` 권한만 가지며 모범 답안(`problem_solutions`) 조회, 쓰기와 DDL은 거부됩니다. 비밀번호를 교체할 때는 소유자 연결에서 `alter role didim_app with login password '...'`를 실행한 뒤 Vercel의 `DATABASE_URL`을 함께 갱신합니다. 공개 문제와 예시만 브라우저 응답에 포함하고 숨은 테스트와 피드백 설정은 서버 API 안에서만 사용합니다.

## Vercel 배포

- Repository: `back0319/didim-code`
- Production branch: `main`
- Root Directory: `frontend`
- Framework: Next.js
- Production URL: https://didimcode.vercel.app

Vercel Git integration이 `main`의 Production build를 수행합니다. 현재 저장소에는 별도의 GitHub Actions 배포 workflow가 없으므로 배포 전 lint, type-check와 build를 로컬 또는 별도 검증 환경에서 실행합니다.

Vercel Project Settings에는 다음을 등록합니다.

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`(선택)

Preview와 Production은 같은 Neon 데이터베이스를 읽기 전용 role로 사용하므로 Preview 배포가 문제 데이터를 변경할 수 없습니다.

Neon 프로젝트는 `aws-ap-southeast-1`(싱가포르)에 있고 Vercel Function은 `icn1`(서울)에서 실행됩니다. Neon compute는 유휴 시 자동으로 일시 중지되고 다음 요청에서 다시 시작되므로 별도의 keepalive Cron이 필요하지 않습니다. 일시 중지 후 첫 요청은 compute 재시작 시간만큼 느릴 수 있습니다.

## 배포 후 점검

1. 홈페이지와 `/problems`에서 20개 문제가 표시되는지 확인합니다.
2. 한 문제를 열어 공개 입출력 예시와 Monaco Editor를 확인합니다.
3. 코드를 실행해 출력과 Sandbox 종료를 확인합니다.
4. 시각화에서 현재 줄, 변수, 스택과 출력이 단계별로 표시되는지 확인합니다.
5. 정답과 오답을 각각 제출해 판정과 단일 힌트를 확인합니다.
6. 브라우저 요청이나 응답에 숨은 테스트, 모범 답안과 secret이 노출되지 않는지 확인합니다.

## 운영 제약과 장애 대응

- Sandbox 실행 실패 시 Vercel 권한, 런타임 제한과 API 로그를 확인합니다.
- 문제 목록·제출 오류는 `DATABASE_URL`, `didim_app` role 권한과 Neon compute 상태를 확인합니다.
- `DATABASE_URL`에 소유자 role을 넣어 권한 문제를 우회하지 않습니다.
- AI 힌트 오류는 OpenAI key, 모델 override와 API 응답을 확인합니다.
- 문제가 있는 배포는 Vercel의 이전 정상 배포를 Production으로 승격합니다.

## 초기 연구 프로토타입

루트의 `backend`, `docker-compose.yml`, `docker-compose-db.yml`, [DMOJ_INTEGRATION_GUIDE.md](../DMOJ_INTEGRATION_GUIDE.md)는 FastAPI·DMOJ 기반 초기 연구 단계의 자산입니다. 현재 Vercel Production 배포에는 사용하지 않으며, 새 운영 변경은 `frontend`와 이 문서를 기준으로 합니다.

연구 stack은 격리 계약을 충족하지 않으므로 외부에 노출하거나 배포하지 않습니다. Compose 서비스에는 `legacy-research` profile이 설정되어 있어 `docker compose up`만으로는 시작되지 않습니다. 로컬 연구가 필요한 경우에만 `.env.example`의 placeholder를 별도 `.env` 값으로 교체한 뒤 profile을 명시합니다.
