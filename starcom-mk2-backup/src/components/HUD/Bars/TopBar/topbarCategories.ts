// ...existing code...
// TopBar data categories and types (artifact-driven)

export interface TopBarCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  defaultEnabled: boolean;
}

export const TOPBAR_CATEGORIES: TopBarCategory[] = [
  { id: 'commodities', label: 'Commodities', icon: '🛢️', description: 'Oil, Gold, etc.', defaultEnabled: true },
  { id: 'indices', label: 'Indices', icon: '📈', description: 'S&P 500, NASDAQ, etc.', defaultEnabled: true },
  { id: 'crypto', label: 'Crypto', icon: '₿', description: 'BTC, ETH, etc.', defaultEnabled: true },
  { id: 'forex', label: 'Forex', icon: '💱', description: 'USD/EUR, etc.', defaultEnabled: false },
  { id: 'economic', label: 'Economic Indicators', icon: '📊', description: 'Inflation, GDP, etc.', defaultEnabled: true },
  { id: 'news', label: 'News Headlines', icon: '📰', description: 'Financial news headlines', defaultEnabled: true },
  { id: 'sentiment', label: 'Market Sentiment', icon: '📢', description: 'AI-generated market sentiment', defaultEnabled: true },
];
// ...existing code...
