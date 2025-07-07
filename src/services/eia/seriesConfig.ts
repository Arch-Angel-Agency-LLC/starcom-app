// EIA series configuration mapping for enhanced energy intelligence
// Artifact-driven: Complete mapping of EIA data series to Earth Alliance categories

import type { EIASeriesConfig, EIABatchGroup } from './interfaces';

// Comprehensive EIA series configuration
// TODO: Implement security awareness training and user education features - PRIORITY: LOW
// TODO: Add support for security compliance reporting for regulatory requirements - PRIORITY: MEDIUM
export const EIA_SERIES_CONFIG: Record<string, EIASeriesConfig> = {
  // ===== EXISTING SERIES (Maintain Compatibility) =====
  // Updated with working EIA API v2 series IDs
  
  // Oil price - Working series ID
  'oil-price': {
    id: 'oil-price',
    series: 'PET.RWTC.W',
    label: 'WTI Oil',
    icon: '🛢️',
    format: '$XX.XX',
    category: 'oil-markets',
    priority: 'critical',
    refreshInterval: 60,
    batchGroup: 'energySecurity',
    earthAllianceContext: 'Monitor oil price manipulation by international banking cartels'
  },
  
  /*
  'gasoline-price': {
    id: 'gasoline-price',
    series: 'PET.EMM_EPM0_PTE_NUS_DPG.W',
    label: 'Gasoline',
    icon: '⛽',
    format: '$X.XX',
    category: 'oil-markets',
    priority: 'important',
    refreshInterval: 120,
    batchGroup: 'oilMarkets'
  },
  */
  
  /*
  'oil-inventory': {
    id: 'oil-inventory',
    series: 'PET.WCRSTUS1.W',
    label: 'SPR Level',
    icon: '🏛️',
    format: 'XXXmm bbl',
    category: 'energy-security',
    priority: 'critical',
    refreshInterval: 180,
    batchGroup: 'energySecurity',
    earthAllianceContext: 'Track strategic petroleum reserve for national security'
  },
  */
  
  /*
  'natural-gas-storage': {
    id: 'natural-gas-storage',
    series: 'NG.NW2_EPG0_SWO_R48_BCF.W',
    label: 'NG Storage',
    icon: '🔥',
    format: 'X,XXX Bcf',
    category: 'energy-security',
    priority: 'important',
    refreshInterval: 180,
    batchGroup: 'energySecurity'
  },
  */

  // Natural gas futures - Working series ID
  'natural-gas-price': {
    id: 'natural-gas-price',
    series: 'NG.RNGC1.D',
    label: 'Nat Gas',
    icon: '🔥',
    format: '$X.XX',
    category: 'energy-security',
    priority: 'critical',
    refreshInterval: 60,
    batchGroup: 'energySecurity',
    earthAllianceContext: 'Monitor natural gas prices for infrastructure threats'
  },
  
  /*
  'electricity-generation': {
    id: 'electricity-generation',
    series: 'ELEC.GEN.ALL-US-99.M',
    label: 'Grid Gen',
    icon: '⚡',
    format: 'X,XXX TWh',
    category: 'power-grid',
    priority: 'critical',
    refreshInterval: 60,
    batchGroup: 'powerGrid',
    earthAllianceContext: 'Track total electricity generation for grid stability'
  },
  */
  
  /*
  'electricity-price': {
    id: 'electricity-price',
    series: 'ELEC.PRICE.US-ALL.M',
    label: 'Power Price',
    icon: '💡',
    format: 'XX.X¢/kWh',
    category: 'power-grid',
    priority: 'important',
    refreshInterval: 240,
    batchGroup: 'powerGrid',
    earthAllianceContext: 'Monitor electricity pricing for economic warfare indicators'
  },
  */

  // ===== RENEWABLES (Clean Energy Transition) =====
  // Solar generation - Corrected series ID for total solar
  'solar-generation': {
    id: 'solar-generation',
    series: 'ELEC.GEN.TSN-US-99.M',
    label: 'Solar',
    icon: '☀️',
    format: 'XXX TWh',
    category: 'renewables',
    priority: 'important',
    refreshInterval: 240,
    batchGroup: 'renewables',
    earthAllianceContext: 'Monitor solar energy adoption vs fossil fuel cartel resistance'
  },
  
  'wind-generation': {
    id: 'wind-generation',
    series: 'ELEC.GEN.WND-US-99.M',
    label: 'Wind',
    icon: '💨',
    format: 'XXX TWh',
    category: 'renewables',
    priority: 'important',
    refreshInterval: 240,
    batchGroup: 'renewables'
  },
  
  'hydro-generation': {
    id: 'hydro-generation',
    series: 'ELEC.GEN.HYC-US-99.M',
    label: 'Hydro',
    icon: '🌊',
    format: 'XXX TWh',
    category: 'renewables',
    priority: 'standard',
    refreshInterval: 480,
    batchGroup: 'renewables'
  },

  // ===== MARKET INTELLIGENCE (Economic Warfare Detection) =====
  'brent-crude': {
    id: 'brent-crude',
    series: 'PET.RBRTE.W',
    label: 'Brent',
    icon: '🛢️',
    format: '$XX.XX',
    category: 'oil-markets',
    priority: 'important',
    refreshInterval: 60,
    batchGroup: 'oilMarkets',
    earthAllianceContext: 'Monitor Brent-WTI spread for market manipulation'
  },
  
  /*
  'jet-fuel-supply': {
    id: 'jet-fuel-supply',
    series: 'PET.WCJRPUS2.W',
    label: 'Jet Fuel',
    icon: '✈️',
    format: 'X,XXX kbd',
    category: 'strategic-fuels',
    priority: 'important',
    refreshInterval: 120,
    batchGroup: 'strategicFuels',
    earthAllianceContext: 'Track aviation fuel for resistance operations'
  },
  */
  
  /*
  'refinery-utilization': {
    id: 'refinery-utilization',
    series: 'PET.WCRFPUS2.W',
    label: 'Refinery',
    icon: '🏭',
    format: 'XX.X%',
    category: 'supply-chain',
    priority: 'important',
    refreshInterval: 180,
    batchGroup: 'supplyChain',
    earthAllianceContext: 'Monitor refinery capacity utilization for supply chain threats'
  },
  */

  // ===== STRATEGIC MONITORING (National Security) =====
  /*
  'crude-imports': {
    id: 'crude-imports',
    series: 'PET.WCRRIUS2.W',
    label: 'Oil Imports',
    icon: '🚢',
    format: 'X,XXX kbd',
    category: 'import-security',
    priority: 'standard',
    refreshInterval: 240,
    batchGroup: 'strategicFuels',
    earthAllianceContext: 'Monitor oil imports for strategic vulnerabilities'
  },
  */
  
  'lng-exports': {
    id: 'lng-exports',
    series: 'NG.N9133US2.M',
    label: 'LNG Exports',
    icon: '🚛',
    format: 'X.X Tcf',
    category: 'export-power',
    priority: 'standard',
    refreshInterval: 480,
    batchGroup: 'tradeBalance',
    earthAllianceContext: 'Track US energy export leverage against hostile cartels'
  },
  
  'nuclear-generation': {
    id: 'nuclear-generation',
    series: 'ELEC.GEN.NUC-US-99.M',
    label: 'Nuclear',
    icon: '⚛️',
    format: 'XXX TWh',
    category: 'baseload-power',
    priority: 'important',
    refreshInterval: 240,
    batchGroup: 'powerGrid',
    earthAllianceContext: 'Monitor nuclear power for grid baseload security'
  },
  
  // Coal generation - Corrected series ID
  'coal-generation': {
    id: 'coal-generation',
    series: 'ELEC.GEN.COW-US-99.M',
    label: 'Coal',
    icon: '⛏️',
    format: 'XXX TWh',
    category: 'baseload-power',
    priority: 'standard',
    refreshInterval: 240,
    batchGroup: 'powerGrid',
    earthAllianceContext: 'Monitor coal generation for fossil fuel dependency tracking'
  },
  
  'natural-gas-generation': {
    id: 'natural-gas-generation',
    series: 'ELEC.GEN.NG-US-99.M',
    label: 'NG Power',
    icon: '🔥',
    format: 'XXX TWh',
    category: 'baseload-power',
    priority: 'important',
    refreshInterval: 240,
    batchGroup: 'powerGrid'
  },

  // ===== ADDITIONAL SUPPLY CHAIN DATA =====
  'distillate-supply': {
    id: 'distillate-supply',
    series: 'PET.WDISTUS1.W',
    label: 'Distillate',
    icon: '🚚',
    format: 'X,XXX kbd',
    category: 'supply-chain',
    priority: 'standard',
    refreshInterval: 180,
    batchGroup: 'strategicFuels'
  },
  
  /*
  'propane-supply': {
    id: 'propane-supply',
    series: 'PET.WPRPUS1.W',
    label: 'Propane',
    icon: '🔥',
    format: 'X,XXX kbd',
    category: 'supply-chain',
    priority: 'background',
    refreshInterval: 480,
    batchGroup: 'strategicFuels'
  },
  */
  
  /*
  'crude-inputs': {
    id: 'crude-inputs',
    series: 'PET.WCRRPUS2.W',
    label: 'Crude Input',
    icon: '🏭',
    format: 'X,XXX kbd',
    category: 'supply-chain',
    priority: 'standard',
    refreshInterval: 180,
    batchGroup: 'supplyChain'
  },
  */
  
  /*
  'gasoline-production': {
    id: 'gasoline-production',
    series: 'PET.WPULEUS3.W',
    label: 'Gas Prod',
    icon: '⛽',
    format: 'X,XXX kbd',
    category: 'supply-chain',
    priority: 'standard',
    refreshInterval: 180,
    batchGroup: 'supplyChain'
  }
  */
};

