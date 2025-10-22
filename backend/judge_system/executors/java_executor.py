"""
Java 코드 실행기
DMOJ Java executor 구현
"""

import os
from typing import List, Tuple
from .base_executor import CompiledExecutor, ExecutionResult


class JavaExecutor(CompiledExecutor):
    """Java 실행기"""
    
    ext = "java"
    name = "Java"
    compiler = "javac"
    vm = "java"
    
    test_program = '''
import java.util.Scanner;

public class self_test {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextLine()) {
            String input = scanner.nextLine();
            System.out.println("echo: " + input);
        }
        scanner.close();
    }
}
'''
    
    async def compile(self) -> Tuple[bool, str]:
        """Java 컴파일"""
        self.create_source_file()
        
        # Java는 클래스 이름과 파일 이름이 일치해야 함
        class_name = self._extract_class_name()
        if class_name:
            # 파일 이름을 클래스 이름으로 변경
            old_source_file = self.source_file
            self.source_file = os.path.join(self.temp_dir, f"{class_name}.java")
            os.rename(old_source_file, self.source_file)
            self.class_name = class_name
        else:
            return False, "Could not find public class name"
        
        # 컴파일 명령
        compile_cmd = [self.compiler, "-encoding", "UTF-8", self.source_file]
        
        try:
            import asyncio
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
    
    def _extract_class_name(self) -> str:
        """소스 코드에서 public class 이름 추출"""
        try:
            with open(self.source_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # public class 찾기
            import re
            match = re.search(r'public\s+class\s+(\w+)', content)
            if match:
                return match.group(1)
            
            # public class가 없으면 첫 번째 class 찾기
            match = re.search(r'class\s+(\w+)', content)
            if match:
                return match.group(1)
                
            return ""
        except:
            return ""
    
    async def execute(self, input_data: str, time_limit: float, memory_limit: int) -> ExecutionResult:
        """Java 프로그램 실행"""
        if not hasattr(self, 'class_name'):
            result = ExecutionResult()
            result.stderr = "Class name not found"
            result.return_code = 1
            return result
        
        # Java 실행 명령
        exec_cmd = [self.vm, "-Xmx{}m".format(memory_limit), self.class_name]
        
        return await self.run_with_limits(exec_cmd, input_data, time_limit, memory_limit)


class Java8Executor(JavaExecutor):
    """Java 8 실행기"""
    
    name = "Java8"
    compiler = "javac"
    vm = "java"


class Java11Executor(JavaExecutor):
    """Java 11 실행기"""
    
    name = "Java11"
    compiler = "javac"
    vm = "java"