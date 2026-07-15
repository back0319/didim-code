import { getAdminSupabaseClient, getPublicSupabaseClient } from './supabase';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Verdict = 'AC' | 'WA' | 'CE' | 'RE' | 'TLE';

export interface ProblemTestCase {
  id: number;
  case_order: number;
  input: string;
  output: string;
  explanation?: string;
  is_sample: boolean;
}

export interface Problem {
  id: number;
  slug: string;
  display_order: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  input_format: string;
  output_format: string;
  constraints: string[];
  starter_code: string;
  test_cases: ProblemTestCase[];
}

export interface ProblemSolution {
  code: string;
  explanation: string | null;
}

export interface ProblemFeedbackConfig {
  prompt_context: string;
  common_mistakes: string[];
  fallback_hints: Partial<Record<Verdict, string>>;
}

export interface JudgeProblemBundle {
  problem: Problem;
  test_cases: ProblemTestCase[];
  solution: ProblemSolution;
  feedback: ProblemFeedbackConfig;
}

interface ProblemRow {
  id: number;
  slug: string;
  display_order: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  input_format: string;
  output_format: string;
  constraints: string[];
  starter_code: string;
}

interface TestCaseRow {
  id: number;
  problem_id: number;
  case_order: number;
  input_data: string;
  expected_output: string;
  explanation: string | null;
  is_sample: boolean;
}

export class CatalogUnavailableError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'CatalogUnavailableError';
    this.cause = cause;
  }
}

function mapProblem(row: ProblemRow, testCases: TestCaseRow[] = []): Problem {
  return {
    ...row,
    constraints: Array.isArray(row.constraints) ? row.constraints : [],
    test_cases: testCases.map((testCase) => ({
      id: testCase.id,
      case_order: testCase.case_order,
      input: testCase.input_data,
      output: testCase.expected_output,
      explanation: testCase.explanation || undefined,
      is_sample: testCase.is_sample,
    })),
  };
}

export async function getProblems(): Promise<Problem[]> {
  try {
    const { data, error } = await getPublicSupabaseClient()
      .from('problems')
      .select('id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code')
      .eq('status', 'published')
      .order('display_order');

    if (error) throw error;
    return ((data || []) as ProblemRow[]).map((row) => mapProblem(row));
  } catch (error) {
    throw new CatalogUnavailableError('문제 목록을 불러오지 못했습니다.', error);
  }
}

export async function getProblemById(id: number): Promise<Problem | null> {
  try {
    const client = getPublicSupabaseClient();
    const [{ data: problem, error: problemError }, { data: testCases, error: testCaseError }] = await Promise.all([
      client
        .from('problems')
        .select('id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle(),
      client
        .from('problem_test_cases')
        .select('id, problem_id, case_order, input_data, expected_output, explanation, is_sample')
        .eq('problem_id', id)
        .eq('is_sample', true)
        .order('case_order'),
    ]);

    if (problemError) throw problemError;
    if (testCaseError) throw testCaseError;
    if (!problem) return null;
    return mapProblem(problem as ProblemRow, (testCases || []) as TestCaseRow[]);
  } catch (error) {
    throw new CatalogUnavailableError('문제를 불러오지 못했습니다.', error);
  }
}

export async function getJudgeProblemBundle(id: number): Promise<JudgeProblemBundle | null> {
  try {
    const client = getAdminSupabaseClient();
    const [problemResult, testCaseResult, solutionResult, feedbackResult] = await Promise.all([
      client
        .from('problems')
        .select('id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle(),
      client
        .from('problem_test_cases')
        .select('id, problem_id, case_order, input_data, expected_output, explanation, is_sample')
        .eq('problem_id', id)
        .order('case_order'),
      client
        .from('problem_solutions')
        .select('code, explanation')
        .eq('problem_id', id)
        .eq('language', 'python')
        .maybeSingle(),
      client
        .from('problem_feedback_configs')
        .select('prompt_context, common_mistakes, fallback_hints')
        .eq('problem_id', id)
        .maybeSingle(),
    ]);

    const error = problemResult.error || testCaseResult.error || solutionResult.error || feedbackResult.error;
    if (error) throw error;
    if (!problemResult.data) return null;
    if (!solutionResult.data || !feedbackResult.data || !testCaseResult.data?.length) {
      throw new Error('채점 데이터가 완전하지 않습니다.');
    }

    const testCases = (testCaseResult.data || []) as TestCaseRow[];
    return {
      problem: mapProblem(problemResult.data as ProblemRow, testCases.filter((testCase) => testCase.is_sample)),
      test_cases: testCases.map((testCase) => ({
        id: testCase.id,
        case_order: testCase.case_order,
        input: testCase.input_data,
        output: testCase.expected_output,
        explanation: testCase.explanation || undefined,
        is_sample: testCase.is_sample,
      })),
      solution: solutionResult.data as ProblemSolution,
      feedback: feedbackResult.data as ProblemFeedbackConfig,
    };
  } catch (error) {
    throw new CatalogUnavailableError('채점 데이터를 불러오지 못했습니다.', error);
  }
}
