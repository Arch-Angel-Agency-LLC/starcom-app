# MarqueeTopBar Component

**Status:** Planned  
**Parent:** MainPage

## Overview

The MarqueeTopBar component serves as a dynamic information display and contextual action bar positioned at the top of the MainPage. It provides real-time information, context-specific controls, and status updates relevant to the current screen, enhancing situational awareness and offering quick access to frequently used functions.

## Core Functionality

### 1. Information Display

- **Context Information**: Shows information relevant to the current screen and operation
- **Status Updates**: Displays real-time system status, alerts, and notifications
- **Data Metrics**: Presents key metrics and statistics appropriate to the current context

### 2. Contextual Actions

- **Quick Actions**: Provides context-specific action buttons and controls
- **Mode Selectors**: Allows switching between different modes or views within the current screen
- **Tool Selection**: Offers access to tools relevant to the current operation

### 3. Marquee Display

- **Scrolling Information**: Presents important updates in a scrolling marquee format
- **Alert Notifications**: Highlights critical alerts and time-sensitive information
- **System Messages**: Displays system-wide announcements and updates

## Component Structure

### Layout

- **Main Container**: Horizontal bar positioned below the GlobalHeader
- **Information Section**: Area dedicated to contextual information display
- **Action Section**: Contains context-specific buttons and controls
- **Marquee Section**: Horizontal scrolling area for dynamic information

### Visual Design

- **Compact Design**: Minimizes vertical space while maximizing information density
- **High Contrast**: Ensures readability of critical information
- **Visual Hierarchy**: Uses color, typography, and position to indicate importance

## Interactions

### User Interactions

- **Action Buttons**: Direct interaction with contextual actions
- **Information Expansion**: Ability to expand certain information items for details
- **Marquee Control**: Pause/resume scrolling information on hover/touch

### System Interactions

- **Screen Context**: Receives information about the current screen to display relevant data
- **Notification System**: Subscribes to notifications for marquee display
- **Data Services**: Connects to real-time data sources for current metrics

## Technical Implementation

### Component Architecture

- **MarqueeTopBar Container**: Primary wrapper managing layout and state
- **ContextualInfoDisplay**: Component for showing context-specific information
- **ActionButtonGroup**: Collection of context-appropriate action buttons
- **ScrollingMarquee**: Component handling scrolling information display

### State Management

- **Context State**: Current screen context and relevant information
- **Available Actions**: Dynamic list of actions available in the current context
- **Notification Queue**: Managed list of notifications for marquee display

### Data Flow

- Receives context updates from ViewContext
- Subscribes to notification system for alerts and announcements
- Connects to data services for real-time metrics

## Usage Guidelines

### Integration

- Should be positioned directly below GlobalHeader within MainPage
- Requires ViewContext provider to be present in the component tree
- Should have appropriate z-index to work with MainCenter and overlays

### Customization

- Supports configuration of marquee behavior (speed, pause on hover)
- Allows for customization of information display formatting
- Can be extended with additional action buttons for specific deployments

### Accessibility

- Scrolling content should have alternative static view option
- Critical information should not rely solely on the marquee display
- All interactive elements must have appropriate ARIA labels

## Related Components

- **MainPage**: Parent container that hosts the MarqueeTopBar
- **ViewContext**: Provides information about the currently active view
- **NotificationSystem**: Supplies notification data for display
- **GlobalHeader**: Complements the MarqueeTopBar with global navigation
- **MainCenter**: Content area displayed below the MarqueeTopBar

## Technical Considerations

- **Performance Impact**: Scrolling animations should be optimized for performance
- **Update Frequency**: Should throttle updates to prevent excessive re-renders
- **Mobile Adaptation**: Should adapt or condense on smaller screens to preserve space
