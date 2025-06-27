# Technical Implementation Guide: Collaborative Operations Bridge MVP

## Overview
This document provides detailed technical specifications for implementing the Collaborative Operations Bridge UI archetype as the MVP for the AI Security RelayNode platform. The implementation preserves all existing functionality while adding team-centered investigation capabilities.

## Architecture Philosophy

### Non-Invasive Enhancement Strategy
```typescript
// PRINCIPLE: Enhance, don't replace
// Existing components remain untouched
// New functionality layers on top via composition
// Feature flags control visibility and activation

interface NonInvasiveArchitecture {
  preserveExisting: {
    hudLayout: "Maintain all current HUD components";
    globeIntegration: "Keep existing 3D Globe functionality";
    floatingPanels: "Leverage existing panel system";
    featureFlags: "Use existing feature flag infrastructure";
  };
  addNewCapabilities: {
    investigationLayer: "New investigation management overlay";
    collaborationServices: "Team coordination services";
    enhancedWorkflows: "Investigation-focused workflows";
  };
}
```

## Component Integration Strategy

### 1. Center View Enhancement
```typescript
// File: src/components/HUD/Center/CenterViewManager.tsx
// MODIFICATION: Enhance existing component, don't replace

interface CenterViewEnhancement {
  // Preserve existing Globe rendering
  existingGlobeMode: {
    component: "Globe"; // Keep current Globe component unchanged
    rendering: "Maintain current 3D Globe.gl integration";
    controls: "Preserve existing globe controls";
  };
  
  // Add new investigation modes
  newInvestigationModes: {
    investigationBoard: {
      component: "InvestigationKanbanBoard";
      layout: "overlay" | "split-screen" | "tabbed";
      syncWithGlobe: boolean;
    };
    timelineView: {
      component: "InvestigationTimeline";
      integration: "Geospatial timeline with Globe sync";
    };
    networkGraph: {
      component: "ThreatNetworkGraph";
      overlay: "Network connections over Globe view";
    };
  };
  
  // Mode switching logic
  viewModeSelector: {
    current: "globe" | "investigation" | "timeline" | "network" | "split";
    transition: "Smooth animated transitions between modes";
    preservation: "Maintain state when switching modes";
  };
}
```

### 2. LeftSideBar Enhancement
```typescript
// File: src/components/HUD/Bars/LeftSideBar/LeftSideBar.tsx
// MODIFICATION: Add investigation section without disturbing existing controls

interface LeftSideBarEnhancement {
  // Preserve all existing functionality
  existingSections: {
    tinyGlobe: "Keep current TinyGlobe component";
    modeSettings: "Maintain current mode settings panel";
    noaaControls: "Preserve NOAA visualization controls";
    deepSettings: "Keep existing deep settings panel";
  };
  
  // Add new investigation section
  newInvestigationSection: {
    position: "Above existing controls or collapsible section";
    components: {
      activeInvestigations: "InvestigationSelector";
      teamStatus: "TeamMemberStatusPanel";
      quickActions: "InvestigationQuickActions";
    };
    integration: {
      featureFlag: "investigationModeEnabled";
      collapsible: true;
      preserveExistingLayout: true;
    };
  };
}
```

### 3. RightSideBar Enhancement
```typescript
// File: src/components/HUD/Bars/RightSideBar/RightSideBar.tsx
// MODIFICATION: Add investigation tools while preserving mission control

interface RightSideBarEnhancement {
  // Preserve existing functionality
  existingSections: {
    missionControl: "Keep current mission control panels";
    externalApps: "Maintain external app launcher";
    intelligenceHub: "Preserve intelligence reporting";
    globeStatus: "Keep globe status display";
  };
  
  // Add investigation tools section
  newInvestigationTools: {
    evidenceCollection: {
      component: "EvidenceCollectionPanel";
      position: "New collapsible section";
      integration: "File system integration via Tauri";
    };
    analysisTools: {
      component: "BasicAnalysisToolkit";
      features: ["Data correlation", "Pattern recognition", "Timeline creation"];
    };
    collaborationHub: {
      component: "TeamCollaborationPanel";
      features: ["Chat integration", "Shared annotations", "Task assignment"];
    };
  };
}
```

## New Component Specifications

### 1. Investigation Management Components

