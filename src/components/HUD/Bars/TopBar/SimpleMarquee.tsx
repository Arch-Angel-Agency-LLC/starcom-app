// SimpleMarquee.tsx
// A clean, working marquee with drag-to-scroll
import React, { useRef, useEffect, useState } from 'react';
import { MarqueeDataPoint, MarqueeProps } from './interfaces';
import { useSimpleDragScroll } from './simpleDragScroll';
import styles from './Marquee.module.css';

const SCROLL_SPEED = 1; // px per frame

const SimpleMarquee: React.FC<MarqueeProps> = ({ 
  dataPoints, 
  error = null,
  loadingStates = {},
  dataAvailability = {},
  isDraggable = true,
  onDataPointClick,
  onDataPointHover,
  customClassName
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [autoScrollOffset, setAutoScrollOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);

  // Use simple drag scroll
  const { dragHandlers, scrollOffset, isDragging } = useSimpleDragScroll();

  // Pause auto-scroll during interaction
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused || isDragging || contentWidth <= 0) return;

    let animationId: number;
    
    const animate = () => {
      setAutoScrollOffset(prev => {
        const newOffset = prev - SCROLL_SPEED;
        return newOffset <= -contentWidth ? 0 : newOffset;
      });
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, isDragging, contentWidth]);

  // Measure content width
  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth / 2); // Divide by 2 because we duplicate content
    }
  }, [dataPoints]);

  // Calculate final transform offset
  const totalOffset = isDragging || scrollOffset !== 0 ? scrollOffset : autoScrollOffset;

  // Process data points
  const processedDataPoints = dataPoints.filter(dp => 
    dp.value !== 'N/A' || dp.hasError || dataAvailability[dp.id]
  ).map(dp => ({
    ...dp,
    isLoading: loadingStates[dp.id] || false,
    hasError: dp.hasError || (dp.value === 'Error'),
    errorMessage: dp.errorMessage || (dp.value === 'Error' ? 'Data unavailable' : undefined)
  }));

  // Render data point
  const renderDataPoint = (dp: MarqueeDataPoint, index: number) => {
    const isClickable = !!onDataPointClick;
    const isError = dp.hasError || dp.value === 'Error';
    const isLoading = dp.isLoading && !isError;

    return (
      <div
        key={`${dp.id}-${index}`}
        className={`${styles.marqueeItem} ${isClickable ? styles.marqueeItemClickable : ''}`}
        onClick={() => onDataPointClick?.(dp)}
        onMouseEnter={() => onDataPointHover?.(dp)}
        style={{
          opacity: isLoading ? 0.6 : 1,
          color: isError ? '#ef4444' : undefined,
        }}
      >
        <span className={styles.marqueeIcon}>
          {isLoading ? '⏳' : isError ? '⚠️' : dp.icon}
        </span>
        <span className={styles.marqueeLabel}>
          {dp.label}:
        </span>
        <span className={styles.marqueeValue}>
          {isError ? (dp.errorMessage || 'Error') : 
           isLoading ? 'Loading...' : 
           dp.value}
        </span>
      </div>
    );
  };

  if (error) {
    return (
      <div className={`${styles.marquee} ${customClassName || ''}`}>
        <div className={styles.marqueeContent}>
          <div className={styles.marqueeItem} style={{ color: '#ef4444' }}>
            <span className={styles.marqueeIcon}>⚠️</span>
            <span className={styles.marqueeValue}>
              Error loading data: {error || 'Unknown error'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.marquee} ${customClassName || ''} ${isDragging ? styles.marqueeDragging : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...(isDraggable ? dragHandlers : {})}
      style={{
        cursor: isDraggable ? (isDragging ? 'grabbing' : 'grab') : 'default',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      <div
        ref={contentRef}
        className={styles.marqueeContent}
        style={{ 
          transform: `translateX(${totalOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s linear'
        }}
      >
        {/* First copy */}
        {processedDataPoints.map((dp, i) => renderDataPoint(dp, i))}
        {/* Second copy for seamless loop */}
        {processedDataPoints.map((dp, i) => renderDataPoint(dp, i + processedDataPoints.length))}
      </div>
      
      {isDragging && (
        <div className={styles.dragIndicator}>
          ↔️ Dragging
        </div>
      )}
    </div>
  );
};

export default SimpleMarquee;
