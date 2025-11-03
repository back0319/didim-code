import ast
import json
from typing import Dict, List, Any, Set, Optional

class VariableScope:
    """변수 스코프 정보"""
    def __init__(self, name: str, scope_type: str):
        self.name = name
        self.scope_type = scope_type  # 'global', 'local', 'parameter', 'closure'
        self.defined_at = None
        self.used_at = []
        self.assignments = []

class ScopeAnalyzer(ast.NodeVisitor):
    """변수 스코프 분석기"""
    
    def __init__(self):
        self.scopes = []  # 스코프 스택
        self.variables = {}  # 변수명 -> VariableScope 매핑
        self.current_function = None
        self.function_definitions = {}
        
    def enter_scope(self, scope_name: str, scope_type: str = 'function'):
        """새 스코프 진입"""
        scope = {
            'name': scope_name,
            'type': scope_type,
            'variables': set(),
            'parent': self.scopes[-1] if self.scopes else None
        }
        self.scopes.append(scope)
        
    def exit_scope(self):
        """현재 스코프 종료"""
        if self.scopes:
            self.scopes.pop()
            
    def get_current_scope(self):
        """현재 스코프 반환"""
        return self.scopes[-1] if self.scopes else None
        
    def add_variable(self, var_name: str, scope_type: str, line_no: int):
        """변수 추가"""
        if var_name not in self.variables:
            self.variables[var_name] = VariableScope(var_name, scope_type)
            self.variables[var_name].defined_at = line_no
            
        current_scope = self.get_current_scope()
        if current_scope:
            current_scope['variables'].add(var_name)
            
    def use_variable(self, var_name: str, line_no: int):
        """변수 사용 기록"""
        if var_name in self.variables:
            self.variables[var_name].used_at.append(line_no)
            
    def assign_variable(self, var_name: str, line_no: int):
        """변수 할당 기록"""
        if var_name not in self.variables:
            scope_type = 'global' if len(self.scopes) <= 1 else 'local'
            self.add_variable(var_name, scope_type, line_no)
        self.variables[var_name].assignments.append(line_no)
        
    def visit_FunctionDef(self, node):
        """함수 정의 방문"""
        # 함수 자체를 변수로 등록
        self.add_variable(node.name, 'function', node.lineno)
        
        # 함수 정보 저장
        self.function_definitions[node.name] = {
            'args': [arg.arg for arg in node.args.args],
            'line': node.lineno,
            'is_recursive': False
        }
        
        old_function = self.current_function
        self.current_function = node.name
        
        # 새 스코프 진입
        self.enter_scope(node.name, 'function')
        
        # 매개변수 추가
        for arg in node.args.args:
            self.add_variable(arg.arg, 'parameter', node.lineno)
            
        # 함수 본문 방문
        self.generic_visit(node)
        
        self.exit_scope()
        self.current_function = old_function
        
    def visit_Assign(self, node):
        """할당문 방문"""
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.assign_variable(target.id, node.lineno)
        self.generic_visit(node)
        
    def visit_AugAssign(self, node):
        """복합 할당문 방문"""
        if isinstance(node.target, ast.Name):
            self.assign_variable(node.target.id, node.lineno)
        self.generic_visit(node)
        
    def visit_Name(self, node):
        """변수명 방문"""
        if isinstance(node.ctx, ast.Load):
            self.use_variable(node.id, node.lineno)
        self.generic_visit(node)
        
    def visit_For(self, node):
        """for 루프 방문"""
        # 루프 변수 처리
        if isinstance(node.target, ast.Name):
            self.assign_variable(node.target.id, node.lineno)
        elif isinstance(node.target, ast.Tuple):
            for elt in node.target.elts:
                if isinstance(elt, ast.Name):
                    self.assign_variable(elt.id, node.lineno)
        self.generic_visit(node)
        
    def visit_Call(self, node):
        """함수 호출 방문"""
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            self.use_variable(func_name, node.lineno)
            
            # 재귀 함수 체크
            if func_name == self.current_function:
                if func_name in self.function_definitions:
                    self.function_definitions[func_name]['is_recursive'] = True
                    
        self.generic_visit(node)
        
    def analyze(self, code: str) -> Dict[str, Any]:
        """코드 분석 실행"""
        try:
            tree = ast.parse(code)
            
            # 전역 스코프 진입
            self.enter_scope('global', 'global')
            
            # AST 방문
            self.visit(tree)
            
            self.exit_scope()
            
            return {
                'variables': {name: {
                    'scope_type': var.scope_type,
                    'defined_at': var.defined_at,
                    'used_at': var.used_at,
                    'assignments': var.assignments
                } for name, var in self.variables.items()},
                'functions': self.function_definitions,
                'scopes': len(self.scopes)
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'variables': {},
                'functions': {},
                'scopes': 0
            }

class CodeAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.features = {
            'loop_nesting': 0,
            'recursion_count': 0,
            'data_structures': [],
            'sorting_calls': 0,
            'hash_usage': 0,
            'list_operations': [],
            'complexity_indicators': []
        }
        self.scope_analyzer = ScopeAnalyzer()
    
    def analyze_code(self, code: str) -> Dict[str, Any]:
        tree = ast.parse(code)
        self.visit(tree)
        
        # 스코프 분석 결과 추가
        scope_analysis = self.scope_analyzer.analyze(code)
        self.features['scope_analysis'] = scope_analysis
        
        return self.features