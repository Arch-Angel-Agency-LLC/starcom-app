// src/utils/assetLoader.ts
// Robust asset loading utilities for static deployment environments
// Handles GLB/GLTF model loading with proper error handling and fallbacks

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DeploymentDebugger } from './deploymentDebugger';
import { LruTtlCache, type CacheEvent } from '../cache/LruTtlCache';
import { disposeGLTF } from './disposeGLTF';
import { emitCacheTrace, emitDiagnosticTrace } from '../services/tracing/traceEmitters';

// Type for GLTF loader result
interface GLTFResult {
  scene: THREE.Group;
  scenes: THREE.Group[];
  animations: THREE.AnimationClip[];
  cameras: THREE.Camera[];
  asset: object;
}

export interface AssetLoadResult {
  model: THREE.Object3D | null;
  isLoading: boolean;
  error: string | null;
  loadedUrl: string | null;
}

export interface AssetLoadOptions {
  scale?: number;
  fallbackColor?: number;
  fallbackGeometry?: 'cone' | 'cube' | 'sphere';
  retryCount?: number;
  timeout?: number;
  approxBytes?: number;
}

interface CachedModel {
  promise: Promise<THREE.Object3D>;
  approxBytes: number;
}

const VERBOSE_DEPLOYMENT_DEBUG = import.meta.env.VITE_DEPLOYMENT_DEBUG === 'true';

const DEFAULT_CACHE_LIMITS = {
  ttlMs: safeParseNumber(import.meta.env.VITE_ASSET_CACHE_TTL_MS, 10 * 60 * 1000),
  maxEntries: safeParseNumber(import.meta.env.VITE_ASSET_CACHE_MAX_ENTRIES, 32),
  maxBytes: safeParseNumber(import.meta.env.VITE_ASSET_CACHE_MAX_BYTES, 320 * 1024 * 1024),
  defaultBytes: safeParseNumber(import.meta.env.VITE_ASSET_CACHE_DEFAULT_BYTES, 8 * 1024 * 1024)
};

function safeParseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

class AssetLoaderService {
  private cache: LruTtlCache<CachedModel>;
  private loader = new GLTFLoader();
  private successLogged = new Set<string>();
  private loadedModels = new Map<string, THREE.Object3D>();
  private shouldTrace() {
    return import.meta.env.DEV || VERBOSE_DEPLOYMENT_DEBUG;
  }

  constructor() {
    this.cache = new LruTtlCache<CachedModel>({
      ttlMs: DEFAULT_CACHE_LIMITS.ttlMs,
      maxEntries: DEFAULT_CACHE_LIMITS.maxEntries,
      maxBytes: DEFAULT_CACHE_LIMITS.maxBytes,
      defaultEntrySizeBytes: DEFAULT_CACHE_LIMITS.defaultBytes,
      onEvent: this.handleCacheEvent
    });

    // Log initialization of asset loader with detailed information
    DeploymentDebugger.log(
      'AssetLoaderService initialized',
      { 
        cacheLimits: DEFAULT_CACHE_LIMITS,
        environment: {
          isProd: import.meta.env.PROD,
          isDev: import.meta.env.DEV,
          baseUrl: import.meta.env.BASE_URL,
        },
        loader: 'GLTFLoader'
      },
      { 
        category: DeploymentDebugger.categories.INITIALIZATION,
        ignoreProductionSetting: true
      }
    );
  }

