"""
Python 코드 실행기
DMOJ Python executor 구현
"""

import ast
import sys
from typing import List, Tuple
from .base_executor import InterpretedExecutor, ExecutionResult


class PythonExecutor(InterpretedExecutor):
    """Python 3 실행기"""
    
    ext = "py"
    name = "Python"
    interpreter = "python"
    
    test_program = '''
import sys
input_line = sys.stdin.readline().strip()
print(f"echo: {input_line}")
'''
    
    async def compile(self) -> Tuple[bool, str]:
        """Python 문법 검사"""
        try:
            # 소스 파일 생성
            self.create_source_file()
            
            # AST 파싱으로 문법 검사
            try:
                with open(self.source_file, 'r', encoding='utf-8') as f:
                    source_code = f.read()
                ast.parse(source_code)
                return True, "Syntax check passed"
            except SyntaxError as e:
                return False, f"Syntax Error at line {e.lineno}: {e.msg}"
            except Exception as e:
                return False, f"Parse Error: {str(e)}"
                
        except Exception as e:
            return False, f"Compilation setup error: {str(e)}"
    
    async def execute(self, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
        """Python 코드 실행"""
        if not self.source_file:
            result = ExecutionResult()
            result.stderr = "Source file not found"
            result.return_code = 1
            return result
        
        # Python 실행 명령
        exec_cmd = [sys.executable, self.source_file]
        
        return await self.run_with_limits(exec_cmd, input_data, time_limit, memory_limit)


class Python2Executor(PythonExecutor):
    """Python 2 실행기"""
    
    name = "Python2"
    interpreter = "python2"
    
    test_program = '''
import sys
input_line = sys.stdin.readline().strip()
print "echo: " + input_line
'''