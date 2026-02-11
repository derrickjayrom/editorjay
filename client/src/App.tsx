import { useState, useEffect } from 'react';
import './App.css';
import CodeEditor from './components/Editor/Editor';

function App() {
  const [code, setCode] = useState<string | undefined>('// Select a file to view its content');
  const [files, setFiles] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const [output, setOutput] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:3001/files')
      .then(res => res.json())
      .then(data => setFiles(data))
      .catch(err => console.error('Failed to load files', err));
  }, []);

  const handleFileClick = (filename: string) => {
    fetch(`http://localhost:3001/files/${filename}`)
      .then(res => res.json())
      .then(data => {
        setCode(data.content);
        setCurrentFile(filename);
        setOutput(''); // Clear output on file change
      })
      .catch(err => console.error('Failed to load file content', err));
  };

  const handleCodeChange = (value: string | undefined) => {
    setCode(value);
  };

  const saveFile = () => {
    if (currentFile && code) {
      fetch(`http://localhost:3001/files/${currentFile}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: code }),
      })
        .then(res => res.json())
        .then(() => alert('File saved!'))
        .catch(err => console.error('Failed to save file', err));
    }
  };

  const runCode = () => {
    if (currentFile) {
        // First save the file to ensure latest content is run
        saveFile(); 
        
        fetch(`http://localhost:3001/run/${currentFile}`, {
            method: 'POST',
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                setOutput(`Error:\n${data.error}\n\nOutput:\n${data.output || ''}`);
            } else {
                setOutput(data.output);
            }
        })
        .catch(err => setOutput(`Execution failed: ${err.message}`));
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h3>Files</h3>
        <ul>
          {files.map(file => (
            <li 
              key={file} 
              onClick={() => handleFileClick(file)}
              className={currentFile === file ? 'active' : ''}
              style={{ cursor: 'pointer', padding: '5px', backgroundColor: currentFile === file ? '#37373d' : 'transparent' }}
            >
              {file}
            </li>
          ))}
        </ul>
      </div>
      <div className="main-content">
        <div style={{ padding: '0px 10px', background: '#252526', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '35px' }}>
             <span>{currentFile ? currentFile : 'No file selected'}</span>
             <div>
                <button onClick={saveFile} disabled={!currentFile} style={{ padding: '2px 10px', cursor: 'pointer', marginRight: '10px' }}>Save</button>
                <button onClick={runCode} disabled={!currentFile} style={{ padding: '2px 10px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>Run</button>
             </div>
        </div>
        <div style={{ height: '70%', borderBottom: '1px solid #333' }}>
            <CodeEditor 
            initialValue={code} 
            key={currentFile} 
            onChange={handleCodeChange} 
            />
        </div>
        <div className="output-panel" style={{ height: '30%', padding: '10px', overflow: 'auto', backgroundColor: '#1e1e1e', fontFamily: 'monospace' }}>
            <h3 style={{ margin: 0, marginBottom: '10px' }}>Output:</h3>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{output}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
