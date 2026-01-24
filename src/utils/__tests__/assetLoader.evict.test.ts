import * as THREE from 'three';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../deploymentDebugger', () => {
  const fn = vi.fn();
  const asyncFn = vi.fn().mockResolvedValue(undefined);
  return {
    DeploymentDebugger: {
      log: fn,
      assetLoading: fn,
      testUrlAccessibility: asyncFn,
      categories: {
        MODEL_LOADING: 'MODEL_LOADING',
        ASSET_LOADING: 'ASSET_LOADING',
        ERRORS: 'ERRORS',
        NETWORK: 'NETWORK',
        INITIALIZATION: 'INITIALIZATION'
      },
      pathResolution: fn,
      runComprehensiveDiagnostics: fn
    }
  };
});

const mockDispose = vi.fn();
vi.mock('../disposeGLTF', () => ({ disposeGLTF: mockDispose }));

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => {
  class GLTFLoader {
    load(_url: string, onLoad: (gltf: any) => void) {
      const scene = new THREE.Group();
      onLoad({ scene, animations: [], asset: {}, scenes: [scene], cameras: [] });
    }
  }
  return { GLTFLoader };
});

describe('assetLoader cache eviction disposal', () => {
  beforeEach(() => {
    mockDispose.mockClear();
  });

  it('disposes cached model on purge', async () => {
    const { assetLoader } = await import('../assetLoader');

    await assetLoader.loadModel('mock-url.glb', { retryCount: 0, timeout: 100 });
    assetLoader.purgeCache('test');

    expect(mockDispose).toHaveBeenCalledTimes(1);
  });
});
