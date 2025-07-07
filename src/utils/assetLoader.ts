// src/utils/assetLoader.ts
// Robust asset loading utilities for static deployment environments
// Handles GLB/GLTF model loading with proper error handling and fallbacks

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

    // Check cache first
    if (this.cache.has(modelUrl)) {
      return this.cache.get(modelUrl)!;
    }

    const loadPromise = this.loadWithRetry(modelUrl, retryCount, timeout)
      .then(gltf => {
        const model = gltf.scene.clone();
        model.scale.setScalar(scale);
        model.rotation.set(0, 0, 0);
        return model;
      })
      .catch(error => {
        console.error(`Failed to load 3D model: ${modelUrl}`, error);
        return this.createFallbackModel(fallbackGeometry, fallbackColor, scale);
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
        return await this.loadWithTimeout(url, timeout);
      } catch (error) {
        if (attempt === retries) throw error;
        
        // Wait before retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`Model load attempt ${attempt + 1} failed, retrying...`, error);
      }
    }
  }

  private loadWithTimeout(url: string, timeout: number): Promise<GLTFResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Model loading timeout after ${timeout}ms`));
      }, timeout);

      this.loader.load(
        url,
        (gltf) => {
          clearTimeout(timeoutId);
          resolve(gltf);
        },
        (progress) => {
          // Optional: emit progress events
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading model: ${percent.toFixed(1)}%`);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }

  private createFallbackModel(
    geometry: 'cone' | 'cube' | 'sphere',
    color: number,
    scale: number
  ): THREE.Object3D {
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
    this.cache.clear();
  }

  /**
   * Preload multiple models for better performance
   */
  async preloadModels(modelUrls: string[], options?: AssetLoadOptions): Promise<void> {
    const loadPromises = modelUrls.map(url => this.loadModel(url, options));
    await Promise.allSettled(loadPromises);
  }
}

// Export singleton instance
export const assetLoader = new AssetLoaderService();

// React hook for using the asset loader
export function useAssetLoader() {
  return assetLoader;
}

// AI-NOTE: This service provides robust asset loading for static deployment environments
// Features: caching, retry logic, timeout handling, fallback models, and preloading
// Compatible with Vercel static hosting and Vite asset handling
