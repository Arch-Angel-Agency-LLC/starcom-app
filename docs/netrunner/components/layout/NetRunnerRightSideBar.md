# NetRunnerRightSideBar Component

## Overview

The NetRunnerRightSideBar serves as the OSINT Results Navigator, providing intelligent browsing and management of reconnaissance data with priority-based organization and actionable navigation controls.

## Component Specification

### Purpose
- OSINT results display and navigation
- Target priority ranking and management
- Intelligence category filtering and organization
- Action-oriented result interaction

### Props Interface
```typescript
interface NetRunnerRightSideBarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  crawlResults?: CrawlResult[];
  selectedTargets?: string[];
  onTargetSelect?: (targetId: string) => void;
  onNavigateToTarget?: (target: CrawlTarget) => void;
  filterConfig?: FilterConfiguration;
  onFilterChange?: (config: FilterConfiguration) => void;
}
```

### State Management
```typescript
interface RightSideBarState {
  selectedCategory: IntelligenceCategory;
  sortCriteria: SortCriteria;
  activeFilters: ActiveFilters;
  expandedSections: string[];
  targetQueue: TargetQueue;
}
```

## Key Features

### 1. **OSINT Results Roster**
- Hierarchical result organization
- Real-time result updates
- Priority-based sorting
- Category-based grouping

### 2. **Target Priority Ranking**
- Threat-level prioritization
- Intelligence value scoring
- Custom priority assignment
- Dynamic ranking updates

### 3. **Category Filtering**
- Intelligence type filtering
- Source-based filtering
- Time-based filtering
- Custom filter creation

### 4. **Navigation Actions**
- Quick target navigation
- Bulk action operations
- Export and sharing
- Integration with other tools

## Implementation Details

### Component Structure
```typescript
export const NetRunnerRightSideBar: React.FC<NetRunnerRightSideBarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  crawlResults = [],
  selectedTargets = [],
  onTargetSelect,
  onNavigateToTarget,
  filterConfig,
  onFilterChange
}) => {
  const [selectedCategory, setSelectedCategory] = useState<IntelligenceCategory>('all');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('priority');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  
  const processedResults = useMemo(() => {
    return processIntelligenceResults(crawlResults, activeFilters, sortCriteria);
  }, [crawlResults, activeFilters, sortCriteria]);
  
  return (
    <SideBarContainer collapsed={isCollapsed}>
      <SideBarHeader>
        <Typography variant="h6">OSINT Navigator</Typography>
        <CollapseButton onClick={onToggleCollapse} />
      </SideBarHeader>
      
      <SideBarContent>
        <CategoryFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          filterConfig={filterConfig}
          onFilterChange={onFilterChange}
        />
        
        <PriorityRanking
          results={processedResults}
          sortCriteria={sortCriteria}
          onSortChange={setSortCriteria}
        />
        
        <OSINTResultsRoster
          results={processedResults}
          selectedTargets={selectedTargets}
          onTargetSelect={onTargetSelect}
          onNavigateToTarget={onNavigateToTarget}
        />
        
        <ActionButtons
          selectedTargets={selectedTargets}
          onBulkAction={handleBulkAction}
          onExport={handleExport}
        />
      </SideBarContent>
    </SideBarContainer>
  );
};
```

### Intelligence Processing
```typescript
const processIntelligenceResults = (
  results: CrawlResult[],
  filters: ActiveFilters,
  sortCriteria: SortCriteria
): ProcessedResult[] => {
  return results
    .filter(result => applyFilters(result, filters))
    .map(result => enhanceWithPriority(result))
    .sort((a, b) => sortByCriteria(a, b, sortCriteria))
    .map(result => ({
      ...result,
      actionable: determineActionableItems(result),
      riskScore: calculateRiskScore(result),
      intelligenceValue: assessIntelligenceValue(result)
    }));
};
```

### Priority Calculation
```typescript
const calculatePriority = (result: CrawlResult): Priority => {
  const factors = {
    threatLevel: assessThreatLevel(result),
    intelligenceValue: assessIntelligenceValue(result),
    accessibility: assessAccessibility(result),
    timeliness: assessTimeliness(result),
    relevance: assessRelevance(result)
  };
  
  const weightedScore = 
    factors.threatLevel * 0.3 +
    factors.intelligenceValue * 0.25 +
    factors.accessibility * 0.2 +
    factors.timeliness * 0.15 +
    factors.relevance * 0.1;
  
  return {
    score: weightedScore,
    level: getPriorityLevel(weightedScore),
    factors
  };
};
```

## Widget Component Integration

### OSINTResultsRoster
- Result list with virtualization
- Interactive target selection
- Quick preview capabilities
- Batch operations support

### TargetSelector
- Target filtering interface
- Multi-select functionality
- Search and sort options
- Custom selection criteria

### CategoryFilters
- Intelligence category selection
- Filter combination logic
- Saved filter presets
- Dynamic filter creation

### PriorityRanking
- Priority-based sorting
- Visual priority indicators
- Custom ranking criteria
- Priority threshold settings

