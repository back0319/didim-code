"""
C++ 코드 실행기
DMOJ C++ executor 구현
"""

import os
from typing import List, Tuple
from .base_executor import CompiledExecutor, ExecutionResult


class CppExecutor(CompiledExecutor):
    """C++ 실행기"""
    
    ext = "cpp"
    name = "C++"
    compiler = "g++"
    compiler_args = ["-std=c++17", "-O2", "-Wall"]
    
    test_program = '''
#include <iostream>
#include <string>
using namespace std;

int main() {
    string input;
    getline(cin, input);
    cout << "echo: " << input << endl;
    return 0;
}
'''
    
    async def execute(self, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
        """컴파일된 C++ 프로그램 실행"""
        if not self.executable_file or not os.path.exists(self.executable_file):
            result = ExecutionResult()
            result.stderr = "Executable file not found"
            result.return_code = 1
            return result
        
        # 실행 파일 실행
        exec_cmd = [self.executable_file]
        
        return await self.run_with_limits(exec_cmd, input_data, time_limit, memory_limit)


class CExecutor(CompiledExecutor):
    """C 실행기"""
    
    ext = "c"
    name = "C"
    compiler = "gcc"
    compiler_args = ["-std=c99", "-O2", "-Wall"]
    
    test_program = '''
#include <stdio.h>
#include <string.h>

int main() {
    char input[1024];
    if (fgets(input, sizeof(input), stdin)) {
        // 개행 문자 제거
        input[strcspn(input, "\\n")] = 0;
        printf("echo: %s\\n", input);
    }
    return 0;
}
'''


class Cpp11Executor(CppExecutor):
    """C++11 실행기"""
    
    name = "C++11"
    compiler_args = ["-std=c++11", "-O2", "-Wall"]


class Cpp14Executor(CppExecutor):
    """C++14 실행기"""
    
    name = "C++14"
    compiler_args = ["-std=c++14", "-O2", "-Wall"]


class Cpp20Executor(CppExecutor):
    """C++20 실행기"""
    
    name = "C++20"
    compiler_args = ["-std=c++20", "-O2", "-Wall"]