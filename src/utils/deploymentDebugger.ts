// src/utils/deploymentDebugger.ts
/**
 * Production/Deployment Debugging Utility
 * 
 * This utility provides enhanced visibility into assets, imports, and runtime issues
 * specifically for production environments like Vercel. It creates detailed diagnostic
 * logs in the console that can help identify issues that only appear in production.
 * 
 * Now controlled by feature flags to reduce noise in production.
 */

import { featureFlagManager } from './featureFlags';

// Standardized console output with categories
const DEBUG_CATEGORIES = {
  ASSET_LOADING: '🖼️ ASSET LOADING',
  MODEL_LOADING: '📦 3D MODEL LOADING',
  NETWORK: '🌐 NETWORK',
  INITIALIZATION: '🚀 INITIALIZATION',
  PATHS: '🛣️ PATH RESOLUTION',
  ERRORS: '❌ ERRORS',
  CONFIG: '⚙️ CONFIG',
  FEATURE_FLAG: '🏁 FEATURE FLAG',
  PERFORMANCE: '⚡ PERFORMANCE',
  THREEJS_LOADING: '🔃 THREE.JS LOADING',
  ASSET_REGISTRY: '📋 ASSET REGISTRY',
  TEXTURE_LOADING: '🎨 TEXTURE LOADING',
  FILE_RESOLUTION: '🔍 FILE RESOLUTION',
  MIME_TYPES: '📄 MIME TYPES',
  CORS_ISSUES: '🌐 CORS ISSUES',
  CACHE_INFO: '💾 CACHE INFO',
} as const;

// Runtime environment detection
const ENV = {
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  isVercel: typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'),
  isTesting: import.meta.env.MODE === 'test',
  baseUrl: import.meta.env.BASE_URL || '/',
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  timestamp: new Date().toISOString(),
};

// Configuration for the debugger
const CONFIG = {
  // Set this to true to enable verbose debugging in production
  enableInProduction: false, // Changed to false - now controlled by feature flags
  // Minimum log level to display
  minLevel: 'info',
  // Maximum depth for object serialization
  maxDepth: 5,
  // Should logging be forced even in production?
  forceLogging: false, // Changed to false - now controlled by feature flags
  // Version tag to track which deployment version is running
  versionTag: '3d-assets-debugging-1.0',
};

/**
 * Debug levels
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Debug Category Type
 */
type DebugCategory = typeof DEBUG_CATEGORIES[keyof typeof DEBUG_CATEGORIES];

/**
 * Options for debug logs
 */
interface DebugOptions {
  level?: LogLevel;
  category?: DebugCategory;
  timestamp?: boolean;
  expanded?: boolean;
  includeEnv?: boolean;
  ignoreProductionSetting?: boolean;
}

/**
 * Asset information structure
 */
interface AssetInfo {
  url: string;
  type: string;
  status: 'loading' | 'success' | 'error';
  timings?: {
    start?: number;
    end?: number;
    duration?: number;
  };
  error?: unknown;
  metadata?: Record<string, unknown>;
  // Enhanced tracking for 3D models
  registeredName?: string;     // Name the model was registered with
  mimeType?: string;           // MIME type if detected
  size?: number;               // Size in bytes if available
  responseCode?: number;       // HTTP response code 
  contentType?: string;        // Content-Type header from response
  retryCount?: number;         // Number of load retries attempted
  fallbackUsed?: boolean;      // Whether a fallback was used
  loadStack?: string;          // Stack trace of where the load was initiated
  alternativePathsChecked?: string[]; // Other paths checked for this asset
}

// Track all asset load attempts
const assetLoadAttempts: Record<string, AssetInfo> = {};

/**
 * Main debug logging function
 */
export function debugLog(
  message: string,
  data?: unknown,
  options: DebugOptions = {}
): void {
  const {
    level = 'info',
    category = DEBUG_CATEGORIES.INITIALIZATION,
    timestamp = true,
    expanded = false,
    includeEnv = false,
    ignoreProductionSetting = false,
  } = options;

  // Check feature flags first
  const isDeploymentDebugEnabled = featureFlagManager.getFlag('deploymentDebugLoggingEnabled');
  const isAssetDebugEnabled = featureFlagManager.getFlag('assetDebugLoggingEnabled');
  const is3DAssetDebugEnabled = featureFlagManager.getFlag('threeDAssetLoggingEnabled');
  const isIntelReportDebugEnabled = featureFlagManager.getFlag('intelReportLoggingEnabled');
  
  // Determine if this log should be shown based on category and feature flags
  let shouldLog = false;
  
  if (category.includes('3D') || category.includes('MODEL') || message.toLowerCase().includes('intel')) {
    // 3D Asset specific logs
    if (message.toLowerCase().includes('intel')) {
      shouldLog = isIntelReportDebugEnabled;
    } else {
      shouldLog = is3DAssetDebugEnabled;
    }
  } else if (category.includes('ASSET')) {
    shouldLog = isAssetDebugEnabled;
  } else {
    shouldLog = isDeploymentDebugEnabled;
  }
  
  // Skip logging if feature flags are disabled and not forced
  if (!shouldLog && !ignoreProductionSetting) {
    return;
  }

  // Skip logging in production unless specifically enabled
  if (
    ENV.isProduction &&
    !CONFIG.enableInProduction &&
    !ignoreProductionSetting &&
    !shouldLog
  ) {
    return;
  }

  // Prepare log parts
  const timePart = timestamp ? `[${new Date().toISOString()}]` : '';
  const envPart = ENV.isProduction ? '[PROD]' : ENV.isDevelopment ? '[DEV]' : '[TEST]';
  const vercelPart = ENV.isVercel ? '[VERCEL]' : '';
  const categoryPart = `${category}:`;
  const versionPart = `[v${CONFIG.versionTag}]`;

  // Format header
  const header = `${timePart} ${envPart}${vercelPart} ${versionPart} ${categoryPart}`;

  // Select appropriate console method
  let logMethod: 'log' | 'info' | 'warn' | 'error' = 'log';
  switch (level) {
    case 'debug':
      logMethod = 'log';
      break;
    case 'info':
      logMethod = 'info';
      break;
    case 'warn':
      logMethod = 'warn';
      break;
    case 'error':
      logMethod = 'error';
      break;
  }

  // Log the message
  console[logMethod](`${header} ${message}`);

  // Log additional data if provided
  if (data !== undefined) {
    if (expanded) {
      console.groupCollapsed('Expanded Data');
      console[logMethod](data);
      console.groupEnd();
    } else {
      console[logMethod](data);
    }
  }

  // Include environment info if requested
  if (includeEnv) {
    console.groupCollapsed('Environment Info');
    console.log(ENV);
    console.groupEnd();
  }
}

