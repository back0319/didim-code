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
  func_name?: string;
}

interface CallTreeNode {
  id: number;
  parent_id: number | null;
  func_name: string;
  arguments: Record<string, any>;
  call_step: number;
  return_step: number | null;
  return_value: any;
}

interface VisualizationData {
  steps: Step[];
  code_lines: string[];
  call_tree?: CallTreeNode[];
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

  // 현재 스텝 정보 추출
  const getCurrentStep = () => {
    if (!visualizationData || currentStep >= visualizationData.steps.length) {
      return null;
    }
    return visualizationData.steps[currentStep];
  };

  const formatCallValue = (value: any): string => {
    if (value === null) return 'None';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderCallTree = () => {
    if (!visualizationData?.call_tree) return null;

    const visibleCalls = visualizationData.call_tree.filter(
      (call) => call.call_step <= currentStep,
    );
    if (visibleCalls.length === 0) return null;

    const visibleIds = new Set(visibleCalls.map((call) => call.id));
    const childrenByParent = new Map<number | null, CallTreeNode[]>();
    visibleCalls.forEach((call) => {
      const parentId = call.parent_id !== null && visibleIds.has(call.parent_id)
        ? call.parent_id
        : null;
      const children = childrenByParent.get(parentId) || [];
      children.push(call);
      childrenByParent.set(parentId, children);
    });

    const stackFrames = getCurrentStep()?.stack_frames || [];
    const activeFrameCallIds = stackFrames
      .map((frame: any) => frame.call_id)
      .filter((callId: any): callId is number => typeof callId === 'number');
    const activeCallIds = new Set<number>(activeFrameCallIds);
    const currentCallId = activeFrameCallIds[activeFrameCallIds.length - 1];

    const renderNode = (call: CallTreeNode, depth: number): React.ReactNode => {
      const children = childrenByParent.get(call.id) || [];
      const isCurrent = call.id === currentCallId;
      const isActive = activeCallIds.has(call.id);
      const hasReturned = call.return_step !== null && call.return_step <= currentStep;
      const argumentText = Object.entries(call.arguments || {})
        .map(([name, value]) => `${name}=${formatCallValue(value)}`)
        .join(', ');
      const signature = `${call.func_name}(${argumentText})`;

      const cardStyle = isCurrent
        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
        : hasReturned
          ? 'border-green-300 bg-green-50'
          : isActive
            ? 'border-indigo-300 bg-indigo-50'
            : 'border-gray-300 bg-white';

      return (
        <div key={call.id} className="min-w-0">
          <div className={`rounded-lg border p-3 shadow-sm ${cardStyle}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-gray-900 break-all">
                {signature}
              </span>
              {isCurrent ? (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                  실행 중
                </span>
              ) : hasReturned ? (
                <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-mono font-semibold text-white">
                  반환 {formatCallValue(call.return_value)}
                </span>
              ) : isActive ? (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                  하위 호출 대기
                </span>
              ) : null}
            </div>
          </div>

          {children.length > 0 && (
            <div className="ml-3 mt-2 border-l-2 border-indigo-200 pl-3">
              <div className={children.length > 1 && depth === 0 ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
                {children.map((child) => renderNode(child, depth + 1))}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-gray-900">함수 호출 트리</h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            호출된 함수와 인자, 반환값을 누적해서 보여줍니다. 파란색은 현재 실행 중인 호출입니다.
          </p>
        </div>
        <div className="space-y-3">
          {(childrenByParent.get(null) || []).map((rootCall) => renderNode(rootCall, 0))}
        </div>
      </div>
    );
  };

  // 각 함수의 반환값을 추적하는 함수 - 스텝별로 반환값 저장 (인덱스 포함)
  const getFunctionReturnValues = () => {
    if (!visualizationData) return new Map<string, any>();
    
    const returnValues = new Map<string, any>();
    
    // 함수 정의에서 파라미터 이름 추출 (코드에서 def 라인 파싱)
    const getFunctionParams = (funcName: string): string[] => {
      if (!visualizationData) return [];
      
      for (const line of visualizationData.code_lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(`def ${funcName}(`)) {
          // "def funcName(param1, param2):" 형식에서 파라미터 추출
          const match = trimmed.match(/def\s+\w+\((.*?)\)/);
          if (match && match[1]) {
            const params = match[1].split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
            console.log(`Extracted params for ${funcName}:`, params);
            return params;
          }
        }
      }
      console.log(`No params found for ${funcName}`);
      return [];
    };
    
    // 현재 스텝까지 순회하면서 function_return 이벤트 찾기
    for (let i = 0; i <= currentStep && i < visualizationData.steps.length; i++) {
      const step = visualizationData.steps[i];
      
      if (step.operation === 'function_return' && step.func_name && '__return__' in step.variables) {
        // 함수 파라미터 이름 가져오기
        const paramNames = getFunctionParams(step.func_name);
        
        // 함수 호출 시그니처 생성 (step.variables에서 파라미터 값 추출)
        const params: string[] = [];
        
        console.log('step.variables:', step.variables);
        console.log('Param names to extract:', paramNames);
        
        // step.variables에서 직접 파라미터 값 추출
        for (const paramName of paramNames) {
          if (paramName in step.variables && paramName !== '__return__') {
            const value = step.variables[paramName];
            const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
            params.push(valueStr);
          }
        }
        
        // 함수명(인자)@스텝인덱스 형식으로 고유한 키 생성
        const funcSignature = params.length > 0 
          ? `${step.func_name}(${params.join(', ')})`
          : step.func_name;
        
        const uniqueKey = `${funcSignature}@${i}`;
        
        console.log('Function return detected:', {
          funcSignature,
          uniqueKey,
          returnValue: step.variables['__return__'],
          step: i,
          extractedParams: params
        });
        
        returnValues.set(uniqueKey, {
          signature: funcSignature,
          returnValue: step.variables['__return__'],
          stepIndex: i
        });
      }
    }
    
    console.log('All return values:', Array.from(returnValues.entries()));
    return returnValues;
  };

  // 현재 스텝의 함수/제어문 추출 (중첩 구조 포함)
  const getCurrentFunctions = () => {
    if (!visualizationData || currentStep >= visualizationData.steps.length) {
      return [];
    }
    const step = visualizationData.steps[currentStep];
    
    // 코드의 인덴트를 분석하여 중첩 구조 파악
    interface ControlStructure {
      type: string;
      label: string;
      level: number;
      line: number;
      endLine?: number; // 블록의 끝 라인 추가
      condition?: string;
      children?: ControlStructure[];
      callDepth?: number; // 재귀 호출 깊이 추가
    }
    
    const structures: ControlStructure[] = [];
    const currentLine = step.line;
    
    // 각 블록의 끝 라인을 계산하는 함수
    const findBlockEnd = (startLine: number, startLevel: number): number => {
      let lastCodeLine = startLine - 1; // 블록 내 마지막 코드 라인
      
      for (let i = startLine; i < visualizationData.code_lines.length; i++) {
        const line = visualizationData.code_lines[i];
        const trimmedLine = line.trim();
        
        // 빈 줄이나 주석은 건너뛰되, 블록 내부로 계속 진행
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
          continue;
        }
        
        const indent = line.length - line.trimLeft().length;
        const level = Math.floor(indent / 4);
        
        // 같거나 더 낮은 레벨의 코드를 만나면 블록 종료
        if (level <= startLevel) {
          // lastCodeLine의 다음 라인이 endLine
          return i;
        }
        
        // 더 깊은 레벨의 코드이면 블록 내부 코드로 기록
        lastCodeLine = i;
      }
      
      // 파일 끝까지 도달한 경우
      return visualizationData.code_lines.length;
    };
    
    // 현재 라인까지의 모든 제어문/함수/print 찾기
    for (let i = 0; i < visualizationData.code_lines.length; i++) {
      const line = visualizationData.code_lines[i];
      const trimmedLine = line.trim();
      const indent = line.length - line.trimLeft().length;
      const level = Math.floor(indent / 4);
      
      // print 문 감지 (level > 0이면 제어문/함수 안에 있음)
      if (trimmedLine.startsWith('print(') && level > 0) {
        // print 문의 내용 추출
        const printContent = trimmedLine.substring(6, trimmedLine.lastIndexOf(')')).trim();
        structures.push({
          type: 'print',
          label: 'print',
          level: level + 1,  // 부모 박스 안에 들어가도록 level+1
          line: i + 1,
          endLine: i + 1, // print는 한 줄
          condition: printContent,
          children: []
        });
      }
      
      // 제어문 감지
      if (trimmedLine.startsWith('if ')) {
        const condition = trimmedLine.substring(3, trimmedLine.indexOf(':')).trim();
        
        // elif/else가 연속되는지 확인하여 전체 if-elif-else 블록의 끝을 찾기
        let endLine = i + 1;
        let checkLine = i;
        
        while (checkLine < visualizationData.code_lines.length) {
          const currentBlockLine = visualizationData.code_lines[checkLine].trim();
          const currentIndent = visualizationData.code_lines[checkLine].length - 
                               visualizationData.code_lines[checkLine].trimLeft().length;
          const currentLevel = Math.floor(currentIndent / 4);
          
          // 현재 레벨의 if/elif/else 블록의 끝을 찾기
          if (currentLevel === level && 
              (currentBlockLine.startsWith('if ') || 
               currentBlockLine.startsWith('elif ') || 
               currentBlockLine.startsWith('else:'))) {
            endLine = findBlockEnd(checkLine + 1, level);
            checkLine = endLine;
            
            // 다음에 elif나 else가 있는지 확인
            if (checkLine < visualizationData.code_lines.length) {
              const nextLine = visualizationData.code_lines[checkLine].trim();
              const nextIndent = visualizationData.code_lines[checkLine].length - 
                                visualizationData.code_lines[checkLine].trimLeft().length;
              const nextLevel = Math.floor(nextIndent / 4);
              
              if (nextLevel === level && (nextLine.startsWith('elif ') || nextLine.startsWith('else:'))) {
                continue; // 다음 elif/else 처리를 위해 계속
              }
            }
            break; // elif/else가 더 이상 없으면 종료
          } else {
            break;
          }
        }
        
        structures.push({
          type: 'if',
          label: 'if',
          level,
          line: i + 1,
          endLine,
          condition,
          children: []
        });
      } else if (trimmedLine.startsWith('elif ')) {
        const condition = trimmedLine.substring(5, trimmedLine.indexOf(':')).trim();
        const endLine = findBlockEnd(i + 1, level);
        structures.push({
          type: 'elif',
          label: 'elif',
          level,
          line: i + 1,
          endLine,
          condition,
          children: []
        });
      } else if (trimmedLine.startsWith('else:') || trimmedLine === 'else:') {
        const endLine = findBlockEnd(i + 1, level);
        structures.push({
          type: 'else',
          label: 'else',
          level,
          line: i + 1,
          endLine,
          children: []
        });
      } else if (trimmedLine.startsWith('for ')) {
        const condition = trimmedLine.substring(4, trimmedLine.indexOf(':')).trim();
        const endLine = findBlockEnd(i + 1, level);
        structures.push({
          type: 'for',
          label: 'for',
          level,
          line: i + 1,
          endLine,
          condition,
          children: []
        });
      } else if (trimmedLine.startsWith('while ')) {
        const condition = trimmedLine.substring(6, trimmedLine.indexOf(':')).trim();
        const endLine = findBlockEnd(i + 1, level);
        structures.push({
          type: 'while',
          label: 'while',
          level,
          line: i + 1,
          endLine,
          condition,
          children: []
        });
      } else if (trimmedLine.startsWith('def ')) {
        const funcName = trimmedLine.split('(')[0].replace('def ', '').trim();
        const endLine = findBlockEnd(i + 1, level);
        structures.push({
          type: 'function',
          label: 'def',
          level,
          line: i + 1,
          endLine,
          condition: funcName,
          children: []
        });
      }
    }
    
    // 현재 라인이 포함되는 모든 블록 찾기
    // print는 현재 라인일 때만, 다른 구조는 한 번 시작되면 계속 표시
    const activeStructures = structures.filter(s => {
      if (s.type === 'print') {
        // print는 정확히 현재 라인일 때만
        return s.line === currentLine;
      } else {
        // 제어문/함수는 시작 라인에 도달하면 계속 표시 (한 번 생성되면 없어지지 않음)
        return s.line <= currentLine;
      }
    });
    
    console.log('=== Debug Info ===');
    console.log('Current Line:', currentLine);
    console.log('All Structures:', structures.map(s => ({
      type: s.type,
      line: s.line,
      endLine: s.endLine,
      level: s.level
    })));
    console.log('Active Structures:', activeStructures.map(s => ({
      type: s.type,
      line: s.line,
      endLine: s.endLine,
      level: s.level
    })));
    
    // 모든 구조를 라인 순서대로 정렬 (체인 로직 제거)
    let filteredStructures = activeStructures.sort((a, b) => a.line - b.line);
    
    // 함수 호출 스택 정보가 있으면 재귀 함수 박스 추가
    if (step.stack_frames && step.stack_frames.length > 1) {
      // 함수 정의에서 파라미터 이름 추출
      const getFunctionParams = (funcName: string): string[] => {
        for (const line of visualizationData.code_lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith(`def ${funcName}(`)) {
            const match = trimmed.match(/def\s+\w+\((.*?)\)/);
            if (match && match[1]) {
              return match[1].split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
            }
          }
        }
        return [];
      };
      
      // 같은 함수가 여러 번 호출된 경우 (재귀)
      const functionCalls = step.stack_frames.filter((frame: any) => frame.func_name !== 'Global frame');
      
      // 재귀 호출 감지: 같은 함수명이 여러 번 나타나는지 확인
      const functionNames = functionCalls.map((f: any) => f.func_name);
      const recursiveFunctions = functionNames.filter((name: string, index: number) => 
        functionNames.indexOf(name) !== index
      );
      
      if (recursiveFunctions.length > 0) {
        // 재귀 함수 호출 깊이에 따라 함수 박스 중첩 생성
        const recursiveStructures: ControlStructure[] = [];
        
        functionCalls.forEach((frame: any, callDepth: number) => {
          // 함수 정의 라인 찾기
          const funcDefLine = structures.find(s => 
            s.type === 'function' && s.condition === frame.func_name
          );
          
          if (funcDefLine) {
            // 실제 파라미터 이름 가져오기
            const paramNames = getFunctionParams(frame.func_name);
            
            // 함수 인자값 추출 (실제 파라미터만)
            const params: string[] = [];
            if (frame.encoded_locals) {
              for (const paramName of paramNames) {
                if (paramName in frame.encoded_locals) {
                  const value = frame.encoded_locals[paramName];
                  const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
                  params.push(valueStr);
                }
              }
            }
            
            // 함수명(인자) 형식으로 표시
            const funcCallName = params.length > 0 
              ? `${frame.func_name}(${params.join(', ')})`
              : frame.func_name;
            
            recursiveStructures.push({
              type: 'function_call',
              label: 'def',
              level: funcDefLine.level + callDepth,  // 호출 깊이만큼 레벨 증가
              line: funcDefLine.line,
              endLine: funcDefLine.endLine,
              condition: funcCallName,
              children: [],
              callDepth: callDepth
            });
          }
        });
        
        // 원래 함수 정의 구조 제거하고 재귀 호출 구조로 대체
        filteredStructures = filteredStructures.filter(s => 
          !(s.type === 'function' && recursiveFunctions.includes(s.condition || ''))
        );
        
        filteredStructures = [...filteredStructures, ...recursiveStructures].sort((a, b) => {
          // 라인이 같으면 callDepth로 정렬 (깊은 호출이 나중에)
          if (a.line === b.line) {
            return (a.callDepth || 0) - (b.callDepth || 0);
          }
          return a.line - b.line;
        });
      }
    }
    
    console.log('Filtered Structures (sorted):', filteredStructures.map(s => ({
      type: s.type,
      line: s.line,
      endLine: s.endLine,
      level: s.level
    })));
    
    // 중첩 구조 생성
    const buildNested = (structs: ControlStructure[]): ControlStructure[] => {
      if (structs.length === 0) return [];
      
      const result: ControlStructure[] = [];
      const stack: ControlStructure[] = [];
      
      for (const struct of structs) {
        // 스택에서 현재 레벨보다 깊은 것들 제거 (print는 제외)
        while (stack.length > 0 && stack[stack.length - 1].level >= struct.level) {
          stack.pop();
        }
        
        if (stack.length === 0) {
          // 최상위 레벨
          result.push(struct);
          // print는 자식을 가질 수 없으므로 스택에 추가하지 않음
          if (struct.type !== 'print') {
            stack.push(struct);
          }
        } else {
          // 부모의 자식으로 추가
          const parent = stack[stack.length - 1];
          if (!parent.children) parent.children = [];
          parent.children.push(struct);
          // print는 자식을 가질 수 없으므로 스택에 추가하지 않음
          if (struct.type !== 'print') {
            stack.push(struct);
          }
        }
      }
      
      return result;
    };
    
    return buildNested(filteredStructures);
  };

  // 변수 하이라이트를 위한 함수
  const highlightVariables = (code: string, variables: Record<string, any>) => {
    if (!code || Object.keys(variables).length === 0) {
      return code;
    }

    // Python 키워드와 내장 함수 목록
    const pythonKeywords = new Set([
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
      'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
      'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
      'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
      'print', 'input', 'len', 'range', 'str', 'int', 'float', 'list', 'dict',
      'set', 'tuple', 'bool', 'type', 'isinstance', 'sum', 'max', 'min', 'abs',
      'round', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter'
    ]);

    // 변수마다 다른 색상을 할당하기 위한 색상 팔레트
    const colorPalette = getColorPalette();

    // 변수 이름들을 길이 순으로 정렬 (긴 것부터 - 부분 매칭 방지)
    const varNames = Object.keys(variables)
      .filter(varName => !pythonKeywords.has(varName)) // 키워드 제외
      .sort((a, b) => b.length - a.length);
    
    let highlightedCode = code;
    const replacements: { start: number; end: number; varName: string; colorIndex: number }[] = [];

    // 각 변수 이름을 찾아서 위치 기록
    varNames.forEach((varName, index) => {
      // Python 변수 패턴: 단어 경계로 둘러싸인 변수명
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        replacements.push({
          start: match.index,
          end: match.index + varName.length,
          varName: varName,
          colorIndex: index % colorPalette.length
        });
      }
    });

    // 겹치지 않는 교체 항목만 필터링 (뒤에서부터 처리하기 위해 역순 정렬)
    replacements.sort((a, b) => b.start - a.start);
    
    const filteredReplacements: typeof replacements = [];
    let lastEnd = Infinity;
    
    for (const replacement of replacements) {
      if (replacement.end <= lastEnd) {
        filteredReplacements.push(replacement);
        lastEnd = replacement.start;
      }
    }

    // 뒤에서부터 교체 (인덱스가 변하지 않도록)
    filteredReplacements.forEach(({ start, end, varName, colorIndex }) => {
      const colorClass = colorPalette[colorIndex].highlight;
      highlightedCode = 
        highlightedCode.substring(0, start) +
        `<span class="${colorClass} px-1 rounded font-semibold">${varName}</span>` +
        highlightedCode.substring(end);
    });

    return highlightedCode;
  };

  // 색상 팔레트 정의
  const getColorPalette = () => [
    { 
      highlight: 'bg-blue-200 text-blue-900',
      box: 'bg-blue-50 border-blue-200',
      text: 'text-blue-900',
      subtext: 'text-blue-600'
    },
    { 
      highlight: 'bg-green-200 text-green-900',
      box: 'bg-green-50 border-green-200',
      text: 'text-green-900',
      subtext: 'text-green-600'
    },
    { 
      highlight: 'bg-purple-200 text-purple-900',
      box: 'bg-purple-50 border-purple-200',
      text: 'text-purple-900',
      subtext: 'text-purple-600'
    },
    { 
      highlight: 'bg-pink-200 text-pink-900',
      box: 'bg-pink-50 border-pink-200',
      text: 'text-pink-900',
      subtext: 'text-pink-600'
    },
    { 
      highlight: 'bg-yellow-200 text-yellow-900',
      box: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-900',
      subtext: 'text-yellow-600'
    },
    { 
      highlight: 'bg-indigo-200 text-indigo-900',
      box: 'bg-indigo-50 border-indigo-200',
      text: 'text-indigo-900',
      subtext: 'text-indigo-600'
    },
    { 
      highlight: 'bg-red-200 text-red-900',
      box: 'bg-red-50 border-red-200',
      text: 'text-red-900',
      subtext: 'text-red-600'
    },
    { 
      highlight: 'bg-orange-200 text-orange-900',
      box: 'bg-orange-50 border-orange-200',
      text: 'text-orange-900',
      subtext: 'text-orange-600'
    },
  ];

  // 변수 색상 인덱스 가져오기
  const getVariableColorIndex = (varName: string, variables: Record<string, any>) => {
    const pythonKeywords = new Set([
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
      'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
      'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
      'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
      'print', 'input', 'len', 'range', 'str', 'int', 'float', 'list', 'dict',
      'set', 'tuple', 'bool', 'type', 'isinstance', 'sum', 'max', 'min', 'abs',
      'round', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter'
    ]);
    
    const varNames = Object.keys(variables)
      .filter(name => !pythonKeywords.has(name))
      .sort((a, b) => b.length - a.length);
    
    const index = varNames.indexOf(varName);
    return index === -1 ? 0 : index % getColorPalette().length;
  };

  // 코드 라인을 렌더링하는 함수 (변수 하이라이트 포함)
  const renderCodeLine = (line: string, variables: Record<string, any>) => {
    const highlightedLine = highlightVariables(line, variables);
    return <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />;
  };

  // 중첩 구조를 재귀적으로 렌더링하는 함수
  const renderNestedStructure = (structures: any[], depth: number = 0) => {
    if (!structures || structures.length === 0) {
      return <></>;
    }

    const currentVariables = getCurrentVariables();

    return (
      <>
        {structures.map((struct, index) => {
          // 타입에 따른 아이콘과 색상
          let icon = '●';
          let bgColor = 'bg-green-50';
          let borderColor = 'border-green-300';
          let textColor = 'text-green-900';
          let conditionBg = 'bg-gray-600';
          let conditionText = 'text-white';
          let evaluationBadge = null;

          if (struct.type === 'if' || struct.type === 'elif' || struct.type === 'else') {
            icon = '?';
            bgColor = 'bg-blue-50';
            borderColor = 'border-blue-300';
            textColor = 'text-blue-900';
            
            // if/elif의 조건 평가
            if (struct.condition && struct.type !== 'else') {
              try {
                // 간단한 조건 평가 시도
                let evaluation = null;
                const condition = struct.condition;
                
                // 변수 값으로 조건 평가 시도
                const varMatches = condition.match(/\b[a-zA-Z_][a-zA-Z0-9_]*/g);
                if (varMatches) {
                  let allVarsExist = true;
                  for (const varName of varMatches) {
                    if (!(varName in currentVariables) && !['True', 'False', 'None'].includes(varName)) {
                      allVarsExist = false;
                      break;
                    }
                  }
                  
                  if (allVarsExist) {
                    // 조건 문자열에서 변수를 실제 값으로 치환
                    let evalCondition = condition;
                    for (const varName of varMatches) {
                      if (varName in currentVariables) {
                        const value = currentVariables[varName];
                        const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
                        evalCondition = evalCondition.replace(new RegExp(`\\b${varName}\\b`, 'g'), valueStr);
                      }
                    }
                    
                    // 안전한 평가 (간단한 비교 연산만)
                    try {
                      // eslint-disable-next-line no-eval
                      evaluation = eval(evalCondition);
                    } catch {
                      // 평가 실패 시 무시
                    }
                  }
                }
                
                if (evaluation !== null) {
                  evaluationBadge = (
                    <span className={`${evaluation ? 'bg-green-600' : 'bg-red-600'} text-white px-2 py-0.5 rounded text-xs font-bold`}>
                      {evaluation ? 'True' : 'False'}
                    </span>
                  );
                }
              } catch {
                // 평가 실패 시 무시
              }
            }
            
            conditionBg = struct.type === 'if' ? 'bg-blue-600' : struct.type === 'elif' ? 'bg-yellow-600' : 'bg-gray-600';
          } else if (struct.type === 'for' || struct.type === 'while') {
            icon = '↻';
            bgColor = 'bg-purple-50';
            borderColor = 'border-purple-300';
            textColor = 'text-purple-900';
            conditionBg = 'bg-purple-600';
          } else if (struct.type === 'function' || struct.type === 'function_call') {
            icon = 'ƒ';
            bgColor = 'bg-indigo-50';
            borderColor = 'border-indigo-300';
            textColor = 'text-indigo-900';
            conditionBg = 'bg-indigo-600';
            
            // 함수 반환값 확인 - 시그니처가 일치하는 가장 최근 반환값 찾기
            const functionReturnValues = getFunctionReturnValues();
            
            console.log('Checking return value for:', struct.condition);
            
            // 현재 함수 시그니처와 일치하는 반환값 찾기 (가장 최근 것)
            let matchedReturnValue = null;
            Array.from(functionReturnValues.entries()).forEach(([key, value]) => {
              if (value.signature === struct.condition) {
                // 시그니처가 일치하면 저장 (나중 값이 덮어씀 = 가장 최근)
                matchedReturnValue = value.returnValue;
                console.log('Found matching return:', value);
              }
            });
            
            if (matchedReturnValue !== null) {
              console.log('Displaying return value:', matchedReturnValue, 'for', struct.condition);
              evaluationBadge = (
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-mono font-bold">
                  return: {typeof matchedReturnValue === 'string' ? `"${matchedReturnValue}"` : String(matchedReturnValue)}
                </span>
              );
            }
          } else if (struct.type === 'print') {
            icon = '📄';
            bgColor = 'bg-green-50';
            borderColor = 'border-green-300';
            textColor = 'text-green-900';
            conditionBg = 'bg-green-600';
            
            // print 문의 변수를 현재 값으로 치환
            if (struct.condition) {
              let printOutput = struct.condition;
              
              // 변수 이름 찾기
              const varMatches = struct.condition.match(/\b[a-zA-Z_][a-zA-Z0-9_]*/g);
              if (varMatches) {
                for (const varName of varMatches) {
                  if (varName in currentVariables && !['True', 'False', 'None'].includes(varName)) {
                    const value = currentVariables[varName];
                    const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
                    printOutput = printOutput.replace(new RegExp(`\\b${varName}\\b`, 'g'), valueStr);
                  }
                }
              }
              
              // 따옴표 제거
              printOutput = printOutput.replace(/['"]/g, '');
              
              evaluationBadge = (
                <span className="bg-white border border-green-300 text-green-900 px-2 py-1 rounded text-xs font-mono">
                  {printOutput}
                </span>
              );
            }
          }

          return (
            <div
              key={`${struct.line}-${index}`}
              className={`${bgColor} border ${borderColor} rounded-lg p-2 mb-2`}
              style={{ marginLeft: `${depth * 12}px` }}
            >
              <div className="flex items-start">
                <div className="flex items-center flex-1">
                  <span className={`font-bold ${textColor} mr-2`} style={{ fontSize: '16px' }}>
                    {icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-sm font-semibold ${textColor}`}>
                        {struct.label}
                      </span>
                      {struct.condition && struct.type !== 'print' && (
                        <span className={`${conditionBg} ${conditionText} px-2 py-0.5 rounded text-xs font-mono`}>
                          {struct.condition}
                        </span>
                      )}
                      {evaluationBadge}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 자식 구조가 있으면 재귀적으로 렌더링 */}
              {struct.children && struct.children.length > 0 && (
                <div className="mt-2 pl-2 border-l-2 border-gray-300">
                  {renderNestedStructure(struct.children, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
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
            {/* 3분할 레이아웃 (2:4:4 비율) */}
            <div className="flex-1 flex overflow-hidden">
              {/* 1. 변수 칸 (20%) */}
              <div className="w-1/5 border-r border-gray-200 flex flex-col">
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                  <h3 className="font-semibold text-blue-900">변수</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {Object.keys(getCurrentVariables()).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(getCurrentVariables()).map(([name, value]) => {
                        const colorIndex = getVariableColorIndex(name, getCurrentVariables());
                        const colors = getColorPalette()[colorIndex];
                        
                        return (
                          <div key={name} className={`${colors.box} border rounded-lg p-3`}>
                            <div className="flex items-start justify-between">
                              <span className={`font-mono font-semibold ${colors.text}`}>{name}</span>
                              <span className={`text-xs ${colors.subtext} ml-2`}>{typeof value}</span>
                            </div>
                            <div className="mt-2 font-mono text-sm text-gray-700 break-all">
                              {JSON.stringify(value, null, 2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 mt-8">
                      변수 없음
                    </div>
                  )}
                </div>
              </div>

              {/* 2. 함수/제어문 칸 (40%) */}
              <div className="w-2/5 border-r border-gray-200 flex flex-col">
                <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                  <h3 className="font-semibold text-green-900">코드흐름</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {visualizationData.call_tree?.some((call) => call.call_step <= currentStep) ? (
                    renderCallTree()
                  ) : getCurrentFunctions().length > 0 ? (
                    <div>
                      {renderNestedStructure(getCurrentFunctions(), 0)}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 mt-8">
                      제어 구조 없음
                    </div>
                  )}
                </div>
              </div>

              {/* 3. 코드 칸 (40%) */}
              <div className="w-2/5 flex flex-col">
                <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
                  <h3 className="font-semibold text-purple-900">코드</h3>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-900">
                  <div className="font-mono text-sm">
                    {visualizationData.code_lines.map((line: string, index: number) => {
                      const lineNumber = index + 1;
                      const isCurrentLine = visualizationData.steps[currentStep]?.line === lineNumber;
                      const currentVariables = getCurrentVariables();
                      
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
                          <div className={`flex-1 py-1 pr-4 whitespace-pre ${
                            isCurrentLine ? 'text-gray-900 font-semibold' : 'text-gray-300'
                          }`}>
                            {isCurrentLine && Object.keys(currentVariables).length > 0 
                              ? renderCodeLine(line || ' ', currentVariables)
                              : (line || ' ')
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* 출력 칸 */}
                <div className="border-t border-gray-700">
                  <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
                    <h4 className="font-semibold text-gray-300 text-sm">출력</h4>
                  </div>
                  <div className="bg-gray-900 p-4 max-h-32 overflow-y-auto">
                    {visualizationData.steps[currentStep]?.output ? (
                      <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">
                        {visualizationData.steps[currentStep].output}
                      </pre>
                    ) : (
                      <div className="text-gray-500 text-sm italic">출력 없음</div>
                    )}
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
