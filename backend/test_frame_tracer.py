#!/usr/bin/env python3
"""
프레임 추적기 테스트
"""

import sys
import os

# 백엔드 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from analyzer.frame_tracer import trace_execution

def test_simple_execution():
    """간단한 실행 테스트"""
    print("=== 간단한 실행 테스트 ===")
    
    code = """
x = 10
y = 20
result = x + y
print(result)
"""
    
    traces = trace_execution(code)
    
    print(f"추적된 단계 수: {len(traces)}")
    for i, trace in enumerate(traces):
        print(f"\n단계 {i+1}:")
        print(f"  라인: {trace['line']}")
        print(f"  이벤트: {trace['event']}")
        print(f"  함수: {trace['func_name']}")
        print(f"  로컬 변수: {trace['encoded_locals']}")
        print(f"  전역 변수: {trace['globals']}")

def test_function_execution():
    """함수 실행 테스트"""
    print("\n=== 함수 실행 테스트 ===")
    
    code = """
def add(a, b):
    result = a + b
    return result

x = 5
y = 3
answer = add(x, y)
print(answer)
"""
    
    traces = trace_execution(code)
    
    print(f"추적된 단계 수: {len(traces)}")
    for i, trace in enumerate(traces):
        print(f"\n단계 {i+1}:")
        print(f"  라인: {trace['line']}")
        print(f"  이벤트: {trace['event']}")
        print(f"  함수: {trace['func_name']}")
        print(f"  로컬 변수: {trace['encoded_locals']}")
        if trace['stack_to_render']:
            print(f"  스택 프레임: {len(trace['stack_to_render'])}개")
            for j, frame in enumerate(trace['stack_to_render']):
                print(f"    프레임 {j+1}: {frame['func_name']} - {frame['encoded_locals']}")

def test_recursive_function():
    """재귀 함수 테스트"""
    print("\n=== 재귀 함수 테스트 ===")
    
    code = """
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(3)
print(result)
"""
    
    traces = trace_execution(code)
    
    print(f"추적된 단계 수: {len(traces)}")
    # 처음 몇 단계만 출력
    for i, trace in enumerate(traces[:10]):
        print(f"\n단계 {i+1}:")
        print(f"  라인: {trace['line']}")
        print(f"  이벤트: {trace['event']}")
        print(f"  함수: {trace['func_name']}")
        print(f"  로컬 변수: {trace['encoded_locals']}")
        print(f"  스택 깊이: {len(trace['stack_to_render'])}")

if __name__ == "__main__":
    try:
        test_simple_execution()
        test_function_execution()
        test_recursive_function()
        print("\n모든 테스트 완료!")
    except Exception as e:
        print(f"테스트 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()