#### InvestigationKanbanBoard
```typescript
// File: src/components/Investigation/InvestigationKanbanBoard.tsx
// NEW COMPONENT: Central investigation management

interface InvestigationKanbanBoard {
  columns: {
    backlog: InvestigationTask[];
    inProgress: InvestigationTask[];
    analysis: InvestigationTask[];
    review: InvestigationTask[];
    completed: InvestigationTask[];
  };
  
  features: {
    dragAndDrop: "React DnD for task movement";
    realTimeSync: "Nostr relay synchronization";
    taskDetails: "Expandable task detail panels";
    teamAssignment: "Task assignment to team members";
    deadlines: "Due date tracking and alerts";
  };
  
  integration: {
    globeSync: "Link tasks to geographical locations";
    evidenceLinks: "Connect tasks to evidence items";
    timelineIntegration: "Timeline view of investigation progress";
  };
}

interface InvestigationTask {
  id: string;
  title: string;
  description: string;
  assignee: TeamMember | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "backlog" | "in-progress" | "analysis" | "review" | "completed";
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  evidence: EvidenceItem[];
  location: GeoLocation | null;
  tags: string[];
  dependencies: string[]; // Task IDs this task depends on
}
```

#### TeamCollaborationPanel
```typescript
// File: src/components/Investigation/TeamCollaborationPanel.tsx
// NEW COMPONENT: Real-time team coordination

interface TeamCollaborationPanel {
  teamMembers: {
    online: TeamMember[];
    offline: TeamMember[];
    status: "available" | "busy" | "away" | "do-not-disturb";
  };
  
  communication: {
    chat: {
      component: "IntegratedChatSystem";
      features: ["Text", "Voice notes", "File sharing"];
      integration: "Nostr relay for real-time messaging";
    };
    voiceChannel: {
      component: "WebRTCVoiceChannel";
      features: ["Push-to-talk", "Always-on", "Mute controls"];
    };
    screenSharing: {
      component: "ScreenShareInterface";
      features: ["Full screen", "Application window", "Region selection"];
    };
  };
  
  sharedWorkspaces: {
    whiteboard: "CollaborativeWhiteboard";
    documents: "SharedDocumentEditor";
    annotations: "SharedMapAnnotations";
  };
}

interface TeamMember {
  id: string;
  name: string;
  role: "investigator" | "analyst" | "lead" | "specialist";
  status: "online" | "offline" | "busy" | "away";
  lastSeen: Date;
  currentTask: string | null;
  permissions: Permission[];
  avatar: string | null;
}
```

#### EvidenceCollectionPanel
```typescript
// File: src/components/Investigation/EvidenceCollectionPanel.tsx
// NEW COMPONENT: Evidence management system

interface EvidenceCollectionPanel {
  evidenceItems: {
    files: EvidenceFile[];
    screenshots: ScreenshotEvidence[];
    logs: LogEvidence[];
    network: NetworkEvidence[];
    external: ExternalEvidence[];
  };
  
  collection: {
    dragAndDrop: "File drop zone for evidence upload";
    screenshot: "Built-in screenshot capture";
    clipboardIntegration: "Paste images and text";
    webCapture: "Capture web pages and URLs";
  };
  
  organization: {
    tagging: "Tag-based organization system";
    timeline: "Chronological evidence ordering";
    chains: "Evidence chain relationships";
    search: "Full-text search across all evidence";
  };
  
  security: {
    hashing: "SHA-256 hash for integrity";
    encryption: "Ring encryption for sensitive data";
    audit: "Access audit trail";
    backup: "IPFS distributed storage";
  };
}

interface EvidenceItem {
  id: string;
  type: "file" | "screenshot" | "log" | "network" | "external";
  title: string;
  description: string;
  hash: string; // SHA-256 hash for integrity
  size: number;
  mimeType: string;
  collectedAt: Date;
  collectedBy: string; // Team member ID
  source: string; // Where the evidence was collected from
  tags: string[];
  metadata: Record<string, any>;
  relatedTasks: string[]; // Investigation task IDs
  chainOfCustody: CustodyRecord[];
}
```

### 2. Real-time Synchronization System

