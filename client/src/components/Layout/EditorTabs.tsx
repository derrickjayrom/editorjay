import React from 'react';

interface EditorTab {
  id: string; // Absolute path or 'untitled-x'
  name: string;
  isDirty?: boolean;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string, e: React.MouseEvent) => void;
}

const EditorTabs: React.FC<EditorTabsProps> = ({ tabs, activeTabId, onTabClick, onTabClose }) => {
  return (
    <div className="editor-tabs" style={{ display: 'flex', overflowX: 'auto', backgroundColor: '#252526', height: '35px' }}>
      {tabs.map(tab => (
        <div 
          key={tab.id} 
          className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
          onClick={() => onTabClick(tab.id)}
          style={{
            padding: '5px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: activeTabId === tab.id ? '#1e1e1e' : 'transparent',
            color: activeTabId === tab.id ? '#ffffff' : '#969696',
            borderRight: '1px solid #252526',
            minWidth: '120px',
            maxWidth: '200px',
            fontSize: '13px',
            userSelect: 'none'
          }}
        >
          <span style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              marginRight: '8px',
              fontStyle: tab.isDirty ? 'italic' : 'normal'
            }}>
            {tab.name} {tab.isDirty && '●'}
          </span>
          <span 
            className="close-tab-btn"
            onClick={(e) => onTabClose(tab.id, e)}
            style={{ marginLeft: 'auto', fontSize: '14px', opacity: 0.7, padding: '0 2px' }}
          >
            ×
          </span>
        </div>
      ))}
    </div>
  );
};

export default EditorTabs;
