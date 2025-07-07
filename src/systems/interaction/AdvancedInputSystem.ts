// AdvancedInputSystem.ts - Professional Input Handling for 3D Globe
// Inspired by game engine input systems with gesture recognition

// Input event types
export interface InputEvent {
  type: 'mouse' | 'touch' | 'keyboard' | 'gamepad';
  action: string;
  position?: { x: number; y: number };
  delta?: { x: number; y: number };
  pressure?: number;
  timestamp: number;
  modifiers: string[];
  originalEvent: Event;
}

// Gesture recognition for touch interfaces
export interface GestureEvent {
  type: 'tap' | 'double_tap' | 'long_press' | 'swipe' | 'pinch' | 'rotate';
  position: { x: number; y: number };
  delta?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  velocity?: { x: number; y: number };
  timestamp: number;
}

// Input state tracking (like game engine input buffers)
interface InputState {
  isMouseDown: boolean;
  mousePosition: { x: number; y: number };
  mouseStartPosition: { x: number; y: number };
  mouseDelta: { x: number; y: number };
  mouseDownTime: number;
  dragDistance: number;
  isDragging: boolean;
  
  // Touch state
  touches: Map<number, { position: { x: number; y: number }; startTime: number }>;
  lastTouchEvent?: TouchEvent;
  
  // Keyboard state
  pressedKeys: Set<string>;
  keyHoldTimes: Map<string, number>;
  
  // Gesture state
  lastTap?: { position: { x: number; y: number }; timestamp: number };
  gestureInProgress?: GestureEvent;
}

// Advanced input configuration
export interface InputSystemConfig {
  dragThreshold: number;           // Minimum pixels to register as drag
  tapThreshold: number;            // Maximum pixels for tap
  doubleTapWindow: number;         // Time window for double tap (ms)
  longPressDelay: number;          // Time for long press (ms)
  swipeThreshold: number;          // Minimum velocity for swipe
  pinchThreshold: number;          // Minimum scale change for pinch
  
  // Debouncing
  hoverDebounce: number;           // Hover event debouncing (ms)
  clickDebounce: number;           // Click event debouncing (ms)
  
  // Platform-specific
  enableTouchGestures: boolean;
  enableMouseGestures: boolean;
  enableKeyboardShortcuts: boolean;
  
  // Accessibility
  reduceMotion: boolean;
  highContrast: boolean;
  largeTargets: boolean;
}

export class AdvancedInputSystem {
  private state: InputState;
  private config: InputSystemConfig;
  private listeners: Map<string, Array<(event: InputEvent | GestureEvent) => void>> = new Map();
  private element: HTMLElement | null = null;
  private animationFrame: number | null = null;
  
  // Input timing for advanced gesture recognition
  private inputHistory: Array<{ event: InputEvent; timestamp: number }> = [];
  private gestureRecognizer: GestureRecognizer;
  
  constructor(config: Partial<InputSystemConfig> = {}) {
    this.config = {
      dragThreshold: 5,
      tapThreshold: 3,
      doubleTapWindow: 300,
      longPressDelay: 500,
      swipeThreshold: 100,
      pinchThreshold: 0.1,
      hoverDebounce: 50,
      clickDebounce: 100,
      enableTouchGestures: true,
      enableMouseGestures: true,
      enableKeyboardShortcuts: true,
      reduceMotion: false,
      highContrast: false,
      largeTargets: false,
      ...config
    };
    
    this.state = {
      isMouseDown: false,
      mousePosition: { x: 0, y: 0 },
      mouseStartPosition: { x: 0, y: 0 },
      mouseDelta: { x: 0, y: 0 },
      mouseDownTime: 0,
      dragDistance: 0,
      isDragging: false,
      touches: new Map(),
      pressedKeys: new Set(),
      keyHoldTimes: new Map()
    };
    
    this.gestureRecognizer = new GestureRecognizer(this.config);
  }
  
  // Initialize input system on an element
  initialize(element: HTMLElement): void {
    this.element = element;
    this.attachEventListeners();
    this.startInputLoop();
  }
  
