# UI Component Architecture Specification

## Component Hierarchy and Integration Points

### Current HUD Architecture Analysis
```
Current HUDLayout Structure:
├── TopBar (5% height, full width)
├── LeftSideBar (110px width, full height minus TopBar)  
├── RightSideBar (auto width, full height minus TopBar)
├── BottomBar (5% height, left margin 110px)
├── Corners (TopLeft, TopRight, BottomLeft, BottomRight)
├── Center (transparent, Globe renders here)
└── FloatingPanelManager (overlay system)
```

### Enhanced Architecture with Investigation Layer
```
Enhanced HUDLayout Structure:
├── TopBar (unchanged - status and data feeds)
├── LeftSideBar (enhanced with investigation controls)
│   ├── [EXISTING] TinyGlobe + Mode Settings
│   ├── [EXISTING] NOAA Controls + Deep Settings  
│   └── [NEW] Investigation Section (collapsible)
│       ├── InvestigationSelector
│       ├── TeamStatusPanel
│       └── QuickActions
├── RightSideBar (enhanced with investigation tools)
│   ├── [EXISTING] Mission Control Panels
│   ├── [EXISTING] External App Launcher
│   ├── [EXISTING] Intelligence Hub
│   └── [NEW] Investigation Tools Section (collapsible)
│       ├── EvidenceCollectionPanel
│       ├── AnalysisToolkit
│       └── CollaborationHub
├── BottomBar (unchanged - minimal presence)
├── Corners (unchanged)
├── Center (enhanced with multi-mode support)
│   ├── [EXISTING] Globe Mode (preserve current functionality)
│   ├── [NEW] Investigation Board Mode
│   ├── [NEW] Timeline Mode
│   ├── [NEW] Network Graph Mode
│   └── [NEW] Split-Screen Modes
└── FloatingPanelManager (leverage for investigation workspaces)
    ├── [EXISTING] Current floating panels
    ├── [NEW] Collaborative Whiteboard
    ├── [NEW] Evidence Detail Panels
    └── [NEW] Team Communication Panels
```

## Detailed Component Specifications

### 1. Center View Multi-Mode Manager

#### CenterViewManager Enhancement
```typescript
// File: src/components/HUD/Center/CenterViewManager.tsx
// STATUS: Enhance existing component with new modes

interface CenterViewManagerProps {
  // Preserve existing Globe functionality
  globeMode: {
    component: React.ComponentType; // Current Globe component
    props: any; // Current Globe props
    enabled: boolean; // Always true for backward compatibility
  };
  
  // Add new investigation modes
  investigationModes: {
    kanbanBoard: {
      component: typeof InvestigationKanbanBoard;
      enabled: boolean; // Feature flag controlled
    };
    timeline: {
      component: typeof InvestigationTimeline;
      enabled: boolean;
    };
    networkGraph: {
      component: typeof ThreatNetworkGraph;
      enabled: boolean;
    };
    splitScreen: {
      component: typeof SplitScreenManager;
      enabled: boolean;
    };
  };
  
  // Mode management
  currentMode: 'globe' | 'investigation' | 'timeline' | 'network' | 'split';
  onModeChange: (mode: string) => void;
  
  // Cross-mode synchronization
  syncState: {
    selectedLocation: GeoLocation | null;
    selectedEntity: Entity | null;
    timeRange: TimeRange | null;
    investigationContext: Investigation | null;
  };
}

// Implementation preserves existing Globe while adding new modes
const CenterViewManager: React.FC<CenterViewManagerProps> = ({ 
  globeMode, 
  investigationModes, 
  currentMode, 
  syncState 
}) => {
  const investigationEnabled = useFeatureFlag('investigationModeEnabled');
  
  return (
    <div className="center-view-container">
      {/* Mode selector (only show if investigation features enabled) */}
      {investigationEnabled && (
        <ModeSelector 
          currentMode={currentMode} 
          availableModes={getAvailableModes(investigationModes)}
          onModeChange={onModeChange}
        />
      )}
      
      {/* Render appropriate component based on mode */}
      {currentMode === 'globe' && (
        <div className="globe-mode">
          {/* Preserve existing Globe component unchanged */}
          <globeMode.component {...globeMode.props} />
        </div>
      )}
      
      {currentMode === 'investigation' && investigationModes.kanbanBoard.enabled && (
        <div className="investigation-mode">
          <investigationModes.kanbanBoard.component 
            syncState={syncState}
            onEntitySelect={handleEntitySelect}
            onLocationSelect={handleLocationSelect}
          />
        </div>
      )}
      
      {currentMode === 'timeline' && investigationModes.timeline.enabled && (
        <div className="timeline-mode">
          <investigationModes.timeline.component 
            syncState={syncState}
            onTimeRangeChange={handleTimeRangeChange}
          />
        </div>
      )}
      
      {/* Additional modes... */}
    </div>
  );
};
```

