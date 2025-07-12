# NetRunner Dashboard

## Overview
The NetRunner Dashboard serves as the central hub for network exploration and OSINT gathering in the Starcom application. It provides advanced search capabilities, entity extraction, and intelligence gathering tools in a unified interface.

## Current Implementation

### Components
- **NetRunnerDashboard**: Main component with search functionality
- **useNetRunnerSearch**: Custom hook for search operations
- **FilterPanel**: Advanced filtering component
- **EntityExtractor**: Entity extraction and display component
- **SearchResult** and related types: Type definitions for search functionality

### Features Implemented
- Basic search functionality with query input
- Tab system for different search modes
- Results display with Material UI cards
- Search history tracking
- Advanced filtering options with source selection
- Entity extraction and classification
- Two-column layout for results and entity analysis

### Screens
- The NetRunnerScreen component loads the NetRunnerDashboard
- Integrated with the main UI via the ScreenLoader component

## Planned Features

### Short Term
- ~~Advanced filtering panel with source selection~~ ✅
- ~~Entity extraction from search results~~ ✅
- Integration with dark web sources
- Integration with blockchain analysis tools
- OPSEC shield for secure searching
- Data export functionality

### Medium Term
- Custom search templates
- Saved searches with notifications
- Integration with third-party intelligence sources
- Automated reconnaissance workflows
- Report generation

### Long Term
- Machine learning for entity relationship mapping
- Predictive analysis based on search patterns
- Integration with external OSINT tools via API
- Collaborative search sessions

## Component Structure

```
NetRunnerScreen
└── NetRunnerDashboard
    ├── SearchBar
    ├── FilterPanel
    ├── TabNavigation
    ├── ResultsDisplay
    │   └── ResultCard
    └── EntityExtractor
        ├── EntityTypeSection
        └── EntityItem
```

## API Usage

The NetRunnerDashboard uses the following APIs:
- Internal search API via useNetRunnerSearch hook
- Entity extraction service
- Source selection and management

## Code Examples

### Basic Search Implementation
```typescript
// Inside NetRunnerDashboard component
const { query, setQuery, results, isSearching, search } = useNetRunnerSearch({
  initialSources: ['web', 'social', 'news'],
  maxResults: 50,
  autoSearch: false
});

// Search handler
const handleSearch = async () => {
  if (query.trim()) {
    await search();
  }
};
```

## Integration Points

The NetRunnerDashboard integrates with:
- ViewContext for navigation and screen state
- RouteSynchronizer for URL-based navigation
- NodeWeb for visualization of search results
- Analyzer for deeper analysis of findings

## Next Development Steps

1. ~~Complete the filtering panel implementation~~ ✅
2. ~~Implement entity extraction functionality~~ ✅
3. Add dark web and blockchain sources
4. Integrate with NodeWeb for visualization
5. Implement data export functionality
