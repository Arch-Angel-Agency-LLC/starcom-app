# OSINT Technical Reference Guide

**Project**: Starcom dApp - Earth Alliance OSINT Cyber Investigation Suite  
**Created**: July 4, 2025  
**Status**: Technical Reference  
**Last Updated**: July 4, 2025

## 1. Technical Architecture

### 1.1 Component Structure

The OSINT module follows a hierarchical component structure:

```
src/pages/OSINT/
├── OSINTDashboard.tsx                # Main container component
├── OSINTDashboard.module.css         # Main styles
├── README.md                         # Quick reference guide
├── components/                       # Shared OSINT components
│   ├── OSINTSearchBar.tsx            # Universal search
│   ├── OSINTToolbar.tsx              # Dashboard toolbar
│   ├── OSINTPanelLayout.tsx          # Panel layout system
│   ├── CommandPalette.tsx            # Keyboard command interface
│   ├── ThreatIndicators.tsx          # Security status display
│   ├── InvestigationSelector.tsx     # Investigation management
│   └── panels/                       # Panel components
│       ├── SearchPanel.tsx           # Search configuration
│       ├── ResultsPanel.tsx          # Search results
│       ├── GraphPanel.tsx            # Entity graph
│       ├── TimelinePanel.tsx         # Chronological timeline
│       ├── MapPanel.tsx              # Geospatial visualization
│       ├── BlockchainPanel.tsx       # Blockchain analysis
│       ├── DarkWebPanel.tsx          # Dark web monitor
│       └── OPSECPanel.tsx            # Security tools
├── hooks/                            # OSINT-specific hooks
│   ├── useOSINTSearch.ts             # Search functionality
│   ├── useInvestigation.ts           # Investigation management
│   └── useEntityGraph.ts             # Graph data processing
├── providers/                        # Context providers
│   ├── OSINTProvider.tsx             # Main OSINT context
│   └── InvestigationProvider.tsx     # Investigation state
├── utils/                            # Utility functions
│   ├── searchUtils.ts                # Search helpers
│   ├── graphUtils.ts                 # Graph processing
│   └── timelineUtils.ts              # Timeline helpers
└── types/                            # TypeScript definitions
    └── osint.ts                      # OSINT type definitions
```

### 1.2 Data Flow Architecture

The OSINT module uses a unidirectional data flow:

1. **User Input**: Via search bar, command palette, or direct panel interaction
2. **State Management**: Handled by React hooks and context providers
3. **Data Processing**: Performed by utility functions and custom hooks
4. **UI Rendering**: Components render based on processed data
5. **Persistence**: State saved to localStorage or secure storage when appropriate

### 1.3 Integration Points

The OSINT module integrates with the main application through:

- `ViewContext`: For navigation and view management
- `HUDLayout`: For overall UI structure
- `CenterViewManager`: For view rendering
- `BottomBar`: For navigation access
- `AuthContext`: For authentication-gated features
- `PopupManager`: For modal dialogs and alerts
- `FloatingPanelManager`: For panel management

## 2. Component API Reference

### 2.1 OSINTDashboard

Main container for the OSINT functionality.

```typescript
// OSINTDashboard.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const OSINTDashboard: React.FC = () => {
  // Implementation details
};

export default OSINTDashboard;
```

**State Management**:
- `searchQuery`: Current search string
- `activeMode`: Current OSINT operation mode
- `activeInvestigation`: Currently selected investigation
- `panels`: Array of panel configurations
- `isCommandPaletteOpen`: Command palette visibility

**Key Functions**:
- `handleSearch`: Process search queries
- `handleAddPanel`: Add new panel to layout
- `handleLayoutChange`: Update panel positions
- `handleCommandExecution`: Process command palette actions
- `handleCreateInvestigation`: Create new investigation

### 2.2 OSINTPanelLayout

Manages the multi-panel workspace layout.

