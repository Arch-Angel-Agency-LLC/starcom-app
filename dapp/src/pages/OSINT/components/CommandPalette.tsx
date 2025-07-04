import React, { useState, useEffect, useCallback } from 'react';
import { Command, X, ChevronRight, Search } from 'lucide-react';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: string, args?: unknown) => void;
}

/**
 * CommandPalette - Keyboard-driven command interface for OSINT operations
 * 
 * Provides a quick way to execute commands, search for entities, and navigate
 * the OSINT dashboard using keyboard shortcuts.
 */
const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onExecuteCommand 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommandResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Command categories and available commands
  const commands = React.useMemo<CommandCategory[]>(() => [
    {
      name: 'Search',
      items: [
        { id: 'search-person', name: 'Search Person', description: 'Search for a person by name or identifier', args: ['query'] },
        { id: 'search-organization', name: 'Search Organization', description: 'Search for an organization', args: ['query'] },
        { id: 'search-domain', name: 'Search Domain', description: 'Search for a web domain or URL', args: ['query'] },
        { id: 'search-wallet', name: 'Search Wallet', description: 'Search for a cryptocurrency wallet', args: ['query'] },
      ]
    },
    {
      name: 'Panels',
      items: [
        { id: 'add-panel', name: 'Add Panel', description: 'Add a new panel to the dashboard', args: ['type'] },
        { id: 'remove-panel', name: 'Remove Panel', description: 'Remove a panel from the dashboard', args: ['id'] },
        { id: 'reset-layout', name: 'Reset Layout', description: 'Reset panel layout to default' },
        { id: 'save-layout', name: 'Save Layout', description: 'Save current panel layout', args: ['name'] },
      ]
    },
    {
      name: 'Investigation',
      items: [
        { id: 'new-investigation', name: 'New Investigation', description: 'Start a new investigation', args: ['name'] },
        { id: 'save-investigation', name: 'Save Investigation', description: 'Save current investigation state' },
        { id: 'export-data', name: 'Export Data', description: 'Export investigation data', args: ['format'] },
        { id: 'share-investigation', name: 'Share Investigation', description: 'Share investigation with team', args: ['recipients'] },
      ]
    },
    {
      name: 'Tools',
      items: [
        { id: 'screenshot', name: 'Take Screenshot', description: 'Capture screenshot of current view' },
        { id: 'dark-mode', name: 'Toggle Dark Mode', description: 'Switch between light and dark mode' },
        { id: 'fullscreen', name: 'Toggle Fullscreen', description: 'Enter or exit fullscreen mode' },
        { id: 'help', name: 'Show Help', description: 'Display help and keyboard shortcuts' },
      ]
    }
  ], []);

  // Filter commands based on user input
  useEffect(() => {
    if (!query.trim()) {
      // Show all commands when no query
      const allResults = commands.flatMap(category => 
        category.items.map(item => ({
          ...item,
          category: category.name
        }))
      );
      setResults(allResults);
      return;
    }

    // Filter commands that match the query
    const filtered = commands.flatMap(category => 
      category.items
        .filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        )
        .map(item => ({
          ...item,
          category: category.name
        }))
    );
    
    setResults(filtered);
    setSelectedIndex(0);
  }, [query, commands]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          onExecuteCommand(results[selectedIndex].id);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, results, selectedIndex, onExecuteCommand, onClose]);

  // Add and remove keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      const inputElement = document.getElementById('command-palette-input');
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [isOpen]);

  // Execute a command
  const executeCommand = (commandId: string) => {
    onExecuteCommand(commandId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.palette}>
        <div className={styles.header}>
          <Command className={styles.commandIcon} size={20} />
          <input
            id="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className={styles.input}
            autoFocus
          />
          <button className={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className={styles.results}>
          {results.length > 0 ? (
            results.map((result, index) => (
              <div
                key={result.id}
                className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ''}`}
                onClick={() => executeCommand(result.id)}
              >
                <div className={styles.resultContent}>
                  <div className={styles.resultName}>{result.name}</div>
                  <div className={styles.resultCategory}>{result.category}</div>
                </div>
                <div className={styles.resultDescription}>{result.description}</div>
                <ChevronRight size={16} className={styles.chevron} />
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              <Search size={24} />
              <p>No commands found</p>
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <div className={styles.shortcut}>
            <span>↑↓</span>
            <span>Navigate</span>
          </div>
          <div className={styles.shortcut}>
            <span>Enter</span>
            <span>Select</span>
          </div>
          <div className={styles.shortcut}>
            <span>Esc</span>
            <span>Cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Types
interface CommandItem {
  id: string;
  name: string;
  description: string;
  args?: string[];
}

interface CommandCategory {
  name: string;
  items: CommandItem[];
}

interface CommandResult extends CommandItem {
  category: string;
}

export { CommandPalette };
