/**
 * usePerformanceMonitor - A React hook for monitoring application performance
 * 
 * This hook provides a React-idiomatic approach to performance monitoring.
 * It replaces the monitoring functionality from the PerformanceOptimizationManager
 * with a React-specific implementation that integrates with the component lifecycle.
 */

import { useState, useEffect, useRef } from 'react';

// Types for performance metrics
interface PerformanceMetrics {
  memory: number | null;     // Memory usage percentage (if available)
  fps: number | null;        // Frames per second
  renderTime: number | null; // Average time to render a frame in ms
  cpuUsage: number | null;   // CPU usage percentage (if available)
  loadTime: number | null;   // Initial page load time
  networkLatency: number | null; // Network latency in ms
}

// Types for operation timing
interface OperationTiming {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

// Types for hook options
interface PerformanceMonitorOptions {
  enableFpsMonitoring?: boolean;
  enableMemoryMonitoring?: boolean;
  enableNetworkMonitoring?: boolean;
  sampleInterval?: number;      // How often to sample in ms
  maxSamples?: number;          // Maximum number of samples to keep
  logToConsole?: boolean;       // Whether to log metrics to console
  warningThresholds?: {
    lowFps?: number;            // FPS below this triggers warning
    highMemory?: number;        // Memory usage percentage above this triggers warning
    highRenderTime?: number;    // Render time above this triggers warning
    highNetworkLatency?: number; // Network latency above this triggers warning
  };
}

// Types for hook result
interface PerformanceMonitorResult {
  metrics: PerformanceMetrics;
  samples: PerformanceMetrics[];
  warnings: string[];
  startOperation: (name: string) => void;
  endOperation: (name: string) => number | undefined;
  clearSamples: () => void;
}

/**
 * React hook for monitoring application performance
 * 
 * @param options - Configuration options for performance monitoring
 * @returns Performance metrics and utility functions
 */
export function usePerformanceMonitor(
  options: PerformanceMonitorOptions = {}
): PerformanceMonitorResult {
  // Default options
  const {
    enableFpsMonitoring = true,
    enableMemoryMonitoring = true,
    enableNetworkMonitoring = true,
    sampleInterval = 2000,
    maxSamples = 60,
    logToConsole = false,
    warningThresholds = {
      lowFps: 30,
      highMemory: 80,
      highRenderTime: 16, // 60 fps target
      highNetworkLatency: 200
    }
  } = options;
  
  // State for metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memory: null,
    fps: null,
    renderTime: null,
    cpuUsage: null,
    loadTime: null,
    networkLatency: null
  });
  
  // State for samples
  const [samples, setSamples] = useState<PerformanceMetrics[]>([]);
  
  // State for warnings
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Refs for internal tracking
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimesRef = useRef<number[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const operationsRef = useRef<Map<string, OperationTiming>>(new Map());
  
  // Initial page load time
  useEffect(() => {
    // Get page load time if available
    if (window.performance && window.performance.timing) {
      const loadTime = 
        window.performance.timing.domContentLoadedEventEnd - 
        window.performance.timing.navigationStart;
      
      setMetrics(prev => ({
        ...prev,
        loadTime
      }));
    }
  }, []);
  
  // Monitor FPS
  useEffect(() => {
    if (!enableFpsMonitoring) return;
    
    const measureFPS = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        // Calculate average frame time
        const avgRenderTime = frameTimesRef.current.length 
          ? frameTimesRef.current.reduce((sum, time) => sum + time, 0) / frameTimesRef.current.length 
          : null;
        
        setMetrics(prev => ({
          ...prev,
          fps,
          renderTime: avgRenderTime ? Math.round(avgRenderTime) : null
        }));
        
        // Check for warnings
        if (fps < (warningThresholds.lowFps || 30)) {
          setWarnings(prev => {
            const warning = `Low FPS detected: ${fps} FPS`;
            return prev.includes(warning) ? prev : [...prev, warning];
          });
        }
        
        if (avgRenderTime && avgRenderTime > (warningThresholds.highRenderTime || 16)) {
          setWarnings(prev => {
            const warning = `High render time detected: ${Math.round(avgRenderTime)}ms`;
            return prev.includes(warning) ? prev : [...prev, warning];
          });
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
        frameTimesRef.current = [];
      }
      
      // Measure time to render this frame
      const frameStartTime = performance.now();
      
      rafIdRef.current = requestAnimationFrame(() => {
        const frameEndTime = performance.now();
        frameTimesRef.current.push(frameEndTime - frameStartTime);
        measureFPS();
      });
    };
    
    measureFPS();
    
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enableFpsMonitoring, warningThresholds.highRenderTime, warningThresholds.lowFps]);
  
  // Monitor memory and network
  useEffect(() => {
    // Sampling interval
    const intervalId = setInterval(() => {
      const newMetrics: Partial<PerformanceMetrics> = {};
      
      // Memory monitoring
      if (enableMemoryMonitoring && (performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        const memoryUsage = Math.round(
          (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
        );
        
        newMetrics.memory = memoryUsage;
        
        // Check for warnings
        if (memoryUsage > (warningThresholds.highMemory || 80)) {
          setWarnings(prev => {
            const warning = `High memory usage detected: ${memoryUsage}%`;
            return prev.includes(warning) ? prev : [...prev, warning];
          });
        }
      }
      
      // Network monitoring
      if (enableNetworkMonitoring && (performance as any).getEntriesByType) {
        const resources = (performance as any).getEntriesByType('resource');
        if (resources.length > 0) {
          // Calculate average network latency from the last 10 resources
          const recentResources = resources.slice(-10);
          const totalLatency = recentResources.reduce(
            (sum: number, res: any) => sum + res.duration, 0
          );
          const avgLatency = Math.round(totalLatency / recentResources.length);
          
          newMetrics.networkLatency = avgLatency;
          
          // Check for warnings
          if (avgLatency > (warningThresholds.highNetworkLatency || 200)) {
            setWarnings(prev => {
              const warning = `High network latency detected: ${avgLatency}ms`;
              return prev.includes(warning) ? prev : [...prev, warning];
            });
          }
        }
      }
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        ...newMetrics
      }));
      
      // Add to samples
      setSamples(prev => {
        const newSamples = [...prev, { ...metrics, ...newMetrics }];
        return newSamples.slice(-maxSamples);
      });
      
      // Log to console if enabled
      if (logToConsole) {
        console.log('Performance Metrics:', { ...metrics, ...newMetrics });
      }
    }, sampleInterval);
    
    return () => clearInterval(intervalId);
  }, [
    enableMemoryMonitoring,
    enableNetworkMonitoring,
    logToConsole,
    maxSamples,
    metrics,
    sampleInterval,
    warningThresholds.highMemory,
    warningThresholds.highNetworkLatency
  ]);
  
  // Function to start timing an operation
  const startOperation = (name: string) => {
    operationsRef.current.set(name, {
      name,
      startTime: performance.now()
    });
  };
  
  // Function to end timing an operation and get the duration
  const endOperation = (name: string): number | undefined => {
    const operation = operationsRef.current.get(name);
    if (!operation) return undefined;
    
    operation.endTime = performance.now();
    operation.duration = operation.endTime - operation.startTime;
    
    if (logToConsole) {
      console.log(`Operation "${name}" completed in ${operation.duration.toFixed(2)}ms`);
    }
    
    return operation.duration;
  };
  
  // Function to clear samples
  const clearSamples = () => {
    setSamples([]);
  };
  
  return {
    metrics,
    samples,
    warnings,
    startOperation,
    endOperation,
    clearSamples
  };
}

