// Planet.ts - Individual planet implementation

import * as THREE from 'three';
import { PlanetInstance, PlanetarySystemConfig, OrbitalElements, PlanetaryState } from '../types/PlanetaryTypes';

export class Planet {
  private scene: THREE.Scene;
  private planetData: PlanetInstance;
  private mesh: THREE.Mesh | null = null;
  private atmosphereMesh: THREE.Mesh | null = null;
  private orbitalPath: THREE.Line | null = null;
  private orbitalGroup: THREE.Group = new THREE.Group();
  
  // State tracking
  private state: PlanetaryState;
  private initialized: boolean = false;
  private disposed: boolean = false;
  
  // Orbital mechanics
  private orbitalElements: OrbitalElements;
  private currentPhase: number = 0; // 0-1 around orbit

  constructor(scene: THREE.Scene, planetData: PlanetInstance) {
    this.scene = scene;
    this.planetData = planetData;
    
    // Initialize state
    this.state = {
      name: planetData.name,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      isVisible: false,
      currentPhase: 0,
      distanceFromSun: planetData.orbitRadius,
      illuminationAngle: 0
    };

    // Initialize simplified orbital elements
    this.orbitalElements = this.createSimplifiedOrbitalElements(planetData);
    
    this.initialize();
  }

  private createSimplifiedOrbitalElements(data: PlanetInstance): OrbitalElements {
    // Simplified orbital elements for visualization
    return {
      semiMajorAxis: data.orbitRadius,
      eccentricity: 0.02, // Slightly elliptical for realism
      inclination: 0, // Simplified to ecliptic plane
      longitudeAscendingNode: 0,
      argumentPeriapsis: 0,
      meanAnomalyEpoch: Math.random() * 360, // Random starting position
      epoch: new Date('2025-01-01T00:00:00Z')
    };
  }

  private initialize(): void {
    if (this.disposed) {
      throw new Error(`Cannot initialize disposed planet: ${this.planetData.name}`);
    }

    this.createPlanetMesh();
    this.createOrbitalPath();
    this.scene.add(this.orbitalGroup);
    
    this.initialized = true;
  }

