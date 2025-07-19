// ScaleTransitionEngine.ts - Smooth animation system for scale context transitions

import { ScaleContext, ScaleTransition } from './types/ScaleContext';
import { TransitionConfig, AnimationState, EASING_FUNCTIONS } from './types/TransitionConfig';

export type TransitionProgressCallback = (transition: ScaleTransition & { progress: number; easedProgress: number }) => void;
export type TransitionCompletionCallback = (toContext: ScaleContext, fromContext: ScaleContext) => void;

export class ScaleTransitionEngine {
  private config: TransitionConfig;
  private currentTransition: ScaleTransition | null = null;
  private animationState: AnimationState | null = null;
  private animationFrameId: number | null = null;
  private transitionCallback: TransitionProgressCallback | null = null;
  private completionCallback: TransitionCompletionCallback | null = null;
  private disposed: boolean = false;

  constructor(config: TransitionConfig) {
    this.validateConfig(config);
    this.config = { ...config };
  }

  private validateConfig(config: TransitionConfig): void {
    if (config.defaultDuration <= 0) {
      throw new Error('Duration must be positive');
    }

    if (!EASING_FUNCTIONS[config.easing]) {
      throw new Error('Invalid easing function');
    }
  }

  /**
   * Start a transition between scale contexts
   */
  public startTransition(
    fromContext: ScaleContext,
    toContext: ScaleContext,
    transitionCallback: TransitionProgressCallback,
    completionCallback: TransitionCompletionCallback,
    duration?: number
  ): ScaleTransition | null {
    if (this.disposed) {
      return null;
    }

    // Validate callbacks
    if (!transitionCallback) {
      throw new Error('Transition callback is required');
    }
    if (!completionCallback) {
      throw new Error('Completion callback is required');
    }

    // Don't transition if contexts are the same
    if (fromContext === toContext) {
      return null;
    }

    // Check if we can interrupt current transition
    if (this.isAnimating() && !this.config.interruptible) {
      return null;
    }

    // Stop any existing transition
    this.stopTransition();

    // Create new transition
    const transitionDuration = duration || this.config.defaultDuration;
    const startTime = performance.now();

    this.currentTransition = {
      fromContext,
      toContext,
      duration: transitionDuration,
      startTime,
      progress: 0,
      isActive: true
    };

    this.animationState = {
      isAnimating: true,
      startTime,
      duration: transitionDuration,
      progress: 0,
      easedProgress: 0
    };

    this.transitionCallback = transitionCallback;
    this.completionCallback = completionCallback;

    // Start animation loop
    this.startAnimationLoop();

    return { ...this.currentTransition };
  }

  /**
   * Stop the current transition
   */
  public stopTransition(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.currentTransition = null;
    this.animationState = null;
    this.transitionCallback = null;
    this.completionCallback = null;
  }

  /**
   * Check if a transition is currently active
   */
  public isAnimating(): boolean {
    return this.animationState?.isAnimating ?? false;
  }

  /**
   * Get the current transition
   */
  public getCurrentTransition(): ScaleTransition | null {
    return this.currentTransition ? { ...this.currentTransition } : null;
  }

  /**
   * Get current animation progress (0-1)
   */
  public getProgress(): number {
    return this.animationState?.progress ?? 0;
  }

  /**
   * Get current configuration
   */
  public getConfig(): TransitionConfig {
    return { ...this.config };
  }

  /**
   * Start the animation loop
   */
  private startAnimationLoop(): void {
    const animate = (currentTime: number) => {
      if (this.disposed || !this.currentTransition || !this.animationState) {
        return;
      }

      try {
        // Calculate progress
        const elapsed = currentTime - this.animationState.startTime;
        const rawProgress = Math.min(elapsed / this.animationState.duration, 1);
        
        // Apply easing
        const easingFunction = EASING_FUNCTIONS[this.config.easing];
        const easedProgress = easingFunction(rawProgress);

        // Update animation state
        this.animationState.progress = rawProgress;
        this.animationState.easedProgress = easedProgress;
        this.currentTransition.progress = rawProgress;

        // Call transition callback
        if (this.transitionCallback) {
          this.transitionCallback({
            ...this.currentTransition,
            progress: rawProgress,
            easedProgress
          });
        }

        // Check if animation is complete
        if (rawProgress >= 1) {
          this.completeTransition();
        } else {
          // Continue animation
          this.animationFrameId = requestAnimationFrame(animate);
        }
      } catch (error) {
        console.error('Error in transition animation:', error);
        this.stopTransition();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Complete the current transition
   */
  private completeTransition(): void {
    if (!this.currentTransition || !this.completionCallback) {
      return;
    }

    const fromContext = this.currentTransition.fromContext;
    const toContext = this.currentTransition.toContext;
    const completionCallback = this.completionCallback;

    // Clean up transition state
    this.stopTransition();

    // Call completion callback
    try {
      completionCallback(toContext, fromContext);
    } catch (error) {
      console.error('Error in transition completion callback:', error);
    }
  }

  /**
   * Dispose of the transition engine and clean up resources
   */
  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.stopTransition();
    this.disposed = true;
  }
}
