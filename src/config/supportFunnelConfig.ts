import { DebugCategory, debugLogger } from '../utils/debugLogger';

export type SupportFunnelConfig = {
  enabled: boolean;
  fundraiserUrl: string;
  nostrUrl: string;
  inviteCopy: string;
  snoozeDays: number;
  learnMoreSource: 'accordion' | 'route';
  experimentEnabled: boolean;
  experimentVariant: string | null;
  experimentVariants: string[];
};

function getEnvFlag(key: string): string | undefined {
  try {
    const anyMeta = import.meta as any;
    return anyMeta?.env?.[key];
  } catch {
    return undefined;
  }
}

function isProd(): boolean {
  try {
    const anyMeta = import.meta as any;
    return anyMeta?.env?.MODE === 'production';
  } catch {
    return false;
  }
}

function appendSourceTag(url: string, source = 'app_modal'): string {
  if (!url) return url;
  try {
    const hasQuery = url.includes('?');
    const separator = hasQuery ? '&' : '?';
    if (url.includes('src=')) return url;
    return `${url}${separator}src=${source}`;
  } catch {
    return url;
  }
}

export function getSupportFunnelConfig(): SupportFunnelConfig {
  const envEnabled = getEnvFlag('VITE_SUPPORT_FUNNEL_ENABLED');
  const envSnooze = getEnvFlag('VITE_SUPPORT_FUNNEL_SNOOZE_DAYS');
  const envFundUrl = getEnvFlag('VITE_SUPPORT_FUNNEL_FUND_URL');
  const envFundUrlStage = getEnvFlag('VITE_SUPPORT_FUNNEL_FUND_URL_STAGE');
  const envNostrUrl = getEnvFlag('VITE_SUPPORT_FUNNEL_NOSTR_URL');
  const envInviteCopy = getEnvFlag('VITE_SUPPORT_FUNNEL_INVITE_COPY');
  const envExperimentEnabled = getEnvFlag('VITE_SUPPORT_FUNNEL_EXPERIMENT_ENABLED');
  const envExperimentVariant = getEnvFlag('VITE_SUPPORT_FUNNEL_VARIANT');
  const envExperimentVariants = getEnvFlag('VITE_SUPPORT_FUNNEL_VARIANTS');

  const prod = isProd();

  const defaultFundraiser = prod ? 'https://fund.starcom.app' : 'https://stage.fund.starcom.app';
  const fundraiserUrl = appendSourceTag(envFundUrl || (prod ? envFundUrlStage || defaultFundraiser : envFundUrlStage || defaultFundraiser));

  const nostrUrl = envNostrUrl || 'https://navcom.app/ops/starcom';
  const inviteCopy = envInviteCopy || 'https://navcom.app/ops/starcom';

  const snoozeDaysRaw = envSnooze ? parseInt(envSnooze, 10) : 30;
  const snoozeDays = Number.isFinite(snoozeDaysRaw) ? Math.min(Math.max(snoozeDaysRaw, 7), 45) : 30;

  const enabled = envEnabled === 'true' || (!prod && envEnabled !== 'false');

  const experimentEnabled = envExperimentEnabled === 'true' || (!prod && envExperimentEnabled !== 'false');
  const experimentVariant = (envExperimentVariant || '').trim() || null;
  const experimentVariants = (envExperimentVariants || 'baseline_v1')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (experimentVariant && !experimentVariants.includes(experimentVariant)) {
    experimentVariants.push(experimentVariant);
  }

  const config: SupportFunnelConfig = {
    enabled,
    fundraiserUrl,
    nostrUrl,
    inviteCopy,
    snoozeDays,
    learnMoreSource: 'accordion',
    experimentEnabled,
    experimentVariant,
    experimentVariants,
  };

  debugLogger.info(DebugCategory.COMPONENT_LOAD, 'Support funnel config resolved', config, true);
  return config;
}
