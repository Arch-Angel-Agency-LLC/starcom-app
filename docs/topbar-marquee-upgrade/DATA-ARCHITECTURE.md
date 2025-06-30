# Data Architecture & EIA Integration Specification

## 🏗️ Enhanced Data Layer Architecture

### Current State Analysis
The existing TopBar system uses basic data fetching from EIA services with simple fallback values. The enhanced system will provide multi-layered data with correlations, trends, and contextual intelligence.

### Enhanced Data Flow
```
EIA API v2 ──┐
             ├─► Enhanced EIA Service ─► Data Processor ─► Enhanced TopBar Data
WebSocket ───┤                                          │
             │                                          ├─► Marquee Display
Cache Layer ─┘                                          │
                                                        └─► Detailed Views
```

## 📊 Enhanced Data Structures

### Core Data Enhancement
```typescript
// Enhanced from existing MarqueeDataPoint
export interface EnhancedMarqueeDataPoint extends MarqueeDataPoint {
  // Existing properties preserved
  id: string;
  label: string;
  icon: string;
  value: string;
  isLoading?: boolean;
  hasError?: boolean;
  priority?: 'critical' | 'important' | 'standard';

  // New enhanced properties
  detailedData: DetailedDataSet;
  relatedDataPoints: string[];
  historicalTrend: TrendData;
  alertLevel: 'normal' | 'warning' | 'critical';
  lastUpdated: Date;
  metadata: DataPointMetadata;
  
  // Interactive properties
  onClick: (dataPoint: EnhancedMarqueeDataPoint) => void;
  onHover?: (dataPoint: EnhancedMarqueeDataPoint) => void;
  
  // Visual customization
  badge?: BadgeData;
  tooltip?: TooltipData;
  customColor?: string;
}

export interface DetailedDataSet {
  // Primary metrics (main display values)
  primaryMetrics: MetricData[];
  
  // Secondary metrics (supporting context)
  secondaryMetrics: MetricData[];
  
  // Contextual information and analysis
  contextualInfo: ContextualData[];
  
  // Related category correlations
  correlatedCategories: CorrelationData[];
  
  // AI-generated recommendations
  recommendations: RecommendationData[];
  
  // Historical context and events
  alertHistory: AlertEvent[];
  
  // Trend analysis and patterns
  trendAnalysis: TrendAnalysis;
  
  // External resources and links
  externalLinks: ExternalLink[];
  
  // Real-time updates
  liveUpdates?: LiveUpdateConfig;
}
```

### EIA-Specific Data Mapping
```typescript
export interface EIAEnhancedData {
  // Core EIA data (from existing system)
  oilPrice: number | null;
  naturalGasPrice: number | null;
  electricityGeneration: number | null;
  solarGeneration: number | null;
  windGeneration: number | null;
  // ... other existing fields

  // Enhanced EIA data
  energySecurityMetrics: {
    strategicReserveLevel: number;
    importDependency: number;
    gridStability: number;
    renewableCapacity: number;
    criticalInfrastructureStatus: 'stable' | 'warning' | 'alert';
  };

  marketIntelligence: {
    priceVolatility: number;
    supplyChainRisk: number;
    geopoliticalFactors: GeopoliticalFactor[];
    marketManipulationIndicators: ManipulationIndicator[];
  };

  powerGridMetrics: {
    totalCapacity: number;
    currentDemand: number;
    reserveMargin: number;
    transmissionCapacity: number;
    distributionEfficiency: number;
  };

  renewableMetrics: {
    totalRenewableGeneration: number;
    solarCapacityFactor: number;
    windCapacityFactor: number;
    hydrogenProduction: number;
    batteryStorageCapacity: number;
  };
}

export interface GeopoliticalFactor {
  region: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  likelihood: number; // 0-1
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
}
```

### Correlation Engine Design
```typescript
export interface CorrelationEngine {
  // Calculate statistical correlations
  calculatePearsonCorrelation(
    seriesA: TimeSeriesData,
    seriesB: TimeSeriesData,
    timeWindow?: TimeWindow
  ): Promise<CorrelationResult>;

  // Find related categories using multiple algorithms
  findRelatedCategories(
    categoryId: string,
    algorithms?: CorrelationAlgorithm[]
  ): Promise<CorrelationData[]>;

  // Historical pattern matching
  findHistoricalPatterns(
    categoryId: string,
    patternType: PatternType[]
  ): Promise<PatternMatch[]>;

  // Real-time correlation monitoring
  monitorLiveCorrelations(
    categoryIds: string[],
    threshold: number
  ): Promise<LiveCorrelationStream>;
}

export type CorrelationAlgorithm = 
  | 'pearson'
  | 'spearman'
  | 'kendall'
  | 'mutual_information'
  | 'granger_causality'
  | 'cointegration';

export type PatternType =
  | 'seasonal'
  | 'cyclical'
  | 'trend'
  | 'volatility_clustering'
  | 'mean_reversion'
  | 'momentum';

export interface CorrelationResult {
  coefficient: number; // -1 to 1
  pValue: number;
  significance: 'not_significant' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  confidence: number;
  timeDelay?: number; // milliseconds
  strength: number; // 0 to 1
}
```

