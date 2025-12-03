"""
GPT 기반 코드 피드백 생성기
"""

import os
from typing import List, Dict, Optional
from openai import AsyncOpenAI


class GPTFeedbackAnalyzer:
    """GPT를 사용한 코드 피드백 분석"""
    
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"  # 비용 효율적인 모델
    
    async def analyze_code(
        self,
        code: str,
        problem_description: str,
        language: str = "python",
        verdict: str = "AC",
        execution_time: float = 0.0,
        memory_usage: int = 0
    ) -> List[Dict]:
        """
        코드를 분석하고 피드백 생성
        
        Args:
            code: 제출된 코드
            problem_description: 문제 설명
            language: 프로그래밍 언어
            verdict: 채점 결과 (AC, WA, TLE 등)
            execution_time: 실행 시간
            memory_usage: 메모리 사용량
            
        Returns:
            피드백 리스트
        """
        
        prompt = self._create_prompt(
            code, problem_description, language, 
            verdict, execution_time, memory_usage
        )
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert programming tutor specializing in algorithm optimization and code review. Provide constructive, educational feedback in Korean."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            feedback_text = response.choices[0].message.content
            feedbacks = self._parse_feedback(feedback_text, verdict)
            
            return feedbacks
            
        except Exception as e:
            print(f"GPT API Error: {e}")
            return [{
                "type": "analysis",
                "title": "분석 오류",
                "message": "코드 분석 중 오류가 발생했습니다.",
                "severity": "info"
            }]
    
    def _create_prompt(
        self,
        code: str,
        problem_description: str,
        language: str,
        verdict: str,
        execution_time: float,
        memory_usage: int
    ) -> str:
        """피드백 요청 프롬프트 생성"""
        
        verdict_kr = {
            "AC": "정답",
            "WA": "오답",
            "TLE": "시간 초과",
            "MLE": "메모리 초과",
            "RE": "런타임 에러",
            "CE": "컴파일 에러"
        }.get(verdict, verdict)
        
        # 판정에 따라 다른 피드백 요청
        if verdict != "AC":
            # 오답인 경우: 가장 중요한 문제점 1가지만 간단히
            prompt = f"""다음 알고리즘 문제에 대한 학생의 코드를 분석해주세요.

## 문제 설명
{problem_description}

## 제출 코드 ({language})
```{language}
{code}
```

## 채점 결과
- 판정: {verdict_kr}

## 피드백 요청

**절대로 답을 직관적으로 가르쳐주지 말 것**
**중요: 반드시 1개의 피드백만 제공하세요. 가장 핵심적인 문제점 하나만 선택하세요.**

다음 우선순위 중 해당하는 것 하나만 선택:
1. 문법 오류가 있으면 → [문법 오류]
2. 문제 접근이 잘못되었으면 → [접근 실수]
3. 로직 오류가 있으면 → [논리 오류]
4. 그 외 개선이 필요하면 → [개선 제안]

형식:
[카테고리명] 제목 (20자 이내)

예시:
[문법 오류] 인덱스 범위 초과
리스트 길이가 n인데 arr[n]에 접근하고 있습니다. arr[n-1]이 마지막 요소입니다.

[접근 실수] 잘못된 알고리즘
정렬이 아닌 해시맵을 사용해야 O(n)으로 해결할 수 있습니다.
"""
        else:
            # 정답인 경우: 가장 중요한 개선사항 1가지만
            prompt = f"""다음 알고리즘 문제에 대한 학생의 정답 코드를 분석해주세요.

## 문제 설명
{problem_description}

## 제출 코드 ({language})
```{language}
{code}
```

## 채점 결과
- 판정: {verdict_kr} ✅
- 실행 시간: {execution_time:.2f}ms

## 피드백 요청

**중요: 반드시 1개의 피드백만 제공하세요. 가장 의미있는 정보 하나만 선택하세요.**

다음 중 가장 중요한 것 하나만 선택:
1. 시간/공간 복잡도가 비효율적이면 → [복잡도 개선]
2. 코드 품질 개선이 필요하면 → [코드 품질]
3. 더 나은 알고리즘이 있으면 → [최적화 제안]
4. 완벽하면 → [우수한 풀이]

형식:
[카테고리명] 제목 (30자 이내)
내용 (200자 이내로 구체적이고 명확하게)

예시:
[복잡도 개선] O(n²)을 O(n)으로
해시맵 사용 시 중복 탐색을 제거하여 시간 복잡도를 크게 단축할 수 있습니다.

[우수한 풀이] 최적 알고리즘
O(n) 시간, O(1) 공간으로 효율적입니다. 더 이상의 개선이 어렵습니다.
"""
        
        return prompt
    
    def _parse_feedback(self, feedback_text: str, verdict: str) -> List[Dict]:
        """GPT 응답을 구조화된 피드백으로 파싱 (1개만)"""
        
        # 우선순위 매핑
        priority_map = {
            "문법 오류": 1,
            "문법오류": 1,
            "syntax error": 1,
            "접근 실수": 2,
            "접근실수": 2,
            "문제 접근": 2,
            "approach": 2,
            "논리 오류": 3,
            "논리오류": 3,
            "logic error": 3,
            "개선 제안": 4,
            "개선제안": 4,
            "복잡도 개선": 1,
            "시간 복잡도": 1,
            "시간복잡도": 1,
            "공간 복잡도": 1,
            "공간복잡도": 1,
            "코드 품질": 2,
            "코드품질": 2,
            "최적화 제안": 3,
            "최적화제안": 3,
            "우수한 풀이": 4,
            "우수한풀이": 4
        }
        
        lines = feedback_text.strip().split('\n')
        current_feedback = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 카테고리 태그 감지: [카테고리]
            if line.startswith('[') and ']' in line:
                # 첫 번째 피드백만 처리
                if current_feedback:
                    break  # 이미 하나 찾았으면 중단
                
                # 새 피드백 시작
                category_end = line.index(']')
                category = line[1:category_end].strip()
                title = line[category_end + 1:].strip()
                
                # 제목 30자 제한
                if len(title) > 30:
                    title = title[:27] + "..."
                
                # 우선순위 결정
                priority = priority_map.get(category.lower(), 99)
                
                # 카테고리별 심각도 설정
                severity = self._get_severity(category, verdict)
                
                current_feedback = {
                    "type": category,
                    "title": title,
                    "message": "",
                    "severity": severity,
                    "priority": priority
                }
            elif current_feedback:
                # 내용 추가
                if current_feedback["message"]:
                    current_feedback["message"] += " "
                current_feedback["message"] += line
        
        # 메시지 200자 제한
        if current_feedback and len(current_feedback["message"]) > 200:
            current_feedback["message"] = current_feedback["message"][:197] + "..."
        
        # 파싱 성공 시 1개의 피드백 반환
        if current_feedback:
            return [current_feedback]
        
        # 파싱 실패 시 전체 텍스트를 하나의 피드백으로 (200자 제한)
        message = feedback_text[:197] + "..." if len(feedback_text) > 200 else feedback_text
        return [{
            "type": "분석 결과",
            "title": "코드 분석",
            "message": message,
            "severity": "info",
            "priority": 99
        }]
    
    def _get_severity(self, category: str, verdict: str) -> str:
        """카테고리와 판정에 따른 심각도 결정"""
        
        category_lower = category.lower()
        
        # WA, TLE 등 오답인 경우
        if verdict != "AC":
            # 문법 오류는 반드시 고쳐야 함
            if any(word in category_lower for word in ["문법", "syntax"]):
                return "error"
            # 접근 실수, 논리 오류는 경고
            elif any(word in category_lower for word in ["접근", "논리", "logic", "approach"]):
                return "warning"
            # 개선 제안은 정보
            elif any(word in category_lower for word in ["개선", "제안", "optimization"]):
                return "info"
        # AC인 경우
        else:
            # 복잡도가 비효율적이면 경고
            if any(word in category_lower for word in ["복잡도", "complexity"]):
                return "warning"
            # 최적화 제안도 경고
            elif any(word in category_lower for word in ["최적화", "개선", "optimization"]):
                return "warning"
            # 코드 품질, 모범 답안은 정보
            else:
                return "info"
        
        return "info"


# 전역 인스턴스
_feedback_analyzer: Optional[GPTFeedbackAnalyzer] = None


def get_feedback_analyzer() -> GPTFeedbackAnalyzer:
    """피드백 분석기 싱글톤 인스턴스"""
    global _feedback_analyzer
    if _feedback_analyzer is None:
        _feedback_analyzer = GPTFeedbackAnalyzer()
    return _feedback_analyzer