#### CollaborationService
```typescript
// File: src/services/CollaborationService.ts
// NEW SERVICE: Real-time collaboration backend

interface CollaborationService {
  // Leverage existing Nostr relay for real-time sync
  nostrIntegration: {
    relay: "Use existing NostrRelay from ai-security-relaynode";
    events: "Custom event types for collaboration";
    encryption: "End-to-end encryption for sensitive data";
  };
  
  // Real-time synchronization
  sync: {
    investigations: "Sync investigation board state";
    tasks: "Real-time task updates";
    evidence: "Evidence collection synchronization";
    chat: "Real-time messaging";
    presence: "Team member presence indicators";
  };
  
  // Conflict resolution
  conflicts: {
    strategy: "Last-writer-wins with conflict detection";
    merging: "Automatic merge for non-conflicting changes";
    notification: "Alert users to conflicts requiring resolution";
  };
}

// Nostr event types for collaboration
interface CollaborationEvents {
  INVESTIGATION_UPDATE: {
    type: "investigation_update";
    payload: InvestigationState;
    timestamp: number;
    author: string;
  };
  
  TASK_UPDATE: {
    type: "task_update";
    payload: InvestigationTask;
    timestamp: number;
    author: string;
  };
  
  CHAT_MESSAGE: {
    type: "chat_message";
    payload: ChatMessage;
    timestamp: number;
    author: string;
  };
  
  PRESENCE_UPDATE: {
    type: "presence_update";
    payload: TeamMemberPresence;
    timestamp: number;
    author: string;
  };
}
```

### 3. Data Integration Layer

#### InvestigationStorageService
```typescript
// File: src/services/InvestigationStorageService.ts
// NEW SERVICE: Investigation data persistence

interface InvestigationStorageService {
  // Leverage existing SQLite database
  database: {
    connection: "Use existing SQLx connection";
    schema: "Extend with investigation tables";
    migrations: "Add investigation schema migrations";
  };
  
  // Data operations
  operations: {
    investigations: {
      create: (investigation: Investigation) => Promise<Investigation>;
      update: (id: string, updates: Partial<Investigation>) => Promise<Investigation>;
      delete: (id: string) => Promise<void>;
      list: () => Promise<Investigation[]>;
      get: (id: string) => Promise<Investigation | null>;
    };
    
    tasks: {
      create: (task: InvestigationTask) => Promise<InvestigationTask>;
      update: (id: string, updates: Partial<InvestigationTask>) => Promise<InvestigationTask>;
      delete: (id: string) => Promise<void>;
      listByInvestigation: (investigationId: string) => Promise<InvestigationTask[]>;
    };
    
    evidence: {
      store: (evidence: EvidenceItem, file?: Buffer) => Promise<EvidenceItem>;
      retrieve: (id: string) => Promise<EvidenceItem | null>;
      listByTask: (taskId: string) => Promise<EvidenceItem[]>;
    };
  };
  
  // File system integration via Tauri
  fileSystem: {
    evidenceStorage: "Local evidence file storage";
    export: "Export investigations to standard formats";
    import: "Import existing investigation data";
  };
}

// Database schema additions
interface DatabaseSchema {
  investigations: {
    id: "TEXT PRIMARY KEY";
    title: "TEXT NOT NULL";
    description: "TEXT";
    status: "TEXT NOT NULL";
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP";
    updated_at: "DATETIME DEFAULT CURRENT_TIMESTAMP";
    created_by: "TEXT NOT NULL";
    team_members: "TEXT"; // JSON array of team member IDs
    metadata: "TEXT"; // JSON metadata
  };
  
  investigation_tasks: {
    id: "TEXT PRIMARY KEY";
    investigation_id: "TEXT NOT NULL";
    title: "TEXT NOT NULL";
    description: "TEXT";
    status: "TEXT NOT NULL";
    priority: "TEXT NOT NULL";
    assignee: "TEXT";
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP";
    updated_at: "DATETIME DEFAULT CURRENT_TIMESTAMP";
    due_date: "DATETIME";
    metadata: "TEXT"; // JSON metadata including location, dependencies, etc.
  };
  
  evidence_items: {
    id: "TEXT PRIMARY KEY";
    task_id: "TEXT NOT NULL";
    title: "TEXT NOT NULL";
    description: "TEXT";
    type: "TEXT NOT NULL";
    file_path: "TEXT";
    hash: "TEXT NOT NULL";
    size: "INTEGER";
    mime_type: "TEXT";
    collected_at: "DATETIME DEFAULT CURRENT_TIMESTAMP";
    collected_by: "TEXT NOT NULL";
    metadata: "TEXT"; // JSON metadata
  };
}
```

