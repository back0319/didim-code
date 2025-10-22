# DMOJ 기반 테스트 케이스 채점 모듈 개발 가이드

## 1. 프로젝트 구조 설계

```
backend/
├── judge_system/
│   ├── __init__.py          # 기본 데이터 모델
│   ├── executors/           # 언어별 실행 엔진
│   │   ├── __init__.py
│   │   ├── base_executor.py
│   │   ├── python_executor.py
│   │   ├── cpp_executor.py
│   │   └── java_executor.py
│   ├── graders/             # 채점 로직
│   │   ├── __init__.py
│   │   ├── base_grader.py
│   │   └── standard_grader.py
│   ├── checkers/            # 출력 검증
│   │   ├── __init__.py
│   │   ├── standard_checker.py
│   │   ├── float_checker.py
│   │   └── custom_checker.py
│   ├── problems/            # 문제 관리
│   │   ├── __init__.py
│   │   └── problem_manager.py
│   └── manager.py           # 전체 시스템 관리
```

## 2. 핵심 컴포넌트 구현

### 2.1 기본 데이터 모델 (judge_system/__init__.py)

```python
from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Verdict(str, Enum):
    AC = "AC"    # Accepted
    WA = "WA"    # Wrong Answer
    TLE = "TLE"  # Time Limit Exceeded
    MLE = "MLE"  # Memory Limit Exceeded
    CE = "CE"    # Compilation Error
    RE = "RE"    # Runtime Error
    IE = "IE"    # Internal Error

class TestCase(BaseModel):
    case_id: str
    input_data: str
    expected_output: str
    score: float
    time_limit: float  # seconds
    memory_limit: int  # MB

class TestCaseResult(BaseModel):
    case_id: str
    verdict: Verdict
    actual_output: Optional[str] = None
    execution_time: float = 0.0
    memory_usage: int = 0
    score: float = 0.0
    max_score: float = 0.0
    message: Optional[str] = None

class JudgeResult(BaseModel):
    verdict: Verdict
    score: float
    max_score: float
    compilation_log: Optional[str] = None
    test_cases: List[TestCaseResult] = []
    total_time: float = 0.0
    peak_memory: int = 0
```

### 2.2 Base Executor 구현

```python
# judge_system/executors/base_executor.py
import asyncio
import tempfile
import os
from abc import ABC, abstractmethod
from typing import Optional, Tuple

class ExecutionResult:
    def __init__(self):
        self.return_code: int = 0
        self.stdout: str = ""
        self.stderr: str = ""
        self.execution_time: float = 0.0
        self.memory_usage: int = 0
        self.timeout: bool = False

class BaseExecutor(ABC):
    def __init__(self, language: str):
        self.language = language
        self.temp_dir: Optional[str] = None
    
    @abstractmethod
    async def compile(self, source_code: str) -> Tuple[bool, str]:
        """컴파일 수행. 성공 여부와 로그 반환"""
        pass
    
    @abstractmethod
    async def execute(self, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
        """코드 실행"""
        pass
    
    def cleanup(self):
        """임시 파일 정리"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
```

### 2.3 Python Executor 구현

```python
# judge_system/executors/python_executor.py
import asyncio
import tempfile
import os
import time
import psutil
from .base_executor import BaseExecutor, ExecutionResult

class PythonExecutor(BaseExecutor):
    def __init__(self):
        super().__init__("python")
        self.source_file = None
    
    async def compile(self, source_code: str) -> Tuple[bool, str]:
        """Python은 인터프리터 언어이므로 문법 검사만 수행"""
        try:
            compile(source_code, '<string>', 'exec')
            
            # 임시 파일 생성
            self.temp_dir = tempfile.mkdtemp()
            self.source_file = os.path.join(self.temp_dir, "solution.py")
            
            with open(self.source_file, 'w', encoding='utf-8') as f:
                f.write(source_code)
            
            return True, "Compilation successful"
        except SyntaxError as e:
            return False, f"Syntax Error: {e}"
        except Exception as e:
            return False, f"Compilation Error: {e}"
    
    async def execute(self, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
        result = ExecutionResult()
        
        if not self.source_file:
            result.stderr = "No compiled source file"
            result.return_code = 1
            return result
        
        try:
            start_time = time.time()
            
            # 프로세스 실행
            process = await asyncio.create_subprocess_exec(
                'python', self.source_file,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.temp_dir
            )
            
            # 입력 데이터 전송 및 출력 대기 (타임아웃 적용)
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(input_data.encode('utf-8')),
                    timeout=time_limit
                )
                
                result.execution_time = time.time() - start_time
                result.return_code = process.returncode
                result.stdout = stdout.decode('utf-8', errors='replace')
                result.stderr = stderr.decode('utf-8', errors='replace')
                
                # 메모리 사용량 측정 (근사치)
                try:
                    proc = psutil.Process(process.pid)
                    result.memory_usage = proc.memory_info().rss // 1024  # KB
                except:
                    result.memory_usage = 0
                
            except asyncio.TimeoutError:
                result.timeout = True
                result.stderr = "Time Limit Exceeded"
                try:
                    process.kill()
                    await process.wait()
                except:
                    pass
                
        except Exception as e:
            result.stderr = f"Execution Error: {e}"
            result.return_code = 1
        
        return result
```

