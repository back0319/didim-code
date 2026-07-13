import { NextApiRequest, NextApiResponse } from 'next';
import {
  getExemplarsByProblemId,
  getProblemById,
} from '../../lib/catalog';

export const config = {
  maxDuration: 60,
};

interface FeedbackItem {
  id: number;
  type: string;
  title: string;
  message: string;
  code_suggestion?: string;
  severity: 'info' | 'warning' | 'error';
}

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

function parseFeedback(rawText: string): FeedbackItem[] {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error('AI 응답에서 피드백 JSON을 찾을 수 없습니다.');
  }

  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.feedback)) {
    throw new Error('AI 피드백 형식이 올바르지 않습니다.');
  }

  return parsed.feedback.slice(0, 5).map((item: any, index: number) => ({
    id: index + 1,
    type: String(item.type || '코드 품질'),
    title: String(item.title || '코드 분석 결과'),
    message: String(item.message || '분석 내용을 확인해주세요.'),
    code_suggestion: item.code_suggestion ? String(item.code_suggestion) : undefined,
    severity: ['info', 'warning', 'error'].includes(item.severity)
      ? item.severity
      : 'info',
  }));
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: 'OPENAI_API_KEY가 설정되지 않았습니다.' });
  }

  const testCases = problem.test_cases.slice(0, 4);
  const exemplars = getExemplarsByProblemId(problemId).slice(0, 2);
  const prompt = [
    `문제 제목: ${problem.title}`,
    `문제 설명:\n${problem.description}`,
    `기대 복잡도: ${problem.expected_complexity}`,
    `패러다임: ${problem.paradigms.join(', ')}`,
    `테스트 사례:\n${testCases.map((test) => `입력: ${test.input}\n기대 출력: ${test.output}`).join('\n\n') || '없음'}`,
    `참고 풀이:\n${exemplars.map((item) => `${item.type} (${item.complexity})\n${item.code}`).join('\n\n').slice(0, 6_000) || '없음'}`,
    `사용자 Python 코드:\n${code}`,
  ].join('\n\n');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        instructions: [
          '당신은 알고리즘 학습자를 돕는 전문 Python 튜터입니다.',
          '정답 코드를 대신 작성하기보다 정확성, 시간·공간 복잡도, 코드 품질, 개선 방향을 한국어로 교육적으로 설명하세요.',
          '반드시 마크다운 없이 JSON 하나만 반환하세요.',
          '형식: {"feedback":[{"type":"복잡도|정확성|코드 품질|최적화 제안","title":"짧은 제목","message":"구체적인 설명","severity":"info|warning|error","code_suggestion":"선택적 짧은 코드"}]}',
          '피드백은 서로 중복되지 않게 3~5개 작성하세요.',
        ].join(' '),
        input: prompt,
        max_output_tokens: 2_000,
      }),
      signal: AbortSignal.timeout(50_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI feedback request failed:', response.status, errorBody.slice(0, 500));
      return res.status(502).json({ message: 'AI 피드백 생성에 실패했습니다.' });
    }

    const responseBody = await response.json();
    const feedback = parseFeedback(extractOutputText(responseBody));

    return res.status(200).json({
      submission_id: Date.now(),
      verdict: 'AI 분석 완료',
      execution_time: 0,
      memory_usage: 0,
      feedback,
      feedback_pending: false,
    });
  } catch (error) {
    console.error('AI feedback error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({ message: 'AI 피드백 처리 중 오류가 발생했습니다.' });
  }
}
