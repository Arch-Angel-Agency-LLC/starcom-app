# NetRunner-OSINT Integration Implementation Guide

**Date:** July 11, 2025  
**Phase:** Immediate Implementation Plan  
**Status:** Ready to Execute  

## Implementation Strategy

Based on the discovery of a complete OSINT platform in `src/pages/OSINT/`, the optimal approach is to **enhance the existing OSINT platform** with NetRunner's specific tools and cyberpunk theming, rather than trying to fix NetRunner's broken functionality.

## Phase 1: Environment Setup & API Integration (Week 1)

### Step 1.1: Create Unified API Configuration

Create a comprehensive API configuration system that works with both platforms:

```typescript
// Create: src/shared/config/ApiConfigManager.ts
interface UnifiedApiConfig {
  // Working APIs (already functional in codebase)
  weather: { apiKey: string; baseUrl: string };
  financial: { apiKey: string; baseUrl: string };
  conflicts: { apiKey: string; baseUrl: string };
  
  // OSINT APIs (to be implemented)
  shodan: { apiKey: string; baseUrl: string };
  virustotal: { apiKey: string; baseUrl: string };
  censys: { apiKey: string; baseUrl: string };
  hunter: { apiKey: string; baseUrl: string };
  theharvester: { enabled: boolean; path: string };
}
```

### Step 1.2: Environment Configuration

Create environment variables for all APIs:

```bash
# Create: .env.local
# Working APIs
VITE_OPENWEATHERMAP_API_KEY=your_weather_key
VITE_ALPHA_VANTAGE_API_KEY=your_financial_key
VITE_ACLED_API_KEY=your_conflict_key

# OSINT Tool APIs
VITE_SHODAN_API_KEY=your_shodan_key
VITE_VIRUSTOTAL_API_KEY=your_virustotal_key
VITE_CENSYS_API_ID=your_censys_id
VITE_CENSYS_SECRET=your_censys_secret
VITE_HUNTER_API_KEY=your_hunter_key

# Internal APIs
VITE_STARCOM_API_URL=https://api.starcom.app
VITE_OSINT_API_URL=https://api.starcom.app/osint
```

### Step 1.3: Test Existing OSINT Platform

Navigate to the existing OSINT dashboard and test current functionality:

```bash
# In browser, navigate to:
http://localhost:5175/ 
# Look for OSINT navigation option or direct access
```

## Phase 2: Tool Adapter Integration (Week 1-2)

### Step 2.1: Port NetRunner's Shodan Adapter to OSINT

The NetRunner Shodan adapter has real API integration. Port it to OSINT:

```typescript
// Create: src/pages/OSINT/services/adapters/ShodanAdapter.ts
import { ShodanAdapter as NetRunnerShodanAdapter } from '../../../applications/netrunner/tools/adapters/ShodanAdapter';

export class OSINTShodanAdapter {
  private netrunnerAdapter: NetRunnerShodanAdapter;
  
  constructor() {
    this.netrunnerAdapter = new NetRunnerShodanAdapter();
  }
  
  async search(query: string): Promise<OSINTSearchResult[]> {
    const result = await this.netrunnerAdapter.execute({
      toolId: 'shodan',
      parameters: { query },
      correlationId: `osint-${Date.now()}`
    });
    
    return this.transformToOSINTFormat(result);
  }
}
```

### Step 2.2: Create Tool Adapter Registry for OSINT

```typescript
// Create: src/pages/OSINT/services/adapters/AdapterRegistry.ts
import { OSINTShodanAdapter } from './ShodanAdapter';
import { OSINTVirusTotalAdapter } from './VirusTotalAdapter';

export class OSINTAdapterRegistry {
  private adapters = new Map<string, any>();
  
  constructor() {
    this.registerAdapters();
  }
  
  private registerAdapters() {
    this.adapters.set('shodan', new OSINTShodanAdapter());
    this.adapters.set('virustotal', new OSINTVirusTotalAdapter());
  }
  
  getAdapter(toolId: string) {
    return this.adapters.get(toolId);
  }
}
```

