# Intel Reports 3D: Development Implementation Guide

## 🛠️ Phase 1: Context-Aware Type Unification

### **Objective**
Create unified Intel types with full HUD context awareness while maintaining backward compatibility.

### **Implementation Tasks**

#### **Task 1.1: Core Type Definitions**
**File**: `src/types/intelligence/IntelReportTypes.ts`
**Duration**: 1 day

```typescript
// Core Intel Report data structures
export interface IntelReport3DData {
  id: string;
  title: string;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  source: string;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    altitude?: number;
  };
  content: {
    summary: string;
    details: string;
    attachments?: IntelAttachment[];
  };
  visualization: {
    markerType: 'standard' | 'priority' | 'alert' | 'classified';
    color: string;
    size: number;
    opacity: number;
  };
  metadata: {
    tags: string[];
    confidence: number;
    reliability: number;
    freshness: number;
  };
}

// 3D rendering and interaction
export interface IntelReport3DRenderData {
  id: string;
  position: [number, number, number];
  renderProps: {
    visible: boolean;
    scale: number;
    rotation: [number, number, number];
    animation?: IntelAnimationConfig;
  };
  interactionState: {
    hovered: boolean;
    selected: boolean;
    focused: boolean;
  };
}

// Performance optimization
export interface IntelReport3DViewport {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom: number;
  maxItems: number;
  lodLevel: 'high' | 'medium' | 'low';
}
```

#### **Task 1.2: Context-Aware Types**
**File**: `src/types/intelligence/IntelContextTypes.ts`
**Duration**: 1 day

```typescript
// HUD context integration
export interface IntelReport3DContextState {
  // Current HUD state
  hudContext: {
    operationMode: 'PLANETARY' | 'SPACE' | 'CYBER' | 'STELLAR';
    centerMode: '3D_GLOBE' | 'TIMELINE' | 'NODE_GRAPH';
    activeLayers: string[];
    selectedObject: string | null;
  };
  
  // Context-sensitive display
  displayContext: {
    priority: 'primary' | 'secondary' | 'tertiary';
    visibility: 'full' | 'minimal' | 'hidden';
    adaptiveRendering: boolean;
  };
  
  // Integration state
  integrationState: {
    leftSideControls: boolean;
    rightSideTools: boolean;
    bottomBarDetails: boolean;
    topBarStatus: boolean;
  };
}

// Multi-context support
export interface IntelReport3DMultiContext {
  contexts: IntelReport3DContextState[];
  syncState: {
    temporalSync: boolean;
    geospatialSync: boolean;
    entitySync: boolean;
    threatSync: boolean;
  };
  splitScreenConfig?: {
    layout: 'horizontal' | 'vertical' | 'quad';
    primaryContext: number;
    contextMapping: Record<number, IntelReport3DContextState>;
  };
}

// Context adaptation callbacks
export interface IntelReport3DContextCallbacks {
  onOperationModeChange: (mode: string) => void;
  onCenterModeChange: (mode: string) => void;
  onSelectionChange: (selection: string | null) => void;
  onLayerChange: (layers: string[]) => void;
  onMultiContextChange: (contexts: IntelReport3DMultiContext) => void;
}
```

#### **Task 1.3: Multi-Context Types**
**File**: `src/types/intelligence/IntelMultiContextTypes.ts`
**Duration**: 0.5 days

```typescript
// Cross-layer synchronization
export interface IntelReport3DCyberSync {
  securityLayers: string[];
  networkLayers: string[];
  financialLayers: string[];
  threatIntelLayers: string[];
  
  syncRules: {
    entityMatching: boolean;
    geospatialCorrelation: boolean;
    temporalAlignment: boolean;
    threatPropagation: boolean;
  };
}

// Floating panel integration
export interface IntelReport3DFloatingPanel {
  panelId: string;
  triggerType: 'geographic' | 'selection' | 'context' | 'alert';
  position: {
    anchor: 'globe' | 'screen' | 'relative';
    coordinates: [number, number];
  };
  content: {
    type: 'detail' | 'analysis' | 'collaboration' | 'timeline';
    data: any;
  };
  priority: 'primary' | 'secondary' | 'tertiary';
}
```

