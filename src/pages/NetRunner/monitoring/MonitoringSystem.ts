/**
 * MonitoringSystem.ts
 * 
 * Core module for the NetRunner monitoring system that provides continuous
 * intelligence gathering, target tracking, and alert generation.
 */

import { v4 as uuidv4 } from 'uuid';
import { IntelType } from '../tools/NetRunnerPowerTools';

// Entity types that can be monitored
export type EntityType = 
  | 'person'           // Individual
  | 'organization'     // Group or company
  | 'system'           // Technical system
  | 'location'         // Physical location
  | 'digital'          // Digital asset/presence
  | 'network'          // Network of connected entities
  | 'custom';          // Custom entity type

// Monitoring target definition
export interface MonitoringTarget {
  id: string;                   // Unique target ID
  name: string;                 // Display name
  type: EntityType;             // Type of entity
  category: 'person' | 'organization' | 'system' | 'location' | 'digital' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;          // Target description
  identifiers: {                // Unique identifiers
    [key: string]: string;      // Type: value pairs
  };
  monitoringParams: {           // Monitoring configuration
    frequency: number;          // Check interval (minutes)
    sources: string[];          // Data sources to monitor
    keywords: string[];         // Relevant keywords
    startDate: string;          // Monitoring start date
    endDate?: string;           // Optional end date
    depth: 'surface' | 'standard' | 'deep'; // Monitoring depth
  };
  tags: string[];               // Organizational tags
  createdBy: string;            // Creator user ID
  created: string;              // Creation timestamp
  updated: string;              // Last update timestamp
  active: boolean;              // Whether monitoring is active
}

// Monitoring event definition
export interface MonitoringEvent {
  id: string;                   // Unique event ID
  targetId: string;             // Related target ID
  timestamp: string;            // Event time
  source: string;               // Event source
  type: 'change' | 'appearance' | 'disappearance' | 'activity' | 'mention' | 'custom';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;                // Event title
  description: string;          // Event description
  data: any;                    // Event data payload
  verified: boolean;            // Whether event is verified
  relatedEvents: string[];      // Related event IDs
  intelTypes: IntelType[];      // Types of intelligence
  alertGenerated: boolean;      // Whether an alert was generated
  processed: boolean;           // Whether event was processed
}

// Alert definition
export interface MonitoringAlert {
  id: string;                   // Unique alert ID
  eventIds: string[];           // Related event IDs
  targetId: string;             // Related target ID
  timestamp: string;            // Alert time
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;                // Alert title
  message: string;              // Alert message
  state: 'new' | 'acknowledged' | 'resolved' | 'false-positive';
  assignedTo?: string;          // User ID of assignee
  actions: string[];            // Recommended actions
  notificationsSent: boolean;   // Whether notifications were sent
  resolvedAt?: string;          // Resolution timestamp
  resolvedBy?: string;          // User ID of resolver
  notes?: string;               // Additional notes
}

// Target Manager for handling monitoring targets
export class TargetManager {
  private targets: Map<string, MonitoringTarget> = new Map();

  // Create a new monitoring target
  public createTarget(targetData: Omit<MonitoringTarget, 'id' | 'created' | 'updated'>): MonitoringTarget {
    const now = new Date().toISOString();
    const newTarget: MonitoringTarget = {
      ...targetData,
      id: uuidv4(),
      created: now,
      updated: now
    };
    this.targets.set(newTarget.id, newTarget);
    return newTarget;
  }

  // Get a target by ID
  public getTarget(id: string): MonitoringTarget | undefined {
    return this.targets.get(id);
  }

  // Update an existing target
  public updateTarget(id: string, updates: Partial<MonitoringTarget>): MonitoringTarget | null {
    const target = this.targets.get(id);
    if (!target) return null;

    const updatedTarget = {
      ...target,
      ...updates,
      updated: new Date().toISOString()
    };
    this.targets.set(id, updatedTarget);
    return updatedTarget;
  }

