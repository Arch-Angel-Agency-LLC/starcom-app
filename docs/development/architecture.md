# System Architecture Documentation
**Last Updated**: June 22, 2025  
**Status**: Living Document

---

## Overview

Starcom MK2 is a React/TypeScript application providing real-time intelligence analysis with a sophisticated HUD interface, 3D globe visualization, and AI-powered testing capabilities.

## Core Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: React Context + Custom Hooks
- **3D Visualization**: Three.js (Globe Engine)
- **Testing**: Vitest + Playwright + Custom AI Testing Framework
- **Build**: Vite with TypeScript compilation

### Application Structure
```
src/
├── components/          # React components
│   ├── HUD/            # Heads-Up Display interface
│   ├── Globe/          # 3D globe visualization
│   ├── Bridge/         # Context management
│   └── Testing/        # AI testing infrastructure
├── layouts/            # Page layouts
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

## HUD System Architecture

### Component Hierarchy
```
HUDLayout
├── TopBar (Status/Data Marquee)
├── BottomBar (Contextual Information)
├── LeftSideBar (Controls/Navigation)
├── RightSideBar (Mission Control)
├── Corners (Specialized Functions)
└── Center (Globe/Timeline/NodeGraph)
```

### State Flow Pattern
```
LEFT SIDE → CENTER → RIGHT SIDE
    ↓         ↓         ↓
    ↓    BOTTOM BAR ←──┘
    ↓         ↓
    └─→ TOP BAR
```

### Zone Responsibilities
- **Left Side**: Context control, data layers, operation modes
- **Right Side**: Mission control, external apps, intelligence hub  
- **Top Bar**: Global status, data feeds, system health
- **Bottom Bar**: Deep context, detailed information panels
- **Center**: Main visualization (Globe, Timeline, Node graphs)
- **Corners**: Specialized functions (auth, reports, quick actions)

## Data Integration

### NOAA Space Weather Integration
- Real-time space weather data visualization
- Geomagnetic field overlays on 3D globe
- Solar flare and aurora prediction displays
- Performance-optimized data streaming

### Data Flow Architecture
```
External APIs → Data Services → Context Providers → Components
     ↓              ↓              ↓               ↓
   NOAA API    → DataService  → GlobalContext → HUD Components
   Market Data → FinanceAPI   → FeatureFlags → TopBar Marquee
   Weather     → WeatherAPI  → StateManager → Visualizations
```

## Feature Flag System

### Architecture
- Centralized feature flag management
- Local storage persistence
- React hook integration
- Development vs production configurations

### Categories
- Core System Features
- AI Integration Features  
- Collaboration Features
- Security Features
- Performance Optimizations
- Development/Testing Tools

## AI Testing Framework

### Components
- **AgentInterface**: Core orchestration layer
- **ComponentDetectors**: Multiple detection strategies
- **SafetyMonitor**: Resource monitoring and protection
- **WorkflowEngine**: Automated user journey testing
- **TestOrchestrator**: Test scenario management

### Safety Architecture
- Memory limit monitoring (2GB default)
- Execution timeout protection (5 min default)
- Output monitoring to prevent infinite loops
- Emergency stop mechanisms
- Context lifecycle management

## Performance Considerations

### Optimization Strategies
- Lazy loading for non-critical components
- Feature flag-based conditional rendering
- Efficient re-rendering with React.memo
- Globe rendering optimization
- Data streaming vs batch loading

### Monitoring
- Real-time performance metrics
- Memory usage tracking
- Network request monitoring
- Component render profiling
- User interaction analytics

## Security Architecture

### Authentication
- Web3 wallet integration
- Traditional email/password fallback
- Session management
- Role-based access control

### Data Protection
- Client-side encryption for sensitive data
- Secure API communication
- Input validation and sanitization
- XSS and CSRF protection

## Development Workflow

### Testing Strategy
- Unit tests with Vitest
- Integration tests with React Testing Library
- E2E tests with Playwright
- AI-powered autonomous UI testing
- Performance regression testing

### Build & Deployment
- TypeScript compilation with strict mode
- ESLint for code quality
- Vite for fast development and optimized builds
- Feature flag controls for gradual rollouts
- Environment-specific configurations

## Extension Points

### Plugin Architecture
- Floating panel system for modular UI
- Hook-based data integration
- Component composition patterns
- Context provider stacking
- Feature flag-driven capabilities

### Integration Capabilities
- External API integration framework
- Real-time data streaming
- Multi-provider authentication
- Cross-application communication
- Intelligence marketplace connectivity

---

*This document consolidates information from previous HUD architecture, system design, and implementation documents.*
