// Enhanced TopBar data categories with comprehensive energy intelligence
// Artifacts: eia-data-expansion-specification, phase2-implementation-plan

export interface TopBarCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  defaultEnabled: boolean;
  tier?: 'essential' | 'important' | 'specialized';
  earthAllianceContext?: string;
}

export const TOPBAR_CATEGORIES: TopBarCategory[] = [
  // ===== ESSENTIAL ENERGY INTELLIGENCE (Always Enabled) =====
  { 
    id: 'commodities', 
    label: 'Energy Markets', 
    icon: '🛢️', 
    description: 'Oil, gas, and energy commodity prices', 
    defaultEnabled: true,
    tier: 'essential',
    earthAllianceContext: 'Monitor energy market manipulation by globalist cartels'
  },
  { 
    id: 'energy-security', 
    label: 'Energy Security', 
    icon: '🔒', 
    description: 'Critical infrastructure and energy resilience monitoring', 
    defaultEnabled: true,
    tier: 'essential',
    earthAllianceContext: 'Monitor critical energy infrastructure for cyber threats and supply disruptions'
  },
  { 
    id: 'power-grid', 
    label: 'Power Grid', 
    icon: '⚡', 
    description: 'Electricity generation, capacity, and grid stability', 
    defaultEnabled: true,
    tier: 'essential',
    earthAllianceContext: 'Track power grid stability and capacity for operational security'
  },
  { 
    id: 'market-intelligence', 
    label: 'Energy Intel', 
    icon: '🔍', 
    description: 'Oil markets, pricing, and economic warfare detection', 
    defaultEnabled: true,
    tier: 'essential',
    earthAllianceContext: 'Detect energy market manipulation and economic warfare tactics'
  },

  // ===== IMPORTANT ENERGY CATEGORIES (Default Enabled) =====
  { 
    id: 'renewables', 
    label: 'Clean Energy', 
    icon: '🌱', 
    description: 'Solar, wind, and renewable energy adoption', 
    defaultEnabled: true,
    tier: 'important',
    earthAllianceContext: 'Monitor clean energy transition vs fossil fuel cartel resistance'
  },
  { 
    id: 'supply-chain', 
    label: 'Supply Chain', 
    icon: '🏭', 
    description: 'Refinery capacity, production, and logistics', 
    defaultEnabled: true,
    tier: 'important',
    earthAllianceContext: 'Monitor energy supply chain resilience and bottlenecks'
  },

  // ===== SPECIALIZED ENERGY CATEGORIES (User Configurable) =====
  { 
    id: 'strategic-fuels', 
    label: 'Strategic Fuels', 
    icon: '✈️', 
    description: 'Jet fuel, diesel, and military-critical fuels', 
    defaultEnabled: false,
    tier: 'specialized',
    earthAllianceContext: 'Track strategic fuel supplies for resistance operations'
  },
  { 
    id: 'trade-balance', 
    label: 'Energy Trade', 
    icon: '🚢', 
    description: 'Energy imports, exports, and trade balance', 
    defaultEnabled: false,
    tier: 'specialized',
    earthAllianceContext: 'Monitor energy import dependence and export leverage'
  },
  { 
    id: 'baseload-power', 
    label: 'Baseload Power', 
    icon: '⚛️', 
    description: 'Nuclear, coal, and reliable power generation', 
    defaultEnabled: false,
    tier: 'specialized',
    earthAllianceContext: 'Track baseload power capacity for grid stability and security'
  },

  // ===== TRADITIONAL FINANCIAL DATA (Demoted, Disabled by Default) =====
  { 
    id: 'indices', 
    label: 'Market Indices', 
    icon: '📈', 
    description: 'S&P 500, NASDAQ, etc.', 
    defaultEnabled: false,
    tier: 'important'
  },
  { 
    id: 'crypto', 
    label: 'Cryptocurrency', 
    icon: '₿', 
    description: 'Bitcoin, Ethereum, etc.', 
    defaultEnabled: false,
    tier: 'important'
  },
  { 
    id: 'economic', 
    label: 'Economic Indicators', 
    icon: '📊', 
    description: 'Inflation, GDP, economic data', 
    defaultEnabled: false,
    tier: 'important'
  },
  { 
    id: 'news', 
    label: 'News Headlines', 
    icon: '📰', 
    description: 'Financial news headlines', 
    defaultEnabled: false,
    tier: 'important'
  },
  { 
    id: 'sentiment', 
    label: 'Market Sentiment', 
    icon: '📢', 
    description: 'AI-generated market sentiment', 
    defaultEnabled: false,
    tier: 'important'
  },
  { 
    id: 'forex', 
    label: 'Foreign Exchange', 
    icon: '💱', 
    description: 'USD/EUR, currency pairs', 
    defaultEnabled: false,
    tier: 'specialized'
  }
];

// Category grouping for enhanced organization
export const CATEGORY_GROUPS = {
  energy: ['commodities', 'energy-security', 'power-grid', 'market-intelligence', 'renewables', 'supply-chain', 'strategic-fuels', 'trade-balance', 'baseload-power'],
  financial: ['indices', 'crypto', 'forex', 'economic', 'news', 'sentiment']
} as const;

// Default enabled categories for new users
export const DEFAULT_ENABLED_CATEGORIES = TOPBAR_CATEGORIES
  .filter(cat => cat.defaultEnabled)
  .map(cat => cat.id);

// Essential categories that should always be available
export const ESSENTIAL_CATEGORIES = TOPBAR_CATEGORIES
  .filter(cat => cat.tier === 'essential')
  .map(cat => cat.id);
