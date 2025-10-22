"""
테스트 케이스 기반 채점 시스템

DMOJ 아키텍처를 참고하여 구현된 채점 모듈:
- Problem: 문제 정의 및 테스트 케이스 관리
- Executor: 언어별 코드 실행기
- Grader: 채점 로직 (Standard, Interactive, Signature 등)
- Checker: 출력 검증기 (표준, 커스텀)
- TestCase: 테스트 케이스 데이터
- Result: 채점 결과
"""

from enum import Enum
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel
from datetime import datetime


class Verdict(str, Enum):
    """채점 결과 상태"""
    AC = "AC"          # Accepted
    WA = "WA"          # Wrong Answer
    TLE = "TLE"        # Time Limit Exceeded
    MLE = "MLE"        # Memory Limit Exceeded
    RTE = "RTE"        # Runtime Error
    CE = "CE"          # Compile Error
    IE = "IE"          # Internal Error
    PE = "PE"          # Presentation Error
    OLE = "OLE"        # Output Limit Exceeded
    IR = "IR"          # Invalid Return


class TestCaseResult(BaseModel):
    """개별 테스트 케이스 결과"""
    case_id: str
    verdict: Verdict
    score: float
    max_score: float
    execution_time: float  # seconds
    memory_usage: int      # KB
    message: Optional[str] = None
    input_data: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None


class JudgeResult(BaseModel):
    """전체 채점 결과"""
    submission_id: str = ""
    verdict: Verdict
    score: float
    max_score: float
    test_cases: List[TestCaseResult]
    compilation_log: Optional[str] = None
    total_time: float = 0.0
    peak_memory: int = 0
    created_at: datetime = datetime.now()


class TestCase(BaseModel):
    """테스트 케이스 정의"""
    case_id: str
    input_data: str
    expected_output: str
    score: float = 1.0
    time_limit: float = 1.0  # seconds
    memory_limit: int = 256  # MB


class ProblemConfig(BaseModel):
    """문제 설정"""
    problem_id: str
    title: str
    time_limit: float = 1.0
    memory_limit: int = 256
    checker_type: str = "standard"  # standard, custom, interactive
    checker_code: Optional[str] = None
    test_cases: List[TestCase] = []


class SubmissionRequest(BaseModel):
    """제출 요청"""
    problem_id: str
    language: str
    source_code: str
    user_id: Optional[str] = None


class ExecutionResult(BaseModel):
    """코드 실행 결과"""
    return_code: int = 0
    stdout: str = ""
    stderr: str = ""
    execution_time: float = 0.0
    memory_usage: int = 0
    timeout: bool = False


# 내보낼 주요 클래스들
__all__ = [
    'Verdict',
    'TestCase', 
    'TestCaseResult',
    'JudgeResult',
    'SubmissionRequest',
    'ProblemConfig',
    'ExecutionResult'
]