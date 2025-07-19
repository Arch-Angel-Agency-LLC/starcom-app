// Real-time Processing and Alerting
// Time-sensitive intelligence processing capabilities

/**
 * Processing priority levels for operational urgency
 */
export type ProcessingPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';

/**
 * Alert severity levels
 */
export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

/**
 * Trigger condition operators
 */
export type TriggerOperator = 'EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'PATTERN_MATCH';

/**
 * Automated action types
 */
export type AutomatedActionType = 'NOTIFY' | 'ESCALATE' | 'PROCESS' | 'ARCHIVE' | 'CLASSIFY';

/**
 * Trigger condition for automated alerts
 */
export interface TriggerCondition {
  field: string;
  operator: TriggerOperator;
  value: string | number | boolean;
  sensitivity: number; // 0-100
}

/**
 * Alert trigger configuration
 */
export interface AlertTrigger {
  triggerId: string;
  condition: TriggerCondition;
  alertLevel: AlertLevel;
  recipients: string[];
  message: string;
  enabled: boolean;
}

/**
 * Escalation rule for delayed response
 */
export interface EscalationRule {
  condition: string;
  delayMinutes: number;
  escalateTo: string[];
  actions: string[];
}

/**
 * Automated action configuration
 */
export interface AutomatedAction {
  actionId: string;
  trigger: string;
  actionType: AutomatedActionType;
  parameters: Record<string, unknown>;
  enabled: boolean;
}

/**
 * Real-time processing status and configuration
 */
export interface RealTimeProcessingStatus {
  isRealTime: boolean;
  priority: ProcessingPriority;
  alertTriggers: AlertTrigger[];
  processingDeadline?: number;
  escalationRules: EscalationRule[];
  notificationTargets: string[];
  automatedActions: AutomatedAction[];
}

/**
 * Alert event for system notifications
 */
export interface AlertEvent {
  id: string;
  triggerId: string;
  level: AlertLevel;
  message: string;
  timestamp: number;
  intelId: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedAt?: number;
}

/**
 * Real-time processing utilities
 */
export class RealTimeProcessor {
  /**
   * Check if processing should be expedited
   */
  static requiresExpediting(status: RealTimeProcessingStatus): boolean {
    return status.priority === 'CRITICAL' || 
           status.priority === 'EMERGENCY' ||
           (status.processingDeadline && status.processingDeadline < Date.now() + 300000); // 5 minutes
  }

  /**
   * Evaluate trigger conditions
   */
  static evaluateTrigger(trigger: AlertTrigger, data: Record<string, unknown>): boolean {
    const fieldValue = data[trigger.condition.field];
    const { operator, value } = trigger.condition;

    switch (operator) {
      case 'EQUALS':
        return fieldValue === value;
      case 'CONTAINS':
        return typeof fieldValue === 'string' && fieldValue.includes(String(value));
      case 'GREATER_THAN':
        return typeof fieldValue === 'number' && fieldValue > Number(value);
      case 'LESS_THAN':
        return typeof fieldValue === 'number' && fieldValue < Number(value);
      case 'PATTERN_MATCH':
        return typeof fieldValue === 'string' && new RegExp(String(value)).test(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Generate alert event from trigger
   */
  static createAlertEvent(trigger: AlertTrigger, intelId: string): AlertEvent {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      triggerId: trigger.triggerId,
      level: trigger.alertLevel,
      message: trigger.message,
      timestamp: Date.now(),
      intelId,
      acknowledged: false
    };
  }

  /**
   * Check if escalation should occur
   */
  static shouldEscalate(rule: EscalationRule, processingStartTime: number): boolean {
    const elapsed = (Date.now() - processingStartTime) / (1000 * 60); // minutes
    return elapsed >= rule.delayMinutes;
  }
}
