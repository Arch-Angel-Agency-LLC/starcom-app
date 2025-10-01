/**
 * Intel Globe Service
 * 
 * Manages Intel Reports 3D integration with the Globe component.
 * Handles 3D rendering, positioning, and Globe-specific interactions.
 */

import * as THREE from 'three';
import { EventEmitter } from 'events';
import type {
  IntelReport3DData,
  IntelReport3DViewport,
  IntelLODLevel,
  IntelAnimationConfig,
  IntelPerformanceMetrics
} from '../../models/Intel/IntelVisualization3D';
import type {
  IntelReport3DContextState
} from '../../types/intelligence/IntelContextTypes';

// =============================================================================
// INTERFACES AND TYPES
// =============================================================================

export interface IntelGlobeMarker {
  id: string;
  report: IntelReport3DData;
  
  // 3D Objects
  group: THREE.Group;           // Main container
  mesh: THREE.Object3D;         // Visual representation
  label?: THREE.Sprite;         // Text label
  
  // Positioning
  position: THREE.Vector3;      // World position
  surfacePosition: THREE.Vector3; // Globe surface position
  
  // Animation
  animationMixer?: THREE.AnimationMixer;
  animations: THREE.AnimationClip[];
  
  // State
  visible: boolean;
  lodLevel: IntelLODLevel;
  lastUpdate: Date;
}

export interface IntelGlobeConfig {
  globeRadius: number;
  hoverAltitude: number;
  defaultScale: number;
  lodDistances: {
    high: number;
    medium: number;
    low: number;
  };
  animationSpeed: number;
  maxMarkers: number;
}

export interface IntelGlobeRenderConfig {
  enableShadows: boolean;
  enableLighting: boolean;
  fogEnabled: boolean;
  antialiasing: boolean;
  devicePixelRatio: number;
  performanceMode: 'quality' | 'balanced' | 'performance';
}

export interface IntelGlobeInteraction {
  hoveredMarker: IntelGlobeMarker | null;
  selectedMarkers: IntelGlobeMarker[];
  draggedMarker: IntelGlobeMarker | null;
  
  // Interaction state
  isInteracting: boolean;
  lastInteraction: Date;
  
  // Event handlers
  onMarkerHover?: (marker: IntelGlobeMarker | null) => void;
  onMarkerClick?: (marker: IntelGlobeMarker) => void;
  onMarkerSelect?: (markers: IntelGlobeMarker[]) => void;
  onMarkerDrag?: (marker: IntelGlobeMarker, position: THREE.Vector3) => void;
}

// =============================================================================
// INTEL GLOBE SERVICE
// =============================================================================

export class IntelGlobeService extends EventEmitter {
  private markers: Map<string, IntelGlobeMarker> = new Map();
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private globe: THREE.Object3D | null = null;
  
  private config: IntelGlobeConfig;
  private renderConfig: IntelGlobeRenderConfig;
  private interaction: IntelGlobeInteraction;
  private viewport: IntelReport3DViewport | null = null;
  private context: IntelReport3DContextState | null = null;
  
  // Performance monitoring
  private performanceMetrics: IntelPerformanceMetrics = {
    fps: 60,
    totalIntelReports: 0,
    visibleIntelReports: 0,
    markerCount: 0,
    visibleMarkers: 0,
    renderTime: 0,
    memoryUsage: 0,
    frameRate: 60,
    lastUpdate: new Date()
  };
  
  // Animation and rendering
  private animationFrame: number | null = null;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private readonly handleMouseMove = (event: MouseEvent) => this.onMouseMove(event);
  private readonly handleMouseClick = (event: MouseEvent) => this.onMouseClick(event);
  private readonly handleContextMenu = (event: MouseEvent) => this.onContextMenu(event);
  private readonly handleTouchStart = (event: TouchEvent) => this.onTouchStart(event);
  private readonly handleTouchMove = (event: TouchEvent) => this.onTouchMove(event);
  private readonly handleTouchEnd = (event: TouchEvent) => this.onTouchEnd(event);
  