```typescript
// OSINTPanelLayout.tsx
import React from 'react';
import { Panel } from '../types/osint';

interface OSINTPanelLayoutProps {
  panels: Panel[];
  onLayoutChange?: (panels: Panel[]) => void;
  className?: string;
}

const OSINTPanelLayout: React.FC<OSINTPanelLayoutProps> = ({ 
  panels, 
  onLayoutChange,
  className 
}) => {
  // Implementation details
};

export { OSINTPanelLayout };
```

**Key Properties**:
- `panels`: Array of panel configurations
- `onLayoutChange`: Callback for layout updates
- `className`: Optional CSS class

**Panel Operations**:
- Drag to move panels
- Resize panel dimensions
- Lock panel positions
- Maximize/minimize panels
- Close panels

### 2.3 Panel Components

All panel components follow a consistent interface:

```typescript
// Generic Panel Interface
interface PanelProps {
  data: Record<string, unknown>;
  panelId: string;
  onClose?: () => void;
  onMaximize?: () => void;
  className?: string;
}
```

**Common Panel Structure**:
- Header with title and controls
- Content area specific to panel type
- Optional toolbar for panel-specific actions
- Status footer with relevant metrics

### 2.4 CommandPalette

Keyboard-driven command interface for OSINT operations.

```typescript
// CommandPalette.tsx
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: string, args?: unknown) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onExecuteCommand 
}) => {
  // Implementation details
};
```

**Keyboard Shortcuts**:
- `Cmd/Ctrl + K`: Open command palette
- `↑/↓`: Navigate commands
- `Enter`: Execute selected command
- `Esc`: Close palette

**Command Categories**:
- Search operations
- Panel management
- Investigation actions
- Tools and utilities

## 3. Type Definitions

### 3.1 Core Types

```typescript
// src/pages/OSINT/types/osint.ts

// OSINT Operation Modes
export type OSINTMode = 'search' | 'investigate' | 'monitor' | 'darkweb';

// Panel Types
export type PanelType = 
  | 'search'      // Search configuration
  | 'results'     // Search results
  | 'graph'       // Entity relationship graph
  | 'timeline'    // Chronological timeline
  | 'map'         // Geospatial visualization
  | 'blockchain'  // Blockchain analysis
  | 'darkweb'     // Dark web monitoring
  | 'opsec'       // Operational security
  | 'console'     // Command console
  | 'notes';      // Investigation notes

// Panel Position & Size
export interface PanelPosition {
  x: number;      // Grid column position
  y: number;      // Grid row position
  w: number;      // Width in grid columns
  h: number;      // Height in grid rows
}

// Panel Definition
export interface Panel {
  id: string;               // Unique identifier
  type: PanelType;          // Panel type
  position: PanelPosition;  // Layout position and size
  data: Record<string, unknown>; // Panel-specific data
  locked: boolean;          // Whether panel can be moved/resized
}

// Investigation Status
export type InvestigationStatus = 'active' | 'archived' | 'pending';

// Investigation Definition
export interface Investigation {
  id: string;
  name: string;
  description: string;
  created: Date;
  modified: Date;
  tags: string[];
  shared: string[];
  status: InvestigationStatus;
  panels?: Panel[];
}
```

### 3.2 Entity Types

