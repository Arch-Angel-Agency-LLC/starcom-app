# Feature Migration Mapping

This document tracks the migration of features from legacy components to the new UI architecture.

## NetRunner Dashboard Migration

### From OSINT Dashboard
| Feature | Status | Target Component | Notes |
|---------|--------|------------------|-------|
| Basic Search | ✅ Complete | NetRunnerDashboard | Implemented with useNetRunnerSearch hook |
| Advanced Filtering | ✅ Complete | NetRunnerDashboard | FilterPanel component with source selection |
| Result Display | ✅ Complete | NetRunnerDashboard | Material UI cards implementation |
| Entity Extraction | ✅ Complete | NetRunnerDashboard | EntityExtractor component |
| Dark Web Sources | 🔄 Planned | NetRunnerDashboard | To be implemented |
| Blockchain Analysis | 🔄 Planned | NetRunnerDashboard | To be implemented |
| OPSEC Shield | 🔄 Planned | NetRunnerDashboard | To be implemented |
| Data Export | 🔄 Planned | NetRunnerDashboard | To be implemented |

### From PowerHunt
| Feature | Status | Target Component | Notes |
|---------|--------|------------------|-------|
| Entity Search | ⏳ In Progress | NetRunnerDashboard | Basic implementation started |
| Domain Analysis | 🔄 Planned | NetRunnerDashboard | To be implemented |
| IP Investigation | 🔄 Planned | NetRunnerDashboard | To be implemented |
| Social Media Analysis | 🔄 Planned | NetRunnerDashboard | To be implemented |
| Metadata Extraction | 🔄 Planned | NetRunnerDashboard | To be implemented |

## Analyzer Dashboard Migration

### From InfoAnalysis
| Feature | Status | Target Component | Notes |
|---------|--------|------------------|-------|
| Data Import | 🔄 Planned | AnalyzerDashboard | To be implemented |
| Analysis Tools | 🔄 Planned | AnalyzerDashboard | To be implemented |
| Visualization | 🔄 Planned | AnalyzerDashboard | To be implemented |
| Report Generation | 🔄 Planned | AnalyzerDashboard | To be implemented |
| Machine Learning | 🔄 Planned | AnalyzerDashboard | To be implemented |

## NodeWeb Visualizer Migration

### From NodeWeb Legacy
| Feature | Status | Target Component | Notes |
|---------|--------|------------------|-------|
| Graph Visualization | 🔄 Planned | NodeWebScreen | To be implemented |
| Node/Edge Creation | 🔄 Planned | NodeWebScreen | To be implemented |
| Layout Algorithms | 🔄 Planned | NodeWebScreen | To be implemented |
| Filtering | 🔄 Planned | NodeWebScreen | To be implemented |
| Data Import/Export | 🔄 Planned | NodeWebScreen | To be implemented |

## Timeline Dashboard Migration

### From Timeline Legacy
| Feature | Status | Target Component | Notes |
|---------|--------|------------------|-------|
| Timeline Visualization | 🔄 Planned | TimelineScreen | To be implemented |
| Event Creation | 🔄 Planned | TimelineScreen | To be implemented |
| Filtering | 🔄 Planned | TimelineScreen | To be implemented |
| Correlation Analysis | 🔄 Planned | TimelineScreen | To be implemented |

## Legend
- ✅ Complete: Feature has been fully migrated and implemented
- ⏳ In Progress: Migration has started but is not complete
- 🔄 Planned: Migration is planned but not yet started
- ❌ Blocked: Migration is blocked by dependencies
