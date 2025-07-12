/**
 * NetRunner Constants
 * 
 * Centralized constants for the NetRunner application including API endpoints,
 * configuration values, and error codes.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

/**
 * API Configuration Constants
 */
export const API_CONFIG = {
  // Default timeouts (in milliseconds)
  DEFAULT_TIMEOUT: 30000,
  SEARCH_TIMEOUT: 15000,
  TOOL_TIMEOUT: 60000,
  
  // Rate limiting
  DEFAULT_RATE_LIMIT: 100, // requests per minute
  BURST_LIMIT: 10, // requests per second
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // milliseconds
  RETRY_BACKOFF_FACTOR: 2,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache configuration
  CACHE_TTL: 300000, // 5 minutes in milliseconds
  MAX_CACHE_SIZE: 1000, // number of cached items
} as const;

/**
 * OSINT Source Configuration
 */
export const OSINT_SOURCES = {
  SHODAN: {
    id: 'shodan',
    name: 'Shodan',
    baseUrl: 'https://api.shodan.io',
    category: 'network',
    premium: true,
    rateLimit: 100
  },
  VIRUSTOTAL: {
    id: 'virustotal',
    name: 'VirusTotal',
    baseUrl: 'https://www.virustotal.com/api/v3',
    category: 'security',
    premium: true,
    rateLimit: 500
  },
  CENSYS: {
    id: 'censys',
    name: 'Censys',
    baseUrl: 'https://search.censys.io/api',
    category: 'network',
    premium: true,
    rateLimit: 200
  },
  HUNTER: {
    id: 'hunter',
    name: 'Hunter.io',
    baseUrl: 'https://api.hunter.io',
    category: 'email',
    premium: true,
    rateLimit: 100
  },
  WHOIS: {
    id: 'whois',
    name: 'WHOIS',
    baseUrl: 'https://api.whoisxml.com',
    category: 'domain',
    premium: false,
    rateLimit: 1000
  }
} as const;

/**
 * Tool Categories
 */
export const TOOL_CATEGORIES = {
  DISCOVERY: 'discovery',
  SCRAPING: 'scraping',
  AGGREGATION: 'aggregation',
  ANALYSIS: 'analysis',
  VERIFICATION: 'verification',
  VISUALIZATION: 'visualization',
  AUTOMATION: 'automation'
} as const;

/**
 * Search Filter Constants
 */
export const SEARCH_FILTERS = {
  TIME_RANGES: {
    LAST_HOUR: '1h',
    LAST_DAY: '1d',
    LAST_WEEK: '1w',
    LAST_MONTH: '1M',
    LAST_YEAR: '1y',
    ALL_TIME: 'all'
  },
  CONFIDENCE_LEVELS: {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8,
    VERY_HIGH: 0.9
  },
  SORT_OPTIONS: {
    RELEVANCE: 'relevance',
    DATE: 'date',
    CONFIDENCE: 'confidence',
    SOURCE: 'source'
  }
} as const;

/**
 * UI Constants
 */
export const UI_CONFIG = {
  // Notification durations (in milliseconds)
  NOTIFICATION_DURATION: {
    INFO: 4000,
    WARNING: 6000,
    ERROR: 8000,
    SUCCESS: 3000
  },
  
  // Debounce delays (in milliseconds)
  SEARCH_DEBOUNCE: 500,
  INPUT_DEBOUNCE: 300,
  
  // Animation durations (in milliseconds)
  FADE_DURATION: 200,
  SLIDE_DURATION: 300,
  
  // Component sizes
  MAX_SEARCH_HISTORY: 10,
  MAX_RESULTS_PER_PAGE: 50,
  SIDEBAR_WIDTH: 280,
  
  // Theme colors (for reference)
  COLORS: {
    PRIMARY: '#1976d2',
    SECONDARY: '#dc004e',
    SUCCESS: '#2e7d32',
    WARNING: '#ed6c02',
    ERROR: '#d32f2f',
    INFO: '#0288d1'
  }
} as const;

/**
 * Logging Constants
 */
export const LOGGING_CONFIG = {
  LEVELS: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
  },
  
  MAX_LOG_ENTRIES: 1000,
  LOG_ROTATION_SIZE: 10 * 1024 * 1024, // 10MB
  
  COMPONENTS: {
    APPLICATION: 'NetRunnerApplication',
    SEARCH_SERVICE: 'NetRunnerSearchService',
    ERROR_HANDLER: 'NetRunnerErrorHandler',
    TOOL_ADAPTER: 'ToolAdapter',
    WORKFLOW_ENGINE: 'WorkflowEngine'
  }
} as const;

/**
 * Error Code Prefixes
 */
export const ERROR_PREFIXES = {
  TOOL: 'NET-TOOL',
  SEARCH: 'NET-SRCH',
  WORKFLOW: 'NET-FLOW',
  BOT: 'NET-BOT',
  ANALYZER: 'NET-ANLZ',
  INTEGRATION: 'NET-INTG',
  SYSTEM: 'NET-SYS'
} as const;

/**
 * Environment Configuration
 */
export const ENV_CONFIG = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  
  // Feature flags
  FEATURES: {
    REAL_API_CALLS: process.env.NODE_ENV === 'production',
    DEBUG_LOGGING: process.env.NODE_ENV === 'development',
    CACHE_ENABLED: true,
    ANALYTICS_ENABLED: process.env.NODE_ENV === 'production'
  }
} as const;

/**
 * Regular Expressions for Validation
 */
export const VALIDATION_REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  DOMAIN: /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/,
  URL: /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?$/,
  HASH_MD5: /^[a-fA-F0-9]{32}$/,
  HASH_SHA1: /^[a-fA-F0-9]{40}$/,
  HASH_SHA256: /^[a-fA-F0-9]{64}$/
} as const;
