/**
 * Sample timeline event data generator for IntelDataCore
 * 
 * This file provides utilities to generate sample timeline events
 * for testing and demonstration purposes.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  TimelineEvent, 
  EventType,
  ClassificationLevel
} from '../types/intelDataModels';
import { timelineAdapter } from '../adapters/timelineAdapter';

/**
 * Generate a sample timeline event
 */
export function generateSampleTimelineEvent(
  index: number, 
  baseDate = new Date(),
  customOptions: Partial<TimelineEvent> = {}
): TimelineEvent {
  // Create a random date offset (from -30 days to +30 days from baseDate)
  const dayOffset = Math.floor(Math.random() * 60) - 30;
  const startDate = new Date(baseDate);
  startDate.setDate(baseDate.getDate() + dayOffset);
  
  // For some events, add an end date
  const hasEndDate = Math.random() > 0.7;
  let endDate;
  if (hasEndDate) {
    const durationHours = Math.floor(Math.random() * 72) + 1; // 1 to 72 hours
    endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + durationHours);
  }

  // Generate a random event type
  const eventTypes = Object.values(EventType);
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  // Determine event importance based on type (some types are inherently more important)
  let baseImportance = 30; // Default medium importance
  if ([EventType.ATTACK, EventType.INCIDENT, EventType.EXFILTRATION].includes(eventType as EventType)) {
    baseImportance = 70; // High importance
  } else if ([EventType.RECONNAISSANCE, EventType.ACCESS].includes(eventType as EventType)) {
    baseImportance = 50; // Medium-high importance
  }
  
  // Add some randomness to importance
  const importance = Math.min(100, Math.max(1, baseImportance + Math.floor(Math.random() * 30) - 15));
  
  // Create the timeline event
  const event: TimelineEvent = {
    id: customOptions.id || uuidv4(),
    type: 'timeline_event',
    title: customOptions.title || `${eventType} Event ${index}`,
    description: customOptions.description || `This is a sample ${eventType.toLowerCase()} event for testing.`,
    eventType: eventType as EventType,
    startDate: customOptions.startDate || startDate.toISOString(),
    endDate: customOptions.endDate || (endDate ? endDate.toISOString() : undefined),
    isEstimated: customOptions.isEstimated !== undefined ? customOptions.isEstimated : Math.random() > 0.8,
    location: customOptions.location || (Math.random() > 0.7 ? {
      description: `Location for ${eventType} ${index}`,
      latitude: (Math.random() * 170) - 85, // -85 to +85
      longitude: (Math.random() * 360) - 180, // -180 to +180
    } : undefined),
    relatedEntities: customOptions.relatedEntities || [],
    importance: customOptions.importance !== undefined ? customOptions.importance : importance,
    createdAt: customOptions.createdAt || new Date().toISOString(),
    updatedAt: customOptions.updatedAt || new Date().toISOString(),
    createdBy: customOptions.createdBy || 'sample_generator',
    source: customOptions.source || 'sample_data',
    verified: customOptions.verified !== undefined ? customOptions.verified : false,
    confidence: customOptions.confidence !== undefined ? customOptions.confidence : Math.floor(Math.random() * 100),
    attachments: customOptions.attachments || [],
    classification: customOptions.classification || (
      importance > 80 ? ClassificationLevel.SECRET :
      importance > 60 ? ClassificationLevel.CONFIDENTIAL :
      importance > 40 ? ClassificationLevel.SENSITIVE :
      ClassificationLevel.UNCLASSIFIED
    ),
    metadata: customOptions.metadata || {
      source: 'sample_generator',
      confidence: Math.floor(Math.random() * 100),
    },
    tags: customOptions.tags || [
      eventType.toLowerCase(), 
      'sample', 
      `priority_${importance > 70 ? 'high' : importance > 30 ? 'medium' : 'low'}`
    ]
  };
  
  return event;
}

/**
 * Generate and store multiple sample timeline events
 */
