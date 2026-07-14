import React, { useEffect, useMemo, useState } from 'react';

interface EncodedObject {
  [key: string]: EncodedValue;
}

type EncodedValue = string | number | boolean | null | EncodedValue[] | EncodedObject;

interface VisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  inputData?: string;
}

interface StackFrame {
  func_name: string;
  call_id?: number;
  encoded_locals: Record<string, EncodedValue>;
  ordered_varnames?: string[];
  line_number: number;
}

interface CodeBlock {
  type: 'function' | 'if_block' | 'for_loop' | 'while_loop' | 'with_block' | 'try_block';
  label: string;
  name: string;
  expression: string;
  start_line: number;
  end_line: number;
  depth: number;
}

interface Step {
  line: number;
  operation: string;
  variables: Record<string, EncodedValue>;
  output?: string;
  description?: string;
  stack_frames?: StackFrame[];
  globals_vars?: Record<string, EncodedValue>;
  func_name?: string;
  call_id?: number;
  current_blocks?: CodeBlock[];
  condition_result?: boolean | null;
  loop_iteration?: number | null;
  loop_finished?: boolean;
}

interface CallTreeNode {
  id: number;
  parent_id: number | null;
  func_name: string;
  arguments: Record<string, EncodedValue>;
  call_step: number;
  return_step: number | null;
  return_value: EncodedValue;
}

interface VisualizationData {
  steps: Step[];
  code_lines: string[];
  call_tree?: CallTreeNode[];
}

const formatValue = (value: EncodedValue | undefined): string => {
  if (value === undefined) return '';
  if (value === null) return 'None';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') {
    const rendered = JSON.stringify(value);
    return rendered.length > 80 ? `${rendered.slice(0, 77)}...` : rendered;
  }
  return String(value);
};

const callSignature = (call: CallTreeNode): string => {
  const argumentsText = Object.entries(call.arguments)
    .map(([name, value]) => `${name}=${formatValue(value)}`)
    .join(', ');
  return `${call.func_name}(${argumentsText})`;
};