## 🔄 Data Processing Pipeline

### Enhanced EIA Service Architecture
```typescript
// Enhanced version of existing EIAService
export class SuperchargedEIAService extends EnhancedEIAService {
  private correlationEngine: CorrelationEngine;
  private trendAnalyzer: TrendAnalyzer;
  private alertSystem: AlertSystem;
  private cacheManager: CacheManager;

  constructor() {
    super();
    this.correlationEngine = new CorrelationEngine();
    this.trendAnalyzer = new TrendAnalyzer();
    this.alertSystem = new AlertSystem();
    this.cacheManager = new CacheManager();
  }

  // Enhanced data fetching with correlation analysis
  async getEnhancedCategoryData(categoryId: string): Promise<DetailedDataSet> {
    const baseData = await super.getAllEnhancedData();
    const historicalData = await this.fetchHistoricalData(categoryId);
    const correlations = await this.correlationEngine.findRelatedCategories(categoryId);
    const trends = await this.trendAnalyzer.analyzeTrends(categoryId, historicalData);
    const alerts = await this.alertSystem.getAlertHistory(categoryId);
    const recommendations = await this.generateRecommendations(categoryId, baseData, trends);

    return {
      primaryMetrics: this.extractPrimaryMetrics(baseData, categoryId),
      secondaryMetrics: this.extractSecondaryMetrics(baseData, categoryId),
      contextualInfo: this.generateContextualInfo(categoryId, trends, correlations),
      correlatedCategories: correlations,
      recommendations,
      alertHistory: alerts,
      trendAnalysis: trends,
      externalLinks: this.generateExternalLinks(categoryId),
      liveUpdates: this.configureLiveUpdates(categoryId)
    };
  }

  // Batch processing for multiple categories
  async getEnhancedMultipleCategoryData(
    categoryIds: string[]
  ): Promise<Record<string, DetailedDataSet>> {
    const batchPromises = categoryIds.map(id => 
      this.getEnhancedCategoryData(id).then(data => ({ id, data }))
    );
    
    const results = await Promise.allSettled(batchPromises);
    
    return results.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        acc[result.value.id] = result.value.data;
      }
      return acc;
    }, {} as Record<string, DetailedDataSet>);
  }

  // Real-time updates via WebSocket (future enhancement)
  setupLiveDataStream(categoryIds: string[]): WebSocketConnection {
    // Implementation for real-time data streaming
    return new WebSocketConnection({
      url: 'wss://api.eia.gov/v2/stream',
      categories: categoryIds,
      onMessage: (data) => this.handleLiveUpdate(data),
      onError: (error) => this.handleStreamError(error)
    });
  }

  private async generateRecommendations(
    categoryId: string,
    baseData: any,
    trends: TrendAnalysis
  ): Promise<RecommendationData[]> {
    // AI-powered recommendation generation
    const recommendations: RecommendationData[] = [];

    // Price-based recommendations
    if (categoryId.includes('price') && trends.volatility === 'high') {
      recommendations.push({
        id: `${categoryId}-volatility-warning`,
        type: 'monitor',
        title: 'High Price Volatility Detected',
        description: 'Current price movements show unusual volatility patterns. Monitor for potential market manipulation.',
        priority: 'important',
        actionable: true,
        estimatedImpact: 'medium',
        timeframe: '24-48 hours'
      });
    }

    // Supply chain recommendations
    if (categoryId.includes('supply') && trends.trend === 'bearish') {
      recommendations.push({
        id: `${categoryId}-supply-concern`,
        type: 'alert',
        title: 'Supply Chain Risk Increasing',
        description: 'Downward trend in supply metrics may indicate potential shortages or disruptions.',
        priority: 'critical',
        actionable: true,
        estimatedImpact: 'high',
        timeframe: '1-2 weeks'
      });
    }

    return recommendations;
  }
}
```

