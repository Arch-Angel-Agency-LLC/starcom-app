import React, { useState } from 'react';
import { 
  Zap, Download, Share2, Copy, Save, Search, 
  Network, Map, Clock, FileText, Shield, Database,
  ExternalLink, Plus, Filter, RefreshCw
} from 'lucide-react';
import styles from './QuickActionsPanel.module.css';

interface QuickActionsPanelProps {
  data: {
    query?: string;
    results?: Record<string, unknown>[];
    investigation?: Record<string, unknown>;
  };
  onExecuteAction?: (actionId: string, params?: Record<string, unknown>) => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number | string }>;
  category: 'search' | 'analysis' | 'export' | 'investigation';
  hotkey?: string;
  enabled: boolean;
  premium?: boolean;
}

/**
 * Quick Actions Panel
 * 
 * Provides instant access to common OSINT operations and tools
 * Organizes actions by category for efficient workflow management
 */
const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ data, onExecuteAction }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'search' | 'analysis' | 'export' | 'investigation'>('all');

  const quickActions: QuickAction[] = [
    // Search Actions
    {
      id: 'reverse-search',
      title: 'Reverse Search',
      description: 'Search for additional mentions of current results',
      icon: RefreshCw,
      category: 'search',
      hotkey: 'Ctrl+R',
      enabled: !!data.query
    },
    {
      id: 'expand-search',
      title: 'Expand Search',
      description: 'Broaden search criteria and sources',
      icon: Plus,
      category: 'search',
      hotkey: 'Ctrl+E',
      enabled: !!data.query
    },
    {
      id: 'filter-results',
      title: 'Advanced Filter',
      description: 'Apply complex filters to current results',
      icon: Filter,
      category: 'search',
      enabled: !!(data.results && data.results.length > 0)
    },
    {
      id: 'search-similar',
      title: 'Find Similar',
      description: 'Search for entities similar to selected results',
      icon: Search,
      category: 'search',
      enabled: !!(data.results && data.results.length > 0)
    },

    // Analysis Actions
    {
      id: 'network-analysis',
      title: 'Network Analysis',
      description: 'Generate relationship network from results',
      icon: Network,
      category: 'analysis',
      hotkey: 'Ctrl+N',
      enabled: !!(data.results && data.results.length > 0)
    },
    {
      id: 'timeline-analysis',
      title: 'Timeline Analysis',
      description: 'Create chronological timeline of events',
      icon: Clock,
      category: 'analysis',
      enabled: !!(data.results && data.results.length > 0)
    },
    {
      id: 'geo-analysis',
      title: 'Geospatial Analysis',
      description: 'Map locations and geographic patterns',
      icon: Map,
      category: 'analysis',
      enabled: !!(data.results && data.results.length > 0)
    },
    {
      id: 'threat-assessment',
      title: 'Threat Assessment',
      description: 'Analyze potential security implications',
      icon: Shield,
      category: 'analysis',
      premium: true,
      enabled: !!(data.results && data.results.length > 0)
    },

    // Export Actions
    {
      id: 'export-csv',
      title: 'Export CSV',
      description: 'Download results as spreadsheet',
      icon: Download,
      category: 'export',
      hotkey: 'Ctrl+S',
      enabled: !!(data.results && data.results.length > 0)
    },
    {
      id: 'export-json',
      title: 'Export JSON',
      description: 'Download raw data in JSON format',
      icon: Database,
      category: 'export',
      enabled: !!(data.results && data.results.length > 0)
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create formatted intelligence report',
      icon: FileText,
      category: 'export',
      premium: true,
      enabled: !!(data.results && data.results.length > 0)
    },
    {
      id: 'share-investigation',
      title: 'Share Results',
      description: 'Share findings with team members',
      icon: Share2,
      category: 'export',
      enabled: !!(data.results && data.results.length > 0)
    },

    // Investigation Actions
    {
      id: 'save-investigation',
      title: 'Save Investigation',
      description: 'Save current state to investigation file',
      icon: Save,
      category: 'investigation',
      hotkey: 'Ctrl+I',
      enabled: true
    },
    {
      id: 'copy-query',
      title: 'Copy Query',
      description: 'Copy search query to clipboard',
      icon: Copy,
      category: 'investigation',
      enabled: !!data.query
    },
    {
      id: 'open-external',
      title: 'Open External Tools',
      description: 'Launch query in external OSINT platforms',
      icon: ExternalLink,
      category: 'investigation',
      enabled: !!data.query
    }
  ];

  const filteredActions = activeCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === activeCategory);

  const handleActionClick = (action: QuickAction) => {
    if (!action.enabled) return;
    
    if (onExecuteAction) {
      onExecuteAction(action.id, {
        query: data.query,
        results: data.results,
        investigation: data.investigation
      });
    }

    // Handle built-in actions
    switch (action.id) {
      case 'copy-query':
        if (data.query) {
          navigator.clipboard.writeText(data.query);
        }
        break;
      case 'export-csv':
        // Trigger CSV export
        console.log('Exporting CSV...', data.results);
        break;
      case 'export-json':
        // Trigger JSON export
        if (data.results) {
          const dataStr = JSON.stringify(data.results, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `osint-results-${Date.now()}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }
        break;
      default:
        console.log(`Executing action: ${action.id}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'search': return <Search size={16} />;
      case 'analysis': return <Network size={16} />;
      case 'export': return <Download size={16} />;
      case 'investigation': return <FileText size={16} />;
      default: return <Zap size={16} />;
    }
  };

  const getCategoryCount = (category: string) => {
    return category === 'all' 
      ? quickActions.filter(a => a.enabled).length
      : quickActions.filter(a => a.category === category && a.enabled).length;
  };

  return (
    <div className={styles.quickActionsPanel}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Zap className={styles.titleIcon} />
          <span>Quick Actions</span>
        </div>
      </div>

      <div className={styles.categories}>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'all' ? styles.activeCategory : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          <span>All</span>
          <span className={styles.categoryCount}>({getCategoryCount('all')})</span>
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'search' ? styles.activeCategory : ''}`}
          onClick={() => setActiveCategory('search')}
        >
          {getCategoryIcon('search')}
          <span>Search</span>
          <span className={styles.categoryCount}>({getCategoryCount('search')})</span>
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'analysis' ? styles.activeCategory : ''}`}
          onClick={() => setActiveCategory('analysis')}
        >
          {getCategoryIcon('analysis')}
          <span>Analysis</span>
          <span className={styles.categoryCount}>({getCategoryCount('analysis')})</span>
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'export' ? styles.activeCategory : ''}`}
          onClick={() => setActiveCategory('export')}
        >
          {getCategoryIcon('export')}
          <span>Export</span>
          <span className={styles.categoryCount}>({getCategoryCount('export')})</span>
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'investigation' ? styles.activeCategory : ''}`}
          onClick={() => setActiveCategory('investigation')}
        >
          {getCategoryIcon('investigation')}
          <span>Investigation</span>
          <span className={styles.categoryCount}>({getCategoryCount('investigation')})</span>
        </button>
      </div>

      <div className={styles.actionsList}>
        {filteredActions.map((action) => (
          <button
            key={action.id}
            className={`${styles.actionButton} ${!action.enabled ? styles.disabledAction : ''} ${action.premium ? styles.premiumAction : ''}`}
            onClick={() => handleActionClick(action)}
            disabled={!action.enabled}
            title={action.description + (action.hotkey ? ` (${action.hotkey})` : '')}
          >
            <div className={styles.actionIcon}>
              <action.icon size={18} />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>
                {action.title}
                {action.premium && <span className={styles.premiumBadge}>PRO</span>}
              </div>
              <div className={styles.actionDescription}>
                {action.description}
              </div>
              {action.hotkey && (
                <div className={styles.actionHotkey}>
                  {action.hotkey}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {filteredActions.length === 0 && (
        <div className={styles.emptyState}>
          <Zap size={48} />
          <p>No actions available</p>
          <p className={styles.subtext}>Start a search to enable OSINT actions</p>
        </div>
      )}
    </div>
  );
};

export default QuickActionsPanel;
