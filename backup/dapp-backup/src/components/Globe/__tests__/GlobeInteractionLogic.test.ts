/**
 * Automated Globe Interaction Tests
 * 
 * These tests programmatically verify the drag/click detection logic
 * without requiring complex Three.js mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// The exact drag/click detection logic from useIntel3DInteraction.ts
interface InteractionState {
  isMouseDown: boolean;
  mouseDownPos: { x: number; y: number };
  currentMousePos: { x: number; y: number };
  mouseDownTime: number;
  isDragging: boolean;
  hasDraggedPastThreshold: boolean;
  dragDistance: number;
}

interface InteractionConfig {
  dragThreshold: number;
  timeThreshold: number;
}

// This is the core logic extracted from useIntel3DInteraction.ts
function detectInteractionType(
  state: InteractionState,
  config: InteractionConfig
): 'click' | 'drag' | 'pending' {
  if (!state.isMouseDown) {
    // Mouse up - determine final result
    const timeSinceMouseDown = Date.now() - state.mouseDownTime;
    const wasClick = !state.hasDraggedPastThreshold && 
                     timeSinceMouseDown < config.timeThreshold;
    return wasClick ? 'click' : 'drag';
  }
  
  // Mouse still down - check if we've moved past threshold
  if (state.dragDistance > config.dragThreshold) {
    return 'drag';
  }
  
  return 'pending';
}

function calculateDragDistance(startPos: { x: number; y: number }, currentPos: { x: number; y: number }): number {
  return Math.sqrt(
    Math.pow(currentPos.x - startPos.x, 2) + 
    Math.pow(currentPos.y - startPos.y, 2)
  );
}

function updateInteractionState(
  state: InteractionState,
  event: 'mousedown' | 'mousemove' | 'mouseup',
  position: { x: number; y: number },
  config: InteractionConfig
): InteractionState {
  const now = Date.now();
  
  switch (event) {
    case 'mousedown':
      return {
        isMouseDown: true,
        mouseDownPos: position,
        currentMousePos: position,
        mouseDownTime: now,
        isDragging: false,
        hasDraggedPastThreshold: false,
        dragDistance: 0
      };
    
    case 'mousemove': {
      if (!state.isMouseDown) return state;
      
      const dragDistance = calculateDragDistance(state.mouseDownPos, position);
      const isDragging = dragDistance > config.dragThreshold;
      const hasDraggedPastThreshold = state.hasDraggedPastThreshold || isDragging;
      
      return {
        ...state,
        currentMousePos: position,
        dragDistance,
        isDragging,
        hasDraggedPastThreshold
      };
    }
    
    case 'mouseup': {
      return {
        ...state,
        isMouseDown: false,
        currentMousePos: position
      };
    }
    
    default:
      return state;
  }
}

describe('Globe Interaction Drag/Click Detection Logic', () => {
  let config: InteractionConfig;
  let state: InteractionState;

  beforeEach(() => {
    config = {
      dragThreshold: 5,
      timeThreshold: 300
    };
    
    state = {
      isMouseDown: false,
      mouseDownPos: { x: 0, y: 0 },
      currentMousePos: { x: 0, y: 0 },
      mouseDownTime: 0,
      isDragging: false,
      hasDraggedPastThreshold: false,
      dragDistance: 0
    };
  });

  describe('Click Detection (Critical UX Test)', () => {
    it('should detect a quick click with minimal movement', () => {
      // Simulate mouse down
      state = updateInteractionState(state, 'mousedown', { x: 100, y: 100 }, config);
      expect(state.isMouseDown).toBe(true);
      expect(state.mouseDownTime).toBeGreaterThan(0);
      
      // Minimal movement (within threshold)
      state = updateInteractionState(state, 'mousemove', { x: 102, y: 101 }, config);
      expect(state.dragDistance).toBeLessThan(config.dragThreshold);
      expect(state.hasDraggedPastThreshold).toBe(false);
      
      // Quick mouse up (within time threshold)
      const quickDelay = 100; // Less than 300ms
      vi.setSystemTime(state.mouseDownTime + quickDelay);
      state = updateInteractionState(state, 'mouseup', { x: 102, y: 101 }, config);
      
      const result = detectInteractionType(state, config);
      expect(result).toBe('click');
    });

    it('should detect click with no movement at all', () => {
      const startPos = { x: 100, y: 100 };
      
      state = updateInteractionState(state, 'mousedown', startPos, config);
      
      // No movement - mouse up at exact same position
      const quickDelay = 150;
      vi.setSystemTime(state.mouseDownTime + quickDelay);
      state = updateInteractionState(state, 'mouseup', startPos, config);
      
      const result = detectInteractionType(state, config);
      expect(result).toBe('click');
    });
  });

  describe('Drag Detection (Prevents Accidental Reports)', () => {
    it('should detect drag when movement exceeds threshold', () => {
      state = updateInteractionState(state, 'mousedown', { x: 100, y: 100 }, config);
      
      // Move beyond drag threshold
      const farPosition = { x: 110, y: 110 }; // ~14px distance
      state = updateInteractionState(state, 'mousemove', farPosition, config);
      
      expect(state.dragDistance).toBeGreaterThan(config.dragThreshold);
      expect(state.hasDraggedPastThreshold).toBe(true);
      
      // Even quick mouse up should be drag due to distance
      const quickDelay = 100;
      vi.setSystemTime(state.mouseDownTime + quickDelay);
      state = updateInteractionState(state, 'mouseup', farPosition, config);
      
      const result = detectInteractionType(state, config);
      expect(result).toBe('drag');
    });

    it('should detect drag when time exceeds threshold', () => {
      const position = { x: 100, y: 100 };
      
      state = updateInteractionState(state, 'mousedown', position, config);
      
      // No movement but long time
      const longDelay = 500; // More than 300ms
      vi.setSystemTime(state.mouseDownTime + longDelay);
      state = updateInteractionState(state, 'mouseup', position, config);
      
      const result = detectInteractionType(state, config);
      expect(result).toBe('drag');
    });

    it('should detect drag on complex movement pattern', () => {
      state = updateInteractionState(state, 'mousedown', { x: 100, y: 100 }, config);
      
      // Simulate circular mouse movement (like rotating globe)
      const movements = [
        { x: 105, y: 100 },
        { x: 108, y: 103 },
        { x: 110, y: 107 },
        { x: 108, y: 112 },
        { x: 105, y: 115 }
      ];
      
      movements.forEach(pos => {
        state = updateInteractionState(state, 'mousemove', pos, config);
      });
      
      expect(state.hasDraggedPastThreshold).toBe(true);
      
      state = updateInteractionState(state, 'mouseup', { x: 105, y: 115 }, config);
      const result = detectInteractionType(state, config);
      expect(result).toBe('drag');
    });
  });

  describe('Edge Cases', () => {
    it('should handle exact threshold values', () => {
      state = updateInteractionState(state, 'mousedown', { x: 100, y: 100 }, config);
      
      // Move exactly to threshold (5px)
      state = updateInteractionState(state, 'mousemove', { x: 105, y: 100 }, config);
      expect(state.dragDistance).toBe(5);
      expect(state.hasDraggedPastThreshold).toBe(false); // Should be <= threshold
      
      // One more pixel should trigger drag
      state = updateInteractionState(state, 'mousemove', { x: 106, y: 100 }, config);
      expect(state.hasDraggedPastThreshold).toBe(true);
    });

    it('should handle rapid click sequences', () => {
      // First click
      state = updateInteractionState(state, 'mousedown', { x: 100, y: 100 }, config);
      vi.setSystemTime(state.mouseDownTime + 50);
      state = updateInteractionState(state, 'mouseup', { x: 100, y: 100 }, config);
      
      expect(detectInteractionType(state, config)).toBe('click');
      
      // Second click immediately after
      state = updateInteractionState(state, 'mousedown', { x: 100, y: 100 }, config);
      vi.setSystemTime(state.mouseDownTime + 50);
      state = updateInteractionState(state, 'mouseup', { x: 100, y: 100 }, config);
      
      expect(detectInteractionType(state, config)).toBe('click');
    });

    it('should handle interrupted interactions', () => {
      state = updateInteractionState(state, 'mousedown', { x: 100, y: 100 }, config);
      state = updateInteractionState(state, 'mousemove', { x: 110, y: 110 }, config);
      
      // Simulate mouse leaving area (equivalent to mouseup/cancel)
      state = updateInteractionState(state, 'mouseup', { x: 110, y: 110 }, config);
      
      expect(detectInteractionType(state, config)).toBe('drag');
    });
  });

  describe('Configuration Flexibility', () => {
    it('should respect custom drag threshold', () => {
      const customConfig = { ...config, dragThreshold: 10 };
      
      state = updateInteractionState(state, 'mousedown', { x: 100, y: 100 }, customConfig);
      state = updateInteractionState(state, 'mousemove', { x: 107, y: 107 }, customConfig);
      
      // ~10px movement - should still be within threshold
      expect(state.dragDistance).toBeLessThanOrEqual(customConfig.dragThreshold);
      expect(state.hasDraggedPastThreshold).toBe(false);
      
      vi.setSystemTime(state.mouseDownTime + 100);
      state = updateInteractionState(state, 'mouseup', { x: 107, y: 107 }, customConfig);
      
      expect(detectInteractionType(state, customConfig)).toBe('click');
    });

    it('should respect custom time threshold', () => {
      const customConfig = { ...config, timeThreshold: 500 };
      
      state = updateInteractionState(state, 'mousedown', { x: 100, y: 100 }, customConfig);
      
      // 400ms delay - should still be within threshold
      const delay = 400;
      vi.setSystemTime(state.mouseDownTime + delay);
      state = updateInteractionState(state, 'mouseup', { x: 100, y: 100 }, customConfig);
      
      expect(detectInteractionType(state, customConfig)).toBe('click');
    });
  });

  describe('Performance and State Management', () => {
    it('should maintain consistent state through multiple events', () => {
      const events = [
        { type: 'mousedown' as const, pos: { x: 100, y: 100 } },
        { type: 'mousemove' as const, pos: { x: 101, y: 101 } },
        { type: 'mousemove' as const, pos: { x: 102, y: 102 } },
        { type: 'mousemove' as const, pos: { x: 103, y: 103 } },
        { type: 'mouseup' as const, pos: { x: 103, y: 103 } }
      ];
      
      events.forEach(event => {
        state = updateInteractionState(state, event.type, event.pos, config);
        
        // State should always be consistent
        expect(state.dragDistance).toBeGreaterThanOrEqual(0);
        expect(state.currentMousePos).toEqual(event.pos);
      });
    });

    it('should calculate drag distance accurately', () => {
      const testCases = [
        { start: { x: 0, y: 0 }, end: { x: 3, y: 4 }, expected: 5 },
        { start: { x: 100, y: 100 }, end: { x: 100, y: 100 }, expected: 0 },
        { start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, expected: 10 },
        { start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, expected: 10 }
      ];
      
      testCases.forEach(({ start, end, expected }) => {
        const distance = calculateDragDistance(start, end);
        expect(distance).toBeCloseTo(expected, 1);
      });
    });
  });
});