/**
 * Example usage:
 * 
 * function PerformanceMonitoringExample() {
 *   const {
 *     metrics,
 *     warnings,
 *     startOperation,
 *     endOperation
 *   } = usePerformanceMonitor({
 *     logToConsole: true,
 *     warningThresholds: {
 *       lowFps: 40,
 *       highMemory: 75
 *     }
 *   });
 *   
 *   const handleHeavyOperation = () => {
 *     startOperation('heavyCalculation');
 *     
 *     // Simulate heavy operation
 *     const result = [...Array(1000000)].map((_, i) => i * i);
 *     
 *     const duration = endOperation('heavyCalculation');
 *     console.log(`Heavy calculation took ${duration}ms`);
 *     
 *     return result;
 *   };
 *   
 *   return (
 *     <div>
 *       <h2>Performance Monitor</h2>
 *       
 *       <div>
 *         <p>FPS: {metrics.fps || 'N/A'}</p>
 *         <p>Memory: {metrics.memory ? `${metrics.memory}%` : 'N/A'}</p>
 *         <p>Render Time: {metrics.renderTime ? `${metrics.renderTime}ms` : 'N/A'}</p>
 *         <p>Network Latency: {metrics.networkLatency ? `${metrics.networkLatency}ms` : 'N/A'}</p>
 *       </div>
 *       
 *       {warnings.length > 0 && (
 *         <div className="warnings">
 *           <h3>Performance Warnings</h3>
 *           <ul>
 *             {warnings.map((warning, i) => (
 *               <li key={i}>{warning}</li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *       
 *       <button onClick={handleHeavyOperation}>
 *         Run Heavy Operation
 *       </button>
 *     </div>
 *   );
 * }
 */