```typescript
// Entity Types
export type EntityType = 
  | 'person'      // Individual
  | 'organization' // Group, company, agency
  | 'wallet'      // Cryptocurrency wallet
  | 'address'     // Physical or virtual location
  | 'domain'      // Web domain
  | 'file'        // Document, image, etc.
  | 'event'       // Incident or happening
  | 'device'      // Hardware device
  | 'account';    // Online account

// Entity Definition
export interface Entity {
  id: string;                  // Unique identifier
  type: EntityType;            // Entity type
  name: string;                // Display name
  identifiers: string[];       // Unique identifiers (emails, addresses, etc.)
  properties: Record<string, unknown>; // Entity properties
  confidence: number;          // Confidence score (0-1)
  source: string[];            // Data sources
  lastUpdated: string;         // ISO date string
}

// Relationship Types
export type RelationshipType =
  | 'owner'       // Ownership
  | 'member'      // Membership
  | 'associate'   // Association
  | 'transaction' // Financial transaction
  | 'communication' // Communication
  | 'family'      // Family relation
  | 'location'    // Location association
  | 'employment'  // Employment
  | 'custom';     // Custom relationship

// Relationship Definition
export interface Relationship {
  id: string;                  // Unique identifier
  type: RelationshipType;      // Relationship type
  source: string;              // Source entity ID
  target: string;              // Target entity ID
  directed: boolean;           // Whether relationship is directed
  properties: Record<string, unknown>; // Relationship properties
  confidence: number;          // Confidence score (0-1)
  timespan?: {                 // Optional timespan
    start?: string;            // ISO date string
    end?: string;              // ISO date string
  };
}
```

## 4. Data Service Integration

### 4.1 Search Service

The search functionality should connect to multiple data sources:

```typescript
// Sample search service hook
export function useOSINTSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string, filters: SearchFilters) => {
    setLoading(true);
    try {
      // Implementation: Connect to actual data sources
      const results = await searchSources(query, filters);
      setResults(results);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
```

### 4.2 Investigation Management

Investigations should be stored securely and support collaborative work:

```typescript
// Sample investigation hook
export function useInvestigation() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeInvestigation, setActiveInvestigation] = useState<Investigation | null>(null);
  
  // Load investigations from storage or API
  useEffect(() => {
    // Implementation: Load from secure storage or API
  }, []);

  // Create new investigation
  const createInvestigation = useCallback((data: Partial<Investigation>) => {
    // Implementation: Create investigation
  }, []);

  // Update investigation
  const updateInvestigation = useCallback((id: string, data: Partial<Investigation>) => {
    // Implementation: Update investigation
  }, []);

  // Delete investigation
  const deleteInvestigation = useCallback((id: string) => {
    // Implementation: Delete investigation
  }, []);

  return {
    investigations,
    activeInvestigation,
    setActiveInvestigation,
    createInvestigation,
    updateInvestigation,
    deleteInvestigation
  };
}
```

## 5. Authentication & Security

### 5.1 Authentication Integration

OSINT features use progressive enhancement based on authentication status:

```typescript
// Authentication integration example
function OSINTFeature() {
  const { isAuthenticated, authLevel } = useAuth();
  
  // Basic features for all users
  let features = <BasicFeatures />;
  
  // Enhanced features for authenticated users
  if (isAuthenticated) {
    features = <EnhancedFeatures />;
  }
  
  // Premium features for users with sufficient auth level
  if (isAuthenticated && authLevel >= 2) {
    features = <PremiumFeatures />;
  }
  
  return features;
}
```

### 5.2 Secure Data Handling

Sensitive data should be handled securely:

- Use client-side encryption for sensitive investigations
- Anonymous routing for external queries when possible
- Clear indication of security status to users
- Secure storage with proper encryption
- Sanitize all user inputs

## 6. Performance Considerations

### 6.1 Large Dataset Handling

For large datasets, implement:

- Virtualized lists for search results and entity lists
- Pagination for API results
- Progressive loading for graphs and timelines
- Web Workers for heavy processing operations
- Efficient caching strategies

### 6.2 Rendering Optimization

Optimize component rendering:

- Use React.memo for pure components
- Implement useMemo for expensive calculations
- Use proper key props for lists
- Avoid unnecessary re-renders
- Implement proper loading states

## 7. Testing Guidance

### 7.1 Component Testing

Test components with:

```javascript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchPanel } from '../components/panels/SearchPanel';

describe('SearchPanel', () => {
  it('renders search input', () => {
    render(<SearchPanel data={{}} panelId="test" />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('calls onSearch when form is submitted', () => {
    const onSearch = jest.fn();
    render(<SearchPanel data={{ onSearch }} panelId="test" />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSearch).toHaveBeenCalledWith('test query');
  });
});
```

