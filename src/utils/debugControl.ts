/**
 * Debug Control System
 * Centralized control for all debug logging to reduce console noise
 */

export interface DebugConfig {
  auth: boolean;
  wallet: boolean;
  siws: boolean;
  network: boolean;
  assets: boolean;
  extensions: boolean;
  performance: boolean;
  lifecycle: boolean;
}

// Default debug configuration - most things OFF for production
const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  auth: false,           // Turn off excessive auth logging
  wallet: false,         // Turn off wallet state monitoring
  siws: false,          // Turn off SIWS detailed logging
  network: false,        // Turn off network/relay errors
  assets: false,         // Turn off 3D asset loading logs
  extensions: false,     // Turn off extension analysis
  performance: false,    // Turn off performance timing
  lifecycle: false       // Turn off component lifecycle logs
};

// Allow debug control via localStorage for development
const getDebugConfig = (): DebugConfig => {
  try {
    const stored = localStorage.getItem('starcom_debug_config');
    if (stored) {
      return { ...DEFAULT_DEBUG_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_DEBUG_CONFIG;
};

export const DEBUG_CONFIG = getDebugConfig();

// Utility functions for conditional logging
export const debugAuth = (message: string, data?: unknown) => {
  if (DEBUG_CONFIG.auth) {
    console.log(`🔐 AUTH: ${message}`, data);
  }
};

export const debugWallet = (message: string, data?: unknown) => {
  if (DEBUG_CONFIG.wallet) {
    console.log(`💳 WALLET: ${message}`, data);
  }
};

export const debugSiws = (message: string, data?: unknown) => {
  if (DEBUG_CONFIG.siws) {
    console.log(`✍️ SIWS: ${message}`, data);
  }
};

export const debugNetwork = (message: string, data?: unknown) => {
  if (DEBUG_CONFIG.network) {
    console.log(`🌐 NETWORK: ${message}`, data);
  }
};

export const debugAssets = (message: string, data?: unknown) => {
  if (DEBUG_CONFIG.assets) {
    console.log(`📦 ASSETS: ${message}`, data);
  }
};

export const debugExtensions = (message: string, data?: unknown) => {
  if (DEBUG_CONFIG.extensions) {
    console.log(`🔌 EXTENSIONS: ${message}`, data);
  }
};

export const debugPerformance = (message: string, data?: unknown) => {
  if (DEBUG_CONFIG.performance) {
    console.log(`⚡ PERFORMANCE: ${message}`, data);
  }
};

export const debugLifecycle = (message: string, data?: unknown) => {
  if (DEBUG_CONFIG.lifecycle) {
    console.log(`🔄 LIFECYCLE: ${message}`, data);
  }
};

// Critical errors should always show
export const debugError = (message: string, data?: unknown) => {
  console.error(`🚨 ERROR: ${message}`, data);
};

// Important info should always show
export const debugInfo = (message: string, data?: unknown) => {
  console.log(`ℹ️ INFO: ${message}`, data);
};

// Enable debug controls in dev tools
if (typeof window !== 'undefined') {
  (window as typeof window & { __STARCOM_DEBUG__: unknown }).__STARCOM_DEBUG__ = {
    enable: (category: keyof DebugConfig) => {
      const config = getDebugConfig();
      config[category] = true;
      localStorage.setItem('starcom_debug_config', JSON.stringify(config));
      console.log(`✅ Debug enabled for: ${category}`);
    },
    disable: (category: keyof DebugConfig) => {
      const config = getDebugConfig();
      config[category] = false;
      localStorage.setItem('starcom_debug_config', JSON.stringify(config));
      console.log(`❌ Debug disabled for: ${category}`);
    },
    enableAll: () => {
      const config = Object.keys(DEFAULT_DEBUG_CONFIG).reduce((acc, key) => {
        acc[key as keyof DebugConfig] = true;
        return acc;
      }, {} as DebugConfig);
      localStorage.setItem('starcom_debug_config', JSON.stringify(config));
      console.log('✅ All debug categories enabled');
    },
    disableAll: () => {
      localStorage.setItem('starcom_debug_config', JSON.stringify(DEFAULT_DEBUG_CONFIG));
      console.log('❌ All debug categories disabled');
    },
    status: () => {
      console.table(getDebugConfig());
    }
  };
  
  console.log('🔧 Debug controls available via window.__STARCOM_DEBUG__');
}
