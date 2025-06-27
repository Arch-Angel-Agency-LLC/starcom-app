/**
 * IPFS-Nostr Integration Demo Page
 * 
 * This component provides a comprehensive demonstration of the IPFS-Nostr
 * integration capabilities, showcasing real-time collaboration, decentralized
 * storage, and team coordination features.
 */

import React, { useState, useEffect, useCallback } from 'react';
import EnhancedIPFSNostrDashboard from '../Integration/EnhancedIPFSNostrDashboard';
import { useIPFSNostrIntegration } from '../../hooks/useIPFSNostrIntegration';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import styles from './IPFSNostrIntegrationDemo.module.css';

export const IPFSNostrIntegrationDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'investigation' | 'team-collaboration' | 'content-sharing' | 'network-analysis'>('investigation');
  const [demoData, setDemoData] = useState<Record<string, unknown>[]>([]);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  
  // Integration hook for demo purposes
  const {
    isInitialized,
    isConnected,
    networkHealth,
    recentActivity,
    storeContent,
    refresh
  } = useIPFSNostrIntegration({
    autoInitialize: true,
    enableRealTimeSync: true,
    enableTeamWorkspaces: true,
    enableInvestigationCoordination: true
  });
  
  // Generate demo data for different scenarios
  const generateDemoData = useCallback(async (scenario: string) => {
    setIsGeneratingData(true);
    
    const demoContent = [];
    
    switch (scenario) {
      case 'investigation':
        demoContent.push(
          {
            type: 'threat-intelligence',
            title: 'APT29 IoCs Discovery',
            description: 'Identified new indicators of compromise related to APT29 campaign',
            classification: 'CONFIDENTIAL',
            timestamp: new Date().toISOString(),
            tags: ['apt29', 'malware', 'ioc']
          },
          {
            type: 'network-analysis',
            title: 'Suspicious Network Traffic',
            description: 'Anomalous traffic patterns detected on network segment 192.168.100.0/24',
            classification: 'SECRET',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            tags: ['network', 'traffic', 'anomaly']
          },
          {
            type: 'evidence',
            title: 'Forensic Disk Image',
            description: 'Complete disk image from compromised workstation WS-001',
            classification: 'TOP_SECRET',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            tags: ['forensics', 'disk-image', 'evidence']
          }
        );
        break;
        
      case 'team-collaboration':
        demoContent.push(
          {
            type: 'team-update',
            title: 'Investigation Status Update',
            description: 'Weekly status update for Operation Nighthawk',
            classification: 'CONFIDENTIAL',
            timestamp: new Date().toISOString(),
            tags: ['status', 'team', 'update']
          },
          {
            type: 'resource-sharing',
            title: 'OSINT Tools Collection',
            description: 'Curated collection of OSINT tools and techniques',
            classification: 'PUBLIC',
            timestamp: new Date(Date.now() - 180000).toISOString(),
            tags: ['osint', 'tools', 'resources']
          }
        );
        break;
        
      case 'content-sharing':
        demoContent.push(
          {
            type: 'research-paper',
            title: 'Zero-Day Vulnerability Analysis',
            description: 'Detailed analysis of recently discovered zero-day vulnerability',
            classification: 'SECRET',
            timestamp: new Date().toISOString(),
            tags: ['zero-day', 'vulnerability', 'research']
          },
          {
            type: 'threat-report',
            title: 'Ransomware Campaign Analysis',
            description: 'Comprehensive analysis of new ransomware campaign targeting healthcare',
            classification: 'CONFIDENTIAL',
            timestamp: new Date(Date.now() - 240000).toISOString(),
            tags: ['ransomware', 'healthcare', 'campaign']
          }
        );
        break;
        
      case 'network-analysis':
        demoContent.push(
          {
            type: 'network-topology',
            title: 'Infrastructure Mapping',
            description: 'Complete network topology and asset inventory',
            classification: 'CONFIDENTIAL',
            timestamp: new Date().toISOString(),
            tags: ['network', 'topology', 'infrastructure']
          },
          {
            type: 'vulnerability-scan',
            title: 'Quarterly Vulnerability Assessment',
            description: 'Results from quarterly network vulnerability assessment',
            classification: 'SECRET',
            timestamp: new Date(Date.now() - 120000).toISOString(),
            tags: ['vulnerability', 'assessment', 'scan']
          }
        );
        break;
    }
    
    // Store demo content using the integration
    for (const content of demoContent) {
      try {
        await storeContent(content, {
          teamId: 'demo-team-001',
          classification: content.classification as 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET',
          announceViaNostr: true
        });
      } catch (error) {
        console.error('Failed to store demo content:', error);
      }
    }
    
    setDemoData(demoContent);
    setIsGeneratingData(false);
  }, [storeContent]);
  
  // Auto-generate data when scenario changes
  useEffect(() => {
    generateDemoData(selectedScenario);
  }, [selectedScenario, generateDemoData]);
  
  // Render scenario selector
  const renderScenarioSelector = () => (
    <Card className={styles.scenarioSelector}>
      <CardHeader>
        <CardTitle>Demo Scenarios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.scenarioButtons}>
          {[
            { key: 'investigation', label: '🔍 Cyber Investigation', description: 'Threat intel, forensics, and evidence management' },
            { key: 'team-collaboration', label: '👥 Team Collaboration', description: 'Real-time team coordination and communication' },
            { key: 'content-sharing', label: '📄 Content Sharing', description: 'Secure document and resource sharing' },
            { key: 'network-analysis', label: '🌐 Network Analysis', description: 'Network monitoring and vulnerability assessment' }
          ].map(scenario => (
            <button
              key={scenario.key}
              onClick={() => setSelectedScenario(scenario.key as typeof selectedScenario)}
              className={`${styles.scenarioButton} ${selectedScenario === scenario.key ? styles.activeScenario : ''}`}
            >
              <div className={styles.scenarioLabel}>{scenario.label}</div>
              <div className={styles.scenarioDescription}>{scenario.description}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  // Render integration status
  const renderIntegrationStatus = () => (
    <Card className={styles.statusCard}>
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Initialization</span>
            <span className={`${styles.statusValue} ${isInitialized ? styles.success : styles.pending}`}>
              {isInitialized ? '✅ Ready' : '⏳ Initializing...'}
            </span>
          </div>
          
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Connection</span>
            <span className={`${styles.statusValue} ${isConnected ? styles.success : styles.error}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>IPFS Network</span>
            <span className={`${styles.statusValue} ${styles[networkHealth.ipfs]}`}>
              {networkHealth.ipfs.toUpperCase()}
            </span>
          </div>
          
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Nostr Network</span>
            <span className={`${styles.statusValue} ${styles[networkHealth.nostr]}`}>
              {networkHealth.nostr.toUpperCase()}
            </span>
          </div>
          
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Relay Nodes</span>
            <span className={styles.statusValue}>
              {networkHealth.relayNodes}
            </span>
          </div>
          
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Recent Activity</span>
            <span className={styles.statusValue}>
              {recentActivity.length}
            </span>
          </div>
        </div>
        
        <div className={styles.statusActions}>
          <button onClick={refresh} className={styles.refreshButton}>
            🔄 Refresh Status
          </button>
          <button 
            onClick={() => generateDemoData(selectedScenario)} 
            disabled={isGeneratingData}
            className={styles.generateButton}
          >
            {isGeneratingData ? '⏳ Generating...' : '📝 Generate Demo Data'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render demo data preview
  const renderDemoDataPreview = () => (
    <Card className={styles.demoDataCard}>
      <CardHeader>
        <CardTitle>Generated Demo Data ({selectedScenario.replace('-', ' ').toUpperCase()})</CardTitle>
      </CardHeader>
      <CardContent>
        {demoData.length > 0 ? (
          <div className={styles.dataPreview}>
            {demoData.map((item, index) => (
              <div key={index} className={styles.dataItem}>
                <div className={styles.dataHeader}>
                  <span className={styles.dataType}>{String(item.type).toUpperCase()}</span>
                  <span className={`${styles.dataClassification} ${styles[String(item.classification).toLowerCase()]}`}>
                    {String(item.classification)}
                  </span>
                </div>
                <div className={styles.dataTitle}>{String(item.title)}</div>
                <div className={styles.dataDescription}>{String(item.description)}</div>
                <div className={styles.dataTags}>
                  {(item.tags as string[])?.map(tag => (
                    <span key={tag} className={styles.dataTag}>#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            No demo data generated yet. Select a scenario above to generate sample content.
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  return (
    <div className={styles.demoContainer}>
      {/* Header */}
      <header className={styles.demoHeader}>
        <h1>🔗 IPFS-Nostr Integration Demo</h1>
        <p>Showcase of decentralized storage and real-time messaging capabilities for cybersecurity teams</p>
      </header>
      
      {/* Demo Controls */}
      <div className={styles.demoControls}>
        {renderScenarioSelector()}
        {renderIntegrationStatus()}
      </div>
      
      {/* Main Content */}
      <div className={styles.demoContent}>
        {/* Demo Data Preview */}
        <div className={styles.leftPanel}>
          {renderDemoDataPreview()}
        </div>
        
        {/* Integration Dashboard */}
        <div className={styles.rightPanel}>
          <Card className={styles.dashboardCard}>
            <CardHeader>
              <CardTitle>Live Integration Dashboard</CardTitle>
            </CardHeader>
            <CardContent className={styles.dashboardContent}>
              <EnhancedIPFSNostrDashboard 
                teamId="demo-team-001"
                userId="demo-user"
                className={styles.embeddedDashboard}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <footer className={styles.demoFooter}>
        <p>
          This demo showcases the integration between IPFS (decentralized storage) and Nostr (decentralized messaging) 
          for secure, real-time collaboration in cybersecurity investigations.
        </p>
      </footer>
    </div>
  );
};

export default IPFSNostrIntegrationDemo;
