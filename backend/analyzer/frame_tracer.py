"""
프레임별 변수 추출기
Pathrise Python Tutor의 변수 추출 로직을 참고하여 구현
"""

import sys
import traceback
import types
import bdb
from typing import Dict, List, Any, Optional, Set


# 무시할 변수들
IGNORE_VARS = {
    '__builtins__', '__name__', '__doc__', '__package__', '__spec__',
    '__file__', '__cached__', '__loader__', '__annotations__'
}


def get_user_globals(frame, at_global_scope=False):
    """전역 변수 추출 (Pathrise Python Tutor 방식)"""
    d = filter_var_dict(frame.f_globals)
    
    # 전역 스코프에서만 __return__ 제거
    if '__return__' in d:
        del d['__return__']
    return d


def get_user_locals(frame):
    """로컬 변수 추출 (Pathrise Python Tutor 방식)"""
    ret = filter_var_dict(frame.f_locals)
    return ret


def filter_var_dict(d):
    """변수 딕셔너리 필터링"""
    ret = {}
    for (k, v) in d.items():
        if k not in IGNORE_VARS:
            ret[k] = v
    return ret


def should_hide_var(var_name):
    """숨김 처리할 변수인지 확인"""
    if var_name.startswith('__') and var_name.endswith('__'):
        return True
    if var_name in IGNORE_VARS:
        return True
    return False


def encode_value(value):
    """값을 JSON 직렬화 가능한 형태로 인코딩"""
    if value is None:
        return None
    elif isinstance(value, (bool, int, float, str)):
        return value
    elif isinstance(value, (list, tuple)):
        try:
            return [encode_value(item) for item in value[:10]]  # 최대 10개 요소만
        except:
            return f"<{type(value).__name__} object>"
    elif isinstance(value, dict):
        try:
            encoded = {}
            for k, v in list(value.items())[:10]:  # 최대 10개 항목만
                encoded[str(k)] = encode_value(v)
            return encoded
        except:
            return f"<{type(value).__name__} object>"
    elif isinstance(value, set):
        try:
            return list(value)[:10]  # set을 list로 변환
        except:
            return f"<{type(value).__name__} object>"
    elif callable(value):
        if hasattr(value, '__name__'):
            return f"<function {value.__name__}>"
        else:
            return f"<{type(value).__name__} object>"
    else:
        try:
            # 문자열 표현이 가능한 객체
            str_repr = str(value)
            if len(str_repr) > 100:
                str_repr = str_repr[:97] + "..."
            return str_repr
        except:
            return f"<{type(value).__name__} object>"


