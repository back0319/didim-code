"""
검증기 팩토리
다양한 검증기 관리 및 생성
"""

from typing import Dict, Type, Optional, Any
from .base_checker import (
    BaseChecker, StandardChecker, WhitespaceChecker, FloatChecker,
    TokenChecker, LineChecker, PartialChecker, SortedChecker, UnorderedChecker
)


class CheckerFactory:
    """검증기 팩토리 클래스"""
    
    # 기본 검증기들
    _checkers: Dict[str, Type[BaseChecker]] = {
        'standard': StandardChecker,
        'exact': StandardChecker,
        'whitespace': WhitespaceChecker,
        'ws': WhitespaceChecker,
        'float': FloatChecker,
        'float_abs': FloatChecker,
        'float_rel': FloatChecker,
        'token': TokenChecker,
        'tokens': TokenChecker,
        'line': LineChecker,
        'lines': LineChecker,
        'partial': PartialChecker,
        'sorted': SortedChecker,
        'unordered': UnorderedChecker,
        'rstripped': LineChecker,  # DMOJ 호환성
        'identical': StandardChecker,  # DMOJ 호환성
    }
    
    @classmethod
    def create_checker(cls, checker_type: str, **kwargs) -> Optional[BaseChecker]:
        """
        검증기 생성
        
        Args:
            checker_type: 검증기 타입
            **kwargs: 검증기별 추가 매개변수
            
        Returns:
            검증기 인스턴스 또는 None
        """
        checker_type_lower = checker_type.lower()
        
        if checker_type_lower not in cls._checkers:
            return None
        
        checker_class = cls._checkers[checker_type_lower]
        
        # 특별한 매개변수가 필요한 검증기들
        if checker_type_lower in ['float', 'float_abs']:
            tolerance = kwargs.get('tolerance', 1e-6)
            return checker_class(tolerance=tolerance, relative=False)
        elif checker_type_lower == 'float_rel':
            tolerance = kwargs.get('tolerance', 1e-6)
            return checker_class(tolerance=tolerance, relative=True)
        elif checker_type_lower == 'partial':
            test_cases = kwargs.get('test_cases', [])
            return checker_class(test_cases=test_cases)
        else:
            return checker_class()
    
    @classmethod
    def get_supported_checkers(cls) -> list:
        """지원되는 검증기 목록"""
        return list(cls._checkers.keys())
    
    @classmethod
    def is_supported(cls, checker_type: str) -> bool:
        """검증기 지원 여부"""
        return checker_type.lower() in cls._checkers
    
    @classmethod
    def register_checker(cls, checker_type: str, checker_class: Type[BaseChecker]):
        """새로운 검증기 등록"""
        cls._checkers[checker_type.lower()] = checker_class


# 편의 함수들
def create_checker(checker_type: str, **kwargs) -> Optional[BaseChecker]:
    """검증기 생성"""
    return CheckerFactory.create_checker(checker_type, **kwargs)


def get_supported_checkers() -> list:
    """지원되는 검증기 목록"""
    return CheckerFactory.get_supported_checkers()


# 기본 검증기 인스턴스들 (싱글톤 패턴)
_default_checkers = {}

def get_default_checker(checker_type: str) -> Optional[BaseChecker]:
    """기본 설정의 검증기 인스턴스 반환"""
    if checker_type not in _default_checkers:
        checker = create_checker(checker_type)
        if checker:
            _default_checkers[checker_type] = checker
    
    return _default_checkers.get(checker_type)