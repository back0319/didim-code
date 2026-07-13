import { NextApiRequest, NextApiResponse } from 'next';

function operationFor(line: string): string {
  const value = line.trim();
  if (/^def\s+/.test(value)) return 'function_definition';
  if (/^return\b/.test(value)) return 'function_return';
  if (/^(for|while)\b/.test(value)) return 'loop';
  if (/^(if|elif|else)\b/.test(value)) return 'conditional';
  if (/^print\s*\(/.test(value)) return 'output';
  if (/^[A-Za-z_]\w*\s*=/.test(value)) return 'assignment';
  return 'execution';
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, language } = req.body || {};
  if (language !== 'python' || typeof code !== 'string' || code.length > 20_000) {
    return res.status(400).json({ message: '유효한 Python 코드가 필요합니다.' });
  }

  const codeLines = code.split('\n');
  const steps = codeLines
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.trim() && !line.trim().startsWith('#'))
    .slice(0, 200)
    .map(({ line, lineNumber }) => ({
      line: lineNumber,
      operation: operationFor(line),
      variables: {},
      stack_frames: [],
      globals_vars: {},
      func_name: line.trim().match(/^def\s+(\w+)/)?.[1] || 'Global frame',
    }));

  return res.status(200).json({
    steps: steps.length > 0 ? steps : [{
      line: 1,
      operation: 'execution',
      variables: {},
      stack_frames: [],
      globals_vars: {},
      func_name: 'Global frame',
    }],
    code_lines: codeLines,
  });
}