#### **Task 1.4: Backward Compatibility Layer**
**File**: `src/types/intelligence/IntelCompatibilityTypes.ts`
**Duration**: 0.5 days

```typescript
// Legacy interface compatibility
export interface LegacyIntelReportOverlay {
  // Map to new IntelReport3DData structure
}

export interface LegacyIntelReportData {
  // Map to new IntelReport3DData structure
}

// Migration utilities
export const migrateToNewIntelTypes = {
  fromLegacyOverlay: (legacy: LegacyIntelReportOverlay): IntelReport3DData => {
    // Migration logic
  },
  fromLegacyData: (legacy: LegacyIntelReportData): IntelReport3DData => {
    // Migration logic
  }
};
```

### **Validation Criteria**

1. **Type Safety**: All Intel components compile without type errors
2. **Backward Compatibility**: Existing components continue to function
3. **Context Awareness**: Types include all necessary HUD context information
4. **Multi-Context Support**: Types support split-screen and cross-layer scenarios
5. **Performance**: No performance regression in type checking

---

## 🔧 Phase 2: Context-Aware Service Consolidation

### **Objective**
Consolidate Intel services with full HUD integration and multi-context support.

### **Implementation Tasks**

#### **Task 2.1: Core Intel Service**
**File**: `src/services/intelligence/IntelReports3DService.ts`
**Duration**: 2 days

```typescript
export class IntelReports3DService {
  private intelData: Map<string, IntelReport3DData> = new Map();
  private contextState: IntelReport3DContextState;
  private subscriptions: Set<(data: IntelReport3DData[]) => void> = new Set();
  
  constructor(private globeService: GlobeService) {
    this.initializeService();
  }
  
  // Context-aware data retrieval
  public getIntelForContext(context: IntelReport3DContextState): IntelReport3DData[] {
    return Array.from(this.intelData.values())
      .filter(intel => this.shouldDisplayInContext(intel, context))
      .sort((a, b) => this.prioritizeForContext(a, b, context));
  }
  
  // Performance-optimized viewport querying
  public getIntelForViewport(viewport: IntelReport3DViewport): IntelReport3DData[] {
    return Array.from(this.intelData.values())
      .filter(intel => this.isInViewport(intel, viewport))
      .slice(0, viewport.maxItems);
  }
  
  // Multi-context support
  public getIntelForMultiContext(multiContext: IntelReport3DMultiContext): Record<number, IntelReport3DData[]> {
    const result: Record<number, IntelReport3DData[]> = {};
    
    multiContext.contexts.forEach((context, index) => {
      result[index] = this.getIntelForContext(context);
    });
    
    return result;
  }
  
  // Context change handlers
  public onOperationModeChange(mode: string): void {
    this.contextState.hudContext.operationMode = mode as any;
    this.notifySubscribers();
  }
  
  public onCenterModeChange(mode: string): void {
    this.contextState.hudContext.centerMode = mode as any;
    this.adaptToDisplayMode(mode);
    this.notifySubscribers();
  }
  
  // Subscription management
  public subscribe(callback: (data: IntelReport3DData[]) => void): () => void {
    this.subscriptions.add(callback);
    return () => this.subscriptions.delete(callback);
  }
  
  private shouldDisplayInContext(intel: IntelReport3DData, context: IntelReport3DContextState): boolean {
    // Context-aware filtering logic
    if (context.hudContext.operationMode !== 'CYBER') return false;
    if (!context.integrationState.leftSideControls) return false;
    
    return true;
  }
  
  private prioritizeForContext(a: IntelReport3DData, b: IntelReport3DData, context: IntelReport3DContextState): number {
    // Context-aware prioritization
    const aPriority = this.calculateContextPriority(a, context);
    const bPriority = this.calculateContextPriority(b, context);
    return bPriority - aPriority;
  }
}
```

