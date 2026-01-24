import * as THREE from 'three';

export interface FlarePoolOptions {
  geometry: THREE.BufferGeometry;
  maxPoolSize: number;
  onCapHit?: (stats: FlarePoolStats) => void;
}

export interface FlarePoolStats {
  available: number;
  inUse: number;
  cap: number;
  capHits: number;
  totalCreated: number;
}

export interface FlareAcquireParams {
  position: THREE.Vector3;
  color: number;
  size: number;
}

export class FlarePool {
  private readonly geometry: THREE.BufferGeometry;
  private readonly maxPoolSize: number;
  private readonly onCapHit?: (stats: FlarePoolStats) => void;

  private pool: THREE.Points[] = [];
  private inUse = 0;
  private capHits = 0;
  private totalCreated = 0;

  constructor(options: FlarePoolOptions) {
    this.geometry = options.geometry;
    this.maxPoolSize = Math.max(1, options.maxPoolSize);
    this.onCapHit = options.onCapHit;
  }

  acquire(params: FlareAcquireParams): THREE.Points | null {
    let points = this.pool.pop();

    if (!points) {
      if (this.totalCreated >= this.maxPoolSize) {
        this.capHits += 1;
        this.onCapHit?.(this.getStats());
        return null;
      }
      points = this.createPoints();
      this.totalCreated += 1;
    }

    this.inUse += 1;
    this.configure(points, params);
    return points;
  }

  release(points: THREE.Points): void {
    this.inUse = Math.max(0, this.inUse - 1);

    if (this.pool.length >= this.maxPoolSize) {
      this.disposePoints(points);
      return;
    }

    const material = points.material as THREE.PointsMaterial;
    material.opacity = 0;
    this.pool.push(points);
  }

  dispose(): void {
    for (const points of this.pool) {
      this.disposePoints(points);
    }
    this.pool.length = 0;
  }

  getStats(): FlarePoolStats {
    return {
      available: this.pool.length,
      inUse: this.inUse,
      cap: this.maxPoolSize,
      capHits: this.capHits,
      totalCreated: this.totalCreated
    };
  }

  private createPoints(): THREE.Points {
    const material = new THREE.PointsMaterial({
      size: 0.4,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    return new THREE.Points(this.geometry, material);
  }

  private configure(points: THREE.Points, params: FlareAcquireParams) {
    points.position.copy(params.position);
    const material = points.material as THREE.PointsMaterial;
    material.color = new THREE.Color(params.color);
    material.size = params.size;
    material.opacity = 1;
    material.needsUpdate = true;
  }

  private disposePoints(points: THREE.Points) {
    const material = points.material as THREE.PointsMaterial;
    material.dispose();
  }
}
