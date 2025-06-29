# Intel Reports 3D - Service Architecture Specification

## 🏗️ Overview

This document defines the service layer architecture for Intel Reports 3D, implementing Phase 2 of the consolidation plan. The service layer provides the core business logic and data management capabilities with full context awareness and HUD integration.

## 🎯 Architecture Principles

### 1. **Context-First Design**
- All services are context-aware from initialization
- HUD state integration is built-in, not added later
- Operation mode switching is seamless and performant

### 2. **Performance-Optimized**
- Viewport-based culling reduces memory usage
- Map-based data structures for O(1) lookups
- Lazy loading and caching strategies
- Debounced updates to prevent UI thrashing

### 3. **Real-Time Capable**
- Subscription-based architecture for live updates
- WebSocket integration ready
- Event-driven state management
- Optimistic updates with rollback capability

### 4. **Modular & Extensible**
- Single responsibility principle
- Clear service boundaries
- Plugin architecture for custom data sources
- Middleware support for cross-cutting concerns

## 🔧 Service Layer Components

### 1. Core Intel Service (`IntelReports3DService`)

**Purpose**: Central data management and querying for Intel Reports 3D

**Key Responsibilities**:
- Maintain the canonical dataset of Intel Reports
- Provide high-performance querying capabilities
- Handle data lifecycle (create, update, delete)
- Manage subscriptions and real-time updates
- Implement viewport-based culling for performance

**API Design**:
```typescript
class IntelReports3DService {
  // Initialization
  constructor(contextState: IntelReport3DContextState, options?: IntelServiceOptions)
  
  // Data Management
  async addReport(report: IntelReport3DData): Promise<void>
  async updateReport(id: string, updates: Partial<IntelReport3DData>): Promise<void>
  async deleteReport(id: string): Promise<void>
  async getReport(id: string): Promise<IntelReport3DData | null>
  
  // Querying
  async queryAll(): Promise<IntelReport3DData[]>
  async queryByViewport(viewport: IntelReport3DViewport): Promise<IntelReport3DData[]>
  async queryByFilters(filters: IntelReportFilters): Promise<IntelReport3DData[]>
  async queryByRelationships(reportId: string): Promise<IntelReport3DData[]>
  
  // Subscriptions
  subscribe(key: string, callback: (reports: IntelReport3DData[]) => void): () => void
  unsubscribe(key: string): void
  
  // Context Management
  updateContext(contextState: IntelReport3DContextState): void
  getContext(): IntelReport3DContextState
  
  // Performance
  getMetrics(): IntelServiceMetrics
  clearCache(): void
  optimize(): void
}
```

**Data Structures**:
```typescript
interface IntelServiceOptions {
  maxCacheSize: number;
  viewportCulling: boolean;
  realTimeUpdates: boolean;
  persistanceEnabled: boolean;
}

interface IntelServiceMetrics {
  totalReports: number;
  visibleReports: number;
  cacheHitRate: number;
  averageQueryTime: number;
  memoryUsage: number;
}
```

### 2. Context Integration Service (`IntelContextService`)

**Purpose**: Manage HUD integration and context-aware behavior

**Key Responsibilities**:
- Synchronize with HUD state changes
- Manage operation mode transitions
- Handle layer activation/deactivation
- Coordinate with other HUD components
- Optimize rendering based on context

**API Design**:
```typescript
class IntelContextService {
  // Initialization
  constructor(initialContext?: IntelReport3DContextState)
  
  // HUD Integration
  syncWithHUD(hudState: HUDState): void
  setOperationMode(mode: OperationMode): Promise<void>
  setCenterMode(mode: CenterMode): Promise<void>
  
  // Layer Management
  activateLayer(layerId: string): Promise<void>
  deactivateLayer(layerId: string): Promise<void>
  getActiveLayers(): string[]
  
  // Context State
  getContext(): IntelReport3DContextState
  updateContext(updates: Partial<IntelReport3DContextState>): void
  
  // Event Handling
  onContextChange(callback: (context: IntelReport3DContextState) => void): () => void
  onOperationModeChange(callback: (mode: OperationMode) => void): () => void
  
  // Optimization
  optimizeForContext(): void
  getContextMetrics(): IntelContextMetrics
}
```

### 3. Globe Integration Service (`IntelGlobeService`)

**Purpose**: Manage 3D Globe integration and interaction handling

**Key Responsibilities**:
- Coordinate with Globe rendering engine
- Handle 3D marker placement and updates
- Manage interaction events (hover, click, selection)
- Optimize rendering for performance
- Handle animation and transitions

