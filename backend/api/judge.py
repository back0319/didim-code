"""
DMOJ 기반 채점 시스템 API
FastAPI 라우터 구현
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from judge_system import SubmissionRequest, JudgeResult, Verdict
from judge_system.manager import judge_manager

router = APIRouter()


class JudgeSubmissionRequest(BaseModel):
    problem_id: str
    language: str
    source_code: str
    user_id: Optional[str] = None


class JudgeSubmissionResponse(BaseModel):
    submission_id: str
    status: str


class JudgeResultResponse(BaseModel):
    submission_id: str
    verdict: str
    score: float
    max_score: float
    compilation_log: Optional[str] = None
    total_time: float
    peak_memory: int
    test_cases: Optional[List[dict]] = None


class QuickRunRequest(BaseModel):
    source_code: str
    language: str = "python"
    input_data: str = ""


@router.post("/api/judge/submit", response_model=JudgeSubmissionResponse)
async def submit_for_judging(request: JudgeSubmissionRequest):
    """코드 제출하여 채점 요청"""
    try:
        submission = SubmissionRequest(
            problem_id=request.problem_id,
            language=request.language,
            source_code=request.source_code,
            user_id=request.user_id
        )
        
        submission_id = await judge_manager.submit(submission)
        
        return JudgeSubmissionResponse(
            submission_id=submission_id,
            status="queued"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission failed: {str(e)}")


@router.get("/api/judge/result/{submission_id}", response_model=JudgeResultResponse)
async def get_judge_result(submission_id: str, include_test_cases: bool = False):
    """채점 결과 조회"""
    result = await judge_manager.get_result(submission_id)
    
    if result is None:
        raise HTTPException(status_code=404, detail="Submission not found or still processing")
    
    test_cases_data = None
    if include_test_cases:
        test_cases_data = [
            {
                "case_id": tc.case_id,
                "verdict": tc.verdict,
                "score": tc.score,
                "max_score": tc.max_score,
                "execution_time": tc.execution_time,
                "memory_usage": tc.memory_usage,
                "message": tc.message,
                "actual_output": tc.actual_output if hasattr(tc, 'actual_output') else None,
                "expected_output": tc.expected_output if hasattr(tc, 'expected_output') else None
            }
            for tc in result.test_cases
        ]
    
    return JudgeResultResponse(
        submission_id=submission_id,
        verdict=result.verdict,
        score=result.score,
        max_score=result.max_score,
        compilation_log=result.compilation_log,
        total_time=result.total_time,
        peak_memory=result.peak_memory,
        test_cases=test_cases_data
    )


@router.get("/api/judge/status/{submission_id}")
async def get_submission_status(submission_id: str):
    """제출 상태 확인"""
    result = await judge_manager.get_result(submission_id)
    
    if result is None:
        return {"status": "processing", "message": "Submission is being processed"}
    else:
        return {
            "status": "completed",
            "verdict": result.verdict,
            "score": result.score,
            "max_score": result.max_score
        }


@router.get("/api/judge/problems")
async def list_problems():
    """사용 가능한 문제 목록"""
    problems = []
    for problem in judge_manager.list_problems():
        problems.append({
            "problem_id": problem.problem_id,
            "title": problem.title,
            "time_limit": problem.time_limit,
            "memory_limit": problem.memory_limit,
            "test_case_count": len(problem.test_cases),
            "max_score": sum(tc.score for tc in problem.test_cases),
            "checker_type": problem.checker_type
        })
    
    return {"problems": problems}


@router.get("/api/judge/problem/{problem_id}")
async def get_problem_info(problem_id: str):
    """문제 정보 조회"""
    problem = judge_manager.get_problem(problem_id)
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    return {
        "problem_id": problem.problem_id,
        "title": problem.title,
        "time_limit": problem.time_limit,
        "memory_limit": problem.memory_limit,
        "checker_type": problem.checker_type,
        "test_case_count": len(problem.test_cases),
        "max_score": sum(tc.score for tc in problem.test_cases)
    }


@router.post("/api/judge/run")
async def quick_run_code(request: QuickRunRequest):
    """간단한 코드 실행 (채점 없이)"""
    try:
        from judge_system import TestCase, ProblemConfig
        from judge_system.graders import create_grader
        
        # 임시 문제로 단일 테스트 케이스 생성
        test_case = TestCase(
            case_id="run_test",
            input_data=request.input_data,
            expected_output="",  # 출력 검증하지 않음
            score=1.0,
            time_limit=5.0,
            memory_limit=256
        )
        
        temp_problem = ProblemConfig(
            problem_id="temp_run",
            title="Temporary Run",
            time_limit=5.0,
            memory_limit=256,
            checker_type="standard",
            test_cases=[test_case]
        )
        
        # 실행기만 사용하여 코드 실행
        from judge_system.executors import create_executor
        
        executor = create_executor(request.language, "temp_run", request.source_code)
        if not executor:
            return {
                "success": False,
                "output": "",
                "error": f"Unsupported language: {request.language}",
                "execution_time": 0,
                "memory_usage": 0
            }
        
        # 컴파일
        compile_success, compile_log = await executor.compile()
        if not compile_success:
            executor.cleanup()
            return {
                "success": False,
                "output": "",
                "error": f"Compilation Error: {compile_log}",
                "execution_time": 0,
                "memory_usage": 0
            }
        
        # 실행
        exec_result = await executor.execute(request.input_data, 5.0, 256)
        executor.cleanup()
        
        return {
            "success": exec_result.return_code == 0 and not exec_result.timeout,
            "output": exec_result.stdout,
            "error": exec_result.stderr if exec_result.return_code != 0 else "",
            "execution_time": exec_result.execution_time * 1000,  # ms
            "memory_usage": exec_result.memory_usage  # KB
        }
            
    except Exception as e:
        return {
            "success": False,
            "output": "",
            "error": f"Execution error: {str(e)}",
            "execution_time": 0,
            "memory_usage": 0
        }


@router.get("/api/judge/statistics")
async def get_judge_statistics():
    """시스템 통계 조회"""
    return judge_manager.get_statistics()


@router.get("/api/judge/supported")
async def get_supported_features():
    """지원되는 기능들 조회"""
    from judge_system.executors import get_supported_languages
    from judge_system.checkers import get_supported_checkers
    from judge_system.graders import get_supported_graders
    
    return {
        "languages": get_supported_languages(),
        "checkers": get_supported_checkers(),
        "graders": get_supported_graders()
    }