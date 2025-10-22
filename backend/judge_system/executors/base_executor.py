"""
DMOJ 기반 코드 실행기 (Executor) 시스템
Base Executor 클래스 정의
"""

import asyncio
import tempfile
import os
import time
import signal
import psutil
import subprocess
from abc import ABC, abstractmethod
from typing import Optional, Tuple, Dict, List
from pathlib import Path

from .. import ExecutionResult, Verdict


class BaseExecutor(ABC):
    """
    모든 언어 실행기의 기본 클래스
    DMOJ executor 패턴을 따름
    """
    
    # 클래스 속성 (하위 클래스에서 설정)
    ext: str = ""                    # 파일 확장자
    command: Optional[str] = None    # 실행 명령
    test_program: str = ""           # 자체 테스트 프로그램
    name: str = ""                   # 실행기 이름
    
    # 리소스 제한
    default_time_limit: float = 1.0   # 기본 시간 제한 (초)
    default_memory_limit: int = 256   # 기본 메모리 제한 (MB)
    
    def __init__(self, problem_id: str, source_code: str):
        self.problem_id = problem_id
        self.source_code = source_code
        self.temp_dir: Optional[str] = None
        self.source_file: Optional[str] = None
        self.executable_file: Optional[str] = None
        
    @abstractmethod
    async def compile(self) -> Tuple[bool, str]:
        """
        소스 코드 컴파일
        Returns: (성공 여부, 컴파일 로그)
        """
        pass
    
    @abstractmethod
    async def execute(self, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
        """
        컴파일된 프로그램 실행
        """
        pass
    
    def create_temp_directory(self) -> str:
        """임시 디렉토리 생성"""
        if not self.temp_dir:
            self.temp_dir = tempfile.mkdtemp(prefix=f"dmoj_{self.problem_id}_")
        return self.temp_dir
    
    def create_source_file(self) -> str:
        """소스 파일 생성"""
        if not self.temp_dir:
            self.create_temp_directory()
            
        filename = f"{self.problem_id}.{self.ext}"
        self.source_file = os.path.join(self.temp_dir, filename)
        
        with open(self.source_file, 'w', encoding='utf-8') as f:
            f.write(self.source_code)
            
        return self.source_file
    
    async def run_with_limits(self, args: List[str], input_data: str, 
                            time_limit: float, memory_limit: int, 
                            cwd: Optional[str] = None) -> ExecutionResult:
        """
        시간/메모리 제한을 적용하여 프로세스 실행
        """
        result = ExecutionResult()
        
        try:
            start_time = time.time()
            
            # 프로세스 시작
            process = await asyncio.create_subprocess_exec(
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd or self.temp_dir
            )
            
            # 메모리 모니터링을 위한 태스크
            memory_monitor = asyncio.create_task(
                self._monitor_memory(process, memory_limit)
            )
            
            try:
                # 시간 제한 적용하여 실행
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(input_data.encode('utf-8')),
                    timeout=time_limit
                )
                
                result.execution_time = time.time() - start_time
                result.return_code = process.returncode
                result.stdout = stdout.decode('utf-8', errors='replace')
                result.stderr = stderr.decode('utf-8', errors='replace')
                
                # 메모리 사용량 가져오기
                memory_monitor.cancel()
                try:
                    result.memory_usage = await memory_monitor
                except asyncio.CancelledError:
                    # 프로세스가 정상 종료된 경우
                    result.memory_usage = 0
                
            except asyncio.TimeoutError:
                result.timeout = True
                result.stderr = "Time Limit Exceeded"
                
                # 프로세스 강제 종료
                try:
                    process.kill()
                    await process.wait()
                except:
                    pass
                
                memory_monitor.cancel()
                
        except Exception as e:
            result.stderr = f"Execution Error: {str(e)}"
            result.return_code = 1
            
        return result
    
    async def _monitor_memory(self, process: asyncio.subprocess.Process, 
                            memory_limit: int) -> int:
        """
        프로세스 메모리 사용량 모니터링
        """
        max_memory = 0
        memory_limit_kb = memory_limit * 1024  # MB to KB
        
        try:
            while process.returncode is None:
                try:
                    proc = psutil.Process(process.pid)
                    memory_info = proc.memory_info()
                    current_memory = memory_info.rss // 1024  # bytes to KB
                    max_memory = max(max_memory, current_memory)
                    
                    # 메모리 제한 초과 시 프로세스 종료
                    if current_memory > memory_limit_kb:
                        process.kill()
                        break
                        
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    break
                    
                await asyncio.sleep(0.01)  # 10ms 간격으로 체크
                
        except asyncio.CancelledError:
            pass
            
        return max_memory
    
    def cleanup(self):
        """임시 파일 및 디렉토리 정리"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            import shutil
            try:
                shutil.rmtree(self.temp_dir)
            except:
                pass
    
    def __del__(self):
        """소멸자에서 정리 작업"""
        self.cleanup()
    
    @classmethod
    def get_executor_name(cls) -> str:
        """실행기 이름 반환"""
        return cls.name or cls.__name__
    
    @classmethod
    async def self_test(cls) -> bool:
        """
        실행기 자체 테스트
        DMOJ 스타일의 self-test 구현
        """
        if not cls.test_program:
            return True
            
        try:
            executor = cls("self_test", cls.test_program)
            
            # 컴파일
            compile_success, compile_log = await executor.compile()
            if not compile_success:
                print(f"Self-test compilation failed for {cls.get_executor_name()}: {compile_log}")
                return False
            
            # 실행
            test_input = "Hello, World!"
            result = await executor.execute(test_input, 5.0, 256)
            
            # 결과 검증
            expected_output = f"echo: {test_input}"
            actual_output = result.stdout.strip()
            
            success = (result.return_code == 0 and 
                      not result.timeout and 
                      expected_output in actual_output)
            
            if success:
                print(f"✓ {cls.get_executor_name()} self-test passed")
            else:
                print(f"✗ {cls.get_executor_name()} self-test failed")
                print(f"  Expected: {expected_output}")
                print(f"  Actual: {actual_output}")
                print(f"  Error: {result.stderr}")
            
            executor.cleanup()
            return success
            
        except Exception as e:
            print(f"✗ {cls.get_executor_name()} self-test error: {e}")
            return False


class CompiledExecutor(BaseExecutor):
    """컴파일이 필요한 언어의 기본 클래스"""
    
    compiler: Optional[str] = None
    compiler_args: List[str] = []
    
    async def compile(self) -> Tuple[bool, str]:
        """기본 컴파일 구현"""
        if not self.compiler:
            return False, "No compiler specified"
        
        self.create_source_file()
        
        # 실행 파일 경로 설정
        self.executable_file = os.path.join(self.temp_dir, self.problem_id)
        
        # 컴파일 명령 구성
        compile_cmd = [self.compiler] + self.compiler_args + [
            self.source_file, "-o", self.executable_file
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *compile_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.temp_dir
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return True, stdout.decode('utf-8', errors='replace')
            else:
                return False, stderr.decode('utf-8', errors='replace')
                
        except Exception as e:
            return False, f"Compilation error: {str(e)}"


class InterpretedExecutor(BaseExecutor):
    """인터프리터 언어의 기본 클래스"""
    
    interpreter: Optional[str] = None
    interpreter_args: List[str] = []
    
    async def compile(self) -> Tuple[bool, str]:
        """인터프리터 언어는 문법 검사만 수행"""
        try:
            self.create_source_file()
            return True, "No compilation required"
        except Exception as e:
            return False, f"Source file creation error: {str(e)}"
    
    async def execute(self, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
        """인터프리터로 실행"""
        if not self.interpreter:
            result = ExecutionResult()
            result.stderr = "No interpreter specified"
            result.return_code = 1
            return result
        
        if not self.source_file:
            result = ExecutionResult()
            result.stderr = "Source file not found"
            result.return_code = 1
            return result
        
        # 실행 명령 구성
        exec_cmd = [self.interpreter] + self.interpreter_args + [self.source_file]
        
        return await self.run_with_limits(exec_cmd, input_data, time_limit, memory_limit)