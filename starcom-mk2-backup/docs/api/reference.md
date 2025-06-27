# API Documentation
**Last Updated**: June 22, 2025  
**Status**: Living Document

---

## React Hooks API

### Core Hooks

#### `useFeatureFlag(flagName: string): boolean`
Access individual feature flag values.

```typescript
import { useFeatureFlag } from '../utils/featureFlags';

const MyComponent = () => {
  const isEnabled = useFeatureFlag('enhancedContextEnabled');
  return isEnabled ? <EnhancedView /> : <LegacyView />;
};
```

#### `useFeatureFlags(): FeatureFlags & FlagControls`
Access all feature flags and control functions.

```typescript
import { useFeatureFlags } from '../utils/featureFlags';

const ControlPanel = () => {
  const { enhancedCenter, updateFlag } = useFeatureFlags();
  
  return (
    <button onClick={() => updateFlag('enhancedCenter', !enhancedCenter)}>
      Toggle Enhanced Center
    </button>
  );
};
```

#### `useFloatingPanels(): FloatingPanelContext`
Manage floating panel system.

```typescript
import { useFloatingPanels } from '../components/HUD/FloatingPanels/FloatingPanelContext';

const CustomComponent = () => {
  const { registerPanel, addActiveFeature } = useFloatingPanels();
  
  useEffect(() => {
    registerPanel({
      id: 'my-panel',
      type: 'info',
      title: 'Custom Panel',
      component: MyPanelComponent
    });
  }, []);
};
```

### Data Hooks

#### `useTopBarData(): TopBarDataState`
Access real-time data for top bar display.

```typescript
import { useTopBarData } from '../components/HUD/Bars/TopBar/useTopBarData';

const DataDisplay = () => {
  const { commodities, indices, crypto, loading } = useTopBarData();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      <span>Gold: {commodities}</span>
      <span>S&P 500: {indices}</span>
      <span>BTC: {crypto}</span>
    </div>
  );
};
```

#### `useNOAAData(): NOAADataState`
Access NOAA space weather data.

```typescript
import { useNOAAData } from '../hooks/useNOAAData';

const SpaceWeatherComponent = () => {
  const { geomagneticData, solarActivity, loading, error } = useNOAAData();
  
  return (
    <div>
      {error && <ErrorMessage error={error} />}
      {loading ? <LoadingSpinner /> : (
        <div>
          <GeomagneticDisplay data={geomagneticData} />
          <SolarActivityDisplay data={solarActivity} />
        </div>
      )}
    </div>
  );
};
```

## Component APIs

### Core Components

#### `<HUDLayout />`
Main layout component for the HUD interface.

**Props**: None (uses context for configuration)

**Usage**:
```typescript
import HUDLayout from '../layouts/HUDLayout/HUDLayout';

const App = () => {
  return (
    <GlobalContextProvider>
      <HUDLayout />
    </GlobalContextProvider>
  );
};
```

#### `<FloatingPanelManager />`
Manages all floating panels in the interface.

**Props**:
```typescript
interface FloatingPanelManagerProps {
  children: React.ReactNode;
  maxPanels?: number;
  defaultPosition?: 'left' | 'right' | 'top' | 'bottom';
}
```

**Usage**:
```typescript
<FloatingPanelManager maxPanels={5} defaultPosition="right">
  <YourAppContent />
</FloatingPanelManager>
```

### HUD Components

#### `<TopBar />`
Displays global status and data feeds.

**Features**:
- Real-time data marquee
- Settings popup
- Global status indicators

**Configuration**: Uses `useTopBarPreferences()` hook

#### `<LeftSideBar />`
Controls and navigation interface.

**Features**:
- Data layer controls
- Visualization mode selection
- NOAA space weather controls

**Props**:
```typescript
interface LeftSideBarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}
```

#### `<RightSideBar />`
Mission control and external applications.

**Features**:
- Mission control panels
- External app launcher
- Intelligence hub
- Collaboration tools

**Props**:
```typescript
interface RightSideBarProps {
  expanded?: boolean;
  apps?: ExternalApp[];
}
```

## Testing APIs

### AI Testing Framework

#### `AgentInterface`
Main interface for autonomous UI testing.

```typescript
import { AgentInterface } from '../testing/ai-agent/AgentInterface';

const config = {
  safetyChecksEnabled: true,
  emergencyStopEnabled: true,
  maxExecutionTime: 300000, // 5 minutes
  memoryLimit: 2 * 1024 * 1024 * 1024, // 2GB
};

const agent = new AgentInterface(config);

// Run test scenario
const result = await agent.runTestScenario({
  name: 'Component Detection',
  steps: [
    { action: 'navigate', target: 'http://localhost:5173' },
    { action: 'detectComponents' },
    { action: 'validateAccessibility' }
  ]
});
```

