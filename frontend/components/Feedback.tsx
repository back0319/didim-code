import React, { useState } from 'react';

interface FeedbackProps {
  onRun: (code: string) => Promise<any>;
  isRunning: boolean;
  result?: {
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    memoryUsage?: number;
  } | null;
}

const Feedback: React.FC<FeedbackProps> = ({ onRun, isRunning, result }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatExecutionTime = (time?: number) => {
    if (!time) return 'N/A';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const formatMemoryUsage = (memory?: number) => {
    if (!memory) return 'N/A';
    if (memory < 1024) return `${memory}B`;
    if (memory < 1024 * 1024) return `${(memory / 1024).toFixed(2)}KB`;
    return `${(memory / (1024 * 1024)).toFixed(2)}MB`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* 실행 결과 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">피드백</h3>
          {result && (
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                result.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? '성공' : '실패'}
              </span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showDetails ? '간단히 보기' : '자세히 보기'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 결과가 없을 때 */}
      {!isRunning && !result && (
        <div className="px-4 py-8 text-center text-gray-500">
          피드백이 여기에 표시됩니다.
        </div>
      )}
    </div>
  );
};

export default Feedback;