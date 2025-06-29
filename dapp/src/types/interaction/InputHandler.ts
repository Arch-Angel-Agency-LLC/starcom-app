// InputHandler.ts
// Game-inspired input handling system for 3D globe interactions

import { InteractionMode } from './InteractionMode';
import * as THREE from 'three';

export interface InputEvent {
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointerleave' | 'wheel' | 'keydown' | 'keyup';
  position: { x: number; y: number };
  normalizedPosition: { x: number; y: number }; // [-1, 1] range
  button?: number;
  buttons?: number;
  deltaY?: number;
  key?: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  timestamp: number;
  pointerId?: number;
  pointerType?: string;
}

export interface GlobeContext {
  globeRef: React.RefObject<unknown>;
  camera: THREE.Camera | null;
  scene: THREE.Scene | null;
  raycaster: THREE.Raycaster;
  intersectionPoint: THREE.Vector3 | null;
  surfaceCoordinates: { lat: number; lng: number } | null;
  zoomLevel: number;
  bearingDegrees: number;
}

export interface InputResult {
  handled: boolean;
  action?: string;
  data?: Record<string, unknown>;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export abstract class InputHandler {
  public abstract priority: number;
  public abstract supportedModes: InteractionMode[];
  
  abstract canHandle(event: InputEvent, mode: InteractionMode, context: GlobeContext): boolean;
  abstract handleInput(event: InputEvent, mode: InteractionMode, context: GlobeContext): InputResult;
  
  protected isInSupportedMode(mode: InteractionMode): boolean {
    return this.supportedModes.includes(mode);
  }
  
  protected createResult(
    handled: boolean, 
    action?: string, 
    data?: Record<string, unknown>,
    preventDefault = false,
    stopPropagation = false
  ): InputResult {
    return { handled, action, data, preventDefault, stopPropagation };
  }
}

// Navigation Handler - Highest priority for globe control
export class NavigationInputHandler extends InputHandler {
  public priority = 100;
  public supportedModes = [
    InteractionMode.NAVIGATION,
    InteractionMode.TACTICAL_OVERLAY // Also allow navigation in tactical mode
  ];
  
  private isDragging = false;
  private dragStartPosition: { x: number; y: number } | null = null;
  private dragThreshold = 5; // pixels
  
  canHandle(event: InputEvent, mode: InteractionMode): boolean {
    if (!this.isInSupportedMode(mode)) return false;
    
    // Handle all pointer events for navigation
    return event.type.startsWith('pointer') || event.type === 'wheel';
  }
  
  handleInput(event: InputEvent, mode: InteractionMode, context: GlobeContext): InputResult {
    switch (event.type) {
      case 'pointerdown':
        return this.handlePointerDown(event);
        
      case 'pointermove':
        return this.handlePointerMove(event, context);
        
      case 'pointerup':
      case 'pointerleave':
        return this.handlePointerUp(event);
        
      case 'wheel':
        return this.handleWheel(event, context);
        
      default:
        return this.createResult(false);
    }
  }
  
  private handlePointerDown(event: InputEvent): InputResult {
    if (event.button === 0) { // Left button
      this.isDragging = false;
      this.dragStartPosition = { x: event.position.x, y: event.position.y };
      return this.createResult(true, 'navigation_start', { 
        startPosition: this.dragStartPosition 
      });
    }
    return this.createResult(false);
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handlePointerMove(event: InputEvent, _context: GlobeContext): InputResult {
    if (!this.dragStartPosition) return this.createResult(false);
    
    const dragDistance = Math.sqrt(
      Math.pow(event.position.x - this.dragStartPosition.x, 2) +
      Math.pow(event.position.y - this.dragStartPosition.y, 2)
    );
    
    if (!this.isDragging && dragDistance > this.dragThreshold) {
      this.isDragging = true;
      return this.createResult(true, 'navigation_drag_start', {
        dragDistance,
        startPosition: this.dragStartPosition,
        currentPosition: event.position
      }, true, true);
    }
    
    if (this.isDragging) {
      return this.createResult(true, 'navigation_drag', {
        startPosition: this.dragStartPosition,
        currentPosition: event.position,
        deltaX: event.position.x - this.dragStartPosition.x,
        deltaY: event.position.y - this.dragStartPosition.y
      }, true, true);
    }
    
    return this.createResult(false);
  }
  
  private handlePointerUp(event: InputEvent): InputResult {
    const wasDragging = this.isDragging;
    this.isDragging = false;
    this.dragStartPosition = null;
    
    if (wasDragging) {
      return this.createResult(true, 'navigation_drag_end', {
        endPosition: event.position
      });
    } else {
      return this.createResult(true, 'navigation_end', {
        endPosition: event.position
      });
    }
  }
  
  private handleWheel(event: InputEvent, context: GlobeContext): InputResult {
    return this.createResult(true, 'navigation_zoom', {
      delta: event.deltaY,
      position: event.position,
      currentZoom: context.zoomLevel
    }, true);
  }
}

// Intel Placement Handler - High priority for placement actions
export class IntelPlacementInputHandler extends InputHandler {
  public priority = 90;
  public supportedModes = [InteractionMode.INTEL_PLACEMENT];
  
  canHandle(event: InputEvent, mode: InteractionMode, context: GlobeContext): boolean {
    if (!this.isInSupportedMode(mode)) return false;
    
    // Only handle pointer events over the globe surface
    return event.type.startsWith('pointer') && context.intersectionPoint !== null;
  }
  