#### **Task 2.2: Context Management Service**
**File**: `src/services/intelligence/IntelContextService.ts`
**Duration**: 1 day

```typescript
export class IntelContextService {
  private currentContext: IntelReport3DContextState;
  private contextHistory: IntelReport3DContextState[] = [];
  private contextCallbacks: IntelReport3DContextCallbacks[] = [];
  
  constructor(private hudService: HUDService) {
    this.initializeContextTracking();
  }
  
  // Context state management
  public getCurrentContext(): IntelReport3DContextState {
    return { ...this.currentContext };
  }
  
  public updateContext(updates: Partial<IntelReport3DContextState>): void {
    const previousContext = { ...this.currentContext };
    this.currentContext = { ...this.currentContext, ...updates };
    
    this.contextHistory.push(previousContext);
    this.notifyContextChange();
  }
  
  // HUD integration
  public onHUDStateChange(hudState: any): void {
    this.updateContext({
      hudContext: {
        operationMode: hudState.operationMode,
        centerMode: hudState.centerMode,
        activeLayers: hudState.activeLayers,
        selectedObject: hudState.selectedObject
      }
    });
  }
  
  // Context adaptation logic
  public adaptDisplayForContext(context: IntelReport3DContextState): IntelDisplayConfig {
    switch (context.hudContext.centerMode) {
      case '3D_GLOBE':
        return this.getGlobeDisplayConfig(context);
      case 'TIMELINE':
        return this.getTimelineDisplayConfig(context);
      case 'NODE_GRAPH':
        return this.getNodeGraphDisplayConfig(context);
      default:
        return this.getDefaultDisplayConfig(context);
    }
  }
}
```

#### **Task 2.3: Globe Integration Service**
**File**: `src/services/intelligence/IntelGlobeService.ts`
**Duration**: 1 day

```typescript
export class IntelGlobeService {
  private globeInstance: any;
  private intelLayers: Map<string, any> = new Map();
  
  constructor(
    private intelService: IntelReports3DService,
    private contextService: IntelContextService
  ) {
    this.initializeGlobeIntegration();
  }
  
  // Globe layer management
  public addIntelLayer(layerId: string, intelData: IntelReport3DData[]): void {
    const layer = this.createIntelLayer(layerId, intelData);
    this.intelLayers.set(layerId, layer);
    this.globeInstance.addLayer(layer);
  }
  
  public updateIntelLayer(layerId: string, intelData: IntelReport3DData[]): void {
    const layer = this.intelLayers.get(layerId);
    if (layer) {
      this.updateLayerData(layer, intelData);
    }
  }
  
  // Context-aware rendering
  public renderForContext(context: IntelReport3DContextState): void {
    const displayConfig = this.contextService.adaptDisplayForContext(context);
    this.applyDisplayConfig(displayConfig);
  }
  
  // Performance optimization
  public optimizeForViewport(viewport: IntelReport3DViewport): void {
    const visibleIntel = this.intelService.getIntelForViewport(viewport);
    this.updateVisibleIntel(visibleIntel);
  }
  
  private createIntelLayer(layerId: string, intelData: IntelReport3DData[]): any {
    // Create Globe.gl layer for Intel Reports
    return {
      id: layerId,
      type: 'intel-3d-markers',
      data: intelData,
      getPosition: (d: IntelReport3DData) => [d.location.lng, d.location.lat, d.location.altitude || 0],
      getColor: (d: IntelReport3DData) => this.getIntelColor(d),
      getSize: (d: IntelReport3DData) => d.visualization.size,
      onClick: (d: IntelReport3DData) => this.handleIntelClick(d),
      onHover: (d: IntelReport3DData) => this.handleIntelHover(d)
    };
  }
}
```

### **Validation Criteria**

1. **Service Integration**: Services integrate cleanly with existing Globe and HUD systems
2. **Context Responsiveness**: Services respond appropriately to context changes
3. **Performance**: No regression in data retrieval or rendering performance
4. **Multi-Context Support**: Services handle split-screen scenarios correctly
5. **Subscription Management**: Clean subscription/unsubscription without memory leaks

