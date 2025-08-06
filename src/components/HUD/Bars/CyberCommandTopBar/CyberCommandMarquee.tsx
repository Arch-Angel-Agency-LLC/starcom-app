// CyberCommandMarquee.tsx
// PARADIGM SHIFT: Use AnimationEngine instead of React state for 60fps animations
import React, { useRef, useEffect, useState } from 'react';
import { MarqueeDataPoint } from './interfaces';
import styles from './CyberCommandMarquee.module.css';
import { useAnimation } from '../../../../core/AnimationEngine';

const SCROLL_SPEED = 1; // px per frame

// Props interface for the marquee component
interface CyberCommandMarqueeProps {
  dataPoints: MarqueeDataPoint[];
  error?: string | null;
  loadingStates?: Record<string, boolean>;
  dataAvailability?: Record<string, boolean>;
  isDraggable?: boolean;
  onDataPointClick?: (dataPoint: MarqueeDataPoint) => void;
  onDataPointHover?: (dataPoint: MarqueeDataPoint) => void;
  customClassName?: string;
  onOpenSettings?: () => void;
}

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
  const contentWidthRef = useRef<number>(0);
  
  // PARADIGM SHIFT: Animation values stored in refs, not React state
  const offsetRef = useRef<number>(0);
  
  // React state ONLY for discrete UI changes (not 60fps updates)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, offset: 0 });
  const [hasActuallyDragged, setHasActuallyDragged] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // PARADIGM SHIFT: Use AnimationEngine instead of useEffect + requestAnimationFrame
  useAnimation(
    'marquee-scroll',
    (_deltaTime: number) => {
      // Only animate if not dragging or hovering
      if (!hasActuallyDragged && !isHovered && contentWidthRef.current > 0) {
        offsetRef.current -= SCROLL_SPEED;
        
        // Direct DOM manipulation - NO React state updates
        if (contentRef.current) {
          contentRef.current.style.transform = `translateX(${offsetRef.current}px)`;
        }
      }
    },
    5 // High priority for smooth scrolling
  );

  // Drag threshold to distinguish between clicks and drags
  const DRAG_THRESHOLD = 5; // pixels
  
  // Calculate single content width (width of one set of items)
  useEffect(() => {
    const updateWidth = () => {
      if (contentRef.current) {
        // We render 3 copies, so divide by 3 to get single set width
        const singleSetWidth = contentRef.current.scrollWidth / 3;
        contentWidthRef.current = singleSetWidth; // Use ref instead of setState
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
    setDragStart({ x: e.clientX, y: e.clientY, offset: offsetRef.current });
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDraggable || e.touches.length !== 1) return;
    e.preventDefault();
    setIsDragging(true);
    setHasActuallyDragged(false);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, offset: offsetRef.current });
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
        const newOffset = dragStart.offset + deltaX;
        offsetRef.current = newOffset;
        // Direct DOM update - no React state
        if (contentRef.current) {
          contentRef.current.style.transform = `translateX(${newOffset}px)`;
        }
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
          const newOffset = dragStart.offset + deltaX;
          offsetRef.current = newOffset;
          // Direct DOM update - no React state
          if (contentRef.current) {
            contentRef.current.style.transform = `translateX(${newOffset}px)`;
          }
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
    if (contentWidthRef.current <= 0) return 'translateX(0px)';
    
    // Normalize offset to always be within one content width cycle
    // This creates seamless infinite scrolling without visible resets
    const normalizedOffset = ((offsetRef.current % contentWidthRef.current) + contentWidthRef.current) % contentWidthRef.current;
    
    // Apply offset to the second copy (middle copy) so content appears continuous
    return `translateX(${-contentWidthRef.current + normalizedOffset}px)`;
  };

  // Render data point
  const renderDataPoint = (dataPoint: MarqueeDataPoint, index: number, copyIndex: number) => {
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
      onOpenSettings();
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
