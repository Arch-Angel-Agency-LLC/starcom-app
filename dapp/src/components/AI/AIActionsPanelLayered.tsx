import React, { useState, useEffect } from 'react';
import styles from './AIActionsPanel.module.css';
import { usePopup } from '../Popup/PopupManager';
import ExpertPopup from './ExpertPopup';

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
 * AI Assistant Panel for Starcom Mission Control with Layered Depth
 * Provides progressive disclosure: Basic → Advanced → Expert
 */
// TODO: Add biometric authentication support for supported devices - PRIORITY: LOW
const AIActionsPanelLayered: React.FC<AIActionsPanelProps> = ({ expanded = false, className }) => {
  const { showPopup } = usePopup();
  
  // Core state
  const [activeCategory, setActiveCategory] = useState<'analysis' | 'automation' | 'communication' | 'prediction' | 'defense' | 'intelligence'>('analysis');
  const [processingCommands, setProcessingCommands] = useState<string[]>([]);
  const [aiStatus, setAiStatus] = useState<'online' | 'processing' | 'offline'>('online');
  const [selectedPersonality, setSelectedPersonality] = useState<string>('atlas');
  const [voiceCommand, setVoiceCommand] = useState<boolean>(false);
  const [autonomousMode, setAutonomousMode] = useState<boolean>(false);
  
  // Layered depth state - Commands vs Controls
  const [depthLevel, setDepthLevel] = useState<'commands' | 'controls'>('commands');

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
    { id: 'anomaly-detection', name: 'Anomaly Detection', icon: '⚠️', category: 'analysis', description: 'Detect statistical anomalies', status: 'ready', priority: 'high', eta: '1m' },
    
    // Critical Commands
    { id: 'cyber-defense', name: 'Cyber Defense', icon: '🛡️', category: 'defense', description: 'Active cyber threat mitigation', status: 'ready', priority: 'critical', eta: '30s' },
    { id: 'secure-comms', name: 'Secure Comms', icon: '🔐', category: 'communication', description: 'Establish quantum-encrypted channels', status: 'ready', priority: 'critical', eta: '1m' },
    { id: 'early-warning', name: 'Early Warning System', icon: '🚨', category: 'prediction', description: 'Predictive threat alerts', status: 'ready', priority: 'critical', eta: '2m' },
    { id: 'crisis-comms', name: 'Crisis Communication', icon: '📢', category: 'communication', description: 'Emergency communication protocols', status: 'ready', priority: 'critical', eta: '30s' },
    
    // Automation Commands
    { id: 'auto-report', name: 'Auto Report Gen', icon: '📄', category: 'automation', description: 'Generate comprehensive intel reports', status: 'ready', priority: 'medium', eta: '3m' },
    { id: 'alert-filtering', name: 'Smart Alert Filter', icon: '🎛️', category: 'automation', description: 'AI-powered alert prioritization', status: 'ready', priority: 'high', eta: '1m' },
    { id: 'workflow-optimization', name: 'Workflow Optimizer', icon: '⚡', category: 'automation', description: 'Optimize operational workflows', status: 'ready', priority: 'medium', eta: '6m' },
    
    // Intelligence Commands
    { id: 'humint-analysis', name: 'HUMINT Analysis', icon: '👤', category: 'intelligence', description: 'Human intelligence assessment', status: 'ready', priority: 'high', eta: '6m' },
    { id: 'sigint-processing', name: 'SIGINT Processing', icon: '📡', category: 'intelligence', description: 'Signals intelligence analysis', status: 'ready', priority: 'high', eta: '4m' },
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

      {/* Commands vs Controls Navigation */}
      <div className={styles.depthNavigation}>
        <button 
          className={`${styles.depthTab} ${depthLevel === 'commands' ? styles.active : ''}`}
          onClick={() => setDepthLevel('commands')}
          title="AI Commands - Execute actions and operations"
        >
          ⚡ Commands
        </button>
        <button 
          className={`${styles.depthTab} ${depthLevel === 'controls' ? styles.active : ''}`}
          onClick={() => setDepthLevel('controls')}
          title="AI Controls - Configure behavior and settings"
        >
          🎛️ Controls
        </button>
      </div>

      {/* Commands Tab - Action-oriented Operations */}
      {depthLevel === 'commands' && (
        <div className={styles.commandsLevel}>
          {/* Command Categories */}
          <div className={styles.sectionDivider}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>⚙️</span>
              <span className={styles.sectionTitle}>Command Categories</span>
            </div>
          </div>
          <div className={styles.categoryTabs}>
            <div className={styles.categoryPills}>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`${styles.categoryPill} ${activeCategory === category.id ? styles.active : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                  style={{ '--category-color': category.color } as React.CSSProperties}
                  title={`${category.name} Commands - Execute ${category.name.toLowerCase()} operations`}
                >
                  <span className={styles.pillIcon}>{category.icon}</span>
                  <span className={styles.pillLabel}>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Commands List for Selected Category */}
          <div className={styles.commandStack}>
            {filteredCommands.map(command => (
              <div
                key={command.id}
                className={`${styles.commandRow} ${processingCommands.includes(command.id) ? styles.processing : ''} ${styles[command.priority || 'low']}`}
                onClick={() => executeCommand(command.id)}
                title={`${command.description}\nPriority: ${command.priority?.toUpperCase()}\nETA: ${command.eta}`}
              >
                <div className={styles.commandLeft}>
                  <span className={styles.commandIcon}>
                    {processingCommands.includes(command.id) ? '⟳' : command.icon}
                  </span>
                  <div className={styles.commandInfo}>
                    <div className={styles.commandTitle}>{command.name}</div>
                    <div className={styles.commandDesc}>{command.description}</div>
                    <div className={styles.commandMeta}>
                      {command.eta && <span className={styles.eta}>⏱ {command.eta}</span>}
                      {command.priority && (
                        <span 
                          className={styles.priorityBadge}
                          style={{ backgroundColor: getPriorityColor(command.priority) }}
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
                >
                  {processingCommands.includes(command.id) ? '⟳' : '▶'}
                </button>
              </div>
            ))}
          </div>

          {/* Emergency Protocol */}
          <div className={styles.sectionDivider}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🚨</span>
              <span className={styles.sectionTitle}>Emergency Protocol</span>
            </div>
          </div>
          <button 
            className={styles.emergencyAction}
            onClick={emergencyProtocol}
            title="Emergency Protocol - Execute all critical commands simultaneously"
          >
            <span className={styles.actionIcon}>🚨</span>
            <span className={styles.actionLabel}>ACTIVATE EMERGENCY PROTOCOL</span>
          </button>
        </div>
      )}

      {/* Controls Tab - Configuration-oriented Settings */}
      {depthLevel === 'controls' && (
        <div className={styles.controlsLevel}>
          {/* AI Personality Control */}
          <div className={styles.sectionDivider}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🧠</span>
              <span className={styles.sectionTitle}>AI Personality</span>
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

          {/* System Mode Controls */}
          <div className={styles.sectionDivider}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>⚙️</span>
              <span className={styles.sectionTitle}>System Modes</span>
            </div>
          </div>
          <div className={styles.controlsGrid}>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}>Autonomous Mode</div>
              <button 
                className={`${styles.toggleButton} ${autonomousMode ? styles.active : ''}`}
                onClick={() => setAutonomousMode(!autonomousMode)}
                title="Allow AI to make independent decisions"
              >
                {autonomousMode ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}>Voice Commands</div>
              <button 
                className={`${styles.toggleButton} ${voiceCommand ? styles.active : ''}`}
                onClick={toggleVoiceCommand}
                title="Voice-activated command interface"
              >
                {voiceCommand ? 'ACTIVE' : 'STANDBY'}
              </button>
            </div>
          </div>

          {/* Processing Parameters */}
          <div className={styles.sectionDivider}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🎛️</span>
              <span className={styles.sectionTitle}>Processing Parameters</span>
            </div>
          </div>
          <div className={styles.controlsGrid}>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}>Priority Mode</div>
              <select className={styles.parameterSelect} title="Command execution priority">
                <option>Critical First</option>
                <option>Balanced Queue</option>
                <option>Efficiency Mode</option>
              </select>
            </div>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}>Processing Speed</div>
              <select className={styles.parameterSelect} title="AI processing speed setting">
                <option>Maximum Speed</option>
                <option>Balanced</option>
                <option>Power Saving</option>
              </select>
            </div>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}>Alert Level</div>
              <select className={styles.parameterSelect} title="System alert sensitivity">
                <option>High Sensitivity</option>
                <option>Normal</option>
                <option>Low Noise</option>
              </select>
            </div>
          </div>

          {/* System Diagnostics */}
          <div className={styles.sectionDivider}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📊</span>
              <span className={styles.sectionTitle}>System Status</span>
            </div>
          </div>
          <div className={styles.statsBar}>
            <div className={styles.statPill} title="Currently active tasks">
              <span className={styles.statValue}>{processingCommands.length}</span>
              <span className={styles.statLabel}>Active</span>
            </div>
            <div className={styles.statPill} title="System readiness level">
              <span className={styles.statValue}>99.{Math.floor(Math.random() * 9) + 1}%</span>
              <span className={styles.statLabel}>Ready</span>
            </div>
            <div className={styles.statPill} title="AI confidence level">
              <span className={styles.statValue}>{85 + Math.floor(Math.random() * 15)}%</span>
              <span className={styles.statLabel}>Confidence</span>
            </div>
          </div>

          {/* Active Workflows Monitor */}
          <div className={styles.sectionDivider}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🔄</span>
              <span className={styles.sectionTitle}>Active Workflows</span>
            </div>
          </div>
          <div className={styles.workflowsList}>
            {activeWorkflows.map(workflow => (
              <div key={workflow.id} className={styles.workflowRow} title={`Steps: ${workflow.steps.join(' → ')}`}>
                <span className={styles.workflowName}>{workflow.name}</span>
                <span className={styles.workflowTime}>{workflow.estimatedTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expert Mode Access - Always at bottom */}
      <div className={styles.expertSection}>
        <button 
          className={styles.expertButton}
          onClick={() => showPopup({ component: ExpertPopup })}
          title="Expert Mode - Advanced system administration"
        >
          🔺 Expert Mode
        </button>
      </div>

      {/* Always visible: Critical Alerts */}
      <div className={styles.criticalAlerts}>
        <div className={styles.alertRow}>
          <span className={styles.alertIcon}>⚠️</span>
          <span className={styles.alertText}>System nominal</span>
        </div>
      </div>
    </div>
  );
};

export default AIActionsPanelLayered;
