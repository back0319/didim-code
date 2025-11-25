"""
코드 분석 및 피드백 API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from analyzer.gpt_feedback import get_feedback_analyzer

router = APIRouter()


class AnalysisRequest(BaseModel):
    submission_id: int
    code: str
    problem_id: int
    problem_description: str
    language: str = "python"
    verdict: str = "AC"
    execution_time: float = 0.0
    memory_usage: int = 0


class FeedbackItem(BaseModel):
    type: str
    title: str
    message: str
    severity: str
    code_suggestion: Optional[str] = None


class AnalysisResponse(BaseModel):
    submission_id: int
    feedback: List[FeedbackItem]


@router.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_submission(request: AnalysisRequest):
    """제출된 코드 분석 및 피드백 생성"""
    
    try:
        analyzer = get_feedback_analyzer()
        
        feedbacks = await analyzer.analyze_code(
            code=request.code,
            problem_description=request.problem_description,
            language=request.language,
            verdict=request.verdict,
            execution_time=request.execution_time,
            memory_usage=request.memory_usage
        )
        
        return AnalysisResponse(
            submission_id=request.submission_id,
            feedback=feedbacks
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/api/analyze/{submission_id}")
async def get_submission_analysis(submission_id: int):
    """제출 ID로 분석 결과 조회 (DB에서)"""
    
    # TODO: DB에서 이미 분석된 결과 조회
    # 현재는 간단히 분석 완료 메시지만 반환
    
    return {
        "submission_id": submission_id,
        "feedback": [
            {
                "type": "info",
                "title": "분석 완료",
                "message": "코드 분석이 완료되었습니다.",
                "severity": "info"
            }
        ]
    }
