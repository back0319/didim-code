import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: typeof window === 'undefined' && process.env.NODE_ENV === 'production' ? 'my-app-db' : 'localhost',
  database: 'postgres',
  password: 'root',
  port: 5432,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { submission_id } = req.query;

    if (!submission_id) {
      return res.status(400).json({ message: 'submission_id가 필요합니다.' });
    }

    console.log('피드백 조회:', submission_id);

    const query = `
      SELECT id, type, title, message, severity, code_suggestion, priority, created_at
      FROM feedbacks
      WHERE submission_id = $1
      ORDER BY priority ASC, created_at ASC
    `;

    const result = await pool.query(query, [submission_id]);

    res.status(200).json({
      submission_id: parseInt(submission_id as string),
      feedback: result.rows
    });

  } catch (error) {
    console.error('피드백 조회 오류:', error);
    res.status(500).json({ 
      message: '피드백 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