### 7.2 Integration Testing

Test panel interactions and data flow:

```javascript
// Example integration test
import { render, screen, fireEvent } from '@testing-library/react';
import { OSINTDashboard } from '../OSINTDashboard';

describe('OSINTDashboard Integration', () => {
  it('adds new panel when add panel button is clicked', () => {
    render(<OSINTDashboard />);
    const addButton = screen.getByText('Add Panel');
    fireEvent.click(addButton);
    expect(screen.getAllByTestId('osint-panel')).toHaveLength(5); // Initial 4 + new one
  });

  it('performs search and updates results panel', async () => {
    render(<OSINTDashboard />);
    const searchInput = screen.getByPlaceholderText('Search OSINT...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    // Wait for results to appear
    const results = await screen.findByTestId('results-panel-content');
    expect(results).toHaveTextContent('test query');
  });
});
```

## 8. Implementation Guides

### 8.1 Adding a New Panel Type

To add a new panel type:

1. Add the panel type to `PanelType` in `types/osint.ts`
2. Create panel component in `components/panels/`
3. Add panel title to `panelTitles` map in `OSINTPanelLayout.tsx`
4. Add panel component to `panelComponents` map in `OSINTPanelLayout.tsx`
5. Add panel-specific styles
6. Add button/command to create the new panel type

### 8.2 Adding New Command Palette Commands

To add new commands:

1. Add command to appropriate category in `commands` array in `CommandPalette.tsx`
2. Implement handler in `handleCommandExecution` in `OSINTDashboard.tsx`
3. Add any necessary UI components or functionality
4. Update command help documentation

### 8.3 Implementing Authentication Gating

To gate features behind authentication:

1. Use `useAuth()` hook to get authentication status
2. Show auth prompt for unauthenticated users
3. Implement progressive enhancement based on auth level
4. Ensure proper error handling for auth failures
5. Provide clear feedback about auth requirements

## 9. Troubleshooting

### 9.1 Common Issues

- **TypeScript Errors**: Ensure proper typing for all props and state
- **Panel Layout Issues**: Check grid positioning and z-index handling
- **Command Palette Not Opening**: Verify keyboard event listeners
- **Investigation Loading Errors**: Check storage format and parsing
- **Performance Problems**: Look for unnecessary re-renders or heavy operations

### 9.2 Debugging Tips

- Use React DevTools to inspect component hierarchy and props
- Enable React Strict Mode to catch potential issues
- Use performance profiling to identify bottlenecks
- Add comprehensive logging for complex operations
- Test in multiple browsers to ensure compatibility

---

## Appendix: Earth Alliance OSINT Command References

### A. Common OSINT Command Patterns

| Command Pattern | Example | Purpose |
|-----------------|---------|---------|
| `search:<type> <query>` | `search:person John Smith` | Typed search |
| `entity:<id>` | `entity:e12345` | Jump to entity |
| `add:<panel-type>` | `add:graph` | Add panel |
| `filter:<field>:<value>` | `filter:type:wallet` | Apply filter |
| `view:<mode>` | `view:darkweb` | Change view mode |
| `save:<item-type>` | `save:investigation` | Save item |
| `export:<format>` | `export:pdf` | Export data |

### B. Earth Alliance OSINT Security Protocols

| Protocol | Description | Implementation |
|----------|-------------|----------------|
| EA-OPSEC-1 | Secure routing protocol | VPN/Tor integration |
| EA-OPSEC-2 | Query anonymization | Request proxying |
| EA-OPSEC-3 | Secure storage | Client-side encryption |
| EA-OPSEC-4 | Authentication protocol | Wallet-based auth |
| EA-OPSEC-5 | Evidence preservation | IPFS with signatures |
