import { NextApiRequest, NextApiResponse } from 'next';
import { getProblems } from '../../lib/catalog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const problems = (await getProblems()).map((problem) => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      category: problem.category,
      solved: false,
      acceptance_rate: 0,
    }));

    return res.status(200).json(problems);
  } catch (error) {
    console.error('Problems API error:', error instanceof Error ? error.message : String(error));
    return res.status(503).json({ message: '문제 목록을 불러오지 못했습니다.' });
  }
}
