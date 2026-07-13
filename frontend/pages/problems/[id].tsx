import { useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../../components/Layout';
import CodeRunner from '../../components/CodeRunner';
import Feedback from '../../components/Feedback';
import { getExemplarsByProblemId, getProblemById, getProblems } from '../../lib/catalog';

// Monaco Editor를 동적으로 로드 (SSR 이슈 방지)
const MonacoEditor = dynamic(() => import('../../components/MonacoEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">에디터 로딩 중...</div>
    </div>
  ),
});

// 시각화 모달 컴포넌트를 동적으로 로드
const VisualizationModal = dynamic(() => import('../../components/VisualizationModal'), {
  ssr: false,
  loading: () => null,
});

interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  paradigms: string[];
  expected_complexity: string;
  test_cases?: TestCase[];
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

const CODE_TEMPLATE = `def solution():
    # 여기에 코드를 작성하세요
    pass

# 예시 실행
print(solution())`;

export default function ProblemSolvePage({ problem, solutions }: ProblemSolvePageProps) {
  const router = useRouter();
  const [code, setCode] = useState(CODE_TEMPLATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 시각화 모달 관련 state
  const [isVisualizationModalOpen, setIsVisualizationModalOpen] = useState(false);
  const [inputForVisualization, setInputForVisualization] = useState('');
  
  // 코드 실행 관련 state
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    memoryUsage?: number;
  } | null>(null);

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
    setIsAnalyzing(true);
    
    try {
      // 1. 먼저 사용자 입력 데이터로 코드 실행하여 실행 결과 표시
      try {
        const runResponse = await fetch('/api/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            language: 'python',
            input_data: inputForVisualization
          })
        });

        if (runResponse.ok) {
          const runData = await runResponse.json();
          setRunResult({
            success: runData.success || false,
            output: runData.output || '',
            error: runData.error || '',
            executionTime: runData.execution_time || 0,
            memoryUsage: runData.memory_usage || 0
          });
        }
      } catch (runError) {
        console.error('실행 오류:', runError);
        // 실행 실패해도 제출은 계속 진행
      }

      // 2. 코드 제출 및 채점
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
      
      // 3. 기본 채점 결과 표시
      setSubmissionResult({
        id: result.submission_id,
        verdict: result.verdict || 'Pending',
        execution_time: result.execution_time || 0,
        memory_usage: result.memory_usage || 0,
        feedback: result.feedback || []
      });

      // 4. 피드백이 생성 중이면 폴링 시작
      if (result.feedback_pending) {
        pollFeedback(result.submission_id);
      } else {
        setIsAnalyzing(false);
      }

    } catch (error) {
      console.error('제출 오류:', error);
      setIsAnalyzing(false);
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollFeedback = async (submissionId: number, maxAttempts: number = 15) => {
    let attempts = 0;
    
    const poll = async () => {
      try {
        console.log(`피드백 폴링 시도 ${attempts + 1}/${maxAttempts}:`, submissionId);
        const response = await fetch(`/api/feedback/${submissionId}`);
        
        console.log('피드백 응답 상태:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('피드백 데이터:', result);
          
          if (result.feedback && result.feedback.length > 0) {
            // 피드백이 도착함
            console.log('피드백 수신 완료:', result.feedback.length, '개');
            setSubmissionResult(prev => {
              const updated = prev ? {
                ...prev,
                feedback: result.feedback
              } : null;
              console.log('업데이트된 submissionResult:', updated);
              return updated;
            });
            setIsAnalyzing(false);
            return;
          } else {
            console.log('피드백이 아직 비어있음');
          }
        } else {
          console.log('피드백 응답 실패:', await response.text());
        }
        
        // 피드백이 아직 없으면 재시도
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // 2초 후 재시도
        } else {
          console.log('피드백 폴링 타임아웃');
          setIsAnalyzing(false);
        }
        
      } catch (error) {
        console.error('피드백 조회 오류:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setIsAnalyzing(false);
        }
      }
    };
    
    // 첫 시도는 3초 후에 (GPT 응답 대기)
    setTimeout(poll, 3000);
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
              <div className="space-y-6">
                {/* 헤더와 시각화 버튼 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">문제 설명</h3>
                  <button
                    onClick={() => setIsVisualizationModalOpen(true)}
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
                  
                  {problem.test_cases && problem.test_cases.length > 0 ? (
                    /* test_cases 배열 사용 (새로운 방식) - 최대 2개만 표시 */
                    <div className="space-y-4">
                      {problem.test_cases.slice(0, 2).map((testCase, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <span className="font-semibold text-gray-700">예시 {index + 1}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                            <div className="p-4">
                              <div className="text-sm font-medium text-gray-600 mb-2">입력</div>
                              <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                {testCase.input}
                              </pre>
                            </div>
                            <div className="p-4">
                              <div className="text-sm font-medium text-gray-600 mb-2">출력</div>
                              <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                {testCase.output}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : problem.input_examples && problem.output_examples && 
                   problem.input_examples.length > 0 && problem.output_examples.length > 0 ? (
                    /* input_examples 배열이 있을 때 (이전 방식) */
                    <div className="space-y-4">
                      {problem.input_examples.map((input, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <span className="font-semibold text-gray-700">예시 {index + 1}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                            <div className="p-4">
                              <div className="text-sm font-medium text-gray-600 mb-2">입력</div>
                              <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                {input}
                              </pre>
                            </div>
                            <div className="p-4">
                              <div className="text-sm font-medium text-gray-600 mb-2">출력</div>
                              <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                {problem.output_examples?.[index] || ''}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : problem.input && problem.output ? (
                    /* 데이터베이스의 input/output 컬럼 사용 (레거시) */
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <span className="font-semibold text-gray-700">예시</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                          <div className="p-4">
                            <div className="text-sm font-medium text-gray-600 mb-2">입력</div>
                            <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {problem.input}
                            </pre>
                          </div>
                          <div className="p-4">
                            <div className="text-sm font-medium text-gray-600 mb-2">출력</div>
                            <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {problem.output}
                            </pre>
                          </div>
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
              </div>
            </div>

            {/* 코드 에디터 패널 */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 min-h-[36rem]">
              <div className="space-y-4">
                {/* 제목 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">코드 에디터 (Python)</h3>
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
                aiFeedback={submissionResult?.feedback}
                isAnalyzing={isAnalyzing}
                submissionVerdict={submissionResult?.verdict}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 시각화 모달 */}
      <VisualizationModal
        isOpen={isVisualizationModalOpen}
        onClose={() => setIsVisualizationModalOpen(false)}
        code={code}
        inputData={inputForVisualization}
      />
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getProblems().map((problem) => ({ params: { id: String(problem.id) } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<ProblemSolvePageProps> = async (context) => {
  const id = Number(context.params?.id);
  const problem = getProblemById(id);
  const solutions = getExemplarsByProblemId(id).map((solution) => ({
    id: solution.id,
    type: solution.type,
    code: solution.code,
    complexity: solution.complexity,
    explanation: solution.explanation || '',
  }));

  return {
    props: { problem, solutions },
  };
};