## Integration Points with Existing System

### 1. Feature Flag Integration
```typescript
// File: src/utils/featureFlags.ts
// MODIFICATION: Add investigation mode flags

interface FeatureFlagAdditions {
  // Add these flags to existing feature flag system
  investigationModeEnabled: boolean; // Master switch for investigation features
  investigationBoardEnabled: boolean; // Kanban board in center view
  teamCollaborationEnabled: boolean; // Team collaboration features
  evidenceCollectionEnabled: boolean; // Evidence management system
  realTimeSyncEnabled: boolean; // Real-time synchronization
}

// Usage in components
const useInvestigationFeatures = () => {
  const investigationMode = useFeatureFlag('investigationModeEnabled');
  const boardEnabled = useFeatureFlag('investigationBoardEnabled');
  const collaborationEnabled = useFeatureFlag('teamCollaborationEnabled');
  
  return { investigationMode, boardEnabled, collaborationEnabled };
};
```

### 2. HUDLayout Integration
```typescript
// File: src/layouts/HUDLayout/HUDLayout.tsx
// MODIFICATION: Add investigation mode awareness

interface HUDLayoutEnhancement {
  // Existing structure preserved
  existingComponents: {
    topBar: "No changes";
    bottomBar: "No changes";
    corners: "No changes";
    floatingPanels: "No changes";
  };
  
  // Enhanced components with investigation features
  enhancedComponents: {
    centerView: {
      component: "Enhanced CenterViewManager";
      newModes: ["investigation", "timeline", "network"];
      preservation: "Globe mode unchanged";
    };
    
    leftSideBar: {
      component: "Enhanced LeftSideBar";
      newSection: "Investigation controls (collapsible)";
      preservation: "All existing controls unchanged";
    };
    
    rightSideBar: {
      component: "Enhanced RightSideBar";
      newSection: "Investigation tools (collapsible)";
      preservation: "Mission control unchanged";
    };
  };
}
```

### 3. Context Integration
```typescript
// File: src/context/InvestigationContext.tsx
// NEW CONTEXT: Investigation state management

interface InvestigationContext {
  // Investigation state
  currentInvestigation: Investigation | null;
  investigations: Investigation[];
  tasks: InvestigationTask[];
  evidence: EvidenceItem[];
  
  // Team state
  teamMembers: TeamMember[];
  onlineMembers: TeamMember[];
  currentUser: TeamMember;
  
  // Actions
  actions: {
    // Investigation management
    createInvestigation: (investigation: Omit<Investigation, 'id'>) => Promise<Investigation>;
    updateInvestigation: (id: string, updates: Partial<Investigation>) => Promise<void>;
    selectInvestigation: (id: string) => Promise<void>;
    
    // Task management
    createTask: (task: Omit<InvestigationTask, 'id'>) => Promise<InvestigationTask>;
    updateTask: (id: string, updates: Partial<InvestigationTask>) => Promise<void>;
    assignTask: (taskId: string, assigneeId: string) => Promise<void>;
    
    // Evidence management
    addEvidence: (evidence: Omit<EvidenceItem, 'id'>, file?: File) => Promise<EvidenceItem>;
    linkEvidence: (evidenceId: string, taskId: string) => Promise<void>;
    
    // Team actions
    inviteTeamMember: (email: string, role: string) => Promise<void>;
    updatePresence: (status: string) => Promise<void>;
  };
  
  // Real-time subscriptions
  subscriptions: {
    investigationUpdates: () => void;
    taskUpdates: () => void;
    teamPresence: () => void;
    chatMessages: () => void;
  };
}
```

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
```bash
# Files to create/modify
src/components/Investigation/
├── InvestigationKanbanBoard.tsx
├── InvestigationKanbanBoard.module.css
├── InvestigationSelector.tsx
└── types.ts

src/context/
└── InvestigationContext.tsx

src/services/
├── InvestigationStorageService.ts
└── CollaborationService.ts

# Database migrations
src/migrations/
└── add_investigation_tables.sql

# Feature flag additions
src/utils/featureFlags.ts (modify)
```