  /**
   * Load a GLB/GLTF model with proper error handling for static deployment
   * @param modelUrl - The model URL (from Vite asset import)
   * @param options - Loading options and fallback configuration
   */
  async loadModel(
    modelUrl: string, 
    options: AssetLoadOptions = {}
  ): Promise<THREE.Object3D> {
    const {
      scale = 1,
      fallbackColor = 0xff6b35,
      fallbackGeometry = 'cone',
      retryCount = 2,
      timeout = 10000
    } = options;

    const approxBytes = options.approxBytes ?? DEFAULT_CACHE_LIMITS.defaultBytes;
    const cached = this.cache.get(modelUrl);
    if (cached) {
      emitCacheTrace('asset_cache_hit', { key: modelUrl, approxBytes: cached.approxBytes ?? approxBytes }, { sizeBytes: cached.approxBytes ?? approxBytes });
      emitDiagnosticTrace('asset_load_cached', { modelUrl, cacheStatus: 'hit', approxBytes: cached.approxBytes ?? approxBytes });
      return cached.promise;
    }

    emitCacheTrace('asset_cache_miss', { key: modelUrl, approxBytes }, { sizeBytes: approxBytes });
    emitDiagnosticTrace('asset_load_request', { modelUrl, cacheStatus: 'miss', approxBytes });

    // Log model loading request with debugging info only for uncached paths
    DeploymentDebugger.log(
      `Request to load 3D model: ${modelUrl}`,
      {
        modelUrl,
        options,
        resolvedUrl: modelUrl.startsWith('/') 
          ? `${window.location.origin}${modelUrl}` 
          : new URL(modelUrl, window.location.origin).href,
        cacheStatus: 'not-cached'
      },
      { 
        category: DeploymentDebugger.categories.MODEL_LOADING,
      }
    );

    // Log asset loading attempt start
    DeploymentDebugger.assetLoading(
      modelUrl,
      '3D GLB Model',
      'loading',
      undefined,
      { 
        scale, 
        retryCount,
        timeout,
        timestamp: Date.now()
      }
    );

    const loadPromise = this.loadWithRetry(modelUrl, retryCount, timeout)
      .then(gltf => {
        // Log successful loading
        if (!this.successLogged.has(modelUrl)) {
          this.successLogged.add(modelUrl);
          DeploymentDebugger.assetLoading(
            modelUrl,
            '3D GLB Model',
            'success',
            undefined,
            { 
              scale,
              modelInfo: {
                sceneObjects: gltf.scene.children.length,
                animations: gltf.animations.length,
                hasTextures: this.detectTexturesInModel(gltf.scene),
              },
              timestamp: Date.now()
            }
          );
        }

        const model = gltf.scene.clone();
        model.scale.setScalar(scale);
        model.rotation.set(0, 0, 0);
        this.loadedModels.set(modelUrl, model);
        emitDiagnosticTrace('asset_load_success', {
          modelUrl,
          cacheStatus: 'miss',
          approxBytes,
          sceneObjects: gltf.scene.children.length
        });
        return model;
      })
      .catch(error => {
        // Log error with detailed diagnostics
        DeploymentDebugger.assetLoading(
          modelUrl,
          '3D GLB Model',
          'error',
          error,
          {
            scale,
            failureDetails: {
              retryAttempts: retryCount,
              errorType: error.name,
              errorMessage: error.message,
              timestamp: Date.now()
            }
          }
        );

        console.error(`Failed to load 3D model: ${modelUrl}`, error);
        
        // Create fallback model
        const fallbackModel = this.createFallbackModel(fallbackGeometry, fallbackColor, scale);
        this.loadedModels.set(modelUrl, fallbackModel);
        emitDiagnosticTrace(
          'asset_load_failure',
          {
            modelUrl,
            cacheStatus: 'miss',
            approxBytes,
            error: error?.message ?? String(error)
          },
          'warn'
        );
        
        // Log fallback creation
        DeploymentDebugger.log(
          `Created fallback ${fallbackGeometry} model for failed load: ${modelUrl}`,
          { modelUrl, fallbackType: fallbackGeometry, scale },
          { 
            category: DeploymentDebugger.categories.MODEL_LOADING,
            level: 'warn',
            ignoreProductionSetting: true
          }
        );
        
        return fallbackModel;
      });

    this.cache.set(modelUrl, { promise: loadPromise, approxBytes }, approxBytes, DEFAULT_CACHE_LIMITS.ttlMs);
    return loadPromise;
  }