export async function generateSampleTimelineData(count = 20): Promise<string[]> {
  const eventIds: string[] = [];
  const baseDate = new Date();
  
  // Create sample events with various types and dates
  for (let i = 0; i < count; i++) {
    const event = generateSampleTimelineEvent(i + 1, baseDate);
    
    // Add some related entities for more complex relationships
    if (eventIds.length > 0 && Math.random() > 0.7) {
      // Relate this event to 1-3 previous events
      const numRelations = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numRelations && j < eventIds.length; j++) {
        const randomIndex = Math.floor(Math.random() * eventIds.length);
        if (!event.relatedEntities.includes(eventIds[randomIndex])) {
          event.relatedEntities.push(eventIds[randomIndex]);
        }
      }
    }
    
    // Store the event
    const eventId = await timelineAdapter.addEvent(event);
    if (eventId) {
      eventIds.push(eventId);
    }
  }
  
  return eventIds;
}

/**
 * Generate a coherent attack timeline scenario
 */
export async function generateAttackScenario(
  targetName = "Example Corp", 
  attackerName = "Threat Actor Group",
  startDate = new Date(),
  durationDays = 30
): Promise<string[]> {
  const eventIds: string[] = [];
  
  // Create a sequence of events that tell a coherent attack story
  const scenarioEvents: Partial<TimelineEvent>[] = [
    {
      title: `Initial Reconnaissance against ${targetName}`,
      description: `${attackerName} begins scanning network perimeter of ${targetName}`,
      eventType: EventType.RECONNAISSANCE,
      importance: 45,
      isEstimated: true
    },
    {
      title: `Phishing Campaign Targeting ${targetName} Employees`,
      description: `${attackerName} launches spear phishing campaign against key employees`,
      eventType: EventType.ATTACK,
      importance: 75,
      isEstimated: false
    },
    {
      title: `Initial Access at ${targetName}`,
      description: `First successful compromise of employee workstation via phishing email`,
      eventType: EventType.ACCESS,
      importance: 80,
      isEstimated: false
    },
    {
      title: `Lateral Movement Detected`,
      description: `Attacker begins moving laterally through the network`,
      eventType: EventType.ACCESS, // Changed from MOVEMENT to ACCESS
      importance: 85,
      isEstimated: false
    },
    {
      title: `Credential Harvesting`,
      description: `Attacker extracts credentials from compromised systems`,
      eventType: EventType.EXFILTRATION,
      importance: 70,
      isEstimated: false
    },
    {
      title: `Access to Critical Systems`,
      description: `Attacker gains access to sensitive database servers`,
      eventType: EventType.ACCESS,
      importance: 90,
      isEstimated: false
    },
    {
      title: `Data Exfiltration Begins`,
      description: `Large data transfers detected from sensitive systems to external endpoints`,
      eventType: EventType.EXFILTRATION,
      importance: 95,
      isEstimated: false
    },
    {
      title: `Attack Detected by Security Team`,
      description: `${targetName} security team identifies suspicious activity`,
      eventType: EventType.DETECTION,
      importance: 85,
      isEstimated: false
    },
    {
      title: `Incident Response Initiated`,
      description: `${targetName} activates incident response team`,
      eventType: EventType.MITIGATION,
      importance: 80,
      isEstimated: false
    },
    {
      title: `Containment Actions`,
      description: `Networks segmented, compromised systems isolated`,
      eventType: EventType.MITIGATION,
      importance: 75,
      isEstimated: false
    },
    {
      title: `Attack Contained`,
      description: `All known attack vectors addressed, monitoring in place`,
      eventType: EventType.MITIGATION,
      importance: 70,
      isEstimated: false
    }
  ];
  
  // Calculate time intervals
  const timeIntervals = durationDays / scenarioEvents.length;
  const currentDate = new Date(startDate);
  
  // Generate and store the timeline events
  for (let i = 0; i < scenarioEvents.length; i++) {
    // Advance the date for each event
    currentDate.setDate(currentDate.getDate() + timeIntervals);
    
    // Add some randomness to the exact time
    const hourOffset = Math.floor(Math.random() * 24);
    currentDate.setHours(currentDate.getHours() + hourOffset);
    
    const event = {
      ...scenarioEvents[i],
      startDate: new Date(currentDate).toISOString(),
      relatedEntities: eventIds // relate to all previous events
    };
    
    // Store the event
    const eventId = await timelineAdapter.addEvent(event);
    if (eventId) {
      eventIds.push(eventId);
    }
  }
  
  return eventIds;
}

export default {
  generateSampleTimelineEvent,
  generateSampleTimelineData,
  generateAttackScenario
};
