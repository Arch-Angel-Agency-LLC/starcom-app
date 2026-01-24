/**
 * Real-Time Event System for Multi-Agency Collaboration
 * Connects collaboration events to UI updates and handles real-time synchronization
 */

import { SyncEvent, CollaborationNotification } from '../types';
import { playNotificationTone, type NotificationTone } from './audio/notificationAudio';

export type UIEventType = 
  | 'UI_UPDATE_ANNOTATION'
  | 'UI_UPDATE_SESSION_STATUS'
  | 'UI_SHOW_NOTIFICATION'
  | 'UI_UPDATE_CONTEXT'
  | 'UI_UPDATE_PARTICIPANT_STATUS'
  | 'UI_TRIGGER_SOUND'
  | 'UI_FLASH_INDICATOR';

export interface UIUpdateEvent {
  type: UIEventType;
  payload: unknown;
  source: 'collaboration' | 'system' | 'user';
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface EventSubscription {
  id: string;
  eventTypes: string[];
  callback: (event: UIUpdateEvent) => void;
  priority: number;
}

type LoopTelemetryEvent =
  | { type: 'batch_processed'; processed: number; remaining: number; delayMs: number }
  | { type: 'idle_sleep'; delayMs: number }
  | { type: 'slow_handler_backoff'; durationMs: number; backoffMs: number }
  | { type: 'loop_tick'; durationMs: number; delayMs: number };

export class RealTimeEventSystem {
  private static instance: RealTimeEventSystem;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventQueue: UIUpdateEvent[] = [];
  private isProcessing = false;
  private soundEnabled = true;
  private notificationBadgeElement: HTMLElement | null = null;
  private loopTimer: number | null = null;
  private backoffMs = 0;
  private readonly baseIntervalMs = 100;
  private readonly idleIntervalMs = 400;
  private readonly slowHandlerThresholdMs = 24;
  private onLoopTelemetry?: (event: LoopTelemetryEvent) => void;

  public static getInstance(): RealTimeEventSystem {
    if (!RealTimeEventSystem.instance) {
      RealTimeEventSystem.instance = new RealTimeEventSystem();
    }
    return RealTimeEventSystem.instance;
  }

  private emitLoopTelemetry(event: LoopTelemetryEvent): void {
    try {
      this.onLoopTelemetry?.(event);
    } catch (error) {
      console.warn('Loop telemetry handler threw', error);
    }
  }

  public setLoopTelemetryHandler(handler: (event: LoopTelemetryEvent) => void): void {
    this.onLoopTelemetry = handler;
  }

  private constructor() {
    this.startEventProcessor();
    this.initializeBadgeElement();
  }

  /**
   * Subscribe to specific event types with a callback
   */
  public subscribe(
    id: string,
    eventTypes: string[],
    callback: (event: UIUpdateEvent) => void,
    priority = 0
  ): () => void {
    const subscription: EventSubscription = {
      id,
      eventTypes,
      callback,
      priority
    };

    this.subscriptions.set(id, subscription);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(id);
    };
  }

  /**
   * Emit a UI update event
   */
  public emit(event: UIUpdateEvent): void {
    this.eventQueue.push(event);
    if (this.loopTimer === null) {
      this.scheduleLoop(0);
    }
  }

