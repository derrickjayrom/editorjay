import React from 'react';

// Using a simple SVG for the files icon as a placeholder if codicons aren't available yet
// In a real scenario we'd use the codicon library
const FilesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 9V3.5L18.5 9M6 2C4.89 2 4 2.89 4 4V20C4 21.1 5 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2H6Z" stroke="#858585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#858585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 21L16.65 16.65" stroke="#858585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


interface ActivityBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="activity-bar">
      <div 
        className={`activity-item ${activeView === 'explorer' ? 'active' : ''}`}
        onClick={() => onViewChange('explorer')}
        title="Explorer (Ctrl+Shift+E)"
      >
        <FilesIcon />
      </div>
      <div 
        className={`activity-item ${activeView === 'search' ? 'active' : ''}`}
        onClick={() => onViewChange('search')}
        title="Search (Ctrl+Shift+F)"
      >
        <SearchIcon />
      </div>
    </div>
  );
};

export default ActivityBar;