  private createPlanetMesh(): void {
    // Create planet geometry (scaled for visualization)
    const visualRadius = this.getVisualRadius();
    const geometry = new THREE.SphereGeometry(visualRadius, 32, 32);
    
    // Create basic material
    const material = new THREE.MeshLambertMaterial({
      color: this.planetData.color,
      transparent: false
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.visible = false;
    this.orbitalGroup.add(this.mesh);

    // Create atmosphere if planet has one
    if (this.planetData.hasAtmosphere) {
      this.createAtmosphere(visualRadius);
    }
  }

  private createAtmosphere(planetRadius: number): void {
    const atmosphereRadius = planetRadius * 1.1;
    const geometry = new THREE.SphereGeometry(atmosphereRadius, 32, 32);
    
    const material = new THREE.MeshBasicMaterial({
      color: this.getAtmosphereColor(),
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });

    this.atmosphereMesh = new THREE.Mesh(geometry, material);
    this.atmosphereMesh.visible = false;
    this.orbitalGroup.add(this.atmosphereMesh);
  }

  private getAtmosphereColor(): number {
    switch (this.planetData.name) {
      case 'venus': return 0xffcc00; // Yellowish
      case 'earth': return 0x87ceeb; // Sky blue
      case 'mars': return 0xcd853f; // Rusty
      default: return 0xffffff; // White
    }
  }

  private createOrbitalPath(): void {
    const points: THREE.Vector3[] = [];
    const segments = 64;
    const radius = this.orbitalElements.semiMajorAxis * 149597870.7; // Convert AU to km, then scale

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius * 0.001; // Scale down for visualization
      const z = Math.sin(angle) * radius * 0.001;
      points.push(new THREE.Vector3(x, 0, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: this.planetData.color,
      transparent: true,
      opacity: 0.3
    });

    this.orbitalPath = new THREE.Line(geometry, material);
    this.orbitalPath.visible = false;
    this.scene.add(this.orbitalPath);
  }

  private getVisualRadius(): number {
    // Scale planet radius for visualization (not to scale with orbits)
    const baseScale = 50; // Base scale factor
    return (this.planetData.radius / 6371) * baseScale; // Relative to Earth
  }

  /**
   * Update orbital position based on current time
   */
  public updateOrbitalPosition(currentTime: Date): void {
    if (this.disposed || !this.mesh) return;

    // Calculate days since epoch
    const epochTime = this.orbitalElements.epoch.getTime();
    const currentTimeMs = currentTime.getTime();
    const daysSinceEpoch = (currentTimeMs - epochTime) / (1000 * 60 * 60 * 24);

    // Calculate mean motion (degrees per day)
    const meanMotion = 360 / this.planetData.orbitPeriod;
    
    // Calculate current mean anomaly
    const meanAnomaly = (this.orbitalElements.meanAnomalyEpoch + meanMotion * daysSinceEpoch) % 360;
    this.currentPhase = meanAnomaly / 360;

    // Calculate position (simplified circular orbit)
    const angle = (meanAnomaly * Math.PI) / 180;
    const distance = this.orbitalElements.semiMajorAxis * 1000; // Scale for visualization
    
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    this.state.position.set(x, 0, z);
    this.state.distanceFromSun = Math.sqrt(x * x + z * z) / 1000; // Back to AU

    // Update mesh position
    this.mesh.position.copy(this.state.position);
    if (this.atmosphereMesh) {
      this.atmosphereMesh.position.copy(this.state.position);
    }
  }

  /**
   * Set planet visibility
   */
  public setVisible(visible: boolean): void {
    this.state.isVisible = visible;
    
    if (this.mesh) {
      this.mesh.visible = visible;
    }
    
    if (this.atmosphereMesh) {
      this.atmosphereMesh.visible = visible && this.planetData.hasAtmosphere;
    }
  }

  /**
   * Set orbital path visibility
   */
  public setOrbitalPathVisible(visible: boolean): void {
    if (this.orbitalPath) {
      this.orbitalPath.visible = visible;
    }
  }

  /**
   * Get orbital path visibility status
   */
  public isOrbitalPathVisible(): boolean {
    return this.orbitalPath ? this.orbitalPath.visible : false;
  }

  /**
   * Check if planet is visible
   */
  public isVisible(): boolean {
    return this.state.isVisible;
  }

  /**
   * Get planet name
   */
  public getName(): string {
    return this.planetData.name;
  }

  /**
   * Get current position
   */
  public getPosition(): THREE.Vector3 {
    return this.state.position.clone();
  }

  /**
   * Get current state
   */
  public getCurrentState(): PlanetaryState {
    return { ...this.state };
  }

  /**
   * Get initialization status
   */
  public isInitialized(): boolean {
    return this.initialized && !this.disposed;
  }

  /**
   * Apply performance configuration
   */
  public applyPerformanceConfig(config: Required<PlanetarySystemConfig>): void {
    if (this.disposed) return;

    // Adjust atmosphere visibility based on performance mode
    if (this.atmosphereMesh) {
      this.atmosphereMesh.visible = config.enableAtmospheres && this.state.isVisible;
    }

    // Update orbital path segments if needed
    if (this.orbitalPath && config.orbitalPathSegments !== 64) {
      this.updateOrbitalPathSegments(config.orbitalPathSegments);
    }
  }

  private updateOrbitalPathSegments(segments: number): void {
    if (!this.orbitalPath) return;

    // Recreate orbital path with new segment count
    this.scene.remove(this.orbitalPath);
    this.orbitalPath.geometry.dispose();
    
    const points: THREE.Vector3[] = [];
    const radius = this.orbitalElements.semiMajorAxis * 149597870.7; // Convert AU to km, then scale

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius * 0.001; // Scale down for visualization
      const z = Math.sin(angle) * radius * 0.001;
      points.push(new THREE.Vector3(x, 0, z));
    }

    this.orbitalPath.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.scene.add(this.orbitalPath);
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    if (this.disposed) return;

    // Remove from scene
    this.scene.remove(this.orbitalGroup);
    
    if (this.orbitalPath) {
      this.scene.remove(this.orbitalPath);
      this.orbitalPath.geometry.dispose();
      if (this.orbitalPath.material instanceof THREE.Material) {
        this.orbitalPath.material.dispose();
      }
    }

    // Dispose geometries and materials
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
    }

    if (this.atmosphereMesh) {
      this.atmosphereMesh.geometry.dispose();
      if (this.atmosphereMesh.material instanceof THREE.Material) {
        this.atmosphereMesh.material.dispose();
      }
    }

    this.disposed = true;
    this.initialized = false;
  }
}