#### Investigation Board Component
```typescript
// File: src/components/Investigation/InvestigationKanbanBoard.tsx
// STATUS: New component

interface InvestigationKanbanBoardProps {
  investigationId?: string;
  syncState: CenterViewSyncState;
  onEntitySelect: (entity: Entity) => void;
  onLocationSelect: (location: GeoLocation) => void;
  className?: string;
}

const InvestigationKanbanBoard: React.FC<InvestigationKanbanBoardProps> = ({
  investigationId,
  syncState,
  onEntitySelect,
  onLocationSelect
}) => {
  const { currentInvestigation, tasks, updateTask } = useInvestigationContext();
  const [draggedTask, setDraggedTask] = useState<InvestigationTask | null>(null);
  
  const columns: KanbanColumn[] = [
    { id: 'backlog', title: 'Backlog', status: 'backlog' },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress' },
    { id: 'analysis', title: 'Analysis', status: 'analysis' },
    { id: 'review', title: 'Review', status: 'review' },
    { id: 'completed', title: 'Completed', status: 'completed' }
  ];
  
  const handleTaskDrop = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus, updatedAt: new Date() });
  };
  
  const handleTaskLocationClick = (task: InvestigationTask) => {
    if (task.location) {
      onLocationSelect(task.location);
    }
  };
  
  return (
    <div className="investigation-kanban-board">
      <div className="board-header">
        <h2>{currentInvestigation?.title || 'Investigation Board'}</h2>
        <div className="board-controls">
          <CreateTaskButton investigationId={investigationId} />
          <ViewModeToggle />
          <BoardFilters />
        </div>
      </div>
      
      <div className="kanban-columns">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter(task => task.status === column.status)}
            onTaskDrop={handleTaskDrop}
            onTaskLocationClick={handleTaskLocationClick}
            onTaskSelect={onEntitySelect}
          />
        ))}
      </div>
      
      {/* Task detail modal */}
      <TaskDetailModal />
    </div>
  );
};
```

### 2. LeftSideBar Investigation Integration

#### LeftSideBar Enhancement
```typescript
// File: src/components/HUD/Bars/LeftSideBar/LeftSideBar.tsx
// STATUS: Enhance existing component

interface LeftSideBarEnhancementProps {
  // Preserve all existing props
  collapsed?: boolean;
  onToggle?: () => void;
  
  // Add investigation-specific props
  investigationMode?: boolean;
  activeInvestigation?: Investigation | null;
}

const LeftSideBar: React.FC<LeftSideBarEnhancementProps> = ({ 
  collapsed, 
  onToggle, 
  investigationMode,
  activeInvestigation 
}) => {
  const investigationEnabled = useFeatureFlag('investigationModeEnabled');
  const [investigationSectionCollapsed, setInvestigationSectionCollapsed] = useState(false);
  
  return (
    <div className={`${styles.leftSideBar} ${collapsed ? styles.collapsed : ''}`}>
      {/* PRESERVE ALL EXISTING COMPONENTS */}
      
      {/* Existing TinyGlobe component - unchanged */}
      <div className={styles.tinyGlobeSection}>
        <TinyGlobe />
      </div>
      
      {/* Existing Mode Settings Panel - unchanged */}
      <div className={styles.modeSettingsSection}>
        <ModeSettingsPanel />
      </div>
      
      {/* Existing NOAA Controls - unchanged */}
      <div className={styles.noaaSection}>
        <CompactNOAAControls />
        <NOAAVisualizationStatus />
      </div>
      
      {/* NEW INVESTIGATION SECTION - only show if feature enabled */}
      {investigationEnabled && (
        <div className={styles.investigationSection}>
          <SectionHeader 
            title="Investigation"
            collapsed={investigationSectionCollapsed}
            onToggle={() => setInvestigationSectionCollapsed(!investigationSectionCollapsed)}
            icon="investigation"
          />
          
          {!investigationSectionCollapsed && (
            <div className={styles.investigationControls}>
              <InvestigationSelector 
                activeInvestigation={activeInvestigation}
                compact={true}
              />
              <TeamStatusPanel 
                compact={true}
                maxMembers={3} // Show limited members in sidebar
              />
              <InvestigationQuickActions 
                investigationId={activeInvestigation?.id}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

#### Investigation Section Components
```typescript
// File: src/components/HUD/Bars/LeftSideBar/InvestigationSection.tsx
// STATUS: New component

