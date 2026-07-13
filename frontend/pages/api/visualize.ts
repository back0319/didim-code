import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import { Sandbox } from '@vercel/sandbox';

export const config = {
  maxDuration: 30,
};

const RUNNER = fs.readFileSync(
  path.join(process.cwd(), 'sandbox', 'visualize_runner.py'),
  'utf8',
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, language, input_data = '' } = req.body || {};
  if (language !== 'python' || typeof code !== 'string') {
    return res.status(400).json({ message: '현재 Python만 지원됩니다.' });
  }

  if (code.length === 0 || code.length > 20_000 || String(input_data).length > 10_000) {
    return res.status(400).json({
      message: '코드는 20,000자, 입력은 10,000자 이하로 작성해주세요.',
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
      { path: 'request.json', content: Buffer.from(JSON.stringify({ code, input_data: String(input_data) }), 'utf8') },
      { path: 'visualize_runner.py', content: Buffer.from(RUNNER, 'utf8') },
    ]);

    const command = await sandbox.runCommand('python3', ['visualize_runner.py']);
    const [output, error] = await Promise.all([command.stdout(), command.stderr()]);
    if (command.exitCode !== 0) {
      console.error('Visualization runner error:', error.slice(0, 1000));
      return res.status(422).json({ message: 'Python 실행 과정을 추적하지 못했습니다.' });
    }

    return res.status(200).json(JSON.parse(output));
  } catch (error) {
    console.error('Visualization sandbox error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({
      message: '격리 실행 환경을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.',
    });
  } finally {
    if (sandbox) {
      try {
        await sandbox.stop();
      } catch (error) {
        console.error('Visualization sandbox cleanup error:', error instanceof Error ? error.message : String(error));
      }
    }
  }
}