  /**
   * Convert collaboration events to UI update events
   */
  public processCollaborationEvent(event: SyncEvent): void {
    switch (event.type) {
      case 'ANNOTATION_ADD':
        this.emit({
          type: 'UI_UPDATE_ANNOTATION',
          payload: {
            annotationId: event.data.annotationId,
            content: event.data.content,
            position: event.data.position,
            operatorId: event.operatorId
          },
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'normal'
        });
        
        this.emit({
          type: 'UI_SHOW_NOTIFICATION',
          payload: {
            title: 'New Annotation',
            message: `New annotation added: ${event.data.content}`,
            type: 'info',
            duration: 5000
          },
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'normal'
        });
        break;

      case 'MESSAGE':
        this.emit({
          type: 'UI_SHOW_NOTIFICATION',
          payload: {
            title: 'New Message',
            message: event.data.content,
            type: 'info',
            duration: 4000
          },
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'normal'
        });
        
        this.emit({
          type: 'UI_TRIGGER_SOUND',
          payload: { soundType: 'message' },
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'low'
        });
        break;

      case 'CONTEXT_UPDATE':
        this.emit({
          type: 'UI_UPDATE_CONTEXT',
          payload: event.data,
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'high'
        });
        break;

      case 'PARTICIPANT_JOIN':
        this.emit({
          type: 'UI_UPDATE_PARTICIPANT_STATUS',
          payload: {
            operatorId: event.data.operatorId,
            action: 'join',
            sessionId: event.data.sessionId
          },
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'normal'
        });

        this.emit({
          type: 'UI_SHOW_NOTIFICATION',
          payload: {
            title: 'Participant Joined',
            message: 'A new operator has joined the session',
            type: 'success',
            duration: 3000
          },
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'low'
        });
        break;

      case 'PARTICIPANT_LEAVE':
        this.emit({
          type: 'UI_UPDATE_PARTICIPANT_STATUS',
          payload: {
            operatorId: event.data.operatorId,
            action: 'leave',
            sessionId: event.data.sessionId
          },
          source: 'collaboration',
          timestamp: new Date(),
          priority: 'normal'
        });
        break;

      default:
        console.log('Unhandled collaboration event type:', event.type);
    }
  }

  /**
   * Process notification events specifically
   */
  public processNotificationEvent(notification: CollaborationNotification): void {
    const priority = notification.actionRequired ? 'high' : 'normal';
    
    this.emit({
      type: 'UI_SHOW_NOTIFICATION',
      payload: {
        title: notification.title,
        message: notification.message,
        type: this.getNotificationUIType(notification.type),
        duration: notification.actionRequired ? 8000 : 5000,
        actionUrl: notification.actionUrl
      },
      source: 'collaboration',
      timestamp: new Date(),
      priority: priority as 'normal' | 'high'
    });

    // Update notification badge
    this.updateNotificationBadge();

    // Play sound for high priority notifications
    if (notification.actionRequired) {
      this.emit({
        type: 'UI_TRIGGER_SOUND',
        payload: { soundType: 'alert' },
        source: 'collaboration',
        timestamp: new Date(),
        priority: 'normal'
      });
    }
  }

  /**
   * Start the event processor
   */
  private startEventProcessor(): void {
    this.scheduleLoop(this.baseIntervalMs);
  }

  private scheduleLoop(delay: number): void {
    if (this.loopTimer !== null) return;
    this.loopTimer = window.setTimeout(() => {
      this.loopTimer = null;
      this.tickEventLoop();
    }, delay);
  }

  private tickEventLoop(): void {
    const start = performance.now();
    const processed = this.processEventQueue();
    const duration = performance.now() - start;

    if (duration > this.slowHandlerThresholdMs) {
      this.backoffMs = Math.min(1000, Math.max(this.baseIntervalMs * 2, this.backoffMs * 2 || this.baseIntervalMs * 2));
      this.emitLoopTelemetry({ type: 'slow_handler_backoff', durationMs: duration, backoffMs: this.backoffMs });
    } else {
      this.backoffMs = 0;
    }

    let nextDelay = this.backoffMs || this.baseIntervalMs;

    if (processed === 0 && this.eventQueue.length === 0) {
      nextDelay = Math.max(nextDelay, this.idleIntervalMs);
      this.emitLoopTelemetry({ type: 'idle_sleep', delayMs: nextDelay });
    } else if (this.eventQueue.length > 0) {
      nextDelay = Math.min(nextDelay, 50);
    }

    if (processed > 0) {
      this.emitLoopTelemetry({ type: 'batch_processed', processed, remaining: this.eventQueue.length, delayMs: nextDelay });
    }

    this.emitLoopTelemetry({ type: 'loop_tick', durationMs: duration, delayMs: nextDelay });

    this.scheduleLoop(nextDelay);
  }

  /**
   * Process the event queue
   */
  private processEventQueue(): number {
    if (this.isProcessing || this.eventQueue.length === 0) return 0;

    this.isProcessing = true;

    // Sort by priority and timestamp
    this.eventQueue.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, normal: 1, low: 0 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    const batchSize = Math.min(10, Math.max(1, Math.ceil(this.eventQueue.length / 2)));

    const eventsToProcess = this.eventQueue.splice(0, batchSize);
    eventsToProcess.forEach(event => {
      this.processEvent(event);
    });

    this.isProcessing = false;
    return eventsToProcess.length;
  }

