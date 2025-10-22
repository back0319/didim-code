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
    """코드 실행을 시뮬레이션하여 단계별 정보 생성"""
    steps = []
    code_lines = code.split('\n')
    
    # 함수만 정의된 경우 체크
    has_function_calls = any('(' in line and not line.strip().startswith('def ') and not line.strip().startswith('#') 
                            for line in code_lines if line.strip() and not line.strip().startswith('def '))
    function_definitions = []
    
    try:
        # AST를 사용해서 함수 정의 찾기
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    function_definitions.append({
                        'name': node.name,
                        'args': [arg.arg for arg in node.args.args],
                        'line': node.lineno
                    })
        except:
            pass
        
        # 간단한 정적 분석으로 실행 과정 시뮬레이션
        lines_with_operations = []
        
        for i, line in enumerate(code_lines, 1):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
                
            # 변수 할당 감지
            if '=' in line and not any(op in line for op in ['==', '!=', '<=', '>=']):
                var_name = line.split('=')[0].strip()
                operation = "assignment"
                description = f"변수 {var_name}에 값을 할당합니다"
                
                # 간단한 값 추정
                if 'input()' in line:
                    mock_value = input_data.split('\n')[0] if input_data else "test_input"
                elif any(num in line for num in '0123456789'):
                    numbers = re.findall(r'\d+', line)
                    mock_value = int(numbers[0]) if numbers else 0
                elif 'range(' in line:
                    mock_value = [0, 1, 2, 3, 4]
                else:
                    mock_value = "computed_value"
                
                variables = {var_name: mock_value}
                
            elif line.startswith('print('):
                operation = "output"
                description = "결과를 출력합니다"
                variables = {}
                
            elif line.startswith('for ') or line.startswith('while '):
                operation = "loop"
                description = "반복문을 실행합니다"
                variables = {}
                
            elif line.startswith('if '):
                operation = "condition"
                description = "조건을 확인합니다"
                variables = {}
                
            elif line.startswith('def '):
                # 함수 정의에서 함수명과 매개변수 추출
                func_name = line.split('(')[0].replace('def ', '').strip()
                params_part = line.split('(')[1].split(')')[0] if '(' in line else ''
                params = [p.strip() for p in params_part.split(',') if p.strip()] if params_part else []
                
                operation = "function_def"
                description = f"함수 '{func_name}'를 정의합니다"
                variables = {func_name: f"function({', '.join(params)})"}
                
                # 매개변수도 변수로 추가
                for param in params:
                    if param:
                        variables[param] = f"parameter of {func_name}"
                
            elif line.startswith('return '):
                operation = "return"
                description = "값을 반환합니다"
                variables = {}
                
            else:
                operation = "statement"
                description = f"구문을 실행합니다: {line}"
                variables = {}
            
            step = Step(
                line=i,
                operation=operation,
                variables=variables,
                description=description
            )
            steps.append(step)
        
        # 함수만 정의되고 호출이 없는 경우 예시 호출 추가
        if function_definitions and not has_function_calls and len(steps) > 0:
            for func_def in function_definitions:
                if func_def['args']:
                    # 매개변수가 있는 경우 예시 값으로 시뮬레이션
                    example_args = []
                    example_values = {}
                    for j, arg in enumerate(func_def['args']):
                        example_val = j + 1  # 간단한 예시 값
                        example_args.append(str(example_val))
                        example_values[arg] = example_val
                    
                    steps.append(Step(
                        line=len(code_lines) + 1,
                        operation="function_call_example",
                        variables=example_values,
                        description=f"예시: {func_def['name']}({', '.join(example_args)}) 호출 시뮬레이션"
                    ))
                else:
                    steps.append(Step(
                        line=len(code_lines) + 1,
                        operation="function_call_example", 
                        variables={},
                        description=f"예시: {func_def['name']}() 호출 시뮬레이션"
                    ))
    
    except Exception as e:
        # 오류 발생 시 기본 단계 생성
        steps = [Step(
            line=1,
            operation="execution",
            variables={},
            description=f"코드 분석 중 오류 발생: {str(e)}"
        )]
    
    return steps


@router.post("/visualize", response_model=VisualizationResponse)
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


@router.get("/visualize/test")
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