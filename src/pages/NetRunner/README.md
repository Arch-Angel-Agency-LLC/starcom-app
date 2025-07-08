# NetRunner Module

## Overview
NetRunner is an advanced OSINT (Open Source Intelligence) and intelligence gathering system designed for the Starcom dApp. It provides a comprehensive set of tools for producing, analyzing, and trading "Intel" (blockchain-based, tradable commodity) within the Starcom ecosystem. This system integrates with the BotRoster, IntelAnalyzer, and Intelligence Exchange Marketplace.

![NetRunner Banner](../StarcomApp-Banner-w1024px.png)

## Core Components

### 1. Power Tools Module
The power tools module (`NetRunnerPowerTools.ts`) defines a collection of OSINT tools available in the NetRunner system:

- **Tool Interface**: Defines the structure and capabilities of each tool.
- **Tool Categories**: Discovery, scraping, aggregation, analysis, verification, visualization, automation.
- **Intel Types**: Identity, network, financial, geospatial, social, infrastructure, vulnerability, darkweb, threat, temporal.
- **Tool Execution**: Framework for executing tools and processing results.

### 2. Adapter System
The adapter system connects the NetRunner interface to actual tool implementations:

- **BaseAdapter**: Abstract base class for all tool adapters.
- **ShodanAdapter**: Example implementation for the Shodan OSINT tool.
- **AdapterRegistry**: Manages registration and access to tool adapters.

### 3. UI Components
- **ToolExecutionPanel**: React component for executing a tool and displaying results.
- **GridWrapper/ListItemWrapper**: Utility components to handle MUI compatibility issues.
- **Dashboard**: Main interface for the NetRunner system.

### 4. Hooks
- **useToolExecution**: Custom React hook for tool execution and state management.

## Implementation Status

- ✅ Core interfaces and tool collection defined
- ✅ Base adapter and Shodan adapter implemented
- ✅ Tool execution UI components created
- ✅ TypeScript configuration and compatibility issues resolved
- 🔄 Additional tool adapters to be implemented
- 🔄 Dashboard UI integration in progress
- 🔄 Backend integration with intelligence marketplace pending

## Operational Modes

The NetRunner interface supports several operational modes:

1. **Power Tools Mode**: Direct access to individual OSINT tools
2. **Bot Automation Mode**: Automated intelligence gathering using the BotRoster
3. **Intel Analysis Mode**: Processing and analysis of collected intelligence
4. **Marketplace Mode**: Trading of intelligence products
5. **Monitoring Mode**: Continuous surveillance of specified targets

## Development Guide

See the following documentation files for development guidelines:

- `docs/NETRUNNER-TYPESCRIPT-FIXES.md`: TypeScript compatibility solutions
- `docs/CHAT-CONSOLIDATION-MASTER-ROADMAP.md`: Overall project roadmap

## Testing

Use the `test-netrunner-tools.sh` script to validate the NetRunner implementation:

```bash
./test-netrunner-tools.sh
```

This script verifies the existence of required files and checks TypeScript compilation.
The Power Tools component provides access to a variety of OSINT tools that can be used to gather intelligence from various sources. These tools are categorized by function:
- Discovery tools for finding information
- Scraping tools for collecting data
- Aggregation tools for consolidating information
- Analysis tools for processing data
- Verification tools for validating intelligence
- Visualization tools for presenting information

### 2. Bot Automation
The Bot Automation component (integrated with BotRoster) allows users to automate intelligence gathering and analysis tasks. Bots can be configured to:
- Run continuous monitoring operations
- Execute complex workflows using multiple tools
- Process and filter intelligence data
- Generate reports automatically

### 3. Intel Analysis
The Intel Analysis component (integrated with IntelAnalyzer) provides tools for processing raw data into structured intelligence. Features include:
- Intelligence report creation and management
- Entity extraction and relationship mapping
- Verification and validation of intelligence
- Classification and categorization of intelligence
- Collaboration and sharing features

### 4. Intelligence Exchange Marketplace
The Intelligence Exchange Marketplace provides a platform for trading intelligence as a commodity within the Starcom ecosystem. Features include:
- Listing and browsing intelligence reports
- Buying and selling intelligence using tokens
- Rating and reviewing intelligence quality
- Tracking market trends and analytics
- Escrow system for secure transactions

### 5. Monitoring System
The Monitoring System allows for continuous intelligence gathering on specified targets. Features include:
- Real-time monitoring of various sources
- Alerting based on significance thresholds
- Scheduling and frequency configuration
- Results filtering and aggregation
- Historical data analysis

## Getting Started

### Prerequisites
- Node.js 16+
- NPM 8+
- A modern web browser

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the application: `npm run build`
4. Start the development server: `npm run dev`

### Testing
Use the test script to validate the NetRunner module functionality:
```bash
./test-netrunner.sh
```

## Usage Examples

### Basic Search
```typescript
import { useNetRunnerSearch } from './hooks/useNetRunnerSearch';

// In your component
const {
  query,
  setQuery,
  search,
  results
} = useNetRunnerSearch();

// Set query and search
setQuery('example search');
await search();
console.log(results);
```

### Power Tools
```typescript
import { findToolsByCategory } from './tools/NetRunnerPowerTools';

// Get all discovery tools
const discoveryTools = findToolsByCategory('discovery');
```

### Creating an Intel Report
```typescript
import { createIntelReport } from './models/IntelReport';

// Create a new report
const report = createIntelReport(
  'Report Title',
  'Summary of findings',
  'Detailed description',
  'user-123',
  'Agent Smith',
  'CONFIDENTIAL',
  ['threat', 'infrastructure']
);
```

## License
This module is part of the Starcom dApp and is covered by its license.
