import React from 'react';

interface TerminalSuggestionsProps {
  suggestions: string[];
  selectedIndex: number;
  position: { x: number; y: number };
  visible: boolean;
}

const TerminalSuggestions: React.FC<TerminalSuggestionsProps> = ({ suggestions, selectedIndex, position, visible }) => {
  if (!visible || suggestions.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: '#252526',
        border: '1px solid #454545',
        borderRadius: '3px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        minWidth: '150px',
        maxWidth: '300px',
        color: '#cccccc',
        fontFamily: "'JetBrains Mono', 'Consolas', monospace",
        fontSize: '14px',
      }}
    >
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            style={{
              padding: '4px 8px',
              backgroundColor: index === selectedIndex ? '#094771' : 'transparent',
              color: index === selectedIndex ? '#ffffff' : '#cccccc',
              cursor: 'pointer',
            }}
          >
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TerminalSuggestions;