  constructor(config: Partial<IntelGlobeConfig> = {}) {
    super();
    
    this.config = {
      globeRadius: 100,
      hoverAltitude: 5,
      defaultScale: 1,
      lodDistances: {
        high: 200,
        medium: 500,
        low: 1000
      },
      animationSpeed: 1,
      maxMarkers: 1000,
      ...config
    };
    
    this.renderConfig = {
      enableShadows: true,
      enableLighting: true,
      fogEnabled: false,
      antialiasing: true,
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      performanceMode: 'balanced'
    };
    
    this.interaction = {
      hoveredMarker: null,
      selectedMarkers: [],
      draggedMarker: null,
      isInteracting: false,
      lastInteraction: new Date()
    };
    
    this.startRenderLoop();
  }
  
  // =============================================================================
  // INITIALIZATION AND SETUP
  // =============================================================================
  
  /**
   * Initialize with Three.js scene components
   */
  initialize(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    globe: THREE.Object3D
  ): void {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.globe = globe;
    
    this.setupEventListeners();
    this.emit('initialized');
  }
  
  /**
   * Set up event listeners for interactions
   */
  private setupEventListeners(): void {
    if (!this.renderer?.domElement) return;
    
    const canvas = this.renderer.domElement;
    
    this.removeEventListeners();

    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('click', this.handleMouseClick);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }
  
  // =============================================================================
  // MARKER MANAGEMENT
  // =============================================================================
  
  /**
   * Add intel reports to the globe
   */
  async addIntelReports(reports: IntelReport3DData[]): Promise<void> {
    const startTime = performance.now();
    const incomingIds = new Set(reports.map(report => report.id));

    // Remove markers that are no longer present
    Array.from(this.markers.keys()).forEach(markerId => {
      if (!incomingIds.has(markerId)) {
        this.removeIntelReport(markerId);
      }
    });

    // Add or update incoming reports
    for (const report of reports) {
      if (this.markers.has(report.id)) {
        await this.updateIntelReport(report);
      } else {
        await this.addIntelReport(report);
      }
    }

    // Update performance metrics
    this.updatePerformanceSnapshot(startTime);

    this.emit('reportsSynced', reports);
  }
  
  /**
   * Add single intel report
   */
  async addIntelReport(report: IntelReport3DData): Promise<IntelGlobeMarker> {
    if (this.markers.has(report.id)) {
      return this.updateIntelReport(report);
    }
    
    const marker = await this.createMarker(report);
    this.markers.set(report.id, marker);
    
    if (this.scene) {
      this.scene.add(marker.group);
    }
    
    this.updatePerformanceSnapshot();
    
    this.emit('reportAdded', report, marker);
    return marker;
  }
  
  /**
   * Update existing intel report
   */
  async updateIntelReport(report: IntelReport3DData): Promise<IntelGlobeMarker> {
    const existingMarker = this.markers.get(report.id);
    if (!existingMarker) {
      return this.addIntelReport(report);
    }
    
    // Update report data
    existingMarker.report = report;
    existingMarker.lastUpdate = new Date();
    
    // Update visualization if changed
    await this.updateMarkerVisualization(existingMarker);
    
    // Update position if changed
    this.updateMarkerPosition(existingMarker);
    
    this.updatePerformanceSnapshot();
    
    this.emit('reportUpdated', report, existingMarker);
    return existingMarker;
  }
  
  /**
   * Remove intel report from globe
   */
  removeIntelReport(reportId: string): boolean {
    const marker = this.markers.get(reportId);
    if (!marker) return false;
    
    // Remove from scene
    if (this.scene && marker.group.parent) {
      this.scene.remove(marker.group);
    }
    
    // Clean up resources
    this.disposeMarker(marker);
    
    // Remove from tracking
    this.markers.delete(reportId);
    
    this.updatePerformanceSnapshot();
    this.emit('reportRemoved', reportId);
    
    return true;
  }
  
