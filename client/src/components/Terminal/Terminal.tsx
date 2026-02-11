import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io } from 'socket.io-client';
import 'xterm/css/xterm.css';
import TerminalSuggestions from './TerminalSuggestions';

const COMMON_COMMANDS = [
    'git status', 'git add .', 'git commit -m ""', 'git push', 'git pull', 'git checkout', 'git branch',
    'npm install', 'npm run dev', 'npm start', 'npm test', 'npm run build',
    'cd ..', 'ls -la', 'mkdir ', 'rm -rf ', 'touch ',
    'node ', 'python3 ', 'docker ps', 'docker-compose up'
];

const TerminalComponent = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminalInstance = useRef<Terminal | null>(null);
    const socketRef = useRef<any>(null);

    // IntelliSense State
    const [currentInput, setCurrentInput] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
    const [isConnected, setIsConnected] = useState(false);
    const commandHistory = useRef<string[]>([]);
    
    // Refs for closure access in event handlers
    const currentInputRef = useRef(currentInput);
    const showOverlayRef = useRef(showOverlay);
    const suggestionsRef = useRef(suggestions);
    const selectedIndexRef = useRef(selectedIndex);

    useEffect(() => { currentInputRef.current = currentInput; }, [currentInput]);
    useEffect(() => { showOverlayRef.current = showOverlay; }, [showOverlay]);
    useEffect(() => { suggestionsRef.current = suggestions; }, [suggestions]);
    useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
            }
        });
        terminalInstance.current = term;

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        const socket = io('http://localhost:3001');
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to terminal backend');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from terminal backend');
            setIsConnected(false);
        });

        socket.on('connect_error', (error: any) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        // Custom Key Handler for Tab and Arrows
        term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
            if (e.type === 'keydown') { // Only handle keydown
                if (e.key === 'Tab') {
                     // Check if overlay is visible (we need a ref for current state inside closure)
                     // using a ref for `showOverlay` state
                     if (showOverlayRef.current && suggestionsRef.current.length > 0) {
                         const selected = suggestionsRef.current[selectedIndexRef.current];
                         const current = currentInputRef.current;
                         // Completion Logic
                         // Basic: if starts with, append suffix
                         if (selected && current) {
                             // Find common prefix length? 
                             // Simplify: just remove current input usage and replace or append.
                             // For this demo: append the diff
                             if (selected.startsWith(current)) {
                                 const suffix = selected.slice(current.length);
                                 socket.emit('input', suffix);
                                 // We need to update user input state too, but onData handles echoing
                                 // Actually onData from user typing handles state.
                                 // But we are emitting programmatically.
                                 // We should mimic typing or update state manually.
                                 setCurrentInput(prev => prev + suffix);
                             }
                         }
                         
                         setShowOverlay(false);
                         return false; // Prevent default Tab behavior (focus change)
                     }
                }
                
                // Allow Up/Down navigation in menu
                if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && showOverlayRef.current) {
                    if (e.key === 'ArrowUp') {
                        setSelectedIndex(prev => {
                            const newIdx = prev > 0 ? prev - 1 : suggestionsRef.current.length - 1;
                            selectedIndexRef.current = newIdx; // Keep ref sync
                            return newIdx;
                        });
                    } else {
                        setSelectedIndex(prev => {
                            const newIdx = prev < suggestionsRef.current.length - 1 ? prev + 1 : 0;
                            selectedIndexRef.current = newIdx; // Keep ref sync
                            return newIdx;
                        });
                    }
                    return false; // consume
                }
            }
            return true; // Allow other keys
        });

        socket.on('output', (data: string) => {
            term.write(data);
        });

        // Intercept input for IntelliSense tracking
        term.onData((data: string) => {
             const code = data.charCodeAt(0);
             
             // Forward all data to backend immediately
             socket.emit('input', data);

             // Enter
             if (code === 13) {
                 if (currentInputRef.current.trim()) {
                    commandHistory.current.push(currentInputRef.current.trim());
                    if (commandHistory.current.length > 50) commandHistory.current.shift();
                 }
                 setCurrentInput('');
                 setShowOverlay(false);
             } 
             // Backspace
             else if (code === 127) {
                 setCurrentInput(prev => prev.slice(0, -1));
             } 
             // Printable characters
             else if (code >= 32 && code <= 126) {
                 setCurrentInput(prev => prev + data);
             }
        });

        const handleResize = () => {
            fitAddon.fit();
            socket.emit('resize', { cols: term.cols, rows: term.rows });
        };

        window.addEventListener('resize', handleResize);
        
        setTimeout(() => {
            handleResize();
        }, 100);

        return () => {
            socket.disconnect();
            term.dispose();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Update suggestions and position
    useEffect(() => {
        if (!currentInput) {
            setShowOverlay(false);
            return;
        }

        const params = getCurrentInputParams(currentInput);
        if (!params.prefix) {
             setShowOverlay(false);
             return;
        }

        const historySuggestions = commandHistory.current
            .filter(cmd => cmd.startsWith(params.prefix) && cmd !== params.prefix)
            .reverse()
            .slice(0, 3); // Top 3 history matches

        const commonSuggestions = COMMON_COMMANDS
            .filter(cmd => cmd.startsWith(params.prefix) && cmd !== params.prefix)
            .slice(0, 5);
        
        // Merge unique
        const all = Array.from(new Set([...historySuggestions, ...commonSuggestions]));

        if (all.length > 0) {
            setSuggestions(all);
            setSelectedIndex(0);
            updateOverlayPosition();
            setShowOverlay(true);
        } else {
            setShowOverlay(false);
        }

    }, [currentInput]);

    const getCurrentInputParams = (input: string) => {
        // Very basic: match last word or whole line?
        // Let's try matching the whole line for simple commands
        return { prefix: input };
    };

    const updateOverlayPosition = () => {
         if (!terminalInstance.current || !terminalRef.current) return;
         
         // Get cursor position from xterm
         const buffer = terminalInstance.current.buffer.active;
         const cursorX = buffer.cursorX;
         const cursorY = buffer.cursorY;

         // Try to get dimensions from renderer
         let charWidth = 9;
         let charHeight = 17;

         try {
             const dims = (terminalInstance.current as any)._core._renderService.dimensions;
             if (dims.css.cell.width && dims.css.cell.height) {
                 charWidth = dims.css.cell.width;
                 charHeight = dims.css.cell.height;
             } else if (dims.actualCellWidth && dims.actualCellHeight) {
                 charWidth = dims.actualCellWidth;
                 charHeight = dims.actualCellHeight;
             }
         } catch (e) {
             // Fallback
         }

         // Offset in terminal container
         // We add some padding for the container itself if needed (usually 10px)
         const padding = 10; 
         const top = (cursorY * charHeight) + charHeight + 5; // +5 for gap
         const left = (cursorX * charWidth) + padding;

         setOverlayPosition({ x: left, y: top });
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div 
                style={{ 
                    position: 'absolute', 
                    top: '5px', 
                    right: '10px', 
                    zIndex: 10,
                    fontSize: '10px',
                    color: isConnected ? '#4caf50' : '#f44336',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
            >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                {isConnected ? 'LIVE' : 'DISCONNECTED'}
            </div>
            <div ref={terminalRef} style={{ width: '100%', height: '100%' }} className="terminal-container" />
            <TerminalSuggestions 
                suggestions={suggestions} 
                selectedIndex={selectedIndex} 
                position={overlayPosition} 
                visible={showOverlay} 
            />
        </div>
    );
};

export default TerminalComponent;
