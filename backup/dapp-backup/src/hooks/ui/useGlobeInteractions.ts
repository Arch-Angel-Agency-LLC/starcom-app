
import { useCallback, useEffect, useRef, useState } from 'react';
import { performanceMonitor } from '../../utils/performanceMonitor';

// Extend Navigator interface for device memory
interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
}

// Extend Performance interface for memory info
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface GlobeInteractionMetrics {
  frameRate: number;
  renderTime: number;
  interactionLatency: number;
  memoryUsage: number;
  deviceCapabilities: {
    maxTextureSize: number;
    webGLVersion: string;
    hardwareConcurrency: number;
    deviceMemory?: number;
  };
}

interface GlobeInteractionState {
  isRotating: boolean;
  isZooming: boolean;
  isPanning: boolean;
  lastInteraction: number;
  totalInteractions: number;
}

/**
 * Hook for comprehensive performance monitoring and metrics collection for globe interactions
 * Implements adaptive performance optimization based on device capabilities
 */
export const useGlobeInteractions = () => {
  const [metrics, setMetrics] = useState<GlobeInteractionMetrics>({
    frameRate: 60,
    renderTime: 0,
    interactionLatency: 0,
    memoryUsage: 0,
    deviceCapabilities: {
      maxTextureSize: 0,
      webGLVersion: '',
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: (navigator as NavigatorWithDeviceMemory).deviceMemory,
    }
  });

  const [interactionState, setInteractionState] = useState<GlobeInteractionState>({
    isRotating: false,
    isZooming: false,
    isPanning: false,
    lastInteraction: 0,
    totalInteractions: 0
  });

  const performanceData = useRef<{
    frameTimestamps: number[];
    renderTimestamps: number[];
    interactionTimestamps: number[];
  }>({
    frameTimestamps: [],
    renderTimestamps: [],
    interactionTimestamps: []
  });

  // Detect WebGL capabilities
  const detectDeviceCapabilities = useCallback(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (gl) {
      const capabilities = {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        webGLVersion: gl instanceof WebGL2RenderingContext ? '2.0' : '1.0',
        hardwareConcurrency: navigator.hardwareConcurrency || 4,
        deviceMemory: (navigator as NavigatorWithDeviceMemory).deviceMemory,
      };

      setMetrics(prev => ({ ...prev, deviceCapabilities: capabilities }));
      return capabilities;
    }

    return null;
  }, []);

  // Monitor frame rate and render performance
  const trackRenderPerformance = useCallback(() => {
    const now = performance.now();
    performanceData.current.frameTimestamps.push(now);

    // Keep only last 60 frames for calculation
    if (performanceData.current.frameTimestamps.length > 60) {
      performanceData.current.frameTimestamps.shift();
    }

    // Calculate FPS from frame timestamps
    if (performanceData.current.frameTimestamps.length >= 2) {
      const timestamps = performanceData.current.frameTimestamps;
      const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
      const frameRate = (timestamps.length - 1) / (timeSpan / 1000);

      setMetrics(prev => ({ ...prev, frameRate: Math.round(frameRate) }));
    }

    // Track memory usage if available
    const perfWithMemory = performance as PerformanceWithMemory;
    if (perfWithMemory.memory) {
      const memory = perfWithMemory.memory;
      setMetrics(prev => ({ 
        ...prev, 
        memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024) 
      }));
    }
  }, []);

  // Track interaction latency
  const trackInteraction = useCallback((interactionType: 'rotate' | 'zoom' | 'pan') => {
    const now = performance.now();
    const startTime = performance.now();
    
    performanceData.current.interactionTimestamps.push(now);
    
    setInteractionState(prev => ({
      ...prev,
      [`is${interactionType.charAt(0).toUpperCase() + interactionType.slice(1)}ing`]: true,
      lastInteraction: now,
      totalInteractions: prev.totalInteractions + 1
    }));

    // Measure interaction latency and report performance data
    requestAnimationFrame(() => {
      const latency = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, interactionLatency: latency }));

      // Report performance data
      performanceMonitor.measure('globe-interaction', {
        type: interactionType,
        latency: latency,
        timestamp: now
      });
    });
  }, []);

  // Stop tracking interaction
  const stopInteraction = useCallback((interactionType: 'rotate' | 'zoom' | 'pan') => {
    setInteractionState(prev => ({
      ...prev,
      [`is${interactionType.charAt(0).toUpperCase() + interactionType.slice(1)}ing`]: false
    }));
  }, []);

  // Get performance recommendations based on current metrics
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (metrics.frameRate < 30) {
      recommendations.push('Consider reducing globe detail level');
      recommendations.push('Disable real-time shadows or reflections');
    }

    if (metrics.interactionLatency > 50) {
      recommendations.push('Consider reducing interaction sensitivity');
      recommendations.push('Enable performance mode for low-end devices');
    }

    if (metrics.memoryUsage > 512) {
      recommendations.push('Consider implementing texture compression');
      recommendations.push('Reduce globe texture resolution');
    }

    if (metrics.deviceCapabilities.hardwareConcurrency < 4) {
      recommendations.push('Enable single-threaded rendering mode');
    }

    return recommendations;
  }, [metrics]);

  // Adaptive quality settings based on performance
  const getAdaptiveQualitySettings = useCallback(() => {
    const { frameRate, deviceCapabilities, memoryUsage } = metrics;
    
    let qualityLevel: 'low' | 'medium' | 'high' | 'ultra' = 'medium';
    
    if (frameRate < 20 || deviceCapabilities.hardwareConcurrency < 2 || memoryUsage > 1024) {
      qualityLevel = 'low';
    } else if (frameRate < 40 || deviceCapabilities.hardwareConcurrency < 4 || memoryUsage > 512) {
      qualityLevel = 'medium';
    } else if (frameRate >= 50 && deviceCapabilities.hardwareConcurrency >= 8) {
      qualityLevel = 'ultra';
    } else {
      qualityLevel = 'high';
    }

    return {
      qualityLevel,
      settings: {
        textureQuality: qualityLevel === 'ultra' ? 1.0 : qualityLevel === 'high' ? 0.8 : qualityLevel === 'medium' ? 0.6 : 0.4,
        shadowQuality: qualityLevel === 'low' ? 'none' : qualityLevel === 'medium' ? 'basic' : 'enhanced',
        antialiasing: qualityLevel !== 'low',
        vsync: frameRate > 50,
        maxLODLevel: qualityLevel === 'low' ? 2 : qualityLevel === 'medium' ? 4 : 6
      }
    };
  }, [metrics]);

  // Initialize capabilities detection
  useEffect(() => {
    detectDeviceCapabilities();
  }, [detectDeviceCapabilities]);

  // Performance monitoring loop
  useEffect(() => {
    let animationFrame: number;
    
    const monitorLoop = () => {
      trackRenderPerformance();
      animationFrame = requestAnimationFrame(monitorLoop);
    };

    animationFrame = requestAnimationFrame(monitorLoop);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [trackRenderPerformance]);

  return {
    metrics,
    interactionState,
    trackInteraction,
    stopInteraction,
    getPerformanceRecommendations,
    getAdaptiveQualitySettings,
    detectDeviceCapabilities
  };
};

// TODO: Implement 3D state synchronization for collaborative viewing - PRIORITY: MEDIUM
// TODO: Add support for adaptive performance optimization based on device capabilities - PRIORITY: MEDIUM