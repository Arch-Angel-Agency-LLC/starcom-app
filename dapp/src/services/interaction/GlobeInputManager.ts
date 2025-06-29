// GlobeInputManager.ts
// Central input management system for 3D globe interactions

import { InteractionMode, getModeConfig } from './InteractionMode';
import { 
  InputHandler, 
  InputEvent, 
  GlobeContext, 
  InputResult,
  NavigationInputHandler,
  IntelPlacementInputHandler,
  IntelInspectionInputHandler,
  MeasurementInputHandler
} from './InputHandler';
import * as THREE from 'three';

export interface GlobeInputManagerConfig {
  enableDebugLogging?: boolean;
  enableHapticFeedback?: boolean;
  touchSensitivity?: number;
}

export type InputAction = 
  | 'navigation_start' | 'navigation_drag' | 'navigation_drag_start' | 'navigation_drag_end' | 'navigation_end' | 'navigation_zoom'
  | 'intel_place_start' | 'intel_place_preview' | 'intel_place_confirm'
  | 'intel_hover_start' | 'intel_hover_end' | 'intel_select' | 'intel_open_details'
  | 'measurement_start' | 'measurement_update' | 'measurement_complete';

export interface ActionEvent {
  action: InputAction;
  data: Record<string, unknown>;
  timestamp: number;
  mode: InteractionMode;
}

export type ActionCallback = (event: ActionEvent) => void;

export class GlobeInputManager {
  private currentMode: InteractionMode = InteractionMode.NAVIGATION;
  private handlers: Map<InteractionMode, InputHandler[]> = new Map();
  private actionCallbacks: Map<InputAction, ActionCallback[]> = new Map();
  private config: GlobeInputManagerConfig;
  private isEnabled = true;
  private containerElement: HTMLElement | null = null;
  private boundEventHandlers: Map<string, EventListener> = new Map();
  
  constructor(config: GlobeInputManagerConfig = {}) {
    this.config = {
      enableDebugLogging: false,
      enableHapticFeedback: false,
      touchSensitivity: 1.0,
      ...config
    };
    
    this.initializeHandlers();
  }
  
  // Initialize all input handlers
  private initializeHandlers(): void {
    const navigationHandler = new NavigationInputHandler();
    const intelPlacementHandler = new IntelPlacementInputHandler();
    const intelInspectionHandler = new IntelInspectionInputHandler();
    const measurementHandler = new MeasurementInputHandler();
    
    // Register handlers for their supported modes
    this.registerHandler(navigationHandler);
    this.registerHandler(intelPlacementHandler);
    this.registerHandler(intelInspectionHandler);
    this.registerHandler(measurementHandler);
  }
  
  // Register a handler for its supported modes
  private registerHandler(handler: InputHandler): void {
    handler.supportedModes.forEach(mode => {
      if (!this.handlers.has(mode)) {
        this.handlers.set(mode, []);
      }
      this.handlers.get(mode)!.push(handler);
      
      // Sort by priority (highest first)
      this.handlers.get(mode)!.sort((a, b) => b.priority - a.priority);
    });
  }
  
  // Set the container element for event listening
  setContainer(element: HTMLElement | null): void {
    if (this.containerElement) {
      this.removeEventListeners();
    }
    
    this.containerElement = element;
    
    if (element) {
      this.addEventListeners();
    }
  }
  
  // Add event listeners to container
  private addEventListeners(): void {
    if (!this.containerElement) return;
    
    const events = [
      'pointerdown', 'pointermove', 'pointerup', 'pointerleave',
      'wheel', 'keydown', 'keyup', 'contextmenu'
    ];
    
    events.forEach(eventType => {
      const handler = this.createEventHandler(eventType);
      this.boundEventHandlers.set(eventType, handler);
      this.containerElement!.addEventListener(eventType, handler);
    });
  }
  
  // Remove event listeners from container
  private removeEventListeners(): void {
    if (!this.containerElement) return;
    
    this.boundEventHandlers.forEach((handler, eventType) => {
      this.containerElement!.removeEventListener(eventType, handler);
    });
    this.boundEventHandlers.clear();
  }
  
  // Create event handler for specific event type
  private createEventHandler(eventType: string): EventListener {
    return (event: Event) => {
      if (!this.isEnabled) return;
      
      const inputEvent = this.convertToInputEvent(event, eventType);
      if (inputEvent) {
        this.processInputEvent(inputEvent);
      }
    };
  }
  
