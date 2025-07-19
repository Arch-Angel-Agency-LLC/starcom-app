import * as THREE from 'three';

export interface CMEConfig {
  maxConcurrentCMEs: number;
  shockWaveRadius: number;
  expansionSpeed: number;        // km/s
  shockDuration: number;         // milliseconds
  cmeThreshold: number;          // X-ray flux threshold for CME
  enableEarthImpactPrediction: boolean;
  earthDistance: number;         // AU
  coneAngle: number;            // degrees
}

export interface SolarFlareData {
  xrayFlux: number;             // W/m²
  flareLocation: { lat: number; lon: number };
  timestamp: number;
  classification: string;       // e.g., 'X5.2'
}

export interface CMEEvent {
  id: string;
  launchTime: number;
  direction: THREE.Vector3;
  speed: number;                // km/s
  intensity: number;            // 0-1
  sourceFlare: SolarFlareData;
}

export interface EarthImpactPrediction {
  cmeId: string;
  impactProbability: number;    // 0-1
  estimatedArrivalTime: number;
  impactIntensity: 'minor' | 'moderate' | 'severe' | 'extreme';
}

export class CMEVisualizer {
  private scene: THREE.Scene;
  private sunMesh: THREE.Mesh;
  private config: CMEConfig;
  
  private activeCMEs: Map<string, CMEEvent> = new Map();
  private shockWaveEffects: THREE.Mesh[] = [];
  private cmeConeMeshes: THREE.Mesh[] = [];
  private earthImpactPredictions: EarthImpactPrediction[] = [];
  
  private animationId?: number;
  private lastUpdate: number = 0;

  constructor(scene: THREE.Scene, sunMesh: THREE.Mesh, config?: Partial<CMEConfig>) {
    this.scene = scene;
    this.sunMesh = sunMesh;
    
    this.config = {
      maxConcurrentCMEs: 3,
      shockWaveRadius: 20.0,
      expansionSpeed: 1500,      // km/s average CME speed
      shockDuration: 5000,       // 5 seconds
      cmeThreshold: 1.0e-4,      // X1.0 threshold
      enableEarthImpactPrediction: true,
      earthDistance: 149.6,      // million km (1 AU)
      coneAngle: 45,             // degrees
      ...config
    };
  }

  public getConfig(): CMEConfig {
    return { ...this.config };
  }

  public processSolarFlareData(flareData: SolarFlareData): boolean {
    // Check if flare is strong enough to generate CME
    if (flareData.xrayFlux < this.config.cmeThreshold) {
      return false;
    }
    
    // Check if we have room for another CME
    if (this.activeCMEs.size >= this.config.maxConcurrentCMEs) {
      // Remove oldest CME
      const oldestId = Array.from(this.activeCMEs.keys())[0];
      this.removeCME(oldestId);
    }
    
    // Create new CME event
    const cme = this.createCMEFromFlare(flareData);
    this.activeCMEs.set(cme.id, cme);
    
    // Create visual effects
    this.createShockWaveEffect(cme);
    this.createCMEConeEffect(cme);
    
    // Generate Earth impact prediction if enabled
    if (this.config.enableEarthImpactPrediction) {
      const prediction = this.calculateEarthImpact(cme);
      if (prediction) {
        this.earthImpactPredictions.push(prediction);
      }
    }
    
    return true;
  }

  private createCMEFromFlare(flareData: SolarFlareData): CMEEvent {
    const id = `cme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate direction from flare location
    const direction = this.calculateCMEDirection(flareData.flareLocation);
    
    // Calculate speed and intensity based on flare strength
    const flareIntensity = this.getFlareIntensity(flareData.xrayFlux);
    const speed = this.config.expansionSpeed * (0.5 + flareIntensity * 1.5); // 750-3000 km/s range
    
    return {
      id,
      launchTime: flareData.timestamp,
      direction,
      speed,
      intensity: flareIntensity,
      sourceFlare: flareData
    };
  }

  private calculateCMEDirection(flareLocation: { lat: number; lon: number }): THREE.Vector3 {
    // Convert solar coordinates to 3D direction
    const latRad = (flareLocation.lat * Math.PI) / 180;
    const lonRad = (flareLocation.lon * Math.PI) / 180;
    
    // Solar coordinate system (Earth perspective)
    const x = Math.cos(latRad) * Math.sin(lonRad);
    const y = Math.sin(latRad);
    const z = Math.cos(latRad) * Math.cos(lonRad);
    
    return new THREE.Vector3(x, y, z).normalize();
  }

  private getFlareIntensity(xrayFlux: number): number {
    // Convert X-ray flux to intensity (0-1)
    if (xrayFlux < 1.0e-4) return 0.1;  // Below X1
    if (xrayFlux < 1.0e-3) return 0.2 + (xrayFlux / 1.0e-3) * 0.3; // X1-X10
    return Math.min(1.0, 0.5 + (xrayFlux / 1.0e-2) * 0.5); // X10+
  }

  private createShockWaveEffect(cme: CMEEvent): void {
    // Create expanding sphere for shock wave
    const geometry = new THREE.SphereGeometry(1.0, 32, 32);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uShockRadius: { value: 1.0 },
        uIntensity: { value: cme.intensity },
        uDirection: { value: cme.direction }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uShockRadius;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position * uShockRadius;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform vec3 uDirection;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          float directionality = dot(vNormal, uDirection);
          directionality = max(0.0, directionality);
          
          float wave = sin(uTime * 2.0) * 0.5 + 0.5;
          float intensity = uIntensity * wave * directionality;
          
          vec3 color = mix(vec3(1.0, 0.8, 0.2), vec3(1.0, 0.2, 0.0), uIntensity);
          float alpha = intensity * 0.3;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    const shockMesh = new THREE.Mesh(geometry, material);
    shockMesh.position.copy(this.sunMesh.position);
    
    // Store reference with CME ID
    (shockMesh as any).cmeId = cme.id;
    (shockMesh as any).creationTime = performance.now();
    
    this.shockWaveEffects.push(shockMesh);
    this.scene.add(shockMesh);
  }

  private createCMEConeEffect(cme: CMEEvent): void {
    // Create cone geometry for directional CME
    const geometry = new THREE.SphereGeometry(1.0, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCMESpeed: { value: cme.speed },
        uCMEDensity: { value: cme.intensity },
        uDirection: { value: cme.direction }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uCMESpeed;
        uniform vec3 uDirection;
        varying vec3 vPosition;
        
        void main() {
          vPosition = position;
          
          // Align cone with CME direction
          vec3 pos = position;
          float expansion = uTime * uCMESpeed * 0.001;
          pos *= (1.0 + expansion);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uCMEDensity;
        varying vec3 vPosition;
        
        void main() {
          float density = uCMEDensity * (1.0 - length(vPosition));
          vec3 color = vec3(1.0, 0.6, 0.3);
          
          gl_FragColor = vec4(color, density * 0.2);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    const coneMesh = new THREE.Mesh(geometry, material);
    coneMesh.position.copy(this.sunMesh.position);
    
    // Orient cone in CME direction
    coneMesh.lookAt(
      this.sunMesh.position.x + cme.direction.x,
      this.sunMesh.position.y + cme.direction.y,
      this.sunMesh.position.z + cme.direction.z
    );
    
    (coneMesh as any).cmeId = cme.id;
    
    this.cmeConeMeshes.push(coneMesh);
    this.scene.add(coneMesh);
  }

  private calculateEarthImpact(cme: CMEEvent): EarthImpactPrediction | null {
    // Earth is at (1, 0, 0) in our coordinate system (simplified)
    const earthDirection = new THREE.Vector3(1, 0, 0);
    
    // Calculate angle between CME direction and Earth direction
    const angle = Math.acos(cme.direction.dot(earthDirection));
    const angleDegrees = (angle * 180) / Math.PI;
    
    // Impact probability based on angular separation
    let impactProbability = 0;
    if (angleDegrees < 15) {
      impactProbability = 0.9;
    } else if (angleDegrees < 30) {
      impactProbability = 0.7;
    } else if (angleDegrees < 45) {
      impactProbability = 0.4;
    } else if (angleDegrees < 60) {
      impactProbability = 0.2;
    }
    
    if (impactProbability < 0.1) {
      return null; // Too far from Earth direction
    }
    
    // Calculate arrival time based on CME speed
    const travelTimeHours = this.config.earthDistance * 1e6 / cme.speed / 3600; // Convert to hours
    const estimatedArrivalTime = cme.launchTime + (travelTimeHours * 60 * 60 * 1000);
    
    // Determine impact intensity
    let impactIntensity: EarthImpactPrediction['impactIntensity'] = 'minor';
    if (cme.intensity > 0.8) {
      impactIntensity = 'extreme';
    } else if (cme.intensity > 0.6) {
      impactIntensity = 'severe';
    } else if (cme.intensity > 0.4) {
      impactIntensity = 'moderate';
    }
    
    return {
      cmeId: cme.id,
      impactProbability,
      estimatedArrivalTime,
      impactIntensity
    };
  }

  public getActiveCMEs(): CMEEvent[] {
    return Array.from(this.activeCMEs.values());
  }

  public getShockWaveEffects(): THREE.Mesh[] {
    return [...this.shockWaveEffects];
  }

  public getCMEConeEffects(): THREE.Mesh[] {
    return [...this.cmeConeMeshes];
  }

  public getEarthImpactPredictions(): EarthImpactPrediction[] {
    return [...this.earthImpactPredictions];
  }

  public startAnimation(): void {
    if (this.animationId) return;
    
    const animate = (time: number) => {
      this.updateEffects(time - this.lastUpdate);
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

  public updateEffects(deltaTime: number): void {
    const currentTime = performance.now();
    
    // Update shock wave effects
    this.shockWaveEffects.forEach((shockWave, index) => {
      const creationTime = (shockWave as any).creationTime;
      const elapsed = currentTime - creationTime;
      
      if (elapsed > this.config.shockDuration) {
        // Remove expired shock wave
        this.scene.remove(shockWave);
        shockWave.geometry.dispose();
        shockWave.material.dispose();
        this.shockWaveEffects.splice(index, 1);
      } else {
        // Update shock wave expansion
        const progress = elapsed / this.config.shockDuration;
        const radius = 1.0 + progress * this.config.shockWaveRadius;
        (shockWave.material as THREE.ShaderMaterial).uniforms.uShockRadius.value = radius;
        (shockWave.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsed * 0.001;
      }
    });
    
    // Update CME cone effects
    this.cmeConeMeshes.forEach(cone => {
      (cone.material as THREE.ShaderMaterial).uniforms.uTime.value = currentTime * 0.001;
    });
  }

  private removeCME(cmeId: string): void {
    this.activeCMEs.delete(cmeId);
    
    // Remove associated visual effects
    this.shockWaveEffects = this.shockWaveEffects.filter(wave => {
      if ((wave as any).cmeId === cmeId) {
        this.scene.remove(wave);
        wave.geometry.dispose();
        wave.material.dispose();
        return false;
      }
      return true;
    });
    
    this.cmeConeMeshes = this.cmeConeMeshes.filter(cone => {
      if ((cone as any).cmeId === cmeId) {
        this.scene.remove(cone);
        cone.geometry.dispose();
        cone.material.dispose();
        return false;
      }
      return true;
    });
    
    // Remove associated predictions
    this.earthImpactPredictions = this.earthImpactPredictions.filter(pred => pred.cmeId !== cmeId);
  }

  public updateSunPosition(position: THREE.Vector3): void {
    // Update positions of all CME effects
    this.shockWaveEffects.forEach(wave => {
      wave.position.copy(position);
    });
    
    this.cmeConeMeshes.forEach(cone => {
      cone.position.copy(position);
    });
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

  public dispose(): void {
    this.pause();
    
    // Dispose all shock wave effects
    this.shockWaveEffects.forEach(wave => {
      wave.geometry.dispose();
      wave.material.dispose();
      this.scene.remove(wave);
    });
    
    // Dispose all CME cone effects
    this.cmeConeMeshes.forEach(cone => {
      cone.geometry.dispose();
      cone.material.dispose();
      this.scene.remove(cone);
    });
    
    // Clear all data
    this.activeCMEs.clear();
    this.shockWaveEffects.length = 0;
    this.cmeConeMeshes.length = 0;
    this.earthImpactPredictions.length = 0;
  }
}