---

## 🎣 Phase 3: Context-Aware Hook Consolidation

### **Objective**
Unify Intel hooks with HUD context integration and performance optimization.

### **Implementation Tasks**

#### **Task 3.1: Main Intel Hook**
**File**: `src/hooks/intelligence/useIntelReports3D.ts`
**Duration**: 1.5 days

```typescript
export const useIntelReports3D = (options?: IntelReports3DOptions) => {
  const contextService = useContext(IntelContextServiceContext);
  const intelService = useContext(IntelReports3DServiceContext);
  
  // Context state
  const [context, setContext] = useState<IntelReport3DContextState>();
  const [intelData, setIntelData] = useState<IntelReport3DData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // HUD context integration
  const hudContext = useHUDContext();
  
  // Context adaptation
  useEffect(() => {
    if (hudContext) {
      const adaptedContext = contextService.adaptToHUDContext(hudContext);
      setContext(adaptedContext);
    }
  }, [hudContext, contextService]);
  
  // Data subscription
  useEffect(() => {
    if (!context) return;
    
    setLoading(true);
    const unsubscribe = intelService.subscribe((data) => {
      const contextualData = intelService.getIntelForContext(context);
      setIntelData(contextualData);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [context, intelService]);
  
  // Actions
  const actions = useMemo(() => ({
    selectIntel: (intelId: string) => {
      contextService.updateContext({
        hudContext: {
          ...context?.hudContext,
          selectedObject: intelId
        }
      });
    },
    
    updateDisplayPriority: (priority: 'primary' | 'secondary' | 'tertiary') => {
      contextService.updateContext({
        displayContext: {
          ...context?.displayContext,
          priority
        }
      });
    },
    
    refreshIntel: () => {
      intelService.refreshData();
    }
  }), [context, contextService, intelService]);
  
  return {
    // Data
    intelReports: intelData,
    context,
    loading,
    error,
    
    // Actions
    ...actions,
    
    // Utilities
    getIntelById: (id: string) => intelData.find(intel => intel.id === id),
    getIntelByLocation: (lat: number, lng: number, radius: number) => 
      intelData.filter(intel => calculateDistance(intel.location, { lat, lng }) <= radius)
  };
};
```

#### **Task 3.2: Context Adapter Hook**
**File**: `src/hooks/intelligence/useIntelContextAdapter.ts`
**Duration**: 1 day

```typescript
export const useIntelContextAdapter = (contextOptions?: IntelContextOptions) => {
  const hudContext = useHUDContext();
  const [adaptedContext, setAdaptedContext] = useState<IntelReport3DContextState>();
  
  // Context adaptation logic
  useEffect(() => {
    if (!hudContext) return;
    
    const adapted: IntelReport3DContextState = {
      hudContext: {
        operationMode: hudContext.operationMode,
        centerMode: hudContext.centerMode,
        activeLayers: hudContext.activeLayers,
        selectedObject: hudContext.selectedObject
      },
      displayContext: {
        priority: determineDisplayPriority(hudContext),
        visibility: determineVisibility(hudContext),
        adaptiveRendering: contextOptions?.adaptiveRendering ?? true
      },
      integrationState: {
        leftSideControls: hudContext.operationMode === 'CYBER',
        rightSideTools: hudContext.selectedObject?.startsWith('intel-') ?? false,
        bottomBarDetails: hudContext.selectedObject?.startsWith('intel-') ?? false,
        topBarStatus: hasIntelAlerts(hudContext)
      }
    };
    
    setAdaptedContext(adapted);
  }, [hudContext, contextOptions]);
  
  // Context change handlers
  const contextHandlers = useMemo(() => ({
    onOperationModeChange: (mode: string) => {
      // Handle operation mode changes
      setAdaptedContext(prev => prev ? {
        ...prev,
        hudContext: { ...prev.hudContext, operationMode: mode as any },
        integrationState: { ...prev.integrationState, leftSideControls: mode === 'CYBER' }
      } : undefined);
    },
    
    onCenterModeChange: (mode: string) => {
      // Handle center mode changes
      setAdaptedContext(prev => prev ? {
        ...prev,
        hudContext: { ...prev.hudContext, centerMode: mode as any }
      } : undefined);
    }
  }), []);
  
  return {
    adaptedContext,
    contextHandlers,
    isContextReady: !!adaptedContext,
    contextMetrics: {
      adaptationLatency: 0, // Track adaptation performance
      contextStability: 1.0 // Track context change frequency
    }
  };
};
```

