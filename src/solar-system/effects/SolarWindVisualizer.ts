import * as THREE from 'three';

export interface SolarWindConfig {
  particleCount: number;
  windSpeed: number;           // km/s
  particleDensity: number;     // protons/cm³
  streamDistance: number;      // Distance particles travel before recycling
  particleSize: number;        // Base particle size
  updateInterval: number;      // Update frequency in ms
  enableLOD: boolean;         // Level of detail optimization
  lodNear: number;            // Near distance for LOD
  lodFar: number;             // Far distance for LOD
}

export interface SolarWindData {
  windSpeed?: number;         // km/s
  density?: number;           // protons/cm³
  temperature?: number;       // K
  direction?: THREE.Vector3;  // Wind direction vector
}

export interface SolarWindParameters {
  windSpeed: number;
  density: number;
  temperature: number;
  magneticFieldStrength: number;
  activeParticleCount: number;
}

export class SolarWindVisualizer {
  private scene: THREE.Scene;
  private sunMesh: THREE.Mesh;
  private config: SolarWindConfig;
  
  private particleSystem: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array;
  private recycledParticleCount: number = 0;
  private visibleParticleCount: number = 0;
  
  private animationId?: number;
  private lastUpdate: number = 0;
  private cameraDistance: number = 10;
  
  private currentWindData: SolarWindData = {
    windSpeed: 400,
    density: 5.0,
    temperature: 100000,
    direction: new THREE.Vector3(1, 0, 0)
  };

  constructor(scene: THREE.Scene, sunMesh: THREE.Mesh, config?: Partial<SolarWindConfig>) {
    this.scene = scene;
    this.sunMesh = sunMesh;
    
    this.config = {
      particleCount: 2000,
      windSpeed: 400,
      particleDensity: 5.0,
      streamDistance: 50.0,
      particleSize: 1.0,
      updateInterval: 16,
      enableLOD: true,
      lodNear: 5.0,
      lodFar: 100.0,
      ...config
    };
    
    this.initializeParticleSystem();
    this.updateVisibleParticleCount();
  }

