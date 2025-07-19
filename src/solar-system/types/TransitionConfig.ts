// TransitionConfig.ts - Configuration types for scale transitions

export interface TransitionConfig {
  defaultDuration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  enableFadeEffects: boolean;
  interruptible: boolean;
}

export interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  progress: number;
  easedProgress: number;
}

export type EasingFunction = (t: number) => number;

export const EASING_FUNCTIONS: Record<string, EasingFunction> = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - Math.pow(1 - t, 2),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
};
