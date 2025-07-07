# Earth Alliance Communication Panel - Emergency Protocol

This document outlines the emergency protocol implementation for the Earth Alliance Communication Panel, with a focus on the NostrService integration for emergency communications.

## Overview

The emergency protocol system provides a robust framework for maintaining communication during crisis situations. It includes visual indicators, prioritized messaging, automatic channel switching, and integration with the NostrService emergency coordination system.

## Emergency Mode Features

### User Interface
- **Emergency Mode Indicator**: Visual cue (pulsing red banner) indicating emergency mode is active
- **Emergency Controls**: Interface for declaring and resolving emergencies
- **Priority Messaging**: Highlighting of emergency communications
- **Automatic Channel Switching**: Joins emergency channels automatically

### Technical Implementation

#### Emergency Declaration Process
1. User provides reason for emergency declaration
2. `declareEmergency` method in `NostrServiceAdapter` is called
3. Emergency coordination message is sent via `NostrService.sendEmergencyCoordination`
4. Custom event `nostr-emergency` is dispatched
5. Emergency channels are fetched and joined
6. UI updates to reflect emergency mode

#### Emergency Resolution Process
1. User initiates emergency resolution
2. `resolveEmergency` method in `NostrServiceAdapter` is called
3. Resolution message sent via `NostrService.sendEmergencyCoordination`
4. Custom event `nostr-emergency` with `active: false` is dispatched
5. UI returns to normal operating mode

## NostrServiceAdapter Emergency Integration

The `NostrServiceAdapter` class handles the integration between the Communication Panel and the NostrService emergency system:

```typescript
// Emergency declaration
async declareEmergency(reason: string): Promise<void> {
  // Send emergency coordination to all active channels
  for (const channelId of this.activeChannels) {
    await this.nostrService.sendEmergencyCoordination(
      channelId,
      'operational_security',
      'critical', 
      {
        description: reason,
        actionRequired: 'Activate emergency protocols',
        timeframe: 'Immediate',
        affectedRegions: ['All'],
        resourcesNeeded: ['Secure communication channels']
      }
    );
  }
  
  // Set emergency active flag
  this.isEmergencyActive = true;
  
  // Dispatch custom event
  const emergencyEvent = new CustomEvent('nostr-emergency', {
    detail: { active: true, reason }
  });
  window.dispatchEvent(emergencyEvent);
  
  // Fetch and join emergency channels
  const emergencyChannels = await this.fetchEmergencyChannels();
}
```

## Emergency Channels

Emergency channels are special communication channels that are:
1. Only visible during emergency mode
2. Have higher message priority
3. Include special participants (emergency coordinators)
4. Automatically joined when emergency is declared

### Channel Types
- **Global Emergency**: For Earth Alliance-wide emergency coordination
- **Emergency Alerts**: For critical alerts and announcements
- **Regional Emergency**: For localized emergency response
- **Command Center**: For leadership and decision-making

## Testing Emergency Mode

Emergency mode functionality is thoroughly tested in the following test files:
- `NostrServiceAdapter.test.tsx`: Tests emergency declaration and resolution methods
- `EarthAllianceCommunicationPanel.test.tsx`: Tests UI components and emergency controls

## Future Enhancements

1. **Role-Based Emergency Controls**: Limit emergency declaration to authorized personnel
2. **Multi-level Emergency Tiers**: Different emergency levels with corresponding protocols
3. **Offline Emergency Mode**: Store emergency messages for delivery when connectivity returns
4. **Geographic Emergency Targeting**: Target emergencies to specific geographic regions
5. **Emergency Analytics**: Track and analyze emergency response metrics
