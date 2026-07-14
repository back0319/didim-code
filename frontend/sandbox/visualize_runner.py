import ast
import bdb
import json
import operator


MAX_STEPS = 1000
IGNORED_NAMES = {
    "__annotations__",
    "__builtins__",
    "__cached__",
    "__doc__",
    "__file__",
    "__loader__",
    "__name__",
    "__package__",
    "__spec__",
    "input",
    "print",
}


def encode_value(value, depth=0):
    if depth > 3:
        return f"<{type(value).__name__}>"
    if value is None or isinstance(value, (bool, int, float, str)):
        if isinstance(value, str) and len(value) > 300:
            return value[:297] + "..."
        return value
    if isinstance(value, (list, tuple)):
        return [encode_value(item, depth + 1) for item in value[:20]]
    if isinstance(value, dict):
        return {
            str(key): encode_value(item, depth + 1)
            for key, item in list(value.items())[:20]
        }
    if isinstance(value, set):
        return [encode_value(item, depth + 1) for item in list(value)[:20]]
    if callable(value):
        return f"<function {getattr(value, '__name__', type(value).__name__)}>"
    try:
        rendered = str(value)
        return rendered if len(rendered) <= 300 else rendered[:297] + "..."
    except Exception:
        return f"<{type(value).__name__}>"


def visible_variables(values):
    return {
        name: encode_value(value)
        for name, value in values.items()
        if name not in IGNORED_NAMES and not (name.startswith("__") and name != "__return__")
    }


def visible_global_variables(values):
    return {
        name: encode_value(value)
        for name, value in values.items()
        if name not in IGNORED_NAMES
        and not name.startswith("__")
        and not callable(value)
    }


class BlockAnalyzer:
    def __init__(self, code):
        self.code_lines = code.split("\n")
        self.blocks = []
        try:
            self._visit(ast.parse(code), 0)
        except SyntaxError:
            pass

    @staticmethod
    def _expression(node):
        try:
            return ast.unparse(node)
        except Exception:
            return ""

    def _visit(self, node, depth):
        block = None
        if isinstance(node, ast.For):
            block = {
                "type": "for_loop",
                "label": "for",
                "name": "반복문",
                "expression": f"{self._expression(node.target)} in {self._expression(node.iter)}",
            }
        elif isinstance(node, ast.While):
            block = {
                "type": "while_loop",
                "label": "while",
                "name": "반복문",
                "expression": self._expression(node.test),
            }
        elif isinstance(node, ast.If):
            source = self.code_lines[node.lineno - 1].lstrip() if node.lineno <= len(self.code_lines) else ""
            label = "elif" if source.startswith("elif ") else "if"
            block = {
                "type": "if_block",
                "label": label,
                "name": "조건문",
                "expression": self._expression(node.test),
            }
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            block = {
                "type": "function",
                "label": "def",
                "name": getattr(node, "name", "function"),
                "expression": getattr(node, "name", "function"),
            }
        elif isinstance(node, ast.With):
            block = {"type": "with_block", "label": "with", "name": "with", "expression": ""}
        elif isinstance(node, ast.Try):
            block = {"type": "try_block", "label": "try", "name": "try", "expression": ""}

        if block is not None:
            block.update({
                "start_line": node.lineno,
                "end_line": getattr(node, "end_lineno", node.lineno),
                "depth": depth,
                "parent_blocks": [],
            })
            self.blocks.append(block)
            depth += 1
        for child in ast.iter_child_nodes(node):
            self._visit(child, depth)

    def current(self, line_number):
        matches = [
            dict(block)
            for block in self.blocks
            if block["start_line"] <= line_number <= block["end_line"]
        ]
        matches.sort(key=lambda block: (block["depth"], block["start_line"]))
        for index, block in enumerate(matches):
            block["parent_blocks"] = matches[:index]
        return matches

    def starting_at(self, line_number):
        matches = [block for block in self.blocks if block["start_line"] == line_number]
        return max(matches, key=lambda block: block["depth"], default=None)


SAFE_BINARY_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
}
SAFE_COMPARE_OPERATORS = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
    ast.In: lambda left, right: left in right,
    ast.NotIn: lambda left, right: left not in right,
    ast.Is: operator.is_,
    ast.IsNot: operator.is_not,
}


