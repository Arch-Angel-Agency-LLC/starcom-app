/**
 * useVirtualization - A React hook for efficient rendering of large lists
 * 
 * This hook provides a React-idiomatic approach to data virtualization.
 * It replaces the virtualization functionality from the PerformanceOptimizationManager
 * with a React-specific implementation that integrates with the component lifecycle.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualizationOptions {
  itemHeight: number;        // Height of each item in pixels
  overscan?: number;         // Number of items to render beyond visible area
  initialIndex?: number;     // Initial scroll index
  onVisibleItemsChange?: (startIndex: number, endIndex: number) => void; // Callback when visible items change
  onScrollIndexChange?: (index: number) => void; // Callback when scroll index changes
}

interface VirtualizationResult<T> {
  virtualItems: Array<{
    item: T;
    index: number;
    style: {
      position: 'absolute';
      top: number;
      left: 0;
      width: '100%';
      height: number;
    };
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  containerProps: {
    ref: React.RefObject<HTMLDivElement>;
    style: {
      position: 'relative';
      height: '100%';
      overflow: 'auto';
      willChange: 'transform';
    };
    onScroll: (event: React.UIEvent) => void;
  };
}

/**
 * A hook for virtualizing large lists
 * 
 * @param items - The full list of items to virtualize
 * @param options - Configuration options for virtualization
 * @returns Virtualization helpers and rendered items
 */
export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
): VirtualizationResult<T> {
  const { 
    itemHeight, 
    overscan = 3, 
    initialIndex = 0,
    onVisibleItemsChange,
    onScrollIndexChange
  } = options;
  
  // Reference to the container element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for scroll position
  const [scrollTop, setScrollTop] = useState(initialIndex * itemHeight);
  
  // Calculate the range of items to render
  const { startIndex, endIndex, virtualItems, totalHeight } = calculateRange(
    items,
    itemHeight,
    scrollTop,
    containerRef.current?.clientHeight ?? 0,
    overscan
  );
  
  // Scroll to a specific index
  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);
  
  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent) => {
    const newScrollTop = (event.target as HTMLDivElement).scrollTop;
    setScrollTop(newScrollTop);
    
    // Calculate current scroll index
    const currentIndex = Math.floor(newScrollTop / itemHeight);
    if (onScrollIndexChange) {
      onScrollIndexChange(currentIndex);
    }
  }, [itemHeight, onScrollIndexChange]);
  
  // Notify when visible items change
  useEffect(() => {
    if (onVisibleItemsChange) {
      onVisibleItemsChange(startIndex, endIndex);
    }
  }, [startIndex, endIndex, onVisibleItemsChange]);
  
  // Scroll to initial index on mount
  useEffect(() => {
    if (initialIndex > 0) {
      scrollToIndex(initialIndex);
    }
  }, [initialIndex, scrollToIndex]);
  
  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerProps: {
      ref: containerRef,
      style: {
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        willChange: 'transform'
      },
      onScroll: handleScroll
    }
  };
}

/**
 * Calculate the range of items to render based on scroll position
 */
function calculateRange<T>(
  items: T[],
  itemHeight: number,
  scrollTop: number,
  viewportHeight: number,
  overscan: number
) {
  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
  );
  
  // Calculate total content height
  const totalHeight = items.length * itemHeight;
  
  // Create virtual items with positioning
  const virtualItems = items
    .slice(startIndex, endIndex + 1)
    .map((item, index) => {
      const virtualIndex = startIndex + index;
      return {
        item,
        index: virtualIndex,
        style: {
          position: 'absolute' as const,
          top: virtualIndex * itemHeight,
          left: 0,
          width: '100%',
          height: itemHeight
        }
      };
    });
  
  return { startIndex, endIndex, virtualItems, totalHeight };
}

/**
 * Example usage:
 * 
 * function VirtualList({ items }) {
 *   const { virtualItems, totalHeight, containerProps } = useVirtualization(items, {
 *     itemHeight: 50,
 *     overscan: 5
 *   });
 * 
 *   return (
 *     <div {...containerProps}>
 *       <div style={{ height: totalHeight }}>
 *         {virtualItems.map(({ item, index, style }) => (
 *           <div key={index} style={style}>
 *             {item.name}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 */
