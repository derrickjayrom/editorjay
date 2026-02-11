import React, { useState, useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  separator?: undefined;
}

interface MenuSeparator {
  separator: true;
  label?: undefined;
  shortcut?: undefined;
  action?: undefined;
}

type MenuEntry = MenuItem | MenuSeparator;

interface MenuBarProps {
  onSave: () => void;
  onRun: () => void;
  onNewFile: () => void;
  onOpenFolder: () => void;
  showHiddenFiles: boolean;
  onToggleHiddenFiles: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ onSave, onRun, onNewFile, onOpenFolder, showHiddenFiles, onToggleHiddenFiles }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const menus: { id: string; label: string; items: MenuEntry[] }[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New File', shortcut: 'Ctrl+N', action: onNewFile },
        { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: onOpenFolder },
        { separator: true },
        { label: 'Save', shortcut: 'Ctrl+S', action: onSave },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
        { separator: true },
        { label: 'Exit', action: () => window.close() } // Browsers might block this
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z' },
        { label: 'Redo', shortcut: 'Ctrl+Y' },
        { separator: true },
        { label: 'Cut', shortcut: 'Ctrl+X' },
        { label: 'Copy', shortcut: 'Ctrl+C' },
        { label: 'Paste', shortcut: 'Ctrl+V' }
      ]
    },
    {
        id: 'selection',
        label: 'Selection',
        items: [{ label: 'Select All', shortcut: 'Ctrl+A' }]
    },
    {
        id: 'view',
        label: 'View',
        items: [
            { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P' },
            { separator: true },
            { 
                label: `${showHiddenFiles ? '✓ ' : ''}Show Hidden Files`, 
                action: onToggleHiddenFiles 
            }
        ]
    },
    {
        id: 'go',
        label: 'Go',
        items: [{ label: 'Go to File...', shortcut: 'Ctrl+P' }]
    },
    {
      id: 'run',
      label: 'Run',
      items: [
        { label: 'Start Debugging', shortcut: 'F5' },
        { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: onRun }
      ]
    },
    {
        id: 'terminal',
        label: 'Terminal',
        items: [{ label: 'New Terminal', shortcut: 'Ctrl+Shift+`' }]
    },
    {
        id: 'help',
        label: 'Help',
        items: [{ label: 'Welcome' }]
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleMouseEnter = (menuId: string) => {
    if (activeMenu) { // If a menu is already open, switching on hover feels like native behavior
      setActiveMenu(menuId);
    }
  };

  return (
    <div className="menu-bar" ref={menuRef}>
        <div className="menu-logo">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path fill="#007ACC" d="M11.5,1L15,3v10l-3.5,2L11,15V1L11.5,1z M4.5,1L1,3v10l3.5,2L5,15V1L4.5,1z M5,1h6v14H5V1z"/>
            </svg>
        </div>
      {menus.map((menu) => (
        <div 
            key={menu.id} 
            className={`menu-item ${activeMenu === menu.id ? 'active' : ''}`}
            onClick={() => handleMenuClick(menu.id)}
            onMouseEnter={() => handleMouseEnter(menu.id)}
        >
          <span className="menu-label">{menu.label}</span>
          {activeMenu === menu.id && (
            <div className="dropdown-menu">
              {menu.items.map((item, index) => (
                item.separator ? (
                    <div key={index} className="dropdown-separator" />
                ) : (
                    <div 
                        key={index} 
                        className="dropdown-item" 
                        onClick={(e) => {
                            e.stopPropagation();
                            item.action?.();
                            setActiveMenu(null);
                        }}
                    >
                    <span className="item-label">{item.label}</span>
                    {item.shortcut && <span className="item-shortcut">{item.shortcut}</span>}
                    </div>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MenuBar;