#### **Task 3.3: Globe Sync Hook**
**File**: `src/hooks/intelligence/useIntelGlobeSync.ts`
**Duration**: 1 day

```typescript
export const useIntelGlobeSync = (intelData: IntelReport3DData[], context?: IntelReport3DContextState) => {
  const globeService = useContext(IntelGlobeServiceContext);
  const [syncState, setSyncState] = useState<IntelGlobeSyncState>({
    synchronized: false,
    lastSync: null,
    pendingUpdates: 0
  });
  
  // Globe synchronization
  useEffect(() => {
    if (!globeService || !intelData.length) return;
    
    setSyncState(prev => ({ ...prev, pendingUpdates: prev.pendingUpdates + 1 }));
    
    const syncId = requestAnimationFrame(() => {
      globeService.updateIntelLayer('intel-reports', intelData);
      setSyncState({
        synchronized: true,
        lastSync: new Date(),
        pendingUpdates: 0
      });
    });
    
    return () => cancelAnimationFrame(syncId);
  }, [intelData, globeService]);
  
  // Context-based rendering updates
  useEffect(() => {
    if (!context || !globeService) return;
    
    globeService.renderForContext(context);
  }, [context, globeService]);
  
  // Performance monitoring
  const syncMetrics = useMemo(() => ({
    syncLatency: syncState.lastSync ? Date.now() - syncState.lastSync.getTime() : 0,
    syncFrequency: syncState.lastSync ? 1000 / (Date.now() - syncState.lastSync.getTime()) : 0,
    pendingUpdates: syncState.pendingUpdates
  }), [syncState]);
  
  return {
    syncState,
    syncMetrics,
    forceSync: () => {
      if (globeService && intelData.length) {
        globeService.updateIntelLayer('intel-reports', intelData);
      }
    }
  };
};
```

### **Validation Criteria**

1. **Hook Integration**: Hooks integrate seamlessly with existing components
2. **Context Responsiveness**: Hooks respond to HUD context changes immediately
3. **Performance**: No unnecessary re-renders or expensive operations
4. **Error Handling**: Proper error boundaries and fallback states
5. **Memory Management**: No memory leaks from subscriptions or listeners

---

## 🧪 Testing Implementation

### **Context-Aware Testing Suite**

#### **Integration Tests**
**File**: `src/components/Globe/__tests__/IntelReports3D.integration.test.tsx`

```typescript
describe('Intel Reports 3D - HUD Integration', () => {
  let mockHUDContext: any;
  let mockGlobeService: any;
  
  beforeEach(() => {
    mockHUDContext = createMockHUDContext();
    mockGlobeService = createMockGlobeService();
  });
  
  test('activates when CYBER operation mode selected', async () => {
    const { result } = renderHook(() => useIntelReports3D(), {
      wrapper: ({ children }) => (
        <HUDContextProvider value={{...mockHUDContext, operationMode: 'CYBER'}}>
          {children}
        </HUDContextProvider>
      )
    });
    
    await waitFor(() => {
      expect(result.current.context?.integrationState.leftSideControls).toBe(true);
    });
  });
  
  test('adapts to center mode changes', async () => {
    const { result, rerender } = renderHook(() => useIntelReports3D(), {
      wrapper: createContextWrapper({ centerMode: '3D_GLOBE' })
    });
    
    // Change to timeline mode
    rerender();
    mockHUDContext.centerMode = 'TIMELINE';
    
    await waitFor(() => {
      expect(result.current.context?.hudContext.centerMode).toBe('TIMELINE');
    });
  });
  
  test('provides context-sensitive tools in RIGHT SIDE', async () => {
    const { result } = renderHook(() => useIntelReports3D(), {
      wrapper: createContextWrapper({ 
        operationMode: 'CYBER',
        selectedObject: 'intel-report-123'
      })
    });
    
    await waitFor(() => {
      expect(result.current.context?.integrationState.rightSideTools).toBe(true);
    });
  });
});
```