  // Delete a target
  public deleteTarget(id: string): boolean {
    return this.targets.delete(id);
  }

  // Get all targets
  public getAllTargets(): MonitoringTarget[] {
    return Array.from(this.targets.values());
  }

  // Filter targets by various criteria
  public filterTargets(criteria: Partial<MonitoringTarget>): MonitoringTarget[] {
    return this.getAllTargets().filter(target => {
      for (const [key, value] of Object.entries(criteria)) {
        if (target[key as keyof MonitoringTarget] !== value) return false;
      }
      return true;
    });
  }
}

// Event Processor for handling monitoring events
export class EventProcessor {
  private events: Map<string, MonitoringEvent> = new Map();
  private alertProcessor: AlertProcessor;

  constructor(alertProcessor: AlertProcessor) {
    this.alertProcessor = alertProcessor;
  }

  // Create a new monitoring event
  public createEvent(eventData: Omit<MonitoringEvent, 'id'>): MonitoringEvent {
    const newEvent: MonitoringEvent = {
      ...eventData,
      id: uuidv4()
    };
    this.events.set(newEvent.id, newEvent);
    
    // Process event for potential alerts
    this.processEvent(newEvent);
    
    return newEvent;
  }

  // Process an event for potential alerts
  private processEvent(event: MonitoringEvent): void {
    // Check if event meets alert criteria
    if (this.shouldGenerateAlert(event)) {
      // Create alert
      this.alertProcessor.createAlert({
        eventIds: [event.id],
        targetId: event.targetId,
        timestamp: new Date().toISOString(),
        severity: event.severity,
        title: `Alert: ${event.title}`,
        message: event.description,
        state: 'new',
        actions: [],
        notificationsSent: false
      });

      // Mark event as having generated an alert
      this.updateEvent(event.id, { alertGenerated: true });
    }

    // Mark event as processed
    this.updateEvent(event.id, { processed: true });
  }

  // Determine if event should generate an alert
  private shouldGenerateAlert(event: MonitoringEvent): boolean {
    // Simple logic: generate alerts for medium severity and above
    // In a real system, this would be much more sophisticated
    return ['medium', 'high', 'critical'].includes(event.severity);
  }

  // Get an event by ID
  public getEvent(id: string): MonitoringEvent | undefined {
    return this.events.get(id);
  }

  // Update an existing event
  public updateEvent(id: string, updates: Partial<MonitoringEvent>): MonitoringEvent | null {
    const event = this.events.get(id);
    if (!event) return null;

    const updatedEvent = {
      ...event,
      ...updates
    };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  // Get events for a specific target
  public getTargetEvents(targetId: string): MonitoringEvent[] {
    return Array.from(this.events.values())
      .filter(event => event.targetId === targetId);
  }

  // Get all events
  public getAllEvents(): MonitoringEvent[] {
    return Array.from(this.events.values());
  }
}

// Alert Processor for handling monitoring alerts
export class AlertProcessor {
  private alerts: Map<string, MonitoringAlert> = new Map();
  private notificationCallback?: (alert: MonitoringAlert) => void;

  // Set notification callback
  public setNotificationCallback(callback: (alert: MonitoringAlert) => void): void {
    this.notificationCallback = callback;
  }

  // Create a new alert
  public createAlert(alertData: Omit<MonitoringAlert, 'id'>): MonitoringAlert {
    const newAlert: MonitoringAlert = {
      ...alertData,
      id: uuidv4()
    };
    this.alerts.set(newAlert.id, newAlert);
    
    // Send notification if callback is registered
    if (this.notificationCallback) {
      this.notificationCallback(newAlert);
      this.updateAlert(newAlert.id, { notificationsSent: true });
    }
    
    return newAlert;
  }

  // Get an alert by ID
  public getAlert(id: string): MonitoringAlert | undefined {
    return this.alerts.get(id);
  }