  handleInput(event: InputEvent, mode: InteractionMode, context: GlobeContext): InputResult {
    switch (event.type) {
      case 'pointerdown':
        if (event.button === 0 && context.surfaceCoordinates) { // Left click
          return this.createResult(true, 'intel_place_start', {
            coordinates: context.surfaceCoordinates,
            worldPosition: context.intersectionPoint
          });
        }
        break;
        
      case 'pointerup':
        if (event.button === 0 && context.surfaceCoordinates) {
          return this.createResult(true, 'intel_place_confirm', {
            coordinates: context.surfaceCoordinates,
            worldPosition: context.intersectionPoint
          }, true, true);
        }
        break;
        
      case 'pointermove':
        if (context.surfaceCoordinates) {
          return this.createResult(true, 'intel_place_preview', {
            coordinates: context.surfaceCoordinates,
            worldPosition: context.intersectionPoint
          });
        }
        break;
    }
    
    return this.createResult(false);
  }
}

// Intel Inspection Handler - Medium priority for existing intel
export class IntelInspectionInputHandler extends InputHandler {
  public priority = 80;
  public supportedModes = [InteractionMode.INTEL_INSPECTION];
  
  private hoveredIntel: string | null = null;
  private hoverStartTime = 0;
  private readonly hoverDelay = 500; // ms
  
  canHandle(event: InputEvent, mode: InteractionMode): boolean {
    return this.isInSupportedMode(mode) && event.type.startsWith('pointer');
  }
  
  handleInput(event: InputEvent, mode: InteractionMode, context: GlobeContext): InputResult {
    // TODO: Implement raycasting to find intel report models
    // This would intersect with the 3D models representing intel reports
    
    switch (event.type) {
      case 'pointermove':
        return this.handleHover(event, context);
        
      case 'pointerdown':
        if (event.button === 0 && this.hoveredIntel) {
          return this.createResult(true, 'intel_select', {
            intelId: this.hoveredIntel
          });
        }
        break;
        
      case 'pointerup':
        if (event.button === 0 && this.hoveredIntel) {
          return this.createResult(true, 'intel_open_details', {
            intelId: this.hoveredIntel
          }, true, true);
        }
        break;
    }
    
    return this.createResult(false);
  }
  
  private handleHover(event: InputEvent, context: GlobeContext): InputResult {
    // TODO: Implement proper intel model intersection
    const intersectedIntel = this.findIntersectedIntel(context);
    
    if (intersectedIntel !== this.hoveredIntel) {
      if (this.hoveredIntel) {
        // Clear previous hover
        const clearResult = this.createResult(true, 'intel_hover_end', {
          intelId: this.hoveredIntel
        });
        this.hoveredIntel = null;
        return clearResult;
      }
      
      if (intersectedIntel) {
        // Start new hover
        this.hoveredIntel = intersectedIntel;
        this.hoverStartTime = event.timestamp;
        return this.createResult(true, 'intel_hover_start', {
          intelId: intersectedIntel
        });
      }
    }
    
    return this.createResult(false);
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private findIntersectedIntel(_context: GlobeContext): string | null {
    // TODO: Implement actual raycasting logic
    // This would use context.raycaster to intersect with intel model meshes
    return null;
  }
}

// Measurement Handler - Medium priority for measurement tools
export class MeasurementInputHandler extends InputHandler {
  public priority = 70;
  public supportedModes = [InteractionMode.MEASUREMENT];
  
  private measurementState: 'idle' | 'measuring' | 'complete' = 'idle';
  private startPoint: { lat: number; lng: number } | null = null;
  
  canHandle(event: InputEvent, mode: InteractionMode, context: GlobeContext): boolean {
    return this.isInSupportedMode(mode) && 
           event.type.startsWith('pointer') && 
           context.surfaceCoordinates !== null;
  }
  
  handleInput(event: InputEvent, mode: InteractionMode, context: GlobeContext): InputResult {
    if (!context.surfaceCoordinates) return this.createResult(false);
    
    switch (event.type) {
      case 'pointerdown':
        if (event.button === 0) {
          return this.startMeasurement(context.surfaceCoordinates);
        }
        break;
        
      case 'pointermove':
        if (this.measurementState === 'measuring' && this.startPoint) {
          return this.updateMeasurement(context.surfaceCoordinates);
        }
        break;
        
      case 'pointerup':
        if (event.button === 0 && this.measurementState === 'measuring') {
          return this.completeMeasurement(context.surfaceCoordinates);
        }
        break;
    }
    
    return this.createResult(false);
  }
  
  private startMeasurement(coordinates: { lat: number; lng: number }): InputResult {
    this.startPoint = coordinates;
    this.measurementState = 'measuring';
    return this.createResult(true, 'measurement_start', {
      startPoint: coordinates
    });
  }
  
  private updateMeasurement(coordinates: { lat: number; lng: number }): InputResult {
    if (!this.startPoint) return this.createResult(false);
    
    const distance = this.calculateDistance(this.startPoint, coordinates);
    return this.createResult(true, 'measurement_update', {
      startPoint: this.startPoint,
      endPoint: coordinates,
      distance
    });
  }
  
  private completeMeasurement(coordinates: { lat: number; lng: number }): InputResult {
    if (!this.startPoint) return this.createResult(false);
    
    const distance = this.calculateDistance(this.startPoint, coordinates);
    this.measurementState = 'complete';
    
    return this.createResult(true, 'measurement_complete', {
      startPoint: this.startPoint,
      endPoint: coordinates,
      distance
    }, true, true);
  }
  
  private calculateDistance(start: { lat: number; lng: number }, end: { lat: number; lng: number }): number {
    // Haversine formula for great circle distance
    const R = 6371000; // Earth's radius in meters
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lng - start.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
