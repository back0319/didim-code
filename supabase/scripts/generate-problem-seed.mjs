import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const supabaseDirectory = path.resolve(scriptDirectory, '..');
const sourcePath = path.join(supabaseDirectory, 'seed-data', 'problems.json');
const migrationPath = process.argv[2];

if (!migrationPath) {
  throw new Error('생성할 마이그레이션 파일 경로가 필요합니다.');
}

const problems = JSON.parse(readFileSync(sourcePath, 'utf8'));
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const nullable = (value) => value == null ? 'null' : quote(value);
const jsonb = (value) => `${quote(JSON.stringify(value))}::jsonb`;
const textArray = (values) => `array[${values.map(quote).join(', ')}]::text[]`;

const outputs = new Map();
for (const problem of problems) {
  const expectedCount = problem.difficulty === 'Medium' ? 10 : 8;
  if (problem.tests.length !== expectedCount) {
    throw new Error(`${problem.id}번 문제는 테스트가 ${expectedCount}개여야 합니다.`);
  }

  problem.tests.forEach((input, index) => {
    const run = spawnSync('python3', ['-c', problem.solution], {
      input,
      encoding: 'utf8',
      timeout: 5_000,
    });
    if (run.error || run.status !== 0) {
      throw new Error(`${problem.id}번 문제 테스트 ${index + 1} 실행 실패: ${run.stderr || run.error}`);
    }
    outputs.set(`${problem.id}:${index + 1}`, run.stdout.trim());
  });
}

const lines = [
  '-- 이 파일은 supabase/seed-data/problems.json에서 생성됩니다.',
  '-- npm run data:seed-sql --prefix frontend 명령으로 다시 만들 수 있습니다.',
  '',
  'delete from public.problem_feedback_configs;',
  'delete from public.problem_solutions;',
  'delete from public.problem_test_cases;',
  'delete from public.problems;',
  '',
];

for (const problem of problems) {
  lines.push(
    'insert into public.problems (id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code, status, source, published_at)',
    `values (${problem.id}, ${quote(problem.slug)}, ${problem.id}, ${quote(problem.title)}, ${quote(problem.description)}, ${quote(problem.difficulty)}, ${quote(problem.category)}, ${quote(problem.input_format)}, ${quote(problem.output_format)}, ${textArray(problem.constraints)}, ${quote(problem.starter_code)}, 'published', 'seed', now());`,
    '',
  );

  problem.tests.forEach((input, index) => {
    lines.push(
      'insert into public.problem_test_cases (problem_id, case_order, input_data, expected_output, explanation, is_sample)',
      `values (${problem.id}, ${index + 1}, ${quote(input)}, ${quote(outputs.get(`${problem.id}:${index + 1}`))}, ${nullable(index < 2 ? problem.solution_explanation : null)}, ${index < 2});`,
    );
  });

  lines.push(
    '',
    'insert into public.problem_solutions (problem_id, language, code, explanation)',
    `values (${problem.id}, 'python', ${quote(problem.solution)}, ${quote(problem.solution_explanation)});`,
    '',
    'insert into public.problem_feedback_configs (problem_id, prompt_context, common_mistakes, fallback_hints)',
    `values (${problem.id}, ${quote(problem.prompt_context)}, ${jsonb(problem.common_mistakes)}, ${jsonb(problem.fallback_hints)});`,
    '',
  );
}

lines.push(
  `select setval(pg_get_serial_sequence('public.problems', 'id'), (select max(id) from public.problems));`,
  `select setval(pg_get_serial_sequence('public.problem_test_cases', 'id'), (select max(id) from public.problem_test_cases));`,
  `select setval(pg_get_serial_sequence('public.problem_solutions', 'id'), (select max(id) from public.problem_solutions));`,
);

writeFileSync(path.resolve(migrationPath), `${lines.join('\n')}\n`);
console.log(`Generated ${migrationPath} with ${problems.length} problems.`);
