# Phase 3: Protocol Selection & Fallback System

**Project**: Starcom Multi-Protocol Chat System  
**Phase**: 3 - Protocol Selection & Fallback System  
**Date**: July 3, 2025  
**Status**: Planning

## Overview

This document outlines the development of an intelligent protocol selection and seamless fallback system for the Starcom dApp chat functionality. Phase 3 builds on the unified message store and context provider from Phase 2 by implementing dynamic protocol selection, health monitoring, and automatic fallback mechanisms to ensure reliable chat functionality regardless of individual protocol failures.

## Current State Analysis

After Phases 1 and 2, we now have:
1. Robust adapter pattern with capability detection
2. Unified message store with cross-protocol synchronization
3. Enhanced ChatContext with protocol-agnostic API
4. Migrated components using the unified context

However, the system still lacks:
1. Intelligent protocol selection based on conditions
2. Health monitoring for protocol endpoints
3. Automatic fallback when protocols fail
4. User-friendly status notifications

## Technical Design

### 1. Protocol Scoring & Selection System

**File**: `/src/lib/chat/protocol/ProtocolSelector.ts`

Create a scoring system that evaluates protocols based on:
- User preferences
- Feature requirements
- Health metrics
- Context-specific needs

```typescript
export class ProtocolSelector {
  private registry: ProtocolRegistry;
  private healthMonitor: HealthMonitor;
  private userPreferences: UserPreferences;
  
  constructor(options?: ProtocolSelectorOptions) {
    this.registry = options?.registry || ProtocolRegistry.getInstance();
    this.healthMonitor = options?.healthMonitor || new HealthMonitor();
    this.userPreferences = options?.userPreferences || new UserPreferences();
  }
  
  /**
   * Selects the best protocol based on requirements and conditions
   */
  selectProtocol(requirements: ProtocolRequirements): ProtocolSelectionResult {
    const candidates = this.getEligibleProtocols(requirements);
    const scoredCandidates = this.scoreProtocols(candidates, requirements);
    
    return {
      selectedProtocol: scoredCandidates[0]?.id,
      fallbackChain: scoredCandidates.slice(1).map(p => p.id),
      scores: Object.fromEntries(scoredCandidates.map(p => [p.id, p.score]))
    };
  }
  
  /**
   * Filters protocols based on hard requirements
   */
  private getEligibleProtocols(requirements: ProtocolRequirements): ProtocolRegistration[] {
    const allProtocols = this.registry.getAllProtocols();
    
    return allProtocols.filter(protocol => {
      // Filter by required capabilities
      if (requirements.requiredCapabilities?.some(capability => 
          !protocol.defaultCapabilities[capability])) {
        return false;
      }
      
      // Filter by health status if needed
      if (requirements.requireHealthy && 
          !this.healthMonitor.isHealthy(protocol.id)) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Scores eligible protocols based on soft preferences and conditions
   */
  private scoreProtocols(
    protocols: ProtocolRegistration[], 
    requirements: ProtocolRequirements
  ): ScoredProtocol[] {
    return protocols.map(protocol => {
      let score = 0;
      
      // User preference score (highest weight)
      const preferenceScore = this.userPreferences.getPreferenceScore(protocol.id);
      score += preferenceScore * 10;
      
      // Capability match score
      const capabilityScore = this.calculateCapabilityScore(
        protocol.defaultCapabilities,
        requirements.preferredCapabilities || []
      );
      score += capabilityScore * 5;
      
      // Health score
      const healthScore = this.healthMonitor.getHealthScore(protocol.id);
      score += healthScore * 3;
      
      // Context-specific scores
      if (requirements.isOffline && protocol.defaultCapabilities.offline) {
        score += 15;
      }
      
      if (requirements.needsHighSecurity && protocol.defaultCapabilities.encryption) {
        score += 15;
      }
      
      return {
        id: protocol.id,
        protocol,
        score
      };
    }).sort((a, b) => b.score - a.score);
  }
  
  /**
   * Calculates how well a protocol matches preferred capabilities
   */
  private calculateCapabilityScore(
    capabilities: ChatProviderCapabilities,
    preferredCapabilities: string[]
  ): number {
    if (preferredCapabilities.length === 0) {
      return 5; // Default middle score
    }
    
    const matches = preferredCapabilities.filter(cap => capabilities[cap]);
    return (matches.length / preferredCapabilities.length) * 10;
  }
}
```

