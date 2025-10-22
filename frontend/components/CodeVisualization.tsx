import React, { useState, useEffect, useRef } from 'react';

interface Step {
  line: number;
  operation: string;
  variables: Record<string, any>;
  output?: string;
  description?: string;
}

interface VisualizationData {
  steps: Step[];
  code_lines: string[];
  complexity_info?: {
    time_complexity: string;
    space_complexity: string;
    explanation: string;
  };
}

interface CodeVisualizationProps {
  code: string;
  language?: string;
  inputData?: string;
  onClose?: () => void;
  mode?: 'full' | 'code-execution' | 'variables-only';
}

const CodeVisualization: React.FC<CodeVisualizationProps> = ({ 
  code, 
  language = 'python', 
  inputData = '',
  onClose,
  mode = 'full'
}) => {
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // milliseconds
  const [error, setError] = useState<string | null>(null);
  const [variableColors, setVariableColors] = useState<Record<string, string>>({});
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const variablesContainerRef = useRef<HTMLDivElement>(null);

  // 변수별 색상 배열
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#AED6F1', '#A9DFBF', '#F5B7B1', '#D7BDE2'
  ];

  // 코드에서 모든 변수를 추출하는 함수
  const extractVariablesFromCode = (code: string): string[] => {
    const variables = new Set<string>();
    const lines = code.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      
      // 1. 할당문에서 변수 추출
      const assignmentPatterns = [
        /^(\s*)([a-zA-Z_]\w*)\s*=\s*[^=]/, // 기본 할당: a = 1
        /^(\s*)([a-zA-Z_]\w*),\s*([a-zA-Z_]\w*)\s*=/, // 다중 할당: a, b = 1, 2
        /([a-zA-Z_]\w*)\s*\+=|([a-zA-Z_]\w*)\s*\*=|([a-zA-Z_]\w*)\s*\-=|([a-zA-Z_]\w*)\s*\/=/, // 복합 할당
      ];
      
      assignmentPatterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          for (let i = 1; i < match.length; i++) {
            const varName = match[i]?.trim();
            if (varName && /^[a-zA-Z_]\w*$/.test(varName) && varName !== 'def' && varName !== 'for' && varName !== 'if' && varName !== 'while') {
              variables.add(varName);
            }
          }
        }
      });
      
      // 2. for 루프에서 변수 추출
      const forPatterns = [
        /for\s+([a-zA-Z_]\w*)\s+in/, // for i in range()
        /for\s+([a-zA-Z_]\w*),\s*([a-zA-Z_]\w*)\s+in/, // for i, j in enumerate()
      ];
      
      forPatterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          for (let i = 1; i < match.length; i++) {
            const varName = match[i]?.trim();
            if (varName && /^[a-zA-Z_]\w*$/.test(varName)) {
              variables.add(varName);
            }
          }
        }
      });
      
      // 3. 함수 정의에서 매개변수 추출
      const funcMatch = line.match(/def\s+\w+\s*\(([^)]*)\)/);
      if (funcMatch && funcMatch[1]) {
        const params = funcMatch[1].split(',');
        params.forEach(param => {
          const varName = param.trim().split('=')[0].trim();
          if (varName && /^[a-zA-Z_]\w*$/.test(varName)) {
            variables.add(varName);
          }
        });
      }
      
      // 4. with 구문에서 변수 추출
      const withMatch = line.match(/with\s+[^as]*\s+as\s+([a-zA-Z_]\w*)/);
      if (withMatch) {
        variables.add(withMatch[1]);
      }
      
      // 5. except 구문에서 변수 추출
      const exceptMatch = line.match(/except\s+\w+\s+as\s+([a-zA-Z_]\w*)/);
      if (exceptMatch) {
        variables.add(exceptMatch[1]);
      }
      
      // 6. 일반적인 변수 사용 패턴 (함수 호출, 인덱싱 등에서)
      const usagePatterns = [
        /([a-zA-Z_]\w*)\[/, // 배열 인덱싱: arr[0]
        /([a-zA-Z_]\w*)\./, // 속성 접근: obj.method()
        /print\s*\(\s*([a-zA-Z_]\w*)\s*\)/, // print(variable)
      ];
      
      usagePatterns.forEach(pattern => {
        const matches = Array.from(line.matchAll(new RegExp(pattern.source, 'g')));
        for (const match of matches) {
          const varName = match[1]?.trim();
          if (varName && /^[a-zA-Z_]\w*$/.test(varName) &&
              !['print', 'input', 'len', 'range', 'sum', 'max', 'min', 'int', 'str', 'float', 'list', 'dict', 'set'].includes(varName)) {
            variables.add(varName);
          }
        }
      });
    });
    
    return Array.from(variables).sort();
  };

  useEffect(() => {
    if (code) {
      generateVisualization();
      // 코드가 변경될 때마다 변수 추출
      extractAndColorAllVariables();
    }
  }, [code, inputData]);

  useEffect(() => {
    if (visualizationData) {
      extractAndColorAllVariables();
    }
  }, [visualizationData]);

  // 변수에 색상 할당
  const assignVariableColor = (varName: string): string => {
    if (variableColors[varName]) {
      return variableColors[varName];
    }
    
    const usedColors = Object.values(variableColors);
    const availableColors = colors.filter(color => !usedColors.includes(color));
    const selectedColor = availableColors.length > 0 ? availableColors[0] : colors[Object.keys(variableColors).length % colors.length];
    
    setVariableColors(prev => ({
      ...prev,
      [varName]: selectedColor
    }));
    
    return selectedColor;
  };

  // 전체 코드에서 변수 추출 및 색상 할당
  const extractAndColorAllVariables = () => {
    if (!code) return;

    // 코드에서 모든 변수 추출
    const extractedVariables = extractVariablesFromCode(code);
    
    // 시각화 데이터에서도 변수 수집
    const allVariables = new Set(extractedVariables);
    
    if (visualizationData) {
      visualizationData.steps.forEach(step => {
        Object.keys(step.variables).forEach(varName => {
          allVariables.add(varName);
        });
      });
    }

    // 각 변수에 색상 할당
    const newColors: Record<string, string> = {};
    Array.from(allVariables).forEach((varName, index) => {
      newColors[varName] = colors[index % colors.length];
    });
    
    setVariableColors(newColors);
  };

  // 현재 실행 중인 줄에서만 변수를 하이라이트
  const highlightCurrentLineVariables = (codeLine: string, currentLineIndex: number, currentStepLine: number): JSX.Element => {
    // 현재 실행 중인 줄이 아니면 일반 텍스트로 표시
    if (currentLineIndex + 1 !== currentStepLine) {
      return <span>{codeLine}</span>;
    }

    const allVariableNames = Object.keys(variableColors);
    
    if (allVariableNames.length === 0) {
      return <span>{codeLine}</span>;
    }

    interface Match {
      start: number;
      end: number;
      varName: string;
      color: string;
    }

    const matches: Match[] = [];
    
    // 각 변수에 대해 매칭 찾기
    allVariableNames.forEach(varName => {
      const color = variableColors[varName];
      const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedVarName}\\b`, 'g');
      
      let match;
      while ((match = regex.exec(codeLine)) !== null) {
        const newMatch = {
          start: match.index,
          end: match.index + match[0].length,
          varName: varName,
          color: color
        };

        // 겹치는 매칭이 있는지 확인
        const hasOverlap = matches.some(existingMatch => 
          !(newMatch.end <= existingMatch.start || newMatch.start >= existingMatch.end)
        );

        if (!hasOverlap) {
          matches.push(newMatch);
        }

        // 무한 루프 방지
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    });

    // 매칭이 없으면 원본 텍스트 반환
    if (matches.length === 0) {
      return <span>{codeLine}</span>;
    }
    
    // 시작 위치로 정렬
    matches.sort((a, b) => a.start - b.start);
    
    const result: React.ReactNode[] = [];
    let lastEnd = 0;
    
    matches.forEach((match, index) => {
      // 매칭 전의 텍스트 추가
      if (match.start > lastEnd) {
        result.push(codeLine.slice(lastEnd, match.start));
      }
      
      // 하이라이트된 변수 추가
      result.push(
        <span
          key={`${match.varName}-${index}`}
          className="inline-block px-1 py-0.5 mx-0.5 rounded-sm font-medium text-white text-xs"
          style={{
            backgroundColor: match.color,
            boxShadow: `0 0 0 1px ${match.color}80`,
          }}
          title={`변수: ${match.varName}`}
        >
          {match.varName}
        </span>
      );
      
      lastEnd = match.end;
    });
    
    // 마지막 매칭 후의 텍스트 추가
    if (lastEnd < codeLine.length) {
      result.push(codeLine.slice(lastEnd));
    }
    
    return <span>{result}</span>;
  };

  // 전체 코드에서 모든 변수 하이라이트 (개선된 버전)
  const highlightAllVariablesInCode = (codeLine: string): JSX.Element => {
    if (!codeLine) {
      return <span>{codeLine}</span>;
    }

    // 모든 변수명을 길이 순으로 정렬 (긴 것부터)
    const allVariableNames = Object.keys(variableColors).sort((a, b) => b.length - a.length);
    
    if (allVariableNames.length === 0) {
      return <span>{codeLine}</span>;
    }

    interface Match {
      start: number;
      end: number;
      varName: string;
      color: string;
    }

    const matches: Match[] = [];
    
    // 각 변수에 대해 매칭 찾기
    allVariableNames.forEach(varName => {
      const color = variableColors[varName];
      const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedVarName}\\b`, 'g');
      
      let match;
      while ((match = regex.exec(codeLine)) !== null) {
        const newMatch = {
          start: match.index,
          end: match.index + match[0].length,
          varName: varName,
          color: color
        };

        // 겹치는 매칭이 있는지 확인
        const hasOverlap = matches.some(existingMatch => 
          !(newMatch.end <= existingMatch.start || newMatch.start >= existingMatch.end)
        );

        if (!hasOverlap) {
          matches.push(newMatch);
        }

        // 무한루프 방지
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    });

    // 시작 위치로 정렬
    matches.sort((a, b) => a.start - b.start);

    if (matches.length === 0) {
      return <span>{codeLine}</span>;
    }

    const result: JSX.Element[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      // 이전 매치 이후의 텍스트 추가
      if (match.start > lastIndex) {
        result.push(
          <span key={`text-${index}`}>
            {codeLine.substring(lastIndex, match.start)}
          </span>
        );
      }

      // 변수 하이라이트 추가
      result.push(
        <span
          key={`var-${index}`}
          className="inline-block px-1 py-0.5 mx-0.5 rounded-sm font-medium text-white text-xs"
          style={{
            backgroundColor: match.color,
            boxShadow: `0 0 0 1px ${match.color}80`,
          }}
          title={`변수: ${match.varName}`}
        >
          {match.varName}
        </span>
      );

      lastIndex = match.end;
    });

    // 마지막 매치 이후의 텍스트 추가
    if (lastIndex < codeLine.length) {
      result.push(
        <span key="text-end">
          {codeLine.substring(lastIndex)}
        </span>
      );
    }

    return <span>{result}</span>;
  };

  // 코드 라인에서 변수 하이라이트 (개선된 버전)
  const highlightVariablesInCode = (codeLine: string, variables: Record<string, any>): JSX.Element => {
    if (!codeLine) {
      return <span>{codeLine}</span>;
    }

    // 모든 변수명을 길이 순으로 정렬 (긴 것부터 - 부분 매칭 방지)
    const allVarNames = Object.keys(variableColors).sort((a, b) => b.length - a.length);
    
    // 각 변수의 위치를 찾아서 저장
    const matches: Array<{start: number, end: number, varName: string, color: string}> = [];
    
    allVarNames.forEach(varName => {
      const color = variableColors[varName];
      // 단어 경계를 사용하여 정확한 변수명만 매칭
      const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedVarName}\\b`, 'g');
      let match;
      
      while ((match = regex.exec(codeLine)) !== null) {
        // 겹치는 매칭이 없는지 확인
        const newMatch = {
          start: match.index,
          end: match.index + varName.length,
          varName: varName,
          color: color
        };
        
        const hasOverlap = matches.some(existingMatch => 
          !(newMatch.end <= existingMatch.start || newMatch.start >= existingMatch.end)
        );
        
        if (!hasOverlap) {
          matches.push(newMatch);
        }
        
        // regex.lastIndex를 초기화하여 무한루프 방지
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    });

    // 매칭이 없으면 원본 반환
    if (matches.length === 0) {
      return <span>{codeLine}</span>;
    }

    // 위치 순으로 정렬
    matches.sort((a, b) => a.start - b.start);

    // JSX 엘리먼트 배열 생성
    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      // 매칭 이전의 일반 텍스트
      if (match.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {codeLine.substring(lastIndex, match.start)}
          </span>
        );
      }

      // 변수 하이라이트
      elements.push(
        <span
          key={`var-${match.varName}-${index}`}
          className="inline-block px-1 py-0.5 mx-0.5 rounded-sm font-medium text-white text-xs"
          style={{
            backgroundColor: match.color,
            boxShadow: `0 0 0 1px ${match.color}80`,
          }}
          title={`변수: ${match.varName}${variables[match.varName] !== undefined ? ` = ${JSON.stringify(variables[match.varName])}` : ''}`}
        >
          {match.varName}
        </span>
      );

      lastIndex = match.end;
    });

    // 마지막 남은 텍스트
    if (lastIndex < codeLine.length) {
      elements.push(
        <span key="text-final">
          {codeLine.substring(lastIndex)}
        </span>
      );
    }

    return <span className="leading-relaxed">{elements}</span>;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
          language,
          input_data: inputData
        })
      });

      if (!response.ok) {
        throw new Error('시각화 생성에 실패했습니다.');
      }

      const data = await response.json();
      setVisualizationData(data);
      setCurrentStep(0);
    } catch (error) {
      console.error('Visualization error:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (visualizationData && currentStep < visualizationData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startAutoPlay = () => {
    if (isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (visualizationData && prev < visualizationData.steps.length - 1) {
          return prev + 1;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsPlaying(false);
          return prev;
        }
      });
    }, playSpeed);
  };

  const resetVisualization = () => {
    setCurrentStep(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPlaying(false);
  };

  const renderVariableVisualization = (variables: Record<string, any>) => {
    return (
      <div className="space-y-3">
        {Object.entries(variables).map(([name, value]) => {
          const color = assignVariableColor(name);
          return (
            <div 
              key={name} 
              className="p-3 rounded-lg border-2" 
              style={{ 
                backgroundColor: `${color}10`, // 6% 투명도
                borderColor: color 
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span 
                    className="font-mono text-sm font-semibold"
                    style={{ color: color }}
                  >
                    {name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{typeof value}</span>
              </div>
              <div className="mt-2">
                {renderVariableValue(name, value, color)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVariableValue = (name: string, value: any, color: string) => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">배열 (길이: {value.length})</div>
          <div className="flex flex-wrap gap-1">
            {value.map((item, index) => (
              <div
                key={index}
                className="px-2 py-1 rounded text-xs font-mono"
                style={{
                  backgroundColor: `${color}30`, // 18% 투명도
                  color: color,
                  border: `1px solid ${color}60`
                }}
              >
                [{index}]: {JSON.stringify(item)}
              </div>
            ))}
          </div>
        </div>
      );
    } else if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-1">
          <div className="text-xs text-gray-600">객체</div>
          <pre 
            className="text-xs p-2 rounded overflow-x-auto"
            style={{
              backgroundColor: `${color}20`, // 12% 투명도
              color: color,
              border: `1px solid ${color}60`
            }}
          >
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    } else {
      return (
        <div 
          className="font-mono text-sm p-2 rounded border font-semibold"
          style={{
            backgroundColor: 'white',
            color: color,
            borderColor: color
          }}
        >
          {JSON.stringify(value)}
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">코드 시각화</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-gray-600">시각화 생성 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">코드 시각화</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm">{error}</div>
          </div>
          <button
            onClick={generateVisualization}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!visualizationData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">코드 시각화</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-center py-8 text-gray-500">
          시각화할 코드를 작성해주세요.
        </div>
      </div>
    );
  }

  const currentStepData = visualizationData.steps[currentStep];

  // mode에 따라 다른 렌더링
  if (mode === 'code-execution') {
    // 코드 실행 부분만 (에디터 영역 대체)
    return (
      <div className="space-y-4">
        {/* 제어 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">코드 실행 시각화</h3>
          <div className="text-sm text-gray-600">
            단계 {currentStep + 1} / {visualizationData.steps.length}
          </div>
        </div>
        
        {/* 제어 버튼들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 이전
            </button>
            <button
              onClick={startAutoPlay}
              className={`px-4 py-1 rounded text-white ${
                isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
            </button>
            <button
              onClick={nextStep}
              disabled={currentStep === visualizationData.steps.length - 1}
              className="bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음 →
            </button>
            <button
              onClick={resetVisualization}
              className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
            >
              🔄 초기화
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">속도:</label>
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={500}>빠름</option>
              <option value={1000}>보통</option>
              <option value={2000}>느림</option>
            </select>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / visualizationData.steps.length) * 100}%`
            }}
          ></div>
        </div>

        {/* 변수 범례 */}
        {Object.keys(variableColors).length > 0 && (
          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">변수 색상 범례</h5>
            <div className="flex flex-wrap gap-2">
              {Object.entries(variableColors).map(([varName, color]) => (
                <div key={varName} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs font-mono text-gray-600">{varName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 코드 실행 표시 */}
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm" style={{ height: '400px', overflowY: 'auto' }}>
          {visualizationData.code_lines.map((line, index) => {
            const isCurrentLine = currentStepData.line === index + 1;
            return (
              <div
                key={index}
                className={`py-1 px-2 rounded ${
                  isCurrentLine
                    ? 'bg-yellow-400 text-gray-900'
                    : ''
                }`}
              >
                <span className={`mr-3 ${isCurrentLine ? 'text-gray-600' : 'text-gray-500'}`}>
                  {index + 1}
                </span>
                {highlightCurrentLineVariables(line, index, currentStepData.line)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === 'variables-only') {
    // 변수 상태 및 현재 실행 정보만
    return (
      <div className="p-4 space-y-4">
        <h4 className="font-semibold text-gray-900">변수 상태 및 실행 정보</h4>
        
        {/* 현재 실행 정보 */}
        <div className={`border p-4 rounded-lg ${
          currentStepData.operation === 'function_def' 
            ? 'bg-purple-50 border-purple-200' 
            : currentStepData.operation === 'function_call_example'
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <h5 className={`font-medium mb-2 ${
            currentStepData.operation === 'function_def' 
              ? 'text-purple-900' 
              : currentStepData.operation === 'function_call_example'
              ? 'text-green-900'
              : 'text-blue-900'
          }`}>
            {currentStepData.operation === 'function_def' 
              ? '🔧 함수 정의' 
              : currentStepData.operation === 'function_call_example'
              ? '▶️ 함수 호출 예시'
              : '현재 실행'}
          </h5>
          <div className={`text-sm ${
            currentStepData.operation === 'function_def' 
              ? 'text-purple-800' 
              : currentStepData.operation === 'function_call_example'
              ? 'text-green-800'
              : 'text-blue-800'
          }`}>
            <div><strong>라인:</strong> {currentStepData.line}</div>
            <div><strong>연산:</strong> {currentStepData.operation}</div>
            {currentStepData.description && (
              <div><strong>설명:</strong> {currentStepData.description}</div>
            )}
            {currentStepData.output && (
              <div className="mt-2">
                <strong>출력:</strong>
                <div className="bg-white p-2 rounded font-mono text-xs mt-1">
                  {currentStepData.output}
                </div>
              </div>
            )}
            {currentStepData.operation === 'function_call_example' && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                💡 <strong>참고:</strong> 실제 함수 호출이 없어 예시로 시뮬레이션했습니다.
              </div>
            )}
          </div>
        </div>

        {/* 변수 상태 */}
        <div className="space-y-3">
          <h5 className="font-medium text-gray-900">변수 상태</h5>
          <div className="max-h-96 overflow-y-auto">
            {renderVariableVisualization(currentStepData.variables)}
          </div>
        </div>

        {/* 복잡도 정보 */}
        {visualizationData.complexity_info && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-2">복잡도 분석</h5>
            <div className="text-purple-800 text-sm space-y-1">
              <div><strong>시간 복잡도:</strong> {visualizationData.complexity_info.time_complexity}</div>
              <div><strong>공간 복잡도:</strong> {visualizationData.complexity_info.space_complexity}</div>
              <div><strong>설명:</strong> {visualizationData.complexity_info.explanation}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // mode === 'full' (기본 전체 시각화)
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">코드 실행 시각화</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-indigo-100">
          단계 {currentStep + 1} / {visualizationData.steps.length}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 제어 버튼들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 이전
            </button>
            <button
              onClick={startAutoPlay}
              className={`px-4 py-1 rounded text-white ${
                isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
            </button>
            <button
              onClick={nextStep}
              disabled={currentStep === visualizationData.steps.length - 1}
              className="bg-gray-500 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음 →
            </button>
            <button
              onClick={resetVisualization}
              className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
            >
              🔄 초기화
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">속도:</label>
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={500}>빠름</option>
              <option value={1000}>보통</option>
              <option value={2000}>느림</option>
            </select>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / visualizationData.steps.length) * 100}%`
            }}
          ></div>
        </div>

        {/* 변수 범례 */}
        {Object.keys(variableColors).length > 0 && (
          <div className="bg-white border border-gray-200 p-3 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">변수 색상 범례</h5>
            <div className="flex flex-wrap gap-2">
              {Object.entries(variableColors).map(([varName, color]) => (
                <div key={varName} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs font-mono text-gray-600">{varName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 코드 표시 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">코드 실행</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              {visualizationData.code_lines.map((line, index) => {
                const isCurrentLine = currentStepData.line === index + 1;
                return (
                  <div
                    key={index}
                    className={`py-1 px-2 rounded ${
                      isCurrentLine
                        ? 'bg-yellow-400 text-gray-900'
                        : ''
                    }`}
                  >
                    <span className={`mr-3 ${isCurrentLine ? 'text-gray-600' : 'text-gray-500'}`}>
                      {index + 1}
                    </span>
                    {highlightCurrentLineVariables(line, index, currentStepData.line)}
                  </div>
                );
              })}
            </div>
            
            {/* 현재 실행 정보 */}
            <div className={`border p-4 rounded-lg ${
              currentStepData.operation === 'function_def' 
                ? 'bg-purple-50 border-purple-200' 
                : currentStepData.operation === 'function_call_example'
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h5 className={`font-medium mb-2 ${
                currentStepData.operation === 'function_def' 
                  ? 'text-purple-900' 
                  : currentStepData.operation === 'function_call_example'
                  ? 'text-green-900'
                  : 'text-blue-900'
              }`}>
                {currentStepData.operation === 'function_def' 
                  ? '🔧 함수 정의' 
                  : currentStepData.operation === 'function_call_example'
                  ? '▶️ 함수 호출 예시'
                  : '현재 실행'}
              </h5>
              <div className={`text-sm ${
                currentStepData.operation === 'function_def' 
                  ? 'text-purple-800' 
                  : currentStepData.operation === 'function_call_example'
                  ? 'text-green-800'
                  : 'text-blue-800'
              }`}>
                <div><strong>라인:</strong> {currentStepData.line}</div>
                <div><strong>연산:</strong> {currentStepData.operation}</div>
                {currentStepData.description && (
                  <div><strong>설명:</strong> {currentStepData.description}</div>
                )}
                {currentStepData.output && (
                  <div className="mt-2">
                    <strong>출력:</strong>
                    <div className="bg-white p-2 rounded font-mono text-xs mt-1">
                      {currentStepData.output}
                    </div>
                  </div>
                )}
                {currentStepData.operation === 'function_call_example' && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                    💡 <strong>참고:</strong> 실제 함수 호출이 없어 예시로 시뮬레이션했습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 변수 상태 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">변수 상태</h4>
            <div ref={variablesContainerRef} className="max-h-96 overflow-y-auto">
              {renderVariableVisualization(currentStepData.variables)}
            </div>
          </div>
        </div>

        {/* 복잡도 정보 */}
        {visualizationData.complexity_info && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-2">복잡도 분석</h5>
            <div className="text-purple-800 text-sm space-y-1">
              <div><strong>시간 복잡도:</strong> {visualizationData.complexity_info.time_complexity}</div>
              <div><strong>공간 복잡도:</strong> {visualizationData.complexity_info.space_complexity}</div>
              <div><strong>설명:</strong> {visualizationData.complexity_info.explanation}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeVisualization;