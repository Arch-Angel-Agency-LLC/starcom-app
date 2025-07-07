/**
 * Intel3DInteractionManager - Game-inspired 3D interaction system
 * 
 * This class manages 3D raycasting, object state, and events for Intel Report models.
 * Uses game development best practices for reliable 3D interaction.
 */

import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';

export interface Intel3DModel {
  id: string;
  mesh: THREE.Object3D;
  report: IntelReportOverlayMarker;
  state: 'default' | 'hovered' | 'clicked';
  materials: {
    default: THREE.Material;
    hovered: THREE.Material;
    clicked: THREE.Material;
  };
  boundingBox: THREE.Box3;
  screenPosition?: THREE.Vector2; // Updated each frame
}

export interface Intel3DInteractionEvent {
  type: 'hover' | 'unhover' | 'click';
  model: Intel3DModel;
  screenPosition: THREE.Vector2;
  worldPosition: THREE.Vector3;
  intersectionPoint: THREE.Vector3;
}

export type Intel3DEventListener = (event: Intel3DInteractionEvent) => void;

export class Intel3DInteractionManager {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera | null = null;
  private models: Map<string, Intel3DModel> = new Map();
  private hoveredModel: Intel3DModel | null = null;
  private clickedModel: Intel3DModel | null = null;
  
  // Performance optimization
  private lastRaycastTime: number = 0;
  private raycastThrottle: number = 16; // ~60fps
  private frustumCulling: boolean = true;
  private maxRaycastDistance: number = 1000;
  
  // Event listeners
  private eventListeners: Map<string, Intel3DEventListener[]> = new Map();
  