### 2. Health Monitoring System

**File**: `/src/lib/chat/monitoring/HealthMonitor.ts`

Create a system to track protocol health metrics:

```typescript
export class HealthMonitor {
  private healthStatus: Map<string, ProtocolHealthStatus> = new Map();
  private metrics: Map<string, ProtocolMetrics> = new Map();
  private checkIntervals: Map<string, number> = new Map();
  
  constructor() {
    // Initialize with default health values
  }
  
  /**
   * Start monitoring a protocol
   */
  startMonitoring(protocol: string, checkInterval: number = 60000): void {
    if (this.checkIntervals.has(protocol)) {
      this.stopMonitoring(protocol);
    }
    
    const intervalId = window.setInterval(() => {
      this.checkHealth(protocol);
    }, checkInterval);
    
    this.checkIntervals.set(protocol, intervalId);
    this.checkHealth(protocol); // Immediate first check
  }
  
  /**
   * Stop monitoring a protocol
   */
  stopMonitoring(protocol: string): void {
    const intervalId = this.checkIntervals.get(protocol);
    if (intervalId) {
      window.clearInterval(intervalId);
      this.checkIntervals.delete(protocol);
    }
  }
  
  /**
   * Check the health of a protocol
   */
  async checkHealth(protocol: string): Promise<ProtocolHealthStatus> {
    try {
      const registry = ProtocolRegistry.getInstance();
      const registration = registry.getProtocol(protocol);
      
      if (!registration) {
        throw new Error(`Protocol ${protocol} not registered`);
      }
      
      const provider = await createChatProvider({
        type: protocol as ChatProviderType,
        options: { healthCheck: true }
      });
      
      // Basic connectivity check
      const startTime = Date.now();
      const isConnected = await provider.isConnected();
      const latency = Date.now() - startTime;
      
      // Get additional metrics if available
      const connectionDetails = provider.getConnectionDetails?.() || {};
      
      // Update metrics
      this.updateMetrics(protocol, {
        latency,
        successRate: isConnected ? 1 : 0,
        connectionQuality: isConnected ? 'good' : 'disconnected',
        lastCheck: new Date(),
        endpoints: connectionDetails.endpoints || [],
        errors: []
      });
      
      // Update health status
      const status: ProtocolHealthStatus = {
        isHealthy: isConnected,
        lastCheck: new Date(),
        checkDuration: latency,
        error: null
      };
      
      this.healthStatus.set(protocol, status);
      return status;
    } catch (error) {
      // Update health status with error
      const status: ProtocolHealthStatus = {
        isHealthy: false,
        lastCheck: new Date(),
        checkDuration: 0,
        error: error as Error
      };
      
      this.healthStatus.set(protocol, status);
      return status;
    }
  }
  
  /**
   * Get the current health status of a protocol
   */
  getHealthStatus(protocol: string): ProtocolHealthStatus | null {
    return this.healthStatus.get(protocol) || null;
  }
  
  /**
   * Check if a protocol is currently healthy
   */
  isHealthy(protocol: string): boolean {
    return this.healthStatus.get(protocol)?.isHealthy || false;
  }
  
  /**
   * Get a health score for a protocol (0-10)
   */
  getHealthScore(protocol: string): number {
    const status = this.healthStatus.get(protocol);
    if (!status) return 0;
    if (!status.isHealthy) return 0;
    
    const metrics = this.metrics.get(protocol);
    if (!metrics) return 5; // Middle score if no metrics
    
    // Calculate score based on latency and success rate
    let score = 10;
    
    // Reduce score based on latency (0-500ms is best, >2s is worst)
    if (metrics.latency > 2000) score -= 5;
    else if (metrics.latency > 1000) score -= 3;
    else if (metrics.latency > 500) score -= 1;
    
    // Reduce score based on success rate
    score = score * (metrics.successRate || 1);
    
    return Math.max(0, Math.min(10, score));
  }
  
  /**
   * Update metrics for a protocol
   */
  private updateMetrics(protocol: string, newData: Partial<ProtocolMetrics>): void {
    const current = this.metrics.get(protocol) || {
      latency: 0,
      successRate: 0,
      connectionQuality: 'unknown',
      lastCheck: new Date(0),
      endpoints: [],
      errors: []
    };
    
    this.metrics.set(protocol, { ...current, ...newData });
  }
}
```

