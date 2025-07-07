# IntelDataCore Implementation

This directory contains the implementation of the IntelDataCore system, a unified intelligence data management solution for the STARCOM platform.

## Structure

- **types/**: Core data models and type definitions
- **store/**: Data storage and query implementation
- **adapters/**: Module-specific adapters for different STARCOM components
- **hooks/**: React hooks for easy integration with UI components
- **utils/**: Utility functions, including sample data generation

## Getting Started

### Installation

First, install the required dependencies:

```bash
cd src/core/intel
npm install
```

### Basic Usage

```typescript
// Import the core functionality
import { 
  initializeIntelDataCore, 
  intelDataStore,
  NodeEntity,
  EdgeRelationship
} from 'src/core/intel';

// Initialize the core (loads sample data for now)
await initializeIntelDataCore();

// Create a new node
const newNode = await intelDataStore.createEntity<NodeEntity>({
  type: 'node',
  nodeType: 'PERSON',
  title: 'John Doe',
  description: 'Intelligence target',
  classification: 'UNCLASSIFIED',
  source: 'Manual Entry',
  verified: true,
  confidence: 80,
  createdBy: 'user123',
  properties: {
    firstName: 'John',
    lastName: 'Doe',
    age: 35
  }
});

// Query nodes with filters
const results = await intelDataStore.queryEntities<NodeEntity>({
  types: ['node'],
  tags: ['high-value'],
  confidence: {
    min: 70
  }
});

// Subscribe to data events
const subscriptionId = intelDataStore.subscribe(['entity.node'], (event) => {
  console.log('Node entity event:', event);
});
```

### React Integration

```typescript
// In a React component
import { useNodeWebData } from 'src/core/intel';

const MyNetworkComponent = () => {
  const {
    graph,
    stats,
    loading,
    error,
    applyFilters
  } = useNodeWebData();
  
  // Use the graph data in your component
  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Nodes: {stats.totalNodes}</p>
          <p>Edges: {stats.totalEdges}</p>
          {/* Render your network visualization */}
        </div>
      )}
    </div>
  );
};
```

## Node Web Visualization

The Node Web module is already integrated with IntelDataCore. To use it:

```typescript
import { NodeWebDashboard } from 'src/pages/NodeWeb/components/NodeWebDashboard';

// Then in your component:
<NodeWebDashboard />
```

## Adding New Module Adapters

To integrate a new module with IntelDataCore, create a new adapter:

1. Create a new file in `adapters/` (e.g., `timelineAdapter.ts`)
2. Implement the adapter class with appropriate transformation methods
3. Create a React hook in `hooks/` for easy React integration
4. Export the adapter and hook from `index.ts`

See `nodeWebAdapter.ts` and `useNodeWebData.ts` for examples.

## Documentation

For more detailed documentation, refer to the docs directory:

- [Architecture Overview](/docs/intel-data-core/ARCHITECTURE-OVERVIEW.md)
- [Data Models](/docs/intel-data-core/DATA-MODELS.md)
- [Storage System](/docs/intel-data-core/STORAGE-SYSTEM.md)
- [Integration Guide](/docs/intel-data-core/INTEGRATION-GUIDE.md)
- [Implementation Progress](/docs/intel-data-core/IMPLEMENTATION-PROGRESS.md)