const VariableRows = ({ values }: { values: Record<string, EncodedValue> }) => {
  const entries = Object.entries(values).filter(([name]) => name !== '__return__');

  if (entries.length === 0) {
    return <p className="text-xs text-gray-400">표시할 변수가 없습니다.</p>;
  }

  return (
    <dl className="space-y-1.5">
      {entries.map(([name, value]) => (
        <div key={name} className="flex items-start justify-between gap-3 font-mono text-xs">
          <dt className="font-semibold text-gray-700">{name}</dt>
          <dd className="max-w-[70%] break-all text-right text-gray-900">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
};

const VisualizationModal: React.FC<VisualizationModalProps> = ({
  isOpen,
  onClose,
  code,
  inputData = '',
}) => {
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isOpen || !code) return;

    const controller = new AbortController();
    const generateVisualization = async () => {
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);

      try {
        const response = await fetch('/api/visualize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language: 'python', input_data: inputData }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || '시각화 생성에 실패했습니다.');
        }
        setVisualizationData(data);
        setCurrentStep(0);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : '시각화 생성 중 오류가 발생했습니다.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    generateVisualization();
    return () => controller.abort();
  }, [isOpen, code, inputData]);

  useEffect(() => {
    if (!isPlaying || !visualizationData) return;
    if (currentStep >= visualizationData.steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => setCurrentStep((step) => step + 1), 850);
    return () => window.clearTimeout(timer);
  }, [isPlaying, visualizationData, currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  const step = visualizationData?.steps[currentStep];
  const visibleCalls = useMemo(
    () => (visualizationData?.call_tree || []).filter((call) => call.call_step <= currentStep),
    [visualizationData, currentStep],
  );
  const callsById = useMemo(
    () => new Map(visibleCalls.map((call) => [call.id, call])),
    [visibleCalls],
  );
  const activeFrames = (step?.stack_frames || []).filter((frame) => frame.func_name !== 'Global frame');
  const activeCallIds = new Set(
    activeFrames.map((frame) => frame.call_id).filter((callId): callId is number => typeof callId === 'number'),
  );
  const currentCallId = activeFrames[activeFrames.length - 1]?.call_id;

  const frameTitle = (frame: StackFrame): string => {
    const call = typeof frame.call_id === 'number' ? callsById.get(frame.call_id) : undefined;
    return call ? callSignature(call) : `${frame.func_name}()`;
  };

  const latestControlStep = (block: CodeBlock): Step | undefined => {
    if (!visualizationData || !step) return undefined;
    for (let index = currentStep; index >= 0; index -= 1) {
      const candidate = visualizationData.steps[index];
      if (candidate.call_id === step.call_id && candidate.line === block.start_line) {
        return candidate;
      }
    }
    return undefined;
  };

  const renderCurrentFlow = () => {
    if (!step) return null;

    const currentFrame = activeFrames[activeFrames.length - 1];
    const currentBlocks = (step.current_blocks || []).filter((block) => block.type !== 'function');
    const currentFunctionBlock = (step.current_blocks || []).find((block) => block.type === 'function');
    const title = currentFrame
      ? frameTitle(currentFrame)
      : currentFunctionBlock
        ? `${currentFunctionBlock.name} 정의`
        : '전역 코드';

    return (
      <section aria-labelledby="current-flow-title" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 id="current-flow-title" className="text-sm font-semibold text-gray-900">현재 실행 흐름</h4>
          <span className="text-xs text-gray-500">{step.line}번 줄</span>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold text-indigo-950">{title}</span>
            <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
              {step.description || '코드 실행'}
            </span>
          </div>

          {currentBlocks.length > 0 && (
            <div className="mt-3 space-y-2 border-l-2 border-indigo-200 pl-3">
              {currentBlocks.map((block) => {
                const controlStep = latestControlStep(block);
                const isCondition = block.type === 'if_block';
                const isLoop = block.type === 'for_loop' || block.type === 'while_loop';

                return (
                  <div key={`${block.type}-${block.start_line}`} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">
                        {isCondition ? '조건' : isLoop ? '반복' : block.label}
                      </span>
                      <code className="break-all text-xs font-semibold text-gray-900">
                        {block.label} {block.expression}
                      </code>
                      {isCondition && typeof controlStep?.condition_result === 'boolean' && (
                        <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${
                          controlStep.condition_result
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {controlStep.condition_result ? '참' : '거짓'}
                        </span>
                      )}
                      {isLoop && typeof controlStep?.loop_iteration === 'number' && (
                        <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${
                          controlStep.loop_finished
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-violet-100 text-violet-800'
                        }`}>
                          {controlStep.loop_finished ? '반복 종료' : `${controlStep.loop_iteration}번째 반복`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderCallTree = () => {
    if (visibleCalls.length === 0) return null;

    const visibleIds = new Set(visibleCalls.map((call) => call.id));
    const childrenByParent = new Map<number | null, CallTreeNode[]>();
    visibleCalls.forEach((call) => {
      const parentId = call.parent_id !== null && visibleIds.has(call.parent_id) ? call.parent_id : null;
      const children = childrenByParent.get(parentId) || [];
      children.push(call);
      childrenByParent.set(parentId, children);
    });

    const renderBranch = (call: CallTreeNode): React.ReactNode => {
      const children = childrenByParent.get(call.id) || [];
      const isCurrent = call.id === currentCallId;
      const isWaiting = activeCallIds.has(call.id) && !isCurrent;
      const hasReturned = call.return_step !== null && call.return_step <= currentStep;
      const statusClass = isCurrent
        ? 'border-indigo-500 bg-indigo-50 text-indigo-950'
        : isWaiting
          ? 'border-amber-300 bg-amber-50 text-amber-950'
          : hasReturned
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
            : 'border-gray-200 bg-white text-gray-900';

      return (
        <div key={call.id} className="flex min-w-max flex-col items-center">
          <div className={`w-40 rounded-lg border px-3 py-2 shadow-sm ${statusClass}`}>
            <div className="break-all font-mono text-xs font-semibold">{callSignature(call)}</div>
            <div className="mt-1 text-[11px] font-medium">
              {isCurrent
                ? '실행 중'
                : isWaiting
                  ? '하위 호출 대기'
                  : hasReturned
                    ? `반환 ${formatValue(call.return_value)}`
                    : '호출됨'}
            </div>
          </div>
          {children.length > 0 && (
            <div className="mt-3 border-t border-gray-300 pt-3">
              <div className="flex items-start justify-center gap-3">
                {children.map((child) => renderBranch(child))}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <section aria-labelledby="call-tree-title" className="space-y-2 border-t border-gray-200 pt-4">
        <div>
          <h4 id="call-tree-title" className="text-sm font-semibold text-gray-900">함수 호출 관계</h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            같은 부모에서 이어진 호출은 나란히 보여주며, 실제 순서에 따라 실행 중·대기·반환 상태를 구분합니다.
          </p>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max items-start gap-4 pt-1">
            {(childrenByParent.get(null) || []).map((call) => renderBranch(call))}
          </div>
        </div>
      </section>
    );
  };

  if (!isOpen) return null;

  const lastStep = Math.max((visualizationData?.steps.length || 1) - 1, 0);
  const progress = visualizationData ? ((currentStep + 1) / visualizationData.steps.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="코드 시각화">
      <div className="flex h-full w-full max-w-[1600px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">코드 시각화</h2>
            <p className="mt-0.5 text-xs text-gray-500">실제 실행 순서에 따라 함수, 조건, 반복과 변수 변화를 보여줍니다.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900" aria-label="시각화 닫기">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
              <p className="text-sm text-gray-600">실행 과정을 추적하고 있습니다.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700">{error}</div>
          </div>
        )}

        {!isLoading && !error && visualizationData && step && (
          <>
            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(220px,0.8fr)_minmax(340px,1.35fr)_minmax(340px,1.35fr)] lg:overflow-hidden">
              <section className="min-h-[18rem] border-b border-gray-200 lg:min-h-0 lg:border-b-0 lg:border-r" aria-labelledby="state-title">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h3 id="state-title" className="text-sm font-semibold text-gray-900">실행 상태</h3>
                </div>
                <div className="space-y-4 p-4 lg:h-[calc(100%-45px)] lg:overflow-y-auto">
                  {Object.keys(step.globals_vars || {}).length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">전역 변수</h4>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <VariableRows values={step.globals_vars || {}} />
                      </div>
                    </div>
                  )}

                  {activeFrames.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">호출 스택</h4>
                      <div className="space-y-2">
                        {activeFrames.map((frame, index) => {
                          const isCurrent = index === activeFrames.length - 1;
                          return (
                            <div key={`${frame.call_id || frame.func_name}-${index}`} className={`rounded-lg border p-3 ${
                              isCurrent ? 'border-indigo-300 bg-indigo-50/60' : 'border-gray-200 bg-white'
                            }`}>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="break-all font-mono text-xs font-semibold text-gray-900">{frameTitle(frame)}</span>
                                {isCurrent && <span className="text-[11px] font-semibold text-indigo-700">현재</span>}
                              </div>
                              <VariableRows values={frame.encoded_locals || {}} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {Object.keys(step.globals_vars || {}).length === 0 && activeFrames.length === 0 && (
                    <p className="pt-6 text-center text-sm text-gray-400">아직 생성된 변수가 없습니다.</p>
                  )}
                </div>
              </section>

              <section className="min-h-[24rem] border-b border-gray-200 lg:min-h-0 lg:border-b-0 lg:border-r" aria-labelledby="flow-title">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h3 id="flow-title" className="text-sm font-semibold text-gray-900">코드 흐름</h3>
                </div>
                <div className="space-y-4 p-4 lg:h-[calc(100%-45px)] lg:overflow-y-auto">
                  {renderCurrentFlow()}
                  {renderCallTree()}
                </div>
              </section>

              <section className="flex min-h-[28rem] flex-col lg:min-h-0" aria-labelledby="code-title">
                <div className="border-b border-gray-700 bg-gray-900 px-4 py-3">
                  <h3 id="code-title" className="text-sm font-semibold text-gray-100">코드</h3>
                </div>
                <div className="min-h-0 flex-1 overflow-auto bg-gray-950 py-2 font-mono text-sm">
                  {visualizationData.code_lines.map((line, index) => {
                    const lineNumber = index + 1;
                    const isCurrentLine = step.line === lineNumber;
                    return (
                      <div key={lineNumber} className={`flex min-w-max ${isCurrentLine ? 'bg-indigo-500/20' : ''}`}>
                        <span className={`w-12 flex-shrink-0 select-none py-1 pr-4 text-right ${
                          isCurrentLine ? 'font-semibold text-indigo-300' : 'text-gray-600'
                        }`}>
                          {lineNumber}
                        </span>
                        <code className={`min-w-0 whitespace-pre py-1 pr-6 ${isCurrentLine ? 'text-white' : 'text-gray-300'}`}>
                          {line || ' '}
                        </code>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-gray-800 bg-gray-950">
                  <div className="border-b border-gray-800 px-4 py-2 text-xs font-semibold text-gray-400">출력</div>
                  <div className="max-h-32 min-h-16 overflow-y-auto p-4">
                    {step.output ? (
                      <pre className="whitespace-pre-wrap font-mono text-sm text-emerald-400">{step.output}</pre>
                    ) : (
                      <p className="text-xs text-gray-600">아직 출력이 없습니다.</p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <footer className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentStep(0)} disabled={currentStep === 0} className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" title="처음으로" aria-label="처음 단계">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" /></svg>
                  </button>
                  <button onClick={() => setCurrentStep((value) => Math.max(0, value - 1))} disabled={currentStep === 0} className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" title="이전" aria-label="이전 단계">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" /></svg>
                  </button>
                  <button onClick={() => setIsPlaying((value) => !value)} className="rounded-md bg-indigo-600 p-2 text-white hover:bg-indigo-700" title={isPlaying ? '일시정지' : '재생'} aria-label={isPlaying ? '일시정지' : '자동 재생'}>
                    {isPlaying ? (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4a1 1 0 011-1h1a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4zm5 0a1 1 0 011-1h1a1 1 0 011 1v12a1 1 0 01-1 1h-1a1 1 0 01-1-1V4z" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.3 3.8A1 1 0 015 4.67v10.66a1 1 0 001.3.95l8-5.33a1 1 0 000-1.9l-8-5.25z" /></svg>
                    )}
                  </button>
                  <button onClick={() => setCurrentStep((value) => Math.min(lastStep, value + 1))} disabled={currentStep >= lastStep} className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" title="다음" aria-label="다음 단계">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" /></svg>
                  </button>
                  <button onClick={() => setCurrentStep(lastStep)} disabled={currentStep >= lastStep} className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" title="마지막으로" aria-label="마지막 단계">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" /></svg>
                  </button>
                </div>
                <span className="text-xs font-medium text-gray-600">{currentStep + 1} / {visualizationData.steps.length}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-indigo-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

export default VisualizationModal;
