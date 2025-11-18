"""
DMOJ 기반 채점 시스템 매니저
전체 채점 시스템의 중앙 관리자
"""

import asyncio
import uuid
from typing import Dict, Optional, List
from datetime import datetime
import os

from . import SubmissionRequest, JudgeResult, ProblemConfig, TestCase
from .graders import create_grader


class JudgeManager:
    """채점 시스템 총괄 관리자"""
    
    def __init__(self):
        self.problems: Dict[str, ProblemConfig] = {}
        self.results: Dict[str, JudgeResult] = {}
        self.submission_queue = asyncio.Queue()
        self.is_running = False
        self.worker_task = None
        
        # 샘플 문제들 추가
        self._initialize_sample_problems()
    
    def _initialize_sample_problems(self):
        """샘플 문제들 초기화"""
        
        # A+B 문제
        aplusb_problem = ProblemConfig(
            problem_id="1001",
            title="A+B",
            time_limit=1.0,
            memory_limit=256,
            checker_type="standard",
            test_cases=[
                TestCase(
                    case_id="1",
                    input_data="1 2",
                    expected_output="3",
                    score=10.0
                ),
                TestCase(
                    case_id="2", 
                    input_data="3 4",
                    expected_output="7",
                    score=10.0
                ),
                TestCase(
                    case_id="3",
                    input_data="0 0",
                    expected_output="0", 
                    score=10.0
                ),
                TestCase(
                    case_id="4",
                    input_data="-1 1",
                    expected_output="0",
                    score=10.0
                ),
                TestCase(
                    case_id="5",
                    input_data="100 200",
                    expected_output="300",
                    score=10.0
                )
            ]
        )
        self.problems["1001"] = aplusb_problem
        
        # Hello World 문제
        hello_problem = ProblemConfig(
            problem_id="1000",
            title="Hello World",
            time_limit=1.0,
            memory_limit=256,
            checker_type="standard",
            test_cases=[
                TestCase(
                    case_id="1",
                    input_data="",
                    expected_output="Hello World!",
                    score=100.0
                )
            ]
        )
        self.problems["1000"] = hello_problem
        
        # 배열 합 문제
        array_sum_problem = ProblemConfig(
            problem_id="1002", 
            title="배열 합",
            time_limit=2.0,
            memory_limit=256,
            checker_type="standard",
            test_cases=[
                TestCase(
                    case_id="1",
                    input_data="5\n1 2 3 4 5",
                    expected_output="15",
                    score=25.0
                ),
                TestCase(
                    case_id="2",
                    input_data="3\n10 20 30", 
                    expected_output="60",
                    score=25.0
                ),
                TestCase(
                    case_id="3",
                    input_data="1\n100",
                    expected_output="100",
                    score=25.0
                ),
                TestCase(
                    case_id="4",
                    input_data="4\n-1 -2 -3 -4",
                    expected_output="-10",
                    score=25.0
                )
            ]
        )
        self.problems["1002"] = array_sum_problem
    
    async def start(self):
        """채점 시스템 시작"""
        if self.is_running:
            return
        
        self.is_running = True
        self.worker_task = asyncio.create_task(self._worker())
        print("🚀 DMOJ Judge Manager started")
    
    async def stop(self):
        """채점 시스템 중지"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        
        print("🛑 DMOJ Judge Manager stopped")
    
    async def _worker(self):
        """채점 작업 처리 워커"""
        while self.is_running:
            try:
                # 큐에서 제출 가져오기 (1초 타임아웃)
                submission_id, submission = await asyncio.wait_for(
                    self.submission_queue.get(), timeout=1.0
                )
                
                print(f"📝 Processing submission {submission_id} for problem {submission.problem_id}")
                
                # 채점 수행
                result = await self._grade_submission(submission_id, submission)
                
                # 결과 저장
                self.results[submission_id] = result
                
                print(f"✅ Submission {submission_id} graded: {result.verdict} ({result.score}/{result.max_score})")
                
            except asyncio.TimeoutError:
                # 타임아웃은 정상 (큐가 비어있음)
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"❌ Error in judge worker: {e}")
    
    async def submit(self, submission: SubmissionRequest) -> str:
        """
        코드 제출
        
        Args:
            submission: 제출 요청
            
        Returns:
            제출 ID
        """
        submission_id = str(uuid.uuid4())
        
        # 큐에 추가
        await self.submission_queue.put((submission_id, submission))
        
        return submission_id
    
    async def get_result(self, submission_id: str) -> Optional[JudgeResult]:
        """
        채점 결과 조회
        
        Args:
            submission_id: 제출 ID
            
        Returns:
            채점 결과 또는 None
        """
        return self.results.get(submission_id)
    
    async def _grade_submission(self, submission_id: str, submission: SubmissionRequest) -> JudgeResult:
        """실제 채점 수행"""
        
        # 문제 찾기
        problem = self.problems.get(submission.problem_id)
        if not problem:
            # DB에서 테스트 케이스 로드
            print(f"⚠️ Problem {submission.problem_id} not found in cache, loading from DB")
            problem = await self._load_problem_from_db(submission.problem_id)
            if problem:
                self.problems[submission.problem_id] = problem
            else:
                # DB에도 없으면 기본 문제 생성
                print(f"⚠️ Problem {submission.problem_id} not in DB, creating default problem")
                problem = ProblemConfig(
                    problem_id=submission.problem_id,
                    title=f"Problem {submission.problem_id}",
                    time_limit=2.0,
                    memory_limit=256,
                    checker_type="standard",
                    test_cases=[
                        TestCase(
                            case_id="1",
                            input_data="",
                            expected_output="",
                            score=100.0,
                            time_limit=2.0,
                            memory_limit=256
                        )
                    ]
                )
                self.problems[submission.problem_id] = problem
        
        # 채점기 생성
        grader_type = "standard"  # 기본값
        if hasattr(problem, 'grader_type'):
            grader_type = problem.grader_type
        
        grader = create_grader(grader_type, problem)
        if not grader:
            return JudgeResult(
                submission_id=submission_id,
                verdict="IE",
                score=0.0,
                max_score=0.0,
                compilation_log=f"Unsupported grader type: {grader_type}",
                test_cases=[]
            )
        
        # 채점 수행
        result = await grader.grade(submission.language, submission.source_code)
        result.submission_id = submission_id
        
        return result
    
    async def _load_problem_from_db(self, problem_id: str) -> Optional[ProblemConfig]:
        """DB에서 문제와 테스트 케이스 로드"""
        try:
            import asyncpg
            
            # DB 연결 설정
            db_host = os.getenv('DB_HOST', 'my-app-db')
            db_user = os.getenv('DB_USER', 'postgres')
            db_password = os.getenv('DB_PASSWORD', 'root')
            db_name = os.getenv('DB_NAME', 'postgres')
            
            conn = await asyncpg.connect(
                host=db_host,
                user=db_user,
                password=db_password,
                database=db_name
            )
            
            # 테스트 케이스 조회
            rows = await conn.fetch('''
                SELECT case_number, input_data, expected_output, 
                       time_limit, memory_limit, score
                FROM test_cases
                WHERE problem_id = $1
                ORDER BY case_number
            ''', int(problem_id))
            
            await conn.close()
            
            if not rows:
                return None
            
            # TestCase 객체 리스트 생성
            test_cases = []
            for row in rows:
                test_cases.append(TestCase(
                    case_id=str(row['case_number']),
                    input_data=row['input_data'],
                    expected_output=row['expected_output'],
                    score=float(row['score']),
                    time_limit=float(row['time_limit']),
                    memory_limit=int(row['memory_limit'])
                ))
            
            # ProblemConfig 생성
            problem = ProblemConfig(
                problem_id=problem_id,
                title=f"Problem {problem_id}",
                time_limit=2.0,
                memory_limit=256,
                checker_type="standard",
                test_cases=test_cases
            )
            
            print(f"✅ Loaded {len(test_cases)} test cases for problem {problem_id}")
            return problem
            
        except Exception as e:
            print(f"❌ Error loading problem {problem_id} from DB: {e}")
            return None
    
    def add_problem(self, problem: ProblemConfig):
        """문제 추가"""
        self.problems[problem.problem_id] = problem
    
    def get_problem(self, problem_id: str) -> Optional[ProblemConfig]:
        """문제 조회"""
        return self.problems.get(problem_id)
    
    def list_problems(self) -> List[ProblemConfig]:
        """모든 문제 목록"""
        return list(self.problems.values())
    
    def get_statistics(self) -> dict:
        """시스템 통계"""
        return {
            "total_problems": len(self.problems),
            "total_submissions": len(self.results),
            "queue_size": self.submission_queue.qsize(),
            "is_running": self.is_running
        }


# 전역 매니저 인스턴스
judge_manager = JudgeManager()