  private handleCacheEvent = (event: CacheEvent) => {
    if (!import.meta.env.DEV && !VERBOSE_DEPLOYMENT_DEBUG) {
      if (event.type === 'hit' || event.type === 'miss') return;
    }

    if (event.type === 'evict' || event.type === 'expire') {
      this.disposeCachedModel(event.key, event.reason ?? event.type);
    }
    if (event.type === 'purge') {
      this.disposeAllModels(event.reason ?? 'purge');
    }

    emitCacheTrace(`asset_cache_${event.type}`, {
      key: event.key,
      reason: event.reason,
      entryBytes: event.entryBytes,
      entryCount: event.entryCount
    }, {
      sizeBytes: event.totalBytes,
      deltaBytes: event.entryBytes ?? 0
    });

    const level = event.type === 'evict' || event.type === 'expire' ? 'warn' : 'info';
    DeploymentDebugger.log(
      `Asset cache ${event.type}`,
      {
        key: event.key,
        entryBytes: event.entryBytes,
        totalBytes: event.totalBytes,
        entryCount: event.entryCount,
        reason: event.reason,
        limits: DEFAULT_CACHE_LIMITS
      },
      {
        category: DeploymentDebugger.categories.ASSET_LOADING,
        level,
        ignoreProductionSetting: VERBOSE_DEPLOYMENT_DEBUG
      }
    );
  };

  private async loadWithRetry(
    url: string, 
    retries: number, 
    timeout: number
  ): Promise<GLTFResult> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Log retry attempt info
        if (attempt > 0) {
          if (this.shouldTrace()) {
            DeploymentDebugger.log(
              `Retry attempt ${attempt} for model: ${url}`,
              { 
                url, 
                attempt, 
                maxRetries: retries,
                backoffDelay: Math.pow(2, attempt - 1) * 1000 
              },
              { 
                category: DeploymentDebugger.categories.MODEL_LOADING,
                level: 'warn',
                ignoreProductionSetting: this.shouldTrace()
              }
            );
          }
        }
        
