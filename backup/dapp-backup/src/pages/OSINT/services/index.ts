/**
 * OSINT Services Index
 * 
 * This file exports all OSINT services for easier imports.
 */

// API Services
export { osintApi } from './api/osintApi';
export { default as osintEndpoints } from './api/endpoints';

// Search Services
export { searchService } from './search/searchService';

// Graph Services
export { graphService } from './graph/graphService';
export type { 
  GraphData, 
  GraphNode, 
  GraphLink, 
  ExpansionOptions, 
  NodeType 
} from './graph/graphService';

// Timeline Services
export { timelineService } from './timeline/timelineService';
export type { 
  TimelineData, 
  TimelineFilter, 
  EventCorrelation 
} from './timeline/timelineService';

// Map Services
export { mapService } from './map/mapService';
export type {
  GeoCoordinate,
  MapLocation,
  MapConfig,
  MapData,
  LocationType,
  MapLayerType,
  MapVisualizationType
} from './map/mapService';

// Investigation Services
export { investigationService } from './investigation/investigationService';
export type { CreateInvestigationOptions } from './investigation/investigationService';

// Blockchain Services
export { blockchainService } from './blockchain/blockchainService';
export type {
  BlockchainNetwork,
  WalletInfo,
} from './blockchain/blockchainService';

// Dark Web Services
export { darkWebService } from './darkweb/darkWebService';
export type {
  DarkWebSourceType,
  MonitorStatus,
  AlertLevel,
  DarkWebResult,
  MonitorConfig,
  DarkWebAlert,
  SourceStats
} from './darkweb/darkWebService';

// OPSEC Services
export { opsecService } from './opsec/opsecService';
export type {
  RoutingMethod,
  SecurityLevel,
  SecurityAlertType,
  SecurityAlert,
  ConnectionStatus,
  ThreatScanResult,
  SecurityCheck
} from './opsec/opsecService';