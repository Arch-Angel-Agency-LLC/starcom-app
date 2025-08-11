/**
 * IntelWeb Development Plan (LEGACY - superseded by Consolidation Plan)
 * NOTE: Classification-centric features are deprecated for OSINT alignment.
 * 
 * Building an Obsidian-like interface for Intelligence Report management
 * using the DataPack architecture as the vault system.
 * 
 * Date: July 23, 2025
 * Status: DEVELOPMENT PLANNING
 */

/*
===============================================
🎯 INTELWEB OVERVIEW - OBSIDIAN FOR INTELLIGENCE
===============================================

## CORE CONCEPT
IntelWeb = Obsidian's UX + Intelligence-specific features + DataPack architecture

**Key Metaphors**:
- Obsidian Vault → IntelReportPackage (DataPack container)
- Obsidian Notes → IntelReportData (individual intelligence files)
- Obsidian Graph → Intelligence Relationship Graph
- Obsidian Canvas → Intel Analysis Canvas
- Obsidian Plugins → Intel Analysis Tools

## TARGET EXPERIENCE
Users should feel like they're working in Obsidian but with:
- Intelligence-specific metadata (classification, confidence, sources)
- Geographic visualization capabilities
- Collaborative intelligence analysis
- Blockchain/NFT integration for report trading

===============================================
📐 ARCHITECTURE OVERVIEW
===============================================

## COMPONENT HIERARCHY
```
IntelWeb/
├── Layout/
│   ├── IntelWebLayout.tsx           // Main 3-pane layout
│   ├── Sidebar/
│   │   ├── LeftSidebar.tsx         // File explorer + search
│   │   └── RightSidebar.tsx        // Details + metadata
│   └── MainContent/
│       ├── GraphView.tsx           // D3.js force-directed graph
│       ├── CanvasView.tsx          // Intel analysis canvas
│       └── EditorView.tsx          // Markdown editor
├── FileSystem/
│   ├── VaultExplorer.tsx           // Tree view of DataPack contents
│   ├── FileSearch.tsx              // Global search across files
│   └── TagExplorer.tsx             // Browse by tags/classification
├── Graph/
│   ├── IntelGraph.tsx              // Main graph component
│   ├── GraphControls.tsx           // Physics controls, filters
│   ├── NodeRenderer.tsx            // Custom node rendering
│   └── EdgeRenderer.tsx            // Relationship visualization
├── Editor/
│   ├── IntelEditor.tsx             // Markdown editor with intelligence features
│   ├── FrontmatterEditor.tsx       // YAML metadata editing
│   └── WikilinkProcessor.tsx       // [[Entity]] link handling
└── Analysis/
    ├── AnalysisCanvas.tsx          // Drag-drop analysis workspace
    ├── EntityExtractor.tsx         // AI-powered entity recognition
    └── RelationshipMapper.tsx      // Connection discovery tools
```

===============================================
🎨 UI/UX DESIGN - OBSIDIAN-INSPIRED
===============================================

## LAYOUT SPECIFICATIONS

### 1. THREE-PANE LAYOUT (OBSIDIAN STANDARD)
```
┌─────────────┬─────────────────────┬─────────────┐
│ Left Sidebar│    Main Content     │Right Sidebar│
│             │                     │             │
│ • Vault     │  ┌─────────────────┐│ • Outline   │
│   Explorer  │  │                 ││ • Metadata  │
│ • Search    │  │   Graph View    ││ • Backlinks │
│ • Tags      │  │   or Editor     ││ • Properties│
│ • Recent    │  │   or Canvas     ││ • Analytics │
│             │  │                 ││             │
│             │  └─────────────────┘│             │
└─────────────┴─────────────────────┴─────────────┘
   250px            flex-1            300px
```

### 2. RESPONSIVE BEHAVIOR
- **Desktop**: Full 3-pane layout
- **Tablet**: Collapsible sidebars, swipe navigation
- **Mobile**: Single pane with drawer navigation

### 3. OBSIDIAN-STYLE FEATURES
- **Command Palette** (Cmd+P): Quick actions and navigation
- **Quick Switcher** (Cmd+O): Fast file switching
- **Search** (Cmd+Shift+F): Global content search
- **Graph View** (Cmd+G): Toggle graph visualization
- **Dark/Light Themes**: Match Obsidian's aesthetic

===============================================
🗂️ LEFT SIDEBAR - VAULT MANAGEMENT
===============================================

## VAULT EXPLORER
```tsx
interface VaultExplorerProps {
  package: IntelReportPackage;
  onFileSelect: (file: VirtualFile) => void;
  onFolderToggle: (path: string) => void;
}

// Tree structure showing:
📁 Intelligence Vault
├── 📁 Operations/
│   ├── 📄 Operation-Nightfall.md
│   └── 📄 Operation-Phoenix.md
├── 📁 Entities/
│   ├── 📄 John-Doe.md
│   └── 📄 Acme-Corp.md
├── 📁 Locations/
│   ├── 📄 Moscow.md
│   └── 📄 Beijing.md
└── 📁 Analysis/
    ├── 📄 Threat-Assessment.md
    └── 📄 Pattern-Analysis.md
```

## SEARCH INTERFACE
```tsx
interface IntelSearchProps {
  vault: VirtualFileSystem;
  onResultSelect: (file: VirtualFile, match: SearchMatch) => void;
}

// Features:
- Full-text search across all files
- Metadata search (classification, tags, sources)
- Advanced filters (date range, confidence, author)
- Search suggestions and autocomplete
- Recent searches history
```

## TAG BROWSER
```tsx
interface TagBrowserProps {
  tags: Map<string, VirtualFile[]>;
  classifications: Map<string, VirtualFile[]>;
  onTagSelect: (tag: string) => void;
}

// Hierarchical tag view:
🏷️ #operations
   ├── #operations/covert (5)
   └── #operations/surveillance (3)
🔒 CONFIDENTIAL (12)
🔒 SECRET (8)
🌍 #locations
   ├── #locations/europe (15)
   └── #locations/asia (22)
```

===============================================
🕸️ MAIN CONTENT - GRAPH & EDITOR
===============================================

## GRAPH VIEW (PRIMARY INTERFACE)
```tsx
interface IntelGraphProps {
  data: IntelGraphData;
  layout: 'force' | 'hierarchical' | 'geographic';
  filters: GraphFilters;
  onNodeClick: (node: IntelNode) => void;
  onEdgeClick: (edge: IntelEdge) => void;
}

// Features:
- Force-directed physics simulation
- Node clustering by type/classification
- Geographic mode (overlay on world map)
- Time-based filtering and animation
- Zoom and pan with smooth transitions
- Node selection and multi-select
- Relationship strength visualization
```

### NODE TYPES & STYLING
```tsx
interface IntelNode {
  id: string;
  type: 'report' | 'entity' | 'location' | 'event' | 'source';
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  confidence: number; // 0-1, affects node opacity
  size: number; // Based on connections or importance
  color: string; // Type-based color coding
  position: { x: number; y: number };
  metadata: Record<string, unknown>;
}

// Visual Design:
- Reports: 📄 Document icons with classification color border
- Entities: 👤 Person icons, 🏢 Organization icons  
- Locations: 📍 Map pin icons
- Events: ⚡ Lightning bolt icons
- Sources: 🔗 Link icons
```

### GRAPH CONTROLS
```tsx
interface GraphControlsProps {
  physics: PhysicsSettings;
  filters: GraphFilters;
  onPhysicsChange: (settings: PhysicsSettings) => void;
  onFilterChange: (filters: GraphFilters) => void;
}

// Control Panel:
- Physics: Strength, Distance, Friction
- Filters: Time range, Classification, Confidence threshold
- Layout: Force/Hierarchical/Geographic toggle
- Clustering: Group by type/topic/classification
- Animation: Play/pause time-based changes
```

## EDITOR VIEW (SECONDARY INTERFACE)
```tsx
interface IntelEditorProps {
  file: VirtualFile;
  vault: VirtualFileSystem;
  onChange: (content: string, frontmatter: IntelFrontmatter) => void;
  onSave: () => void;
}

// Features:
- Monaco editor with markdown syntax highlighting
- Live preview with intelligence-specific rendering
- Frontmatter editing for classification/metadata
- Wikilink autocomplete and validation
- Tag autocomplete and suggestions
- Geographic coordinate picker
- Source citation manager
```

### INTELLIGENCE-SPECIFIC MARKDOWN
```markdown
---
classification: SECRET
confidence: 0.85
sources: 
  - HUMINT-2024-0157
  - OSINT-Social-Media
coordinates: [40.7128, -74.0060]
entities:
  - John Doe
  - Acme Corporation
tags: [operations, surveillance, new-york]
---

# Operation Nightfall - Status Report

## Summary
Intelligence indicates [[Acme Corporation]] is conducting 
suspicious activities in [[New York City]].

## Key Findings
- Financial transfers to #offshore-accounts
- Meetings with [[Known-Associate-X]]
- Increased security at [[Facility-Alpha]]

## Assessment
Confidence: **85%** based on multiple HUMINT sources.
Classification: **SECRET** - restricted distribution.

## Geolocation
Coordinates: `40.7128, -74.0060` (Manhattan)
```

===============================================
📊 RIGHT SIDEBAR - METADATA & ANALYSIS
===============================================

## PROPERTIES PANEL
```tsx
interface PropertiesProps {
  file: VirtualFile;
  onMetadataChange: (metadata: IntelMetadata) => void;
}

// Displays:
┌─────────────────────────┐
│ 📄 Operation-Nightfall │
├─────────────────────────┤
│ Classification: SECRET  │
│ Confidence: 85%         │
│ Author: Agent Smith     │
│ Created: Jul 20, 2025   │
│ Modified: Jul 23, 2025  │
│ Sources: 3 verified     │
│ Entities: 5 linked      │
│ Coordinates: Set        │
└─────────────────────────┘
```

## BACKLINKS PANEL
```tsx
interface BacklinksProps {
  targetFile: VirtualFile;
  vault: VirtualFileSystem;
  onBacklinkClick: (file: VirtualFile) => void;
}

// Shows files linking to current file:
🔗 Linked mentions (8)
├── 📄 Operation-Phoenix.md
│   "...related to [[Operation-Nightfall]]..."
├── 📄 Acme-Corp-Analysis.md
│   "...see also [[Operation-Nightfall]]..."
└── 📄 Threat-Assessment.md
    "...building on [[Operation-Nightfall]]..."
```

## ANALYTICS PANEL
```tsx
interface AnalyticsProps {
  file: VirtualFile;
  vault: VirtualFileSystem;
}

// Intelligence-specific analytics:
📈 File Analytics
├── Confidence Trend: ↗️ +15% this week
├── Entity Connections: 12 direct, 48 indirect
├── Geographic Scope: 3 countries, 8 cities
├── Classification History: 2 upgrades
└── Source Reliability: 78% verified
```

===============================================
🛠️ TECHNICAL IMPLEMENTATION PLAN
===============================================

## PHASE 1: CORE LAYOUT & NAVIGATION (Week 1)
```tsx
// 1.1 Basic Layout Components
- IntelWebLayout.tsx
- LeftSidebar.tsx
- RightSidebar.tsx
- MainContent.tsx

// 1.2 Navigation System
- Router integration
- Keyboard shortcuts
- Command palette
- Breadcrumb navigation

// 1.3 Theme System
- Dark/light mode toggle
- Obsidian-inspired color scheme
- CSS custom properties
- Responsive breakpoints
```

## PHASE 2: VAULT SYSTEM INTEGRATION (Week 2)
```tsx
// 2.1 DataPack Loading
- IntelReportPackageManager integration
- VirtualFileSystemManager connection
- Loading states and error handling
- Cache management

// 2.2 File Explorer
- VaultExplorer.tsx with tree view
- File/folder icons and status
- Drag and drop support
- Context menus

// 2.3 Search System
- FileSearch.tsx with full-text search
- Advanced filtering
- Search result highlighting
- Search history
```

## PHASE 3: GRAPH VISUALIZATION (Week 3)
```tsx
// 3.1 Graph Engine
- D3.js force simulation setup
- Custom node/edge rendering
- Performance optimization for >1000 nodes
- Zoom and pan controls

// 3.2 Intelligence-Specific Features
- Classification-based styling
- Confidence visualization
- Geographic layout mode
- Time-based filtering

// 3.3 Graph Interactions
- Node selection and editing
- Edge creation and modification
- Context menus and actions
- Graph export functionality
```

## PHASE 4: EDITOR INTEGRATION (Week 4)
```tsx
// 4.1 Markdown Editor
- Monaco editor integration
- Syntax highlighting for intelligence markdown
- Live preview with custom renderers
- Auto-save functionality

// 4.2 Intelligence Features
- Frontmatter editing interface
- Wikilink autocomplete
- Entity and tag suggestions
- Geographic coordinate picker

// 4.3 Collaboration
- Real-time editing (future)
- Comment system
- Change tracking
- Conflict resolution
```

## PHASE 5: ADVANCED FEATURES (Week 5+)
```tsx
// 5.1 Analysis Tools
- Entity extraction with AI
- Relationship discovery
- Pattern analysis
- Timeline visualization

// 5.2 Export and Sharing
- Package export to various formats
- NFT marketplace integration
- Report generation
- Collaboration features

// 5.3 Mobile Optimization
- Touch-friendly graph interactions
- Responsive layouts
- Gesture support
- Offline functionality
```

===============================================
🚀 DEVELOPMENT KICKOFF
===============================================

## IMMEDIATE NEXT STEPS:
1. Create IntelWeb folder structure
2. Set up basic layout components
3. Integrate with existing DataPack architecture
4. Implement basic navigation and routing
5. Build file explorer with DataPack support

## SUCCESS METRICS:
- ✅ Users can load IntelReportPackages as "vaults"
- ✅ File explorer shows DataPack contents in tree view
- ✅ Basic graph view displays entity relationships
- ✅ Editor can open and edit intelligence markdown files
- ✅ Search works across all files in the package
- ✅ Interface feels familiar to Obsidian users

## TECHNICAL REQUIREMENTS:
- React 18+ with TypeScript
- D3.js for graph visualization
- Monaco Editor for markdown editing
- React Router for navigation
- CSS Modules for styling
- Integration with existing DataPack architecture

Ready to begin implementation? 🚀
*/

export const INTELWEB_DEVELOPMENT_PLAN = {
  phases: 5,
  estimatedWeeks: 5,
  coreFeatures: [
    'OBSIDIAN_LAYOUT',
    'DATAPACK_INTEGRATION', 
    'GRAPH_VISUALIZATION',
    'MARKDOWN_EDITOR',
    'INTELLIGENCE_METADATA'
  ],
  successCriteria: 'OBSIDIAN_UX_WITH_INTELLIGENCE_FEATURES'
} as const;