**API Design**:
```typescript
class IntelGlobeService {
  // Initialization
  constructor(globeEngine: GlobeEngine, contextService: IntelContextService)
  
  // Marker Management
  addMarker(report: IntelReport3DData): Promise<void>
  updateMarker(reportId: string, updates: Partial<IntelReport3DData>): Promise<void>
  removeMarker(reportId: string): Promise<void>
  
  // Interaction Handling
  onMarkerHover(callback: (report: IntelReport3DData | null) => void): () => void
  onMarkerClick(callback: (report: IntelReport3DData) => void): () => void
  onMarkerSelect(callback: (report: IntelReport3DData) => void): () => void
  
  // Visualization
  updateVisualization(reportId: string, visualization: IntelVisualization): Promise<void>
  animateMarker(reportId: string, animation: IntelAnimationConfig): Promise<void>
  
  // Performance
  setViewport(viewport: IntelReport3DViewport): void
  optimizeRendering(): void
  getGlobeMetrics(): IntelGlobeMetrics
}
```

### 4. Synchronization Service (`IntelSyncService`)

**Purpose**: Handle cross-context synchronization and real-time updates

**Key Responsibilities**:
- Coordinate updates across multiple contexts
- Handle real-time data synchronization
- Manage conflict resolution
- Implement optimistic updates
- Monitor synchronization health

**API Design**:
```typescript
class IntelSyncService {
  // Initialization
  constructor(services: IntelServiceRegistry)
  
  // Synchronization
  syncAcrossContexts(sourceContextId: string, targetContextIds: string[]): Promise<void>
  enableRealTimeSync(enabled: boolean): void
  
  // Conflict Resolution
  resolveConflicts(conflicts: IntelSyncConflict[]): Promise<void>
  setConflictStrategy(strategy: ConflictResolutionStrategy): void
  
  // Update Management
  broadcastUpdate(update: IntelSyncUpdate): Promise<void>
  handleRemoteUpdate(update: IntelSyncUpdate): Promise<void>
  
  // Health Monitoring
  getSyncHealth(): IntelSyncHealth
  onSyncError(callback: (error: IntelSyncError) => void): () => void
}
```

## 🔄 Service Interaction Patterns

### 1. Service Initialization Flow
```typescript
// 1. Initialize context service
const contextService = new IntelContextService(initialContext);

// 2. Initialize core intel service with context
const intelService = new IntelReports3DService(
  contextService.getContext(),
  { maxCacheSize: 10000, viewportCulling: true }
);

// 3. Initialize globe service with dependencies
const globeService = new IntelGlobeService(globeEngine, contextService);

// 4. Initialize sync service with all services
const syncService = new IntelSyncService({
  intel: intelService,
  context: contextService,
  globe: globeService
});

// 5. Wire up cross-service communication
contextService.onContextChange(context => {
  intelService.updateContext(context);
  globeService.updateContext(context);
});

intelService.subscribe('viewport', reports => {
  globeService.updateMarkers(reports);
});
```

### 2. Query and Display Flow
```typescript
// 1. User changes viewport
const viewport = getCurrentViewport();

// 2. Query intel service
const reports = await intelService.queryByViewport(viewport);

// 3. Update globe markers
await globeService.updateMarkers(reports);

// 4. Sync across contexts if needed
if (syncService.isMultiContextActive()) {
  await syncService.syncAcrossContexts('primary', ['secondary']);
}
```

### 3. Real-Time Update Flow
```typescript
// 1. Receive real-time update
const update = await receiveRealTimeUpdate();

// 2. Apply optimistic update
await intelService.applyOptimisticUpdate(update);

// 3. Update visualization immediately
await globeService.updateMarker(update.reportId, update.data);

// 4. Sync across contexts
await syncService.broadcastUpdate(update);

// 5. Handle potential conflicts
const conflicts = await syncService.detectConflicts(update);
if (conflicts.length > 0) {
  await syncService.resolveConflicts(conflicts);
}
```

## 📊 Performance Optimization Strategies

### 1. Viewport Culling
```typescript
// Only process reports within visible bounds
const visibleReports = allReports.filter(report => {
  const { lat, lng } = report.location;
  return lat >= viewport.bounds.south && lat <= viewport.bounds.north &&
         lng >= viewport.bounds.west && lng <= viewport.bounds.east;
});
```

### 2. LOD (Level of Detail) Management
```typescript
// Adjust detail level based on zoom
const getLODLevel = (zoom: number): LODLevel => {
  if (zoom > 10) return 'high';
  if (zoom > 5) return 'medium';
  return 'low';
};

// Apply LOD to visualization
const optimizedVisualization = {
  ...baseVisualization,
  size: lodLevel === 'low' ? 0.5 : baseVisualization.size,
  detail: lodLevel === 'high' ? 'full' : 'simplified'
};
```

### 3. Caching Strategy
```typescript
// Multi-level caching
interface IntelCacheStrategy {
  // L1: In-memory Map for frequently accessed reports
  l1Cache: Map<string, IntelReport3DData>;
  
  // L2: Viewport-based cache for visible reports
  l2Cache: Map<string, IntelReport3DData[]>;
  
  // L3: Query result cache
  l3Cache: Map<string, IntelReport3DData[]>;
}
```

