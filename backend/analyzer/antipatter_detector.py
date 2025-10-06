class AntiPatternDetector:
    def detect_list_pop_zero(self, code: str) -> List[Dict]:
        # list.pop(0) 반복 사용 탐지    
        pass

    def detect_nested_sorting(self, code: str) -> List[Dict]:
        # 루프 내부 정렬 호출 탐지
        pass

    def detect_missing_memoization(self, code: str) -> List[Dict]:
        # 메모이제이션 부재 재귀 탐지
        pass