import React, { useState, useEffect } from 'react';

interface VisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  inputData?: string;
}

interface Step {
  line: number;
  operation: string;
  variables: Record<string, any>;
  output?: string;
  stack_frames?: any[];
  globals_vars?: Record<string, any>;
}

interface VisualizationData {
  steps: Step[];
  code_lines: string[];
}

const VisualizationModal: React.FC<VisualizationModalProps> = ({
  isOpen,
  onClose,
  code,
  inputData = ''
}) => {
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 시각화 데이터 가져오기
  useEffect(() => {
    if (isOpen && code) {
      generateVisualization();
    }
  }, [isOpen, code, inputData]);

  // 자동 재생
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && visualizationData && currentStep < visualizationData.steps.length - 1) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= visualizationData.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, visualizationData, currentStep]);

  const generateVisualization = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: 'python',
          input_data: inputData
        })
      });

      if (!response.ok) {
        throw new Error('시각화 생성 실패');
      }

      const data = await response.json();
      setVisualizationData(data);
      setCurrentStep(0);
    } catch (error) {
      console.error('Visualization error:', error);
      setError('시각화 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 스텝의 변수 추출
  const getCurrentVariables = () => {
    if (!visualizationData || currentStep >= visualizationData.steps.length) {
      return {};
    }
    return visualizationData.steps[currentStep].variables || {};
  };

  // 현재 스텝의 함수/제어문 추출
  const getCurrentFunctions = () => {
    if (!visualizationData || currentStep >= visualizationData.steps.length) {
      return [];
    }
    const step = visualizationData.steps[currentStep];
    const functions: string[] = [];

    if (step.stack_frames && step.stack_frames.length > 0) {
      step.stack_frames.forEach((frame: any) => {
        if (frame.func_name && frame.func_name !== '<module>') {
          functions.push(`함수: ${frame.func_name}`);
        }
      });
    }

    // 현재 라인에서 제어문 감지
    if (visualizationData.code_lines[step.line - 1]) {
      const line = visualizationData.code_lines[step.line - 1].trim();
      if (line.startsWith('if ')) functions.push('조건문: if');
      if (line.startsWith('for ')) functions.push('반복문: for');
      if (line.startsWith('while ')) functions.push('반복문: while');
      if (line.startsWith('def ')) functions.push(`함수 정의: ${line.split('(')[0].replace('def ', '')}`);
    }

    return functions.length > 0 ? functions : ['메인 실행'];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full m-4 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">코드 시각화</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 로딩/에러 상태 */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">시각화 생성 중...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-red-600">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* 메인 컨텐츠 */}
        {!isLoading && !error && visualizationData && (
          <>
            {/* 3분할 레이아웃 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 1. 변수 칸 */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                  <h3 className="font-semibold text-blue-900">변수</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {Object.keys(getCurrentVariables()).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(getCurrentVariables()).map(([name, value]) => (
                        <div key={name} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <span className="font-mono font-semibold text-blue-900">{name}</span>
                            <span className="text-xs text-blue-600 ml-2">{typeof value}</span>
                          </div>
                          <div className="mt-2 font-mono text-sm text-gray-700 break-all">
                            {JSON.stringify(value, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 mt-8">
                      변수 없음
                    </div>
                  )}
                </div>
              </div>

              {/* 2. 함수/제어문 칸 */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                  <h3 className="font-semibold text-green-900">함수 / 제어문</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {getCurrentFunctions().length > 0 ? (
                    <div className="space-y-2">
                      {getCurrentFunctions().map((func, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            <span className="font-mono text-sm text-green-900">{func}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 mt-8">
                      제어 구조 없음
                    </div>
                  )}
                </div>
              </div>

              {/* 3. 코드 칸 (하이라이트) */}
              <div className="w-1/3 flex flex-col">
                <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
                  <h3 className="font-semibold text-purple-900">코드</h3>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-900">
                  <div className="font-mono text-sm">
                    {visualizationData.code_lines.map((line, index) => {
                      const lineNumber = index + 1;
                      const isCurrentLine = visualizationData.steps[currentStep]?.line === lineNumber;
                      
                      return (
                        <div
                          key={index}
                          className={`flex ${isCurrentLine ? 'bg-yellow-400 bg-opacity-30' : ''}`}
                        >
                          <div className={`w-12 flex-shrink-0 text-right pr-4 py-1 select-none ${
                            isCurrentLine ? 'text-yellow-300 font-bold' : 'text-gray-500'
                          }`}>
                            {lineNumber}
                          </div>
                          <div className={`flex-1 py-1 pr-4 ${
                            isCurrentLine ? 'text-gray-900 font-semibold' : 'text-gray-300'
                          }`}>
                            {line || ' '}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 컨트롤 바 */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentStep(0)}
                    disabled={currentStep === 0}
                    className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="처음으로"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="이전"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                    title={isPlaying ? '일시정지' : '재생'}
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => setCurrentStep(Math.min(visualizationData.steps.length - 1, currentStep + 1))}
                    disabled={currentStep >= visualizationData.steps.length - 1}
                    className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="다음"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setCurrentStep(visualizationData.steps.length - 1)}
                    disabled={currentStep >= visualizationData.steps.length - 1}
                    className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="마지막으로"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                    </svg>
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  Step {currentStep + 1} / {visualizationData.steps.length}
                </div>
              </div>

              {/* 프로그레스 바 */}
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / visualizationData.steps.length) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VisualizationModal;