  /**
   * Clear all intel reports
   */
  clearIntelReports(): void {
    Array.from(this.markers.values()).forEach(marker => {
      if (this.scene && marker.group.parent) {
        this.scene.remove(marker.group);
      }
      this.disposeMarker(marker);
    });
    
    this.markers.clear();
    this.updatePerformanceSnapshot();
    this.emit('reportsCleared');
  }

  private updatePerformanceSnapshot(renderStart?: number): void {
    const visibleCount = this.getVisibleMarkers().length;
    const frameRate = this.performanceMetrics.frameRate ?? this.performanceMetrics.fps ?? 0;

    this.performanceMetrics.totalIntelReports = this.markers.size;
    this.performanceMetrics.markerCount = this.markers.size;
    this.performanceMetrics.visibleIntelReports = visibleCount;
    this.performanceMetrics.visibleMarkers = visibleCount;
    if (typeof renderStart === 'number') {
      this.performanceMetrics.renderTime = performance.now() - renderStart;
    } else if (this.markers.size === 0) {
      this.performanceMetrics.renderTime = 0;
    }
    this.performanceMetrics.fps = frameRate;
    this.performanceMetrics.lastUpdate = new Date();
  }
  
  // =============================================================================
  // MARKER CREATION AND VISUALIZATION
  // =============================================================================
  
  /**
   * Create 3D marker for intel report
   */
  private async createMarker(report: IntelReport3DData): Promise<IntelGlobeMarker> {
    const group = new THREE.Group();
    group.name = `intel-marker-${report.id}`;
    
    // Create main mesh
    const mesh = await this.createMarkerMesh(report);
    group.add(mesh);
    
    // Create label if needed
    let label: THREE.Sprite | undefined;
    if (report.visualization.label?.visible) {
      label = this.createMarkerLabel(report);
      group.add(label);
    }
    
    // Calculate positions
    const surfacePosition = this.latLngToVector3(
      report.location.lat,
      report.location.lng,
      this.config.globeRadius
    );
    
    const position = surfacePosition.clone();
    position.multiplyScalar(1 + (this.config.hoverAltitude / this.config.globeRadius));
    
    group.position.copy(position);
    group.lookAt(new THREE.Vector3(0, 0, 0));
    
    // Set up animations
    const animations: THREE.AnimationClip[] = [];
    let animationMixer: THREE.AnimationMixer | undefined;
    
    if (report.visualization.animation) {
      animationMixer = new THREE.AnimationMixer(group);
      const animationClip = this.createAnimationClip(report.visualization.animation);
      animations.push(animationClip);
      
      const action = animationMixer.clipAction(animationClip);
      action.play();
    }
    
    const marker: IntelGlobeMarker = {
      id: report.id,
      report,
      group,
      mesh,
      label,
      position: position.clone(),
      surfacePosition: surfacePosition.clone(),
      animationMixer,
      animations,
      visible: true,
      lodLevel: 'high',
      lastUpdate: new Date()
    };
    
    // Store reference to marker in group userData
    group.userData = { marker };
    
    return marker;
  }
  
