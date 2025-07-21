/**
 * AttackAnimationManager - Optimized animation system for cyber attacks
 * Handles trajectory calculations, frame management, and performance optimization
 */

import { Vector3, QuadraticBezierCurve3 } from 'three';
import { CyberAttackData, SeverityLevel } from '../../../../types/CyberAttacks';

export interface AnimationFrame {
  position: Vector3;
  progress: number;
  timestamp: number;
  opacity: number;
}

export interface AttackAnimation {
  id: string;
  attack: CyberAttackData;
  curve: QuadraticBezierCurve3;
  startTime: number;
  duration: number;
  frames: AnimationFrame[];
  isActive: boolean;
  lastFrameTime: number;
}

export class AttackAnimationManager {
  private animations = new Map<string, AttackAnimation>();
  private framePool: AnimationFrame[] = [];
  private maxActiveAnimations = 50; // Performance limit
  private frameRate = 60; // Target FPS
  private lastCleanup = 0;
  private cleanupInterval = 5000; // Cleanup every 5 seconds

  constructor(
    private globeRadius: number = 100,
    private animationSpeed: number = 1.0
  ) {
    this.initializeFramePool();
  }

  /**
   * Pre-allocate animation frames for better memory management
   */
  private initializeFramePool(): void {
    const poolSize = this.maxActiveAnimations * 60; // 60 frames per animation max
    for (let i = 0; i < poolSize; i++) {
      this.framePool.push({
        position: new Vector3(),
        progress: 0,
        timestamp: 0,
        opacity: 1
      });
    }
  }

  /**
   * Get a frame from the pool for reuse
   */
  private getPooledFrame(): AnimationFrame {
    return this.framePool.pop() || {
      position: new Vector3(),
      progress: 0,
      timestamp: 0,
      opacity: 1
    };
  }

  /**
   * Return frame to pool for reuse
   */
  private returnFrameToPool(frame: AnimationFrame): void {
    frame.position.set(0, 0, 0);
    frame.progress = 0;
    frame.timestamp = 0;
    frame.opacity = 1;
    this.framePool.push(frame);
  }

  /**
   * Create optimized attack animation with pre-calculated trajectory
   */
  createAttackAnimation(attack: CyberAttackData): AttackAnimation | null {
    // Enforce animation limit for performance
    if (this.animations.size >= this.maxActiveAnimations) {
      this.cleanupOldAnimations();
      if (this.animations.size >= this.maxActiveAnimations) {
        return null; // Skip if still at limit
      }
    }

    const source = this.coordinatesToVector3(
      attack.trajectory.source.latitude,
      attack.trajectory.source.longitude
    );
    
    const target = this.coordinatesToVector3(
      attack.trajectory.target.latitude,
      attack.trajectory.target.longitude
    );

    // Calculate control point for realistic arc
    const controlPoint = this.calculateControlPoint(source, target);
    const curve = new QuadraticBezierCurve3(source, controlPoint, target);

    // Animation duration based on severity and distance
    const distance = source.distanceTo(target);
    const baseDuration = Math.max(2000, distance * 20); // Min 2s, scale with distance
    const severityMultiplier = this.getSeveritySpeedMultiplier(attack.severity);
    const duration = baseDuration / (severityMultiplier * this.animationSpeed);

    const animation: AttackAnimation = {
      id: attack.id,
      attack,
      curve,
      startTime: Date.now(),
      duration,
      frames: [],
      isActive: true,
      lastFrameTime: 0
    };

    // Pre-calculate trajectory frames for smooth animation
    this.precalculateFrames(animation);

    this.animations.set(attack.id, animation);
    return animation;
  }

  /**
   * Pre-calculate animation frames for optimal performance
   */
  private precalculateFrames(animation: AttackAnimation): void {
    const frameCount = Math.min(60, Math.floor(animation.duration / (1000 / this.frameRate)));
    animation.frames = [];

    for (let i = 0; i <= frameCount; i++) {
      const progress = i / frameCount;
      const frame = this.getPooledFrame();
      
      frame.progress = progress;
      frame.timestamp = animation.startTime + (progress * animation.duration);
      frame.position.copy(animation.curve.getPoint(progress));
      frame.opacity = this.calculateFrameOpacity(progress);

      animation.frames.push(frame);
    }
  }

