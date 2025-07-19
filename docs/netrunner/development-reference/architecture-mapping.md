# NetRunner Architecture Mapping

## System Overview

NetRunner is a modular OSINT platform with a clean separation between UI components and backend services. The architecture follows a hub-and-spoke pattern with the Control Station as the central coordinator.

## Component Architecture

```
NetRunnerControlStation (Main Hub)
├── NetRunnerLeftSideBar (AI Agent + PowerTools)
├── NetRunnerCenterView (Main Work Area)
├── NetRunnerRightSideBar (Results + Status)
└── NetRunnerBottomBar (Bot Roster)
```

## Service Layer

```
Services Layer
├── Core Services
│   ├── WebsiteScanner.ts (Website analysis)
│   ├── AdvancedOSINTCrawler.ts (Deep web crawling)
│   └── NetRunnerLogger.ts (Logging system)
├── Tools
│   ├── NetRunnerPowerTools.ts (OSINT tool definitions)
│   └── AdapterRegistry.ts (Tool adapter management)
└── Integration
    ├── WorkflowEngine.ts (Automation workflows)
    └── BotRosterIntegration.ts (Bot management)
```

## Data Flow Patterns

### Current (Broken) Flow
```
User Input → UI Component → Mock Response → Display
```

### Intended Flow
```
User Input → UI Component → Service Call → Real Data → Results Display
```

## Component-Service Mapping

| UI Component | Current State | Should Connect To | Purpose |
|--------------|---------------|-------------------|---------|
| NetRunnerCenterView | Mock scanning | WebsiteScanner + AdvancedOSINTCrawler | Source code display |
| PowerTools (Left) | Visual only | NetRunnerPowerTools + AdapterRegistry | Tool execution |
| Bot Roster (Bottom) | Mock data | WorkflowEngine + BotRosterIntegration | Automation |
| Results (Right) | Mock results | Real scan data from services | Intel display |

## Integration Points

### 1. Center View → Scanner Services
```typescript
// Current (NetRunnerCenterView.tsx:78)
setTimeout(() => setIsScanning(false), 3000); // MOCK

// Should be:
const result = await websiteScanner.scanWebsite(target, onProgress);
setCenterViewData(result);
```

### 2. PowerTools → Service Execution
```typescript
// Current: Visual button click only
// Should be:
const tool = await powerTools.executeTool(toolId, parameters);
const results = await tool.run();
```

### 3. Bot Roster → Automation Services
```typescript
// Current: Mock bot status display
// Should be:
const bot = await botRoster.deployBot(botConfig);
await workflowEngine.assignTask(bot, task);
```

### 4. Results Panel → Live Data Stream
```typescript
// Current: Static mock data
// Should be:
const resultStream = scannerService.getResultStream();
resultStream.onUpdate(data => updateResultsPanel(data));
```

## File Structure Map

```
src/applications/netrunner/
├── components/
│   ├── layout/           # UI Layout Components
│   │   ├── NetRunnerControlStation.tsx    ✅ Complete
│   │   ├── NetRunnerCenterView.tsx        ❌ Mock only
│   │   ├── NetRunnerLeftSideBar.tsx       ❌ No tool execution
│   │   ├── NetRunnerRightSideBar.tsx      ❌ Mock data
│   │   └── NetRunnerBottomBar.tsx         ❌ Mock bots
│   └── results/
│       └── WebCrawlerResults.tsx          ✅ Complete (not connected)
├── services/            # Backend Services
│   ├── WebsiteScanner.ts                  ✅ Complete implementation
│   ├── AdvancedOSINTCrawler.ts           ✅ Complete implementation
│   ├── logging/                           ✅ Complete
│   └── error/                             ✅ Complete
├── tools/
│   └── NetRunnerPowerTools.ts             ✅ Complete definitions
├── types/
│   └── NetRunnerTypes.ts                  ✅ Complete
└── NetRunnerApplication.tsx               ✅ Complete
```

## Critical Integration Gaps

1. **Center View Scanning** - No connection to WebsiteScanner
2. **Source Code Display** - Missing Monaco Editor integration
3. **PowerTool Execution** - Tools don't actually run
4. **Bot Automation** - Bots don't execute workflows
5. **Real-time Updates** - No live data streaming
6. **AI Agent Control** - No actual AI coordination

## Dependencies

### Required Integrations
- Monaco Editor (for source code display)
- WebSocket (for real-time updates)
- Service Workers (for background scanning)

### Service Dependencies
```typescript
// Center View needs:
import { websiteScanner } from '../services/WebsiteScanner';
import { advancedOSINTCrawler } from '../services/AdvancedOSINTCrawler';

// PowerTools need:
import { powerToolRegistry } from '../tools/NetRunnerPowerTools';

// Bot Roster needs:
import { workflowEngine } from '../integration/WorkflowEngine';
```

## Next Steps

1. Connect Center View to scanning services
2. Add Monaco Editor for source code display
3. Wire PowerTools to actual tool execution
4. Bridge Bot Roster to workflow automation
5. Implement real-time data streaming
6. Add AI Agent coordination logic

---
*Architecture analysis complete - All services exist, integration layer missing*
