"""
코드 시각화 API
Python 코드 실행 과정을 단계별로 시각화
"""

import ast
import sys
import traceback
import io
import re
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# 새로운 프레임 추적기 import
from analyzer.frame_tracer import trace_execution

router = APIRouter()


class VisualizationRequest(BaseModel):
    code: str
    language: str = "python"
    input_data: str = ""


class Step(BaseModel):
    line: int
    operation: str
    variables: Dict[str, Any]
    output: Optional[str] = None
    description: Optional[str] = None
    func_name: Optional[str] = None
    stack_frames: Optional[List[Dict]] = None
    globals_vars: Optional[Dict[str, Any]] = None
    current_blocks: Optional[List[Dict]] = None  # 블록 구조 정보 추가


class ComplexityInfo(BaseModel):
    time_complexity: str
    space_complexity: str
    explanation: str


class VisualizationResponse(BaseModel):
    steps: List[Step]
    code_lines: List[str]
    complexity_info: Optional[ComplexityInfo] = None


def analyze_complexity(code: str) -> ComplexityInfo:
    """코드의 시간/공간 복잡도 분석"""
    try:
        tree = ast.parse(code)
        
        # 기본적인 복잡도 분석
        time_complexity = "O(1)"
        space_complexity = "O(1)"
        explanation = "단순한 연산만 포함되어 있습니다."
        
        loop_count = 0
        has_recursion = False
        has_list_operations = False
        has_sorting = False
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                loop_count += 1
            elif isinstance(node, ast.FunctionDef):
                # 재귀 함수 체크 (함수 내에서 자기 자신을 호출)
                for child in ast.walk(node):
                    if isinstance(child, ast.Call) and hasattr(child.func, 'id'):
                        if child.func.id == node.name:
                            has_recursion = True
            elif isinstance(node, ast.Call) and hasattr(node.func, 'id'):
                func_name = node.func.id
                if func_name in ['sorted', 'sort']:
                    has_sorting = True
            elif isinstance(node, (ast.List, ast.ListComp, ast.Dict, ast.DictComp)):
                has_list_operations = True
        
        # 복잡도 결정 로직
        if has_recursion:
            if 'fibonacci' in code.lower():
                time_complexity = "O(2^n)"
                explanation = "피보나치 수열의 단순 재귀 구현으로 지수 시간 복잡도를 가집니다."
            else:
                time_complexity = "O(n)"
                explanation = "재귀 함수로 인해 선형 시간 복잡도를 가집니다."
        elif has_sorting:
            time_complexity = "O(n log n)"
            explanation = "정렬 알고리즘으로 인해 O(n log n) 시간 복잡도를 가집니다."
        elif loop_count >= 2:
            time_complexity = "O(n²)"
            explanation = "중첩된 반복문으로 인해 이차 시간 복잡도를 가집니다."
        elif loop_count == 1:
            time_complexity = "O(n)"
            explanation = "단일 반복문으로 인해 선형 시간 복잡도를 가집니다."
        
        if has_list_operations or has_recursion:
            space_complexity = "O(n)"
        
        return ComplexityInfo(
            time_complexity=time_complexity,
            space_complexity=space_complexity,
            explanation=explanation
        )
    
    except:
        return ComplexityInfo(
            time_complexity="분석 불가",
            space_complexity="분석 불가", 
            explanation="코드 분석 중 오류가 발생했습니다."
        )


def simulate_execution(code: str, input_data: str = "") -> List[Step]:
    """코드 실행을 실제로 추적하여 단계별 정보 생성"""
    try:
        # 프레임 추적기를 사용하여 실제 실행 추적
        traces = trace_execution(code, input_data)
        
        steps = []
        for trace in traces:
            # 이벤트 타입에 따른 operation 결정
            operation = "line"
            description = f"라인 {trace['line']} 실행"
            
            if trace['event'] == 'call':
                operation = "function_call"
                description = f"함수 '{trace['func_name']}' 호출"
            elif trace['event'] == 'return':
                operation = "function_return"
                description = f"함수 '{trace['func_name']}'에서 반환"
            elif trace['event'] == 'line':
                # 라인의 내용에 따라 operation 세분화
                code_lines = code.split('\n')
                if trace['line'] <= len(code_lines):
                    current_line = code_lines[trace['line'] - 1].strip()
                    
                    if '=' in current_line and not any(op in current_line for op in ['==', '!=', '<=', '>=']):
                        operation = "assignment"
                        var_name = current_line.split('=')[0].strip()
                        description = f"변수 '{var_name}'에 값 할당"
                    elif current_line.startswith('print('):
                        operation = "output"
                        description = "출력 실행"
                    elif current_line.startswith(('if ', 'elif ', 'else:')):
                        operation = "condition"
                        description = "조건문 실행"
                    elif current_line.startswith(('for ', 'while ')):
                        operation = "loop"
                        description = "반복문 실행"
                    elif current_line.startswith('def '):
                        operation = "function_def"
                        func_name = current_line.split('(')[0].replace('def ', '').strip()
                        description = f"함수 '{func_name}' 정의"
                    elif current_line.startswith('return '):
                        operation = "return"
                        description = "값 반환"
            
            # Step 객체 생성 - 더 구조화된 데이터 제공
            stack_frames = trace.get('stack_to_render', [])
            globals_vars = trace.get('globals', {})
            locals_vars = trace['encoded_locals']
            
            # 전역과 로컬 변수를 합친 변수 딕셔너리
            all_variables = {**globals_vars, **locals_vars}
            
            step = Step(
                line=trace['line'],
                operation=operation,
                variables=all_variables,  # 모든 변수 (호환성 유지)
                description=description,
                func_name=trace.get('func_name'),
                stack_frames=stack_frames,
                globals_vars=globals_vars,
                current_blocks=trace.get('current_blocks', [])  # 블록 구조 정보 추가
            )
            
            steps.append(step)
        
        # 추적 결과가 없는 경우 기본 단계 생성
        if not steps:
            steps = [Step(
                line=1,
                operation="execution",
                variables={},
                description="코드 실행 시작",
                func_name="Global frame",
                stack_frames=[],
                globals_vars={}
            )]
            
    except Exception as e:
        # 오류 발생 시 기본 단계 생성
        steps = [Step(
            line=1,
            operation="error",
            variables={},
            description=f"실행 중 오류 발생: {str(e)}",
            func_name="Error",
            stack_frames=[],
            globals_vars={}
        )]
    
    return steps


@router.post("/api/visualize", response_model=VisualizationResponse)
async def visualize_code(request: VisualizationRequest):
    """코드 실행 과정을 시각화"""
    
    if request.language != "python":
        raise HTTPException(status_code=400, detail="Currently only Python is supported")
    
    try:
        # 코드 검증
        try:
            ast.parse(request.code)
        except SyntaxError as e:
            raise HTTPException(status_code=400, detail=f"Syntax Error: {str(e)}")
        
        # 코드 라인 분할
        code_lines = request.code.split('\n')
        
        # 실행 단계 시뮬레이션
        steps = simulate_execution(request.code, request.input_data)
        
        # 복잡도 분석
        complexity_info = analyze_complexity(request.code)
        
        return VisualizationResponse(
            steps=steps,
            code_lines=code_lines,
            complexity_info=complexity_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Visualization error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Visualization failed: {str(e)}")


@router.get("/api/visualize/test")
async def test_visualization():
    """시각화 기능 테스트"""
    test_code = """# A+B 문제 해결
a = int(input())
b = int(input())
result = a + b
print(result)"""
    
    request = VisualizationRequest(
        code=test_code,
        input_data="5\n3"
    )
    return await visualize_code(request)