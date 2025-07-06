# NetRunner Dashboard Documentation

**Status:** Active  
**Last Updated:** July 6, 2025

## Overview

The NetRunner Dashboard serves as the central interface for OSINT (Open Source Intelligence) operations within the Starcom App. It provides tools for gathering, analyzing, and visualizing information from various online sources, with a focus on creating a streamlined, efficient workflow for investigators and analysts.

## Features

### Current Implementation

- **Multi-source Search**: Search across multiple data sources simultaneously
- **Category Filtering**: Filter results by source category
- **Time-based Filtering**: Filter results by time range
- **Search History**: Track and recall previous searches
- **Result Visualization**: Display search results with confidence scoring
- **Mode Switching**: Toggle between basic and advanced search modes
- **Settings Management**: Configure search preferences and data sources

### Planned Features

- **Entity Extraction**: Identify and extract entities from search results
- **Relationship Mapping**: Visualize relationships between entities
- **Timeline Integration**: Add discovered events to the Timeline
- **Data Export**: Export search results in various formats
- **Advanced Filtering**: More granular control over search parameters
- **Dark Web Integration**: Access dark web sources (authenticated users only)
- **Blockchain Analysis**: Add cryptocurrency and blockchain data sources
- **OPSEC Tooling**: Operational security tools for sensitive investigations

## Architecture

The NetRunner Dashboard is built using the following components:

- **NetRunnerDashboard.tsx**: Main container component
- **useNetRunnerSearch.ts**: Custom hook for search functionality
- **netrunner.ts**: TypeScript definitions and interfaces

### Data Flow

1. User inputs search query and configures filters
2. Search request is processed through the `useNetRunnerSearch` hook
3. Results are fetched from configured data sources
4. Results are displayed in the dashboard with appropriate visualizations
5. User can interact with results, refine search, or export data

## Integration

The NetRunner Dashboard integrates with several other components of the Starcom App:

- **ViewContext**: For screen navigation and state management
- **Route Synchronization**: For URL-based navigation
- **GlobalHeader**: For global search integration
- **Timeline**: For adding events discovered during research
- **NodeWeb**: For adding entities and relationships to the network graph

## Migration Progress

The NetRunner Dashboard is being migrated from the legacy OSINT components. Current progress:

- [x] Basic search functionality implemented
- [x] Result display implemented
- [x] Category filtering implemented
- [x] Time range filtering implemented
- [x] Search history implemented
- [x] Mode switching implemented
- [ ] Entity extraction to be implemented
- [ ] Dark web integration to be implemented
- [ ] Blockchain analysis to be implemented
- [ ] OPSEC tools to be implemented

## Usage

To use the NetRunner Dashboard:

1. Navigate to the NetRunner screen from the bottom navigation bar
2. Enter a search query in the search field
3. Optionally select a category tab to filter results
4. View and interact with search results
5. Use the Advanced Mode for more detailed search options

## Future Development

Future development of the NetRunner Dashboard will focus on:

1. Integrating more data sources
2. Enhancing visualization capabilities
3. Adding machine learning for entity extraction and relationship mapping
4. Implementing automated report generation
5. Adding collaborative features for team investigations