/**
 * Debug asset loading
 */
export function debugAssetLoading(
  url: string,
  type: string,
  status: 'loading' | 'success' | 'error',
  error?: unknown,
  metadata?: Record<string, unknown>
): void {
  // Get stack trace for debugging where the asset load was initiated
  const stackTrace = new Error().stack || '';
  const registeredName = metadata?.name as string || 'unnamed';
  
  // Create or update asset info
  if (!assetLoadAttempts[url]) {
    // First time seeing this asset
    assetLoadAttempts[url] = {
      url,
      type,
      status,
      timings: {
        start: performance.now(),
      },
      metadata,
      registeredName: metadata?.name as string || '',
      loadStack: stackTrace,
      retryCount: 0,
      alternativePathsChecked: [],
    };
    
    // Enhanced logging for model registration
    if (type.includes('model') || type.includes('glb') || url.includes('.glb')) {
      debugLog(
        `Registered ${type}: ${registeredName}`,
        { 
          url, 
          type,
          registeredName,
          timestamp: new Date().toISOString(),
        },
        {
          category: DEBUG_CATEGORIES.ASSET_REGISTRY,
          level: 'info',
          ignoreProductionSetting: true,
        }
      );
    }
  } else {
    // Update existing asset info
    assetLoadAttempts[url].status = status;
    assetLoadAttempts[url].metadata = {
      ...assetLoadAttempts[url].metadata,
      ...metadata,
    };
    
    // Record retry count if this is an additional attempt
    if (status === 'loading' && assetLoadAttempts[url].timings?.start) {
      assetLoadAttempts[url].retryCount = (assetLoadAttempts[url].retryCount || 0) + 1;
    }
    
    // Update timings for completed operations
    if (status === 'success' || status === 'error') {
      const timings = assetLoadAttempts[url].timings || {};
      timings.end = performance.now();
      timings.duration = timings.end - (timings.start || 0);
      assetLoadAttempts[url].timings = timings;
      
      // For 3D models, log timing information
      if (type.includes('model') || type.includes('glb') || url.includes('.glb')) {
        const duration = timings.duration?.toFixed(2) || 'unknown';
        debugLog(
          `Model ${status === 'success' ? 'loading' : 'failure'} timing: ${duration}ms for ${url}`,
          { 
            url, 
            duration: `${duration}ms`,
            retryCount: assetLoadAttempts[url].retryCount
          },
          {
            category: DEBUG_CATEGORIES.PERFORMANCE,
            level: 'info',
            ignoreProductionSetting: true,
          }
        );
      }
    }
    
    // Store error information
    if (status === 'error' && error) {
      assetLoadAttempts[url].error = error;
      
      // Check if this is a 404 error from fetch responses
      if (typeof error === 'object' && error !== null) {
        const errorObj = error as { status?: number; statusText?: string; message?: string };
        
        if (errorObj.status === 404 || 
            (errorObj.message && errorObj.message.includes('404')) ||
            (errorObj.statusText && errorObj.statusText.includes('Not Found'))) {
          assetLoadAttempts[url].responseCode = 404;
          
          // Log this specifically as a critical file not found
          debugLog(
            `🚨 CRITICAL: FILE NOT FOUND (404) - ${url}`,
            {
              url,
              type,
              resolvedUrl: url.startsWith('/') ? `${window.location.origin}${url}` : url,
              registeredName,
              possiblePaths: getSuggestedAlternativePaths(url),
            },
            {
              category: DEBUG_CATEGORIES.ERRORS,
              level: 'error',
              ignoreProductionSetting: true,
            }
          );
        }
      }
    }
  }

  // Log appropriate message based on status
  const category = type.includes('model') || type.includes('glb') || type.includes('gltf')
    ? DEBUG_CATEGORIES.MODEL_LOADING
    : DEBUG_CATEGORIES.ASSET_LOADING;

  const options: DebugOptions = {
    category,
    ignoreProductionSetting: true, // Always log asset errors even in production
    level: status === 'error' ? 'error' : 'info',
  };

  let message = '';
  switch (status) {
    case 'loading':
      message = `Loading ${type}: ${url}${assetLoadAttempts[url].retryCount ? ` (Attempt ${assetLoadAttempts[url].retryCount + 1})` : ''}`;
      break;
    case 'success':
      message = `Successfully loaded ${type}: ${url}`;
      break;
    case 'error':
      message = `Failed to load ${type}: ${url}${assetLoadAttempts[url].retryCount ? ` (After ${assetLoadAttempts[url].retryCount + 1} attempts)` : ''}`;
      break;
  }

  const data = {
    url,
    type,
    status,
    timings: assetLoadAttempts[url].timings,
    retryCount: assetLoadAttempts[url].retryCount,
    registeredName: assetLoadAttempts[url].registeredName,
    ...(status === 'error' && { error }),
    ...(metadata && { metadata }),
  };

  debugLog(message, data, options);

  // For errors, also log detailed diagnostics
  if (status === 'error') {
    logDetailedAssetDiagnostics(url, error);
    
    // Check if we should test alternative paths
    if (assetLoadAttempts[url].responseCode === 404) {
      const alternativePaths = getSuggestedAlternativePaths(url);
      
      if (alternativePaths.length > 0) {
        debugLog(
          `🔍 Testing alternative paths for ${url}`,
          { alternativePaths },
          { 
            category: DEBUG_CATEGORIES.FILE_RESOLUTION,
            level: 'info',
            ignoreProductionSetting: true
          }
        );
        
        // Store that we've checked these paths
        assetLoadAttempts[url].alternativePathsChecked = alternativePaths;
        
        // Test each alternative path
        alternativePaths.forEach(path => {
          testUrlAccessibility(path, `Alternative path for ${url}`);
        });
      }
    }
  }
}

