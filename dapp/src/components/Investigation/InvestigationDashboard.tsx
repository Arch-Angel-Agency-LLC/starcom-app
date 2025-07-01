// Investigation Dashboard - Modern UI implementation
// Collaborative Operations Bridge MVP - Phase 1

import React, { useEffect, useState, useMemo } from 'react';
import { useInvestigation } from '../../hooks/useInvestigation';
import { useMemoryAware } from '../../hooks/useMemoryAware';
import {
  Investigation,
  CreateInvestigationRequest,
} from '../../interfaces/Investigation';
import styles from './InvestigationDashboard.module.css';

// Sub-components
import InvestigationGrid from './InvestigationGrid';
import TaskKanban from './TaskKanban';
import EvidenceTimeline from './EvidenceTimeline';
import CreateInvestigationModal from './CreateInvestigationModal';
import CollaborationSidebar from './CollaborationSidebar';

interface InvestigationDashboardProps {
  teamId?: string;
}

type DashboardView = 'overview' | 'investigations' | 'tasks' | 'evidence' | 'analytics';

const InvestigationDashboard: React.FC<InvestigationDashboardProps> = ({
  teamId = 'mvp-team-001'
}) => {
  const {
    state,
    loadInvestigations,
    loadTasks,
    loadEvidence,
    setActiveInvestigation,
    connectToInvestigation,
    createInvestigation,
  } = useInvestigation();

  // Memory monitoring
  const { memoryStats, isMemoryHigh, isMemoryCritical, shouldProceedWithOperation } = useMemoryAware();

  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInvestigations();
  }, [teamId, loadInvestigations]);

  // Load tasks and evidence when an investigation is selected
  useEffect(() => {
    if (selectedInvestigationId) {
      loadTasks(selectedInvestigationId);
      loadEvidence(selectedInvestigationId);
      connectToInvestigation(selectedInvestigationId);
    }
  }, [selectedInvestigationId, loadTasks, loadEvidence, connectToInvestigation]);

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const activeInvestigations = state.investigations.filter(inv => inv.status === 'active').length;
    const criticalInvestigations = state.investigations.filter(inv => inv.priority === 'critical').length;
    const completedTasks = state.tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = state.tasks.filter(task => task.status === 'pending').length;
    const totalEvidence = state.evidence.length;
    const recentEvidence = state.evidence.filter(ev => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return new Date(ev.collected_at).getTime() > dayAgo;
    }).length;

    return {
      activeInvestigations,
      criticalInvestigations,
      completedTasks,
      pendingTasks,
      totalEvidence,
      recentEvidence,
    };
  }, [state.investigations, state.tasks, state.evidence]);

  // Handle creating new investigation
  const handleCreateInvestigation = async (data: CreateInvestigationRequest) => {
    const investigation = await createInvestigation({
      ...data,
      team_id: teamId,
    });
    
    if (investigation) {
      setShowCreateModal(false);
      setSelectedInvestigationId(investigation.id);
      setActiveInvestigation(investigation);
    }
  };

  const handleInvestigationSelect = (investigation: Investigation) => {
    setSelectedInvestigationId(investigation.id);
    setActiveInvestigation(investigation);
  };

  const renderOverview = () => (
    <div className={styles.overview}>
      {/* Status Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <h3>{state.investigations.length}</h3>
            <p>Total Investigations</p>
            <span className={styles.statDetail}>
              {stats.activeInvestigations} active
            </span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statIcon}>🚨</div>
          <div className={styles.statContent}>
            <h3>{stats.criticalInvestigations}</h3>
            <p>Critical Priority</p>
            <span className={styles.statDetail}>Requires attention</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3>{stats.completedTasks}</h3>
            <p>Completed Tasks</p>
            <span className={styles.statDetail}>
              {stats.pendingTasks} pending
            </span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.info}`}>
          <div className={styles.statIcon}>🔍</div>
          <div className={styles.statContent}>
            <h3>{stats.totalEvidence}</h3>
            <p>Evidence Items</p>
            <span className={styles.statDetail}>
              {stats.recentEvidence} added today
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.recentActivity}>
        <h2>Recent Activity</h2>
        <div className={styles.activityList}>
          {state.collaborationEvents.slice(-5).map((event, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {event.type === 'investigation_updated' && '📝'}
                {event.type === 'task_updated' && '📋'}
                {event.type === 'evidence_added' && '🔍'}
                {event.type === 'user_joined' && '👤'}
              </div>
              <div className={styles.activityContent}>
                <p>{event.type.replace('_', ' ')}</p>
                <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <button
            className={styles.actionButton}
            onClick={() => setShowCreateModal(true)}
          >
            <span className={styles.actionIcon}>➕</span>
            <span>New Investigation</span>
          </button>
          
          <button
            className={styles.actionButton}
            onClick={() => setActiveView('tasks')}
          >
            <span className={styles.actionIcon}>📋</span>
            <span>View Tasks</span>
          </button>
          
          <button
            className={styles.actionButton}
            onClick={() => setActiveView('evidence')}
          >
            <span className={styles.actionIcon}>🔍</span>
            <span>Browse Evidence</span>
          </button>
          
          <button
            className={styles.actionButton}
            onClick={() => setActiveView('analytics')}
          >
            <span className={styles.actionIcon}>📈</span>
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'investigations':
        return (
          <InvestigationGrid
            investigations={state.investigations}
            onSelect={handleInvestigationSelect}
            selectedId={selectedInvestigationId}
          />
        );
      
      case 'tasks':
        return (
          <TaskKanban
            investigationId={selectedInvestigationId || undefined}
            tasks={state.tasks}
            readOnly={!selectedInvestigationId}
          />
        );
      
      case 'evidence':
        return (
          <EvidenceTimeline
            evidence={state.evidence}
            investigationId={selectedInvestigationId || undefined}
            readOnly={!selectedInvestigationId}
          />
        );
      
      case 'analytics':
        return (
          <div className={styles.analytics}>
            <h2>Investigation Analytics</h2>
            <p>Advanced analytics and reporting coming soon...</p>
          </div>
        );
      
      default:
        return renderOverview();
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Investigation Operations Center</h1>
          <div className={styles.headerControls}>
            {/* Memory Status Indicator */}
            <div className={styles.memoryStatus}>
              <div className={`${styles.memoryDot} ${
                isMemoryCritical ? styles.critical : 
                isMemoryHigh ? styles.warning : styles.normal
              }`} />
              <span className={styles.memoryText}>
                {memoryStats.usedMB}MB
                {isMemoryCritical && ' ⚠️'}
                {isMemoryHigh && !isMemoryCritical && ' ⚡'}
              </span>
            </div>
            
            <div className={styles.connectionStatus}>
              <div className={`${styles.statusDot} ${
                state.isConnected ? styles.connected : styles.disconnected
              }`} />
              <span>{state.isConnected ? 'Connected' : 'Offline'}</span>
            </div>
            <button
              className={styles.createButton}
              onClick={() => shouldProceedWithOperation ? setShowCreateModal(true) : null}
              disabled={!shouldProceedWithOperation}
              title={!shouldProceedWithOperation ? 'Memory usage too high - operation disabled' : ''}
            >
              ➕ New Investigation
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={styles.navigation}>
        {[
          { id: 'overview', label: '🏠 Overview', icon: '🏠' },
          { id: 'investigations', label: '📁 Investigations', icon: '📁' },
          { id: 'tasks', label: '📋 Tasks', icon: '📋' },
          { id: 'evidence', label: '🔍 Evidence', icon: '🔍' },
          { id: 'analytics', label: '📈 Analytics', icon: '📈' },
        ].map((item) => (
          <button
            key={item.id}
            className={`${styles.navButton} ${
              activeView === item.id ? styles.active : ''
            }`}
            onClick={() => setActiveView(item.id as DashboardView)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label.replace(/^[^\s]+ /, '')}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentArea}>
          {state.isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Loading...</p>
            </div>
          ) : state.error ? (
            <div className={styles.error}>
              <h3>⚠️ Error</h3>
              <p>{state.error}</p>
              <button onClick={() => loadInvestigations()}>Try Again</button>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Collaboration Sidebar */}
        {selectedInvestigationId && (
          <CollaborationSidebar
            investigationId={selectedInvestigationId}
            teamMembers={state.teamMembers}
            collaborationEvents={state.collaborationEvents}
            currentUserId="system" // TODO: Get from auth context
          />
        )}
      </div>

      {/* Create Investigation Modal */}
      {showCreateModal && (
        <CreateInvestigationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateInvestigation}
          teamId={teamId}
          isLoading={state.isLoading}
        />
      )}
    </div>
  );
};

export default InvestigationDashboard;
