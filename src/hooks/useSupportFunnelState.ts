import { useCallback, useState } from 'react';
import { SupportFunnelConfig } from '../config/supportFunnelConfig';

export type SupportFunnelLastAction =
  | 'nostr'
  | 'fund'
  | 'learn'
  | 'copy'
  | 'snooze'
  | 'dismiss'
  | 'close'
  | null;

export type SupportFunnelState = {
  impressionSeen: boolean;
  snoozeUntil: number | null;
  dismissed: boolean;
  lastAction: SupportFunnelLastAction;
};

const STORAGE_KEY = 'support_funnel_v1';
const now = () => Date.now();

let memoryState: SupportFunnelState | null = null;

function hasStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__support_funnel_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const defaultState = (): SupportFunnelState => ({ impressionSeen: false, snoozeUntil: null, dismissed: false, lastAction: null });

function loadState(): SupportFunnelState {
  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw) as SupportFunnelState;
      return {
        impressionSeen: Boolean(parsed.impressionSeen),
        snoozeUntil: parsed.snoozeUntil ?? null,
        dismissed: Boolean(parsed.dismissed),
        lastAction: (parsed.lastAction as SupportFunnelLastAction) ?? null,
      };
    } catch {
      return defaultState();
    }
  }

  // private mode or SSR fallback
  if (!memoryState) {
    memoryState = defaultState();
  }
  return memoryState;
}

function persistState(state: SupportFunnelState) {
  if (hasStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return;
    } catch {
      // fall through to memory
    }
  }
  memoryState = state;
}

export function useSupportFunnelState(config: Pick<SupportFunnelConfig, 'snoozeDays' | 'enabled'>) {
  const [state, setState] = useState<SupportFunnelState>(loadState);

  const save = useCallback((updater: (prev: SupportFunnelState) => SupportFunnelState) => {
    setState(prev => {
      const next = updater(prev);
      persistState(next);
      return next;
    });
  }, []);

  const markImpression = useCallback(() => {
    save(prev => ({ ...prev, impressionSeen: true }));
  }, [save]);

  const markSnooze = useCallback(() => {
    const snoozeMs = config.snoozeDays * 24 * 60 * 60 * 1000;
    const until = now() + snoozeMs;
    save(prev => ({ ...prev, snoozeUntil: until, lastAction: 'snooze' }));
  }, [config.snoozeDays, save]);

  const markDismiss = useCallback(() => {
    save(prev => ({ ...prev, dismissed: true, lastAction: 'dismiss' }));
  }, [save]);

  const markAction = useCallback((action: SupportFunnelLastAction) => {
    save(prev => ({ ...prev, lastAction: action }));
  }, [save]);

  const reset = useCallback(() => {
    save(() => ({ impressionSeen: false, snoozeUntil: null, dismissed: false, lastAction: null }));
  }, [save]);

  const eligible = config.enabled && !state.dismissed && (!state.snoozeUntil || state.snoozeUntil <= now());

  return {
    state,
    eligible,
    markImpression,
    markSnooze,
    markDismiss,
    markAction,
    reset,
  };
}