  // Convert DOM event to InputEvent
  private convertToInputEvent(event: Event, eventType: string): InputEvent | null {
    if (!this.containerElement) return null;
    
    const rect = this.containerElement.getBoundingClientRect();
    let position = { x: 0, y: 0 };
    let normalizedPosition = { x: 0, y: 0 };
    
    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      normalizedPosition = {
        x: (position.x / rect.width) * 2 - 1,
        y: -(position.y / rect.height) * 2 + 1
      };
    }
    
    const inputEvent: InputEvent = {
      type: eventType as InputEvent['type'],
      position,
      normalizedPosition,
      timestamp: performance.now()
    };
    
    // Add event-specific properties
    if (event instanceof PointerEvent) {
      inputEvent.button = event.button;
      inputEvent.buttons = event.buttons;
      inputEvent.pointerId = event.pointerId;
      inputEvent.pointerType = event.pointerType;
    } else if (event instanceof MouseEvent) {
      inputEvent.button = event.button;
      inputEvent.buttons = event.buttons;
    } else if (event instanceof WheelEvent) {
      inputEvent.deltaY = event.deltaY;
    } else if (event instanceof KeyboardEvent) {
      inputEvent.key = event.key;
      inputEvent.ctrlKey = event.ctrlKey;
      inputEvent.shiftKey = event.shiftKey;
      inputEvent.altKey = event.altKey;
    }
    
    return inputEvent;
  }
  
  // Process input event through handler chain
  private processInputEvent(event: InputEvent): void {
    const context = this.createGlobeContext(event);
    const handlers = this.handlers.get(this.currentMode) || [];
    
    for (const handler of handlers) {
      if (handler.canHandle(event, this.currentMode, context)) {
        const result = handler.handleInput(event, this.currentMode, context);
        
        if (result.handled) {
          this.handleInputResult(result, event);
          
          if (result.preventDefault || result.stopPropagation) {
            break; // Stop processing
          }
        }
      }
    }
  }
  
  // Create globe context for handlers
  private createGlobeContext(event: InputEvent): GlobeContext {
    // TODO: This should be injected from the actual globe component
    // For now, create a minimal context
    return {
      globeRef: { current: null },
      camera: null,
      scene: null,
      raycaster: new THREE.Raycaster(),
      intersectionPoint: null,
      surfaceCoordinates: null,
      zoomLevel: 1,
      bearingDegrees: 0
    };
  }
  
  // Handle the result of input processing
  private handleInputResult(result: InputResult, event: InputEvent): void {
    if (result.action) {
      this.emitAction(result.action as InputAction, result.data || {});
    }
    
    if (this.config.enableDebugLogging) {
      console.log('🎮 Input processed:', {
        mode: this.currentMode,
        action: result.action,
        eventType: event.type,
        timestamp: event.timestamp
      });
    }
  }
  
  // Emit action to registered callbacks
  private emitAction(action: InputAction, data: Record<string, unknown>): void {
    const actionEvent: ActionEvent = {
      action,
      data,
      timestamp: performance.now(),
      mode: this.currentMode
    };
    
    const callbacks = this.actionCallbacks.get(action) || [];
    callbacks.forEach(callback => {
      try {
        callback(actionEvent);
      } catch (error) {
        console.error('Error in action callback:', error);
      }
    });
  }
  
  // Public API methods
  
  setMode(mode: InteractionMode): void {
    if (mode !== this.currentMode) {
      const oldMode = this.currentMode;
      this.currentMode = mode;
      
      if (this.config.enableDebugLogging) {
        console.log('🎮 Mode changed:', { from: oldMode, to: mode });
      }
      
      this.emitAction('mode_changed' as InputAction, { 
        fromMode: oldMode, 
        toMode: mode 
      });
    }
  }
  
  getCurrentMode(): InteractionMode {
    return this.currentMode;
  }
  
  getModeConfig() {
    return getModeConfig(this.currentMode);
  }
  
  onAction(action: InputAction, callback: ActionCallback): () => void {
    if (!this.actionCallbacks.has(action)) {
      this.actionCallbacks.set(action, []);
    }
    this.actionCallbacks.get(action)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.actionCallbacks.get(action) || [];
      const index = callbacks.indexOf(callback);
      if (index >= 0) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  isCurrentlyEnabled(): boolean {
    return this.isEnabled;
  }
  
  updateConfig(config: Partial<GlobeInputManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  // Cleanup
  destroy(): void {
    this.removeEventListeners();
    this.handlers.clear();
    this.actionCallbacks.clear();
    this.boundEventHandlers.clear();
  }
}
