import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  MonitoringSystem, 
  TargetManager, 
  EventProcessor, 
  AlertProcessor,
  MonitoringTarget,
  MonitoringEvent,
  MonitoringAlert
} from '../../src/pages/NetRunner/monitoring/MonitoringSystem';

describe('MonitoringSystem', () => {
  let monitoringSystem: MonitoringSystem;

  beforeEach(() => {
    // Create a fresh instance for each test
    monitoringSystem = new MonitoringSystem();
  });

  test('should initialize correctly', () => {
    expect(monitoringSystem).toBeDefined();
    expect(monitoringSystem.getTargetManager()).toBeInstanceOf(TargetManager);
    expect(monitoringSystem.getEventProcessor()).toBeInstanceOf(EventProcessor);
    expect(monitoringSystem.getAlertProcessor()).toBeInstanceOf(AlertProcessor);
  });

  test('should create and retrieve targets', () => {
    const targetManager = monitoringSystem.getTargetManager();
    
    // Create a test target
    const newTarget = targetManager.createTarget({
      name: 'Test Target',
      type: 'organization',
      category: 'organization',
      priority: 'medium',
      description: 'Test target description',
      identifiers: { 'domain': 'example.com' },
      monitoringParams: {
        frequency: 60,
        sources: ['web', 'social'],
        keywords: ['test', 'example'],
        startDate: new Date().toISOString(),
        depth: 'standard'
      },
      tags: ['test', 'example'],
      createdBy: 'test-user',
      active: true
    });

    // Verify target was created correctly
    expect(newTarget).toBeDefined();
    expect(newTarget.id).toBeDefined();
    expect(newTarget.name).toBe('Test Target');
    
    // Verify target can be retrieved
    const retrievedTarget = targetManager.getTarget(newTarget.id);
    expect(retrievedTarget).toEqual(newTarget);
    
    // Verify target is in the list of all targets
    const allTargets = targetManager.getAllTargets();
    expect(allTargets).toContainEqual(newTarget);
  });

  test('should update targets', () => {
    const targetManager = monitoringSystem.getTargetManager();
    
    // Create a test target
    const newTarget = targetManager.createTarget({
      name: 'Test Target',
      type: 'organization',
      category: 'organization',
      priority: 'medium',
      description: 'Test target description',
      identifiers: { 'domain': 'example.com' },
      monitoringParams: {
        frequency: 60,
        sources: ['web', 'social'],
        keywords: ['test', 'example'],
        startDate: new Date().toISOString(),
        depth: 'standard'
      },
      tags: ['test', 'example'],
      createdBy: 'test-user',
      active: true
    });
    
    // Update the target
    const updatedTarget = targetManager.updateTarget(newTarget.id, {
      name: 'Updated Test Target',
      priority: 'high'
    });
    
    // Verify update was successful
    expect(updatedTarget).toBeDefined();
    expect(updatedTarget?.name).toBe('Updated Test Target');
    expect(updatedTarget?.priority).toBe('high');
    
    // Other properties should remain unchanged
    expect(updatedTarget?.type).toBe('organization');
    expect(updatedTarget?.description).toBe('Test target description');
  });

  test('should create events that trigger alerts', () => {
    const targetManager = monitoringSystem.getTargetManager();
    const eventProcessor = monitoringSystem.getEventProcessor();
    const alertProcessor = monitoringSystem.getAlertProcessor();
    
    // Mock notification callback
    const mockNotificationCallback = vi.fn();
    monitoringSystem.setNotificationCallback(mockNotificationCallback);
    
    // Create a test target
    const newTarget = targetManager.createTarget({
      name: 'Test Target',
      type: 'organization',
      category: 'organization',
      priority: 'high',
      description: 'Test target description',
      identifiers: { 'domain': 'example.com' },
      monitoringParams: {
        frequency: 60,
        sources: ['web', 'social'],
        keywords: ['test', 'example'],
        startDate: new Date().toISOString(),
        depth: 'standard'
      },
      tags: ['test', 'example'],
      createdBy: 'test-user',
      active: true
    });
    
    // Create a high severity event (should trigger an alert)
    const newEvent = eventProcessor.createEvent({
      targetId: newTarget.id,
      timestamp: new Date().toISOString(),
      source: 'test',
      type: 'activity',
      severity: 'high',
      title: 'Test Event',
      description: 'Test event description',
      data: { test: true },
      verified: false,
      relatedEvents: [],
      intelTypes: ['threat'],
      alertGenerated: false,
      processed: false
    });
    
    // Verify event was created
    expect(newEvent).toBeDefined();
    expect(newEvent.targetId).toBe(newTarget.id);
    expect(newEvent.severity).toBe('high');
    
    // Verify event triggered an alert
    expect(newEvent.alertGenerated).toBe(true);
    
    // Verify alert was created
    const alerts = alertProcessor.getTargetAlerts(newTarget.id);
    expect(alerts.length).toBe(1);
    expect(alerts[0].targetId).toBe(newTarget.id);
    expect(alerts[0].severity).toBe('high');
    expect(alerts[0].state).toBe('new');
    
    // Verify notification callback was called
    expect(mockNotificationCallback).toHaveBeenCalled();
  });

  test('should handle alert state transitions', () => {
    const targetManager = monitoringSystem.getTargetManager();
    const eventProcessor = monitoringSystem.getEventProcessor();
    const alertProcessor = monitoringSystem.getAlertProcessor();
    
    // Create a test target
    const newTarget = targetManager.createTarget({
      name: 'Test Target',
      type: 'organization',
      category: 'organization',
      priority: 'high',
      description: 'Test target description',
      identifiers: { 'domain': 'example.com' },
      monitoringParams: {
        frequency: 60,
        sources: ['web', 'social'],
        keywords: ['test', 'example'],
        startDate: new Date().toISOString(),
        depth: 'standard'
      },
      tags: ['test', 'example'],
      createdBy: 'test-user',
      active: true
    });
    
    // Create an event to trigger an alert
    eventProcessor.createEvent({
      targetId: newTarget.id,
      timestamp: new Date().toISOString(),
      source: 'test',
      type: 'activity',
      severity: 'high',
      title: 'Test Event',
      description: 'Test event description',
      data: { test: true },
      verified: false,
      relatedEvents: [],
      intelTypes: ['threat'],
      alertGenerated: false,
      processed: false
    });
    
    // Get the created alert
    const alerts = alertProcessor.getTargetAlerts(newTarget.id);
    expect(alerts.length).toBe(1);
    const alertId = alerts[0].id;
    
    // Acknowledge the alert
    const acknowledgedAlert = alertProcessor.updateAlert(alertId, {
      state: 'acknowledged',
      assignedTo: 'test-user'
    });
    
    // Verify alert state changed
    expect(acknowledgedAlert?.state).toBe('acknowledged');
    expect(acknowledgedAlert?.assignedTo).toBe('test-user');
    
    // Resolve the alert
    const resolvedAlert = alertProcessor.updateAlert(alertId, {
      state: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'test-user',
      notes: 'Test resolution'
    });
    
    // Verify alert state changed
    expect(resolvedAlert?.state).toBe('resolved');
    expect(resolvedAlert?.resolvedBy).toBe('test-user');
    expect(resolvedAlert?.notes).toBe('Test resolution');
    
    // Verify the alert is no longer active
    const activeAlerts = alertProcessor.getActiveAlerts();
    expect(activeAlerts.length).toBe(0);
  });

  test('should run manual collection', () => {
    const targetManager = monitoringSystem.getTargetManager();
    const eventProcessor = monitoringSystem.getEventProcessor();
    
    // Create a test target
    const newTarget = targetManager.createTarget({
      name: 'Test Target',
      type: 'organization',
      category: 'organization',
      priority: 'medium',
      description: 'Test target description',
      identifiers: { 'domain': 'example.com' },
      monitoringParams: {
        frequency: 60,
        sources: ['web', 'social'],
        keywords: ['test', 'example'],
        startDate: new Date().toISOString(),
        depth: 'standard'
      },
      tags: ['test', 'example'],
      createdBy: 'test-user',
      active: true
    });
    
    // Run manual collection
    monitoringSystem.runManualCollection(newTarget.id);
    
    // Verify an event was created
    const events = eventProcessor.getTargetEvents(newTarget.id);
    expect(events.length).toBe(1);
    expect(events[0].source).toBe('manual');
    expect(events[0].targetId).toBe(newTarget.id);
  });
});