### Trend Analysis System
```typescript
export class TrendAnalyzer {
  // Analyze trends using multiple algorithms
  async analyzeTrends(
    categoryId: string,
    historicalData: TimeSeriesData
  ): Promise<TrendAnalysis> {
    const shortTermTrend = this.calculateTrend(historicalData, '24h');
    const mediumTermTrend = this.calculateTrend(historicalData, '7d');
    const longTermTrend = this.calculateTrend(historicalData, '30d');
    
    const volatility = this.calculateVolatility(historicalData);
    const seasonality = this.detectSeasonality(historicalData);
    const anomalies = this.detectAnomalies(historicalData);
    const momentum = this.calculateMomentum(historicalData);
    
    return {
      shortTerm: shortTermTrend,
      mediumTerm: mediumTermTrend,
      longTerm: longTermTrend,
      volatility,
      seasonality,
      anomalies,
      momentum,
      confidence: this.calculateConfidence([shortTermTrend, mediumTermTrend, longTermTrend]),
      keyEvents: this.identifyKeyEvents(historicalData, anomalies),
      predictiveIndicators: this.generatePredictiveIndicators(historicalData)
    };
  }

  private calculateTrend(data: TimeSeriesData, timeframe: string): TrendResult {
    // Implementation of trend calculation using linear regression
    const points = this.filterDataByTimeframe(data, timeframe);
    const slope = this.calculateLinearRegressionSlope(points);
    
    return {
      direction: slope > 0.1 ? 'bullish' : slope < -0.1 ? 'bearish' : 'sideways',
      strength: Math.abs(slope),
      rSquared: this.calculateRSquared(points, slope),
      startValue: points[0]?.value || 0,
      endValue: points[points.length - 1]?.value || 0,
      percentChange: this.calculatePercentChange(points)
    };
  }

  private detectAnomalies(data: TimeSeriesData): AnomalyEvent[] {
    // Statistical anomaly detection using z-score and IQR methods
    const values = data.dataPoints.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    
    const anomalies: AnomalyEvent[] = [];
    
    data.dataPoints.forEach((point, index) => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      if (zScore > 2.5) { // 2.5 standard deviations
        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          severity: zScore > 3 ? 'high' : 'medium',
          type: point.value > mean ? 'spike' : 'drop',
          description: `Unusual ${point.value > mean ? 'increase' : 'decrease'} detected (${zScore.toFixed(2)} σ)`,
          possibleCauses: this.inferPossibleCauses(point, index, data)
        });
      }
    });
    
    return anomalies;
  }
}
```

### Alert System Integration
```typescript
export class AlertSystem {
  private thresholds: Map<string, ThresholdConfig> = new Map();
  private alertHistory: Map<string, AlertEvent[]> = new Map();

  // Configure thresholds for different categories
  setThreshold(categoryId: string, config: ThresholdConfig): void {
    this.thresholds.set(categoryId, config);
  }

  // Check current values against thresholds
  async checkAlerts(categoryId: string, currentValue: number): Promise<AlertEvent[]> {
    const config = this.thresholds.get(categoryId);
    if (!config) return [];

    const alerts: AlertEvent[] = [];
    const timestamp = new Date();

    // Check critical thresholds
    if (config.critical && this.exceedsThreshold(currentValue, config.critical)) {
      alerts.push({
        id: `${categoryId}-critical-${timestamp.getTime()}`,
        categoryId,
        level: 'critical',
        message: `Critical threshold exceeded: ${currentValue} vs ${config.critical.value}`,
        timestamp,
        acknowledged: false,
        value: currentValue,
        threshold: config.critical.value,
        description: config.critical.description || 'Critical alert triggered'
      });
    }

    // Check warning thresholds
    if (config.warning && this.exceedsThreshold(currentValue, config.warning)) {
      alerts.push({
        id: `${categoryId}-warning-${timestamp.getTime()}`,
        categoryId,
        level: 'warning',
        message: `Warning threshold exceeded: ${currentValue} vs ${config.warning.value}`,
        timestamp,
        acknowledged: false,
        value: currentValue,
        threshold: config.warning.value,
        description: config.warning.description || 'Warning alert triggered'
      });
    }

    // Store in history
    const categoryHistory = this.alertHistory.get(categoryId) || [];
    categoryHistory.push(...alerts);
    this.alertHistory.set(categoryId, categoryHistory);

    return alerts;
  }

  // Get alert history for a category
  getAlertHistory(categoryId: string): AlertEvent[] {
    return this.alertHistory.get(categoryId) || [];
  }

  // Configure default thresholds for energy categories
  setupDefaultThresholds(): void {
    // Oil price thresholds
    this.setThreshold('oil-price', {
      warning: { value: 100, type: 'above', description: 'Oil price approaching high levels' },
      critical: { value: 120, type: 'above', description: 'Oil price at critical high levels' }
    });

    // Natural gas thresholds
    this.setThreshold('natural-gas-price', {
      warning: { value: 8, type: 'above', description: 'Natural gas price elevated' },
      critical: { value: 12, type: 'above', description: 'Natural gas price at critical levels' }
    });

    // Grid stability thresholds
    this.setThreshold('power-grid', {
      warning: { value: 5, type: 'below', description: 'Grid reserve margin low' },
      critical: { value: 3, type: 'below', description: 'Grid reserve margin critically low' }
    });

    // Add more category-specific thresholds...
  }
}
```

