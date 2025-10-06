from fastapi import APIRouter, BackgourndTasks
from .analyzer import CodeAnalyzer, AntiPatternDetector

router = APIRouter()

@router.post("/submit")
async def submit_code(
    problem_id: int,
    code : str,
    background_tasks: BackgroundTasks
):
    
    #1. 코드 실행 및 채점
    #2. 백그라운드에서 분석 작업 큐 등록
    background_tasks.add_task(analyze_submission, submission_id)
    return {"submission_id": submission_id}

async def analyze_submission(submission_id: int):
    #1. AST 분석
    #2. 반패턴 탐지
    #3. 복잡도 추정
    #4. 피드백 생성
    #5. 결과 저장
    pass