/**
 * Type declarations for CSS modules and other non-standard imports
 */

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

/**
 * Additional declarations for testing and environment variables
 */

// Vite environment variables
interface ImportMeta {
  env: {
    MODE: string;
    BASE_URL: string;
    PROD: boolean;
    DEV: boolean;
    SSR: boolean;
    VITE_API_URL?: string;
    VITE_MOCK_DATA?: string;
    VITE_OSINT_PROVIDERS?: string;
    [key: string]: any;
  };
}

// Declaration for test IDs (useful for testing)
declare namespace TestIds {
  const RESULTS_PANEL: string;
  const ERROR_DISPLAY: string;
  const SEARCH_BAR: string;
  const OPSEC_PANEL: string;
  const LOADING_INDICATOR: string;
  const RETRY_BUTTON: string;
  const DISMISS_BUTTON: string;
}