## 🔌 Integration with Existing System

### Backward Compatibility Layer
```typescript
// Adapter to maintain compatibility with existing TopBar system
export class EnhancedTopBarAdapter {
  private superchargedService: SuperchargedEIAService;
  private existingHook: typeof useTopBarData;

  constructor() {
    this.superchargedService = new SuperchargedEIAService();
    this.existingHook = useTopBarData;
  }

  // Enhanced version of useTopBarData
  useEnhancedTopBarData(): EnhancedTopBarData {
    const existingData = this.existingHook();
    const [enhancedData, setEnhancedData] = useState<Record<string, DetailedDataSet>>({});
    const [correlations, setCorrelations] = useState<Record<string, CorrelationData[]>>({});

    useEffect(() => {
      if (!existingData.loading && existingData.criticalDataLoaded) {
        this.loadEnhancedData(existingData);
      }
    }, [existingData.criticalDataLoaded]);

    const loadEnhancedData = async (baseData: any) => {
      const categoryIds = Object.keys(baseData.loadingStates || {});
      
      try {
        const enhanced = await this.superchargedService.getEnhancedMultipleCategoryData(categoryIds);
        setEnhancedData(enhanced);

        // Load correlations for each category
        const correlationPromises = categoryIds.map(async (id) => {
          const corrs = await this.superchargedService.correlationEngine.findRelatedCategories(id);
          return { id, correlations: corrs };
        });
        
        const correlationResults = await Promise.allSettled(correlationPromises);
        const correlationMap = correlationResults.reduce((acc, result) => {
          if (result.status === 'fulfilled') {
            acc[result.value.id] = result.value.correlations;
          }
          return acc;
        }, {} as Record<string, CorrelationData[]>);
        
        setCorrelations(correlationMap);
      } catch (error) {
        console.error('Failed to load enhanced data:', error);
      }
    };

    return {
      ...existingData,
      enhancedData,
      correlations,
      hasEnhancedData: Object.keys(enhancedData).length > 0
    };
  }
}
```

### Migration Strategy
```typescript
// Gradual migration approach
export class MigrationManager {
  private isEnhancedModeEnabled: boolean = false;
  private fallbackToLegacy: boolean = true;

  // Feature flag system
  isFeatureEnabled(feature: EnhancedFeature): boolean {
    const flags = {
      'enhanced-data': this.isEnhancedModeEnabled,
      'correlations': this.isEnhancedModeEnabled,
      'detailed-views': true, // Always available
      'drag-interactions': true, // Always available
      'real-time-updates': false // Not yet implemented
    };
    
    return flags[feature] || false;
  }

  // Safe data fetching with fallback
  async fetchDataSafely<T>(
    enhancedFetcher: () => Promise<T>,
    legacyFetcher: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnhancedModeEnabled || !this.fallbackToLegacy) {
      return legacyFetcher();
    }

    try {
      return await enhancedFetcher();
    } catch (error) {
      console.warn('Enhanced data fetch failed, falling back to legacy:', error);
      return legacyFetcher();
    }
  }

  // Performance monitoring
  monitorEnhancedFeatures(): void {
    // Track performance metrics and errors
    // Automatically disable enhanced features if performance degrades
  }
}

type EnhancedFeature = 
  | 'enhanced-data'
  | 'correlations'
  | 'detailed-views'
  | 'drag-interactions'
  | 'real-time-updates';
```

## 📊 Data Visualization Enhancements

### Mini Chart Components
```typescript
// Small chart components for detailed views
export const TrendMiniChart: React.FC<{
  data: TimeSeriesData;
  width?: number;
  height?: number;
  color?: string;
}> = ({ data, width = 100, height = 30, color = '#3b82f6' }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.dataPoints.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const values = data.dataPoints.map(d => d.value);
    const xScale = d3.scaleLinear()
      .domain([0, values.length - 1])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .range([height, 0]);

    const line = d3.line<number>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(values)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
      .attr('d', line);
  }, [data, width, height, color]);

  return <svg ref={svgRef} width={width} height={height} />;
};

export const CorrelationHeatmap: React.FC<{
  correlations: CorrelationData[];
  selectedCategory: string;
}> = ({ correlations, selectedCategory }) => {
  // Implementation of correlation heatmap visualization
  return <div>Correlation heatmap visualization</div>;
};
```

This comprehensive data architecture specification provides the foundation for implementing enhanced data processing, correlation analysis, trend detection, and intelligent recommendations while maintaining backward compatibility with the existing EIA service system.
