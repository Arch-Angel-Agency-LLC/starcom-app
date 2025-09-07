/**
 * Deep Link Utility for Analysis Workbench
 *
 * Handles encoding/decoding URL parameters for view state persistence
 * Based on deep-links.md specification
 */

export interface DeepLinkState {
  view?: 'timeline' | 'map' | 'graph' | 'table';
  selected?: string;
  filters?: string; // base64url-encoded JSON
  board?: string;
  ver?: number;
}

/**
 * Encode application state to URL parameters
 */
export const encodeDeepLink = (state: DeepLinkState): string => {
  const params = new URLSearchParams();

  if (state.view) params.set('view', state.view);
  if (state.selected) params.set('selected', state.selected);
  if (state.filters) params.set('filters', state.filters);
  if (state.board) params.set('board', state.board);
  if (state.ver) params.set('ver', state.ver.toString());

  return params.toString();
};

/**
 * Decode URL parameters to application state
 */
export const decodeDeepLink = (search: string): DeepLinkState => {
  const params = new URLSearchParams(search);
  const state: DeepLinkState = {};

  const view = params.get('view');
  if (view && ['timeline', 'map', 'graph', 'table'].includes(view)) {
    state.view = view as DeepLinkState['view'];
  }

  const selected = params.get('selected');
  if (selected) {
    state.selected = selected;
  }

  const filters = params.get('filters');
  if (filters) {
    state.filters = filters;
  }

  const board = params.get('board');
  if (board) {
    state.board = board;
  }

  const ver = params.get('ver');
  if (ver) {
    const version = parseInt(ver, 10);
    if (!isNaN(version)) {
      state.ver = version;
    }
  }

  return state;
};

/**
 * Encode filter state to base64url for URL
 */
export const encodeFilters = (filters: unknown): string => {
  try {
    const json = JSON.stringify(filters);
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Failed to encode filters:', error);
    return '';
  }
};

/**
 * Decode base64url filter state from URL
 */
export const decodeFilters = (encoded: string): unknown => {
  try {
    const json = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode filters:', error);
    return {};
  }
};

/**
 * Revive decoded FilterState-like objects so Date fields are proper Date instances.
 * Currently revives: timeRange.start, timeRange.end when provided as strings.
 * Does not mutate input; returns a shallow-cloned object tree for revived branches.
 */
export const reviveFilterState = <T extends Record<string, any>>(raw: T): T => {
  if (!raw || typeof raw !== 'object') return raw;
  const next: any = { ...raw };
  if (raw.timeRange && typeof raw.timeRange === 'object') {
    const tr: any = raw.timeRange;
    const start = tr.start instanceof Date ? tr.start : (typeof tr.start === 'string' || typeof tr.start === 'number') ? new Date(tr.start) : tr.start;
    const end = tr.end instanceof Date ? tr.end : (typeof tr.end === 'string' || typeof tr.end === 'number') ? new Date(tr.end) : tr.end;
    next.timeRange = { ...tr, start, end };
  }
  return next as T;
};

/**
 * Update URL without triggering navigation
 */
export const updateURL = (state: DeepLinkState): void => {
  const newUrl = `${window.location.pathname}?${encodeDeepLink(state)}`;
  window.history.replaceState(null, '', newUrl);
};

/**
 * Get current deep link state from URL
 */
export const getCurrentDeepLinkState = (): DeepLinkState => {
  return decodeDeepLink(window.location.search);
};

/**
 * Debounced URL update utility
 */
export class DebouncedURLUpdater {
  private timeoutId: number | null = null;
  private readonly delay: number;

  constructor(delay: number = 300) {
    this.delay = delay;
  }

  update(state: DeepLinkState): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      updateURL(state);
      this.timeoutId = null;
    }, this.delay);
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