### 4. Batch Processing
```typescript
// Batch updates for performance
const batchProcessor = new IntelBatchProcessor({
  batchSize: 100,
  flushInterval: 100, // ms
  maxBatchAge: 1000 // ms
});

// Add to batch instead of immediate processing
batchProcessor.addUpdate(update);
```

## 🔒 Error Handling & Resilience

### 1. Service-Level Error Handling
```typescript
// Graceful degradation
try {
  const reports = await intelService.queryByViewport(viewport);
  return reports;
} catch (error) {
  console.error('Failed to query reports:', error);
  
  // Fallback to cached data
  const cachedReports = intelService.getCachedReports(viewport);
  if (cachedReports.length > 0) {
    return cachedReports;
  }
  
  // Ultimate fallback
  return [];
}
```

### 2. Retry Logic with Exponential Backoff
```typescript
class IntelRetryStrategy {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
}
```

### 3. Circuit Breaker Pattern
```typescript
class IntelCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 60000) { // 1 minute
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= 5) {
      this.state = 'open';
    }
  }
}
```

## 🧪 Testing Strategy

### 1. Unit Tests
```typescript
describe('IntelReports3DService', () => {
  let service: IntelReports3DService;
  let mockContext: IntelReport3DContextState;
  
  beforeEach(() => {
    mockContext = createMockContext();
    service = new IntelReports3DService(mockContext);
  });
  
  it('should add report successfully', async () => {
    const report = createMockReport();
    await service.addReport(report);
    
    const retrieved = await service.getReport(report.id);
    expect(retrieved).toEqual(report);
  });
  
  it('should handle viewport queries', async () => {
    const viewport = createMockViewport();
    const reports = await service.queryByViewport(viewport);
    
    expect(reports).toBeInstanceOf(Array);
    expect(reports.length).toBeLessThanOrEqual(viewport.maxItems);
  });
});
```

### 2. Integration Tests
```typescript
describe('Service Integration', () => {
  let intelService: IntelReports3DService;
  let globeService: IntelGlobeService;
  let contextService: IntelContextService;
  
  beforeEach(() => {
    // Setup integrated services
    contextService = new IntelContextService();
    intelService = new IntelReports3DService(contextService.getContext());
    globeService = new IntelGlobeService(mockGlobeEngine, contextService);
  });
  
  it('should sync data across services', async () => {
    const report = createMockReport();
    
    // Add to intel service
    await intelService.addReport(report);
    
    // Verify globe service receives update
    const globeReports = await globeService.getVisibleReports();
    expect(globeReports).toContainEqual(report);
  });
});
```

### 3. Performance Tests
```typescript
describe('Performance', () => {
  it('should handle large datasets efficiently', async () => {
    const service = new IntelReports3DService(mockContext);
    const reports = createMockReports(10000);
    
    const startTime = performance.now();
    
    // Add all reports
    await Promise.all(reports.map(report => service.addReport(report)));
    
    // Query viewport
    const viewport = createLargeViewport();
    const results = await service.queryByViewport(viewport);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // Less than 1 second
    expect(results.length).toBeGreaterThan(0);
  });
});
```

## 📋 Implementation Checklist

### Phase 2.1: Core Intel Service (Day 1)
- [ ] Create `IntelReports3DService` class
- [ ] Implement Map-based data storage
- [ ] Add viewport-based querying
- [ ] Implement subscription system
- [ ] Add context state management
- [ ] Create performance metrics
- [ ] Write unit tests

### Phase 2.2: Context Integration Service (Day 1)
- [ ] Create `IntelContextService` class
- [ ] Implement HUD state synchronization
- [ ] Add operation mode management
- [ ] Create layer activation system
- [ ] Add context change events
- [ ] Write integration tests

### Phase 2.3: Globe Integration Service (Day 2)
- [ ] Create `IntelGlobeService` class
- [ ] Implement marker management
- [ ] Add interaction handling
- [ ] Create animation system
- [ ] Add performance optimization
- [ ] Write globe integration tests

### Phase 2.4: Synchronization Service (Day 2)
- [ ] Create `IntelSyncService` class
- [ ] Implement cross-context sync
- [ ] Add conflict resolution
- [ ] Create real-time update handling
- [ ] Add health monitoring
- [ ] Write sync tests

### Phase 2.5: Integration & Testing (Day 2)
- [ ] Wire up service communication
- [ ] Implement error handling
- [ ] Add retry and circuit breaker logic
- [ ] Create performance benchmarks
- [ ] Write comprehensive integration tests
- [ ] Document API and usage patterns

---

## 🚀 Next Steps

After Phase 2 completion:
1. **Phase 3**: Hook layer to provide React integration
2. **Phase 4**: Component layer for UI rendering
3. **Phase 5**: HUD integration and layout management
4. **Phase 6**: Testing and performance optimization

---

*This specification will be updated as implementation progresses.*  
*Last Updated: June 28, 2025 - Ready for Phase 2 Implementation*
