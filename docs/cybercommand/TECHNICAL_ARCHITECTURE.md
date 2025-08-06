# CyberCommand Technical Architecture & Code Standards

## Architecture Overview

This document defines the technical architecture, coding standards, and implementation patterns for all CyberCommand secondary visualizations to ensure consistency, maintainability, and performance.

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    CyberCommand UI Layer                    │
├─────────────────────────────────────────────────────────────┤
│  VisualizationModeContext │ Settings Panels │ Globe Controls │
├─────────────────────────────────────────────────────────────┤
│                  Visualization Layer                        │
├─────────────────────────────────────────────────────────────┤
│ IntelReports │ CyberAttacks │ CyberThreats │ Satellites │   │
├─────────────────────────────────────────────────────────────┤
│                    Shared Services Layer                    │
├─────────────────────────────────────────────────────────────┤
│ DataService │ AnimationEngine │ InteractionHandler │ Utils  │
├─────────────────────────────────────────────────────────────┤
│                      Data Sources                           │
├─────────────────────────────────────────────────────────────┤
│   APIs   │   Feeds   │   Databases   │   Real-time Streams  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure
```
src/
├── components/
│   ├── Globe/
│   │   ├── shared/                    # Shared visualization components
│   │   │   ├── VisualizationMarker.tsx
│   │   │   ├── AnimationEngine.ts
│   │   │   ├── InteractionHandler.ts
│   │   │   └── PerformanceMonitor.ts
│   │   └── visualizations/            # Mode-specific visualization components
│   │       ├── CyberAttacksVisualization.tsx
│   │       ├── CyberThreatsVisualization.tsx
│   │       ├── SatellitesVisualization.tsx
│   │       └── CommHubsVisualization.tsx
│   └── HUD/
│       └── Settings/
│           └── CyberCommandSettings/
│               ├── CyberAttacksSettings.tsx
│               ├── CyberThreatsSettings.tsx
│               ├── SatellitesSettings.tsx
│               └── CommHubsSettings.tsx
├── services/
│   ├── CyberCommandDataService.ts     # Unified data service
│   ├── CyberAttacks/
│   │   ├── RealTimeAttackService.ts
│   │   ├── AttackDataProcessor.ts
│   │   └── AttackAnimationService.ts
│   ├── CyberThreats/
│   │   ├── ThreatIntelligenceService.ts
│   │   ├── ThreatCorrelationEngine.ts
│   │   └── AttributionAnalyzer.ts
│   ├── Satellites/
│   │   ├── SatelliteVisualizationService.ts
│   │   ├── OrbitalMechanicsCalculator.ts
│   │   └── SpaceAssetTracker.ts
│   └── CommHubs/
│       ├── CommunicationFacilityService.ts
│       ├── CoverageCalculator.ts
│       └── SignalAnalyzer.ts
├── types/
│   ├── CyberCommandVisualization.ts   # Common types
│   ├── CyberAttacks.ts
│   ├── CyberThreats.ts
│   ├── Satellites.ts
│   └── CommHubs.ts
├── hooks/
│   ├── useCyberCommandSettings.ts     # Extended for all modes
│   ├── useVisualizationData.ts        # Generic data hook
│   └── usePerformanceMonitoring.ts    # Performance tracking
└── utils/
    ├── VisualizationHelpers.ts        # Shared utilities
    ├── GeographicUtils.ts             # Geographic calculations
    ├── AnimationUtils.ts              # Animation helpers
    └── DataValidation.ts              # Data validation utilities
```

## Core Interfaces & Types

### Base Visualization Interface
```typescript
// src/types/CyberCommandVisualization.ts

export interface BaseVisualizationData {
  id: string;
  type: VisualizationType;
  location: GeoCoordinate;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export type VisualizationType = 
  | 'intel_report'
  | 'cyber_attack'
  | 'cyber_threat'
  | 'network_infrastructure'
  | 'communication_hub';

export interface VisualizationComponent<T extends BaseVisualizationData> {
  data: T[];
  loading: boolean;
  error: Error | null;
  settings: VisualizationSettings;
  visible: boolean;
  onDataClick: (data: T) => void;
  onDataUpdate: (data: T[]) => void;
}

export interface VisualizationSettings {
  opacity: number;
  animationSpeed: number;
  showDetails: boolean;
  filterCriteria: Record<string, any>;
}
```