### 3. Fallback Chain Implementation

**File**: `/src/lib/chat/protocol/FallbackManager.ts`

Create a system for managing protocol fallbacks:

```typescript
export class FallbackManager {
  private selector: ProtocolSelector;
  private activeProvider: string | null = null;
  private fallbackChain: string[] = [];
  private messageQueue: Map<string, QueuedMessage[]> = new Map();
  
  constructor(options?: FallbackManagerOptions) {
    this.selector = options?.selector || new ProtocolSelector();
  }
  
  /**
   * Select the best protocol for the given requirements and prepare fallbacks
   */
  async selectProvider(requirements: ProtocolRequirements): Promise<ChatProvider> {
    const result = this.selector.selectProtocol(requirements);
    this.fallbackChain = [result.selectedProtocol, ...result.fallbackChain];
    
    try {
      const provider = await this.activateProvider(result.selectedProtocol);
      this.activeProvider = result.selectedProtocol;
      return provider;
    } catch (error) {
      return this.fallbackToNext(error as Error);
    }
  }
  
  /**
   * Try to send a message, falling back if needed
   */
  async sendMessageWithFallback(
    channelId: string, 
    content: string, 
    attachments?: File[]
  ): Promise<ChatMessage> {
    // First try with current active provider
    try {
      if (!this.activeProvider) {
        throw new Error('No active provider selected');
      }
      
      const provider = await this.getProviderInstance(this.activeProvider);
      return await provider.sendMessage(channelId, content, attachments);
    } catch (error) {
      // Queue the message
      this.queueMessage(channelId, content, attachments);
      
      // Try to fallback to next provider
      try {
        const newProvider = await this.fallbackToNext(error as Error);
        
        // Try to send with new provider
        return await newProvider.sendMessage(channelId, content, attachments);
      } catch (fallbackError) {
        // If fallback also fails, keep in queue and throw
        throw fallbackError;
      }
    }
  }
  
  /**
   * Fallback to the next provider in the chain
   */
  private async fallbackToNext(error: Error): Promise<ChatProvider> {
    console.warn(`Provider ${this.activeProvider} failed:`, error);
    
    // Remove current provider from chain
    if (this.activeProvider) {
      this.fallbackChain = this.fallbackChain.filter(p => p !== this.activeProvider);
    }
    
    // Get next provider in chain
    const nextProvider = this.fallbackChain[0];
    
    if (!nextProvider) {
      throw new Error('No fallback providers available');
    }
    
    try {
      const provider = await this.activateProvider(nextProvider);
      this.activeProvider = nextProvider;
      
      // Try to process queued messages
      this.processMessageQueue();
      
      return provider;
    } catch (activationError) {
      // Recursively try next provider
      return this.fallbackToNext(activationError as Error);
    }
  }
  
  /**
   * Activate a provider for use
   */
  private async activateProvider(providerId: string): Promise<ChatProvider> {
    const provider = await this.getProviderInstance(providerId);
    
    if (!provider.isConnected()) {
      await provider.connect();
    }
    
    return provider;
  }
  
  /**
   * Get or create a provider instance
   */
  private async getProviderInstance(providerId: string): Promise<ChatProvider> {
    return createChatProvider({
      type: providerId as ChatProviderType
    });
  }
  
  /**
   * Queue a message for retry
   */
  private queueMessage(channelId: string, content: string, attachments?: File[]): void {
    const queue = this.messageQueue.get(channelId) || [];
    
    queue.push({
      content,
      attachments,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    this.messageQueue.set(channelId, queue);
  }
  
  /**
   * Process queued messages with current provider
   */
  private async processMessageQueue(): Promise<void> {
    if (!this.activeProvider) return;
    
    const provider = await this.getProviderInstance(this.activeProvider);
    
    for (const [channelId, messages] of this.messageQueue.entries()) {
      const updatedQueue: QueuedMessage[] = [];
      
      for (const message of messages) {
        try {
          await provider.sendMessage(channelId, message.content, message.attachments);
          // Message sent successfully, don't add to updated queue
        } catch (error) {
          // Failed to send, increment retry count and keep in queue
          if (message.retryCount < 5) { // Max retry limit
            updatedQueue.push({
              ...message,
              retryCount: message.retryCount + 1
            });
          }
        }
      }
      
      if (updatedQueue.length > 0) {
        this.messageQueue.set(channelId, updatedQueue);
      } else {
        this.messageQueue.delete(channelId);
      }
    }
  }
}
```

