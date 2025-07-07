// simpleDragScroll.ts
// A clean, simple drag-to-scroll implementation for the marquee
import { useState, useRef, useCallback, useEffect } from 'react';

interface DragScrollState {
  isDragging: boolean;
  startX: number;
  scrollLeft: number;
  currentX: number;
  velocity: number;
  momentumId: number | null;
}

interface DragScrollReturn {
  dragState: DragScrollState;
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  scrollOffset: number;
  isDragging: boolean;
  resetScroll: () => void;
}

export const useSimpleDragScroll = (): DragScrollReturn => {
  const [dragState, setDragState] = useState<DragScrollState>({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    currentX: 0,
    velocity: 0,
    momentumId: null,
  });

  const [scrollOffset, setScrollOffset] = useState(0);
  const lastTimeRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);

  // Start drag
  const startDrag = useCallback((clientX: number) => {
    // Cancel any momentum
    if (dragState.momentumId) {
      cancelAnimationFrame(dragState.momentumId);
    }

    setDragState({
      isDragging: true,
      startX: clientX,
      scrollLeft: scrollOffset,
      currentX: clientX,
      velocity: 0,
      momentumId: null,
    });

    lastTimeRef.current = Date.now();
    lastXRef.current = clientX;
  }, [scrollOffset, dragState.momentumId]);

  // Handle drag move
  const handleDragMove = useCallback((clientX: number) => {
    if (!dragState.isDragging) return;

    const now = Date.now();
    const timeDelta = now - lastTimeRef.current;
    
    if (timeDelta > 0) {
      const velocity = (clientX - lastXRef.current) / timeDelta;
      
      setDragState(prev => ({
        ...prev,
        currentX: clientX,
        velocity: velocity,
      }));

      // Update scroll position immediately
      const deltaX = clientX - dragState.startX;
      setScrollOffset(dragState.scrollLeft + deltaX);

      lastTimeRef.current = now;
      lastXRef.current = clientX;
    }
  }, [dragState.isDragging, dragState.startX, dragState.scrollLeft]);

  // End drag and start momentum
  const endDrag = useCallback(() => {
    if (!dragState.isDragging) return;

    const velocity = dragState.velocity;
    
    setDragState(prev => ({
      ...prev,
      isDragging: false,
    }));

    // Start momentum if velocity is significant
    if (Math.abs(velocity) > 0.1) {
      let currentVelocity = velocity;
      let currentOffset = scrollOffset;

      const animateMomentum = () => {
        currentVelocity *= 0.95; // Friction
        currentOffset += currentVelocity * 16; // 16ms frame

        setScrollOffset(currentOffset);

        if (Math.abs(currentVelocity) > 0.1) {
          const id = requestAnimationFrame(animateMomentum);
          setDragState(prev => ({ ...prev, momentumId: id }));
        } else {
          setDragState(prev => ({ ...prev, momentumId: null }));
        }
      };

      const id = requestAnimationFrame(animateMomentum);
      setDragState(prev => ({ ...prev, momentumId: id }));
    }
  }, [dragState.isDragging, dragState.velocity, scrollOffset]);

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX);
  }, [startDrag]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX);
    }
  }, [startDrag]);

  // Global event listeners
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientX);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      endDrag();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        handleDragMove(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      endDrag();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragState.isDragging, handleDragMove, endDrag]);

  // Cleanup momentum on unmount
  useEffect(() => {
    return () => {
      if (dragState.momentumId) {
        cancelAnimationFrame(dragState.momentumId);
      }
    };
  }, [dragState.momentumId]);

  const resetScroll = useCallback(() => {
    if (dragState.momentumId) {
      cancelAnimationFrame(dragState.momentumId);
    }
    setScrollOffset(0);
    setDragState({
      isDragging: false,
      startX: 0,
      scrollLeft: 0,
      currentX: 0,
      velocity: 0,
      momentumId: null,
    });
  }, [dragState.momentumId]);

  return {
    dragState,
    dragHandlers: {
      onMouseDown,
      onTouchStart,
    },
    scrollOffset,
    isDragging: dragState.isDragging,
    resetScroll,
  };
};
