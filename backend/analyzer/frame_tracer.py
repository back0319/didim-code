"""
프레임별 변수 추출기
Pathrise Python Tutor의 변수 추출 로직을 참고하여 구현
블록 구조 (for, while, if 등) 감지 기능 추가
"""

import sys
import traceback
import types
import bdb
import ast
import re
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


class BlockStructureAnalyzer:
    """코드의 블록 구조를 분석하는 클래스"""
    
    def __init__(self, code: str):
        self.code = code
        self.lines = code.split('\n')
        self.block_info = {}  # line_number -> block_info
        self.analyze_blocks()
    
    def analyze_blocks(self):
        """코드의 블록 구조를 분석"""
        try:
            tree = ast.parse(self.code)
            self._analyze_node(tree, 0)
        except:
            # AST 분석 실패 시 정규식으로 대체
            self._analyze_with_regex()
    
    def _analyze_node(self, node, depth=0):
        """AST 노드를 재귀적으로 분석"""
        for child in ast.iter_child_nodes(node):
            if hasattr(child, 'lineno'):
                block_type = None
                block_name = None
                
                if isinstance(child, ast.For):
                    block_type = "for_loop"
                    # for 변수 추출
                    if hasattr(child.target, 'id'):
                        block_name = f"for {child.target.id}"
                    else:
                        block_name = "for loop"
                        
                elif isinstance(child, ast.While):
                    block_type = "while_loop"
                    block_name = "while loop"
                    
                elif isinstance(child, ast.If):
                    block_type = "if_block"
                    block_name = "if block"
                    
                elif isinstance(child, ast.With):
                    block_type = "with_block"
                    block_name = "with block"
                    
                elif isinstance(child, ast.Try):
                    block_type = "try_block"
                    block_name = "try block"
                    
                elif isinstance(child, ast.FunctionDef):
                    block_type = "function"
                    block_name = f"function {child.name}"
                
                if block_type:
                    # 블록의 시작과 끝 라인 계산
                    start_line = child.lineno
                    end_line = self._get_end_line(child)
                    
                    self.block_info[start_line] = {
                        'type': block_type,
                        'name': block_name,
                        'start_line': start_line,
                        'end_line': end_line,
                        'depth': depth,
                        'parent_blocks': self._get_parent_blocks(start_line, depth)
                    }
            
            # 재귀적으로 하위 노드 분석
            self._analyze_node(child, depth + 1)
    
    def _get_end_line(self, node):
        """노드의 끝 라인 번호 계산"""
        if hasattr(node, 'end_lineno') and node.end_lineno:
            return node.end_lineno
        
        # end_lineno가 없는 경우 하위 노드들의 최대 라인 번호 사용
        max_line = getattr(node, 'lineno', 0)
        for child in ast.walk(node):
            if hasattr(child, 'lineno'):
                max_line = max(max_line, child.lineno)
        return max_line
    
    def _get_parent_blocks(self, line_number, current_depth):
        """현재 라인의 부모 블록들을 찾기"""
        parents = []
        for block_line, block_info in self.block_info.items():
            if (block_info['start_line'] < line_number and 
                block_info['end_line'] >= line_number and
                block_info['depth'] < current_depth):
                parents.append(block_info)
        return sorted(parents, key=lambda x: x['depth'])
    
    def _analyze_with_regex(self):
        """정규식을 사용한 블록 구조 분석 (AST 실패 시 대체)"""
        for i, line in enumerate(self.lines, 1):
            stripped_line = line.strip()
            indent_level = len(line) - len(line.lstrip())
            
            if re.match(r'^\s*for\s+\w+\s+in\s+', line):
                match = re.search(r'for\s+(\w+)\s+in', line)
                var_name = match.group(1) if match else "loop_var"
                self.block_info[i] = {
                    'type': 'for_loop',
                    'name': f'for {var_name}',
                    'start_line': i,
                    'end_line': self._find_block_end(i, indent_level),
                    'depth': indent_level // 4,  # 4칸 들여쓰기 가정
                    'parent_blocks': []
                }
            elif re.match(r'^\s*while\s+', line):
                self.block_info[i] = {
                    'type': 'while_loop',
                    'name': 'while loop',
                    'start_line': i,
                    'end_line': self._find_block_end(i, indent_level),
                    'depth': indent_level // 4,
                    'parent_blocks': []
                }
            elif re.match(r'^\s*if\s+', line):
                self.block_info[i] = {
                    'type': 'if_block',
                    'name': 'if block',
                    'start_line': i,
                    'end_line': self._find_block_end(i, indent_level),
                    'depth': indent_level // 4,
                    'parent_blocks': []
                }
    
    def _find_block_end(self, start_line, indent_level):
        """블록의 끝 라인을 찾기"""
        for i in range(start_line, len(self.lines)):
            line = self.lines[i]
            if line.strip() and len(line) - len(line.lstrip()) <= indent_level:
                return i
        return len(self.lines)
    
    def get_current_blocks(self, line_number):
        """현재 라인이 속한 블록들을 반환"""
        current_blocks = []
        for block_line, block_info in self.block_info.items():
            if (block_info['start_line'] <= line_number <= block_info['end_line']):
                current_blocks.append(block_info)
        
        # 깊이 순으로 정렬 (가장 바깥쪽부터)
        return sorted(current_blocks, key=lambda x: x['depth'])