  /**
   * Process a single event
   */
  private processEvent(event: UIUpdateEvent): void {
    // Get matching subscriptions
    const matchingSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.eventTypes.includes(event.type))
      .sort((a, b) => b.priority - a.priority);

    // Execute callbacks
    matchingSubscriptions.forEach(subscription => {
      try {
        subscription.callback(event);
      } catch (error) {
        console.error(`Error in event subscription ${subscription.id}:`, error);
      }
    });

    // Handle system-level UI updates
    this.handleSystemUIUpdates(event);
  }

  /**
   * Handle system-level UI updates
   */
  private handleSystemUIUpdates(event: UIUpdateEvent): void {
    switch (event.type) {
      case 'UI_TRIGGER_SOUND':
        this.playNotificationSound(event.payload as { soundType: string });
        break;
      
      case 'UI_FLASH_INDICATOR':
        this.flashElement(event.payload as { element: string; color: string; duration: number });
        break;

      case 'UI_SHOW_NOTIFICATION':
        this.showSystemNotification(event.payload as {
          title: string;
          message: string;
          type: string;
          duration: number;
          actionUrl?: string;
        });
        break;
    }
  }

  /**
   * Play notification sounds
   */
  private playNotificationSound(payload: { soundType: string }): void {
    if (!this.soundEnabled) return;

    try {
      const tone = this.getNotificationTone(payload.soundType);
      playNotificationTone(tone);
    } catch (error) {
      console.warn('Audio not available:', error);
    }
  }

  private getNotificationTone(soundType: string): NotificationTone {
    switch (soundType) {
      case 'message':
        return { frequency: 800, duration: 0.18 };
      case 'alert':
        return { frequency: 1000, duration: 0.24, gain: 0.1, type: 'square' };
      default:
        return { frequency: 600, duration: 0.16 };
    }
  }

  /**
   * Flash UI elements
   */
  private flashElement(payload: { element: string; color: string; duration: number }): void {
    const element = document.querySelector(`[data-flash-id="${payload.element}"]`);
    if (!element) return;

    const originalBoxShadow = (element as HTMLElement).style.boxShadow;
    
    (element as HTMLElement).style.boxShadow = `0 0 10px ${payload.color}`;
    (element as HTMLElement).style.transition = 'box-shadow 0.3s ease';

    setTimeout(() => {
      (element as HTMLElement).style.boxShadow = originalBoxShadow;
    }, payload.duration);
  }

  /**
   * Show system notifications
   */
  private showSystemNotification(payload: {
    title: string;
    message: string;
    type: string;
    duration: number;
    actionUrl?: string;
  }): void {
    // This would integrate with a notification system component
    console.log('System notification:', payload);
    
    // In a real implementation, this would trigger a notification component
    // For now, we'll emit a custom event that notification components can listen to
    window.dispatchEvent(new CustomEvent('starcom-notification', { 
      detail: payload 
    }));
  }

  /**
   * Initialize notification badge element reference
   */
  private initializeBadgeElement(): void {
    // This would find the notification badge element in the UI
    setTimeout(() => {
      this.notificationBadgeElement = document.querySelector('[data-notification-badge]');
    }, 1000);
  }

  /**
   * Update notification badge
   */
  private updateNotificationBadge(): void {
    if (this.notificationBadgeElement) {
      this.notificationBadgeElement.classList.add('pulse');
      setTimeout(() => {
        this.notificationBadgeElement?.classList.remove('pulse');
      }, 1000);
    }
  }

  /**
   * Convert collaboration notification type to UI notification type
   */
  private getNotificationUIType(type: string): string {
    switch (type) {
      case 'ASSET_AVAILABLE':
      case 'ASSET_PURCHASE':
        return 'success';
      case 'CONTEXT_SHARE':
      case 'MESSAGE':
        return 'info';
      case 'SESSION_INVITE':
        return 'warning';
      default:
        return 'info';
    }
  }

  /**
   * Toggle sound on/off
   */
  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Get current sound setting
   */
  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Clear all subscriptions and reset
   */
  public reset(): void {
    this.subscriptions.clear();
    this.eventQueue = [];
    this.isProcessing = false;
  }
}

export default RealTimeEventSystem;
