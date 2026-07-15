# DidimCode

Python 코드의 실행 흐름을 단계별로 확인하고, 정답 대신 핵심 힌트 하나를 받아 스스로 풀이를 개선하는 알고리즘 학습 프로젝트입니다.

## 주요 기능

- Monaco Editor에서 Python 코드 작성
- Vercel Sandbox에서 격리된 코드 실행과 Supabase 테스트 케이스 채점
- 반복, 분기, 함수 호출·반환, 변수, 스택과 출력을 단계별로 시각화
- 실제 판정(`AC`, `WA`, `CE`, `RE`, `TLE`)에 맞춘 단일 AI 힌트

20개의 초보자용 문제, 공개 예시, 숨은 테스트, 모범 답안과 문제별 피드백 설정은 Supabase에 저장합니다. 공개 키는 출판된 문제와 공개 예시만 읽을 수 있고, 숨은 채점 데이터는 서버 전용 키로만 접근합니다.

## 로컬 실행

요구 환경은 Node.js 24.x입니다.

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에는 다음 값을 설정합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (서버 전용)
- `OPENAI_API_KEY` (서버 전용)
- `OPENAI_MODEL` (선택)

검증 명령:

```bash
cd frontend
npm run lint
npm run build
```

문제 seed 원본을 수정한 뒤 SQL을 다시 생성하려면 다음 명령을 실행합니다.

```bash
cd frontend
npm run data:seed-sql
```

DB 스키마와 seed는 `supabase/migrations`, 문제 원본은 `supabase/seed-data/problems.json`에서 관리합니다.

## 배포

- GitHub: https://github.com/back0319/didim-code
- Vercel 프로젝트: `didim-code`
- 서비스: https://didimcode.vercel.app
- 프로덕션 브랜치: `main`

Vercel 프로젝트의 Root Directory는 `frontend`입니다. `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`와 선택적인 `OPENAI_MODEL`은 Vercel의 서버 측 환경변수로만 설정하며 코드나 Git 기록에 저장하지 않습니다.