### ActionButtons
- Bulk action operations
- Export functionality
- Integration actions
- Quick navigation shortcuts

## Hook Integrations

### Custom Hooks Used
- `useOSINTResults()`: Results processing and management
- `useTargetNavigation()`: Navigation state and actions
- `useIntelligenceFilter()`: Filtering and categorization
- `usePriorityRanking()`: Priority calculation and sorting

### Service Integrations
- **Intelligence Service**: Data processing and analysis
- **Navigation Service**: Target routing and session management
- **Export Service**: Data export and sharing
- **Notification Service**: Alert and update management

## Intelligence Categories

### Category Types
```typescript
enum IntelligenceCategory {
  ALL = 'all',
  NETWORK = 'network',
  IDENTITY = 'identity',
  SOCIAL = 'social',
  INFRASTRUCTURE = 'infrastructure',
  DARKWEB = 'darkweb',
  FINANCIAL = 'financial',
  GEOSPATIAL = 'geospatial',
  TEMPORAL = 'temporal',
  THREAT = 'threat'
}
```

### Category Processing
- Automatic categorization based on result content
- Manual category assignment
- Category-specific analysis
- Cross-category correlation

## Priority System

### Priority Levels
```typescript
enum PriorityLevel {
  CRITICAL = 'critical',    // Immediate action required
  HIGH = 'high',           // High intelligence value
  MEDIUM = 'medium',       // Standard processing
  LOW = 'low',             // Background analysis
  INFORMATIONAL = 'info'   // Reference only
}
```

### Priority Factors
- **Threat Level**: Security risk assessment
- **Intelligence Value**: Information quality and uniqueness
- **Accessibility**: Ease of further investigation
- **Timeliness**: Freshness and relevance of data
- **Relevance**: Alignment with current objectives

## Filtering System

### Filter Types
```typescript
interface FilterConfiguration {
  categories: IntelligenceCategory[];
  priorityRange: [PriorityLevel, PriorityLevel];
  timeRange: TimeRange;
  sources: string[];
  riskThreshold: number;
  customFilters: CustomFilter[];
}
```

### Dynamic Filtering
- Real-time filter application
- Filter combination logic
- Saved filter presets
- Filter performance optimization

## Navigation Integration

### Target Navigation
```typescript
const handleTargetNavigation = async (target: CrawlTarget) => {
  try {
    // Update navigation state
    await navigationService.navigateToTarget(target);
    
    // Track navigation analytics
    trackNavigation(target);
    
    // Update target queue
    updateTargetQueue(target);
    
    // Notify other components
    onNavigateToTarget?.(target);
  } catch (error) {
    console.error('Navigation failed:', error);
    showNavigationError(error.message);
  }
};
```

### Session Management
- Navigation history tracking
- Target queue persistence
- Session restore capability
- Multi-tab navigation support

## Performance Optimizations

### Virtualization
- Virtual scrolling for large result sets
- Lazy loading of result details
- Progressive data loading
- Memory-efficient rendering

### Caching Strategy
- Result caching for quick access
- Filter result caching
- Navigation state caching
- Intelligent cache invalidation

## Error Handling

### Data Processing Errors
```typescript
const handleProcessingError = (error: ProcessingError) => {
  // Log error details
  console.error('Result processing failed:', error);
  
  // Fallback to basic display
  setFallbackMode(true);
  
  // Notify user
  showErrorNotification({
    message: 'Some results may not display correctly',
    action: 'Retry Processing',
    onAction: () => retryProcessing()
  });
};
```

### Navigation Errors
- Target accessibility validation
- Network connectivity handling
- Service availability checks
- Graceful degradation strategies

## Testing Strategy

### Unit Tests
- Component rendering tests
- Filter logic verification
- Priority calculation testing
- Navigation flow testing

### Integration Tests
- Service integration testing
- Cross-component communication
- Performance benchmarking
- Error handling validation

## Usage Examples

```typescript
// Basic usage
<NetRunnerRightSideBar
  crawlResults={osintResults}
  onTargetSelect={handleTargetSelection}
  onNavigateToTarget={handleNavigation}
/>

// Advanced configuration
<NetRunnerRightSideBar
  isCollapsed={isRightSidebarCollapsed}
  onToggleCollapse={toggleRightSidebar}
  crawlResults={filteredResults}
  selectedTargets={selectedTargetIds}
  onTargetSelect={handleTargetSelect}
  onNavigateToTarget={handleTargetNavigation}
  filterConfig={userFilterConfig}
  onFilterChange={updateFilterConfig}
/>
```

## Dependencies

### External Dependencies
- React 18+
- Material-UI components
- Lucide React icons
- React Window (virtualization)

### Internal Dependencies
- OSINT result processing services
- Navigation management hooks
- Intelligence filtering utilities
- Priority calculation algorithms

## Maintenance Notes

### Performance Monitoring
- Result processing performance
- Filter application efficiency
- Navigation response times
- Memory usage tracking

### Future Enhancements
- AI-powered result ranking
- Collaborative filtering
- Advanced export formats
- Real-time result streaming