/**
 * Log detailed diagnostics for asset loading errors
 */
function logDetailedAssetDiagnostics(url: string, error?: unknown): void {
  debugLog(
    '📊 DETAILED ASSET DIAGNOSTICS',
    {
      url,
      // Check if the URL is absolute or relative
      isAbsoluteUrl: url.startsWith('http') || url.startsWith('//'),
      // Check if the URL starts with a slash (server root)
      isServerRootPath: url.startsWith('/') && !url.startsWith('//'),
      // Check if URL has query parameters
      hasQueryParams: url.includes('?'),
      // Environment base URL
      baseUrl: ENV.baseUrl,
      // Resolved URL (if relative)
      resolvedUrl: url.startsWith('/')
        ? `${window.location.origin}${url}`
        : new URL(url, window.location.href).href,
      // Error details
      error: error ? {
        message: typeof error === 'object' && error !== null && 'message' in error ? error.message : String(error),
        name: typeof error === 'object' && error !== null && 'name' in error ? error.name : 'UnknownError',
        stack: typeof error === 'object' && error !== null && 'stack' in error ? error.stack : 'Stack unavailable',
      } : 'No error details available',
      // Browser cache status (if available)
      cache: 'Cannot detect cache status programmatically',
      // CORS info
      cors: {
        isCrossOrigin: url.startsWith('http') && !url.includes(window.location.hostname),
        currentOrigin: window.location.origin,
      },
      // Vercel specific
      vercelInfo: ENV.isVercel ? {
        isVercelDeployment: true,
        hostname: window.location.hostname,
      } : null,
    },
    {
      category: DEBUG_CATEGORIES.ERRORS,
      expanded: true,
      ignoreProductionSetting: true,
      level: 'error',
    }
  );

  // Try to fetch the asset to check status code
  if (url.startsWith('/') || url.startsWith('http')) {
    const fetchUrl = url.startsWith('/') 
      ? `${window.location.origin}${url}` 
      : url;
    
    debugLog(`🧪 Testing asset fetch: ${fetchUrl}`, null, {
      category: DEBUG_CATEGORIES.NETWORK,
      level: 'info',
    });
    
    fetch(fetchUrl, { method: 'HEAD' })
      .then(response => {
        const diagnosticInfo = {
          url: fetchUrl,
          status: response.status,
          statusText: response.statusText,
          headers: Array.from(response.headers.entries()),
          ok: response.ok,
        };
        
        debugLog(
          `🧪 Asset fetch test result: ${response.status} ${response.statusText}`,
          diagnosticInfo,
          {
            category: DEBUG_CATEGORIES.NETWORK,
            level: response.ok ? 'info' : 'error',
            ignoreProductionSetting: true,
          }
        );
      })
      .catch(fetchError => {
        debugLog(
          `🧪 Asset fetch test failed`,
          {
            url: fetchUrl,
            error: {
              message: fetchError.message,
              name: fetchError.name,
              stack: fetchError.stack,
            },
          },
          {
            category: DEBUG_CATEGORIES.NETWORK,
            level: 'error',
            ignoreProductionSetting: true,
          }
        );
      });
  }
}

/**
 * Debug path resolutions
 */
export function debugPathResolution(
  originalPath: string,
  resolvedPath: string,
  context: string
): void {
  debugLog(
    `Path resolution for ${context}`,
    {
      originalPath,
      resolvedPath,
      isAbsolute: originalPath.startsWith('/') || originalPath.startsWith('http'),
      baseUrl: ENV.baseUrl,
    },
    {
      category: DEBUG_CATEGORIES.PATHS,
      level: 'info',
    }
  );
}

/**
 * Get expected MIME type based on file extension
 */
function getExpectedMimeType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'glb':
      return 'model/gltf-binary';
    case 'gltf':
      return 'model/gltf+json';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'svg':
      return 'image/svg+xml';
    case 'json':
      return 'application/json';
    case 'js':
      return 'application/javascript';
    case 'css':
      return 'text/css';
    case 'html':
      return 'text/html';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Get troubleshooting suggestions based on asset type and path
 */
