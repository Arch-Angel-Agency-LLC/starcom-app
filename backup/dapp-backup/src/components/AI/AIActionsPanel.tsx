import React, { useState, useEffect } from 'react';
import styles from './AIActionsPanel.module.css';

interface AIActionsPanelProps {
  expanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  className?: string;
}

interface AICommand {
  id: string;
  name: string;
  icon: string;
  category: 'analysis' | 'automation' | 'communication' | 'prediction' | 'defense' | 'intelligence';
  description: string;
  status: 'ready' | 'processing' | 'disabled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  eta?: string;
}

interface AIPersonality {
  id: string;
  name: string;
  icon: string;
  description: string;
  specialization: string;
}

interface AIWorkflow {
  id: string;
  name: string;
  steps: string[];
  estimatedTime: string;
  category: string;
}

/**
 * AI Assistant Panel for Starcom Mission Control
 * Provides intelligent analysis, automation, and command capabilities with layered depth
 */
// TODO: Implement comprehensive wallet connection error recovery and user guidance - PRIORITY: HIGH
const AIActionsPanel: React.FC<AIActionsPanelProps> = ({ expanded = false, className }) => {
  // Core state
  const [activeCategory, setActiveCategory] = useState<'analysis' | 'automation' | 'communication' | 'prediction' | 'defense' | 'intelligence'>('analysis');
  const [processingCommands, setProcessingCommands] = useState<string[]>([]);
  const [aiStatus, setAiStatus] = useState<'online' | 'processing' | 'offline'>('online');
  const [selectedPersonality, setSelectedPersonality] = useState<string>('atlas');
  const [voiceCommand, setVoiceCommand] = useState<boolean>(false);
  const [autonomousMode, setAutonomousMode] = useState<boolean>(false);
  
  // Layered depth state - Progressive disclosure system
  // AI-NOTE: These depth levels are planned for future progressive disclosure features
  // const [depthLevel, setDepthLevel] = useState<'basic' | 'advanced' | 'expert'>('basic');
  // const [advancedTab, setAdvancedTab] = useState<'workflows' | 'parameters' | 'diagnostics'>('workflows');
  // const [expertTab, setExpertTab] = useState<'builder' | 'training' | 'api' | 'system'>('builder');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // AI Personalities for different mission contexts
  const aiPersonalities: AIPersonality[] = [
    { id: 'atlas', name: 'ATLAS', icon: '🧠', description: 'Analytical Tactical Leadership Assistant System', specialization: 'Strategic Analysis' },
    { id: 'guardian', name: 'GUARDIAN', icon: '🛡️', description: 'Global Universal Asset Risk Defense Intelligence Assistant Network', specialization: 'Threat Detection' },
    { id: 'oracle', name: 'ORACLE', icon: '🔮', description: 'Operational Reconnaissance Analytics & Cognitive Learning Engine', specialization: 'Predictive Intelligence' },
    { id: 'nexus', name: 'NEXUS', icon: '🌐', description: 'Network Exchange for Universal Strategic Systems', specialization: 'Communications Hub' },
  ];

  // Enhanced command set with new categories
  const aiCommands: AICommand[] = [
    // Analysis Commands
    { id: 'threat-scan', name: 'Deep Threat Scan', icon: '🔍', category: 'analysis', description: 'Comprehensive threat pattern analysis', status: 'ready', priority: 'high', eta: '2m' },
    { id: 'data-correlation', name: 'Multi-Source Correlation', icon: '🧠', category: 'analysis', description: 'Cross-reference intel from all sources', status: 'ready', priority: 'medium', eta: '5m' },
    { id: 'pattern-recognition', name: 'Pattern Recognition', icon: '🕸️', category: 'analysis', description: 'Identify emerging behavioral patterns', status: 'ready', priority: 'medium', eta: '3m' },
    { id: 'anomaly-detection', name: 'Anomaly Detection', icon: '⚠️', category: 'analysis', description: 'Detect statistical anomalies', status: 'ready', priority: 'high', eta: '1m' },
    { id: 'sentiment-analysis', name: 'Sentiment Analysis', icon: '💭', category: 'analysis', description: 'Analyze global sentiment trends', status: 'ready', priority: 'low', eta: '4m' },
    
    // Automation Commands
    { id: 'auto-report', name: 'Auto Report Gen', icon: '📄', category: 'automation', description: 'Generate comprehensive intel reports', status: 'ready', priority: 'medium', eta: '3m' },
    { id: 'alert-filtering', name: 'Smart Alert Filter', icon: '🎛️', category: 'automation', description: 'AI-powered alert prioritization', status: 'ready', priority: 'high', eta: '1m' },
    { id: 'data-mining', name: 'Deep Data Mining', icon: '⛏️', category: 'automation', description: 'Extract hidden intelligence patterns', status: 'ready', priority: 'medium', eta: '8m' },
    { id: 'routine-tasks', name: 'Task Automation', icon: '🤖', category: 'automation', description: 'Automate routine operations', status: 'ready', priority: 'low', eta: '2m' },
    { id: 'workflow-optimization', name: 'Workflow Optimizer', icon: '⚡', category: 'automation', description: 'Optimize operational workflows', status: 'ready', priority: 'medium', eta: '6m' },
    
    // Communication Commands
    { id: 'briefing-prep', name: 'Mission Briefing', icon: '📊', category: 'communication', description: 'Prepare comprehensive mission briefings', status: 'ready', priority: 'high', eta: '5m' },
    { id: 'secure-comms', name: 'Secure Comms', icon: '🔐', category: 'communication', description: 'Establish quantum-encrypted channels', status: 'ready', priority: 'critical', eta: '1m' },
    { id: 'multi-agency', name: 'Agency Liaison', icon: '🤝', category: 'communication', description: 'Coordinate multi-agency operations', status: 'ready', priority: 'high', eta: '3m' },
    { id: 'translation', name: 'Real-time Translation', icon: '🌐', category: 'communication', description: 'Universal language processing', status: 'ready', priority: 'medium', eta: '1m' },
    { id: 'crisis-comms', name: 'Crisis Communication', icon: '📢', category: 'communication', description: 'Emergency communication protocols', status: 'ready', priority: 'critical', eta: '30s' },
    
    // Prediction Commands
    { id: 'threat-forecast', name: 'Threat Forecasting', icon: '🔮', category: 'prediction', description: 'Predict threat evolution patterns', status: 'ready', priority: 'high', eta: '10m' },
    { id: 'resource-planning', name: 'Resource Planning', icon: '📈', category: 'prediction', description: 'Optimize resource allocation', status: 'ready', priority: 'medium', eta: '7m' },
    { id: 'scenario-modeling', name: 'Scenario Modeling', icon: '🎯', category: 'prediction', description: 'Model potential outcome scenarios', status: 'ready', priority: 'high', eta: '12m' },
    { id: 'early-warning', name: 'Early Warning System', icon: '🚨', category: 'prediction', description: 'Predictive threat alerts', status: 'ready', priority: 'critical', eta: '2m' },
    { id: 'market-prediction', name: 'Market Prediction', icon: '📊', category: 'prediction', description: 'Predict market movements', status: 'ready', priority: 'medium', eta: '5m' },

    // Defense Commands
    { id: 'cyber-defense', name: 'Cyber Defense', icon: '🛡️', category: 'defense', description: 'Active cyber threat mitigation', status: 'ready', priority: 'critical', eta: '30s' },
    { id: 'firewall-adaptive', name: 'Adaptive Firewall', icon: '🔥', category: 'defense', description: 'Dynamic security barrier adjustment', status: 'ready', priority: 'high', eta: '1m' },
    { id: 'intrusion-detection', name: 'Intrusion Detection', icon: '🚪', category: 'defense', description: 'Real-time intrusion monitoring', status: 'ready', priority: 'critical', eta: '45s' },
    { id: 'counter-intelligence', name: 'Counter-Intel', icon: '🎭', category: 'defense', description: 'Counter-intelligence operations', status: 'ready', priority: 'high', eta: '8m' },

    // Intelligence Commands
    { id: 'humint-analysis', name: 'HUMINT Analysis', icon: '👤', category: 'intelligence', description: 'Human intelligence assessment', status: 'ready', priority: 'high', eta: '6m' },
    { id: 'sigint-processing', name: 'SIGINT Processing', icon: '📡', category: 'intelligence', description: 'Signals intelligence analysis', status: 'ready', priority: 'high', eta: '4m' },
    { id: 'geoint-mapping', name: 'GEOINT Mapping', icon: '🗺️', category: 'intelligence', description: 'Geospatial intelligence mapping', status: 'ready', priority: 'medium', eta: '5m' },
    { id: 'osint-collection', name: 'OSINT Collection', icon: '🌍', category: 'intelligence', description: 'Open source intelligence gathering', status: 'ready', priority: 'medium', eta: '3m' },
  ];

  // Enhanced categories
  const categories = [
    { id: 'analysis', name: 'Analysis', icon: '🔬', color: '#00c4ff' },
    { id: 'automation', name: 'Automation', icon: '⚙️', color: '#00ff88' },
    { id: 'communication', name: 'Comms', icon: '📡', color: '#ffaa00' },
    { id: 'prediction', name: 'Prediction', icon: '🧭', color: '#ff6b6b' },
    { id: 'defense', name: 'Defense', icon: '🛡️', color: '#ff3366' },
    { id: 'intelligence', name: 'Intel', icon: '🎯', color: '#9966ff' },
  ] as const;

  // Simulated AI workflows
  const activeWorkflows: AIWorkflow[] = [
    { id: 'threat-assessment', name: 'Global Threat Assessment', steps: ['Data Collection', 'Pattern Analysis', 'Risk Evaluation'], estimatedTime: '15m', category: 'analysis' },
    { id: 'intel-synthesis', name: 'Intelligence Synthesis', steps: ['Source Validation', 'Cross-Reference', 'Report Generation'], estimatedTime: '8m', category: 'intelligence' },
  ];

  useEffect(() => {
    // Simulated AI status updates
    const statusInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance of status change
        const statuses: ('online' | 'processing' | 'offline')[] = ['online', 'processing'];
        setAiStatus(statuses[Math.floor(Math.random() * statuses.length)]);
      }
    }, 5000);

    return () => clearInterval(statusInterval);
  }, []);

  const executeCommand = (commandId: string) => {
    setProcessingCommands(prev => [...prev, commandId]);
    setAiStatus('processing');
    
    // Simulate command execution with variable timing
    const command = aiCommands.find(cmd => cmd.id === commandId);
    const executionTime = command?.eta ? parseInt(command.eta) * 100 : 2000; // Convert to ms for demo
    
    setTimeout(() => {
      setProcessingCommands(prev => prev.filter(id => id !== commandId));
      if (processingCommands.length === 1) {
        setAiStatus('online');
      }
    }, executionTime + Math.random() * 3000);
  };

  const toggleVoiceCommand = () => {
    setVoiceCommand(!voiceCommand);
    if (!voiceCommand) {
      // Simulated voice activation
      setTimeout(() => setVoiceCommand(false), 3000);
    }
  };

  const emergencyProtocol = () => {
    setAiStatus('processing');
    // Execute multiple critical commands
    const criticalCommands = aiCommands.filter(cmd => cmd.priority === 'critical');
    criticalCommands.forEach(cmd => executeCommand(cmd.id));
  };

  const getStatusColor = () => {
    switch (aiStatus) {
      case 'online': return '#00ff88';
      case 'processing': return '#ffaa00';
      case 'offline': return '#ff6b6b';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return '#ff3333';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
      default: return '#666';
    }
  };

  const filteredCommands = aiCommands.filter(cmd => cmd.category === activeCategory);
  const currentPersonality = aiPersonalities.find(p => p.id === selectedPersonality) || aiPersonalities[0];

  return (
    <div className={`${styles.aiPanel} ${expanded ? styles.expanded : ''} ${className || ''}`}>
      {/* AI System Header with Status */}
      <div className={styles.aiHeader}>
        <div className={styles.aiTitle}>
          <span className={styles.aiIcon}>{currentPersonality.icon}</span>
          <div className={styles.headerInfo}>
            <span className={styles.aiName}>{currentPersonality.name}</span>
            <span className={styles.aiSpecialization}>{currentPersonality.specialization}</span>
          </div>
        </div>
        <div className={styles.statusIndicator} title={`AI System Status: ${aiStatus.toUpperCase()}`}>
          <div className={styles.statusDot} style={{ backgroundColor: getStatusColor() }}></div>
        </div>
      </div>

      {/* AI Personality Selection */}
      <div className={styles.sectionDivider}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🧠</span>
          <span className={styles.sectionTitle}>AI Personality</span>
          <span className={styles.sectionHint}>Select specialized AI assistant</span>
        </div>
      </div>
      <div className={styles.personalityRow}>
        {aiPersonalities.map(personality => (
          <button
            key={personality.id}
            className={`${styles.personalityIcon} ${selectedPersonality === personality.id ? styles.active : ''}`}
            onClick={() => setSelectedPersonality(personality.id)}
            title={`${personality.description}\nSpecialization: ${personality.specialization}`}
          >
            {personality.icon}
          </button>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className={styles.sectionDivider}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📊</span>
          <span className={styles.sectionTitle}>Performance</span>
          <span className={styles.sectionHint}>Real-time AI metrics</span>
        </div>
      </div>
      <div className={styles.statsBar}>
        <div className={styles.statPill} title="Currently processing tasks">
          <span className={styles.statValue}>{processingCommands.length}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statPill} title="Successfully completed tasks">
          <span className={styles.statValue}>{47 + Math.floor(Math.random() * 10)}</span>
          <span className={styles.statLabel}>Done</span>
        </div>
        <div className={styles.statPill} title="AI accuracy rate">
          <span className={styles.statValue}>99.{Math.floor(Math.random() * 9) + 1}%</span>
          <span className={styles.statLabel}>Accuracy</span>
        </div>
      </div>

      {/* Command Categories & Execution */}
      <div className={styles.sectionDivider}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>⚡</span>
          <span className={styles.sectionTitle}>AI Commands</span>
          <span className={styles.sectionHint}>Mission-critical operations</span>
        </div>
      </div>
      
      {/* Category Sub-tabs */}
      <div className={styles.categoryTabs}>
        <div className={styles.tabsHeader}>
          <span className={styles.tabsLabel}>Categories:</span>
        </div>
        <div className={styles.categoryPills}>
          {categories.map(category => (
            <button
              key={category.id}
              className={`${styles.categoryPill} ${activeCategory === category.id ? styles.active : ''}`}
              onClick={() => setActiveCategory(category.id)}
              style={{ '--category-color': category.color } as React.CSSProperties}
              title={`${category.name} Operations\nSpecialized ${category.name.toLowerCase()} commands and tools`}
            >
              <span className={styles.pillIcon}>{category.icon}</span>
              <span className={styles.pillLabel}>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Category Display */}
      <div className={styles.categoryDisplay}>
        <div className={styles.categoryInfo}>
          <span className={styles.categoryBadge} style={{ '--category-color': categories.find(c => c.id === activeCategory)?.color } as React.CSSProperties}>
            {categories.find(c => c.id === activeCategory)?.icon} {categories.find(c => c.id === activeCategory)?.name}
          </span>
          <span className={styles.commandCount}>{filteredCommands.length} commands available</span>
        </div>
      </div>

      {/* Commands List */}
      <div className={styles.commandStack}>
        {filteredCommands.slice(0, expanded ? filteredCommands.length : 4).map(command => (
          <div
            key={command.id}
            className={`${styles.commandRow} ${processingCommands.includes(command.id) ? styles.processing : ''} ${styles[command.priority || 'low']}`}
            onClick={() => executeCommand(command.id)}
            title={`${command.description}\nPriority: ${command.priority?.toUpperCase() || 'STANDARD'}\nEstimated Time: ${command.eta || 'Unknown'}`}
          >
            <div className={styles.commandLeft}>
              <span className={styles.commandIcon}>
                {processingCommands.includes(command.id) ? '⟳' : command.icon}
              </span>
              <div className={styles.commandInfo}>
                <div className={styles.commandTitle}>{command.name}</div>
                <div className={styles.commandDesc}>{command.description}</div>
                <div className={styles.commandMeta}>
                  {command.eta && <span className={styles.eta} title="Estimated completion time">⏱ {command.eta}</span>}
                  {command.priority && (
                    <span 
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(command.priority) }}
                      title={`Priority Level: ${command.priority.toUpperCase()}`}
                    >
                      {command.priority.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              className={styles.commandAction} 
              disabled={processingCommands.includes(command.id)}
              title={processingCommands.includes(command.id) ? 'Processing...' : 'Execute Command'}
            >
              {processingCommands.includes(command.id) ? '⟳' : '▶'}
            </button>
          </div>
        ))}
        
        {!expanded && filteredCommands.length > 4 && (
          <button 
            className={styles.expandToggle}
            onClick={() => setShowAdvanced(!showAdvanced)}
            title={`Show ${filteredCommands.length - 4} additional commands`}
          >
            +{filteredCommands.length - 4} more commands
          </button>
        )}
      </div>

      {/* Quick Actions & Controls */}
      <div className={styles.sectionDivider}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🎛️</span>
          <span className={styles.sectionTitle}>Quick Actions</span>
          <span className={styles.sectionHint}>Instant system controls</span>
        </div>
      </div>
      <div className={styles.actionBar}>
        <button 
          className={styles.emergencyAction}
          onClick={emergencyProtocol}
          title="Emergency Protocol&#10;Activates all critical security measures&#10;Estimated time: 30 seconds"
        >
          <span className={styles.actionIcon}>🚨</span>
          <span className={styles.actionLabel}>Emergency</span>
        </button>
        <button 
          className={`${styles.voiceAction} ${voiceCommand ? styles.active : ''}`}
          onClick={toggleVoiceCommand}
          title="Voice Command Interface&#10;Enables hands-free AI interaction&#10;Status: ${voiceCommand ? 'ACTIVE' : 'STANDBY'}"
        >
          <span className={styles.actionIcon}>🎙️</span>
          <span className={styles.actionLabel}>Voice</span>
        </button>
        <button 
          className={`${styles.autoAction} ${autonomousMode ? styles.active : ''}`}
          onClick={() => setAutonomousMode(!autonomousMode)}
          title="Autonomous AI Mode&#10;Allows AI to make decisions independently&#10;Status: ${autonomousMode ? 'ENABLED' : 'DISABLED'}"
        >
          <span className={styles.actionIcon}>🤖</span>
          <span className={styles.actionLabel}>Auto</span>
        </button>
        <button 
          className={styles.expandAction}
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Advanced Options&#10;View workflows and system diagnostics"
        >
          <span className={styles.actionIcon}>⚙️</span>
          <span className={styles.actionLabel}>Advanced</span>
        </button>
      </div>

      {/* Advanced Analytics Panel */}
      {showAdvanced && (
        <div className={styles.advancedPanel}>
          <div className={styles.sectionDivider}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🔬</span>
              <span className={styles.sectionTitle}>System Analytics</span>
              <span className={styles.sectionHint}>Detailed AI performance data</span>
            </div>
          </div>
          
          <div className={styles.workflowsList}>
            <div className={styles.subsectionLabel}>
              <span className={styles.subsectionIcon}>⚙️</span>
              <span>Active Workflows</span>
              <span className={styles.workflowCount}>{activeWorkflows.length}</span>
            </div>
            {activeWorkflows.map(workflow => (
              <div key={workflow.id} className={styles.workflowRow} title={`Steps: ${workflow.steps.join(' → ')}`}>
                <span className={styles.workflowName}>{workflow.name}</span>
                <span className={styles.workflowTime} title="Estimated completion time">{workflow.estimatedTime}</span>
              </div>
            ))}
          </div>
          
          <div className={styles.confidenceSection}>
            <div className={styles.subsectionLabel}>
              <span className={styles.subsectionIcon}>🎯</span>
              <span>AI Confidence Level</span>
              <span className={styles.confidenceValue}>{85 + Math.floor(Math.random() * 15)}%</span>
            </div>
            <div className={styles.confidenceBar} title="Real-time AI confidence in current operations">
              <div 
                className={styles.confidenceFill}
                style={{ width: `${85 + Math.floor(Math.random() * 15)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights & Alerts */}
      <div className={styles.sectionDivider}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>💡</span>
          <span className={styles.sectionTitle}>AI Insights</span>
          <span className={styles.sectionHint}>Real-time intelligence alerts</span>
        </div>
      </div>
      <div className={styles.insightsCompact}>
        <div className={styles.insightsList}>
          <div className={styles.insightRow} title="Critical security alert requiring immediate attention">
            <span className={styles.insightPriority}>!</span>
            <span className={styles.insightText}>Quantum breach detected</span>
            <span className={styles.insightTime}>2m ago</span>
          </div>
          <div className={styles.insightRow} title="Statistical anomaly in system patterns">
            <span className={styles.insightPriority}>⚠</span>
            <span className={styles.insightText}>Pattern anomaly +87%</span>
            <span className={styles.insightTime}>5m ago</span>
          </div>
          <div className={styles.insightRow} title="System optimization recommendation">
            <span className={styles.insightPriority}>ℹ</span>
            <span className={styles.insightText}>Optimization available</span>
            <span className={styles.insightTime}>12m ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIActionsPanel;