interface InvestigationSectionProps {
  compact: boolean;
  activeInvestigation: Investigation | null;
  onInvestigationChange: (investigation: Investigation) => void;
}

const InvestigationSelector: React.FC<{
  activeInvestigation: Investigation | null;
  compact: boolean;
}> = ({ activeInvestigation, compact }) => {
  const { investigations, selectInvestigation } = useInvestigationContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  return (
    <div className="investigation-selector">
      <div 
        className="current-investigation"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <span className="investigation-name">
          {activeInvestigation?.title || 'No Investigation'}
        </span>
        <ChevronIcon direction={dropdownOpen ? 'up' : 'down'} />
      </div>
      
      {dropdownOpen && (
        <div className="investigation-dropdown">
          {investigations.map(investigation => (
            <div 
              key={investigation.id}
              className="investigation-option"
              onClick={() => {
                selectInvestigation(investigation.id);
                setDropdownOpen(false);
              }}
            >
              <span className="investigation-title">{investigation.title}</span>
              <span className="investigation-status">{investigation.status}</span>
            </div>
          ))}
          <div className="investigation-option create-new">
            <span>+ Create New Investigation</span>
          </div>
        </div>
      )}
    </div>
  );
};

const TeamStatusPanel: React.FC<{
  compact: boolean;
  maxMembers?: number;
}> = ({ compact, maxMembers = 3 }) => {
  const { teamMembers, onlineMembers } = useInvestigationContext();
  const displayMembers = compact ? onlineMembers.slice(0, maxMembers) : onlineMembers;
  
  return (
    <div className="team-status-panel">
      <div className="team-header">
        <span>Team ({onlineMembers.length} online)</span>
      </div>
      
      <div className="team-members">
        {displayMembers.map(member => (
          <div key={member.id} className="team-member">
            <div className={`status-indicator ${member.status}`} />
            <span className="member-name">{member.name}</span>
            {member.currentTask && compact && (
              <span className="current-task">{member.currentTask}</span>
            )}
          </div>
        ))}
        
        {compact && onlineMembers.length > maxMembers && (
          <div className="more-members">
            +{onlineMembers.length - maxMembers} more
          </div>
        )}
      </div>
    </div>
  );
};

const InvestigationQuickActions: React.FC<{
  investigationId?: string;
}> = ({ investigationId }) => {
  const { createTask, addEvidence } = useInvestigationContext();
  
  const quickActions = [
    {
      id: 'add-task',
      label: 'Add Task',
      icon: 'plus',
      action: () => openCreateTaskModal(investigationId)
    },
    {
      id: 'add-evidence',
      label: 'Add Evidence',
      icon: 'upload',
      action: () => openEvidenceUploadModal(investigationId)
    },
    {
      id: 'take-screenshot',
      label: 'Screenshot',
      icon: 'camera',
      action: () => captureScreenshot(investigationId)
    }
  ];
  
  return (
    <div className="investigation-quick-actions">
      {quickActions.map(action => (
        <button
          key={action.id}
          className="quick-action-button"
          onClick={action.action}
          title={action.label}
        >
          <Icon name={action.icon} />
          <span className="action-label">{action.label}</span>
        </button>
      ))}
    </div>
  );
};
```

### 3. RightSideBar Investigation Tools

#### RightSideBar Enhancement
```typescript
// File: src/components/HUD/Bars/RightSideBar/RightSideBar.tsx
// STATUS: Enhance existing component

interface RightSideBarEnhancementProps {
  // Preserve existing props
  expanded?: boolean;
  apps?: ExternalApp[];
  