        return await this.loadWithTimeout(url, timeout);
      } catch (error) {
        if (attempt === retries) {
          // Log final failure after all retries
          DeploymentDebugger.log(
            `All retry attempts failed (${retries+1} total) for model: ${url}`,
            { 
              url, 
              totalAttempts: retries + 1,
              finalError: error 
            },
            { 
              category: DeploymentDebugger.categories.ERRORS,
              level: 'error',
              ignoreProductionSetting: true
            }
          );
          throw error;
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        
        if (this.shouldTrace()) {
          DeploymentDebugger.log(
            `Model load attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
            { 
              url, 
              attempt: attempt + 1, 
              delay,
              error: {
                message: error.message,
                name: error.name
              }
            },
            { 
              category: DeploymentDebugger.categories.MODEL_LOADING,
              level: 'warn',
              ignoreProductionSetting: this.shouldTrace()
            }
          );
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached due to the throw in the loop above
    throw new Error(`Unexpected error in retry loop for ${url}`);
  }

  private loadWithTimeout(url: string, timeout: number): Promise<GLTFResult> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const timeoutId = setTimeout(() => {
        const errorMessage = `Model loading timeout after ${timeout}ms for ${url}`;
        
        DeploymentDebugger.log(
          errorMessage,
          { url, timeout },
          { 
            category: DeploymentDebugger.categories.ERRORS,
            level: 'error',
            ignoreProductionSetting: true
          }
        );
        
        reject(new Error(errorMessage));
      }, timeout);

      // Log the specific URL being loaded in the loader
      const resolvedUrl = url.startsWith('/') 
        ? `${window.location.origin}${url}` 
        : new URL(url, window.location.origin).href;
      
      if (this.shouldTrace()) {
        DeploymentDebugger.log(
          `GLTFLoader loading from URL: ${url}`,
          { url, resolvedUrl },
          { 
            category: DeploymentDebugger.categories.MODEL_LOADING,
            ignoreProductionSetting: this.shouldTrace()
          }
        );
      }

      // Test fetch accessibility
      DeploymentDebugger.testUrlAccessibility(url, '3D Model GLB')
        .catch(error => {
          if (!this.shouldTrace()) return;
          DeploymentDebugger.log(
            `URL accessibility test failed, but still attempting THREE.js load: ${url}`,
            { error },
            { 
              category: DeploymentDebugger.categories.NETWORK,
              level: 'warn',
              ignoreProductionSetting: this.shouldTrace()
            }
          );
        });

      this.loader.load(
        url,
        (gltf) => {
          clearTimeout(timeoutId);
          const duration = performance.now() - startTime;
          
          if (this.shouldTrace()) {
            DeploymentDebugger.log(
              `Model loaded successfully in ${duration.toFixed(2)}ms: ${url}`,
              { 
                url, 
                duration: `${duration.toFixed(2)}ms`,
                sceneObjects: gltf.scene.children.length,
                animations: gltf.animations.length 
              },
              { 
                category: DeploymentDebugger.categories.MODEL_LOADING,
                ignoreProductionSetting: this.shouldTrace()
              }
            );
          }
          
          resolve(gltf);
        },
        (progress) => {
          // Log loading progress at 25% intervals
          const percent = (progress.loaded / progress.total) * 100;
          if (percent % 25 < 1 || percent > 99) { // Log at 0%, 25%, 50%, 75%, 100%
            if (this.shouldTrace()) {
              DeploymentDebugger.log(
                `Loading model progress: ${percent.toFixed(1)}%`,
                { 
                  url, 
                  loaded: progress.loaded, 
                  total: progress.total,
                  percent: percent.toFixed(1)
                },
                { 
                  category: DeploymentDebugger.categories.MODEL_LOADING,
                  ignoreProductionSetting: this.shouldTrace()
                }
              );
            }
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          const duration = performance.now() - startTime;
          
          DeploymentDebugger.log(
            `Error loading model after ${duration.toFixed(2)}ms: ${url}`,
            { 
              url, 
              duration: `${duration.toFixed(2)}ms`,
              error: error instanceof Error 
                ? {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                  }
                : String(error)
            },
            { 
              category: DeploymentDebugger.categories.ERRORS,
              level: 'error',
              ignoreProductionSetting: true
            }
          );
          
          reject(error);
        }
      );
    });
  }

  /**
   * Detect if a model has textures
   */
  private detectTexturesInModel(scene: THREE.Group): boolean {
    let hasTextures = false;
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material && (
          material.map || 
          material.normalMap || 
          material.aoMap || 
          material.emissiveMap || 
          material.metalnessMap || 
          material.roughnessMap
        )) {
          hasTextures = true;
        }
      }
    });
    
    return hasTextures;
  }

  private createFallbackModel(
    geometry: 'cone' | 'cube' | 'sphere',
    color: number,
    scale: number
  ): THREE.Object3D {
    DeploymentDebugger.log(
      `Creating fallback ${geometry} model`,
      { geometry, color, scale },
      { 
        category: DeploymentDebugger.categories.MODEL_LOADING,
        level: 'warn',
        ignoreProductionSetting: true
      }
    );

    let geom: THREE.BufferGeometry;
    
    switch (geometry) {
      case 'cube':
        geom = new THREE.BoxGeometry(2, 2, 2);
        break;
      case 'sphere':
        geom = new THREE.SphereGeometry(1, 16, 16);
        break;
      case 'cone':
      default:
        geom = new THREE.ConeGeometry(1, 3, 8);
        break;
    }

    const material = new THREE.MeshPhongMaterial({ 
      color,
      transparent: true,
      opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geom, material);
    mesh.scale.setScalar(scale);
    
    return mesh;
  }

  /**
   * Clear the asset cache (useful for memory management)
   */
  clearCache(): void {
    const stats = this.cache.stats();
    DeploymentDebugger.log(
      `Clearing asset cache (${stats.entries} items)`,
      { previousCacheSize: stats.entries },
      { 
        category: DeploymentDebugger.categories.ASSET_LOADING,
        ignoreProductionSetting: true
      }
    );
    this.cache.purge('manual');
    this.disposeAllModels('manual');
  }

  purgeCache(reason: string = 'route-change'): void {
    this.cache.purge(reason);
    this.disposeAllModels(reason);
  }

  private disposeCachedModel(key: string, reason: string) {
    const model = this.loadedModels.get(key);
    if (!model) return;
    disposeGLTF(model);
    this.loadedModels.delete(key);
    if (this.shouldTrace()) {
      DeploymentDebugger.log(
        `Disposed cached model for ${key}`,
        { reason },
        {
          category: DeploymentDebugger.categories.MODEL_LOADING,
          level: 'info',
          ignoreProductionSetting: this.shouldTrace()
        }
      );
    }
  }

  private disposeAllModels(reason: string) {
    for (const key of this.loadedModels.keys()) {
      this.disposeCachedModel(key, reason);
    }
  }

  /**
   * Preload multiple models for better performance
   */
  async preloadModels(modelUrls: string[], options?: AssetLoadOptions): Promise<void> {
    DeploymentDebugger.log(
      `Preloading ${modelUrls.length} models`,
      { modelUrls, options },
      { 
        category: DeploymentDebugger.categories.MODEL_LOADING,
        ignoreProductionSetting: true
      }
    );

    const loadPromises = modelUrls.map(url => this.loadModel(url, options));
    const results = await Promise.allSettled(loadPromises);
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    DeploymentDebugger.log(
      `Preload complete: ${succeeded} succeeded, ${failed} failed`,
      { 
        modelUrls, 
        succeeded, 
        failed,
        failedModels: results
          .map((result, index) => ({ result, url: modelUrls[index] }))
          .filter(item => item.result.status === 'rejected')
          .map(item => item.url)
      },
      { 
        category: DeploymentDebugger.categories.MODEL_LOADING,
        level: failed > 0 ? 'warn' : 'info',
        ignoreProductionSetting: true
      }
    );
  }

  /**
   * Run diagnostics on the asset loader
   */
  runDiagnostics(): void {
    DeploymentDebugger.log(
      '🔍 Running AssetLoader Diagnostics',
      {
        cache: {
          stats: this.cache.stats()
        },
        environment: {
          isProd: import.meta.env.PROD,
          isDev: import.meta.env.DEV,
          baseUrl: import.meta.env.BASE_URL,
          isVercel: typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'),
        },
        origin: window.location.origin,
        testModel: '/assets/models/intel_report-01d.glb'
      },
      { 
        category: DeploymentDebugger.categories.MODEL_LOADING,
        ignoreProductionSetting: true,
        expanded: true
      }
    );

    // Test only the canonical model path to avoid noisy 404 spam
    DeploymentDebugger.testUrlAccessibility('/assets/models/intel_report-01d.glb', 'Diagnostic test path: /assets/models/intel_report-01d.glb');
  }
}

// Export singleton instance
export const assetLoader = new AssetLoaderService();

// Run diagnostics only when explicitly enabled
if (VERBOSE_DEPLOYMENT_DEBUG) {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      assetLoader.runDiagnostics();
    }, 2000);
  });
}

// React hook for using the asset loader
export function useAssetLoader() {
  return assetLoader;
}

// Expose diagnostic utilities in global scope for console debugging
if (typeof window !== 'undefined') {
  // Define a type for the global object
  interface StarcomAssetLoaderGlobal {
    assetLoader: AssetLoaderService;
    runDiagnostics: () => void;
    clearCache: () => void;
    purgeCache: () => void;
    loadModel: (url: string, options?: AssetLoadOptions) => Promise<THREE.Object3D>;
  }
  
  // Add to window with proper typing
  (window as unknown as { __STARCOM_ASSET_LOADER: StarcomAssetLoaderGlobal }).__STARCOM_ASSET_LOADER = {
    assetLoader,
    runDiagnostics: () => assetLoader.runDiagnostics(),
    clearCache: () => assetLoader.clearCache(),
    purgeCache: () => assetLoader.purgeCache(),
    loadModel: (url: string, options?: AssetLoadOptions) => assetLoader.loadModel(url, options),
  };
}

// AI-NOTE: This service provides robust asset loading for static deployment environments
// Features: caching, retry logic, timeout handling, fallback models, and preloading
// Compatible with Vercel static hosting and Vite asset handling
// Now with comprehensive debugging and diagnostics for maximum visibility in production