function getTroubleshootingSuggestions(urlOrErrorType: string, context?: Record<string, unknown>): string[] {
  const isErrorType = ['notFound', 'fetchFailed', 'corsIssue', 'glbLoadingFailed', 'mimeTypeMismatch'].includes(urlOrErrorType);
  const url = isErrorType && context?.url ? context.url as string : urlOrErrorType;
  
  const suggestions: string[] = [
    'Check if the file exists at the specified path',
    'Verify the URL is correct and accessible',
  ];
  
  // Add specialized suggestions based on file type
  if (url.includes('.glb') || url.includes('.gltf')) {
    suggestions.push(
      'Ensure 3D models are in the /public/models/ directory',
      'Check that the model file is not excluded by .vercelignore',
      'Try referencing the model with an absolute path from root (e.g., /models/your-model.glb)',
      'Verify the model file permissions (should be readable)',
      'Check for case sensitivity issues in the filename'
    );
  } else if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) {
    suggestions.push(
      'Ensure images are in the public directory',
      'Check for correct file extension and case sensitivity',
      'Verify image is not corrupted'
    );
  }
  
  // Add specific suggestions for fetch errors
  if (isErrorType) {
    if (urlOrErrorType === 'notFound') {
      suggestions.push(
        '404 errors indicate the file is not present at the specified path',
        'Check if file was included in your deployment',
        'Try alternative paths like /public/ or /assets/'
      );
    } else if (urlOrErrorType === 'fetchFailed') {
      suggestions.push(
        'Network errors might indicate CORS issues or server problems',
        'Check your network connection',
        'Verify the server is responding correctly'
      );
    } else if (urlOrErrorType === 'corsIssue') {
      suggestions.push(
        'CORS errors occur when accessing resources from a different origin',
        'Check that the server allows cross-origin requests',
        'Add appropriate CORS headers to your server or CDN configuration'
      );
    } else if (urlOrErrorType === 'glbLoadingFailed') {
      suggestions.push(
        'GLB loading failures often indicate file corruption or format issues',
        'Verify the GLB file was exported correctly from your 3D software',
        'Check that all required textures are properly embedded in the GLB'
      );
    } else if (urlOrErrorType === 'mimeTypeMismatch') {
      suggestions.push(
        'MIME type mismatches can cause loading issues, especially for 3D content',
        'Configure your server to serve .glb files with Content-Type: model/gltf-binary',
        'For Vercel, add a vercel.json file with appropriate header configuration'
      );
    }
  }
  
  // Add suggestions for Vercel deployment
  if (ENV.isVercel) {
    suggestions.push(
      'Inspect .vercelignore file to ensure assets are not excluded',
      'Check Vercel build logs to see if files were deployed',
      'Verify the path is correct for Vercel\'s directory structure'
    );
  }
  
  return suggestions;
}

/**
 * Get and log all loaded assets in the current document
 */
export function logLoadedAssets(): void {
  interface AssetEntry {
    src?: string;
    href?: string;
    alt?: string;
    width?: number;
    height?: number;
    loading?: string;
    complete?: boolean;
    type?: string;
    async?: boolean;
    defer?: boolean;
    rel?: string;
    media?: string;
  }

  const assets: Record<string, AssetEntry[]> = {
    images: [],
    scripts: [],
    links: [],
    styles: [],
    other: [],
  };

  // Collect all image elements
  document.querySelectorAll('img').forEach(img => {
    assets.images.push({
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
      loading: img.loading,
      complete: img.complete,
    });
  });

  // Collect all script elements
  document.querySelectorAll('script').forEach(script => {
    assets.scripts.push({
      src: script.src,
      type: script.type,
      async: script.async,
      defer: script.defer,
    });
  });

  // Collect all link elements
  document.querySelectorAll('link').forEach(link => {
    assets.links.push({
      href: link.href,
      rel: link.rel,
      type: link.type,
    });
  });

  // Collect all style elements
  document.querySelectorAll('style').forEach(style => {
    assets.styles.push({
      type: style.type,
      media: style.media,
    });
  });

  // Log collected assets
  debugLog(
    '📝 Document Assets Inventory',
    assets,
    {
      category: DEBUG_CATEGORIES.ASSET_LOADING,
      expanded: true,
      level: 'info',
    }
  );
}

/**
 * Format bytes to a human-readable string
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Test URL accessibility directly
 */
export function testUrlAccessibility(url: string, description: string = 'Generic asset'): Promise<Response | void> {
  debugLog(
    `🧪 Testing URL accessibility: ${url} (${description})`,
    null,
    {
      category: DEBUG_CATEGORIES.NETWORK,
      level: 'info',
    }
  );

  const startTime = performance.now();
  
  return fetch(url, { method: 'GET', cache: 'no-cache' })
    .then(async response => {
      const duration = performance.now() - startTime;
      
      // Get enhanced diagnostics
      const enhancedInfo = await enhanceAssetDiagnostics(response, url);
      
      // Add duration and description
      enhancedInfo.description = description;
      enhancedInfo.duration = `${duration.toFixed(2)}ms`;

      // Identify root cause for any issues detected
      const rootCauseAnalysis = identifyRootCause(enhancedInfo);
      enhancedInfo.duration = `${duration.toFixed(2)}ms`;
      
      // Determine if there are issues based on diagnostics
      const hasWarnings = enhancedInfo.mimeTypeMismatch || 
                         (enhancedInfo.glbValidation && !enhancedInfo.glbValidation.valid) || 
                         enhancedInfo.sizeWarning != null || 
                         enhancedInfo.diagnosticError != null || 
                         !response.ok;
      
      // Format content length for display
      const formattedSize = enhancedInfo.contentLength !== 'unknown' 
        ? formatBytes(Number(enhancedInfo.contentLength)) 
        : 'unknown size';
      
      debugLog(
        `🧪 URL test result for ${description}: ${response.status} ${response.statusText} (${duration.toFixed(2)}ms)`,
        {
          ...enhancedInfo,
          formattedSize, // Add formatted size for readability
          ...(hasWarnings ? { rootCause: rootCauseAnalysis } : {}) // Add root cause analysis when there are warnings
        },
        {
          category: DEBUG_CATEGORIES.NETWORK,
          level: hasWarnings ? 'warn' : (response.ok ? 'info' : 'error'),
          ignoreProductionSetting: true,
          expanded: hasWarnings || !response.ok,
        }
      );
      
      // For successful 3D model loads, provide focused analysis in a separate log
      if (response.ok && (url.includes('.glb') || url.includes('.gltf'))) {
        const modelAnalysis = {
          url,
          size: formattedSize,
          contentType: enhancedInfo.contentType,
          expectedContentType: enhancedInfo.expectedContentType,
          contentTypeMismatch: enhancedInfo.mimeTypeMismatch,
          modelValidation: enhancedInfo.glbValidation || { 
            valid: null, 
            note: "Not a GLB file or validation not performed" 
          },
          deploymentInfo: ENV.isVercel ? {
            isVercel: true,
            deploymentUrl: window.location.origin,
            loadTimestamp: new Date().toISOString(),
          } : null,
        };
        
        debugLog(
          `📊 3D Model file analysis: ${url}`,
          modelAnalysis,
          {
            category: DEBUG_CATEGORIES.MODEL_LOADING,
            level: 'info',
            ignoreProductionSetting: true,
            expanded: true,
          }
        );
      }
      
      return response;
    })
    .catch(error => {
      const duration = performance.now() - startTime;
      
      // Create a minimal enhancedInfo object for network errors
      const enhancedInfo: Partial<EnhancedAssetInfo> = {
        url,
        status: 0, // 0 indicates network error
        statusText: 'Network Error',
        contentType: 'unknown',
        expectedContentType: getExpectedMimeType(url),
        contentLength: 'unknown',
      };
      
      // Get root cause analysis for the error
      const rootCauseAnalysis = identifyRootCause(enhancedInfo as EnhancedAssetInfo);
      
      debugLog(
        `🧪 URL test failed for ${description}`,
        {
          url,
          description,
          error: {
            message: typeof error === 'object' && error !== null && 'message' in error ? error.message : String(error),
            name: typeof error === 'object' && error !== null && 'name' in error ? error.name : 'UnknownError',
            stack: typeof error === 'object' && error !== null && 'stack' in error ? error.stack : 'Stack unavailable',
          },
          duration: `${duration.toFixed(2)}ms`,
          rootCause: rootCauseAnalysis, // Add root cause analysis
          troubleshootingSuggestions: getTroubleshootingSuggestions('fetchFailed', { url }),
          alternativePaths: getSuggestedAlternativePaths(url),
        },
        {
          category: DEBUG_CATEGORIES.NETWORK,
          level: 'error',
          ignoreProductionSetting: true,
        }
      );
      
      throw error;
    });
}

