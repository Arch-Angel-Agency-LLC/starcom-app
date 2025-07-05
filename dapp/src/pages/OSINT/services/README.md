# OSINT Services

This directory contains all the service modules required for the OSINT Cyber Investigation Suite.

## Directory Structure

```
services/
├── api/                      # API integration layer
│   ├── endpoints.ts          # API endpoint definitions
│   └── osintApi.ts           # Base API client
├── search/                   # Search services
│   └── searchService.ts      # Universal search orchestrator
├── graph/                    # Graph data services
│   └── graphService.ts       # Graph data management
├── timeline/                 # Timeline services
│   └── timelineService.ts    # Timeline data management
├── investigation/            # Investigation services
│   └── investigationService.ts # Investigation management
└── index.ts                  # Service exports for easier imports
```

## Service Overview

### API Services

- `osintApi.ts`: Base API client for making HTTP requests to the backend
- `endpoints.ts`: Centralized definitions of all API endpoints

### Search Services

- `searchService.ts`: Handles universal search across multiple data sources

### Graph Services

- `graphService.ts`: Manages entity graph data and visualization

### Timeline Services

- `timelineService.ts`: Handles timeline data and event correlation

### Investigation Services

- `investigationService.ts`: Manages investigation data and operations

## Usage

Import services from the index file:

```typescript
import { 
  searchService, 
  graphService, 
  timelineService,
  investigationService 
} from '../services';
```

Or import specific services directly:

```typescript
import { searchService } from '../services/search/searchService';
```

## Mock Data

During development, all services return mock data when the application is running in development mode. Once a backend is implemented, the services will automatically connect to real data sources.