class FrameTracer(bdb.Bdb):
    """프레임별 실행 추적기"""
    
    def __init__(self, code: str = ""):
        super().__init__()
        self.traces = []
        self.code = code
        self.code_lines = code.split('\n') if code else []
        self.current_line = 0
        self.previous_line = 0
        self.all_globals_in_order = []
        self.frame_stack = []
        self.output_buffer = []  # print 출력 버퍼 추가
        # 블록 구조 분석기 추가
        self.block_analyzer = BlockStructureAnalyzer(code) if code else None
        
    def user_line(self, frame):
        """라인별 실행 시 호출"""
        current_line = frame.f_lineno
        
        # 사용자 코드가 아닌 경우 무시
        if not self._is_user_code(frame):
            return
        
        # else/elif 라인 감지 및 삽입
        # Python 디버거는 else/elif 라인 자체를 추적하지 않으므로 수동으로 추가
        if self.previous_line > 0 and current_line > self.previous_line:
            # 이전 라인과 현재 라인 사이의 모든 라인 확인
            for line_num in range(self.previous_line + 1, current_line):
                if line_num <= len(self.code_lines):
                    line_content = self.code_lines[line_num - 1].strip()
                    # else나 elif는 실행되지 않고 건너뛰므로 트레이스에 추가
                    if line_content.startswith('else:') or line_content == 'else:' or line_content.startswith('elif '):
                        # else/elif 라인의 트레이스 엔트리 추가
                        control_trace = self._create_trace_entry(frame, override_line=line_num)
                        self.traces.append(control_trace)
        
        self.previous_line = current_line
        self.current_line = current_line
            
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
        
    def _create_trace_entry(self, frame, event_type='line', return_value=None, override_line=None):
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
        
        # 현재 라인의 블록 구조 정보 추가
        current_blocks = []
        line_number = override_line if override_line else frame.f_lineno
        if self.block_analyzer:
            current_blocks = self.block_analyzer.get_current_blocks(line_number)
            
        return {
            'line': line_number,
            'event': event_type,
            'func_name': func_name,
            'encoded_locals': encoded_locals,
            'ordered_varnames': ordered_varnames,
            'globals': encoded_globals,
            'ordered_globals': [k for k in self.all_globals_in_order if k in encoded_globals],
            'stack_to_render': self._get_stack_frames(),
            'current_blocks': current_blocks,  # 블록 구조 정보 추가
            'output': '\n'.join(self.output_buffer)  # 현재까지의 출력 추가
        }
        
    def _get_stack_frames(self):
        """현재 스택 프레임들 정보 수집 (개선된 버전)"""
        stack_frames = []
        current_frame = sys._getframe()
        
        # 사용자 코드 스택 프레임들만 수집
        while current_frame:
            if self._is_user_code(current_frame):
                encoded_locals = {}
                for k, v in get_user_locals(current_frame).items():
                    if not should_hide_var(k):
                        encoded_locals[k] = encode_value(v)
                        
                func_name = current_frame.f_code.co_name
                if func_name == '<module>':
                    func_name = 'Global frame'
                elif func_name == '<lambda>':
                    func_name = f'lambda on line {current_frame.f_code.co_firstlineno}'
                elif func_name == '':
                    func_name = 'unnamed function'
                    
                # 변수명 순서 정리
                ordered_varnames = []
                if current_frame.f_code.co_varnames:
                    for varname in current_frame.f_code.co_varnames:
                        if varname in encoded_locals:
                            ordered_varnames.append(varname)
                            
                # co_varnames에 없는 변수들 추가
                for varname in sorted(encoded_locals.keys()):
                    if varname not in ordered_varnames and varname != '__return__':
                        ordered_varnames.append(varname)
                        
                # __return__은 마지막에 추가
                if '__return__' in encoded_locals:
                    ordered_varnames.append('__return__')
                    
                stack_frames.append({
                    'func_name': func_name,
                    'encoded_locals': encoded_locals,
                    'ordered_varnames': ordered_varnames,
                    'is_highlighted': len(stack_frames) == 0,  # 첫 번째(현재) 프레임 하이라이트
                    'frame_id': id(current_frame),
                    'is_parent': len(stack_frames) > 0,
                    'is_zombie': False,
                    'line_number': current_frame.f_lineno
                })
            
            current_frame = current_frame.f_back
            
        # 스택을 올바른 순서로 뒤집기 (가장 깊은 것부터)
        return list(reversed(stack_frames))


def trace_execution(code: str, input_data: str = "") -> List[Dict]:
    """코드 실행을 추적하여 프레임별 변수 상태 반환"""
    tracer = FrameTracer(code)  # 코드를 전달하여 블록 분석 활성화
    
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
    
    # print 함수를 output_buffer에 저장
    def mock_print(*args, **kwargs):
        sep = kwargs.get('sep', ' ')
        output = sep.join(str(arg) for arg in args)
        tracer.output_buffer.append(output)
    
    # 실행 환경 설정
    globals_dict = {
        '__builtins__': __builtins__,
        'input': mock_input,
        'print': mock_print  # print 출력을 버퍼에 저장
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