def is_safe_evaluation_value(value, depth=0):
    if depth > 3:
        return False
    if type(value) in (type(None), bool, int, float, str):
        return True
    if type(value) in (list, tuple, set):
        return all(is_safe_evaluation_value(item, depth + 1) for item in value)
    if type(value) is dict:
        return all(
            is_safe_evaluation_value(key, depth + 1)
            and is_safe_evaluation_value(item, depth + 1)
            for key, item in value.items()
        )
    return False


def safe_expression_value(node, values):
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Name):
        if node.id not in values:
            raise ValueError(node.id)
        value = values[node.id]
        if not is_safe_evaluation_value(value):
            raise ValueError("unsupported value")
        return value
    if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        items = [safe_expression_value(item, values) for item in node.elts]
        if isinstance(node, ast.Tuple):
            return tuple(items)
        if isinstance(node, ast.Set):
            return set(items)
        return items
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
        return not safe_expression_value(node.operand, values)
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        return -safe_expression_value(node.operand, values)
    if isinstance(node, ast.BinOp) and type(node.op) in SAFE_BINARY_OPERATORS:
        return SAFE_BINARY_OPERATORS[type(node.op)](
            safe_expression_value(node.left, values),
            safe_expression_value(node.right, values),
        )
    if isinstance(node, ast.BoolOp):
        items = [bool(safe_expression_value(value, values)) for value in node.values]
        return all(items) if isinstance(node.op, ast.And) else any(items)
    if isinstance(node, ast.Compare):
        left = safe_expression_value(node.left, values)
        for operation, comparator in zip(node.ops, node.comparators):
            right = safe_expression_value(comparator, values)
            compare = SAFE_COMPARE_OPERATORS.get(type(operation))
            if compare is None or not compare(left, right):
                return False
            left = right
        return True
    if isinstance(node, ast.Subscript):
        container = safe_expression_value(node.value, values)
        if type(container) not in (list, tuple, dict, str):
            raise ValueError("unsupported subscript")
        return container[safe_expression_value(node.slice, values)]
    if (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == "len"
        and len(node.args) == 1
    ):
        return len(safe_expression_value(node.args[0], values))
    raise ValueError("unsupported expression")


def evaluate_condition(expression, values):
    if not expression:
        return None
    try:
        parsed = ast.parse(expression, mode="eval")
        return bool(safe_expression_value(parsed.body, values))
    except Exception:
        return None


class TraceLimitExceeded(Exception):
    pass


