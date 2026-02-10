import { DebugCategory, debugLogger } from '../utils/debugLogger';

export type SupportFunnelEvent =
  | 'funnel_impression'
  | 'cta_nostr_click'
  | 'cta_fund_click'
  | 'cta_learn_more'
  | 'copy_invite'
  | 'action_snooze'
  | 'action_dismiss'
  | 'entry_open'
  | 'fallback_open_link'
  | 'variant_exposure';

export type SupportFunnelPayload = {
  event: SupportFunnelEvent;
  target?: 'nostr' | 'fund' | 'learn' | 'copy' | 'snooze' | 'dismiss' | 'entry' | 'fallback';
  variant?: string | null;
  sessionId?: string;
  env?: string;
  ts?: number;
  reason?: string;
};

export function trackSupportEvent(payload: SupportFunnelPayload): void {
  const ts = payload.ts || Date.now();
  const env = payload.env || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.MODE : undefined) || 'production';
  const body = { ...payload, ts, env };
  debugLogger.info(DebugCategory.COMPONENT_LOAD, 'Support funnel event', body, true);
}
