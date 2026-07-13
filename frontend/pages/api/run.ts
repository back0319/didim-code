import { NextApiRequest, NextApiResponse } from 'next';
import { Sandbox } from '@vercel/sandbox';

export const config = {
  maxDuration: 30,
};

interface RunResponse {
  success: boolean;
  output?: string;
  error?: string;
  execution_time?: number;
  memory_usage?: number;
}

const RUNNER = `
import subprocess
import sys

try:
    with open("input.txt", "r", encoding="utf-8") as input_file:
        input_data = input_file.read()

    result = subprocess.run(
        [sys.executable, "solution.py"],
        input=input_data,
        capture_output=True,
        text=True,
        timeout=3,
    )
    sys.stdout.write(result.stdout)
    sys.stderr.write(result.stderr)
    sys.exit(result.returncode)
except subprocess.TimeoutExpired:
    sys.stderr.write("실행 시간이 3초를 초과했습니다.\\n")
    sys.exit(124)
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RunResponse>,
) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { code, language, input_data = '' } = req.body || {};
  if (language !== 'python' || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: '현재 Python만 지원됩니다.' });
  }

  if (code.length === 0 || code.length > 20_000 || String(input_data).length > 10_000) {
    return res.status(400).json({
      success: false,
      error: '코드는 20,000자, 입력은 10,000자 이하로 작성해주세요.',
    });
  }

  let sandbox: Sandbox | undefined;

  try {
    sandbox = await Sandbox.create({
      runtime: 'python3.13',
      timeout: 15_000,
      persistent: false,
      networkPolicy: 'deny-all',
    });

    await sandbox.writeFiles([
      { path: 'solution.py', content: Buffer.from(code, 'utf8') },
      { path: 'input.txt', content: Buffer.from(String(input_data), 'utf8') },
      { path: 'runner.py', content: Buffer.from(RUNNER, 'utf8') },
    ]);

    const command = await sandbox.runCommand('python3', ['runner.py']);
    const [output, error] = await Promise.all([command.stdout(), command.stderr()]);

    return res.status(200).json({
      success: command.exitCode === 0,
      output,
      error,
      execution_time: command.durationMs,
      memory_usage: 0,
    });
  } catch (error) {
    console.error('Sandbox execution error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({
      success: false,
      error: '격리 실행 환경을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.',
    });
  } finally {
    if (sandbox) {
      try {
        await sandbox.stop();
      } catch (error) {
        console.error('Sandbox cleanup error:', error instanceof Error ? error.message : String(error));
      }
    }
  }
}