#### `SafetyMonitor`
Monitors test execution for safety violations.

```typescript
import { SafetyMonitor } from '../testing/ai-agent/SafetyMonitor';

const monitor = new SafetyMonitor(config);
await monitor.initialize(page);
await monitor.startMonitoring();

// Check safety status
const status = await monitor.checkSafety();
if (!status.safe) {
  console.warn('Safety violation:', status.reason);
}
```

### Component Detection

#### `UniversalComponentDetector`
Multi-strategy component detection.

```typescript
import { UniversalComponentDetector } from '../testing/ai-agent/UniversalComponentDetector';

const detector = new UniversalComponentDetector();
const components = await detector.detectComponents(page, {
  strategies: ['css-selector', 'aria-label', 'react-component'],
  timeout: 30000
});
```

## Data Services API

### External Data Integration

#### NOAA Space Weather Service
```typescript
interface NOAAService {
  getGeomagneticData(): Promise<GeomagneticData>;
  getSolarActivity(): Promise<SolarActivity>;
  getAuroraForecast(): Promise<AuroraForecast>;
  subscribeToUpdates(callback: (data: SpaceWeatherData) => void): () => void;
}
```

#### Financial Data Service
```typescript
interface FinancialDataService {
  getCommodities(): Promise<CommodityData>;
  getMarketIndices(): Promise<IndexData>;
  getCryptoPrices(): Promise<CryptoData>;
  getEconomicIndicators(): Promise<EconomicData>;
}
```

## Type Definitions

### Core Types

```typescript
// Feature flags
interface FeatureFlags {
  enhancedContextEnabled: boolean;
  enhancedCenter: boolean;
  uiTestingDiagnosticsEnabled: boolean;
  // ... other flags
}

// Floating panels
interface PanelConfig {
  id: string;
  type: 'stream' | 'action' | 'info' | 'analysis';
  title: string;
  component: React.ComponentType<any>;
  triggers?: string[];
  position?: 'left' | 'right' | 'top' | 'bottom';
  priority?: number;
}

// Test scenarios
interface TestScenario {
  name: string;
  steps: TestStep[];
  timeout?: number;
  retries?: number;
}

interface TestStep {
  action: string;
  target?: string;
  options?: Record<string, any>;
  assertion?: TestAssertion;
}
```

### Data Types

```typescript
// NOAA data structures
interface GeomagneticData {
  kpIndex: number;
  stormLevel: 'quiet' | 'unsettled' | 'active' | 'storm' | 'severe';
  fieldStrength: number;
  timestamp: Date;
}

interface SpaceWeatherData {
  geomagnetic: GeomagneticData;
  solar: SolarActivity;
  aurora: AuroraForecast;
  alerts: WeatherAlert[];
}

// UI component data
interface ComponentInfo {
  id: string;
  type: string;
  tagName: string;
  attributes: Record<string, string>;
  boundingBox: DOMRect;
  isVisible: boolean;
  isInteractive: boolean;
}
```

## Utility APIs

### Feature Flag Manager

```typescript
class FeatureFlagManager {
  getFlag(flagName: keyof FeatureFlags): boolean;
  setFlag(flagName: keyof FeatureFlags, value: boolean): void;
  getAllFlags(): FeatureFlags;
  updateFlags(updates: Partial<FeatureFlags>): void;
  resetToDefaults(): void;
  subscribe(callback: (flags: FeatureFlags) => void): () => void;
}

// Global instance
export const featureFlagManager: FeatureFlagManager;
```

### Event System

```typescript
// Globe interaction events
interface GlobeEvents {
  'globe:hover': (data: GlobeHoverData) => void;
  'globe:click': (data: GlobeClickData) => void;
  'globe:zoom': (level: number) => void;
  'data:update': (source: string, data: any) => void;
}

// Subscribe to events
useEffect(() => {
  const unsubscribe = globeEventEmitter.on('globe:hover', handleHover);
  return unsubscribe;
}, []);
```

---

## Error Handling

### Common Error Patterns

```typescript
// API errors
interface APIError {
  code: string;
  message: string;
  details?: any;
}

// Component errors
interface ComponentError extends Error {
  componentStack?: string;
  errorBoundary?: string;
}

// Testing errors
interface TestingError extends Error {
  testStep?: number;
  screenshot?: string;
  logs?: string[];
}
```

### Error Boundaries

```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <YourAppContent />
    </ErrorBoundary>
  );
};
```

---

*This API documentation is generated from the current codebase and is updated regularly. For implementation details, see the source code and development documentation.*