class FrameTracer(bdb.Bdb):
    """프레임별 실행 추적기"""
    
    def __init__(self):
        super().__init__()
        self.traces = []
        self.current_line = 0
        self.all_globals_in_order = []
        self.frame_stack = []
        
    def user_line(self, frame):
        """라인별 실행 시 호출"""
        self.current_line = frame.f_lineno
        
        # 사용자 코드가 아닌 경우 무시
        if not self._is_user_code(frame):
            return
            
        trace_entry = self._create_trace_entry(frame)
        self.traces.append(trace_entry)
        
    def user_call(self, frame, argument_list):
        """함수 호출 시 호출"""
        if not self._is_user_code(frame):
            return
            
        self.frame_stack.append(frame)
        trace_entry = self._create_trace_entry(frame, event_type='call')
        self.traces.append(trace_entry)
        
    def user_return(self, frame, return_value):
        """함수 리턴 시 호출"""
        if not self._is_user_code(frame):
            return
            
        if self.frame_stack and frame in self.frame_stack:
            self.frame_stack.remove(frame)
            
        trace_entry = self._create_trace_entry(frame, event_type='return', return_value=return_value)
        self.traces.append(trace_entry)
        
    def _is_user_code(self, frame):
        """사용자 코드인지 확인"""
        filename = frame.f_code.co_filename
        return filename == '<string>' or filename.endswith('user_code.py')
        
    def _create_trace_entry(self, frame, event_type='line', return_value=None):
        """트레이스 엔트리 생성"""
        # 현재 프레임의 로컬 변수
        encoded_locals = {}
        for k, v in get_user_locals(frame).items():
            if not should_hide_var(k):
                encoded_locals[k] = encode_value(v)
                
        # 리턴 값이 있는 경우 추가
        if return_value is not None:
            encoded_locals['__return__'] = encode_value(return_value)
            
        # 전역 변수 (최상위 프레임에서만)
        encoded_globals = {}
        if frame.f_code.co_name == '<module>':
            for k, v in get_user_globals(frame, at_global_scope=True).items():
                if not should_hide_var(k):
                    encoded_globals[k] = encode_value(v)
                    if k not in self.all_globals_in_order:
                        self.all_globals_in_order.append(k)
        
        # 함수명과 변수명 순서 정리
        func_name = frame.f_code.co_name
        if func_name == '<module>':
            func_name = 'Global frame'
        elif func_name == '<lambda>':
            func_name = f'lambda on line {frame.f_code.co_firstlineno}'
        elif func_name == '':
            func_name = 'unnamed function'
            
        # 변수명 순서 정리 (co_varnames 기준으로 정렬)
        ordered_varnames = []
        if frame.f_code.co_varnames:
            for varname in frame.f_code.co_varnames:
                if varname in encoded_locals:
                    ordered_varnames.append(varname)
                    
        # co_varnames에 없는 변수들을 알파벳 순으로 추가
        for varname in sorted(encoded_locals.keys()):
            if varname not in ordered_varnames and varname != '__return__':
                ordered_varnames.append(varname)
                
        # __return__은 마지막에 추가
        if '__return__' in encoded_locals:
            ordered_varnames.append('__return__')
            
        return {
            'line': frame.f_lineno,
            'event': event_type,
            'func_name': func_name,
            'encoded_locals': encoded_locals,
            'ordered_varnames': ordered_varnames,
            'globals': encoded_globals,
            'ordered_globals': [k for k in self.all_globals_in_order if k in encoded_globals],
            'stack_to_render': self._get_stack_frames()
        }
        
    def _get_stack_frames(self):
        """현재 스택 프레임들 정보 수집"""
        stack_frames = []
        for i, frame in enumerate(reversed(self.frame_stack)):
            if not self._is_user_code(frame):
                continue
                
            encoded_locals = {}
            for k, v in get_user_locals(frame).items():
                if not should_hide_var(k):
                    encoded_locals[k] = encode_value(v)
                    
            func_name = frame.f_code.co_name
            if func_name == '<module>':
                func_name = 'Global frame'
            elif func_name == '<lambda>':
                func_name = f'lambda on line {frame.f_code.co_firstlineno}'
            elif func_name == '':
                func_name = 'unnamed function'
                
            ordered_varnames = []
            if frame.f_code.co_varnames:
                for varname in frame.f_code.co_varnames:
                    if varname in encoded_locals:
                        ordered_varnames.append(varname)
                        
            for varname in sorted(encoded_locals.keys()):
                if varname not in ordered_varnames and varname != '__return__':
                    ordered_varnames.append(varname)
                    
            if '__return__' in encoded_locals:
                ordered_varnames.append('__return__')
                
            stack_frames.append({
                'func_name': func_name,
                'encoded_locals': encoded_locals,
                'ordered_varnames': ordered_varnames,
                'is_highlighted': i == 0,  # 최상위 프레임 하이라이트
                'frame_id': id(frame),
                'is_parent': False,
                'is_zombie': False
            })
            
        return stack_frames


def trace_execution(code: str, input_data: str = "") -> List[Dict]:
    """코드 실행을 추적하여 프레임별 변수 상태 반환"""
    tracer = FrameTracer()
    
    # 입력 데이터 준비
    if input_data:
        input_lines = input_data.strip().split('\n')
        input_iter = iter(input_lines)
        
        def mock_input(prompt=""):
            try:
                return next(input_iter)
            except StopIteration:
                return ""
    else:
        def mock_input(prompt=""):
            return ""
    
    # 실행 환경 설정
    globals_dict = {
        '__builtins__': __builtins__,
        'input': mock_input,
        'print': lambda *args, **kwargs: None  # print 출력 무시
    }
    
    try:
        # 디버거 설정 및 실행
        tracer.set_trace()
        exec(code, globals_dict)
        tracer.set_quit()
    except Exception as e:
        # 오류 발생 시에도 지금까지의 추적 결과 반환
        pass
    
    return tracer.traces