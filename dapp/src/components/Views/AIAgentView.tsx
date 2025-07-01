import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '../../utils/featureFlags';
import AIActionsPanelLayered from '../AI/AIActionsPanelLayered';
import { AIErrorBoundary } from '../ErrorBoundaries/AIErrorBoundary';
import styles from './AIAgentView.module.css';

interface AIAgentViewProps {
  className?: string;
}

interface AISystemStatus {
  online: boolean;
  processing: number;
  activeAgents: number;
  lastUpdate: Date;
}

interface AIPersonality {
  id: string;
  name: string;
  icon: string;
  description: string;
  specialization: string;
  status: 'online' | 'busy' | 'offline';
}

const AIAgentView: React.FC<AIAgentViewProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'agents' | 'automation' | 'analytics'>('assistant');
  const [systemStatus, setSystemStatus] = useState<AISystemStatus>({
    online: true,
    processing: 0,
    activeAgents: 4,
    lastUpdate: new Date()
  });
  const [selectedPersonality, setSelectedPersonality] = useState<string>('atlas');
  const aiSuggestionsEnabled = useFeatureFlag('aiSuggestionsEnabled');

  // AI System Status Monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        processing: Math.floor(Math.random() * 5),
        lastUpdate: new Date()
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // AI Personalities available in the system
  const aiPersonalities: AIPersonality[] = [
    { 
      id: 'atlas', 
      name: 'ATLAS', 
      icon: '🧠', 
      description: 'Analytical Tactical Leadership Assistant System', 
      specialization: 'Strategic Analysis',
      status: 'online'
    },
    { 
      id: 'guardian', 
      name: 'GUARDIAN', 
      icon: '🛡️', 
      description: 'Global Universal Asset Risk Defense Intelligence Assistant', 
      specialization: 'Threat Detection',
      status: 'online'
    },
    { 
      id: 'oracle', 
      name: 'ORACLE', 
      icon: '🔮', 
      description: 'Operational Reconnaissance Analytics & Cognitive Learning Engine', 
      specialization: 'Predictive Intelligence',
      status: 'busy'
    },
    { 
      id: 'nexus', 
      name: 'NEXUS', 
      icon: '🌐', 
      description: 'Network Exchange for Universal Strategic Systems', 
      specialization: 'Communications Hub',
      status: 'online'
    }
  ];

  // Tab configuration
  const tabs = [
    { id: 'assistant', label: '🤖 AI Assistant', tooltip: 'Interactive AI Assistant with layered commands' },
    { id: 'agents', label: '👥 AI Agents', tooltip: 'Manage AI personalities and agents' },
    { id: 'automation', label: '⚙️ Automation', tooltip: 'Automated workflows and tasks' },
    { id: 'analytics', label: '📊 Analytics', tooltip: 'AI performance and insights' }
  ] as const;

  // Get system status display
  const getSystemStatusDisplay = () => {
    if (!systemStatus.online) {
      return { text: 'OFFLINE', class: 'offline', icon: '🔴' };
    }
    if (systemStatus.processing > 0) {
      return { text: 'PROCESSING', class: 'processing', icon: '🟡' };
    }
    return { text: 'ONLINE', class: 'online', icon: '🟢' };
  };

  const statusDisplay = getSystemStatusDisplay();

  const renderAssistantTab = () => (
    <div className={styles.assistantTab}>
      <div className={styles.assistantHeader}>
        <div className={styles.personalitySelector}>
          <h4>Active AI Personality</h4>
          <div className={styles.personalityCards}>
            {aiPersonalities.map((personality) => (
              <button
                key={personality.id}
                className={`${styles.personalityCard} ${selectedPersonality === personality.id ? styles.active : ''}`}
                onClick={() => setSelectedPersonality(personality.id)}
              >
                <div className={styles.personalityIcon}>{personality.icon}</div>
                <div className={styles.personalityInfo}>
                  <div className={styles.personalityName}>{personality.name}</div>
                  <div className={styles.personalitySpec}>{personality.specialization}</div>
                  <div className={`${styles.personalityStatus} ${styles[personality.status]}`}>
                    {personality.status.toUpperCase()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.assistantContent}>
        {aiSuggestionsEnabled ? (
          <AIErrorBoundary fallback={
            <div className={styles.errorFallback}>
              <span className={styles.errorIcon}>⚠️</span>
              <h3>AI Assistant Unavailable</h3>
              <p>The AI Assistant is currently offline. Please try again later.</p>
              <button className={styles.retryButton} onClick={() => window.location.reload()}>
                Retry Connection
              </button>
            </div>
          }>
            <AIActionsPanelLayered className={styles.aiActionsPanel} />
          </AIErrorBoundary>
        ) : (
          <div className={styles.disabledState}>
            <div className={styles.disabledIcon}>🤖</div>
            <h3>AI Assistant Disabled</h3>
            <p>AI suggestions are currently disabled. Enable them in settings to use the AI Assistant.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAgentsTab = () => (
    <div className={styles.agentsTab}>
      <div className={styles.agentsHeader}>
        <h3>AI Agent Management</h3>
        <div className={styles.agentStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{systemStatus.activeAgents}</span>
            <span className={styles.statLabel}>Active Agents</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{systemStatus.processing}</span>
            <span className={styles.statLabel}>Processing</span>
          </div>
        </div>
      </div>
      
      <div className={styles.agentsList}>
        {aiPersonalities.map((agent) => (
          <div key={agent.id} className={styles.agentCard}>
            <div className={styles.agentHeader}>
              <div className={styles.agentIcon}>{agent.icon}</div>
              <div className={styles.agentInfo}>
                <h4>{agent.name}</h4>
                <p>{agent.description}</p>
              </div>
              <div className={`${styles.agentStatus} ${styles[agent.status]}`}>
                {agent.status.toUpperCase()}
              </div>
            </div>
            <div className={styles.agentControls}>
              <button className={styles.agentBtn}>Configure</button>
              <button className={styles.agentBtn}>View Logs</button>
              <button className={`${styles.agentBtn} ${styles.primary}`}>Activate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAutomationTab = () => (
    <div className={styles.automationTab}>
      <div className={styles.automationHeader}>
        <h3>Automated Workflows</h3>
        <button className={styles.createWorkflowBtn}>+ Create Workflow</button>
      </div>
      
      <div className={styles.workflowsList}>
        <div className={styles.workflowCard}>
          <div className={styles.workflowHeader}>
            <h4>🔍 Threat Detection Pipeline</h4>
            <span className={styles.workflowStatus}>Active</span>
          </div>
          <p>Continuous monitoring and analysis of global threat indicators</p>
          <div className={styles.workflowStats}>
            <span>Last run: 2 minutes ago</span>
            <span>Success rate: 98.7%</span>
          </div>
        </div>
        
        <div className={styles.workflowCard}>
          <div className={styles.workflowHeader}>
            <h4>📊 Intelligence Report Generation</h4>
            <span className={styles.workflowStatus}>Scheduled</span>
          </div>
          <p>Automated compilation of daily intelligence briefings</p>
          <div className={styles.workflowStats}>
            <span>Next run: 4 hours</span>
            <span>Reports generated: 247</span>
          </div>
        </div>
        
        <div className={styles.workflowCard}>
          <div className={styles.workflowHeader}>
            <h4>🛡️ Cyber Defense Automation</h4>
            <span className={styles.workflowStatus}>Active</span>
          </div>
          <p>Real-time response to cyber threats and anomalies</p>
          <div className={styles.workflowStats}>
            <span>Threats blocked: 1,247</span>
            <span>Response time: 0.3s avg</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className={styles.analyticsTab}>
      <div className={styles.analyticsHeader}>
        <h3>AI Performance Analytics</h3>
        <div className={styles.timeRange}>
          <button className={styles.timeBtn}>24h</button>
          <button className={`${styles.timeBtn} ${styles.active}`}>7d</button>
          <button className={styles.timeBtn}>30d</button>
        </div>
      </div>
      
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <h4>System Efficiency</h4>
            <span className={styles.metricValue}>94.3%</span>
          </div>
          <div className={styles.metricChart}>
            <div className={styles.chartBar} style={{ height: '94%' }}></div>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <h4>Response Time</h4>
            <span className={styles.metricValue}>0.8s</span>
          </div>
          <div className={styles.metricChart}>
            <div className={styles.chartBar} style={{ height: '76%' }}></div>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <h4>Accuracy Rate</h4>
            <span className={styles.metricValue}>98.7%</span>
          </div>
          <div className={styles.metricChart}>
            <div className={styles.chartBar} style={{ height: '98%' }}></div>
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <h4>Tasks Completed</h4>
            <span className={styles.metricValue}>2,847</span>
          </div>
          <div className={styles.metricChart}>
            <div className={styles.chartBar} style={{ height: '85%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'assistant':
        return renderAssistantTab();
      case 'agents':
        return renderAgentsTab();
      case 'automation':
        return renderAutomationTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.aiAgentView} ${className || ''}`}>
      {/* Header with system status */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>🧠 AI Agent Command Center</h2>
          <div className={styles.systemStatus}>
            <span className={styles.statusIcon}>{statusDisplay.icon}</span>
            <span className={styles.statusText}>{statusDisplay.text}</span>
            <span className={styles.lastUpdate}>
              Updated {systemStatus.lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <div className={styles.quickStats}>
          <div className={styles.quickStat}>
            <span className={styles.quickStatValue}>{systemStatus.activeAgents}</span>
            <span className={styles.quickStatLabel}>Agents</span>
          </div>
          <div className={styles.quickStat}>
            <span className={styles.quickStatValue}>{systemStatus.processing}</span>
            <span className={styles.quickStatLabel}>Processing</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.tooltip}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.contentArea}>
        {renderTabContent()}
      </div>

      {/* Footer with AI status */}
      <div className={styles.footer}>
        <div className={styles.aiStatusBar}>
          <div className={styles.currentPersonality}>
            <span>Active: {aiPersonalities.find(p => p.id === selectedPersonality)?.name}</span>
          </div>
          <div className={styles.systemMetrics}>
            <span>CPU: 24%</span>
            <span>Memory: 67%</span>
            <span>Network: 892 KB/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentView;
