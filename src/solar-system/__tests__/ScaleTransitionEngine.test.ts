import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScaleTransitionEngine } from '../ScaleTransitionEngine';
import { ScaleContext } from '../types/ScaleContext';
import type { TransitionConfig } from '../types/TransitionConfig';

describe('ScaleTransitionEngine', () => {
  let transitionEngine: ScaleTransitionEngine;
  let mockTransitionCallback: ReturnType<typeof vi.fn>;
  let mockCompletionCallback: ReturnType<typeof vi.fn>;
  let animationFrameCallbacks: Array<(time: number) => void> = [];
  let animationFrameId = 1;

  const defaultConfig: TransitionConfig = {
    defaultDuration: 500,
    easing: 'ease-in-out',
    enableFadeEffects: true,
    interruptible: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    animationFrameCallbacks.length = 0;
    animationFrameId = 1;
    mockTransitionCallback = vi.fn();
    mockCompletionCallback = vi.fn();
    
    // Mock requestAnimationFrame to store callbacks for manual execution
    global.requestAnimationFrame = vi.fn((callback: (time: number) => void) => {
      animationFrameCallbacks.push(callback);
      return animationFrameId++;
    });
    
    global.cancelAnimationFrame = vi.fn();
    
    transitionEngine = new ScaleTransitionEngine(defaultConfig);
  });

  afterEach(() => {
    if (transitionEngine) {
      transitionEngine.dispose();
    }
    vi.restoreAllMocks();
  });

  // Helper function to execute animation frames until completion
  const executeAnimationFrames = (maxFrames = 100) => {
    const startTime = performance.now();
    let currentTime = startTime;
    let frameCount = 0;
    
    while (animationFrameCallbacks.length > 0 && frameCount < maxFrames && transitionEngine.isAnimating()) {
      const callback = animationFrameCallbacks.shift();
      if (callback) {
        currentTime += 16; // Simulate 60fps
        callback(currentTime);
        frameCount++;
      }
    }
  };

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(transitionEngine.isAnimating()).toBe(false);
      expect(transitionEngine.getCurrentTransition()).toBeNull();
      expect(transitionEngine.getProgress()).toBe(0);
    });

    test('should accept custom configuration', () => {
      const customConfig: TransitionConfig = {
        defaultDuration: 1000,
        easing: 'ease-in',
        enableFadeEffects: false,
        interruptible: false
      };

      const customEngine = new ScaleTransitionEngine(customConfig);
      expect(customEngine.isAnimating()).toBe(false);
      
      customEngine.dispose();
    });

    test('should throw error for invalid configuration', () => {
      expect(() => {
        new ScaleTransitionEngine({
          defaultDuration: -100,
          easing: 'ease-in-out',
          enableFadeEffects: true,
          interruptible: true
        });
      }).toThrow('Duration must be positive');

      expect(() => {
        new ScaleTransitionEngine({
          defaultDuration: 500,
          easing: 'invalid-easing' as any,
          enableFadeEffects: true,
          interruptible: true
        });
      }).toThrow('Invalid easing function');
    });
  });

  describe('Basic Transitions', () => {
    test('should start a transition between scale contexts', () => {
      const transition = transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      expect(transition).toBeDefined();
      expect(transition).not.toBeNull();
      expect(transition!.fromContext).toBe(ScaleContext.EARTH_LOCAL);
      expect(transition!.toContext).toBe(ScaleContext.EARTH_SPACE);
      expect(transition!.duration).toBe(500);
      expect(transitionEngine.isAnimating()).toBe(true);
      
      // Execute animation frames to complete transition
      executeAnimationFrames();
      
      expect(mockCompletionCallback).toHaveBeenCalledWith(ScaleContext.EARTH_SPACE, ScaleContext.EARTH_LOCAL);
      expect(transitionEngine.isAnimating()).toBe(false);
    });

    test('should use custom duration when provided', () => {
      const customDuration = 1000;
      const transition = transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback,
        customDuration
      );

      expect(transition).not.toBeNull();
      expect(transition!.duration).toBe(customDuration);
      
      // Execute animation frames with custom duration timing
      executeAnimationFrames();
      
      expect(mockCompletionCallback).toHaveBeenCalledWith(ScaleContext.EARTH_SPACE, ScaleContext.EARTH_LOCAL);
    });

    test('should not start transition if from and to contexts are the same', () => {
      const transition = transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_LOCAL,
        mockTransitionCallback,
        mockCompletionCallback
      );

      expect(transition).toBeNull();
      expect(transitionEngine.isAnimating()).toBe(false);
      expect(mockTransitionCallback).not.toHaveBeenCalled();
    });

    test('should complete transition and call completion callback', () => {
      transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      // Execute all animation frames to completion
      executeAnimationFrames();

      expect(mockCompletionCallback).toHaveBeenCalledWith(ScaleContext.EARTH_SPACE, ScaleContext.EARTH_LOCAL);
      expect(transitionEngine.isAnimating()).toBe(false);
      expect(transitionEngine.getCurrentTransition()).toBeNull();
    });

    test('should call transition callback during animation', () => {
      transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      // Execute a few animation frames
      for (let i = 0; i < 5 && animationFrameCallbacks.length > 0; i++) {
        const callback = animationFrameCallbacks.shift();
        if (callback) {
          callback(performance.now() + i * 16);
        }
      }

      expect(mockTransitionCallback).toHaveBeenCalled();
      expect(mockTransitionCallback.mock.calls.length).toBeGreaterThan(0);
    });

    test('should handle multiple different scale transitions', () => {
      const transitions = [
        [ScaleContext.EARTH_LOCAL, ScaleContext.EARTH_SPACE],
        [ScaleContext.EARTH_SPACE, ScaleContext.INNER_SOLAR],
        [ScaleContext.INNER_SOLAR, ScaleContext.SOLAR_SYSTEM]
      ];

      transitions.forEach(([from, to]) => {
        const callback = vi.fn();
        const completion = vi.fn();
        
        const transition = transitionEngine.startTransition(from, to, callback, completion);
        expect(transition).toBeDefined();
        expect(transition!.fromContext).toBe(from);
        expect(transition!.toContext).toBe(to);
        
        executeAnimationFrames();
        expect(completion).toHaveBeenCalledWith(to, from);
      });
    });
  });

  describe('Transition Interruption', () => {
    test('should allow interrupting transitions when interruptible', () => {
      // Start first transition
      transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      expect(transitionEngine.isAnimating()).toBe(true);

      // Start second transition (should interrupt first)
      const newCallback = vi.fn();
      const newCompletion = vi.fn();
      
      const transition = transitionEngine.startTransition(
        ScaleContext.EARTH_SPACE,
        ScaleContext.INNER_SOLAR,
        newCallback,
        newCompletion
      );

      expect(transition).toBeDefined();
      expect(transition!.fromContext).toBe(ScaleContext.EARTH_SPACE);
      expect(transition!.toContext).toBe(ScaleContext.INNER_SOLAR);
      
      // Execute animation frames for the new transition
      executeAnimationFrames();
      
      expect(newCompletion).toHaveBeenCalledWith(ScaleContext.INNER_SOLAR, ScaleContext.EARTH_SPACE);
    });

    test('should not interrupt when interruptible is false', () => {
      const nonInterruptibleEngine = new ScaleTransitionEngine({
        ...defaultConfig,
        interruptible: false
      });

      // Start first transition
      nonInterruptibleEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      // Try to start second transition
      const transition = nonInterruptibleEngine.startTransition(
        ScaleContext.EARTH_SPACE,
        ScaleContext.INNER_SOLAR,
        vi.fn(),
        vi.fn()
      );

      expect(transition).toBeNull(); // Should not allow interruption
      
      nonInterruptibleEngine.dispose();
    });
  });

  describe('Manual Control', () => {
    test('should manually stop transition', () => {
      transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      expect(transitionEngine.isAnimating()).toBe(true);
      
      transitionEngine.stopTransition();
      
      expect(transitionEngine.isAnimating()).toBe(false);
      expect(transitionEngine.getCurrentTransition()).toBeNull();
    });

    test('should handle stop when no transition is active', () => {
      expect(transitionEngine.isAnimating()).toBe(false);
      
      // Should not throw error
      transitionEngine.stopTransition();
      
      expect(transitionEngine.isAnimating()).toBe(false);
    });
  });

  describe('State Management', () => {
    test('should track animation state correctly', () => {
      expect(transitionEngine.isAnimating()).toBe(false);
      
      transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      expect(transitionEngine.isAnimating()).toBe(true);
      const currentTransition = transitionEngine.getCurrentTransition();
      expect(currentTransition).toBeDefined();
      expect(currentTransition!.fromContext).toBe(ScaleContext.EARTH_LOCAL);
      expect(currentTransition!.toContext).toBe(ScaleContext.EARTH_SPACE);
    });

    test('should return correct progress during transition', () => {
      transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      const progress = transitionEngine.getProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    test('should handle getCurrentTransition when no transition is active', () => {
      const transition = transitionEngine.getCurrentTransition();
      expect(transition).toBeNull();
    });

    test('should handle getProgress when no transition is active', () => {
      const progress = transitionEngine.getProgress();
      expect(progress).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid scale contexts gracefully', () => {
      // This would be caught by TypeScript, but testing runtime behavior
      const invalidFrom = 'invalid' as any;
      const transition = transitionEngine.startTransition(
        invalidFrom,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      // Currently the implementation allows invalid contexts
      // In the future, we might want to add validation
      expect(transition).toBeDefined();
      expect(transition!.fromContext).toBe('invalid');
    });

    test('should handle null callbacks', () => {
      expect(() => {
        transitionEngine.startTransition(
          ScaleContext.EARTH_LOCAL,
          ScaleContext.EARTH_SPACE,
          null as any,
          null as any
        );
      }).toThrow('Transition callback is required');
    });
  });

  describe('Resource Management', () => {
    test('should dispose properly', () => {
      transitionEngine.startTransition(
        ScaleContext.EARTH_LOCAL,
        ScaleContext.EARTH_SPACE,
        mockTransitionCallback,
        mockCompletionCallback
      );

      expect(transitionEngine.isAnimating()).toBe(true);
      
      transitionEngine.dispose();
      
      expect(transitionEngine.isAnimating()).toBe(false);
      expect(transitionEngine.getCurrentTransition()).toBeNull();
    });

    test('should handle multiple dispose calls', () => {
      transitionEngine.dispose();
      transitionEngine.dispose(); // Should not throw
      
      expect(transitionEngine.isAnimating()).toBe(false);
    });
  });
});
