# AlgoTutor

Monaco Editor에서 Python 알고리즘 문제를 풀고 실행 결과와 AI 코드 피드백을 확인하는 프로젝트입니다.

## 🚀 기술 스택

### Frontend
- **Next.js 14** - React 기반 SSR 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **React Hooks** - 상태 관리

### Backend
- **FastAPI** - 현대적인 Python 웹 프레임워크
- **Pydantic** - 데이터 검증
- **Uvicorn** - ASGI 서버
- **Python 3.11** - 최신 Python

### Infrastructure
- **Docker** - 컨테이너화
- **Docker Compose** - 멀티 컨테이너 오케스트레이션

## 📁 프로젝트 구조

```
capstone2/
├── frontend/                 # Next.js 프론트엔드
│   ├── pages/               # Next.js 페이지
│   │   ├── index.tsx        # 홈 페이지 (/)
│   │   ├── problems.tsx     # 문제 목록 (/problems)
│   │   ├── learn.tsx        # 학습 과정 (/learn)
│   │   ├── ranking.tsx      # 랭킹 (/ranking)
│   │   └── _app.tsx         # App 컴포넌트
│   ├── components/          # 재사용 컴포넌트
│   │   └── Layout.tsx       # 공통 레이아웃
│   ├── styles/              # 스타일시트
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── backend/                  # FastAPI 백엔드
│   ├── main.py              # 메인 API 애플리케이션
│   ├── requirements.txt     # Python 의존성
│   └── Dockerfile
├── docker-compose-new.yml    # Docker Compose 설정
└── README.md
```

## 🛠️ 개발 환경 설정

### 1. 사전 요구사항
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose

### 2. 로컬 개발

#### Frontend 실행
```bash
cd frontend
npm install
npm run dev
```

#### Backend 실행
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 3. Docker로 실행
```bash
# 전체 스택 실행
docker-compose -f docker-compose-new.yml up --build

# 백그라운드 실행
docker-compose -f docker-compose-new.yml up --build -d

# 중지
docker-compose -f docker-compose-new.yml down
```

## 🌐 서비스 접근

### 개발 환경
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 페이지 라우팅 (SSR)
- **홈**: http://localhost:3000/
- **문제 목록**: http://localhost:3000/problems
- **학습 과정**: http://localhost:3000/learn
- **랭킹**: http://localhost:3000/ranking

## 🎯 주요 기능

### Frontend 기능
1. **SSR (Server-Side Rendering)** - SEO 최적화 및 빠른 초기 로딩
2. **반응형 디자인** - 모바일/태블릿/데스크톱 지원
3. **타입세이프** - TypeScript로 런타임 오류 방지
4. **모던 UI** - Tailwind CSS로 깔끔한 디자인

### Backend 기능
1. **RESTful API** - 표준 HTTP 메서드 사용
2. **자동 API 문서** - Swagger UI 및 ReDoc 지원
3. **데이터 검증** - Pydantic으로 요청/응답 검증
4. **CORS 지원** - 프론트엔드와 안전한 통신

### API 엔드포인트

#### 기본
- `GET /` - 서비스 상태 확인
- `GET /health` - 헬스 체크

#### 문제 관리
- `GET /problems` - 모든 문제 목록
- `GET /problems/{id}` - 특정 문제 상세
- `GET /categories` - 문제 카테고리 목록

#### 코드 제출
- `POST /submit` - 코드 제출 및 평가

#### 사용자
- `GET /ranking` - 사용자 랭킹

#### 학습
- `GET /learning-paths` - 학습 과정 목록
- `GET /learning-paths/{id}` - 특정 학습 과정

#### AI 분석
- `POST /analyze-code` - 코드 분석 및 피드백

## 🔧 환경 변수

### Frontend (.env.local)
```
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.6-luna
```

### Backend
```
ENVIRONMENT=development
```

## 📦 Docker 설정

각 서비스는 독립적인 Docker 컨테이너로 실행됩니다:

- **Frontend**: Node.js 18 Alpine 기반
- **Backend**: Python 3.11 Slim 기반

## 🚀 배포

### Vercel 포트폴리오 배포

`vercel-deploy` 브랜치는 기존 화면과 Monaco Editor를 유지하면서 Vercel에 맞게 구성한 배포 버전입니다.

- **Vercel 프로젝트**: `algo-tutor`
- **배포 주소**: https://algo-tutor.vercel.app

- 문제·예시 풀이·테스트 케이스·기존 피드백은 `frontend/data/catalog.json` 정적 데이터로 사용합니다.
- PostgreSQL이나 Supabase는 사용하지 않습니다.
- Python 실행은 Vercel Sandbox의 격리된 Python 3.13 환경에서 처리합니다.
- AI 피드백은 서버 측 `/api/submit`에서 OpenAI Responses API로 생성합니다.
- `OPENAI_API_KEY`는 Vercel의 민감 환경변수로만 설정해야 합니다.

CSV 백업을 다시 변환하려면 다음 명령을 실행합니다.

```bash
cd frontend
npm run data:convert -- /path/to/cs-database.zip
```

로컬 빌드 검증:

```bash
cd frontend
npm install
npm run build
```

### Docker Compose를 사용한 프로덕션 배포
```bash
# 프로덕션 환경으로 빌드 및 실행
docker-compose -f docker-compose-new.yml up --build -d

# 로그 확인
docker-compose -f docker-compose-new.yml logs -f

# 서비스 상태 확인
docker-compose -f docker-compose-new.yml ps
```

## 🧪 테스트

### Backend 테스트
```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest
```

### Frontend 테스트
```bash
cd frontend
npm test
```

## 📈 향후 개선 계획

1. **데이터베이스 연동** - PostgreSQL 추가
2. **사용자 인증** - JWT 기반 인증 시스템
3. **실시간 코드 실행** - Docker 기반 샌드박스 환경
4. **AI 기능 강화** - 실제 AI 모델 통합
5. **실시간 통신** - WebSocket 지원
6. **모니터링** - 로깅 및 메트릭 수집

## 📝 라이선스

MIT License

## 👥 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
