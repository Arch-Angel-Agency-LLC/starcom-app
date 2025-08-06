// src/core/AnimationEngine.ts
// FUNDAMENTAL PARADIGM SHIFT: Animations outside React

import { useEffect } from 'react';

export interface AnimationCallback {
  id: string;
  callback: (deltaTime: number) => void;
  priority: number; // 0 = highest priority
}

export class AnimationEngine {
  private static instance: AnimationEngine;
  private animations = new Map<string, AnimationCallback>();
  private isRunning = false;
  private lastTime = 0;
  private frameId?: number;

  static getInstance(): AnimationEngine {
    if (!AnimationEngine.instance) {
      AnimationEngine.instance = new AnimationEngine();
    }
    return AnimationEngine.instance;
  }

  register(animation: AnimationCallback): void {
    this.animations.set(animation.id, animation);
    if (!this.isRunning) {
      this.start();
    }
  }

  unregister(id: string): void {
    this.animations.delete(id);
    if (this.animations.size === 0) {
      this.stop();
    }
  }

  private start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  private stop(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
    this.isRunning = false;
  }

  private loop = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Sort by priority and execute
    const sortedAnimations = Array.from(this.animations.values())
      .sort((a, b) => a.priority - b.priority);

    for (const animation of sortedAnimations) {
      try {
        animation.callback(deltaTime);
      } catch (error) {
        console.error(`Animation ${animation.id} failed:`, error);
      }
    }

    this.frameId = requestAnimationFrame(this.loop);
  };
}

// Hook for React integration
export const useAnimation = (
  id: string,
  callback: (deltaTime: number) => void,
  priority = 10
) => {
  useEffect(() => {
    const engine = AnimationEngine.getInstance();
    engine.register({ id, callback, priority });

    return () => {
      engine.unregister(id);
    };
  }, [id, callback, priority]);
};