// Optimized batch groups for efficient API calls
export const EIA_BATCH_GROUPS: Record<string, EIABatchGroup> = {
  energySecurity: {
    id: 'energy-security',
    name: 'Energy Security',
    description: 'Critical infrastructure monitoring',
    seriesIds: ['oil-price', 'natural-gas-price'],
    priority: 'critical',
    refreshInterval: 15
  },
  
  powerGrid: {
    id: 'power-grid',
    name: 'Power Grid',
    description: 'Electricity generation and pricing',
    seriesIds: ['nuclear-generation', 'coal-generation', 'natural-gas-generation'],
    priority: 'critical',
    refreshInterval: 60
  },
  
  renewables: {
    id: 'renewables',
    name: 'Renewables',
    description: 'Clean energy generation',
    seriesIds: ['solar-generation', 'wind-generation', 'hydro-generation'],
    priority: 'important',
    refreshInterval: 240
  },
  
  oilMarkets: {
    id: 'oil-markets',
    name: 'Oil Markets',
    description: 'Global crude oil pricing',
    seriesIds: ['oil-price', 'brent-crude'],
    priority: 'important',
    refreshInterval: 60
  },
  
  strategicFuels: {
    id: 'strategic-fuels',
    name: 'Strategic Fuels',
    description: 'Military and aviation fuels',
    seriesIds: ['jet-fuel-supply', 'distillate-supply', 'propane-supply'],
    priority: 'important',
    refreshInterval: 120
  },
  
  supplyChain: {
    id: 'supply-chain',
    name: 'Supply Chain',
    description: 'Production and refinery operations',
    seriesIds: ['refinery-utilization', 'crude-inputs', 'gasoline-production'],
    priority: 'standard',
    refreshInterval: 180
  },
  
  tradeBalance: {
    id: 'trade-balance',
    name: 'Trade Balance',
    description: 'Energy imports and exports',
    seriesIds: ['crude-imports', 'lng-exports'],
    priority: 'standard',
    refreshInterval: 480
  }
};

