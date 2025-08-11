/**
 * NetRunner Intel Feature Flag
 *
 * Centralized gate for all Phase 1 Intel transformation + storage logic.
 * This allows merging experimental Intel integration into main safely while the
 * organization pivots focus. Keeping the logic behind a single flag lets future
 * agents or developers enable it instantly (no refactor) and prevents unintended
 * writes / performance overhead when disabled.
 *
 * Enable by setting either:
 *   - process.env.NETRUNNER_INTEL_ENABLED = 'true' (Node / backend tools)
 *   - import.meta.env.NETRUNNER_INTEL_ENABLED = 'true' (Vite front-end build)
 *
 * Default: false (fully inert / no Intel generation or storage side-effects)
 */
export function isNetRunnerIntelEnabled(): boolean {
  try {
    if (typeof process !== 'undefined' && process?.env?.NETRUNNER_INTEL_ENABLED !== undefined) {
      return process.env.NETRUNNER_INTEL_ENABLED === 'true';
    }
    // Safe access to Vite env in browser/build context
    // We avoid referencing bare `import` identifier (reserved) and rely on import.meta global.
    if (typeof import.meta !== 'undefined') {
      const anyMeta = import.meta as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (anyMeta && anyMeta.env && typeof anyMeta.env.NETRUNNER_INTEL_ENABLED !== 'undefined') {
        return anyMeta.env.NETRUNNER_INTEL_ENABLED === 'true';
      }
    }
  } catch (_err) {
    // Ignore and fall through to default false
  }
  return false;
}

/**
 * Utility for inline explanatory logging used by guarded call sites.
 * Keeps log signature consistent so future agents can grep for it easily.
 */
export function logIntelFlagContext(context: string): void {
  // Only log if console available (browser / node) and a mild sampling (always for now)
  if (typeof console !== 'undefined') {
    const enabled = isNetRunnerIntelEnabled();
    console.log(`[NetRunnerIntelFlag] ${context} :: enabled=${enabled}`);
  }
}