### Step 2.3: Enhance OSINT Search Service

Modify the existing OSINT search service to use real tool adapters:

```typescript
// Modify: src/pages/OSINT/services/search/searchService.ts
import { OSINTAdapterRegistry } from '../adapters/AdapterRegistry';

class SearchService {
  private adapterRegistry = new OSINTAdapterRegistry();
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Keep existing mock data for development
    if (process.env.NODE_ENV === 'development' && !query.useRealApis) {
      return this.getMockResults(query);
    }
    
    // Use real adapters when available
    const results: SearchResult[] = [];
    
    for (const source of query.sources || ['entities']) {
      const adapter = this.adapterRegistry.getAdapter(source);
      if (adapter) {
        try {
          const adapterResults = await adapter.search(query.text);
          results.push(...adapterResults);
        } catch (error) {
          console.error(`Error with ${source} adapter:`, error);
          // Continue with other adapters
        }
      }
    }
    
    return this.rankAndFilterResults(results, query);
  }
}
```

## Phase 3: UI Enhancement & Theming (Week 2-3)

### Step 3.1: Apply NetRunner Cyberpunk Theme to OSINT

Create a theme bridge to apply NetRunner's styling:

```css
/* Create: src/pages/OSINT/styles/netrunner-theme.css */
:root {
  /* NetRunner Color Palette */
  --netrunner-cyan: #00f5ff;
  --netrunner-green: #00ff88;
  --netrunner-purple: #8b5cf6;
  --netrunner-orange: #ff8c00;
  --netrunner-red: #ff0066;
  --netrunner-background: #000000;
  --netrunner-surface: #1a1a1a;
  --netrunner-border: #404040;
  
  /* Apply to OSINT components */
  --osint-primary: var(--netrunner-cyan);
  --osint-success: var(--netrunner-green);
  --osint-warning: var(--netrunner-orange);
  --osint-danger: var(--netrunner-red);
  --osint-background: var(--netrunner-background);
  --osint-surface: var(--netrunner-surface);
}

/* NetRunner Typography */
.netrunner-theme {
  font-family: 'Aldrich', monospace;
  background-color: var(--netrunner-background);
  color: #ffffff;
}

/* Glowing Effects */
.netrunner-glow {
  text-shadow: 0 0 10px currentColor;
}

.netrunner-panel {
  background: var(--netrunner-surface);
  border: 1px solid var(--netrunner-border);
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.1);
}
```

### Step 3.2: Create NetRunner-Themed OSINT Components

```typescript
// Create: src/pages/OSINT/components/NetRunnerOSINTDashboard.tsx
import React from 'react';
import { OSINTDashboard } from './OSINTDashboard';
import '../styles/netrunner-theme.css';

export const NetRunnerOSINTDashboard: React.FC = () => {
  return (
    <div className="netrunner-theme">
      <div className="netrunner-panel">
        <OSINTDashboard />
      </div>
    </div>
  );
};
```

### Step 3.3: Add NetRunner-Style Tool Panels

Create new panel types that match NetRunner's tool interface:

```typescript
// Create: src/pages/OSINT/components/panels/ToolAdapterPanel.tsx
import React, { useState } from 'react';
import { Terminal, Bot, Activity } from 'lucide-react';

interface ToolAdapterPanelProps {
  data: Record<string, unknown>;
  panelId: string;
}

export const ToolAdapterPanel: React.FC<ToolAdapterPanelProps> = ({ data }) => {
  const [selectedTool, setSelectedTool] = useState<string>('shodan');
  
  const tools = [
    { id: 'shodan', name: 'Shodan', icon: Terminal, status: 'active' },
    { id: 'virustotal', name: 'VirusTotal', icon: Bot, status: 'active' },
    { id: 'theharvester', name: 'TheHarvester', icon: Activity, status: 'inactive' },
  ];
  
  return (
    <div className="netrunner-panel tool-adapter-panel">
      <div className="panel-header">
        <h3 className="netrunner-glow">OSINT Tool Adapters</h3>
      </div>
      
      <div className="tool-grid">
        {tools.map(tool => (
          <div 
            key={tool.id}
            className={`tool-card ${selectedTool === tool.id ? 'selected' : ''}`}
            onClick={() => setSelectedTool(tool.id)}
          >
            <tool.icon className="tool-icon" />
            <span className="tool-name">{tool.name}</span>
            <span className={`tool-status ${tool.status}`}>{tool.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Phase 4: Router Integration (Week 3)

### Step 4.1: Update NetRunner Application Router

Modify NetRunner to redirect to the enhanced OSINT platform:

```typescript
// Modify: src/applications/netrunner/NetRunnerApplication.tsx
import React from 'react';
import { NetRunnerOSINTDashboard } from '../../pages/OSINT/components/NetRunnerOSINTDashboard';

