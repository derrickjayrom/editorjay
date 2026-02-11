import React, { useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import './Editor.css';

interface CodeEditorProps {
  initialValue?: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  initialValue = '// Start coding here...', 
  language = 'javascript',
  onChange 
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define the custom "Dark+" theme
    monaco.editor.defineTheme('vscode-dark-plus', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'type.identifier', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      }
    });

    monaco.editor.setTheme('vscode-dark-plus');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="editor-container">
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={initialValue}
        theme="vscode-dark-plus" // Use the custom theme
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Consolas', monospace",
          wordWrap: 'on',
          automaticLayout: true,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 10 },
        }}
      />
    </div>
  );
};

export default CodeEditor;