### Shared Animation Interface
```typescript
// src/components/Globe/shared/AnimationEngine.ts

export interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  loop: boolean;
  autoplay: boolean;
}

export interface AnimatedElement {
  id: string;
  startPosition: GeoCoordinate;
  endPosition: GeoCoordinate;
  animationConfig: AnimationConfig;
  onComplete?: () => void;
}

export class AnimationEngine {
  private animatedElements: Map<string, AnimatedElement>;
  private animationFrameId: number | null;
  
  public addAnimation(element: AnimatedElement): void;
  public removeAnimation(id: string): void;
  public pauseAll(): void;
  public resumeAll(): void;
  public updateFrame(): void;
}
```

## Implementation Patterns

### 1. Data Service Pattern
All data services must follow this pattern:

```typescript
// Example: src/services/CyberAttacks/RealTimeAttackService.ts

export interface AttackDataSource {
  connect(): Promise<void>;
  disconnect(): void;
  subscribe(callback: (data: CyberAttack[]) => void): void;
  getHistoricalData(timeRange: TimeRange): Promise<CyberAttack[]>;
}

export class RealTimeAttackService implements AttackDataSource {
  private websocket: WebSocket | null = null;
  private subscribers: ((data: CyberAttack[]) => void)[] = [];
  
  public async connect(): Promise<void> {
    // Implementation
  }
  
  public disconnect(): void {
    // Implementation
  }
  
  public subscribe(callback: (data: CyberAttack[]) => void): void {
    this.subscribers.push(callback);
  }
  
  public async getHistoricalData(timeRange: TimeRange): Promise<CyberAttack[]> {
    // Implementation
  }
  
  private handleIncomingData(rawData: any): void {
    const processedData = this.processAttackData(rawData);
    this.notifySubscribers(processedData);
  }
  
  private processAttackData(rawData: any): CyberAttack[] {
    // Data validation, normalization, and transformation
  }
  
  private notifySubscribers(data: CyberAttack[]): void {
    this.subscribers.forEach(callback => callback(data));
  }
}
```

### 2. Visualization Component Pattern
All visualization components must follow this pattern:

```typescript
// Example: src/components/Globe/visualizations/CyberAttacksVisualization.tsx

import React, { useEffect, useRef, useMemo } from 'react';
import { VisualizationComponent } from '../../../types/CyberCommandVisualization';
import { CyberAttack } from '../../../types/CyberAttacks';
import { AnimationEngine } from '../shared/AnimationEngine';
import { InteractionHandler } from '../shared/InteractionHandler';

interface CyberAttacksVisualizationProps extends VisualizationComponent<CyberAttack> {
  globeRef: React.RefObject<any>;
}

export const CyberAttacksVisualization: React.FC<CyberAttacksVisualizationProps> = ({
  data,
  loading,
  error,
  settings,
  visible,
  globeRef,
  onDataClick,
  onDataUpdate
}) => {
  const animationEngineRef = useRef<AnimationEngine>();
  const interactionHandlerRef = useRef<InteractionHandler>();
  
  // Initialize animation and interaction systems
  useEffect(() => {
    if (!globeRef.current) return;
    
    animationEngineRef.current = new AnimationEngine(globeRef.current);
    interactionHandlerRef.current = new InteractionHandler(globeRef.current, onDataClick);
    
    return () => {
      animationEngineRef.current?.cleanup();
      interactionHandlerRef.current?.cleanup();
    };
  }, [globeRef.current]);
  
  // Update visualization when data changes
  useEffect(() => {
    if (!visible || !globeRef.current || !data.length) return;
    
    updateVisualization();
  }, [data, visible, settings]);
  
  const updateVisualization = () => {
    // Clear existing visualization
    clearVisualization();
    
    // Add new visualization elements
    data.forEach(attack => {
      addAttackVisualization(attack);
    });
  };
  
  const addAttackVisualization = (attack: CyberAttack) => {
    // Add 3D objects to scene
    // Set up animations
    // Configure interactions
  };
  
  const clearVisualization = () => {
    // Remove 3D objects from scene
    // Stop animations
    // Clear interactions
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearVisualization();
    };
  }, []);
  
  return null; // This component manages 3D scene directly
};
```

### 3. Settings Panel Pattern
All settings panels must follow this pattern:

```typescript
// Example: src/components/HUD/Settings/CyberCommandSettings/CyberAttacksSettings.tsx

import React from 'react';
import { CyberAttacksSettings as SettingsType } from '../../../../types/CyberAttacks';
import { SettingsGroup } from '../shared/SettingsGroup';
import { ToggleControl } from '../shared/ToggleControl';
import { SliderControl } from '../shared/SliderControl';
import { SelectControl } from '../shared/SelectControl';

interface CyberAttacksSettingsProps {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}

export const CyberAttacksSettings: React.FC<CyberAttacksSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const updateSetting = <K extends keyof SettingsType>(
    key: K,
    value: SettingsType[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  
  return (
    <div className="cyber-attacks-settings">
      <SettingsGroup title="Attack Types">
        <ToggleControl
          label="DDoS Attacks"
          checked={settings.attackTypes.ddos}
          onChange={(checked) => updateSetting('attackTypes', {
            ...settings.attackTypes,
            ddos: checked
          })}
        />
        <ToggleControl
          label="Malware Infections"
          checked={settings.attackTypes.malware}
          onChange={(checked) => updateSetting('attackTypes', {
            ...settings.attackTypes,
            malware: checked
          })}
        />
        {/* More attack type toggles */}
      </SettingsGroup>
      
      <SettingsGroup title="Visualization">
        <SliderControl
          label="Animation Speed"
          value={settings.animationSpeed}
          min={0.5}
          max={3.0}
          step={0.1}
          onChange={(value) => updateSetting('animationSpeed', value)}
        />
        <SliderControl
          label="Opacity"
          value={settings.opacity}
          min={0}
          max={100}
          step={5}
          onChange={(value) => updateSetting('opacity', value)}
        />
      </SettingsGroup>
      
      <SettingsGroup title="Time Range">
        <SelectControl
          label="Time Window"
          value={settings.timeWindow}
          options={[
            { value: 5, label: '5 minutes' },
            { value: 15, label: '15 minutes' },
            { value: 30, label: '30 minutes' },
            { value: 60, label: '1 hour' }
          ]}
          onChange={(value) => updateSetting('timeWindow', value)}
        />
      </SettingsGroup>
    </div>
  );
};
```

## Performance Standards

### Memory Management
```typescript
// Example: Memory cleanup pattern
export class VisualizationManager {
  private activeObjects: Set<THREE.Object3D> = new Set();
  private animationFrames: Set<number> = new Set();
  
  public addObject(object: THREE.Object3D): void {
    this.activeObjects.add(object);
  }
  
  public removeObject(object: THREE.Object3D): void {
    // Clean up geometry and materials
    if (object.geometry) {
      object.geometry.dispose();
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => material.dispose());
      } else {
        object.material.dispose();
      }
    }
    
    this.activeObjects.delete(object);
  }
  
  public cleanup(): void {
    this.activeObjects.forEach(object => this.removeObject(object));
    this.animationFrames.forEach(frameId => cancelAnimationFrame(frameId));
    this.activeObjects.clear();
    this.animationFrames.clear();
  }
}
```

### Performance Monitoring
```typescript
// src/hooks/usePerformanceMonitoring.ts
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameRate: 0,
    memoryUsage: 0,
    dataPoints: 0,
    renderTime: 0
  });
  
  useEffect(() => {
    const monitor = new PerformanceMonitor();
    monitor.startMonitoring((newMetrics) => {
      setMetrics(newMetrics);
    });
    
    return () => monitor.stopMonitoring();
  }, []);
  
  return metrics;
};
```

## Data Validation Standards

### Input Validation
```typescript
// src/utils/DataValidation.ts
export const validateGeoCoordinate = (coord: any): coord is GeoCoordinate => {
  return (
    typeof coord === 'object' &&
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
};

export const validateVisualizationData = <T extends BaseVisualizationData>(
  data: any,
  additionalValidators?: Array<(item: any) => boolean>
): data is T[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    if (!item.id || !item.type || !item.location || !item.timestamp) {
      return false;
    }
    
    if (!validateGeoCoordinate(item.location)) {
      return false;
    }
    
    if (additionalValidators) {
      return additionalValidators.every(validator => validator(item));
    }
    
    return true;
  });
};
```

## Error Handling Standards

