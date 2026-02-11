import { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import CodeEditor from './components/Editor/Editor';
import FileExplorer from './components/FileExplorer';
import ActivityBar from './components/Layout/ActivityBar';
import StatusBar from './components/Layout/StatusBar';
import Panel from './components/Layout/Panel';

import MenuBar from './components/Layout/MenuBar';

import EditorTabs from './components/Layout/EditorTabs';
import FolderPicker from './components/Modals/FolderPicker';

interface FileNode {
  name: string;
  isDirectory: boolean;
  path: string;
  children?: FileNode[];
  isOpen?: boolean;
}

interface OpenFile {
  id: string; // Absolute path or untitled-x
  name: string;
  content: string;
  isDirty: boolean;
  path?: string; // Undefined for untitled until saved
}

function App() {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [showHiddenFiles, setShowHiddenFiles] = useState<boolean>(false);
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [rootName, setRootName] = useState<string>('Explorer');
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  
  const [output, setOutput] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('explorer');

  // New File Counter
  const untitledCount = useRef(1);

  // Helper to filter hidden files
  // We use useMemo to avoid re-calculating on every render if tree/showHidden doesn't change
  const visibleTree = useMemo(() => {
      const filterNodes = (nodes: FileNode[]): FileNode[] => {
          return nodes
              .filter(node => showHiddenFiles || !node.name.startsWith('.'))
              .map(node => ({
                  ...node,
                  children: node.children ? filterNodes(node.children) : undefined
              }));
      };
      return filterNodes(fileTree);
  }, [fileTree, showHiddenFiles]);

  const toggleHiddenFiles = () => setShowHiddenFiles(prev => !prev);

  const handleOpenFolder = () => {
      setIsFolderPickerOpen(true);
  };

  const onFolderSelect = (path: string) => {
      setIsFolderPickerOpen(false);
      setRootPath(path);
      setRootName(path.split(/[/\\]/).pop() || path || 'Explorer');
  };

  // Helper to update the tree deeply
  const updateTree = (nodes: FileNode[], path: string, newChildren: FileNode[]): FileNode[] => {
      return nodes.map(node => {
          if (node.path === path) {
              return { ...node, children: newChildren, isOpen: true }; // Expand and set children
          }
          if (node.children) {
              return { ...node, children: updateTree(node.children, path, newChildren) };
          }
          return node;
      });
  };

  const toggleFolder = (node: FileNode) => {
      if (!node.isDirectory) return;

      // Toggle Close
      if (node.isOpen) {
          const closeNode = (nodes: FileNode[]): FileNode[] => {
              return nodes.map(n => {
                  if (n.path === node.path) {
                      return { ...n, isOpen: false };
                  }
                  if (n.children) {
                      return { ...n, children: closeNode(n.children) };
                  }
                  return n;
              });
          };
          setFileTree(prev => closeNode(prev));
          return;
      }

      // Open: If we already have children, just open. Otherwise fetch.
      if (node.children && node.children.length > 0) {
           const openNode = (nodes: FileNode[]): FileNode[] => {
              return nodes.map(n => {
                  if (n.path === node.path) {
                      return { ...n, isOpen: true };
                  }
                  if (n.children) {
                      return { ...n, children: openNode(n.children) };
                  }
                  return n;
              });
          };
          setFileTree(prev => openNode(prev));
      } else {
          // Fetch children
          fetch(`http://localhost:3001/files?path=${encodeURIComponent(node.path)}`)
              .then(res => res.json())
              .then(data => {
                  if (data.error) {
                      console.error(data.error);
                      return;
                  }
                  // data.files are the children
                  const children = data.files.map((f: any) => ({ ...f, isOpen: false }));
                  setFileTree(prev => updateTree(prev, node.path, children));
              })
              .catch(err => console.error('Failed to load folder', err));
      }
  };

  const fetchRoot = (path: string | null) => {
      if (!path) {
          setFileTree([]);
          return;
      }
      const url = `http://localhost:3001/files?path=${encodeURIComponent(path)}`;
      fetch(url) 
      .then(res => res.json())
      .then(data => {
          if (data.error) {
              alert(data.error);
              return;
          }
          const initialNodes = data.files.map((f: any) => ({ ...f, isOpen: false }));
          setFileTree(initialNodes);
      })
      .catch(console.error);
  };

  // Initial Fetch & Root Change Fetch
  useEffect(() => {
    if (rootPath) {
        fetchRoot(rootPath);
    }
  }, [rootPath]);


  const handleFileClick = (file: FileNode) => {
    if (file.isDirectory) {
        toggleFolder(file);
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
        // We really need a separator. Let's guess '/' for linux.
        // Defaulting to root of workspace effectively if we don't have a specific path context
        // Ideally we would know which folder was 'selected' in the tree, but for now let's just use the filename which implies root if no path given
        // However, the backend expects a full path or relative to workspace. 
        // If we just send 'filename.txt', the backend might put it in the root of the workspace.
        targetPath = rootPath ? `${rootPath}/${filename}` : filename; 
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
                        name: targetPath!.split(/[/\\]/).pop()!
                    }; 
                }
                return f;
            }));
            // Update active ID if it changed
            if (activeFile.id !== targetPath) {
                setActiveFileId(targetPath);
            }
            // Refresh file list if we saved in current directory
            fetchRoot(rootPath);
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
      <MenuBar 
        onSave={saveFile} 
        onRun={runCode} 
        onNewFile={handleNewFile}
        onOpenFolder={handleOpenFolder}
        showHiddenFiles={showHiddenFiles}
        onToggleHiddenFiles={toggleHiddenFiles}
      />
      <ActivityBar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="sidebar">
        {activeView === 'explorer' && (
          <FileExplorer 
              files={visibleTree} 
              onFileClick={handleFileClick}
              rootName={rootName}
              onOpenFolder={handleOpenFolder}
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

      <FolderPicker 
        isOpen={isFolderPickerOpen} 
        onClose={() => setIsFolderPickerOpen(false)} 
        onSelect={onFolderSelect}
        initialPath={rootPath}
      />
    </div>
  );
}

export default App;
