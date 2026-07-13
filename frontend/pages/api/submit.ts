import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import { Sandbox } from '@vercel/sandbox';
import { getJudgeTestCases, getProblemById } from '../../lib/catalog';

export const config = {
  maxDuration: 60,
};

interface FeedbackItem {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

interface JudgeResult {
  verdict: 'AC' | 'WA' | 'CE' | 'RE' | 'TLE';
  execution_time: number;
  memory_usage: number;
  error?: string;
  test_results: Array<{
    case_id: number;
    verdict: string;
    execution_time: number;
    memory_usage: number;
    message: string;
    actual_output: string;
  }>;
}

const JUDGE_RUNNER = fs.readFileSync(
  path.join(process.cwd(), 'sandbox', 'judge_runner.py'),
  'utf8',
);

function extractOutputText(response: any): string {
  if (typeof response.output_text === 'string') {
    return response.output_text;
  }

  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        return content.text;
      }
    }
  }

  return '';
}

function fallbackFeedback(verdict: JudgeResult['verdict']): FeedbackItem {
  const messages: Record<JudgeResult['verdict'], string> = {
    AC: '모든 테스트를 통과했습니다. 풀이의 시간·공간 복잡도를 한 번 더 직접 점검해보세요.',
    WA: '일부 입력에서 출력이 다릅니다. 경계값과 조건 분기에서 빠진 경우가 없는지 먼저 확인해보세요.',
    CE: '코드를 실행하기 전에 구문 오류가 발생했습니다. 오류가 표시된 줄의 괄호, 콜론과 들여쓰기를 확인해보세요.',
    RE: '실행 중 오류가 발생했습니다. 인덱스 범위, 자료형과 비어 있는 입력을 먼저 확인해보세요.',
    TLE: '시간 제한을 초과했습니다. 같은 상태를 반복 계산하는 부분이 있는지 확인해보세요.',
  };
  return {
    id: 1,
    type: '핵심 힌트',
    title: '먼저 확인할 부분',
    message: messages[verdict],
    severity: verdict === 'AC' ? 'info' : 'warning',
  };
}

async function judge(code: string, problemId: number): Promise<JudgeResult> {
  const problem = getProblemById(problemId);
  const csvTests = getJudgeTestCases(problemId);
  const tests = (csvTests.length > 0
    ? csvTests.map((test) => ({
        case_id: test.case_number,
        input: test.input_data,
        expected_output: test.expected_output,
      }))
    : (problem?.test_cases || []).map((test, index) => ({
        case_id: index + 1,
        input: test.input,
        expected_output: test.output,
      })));

  if (tests.length === 0) {
    throw new Error('채점할 테스트 케이스가 없습니다.');
  }

  let sandbox: Sandbox | undefined;
  try {
    sandbox = await Sandbox.create({
      runtime: 'python3.13',
      timeout: 30_000,
      persistent: false,
      networkPolicy: 'deny-all',
    });
    await sandbox.writeFiles([
      { path: 'solution.py', content: Buffer.from(code, 'utf8') },
      { path: 'tests.json', content: Buffer.from(JSON.stringify(tests), 'utf8') },
      { path: 'judge_runner.py', content: Buffer.from(JUDGE_RUNNER, 'utf8') },
    ]);

    const command = await sandbox.runCommand('python3', ['judge_runner.py']);
    const [output, error] = await Promise.all([command.stdout(), command.stderr()]);
    if (command.exitCode !== 0) {
      throw new Error(error || '채점기가 비정상 종료되었습니다.');
    }
    return JSON.parse(output) as JudgeResult;
  } finally {
    if (sandbox) {
      try {
        await sandbox.stop();
      } catch (error) {
        console.error('Judge sandbox cleanup error:', error instanceof Error ? error.message : String(error));
      }
    }
  }
}

async function createHint(
  code: string,
  problem: NonNullable<ReturnType<typeof getProblemById>>,
  result: JudgeResult,
): Promise<FeedbackItem> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackFeedback(result.verdict);
  }

  const failure = result.test_results.find((test) => test.verdict !== 'AC');
  const prompt = [
    `문제 제목: ${problem.title}`,
    `문제 설명:\n${problem.description}`,
    `기대 복잡도: ${problem.expected_complexity}`,
    `패러다임: ${problem.paradigms.join(', ')}`,
    `실제 채점 결과: ${result.verdict}`,
    failure ? `실패 정보: ${failure.message}` : '모든 테스트 통과',
    result.error ? `실행 오류: ${result.error}` : '',
    `사용자 Python 코드:\n${code}`,
  ].filter(Boolean).join('\n\n');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions: [
          '당신은 알고리즘 학습자가 스스로 다음 시도를 하도록 돕는 Python 튜터입니다.',
          '실제 채점 결과를 근거로 가장 먼저 확인할 핵심 힌트 딱 한 가지만 한국어로 작성하세요.',
          '정답 코드, 의사 코드, 완성된 풀이, 테스트의 기대 출력은 절대 제공하지 마세요.',
          '오답이면 구문, 실행, 시간 초과, 논리 중 판정과 직접 관련된 원인부터 짚으세요.',
          '정답이면 복잡도나 코드 품질에서 스스로 점검할 한 가지 질문만 제시하세요.',
          'title은 30자, message는 200자 이내로 작성하세요.',
        ].join(' '),
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'single_learning_hint',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                type: { type: 'string' },
                title: { type: 'string' },
                message: { type: 'string' },
                severity: { type: 'string', enum: ['info', 'warning', 'error'] },
              },
              required: ['type', 'title', 'message', 'severity'],
            },
          },
        },
        max_output_tokens: 500,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI hint request failed:', response.status, errorBody.slice(0, 500));
      return fallbackFeedback(result.verdict);
    }

    const parsed = JSON.parse(extractOutputText(await response.json()));
    return {
      id: 1,
      type: String(parsed.type || '핵심 힌트'),
      title: String(parsed.title || '먼저 확인할 부분').slice(0, 30),
      message: String(parsed.message || fallbackFeedback(result.verdict).message).slice(0, 200),
      severity: ['info', 'warning', 'error'].includes(parsed.severity)
        ? parsed.severity
        : result.verdict === 'AC' ? 'info' : 'warning',
    };
  } catch (error) {
    console.error('AI hint error:', error instanceof Error ? error.message : String(error));
    return fallbackFeedback(result.verdict);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { problem_id, code, language } = req.body || {};
  const problemId = Number(problem_id);
  if (!Number.isInteger(problemId) || typeof code !== 'string' || language !== 'python') {
    return res.status(400).json({ message: '문제, Python 코드, 언어 정보가 필요합니다.' });
  }
  if (code.length === 0 || code.length > 20_000) {
    return res.status(400).json({ message: '코드는 1자 이상 20,000자 이하로 입력해주세요.' });
  }

  const problem = getProblemById(problemId);
  if (!problem) {
    return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
  }

  try {
    const result = await judge(code, problemId);
    const feedback = [await createHint(code, problem, result)];
    return res.status(200).json({
      submission_id: Date.now(),
      ...result,
      feedback,
      feedback_pending: false,
    });
  } catch (error) {
    console.error('Submission judge error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({ message: '격리 채점 환경을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.' });
  }
}
