import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// PostgreSQL 연결 설정
const pool = new Pool({
  user: 'postgres',
  host: process.env.NODE_ENV === 'production' ? 'my-app-db' : 'localhost', // 도커에서는 컨테이너 이름 사용
  database: 'postgres',
  password: 'root',
  port: 5432,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('API 호출됨 - DB 연결 시도 중...');
    
    // 먼저 간단한 쿼리로 연결 테스트
    const testResult = await pool.query('SELECT NOW()');
    console.log('DB 연결 성공:', testResult.rows[0]);

    // submissions 테이블이 존재하는지 확인
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('problems', 'submissions')
    `);
    console.log('존재하는 테이블:', tableCheck.rows);

    // 새로운 스키마에 맞는 problems 쿼리
    const simpleQuery = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.difficulty,
        p.paradigms,
        p.expected_complexity
      FROM problems p
      ORDER BY p.id
    `;

    console.log('쿼리 실행 중...');
    const result = await pool.query(simpleQuery);
    console.log('쿼리 결과:', result.rows.length, '개 문제 발견');
    
    // DB 결과를 frontend interface에 맞게 변환
    const problems = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty as 'Easy' | 'Medium' | 'Hard',
      category: row.paradigms ? row.paradigms.join(', ') : 'Algorithm', // paradigms 배열을 문자열로 변환
      solved: false, // 현재는 사용자 로그인 없이 기본값
      acceptance_rate: Math.floor(Math.random() * 80) + 20 // 임시로 랜덤 정답률
    }));

    console.log('변환된 문제 데이터:', problems.length, '개');
    res.status(200).json(problems);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}