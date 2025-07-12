// useDraggableMarquee.ts
// Custom hook for implementing drag-to-scroll marquee with x-offset positioning
import { useState, useRef, useCallback, useEffect } from 'react';
import { DragState, DragConstraints, DragPhysics, DragCallbacks, UseDraggableMarqueeReturn } from './interfaces';

const DEFAULT_PHYSICS: DragPhysics = {
  friction: 0.95,
  elasticity: 0.3,
  snapBackSpeed: 0.8,
  momentumDecay: 0.98,
  velocityThreshold: 0.5,
};

// Edge case monitoring specifically for drag-to-scroll x-offset operations
const SCROLL_EDGE_MONITOR = {
  extremeOffsetCount: 0,
  velocitySpikes: 0,
  boundaryCollisions: 0,
  animationFrameLeaks: 0,
  maxIssuesBeforeReset: 8,
  
  reportScrollIssue(type: 'extremeOffset' | 'velocitySpike' | 'boundaryCollision' | 'animationLeak') {
    const countProp = type === 'extremeOffset' ? 'extremeOffsetCount' :
                     type === 'velocitySpike' ? 'velocitySpikes' :
                     type === 'boundaryCollision' ? 'boundaryCollisions' : 'animationFrameLeaks';
    
    this[countProp]++;
    // Reduce console noise - only warn for critical issues
    if (this.getTotalScrollIssues() > this.maxIssuesBeforeReset - 2) {
      console.warn(`Scroll edge case detected: ${type} in useDraggableMarquee`);
    }
    
    if (this.getTotalScrollIssues() > this.maxIssuesBeforeReset) {
      console.error('Critical scroll issues detected, resetting scroll state');
      return true;
    }
    return false;
  },
  
  getTotalScrollIssues() {
    return this.extremeOffsetCount + this.velocitySpikes + this.boundaryCollisions + this.animationFrameLeaks;
  },
  
  reset() {
    this.extremeOffsetCount = 0;
    this.velocitySpikes = 0;
    this.boundaryCollisions = 0;
    this.animationFrameLeaks = 0;
  }
};

// Device and input method detection for better calibration
const DEVICE_CALIBRATION = {
  // Detect high-DPI displays
  getPixelRatio() {
    return window.devicePixelRatio || 1;
  },
  
  // Detect touch capability
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  // Get appropriate velocity thresholds based on device
  getVelocityThreshold() {
    const pixelRatio = this.getPixelRatio();
    const isTouchDevice = this.isTouchDevice();
    
    // Base threshold: 150px/ms for standard displays (much more realistic)
    let threshold = 150;
    
    // Increase threshold for high-DPI displays
    if (pixelRatio > 1.5) {
      threshold *= Math.min(pixelRatio, 3); // Cap multiplier at 3x
    }
    
    // Touch devices can have very fast swipe velocities
    if (isTouchDevice) {
      threshold *= 2; // Touch can be much faster
    }
    
    return Math.min(threshold, 500); // Cap at 500px/ms for extreme cases
  },
  
  // Get movement validation threshold
  getMovementThreshold() {
    const pixelRatio = this.getPixelRatio();
    const isTouchDevice = this.isTouchDevice();
    
    // Base threshold: 100px/ms (much more realistic for normal usage)
    let threshold = 100;
    
    if (pixelRatio > 1.5) {
      threshold *= Math.min(pixelRatio, 3); // Cap multiplier at 3x
    }
    
    if (isTouchDevice) {
      threshold *= 2.5; // Touch can be much faster
    }
    
    return Math.min(threshold, 300); // Cap at 300px/ms
  }
};