### Phase 2: UI Integration (Weeks 3-4)
```bash
# Component enhancements
src/components/HUD/Center/
└── CenterViewManager.tsx (enhance)

src/components/HUD/Bars/LeftSideBar/
├── LeftSideBar.tsx (enhance)
├── InvestigationSection.tsx (new)
└── InvestigationSection.module.css (new)

src/components/HUD/Bars/RightSideBar/
├── RightSideBar.tsx (enhance)
├── InvestigationToolsSection.tsx (new)
└── InvestigationToolsSection.module.css (new)
```

### Phase 3: Collaboration Features (Weeks 5-6)
```bash
# Team collaboration components
src/components/Investigation/
├── TeamCollaborationPanel.tsx
├── TeamCollaborationPanel.module.css
├── IntegratedChatSystem.tsx
├── TeamMemberStatus.tsx
└── CollaborativeWhiteboard.tsx

# Real-time services
src/services/
├── CollaborationService.ts (enhance)
├── NostrCollaborationEvents.ts
└── PresenceService.ts
```

### Phase 4: Evidence Management (Weeks 7-8)
```bash
# Evidence collection components
src/components/Investigation/
├── EvidenceCollectionPanel.tsx
├── EvidenceCollectionPanel.module.css
├── EvidenceItem.tsx
├── EvidenceUpload.tsx
└── EvidenceSearch.tsx

# Evidence services
src/services/
├── EvidenceStorageService.ts
├── EvidenceIntegrityService.ts
└── FileSystemService.ts
```

## Testing Strategy

### Unit Testing
```typescript
// Test files to create
src/__tests__/components/Investigation/
├── InvestigationKanbanBoard.test.tsx
├── TeamCollaborationPanel.test.tsx
└── EvidenceCollectionPanel.test.tsx

src/__tests__/services/
├── InvestigationStorageService.test.ts
├── CollaborationService.test.ts
└── EvidenceStorageService.test.ts

src/__tests__/context/
└── InvestigationContext.test.tsx
```

### Integration Testing
```typescript
// Integration test scenarios
interface IntegrationTests {
  hudLayoutIntegration: "Test that existing HUD components remain functional";
  featureFlagIntegration: "Test investigation features can be toggled on/off";
  globeIntegration: "Test that Globe functionality is preserved";
  realTimeSync: "Test collaboration synchronization";
  dataSync: "Test investigation data persistence";
}
```

## Security Considerations

### Data Security
```typescript
interface SecurityImplementation {
  // Leverage existing security infrastructure
  encryption: {
    service: "Use existing Ring encryption service";
    evidenceFiles: "Encrypt sensitive evidence files";
    communications: "End-to-end encrypted team communications";
  };
  
  // Access control
  permissions: {
    investigation: "Role-based investigation access";
    evidence: "Evidence access controls";
    teamManagement: "Team management permissions";
  };
  
  // Audit trail
  auditing: {
    evidenceAccess: "Log all evidence access";
    investigationChanges: "Track investigation modifications";
    teamActions: "Audit team collaboration actions";
  };
}
```

### Compliance
```typescript
interface ComplianceFeatures {
  chainOfCustody: {
    evidenceTracking: "Track evidence handling";
    integrityVerification: "Verify evidence integrity";
    accessLogging: "Log evidence access";
  };
  
  dataRetention: {
    investigationArchival: "Archive completed investigations";
    evidenceRetention: "Configurable evidence retention";
    secureWiping: "Secure deletion of sensitive data";
  };
}
```

## Performance Considerations

### Optimization Strategy
```typescript
interface PerformanceOptimization {
  // Lazy loading
  lazyLoading: {
    investigationComponents: "Load investigation UI only when enabled";
    evidenceFiles: "Lazy load large evidence files";
    collaborationFeatures: "Load collaboration features on demand";
  };
  
  // Caching
  caching: {
    investigationData: "Cache frequently accessed investigations";
    evidenceMetadata: "Cache evidence metadata for quick display";
    teamPresence: "Cache team presence information";
  };
  
  // Virtual scrolling
  virtualScrolling: {
    evidenceList: "Virtual scrolling for large evidence collections";
    taskList: "Virtual scrolling for large task lists";
    chatHistory: "Virtual scrolling for chat history";
  };
}
```

This technical documentation provides a comprehensive roadmap for implementing the Collaborative Operations Bridge MVP while preserving all existing functionality and maintaining system integrity. Each component is designed to integrate seamlessly with the current architecture while adding powerful new investigation capabilities.
