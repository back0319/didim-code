"""
출력 검증기 (Checker) 시스템
DMOJ checker 패턴 구현
"""

from abc import ABC, abstractmethod
from typing import Union, Optional
import re
import math


class CheckerResult:
    """검증 결과"""
    
    def __init__(self, passed: bool, points: float = 0.0, feedback: str = ""):
        self.passed = passed
        self.points = points
        self.feedback = feedback
    
    def __bool__(self):
        return self.passed


class BaseChecker(ABC):
    """모든 검증기의 기본 클래스"""
    
    @abstractmethod
    def check(self, actual_output: str, expected_output: str, **kwargs) -> Union[bool, CheckerResult]:
        """
        출력 검증
        
        Args:
            actual_output: 실제 출력
            expected_output: 예상 출력
            **kwargs: 추가 매개변수
            
        Returns:
            bool 또는 CheckerResult
        """
        pass


class StandardChecker(BaseChecker):
    """표준 검증기 - 정확한 문자열 매칭"""
    
    def check(self, actual_output: str, expected_output: str, **kwargs) -> bool:
        """정확한 문자열 매칭으로 검증"""
        return actual_output.strip() == expected_output.strip()


class WhitespaceChecker(BaseChecker):
    """공백 무시 검증기"""
    
    def check(self, actual_output: str, expected_output: str, **kwargs) -> bool:
        """공백을 무시하고 검증"""
        actual_clean = re.sub(r'\s+', ' ', actual_output.strip())
        expected_clean = re.sub(r'\s+', ' ', expected_output.strip())
        return actual_clean == expected_clean


class FloatChecker(BaseChecker):
    """부동소수점 검증기"""
    
    def __init__(self, tolerance: float = 1e-6, relative: bool = False):
        self.tolerance = tolerance
        self.relative = relative
    
    def check(self, actual_output: str, expected_output: str, **kwargs) -> bool:
        """부동소수점 수치를 허용 오차 범위 내에서 검증"""
        try:
            actual_nums = self._extract_numbers(actual_output)
            expected_nums = self._extract_numbers(expected_output)
            
            if len(actual_nums) != len(expected_nums):
                return False
            
            for actual, expected in zip(actual_nums, expected_nums):
                if not self._compare_floats(actual, expected):
                    return False
            
            return True
            
        except (ValueError, TypeError):
            return False
    
    def _extract_numbers(self, text: str) -> list:
        """텍스트에서 숫자 추출"""
        pattern = r'-?\d+\.?\d*(?:[eE][+-]?\d+)?'
        matches = re.findall(pattern, text)
        return [float(match) for match in matches]
    
    def _compare_floats(self, actual: float, expected: float) -> bool:
        """두 부동소수점 수 비교"""
        if math.isnan(actual) and math.isnan(expected):
            return True
        if math.isnan(actual) or math.isnan(expected):
            return False
        if math.isinf(actual) and math.isinf(expected):
            return actual == expected
        if math.isinf(actual) or math.isinf(expected):
            return False
        
        if self.relative:
            # 상대 오차
            if expected == 0:
                return abs(actual) <= self.tolerance
            return abs((actual - expected) / expected) <= self.tolerance
        else:
            # 절대 오차
            return abs(actual - expected) <= self.tolerance


class TokenChecker(BaseChecker):
    """토큰 단위 검증기"""
    
    def check(self, actual_output: str, expected_output: str, **kwargs) -> bool:
        """토큰(단어) 단위로 검증"""
        actual_tokens = actual_output.split()
        expected_tokens = expected_output.split()
        return actual_tokens == expected_tokens


class LineChecker(BaseChecker):
    """라인별 검증기"""
    
    def check(self, actual_output: str, expected_output: str, **kwargs) -> bool:
        """라인별로 검증 (각 라인의 끝 공백 무시)"""
        actual_lines = [line.rstrip() for line in actual_output.split('\n')]
        expected_lines = [line.rstrip() for line in expected_output.split('\n')]
        
        # 마지막 빈 라인들 제거
        while actual_lines and not actual_lines[-1]:
            actual_lines.pop()
        while expected_lines and not expected_lines[-1]:
            expected_lines.pop()
        
        return actual_lines == expected_lines


class PartialChecker(BaseChecker):
    """부분 점수 검증기"""
    
    def __init__(self, test_cases: list):
        self.test_cases = test_cases
    
    def check(self, actual_output: str, expected_output: str, **kwargs) -> CheckerResult:
        """부분 점수 계산"""
        # 실제 구현에서는 문제에 따라 다르게 구현
        # 예: 테스트 케이스별 부분 점수
        
        if actual_output.strip() == expected_output.strip():
            return CheckerResult(True, 1.0, "Correct")
        
        # 부분 점수 로직 (예시)
        similarity = self._calculate_similarity(actual_output, expected_output)
        if similarity > 0.8:
            return CheckerResult(True, similarity, f"Partial credit: {similarity:.1%}")
        else:
            return CheckerResult(False, 0.0, "Incorrect")
    
    def _calculate_similarity(self, actual: str, expected: str) -> float:
        """유사도 계산 (간단한 예시)"""
        actual_tokens = set(actual.split())
        expected_tokens = set(expected.split())
        
        if not expected_tokens:
            return 1.0 if not actual_tokens else 0.0
        
        intersection = actual_tokens.intersection(expected_tokens)
        return len(intersection) / len(expected_tokens)


class SortedChecker(BaseChecker):
    """정렬된 출력 검증기"""
    
    def check(self, actual_output: str, expected_output: str, **kwargs) -> bool:
        """정렬된 순서로 검증"""
        actual_lines = sorted(line.strip() for line in actual_output.split('\n') if line.strip())
        expected_lines = sorted(line.strip() for line in expected_output.split('\n') if line.strip())
        return actual_lines == expected_lines


class UnorderedChecker(BaseChecker):
    """순서 무관 검증기"""
    
    def check(self, actual_output: str, expected_output: str, **kwargs) -> bool:
        """순서에 관계없이 검증"""
        actual_items = set(line.strip() for line in actual_output.split('\n') if line.strip())
        expected_items = set(line.strip() for line in expected_output.split('\n') if line.strip())
        return actual_items == expected_items