export const useDraggableMarquee = (
  constraints?: DragConstraints,
  physics: DragPhysics = DEFAULT_PHYSICS,
  callbacks?: DragCallbacks
): UseDraggableMarqueeReturn => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    momentum: 0,
    lastMoveTime: 0,
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const momentumAnimationRef = useRef<number>();
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const velocityHistoryRef = useRef<number[]>([]);
  const performanceTimerRef = useRef<number>();
  const eventListenerCleanupRef = useRef<(() => void)[]>([]);

  // Scroll-specific emergency recovery system
  const activateScrollEmergencyMode = useCallback(() => {
    console.warn('Activating emergency mode for drag-to-scroll marquee');
    setEmergencyMode(true);
    
    // Cancel all scroll animations
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = undefined;
      SCROLL_EDGE_MONITOR.reportScrollIssue('animationLeak');
    }
    
    // Reset scroll state to center position
    setDragState({
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0, // Reset horizontal scroll offset
      deltaY: 0,
      velocity: 0,
      momentum: 0,
      lastMoveTime: 0,
    });
    
    // Clear velocity history for scroll
    velocityHistoryRef.current = [];
    lastPositionRef.current = { x: 0, y: 0 };
    
    // Auto-recovery after 2 seconds for scroll
    setTimeout(() => {
      setEmergencyMode(false);
      SCROLL_EDGE_MONITOR.reset();
    }, 2000);
  }, []);

  // Enhanced physics validation
  const validatePhysics = useCallback((physicsToValidate: DragPhysics) => {
    const safePhysics = { ...DEFAULT_PHYSICS };
    
    // Validate and constrain each physics property
    if (isFinite(physicsToValidate.friction) && physicsToValidate.friction > 0 && physicsToValidate.friction <= 1) {
      safePhysics.friction = physicsToValidate.friction;
    }
    if (isFinite(physicsToValidate.elasticity) && physicsToValidate.elasticity >= 0 && physicsToValidate.elasticity <= 1) {
      safePhysics.elasticity = physicsToValidate.elasticity;
    }
    if (isFinite(physicsToValidate.snapBackSpeed) && physicsToValidate.snapBackSpeed > 0 && physicsToValidate.snapBackSpeed <= 2) {
      safePhysics.snapBackSpeed = physicsToValidate.snapBackSpeed;
    }
    if (isFinite(physicsToValidate.momentumDecay) && physicsToValidate.momentumDecay > 0 && physicsToValidate.momentumDecay <= 1) {
      safePhysics.momentumDecay = physicsToValidate.momentumDecay;
    }
    if (isFinite(physicsToValidate.velocityThreshold) && physicsToValidate.velocityThreshold >= 0) {
      safePhysics.velocityThreshold = physicsToValidate.velocityThreshold;
    }
    
    return safePhysics;
  }, []);

  const validatedPhysics = validatePhysics(physics);

  // Calculate horizontal scroll velocity with device-aware and improved timing
  const calculateScrollVelocity = useCallback((currentX: number, currentTime: number) => {
    if (emergencyMode) return 0; // No velocity during emergency mode
    
    const timeDelta = currentTime - dragState.lastMoveTime;
    
    // Edge case: Handle zero or negative time delta for scroll
    // Use minimum 1ms to prevent division by zero
    if (timeDelta <= 0 || !isFinite(timeDelta)) return 0;

    const horizontalDistance = currentX - lastPositionRef.current.x;
    
    // Edge case: Handle invalid scroll distance values
    if (!isFinite(horizontalDistance)) return 0;
    
    // Edge case: Detect extremely high scroll velocity (device-aware thresholds)
    const scrollVelocity = horizontalDistance / timeDelta;
    const MAX_SCROLL_VELOCITY = DEVICE_CALIBRATION.getVelocityThreshold();
    
    if (!isFinite(scrollVelocity) || Math.abs(scrollVelocity) > MAX_SCROLL_VELOCITY) {
      SCROLL_EDGE_MONITOR.reportScrollIssue('velocitySpike');
      // Only warn for truly extreme velocities (3x threshold), significantly reduce console spam
      if (Math.abs(scrollVelocity) > MAX_SCROLL_VELOCITY * 3) {
        console.warn('Extreme scroll velocity detected, clamping:', Math.round(scrollVelocity), 'px/ms (threshold:', MAX_SCROLL_VELOCITY, ')');
      }
      return Math.sign(scrollVelocity || 0) * Math.min(Math.abs(scrollVelocity || 0), MAX_SCROLL_VELOCITY);
    }
    
    // Keep scroll velocity history for smoothing with memory management
    velocityHistoryRef.current.push(scrollVelocity);
    const MAX_SCROLL_HISTORY = 8; // Optimized for scroll performance
    if (velocityHistoryRef.current.length > MAX_SCROLL_HISTORY) {
      velocityHistoryRef.current.shift();
    }

    // Edge case: Handle empty velocity history
    if (velocityHistoryRef.current.length === 0) return 0;

    // Return smoothed scroll velocity with outlier removal
    const validScrollVelocities = velocityHistoryRef.current.filter(v => 
      isFinite(v) && Math.abs(v) <= MAX_SCROLL_VELOCITY
    );
    if (validScrollVelocities.length === 0) return 0;
    
    const avgScrollVelocity = validScrollVelocities.reduce((sum, v) => sum + v, 0) / validScrollVelocities.length;
    return isFinite(avgScrollVelocity) ? avgScrollVelocity : 0;
  }, [dragState.lastMoveTime, emergencyMode]);

  // Apply horizontal scroll boundaries with scroll-specific edge case handling
  const applyScrollBoundaries = useCallback((scrollX: number, scrollY: number) => {
    if (emergencyMode) return { x: 0, y: 0 }; // Reset scroll position during emergency
    
    // Edge case: Handle invalid scroll offset values
    if (!isFinite(scrollX) || !isFinite(scrollY)) {
      console.warn('Invalid scroll coordinates detected, resetting to origin');
      return { x: 0, y: 0 };
    }

    // Edge case: Detect extremely large scroll offset values (potential overflow)
    const MAX_SCROLL_OFFSET = 50000; // Reasonable maximum for marquee scrolling
    if (Math.abs(scrollX) > MAX_SCROLL_OFFSET) {
      SCROLL_EDGE_MONITOR.reportScrollIssue('extremeOffset');
      console.warn('Extreme horizontal scroll offset detected, clamping:', scrollX);
      scrollX = Math.sign(scrollX) * Math.min(Math.abs(scrollX), MAX_SCROLL_OFFSET);
    }

    let constrainedScrollX = scrollX;
    let constrainedScrollY = scrollY; // Y is typically 0 for horizontal marquee scrolling

    // Apply horizontal scroll boundaries with validation
    if (constraints?.minX !== undefined && isFinite(constraints.minX)) {
      constrainedScrollX = Math.max(constrainedScrollX, constraints.minX);
      if (constrainedScrollX === constraints.minX) {
        SCROLL_EDGE_MONITOR.reportScrollIssue('boundaryCollision');
      }
    }
    if (constraints?.maxX !== undefined && isFinite(constraints.maxX)) {
      constrainedScrollX = Math.min(constrainedScrollX, constraints.maxX);
      if (constrainedScrollX === constraints.maxX) {
        SCROLL_EDGE_MONITOR.reportScrollIssue('boundaryCollision');
      }
    }

    // Y-axis is typically constrained to 0 for horizontal marquee scrolling
    constrainedScrollY = 0;

    // Edge case: Validate scroll boundary logic (min should be <= max)
    if (constraints?.minX !== undefined && constraints?.maxX !== undefined && 
        isFinite(constraints.minX) && isFinite(constraints.maxX) && 
        constraints.minX > constraints.maxX) {
      console.warn('Invalid scroll constraints: minX > maxX, using default bounds');
      constrainedScrollX = Math.max(-10000, Math.min(constrainedScrollX, 10000));
    }

    // Final safety check for scroll offsets
    return { 
      x: isFinite(constrainedScrollX) ? constrainedScrollX : 0, 
      y: isFinite(constrainedScrollY) ? constrainedScrollY : 0 
    };
  }, [constraints, emergencyMode]);

  // Helper function to handle momentum end with delta reset
  const handleMomentumEnd = useCallback((currentState: DragState) => {
    try {
      callbacks?.onMomentumEnd?.(currentState);
    } catch (error) {
      console.error('Error in momentum end callback:', error);
    }
    
    // Reset deltaX/Y after callback has processed them
    setDragState(prev => ({ 
      ...prev, 
      momentum: 0, 
      velocity: 0,
      deltaX: 0,
      deltaY: 0,
    }));
  }, [callbacks]);

  // Start scroll momentum animation with scroll-specific edge case handling
  const startScrollMomentumAnimation = useCallback((initialVelocity: number) => {
    if (emergencyMode) return; // Skip momentum during emergency mode
    
    // Edge case: Handle invalid velocity values
    if (!isFinite(initialVelocity) || Math.abs(initialVelocity) < validatedPhysics.velocityThreshold) {
      handleMomentumEnd(dragState);
      return;
    }

    // Cancel any existing momentum animation with leak detection
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = undefined;
    }

    let velocity = initialVelocity;
    let position = dragState.currentX;
    let frameCount = 0;
    const maxFrames = 2000; // Increased safety limit for momentum animation
    const startTime = performance.now();
    
    // Performance monitoring
    performanceTimerRef.current = startTime;

    callbacks?.onMomentumStart?.(dragState);

    const animate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      // Edge case: Performance monitoring - detect runaway animations
      if (currentTime - startTime > 10000) { // 10 second maximum
        console.warn('Momentum animation running too long, terminating');
        handleMomentumEnd(dragState);
        return;
      }
      
      // Edge case: Safety check to prevent infinite animation
      if (frameCount > maxFrames) {
        console.warn('Momentum animation exceeded maximum frames, stopping');
        handleMomentumEnd(dragState);
        SCROLL_EDGE_MONITOR.reportScrollIssue('animationLeak');
        return;
      }

      // Apply physics decay with validation
      velocity *= validatedPhysics.momentumDecay;
      position += velocity;

      // Edge case: Handle invalid position values or NaN propagation
      if (!isFinite(position) || !isFinite(velocity)) {
        console.warn('Invalid momentum values detected, stopping animation');
        handleMomentumEnd(dragState);
        return;
      }

      // Edge case: Detect oscillation or stuck animation
      const prevPosition = lastPositionRef.current.x;
      if (frameCount > 60 && Math.abs(position - prevPosition) < 0.01) {
        console.log('Momentum animation appears stuck, terminating gracefully');
        handleMomentumEnd(dragState);
        return;
      }

      const constrained = applyScrollBoundaries(position, dragState.currentY);
      
      setDragState(prev => ({
        ...prev,
        currentX: constrained.x,
        currentY: constrained.y,
        velocity,
        momentum: Math.abs(velocity),
      }));

      lastPositionRef.current = { x: constrained.x, y: constrained.y };

      if (Math.abs(velocity) > validatedPhysics.velocityThreshold) {
        momentumAnimationRef.current = requestAnimationFrame(animate);
      } else {
        handleMomentumEnd(dragState);
      }
    };

    try {
      momentumAnimationRef.current = requestAnimationFrame(animate);
    } catch (error) {
      console.error('Failed to start momentum animation:', error);
      activateScrollEmergencyMode();
    }
  }, [dragState, validatedPhysics, callbacks, applyScrollBoundaries, emergencyMode, activateScrollEmergencyMode, handleMomentumEnd]);

  // Handle drag start with comprehensive input validation and state management
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (emergencyMode) {
      console.log('Drag blocked due to emergency mode');
      return;
    }
    
    // Edge case: Validate input coordinates with browser-specific checks
    if (!isFinite(clientX) || !isFinite(clientY)) {
      console.warn('Invalid drag start coordinates, ignoring drag start');
      return;
    }

    // Edge case: Detect rapid successive drag starts (possible input spam)
    const currentTime = Date.now();
    if (dragState.lastMoveTime && (currentTime - dragState.lastMoveTime) < 5) {
      // Reduce throttling slightly, was too aggressive at 10ms
      return;
    }

    // Edge case: Validate coordinate ranges (prevent negative coordinates that don't make sense)
    if (clientX < -10000 || clientY < -10000 || clientX > 20000 || clientY > 20000) {
      console.warn('Suspicious coordinate values, possible input error:', { clientX, clientY });
      return;
    }

    // Cancel any existing momentum animation with cleanup
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = undefined;
    }

    const newState: DragState = {
      isDragging: true,
      dragStartX: clientX,
      dragStartY: clientY,
      currentX: clientX,
      currentY: clientY,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
      momentum: 0,
      lastMoveTime: currentTime,
    };

    setDragState(newState);
    setHasStarted(true);
    lastPositionRef.current = { x: clientX, y: clientY };
    velocityHistoryRef.current = [];

    try {
      callbacks?.onDragStart?.(newState);
    } catch (error) {
      console.error('Error in drag start callback:', error);
      // Don't break the drag operation for callback errors
    }
  }, [callbacks, dragState.lastMoveTime, emergencyMode]);

  // Handle drag move with advanced validation and performance monitoring
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging || emergencyMode) return;

    // Edge case: Validate input coordinates
    if (!isFinite(clientX) || !isFinite(clientY)) {
      console.warn('Invalid drag move coordinates, ignoring move event');
      return;
    }

    const currentTime = Date.now();
    
    // Edge case: Prevent rapid-fire events with same timestamp
    if (currentTime === dragState.lastMoveTime) return;

    // Edge case: Detect impossible movement speed (device-aware thresholds)
    const timeDelta = currentTime - dragState.lastMoveTime;
    
    // Require minimum time delta for meaningful velocity calculation
    if (timeDelta < 5) return; // Skip events that are too close together
    
    const distance = Math.sqrt(
      Math.pow(clientX - lastPositionRef.current.x, 2) + 
      Math.pow(clientY - lastPositionRef.current.y, 2)
    );
    
    // Use device-aware threshold for movement validation
    const movementThreshold = DEVICE_CALIBRATION.getMovementThreshold();
    if (timeDelta > 0 && distance / timeDelta > movementThreshold) {
      // Only warn for truly extreme movements (3x threshold), significantly reduce console spam
      if (distance / timeDelta > movementThreshold * 3) {
        console.warn('Extreme movement speed detected:', Math.round(distance / timeDelta), 'px/ms (threshold:', movementThreshold, ')');
        SCROLL_EDGE_MONITOR.reportScrollIssue('extremeOffset');
      }
      // Still allow the movement - just log for debugging
    }

    // Edge case: Detect stuck/frozen input (same coordinates repeatedly)
    if (clientX === lastPositionRef.current.x && clientY === lastPositionRef.current.y) {
      return; // Ignore duplicate coordinate events
    }

    const velocity = calculateScrollVelocity(clientX, currentTime);
    const constrained = applyScrollBoundaries(clientX, clientY);

    // Calculate incremental movement for scroll offset (not total distance from start)
    const incrementalX = constrained.x - lastPositionRef.current.x;
    const incrementalY = constrained.y - lastPositionRef.current.y;

    const newState: DragState = {
      ...dragState,
      currentX: constrained.x,
      currentY: constrained.y,
      // deltaX should accumulate incremental movements for scroll offset
      deltaX: dragState.deltaX + incrementalX,
      deltaY: dragState.deltaY + incrementalY,
      velocity,
      lastMoveTime: currentTime,
    };

    setDragState(newState);
    lastPositionRef.current = { x: constrained.x, y: constrained.y };

    try {
      callbacks?.onDragMove?.(newState);
    } catch (error) {
      console.error('Error in drag move callback:', error);
      // Don't break drag operation for callback errors
    }
  }, [dragState, calculateScrollVelocity, applyScrollBoundaries, callbacks, emergencyMode]);

  // Handle drag end with comprehensive cleanup and state validation
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging) return;

    const finalVelocity = dragState.velocity;
    
    const endState: DragState = {
      ...dragState,
      isDragging: false,
    };

    setDragState(endState);
    
    try {
      callbacks?.onDragEnd?.(endState);
    } catch (error) {
      console.error('Error in drag end callback:', error);
    }

    // Reset deltaX after callback has processed it
    setDragState(prev => ({
      ...prev,
      deltaX: 0,
      deltaY: 0,
    }));

    // Start momentum animation if velocity is sufficient and not in emergency mode
    if (!emergencyMode) {
      startScrollMomentumAnimation(finalVelocity);
    }
  }, [dragState, callbacks, startScrollMomentumAnimation, emergencyMode]);

  // Reset drag state with comprehensive cleanup
  const resetDrag = useCallback(() => {
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = undefined;
    }

    // Clean up performance timer
    if (performanceTimerRef.current) {
      performanceTimerRef.current = undefined;
    }

    // Execute any pending cleanup functions
    eventListenerCleanupRef.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during event listener cleanup:', error);
      }
    });
    eventListenerCleanupRef.current = [];

    setDragState({
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
      momentum: 0,
      lastMoveTime: 0,
    });
    setHasStarted(false);
    setEmergencyMode(false);
    lastPositionRef.current = { x: 0, y: 0 };
    velocityHistoryRef.current = [];
    
    // Reset edge case monitor
    SCROLL_EDGE_MONITOR.reset();
  }, []);

  // Mouse event handlers with error handling
  const onMouseDown = useCallback((event: React.MouseEvent) => {
    try {
      event.preventDefault();
      handleDragStart(event.clientX, event.clientY);
    } catch (error) {
      console.error('Error in mouse down handler:', error);
    }
  }, [handleDragStart]);

  const onMouseMove = useCallback((event: React.MouseEvent) => {
    try {
      if (dragState.isDragging) {
        event.preventDefault();
        handleDragMove(event.clientX, event.clientY);
      }
    } catch (error) {
      console.error('Error in mouse move handler:', error);
    }
  }, [dragState.isDragging, handleDragMove]);

  const onMouseUp = useCallback((event: React.MouseEvent) => {
    try {
      if (dragState.isDragging) {
        event.preventDefault();
        handleDragEnd();
      }
    } catch (error) {
      console.error('Error in mouse up handler:', error);
    }
  }, [dragState.isDragging, handleDragEnd]);

  // Touch event handlers with comprehensive validation and multi-touch handling
  const onTouchStart = useCallback((event: React.TouchEvent) => {
    try {
      // Edge case: Handle multi-touch - only use first touch
      const touch = event.touches[0];
      if (!touch) {
        console.warn('No touch found in touch start event');
        return;
      }

      // Edge case: Validate touch properties exist (some browsers may have incomplete touch objects)
      if (typeof touch.clientX !== 'number' || typeof touch.clientY !== 'number') {
        console.warn('Invalid touch properties in touch start');
        return;
      }

      if (isFinite(touch.clientX) && isFinite(touch.clientY)) {
        // Edge case: Prevent default behavior to stop scrolling on some devices
        event.preventDefault();
        handleDragStart(touch.clientX, touch.clientY);
      } else {
        console.warn('Invalid touch coordinates in touch start');
      }
    } catch (error) {
      console.error('Error in touch start handler:', error);
      activateScrollEmergencyMode();
    }
  }, [handleDragStart, activateScrollEmergencyMode]);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    try {
      if (dragState.isDragging) {
        // Edge case: Prevent default to stop page scrolling during drag
        event.preventDefault();
        
        const touch = event.touches[0];
        if (!touch) {
          console.warn('Lost touch during move, ending drag');
          handleDragEnd();
          return;
        }

        // Edge case: Validate touch properties
        if (typeof touch.clientX !== 'number' || typeof touch.clientY !== 'number') {
          console.warn('Invalid touch properties in touch move');
          return;
        }

        if (isFinite(touch.clientX) && isFinite(touch.clientY)) {
          handleDragMove(touch.clientX, touch.clientY);
        } else {
          console.warn('Invalid touch coordinates in touch move');
        }
      }
    } catch (error) {
      console.error('Error in touch move handler:', error);
      handleDragEnd(); // Safely end drag on error
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    try {
      if (dragState.isDragging) {
        event.preventDefault();
        
        // Edge case: Handle multi-touch scenarios where other touches might still be active
        if (event.touches.length === 0) {
          handleDragEnd();
        } else {
          console.log('Other touches still active, maintaining drag state');
        }
      }
    } catch (error) {
      console.error('Error in touch end handler:', error);
      // Force drag end on error
      setDragState(prev => ({ ...prev, isDragging: false }));
    }
  }, [dragState.isDragging, handleDragEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (momentumAnimationRef.current) {
        cancelAnimationFrame(momentumAnimationRef.current);
      }
    };
  }, []);

  // Global mouse/touch event listeners with advanced error handling and cleanup tracking
  useEffect(() => {
    if (!dragState.isDragging || emergencyMode) return;

    const handleGlobalMouseMove = (event: MouseEvent) => {
      try {
        // Edge case: Validate event object exists
        if (!event) {
          console.warn('Null mouse event received');
          handleDragEnd();
          return;
        }

        // Edge case: Check if event has required properties
        if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
          console.warn('Invalid mouse event properties');
          handleDragEnd();
          return;
        }

        if (isFinite(event.clientX) && isFinite(event.clientY)) {
          handleDragMove(event.clientX, event.clientY);
        }
      } catch (error) {
        console.error('Error in global mouse move:', error);
        // Emergency cleanup on error
        handleDragEnd();
      }
    };

    const handleGlobalMouseUp = () => {
      try {
        handleDragEnd();
      } catch (error) {
        console.error('Error in global mouse up:', error);
        // Force reset on error
        setDragState(prev => ({ ...prev, isDragging: false }));
      }
    };

    const handleGlobalTouchMove = (event: TouchEvent) => {
      try {
        // Edge case: Validate event and touch objects
        if (!event || !event.touches || event.touches.length === 0) {
          console.warn('Invalid touch event or no touches');
          handleDragEnd();
          return;
        }

        const touch = event.touches[0];
        if (!touch || typeof touch.clientX !== 'number' || typeof touch.clientY !== 'number') {
          console.warn('Invalid touch object properties');
          handleDragEnd();
          return;
        }

        if (isFinite(touch.clientX) && isFinite(touch.clientY)) {
          handleDragMove(touch.clientX, touch.clientY);
        }
      } catch (error) {
        console.error('Error in global touch move:', error);
        handleDragEnd();
      }
    };

    const handleGlobalTouchEnd = () => {
      try {
        handleDragEnd();
      } catch (error) {
        console.error('Error in global touch end:', error);
        setDragState(prev => ({ ...prev, isDragging: false }));
      }
    };

    // Edge case: Handle page visibility changes (user switches tabs/minimizes)
    const handleVisibilityChange = () => {
      if (document.hidden && dragState.isDragging) {
        console.log('Page hidden during drag, ending drag operation');
        handleDragEnd();
      }
    };

    // Edge case: Handle focus loss
    const handleBlur = () => {
      if (dragState.isDragging) {
        console.log('Window lost focus during drag, ending drag operation');
        handleDragEnd();
      }
    };

    // Enhanced error boundary for event listener attachment
    const attachListeners = () => {
      try {
        document.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
        document.addEventListener('touchend', handleGlobalTouchEnd);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        // Track cleanup functions
        eventListenerCleanupRef.current = [
          () => document.removeEventListener('mousemove', handleGlobalMouseMove),
          () => document.removeEventListener('mouseup', handleGlobalMouseUp),
          () => document.removeEventListener('touchmove', handleGlobalTouchMove),
          () => document.removeEventListener('touchend', handleGlobalTouchEnd),
          () => document.removeEventListener('visibilitychange', handleVisibilityChange),
          () => window.removeEventListener('blur', handleBlur),
        ];

        return true;
      } catch (error) {
        console.error('Error attaching global event listeners:', error);
        SCROLL_EDGE_MONITOR.reportScrollIssue('animationLeak');
        // Fallback: force end drag state
        setDragState(prev => ({ ...prev, isDragging: false }));
        return false;
      }
    };

    const listenersAttached = attachListeners();

    return () => {
      if (listenersAttached) {
        try {
          eventListenerCleanupRef.current.forEach(cleanup => cleanup());
          eventListenerCleanupRef.current = [];
        } catch (error) {
          console.error('Error removing global event listeners:', error);
          SCROLL_EDGE_MONITOR.reportScrollIssue('animationLeak');
        }
      }
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd, emergencyMode]);

  return {
    dragState,
    dragHandlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    isDragging: dragState.isDragging,
    hasStarted,
    momentum: dragState.momentum,
    resetDrag,
  };
};
