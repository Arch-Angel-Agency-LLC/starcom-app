// src/components/Globe/GlobePerformanceMonitor.tsx
import React, { useEffect, useState, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  lastUpdate: number;
}

interface GlobePerformanceMonitorProps {
  enabled?: boolean;
  visualizationMode: { mode: string; subMode: string };
  onPerformanceIssue?: (issue: string) => void;
}

export const GlobePerformanceMonitor: React.FC<GlobePerformanceMonitorProps> = ({
  enabled = true,
  visualizationMode,
  onPerformanceIssue
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    lastUpdate: Date.now()
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    let frameCountRef = 0;
    let lastTime = Date.now();
    let animationId: number;

    const updateMetrics = () => {
      const now = Date.now();
      frameCountRef++;
      
      // Only update metrics every 2 seconds to prevent excessive state updates
      if (now - lastTime >= 2000) {
        const fps = Math.round((frameCountRef * 1000) / (now - lastTime));
        
        // Get memory usage if available
        const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
        const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
        
        // Only update state if metrics have changed significantly
        setMetrics(prev => {
          const fpsChanged = Math.abs(prev.fps - fps) > 5;
          const memoryChanged = Math.abs(prev.memoryUsage - memoryUsage) > 20; // 20MB threshold
          
          if (fpsChanged || memoryChanged) {
            return {
              fps,
              memoryUsage,
              renderTime: now - lastTime,
              lastUpdate: now
            };
          }
          return prev;
        });

        // Check for performance issues (but don't spam)
        if (fps < 30) {
          onPerformanceIssue?.(`Low FPS detected: ${fps} in ${visualizationMode.mode}/${visualizationMode.subMode}`);
        }
        
        if (memoryUsage > 500) {
          onPerformanceIssue?.(`High memory usage: ${memoryUsage}MB in ${visualizationMode.mode}/${visualizationMode.subMode}`);
        }

        frameCountRef = 0;
        lastTime = now;
      }

      animationId = requestAnimationFrame(updateMetrics);
    };

    animationId = requestAnimationFrame(updateMetrics);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled, visualizationMode.mode, visualizationMode.subMode, onPerformanceIssue]);

  if (!enabled) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 10001,
      minWidth: '120px'
    }}>
      <div>FPS: {metrics.fps}</div>
      <div>Memory: {metrics.memoryUsage}MB</div>
      <div>Mode: {visualizationMode.mode}/{visualizationMode.subMode}</div>
      {metrics.fps < 30 && (
        <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>⚠️ LOW FPS</div>
      )}
      {metrics.memoryUsage > 300 && (
        <div style={{ color: '#ffd93d', fontWeight: 'bold' }}>⚠️ HIGH MEM</div>
      )}
    </div>
  );
};

export default GlobePerformanceMonitor;