  /**
   * Calculate frame opacity for fade effects
   */
  private calculateFrameOpacity(progress: number): number {
    // Fade in quickly, fade out slowly
    if (progress < 0.1) {
      return progress * 10; // Fade in over first 10%
    } else if (progress > 0.8) {
      return (1 - progress) * 5; // Fade out over last 20%
    }
    return 1.0;
  }

  /**
   * Convert lat/lng to 3D coordinates on globe
   */
  private coordinatesToVector3(lat: number, lng: number): Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(this.globeRadius * Math.sin(phi) * Math.cos(theta));
    const z = this.globeRadius * Math.sin(phi) * Math.sin(theta);
    const y = this.globeRadius * Math.cos(phi);

    return new Vector3(x, y, z);
  }

  /**
   * Calculate realistic arc control point
   */
  private calculateControlPoint(source: Vector3, target: Vector3): Vector3 {
    const midpoint = new Vector3().addVectors(source, target).multiplyScalar(0.5);
    const distance = source.distanceTo(target);
    
    // Height of arc based on distance
    const arcHeight = Math.min(this.globeRadius * 0.3, distance * 0.4);
    
    // Normalize and extend outward from globe center
    const controlPoint = midpoint.normalize().multiplyScalar(this.globeRadius + arcHeight);
    
    return controlPoint;
  }

  /**
   * Get speed multiplier based on attack severity
   */
  private getSeveritySpeedMultiplier(severity: SeverityLevel): number {
    switch (severity) {
      case 5: return 2.0; // Critical - Fastest
      case 4: return 1.5; // High
      case 3: return 1.0; // Medium
      case 2: return 0.7; // Low
      case 1: return 0.5; // Info - Slowest
      default: return 1.0;
    }
  }

  /**
   * Update all active animations - called every frame
   */
  updateAnimations(currentTime: number): Map<string, AnimationFrame> {
    const activeFrames = new Map<string, AnimationFrame>();
    const now = Date.now();

    // Periodic cleanup
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.cleanupOldAnimations();
      this.lastCleanup = now;
    }

    for (const [id, animation] of this.animations) {
      if (!animation.isActive) continue;

      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1.0);

      if (progress >= 1.0) {
        // Animation complete
        animation.isActive = false;
        continue;
      }

      // Find the appropriate pre-calculated frame
      const frameIndex = Math.floor(progress * (animation.frames.length - 1));
      const frame = animation.frames[frameIndex];

      if (frame) {
        activeFrames.set(id, frame);
      }
    }

    return activeFrames;
  }

  /**
   * Clean up completed animations and return frames to pool
   */
  private cleanupOldAnimations(): void {
    const toRemove: string[] = [];

    for (const [id, animation] of this.animations) {
      if (!animation.isActive) {
        // Return frames to pool
        animation.frames.forEach(frame => this.returnFrameToPool(frame));
        animation.frames = [];
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => this.animations.delete(id));
  }

  /**
   * Remove specific animation
   */
  removeAnimation(attackId: string): void {
    const animation = this.animations.get(attackId);
    if (animation) {
      animation.isActive = false;
      animation.frames.forEach(frame => this.returnFrameToPool(frame));
      this.animations.delete(attackId);
    }
  }

  /**
   * Update animation speed
   */
  setAnimationSpeed(speed: number): void {
    this.animationSpeed = Math.max(0.1, Math.min(5.0, speed));
    
    // Update existing animations
    for (const animation of this.animations.values()) {
      if (animation.isActive) {
        const remaining = 1.0 - ((Date.now() - animation.startTime) / animation.duration);
        animation.duration = animation.duration * (1 / speed) * remaining;
      }
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    activeAnimations: number;
    pooledFrames: number;
    memoryUsage: number;
  } {
    const activeCount = Array.from(this.animations.values())
      .filter(a => a.isActive).length;

    return {
      activeAnimations: activeCount,
      pooledFrames: this.framePool.length,
      memoryUsage: this.animations.size * 1024 // Rough estimate in bytes
    };
  }

  /**
   * Clear all animations
   */
  clear(): void {
    for (const animation of this.animations.values()) {
      animation.frames.forEach(frame => this.returnFrameToPool(frame));
    }
    this.animations.clear();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clear();
    this.framePool.length = 0;
  }
}