  // Clean up
  destroy(): void {
    this.detachEventListeners();
    this.stopInputLoop();
  }
  
  private attachEventListeners(): void {
    if (!this.element) return;
    
    // Mouse events
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.element.addEventListener('wheel', this.handleWheel.bind(this));
    this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // Touch events (for mobile/tablet support)
    if (this.config.enableTouchGestures) {
      this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
      this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
      this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    }
    
    // Keyboard events
    if (this.config.enableKeyboardShortcuts) {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
  }
  
  private detachEventListeners(): void {
    if (!this.element) return;
    
    // Mouse events
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.element.removeEventListener('wheel', this.handleWheel.bind(this));
    this.element.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // Touch events
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    // Keyboard events
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
  
  // Mouse event handlers
  private handleMouseDown(event: MouseEvent): void {
    const inputEvent = this.createInputEvent('mouse', 'down', event);
    this.updateMouseState(event, 'down');
    this.emit('mouse_down', inputEvent);
    
    // Start gesture recognition
    this.gestureRecognizer.onPointerDown(inputEvent);
  }
  
  private handleMouseMove(event: MouseEvent): void {
    const inputEvent = this.createInputEvent('mouse', 'move', event);
    this.updateMouseState(event, 'move');
    this.emit('mouse_move', inputEvent);
    
    // Update gesture recognition
    this.gestureRecognizer.onPointerMove(inputEvent);
  }
  
  private handleMouseUp(event: MouseEvent): void {
    const inputEvent = this.createInputEvent('mouse', 'up', event);
    this.updateMouseState(event, 'up');
    this.emit('mouse_up', inputEvent);
    
    // Complete gesture recognition
    this.gestureRecognizer.onPointerUp(inputEvent);
  }
  
  private handleMouseLeave(event: MouseEvent): void {
    const inputEvent = this.createInputEvent('mouse', 'leave', event);
    this.resetMouseState();
    this.emit('mouse_leave', inputEvent);
  }
  
  private handleWheel(event: WheelEvent): void {
    const inputEvent = this.createInputEvent('mouse', 'wheel', event);
    this.emit('mouse_wheel', inputEvent);
  }
  
  private handleContextMenu(event: MouseEvent): void {
    const inputEvent = this.createInputEvent('mouse', 'context', event);
    this.emit('context_menu', inputEvent);
  }
  
  // Touch event handlers
  private handleTouchStart(event: TouchEvent): void {
    this.state.lastTouchEvent = event;
    this.gestureRecognizer.onTouchStart(event);
  }
  
  private handleTouchMove(event: TouchEvent): void {
    this.state.lastTouchEvent = event;
    this.gestureRecognizer.onTouchMove(event);
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    this.state.lastTouchEvent = event;
    this.gestureRecognizer.onTouchEnd(event);
  }
  
  private handleTouchCancel(event: TouchEvent): void {
    this.state.lastTouchEvent = event;
    this.gestureRecognizer.onTouchCancel(event);
  }
  
  // Keyboard event handlers
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.state.pressedKeys.add(key);
    this.state.keyHoldTimes.set(key, Date.now());
    
    const inputEvent = this.createInputEvent('keyboard', 'down', event);
    this.emit('key_down', inputEvent);
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.state.pressedKeys.delete(key);
    this.state.keyHoldTimes.delete(key);
    
    const inputEvent = this.createInputEvent('keyboard', 'up', event);
    this.emit('key_up', inputEvent);
  }
  
  // State management
  private updateMouseState(event: MouseEvent, action: string): void {
    const rect = this.element?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (action === 'down') {
      this.state.isMouseDown = true;
      this.state.mouseStartPosition = { x, y };
      this.state.mouseDownTime = Date.now();
      this.state.dragDistance = 0;
      this.state.isDragging = false;
    }
    
    this.state.mousePosition = { x, y };
    this.state.mouseDelta = {
      x: x - this.state.mouseStartPosition.x,
      y: y - this.state.mouseStartPosition.y
    };
    
    if (this.state.isMouseDown) {
      this.state.dragDistance = Math.sqrt(
        this.state.mouseDelta.x ** 2 + this.state.mouseDelta.y ** 2
      );
      this.state.isDragging = this.state.dragDistance > this.config.dragThreshold;
    }
    
    if (action === 'up') {
      this.resetMouseState();
    }
  }
  
  private resetMouseState(): void {
    this.state.isMouseDown = false;
    this.state.isDragging = false;
    this.state.dragDistance = 0;
  }
  
  // Event creation
  private createInputEvent(type: InputEvent['type'], action: string, originalEvent: Event): InputEvent {
    const modifiers: string[] = [];
    
    if (originalEvent instanceof MouseEvent || originalEvent instanceof KeyboardEvent) {
      if (originalEvent.ctrlKey) modifiers.push('ctrl');
      if (originalEvent.shiftKey) modifiers.push('shift');
      if (originalEvent.altKey) modifiers.push('alt');
      if (originalEvent instanceof MouseEvent && originalEvent.metaKey) modifiers.push('meta');
    }
    
    return {
      type,
      action,
      position: this.state.mousePosition,
      delta: this.state.mouseDelta,
      timestamp: Date.now(),
      modifiers,
      originalEvent
    };
  }
  
  // Event system
  on(eventType: string, listener: (event: InputEvent | GestureEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(listener);
  }
  
  off(eventType: string, listener: (event: InputEvent | GestureEvent) => void): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }
  
  private emit(eventType: string, event: InputEvent | GestureEvent): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(event));
    }
  }
  
  // Input loop for continuous state updates
  private startInputLoop(): void {
    const loop = () => {
      this.updateInputState();
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }
  
  private stopInputLoop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  private updateInputState(): void {
    // Update continuous states like key hold times
    const now = Date.now();
    this.state.keyHoldTimes.forEach((startTime, key) => {
      const holdTime = now - startTime;
      if (holdTime > this.config.longPressDelay) {
        this.emit('key_long_press', {
          type: 'keyboard',
          action: 'long_press',
          timestamp: now,
          modifiers: [],
          originalEvent: new KeyboardEvent('keydown', { key })
        } as InputEvent);
      }
    });
  }
  
  // Public API for getting current state
  getInputState(): Readonly<InputState> {
    return { ...this.state };
  }
  
  isKeyPressed(key: string): boolean {
    return this.state.pressedKeys.has(key.toLowerCase());
  }
  
  getMousePosition(): { x: number; y: number } {
    return { ...this.state.mousePosition };
  }
  
  isDragging(): boolean {
    return this.state.isDragging;
  }
}

// Gesture recognition system
class GestureRecognizer {
  private config: InputSystemConfig;
  private touchHistory: Array<{ touches: TouchList; timestamp: number }> = [];
  
  constructor(config: InputSystemConfig) {
    this.config = config;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerDown(_event: InputEvent): void {
    // Implement pointer gesture recognition
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_event: InputEvent): void {
    // Implement pointer gesture recognition
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerUp(_event: InputEvent): void {
    // Implement pointer gesture recognition
  }
  
  onTouchStart(event: TouchEvent): void {
    this.touchHistory.push({ touches: event.touches, timestamp: Date.now() });
  }
  
  onTouchMove(event: TouchEvent): void {
    this.touchHistory.push({ touches: event.touches, timestamp: Date.now() });
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTouchEnd(_event: TouchEvent): void {
    // Analyze touch history for gestures
    this.analyzeGestures();
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTouchCancel(_event: TouchEvent): void {
    this.touchHistory = [];
  }
  
  private analyzeGestures(): void {
    // Implement gesture analysis
    // This would analyze the touch history to detect:
    // - Taps, double taps
    // - Swipes with direction and velocity
    // - Pinch/zoom gestures
    // - Rotation gestures
    // - Multi-finger gestures
  }
}
