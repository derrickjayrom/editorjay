import React from 'react';

interface StatusBarProps {
  language?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ language = 'Plain Text' }) => {
  return (
    <div className="status-bar">
      <div className="left-items">
        {/* Source Control branch icon placeholder */}
        <span className="status-item"><span style={{marginRight: '5px'}}>main*</span></span>
        <span className="status-item" style={{marginLeft: '10px'}}>0 errors, 0 warnings</span>
      </div>
      <div className="right-items">
         <span className="status-item">Ln 1, Col 1</span>
         <span className="status-item">UTF-8</span>
         <span className="status-item">{language}</span>
         <span className="status-item">Prettier</span>
      </div>
    </div>
  );
};

export default StatusBar;
