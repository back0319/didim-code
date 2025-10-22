"""
채점기 팩토리 및 관리
"""

from typing import Dict, Type, Optional
from .base_grader import BaseGrader, StandardGrader, InteractiveGrader, SignatureGrader
from .. import ProblemConfig


class GraderFactory:
    """채점기 팩토리 클래스"""
    
    # 지원되는 채점기들
    _graders: Dict[str, Type[BaseGrader]] = {
        'standard': StandardGrader,
        'interactive': InteractiveGrader,
        'signature': SignatureGrader,
    }
    
    @classmethod
    def create_grader(cls, grader_type: str, problem: ProblemConfig) -> Optional[BaseGrader]:
        """
        채점기 생성
        
        Args:
            grader_type: 채점기 타입
            problem: 문제 설정
            
        Returns:
            채점기 인스턴스 또는 None
        """
        grader_type_lower = grader_type.lower()
        
        if grader_type_lower in cls._graders:
            grader_class = cls._graders[grader_type_lower]
            return grader_class(problem)
        
        return None
    
    @classmethod
    def get_supported_graders(cls) -> list:
        """지원되는 채점기 목록"""
        return list(cls._graders.keys())
    
    @classmethod
    def is_supported(cls, grader_type: str) -> bool:
        """채점기 지원 여부"""
        return grader_type.lower() in cls._graders
    
    @classmethod
    def register_grader(cls, grader_type: str, grader_class: Type[BaseGrader]):
        """새로운 채점기 등록"""
        cls._graders[grader_type.lower()] = grader_class


# 편의 함수들
def create_grader(grader_type: str, problem: ProblemConfig) -> Optional[BaseGrader]:
    """채점기 생성"""
    return GraderFactory.create_grader(grader_type, problem)


def get_supported_graders() -> list:
    """지원되는 채점기 목록"""
    return GraderFactory.get_supported_graders()


def is_grader_supported(grader_type: str) -> bool:
    """채점기 지원 여부"""
    return GraderFactory.is_supported(grader_type)