/**
 * Generate alternative paths to check for an asset
 */
function getSuggestedAlternativePaths(url: string): string[] {
  const alternativePaths: string[] = [];
  
  // Handle 3D model files
  if (url.includes('.glb') || url.includes('.gltf')) {
    const fileName = url.split('/').pop() || '';
    
    // Common variations for model paths
    alternativePaths.push(
      `/models/${fileName}`,
      `/public/models/${fileName}`,
      `/assets/models/${fileName}`,
      `/assets/3d/${fileName}`,
      `/public/assets/models/${fileName}`
    );
    
    // For models that might be in src
    if (!url.includes('/src/')) {
      alternativePaths.push(`/src/assets/models/${fileName}`);
    }
  } 
  // Handle image files
  else if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || 
           url.includes('.svg') || url.includes('.gif') || url.includes('.webp')) {
    const fileName = url.split('/').pop() || '';
    
    alternativePaths.push(
      `/assets/images/${fileName}`,
      `/public/assets/images/${fileName}`,
      `/images/${fileName}`,
      `/public/images/${fileName}`
    );
    
    // For images that might be in src
    if (!url.includes('/src/')) {
      alternativePaths.push(`/src/assets/images/${fileName}`);
    }
  }
  
  // Remove the original URL from alternatives
  return alternativePaths.filter(path => path !== url);
}

/**
 * Run comprehensive diagnostics
 */