  // Add investigation props
  investigationToolsEnabled?: boolean;
  activeInvestigation?: Investigation | null;
}

const RightSideBar: React.FC<RightSideBarEnhancementProps> = ({ 
  expanded, 
  apps, 
  investigationToolsEnabled,
  activeInvestigation 
}) => {
  const investigationEnabled = useFeatureFlag('investigationModeEnabled');
  const [toolsSectionExpanded, setToolsSectionExpanded] = useState(true);
  
  return (
    <div className={`${styles.rightSideBar} ${expanded ? styles.expanded : ''}`}>
      {/* PRESERVE ALL EXISTING SECTIONS */}
      
      {/* Existing Mission Control - unchanged */}
      <div className={styles.missionControlSection}>
        <MissionControlPanel />
      </div>
      
      {/* Existing External Apps - unchanged */}
      <div className={styles.externalAppsSection}>
        <ExternalAppLauncher apps={apps} />
      </div>
      
      {/* Existing Intelligence Hub - unchanged */}
      <div className={styles.intelligenceSection}>
        <IntelligenceHub />
      </div>
      
      {/* Existing Globe Status - unchanged */}
      <div className={styles.globeStatusSection}>
        <GlobeStatus />
      </div>
      
      {/* NEW INVESTIGATION TOOLS SECTION */}
      {investigationEnabled && investigationToolsEnabled && (
        <div className={styles.investigationToolsSection}>
          <SectionHeader
            title="Investigation Tools"
            expanded={toolsSectionExpanded}
            onToggle={() => setToolsSectionExpanded(!toolsSectionExpanded)}
            icon="tools"
          />
          
          {toolsSectionExpanded && (
            <div className={styles.investigationTools}>
              <EvidenceCollectionPanel 
                investigationId={activeInvestigation?.id}
                compact={true}
              />
              <AnalysisToolkit 
                investigationId={activeInvestigation?.id}
              />
              <TeamCollaborationHub 
                investigationId={activeInvestigation?.id}
                compact={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

#### Investigation Tools Components
```typescript
// File: src/components/Investigation/EvidenceCollectionPanel.tsx
// STATUS: New component for RightSideBar

interface EvidenceCollectionPanelProps {
  investigationId?: string;
  compact?: boolean;
  maxItems?: number;
}

const EvidenceCollectionPanel: React.FC<EvidenceCollectionPanelProps> = ({
  investigationId,
  compact = false,
  maxItems = 5
}) => {
  const { evidence, addEvidence } = useInvestigationContext();
  const [dragOver, setDragOver] = useState(false);
  
  const recentEvidence = evidence
    .filter(item => !investigationId || item.relatedTasks.some(taskId => taskId === investigationId))
    .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())
    .slice(0, compact ? maxItems : evidence.length);
  
  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    for (const file of files) {
      await addEvidence({
        title: file.name,
        description: `Uploaded file: ${file.name}`,
        type: 'file',
        source: 'drag-drop',
        collectedAt: new Date(),
        collectedBy: 'current-user', // Replace with actual user ID
        tags: [],
        metadata: {
          originalName: file.name,
          size: file.size,
          type: file.type
        },
        relatedTasks: investigationId ? [investigationId] : []
      }, file);
    }
  };
  
  return (
    <div className="evidence-collection-panel">
      <div className="panel-header">
        <h3>Evidence</h3>
        <div className="evidence-actions">
          <UploadButton onUpload={addEvidence} />
          <CaptureButton onCapture={addEvidence} />
        </div>
      </div>
      
      <div 
        className={`evidence-drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {recentEvidence.length === 0 ? (
          <div className="empty-evidence">
            <p>Drop files here or click to upload evidence</p>
          </div>
        ) : (
          <div className="evidence-list">
            {recentEvidence.map(item => (
              <EvidenceItem 
                key={item.id} 
                evidence={item} 
                compact={compact}
                onClick={() => openEvidenceDetailModal(item)}
              />
            ))}
            {compact && evidence.length > maxItems && (
              <div className="view-all-evidence">
                <button onClick={() => openFullEvidencePanel()}>
                  View all {evidence.length} items
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AnalysisToolkit: React.FC<{
  investigationId?: string;
}> = ({ investigationId }) => {
  const analysisTools = [
    {
      id: 'timeline',
      name: 'Timeline Analysis',
      icon: 'timeline',
      action: () => openTimelineAnalysis(investigationId)
    },
    {
      id: 'correlation',
      name: 'Data Correlation',
      icon: 'correlation',
      action: () => openCorrelationAnalysis(investigationId)
    },
    {
      id: 'pattern',
      name: 'Pattern Recognition',
      icon: 'pattern',
      action: () => openPatternAnalysis(investigationId)
    },
    {
      id: 'export',
      name: 'Export Report',
      icon: 'export',
      action: () => exportInvestigationReport(investigationId)
    }
  ];
  
  return (
    <div className="analysis-toolkit">
      <div className="toolkit-header">
        <h3>Analysis Tools</h3>
      </div>
      
      <div className="tool-grid">
        {analysisTools.map(tool => (
          <button
            key={tool.id}
            className="analysis-tool"
            onClick={tool.action}
            title={tool.name}
          >
            <Icon name={tool.icon} />
            <span className="tool-name">{tool.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const TeamCollaborationHub: React.FC<{
  investigationId?: string;
  compact?: boolean;
}> = ({ investigationId, compact = false }) => {
  const { teamMembers, onlineMembers } = useInvestigationContext();
  const [chatOpen, setChatOpen] = useState(false);
  
  return (
    <div className="team-collaboration-hub">
      <div className="hub-header">
        <h3>Team Collaboration</h3>
        <div className="online-indicator">
          {onlineMembers.length} online
        </div>
      </div>
      
      <div className="collaboration-actions">
        <button 
          className="chat-button"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <Icon name="chat" />
          <span>Team Chat</span>
          {/* Show unread count if any */}
        </button>
        
        <button 
          className="whiteboard-button"
          onClick={() => openCollaborativeWhiteboard(investigationId)}
        >
          <Icon name="whiteboard" />
          <span>Whiteboard</span>
        </button>
        
        <button 
          className="share-screen-button"
          onClick={() => startScreenShare()}
        >
          <Icon name="screen-share" />
          <span>Share Screen</span>
        </button>
      </div>
      
      {chatOpen && (
        <div className="embedded-chat">
          <IntegratedChatSystem 
            investigationId={investigationId}
            compact={compact}
            maxHeight="200px"
          />
        </div>
      )}
    </div>
  );
};
```

## CSS Styling Integration

### Layout Preservation
```css
/* File: src/components/Investigation/Investigation.module.css */
/* STATUS: New stylesheet that doesn't conflict with existing styles */

/* Investigation section styling that respects existing LeftSideBar layout */
.investigationSection {
  margin-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 10px;
}

.investigationControls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 8px;
}

/* Investigation tools styling for RightSideBar */
.investigationToolsSection {
  margin-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 15px;
}

.investigationTools {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Kanban board styling for center view */
.investigationKanbanBoard {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.boardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.kanbanColumns {
  flex: 1;
  display: flex;
  gap: 15px;
  padding: 20px;
  overflow-x: auto;
}

/* Evidence collection styling */
.evidenceCollectionPanel {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 12px;
}

.evidenceDropZone {
  min-height: 100px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.evidenceDropZone.dragOver {
  border-color: #00ff41;
  background: rgba(0, 255, 65, 0.1);
}

/* Team collaboration styling */
.teamCollaborationHub {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 12px;
}

.collaborationActions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collaborationActions button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
}

.collaborationActions button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Responsive design */
@media (max-width: 1200px) {
  .kanbanColumns {
    gap: 10px;
    padding: 15px;
  }
  
  .investigationTools {
    gap: 10px;
  }
}

/* Dark theme integration */
@media (prefers-color-scheme: dark) {
  .investigationSection {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
  
  .investigationToolsSection {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}
```

This comprehensive component architecture specification ensures that:

1. **All existing UI components remain completely unchanged**
2. **New investigation features are cleanly integrated via feature flags**
3. **The component hierarchy respects the current HUDLayout structure**
4. **CSS styling doesn't conflict with existing styles**
5. **Performance is maintained through lazy loading and conditional rendering**
6. **The architecture is scalable for future enhancements**

The specification provides clear integration points for each component while maintaining backward compatibility and system stability.
