#!/usr/bin/env python3
"""
시각화 API 테스트
"""

import sys
import os
import json
from typing import Dict, List, Any, Optional

# 백엔드 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from analyzer.frame_tracer import trace_execution

class Step:
    def __init__(self, line, operation, variables, description=None, func_name=None, stack_frames=None, globals_vars=None, output=None):
        self.line = line
        self.operation = operation
        self.variables = variables
        self.description = description
        self.func_name = func_name
        self.stack_frames = stack_frames or []
        self.globals_vars = globals_vars or {}
        self.output = output

def simulate_execution_test(code: str, input_data: str = "") -> List[Step]:
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
            
            # Step 객체 생성
            step = Step(
                line=trace['line'],
                operation=operation,
                variables=trace['encoded_locals'],
                description=description,
                func_name=trace.get('func_name'),
                stack_frames=trace.get('stack_to_render', []),
                globals_vars=trace.get('globals', {})
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

def test_visualization_api():
    """시각화 API 테스트"""
    print("=== 시각화 API 테스트 ===")
    
    # 테스트 코드
    code = """
def greet(name):
    message = "Hello, " + name
    return message

user_name = "Alice"
greeting = greet(user_name)
print(greeting)
"""
    
    try:
        # simulate_execution 함수 직접 테스트
        steps = simulate_execution_test(code, "")
        
        print(f"생성된 단계 수: {len(steps)}")
        
        for i, step in enumerate(steps):
            print(f"\n단계 {i+1}:")
            print(f"  라인: {step.line}")
            print(f"  작업: {step.operation}")
            print(f"  설명: {step.description}")
            print(f"  함수명: {step.func_name}")
            print(f"  변수: {step.variables}")
            
            if step.stack_frames:
                print(f"  스택 프레임: {len(step.stack_frames)}개")
                for j, frame in enumerate(step.stack_frames):
                    print(f"    프레임 {j+1}: {frame['func_name']} - {list(frame['encoded_locals'].keys())}")
                    
            if step.globals_vars:
                print(f"  전역 변수: {list(step.globals_vars.keys())}")
                
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()

def test_simple_code():
    """간단한 코드 테스트"""
    print("\n=== 간단한 코드 테스트 ===")
    
    code = """
x = 10
y = 20
result = x + y
"""
    
    try:
        steps = simulate_execution_test(code, "")
        
        print(f"생성된 단계 수: {len(steps)}")
        
        for i, step in enumerate(steps):
            print(f"\n단계 {i+1}: 라인 {step.line} - {step.operation}")
            print(f"  변수: {step.variables}")
            print(f"  전역 변수: {step.globals_vars}")
                
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_simple_code()
    test_visualization_api()