// Priority-based refresh intervals (in minutes)
export const REFRESH_INTERVALS = {
  critical: 15,     // Energy security, grid stability
  important: 60,    // Market intelligence, renewables
  standard: 180,    // Supply chain, trade data
  background: 480   // Historical trends, low-priority metrics
} as const;

// Data formatting functions
export const formatValue = (value: number, config: EIASeriesConfig): string => {
  if (config.transform) {
    return config.transform(value);
  }
  
  const format = config.format;
  
  // Handle different format patterns
  if (format.includes('$')) {
    return `$${value.toFixed(2)}`;
  } else if (format.includes('%')) {
    return `${value.toFixed(1)}%`;
  } else if (format.includes('TWh')) {
    // Convert from thousand MWh to TWh (divide by 1000)
    const twh = value / 1000;
    return `${twh.toFixed(0)}TWh`;
  } else if (format.includes('kbd')) {
    return `${Math.round(value)}kbd`;
  } else if (format.includes('Tcf')) {
    return `${value.toFixed(1)}Tcf`;
  } else if (format.includes('Bcf')) {
    return `${Math.round(value)}Bcf`;
  } else if (format.includes('mm bbl')) {
    return `${Math.round(value)}mm bbl`;
  } else if (format.includes('¢/kWh')) {
    return `${value.toFixed(1)}¢/kWh`;
  }
  
  // Default formatting
  return value.toFixed(2);
};

// Get series by category
export const getSeriesByCategory = (category: string): EIASeriesConfig[] => {
  return Object.values(EIA_SERIES_CONFIG).filter(config => config.category === category);
};

// Get series by priority
export const getSeriesByPriority = (priority: string): EIASeriesConfig[] => {
  return Object.values(EIA_SERIES_CONFIG).filter(config => config.priority === priority);
};

// AI-NOTE: This configuration provides comprehensive mapping of EIA data series to Earth Alliance
// intelligence categories with optimized batching for efficient API usage and strategic context
// for planetary reclamation operations.