### Error Boundaries
```typescript
// src/components/ErrorBoundary/VisualizationErrorBoundary.tsx
export class VisualizationErrorBoundary extends React.Component<
  { children: React.ReactNode; visualizationType: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Visualization error in ${this.props.visualizationType}:`, error);
    // Log to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="visualization-error">
          <h3>Visualization Error</h3>
          <p>The {this.props.visualizationType} visualization encountered an error.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### API Error Handling
```typescript
// src/utils/ApiErrorHandler.ts
export class ApiErrorHandler {
  static async handleApiCall<T>(
    apiCall: () => Promise<T>,
    retryCount: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (attempt === retryCount) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1))
        );
      }
    }
    
    throw new Error('Max retry attempts exceeded');
  }
}
```

## Testing Standards

### Unit Test Template
```typescript
// Example: src/services/CyberAttacks/__tests__/RealTimeAttackService.test.ts
import { RealTimeAttackService } from '../RealTimeAttackService';
import { CyberAttack } from '../../../types/CyberAttacks';

describe('RealTimeAttackService', () => {
  let service: RealTimeAttackService;
  
  beforeEach(() => {
    service = new RealTimeAttackService();
  });
  
  afterEach(async () => {
    await service.disconnect();
  });
  
  describe('connect', () => {
    it('should establish connection successfully', async () => {
      await expect(service.connect()).resolves.not.toThrow();
    });
    
    it('should handle connection failures gracefully', async () => {
      // Test connection failure scenarios
    });
  });
  
  describe('data processing', () => {
    it('should validate incoming data correctly', () => {
      const validData = createMockAttackData();
      const result = service.processAttackData(validData);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: expect.any(String),
        type: expect.any(String),
        location: expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number)
        })
      });
    });
    
    it('should reject invalid data', () => {
      const invalidData = { invalid: 'data' };
      expect(() => service.processAttackData(invalidData)).toThrow();
    });
  });
});
```

### Integration Test Template
```typescript
// Example: src/components/Globe/visualizations/__tests__/CyberAttacksVisualization.integration.test.tsx
import { render, waitFor } from '@testing-library/react';
import { CyberAttacksVisualization } from '../CyberAttacksVisualization';
import { createMockGlobeRef, createMockAttackData } from '../../__mocks__';

describe('CyberAttacksVisualization Integration', () => {
  it('should render attack data on globe when visible', async () => {
    const mockGlobeRef = createMockGlobeRef();
    const mockData = createMockAttackData(5);
    
    render(
      <CyberAttacksVisualization
        data={mockData}
        loading={false}
        error={null}
        settings={defaultSettings}
        visible={true}
        globeRef={mockGlobeRef}
        onDataClick={jest.fn()}
        onDataUpdate={jest.fn()}
      />
    );
    
    await waitFor(() => {
      expect(mockGlobeRef.current.scene.children).toHaveLength(5);
    });
  });
});
```

## Code Quality Standards

### ESLint Configuration
```json
// .eslintrc.cybercommand.json
{
  "extends": ["../eslint.config.js"],
  "rules": {
    "max-lines": ["error", 300],
    "max-complexity": ["error", 10],
    "prefer-const": "error",
    "no-var": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-readonly": "error"
  },
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.test.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

### Documentation Standards
Every component, service, and utility must include:
- JSDoc comments with description, parameters, and return values
- Usage examples in comments
- Performance considerations notes
- Error handling behavior description

```typescript
/**
 * Real-time cyber attack visualization service
 * 
 * Manages real-time data streams from SIEM systems and threat intelligence feeds,
 * processes attack data, and provides geographic positioning for 3D visualization.
 * 
 * @example
 * ```typescript
 * const service = new RealTimeAttackService();
 * await service.connect();
 * service.subscribe((attacks) => {
 *   console.log(`Received ${attacks.length} new attacks`);
 * });
 * ```
 * 
 * @performance
 * - Handles up to 1000 attacks per second
 * - Memory usage: ~50MB for 10,000 active attacks
 * - Latency: <100ms from data receipt to subscriber notification
 * 
 * @errors
 * - Throws ConnectionError if unable to establish data feed connection
 * - Emits 'error' event for non-fatal data processing errors
 * - Automatically retries failed connections with exponential backoff
 */
export class RealTimeAttackService {
  // Implementation
}
```

---

This technical architecture document ensures that all CyberCommand visualizations are built with consistent, maintainable, and high-performance code following established patterns and standards.