const NetRunnerApp: React.FC<ApplicationContext> = ({ className, ...context }) => {
  return (
    <div className={className}>
      <NetRunnerOSINTDashboard />
    </div>
  );
};

export default NetRunnerApp;
```

### Step 4.2: Update Main Application Router

Ensure the `/netrunner` route properly loads the enhanced platform:

```typescript
// Modify: src/routes/routes.tsx
// NetRunner route should load the enhanced OSINT platform
<Route path="netrunner" element={null} /> // Handled by MainPage routing
```

## Phase 5: Testing & Validation (Week 3-4)

### Step 5.1: Create Integration Tests

```typescript
// Create: src/pages/OSINT/__tests__/NetRunnerIntegration.test.tsx
import { render, screen } from '@testing-library/react';
import { NetRunnerOSINTDashboard } from '../components/NetRunnerOSINTDashboard';

describe('NetRunner-OSINT Integration', () => {
  test('loads NetRunner-themed OSINT dashboard', () => {
    render(<NetRunnerOSINTDashboard />);
    expect(screen.getByText(/OSINT Tool Adapters/i)).toBeInTheDocument();
  });
  
  test('Shodan adapter integration works', async () => {
    // Test real Shodan API integration
  });
});
```

### Step 5.2: Manual Testing Checklist

- [ ] NetRunner route loads enhanced OSINT dashboard
- [ ] Cyberpunk theme applied correctly
- [ ] Real API calls work (with API keys configured)
- [ ] Tool adapters return actual data
- [ ] Error handling works for failed API calls
- [ ] Performance is acceptable (< 10 seconds for searches)

## Quick Start Implementation

### Immediate Actions (Today)

1. **Create API configuration file**
2. **Set up environment variables for APIs you have keys for**
3. **Test existing OSINT platform in browser**
4. **Create NetRunner theme CSS file**

### Week 1 Tasks

1. **Port Shodan adapter to OSINT service**
2. **Create adapter registry for OSINT**
3. **Apply NetRunner theming to OSINT components**
4. **Update NetRunner application to use enhanced OSINT**

### Week 2-3 Tasks

1. **Implement additional tool adapters (VirusTotal, etc.)**
2. **Add tool status monitoring to UI**
3. **Create bot automation panels**
4. **Performance optimization**

## Success Criteria

### Functional Requirements
- ✅ Real API integration (no mock data in production)
- ✅ Cyberpunk NetRunner theming applied
- ✅ Tool adapters returning live data
- ✅ Error handling for API failures
- ✅ Performance under 10 seconds for basic searches

### User Experience Requirements
- ✅ Seamless navigation from NetRunner route
- ✅ Familiar NetRunner UI patterns and colors
- ✅ Professional OSINT functionality
- ✅ Clear status indicators for tool availability

## Risk Mitigation

### Technical Risks
1. **API Rate Limits**: Implement caching and request queuing
2. **API Key Management**: Secure storage and rotation
3. **Performance**: Set realistic expectations for real API response times

### Integration Risks
1. **UI Consistency**: Use systematic theming approach
2. **Component Conflicts**: Namespace NetRunner components properly
3. **Route Conflicts**: Ensure proper router configuration

This implementation plan leverages the existing, functional OSINT platform and enhances it with NetRunner's specific tools and theming, providing the fastest path to authentic functionality.
