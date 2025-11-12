import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../../components/Layout';
import CodeRunner from '../../components/CodeRunner';
import Feedback from '../../components/Feedback';

// Monaco Editor를 동적으로 로드 (SSR 이슈 방지)
const MonacoEditor = dynamic(() => import('../../components/MonacoEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">에디터 로딩 중...</div>
    </div>
  ),
});

// 시각화 컴포넌트를 동적으로 로드
const CodeVisualization = dynamic(() => import('../../components/CodeVisualization'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">시각화 로딩 중...</div>
    </div>
  ),
});

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  paradigms: string[];
  expected_complexity: string;
  input?: string;
  output?: string;
  input_examples?: string[];
  output_examples?: string[];
  example_explanation?: string;
}

interface Solution {
  id: number;
  type: string;
  code: string;
  complexity: string;
  explanation: string;
}

interface Feedback {
  id: number;
  type: string;
  title: string;
  message: string;
  code_suggestion?: string;
  severity: 'info' | 'warning' | 'error';
}

interface SubmissionResult {
  id: number;
  verdict: string;
  execution_time: number;
  memory_usage: number;
  feedback: Feedback[];
}

interface ProblemSolvePageProps {
  problem: Problem | null;
  solutions: Solution[];
}

export default function ProblemSolvePage({ problem, solutions }: ProblemSolvePageProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 시각화 관련 state
  const [showVisualization, setShowVisualization] = useState(false);
  const [inputForVisualization, setInputForVisualization] = useState('');
  
  // 시각화 데이터 공유를 위한 상태 (타입 명시)
  const [visualizationData, setVisualizationData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 코드 실행 관련 state
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    memoryUsage?: number;
  } | null>(null);

  // 파이썬 코드 템플릿
  const codeTemplate = `def solution():
    # 여기에 코드를 작성하세요
    # 문제: ${problem?.title || ''}
    # 예상 복잡도: ${problem?.expected_complexity || 'O(n)'}
    # 적용 패러다임: ${problem?.paradigms?.join(', ') || ''}
    pass

# 예시 실행
print(solution())`;

  useEffect(() => {
    if (problem) {
      setCode(codeTemplate);
    }
  }, [problem]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('코드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setIsAnalyzing(false);
    
    try {
      // 1. 코드 제출 및 채점
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem_id: problem?.id,
          code: code,
          language: 'python'
        })
      });

      if (!response.ok) {
        throw new Error('제출에 실패했습니다.');
      }

      const result = await response.json();
      
      // 2. 기본 채점 결과 표시
      setSubmissionResult({
        id: result.submission_id,
        verdict: result.verdict || 'Pending',
        execution_time: result.execution_time || 0,
        memory_usage: result.memory_usage || 0,
        feedback: []
      });

      // 3. 분석 시작 (백그라운드)
      if (result.verdict === 'Accepted') {
        setIsAnalyzing(true);
        await analyzeCode(result.submission_id);
      }

    } catch (error) {
      console.error('제출 오류:', error);
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const analyzeCode = async (submissionId: number) => {
    try {
      const response = await fetch(`/api/analyze/${submissionId}`, {
        method: 'GET'
      });

      if (response.ok) {
        const analysisResult = await response.json();
        setSubmissionResult(prev => prev ? {
          ...prev,
          feedback: analysisResult.feedback || []
        } : null);
      }
    } catch (error) {
      console.error('분석 오류:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRun = async () => {
    if (!code.trim()) {
      alert('코드를 입력해주세요.');
      return;
    }

    setIsRunning(true);
    setRunResult(null);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: 'python',
          input_data: inputForVisualization  // 시각화와 동일한 입력 데이터 사용
        })
      });

      if (!response.ok) {
        throw new Error('코드 실행에 실패했습니다.');
      }

      const result = await response.json();
      setRunResult({
        success: result.success || false,
        output: result.output || '',
        error: result.error || '',
        executionTime: result.execution_time || 0,
        memoryUsage: result.memory_usage || 0
      });

    } catch (error) {
      console.error('실행 오류:', error);
      setRunResult({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (!problem) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">문제를 찾을 수 없습니다</h1>
            <button 
              onClick={() => router.push('/problems')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              문제 목록으로 돌아가기
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/problems')}
              className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              문제 목록으로 돌아가기
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {problem.id}. {problem.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* 문제 설명 패널 */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-lg p-6 min-h-[36rem]">
              {!showVisualization ? (
                <div className="space-y-6">
                  {/* 헤더와 시각화 버튼 */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">문제 설명</h3>
                    <button
                      onClick={() => setShowVisualization(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>시각화</span>
                    </button>
                  </div>

                  {/* 문제 설명 */}
                  <div>
                    <div className="text-gray-700 whitespace-pre-line">
                      {problem.description}
                    </div>
                  </div>

                  {/* 입출력 예시 */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">입출력 예시</h4>
                    
                    {/* 예시가 있는 경우 */}
                    {problem.input_examples && problem.output_examples && 
                     problem.input_examples.length > 0 && problem.output_examples.length > 0 ? (
                      <div className="space-y-4">
                        {problem.input_examples.map((input, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                              <span className="font-semibold text-gray-700">예시 {index + 1}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                              <div className="p-4">
                                <div className="text-sm font-medium text-gray-600 mb-2">입력</div>
                                <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto">
                                  {input}
                                </pre>
                              </div>
                              <div className="p-4">
                                <div className="text-sm font-medium text-gray-600 mb-2">출력</div>
                                <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto">
                                  {problem.output_examples?.[index] || ''}
                                </pre>
                              </div>
                            </div>
                            {problem.example_explanation && (
                              <div className="bg-blue-50 px-4 py-3 border-t border-gray-200">
                                <div className="text-sm font-medium text-blue-800 mb-1">설명</div>
                                <div className="text-sm text-blue-700">
                                  {problem.example_explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* 데이터베이스의 input/output 컬럼 사용 */
                      <div className="space-y-4">
                        {problem.input && problem.output ? (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                              <span className="font-semibold text-gray-700">예시</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                              <div className="p-4">
                                <div className="text-sm font-medium text-gray-600 mb-2">입력</div>
                                <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-line">
                                  {problem.input}
                                </pre>
                              </div>
                              <div className="p-4">
                                <div className="text-sm font-medium text-gray-600 mb-2">출력</div>
                                <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-line">
                                  {problem.output}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* 입출력 데이터가 없는 경우 */
                          <div className="text-center text-gray-500 py-8">
                            입출력 예시가 준비되지 않았습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 시각화 모드 */
                <div className="space-y-4">
                  {/* 시각화 헤더 */}
                  <div className="flex items-center justify-between ">
                    <h3 className="text-lg font-semibold text-gray-900">코드 시각화</h3>
                    <button
                      onClick={() => setShowVisualization(false)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>문제 설명</span>
                    </button>
                  </div>

                  {/* 변수 상태 및 현재 실행 정보 */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <CodeVisualization
                      code={code}
                      language="python"
                      inputData={inputForVisualization}
                      mode="variables-only"
                      externalVisualizationData={visualizationData}
                      externalCurrentStep={currentStep}
                      onVisualizationDataChange={setVisualizationData}
                      onCurrentStepChange={setCurrentStep}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 코드 에디터 패널 또는 코드 실행 시각화 패널 */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 min-h-[36rem]">
              {!showVisualization ? (
                /* 일반 코드 에디터 모드 */
                <div className="space-y-4">
                  {/* 제목 */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">코드 에디터 (Python)</h3>
                    <div className="text-sm text-gray-500">
                      Ctrl+Enter로 실행, Ctrl+S로 저장
                    </div>
                  </div>

                  {/* Monaco Editor */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <MonacoEditor
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      language="python"
                      theme="vs-dark"
                      height="500px"
                      fontSize={14}
                      minimap={false}
                      wordWrap="on"
                    />
                  </div>

                  {/* 입력 데이터 설정 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      입력 데이터 (각 줄마다 한 입력값)
                    </label>
                    <textarea
                      value={inputForVisualization}
                      onChange={(e) => setInputForVisualization(e.target.value)}
                      placeholder="예: 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      rows={2}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      input()을 사용하는 코드의 경우, 여기에 입력값을 작성하세요.
                    </p>
                  </div>

                  {/* 실행 버튼들 */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleRun}
                      disabled={isRunning}
                      className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isRunning ? '실행 중...' : '실행'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? '제출 중...' : '제출'}
                    </button>
                  </div>
                </div>
              ) : (
                /* 시각화 모드 - 코드 실행 부분 */
                <CodeVisualization
                  code={code}
                  language="python"
                  inputData={inputForVisualization}
                  mode="code-execution"
                  externalVisualizationData={visualizationData}
                  externalCurrentStep={currentStep}
                  onVisualizationDataChange={setVisualizationData}
                  onCurrentStepChange={setCurrentStep}
                />
              )}
            </div>

            {/* 실행 결과패널 */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
              <CodeRunner
                onRun={handleRun}
                isRunning={isRunning}
                result={runResult}
              />
            </div>

            {/* 피드백 패널 */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-lg overflow-hidden">
              <Feedback
                onRun={handleRun}
                isRunning={isRunning}
                result={runResult}
              />
            </div>

          

            {/* 제출 결과 및 피드백 표시 */}
            {submissionResult && (
              <div className="lg:col-span-5 bg-white rounded-lg shadow-lg p-6 space-y-4">
                {/* 기본 채점 결과 */}
                <div className={`p-4 rounded-lg ${
                  submissionResult.verdict === 'Accepted' 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {submissionResult.verdict === 'Accepted' ? (
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="font-medium">{submissionResult.verdict}</span>
                    </div>
                    <div className="text-sm">
                      <span className="mr-4">시간: {submissionResult.execution_time}ms</span>
                      <span>메모리: {submissionResult.memory_usage}KB</span>
                    </div>
                  </div>
                </div>

                {/* 분석 진행 중 표시 */}
                {isAnalyzing && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                      <span>코드 분석 중...</span>
                    </div>
                  </div>
                )}

                {/* AI 피드백 카드들 */}
                {submissionResult.feedback.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">AI 분석 결과</h4>
                    {submissionResult.feedback.map((feedback, index) => (
                      <FeedbackCard key={index} feedback={feedback} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// 피드백 카드 컴포넌트
function FeedbackCard({ feedback }: { feedback?: Feedback }) {
  if (!feedback) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return (
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getSeverityColor(feedback.severity)}`}>
      <div className="flex items-start">
        {getSeverityIcon(feedback.severity)}
        <div className="flex-1">
          <h5 className="font-medium mb-2">{feedback.title}</h5>
          <p className="text-sm mb-3">{feedback.message}</p>
          {feedback.code_suggestion && (
            <div>
              <h6 className="font-medium text-sm mb-2">개선 제안:</h6>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                {feedback.code_suggestion}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  try {
    // API 함수를 직접 import하여 사용
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      user: 'postgres',
      host: process.env.NODE_ENV === 'production' ? 'my-app-db' : 'localhost',
      database: 'postgres',
      password: 'root',
      port: 5432,
    });

    const query = `
      SELECT 
        id, title, description, difficulty, category,
        paradigms, expected_complexity, input, output
      FROM problems 
      WHERE id = $1
    `;

    const solutionsQuery = `
      SELECT 
        id, type, code, complexity, explanation
      FROM exemplars 
      WHERE problem_id = $1
      ORDER BY 
        CASE 
          WHEN type = 'optimal' THEN 1
          WHEN type = 'naive' THEN 2
          ELSE 3
        END
    `;

    const [problemResult, solutionsResult] = await Promise.all([
      pool.query(query, [id]),
      pool.query(solutionsQuery, [id])
    ]);
    
    await pool.end();
    
    if (problemResult.rows.length === 0) {
      return {
        props: {
          problem: null,
          solutions: []
        }
      };
    }

    const problem = {
      id: problemResult.rows[0].id,
      title: problemResult.rows[0].title,
      description: problemResult.rows[0].description,
      difficulty: problemResult.rows[0].difficulty as 'Easy' | 'Medium' | 'Hard',
      category: problemResult.rows[0].category || '',
      paradigms: problemResult.rows[0].paradigms || [],
      expected_complexity: problemResult.rows[0].expected_complexity || 'O(n)',
      input: problemResult.rows[0].input || '',
      output: problemResult.rows[0].output || ''
    };

    const solutions = solutionsResult.rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      code: row.code,
      complexity: row.complexity,
      explanation: row.explanation || ''
    }));

    return {
      props: {
        problem,
        solutions
      }
    };
  } catch (error) {
    console.error('Error fetching problem:', error);
    
    return {
      props: {
        problem: null,
        solutions: []
      }
    };
  }
};