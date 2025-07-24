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

    const updateMetrics = () => {
      const now = Date.now();
      frameCountRef.current++;
      
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        // Get memory usage if available
        const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
        const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
        
        setMetrics({
          fps,
          memoryUsage,
          renderTime: now - lastTimeRef.current,
          lastUpdate: now
        });

        // Check for performance issues
        if (fps < 30) {
          onPerformanceIssue?.(`Low FPS detected: ${fps} in ${visualizationMode.mode}/${visualizationMode.subMode}`);
        }
        
        if (memoryUsage > 500) {
          onPerformanceIssue?.(`High memory usage: ${memoryUsage}MB in ${visualizationMode.mode}/${visualizationMode.subMode}`);
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(updateMetrics);
    };

    animationFrameRef.current = requestAnimationFrame(updateMetrics);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