class FrameTracer(bdb.Bdb):
    def __init__(self, code):
        super().__init__()
        self.code = code
        self.code_lines = code.split("\n")
        self.blocks = BlockAnalyzer(code)
        self.output = []
        self.steps = []
        self.call_tree = []
        self.frame_call_ids = {}
        self.next_call_id = 1
        self.loop_counts = {}

    @staticmethod
    def _is_user_frame(frame):
        return frame.f_code.co_filename.endswith("user_code.py")

    @staticmethod
    def _frame_arguments(frame):
        code = frame.f_code
        argument_count = code.co_argcount + code.co_kwonlyargcount
        argument_names = list(code.co_varnames[:argument_count])
        next_index = argument_count

        if code.co_flags & 0x04:
            argument_names.append(code.co_varnames[next_index])
            next_index += 1
        if code.co_flags & 0x08:
            argument_names.append(code.co_varnames[next_index])

        return {
            name: encode_value(frame.f_locals[name])
            for name in argument_names
            if name in frame.f_locals
        }

    def _parent_call_id(self, frame):
        current = frame.f_back
        while current:
            call_id = self.frame_call_ids.get(id(current))
            if call_id is not None:
                return call_id
            current = current.f_back
        return None

    def _append(self, frame, event, return_value=None):
        if len(self.steps) >= MAX_STEPS:
            raise TraceLimitExceeded(f"시각화 단계가 {MAX_STEPS}개를 초과했습니다.")

        line_number = frame.f_lineno
        local_values = visible_variables(frame.f_locals)
        if event == "return" and return_value is not None:
            local_values["__return__"] = encode_value(return_value)
        global_values = visible_global_variables(frame.f_globals)
        variables = {**global_values, **local_values}

        function_name = frame.f_code.co_name
        if function_name == "<module>":
            function_name = "Global frame"

        operation = event
        description = f"라인 {line_number} 실행"
        source = self.code_lines[line_number - 1].strip() if 0 < line_number <= len(self.code_lines) else ""
        if event == "call":
            operation = "function_call"
            description = f"함수 '{function_name}' 호출"
        elif event == "return":
            operation = "function_return"
            description = f"함수 '{function_name}'에서 반환"
        elif source.startswith(("for ", "while ")):
            operation = "loop"
            description = "반복문 실행"
        elif source.startswith(("if ", "elif ", "else:")):
            operation = "condition"
            description = "조건문 실행"
        elif source.startswith("def "):
            operation = "function_def"
            description = f"함수 '{source.split('(')[0].replace('def ', '').strip()}' 정의"
        elif source.startswith("return"):
            operation = "return"
            description = "값 반환"
        elif source.startswith("print("):
            operation = "output"
            description = "출력 실행"
        elif "=" in source and not any(token in source for token in ("==", "!=", "<=", ">=")):
            operation = "assignment"
            description = "변수에 값 할당"

        call_id = self.frame_call_ids.get(id(frame))
        control_block = self.blocks.starting_at(line_number) if event == "line" else None
        condition_result = None
        loop_iteration = None
        if control_block and control_block["type"] in ("if_block", "while_loop"):
            condition_result = evaluate_condition(
                control_block.get("expression", ""),
                {**frame.f_globals, **frame.f_locals},
            )
        if control_block and control_block["type"] == "while_loop":
            loop_key = (call_id, line_number)
            if condition_result is True:
                self.loop_counts[loop_key] = self.loop_counts.get(loop_key, 0) + 1
            loop_iteration = self.loop_counts.get(loop_key, 0)

        self.steps.append({
            "line": line_number,
            "operation": operation,
            "variables": variables,
            "output": "".join(self.output).rstrip("\n"),
            "description": description,
            "func_name": function_name,
            "call_id": call_id,
            "stack_frames": self._stack_frames(frame),
            "globals_vars": global_values,
            "current_blocks": self.blocks.current(line_number),
            "condition_result": condition_result,
            "loop_iteration": loop_iteration,
            "loop_finished": control_block is not None
            and control_block["type"] == "while_loop"
            and condition_result is False,
        })

    def finalize_steps(self):
        for_counts = {}
        for index, step in enumerate(self.steps):
            if step["operation"] != "loop":
                continue
            block = self.blocks.starting_at(step["line"])
            if not block or block["type"] != "for_loop":
                continue

            next_step = self.steps[index + 1] if index + 1 < len(self.steps) else None
            enters_body = bool(
                next_step
                and next_step.get("call_id") == step.get("call_id")
                and block["start_line"] < next_step["line"] <= block["end_line"]
            )
            loop_key = (step.get("call_id"), step["line"])
            if enters_body:
                for_counts[loop_key] = for_counts.get(loop_key, 0) + 1
            step["loop_iteration"] = for_counts.get(loop_key, 0)
            step["loop_finished"] = not enters_body

    def _stack_frames(self, frame):
        frames = []
        current = frame
        while current:
            if self._is_user_frame(current):
                locals_values = visible_variables(current.f_locals)
                name = current.f_code.co_name
                if name == "<module>":
                    name = "Global frame"
                ordered = [name for name in current.f_code.co_varnames if name in locals_values]
                ordered.extend(sorted(name for name in locals_values if name not in ordered))
                frames.append({
                    "func_name": name,
                    "call_id": self.frame_call_ids.get(id(current)),
                    "encoded_locals": locals_values,
                    "ordered_varnames": ordered,
                    "is_highlighted": len(frames) == 0,
                    "frame_id": id(current),
                    "is_parent": len(frames) > 0,
                    "is_zombie": False,
                    "line_number": current.f_lineno,
                })
            current = current.f_back
        return list(reversed(frames))

    def user_line(self, frame):
        if self._is_user_frame(frame):
            self._append(frame, "line")

    def user_call(self, frame, argument_list):
        if self._is_user_frame(frame):
            if frame.f_code.co_name == "<module>":
                self._append(frame, "call")
                return
            call_id = self.next_call_id
            self.next_call_id += 1
            self.frame_call_ids[id(frame)] = call_id
            self.call_tree.append({
                "id": call_id,
                "parent_id": self._parent_call_id(frame),
                "func_name": frame.f_code.co_name,
                "arguments": self._frame_arguments(frame),
                "call_step": len(self.steps),
                "return_step": None,
                "return_value": None,
            })
            self._append(frame, "call")

    def user_return(self, frame, return_value):
        if self._is_user_frame(frame):
            call_id = self.frame_call_ids.get(id(frame))
            if call_id is not None:
                for call in reversed(self.call_tree):
                    if call["id"] == call_id:
                        call["return_step"] = len(self.steps)
                        call["return_value"] = encode_value(return_value)
                        break
            self._append(frame, "return", return_value)
            self.frame_call_ids.pop(id(frame), None)