### 2.4 Standard Grader 구현

```python
# judge_system/graders/standard_grader.py
from typing import List, Optional
from ..executors.base_executor import BaseExecutor
from ..checkers.standard_checker import StandardChecker
from .. import TestCase, TestCaseResult, JudgeResult, Verdict

class StandardGrader:
    def __init__(self, executor: BaseExecutor, checker: Optional[object] = None):
        self.executor = executor
        self.checker = checker or StandardChecker()
    
    async def grade_single_case(self, test_case: TestCase) -> TestCaseResult:
        """단일 테스트 케이스 채점"""
        result = TestCaseResult(
            case_id=test_case.case_id,
            verdict=Verdict.IE,
            max_score=test_case.score
        )
        
        try:
            # 코드 실행
            exec_result = await self.executor.execute(
                test_case.input_data,
                test_case.time_limit,
                test_case.memory_limit
            )
            
            result.actual_output = exec_result.stdout
            result.execution_time = exec_result.execution_time
            result.memory_usage = exec_result.memory_usage
            
            # 실행 오류 체크
            if exec_result.timeout:
                result.verdict = Verdict.TLE
                result.message = "Time Limit Exceeded"
                return result
            
            if exec_result.return_code != 0:
                result.verdict = Verdict.RE
                result.message = f"Runtime Error: {exec_result.stderr}"
                return result
            
            # 메모리 제한 체크
            if exec_result.memory_usage > test_case.memory_limit * 1024:  # KB to MB
                result.verdict = Verdict.MLE
                result.message = "Memory Limit Exceeded"
                return result
            
            # 출력 검증
            is_correct = self.checker.check(
                exec_result.stdout.strip(),
                test_case.expected_output.strip()
            )
            
            if is_correct:
                result.verdict = Verdict.AC
                result.score = test_case.score
                result.message = "Accepted"
            else:
                result.verdict = Verdict.WA
                result.message = "Wrong Answer"
                
        except Exception as e:
            result.verdict = Verdict.IE
            result.message = f"Internal Error: {e}"
        
        return result
    
    async def grade_all_cases(self, test_cases: List[TestCase]) -> JudgeResult:
        """모든 테스트 케이스 채점"""
        case_results = []
        total_score = 0.0
        max_total_score = sum(case.score for case in test_cases)
        total_time = 0.0
        peak_memory = 0
        overall_verdict = Verdict.AC
        
        for test_case in test_cases:
            case_result = await self.grade_single_case(test_case)
            case_results.append(case_result)
            
            total_score += case_result.score
            total_time += case_result.execution_time
            peak_memory = max(peak_memory, case_result.memory_usage)
            
            # 전체 판정 결정
            if case_result.verdict != Verdict.AC and overall_verdict == Verdict.AC:
                overall_verdict = case_result.verdict
        
        return JudgeResult(
            verdict=overall_verdict,
            score=total_score,
            max_score=max_total_score,
            test_cases=case_results,
            total_time=total_time,
            peak_memory=peak_memory
        )
```

## 3. 실제 구현 단계

### 단계 1: 기본 구조 생성
1. judge_system 패키지 구조 생성
2. 기본 데이터 모델 정의
3. Base Executor 클래스 구현

### 단계 2: 언어별 Executor 구현
1. PythonExecutor 구현
2. CppExecutor 구현 (g++ 컴파일러 사용)
3. JavaExecutor 구현 (javac/java 사용)

### 단계 3: Checker 시스템 구현
1. StandardChecker (정확한 문자열 매칭)
2. FloatChecker (부동소수점 비교)
3. TokenChecker (토큰 단위 비교)

### 단계 4: Grader 시스템 구현
1. StandardGrader (일반적인 입출력 문제)
2. InteractiveGrader (대화형 문제)
3. 배치 처리 시스템

### 단계 5: 문제 관리 시스템
1. 문제 설정 파일 관리
2. 테스트 케이스 파일 관리
3. 문제 메타데이터 관리

### 단계 6: API 통합
1. FastAPI 엔드포인트 구현
2. 비동기 채점 큐 시스템
3. 결과 저장 및 조회

## 4. 테스트 및 최적화

### 보안 고려사항
- 샌드박스 환경에서 코드 실행
- 리소스 제한 (CPU, 메모리, 파일 접근)
- 악성 코드 방지

### 성능 최적화
- 병렬 테스트 케이스 실행
- 컴파일 캐싱
- 결과 캐싱 시스템

### 모니터링
- 채점 시간 추적
- 리소스 사용량 모니터링
- 오류 로깅 시스템