import React, { useState } from 'react';
import TerminalComponent from '../Terminal/Terminal';

interface PanelProps {
  output: string;
}

const Panel: React.FC<PanelProps> = ({ output }) => {
  const [activeTab, setActiveTab] = useState<'OUTPUT' | 'TERMINAL'>('TERMINAL');

  return (
    <div className="panel">
      <div className="panel-header">
        <span 
            className={`panel-tab ${activeTab === 'OUTPUT' ? 'active' : ''}`}
            onClick={() => setActiveTab('OUTPUT')}
        >
            OUTPUT
        </span>
        <span 
            className={`panel-tab ${activeTab === 'TERMINAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('TERMINAL')}
        >
            TERMINAL
        </span>
        <span className="panel-tab">DEBUG CONSOLE</span>
        <span className="panel-tab">PROBLEMS</span>
      </div>
      <div className="panel-content">
        {activeTab === 'OUTPUT' && <pre>{output}</pre>}
        {activeTab === 'TERMINAL' && <TerminalComponent />}
      </div>
    </div>
  );
};

export default Panel;