### 4. User Notification System

**File**: `/src/components/Chat/ChatStatusBar.tsx`

Create a component for protocol status notifications:

```tsx
interface ChatStatusBarProps {
  activeProvider: string;
  fallbackChain: string[];
  connectionStatus: ConnectionStatus;
  healthStatus: ProtocolHealthStatus | null;
  onManualSwitch?: (providerId: string) => void;
}

export const ChatStatusBar: React.FC<ChatStatusBarProps> = ({
  activeProvider,
  fallbackChain,
  connectionStatus,
  healthStatus,
  onManualSwitch
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Get protocol friendly name
  const getProtocolName = (id: string): string => {
    const registry = ProtocolRegistry.getInstance();
    return registry.getProtocol(id)?.name || id;
  };
  
  // Get status indicator
  const getStatusIndicator = (): React.ReactNode => {
    switch (connectionStatus) {
      case 'connected':
        return <span className="status-indicator connected">●</span>;
      case 'connecting':
        return <span className="status-indicator connecting">◌</span>;
      case 'disconnected':
        return <span className="status-indicator disconnected">○</span>;
      case 'reconnecting':
        return <span className="status-indicator reconnecting">◍</span>;
      default:
        return <span className="status-indicator unknown">?</span>;
    }
  };
  
  return (
    <div className="chat-status-bar">
      <div className="status-summary" onClick={() => setShowDetails(!showDetails)}>
        {getStatusIndicator()}
        <span className="provider-name">{getProtocolName(activeProvider)}</span>
        {connectionStatus === 'connected' ? 
          <span className="status-text">Connected</span> : 
          <span className="status-text error">{connectionStatus}</span>
        }
      </div>
      
      {showDetails && (
        <div className="status-details">
          <h4>Chat Connection Details</h4>
          
          <div className="current-provider">
            <strong>Active Protocol:</strong> {getProtocolName(activeProvider)}
            <div className="health-info">
              {healthStatus?.isHealthy ? 
                <span className="health healthy">Healthy</span> : 
                <span className="health unhealthy">Unhealthy</span>
              }
              {healthStatus?.latency && 
                <span className="latency">{healthStatus.latency}ms</span>
              }
            </div>
          </div>
          
          {fallbackChain.length > 0 && (
            <div className="fallback-chain">
              <strong>Fallback Protocols:</strong>
              <ul>
                {fallbackChain.map(id => (
                  <li key={id}>
                    {getProtocolName(id)}
                    {onManualSwitch && (
                      <button 
                        onClick={() => onManualSwitch(id)}
                        className="switch-button"
                      >
                        Switch
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {healthStatus?.error && (
            <div className="error-details">
              <strong>Error:</strong>
              <pre>{healthStatus.error.message}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

## Implementation Plan

### 1. Design Protocol Selection System

**Files to Create/Modify**:
- `/src/lib/chat/protocol/ProtocolSelector.ts` - Protocol scoring and selection
- `/src/lib/chat/protocol/ProtocolTypes.ts` - Selection-related types
- `/src/lib/chat/protocol/UserPreferences.ts` - User preference management
- `/src/lib/chat/protocol/RequirementDetector.ts` - Auto-detect requirements

**Implementation Details**:

1. **Scoring Algorithm**:
   - Implement weighted scoring for protocol selection
   - Factor in user preferences, capabilities, and health
   - Design scoring normalization for consistent comparisons

2. **User Preferences**:
   - Create persistence for user protocol preferences
   - Implement preference override management
   - Design UI for setting protocol preferences

3. **Requirement Detection**:
   - Create utility for auto-detecting requirements from context
   - Implement feature-based protocol selection
   - Design capability-requirement mapping

### 2. Build Health Monitoring System

**Files to Create/Modify**:
- `/src/lib/chat/monitoring/HealthMonitor.ts` - Core monitoring system
- `/src/lib/chat/monitoring/ProtocolMetrics.ts` - Protocol performance metrics
- `/src/lib/chat/monitoring/HealthTypes.ts` - Health-related type definitions
- `/src/components/Chat/ProtocolHealthDashboard.tsx` - Monitoring UI

**Implementation Details**:

1. **Health Checks**:
   - Implement protocol-specific health check methods
   - Create scheduled health monitoring
   - Design health status aggregation

2. **Metrics Collection**:
   - Implement latency and success rate tracking
   - Create endpoint-specific metrics
   - Design time-series data collection

3. **Diagnostics Dashboard**:
   - Create protocol health visualization
   - Implement detailed metrics display
   - Design troubleshooting interface

### 3. Implement Fallback Chain Logic

**Files to Create/Modify**:
- `/src/lib/chat/protocol/FallbackManager.ts` - Fallback chain management
- `/src/lib/chat/protocol/MessageQueue.ts` - Message retry queue
- `/src/lib/chat/protocol/FallbackTypes.ts` - Fallback-related type definitions
- `/src/context/EnhancedChatContext.tsx` - Update to use fallback manager

**Implementation Details**:

1. **Fallback Chain**:
   - Implement dynamic fallback chain generation
   - Create provider switching logic
   - Design state preservation during switches

2. **Message Retry Queue**:
   - Implement persistent message queue
   - Create message retry strategies
   - Design queue management and cleanup

3. **Seamless Switching**:
   - Implement state transfer between providers
   - Create channel re-joining logic
   - Design transparent UI transitions

### 4. Develop User Notification System

**Files to Create/Modify**:
- `/src/components/Chat/ChatStatusBar.tsx` - Status indicator component
- `/src/components/Chat/ProtocolSwitcher.tsx` - Manual protocol selection UI
- `/src/components/Chat/ConnectionToast.tsx` - Non-invasive status toast
- `/src/hooks/chat/useConnectionStatus.ts` - Connection status hook

**Implementation Details**:

1. **Status Indicators**:
   - Create non-disruptive status indicators
   - Implement detailed status display
   - Design intuitive status visualization

2. **Manual Override**:
   - Create interface for manual protocol selection
   - Implement provider switching UI
   - Design troubleshooting assistance

3. **Notification System**:
   - Implement toast notifications for status changes
   - Create progressive notification levels
   - Design non-intrusive alert system

## File Structure

```
src/
├── lib/
│   └── chat/
│       ├── protocol/
│       │   ├── ProtocolSelector.ts
│       │   ├── ProtocolTypes.ts
│       │   ├── UserPreferences.ts
│       │   ├── RequirementDetector.ts
│       │   ├── FallbackManager.ts
│       │   ├── MessageQueue.ts
│       │   └── FallbackTypes.ts
│       └── monitoring/
│           ├── HealthMonitor.ts
│           ├── ProtocolMetrics.ts
│           └── HealthTypes.ts
├── context/
│   └── EnhancedChatContext.tsx (updated)
├── hooks/
│   └── chat/
│       ├── useProtocolSelection.ts
│       ├── useConnectionStatus.ts
│       └── useFallbackChain.ts
└── components/
    └── Chat/
        ├── ChatStatusBar.tsx
        ├── ProtocolSwitcher.tsx
        ├── ConnectionToast.tsx
        └── ProtocolHealthDashboard.tsx
