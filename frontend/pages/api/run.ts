import { NextApiRequest, NextApiResponse } from 'next';

interface RunRequest {
  code: string;
  language: string;
  input_data?: string;
}

interface RunResponse {
  success: boolean;
  output?: string;
  error?: string;
  execution_time?: number;
  memory_usage?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<RunResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { code, language, input_data }: RunRequest = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: '코드와 언어를 입력해주세요.'
      });
    }

    if (language !== 'python') {
      return res.status(400).json({
        success: false,
        error: '현재 Python만 지원됩니다.'
      });
    }

    // 백엔드 API 호출
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'http://backend:8000' 
      : 'http://localhost:8000';

    console.log('Calling backend API:', `${backendUrl}/api/run`);

    const response = await fetch(`${backendUrl}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language,
        input_data: input_data || ''
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Backend response:', result);
    
    res.status(200).json({
      success: result.success || false,
      output: result.output || '',
      error: result.error || '',
      execution_time: result.execution_time || 0,
      memory_usage: result.memory_usage || 0
    });

  } catch (error) {
    console.error('Code execution error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    });
  }
}