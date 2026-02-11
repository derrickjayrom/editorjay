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

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;
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
        theme="vs-dark"
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;
