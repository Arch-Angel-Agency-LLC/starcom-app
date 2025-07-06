# Feature Migration Mapping

**Status:** Active  
**Last Updated:** July 6, 2025

This document maps the migration path for features from the current Starcom App architecture to the new modular architecture. Use this as a reference to ensure all functionality is properly accounted for during the migration process.

## Overview

The migration involves reorganizing existing functionality into a more modular, intuitive structure while preserving and enhancing capabilities. This document provides a comprehensive mapping between current locations and new destinations for all major features.

## Core Feature Migration

| Current Feature | Current Location | New Location | Migration Notes |
|-----------------|------------------|--------------|----------------|
| **3D Globe Visualization** | MainPage | GlobeScreen | Move globe components, controls, and data layers |
| **Main Navigation** | BottomBar | MainBottomBar | Redesign with new screen-based navigation |
| **Chat Interface** | Various Locations | Chat System (in MainPage) | Consolidate into unified system |
| **Settings** | SettingsPage | SettingsPage (restructured) | Reorganize into logical categories |

## OSINT Features Migration

| Current Feature | Current Location | New Location | Migration Notes |
|-----------------|------------------|--------------|----------------|
| **Data Collection Tools** | PowerHunt | NetRunner Screen | Extract tools focused on gathering information |
| **Search Interface** | OSINT Dashboard | NetRunner Screen | ✓ Basic search implementation complete |
| **Source Management** | PowerHunt | NetRunner Screen | Move source configuration and management |
| **Query Builders** | PowerHunt | NetRunner Screen | Migrate query creation interfaces |
| **Data Extraction** | PowerHunt | NetRunner Screen | Move extraction tools and workflows |
| **Analysis Workbench** | PowerHunt | Analyzer Screen | Migrate analysis tools and visualizations |
| **Pattern Recognition** | PowerHunt | Analyzer Screen | Move pattern detection algorithms and UI |
| **Report Generation** | PowerHunt | Analyzer Screen | Migrate reporting tools |
| **Network Mapping** | Various | NodeWeb Screen | Consolidate network visualization tools |
| **Relationship Analysis** | Various | NodeWeb Screen | Move relationship mapping functionality |
| **Timeline Construction** | Various | Timeline Screen | Consolidate chronological visualization tools |
| **Event Analysis** | Various | Timeline Screen | Move event analysis functionality |

## Case Management Migration

| Current Feature | Current Location | New Location | Migration Notes |
|-----------------|------------------|--------------|----------------|
| **Case Creation** | CyberInvestigation | CaseManager Screen | Move case initialization workflow |
| **Case Overview** | CyberInvestigation | CaseManager Screen | Migrate case summary visualization |
| **Evidence Management** | CyberInvestigation | CaseManager Screen | Move evidence tools and interfaces |
| **Investigation Workflow** | CyberInvestigation | CaseManager Screen | Migrate workflow management |

## Team Collaboration Migration

| Current Feature | Current Location | New Location | Migration Notes |
|-----------------|------------------|--------------|----------------|
| **Team Dashboard** | Teams | Teams Screen | Move team overview functionality |
| **Member Management** | Teams | Teams Screen | Migrate member tools and interfaces |
| **Resource Sharing** | Teams | Teams Screen | Move sharing functionality |
| **Team Communication** | Various | Teams Screen | Consolidate team chat and messaging |

## AI & Automation Migration

| Current Feature | Current Location | New Location | Migration Notes |
|-----------------|------------------|--------------|----------------|
| **AI Assistants** | Various | AI Agent Screen | Consolidate AI management |
| **Agent Configuration** | Various | AI Agent Screen | Move configuration interfaces |
| **Automated Tasks** | Various | BotRoster Screen | Consolidate automation tools |
| **Task Scheduling** | Various | BotRoster Screen | Move scheduling functionality |

## Data Visualization Migration

| Current Feature | Current Location | New Location | Migration Notes |
|-----------------|------------------|--------------|----------------|
| **Chart Generation** | Various | Analyzer Screen | Consolidate charting tools |
| **Geographic Mapping** | Various | GlobeScreen | Move geospatial visualization |
| **Network Graphs** | Various | NodeWeb Screen | Consolidate graph visualization |
| **Temporal Visualization** | Various | Timeline Screen | Move time-based visualization |

## State Management Migration

| Current State | Current Management | New Management | Migration Notes |
|---------------|-------------------|----------------|----------------|
| **View State** | Component State | ViewContext | Centralize in context provider |
| **User Preferences** | localStorage | SettingsContext | Create dedicated context |
| **Authentication** | AuthContext | AuthContext (unchanged) | Keep existing implementation |
| **Data Cache** | Various | DataContext | Consolidate in dedicated context |

## API Integration Migration

| Current Integration | Current Implementation | New Implementation | Migration Notes |
|---------------------|------------------------|-------------------|----------------|
| **Data Sources** | Direct API calls | Service Layer | Create abstraction layer |
| **Authentication** | AuthService | AuthService (unchanged) | Keep existing implementation |
| **Real-time Updates** | Direct WebSocket | Service Layer | Abstract connection management |

## Component Dependencies

This section maps the dependencies between components that need to be considered during migration:

### GlobeScreen Dependencies
- Data layer services
- Location services
- 3D rendering utilities

### NetRunner Screen Dependencies
- Data collection services
- Source management utilities
- Query building components

### Analyzer Screen Dependencies
- Analysis algorithms
- Visualization libraries
- Reporting services

### NodeWeb Screen Dependencies
- Graph visualization libraries
- Data relationship services
- Interaction handlers

### Timeline Screen Dependencies
- Temporal data services
- Event handling utilities
- Chronology algorithms

### CaseManager Screen Dependencies
- Case data services
- Evidence management utilities
- Workflow components

## Migration Order Recommendation

To minimize disruption and ensure dependencies are properly handled, the following migration order is recommended:

1. **Foundation Components**
   - ViewContext
   - App Container
   - MainPage structure
   - Navigation components

2. **Core Screens**
   - GlobeScreen (most users' entry point)
   - NetRunner Screen (primary OSINT replacement)
   - Analyzer Screen (primary analysis tools)

3. **Supporting Screens**
   - NodeWeb Screen
   - Timeline Screen
   - CaseManager Screen

4. **Collaborative Screens**
   - Teams Screen
   - AI Agent Screen
   - BotRoster Screen

5. **Settings and Configuration**
   - SettingsPage and its screens

## Testing Considerations

During migration, particular attention should be paid to testing:

1. **Data Flow Continuity** - Ensure data moves correctly between screens
2. **State Preservation** - Verify state is maintained during navigation
3. **Performance Impact** - Monitor for any performance regression
4. **Authentication Boundaries** - Test protected routes and permissions

## Related Documentation

- [Implementation Guide](./implementation-guide.md)
- [Component Migration Checklist](./component-migration-checklist.md)
- [Progress Tracker](./progress-tracker.md)
- [Implementation Checklist](./implementation-checklist.md)
