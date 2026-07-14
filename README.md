# DidimCode

Python 코드의 실행 흐름을 단계별로 확인하고, 정답 대신 핵심 힌트 하나를 받아 스스로 풀이를 개선하는 알고리즘 학습 프로젝트입니다.

## 주요 기능

- Monaco Editor에서 Python 코드 작성
- Vercel Sandbox에서 격리된 코드 실행과 CSV 테스트 케이스 채점
- 반복, 분기, 함수 호출·반환, 변수, 스택과 출력을 단계별로 시각화
- 실제 판정(`AC`, `WA`, `CE`, `RE`, `TLE`)에 맞춘 단일 AI 힌트

문제, 예시 풀이와 테스트 케이스는 `frontend/data/catalog.json` 정적 데이터로 사용합니다. 별도 데이터베이스나 Supabase는 사용하지 않습니다.

## 로컬 실행

요구 환경은 Node.js 24.x입니다.

```bash
cd frontend
npm install
npm run dev
```

검증 명령:

```bash
cd frontend
npm run lint
npm run build
```

CSV 백업을 다시 변환하려면 다음 명령을 실행합니다.

```bash
cd frontend
npm run data:convert -- /path/to/cs-database.zip
```

## 배포

- GitHub: https://github.com/back0319/didim-code
- Vercel 프로젝트: `didim-code`
- 서비스: https://didim-code.vercel.app
- 프로덕션 브랜치: `main`

Vercel 프로젝트의 Root Directory는 `frontend`입니다. `OPENAI_API_KEY`와 선택적인 `OPENAI_MODEL`은 Vercel의 서버 측 환경변수로만 설정하며 코드나 Git 기록에 저장하지 않습니다.