  // Update an existing alert
  public updateAlert(id: string, updates: Partial<MonitoringAlert>): MonitoringAlert | null {
    const alert = this.alerts.get(id);
    if (!alert) return null;

    const updatedAlert = {
      ...alert,
      ...updates
    };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  // Get alerts for a specific target
  public getTargetAlerts(targetId: string): MonitoringAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.targetId === targetId);
  }

  // Get all alerts
  public getAllAlerts(): MonitoringAlert[] {
    return Array.from(this.alerts.values());
  }

  // Get active alerts (not resolved)
  public getActiveAlerts(): MonitoringAlert[] {
    return this.getAllAlerts()
      .filter(alert => alert.state !== 'resolved' && alert.state !== 'false-positive');
  }
}

// Main monitoring system that integrates all components
export class MonitoringSystem {
  private targetManager: TargetManager;
  private eventProcessor: EventProcessor;
  private alertProcessor: AlertProcessor;
  private collectionInterval: NodeJS.Timeout | null = null;
  private collectionIntervalMs: number = 60000; // Default: 1 minute

  constructor() {
    this.alertProcessor = new AlertProcessor();
    this.eventProcessor = new EventProcessor(this.alertProcessor);
    this.targetManager = new TargetManager();
  }

  // Initialize the monitoring system
  public initialize(intervalMs?: number): void {
    if (intervalMs) {
      this.collectionIntervalMs = intervalMs;
    }
    
    // Start the collection process
    this.startCollection();
  }

  // Start the automated collection process
  private startCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    this.collectionInterval = setInterval(() => {
      this.runCollectionCycle();
    }, this.collectionIntervalMs);
  }

  // Stop the automated collection process
  public stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  // Run a single collection cycle
  private runCollectionCycle(): void {
    const activeTargets = this.targetManager.getAllTargets()
      .filter(target => target.active);
    
    // For each active target, collect data
    // This is a simplified implementation
    for (const target of activeTargets) {
      // In a real implementation, this would use the actual data sources
      // For now, we'll simulate an event occasionally
      if (Math.random() < 0.2) { // 20% chance to generate an event
        this.eventProcessor.createEvent({
          targetId: target.id,
          timestamp: new Date().toISOString(),
          source: target.monitoringParams.sources[0] || 'simulated',
          type: 'activity',
          severity: 'info',
          title: `Activity detected for ${target.name}`,
          description: `Simulated activity detected for monitoring target ${target.name}`,
          data: { simulated: true },
          verified: false,
          relatedEvents: [],
          intelTypes: ['social'], // Example intel type
          alertGenerated: false,
          processed: false
        });
      }
    }
  }

  // Run a manual collection for a specific target
  public runManualCollection(targetId: string): void {
    const target = this.targetManager.getTarget(targetId);
    if (!target) return;
    
    // Simulate collecting data for this target
    this.eventProcessor.createEvent({
      targetId: target.id,
      timestamp: new Date().toISOString(),
      source: 'manual',
      type: 'activity',
      severity: 'info',
      title: `Manual check for ${target.name}`,
      description: `Manual data collection performed for ${target.name}`,
      data: { manual: true },
      verified: false,
      relatedEvents: [],
      intelTypes: ['social'], // Example intel type
      alertGenerated: false,
      processed: false
    });
  }

  // Get the target manager
  public getTargetManager(): TargetManager {
    return this.targetManager;
  }

  // Get the event processor
  public getEventProcessor(): EventProcessor {
    return this.eventProcessor;
  }

  // Get the alert processor
  public getAlertProcessor(): AlertProcessor {
    return this.alertProcessor;
  }

  // Set notification callback
  public setNotificationCallback(callback: (alert: MonitoringAlert) => void): void {
    this.alertProcessor.setNotificationCallback(callback);
  }
}

// Create and export a singleton instance
export const monitoringSystem = new MonitoringSystem();
