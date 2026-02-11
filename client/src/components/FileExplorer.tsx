
import React from 'react';

interface FileItem {
    name: string;
    isDirectory: boolean;
    path: string;
}

interface FileExplorerProps {
  files: FileItem[];
  onFileClick: (file: FileItem) => void;
  currentPath: string;
}

const FileExplorer = ({ files, onFileClick, currentPath }: FileExplorerProps) => {
  // Simple '..' navigation
  const handleGoUp = () => {
      // Logic handled by parent or we just emit a special click
     onFileClick({ name: '..', isDirectory: true, path: '..' });
  };

  return (
    <div className="sidebar-content">
      <div style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6 }}>Explorer</h3>
        <div style={{ fontSize: '12px', marginBottom: '10px', wordBreak: 'break-all', color: '#ccc' }}>
            {currentPath}
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li
            onClick={handleGoUp}
            style={{ padding: '4px 14px', cursor: 'pointer', color: '#ccc', fontSize: '13px' }}
        >
            ..
        </li>
        {files.map(file => (
          <li 
            key={file.name} 
            onClick={() => onFileClick(file)}
            style={{ 
              cursor: 'pointer', 
              padding: '4px 10px', 
              color: file.isDirectory ? '#dcb67a' : '#ccc', // Yellowish for folders
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span style={{ marginRight: '6px' }}>
                {file.isDirectory ? '📁' : '📄'}
            </span>
            {file.name}
          </li>
        ))}
        {files.length === 0 && (
            <li style={{ padding: '10px', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
                No files found
            </li>
        )}
      </ul>
    </div>
  );
};

export default FileExplorer;