def analyze_complexity(code):
    try:
        tree = ast.parse(code)
        loops = sum(isinstance(node, (ast.For, ast.While)) for node in ast.walk(tree))
        functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
        recursive = any(
            isinstance(child, ast.Call)
            and isinstance(child.func, ast.Name)
            and child.func.id == function.name
            for function in functions
            for child in ast.walk(function)
        )
        sorting = any(
            isinstance(node, ast.Call)
            and (
                isinstance(node.func, ast.Name) and node.func.id == "sorted"
                or isinstance(node.func, ast.Attribute) and node.func.attr == "sort"
            )
            for node in ast.walk(tree)
        )
        allocates = any(isinstance(node, (ast.List, ast.ListComp, ast.Dict, ast.DictComp, ast.Set, ast.SetComp)) for node in ast.walk(tree))

        if recursive:
            time_complexity = "O(2^n)" if "fibonacci" in code.lower() else "O(n)"
            explanation = "재귀 호출이 포함되어 있습니다."
        elif sorting:
            time_complexity = "O(n log n)"
            explanation = "정렬 연산이 포함되어 있습니다."
        elif loops >= 2:
            time_complexity = "O(n²)"
            explanation = "여러 반복문이 포함되어 있습니다."
        elif loops == 1:
            time_complexity = "O(n)"
            explanation = "반복문이 포함되어 있습니다."
        else:
            time_complexity = "O(1)"
            explanation = "단순 연산 위주로 구성되어 있습니다."
        return {
            "time_complexity": time_complexity,
            "space_complexity": "O(n)" if recursive or allocates else "O(1)",
            "explanation": explanation,
        }
    except SyntaxError:
        return {
            "time_complexity": "분석 불가",
            "space_complexity": "분석 불가",
            "explanation": "코드 구문을 분석할 수 없습니다.",
        }


def main():
    with open("request.json", "r", encoding="utf-8") as request_file:
        request = json.load(request_file)
    code = request["code"]
    input_lines = iter(str(request.get("input_data", "")).splitlines())
    tracer = FrameTracer(code)

    def mock_input(prompt=""):
        try:
            return next(input_lines)
        except StopIteration:
            return ""

    def mock_print(*args, **kwargs):
        separator = kwargs.get("sep", " ")
        ending = kwargs.get("end", "\n")
        rendered = separator.join(str(arg) for arg in args) + ending
        tracer.output.append(rendered)

    environment = {
        "__builtins__": __builtins__,
        "__name__": "__main__",
        "input": mock_input,
        "print": mock_print,
    }
    runtime_error = None
    try:
        compiled = compile(code, "user_code.py", "exec")
        tracer.runctx(compiled, environment, environment)
    except (SyntaxError, TraceLimitExceeded) as error:
        runtime_error = str(error)
    except BaseException as error:
        runtime_error = f"{type(error).__name__}: {error}"

    if runtime_error:
        error_line = tracer.steps[-1]["line"] if tracer.steps else 1
        tracer.steps.append({
            "line": min(max(error_line, 1), max(len(tracer.code_lines), 1)),
            "operation": "error",
            "variables": {},
            "output": "".join(tracer.output).rstrip("\n"),
            "description": f"실행 중 오류 발생: {runtime_error}",
            "func_name": "Error",
            "stack_frames": [],
            "globals_vars": {},
            "current_blocks": [],
        })
    if not tracer.steps:
        tracer.steps.append({
            "line": 1,
            "operation": "execution",
            "variables": {},
            "output": "",
            "description": "코드 실행 시작",
            "func_name": "Global frame",
            "stack_frames": [],
            "globals_vars": {},
            "current_blocks": [],
        })

    tracer.finalize_steps()

    print(json.dumps({
        "steps": tracer.steps,
        "code_lines": tracer.code_lines,
        "call_tree": tracer.call_tree,
        "complexity_info": analyze_complexity(code),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
