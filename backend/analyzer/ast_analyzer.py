import ast
import json
from typing import Dict, List, Any

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
    
    def analyze_code(self, code: str) -> Dict[str, Any]:
        tree = ast.parse(code)
        self.visit(tree)
        return self.features