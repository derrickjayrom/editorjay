import React, { useState, useEffect } from 'react';

interface FileNode {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface FolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  initialPath?: string | null;
}

const FolderPicker: React.FC<FolderPickerProps> = ({ isOpen, onClose, onSelect, initialPath }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folders, setFolders] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // If initialPath is provided, use it, otherwise start at root (empty string for our API)
      fetchFolders(initialPath || '');
    }
  }, [isOpen]);

  const fetchFolders = (path: string) => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:3001/files?path=${encodeURIComponent(path)}`)
      .then(res => {
        if (!res.ok) throw new Error('Backend unavailable. Make sure server is running on port 3001.');
        return res.json();
      })
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          // Filter to only directories
          setFolders(data.files.filter((f: any) => f.isDirectory));
          setCurrentPath(path);
        }
      })
      .catch(err => setError(err.message || 'Failed to load folders'))
      .finally(() => setLoading(false));
  };

  const handleFolderClick = (path: string) => {
    fetchFolders(path);
  };

  const handleBack = () => {
    // Basic path manipulation for "Up"
    const parts = currentPath.split(/[/\\]/).filter(Boolean);
    if (parts.length === 0) return; // Already at root
    parts.pop();
    const parentPath = currentPath.startsWith('/') ? '/' + parts.join('/') : parts.join('/');
    fetchFolders(parentPath);
  };
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Open Folder</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="path-breadcrumbs">
            <span onClick={() => fetchFolders('')} style={{ cursor: 'pointer', color: '#007acc' }}>Root</span>
            {currentPath.split(/[/\\]/).filter(Boolean).map((part, i, arr) => (
              <React.Fragment key={i}>
                <span className="breadcrumb-separator"> / </span>
                <span 
                    style={{ cursor: 'pointer', color: '#007acc' }}
                    onClick={() => {
                        const path = currentPath.startsWith('/') 
                            ? '/' + arr.slice(0, i + 1).join('/')
                            : arr.slice(0, i + 1).join('/');
                        fetchFolders(path);
                    }}
                >
                    {part}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="folder-list">
            {loading && <div className="loading">Loading...</div>}
            {error && <div className="error">{error}</div>}
            
            <div 
                className="folder-item parent-dir" 
                onClick={handleBack}
                style={{ display: currentPath ? 'flex' : 'none' }}
            >
              <span className="icon">📁</span>
              <span className="name">..</span>
            </div>

            {!loading && !error && folders.map(folder => (
              <div 
                key={folder.path} 
                className="folder-item"
                onClick={() => handleFolderClick(folder.path)}
              >
                <span className="icon">📁</span>
                <span className="name">{folder.name}</span>
              </div>
            ))}
            {!loading && !error && folders.length === 0 && (
                <div className="no-folders">No subfolders found</div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="selected-path">
              <strong>Selected:</strong> {currentPath || '(Root)'}
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSelect(currentPath)}>Select Folder</button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          color: #ccc;
        }
        .modal-content {
          background: #252526;
          width: 500px;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          max-height: 80vh;
        }
        .modal-header {
          padding: 12px 16px;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 14px;
          text-transform: uppercase;
          opacity: 0.8;
        }
        .close-btn {
          background: none;
          border: none;
          color: #ccc;
          font-size: 20px;
          cursor: pointer;
        }
        .modal-body {
          padding: 16px;
          overflow-y: auto;
          flex: 1;
        }
        .path-breadcrumbs {
          margin-bottom: 12px;
          padding: 8px;
          background: #1e1e1e;
          border-radius: 2px;
          font-family: monospace;
          font-size: 12px;
          white-space: nowrap;
          overflow-x: auto;
        }
        .folder-list {
          border: 1px solid #333;
          background: #1e1e1e;
          min-height: 200px;
        }
        .folder-item {
          padding: 6px 12px;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .folder-item:hover {
          background: #2a2d2e;
        }
        .folder-item .icon {
          margin-right: 8px;
          font-size: 14px;
        }
        .folder-item .name {
          font-size: 13px;
        }
        .modal-footer {
          padding: 12px 16px;
          border-top: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .selected-path {
          font-size: 12px;
          opacity: 0.7;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 250px;
        }
        .btn {
          padding: 6px 16px;
          border-radius: 2px;
          border: none;
          cursor: pointer;
          font-size: 12px;
        }
        .btn-primary {
          background: #007acc;
          color: white;
          margin-left: 8px;
        }
        .btn-primary:hover {
          background: #0062a3;
        }
        .btn-secondary {
          background: #3c3c3c;
          color: white;
        }
        .btn-secondary:hover {
          background: #454545;
        }
        .loading, .error, .no-folders {
          padding: 20px;
          text-align: center;
          font-style: italic;
          color: #666;
        }
        .error { color: #f48771; }
      `}</style>
    </div>
  );
};

export default FolderPicker;