  // Material cache for performance
  private materialCache: Map<string, THREE.Material> = new Map();

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Configure raycaster for better performance
    this.raycaster.far = this.maxRaycastDistance;
    this.raycaster.near = 0.1;
  }

  /**
   * Initialize the interaction manager with camera reference
   */
  initialize(camera: THREE.Camera): void {
    this.camera = camera;
    console.log('Intel3DInteractionManager initialized with camera');
  }

  /**
   * Register a 3D model for interaction
   */
  registerModel(
    id: string, 
    mesh: THREE.Object3D, 
    report: IntelReportOverlayMarker
  ): Intel3DModel {
    // Create material variants
    const materials = this.createMaterials(mesh);
    
    // Create bounding box for optimization
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    
    const model: Intel3DModel = {
      id,
      mesh,
      report,
      state: 'default',
      materials,
      boundingBox
    };
    
    // Apply default material
    this.applyMaterial(mesh, materials.default);
    
    this.models.set(id, model);
    console.log(`Registered Intel 3D model: ${report.title}`);
    
    return model;
  }

  /**
   * Unregister a 3D model
   */
  unregisterModel(id: string): void {
    const model = this.models.get(id);
    if (model) {
      // Clear any active states
      if (this.hoveredModel === model) {
        this.hoveredModel = null;
      }
      if (this.clickedModel === model) {
        this.clickedModel = null;
      }
      
      // Dispose materials
      Object.values(model.materials).forEach(material => {
        if (material instanceof THREE.Material) {
          material.dispose();
        }
      });
      
      this.models.delete(id);
      console.log(`Unregistered Intel 3D model: ${id}`);
    }
  }

  /**
   * Update mouse position and perform raycasting
   */
  updateMousePosition(x: number, y: number, containerWidth: number, containerHeight: number): void {
    if (!this.camera) return;
    
    // Normalize mouse coordinates to [-1, 1] range
    this.mouse.x = (x / containerWidth) * 2 - 1;
    this.mouse.y = -(y / containerHeight) * 2 + 1;
    
    // Throttle raycasting for performance
    const now = Date.now();
    if (now - this.lastRaycastTime < this.raycastThrottle) {
      return;
    }
    this.lastRaycastTime = now;
    
    this.performRaycast();
  }

  /**
   * Handle click events
   */
  handleClick(): void {
    if (this.hoveredModel) {
      this.setModelState(this.hoveredModel, 'clicked');
      this.clickedModel = this.hoveredModel;
      
      const event: Intel3DInteractionEvent = {
        type: 'click',
        model: this.hoveredModel,
        screenPosition: this.mouse.clone(),
        worldPosition: this.hoveredModel.mesh.position.clone(),
        intersectionPoint: this.hoveredModel.mesh.position.clone()
      };
      
      this.notifyListeners('click', event);
    }
  }

  /**
   * Clear clicked state
   */
  clearClickedState(): void {
    if (this.clickedModel) {
      this.setModelState(this.clickedModel, this.hoveredModel === this.clickedModel ? 'hovered' : 'default');
      this.clickedModel = null;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, listener: Intel3DEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: Intel3DEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Update screen positions for all models (for UI positioning)
   */
  updateScreenPositions(camera: THREE.Camera, containerWidth: number, containerHeight: number): void {
    this.models.forEach(model => {
      const worldPosition = model.mesh.position.clone();
      const screenPosition = worldPosition.project(camera);
      
      // Convert from normalized device coordinates to screen coordinates
      model.screenPosition = new THREE.Vector2(
        (screenPosition.x + 1) * containerWidth / 2,
        (-screenPosition.y + 1) * containerHeight / 2
      );
    });
  }

  /**
   * Get model by ID
   */
  getModel(id: string): Intel3DModel | null {
    return this.models.get(id) || null;
  }

  /**
   * Get currently hovered model
   */
  getHoveredModel(): Intel3DModel | null {
    return this.hoveredModel;
  }

  /**
   * Get currently clicked model
   */
  getClickedModel(): Intel3DModel | null {
    return this.clickedModel;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Clear all models
    this.models.forEach((_, id) => this.unregisterModel(id));
    
    // Clear material cache
    this.materialCache.forEach(material => {
      if (material instanceof THREE.Material) {
        material.dispose();
      }
    });
    this.materialCache.clear();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    console.log('Intel3DInteractionManager disposed');
  }

  // Private methods

  private performRaycast(): void {
    if (!this.camera) return;
    
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Get visible models for raycasting
    const visibleModels = this.getVisibleModels();
    const meshes = visibleModels.map(model => model.mesh);
    
    if (meshes.length === 0) return;
    
    // Perform intersection test
    const intersects = this.raycaster.intersectObjects(meshes, true);
    
    if (intersects.length > 0) {
      // Find the model that was intersected (closest first)
      const intersectedMesh = intersects[0].object;
      const intersectedModel = this.findModelByMesh(intersectedMesh);
      
      if (intersectedModel && intersectedModel !== this.hoveredModel) {
        // Clear previous hover
        if (this.hoveredModel) {
          this.setModelState(this.hoveredModel, 'default');
          const unhoverEvent: Intel3DInteractionEvent = {
            type: 'unhover',
            model: this.hoveredModel,
            screenPosition: this.mouse.clone(),
            worldPosition: this.hoveredModel.mesh.position.clone(),
            intersectionPoint: intersects[0].point
          };
          this.notifyListeners('unhover', unhoverEvent);
        }
        
        // Set new hover
        this.hoveredModel = intersectedModel;
        this.setModelState(intersectedModel, 'hovered');
        
        const hoverEvent: Intel3DInteractionEvent = {
          type: 'hover',
          model: intersectedModel,
          screenPosition: this.mouse.clone(),
          worldPosition: intersectedModel.mesh.position.clone(),
          intersectionPoint: intersects[0].point
        };
        
        this.notifyListeners('hover', hoverEvent);
      }
    } else {
      // No intersection, clear hover
      if (this.hoveredModel) {
        this.setModelState(this.hoveredModel, 'default');
        const unhoverEvent: Intel3DInteractionEvent = {
          type: 'unhover',
          model: this.hoveredModel,
          screenPosition: this.mouse.clone(),
          worldPosition: this.hoveredModel.mesh.position.clone(),
          intersectionPoint: this.hoveredModel.mesh.position.clone()
        };
        this.notifyListeners('unhover', unhoverEvent);
        this.hoveredModel = null;
      }
    }
  }

  private getVisibleModels(): Intel3DModel[] {
    if (!this.frustumCulling || !this.camera) {
      return Array.from(this.models.values());
    }
    
    // Implement frustum culling for performance optimization
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);

    return Array.from(this.models.values()).filter(model => {
      if (!model.mesh) return false;

      // Update mesh world matrix if needed
      if (!model.mesh.matrixWorldNeedsUpdate) {
        model.mesh.updateMatrixWorld(false);
      }

      // Create bounding sphere for the model
      const boundingSphere = new THREE.Sphere();
      
      // Calculate bounding sphere from mesh geometry
      if (model.mesh instanceof THREE.Mesh && model.mesh.geometry && model.mesh.geometry.boundingSphere) {
        boundingSphere.copy(model.mesh.geometry.boundingSphere);
        boundingSphere.applyMatrix4(model.mesh.matrixWorld);
      } else {
        // Fallback: create sphere from mesh position with default radius
        boundingSphere.set(model.mesh.position, 1.0);
      }

      // Test if bounding sphere intersects with frustum
      return frustum.intersectsSphere(boundingSphere);
    });
  }

  private findModelByMesh(mesh: THREE.Object3D): Intel3DModel | null {
    for (const model of this.models.values()) {
      if (model.mesh === mesh || 
          model.mesh.children.includes(mesh) ||
          this.isChildOfModel(mesh, model.mesh)) {
        return model;
      }
    }
    return null;
  }

  private isChildOfModel(object: THREE.Object3D, model: THREE.Object3D): boolean {
    let parent = object.parent;
    while (parent) {
      if (parent === model) return true;
      parent = parent.parent;
    }
    return false;
  }

  private setModelState(model: Intel3DModel, state: 'default' | 'hovered' | 'clicked'): void {
    if (model.state === state) return;
    
    model.state = state;
    const material = model.materials[state];
    this.applyMaterial(model.mesh, material);
  }

  private createMaterials(mesh: THREE.Object3D): {
    default: THREE.Material;
    hovered: THREE.Material;
    clicked: THREE.Material;
  } {
    // Get original material or create default
    const originalMaterial = this.getOriginalMaterial(mesh);
    
    // Create hover material (brighter, emissive)
    const hoverMaterial = originalMaterial.clone();
    if (hoverMaterial instanceof THREE.MeshStandardMaterial) {
      hoverMaterial.emissive = new THREE.Color(0x444444);
      hoverMaterial.emissiveIntensity = 0.3;
    } else if (hoverMaterial instanceof THREE.MeshBasicMaterial) {
      // For basic materials, increase the color brightness
      const originalColor = hoverMaterial.color.clone();
      hoverMaterial.color = originalColor.multiplyScalar(1.5);
    }
    
    // Create clicked material (even brighter)
    const clickedMaterial = originalMaterial.clone();
    if (clickedMaterial instanceof THREE.MeshStandardMaterial) {
      clickedMaterial.emissive = new THREE.Color(0x666666);
      clickedMaterial.emissiveIntensity = 0.5;
    } else if (clickedMaterial instanceof THREE.MeshBasicMaterial) {
      // For basic materials, increase the color brightness even more
      const originalColor = clickedMaterial.color.clone();
      clickedMaterial.color = originalColor.multiplyScalar(2.0);
    }
    
    return {
      default: originalMaterial,
      hovered: hoverMaterial,
      clicked: clickedMaterial
    };
  }

  private getOriginalMaterial(mesh: THREE.Object3D): THREE.Material {
    // Find the first material in the mesh hierarchy
    let material: THREE.Material | null = null;
    
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && !material) {
        material = Array.isArray(child.material) ? child.material[0] : child.material;
      }
    });
    
    // Fallback to basic material if none found
    if (!material) {
      material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    }
    
    return material;
  }

  private applyMaterial(mesh: THREE.Object3D, material: THREE.Material): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
  }

  private notifyListeners(eventType: string, event: Intel3DInteractionEvent): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }
}

export const intel3DInteractionManager = new Intel3DInteractionManager();