  private initializeParticleSystem(): void {
    // Create particle geometry
    this.particleGeometry = new THREE.BufferGeometry();
    
    // Initialize particle arrays
    this.particlePositions = new Float32Array(this.config.particleCount * 3);
    this.particleVelocities = new Float32Array(this.config.particleCount * 3);
    
    // Position particles starting from sun surface
    this.initializeParticlePositions();
    this.initializeParticleVelocities();
    
    // Set geometry attributes
    this.particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(this.particlePositions, 3));
    this.particleGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(this.particleVelocities, 3));
    
    // Create particle shader material
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWindSpeed: { value: this.config.windSpeed },
        uParticleSize: { value: this.config.particleSize },
        uDensity: { value: this.config.particleDensity }
      },
      vertexShader: `
        attribute vec3 velocity;
        uniform float uTime;
        uniform float uParticleSize;
        
        void main() {
          vec3 pos = position + velocity * uTime;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = uParticleSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uWindSpeed;
        
        void main() {
          float intensity = smoothstep(0.0, 1.0, uWindSpeed / 800.0);
          vec3 color = mix(vec3(0.3, 0.5, 1.0), vec3(1.0, 0.5, 0.2), intensity);
          
          float alpha = 1.0 - distance(gl_PointCoord, vec2(0.5));
          gl_FragColor = vec4(color, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle system
    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particleSystem.position.copy(this.sunMesh.position);
    
    this.scene.add(this.particleSystem);
  }

  private initializeParticlePositions(): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;
      
      // Random position on sun surface sphere
      const phi = Math.random() * Math.PI * 2;
      const cosTheta = Math.random() * 2 - 1;
      const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
      
      const radius = 1.0 + Math.random() * 0.1; // Near sun surface
      
      this.particlePositions[i3] = radius * sinTheta * Math.cos(phi);
      this.particlePositions[i3 + 1] = radius * sinTheta * Math.sin(phi);
      this.particlePositions[i3 + 2] = radius * cosTheta;
    }
  }

  private initializeParticleVelocities(): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;
      
      // Radial velocity from sun with some variation
      const position = new THREE.Vector3(
        this.particlePositions[i3],
        this.particlePositions[i3 + 1], 
        this.particlePositions[i3 + 2]
      );
      
      const velocity = position.clone().normalize();
      const speed = this.config.windSpeed * (0.8 + Math.random() * 0.4) / 100; // Scale for visualization
      
      velocity.multiplyScalar(speed);
      
      this.particleVelocities[i3] = velocity.x;
      this.particleVelocities[i3 + 1] = velocity.y;
      this.particleVelocities[i3 + 2] = velocity.z;
    }
  }

  private updateVisibleParticleCount(): void {
    if (this.config.enableLOD) {
      const factor = Math.max(0.1, Math.min(1.0, 
        (this.config.lodFar - this.cameraDistance) / (this.config.lodFar - this.config.lodNear)
      ));
      this.visibleParticleCount = Math.floor(this.config.particleCount * factor);
    } else {
      this.visibleParticleCount = this.config.particleCount;
    }
    
    // Apply density modifier
    const densityFactor = Math.max(0.2, Math.min(2.0, this.currentWindData.density! / 5.0));
    this.visibleParticleCount = Math.floor(this.visibleParticleCount * densityFactor);
  }

  // Public API methods
  public getConfig(): SolarWindConfig {
    return { ...this.config };
  }

  public getParticleSystem(): THREE.Points {
    return this.particleSystem;
  }

  public getParticlePositions(): Float32Array {
    return this.particlePositions;
  }

  public getParticleVelocities(): Float32Array {
    return this.particleVelocities;
  }

  public getVisibleParticleCount(): number {
    return this.visibleParticleCount;
  }

  public getRecycledParticleCount(): number {
    return this.recycledParticleCount;
  }

  public updateFromSolarWindData(data: SolarWindData): void {
    this.currentWindData = { ...this.currentWindData, ...data };
    
    if (data.windSpeed !== undefined) {
      this.config.windSpeed = data.windSpeed;
      this.particleMaterial.uniforms.uWindSpeed.value = data.windSpeed;
    }
    
    if (data.density !== undefined) {
      this.config.particleDensity = data.density;
      this.particleMaterial.uniforms.uDensity.value = data.density;
      this.updateVisibleParticleCount();
    }
  }

  public startAnimation(): void {
    if (this.animationId) return;
    
    const animate = (time: number) => {
      this.updateParticles(time - this.lastUpdate);
      this.lastUpdate = time;
      
      if (typeof requestAnimationFrame !== 'undefined') {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = setTimeout(() => animate(Date.now()), 16) as unknown as number;
      }
    };
    
    this.lastUpdate = performance.now();
    
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationId = requestAnimationFrame(animate);
    } else {
      this.animationId = setTimeout(() => animate(Date.now()), 16) as unknown as number;
    }
  }

  public updateParticles(deltaTime: number): void {
    const dt = deltaTime * 0.001; // Convert to seconds
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;
      
      // Update position
      this.particlePositions[i3] += this.particleVelocities[i3] * dt;
      this.particlePositions[i3 + 1] += this.particleVelocities[i3 + 1] * dt;
      this.particlePositions[i3 + 2] += this.particleVelocities[i3 + 2] * dt;
      
      // Check if particle has traveled beyond stream distance
      const distance = Math.sqrt(
        this.particlePositions[i3] ** 2 +
        this.particlePositions[i3 + 1] ** 2 +
        this.particlePositions[i3 + 2] ** 2
      );
      
      if (distance > this.config.streamDistance) {
        // Recycle particle to sun surface
        this.recycleParticle(i);
        this.recycledParticleCount++;
      }
    }
    
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleMaterial.uniforms.uTime.value = performance.now() * 0.001;
  }

  private recycleParticle(index: number): void {
    const i3 = index * 3;
    
    // Reset to sun surface
    const phi = Math.random() * Math.PI * 2;
    const cosTheta = Math.random() * 2 - 1;
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
    const radius = 1.0 + Math.random() * 0.1;
    
    this.particlePositions[i3] = radius * sinTheta * Math.cos(phi);
    this.particlePositions[i3 + 1] = radius * sinTheta * Math.sin(phi);
    this.particlePositions[i3 + 2] = radius * cosTheta;
    
    // Reset velocity
    const position = new THREE.Vector3(
      this.particlePositions[i3],
      this.particlePositions[i3 + 1],
      this.particlePositions[i3 + 2]
    );
    
    const velocity = position.clone().normalize();
    const speed = this.config.windSpeed * (0.8 + Math.random() * 0.4) / 100;
    velocity.multiplyScalar(speed);
    
    this.particleVelocities[i3] = velocity.x;
    this.particleVelocities[i3 + 1] = velocity.y;
    this.particleVelocities[i3 + 2] = velocity.z;
  }

  public isAnimating(): boolean {
    return this.animationId !== undefined;
  }

  public pause(): void {
    if (this.animationId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationId);
      } else {
        clearTimeout(this.animationId);
      }
      this.animationId = undefined;
    }
  }

  public resume(): void {
    if (!this.animationId) {
      this.startAnimation();
    }
  }

  public setCameraDistance(distance: number): void {
    this.cameraDistance = distance;
    this.updateVisibleParticleCount();
  }

  public getParticleColor(): THREE.Color {
    const intensity = Math.max(0, Math.min(1, this.currentWindData.windSpeed! / 800));
    const color = new THREE.Color();
    color.setHex(0x4d7fff); // Blue base
    color.r = Math.min(1, color.r + intensity * 0.7); // Add red for high speed
    return color;
  }

  public getParticleSize(): number {
    const densityFactor = Math.max(0.5, Math.min(2.0, this.currentWindData.density! / 5.0));
    return this.config.particleSize * densityFactor;
  }

  public updateSunPosition(position: THREE.Vector3): void {
    this.particleSystem.position.copy(position);
  }

  public updateSunScale(scale: number): void {
    // Emission rate scales with sun surface area
    const surfaceAreaScale = scale * scale;
    // Implementation would adjust particle emission rate
  }

  public getEmissionRate(): number {
    const sunScale = this.sunMesh.scale.x;
    return this.config.particleCount * sunScale * sunScale;
  }

  public getSolarWindParameters(): SolarWindParameters {
    return {
      windSpeed: this.currentWindData.windSpeed!,
      density: this.currentWindData.density!,
      temperature: this.currentWindData.temperature!,
      magneticFieldStrength: 5.0, // nT - placeholder
      activeParticleCount: this.visibleParticleCount
    };
  }

  public dispose(): void {
    this.pause();
    
    if (this.particleGeometry) {
      this.particleGeometry.dispose();
    }
    
    if (this.particleMaterial) {
      this.particleMaterial.dispose();
    }
    
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
    }
  }
}
