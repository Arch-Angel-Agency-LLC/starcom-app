# MainCenter Component

**Status:** Planned  
**Parent:** MainPage

## Overview

The MainCenter component serves as the primary content container within the MainPage, responsible for displaying the currently active screen and managing transitions between different screens. It provides a consistent frame for all functional screens while ensuring proper layout, sizing, and context management.

## Core Functionality

### 1. Screen Container

- **Content Display**: Renders the currently active screen component
- **Screen Management**: Handles mounting, unmounting, and transition between screens
- **Layout Control**: Provides consistent sizing and positioning for screen content

### 2. Transition Management

- **Visual Transitions**: Handles animations and visual effects during screen changes
- **State Preservation**: Maintains appropriate state during transitions
- **Loading States**: Displays loading indicators during content preparation

### 3. Context Provision

- **Screen Context**: Provides necessary context data to active screens
- **Dimension Management**: Handles responsive sizing and layout adaptation
- **Error Boundaries**: Captures and handles errors within screen components

## Component Structure

### Layout

- **Container Element**: Flexible container that fills available space within MainPage
- **Screen Wrapper**: Direct parent for the active screen component
- **Transition Layer**: Manages visual transitions between screens
- **Overlay Layer**: Provides space for modals, popups, and overlays specific to the current screen

### Visual Design

- **Clean Container**: Minimal styling to maximize space for screen content
- **Consistent Padding**: Standardized spacing around screen content
- **Subtle Transitions**: Non-disruptive animations between screen changes

## Interactions

### User Interactions

- **Gesture Support**: Provides swipe gesture support for screen navigation (optional)
- **Keyboard Navigation**: Supports keyboard shortcuts for screen switching
- **Focus Management**: Handles focus transitions during screen changes

### System Interactions

- **ViewContext Integration**: Subscribes to view state changes to determine active screen
- **Screen Lifecycle**: Manages component mounting/unmounting based on navigation
- **Resource Management**: Handles cleanup of resources when screens are unmounted

## Technical Implementation

### Component Architecture

- **MainCenter Container**: Primary wrapper managing layout and transitions
- **ScreenRenderer**: Dynamic component for rendering the active screen
- **TransitionManager**: Handles animation and transition effects
- **ErrorBoundary**: Captures and gracefully handles screen errors

### State Management

- **Active Screen**: Tracks the currently displayed screen
- **Transition State**: Manages the state of transitions between screens
- **Error State**: Captures and stores information about screen errors

### Data Flow

- Receives active screen information from ViewContext
- Provides screen-specific context to child components
- Captures and reports errors to error tracking system

## Usage Guidelines

### Integration

- Should be a direct child of the MainPage component
- Requires ViewContext provider to be present in the component tree
- Should have appropriate z-index to work with MainBottomBar and MarqueeTopBar

### Customization

- Supports configuration of transition animations and timing
- Allows for custom error display components
- Can be extended with additional overlay capabilities

### Performance Considerations

- Should implement lazy loading for screen components
- May need to implement virtualization for screens with large data sets
- Should manage memory efficiently when switching between resource-intensive screens

## Related Components

- **MainPage**: Parent container that hosts the MainCenter
- **ViewContext**: Provides information about the currently active view
- **MainBottomBar**: Navigation component that triggers screen changes
- **MarqueeTopBar**: Contextual information bar above the MainCenter
- **Screen Components**: Various functional screens rendered within MainCenter