#### **Multi-Context Tests**
**File**: `src/hooks/intelligence/__tests__/useIntelMultiContext.test.ts`

```typescript
describe('Intel Reports 3D - Multi-Context', () => {
  test('supports split-screen CYBER + PLANETARY', async () => {
    const multiContext: IntelReport3DMultiContext = {
      contexts: [
        { hudContext: { operationMode: 'CYBER', centerMode: '3D_GLOBE' } },
        { hudContext: { operationMode: 'PLANETARY', centerMode: '3D_GLOBE' } }
      ],
      syncState: {
        temporalSync: true,
        geospatialSync: true,
        entitySync: false,
        threatSync: true
      }
    };
    
    const { result } = renderHook(() => useIntelMultiContext(multiContext));
    
    await waitFor(() => {
      expect(result.current.contextMapping).toHaveLength(2);
      expect(result.current.contextMapping[0].operationMode).toBe('CYBER');
      expect(result.current.contextMapping[1].operationMode).toBe('PLANETARY');
    });
  });
  
  test('syncs intel data across contexts', async () => {
    const { result } = renderHook(() => useIntelMultiContext(mockMultiContext));
    
    // Simulate intel selection in first context
    act(() => {
      result.current.selectIntelInContext(0, 'intel-123');
    });
    
    await waitFor(() => {
      // Should sync to second context due to entity sync
      expect(result.current.getSyncedSelection(1)).toBe('intel-123');
    });
  });
});
```

---

## 📋 Implementation Checklist

### **Phase 1: Type Unification** ✅
- [ ] Create `IntelReportTypes.ts` with unified core types
- [ ] Create `IntelContextTypes.ts` with HUD integration types  
- [ ] Create `IntelMultiContextTypes.ts` with multi-context support
- [ ] Create `IntelCompatibilityTypes.ts` for backward compatibility
- [ ] Validate type safety across all Intel components
- [ ] Test backward compatibility with existing code

### **Phase 2: Service Consolidation** 🔄
- [ ] Implement `IntelReports3DService` core service
- [ ] Implement `IntelContextService` for HUD integration
- [ ] Implement `IntelGlobeService` for Globe integration
- [ ] Implement `IntelSyncService` for cross-layer sync
- [ ] Test service integration with existing systems
- [ ] Validate performance under load

### **Phase 3: Hook Consolidation** ⏳
- [ ] Implement `useIntelReports3D` main hook
- [ ] Implement `useIntelContextAdapter` for HUD integration
- [ ] Implement `useIntelGlobeSync` for Globe synchronization
- [ ] Implement `useIntelMultiContext` for multi-context support
- [ ] Test hook integration with components
- [ ] Validate performance and memory usage

### **Phase 4: Component Consolidation** ⏳
- [ ] Consolidate Intel marker components
- [ ] Consolidate Intel overlay components
- [ ] Consolidate Intel control components
- [ ] Implement context adaptation components
- [ ] Test component integration with HUD
- [ ] Validate context-sensitive behavior

### **Phase 5: Integration Testing** ⏳
- [ ] Implement HUD integration test suite
- [ ] Implement multi-context test scenarios
- [ ] Implement performance test suite
- [ ] Implement cross-layer sync tests
- [ ] Validate production readiness
- [ ] Document final architecture

---

**Status**: Implementation guide ready
**Next Step**: Begin Phase 1 - Type Unification
**Priority**: High
**Estimated Completion**: 15-17 days