export function runComprehensiveDiagnostics(specificAssetUrl?: string): void {
  // Log environment information
  debugLog(
    '🔍 Running Comprehensive Diagnostics',
    {
      ...ENV,
      windowLocation: {
        href: window.location.href,
        hostname: window.location.hostname,
        origin: window.location.origin,
        pathname: window.location.pathname,
        protocol: window.location.protocol,
      },
      screenInfo: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      memoryInfo: (performance as unknown as { memory?: { 
        jsHeapSizeLimit: number,
        totalJSHeapSize: number,
        usedJSHeapSize: number 
      }}).memory 
        ? {
            jsHeapSizeLimit: (performance as unknown as { memory: { jsHeapSizeLimit: number }}).memory.jsHeapSizeLimit,
            totalJSHeapSize: (performance as unknown as { memory: { totalJSHeapSize: number }}).memory.totalJSHeapSize,
            usedJSHeapSize: (performance as unknown as { memory: { usedJSHeapSize: number }}).memory.usedJSHeapSize,
          }
        : 'Not available',
      vercelInfo: ENV.isVercel ? {
        isVercelDeployment: true,
        hostname: window.location.hostname,
        deploymentUrl: window.location.origin,
      } : 'Not a Vercel deployment',
    },
    {
      category: DEBUG_CATEGORIES.INITIALIZATION,
      expanded: true,
      level: 'info',
      ignoreProductionSetting: true,
    }
  );

  // Log loaded assets
  logLoadedAssets();

  // Test specific asset if provided
  if (specificAssetUrl) {
    debugLog(
      `🧪 Running specific asset diagnostics for: ${specificAssetUrl}`,
      {
        url: specificAssetUrl,
        resolvedUrl: specificAssetUrl.startsWith('/') 
          ? `${window.location.origin}${specificAssetUrl}` 
          : new URL(specificAssetUrl, window.location.origin).href,
        expectedMimeType: getExpectedMimeType(specificAssetUrl),
        troubleshootingSuggestions: getTroubleshootingSuggestions(specificAssetUrl)
      },
      {
        category: DEBUG_CATEGORIES.ASSET_LOADING,
        level: 'info',
        ignoreProductionSetting: true,
        expanded: true,
      }
    );
    
    testUrlAccessibility(specificAssetUrl, '3D Model GLB');
    
    // If it's a relative URL, also test the absolute version
    if (specificAssetUrl.startsWith('/')) {
      testUrlAccessibility(
        `${window.location.origin}${specificAssetUrl}`,
        '3D Model GLB (absolute URL)'
      );
    }
    
    // For 3D models, check both with and without public prefix
    if (specificAssetUrl.includes('.glb') || specificAssetUrl.includes('.gltf')) {
      if (specificAssetUrl.startsWith('/') && !specificAssetUrl.startsWith('/public/')) {
        // Test with /public/ prefix
        const withPublicPrefix = `/public${specificAssetUrl}`;
        testUrlAccessibility(withPublicPrefix, '3D Model GLB (with /public prefix)');
      } else if (specificAssetUrl.startsWith('/public/')) {
        // Test without /public/ prefix
        const withoutPublicPrefix = specificAssetUrl.replace('/public', '');
        testUrlAccessibility(withoutPublicPrefix, '3D Model GLB (without /public prefix)');
      }
    }
  }

  // Test 3D model paths - prioritizing Vite asset imports
  const modelPaths = [
    '/assets/models/intel_report-01d.glb' // Canonical path served from public assets
  ];

  debugLog(
    '🔍 Testing 3D model path',
    { modelPaths },
    {
      category: DEBUG_CATEGORIES.FILE_RESOLUTION,
      level: 'info',
      ignoreProductionSetting: true,
    }
  );

  modelPaths.forEach(path => {
    testUrlAccessibility(path, `3D Model Path: ${path}`);
  });

  // Check for MIME type configuration in Vercel
  if (ENV.isVercel) {
    debugLog(
      '🧪 Checking MIME type configuration',
      {
        glbMimeType: getExpectedMimeType('test.glb'),
        gltfMimeType: getExpectedMimeType('test.gltf'),
        possibleIssues: [
          'Vercel might not be configured to serve .glb files with the correct MIME type',
          'Missing or incorrect Content-Type header for 3D model files',
          'You may need to add a vercel.json configuration for MIME types'
        ],
        vercelJsonSuggestion: `{
  "headers": [
    {
      "source": "/(.*).glb",
      "headers": [
        { "key": "Content-Type", "value": "model/gltf-binary" }
      ]
    },
    {
      "source": "/(.*).gltf",
      "headers": [
        { "key": "Content-Type", "value": "model/gltf+json" }
      ]
    }
  ]
}`,
      },
      {
        category: DEBUG_CATEGORIES.MIME_TYPES,
        level: 'info',
        ignoreProductionSetting: true,
        expanded: true,
      }
    );
  }

  // Log any failed asset loads
  const failedAssets = Object.values(assetLoadAttempts).filter(
    asset => asset.status === 'error'
  );
  
  if (failedAssets.length > 0) {
    debugLog(
      `❌ Failed Asset Loads: ${failedAssets.length} assets failed to load`,
      failedAssets,
      {
        category: DEBUG_CATEGORIES.ERRORS,
        expanded: true,
        level: 'error',
        ignoreProductionSetting: true,
      }
    );
    
    // Special handling for 404 errors
    const notFoundAssets = failedAssets.filter(asset => asset.responseCode === 404);
    if (notFoundAssets.length > 0) {
      debugLog(
        `🚨 CRITICAL: ${notFoundAssets.length} assets returned 404 Not Found`,
        {
          assets: notFoundAssets,
          vercelDeploymentTips: ENV.isVercel ? [
            "Check your .vercelignore file - it might be excluding these files",
            "Verify the files exist in your repo and are committed",
            "Check case sensitivity in file paths",
            "Ensure files are in the correct directory structure",
            "Try placing models in /public/models/ and referencing as /models/filename.glb"
          ] : [],
          suggestedAction: "Review your deployment configuration and file paths"
        },
        {
          category: DEBUG_CATEGORIES.ERRORS,
          expanded: true,
          level: 'error',
          ignoreProductionSetting: true,
        }
      );
    }
  } else {
    debugLog(
      '✅ All assets loaded successfully',
      { assetCount: Object.keys(assetLoadAttempts).length },
      {
        category: DEBUG_CATEGORIES.ASSET_LOADING,
        level: 'info',
        ignoreProductionSetting: true,
      }
    );
  }
  
  // Suggest vercel.json configuration if we're on Vercel
  if (ENV.isVercel) {
    debugLog(
      '⚙️ Vercel Configuration Suggestions',
      {
        vercelJsonExample: `{
  "headers": [
    {
      "source": "/(.*).glb",
      "headers": [
        { "key": "Content-Type", "value": "model/gltf-binary" }
      ]
    }
  ],
  "github": {
    "silent": true
  }
}`,
        notes: [
          "A vercel.json file can help configure how files are served",
          "The above example ensures .glb files are served with the correct MIME type",
          "You can also add CORS headers if needed"
        ]
      },
      {
        category: DEBUG_CATEGORIES.CONFIG,
        level: 'info',
        ignoreProductionSetting: true,
        expanded: true,
      }
    );
  }
}

// Add auto-running Vercel deployment check
if (typeof window !== 'undefined') {
  // Run diagnostics automatically on Vercel deployments
  window.addEventListener('DOMContentLoaded', () => {
    if (ENV.isVercel) {
      // Wait a bit to let other resources load first
      setTimeout(() => {
        debugLog(
          '🚀 Vercel Deployment Detected - Running Automatic Diagnostics',
          { 
            url: window.location.href,
            hostname: window.location.hostname,
            vercelApp: window.location.hostname.includes('vercel.app'),
            buildInfo: {
              date: ENV.timestamp,
              version: CONFIG.versionTag
            }
          },
          {
            category: DEBUG_CATEGORIES.INITIALIZATION,
            level: 'info',
            ignoreProductionSetting: true,
          }
        );
        
        // Import statements should have been updated to use Vite's asset imports with ?url suffix
        // This will be provided by the import, but we'll also test the direct URL for completeness
        testUrlAccessibility('/assets/models/intel_report-01d.glb', 'Intel Report 3D Model (Direct Path)');
        
        // Log more prominent notice for asset checking
        console.log(
          '%c 🔍 CHECKING 3D ASSETS FOR VERCEL DEPLOYMENT 🔍 ',
          'background: #e74c3c; color: white; padding: 5px; font-size: 14px; font-weight: bold; border-radius: 3px;'
        );
        
        runComprehensiveDiagnostics();
      }, 1500);
    }
  });
}

