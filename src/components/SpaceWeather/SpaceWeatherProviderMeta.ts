export type SpaceWeatherProviderKey = 'legacy' | 'enterprise' | 'enhanced';

export interface SpaceWeatherProviderMetaEntry {
  label: string;
  detail: string;
  icon: string;
}

export const spaceWeatherProviderMeta: Record<SpaceWeatherProviderKey, SpaceWeatherProviderMetaEntry> = {
  legacy: { label: 'Legacy', detail: '2 NOAA endpoints · baseline stream', icon: '⚡' },
  enterprise: { label: 'Enterprise', detail: '20+ endpoints · adaptive sampling', icon: '🚀' },
  enhanced: { label: 'Enhanced', detail: 'Correlation + quality scoring', icon: '✨' }
};
