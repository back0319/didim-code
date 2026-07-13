import { NextApiRequest, NextApiResponse } from 'next';
import { getProblems } from '../../lib/catalog';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const problems = getProblems().map((problem) => ({
    id: problem.id,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    category: problem.category,
    paradigms: problem.paradigms,
    expected_complexity: problem.expected_complexity,
    solved: false,
    acceptance_rate: 0,
  }));

  return res.status(200).json(problems);
}
