import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// PostgreSQL 연결 설정
const pool = new Pool({
  user: 'postgres',
  host: process.env.NODE_ENV === 'production' ? 'my-app-db' : 'localhost',
  database: 'postgres',
  password: 'root',
  port: 5432,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { problem_id, code, language } = req.body;

    if (!problem_id || !code || !language) {
      return res.status(400).json({ message: '필수 파라미터가 누락되었습니다.' });
    }

    console.log('코드 제출 요청:', { problem_id, language, code_length: code.length });

    // 1. 백엔드 실행 API 호출 (채점) - 동기식 엔드포인트 사용
    // 서버 사이드에서는 Docker 네트워크 내부 URL 사용
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8000';
    console.log('백엔드 URL:', backendUrl);
    
    const executeResponse = await fetch(`${backendUrl}/api/judge/submit-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem_id: problem_id.toString(),
        source_code: code,
        language
      })
    });

    if (!executeResponse.ok) {
      const errorText = await executeResponse.text();
      console.error('백엔드 실행 오류:', errorText);
      return res.status(500).json({ 
        message: '코드 실행 중 오류가 발생했습니다.',
        error: errorText 
      });
    }

    const executeResult = await executeResponse.json();
    console.log('백엔드 실행 결과:', executeResult);

    // 2. DB에 제출 기록 저장
    const insertQuery = `
      INSERT INTO submissions (
        problem_id,
        user_id,
        code,
        language,
        verdict,
        execution_time,
        memory_usage,
        submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;

    const dbResult = await pool.query(insertQuery, [
      problem_id,
      1, // 임시 user_id
      code,
      language,
      executeResult.verdict || 'Pending',
      Math.round((executeResult.execution_time || 0) * 1000), // ms로 변환 및 정수화
      Math.round(executeResult.memory_usage || 0) // 정수화
    ]);

    const submissionId = dbResult.rows[0].id;
    console.log('제출 기록 저장 완료, ID:', submissionId);

    // 3. 응답 반환
    res.status(200).json({
      submission_id: submissionId,
      verdict: executeResult.verdict,
      execution_time: executeResult.execution_time,
      memory_usage: executeResult.memory_usage,
      output: executeResult.output,
      error: executeResult.error,
      test_results: executeResult.test_results
    });

  } catch (error) {
    console.error('제출 처리 오류:', error);
    res.status(500).json({ 
      message: '제출 처리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
