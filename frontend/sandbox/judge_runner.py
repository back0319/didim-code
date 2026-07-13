import json
import subprocess
import sys
import time


TIME_LIMIT_SECONDS = 3


def normalize_output(value):
    return value.strip()


def result(case_id, verdict, elapsed, message, actual_output=""):
    return {
        "case_id": case_id,
        "verdict": verdict,
        "execution_time": round(elapsed * 1000, 2),
        "memory_usage": 0,
        "message": message,
        "actual_output": actual_output[:4000],
    }


def main():
    with open("tests.json", "r", encoding="utf-8") as tests_file:
        tests = json.load(tests_file)

    try:
        source = open("solution.py", "r", encoding="utf-8").read()
        compile(source, "solution.py", "exec")
    except SyntaxError as error:
        message = f"{error.__class__.__name__}: {error.msg} (line {error.lineno})"
        print(json.dumps({
            "verdict": "CE",
            "execution_time": 0,
            "memory_usage": 0,
            "test_results": [],
            "error": message,
        }, ensure_ascii=False))
        return

    test_results = []
    started = time.perf_counter()
    for test in tests:
        case_started = time.perf_counter()
        try:
            process = subprocess.run(
                [sys.executable, "solution.py"],
                input=str(test["input"]),
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=TIME_LIMIT_SECONDS,
            )
            elapsed = time.perf_counter() - case_started
        except subprocess.TimeoutExpired:
            elapsed = time.perf_counter() - case_started
            test_results.append(result(test["case_id"], "TLE", elapsed, "시간 제한을 초과했습니다."))
            break

        if process.returncode != 0:
            error = (process.stderr or f"프로세스가 종료 코드 {process.returncode}로 끝났습니다.").strip()
            test_results.append(result(test["case_id"], "RE", elapsed, error[:1000], process.stdout))
            break

        if normalize_output(process.stdout) != normalize_output(str(test["expected_output"])):
            test_results.append(result(test["case_id"], "WA", elapsed, "출력이 기대값과 일치하지 않습니다.", process.stdout))
            break

        test_results.append(result(test["case_id"], "AC", elapsed, "통과", process.stdout))

    verdict = next((item["verdict"] for item in test_results if item["verdict"] != "AC"), "AC")
    error = next((item["message"] for item in test_results if item["verdict"] in {"CE", "RE", "TLE"}), "")
    print(json.dumps({
        "verdict": verdict,
        "execution_time": round((time.perf_counter() - started) * 1000, 2),
        "memory_usage": 0,
        "test_results": test_results,
        "error": error,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
