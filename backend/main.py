from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from datetime import datetime
import json

# API 라우터 import
from api.execution import router as execution_router
from api.judge import router as judge_router
from api.visualization import router as visualization_router

# DMOJ 채점 시스템 초기화
from judge_system.manager import judge_manager

# FastAPI 앱 인스턴스 생성
app = FastAPI(
    title="AI Algorithm Tutor API",
    description="AI 알고리즘 튜터 백엔드 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(execution_router)
app.include_router(judge_router)
app.include_router(visualization_router)

# 앱 시작/종료 이벤트 핸들러
@app.on_event("startup")
async def startup_event():
    """앱 시작 시 DMOJ 채점 시스템 초기화"""
    try:
        await judge_manager.start()
        print("🚀 DMOJ Judge System started successfully!")
    except Exception as e:
        print(f"❌ Failed to start DMOJ Judge System: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """앱 종료 시 DMOJ 채점 시스템 정리"""
    try:
        await judge_manager.stop()
        print("🛑 DMOJ Judge System stopped gracefully!")
    except Exception as e:
        print(f"❌ Error stopping DMOJ Judge System: {e}")

# 데이터 모델 정의
class Problem(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    category: str
    examples: List[dict] = []
    constraints: str = ""
    time_limit: int = 1000  # milliseconds
    memory_limit: int = 256  # MB

class SubmissionRequest(BaseModel):
    problem_id: int
    code: str
    language: str

class SubmissionResponse(BaseModel):
    success: bool
    message: str
    score: Optional[int] = None
    execution_time: Optional[float] = None
    memory_usage: Optional[float] = None
    test_results: List[dict] = []

class User(BaseModel):
    id: int
    username: str
    email: str
    solved_problems: int
    total_score: int
    rank: int

class LearningPath(BaseModel):
    id: int
    title: str
    description: str
    progress: int
    total_lessons: int
    difficulty: str

# 임시 데이터베이스 (실제로는 PostgreSQL 등 사용)
problems_db = [
    {
        "id": 1001,
        "title": "두 수의 합",
        "description": "두 정수를 입력받아 그 합을 출력하는 프로그램을 작성하세요.",
        "difficulty": "Easy",
        "category": "구현",
        "examples": [
            {"input": "3 5", "output": "8"},
            {"input": "10 20", "output": "30"}
        ],
        "constraints": "1 ≤ a, b ≤ 1000",
        "time_limit": 1000,
        "memory_limit": 256
    },
    {
        "id": 1002,
        "title": "배열 정렬",
        "description": "주어진 정수 배열을 오름차순으로 정렬하세요.",
        "difficulty": "Easy",
        "category": "정렬",
        "examples": [
            {"input": "5\\n3 1 4 5 2", "output": "1 2 3 4 5"},
            {"input": "3\\n9 7 8", "output": "7 8 9"}
        ],
        "constraints": "1 ≤ n ≤ 1000, 1 ≤ elements ≤ 1000",
        "time_limit": 2000,
        "memory_limit": 256
    },
    {
        "id": 1003,
        "title": "이진 탐색",
        "description": "정렬된 배열에서 특정 값을 이진 탐색으로 찾으세요.",
        "difficulty": "Medium",
        "category": "탐색",
        "examples": [
            {"input": "5\\n1 3 5 7 9\\n5", "output": "2"},
            {"input": "4\\n2 4 6 8\\n7", "output": "-1"}
        ],
        "constraints": "1 ≤ n ≤ 100000, 정렬된 배열",
        "time_limit": 1000,
        "memory_limit": 256
    }
]

users_db = [
    {"id": 1, "username": "알고마스터", "email": "master@algo.com", "solved_problems": 150, "total_score": 2500, "rank": 1},
    {"id": 2, "username": "코딩왕", "email": "king@code.com", "solved_problems": 140, "total_score": 2400, "rank": 2},
    {"id": 3, "username": "프로그래머", "email": "prog@ram.com", "solved_problems": 130, "total_score": 2300, "rank": 3},
    {"id": 4, "username": "개발자123", "email": "dev@123.com", "solved_problems": 120, "total_score": 2200, "rank": 4},
    {"id": 5, "username": "알고리즘러", "email": "algo@rithm.com", "solved_problems": 110, "total_score": 2100, "rank": 5},
]

learning_paths_db = [
    {"id": 1, "title": "기초 알고리즘", "description": "프로그래밍에 필요한 기본 알고리즘을 학습합니다", "progress": 6, "total_lessons": 10, "difficulty": "Beginner"},
    {"id": 2, "title": "자료구조", "description": "스택, 큐, 트리 등 핵심 자료구조를 마스터합니다", "progress": 3, "total_lessons": 10, "difficulty": "Beginner"},
    {"id": 3, "title": "동적 계획법", "description": "DP 개념과 다양한 문제 해결 패턴을 학습합니다", "progress": 1, "total_lessons": 8, "difficulty": "Intermediate"},
    {"id": 4, "title": "그래프 알고리즘", "description": "DFS, BFS, 최단경로 알고리즘을 마스터합니다", "progress": 0, "total_lessons": 12, "difficulty": "Advanced"}
]

# API 엔드포인트들

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {"message": "AI Algorithm Tutor API", "status": "running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# 문제 관련 API
@app.get("/problems", response_model=List[Problem])
async def get_problems():
    """모든 문제 목록을 반환"""
    return problems_db

@app.get("/problems/{problem_id}", response_model=Problem)
async def get_problem(problem_id: int):
    """특정 문제의 상세 정보를 반환"""
    problem = next((p for p in problems_db if p["id"] == problem_id), None)
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")
    return problem

@app.get("/categories")
async def get_categories():
    """문제 카테고리 목록을 반환"""
    categories = list(set([p["category"] for p in problems_db]))
    return {"categories": categories}

# 코드 제출 및 평가 API
@app.post("/submit", response_model=SubmissionResponse)
async def submit_solution(submission: SubmissionRequest):
    """코드 제출 및 평가"""
    # 문제 존재 확인
    problem = next((p for p in problems_db if p["id"] == submission.problem_id), None)
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")
    
    # 간단한 코드 평가 로직 (실제로는 더 복잡한 테스트 케이스 실행)
    try:
        # 기본적인 검증
        if not submission.code.strip():
            return SubmissionResponse(
                success=False,
                message="코드가 비어있습니다.",
                score=0
            )
        
        # 언어별 기본 검증
        if submission.language == "python":
            if "def" not in submission.code and "print" not in submission.code:
                return SubmissionResponse(
                    success=False,
                    message="Python 함수 또는 출력문을 포함해야 합니다.",
                    score=0
                )
        
        # 모의 테스트 결과
        test_results = [
            {"test_case": 1, "passed": True, "input": "3 5", "expected": "8", "actual": "8"},
            {"test_case": 2, "passed": True, "input": "10 20", "expected": "30", "actual": "30"},
        ]
        
        return SubmissionResponse(
            success=True,
            message="코드가 성공적으로 제출되었습니다!",
            score=100,
            execution_time=0.125,
            memory_usage=15.2,
            test_results=test_results
        )
        
    except Exception as e:
        return SubmissionResponse(
            success=False,
            message=f"코드 실행 중 오류가 발생했습니다: {str(e)}",
            score=0
        )

# 사용자 랭킹 API
@app.get("/ranking", response_model=List[User])
async def get_ranking():
    """사용자 랭킹 목록을 반환"""
    return sorted(users_db, key=lambda x: x["rank"])

# 학습 과정 API
@app.get("/learning-paths", response_model=List[LearningPath])
async def get_learning_paths():
    """학습 과정 목록을 반환"""
    return learning_paths_db

@app.get("/learning-paths/{path_id}", response_model=LearningPath)
async def get_learning_path(path_id: int):
    """특정 학습 과정의 상세 정보를 반환"""
    path = next((p for p in learning_paths_db if p["id"] == path_id), None)
    if not path:
        raise HTTPException(status_code=404, detail="학습 과정을 찾을 수 없습니다.")
    return path

# AI 분석 API (모의)
@app.post("/analyze-code")
async def analyze_code(code: str, language: str = "python"):
    """코드 분석 및 피드백 제공"""
    # 실제로는 AI 모델을 사용하여 코드 분석
    analysis = {
        "complexity": "O(n)",
        "suggestions": [
            "변수명을 더 명확하게 작성해보세요",
            "주석을 추가하여 코드의 의도를 명확히 하세요",
            "에러 처리를 추가하는 것을 고려해보세요"
        ],
        "score": 85,
        "performance": "Good",
        "readability": "Very Good"
    }
    return analysis

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)