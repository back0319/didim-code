import catalogJson from '../data/catalog.json';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface ProblemTestCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  paradigms: string[];
  expected_complexity: string;
  category: string;
  input: string;
  output: string;
  test_cases: ProblemTestCase[];
}

export interface Exemplar {
  id: number;
  problem_id: number;
  type: string;
  code: string;
  complexity: string;
  explanation: string | null;
}

interface CsvTestCase {
  id: number;
  problem_id: number;
  case_number: number;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
}

interface Catalog {
  problems: Array<Omit<Problem, 'category' | 'input' | 'output'> & {
    category: string | null;
    input: string | null;
    output: string | null;
  }>;
  exemplars: Exemplar[];
  test_cases: CsvTestCase[];
}

const catalog = catalogJson as unknown as Catalog;

function normalizeProblem(problem: Catalog['problems'][number]): Problem {
  const csvTestCases = catalog.test_cases
    .filter((testCase) => testCase.problem_id === problem.id && testCase.is_sample)
    .sort((a, b) => a.case_number - b.case_number)
    .map((testCase) => ({
      input: testCase.input_data,
      output: testCase.expected_output,
    }));

  return {
    ...problem,
    category: problem.category || 'Algorithm',
    input: problem.input || '',
    output: problem.output || '',
    test_cases: problem.test_cases.length > 0 ? problem.test_cases : csvTestCases,
  };
}

export function getProblems(): Problem[] {
  return catalog.problems.map(normalizeProblem).sort((a, b) => a.id - b.id);
}

export function getProblemById(id: number): Problem | null {
  const problem = catalog.problems.find((item) => item.id === id);
  return problem ? normalizeProblem(problem) : null;
}

export function getExemplarsByProblemId(problemId: number): Exemplar[] {
  const order: Record<string, number> = { optimal: 1, naive: 2 };

  return catalog.exemplars
    .filter((item) => item.problem_id === problemId)
    .sort((a, b) => (order[a.type] || 3) - (order[b.type] || 3));
}

export function getJudgeTestCases(problemId: number): CsvTestCase[] {
  return catalog.test_cases
    .filter((item) => item.problem_id === problemId)
    .sort((a, b) => a.case_number - b.case_number);
}
