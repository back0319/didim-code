-- 이 파일은 supabase/seed-data/problems.json에서 생성됩니다.
-- npm run data:seed-sql --prefix frontend 명령으로 다시 만들 수 있습니다.

delete from public.problem_feedback_configs;
delete from public.problem_solutions;
delete from public.problem_test_cases;
delete from public.problems;

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (1, 'add-two-numbers', 1, '두 수 더하기', '두 정수 A와 B를 입력받아 두 수의 합을 출력하세요.', 'Easy', '입출력', '한 줄에 두 정수 A와 B가 공백으로 구분되어 주어집니다.', 'A와 B의 합을 출력합니다.', array['-100,000 ≤ A, B ≤ 100,000']::text[], 'a, b = map(int, input().split())

# 두 수의 합을 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (1, 1, '3 5', '8', '두 입력값을 정수로 바꾼 뒤 더한 값을 출력합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (1, 2, '-2 7', '5', '두 입력값을 정수로 바꾼 뒤 더한 값을 출력합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (1, 3, '0 0', '0', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (1, 4, '-100 100', '0', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (1, 5, '1 2', '3', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (1, 6, '999 1', '1000', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (1, 7, '-8 -4', '-12', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (1, 8, '100000 -99999', '1', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (1, 'python', 'a, b = map(int, input().split())
print(a + b)
', '두 입력값을 정수로 바꾼 뒤 더한 값을 출력합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (1, '입력한 두 값을 정수로 읽었는지, 덧셈 결과를 출력했는지 확인한다. 문자열을 그대로 이어 붙인 실수를 우선 살핀다.', '["입력값을 정수로 변환하지 않음","두 수가 아닌 다른 값을 출력함","음수 입력을 따로 잘못 처리함"]'::jsonb, '{"AC":"두 입력값이 어떤 순서로 더해져 출력되는지 설명해보세요.","WA":"입력값을 문자열이 아닌 정수로 바꾼 뒤 두 값을 더하고 있는지 확인해보세요.","CE":"입력과 출력 줄의 괄호와 철자를 확인해보세요.","RE":"한 줄의 두 값을 모두 읽고 있는지 확인해보세요.","TLE":"이 문제는 입력 두 값을 한 번 더해 바로 출력할 수 있습니다."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (2, 'even-or-odd', 2, '짝수와 홀수', '정수 N이 짝수인지 홀수인지 판별하세요.', 'Easy', '조건문', '정수 N이 한 줄에 주어집니다.', '짝수이면 `짝수`, 홀수이면 `홀수`를 출력합니다.', array['-100,000 ≤ N ≤ 100,000']::text[], 'n = int(input())

# 짝수 또는 홀수를 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (2, 1, '4', '짝수', '2로 나눈 나머지가 0인지에 따라 두 경우를 나눕니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (2, 2, '7', '홀수', '2로 나눈 나머지가 0인지에 따라 두 경우를 나눕니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (2, 3, '0', '짝수', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (2, 4, '-2', '짝수', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (2, 5, '-3', '홀수', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (2, 6, '100000', '짝수', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (2, 7, '-99999', '홀수', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (2, 8, '2', '짝수', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (2, 'python', 'n = int(input())

if n % 2 == 0:
    print("짝수")
else:
    print("홀수")
', '2로 나눈 나머지가 0인지에 따라 두 경우를 나눕니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (2, '2로 나눈 나머지를 올바르게 비교하는지와 요구된 한글 출력이 정확한지 확인한다.', '["나머지가 1인 경우만 홀수로 판단해 음수를 놓침","짝수와 홀수 출력을 반대로 작성함","출력 문자열이 요구 형식과 다름"]'::jsonb, '{"AC":"조건식이 짝수와 홀수를 어떻게 나누는지 설명해보세요.","WA":"N을 2로 나눈 나머지가 0인 경우가 어느 쪽인지 다시 확인해보세요.","CE":"if와 else 뒤의 콜론과 들여쓰기를 확인해보세요.","RE":"입력값을 정수로 바꾸는 부분을 확인해보세요.","TLE":"반복 없이 한 번의 나머지 비교로 판별할 수 있습니다."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (3, 'maximum-of-three', 3, '세 수 중 최댓값', '세 정수 A, B, C 중 가장 큰 값을 출력하세요. 같은 최댓값이 여러 번 나타나도 값 하나만 출력합니다.', 'Easy', '조건문', '한 줄에 세 정수 A, B, C가 공백으로 구분되어 주어집니다.', '세 수 중 최댓값을 출력합니다.', array['-100,000 ≤ A, B, C ≤ 100,000']::text[], 'a, b, c = map(int, input().split())

# 세 수 중 최댓값을 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (3, 1, '3 9 5', '9', '첫 번째 값을 기준으로 두 번째와 세 번째 값을 차례로 비교합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (3, 2, '-4 -2 -7', '-2', '첫 번째 값을 기준으로 두 번째와 세 번째 값을 차례로 비교합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (3, 3, '5 5 3', '5', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (3, 4, '0 0 0', '0', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (3, 5, '10 2 1', '10', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (3, 6, '1 12 3', '12', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (3, 7, '1 2 13', '13', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (3, 8, '-1 -9 -3', '-1', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (3, 'python', 'a, b, c = map(int, input().split())
maximum = a

if b > maximum:
    maximum = b
if c > maximum:
    maximum = c

print(maximum)
', '첫 번째 값을 기준으로 두 번째와 세 번째 값을 차례로 비교합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (3, '최댓값의 초기값을 실제 입력 중 하나로 두었는지, 각 값을 빠짐없이 비교했는지 확인한다.', '["최댓값을 0으로 시작해 모두 음수인 입력을 놓침","elif 때문에 필요한 비교를 건너뜀","세 값 중 하나를 비교하지 않음"]'::jsonb, '{"AC":"현재 최댓값이 각 비교 뒤 어떻게 바뀌는지 설명해보세요.","WA":"최댓값을 0이 아니라 입력된 세 수 중 하나로 시작했는지 확인해보세요.","CE":"조건문 콜론과 들여쓰기를 확인해보세요.","RE":"한 줄에서 세 정수를 모두 읽는지 확인해보세요.","TLE":"세 값을 각각 한 번씩만 비교해도 충분합니다."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (4, 'sum-one-to-n', 4, '1부터 N까지의 합', '1부터 N까지의 모든 정수를 차례로 더한 값을 출력하세요.', 'Easy', '반복문', '양의 정수 N이 한 줄에 주어집니다.', '1부터 N까지의 합을 출력합니다.', array['1 ≤ N ≤ 10,000']::text[], 'n = int(input())

# 1부터 n까지 더한 값을 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (4, 1, '5', '15', '0에서 시작한 누적값에 1부터 N까지를 차례로 더합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (4, 2, '1', '1', '0에서 시작한 누적값에 1부터 N까지를 차례로 더합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (4, 3, '2', '3', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (4, 4, '3', '6', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (4, 5, '10', '55', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (4, 6, '50', '1275', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (4, 7, '100', '5050', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (4, 8, '999', '499500', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (4, 'python', 'n = int(input())
total = 0

for number in range(1, n + 1):
    total = total + number

print(total)
', '0에서 시작한 누적값에 1부터 N까지를 차례로 더합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (4, '누적값이 반복 전에 초기화되는지, range의 끝에 N이 포함되는지 확인한다.', '["range에서 N을 제외함","누적값을 반복문 안에서 다시 0으로 만듦","마지막 반복값만 출력함"]'::jsonb, '{"AC":"반복할 때마다 누적값이 어떻게 바뀌는지 설명해보세요.","WA":"반복 범위에 N도 포함되어 있는지와 누적값이 반복 전에 0으로 시작하는지 확인해보세요.","CE":"for 줄의 콜론과 반복문 들여쓰기를 확인해보세요.","RE":"N을 정수로 읽었는지 확인해보세요.","TLE":"반복 안에서 같은 구간을 다시 더하고 있지 않은지 확인해보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (5, 'multiplication-table', 5, '구구단 출력', '정수 N을 입력받아 N단을 1부터 9까지 차례로 출력하세요.', 'Easy', '반복문', '1 이상 9 이하의 정수 N이 한 줄에 주어집니다.', '각 줄에 `N x i = 결과` 형식으로 i가 1부터 9까지인 식을 출력합니다.', array['1 ≤ N ≤ 9']::text[], 'n = int(input())

# n단을 1부터 9까지 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (5, 1, '3', '3 x 1 = 3
3 x 2 = 6
3 x 3 = 9
3 x 4 = 12
3 x 5 = 15
3 x 6 = 18
3 x 7 = 21
3 x 8 = 24
3 x 9 = 27', '1부터 9까지 반복하며 N과 현재 수의 곱을 정해진 형식으로 출력합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (5, 2, '1', '1 x 1 = 1
1 x 2 = 2
1 x 3 = 3
1 x 4 = 4
1 x 5 = 5
1 x 6 = 6
1 x 7 = 7
1 x 8 = 8
1 x 9 = 9', '1부터 9까지 반복하며 N과 현재 수의 곱을 정해진 형식으로 출력합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (5, 3, '2', '2 x 1 = 2
2 x 2 = 4
2 x 3 = 6
2 x 4 = 8
2 x 5 = 10
2 x 6 = 12
2 x 7 = 14
2 x 8 = 16
2 x 9 = 18', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (5, 4, '4', '4 x 1 = 4
4 x 2 = 8
4 x 3 = 12
4 x 4 = 16
4 x 5 = 20
4 x 6 = 24
4 x 7 = 28
4 x 8 = 32
4 x 9 = 36', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (5, 5, '5', '5 x 1 = 5
5 x 2 = 10
5 x 3 = 15
5 x 4 = 20
5 x 5 = 25
5 x 6 = 30
5 x 7 = 35
5 x 8 = 40
5 x 9 = 45', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (5, 6, '6', '6 x 1 = 6
6 x 2 = 12
6 x 3 = 18
6 x 4 = 24
6 x 5 = 30
6 x 6 = 36
6 x 7 = 42
6 x 8 = 48
6 x 9 = 54', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (5, 7, '8', '8 x 1 = 8
8 x 2 = 16
8 x 3 = 24
8 x 4 = 32
8 x 5 = 40
8 x 6 = 48
8 x 7 = 56
8 x 8 = 64
8 x 9 = 72', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (5, 8, '9', '9 x 1 = 9
9 x 2 = 18
9 x 3 = 27
9 x 4 = 36
9 x 5 = 45
9 x 6 = 54
9 x 7 = 63
9 x 8 = 72
9 x 9 = 81', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (5, 'python', 'n = int(input())

for i in range(1, 10):
    print(f"{n} x {i} = {n * i}")
', '1부터 9까지 반복하며 N과 현재 수의 곱을 정해진 형식으로 출력합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (5, '반복 범위가 1부터 9까지인지, 곱셈 결과와 공백을 포함한 출력 형식이 정확한지 확인한다.', '["0부터 시작하거나 9를 제외함","곱셈 대신 덧셈을 사용함","x와 = 주변 공백이 다름"]'::jsonb, '{"AC":"반복 변수 i가 각 출력 줄에서 어떤 역할을 하는지 설명해보세요.","WA":"1부터 9까지 모두 출력하는지와 `N x i = 결과`의 공백을 확인해보세요.","CE":"f-string의 따옴표와 중괄호를 확인해보세요.","RE":"N을 정수로 읽고 있는지 확인해보세요.","TLE":"1부터 9까지 아홉 번만 반복하면 됩니다."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (6, 'factorial', 6, '팩토리얼', '0 이상의 정수 N이 주어질 때 N!을 출력하세요. 0!은 1입니다.', 'Easy', '함수와 반복문', '정수 N이 한 줄에 주어집니다.', 'N!의 값을 출력합니다.', array['0 ≤ N ≤ 12']::text[], 'n = int(input())

# n!을 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (6, 1, '5', '120', '곱셈의 시작값인 1에 1부터 N까지를 차례로 곱합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (6, 2, '0', '1', '곱셈의 시작값인 1에 1부터 N까지를 차례로 곱합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (6, 3, '1', '1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (6, 4, '2', '2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (6, 5, '3', '6', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (6, 6, '6', '720', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (6, 7, '10', '3628800', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (6, 8, '12', '479001600', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (6, 'python', 'n = int(input())
result = 1

for number in range(1, n + 1):
    result = result * number

print(result)
', '곱셈의 시작값인 1에 1부터 N까지를 차례로 곱합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (6, '곱셈 누적값이 1로 시작하는지, N이 0일 때도 1이 출력되는지 확인한다.', '["누적값을 0으로 시작함","N을 곱하지 않음","0을 별도로 잘못 처리함"]'::jsonb, '{"AC":"곱셈 누적값을 왜 1에서 시작하는지 설명해보세요.","WA":"곱셈의 시작값과 N이 0일 때 반복이 실행되지 않는 경우를 확인해보세요.","CE":"반복문 콜론과 들여쓰기를 확인해보세요.","RE":"N을 정수로 읽는지 확인해보세요.","TLE":"1부터 N까지 각 수를 한 번씩만 곱해보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (7, 'digit-sum', 7, '자릿수 합', '0 이상의 정수 N을 이루는 각 자릿수의 합을 출력하세요.', 'Easy', '문자열과 반복문', '정수 N이 한 줄에 주어집니다.', 'N의 모든 자릿수를 더한 값을 출력합니다.', array['0 ≤ N ≤ 10^18']::text[], 'digits = input().strip()

# 각 자릿수의 합을 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (7, 1, '12345', '15', '입력을 문자열로 읽고 각 문자를 정수로 바꾸어 누적합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (7, 2, '0', '0', '입력을 문자열로 읽고 각 문자를 정수로 바꾸어 누적합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (7, 3, '7', '7', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (7, 4, '1000', '1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (7, 5, '99999', '45', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (7, 6, '10101', '3', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (7, 7, '987654321', '45', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (7, 8, '1000000000000000000', '1', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (7, 'python', 'digits = input().strip()
total = 0

for digit in digits:
    total = total + int(digit)

print(total)
', '입력을 문자열로 읽고 각 문자를 정수로 바꾸어 누적합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (7, '숫자 전체가 아니라 각 문자를 하나씩 순회하는지, 각 문자를 정수로 변환했는지 확인한다.', '["문자를 정수로 바꾸지 않고 더함","마지막 자릿수를 빠뜨림","0 입력에서 아무 값도 출력하지 않음"]'::jsonb, '{"AC":"문자열의 각 문자가 누적값에 어떻게 더해지는지 설명해보세요.","WA":"입력을 한 글자씩 순회하며 각 글자를 정수로 바꾸고 있는지 확인해보세요.","CE":"for 줄과 int 호출의 괄호를 확인해보세요.","RE":"반복 중인 값이 한 글자인지 확인해보세요.","TLE":"입력 문자열을 한 번만 순회하면 됩니다."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (8, 'prime-check', 8, '소수 판별', '정수 N이 1보다 크고 1과 자기 자신으로만 나누어지는 소수인지 판별하세요.', 'Easy', '조건문과 반복문', '정수 N이 한 줄에 주어집니다.', '소수이면 `소수`, 아니면 `소수가 아님`을 출력합니다.', array['1 ≤ N ≤ 10,000']::text[], 'n = int(input())

# n이 소수인지 판별하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (8, 1, '17', '소수', '1보다 큰 수에 대해 2부터 N-1까지 나누어지는 수가 있는지 확인합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (8, 2, '1', '소수가 아님', '1보다 큰 수에 대해 2부터 N-1까지 나누어지는 수가 있는지 확인합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (8, 3, '2', '소수', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (8, 4, '3', '소수', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (8, 5, '4', '소수가 아님', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (8, 6, '9', '소수가 아님', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (8, 7, '97', '소수', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (8, 8, '100', '소수가 아님', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (8, 'python', 'n = int(input())
is_prime = n > 1

for divisor in range(2, n):
    if n % divisor == 0:
        is_prime = False
        break

if is_prime:
    print("소수")
else:
    print("소수가 아님")
', '1보다 큰 수에 대해 2부터 N-1까지 나누어지는 수가 있는지 확인합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (8, 'N이 1인 경우를 먼저 제외하는지, 나누어떨어지는 수를 발견했을 때 판정을 바꾸는지 확인한다.', '["1을 소수로 판단함","자기 자신까지 검사해 모든 수를 합성수로 만듦","약수를 찾은 뒤에도 결과를 다시 바꿈"]'::jsonb, '{"AC":"약수를 발견했을 때 반복과 판정값이 어떻게 바뀌는지 설명해보세요.","WA":"1은 소수가 아니라는 점과 자기 자신은 검사 대상에서 제외되는지 확인해보세요.","CE":"중첩된 if와 반복문의 들여쓰기를 확인해보세요.","RE":"나머지 연산의 두 값이 정수인지 확인해보세요.","TLE":"나누어떨어지는 수를 찾았다면 더 검사하지 않고 반복을 끝낼 수 있습니다."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (9, 'greatest-common-divisor', 9, '최대공약수', '두 양의 정수 A와 B의 공약수 중 가장 큰 값을 출력하세요.', 'Easy', '수학과 반복문', '한 줄에 두 양의 정수 A와 B가 공백으로 구분되어 주어집니다.', 'A와 B의 최대공약수를 출력합니다.', array['1 ≤ A, B ≤ 100,000']::text[], 'a, b = map(int, input().split())

# 두 수의 최대공약수를 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (9, 1, '48 18', '6', '나머지가 0이 될 때까지 두 수를 작은 문제로 바꾸며 반복합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (9, 2, '7 13', '1', '나머지가 0이 될 때까지 두 수를 작은 문제로 바꾸며 반복합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (9, 3, '10 5', '5', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (9, 4, '5 10', '5', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (9, 5, '1 1', '1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (9, 6, '100 75', '25', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (9, 7, '270 192', '6', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (9, 8, '99991 1', '1', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (9, 'python', 'a, b = map(int, input().split())

while b != 0:
    remainder = a % b
    a = b
    b = remainder

print(a)
', '나머지가 0이 될 때까지 두 수를 작은 문제로 바꾸며 반복합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (9, '나머지를 먼저 저장한 뒤 A와 B를 올바른 순서로 갱신하는지 확인한다.', '["A를 바꾼 뒤 변경된 A로 나머지를 계산함","나머지가 0일 때 결과 변수를 잘못 출력함","두 수의 순서가 바뀌면 실패함"]'::jsonb, '{"AC":"한 번 반복한 뒤 a와 b가 어떤 값으로 바뀌는지 설명해보세요.","WA":"a를 바꾸기 전에 a % b를 별도 변수에 저장하고 있는지 확인해보세요.","CE":"while 줄의 콜론과 들여쓰기를 확인해보세요.","RE":"두 입력을 모두 정수로 읽었는지 확인해보세요.","TLE":"나머지가 0이 되면 반복을 반드시 끝내야 합니다."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (10, 'fibonacci-number', 10, '피보나치 수', 'F(0)=0, F(1)=1이고 F(N)=F(N-2)+F(N-1)일 때 F(N)을 재귀 함수로 구해 출력하세요.', 'Easy', '재귀 함수', '정수 N이 한 줄에 주어집니다.', 'N번째 피보나치 수 F(N)을 출력합니다.', array['0 ≤ N ≤ 20', '재귀 함수로 풀이합니다.']::text[], 'def fibonacci(n):
    # 종료 조건과 재귀 호출을 작성하세요.
    pass

n = int(input())
print(fibonacci(n))
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (10, 1, '5', '5', '0과 1에서 재귀를 끝내고, 그보다 큰 수는 앞선 두 피보나치 수를 더합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (10, 2, '0', '0', '0과 1에서 재귀를 끝내고, 그보다 큰 수는 앞선 두 피보나치 수를 더합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (10, 3, '1', '1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (10, 4, '2', '1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (10, 5, '3', '2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (10, 6, '6', '8', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (10, 7, '10', '55', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (10, 8, '15', '610', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (10, 'python', 'def fibonacci(n):
    if n == 0:
        return 0
    if n == 1:
        return 1
    return fibonacci(n - 2) + fibonacci(n - 1)

n = int(input())
print(fibonacci(n))
', '0과 1에서 재귀를 끝내고, 그보다 큰 수는 앞선 두 피보나치 수를 더합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (10, '0과 1의 종료 조건이 모두 있는지, 두 재귀 호출의 인자가 N-2와 N-1인지 확인한다.', '["종료 조건 하나를 빠뜨림","재귀 인자를 줄이지 않음","재귀 호출 결과를 더하지 않음"]'::jsonb, '{"AC":"N이 2일 때 어떤 두 호출이 만들어지고 무엇을 반환하는지 설명해보세요.","WA":"N이 0과 1일 때의 반환값, 그리고 두 재귀 호출의 인자를 각각 확인해보세요.","CE":"함수와 조건문의 콜론 및 return 들여쓰기를 확인해보세요.","RE":"재귀 호출의 인자가 종료 조건을 향해 줄어드는지 확인해보세요.","TLE":"모든 재귀 호출이 N=0 또는 N=1에서 반드시 끝나는지 확인해보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (11, 'reverse-string', 11, '문자열 뒤집기', '한 줄의 문자열을 입력받아 문자 순서를 거꾸로 뒤집어 출력하세요. 문자열 안의 공백도 하나의 문자로 취급합니다.', 'Easy', '문자열', '영문자와 공백으로 이루어진 문자열이 한 줄에 주어집니다.', '문자 순서를 뒤집은 문자열을 출력합니다.', array['문자열 길이는 1 이상 100 이하입니다.', '문자열의 맨 앞과 맨 뒤에는 공백이 없습니다.']::text[], 'text = input()

# 문자열을 뒤집어 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (11, 1, 'hello', 'olleh', '마지막 인덱스부터 첫 인덱스까지 거꾸로 순회하며 새 문자열에 붙입니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (11, 2, 'Didim Code', 'edoC midiD', '마지막 인덱스부터 첫 인덱스까지 거꾸로 순회하며 새 문자열에 붙입니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (11, 3, 'a', 'a', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (11, 4, 'ab', 'ba', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (11, 5, 'racecar', 'racecar', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (11, 6, '12345', '54321', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (11, 7, 'a b c', 'c b a', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (11, 8, 'Python', 'nohtyP', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (11, 'python', 'text = input()
reversed_text = ""

for index in range(len(text) - 1, -1, -1):
    reversed_text = reversed_text + text[index]

print(reversed_text)
', '마지막 인덱스부터 첫 인덱스까지 거꾸로 순회하며 새 문자열에 붙입니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (11, '마지막 문자부터 0번 문자까지 빠짐없이 읽는지, 공백을 제거하지 않는지 확인한다.', '["0번 문자를 제외함","strip이나 split으로 내부 공백을 잃음","원래 문자열을 그대로 출력함"]'::jsonb, '{"AC":"첫 반복과 마지막 반복에서 각각 어떤 문자를 가져오는지 설명해보세요.","WA":"마지막 인덱스부터 0번 인덱스까지 모두 방문하고 내부 공백도 유지하는지 확인해보세요.","CE":"range의 괄호와 반복문 들여쓰기를 확인해보세요.","RE":"문자열 인덱스가 범위를 벗어나지 않는지 확인해보세요.","TLE":"문자열의 각 문자를 한 번씩만 방문해보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (12, 'palindrome-check', 12, '팰린드롬 판별', '앞에서 읽은 문자열과 뒤에서 읽은 문자열이 같은지 판별하세요.', 'Easy', '문자열', '공백이 없는 영문 소문자 문자열이 한 줄에 주어집니다.', '팰린드롬이면 `예`, 아니면 `아니오`를 출력합니다.', array['문자열 길이는 1 이상 100 이하입니다.']::text[], 'text = input().strip()

# 팰린드롬인지 판별하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (12, 1, 'level', '예', '문자열의 양끝에서 같은 거리의 문자를 절반까지만 비교합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (12, 2, 'python', '아니오', '문자열의 양끝에서 같은 거리의 문자를 절반까지만 비교합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (12, 3, 'a', '예', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (12, 4, 'aa', '예', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (12, 5, 'aba', '예', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (12, 6, 'abba', '예', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (12, 7, 'abcba', '예', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (12, 8, 'abca', '아니오', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (12, 'python', 'text = input().strip()
is_palindrome = True

for index in range(len(text) // 2):
    if text[index] != text[len(text) - 1 - index]:
        is_palindrome = False
        break

if is_palindrome:
    print("예")
else:
    print("아니오")
', '문자열의 양끝에서 같은 거리의 문자를 절반까지만 비교합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (12, '왼쪽 인덱스와 대응하는 오른쪽 인덱스를 정확히 계산하는지, 다른 문자를 찾으면 판정을 바꾸는지 확인한다.', '["오른쪽 인덱스에서 1을 빼지 않음","문자열 전체 길이만큼 비교함","문자가 달라도 결과를 다시 참으로 바꿈"]'::jsonb, '{"AC":"index가 0일 때 어느 두 문자를 비교하는지 설명해보세요.","WA":"왼쪽 index와 오른쪽 `길이 - 1 - index`의 문자를 비교하고 있는지 확인해보세요.","CE":"조건문 콜론과 대괄호 짝을 확인해보세요.","RE":"오른쪽 문자 인덱스가 문자열 길이보다 작게 계산되는지 확인해보세요.","TLE":"양끝 문자는 문자열 길이의 절반까지만 비교해도 됩니다."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (13, 'character-frequency', 13, '문자 빈도수', '문자열에서 찾고 싶은 문자 하나가 몇 번 나타나는지 출력하세요.', 'Easy', '딕셔너리', '첫 줄에 영문 소문자 문자열, 둘째 줄에 찾을 영문 소문자 하나가 주어집니다.', '찾는 문자가 문자열에 나타난 횟수를 출력합니다.', array['문자열 길이는 1 이상 1,000 이하입니다.']::text[], 'text = input().strip()
target = input().strip()

# target의 등장 횟수를 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (13, 1, 'banana
a', '3', '각 문자의 개수를 딕셔너리에 저장하고 찾는 문자의 값을 확인합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (13, 2, 'hello
z', '0', '각 문자의 개수를 딕셔너리에 저장하고 찾는 문자의 값을 확인합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (13, 3, 'aaaa
a', '4', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (13, 4, 'abcabc
b', '2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (13, 5, 'x
x', '1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (13, 6, 'mississippi
s', '4', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (13, 7, 'didimcode
d', '3', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (13, 8, 'algorithm
o', '1', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (13, 'python', 'text = input().strip()
target = input().strip()
counts = {}

for character in text:
    if character not in counts:
        counts[character] = 0
    counts[character] = counts[character] + 1

if target in counts:
    print(counts[target])
else:
    print(0)
', '각 문자의 개수를 딕셔너리에 저장하고 찾는 문자의 값을 확인합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (13, '문자를 처음 만났을 때 딕셔너리 값을 준비하는지, 찾는 문자가 없을 때 0을 출력하는지 확인한다.', '["없는 키를 바로 1 증가시켜 오류가 남","target 자체가 아니라 다른 문자의 값을 출력함","문자가 없을 때 아무것도 출력하지 않음"]'::jsonb, '{"AC":"처음 만난 문자와 다시 만난 문자가 딕셔너리에서 어떻게 처리되는지 설명해보세요.","WA":"찾는 문자가 딕셔너리에 없는 경우에도 0을 출력하는지 확인해보세요.","CE":"딕셔너리 대괄호와 조건문 들여쓰기를 확인해보세요.","RE":"새 문자의 개수를 먼저 0으로 준비한 뒤 증가시키는지 확인해보세요.","TLE":"문자열을 한 번 순회하며 각 문자의 개수를 저장해보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (14, 'index-of-maximum', 14, '최댓값의 위치', '정수 목록에서 가장 큰 값이 처음 나타나는 위치를 출력하세요. 위치는 0부터 시작합니다.', 'Easy', '리스트', '첫 줄에 정수 N, 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.', '최댓값이 처음 나타나는 0-based 인덱스를 출력합니다.', array['1 ≤ N ≤ 1,000', '각 정수는 -100,000 이상 100,000 이하입니다.']::text[], 'n = int(input())
numbers = list(map(int, input().split()))

# 최댓값이 처음 나타나는 위치를 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (14, 1, '5
3 7 2 7 1', '1', '첫 값을 기준으로 더 큰 값이 나타날 때만 값과 위치를 함께 갱신합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (14, 2, '4
-5 -2 -9 -3', '1', '첫 값을 기준으로 더 큰 값이 나타날 때만 값과 위치를 함께 갱신합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (14, 3, '1
10', '0', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (14, 4, '3
9 8 7', '0', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (14, 5, '3
1 2 3', '2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (14, 6, '5
4 4 4 4 4', '0', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (14, 7, '6
-1 0 -2 0 -3 -4', '1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (14, 8, '4
1 9 9 2', '1', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (14, 'python', 'n = int(input())
numbers = list(map(int, input().split()))
maximum = numbers[0]
maximum_index = 0

for index in range(1, n):
    if numbers[index] > maximum:
        maximum = numbers[index]
        maximum_index = index

print(maximum_index)
', '첫 값을 기준으로 더 큰 값이 나타날 때만 값과 위치를 함께 갱신합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (14, '첫 원소로 최댓값을 시작하는지, 같은 최댓값에서는 위치를 바꾸지 않아 첫 위치를 유지하는지 확인한다.', '["최댓값을 0으로 시작함","같은 값에서도 인덱스를 바꿔 마지막 위치를 출력함","1-based 위치를 출력함"]'::jsonb, '{"AC":"더 큰 값과 같은 값이 나타날 때 인덱스가 각각 어떻게 처리되는지 설명해보세요.","WA":"첫 원소를 초기 최댓값으로 두고, 값이 더 클 때만 인덱스를 바꾸는지 확인해보세요.","CE":"리스트 인덱스와 반복문 들여쓰기를 확인해보세요.","RE":"numbers[0]을 사용하기 전에 목록이 만들어졌는지 확인해보세요.","TLE":"목록을 처음부터 끝까지 한 번만 확인해보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (15, 'unique-in-order', 15, '순서를 유지한 중복 제거', '정수 목록에서 처음 등장한 값만 남겨 원래 순서대로 출력하세요.', 'Easy', '리스트와 집합', '첫 줄에 정수 N, 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.', '중복을 제거한 정수들을 처음 등장한 순서대로 공백으로 구분해 출력합니다.', array['1 ≤ N ≤ 1,000', '각 정수는 -10,000 이상 10,000 이하입니다.']::text[], 'n = int(input())
numbers = list(map(int, input().split()))

# 중복을 제거하되 처음 등장한 순서를 유지하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (15, 1, '7
1 2 2 3 1 4 3', '1 2 3 4', '이미 본 값은 집합에 기록하고 처음 보는 값만 결과 리스트에 추가합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (15, 2, '5
5 5 5 5 5', '5', '이미 본 값은 집합에 기록하고 처음 보는 값만 결과 리스트에 추가합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (15, 3, '1
9', '9', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (15, 4, '6
1 2 3 4 5 6', '1 2 3 4 5 6', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (15, 5, '8
0 -1 0 -1 2 2 3 0', '0 -1 2 3', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (15, 6, '6
3 2 3 2 1 1', '3 2 1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (15, 7, '5
-2 -2 -1 -2 -1', '-2 -1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (15, 8, '10
1 1 2 2 3 3 4 4 5 5', '1 2 3 4 5', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (15, 'python', 'n = int(input())
numbers = list(map(int, input().split()))
seen = set()
result = []

for number in numbers:
    if number not in seen:
        seen.add(number)
        result.append(number)

print(*result)
', '이미 본 값은 집합에 기록하고 처음 보는 값만 결과 리스트에 추가합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (15, '중복 확인용 집합과 출력 순서를 보존할 리스트를 구분해서 사용하는지 확인한다.', '["집합 자체를 출력해 순서가 바뀜","본 값을 집합에 추가하지 않음","중복 값도 결과 리스트에 추가함"]'::jsonb, '{"AC":"seen과 result가 각각 어떤 역할을 하는지 설명해보세요.","WA":"집합은 확인에만 사용하고, 처음 본 값은 별도 리스트에 순서대로 추가하는지 확인해보세요.","CE":"set 생성과 append 호출의 괄호를 확인해보세요.","RE":"집합에 넣을 수 있는 정수 값을 순회하고 있는지 확인해보세요.","TLE":"각 값이 이미 나왔는지 집합에서 바로 확인해보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (16, 'two-sum-indices', 16, '두 수의 합 인덱스', '정수 목록에서 서로 다른 두 원소의 합이 목표값이 되는 한 쌍의 0-based 인덱스를 오름차순으로 출력하세요. 정답은 정확히 하나 존재합니다.', 'Medium', '딕셔너리', '첫 줄에 정수 N과 목표값 T, 둘째 줄에 N개의 정수가 주어집니다.', '조건을 만족하는 두 인덱스를 작은 것부터 공백으로 구분해 출력합니다.', array['2 ≤ N ≤ 10,000', '정답은 정확히 하나 존재합니다.', '같은 원소를 두 번 사용할 수 없습니다.']::text[], 'n, target = map(int, input().split())
numbers = list(map(int, input().split()))

# 합이 target인 두 원소의 인덱스를 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 1, '5 9
2 7 11 15 1', '0 1', '현재 값과 짝이 되는 값을 이전에 본 적이 있는지 딕셔너리에서 확인합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 2, '4 6
3 2 4 1', '1 2', '현재 값과 짝이 되는 값을 이전에 본 적이 있는지 딕셔너리에서 확인합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 3, '2 10
5 5', '0 1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 4, '5 0
-3 1 3 7 9', '0 2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 5, '6 8
1 6 2 5 7 3', '1 2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 6, '4 -5
-2 -3 4 9', '0 1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 7, '5 100
20 30 70 80 10', '1 2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 8, '7 4
8 -4 2 9 6 -2 1', '0 1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 9, '3 7
1 2 6', '0 2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (16, 10, '6 12
4 8 5 7 3 9', '0 1', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (16, 'python', 'n, target = map(int, input().split())
numbers = list(map(int, input().split()))
seen = {}

for index in range(n):
    needed = target - numbers[index]
    if needed in seen:
        print(seen[needed], index)
        break
    seen[numbers[index]] = index
', '현재 값과 짝이 되는 값을 이전에 본 적이 있는지 딕셔너리에서 확인합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (16, '현재 값을 저장하기 전에 필요한 짝을 확인하는지, 값과 인덱스를 올바르게 연결하는지 확인한다.', '["현재 값을 먼저 저장해 같은 원소를 두 번 사용함","필요한 값이 아니라 현재 값을 찾음","값을 인덱스처럼 출력함"]'::jsonb, '{"AC":"현재 값을 딕셔너리에 저장하기 전에 짝을 찾는 이유를 설명해보세요.","WA":"현재 값에 더해야 목표값이 되는 수를 먼저 계산하고, 그 수가 이전에 나왔는지 확인해보세요.","CE":"딕셔너리 대괄호와 반복문 들여쓰기를 확인해보세요.","RE":"찾은 값을 인덱스로 사용하지 않고 딕셔너리에 저장된 인덱스를 출력하는지 확인해보세요.","TLE":"이전에 본 값과 인덱스를 딕셔너리에 저장해 바로 찾아보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (17, 'bubble-sort', 17, '버블 정렬', '인접한 두 수를 비교하고 필요하면 자리를 바꾸는 과정을 반복해 목록을 오름차순으로 정렬하세요.', 'Easy', '정렬', '첫 줄에 정수 N, 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.', '오름차순으로 정렬된 수를 공백으로 구분해 출력합니다.', array['1 ≤ N ≤ 100', '버블 정렬 과정을 직접 구현합니다.']::text[], 'n = int(input())
numbers = list(map(int, input().split()))

# 버블 정렬로 numbers를 오름차순 정렬하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (17, 1, '5
5 1 4 2 8', '1 2 4 5 8', '인접한 두 값을 비교해 큰 값을 오른쪽으로 보내는 과정을 범위를 줄이며 반복합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (17, 2, '4
3 3 -1 2', '-1 2 3 3', '인접한 두 값을 비교해 큰 값을 오른쪽으로 보내는 과정을 범위를 줄이며 반복합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (17, 3, '1
7', '7', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (17, 4, '2
2 1', '1 2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (17, 5, '5
1 2 3 4 5', '1 2 3 4 5', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (17, 6, '5
5 4 3 2 1', '1 2 3 4 5', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (17, 7, '6
0 -2 9 3 -2 1', '-2 -2 0 1 3 9', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (17, 8, '8
4 1 7 1 3 9 2 6', '1 1 2 3 4 6 7 9', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (17, 'python', 'n = int(input())
numbers = list(map(int, input().split()))

for end in range(n - 1, 0, -1):
    for index in range(end):
        if numbers[index] > numbers[index + 1]:
            numbers[index], numbers[index + 1] = numbers[index + 1], numbers[index]

print(*numbers)
', '인접한 두 값을 비교해 큰 값을 오른쪽으로 보내는 과정을 범위를 줄이며 반복합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (17, 'index+1이 범위를 벗어나지 않는지, 왼쪽 값이 더 클 때 두 값을 함께 교환하는지 확인한다.', '["안쪽 반복이 마지막 인덱스까지 가서 범위를 벗어남","한쪽 값만 바꿔 두 값이 같아짐","비교 방향이 반대라 내림차순이 됨"]'::jsonb, '{"AC":"한 번의 안쪽 반복이 끝나면 어느 위치의 값이 확정되는지 설명해보세요.","WA":"왼쪽 값이 오른쪽 값보다 클 때 두 값을 동시에 바꾸고 있는지 확인해보세요.","CE":"다중 대입과 중첩 반복문의 들여쓰기를 확인해보세요.","RE":"numbers[index + 1]이 항상 목록 안에 있도록 반복 범위를 확인해보세요.","TLE":"바깥 반복이 끝날 때마다 안쪽 비교 범위를 하나씩 줄여보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (18, 'binary-search', 18, '이진 탐색', '오름차순으로 정렬된 목록에서 목표값의 0-based 인덱스를 이진 탐색으로 찾으세요. 목표값이 없으면 -1을 출력합니다.', 'Medium', '탐색', '첫 줄에 정수 N과 목표값 T, 둘째 줄에 오름차순으로 정렬된 N개의 서로 다른 정수가 주어집니다.', '목표값의 인덱스를 출력하고, 없으면 -1을 출력합니다.', array['1 ≤ N ≤ 100,000', '목록의 값은 서로 다르며 오름차순입니다.', '이진 탐색을 직접 구현합니다.']::text[], 'n, target = map(int, input().split())
numbers = list(map(int, input().split()))

# 이진 탐색으로 target의 인덱스를 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 1, '6 7
1 3 5 7 9 11', '3', '가운데 값과 목표값을 비교해 탐색 범위를 왼쪽 또는 오른쪽 절반으로 줄입니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 2, '5 4
1 2 3 5 8', '-1', '가운데 값과 목표값을 비교해 탐색 범위를 왼쪽 또는 오른쪽 절반으로 줄입니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 3, '1 10
10', '0', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 4, '1 5
10', '-1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 5, '7 1
1 2 3 4 5 6 7', '0', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 6, '7 7
1 2 3 4 5 6 7', '6', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 7, '8 -3
-10 -7 -3 0 2 4 8 12', '2', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 8, '6 11
2 4 6 8 10 12', '-1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 9, '5 3
1 3 5 7 9', '1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (18, 10, '9 14
0 2 4 6 8 10 12 14 16', '7', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (18, 'python', 'n, target = map(int, input().split())
numbers = list(map(int, input().split()))
left = 0
right = n - 1
answer = -1

while left <= right:
    middle = (left + right) // 2
    if numbers[middle] == target:
        answer = middle
        break
    if numbers[middle] < target:
        left = middle + 1
    else:
        right = middle - 1

print(answer)
', '가운데 값과 목표값을 비교해 탐색 범위를 왼쪽 또는 오른쪽 절반으로 줄입니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (18, 'left와 right에 양끝 인덱스를 넣었는지, 비교 결과에 따라 middle을 제외하고 범위를 줄이는지 확인한다.', '["right를 N으로 시작해 범위를 벗어남","middle을 다시 범위에 포함해 반복이 끝나지 않음","없는 경우의 -1을 준비하지 않음"]'::jsonb, '{"AC":"가운데 값이 목표보다 작을 때 어느 범위를 버리는지 설명해보세요.","WA":"가운데 값과 목표값의 크기 관계에 따라 left는 middle+1, right는 middle-1로 바뀌는지 확인해보세요.","CE":"while과 조건문 콜론 및 들여쓰기를 확인해보세요.","RE":"right의 시작값이 마지막 인덱스인 N-1인지 확인해보세요.","TLE":"범위를 줄일 때 middle 위치를 다시 포함하고 있지 않은지 확인해보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (19, 'valid-parentheses', 19, '올바른 괄호', '여는 괄호와 닫는 괄호가 올바른 순서로 짝을 이루는지 판별하세요.', 'Medium', '스택', '`(`와 `)`로만 이루어진 문자열이 한 줄에 주어집니다.', '올바른 괄호 문자열이면 `예`, 아니면 `아니오`를 출력합니다.', array['문자열 길이는 1 이상 1,000 이하입니다.']::text[], 'brackets = input().strip()

# 괄호가 올바른지 판별하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 1, '(()())', '예', '여는 괄호를 스택에 넣고 닫는 괄호를 만날 때 가장 최근의 여는 괄호를 제거합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 2, '(()', '아니오', '여는 괄호를 스택에 넣고 닫는 괄호를 만날 때 가장 최근의 여는 괄호를 제거합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 3, '()', '예', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 4, ')(', '아니오', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 5, '((()))', '예', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 6, '())(', '아니오', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 7, '((((', '아니오', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 8, '()()()', '예', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 9, '(())()', '예', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (19, 10, '())', '아니오', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (19, 'python', 'brackets = input().strip()
stack = []
is_valid = True

for bracket in brackets:
    if bracket == "(":
        stack.append(bracket)
    else:
        if len(stack) == 0:
            is_valid = False
            break
        stack.pop()

if len(stack) != 0:
    is_valid = False

if is_valid:
    print("예")
else:
    print("아니오")
', '여는 괄호를 스택에 넣고 닫는 괄호를 만날 때 가장 최근의 여는 괄호를 제거합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (19, '닫는 괄호를 만났을 때 스택이 비었는지 먼저 확인하는지, 반복 후 남은 여는 괄호도 검사하는지 확인한다.', '["빈 스택에서 pop을 호출함","반복이 끝난 뒤 남은 여는 괄호를 확인하지 않음","괄호 개수만 같으면 올바르다고 판단함"]'::jsonb, '{"AC":"닫는 괄호를 만났을 때 스택이 비어 있는 경우가 왜 잘못된지 설명해보세요.","WA":"반복 도중 빈 스택의 닫는 괄호와 반복 후 스택에 남은 여는 괄호를 모두 확인해보세요.","CE":"문자 비교의 따옴표와 중첩 조건문의 들여쓰기를 확인해보세요.","RE":"pop을 호출하기 전에 스택이 비어 있지 않은지 확인해보세요.","TLE":"문자열을 한 번 순회하며 스택을 갱신해보세요."}'::jsonb);

insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)
values (20, 'maximum-subarray', 20, '최대 부분 배열', '정수 목록에서 하나 이상 연속된 원소를 선택했을 때 만들 수 있는 가장 큰 합을 출력하세요.', 'Medium', '누적 상태', '첫 줄에 정수 N, 둘째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.', '연속 부분 배열의 합 중 최댓값을 출력합니다.', array['1 ≤ N ≤ 100,000', '각 정수는 -10,000 이상 10,000 이하입니다.', '빈 부분 배열은 선택할 수 없습니다.']::text[], 'n = int(input())
numbers = list(map(int, input().split()))

# 연속 부분 배열의 합 중 최댓값을 출력하세요.
', 'published', 'seed', now());

insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 1, '9
-2 1 -3 4 -1 2 1 -5 4', '6', '현재 원소에서 새로 시작할지 이전 구간에 이어 붙일지를 정하고 가장 큰 합을 기록합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 2, '4
-5 -2 -7 -3', '-2', '현재 원소에서 새로 시작할지 이전 구간에 이어 붙일지를 정하고 가장 큰 합을 기록합니다.', true);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 3, '1
8', '8', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 4, '5
1 2 3 4 5', '15', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 5, '5
-1 -2 -3 -4 -5', '-1', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 6, '6
5 -2 3 -10 4 6', '10', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 7, '8
-2 -3 4 -1 -2 1 5 -3', '7', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 8, '6
0 0 0 0 0 0', '0', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 9, '7
2 -1 2 3 4 -5 2', '10', null, false);
insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)
values (20, 10, '5
-10 20 -5 -5 30', '40', null, false);

insert into public.problem_solutions (problem_id, language, code, explanation)
values (20, 'python', 'n = int(input())
numbers = list(map(int, input().split()))
current_sum = numbers[0]
best_sum = numbers[0]

for index in range(1, n):
    if current_sum + numbers[index] > numbers[index]:
        current_sum = current_sum + numbers[index]
    else:
        current_sum = numbers[index]

    if current_sum > best_sum:
        best_sum = current_sum

print(best_sum)
', '현재 원소에서 새로 시작할지 이전 구간에 이어 붙일지를 정하고 가장 큰 합을 기록합니다.');

insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)
values (20, '현재 합과 전체 최댓값을 첫 원소로 시작하는지, 각 원소에서 이어 붙이기와 새로 시작하기를 비교하는지 확인한다.', '["합을 0으로 시작해 모두 음수인 입력에서 0을 출력함","연속되지 않은 양수만 더함","현재 합만 갱신하고 전체 최댓값을 기록하지 않음"]'::jsonb, '{"AC":"각 원소에서 기존 구간을 이어갈지 새로 시작할지 무엇을 비교하는지 설명해보세요.","WA":"현재 합과 최댓값을 0이 아니라 첫 원소로 시작했는지 확인해보세요. 모든 수가 음수일 수도 있습니다.","CE":"조건문과 반복문의 들여쓰기를 확인해보세요.","RE":"numbers[0]을 사용하기 전에 목록을 올바르게 읽었는지 확인해보세요.","TLE":"각 원소마다 현재 구간을 이어갈지 새로 시작할지만 한 번 결정해보세요."}'::jsonb);

select setval(pg_get_serial_sequence('public.problems', 'id'), (select max(id) from public.problems));
select setval(pg_get_serial_sequence('public.problem_test_cases', 'id'), (select max(id) from public.problem_test_cases));
select setval(pg_get_serial_sequence('public.problem_solutions', 'id'), (select max(id) from public.problem_solutions));