// Define types for enhanced diagnostic information
interface GlbValidation {
  valid: boolean;
  magic?: string;
  version?: number;
  declaredLength?: number;
  actualLength?: number;
  issues?: string[];
  reason?: string;
  actualSize?: number;
  minExpectedSize?: number;
  error?: string;
  note?: string;
}

interface SizeWarning {
  issue: string;
  size: number;
  minExpectedSize: number;
  unit: string;
}

interface ModelSpecificInfo {
  isGlb: boolean;
  isGltf: boolean;
  recommendations: string[];
}

interface DiagnosticError {
  message: string;
  note: string;
}

interface EnhancedAssetInfo {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  contentType: string | null;
  contentLength: number | string;
  expectedContentType: string;
  mimeTypeMismatch: boolean;
  description?: string;
  duration?: string;
  glbValidation?: GlbValidation;
  sizeWarning?: SizeWarning;
  modelSpecificInfo?: ModelSpecificInfo;
  diagnosticError?: DiagnosticError;
  [key: string]: unknown;
}

/**
 * Enhance asset diagnostics with additional information
 * Analyzes responses for GLB files, checks content size, and validates content type
 */
async function enhanceAssetDiagnostics(response: Response, url: string): Promise<EnhancedAssetInfo> {
  const isGlb = url.toLowerCase().endsWith('.glb');
  const isGltf = url.toLowerCase().endsWith('.gltf');
  const is3DModel = isGlb || isGltf;
  
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  
  const enhancedInfo: EnhancedAssetInfo = {
    url,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    contentType,
    contentLength: contentLength ? parseInt(contentLength, 10) : 'unknown',
    expectedContentType: getExpectedMimeType(url),
    mimeTypeMismatch: contentType !== getExpectedMimeType(url),
  };
  
  try {
    // We need to clone the response because we can only read the body once
    const clonedResponse = response.clone();
    
    // For GLB files, check the binary header
    if (isGlb && response.ok) {
      try {
        // Get the first 12 bytes to check GLB header
        const buffer = await clonedResponse.arrayBuffer();
        
        if (buffer.byteLength < 12) {
          enhancedInfo.glbValidation = {
            valid: false,
            reason: 'File too small to be a valid GLB (less than 12 bytes header)',
            actualSize: buffer.byteLength,
            minExpectedSize: 12,
          };
        } else {
          const header = new DataView(buffer, 0, 12);
          const magic = header.getUint32(0, true); // GLB magic is 0x46546C67 (ASCII for "glTF")
          const version = header.getUint32(4, true);
          const fileLength = header.getUint32(8, true);
          
          const isValidMagic = magic === 0x46546C67;
          const isReasonableVersion = version === 1 || version === 2;
          const isReasonableSize = fileLength > 12 && fileLength <= buffer.byteLength;
          
          enhancedInfo.glbValidation = {
            valid: isValidMagic && isReasonableVersion && isReasonableSize,
            magic: isValidMagic ? 'Valid (glTF)' : `Invalid: 0x${magic.toString(16)}`,
            version,
            declaredLength: fileLength,
            actualLength: buffer.byteLength,
            issues: []
          };
          
          // Add specific issues
          if (!isValidMagic) enhancedInfo.glbValidation.issues.push('Invalid GLB magic number (should be "glTF")');
          if (!isReasonableVersion) enhancedInfo.glbValidation.issues.push(`Unexpected GLB version: ${version} (should be 1 or 2)`);
          if (!isReasonableSize) {
            if (fileLength <= 12) {
              enhancedInfo.glbValidation.issues.push('GLB file length in header is too small');
            } else if (fileLength > buffer.byteLength) {
              enhancedInfo.glbValidation.issues.push(`GLB file is truncated: header indicates ${fileLength} bytes but file is only ${buffer.byteLength} bytes`);
            }
          }
        }
      } catch (err) {
        enhancedInfo.glbValidation = {
          valid: false,
          error: err instanceof Error ? err.message : String(err),
          note: 'Failed to validate GLB header - file may be corrupted or not a valid GLB'
        };
      }
    }
    
    // Check content length
    if (contentLength) {
      const expectedMinSizes: Record<string, number> = {
        '.glb': 500, // Minimum reasonable size for a GLB file
        '.gltf': 100, // Minimum for a GLTF JSON file
        '.png': 100,
        '.jpg': 100,
        '.jpeg': 100
      };
      
      const extension = url.substring(url.lastIndexOf('.')).toLowerCase();
      const minExpectedSize = expectedMinSizes[extension] || 0;
      
      const size = parseInt(contentLength, 10);
      if (size < minExpectedSize) {
        enhancedInfo.sizeWarning = {
          issue: 'File size suspiciously small',
          size,
          minExpectedSize,
          unit: 'bytes'
        };
      }
    }
    
    // For 3D models, add specific troubleshooting
    if (is3DModel) {
      enhancedInfo.modelSpecificInfo = {
        isGlb,
        isGltf,
        recommendations: [
          'Check that the model was properly exported from your 3D software',
          'Ensure textures are properly packed (for GLB) or accessible (for GLTF)',
          'Verify model is not corrupted during upload/deployment'
        ]
      };
    }
  } catch (error) {
    enhancedInfo.diagnosticError = {
      message: error instanceof Error ? error.message : String(error),
      note: 'Error occurred during enhanced diagnostics'
    };
  }
  
  return enhancedInfo;
}

/**
 * Identify and summarize the root cause of an asset loading issue
 * Provides a clear, actionable message about what went wrong
 */
