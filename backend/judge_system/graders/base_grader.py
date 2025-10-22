"""
채점기 (Grader) 시스템
DMOJ grader 패턴 구현
"""

import asyncio
from abc import ABC, abstractmethod
from typing import List, Optional

from .. import TestCase, TestCaseResult, JudgeResult, Verdict, ProblemConfig
from ..executors import create_executor
from ..checkers import create_checker, get_default_checker
from ..checkers.base_checker import CheckerResult


class BaseGrader(ABC):
    """모든 채점기의 기본 클래스"""
    
    def __init__(self, problem: ProblemConfig):
        self.problem = problem
        self.executor = None
        self.checker = None
    
    @abstractmethod
    async def grade(self, language: str, source_code: str) -> JudgeResult:
        """
        코드 채점
        
        Args:
            language: 프로그래밍 언어
            source_code: 소스 코드
            
        Returns:
            채점 결과
        """
        pass
    
    def _create_executor(self, language: str, source_code: str):
        """실행기 생성"""
        self.executor = create_executor(language, self.problem.problem_id, source_code)
        return self.executor is not None
    
    def _create_checker(self):
        """검증기 생성"""
        self.checker = create_checker(self.problem.checker_type)
        if not self.checker:
            self.checker = get_default_checker('standard')
        return self.checker is not None


class StandardGrader(BaseGrader):
    """표준 채점기 - 일반적인 입출력 문제용"""
    
    async def grade(self, language: str, source_code: str) -> JudgeResult:
        """표준 채점 수행"""
        
        # 기본 결과 초기화
        judge_result = JudgeResult(
            submission_id="",  # 나중에 매니저에서 설정
            verdict=Verdict.IE,
            score=0.0,
            max_score=sum(tc.score for tc in self.problem.test_cases),
            test_cases=[]
        )
        
        try:
            # 1. 실행기 생성
            if not self._create_executor(language, source_code):
                judge_result.verdict = Verdict.IE
                judge_result.compilation_log = f"Unsupported language: {language}"
                return judge_result
            
            # 2. 검증기 생성
            if not self._create_checker():
                judge_result.verdict = Verdict.IE
                judge_result.compilation_log = f"Unsupported checker: {self.problem.checker_type}"
                return judge_result
            
            # 3. 컴파일
            compile_success, compile_log = await self.executor.compile()
            judge_result.compilation_log = compile_log
            
            if not compile_success:
                judge_result.verdict = Verdict.CE
                return judge_result
            
            # 4. 각 테스트 케이스 실행
            all_passed = True
            total_score = 0.0
            total_time = 0.0
            peak_memory = 0
            
            for test_case in self.problem.test_cases:
                case_result = await self._grade_single_case(test_case)
                judge_result.test_cases.append(case_result)
                
                total_score += case_result.score
                total_time += case_result.execution_time
                peak_memory = max(peak_memory, case_result.memory_usage)
                
                if case_result.verdict != Verdict.AC:
                    all_passed = False
                    # 첫 번째 실패 시 전체 판정 결정
                    if judge_result.verdict == Verdict.IE:
                        judge_result.verdict = case_result.verdict
            
            # 5. 전체 결과 설정
            judge_result.score = total_score
            judge_result.total_time = total_time
            judge_result.peak_memory = peak_memory
            
            if all_passed:
                judge_result.verdict = Verdict.AC
            
        except Exception as e:
            judge_result.verdict = Verdict.IE
            judge_result.compilation_log = f"Internal error during grading: {str(e)}"
        
        finally:
            # 정리
            if self.executor:
                self.executor.cleanup()
        
        return judge_result
    
    async def _grade_single_case(self, test_case: TestCase) -> TestCaseResult:
        """단일 테스트 케이스 채점"""
        
        case_result = TestCaseResult(
            case_id=test_case.case_id,
            verdict=Verdict.IE,
            score=0.0,
            max_score=test_case.score,
            execution_time=0.0,
            memory_usage=0
        )
        
        try:
            # 코드 실행
            exec_result = await self.executor.execute(
                test_case.input_data,
                test_case.time_limit,
                test_case.memory_limit
            )
            
            case_result.execution_time = exec_result.execution_time
            case_result.memory_usage = exec_result.memory_usage
            case_result.actual_output = exec_result.stdout
            
            # 실행 결과 검사
            if exec_result.timeout:
                case_result.verdict = Verdict.TLE
                case_result.message = "Time Limit Exceeded"
                return case_result
            
            if exec_result.return_code != 0:
                case_result.verdict = Verdict.RE
                case_result.message = f"Runtime Error (exit code: {exec_result.return_code})"
                if exec_result.stderr:
                    case_result.message += f": {exec_result.stderr[:200]}"
                return case_result
            
            # 메모리 제한 검사
            if exec_result.memory_usage > test_case.memory_limit * 1024:  # MB to KB
                case_result.verdict = Verdict.MLE
                case_result.message = "Memory Limit Exceeded"
                return case_result
            
            # 출력 검증
            checker_result = self.checker.check(
                exec_result.stdout,
                test_case.expected_output,
                case_id=test_case.case_id,
                max_score=test_case.score
            )
            
            # 검증 결과 처리
            if isinstance(checker_result, CheckerResult):
                case_result.verdict = Verdict.AC if checker_result.passed else Verdict.WA
                case_result.score = checker_result.points
                case_result.message = checker_result.feedback
            elif isinstance(checker_result, bool):
                case_result.verdict = Verdict.AC if checker_result else Verdict.WA
                case_result.score = test_case.score if checker_result else 0.0
                case_result.message = "Accepted" if checker_result else "Wrong Answer"
            else:
                case_result.verdict = Verdict.IE
                case_result.message = "Invalid checker result"
            
        except Exception as e:
            case_result.verdict = Verdict.IE
            case_result.message = f"Internal error: {str(e)}"
        
        return case_result


class InteractiveGrader(BaseGrader):
    """대화형 채점기"""
    
    async def grade(self, language: str, source_code: str) -> JudgeResult:
        """대화형 채점 (추후 구현)"""
        # TODO: 대화형 문제 지원
        judge_result = JudgeResult(
            submission_id="",
            verdict=Verdict.IE,
            score=0.0,
            max_score=0.0,
            test_cases=[]
        )
        judge_result.compilation_log = "Interactive grading not yet implemented"
        return judge_result


class SignatureGrader(BaseGrader):
    """시그니처 채점기 (함수 호출 방식)"""
    
    async def grade(self, language: str, source_code: str) -> JudgeResult:
        """시그니처 채점 (추후 구현)"""
        # TODO: 함수 시그니처 방식 지원
        judge_result = JudgeResult(
            submission_id="",
            verdict=Verdict.IE,
            score=0.0,
            max_score=0.0,
            test_cases=[]
        )
        judge_result.compilation_log = "Signature grading not yet implemented"
        return judge_result