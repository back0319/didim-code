import { VERDICTS } from './judge-contract';
import {
  parseFeedbackConfig,
  parseProblemRow,
  parseTestCaseRow,
  type Difficulty,
  type ProblemFeedbackConfig,
  type ProblemRow,
  type TestCaseRow,
} from './catalog-validation';
import { getSql } from './db';

export type { Difficulty, ProblemFeedbackConfig } from './catalog-validation';

export interface ProblemTestCase {
  id: number;
  case_order: number;
  input: string;
  output: string;
  explanation?: string;
  is_sample: boolean;
}

export interface Problem extends ProblemRow {
  test_cases: ProblemTestCase[];
}

export interface JudgeProblemBundle {
  problem: Problem;
  test_cases: ProblemTestCase[];
  feedback: ProblemFeedbackConfig;
}

export class CatalogUnavailableError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'CatalogUnavailableError';
    this.cause = cause;
  }
}

function mapTestCase(row: TestCaseRow): ProblemTestCase {
  return {
    id: row.id,
    case_order: row.case_order,
    input: row.input_data,
    output: row.expected_output,
    explanation: row.explanation || undefined,
    is_sample: row.is_sample,
  };
}

const PROBLEM_COLUMNS = 'id, slug, display_order, title, description, difficulty, category, input_format, output_format, constraints, starter_code';
const TEST_CASE_COLUMNS = 'id, problem_id, case_order, input_data, expected_output, explanation, is_sample';

function mapProblem(row: ProblemRow, testCases: TestCaseRow[] = []): Problem {
  return { ...row, test_cases: testCases.map(mapTestCase) };
}

export async function getProblems(): Promise<Problem[]> {
  try {
    const rows = await getSql().query(
      `select ${PROBLEM_COLUMNS} from problems where status = 'published' order by display_order`,
    );
    return rows.map((row) => mapProblem(parseProblemRow(row)));
  } catch (error) {
    throw new CatalogUnavailableError('문제 목록을 불러오지 못했습니다.', error);
  }
}

export async function getProblemById(id: number): Promise<Problem | null> {
  try {
    const sql = getSql();
    const [problems, testCases] = await Promise.all([
      sql.query(
        `select ${PROBLEM_COLUMNS} from problems where id = $1 and status = 'published'`,
        [id],
      ),
      sql.query(
        `select ${TEST_CASE_COLUMNS} from problem_test_cases
         where problem_id = $1 and is_sample
         order by case_order`,
        [id],
      ),
    ]);

    if (!problems[0]) return null;
    return mapProblem(parseProblemRow(problems[0]), testCases.map(parseTestCaseRow));
  } catch (error) {
    throw new CatalogUnavailableError('문제를 불러오지 못했습니다.', error);
  }
}

export async function getJudgeProblemBundle(id: number): Promise<JudgeProblemBundle | null> {
  try {
    const sql = getSql();
    const [problems, testCaseRows, feedbackRows] = await Promise.all([
      sql.query(
        `select ${PROBLEM_COLUMNS} from problems where id = $1 and status = 'published'`,
        [id],
      ),
      sql.query(
        `select ${TEST_CASE_COLUMNS} from problem_test_cases where problem_id = $1 order by case_order`,
        [id],
      ),
      sql.query(
        'select prompt_context, common_mistakes, fallback_hints from problem_feedback_configs where problem_id = $1',
        [id],
      ),
    ]);

    if (!problems[0]) return null;
    if (!feedbackRows[0] || !testCaseRows.length) {
      throw new Error('채점 데이터가 완전하지 않습니다.');
    }

    const testCases = testCaseRows.map(parseTestCaseRow);
    if (!testCases.some((testCase) => testCase.is_sample)) {
      throw new Error('공개 sample 테스트가 없습니다.');
    }
    if (!testCases.some((testCase) => !testCase.is_sample)) {
      throw new Error('숨은 테스트가 없습니다.');
    }

    return {
      problem: mapProblem(
        parseProblemRow(problems[0]),
        testCases.filter((testCase) => testCase.is_sample),
      ),
      test_cases: testCases.map(mapTestCase),
      feedback: parseFeedbackConfig(feedbackRows[0], VERDICTS),
    };
  } catch (error) {
    throw new CatalogUnavailableError('채점 데이터를 불러오지 못했습니다.', error);
  }
}
