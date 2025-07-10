// src/utils/assetLoader.ts
// Robust asset loading utilities for static deployment environments
// Handles GLB/GLTF model loading with proper error handling and fallbacks

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DeploymentDebugger } from './deploymentDebugger';

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
}

class AssetLoaderService {
  private cache = new Map<string, Promise<THREE.Object3D>>();
  private loader = new GLTFLoader();

  constructor() {
    // Log initialization of asset loader with detailed information
    DeploymentDebugger.log(
      'AssetLoaderService initialized',
      { 
        cacheSize: this.cache.size,
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

    // Log model loading request with debugging info
    DeploymentDebugger.log(
      `Request to load 3D model: ${modelUrl}`,
      {
        modelUrl,
        options,
        resolvedUrl: modelUrl.startsWith('/') 
          ? `${window.location.origin}${modelUrl}` 
          : new URL(modelUrl, window.location.origin).href,
        cacheStatus: this.cache.has(modelUrl) ? 'cached' : 'not-cached'
      },
      { 
        category: DeploymentDebugger.categories.MODEL_LOADING,
        ignoreProductionSetting: true
      }
    );

    // Check cache first
    if (this.cache.has(modelUrl)) {
      DeploymentDebugger.log(
        `Loading 3D model from cache: ${modelUrl}`,
        { modelUrl },
        { 
          category: DeploymentDebugger.categories.MODEL_LOADING,
          ignoreProductionSetting: true
        }
      );
      return this.cache.get(modelUrl)!;
    }

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

        const model = gltf.scene.clone();
        model.scale.setScalar(scale);
        model.rotation.set(0, 0, 0);
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

    this.cache.set(modelUrl, loadPromise);
    return loadPromise;
  }

  private async loadWithRetry(
    url: string, 
    retries: number, 
    timeout: number
  ): Promise<GLTFResult> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Log retry attempt info
        if (attempt > 0) {
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
              ignoreProductionSetting: true
            }
          );
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
            ignoreProductionSetting: true
          }
        );
        
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
      
      DeploymentDebugger.log(
        `GLTFLoader loading from URL: ${url}`,
        { url, resolvedUrl },
        { 
          category: DeploymentDebugger.categories.MODEL_LOADING,
          ignoreProductionSetting: true
        }
      );

      // Test fetch accessibility
      DeploymentDebugger.testUrlAccessibility(url, '3D Model GLB')
        .catch(error => {
          DeploymentDebugger.log(
            `URL accessibility test failed, but still attempting THREE.js load: ${url}`,
            { error },
            { 
              category: DeploymentDebugger.categories.NETWORK,
              level: 'warn',
              ignoreProductionSetting: true
            }
          );
        });

      this.loader.load(
        url,
        (gltf) => {
          clearTimeout(timeoutId);
          const duration = performance.now() - startTime;
          
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
              ignoreProductionSetting: true
            }
          );
          
          resolve(gltf);
        },
        (progress) => {
          // Log loading progress at 25% intervals
          const percent = (progress.loaded / progress.total) * 100;
          if (percent % 25 < 1 || percent > 99) { // Log at 0%, 25%, 50%, 75%, 100%
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
                ignoreProductionSetting: true
              }
            );
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
    const cacheSize = this.cache.size;
    DeploymentDebugger.log(
      `Clearing asset cache (${cacheSize} items)`,
      { previousCacheSize: cacheSize },
      { 
        category: DeploymentDebugger.categories.ASSET_LOADING,
        ignoreProductionSetting: true
      }
    );
    this.cache.clear();
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
          size: this.cache.size,
          urls: Array.from(this.cache.keys())
        },
        environment: {
          isProd: import.meta.env.PROD,
          isDev: import.meta.env.DEV,
          baseUrl: import.meta.env.BASE_URL,
          isVercel: typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'),
        },
        origin: window.location.origin,
        testModel: '/assets/models/intel_report-01d.glb', // Primary path with Vite import
      },
      { 
        category: DeploymentDebugger.categories.MODEL_LOADING,
        ignoreProductionSetting: true,
        expanded: true
      }
    );

    // Test model loading paths - prioritizing Vite asset imports
    const testPaths = [
      '/assets/models/intel_report-01d.glb', // Vite asset import path
      '/models/intel_report-01d.glb',
      '/public/models/intel_report-01d.glb'
    ];

    // Perform fetch tests on all paths
    testPaths.forEach(path => {
      DeploymentDebugger.testUrlAccessibility(path, `Diagnostic test path: ${path}`);
    });
  }
}

// Export singleton instance
export const assetLoader = new AssetLoaderService();

// Run diagnostics in production environment
if (import.meta.env.PROD) {
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
    loadModel: (url: string, options?: AssetLoadOptions) => Promise<THREE.Object3D>;
  }
  
  // Add to window with proper typing
  (window as unknown as { __STARCOM_ASSET_LOADER: StarcomAssetLoaderGlobal }).__STARCOM_ASSET_LOADER = {
    assetLoader,
    runDiagnostics: () => assetLoader.runDiagnostics(),
    clearCache: () => assetLoader.clearCache(),
    loadModel: (url: string, options?: AssetLoadOptions) => assetLoader.loadModel(url, options),
  };
}

// AI-NOTE: This service provides robust asset loading for static deployment environments
// Features: caching, retry logic, timeout handling, fallback models, and preloading
// Compatible with Vercel static hosting and Vite asset handling
// Now with comprehensive debugging and diagnostics for maximum visibility in production
