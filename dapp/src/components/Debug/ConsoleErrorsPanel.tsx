import React, { useState, useEffect } from 'react';
import { ConsoleErrorMonitor, showConsoleErrorHelp } from '../../utils/consoleErrorFixer';

interface ErrorSummary {
  totalErrors: number;
  errorsByType: Record<string, number>;
  recentErrors: Array<{
    timestamp: Date;
    type: string;
    message: string;
    stack?: string;
  }>;
  knownPatterns: number;
  unknownErrors: number;
}

interface ErrorSolution {
  message: string;
  solution: string;
  component?: string;
  timestamp: Date;
}

interface ConsoleErrorsPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

/**
 * Development Console Errors Panel
 * Shows real-time console errors and their solutions
 * Only renders in development mode
 */
const ConsoleErrorsPanel: React.FC<ConsoleErrorsPanelProps> = ({ 
  isVisible = false, 
  onClose 
}) => {
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);
  const [solutions, setSolutions] = useState<ErrorSolution[]>([]);

  useEffect(() => {
    if (isVisible && import.meta.env.DEV) {
      const monitor = ConsoleErrorMonitor.getInstance();
      const summary = monitor.getErrorSummary();
      const solutionsList = monitor.getSolutionsForRecentErrors();
      
      setErrorSummary(summary);
      setSolutions(solutionsList);
    }
  }, [isVisible]);

  // Don't render in production
  if (!import.meta.env.DEV || !isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-md max-h-96 overflow-y-auto z-50"
      style={{ fontSize: '12px', fontFamily: 'monospace' }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-yellow-400 font-bold">🛠️ Console Errors</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {errorSummary && (
        <div className="mb-4">
          <div className="text-blue-400 mb-2">📊 Summary:</div>
          <div className="text-xs text-gray-300">
            <div>Total Errors: {errorSummary.totalErrors}</div>
            <div>Known Patterns: {errorSummary.knownPatterns}</div>
            <div>Unknown Errors: {errorSummary.unknownErrors}</div>
          </div>
        </div>
      )}

      {solutions.length > 0 && (
        <div className="mb-4">
          <div className="text-green-400 mb-2">💡 Recent Solutions:</div>
          <div className="space-y-2">
            {solutions.slice(0, 3).map((solution, index) => (
              <div key={index} className="bg-gray-800 p-2 rounded">
                <div className="text-red-400 text-xs mb-1">
                  ❌ {solution.message.substring(0, 50)}...
                </div>
                <div className="text-green-300 text-xs mb-1">
                  ✅ {solution.solution}
                </div>
                <div className="text-blue-300 text-xs">
                  🔧 {solution.component}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => showConsoleErrorHelp()}
          className="bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs"
        >
          Show in Console
        </button>
        <button
          onClick={() => {
            const monitor = ConsoleErrorMonitor.getInstance();
            monitor.clearErrorLog();
            setErrorSummary(null);
            setSolutions([]);
          }}
          className="bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-xs"
        >
          Clear Errors
        </button>
      </div>
    </div>
  );
};

export default ConsoleErrorsPanel;
