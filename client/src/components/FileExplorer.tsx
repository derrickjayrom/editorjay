

interface FileNode {
    name: string;
    isDirectory: boolean;
    path: string;
    children?: FileNode[];
    isOpen?: boolean;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileClick: (file: FileNode) => void;
  rootName: string;
}

const FileTreeItem = ({ file, depth, onFileClick }: { file: FileNode, depth: number, onFileClick: (file: FileNode) => void }) => {
    return (
        <>
            <li 
                onClick={(e) => {
                    e.stopPropagation();
                    onFileClick(file);
                }}
                style={{ 
                    cursor: 'pointer', 
                    padding: `4px 10px 4px ${10 + depth * 15}px`, 
                    color: file.isDirectory ? '#dcb67a' : '#ccc', 
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'transparent'
                }}
                className="file-item"
            >
                <span style={{ marginRight: '6px', width: '16px', display: 'inline-block', textAlign: 'center' }}>
                    {file.isDirectory && (
                        file.isOpen ? '▼' : '▶'
                    )}
                </span>
                <span style={{ marginRight: '6px' }}>
                    {file.isDirectory ? '📁' : '📄'}
                </span>
                {file.name}
            </li>
            {file.isDirectory && file.isOpen && file.children && (
                file.children.map(child => (
                    <FileTreeItem key={child.path} file={child} depth={depth + 1} onFileClick={onFileClick} />
                ))
            )}
        </>
    );
};

const FileExplorer = ({ files, onFileClick, rootName }: FileExplorerProps) => {
  return (
    <div className="sidebar-content" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6 }}>Explorer</h3>
        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#aaa', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '4px' }}>▼</span>
            {rootName}
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {files.map(file => (
          <FileTreeItem key={file.path} file={file} depth={0} onFileClick={onFileClick} />
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