function identifyRootCause(enhancedInfo: EnhancedAssetInfo): { 
  cause: string; 
  summary: string;
  actionItems: string[];
} {
  // Default response
  const result = {
    cause: 'UNKNOWN_ISSUE',
    summary: 'Could not determine the exact cause of the issue',
    actionItems: ['Check browser console for more details']
  };
  
  // Check for 404 errors
  if (enhancedInfo.status === 404) {
    result.cause = 'MISSING_FILE';
    result.summary = `File not found (404) at path: ${enhancedInfo.url}`;
    result.actionItems = [
      'Verify the file exists in your project',
      'Check if the file path is correct',
      'Ensure the file is included in your deployment',
      'Try one of the alternative paths suggested below'
    ];
    
    // Add environment-specific suggestions
    if (ENV.isVercel) {
      result.actionItems.push(
        'Check your .vercelignore file to ensure the file is not excluded',
        'Verify file paths in Vercel\'s filesystem (case-sensitive)'
      );
    }
    return result;
  }
  
  // Check for MIME type mismatches
  if (enhancedInfo.mimeTypeMismatch) {
    result.cause = 'MIME_TYPE_MISMATCH';
    result.summary = `Server returned incorrect MIME type: ${enhancedInfo.contentType} (expected ${enhancedInfo.expectedContentType})`;
    result.actionItems = [
      'Configure your server to serve the correct MIME type',
      'For GLB files, ensure Content-Type: model/gltf-binary',
      'For Vercel, add appropriate headers in vercel.json'
    ];
    return result;
  }
  
  // Check for GLB validation issues
  if (enhancedInfo.glbValidation && !enhancedInfo.glbValidation.valid) {
    result.cause = 'CORRUPTED_3D_MODEL';
    result.summary = 'The 3D model file appears to be corrupted or invalid';
    
    // Add specific details based on the validation issues
    if (enhancedInfo.glbValidation.issues && enhancedInfo.glbValidation.issues.length > 0) {
      result.summary += `: ${enhancedInfo.glbValidation.issues.join(', ')}`;
    }
    
    result.actionItems = [
      'Re-export the model from your 3D software',
      'Ensure the GLB file is not corrupted during transfer',
      'Check if the model was properly packaged (textures included)',
      'Try a different version of the model format (GLB/GLTF)'
    ];
    return result;
  }
  
  // Check for size warnings
  if (enhancedInfo.sizeWarning) {
    result.cause = 'SUSPICIOUS_FILE_SIZE';
    result.summary = `The file size (${enhancedInfo.sizeWarning.size} bytes) is suspiciously small for a ${enhancedInfo.url.split('.').pop()} file`;
    result.actionItems = [
      'Verify the file is not truncated or corrupted',
      'Check if the file was properly uploaded/deployed',
      'Re-generate or re-export the file'
    ];
    return result;
  }
  
  // Check for network errors
  if (!enhancedInfo.status || enhancedInfo.status >= 500) {
    result.cause = 'SERVER_ERROR';
    result.summary = `Server returned error status: ${enhancedInfo.status} ${enhancedInfo.statusText || ''}`;
    result.actionItems = [
      'Check if the server is functioning correctly',
      'Verify your server logs for errors',
      'Ensure the server has access to the requested file'
    ];
    return result;
  }
  
  // For other HTTP errors
  if (enhancedInfo.status >= 400) {
    result.cause = 'HTTP_ERROR';
    result.summary = `HTTP error ${enhancedInfo.status}: ${enhancedInfo.statusText || 'Unknown error'}`;
    result.actionItems = [
      'Check network tab in DevTools for more information',
      'Verify authentication and authorization if required',
      'Ensure correct headers are being sent with the request'
    ];
    return result;
  }
  
  return result;
}

// Export the debugging utilities
export const DeploymentDebugger = {
  log: debugLog,
  assetLoading: debugAssetLoading,
  pathResolution: debugPathResolution,
  logLoadedAssets,
  testUrlAccessibility,
  runComprehensiveDiagnostics,
  categories: DEBUG_CATEGORIES,
  // Export helpers for direct use
  getExpectedMimeType,
  getTroubleshootingSuggestions,
  getSuggestedAlternativePaths,
  // Export asset tracking
  getAssetLoadAttempts: () => assetLoadAttempts,
};

// Also provide a default export for backward compatibility
export default DeploymentDebugger;

// Expose global window object for console debugging
if (typeof window !== 'undefined') {
  (window as unknown as { 
    __STARCOM_DEBUG_UTILS: typeof DeploymentDebugger & {
      ENV: typeof ENV;
      runModelChecks: (modelUrl: string) => void;
    } 
  }).__STARCOM_DEBUG_UTILS = {
    ...DeploymentDebugger,
    ENV,
    runModelChecks: (modelUrl: string) => {
      console.group(`🧪 Running comprehensive model checks for: ${modelUrl}`);
      console.log(`Testing model URL: ${modelUrl}`);
      
      // Log detailed info about the model
      debugLog(
        `Model debugging for: ${modelUrl}`,
        {
          url: modelUrl,
          resolvedUrl: modelUrl.startsWith('/') ? `${window.location.origin}${modelUrl}` : modelUrl,
          expectedMimeType: getExpectedMimeType(modelUrl),
          alternativePaths: getSuggestedAlternativePaths(modelUrl),
          troubleshooting: getTroubleshootingSuggestions(modelUrl),
        },
        {
          category: DEBUG_CATEGORIES.MODEL_LOADING,
          level: 'info',
          expanded: true,
          ignoreProductionSetting: true,
        }
      );
      
      // Test the model URL
      testUrlAccessibility(modelUrl, 'Model URL check')
        .then(() => {
          // Also test alternative paths
          const alternativePaths = getSuggestedAlternativePaths(modelUrl);
          alternativePaths.forEach(path => {
            testUrlAccessibility(path, `Alternative path for ${modelUrl}`);
          });
        })
        .finally(() => {
          console.groupEnd();
        });
    }
  };
  
  // Log that the debug utils are available
  console.log(
    '%c 🔍 Starcom Debug Utils Available: %c window.__STARCOM_DEBUG_UTILS',
    'background: #3498db; color: white; padding: 2px 5px; border-radius: 2px;',
    'font-weight: bold; color: #2ecc71;'
  );
}