  /**
   * Create the visual mesh for a marker
   */
  private async createMarkerMesh(report: IntelReport3DData): Promise<THREE.Object3D> {
    const viz = report.visualization;
    
    // Create geometry based on marker type
    let geometry: THREE.BufferGeometry;
    
    switch (viz.markerType) {
      case 'standard':
      case 'verified':
      case 'unverified':
        geometry = new THREE.SphereGeometry(viz.size, 16, 12);
        break;
      case 'priority':
      case 'alert':
        geometry = new THREE.OctahedronGeometry(viz.size);
        break;
      case 'classified':
        geometry = new THREE.BoxGeometry(viz.size, viz.size, viz.size);
        break;
      case 'archived':
        geometry = new THREE.CylinderGeometry(viz.size * 0.8, viz.size, viz.size * 1.5);
        break;
      default:
        geometry = new THREE.SphereGeometry(viz.size, 16, 12);
    }
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: viz.color,
      opacity: viz.opacity,
      transparent: viz.opacity < 1,
      roughness: 0.3,
      metalness: 0.1
    });
    
    // Add emissive glow for high priority items
    if (report.visualization.priority === 'critical' || report.visualization.priority === 'high') {
      material.emissive = new THREE.Color(viz.color);
      material.emissiveIntensity = 0.2;
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(this.config.defaultScale);
    
    return mesh;
  }
  
  /**
   * Create text label for marker
   */
  private createMarkerLabel(report: IntelReport3DData): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    canvas.width = 256;
    canvas.height = 64;
    
    // Style the text
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = '#ffffff';
    context.font = '16px Arial, sans-serif';
    context.textAlign = 'center';
    context.fillText(report.title, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.scale.set(10, 2.5, 1);
    sprite.position.set(0, report.visualization.size * 2, 0);
    
    return sprite;
  }
  
  /**
   * Create animation clip for marker
   */
  private createAnimationClip(config: IntelAnimationConfig): THREE.AnimationClip {
    const tracks: THREE.KeyframeTrack[] = [];
    
    switch (config.type) {
      case 'rotate': {
        // Rotation animation
        const rotationTrack = new THREE.QuaternionKeyframeTrack(
          '.quaternion',
          [0, config.duration / 1000],
          [0, 0, 0, 1, 0, 0, 0, 1]
        );
        tracks.push(rotationTrack);
        break;
      }
        
      case 'pulse': {
        // Scale pulsing animation
        const scaleTrack = new THREE.VectorKeyframeTrack(
          '.scale',
          [0, config.duration / 2000, config.duration / 1000],
          [1, 1, 1, 1.2, 1.2, 1.2, 1, 1, 1]
        );
        tracks.push(scaleTrack);
        break;
      }
        
      case 'bounce': {
        // Bounce animation
        const amplitude = config.amplitude || 1;
        const bounceTrack = new THREE.VectorKeyframeTrack(
          '.position',
          [0, config.duration / 2000, config.duration / 1000],
          [0, 0, 0, 0, amplitude, 0, 0, 0, 0]
        );
        tracks.push(bounceTrack);
        break;
      }
    }
    
    return new THREE.AnimationClip(`${config.type}-animation`, config.duration / 1000, tracks);
  }
  
  // =============================================================================
  // CONTEXT AND VIEWPORT MANAGEMENT
  // =============================================================================
  
  /**
   * Update context state
   */
  updateContext(context: IntelReport3DContextState): void {
    this.context = context;
    
    // Update marker visibility based on context
    this.updateMarkersForContext();
    
    // Adjust rendering quality based on context
    this.adjustRenderingForContext();
    
    this.emit('contextUpdated', context);
  }
  
  /**
   * Set viewport for performance optimization
   */
  setViewport(viewport: IntelReport3DViewport): void {
    this.viewport = viewport;
    
    // Update LOD levels
    this.updateLODLevels();
    
    // Cull markers outside viewport
    this.cullMarkersToViewport();
    
    this.emit('viewportUpdated', viewport);
  }
  
  /**
   * Update markers based on current context
   */
  private updateMarkersForContext(): void {
    if (!this.context) return;
    
    const operationMode = this.context.hudContext.operationMode;
    const displayPriority = this.context.displayContext.priority;
    
    Array.from(this.markers.values()).forEach(marker => {
      // Show/hide based on operation mode
      let shouldShow = true;
      
      if (operationMode !== 'CYBER' && marker.report.metadata.category === 'cyber_threat') {
        shouldShow = displayPriority === 'primary';
      }
      
      // Apply visibility
      marker.visible = shouldShow;
      marker.group.visible = shouldShow;
      
      // Update LOD based on priority
      if (displayPriority === 'tertiary') {
        marker.lodLevel = 'low';
      } else if (displayPriority === 'secondary') {
        marker.lodLevel = 'medium';
      } else {
        marker.lodLevel = 'high';
      }
    });
    
    this.updateVisibleCount();
  }
  
  /**
   * Update LOD levels based on camera distance
   */
  private updateLODLevels(): void {
    if (!this.camera) return;
    
    const cameraPosition = this.camera.position;
    
    Array.from(this.markers.values()).forEach(marker => {
      const distance = cameraPosition.distanceTo(marker.position);
      
      if (distance < this.config.lodDistances.high) {
        marker.lodLevel = 'high';
      } else if (distance < this.config.lodDistances.medium) {
        marker.lodLevel = 'medium';
      } else if (distance < this.config.lodDistances.low) {
        marker.lodLevel = 'low';
      } else {
        marker.lodLevel = 'hidden';
      }
      
      // Apply LOD to marker
      this.applyLODToMarker(marker);
    });
  }
  
  /**
   * Apply LOD settings to marker
   */
  private applyLODToMarker(marker: IntelGlobeMarker): void {
    const mesh = marker.mesh;
    const label = marker.label;
    
    switch (marker.lodLevel) {
      case 'high':
        mesh.visible = true;
        if (label) label.visible = true;
        marker.group.visible = marker.visible;
        break;
        
      case 'medium':
        mesh.visible = true;
        if (label) label.visible = false;
        marker.group.visible = marker.visible;
        break;
        
      case 'low':
        mesh.visible = true;
        if (label) label.visible = false;
        marker.group.visible = marker.visible;
        // Reduce geometry complexity if needed
        break;
        
      case 'hidden':
        marker.group.visible = false;
        break;
    }
  }
  
  /**
   * Cull markers outside viewport
   */
  private cullMarkersToViewport(): void {
    if (!this.viewport) return;
    
    const bounds = this.viewport.bounds;
    
    Array.from(this.markers.values()).forEach(marker => {
      const location = marker.report.location;
      
      const inBounds = (
        location.lat >= bounds.south &&
        location.lat <= bounds.north &&
        location.lng >= bounds.west &&
        location.lng <= bounds.east
      );
      
      marker.group.visible = inBounds && marker.visible;
    });
    
    this.updateVisibleCount();
  }
  
  // =============================================================================
  // INTERACTION HANDLING
  // =============================================================================
  
  private onMouseMove(event: MouseEvent): void {
    if (!this.renderer || !this.camera || !this.scene) return;
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.handleHover();
  }
  
  private onMouseClick(event: MouseEvent): void {
    if (!this.interaction.hoveredMarker) return;
    
    this.interaction.lastInteraction = new Date();
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const index = this.interaction.selectedMarkers.indexOf(this.interaction.hoveredMarker);
      if (index === -1) {
        this.interaction.selectedMarkers.push(this.interaction.hoveredMarker);
      } else {
        this.interaction.selectedMarkers.splice(index, 1);
      }
    } else {
      // Single select
      this.interaction.selectedMarkers = [this.interaction.hoveredMarker];
    }
    
    if (this.interaction.onMarkerClick) {
      this.interaction.onMarkerClick(this.interaction.hoveredMarker);
    }
    
    if (this.interaction.onMarkerSelect) {
      this.interaction.onMarkerSelect(this.interaction.selectedMarkers);
    }
    
    this.emit('markerClick', this.interaction.hoveredMarker);
    this.emit('markerSelect', this.interaction.selectedMarkers);
  }
  
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    
    if (this.interaction.hoveredMarker) {
      this.emit('markerContextMenu', this.interaction.hoveredMarker, {
        x: event.clientX,
        y: event.clientY
      });
    }
  }
  
  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.renderer!.domElement.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.handleHover();
    }
  }
  
  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.renderer!.domElement.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.handleHover();
    }
  }
  
  private onTouchEnd(event: TouchEvent): void {
    if (this.interaction.hoveredMarker) {
      // Simulate click for touch
      this.interaction.lastInteraction = new Date();
      this.interaction.selectedMarkers = [this.interaction.hoveredMarker];
      
      if (this.interaction.onMarkerClick) {
        this.interaction.onMarkerClick(this.interaction.hoveredMarker);
      }
      
      if (this.interaction.onMarkerSelect) {
        this.interaction.onMarkerSelect(this.interaction.selectedMarkers);
      }
      
      this.emit('markerClick', this.interaction.hoveredMarker);
      this.emit('markerSelect', this.interaction.selectedMarkers);
    }
    
    // Log touch end event for debugging
    console.debug('Touch end', event.touches.length);
  }
  
  /**
   * Handle hover detection
   */
  private handleHover(): void {
    if (!this.camera || !this.scene) return;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Get all marker groups
    const markerGroups = Array.from(this.markers.values())
      .filter(marker => marker.group.visible)
      .map(marker => marker.group);
    
    const intersects = this.raycaster.intersectObjects(markerGroups, true);
    
    let hoveredMarker: IntelGlobeMarker | null = null;
    
    if (intersects.length > 0) {
      // Find the marker from the intersected object
      let object = intersects[0].object;
      while (object && !object.userData?.marker) {
        object = object.parent!;
      }
      
      if (object?.userData?.marker) {
        hoveredMarker = object.userData.marker;
      }
    }
    
    // Update hover state
    if (hoveredMarker !== this.interaction.hoveredMarker) {
      // Clear previous hover
      if (this.interaction.hoveredMarker) {
        this.updateMarkerHoverState(this.interaction.hoveredMarker, false);
      }
      
      // Set new hover
      this.interaction.hoveredMarker = hoveredMarker;
      if (hoveredMarker) {
        this.updateMarkerHoverState(hoveredMarker, true);
      }
      
      // Emit events
      if (this.interaction.onMarkerHover) {
        this.interaction.onMarkerHover(hoveredMarker);
      }
      
      this.emit('markerHover', hoveredMarker);
    }
  }
  
  /**
   * Update marker hover visual state
   */
  private updateMarkerHoverState(marker: IntelGlobeMarker, hovered: boolean): void {
    const mesh = marker.mesh;
    if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
      if (hovered) {
        mesh.material.emissive = new THREE.Color(marker.report.visualization.color);
        mesh.material.emissiveIntensity = 0.3;
        mesh.scale.setScalar(this.config.defaultScale * 1.1);
      } else {
        mesh.material.emissive = new THREE.Color(0x000000);
        mesh.material.emissiveIntensity = 0;
        mesh.scale.setScalar(this.config.defaultScale);
      }
    }
  }
  
  // =============================================================================
  // UTILITY METHODS
  // =============================================================================
  
  /**
   * Convert lat/lng to 3D vector on sphere
   */
  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  }
  
  /**
   * Update marker position
   */
  private updateMarkerPosition(marker: IntelGlobeMarker): void {
    const surfacePosition = this.latLngToVector3(
      marker.report.location.lat,
      marker.report.location.lng,
      this.config.globeRadius
    );
    
    const position = surfacePosition.clone();
    position.multiplyScalar(1 + (this.config.hoverAltitude / this.config.globeRadius));
    
    marker.surfacePosition.copy(surfacePosition);
    marker.position.copy(position);
    marker.group.position.copy(position);
    marker.group.lookAt(new THREE.Vector3(0, 0, 0));
  }
  
  /**
   * Update marker visualization
   */
  private async updateMarkerVisualization(marker: IntelGlobeMarker): Promise<void> {
    // Remove old mesh
    marker.group.remove(marker.mesh);
    
    // Create new mesh
    marker.mesh = await this.createMarkerMesh(marker.report);
    marker.group.add(marker.mesh);
    
    // Update label if needed
    if (marker.label) {
      marker.group.remove(marker.label);
      
      if (marker.report.visualization.label?.visible) {
        marker.label = this.createMarkerLabel(marker.report);
        marker.group.add(marker.label);
      } else {
        marker.label = undefined;
      }
    }
  }
  
  /**
   * Dispose marker resources
   */
  private disposeMarker(marker: IntelGlobeMarker): void {
    // Dispose geometries and materials
    marker.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
      
      if (object instanceof THREE.Sprite && object.material) {
        object.material.dispose();
        if (object.material.map) {
          object.material.map.dispose();
        }
      }
    });
    
    // Stop animations
    if (marker.animationMixer) {
      marker.animationMixer.stopAllAction();
    }
  }
  
  /**
   * Update visible marker count
   */
  private updateVisibleCount(): void {
    let visibleCount = 0;
    Array.from(this.markers.values()).forEach(marker => {
      if (marker.group.visible) visibleCount++;
    });
    this.performanceMetrics.visibleIntelReports = visibleCount;
  }
  
  /**
   * Adjust rendering quality based on context
   */
  private adjustRenderingForContext(): void {
    if (!this.context || !this.renderer) return;
    
    const priority = this.context.displayContext.priority;
    
    switch (priority) {
      case 'primary':
        this.renderConfig.performanceMode = 'quality';
        this.config.maxMarkers = 1000;
        break;
        
      case 'secondary':
        this.renderConfig.performanceMode = 'balanced';
        this.config.maxMarkers = 500;
        break;
        
      case 'tertiary':
        this.renderConfig.performanceMode = 'performance';
        this.config.maxMarkers = 200;
        break;
    }
    
    // Apply renderer settings
    this.renderer.setPixelRatio(
      this.renderConfig.performanceMode === 'performance' ? 1 : this.renderConfig.devicePixelRatio
    );
  }
  
  /**
   * Start render loop
   */
  private startRenderLoop(): void {
    const animate = () => {
      this.animationFrame = requestAnimationFrame(animate);
      
      const delta = this.clock.getDelta();
      
      // Update animations
      Array.from(this.markers.values()).forEach(marker => {
        if (marker.animationMixer) {
          marker.animationMixer.update(delta * this.config.animationSpeed);
        }
      });
      
      // Update performance metrics
        const frameRate = 1 / delta;
        this.performanceMetrics.frameRate = frameRate;
        this.performanceMetrics.fps = frameRate;
      this.performanceMetrics.lastUpdate = new Date();
    };
    
    animate();
  }
  
  // =============================================================================
  // PUBLIC API
  // =============================================================================
  
  /**
   * Get marker by ID
   */
  getMarker(id: string): IntelGlobeMarker | undefined {
    return this.markers.get(id);
  }
  
  /**
   * Get all markers
   */
  getAllMarkers(): IntelGlobeMarker[] {
    return Array.from(this.markers.values());
  }
  
  /**
   * Get visible markers
   */
  getVisibleMarkers(): IntelGlobeMarker[] {
    return Array.from(this.markers.values()).filter(marker => marker.group.visible);
  }
  
  /**
   * Get selected markers
   */
  getSelectedMarkers(): IntelGlobeMarker[] {
    return [...this.interaction.selectedMarkers];
  }
  
  /**
   * Get hovered marker
   */
  getHoveredMarker(): IntelGlobeMarker | null {
    return this.interaction.hoveredMarker;
  }
  
  /**
   * Set interaction handlers
   */
  setInteractionHandlers(handlers: Partial<IntelGlobeInteraction>): void {
    Object.assign(this.interaction, handlers);
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): IntelPerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<IntelGlobeConfig>): void {
    Object.assign(this.config, config);
    this.emit('configUpdated', this.config);
  }
  
  /**
   * Update render configuration
   */
  updateRenderConfig(config: Partial<IntelGlobeRenderConfig>): void {
    Object.assign(this.renderConfig, config);
    this.emit('renderConfigUpdated', this.renderConfig);
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.clearIntelReports();
    this.removeAllListeners();

    this.removeEventListeners();
  }

  private removeEventListeners(): void {
    if (!this.renderer?.domElement) {
      return;
    }

    const canvas = this.renderer.domElement;

    canvas.removeEventListener('mousemove', this.handleMouseMove);
    canvas.removeEventListener('click', this.handleMouseClick);
    canvas.removeEventListener('contextmenu', this.handleContextMenu);
    canvas.removeEventListener('touchstart', this.handleTouchStart);
    canvas.removeEventListener('touchmove', this.handleTouchMove);
    canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}

// Export singleton instance
export const intelGlobeService = new IntelGlobeService();