```

## Testing Strategy

### Unit Tests

1. **Protocol Selection Tests**:
   - Test scoring algorithm with various inputs
   - Verify correct protocol selection for different requirements
   - Test preference-based selection logic

2. **Health Monitoring Tests**:
   - Test health check methods with mock providers
   - Verify metrics collection and aggregation
   - Test health score calculation

3. **Fallback Logic Tests**:
   - Test fallback chain generation
   - Verify provider switching behavior
   - Test message queue and retry logic

### Integration Tests

1. **Selection & Fallback Tests**:
   - Test end-to-end protocol selection and fallback
   - Verify seamless state preservation during switches
   - Test recovery from various failure scenarios

2. **UI Component Tests**:
   - Test status indicators with different states
   - Verify notification behavior
   - Test manual override functionality

### Simulated Failures

1. **Protocol Failure Tests**:
   - Simulate connection failures
   - Test timeout handling
   - Verify recovery behavior

2. **Network Condition Tests**:
   - Test behavior under poor network conditions
   - Verify offline operation
   - Test reconnection logic

## Implementation Tasks and Timeline

| Task | Description | Time Estimate |
|------|-------------|---------------|
| 3.1 | Design and implement ProtocolSelector | 4-5 days |
| 3.2 | Create user preference management | 2-3 days |
| 3.3 | Implement HealthMonitor | 4-5 days |
| 3.4 | Create metrics collection and analysis | 3-4 days |
| 3.5 | Implement FallbackManager | 4-5 days |
| 3.6 | Create message queue and retry system | 3-4 days |
| 3.7 | Implement ChatStatusBar component | 2-3 days |
| 3.8 | Create protocol switching UI | 2-3 days |
| 3.9 | Develop comprehensive tests | 3-4 days |

**Total Estimated Timeline: 3-4 weeks**

## Deliverables

1. **Protocol Selection System**:
   - Complete `ProtocolSelector` implementation
   - User preference management
   - Requirement detection utilities

2. **Health Monitoring System**:
   - `HealthMonitor` implementation
   - Protocol metrics collection
   - Health visualization dashboard

3. **Fallback Chain Implementation**:
   - `FallbackManager` with dynamic chain generation
   - Message retry queue
   - Seamless protocol switching

4. **User Notification Components**:
   - Status indicators and notifications
   - Manual protocol selection UI
   - Connection status visualization

## Success Criteria

1. System automatically selects optimal protocol based on conditions
2. Protocol failures trigger fallback to next best alternative
3. Message delivery guaranteed even during protocol switches
4. Users receive appropriate notifications about protocol status
5. All tests pass with >90% coverage

## Dependencies

1. **Phase 2 Completion**: Unified message store and context provider must be complete
2. **Protocol Adapters**: Complete adapter implementations for all supported protocols
3. **LocalStorage/IndexedDB**: For user preferences and message queue persistence

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Excessive protocol switching | High | Medium | Implement switch dampening and cooldown |
| False positive health checks | Medium | Medium | Multi-factor health determination |
| User confusion during fallbacks | Medium | High | Clear status indicators and notifications |
| Message loss during switching | High | Medium | Robust message queue with persistence |
| Performance impact of monitoring | Medium | Medium | Configurable check intervals and lightweight checks |

## Conclusion

Phase 3 establishes a robust protocol selection and fallback system that enables the Starcom dApp to intelligently choose the optimal chat protocol based on conditions and seamlessly switch between protocols when failures occur. By implementing health monitoring, fallback chains, and user notifications, this phase ensures reliable chat functionality regardless of individual protocol failures.

The resulting system will provide a superior user experience by automatically adapting to changing conditions while keeping users informed about the status of their communications. This lays the groundwork for the advanced features and optimizations to be developed in subsequent phases.
