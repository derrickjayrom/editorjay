import { useState, useEffect, useRef } from 'react';
import './App.css';
import CodeEditor from './components/Editor/Editor';
import FileExplorer from './components/FileExplorer';
import ActivityBar from './components/Layout/ActivityBar';
import StatusBar from './components/Layout/StatusBar';
import Panel from './components/Layout/Panel';

import MenuBar from './components/Layout/MenuBar';

import EditorTabs from './components/Layout/EditorTabs';

interface FileItem {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface OpenFile {
  id: string; // Absolute path or untitled-x
  name: string;
  content: string;
  isDirty: boolean;
  path?: string; // Undefined for untitled until saved
}

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  
  const [output, setOutput] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('explorer');

  // New File Counter
  const untitledCount = useRef(1);

  const fetchFiles = (path?: string) => {
    const url = path ? `http://localhost:3001/files?path=${encodeURIComponent(path)}` : 'http://localhost:3001/files';
    fetch(url)
      .then(res => res.json())
      .then(data => {
          if (data.error) {
              console.error(data.error);
              return;
          }
          setFiles(data.files);
          setCurrentPath(data.currentPath);
      })
      .catch(err => console.error('Failed to load files', err));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileClick = (file: FileItem) => {
    if (file.isDirectory) {
        if (file.name === '..') {
            // Very basic "up", backend usually handles paths, but here we rely on the implementation details
            // Actually, for ".." assuming we just want to go up one level. 
            // A naive split implementation for now:
            // This is tricky without 'path' lib in browser.
            // Let's rely on backend: if we send '..', backend might not handle it broadly.
            // Better: use the currentPath.
            // For now, let's assume standard 'cd ..' behavior isn't fully robust in frontend string manip, 
            // but let's try to strip the last segment.
            const parent = currentPath.split(/[/\\]/).slice(0, -1).join('/'); // rudimentary
            fetchFiles(parent || '/');
        } else {
            fetchFiles(file.path);
        }
    } else {
        // Open File
        const existingTab = openFiles.find(f => f.id === file.path);
        if (existingTab) {
            setActiveFileId(existingTab.id);
            return;
        }

        fetch(`http://localhost:3001/files/content?path=${encodeURIComponent(file.path)}`)
          .then(res => res.json())
          .then(data => {
             const newFile: OpenFile = {
                 id: file.path,
                 name: file.name,
                 content: data.content,
                 isDirty: false,
                 path: file.path
             };
             setOpenFiles([...openFiles, newFile]);
             setActiveFileId(newFile.id);
             setOutput(''); 
          })
          .catch(err => console.error('Failed to load file content', err));
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (activeFileId && value !== undefined) {
        setOpenFiles(prev => prev.map(f => {
            if (f.id === activeFileId) {
                return { ...f, content: value, isDirty: true };
            }
            return f;
        }));
    }
  };

  const saveFile = () => {
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile) return;

    let targetPath = activeFile.path;
    
    // If untitled, ask for path
    if (!targetPath) {
        // Basic prompt for now. In a real app, a modal file picker.
        // We'll suggest saving in currentPath
        const filename = prompt('Enter filename to save:', activeFile.name);
        if (!filename) return; // Cancelled
        
        // Construct path - naïve approach
        // We really need a separator. Let's guess '/' for linux/mac users.
        targetPath = `${currentPath}/${filename}`;
    }

    fetch('http://localhost:3001/files/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath, content: activeFile.content }),
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert('Failed to save: ' + data.error);
        } else {
            // Update tab state
            setOpenFiles(prev => prev.map(f => {
                if (f.id === activeFileId) {
                    return { 
                        ...f, 
                        isDirty: false, 
                        path: targetPath, 
                        id: targetPath!, // Update ID to real path
                        name: targetPath!.split(/[/\\]/).pop() || filename!
                    }; 
                }
                return f;
            }));
            // Update active ID if it changed
            if (activeFile.id !== targetPath) {
                setActiveFileId(targetPath);
            }
            // Refresh file list if we saved in current directory
            fetchFiles(currentPath);
        }
    })
    .catch(err => console.error('Failed to save file', err));
  };

  const runCode = () => {
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (activeFile && activeFile.path) {
        // Auto-save before running
        if (activeFile.isDirty) {
             saveFile(); 
             // Ideally we wait for save to finish, but for this simpler implementation:
             // We trigger save, but the run request might read old file.
             // Let's rely on saveFile being fast or the user manually saving for 100% correctness for now,
             // or implement promise chain in future.
             // Actually, `saveFile` doesn't return promise here easily.
             // We'll perform a separate direct save-then-run fetch here for reliability.
             fetch('http://localhost:3001/files/save', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ path: activeFile.path, content: activeFile.content }),
             }).then(() => {
                 executeRun(activeFile.path!);
             });
        } else {
            executeRun(activeFile.path);
        }
    } else {
        alert('Please save the file before running.');
    }
  };

  const executeRun = (path: string) => {
    fetch('http://localhost:3001/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
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

  const handleNewFile = () => {
      const id = `untitled-${untitledCount.current++}`;
      const newFile: OpenFile = {
          id,
          name: id,
          content: '',
          isDirty: true
      };
      setOpenFiles([...openFiles, newFile]);
      setActiveFileId(id);
  };

  const handleTabClose = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const filesAfterClose = openFiles.filter(f => f.id !== id);
      setOpenFiles(filesAfterClose);
      
      if (activeFileId === id) {
          // Switch to last available, or null
          setActiveFileId(filesAfterClose.length > 0 ? filesAfterClose[filesAfterClose.length - 1].id : null);
      }
  };

  const activeFile = openFiles.find(f => f.id === activeFileId);

  return (
    <div className="app-container">
      <MenuBar onSave={saveFile} onRun={runCode} onNewFile={handleNewFile} />
      <ActivityBar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="sidebar">
        {activeView === 'explorer' && (
          <FileExplorer 
              files={files} 
              onFileClick={handleFileClick} 
              currentPath={currentPath}
          />
        )}
        {activeView === 'search' && (
            <div style={{padding: '10px', color: '#ccc'}}>Search not implemented yet</div>
        )}
      </div>

      <div className="main-content">
        <EditorTabs 
            tabs={openFiles.map(f => ({ id: f.id, name: f.name, isDirty: f.isDirty }))}
            activeTabId={activeFileId}
            onTabClick={setActiveFileId}
            onTabClose={handleTabClose}
        />
        <div style={{ padding: '0px 10px', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '0px' }}>
             {/* breadcrumbs or info could go here, previously active file name */}
        </div>
        <div style={{ flex: 1, borderTop: '1px solid #252526' }}>
            {activeFile ? (
                <CodeEditor 
                initialValue={activeFile.content} 
                key={activeFileId} // Force re-render on file switch (simple method)
                onChange={handleCodeChange}
                language={activeFile.name.split('.').pop()}
                />
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                    Select a file or create a new one
                </div>
            )}
        </div>
      </div>

      <Panel output={output} />
      
      <StatusBar language={activeFile?.name.split('.').pop()?.toUpperCase() || 'PLAINTEXT'} />
    </div>
  );
}

export default App;


