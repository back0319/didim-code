import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  theme?: string;
  height?: string | number;
  width?: string | number;
  readOnly?: boolean;
  minimap?: boolean;
  fontSize?: number;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  automaticLayout?: boolean;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'python',
  theme = 'vs-dark',
  height = '400px',
  width = '100%',
  readOnly = false,
  minimap = true,
  fontSize = 14,
  lineNumbers = 'on',
  wordWrap = 'on',
  automaticLayout = true,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;
    
    // 에디터 설정 커스터마이징
    editor.updateOptions({
      fontSize,
      lineNumbers,
      wordWrap,
      minimap: { enabled: minimap },
      readOnly,
      automaticLayout,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      selectOnLineNumbers: true,
      roundedSelection: false,
      cursorStyle: 'line',
      cursorWidth: 2,
      // 코드 접기 기능
      folding: true,
      foldingHighlight: true,
      // 브래킷 매칭
      matchBrackets: 'always',
      // 들여쓰기 가이드
      guides: {
        indentation: true,
        bracketPairs: true,
      },
      // 공백 문자 표시
      renderWhitespace: 'boundary',
    });

    // Python 언어 서비스 향상
    if (language === 'python') {
      monaco.languages.setLanguageConfiguration('python', {
        comments: {
          lineComment: '#',
          blockComment: ['"""', '"""'],
        },
        brackets: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')'],
        ],
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"', notIn: ['string'] },
          { open: "'", close: "'", notIn: ['string', 'comment'] },
        ],
        surroundingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        indentationRules: {
          increaseIndentPattern: /^\s*(def|class|if|elif|else|while|for|try|except|finally|with)\b.*:$/,
          decreaseIndentPattern: /^\s*(elif|else|except|finally)\b.*:$/,
        },
      });
    }

    // 키보드 단축키 추가
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Ctrl+S 또는 Cmd+S로 코드 실행
      console.log('Save shortcut pressed');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // Ctrl+Enter 또는 Cmd+Enter로 코드 실행
      console.log('Run shortcut pressed');
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value);
  };

  // 에디터 값 설정 함수
  const setValue = (newValue: string) => {
    if (editorRef.current) {
      editorRef.current.setValue(newValue);
    }
  };

  // 선택된 텍스트 가져오기
  const getSelectedText = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection) {
        return editorRef.current.getModel()?.getValueInRange(selection);
      }
    }
    return '';
  };

  // 커서 위치로 이동
  const goToLine = (lineNumber: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  };

  // 에디터에 포커스 설정
  const focus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className="monaco-editor-container">
      <Editor
        height={height}
        width={width}
        language={language}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize,
          lineNumbers,
          wordWrap,
          minimap: { enabled: minimap },
          readOnly,
          automaticLayout,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'all',
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          cursorWidth: 2,
          folding: true,
          foldingHighlight: true,
          matchBrackets: 'always',
          guides: {
            indentation: true,
            bracketPairs: true,
          },
          renderWhitespace: 'boundary',
          // 성능 최적화
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showFunctions: true,
            showVariables: true,
            showClasses: true,
            showModules: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          parameterHints: {
            enabled: true,
          },
          hover: {
            enabled: true,
          },
        }}
      />
    </div>
  );
};

// 외부에서 에디터 조작을 위한 ref 타입
export interface MonacoEditorRef {
  setValue: (value: string) => void;
  getSelectedText: () => string | undefined;
  goToLine: (lineNumber: number) => void;
  focus: () => void;
}

export default MonacoEditor;