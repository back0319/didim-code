"""
실행기 팩토리
언어별 실행기 관리 및 생성
"""

from typing import Dict, Type, Optional
from .base_executor import BaseExecutor
from .python_executor import PythonExecutor, Python2Executor
from .cpp_executor import CppExecutor, CExecutor, Cpp11Executor, Cpp14Executor, Cpp20Executor
from .java_executor import JavaExecutor, Java8Executor, Java11Executor


class ExecutorFactory:
    """실행기 팩토리 클래스"""
    
    # 지원되는 실행기들
    _executors: Dict[str, Type[BaseExecutor]] = {
        # Python
        'python': PythonExecutor,
        'python3': PythonExecutor,
        'py': PythonExecutor,
        'python2': Python2Executor,
        'py2': Python2Executor,
        
        # C/C++
        'cpp': CppExecutor,
        'c++': CppExecutor,
        'cxx': CppExecutor,
        'c': CExecutor,
        'cpp11': Cpp11Executor,
        'cpp14': Cpp14Executor,
        'cpp17': CppExecutor,  # 기본이 C++17
        'cpp20': Cpp20Executor,
        
        # Java
        'java': JavaExecutor,
        'java8': Java8Executor,
        'java11': Java11Executor,
    }
    
    @classmethod
    def create_executor(cls, language: str, problem_id: str, source_code: str) -> Optional[BaseExecutor]:
        """
        언어에 맞는 실행기 생성
        
        Args:
            language: 프로그래밍 언어
            problem_id: 문제 ID
            source_code: 소스 코드
            
        Returns:
            실행기 인스턴스 또는 None
        """
        language_lower = language.lower()
        
        if language_lower in cls._executors:
            executor_class = cls._executors[language_lower]
            return executor_class(problem_id, source_code)
        
        return None
    
    @classmethod
    def get_supported_languages(cls) -> list:
        """지원되는 언어 목록 반환"""
        return list(cls._executors.keys())
    
    @classmethod
    def is_supported(cls, language: str) -> bool:
        """언어 지원 여부 확인"""
        return language.lower() in cls._executors
    
    @classmethod
    def register_executor(cls, language: str, executor_class: Type[BaseExecutor]):
        """새로운 실행기 등록"""
        cls._executors[language.lower()] = executor_class
    
    @classmethod
    async def run_self_tests(cls) -> Dict[str, bool]:
        """모든 실행기의 자체 테스트 실행"""
        results = {}
        
        # 중복 제거를 위해 실행기 클래스별로 테스트
        tested_classes = set()
        
        for language, executor_class in cls._executors.items():
            if executor_class not in tested_classes:
                tested_classes.add(executor_class)
                test_result = await executor_class.self_test()
                results[executor_class.get_executor_name()] = test_result
        
        return results


# 편의를 위한 함수들
def create_executor(language: str, problem_id: str, source_code: str) -> Optional[BaseExecutor]:
    """실행기 생성"""
    return ExecutorFactory.create_executor(language, problem_id, source_code)


def get_supported_languages() -> list:
    """지원되는 언어 목록"""
    return ExecutorFactory.get_supported_languages()


def is_language_supported(language: str) -> bool:
    """언어 지원 여부"""
    return ExecutorFactory.is_supported(language)