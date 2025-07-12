// CyberCommandMarquee.tsx
// Production-ready infinite marquee with seamless drag-to-scroll
import React, { useRef, useEffect, useState } from 'react';
import { CyberCommandMarqueeDataPoint, CyberCommandMarqueeProps } from './interfaces';
import styles from './CyberCommandMarquee.module.css';

const SCROLL_SPEED = 1; // px per frame

// Seamless infinite marquee component
const CyberCommandMarquee: React.FC<CyberCommandMarqueeProps> = ({ 
  dataPoints, 
  error = null,
  loadingStates = {},
  dataAvailability = {},
  isDraggable = true,
  onDataPointClick,
  onDataPointHover,
  customClassName,
  onOpenSettings // Add this prop to open settings
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Single continuous offset - no resets, no normalization
  const [offset, setOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, offset: 0 });
  const [hasActuallyDragged, setHasActuallyDragged] = useState(false);
  
  // Mouse hover state for pausing
  const [isHovered, setIsHovered] = useState(false);

  // Drag threshold to distinguish between clicks and drags
  const DRAG_THRESHOLD = 5; // pixels
  
  // Auto-scroll animation - continuous movement (pauses on hover or actual drag)
  useEffect(() => {
    if (hasActuallyDragged || isHovered || contentWidth <= 0) return;

    let animationId: number;
    
    const animate = () => {
      setOffset(prev => prev - SCROLL_SPEED);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationId);
  }, [hasActuallyDragged, isHovered, contentWidth]);

  // Calculate single content width (width of one set of items)
  useEffect(() => {
    const updateWidth = () => {
      if (contentRef.current) {
        // We render 3 copies, so divide by 3 to get single set width
        const singleSetWidth = contentRef.current.scrollWidth / 3;
        setContentWidth(singleSetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [dataPoints]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    // Don't prevent default immediately - let clicks work
    setIsDragging(true);
    setHasActuallyDragged(false);
    setDragStart({ x: e.clientX, y: e.clientY, offset });
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDraggable || e.touches.length !== 1) return;
    e.preventDefault();
    setIsDragging(true);
    setHasActuallyDragged(false);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, offset });
  };

  // Global drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Only start actual dragging if we've moved beyond the threshold
      if (distance > DRAG_THRESHOLD) {
        if (!hasActuallyDragged) {
          setHasActuallyDragged(true);
          e.preventDefault(); // Now we can prevent default
        }
        setOffset(dragStart.offset + deltaX);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Only prevent default if we actually dragged
      if (hasActuallyDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsDragging(false);
      setHasActuallyDragged(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - dragStart.x;
        const deltaY = e.touches[0].clientY - dragStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > DRAG_THRESHOLD) {
          if (!hasActuallyDragged) {
            setHasActuallyDragged(true);
            e.preventDefault();
          }
          setOffset(dragStart.offset + deltaX);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (hasActuallyDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsDragging(false);
      setHasActuallyDragged(false);
    };

    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStart, hasActuallyDragged, DRAG_THRESHOLD]);

  // Calculate the final transform with seamless looping
  // The key insight: use modulo to create seamless infinite scrolling
  const getTransform = () => {
    if (contentWidth <= 0) return 'translateX(0px)';
    
    // Normalize offset to always be within one content width cycle
    // This creates seamless infinite scrolling without visible resets
    const normalizedOffset = ((offset % contentWidth) + contentWidth) % contentWidth;
    
    // Apply offset to the second copy (middle copy) so content appears continuous
    return `translateX(${-contentWidth + normalizedOffset}px)`;
  };

  // Render data point
  const renderDataPoint = (dataPoint: CyberCommandMarqueeDataPoint, index: number, copyIndex: number) => {
    const isLoading = loadingStates[dataPoint.id] || false;
    const isAvailable = dataAvailability[dataPoint.id] !== false;
    const uniqueKey = `${copyIndex}-${dataPoint.id}-${index}`;

    const handleDataPointClick = () => {
      // Call the original click handler if provided
      onDataPointClick?.(dataPoint);
      
      // Open settings popup and navigate to this data point's section
      // This would integrate with your settings system
      openDataPointSettings(dataPoint.id);
    };

    return (
      <div
        key={uniqueKey}
        className={`${styles.marqueeItem} ${styles.marqueeItemClickable}`}
        onClick={handleDataPointClick}
        onMouseEnter={() => onDataPointHover?.(dataPoint)}
        onMouseLeave={() => onDataPointHover?.(null)}
        style={{
          opacity: isLoading ? 0.6 : 1,
          color: !isAvailable ? '#ef4444' : undefined,
          cursor: 'pointer',
        }}
        title={`Configure ${dataPoint.label} settings`}
      >
        <span className={styles.marqueeIcon}>
          {isLoading ? '⏳' : !isAvailable ? '⚠️' : dataPoint.icon}
        </span>
        <span className={styles.marqueeLabel}>
          {dataPoint.label}:
        </span>
        <span className={styles.marqueeValue}>
          {!isAvailable ? 'Error' : 
           isLoading ? 'Loading...' : 
           dataPoint.value}
        </span>
      </div>
    );
  };

  // Function to open settings for a specific data point
  const openDataPointSettings = (dataPointId: string) => {
    // Use the callback prop to open settings with the specific data point
    if (onOpenSettings) {
      onOpenSettings(dataPointId);
    } else {
      // Fallback for development/testing
      console.log(`Opening settings for data point: ${dataPointId}`);
      alert(`Opening settings for: ${dataPointId}`);
    }
  };

  if (error) {
    return (
      <div className={`${styles.marquee} ${customClassName || ''}`}>
        <div className={styles.marqueeContent}>
          <div className={styles.marqueeItem} style={{ color: '#ef4444' }}>
            <span className={styles.marqueeIcon}>⚠️</span>
            <span className={styles.marqueeValue}>
              Error loading data: {error}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className={`${styles.marquee} ${customClassName || ''}`}>
        <div className={styles.marqueeContent}>
          <div className={styles.marqueeItem}>
            <span className={styles.marqueeValue}>
              No data available
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${styles.marquee} ${customClassName || ''} ${hasActuallyDragged ? styles.marqueeDragging : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        ref={contentRef}
        className={styles.marqueeContent}
        style={{ 
          transform: getTransform(),
          cursor: isDraggable ? (hasActuallyDragged ? 'grabbing' : 'grab') : 'default'
        }}
      >
        {/* Render 3 copies of content for seamless infinite scrolling */}
        {[0, 1, 2].map(copyIndex => (
          <div key={copyIndex} className={styles.contentCopy}>
            {dataPoints.map((dataPoint, index) => 
              renderDataPoint(dataPoint, index, copyIndex)
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CyberCommandMarquee;
