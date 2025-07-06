# MainBottomBar Component

**Status:** Planned  
**Parent:** MainPage

## Overview

The MainBottomBar is a critical navigation component within the MainPage that provides access to all primary screens and functionality in the Starcom App. It serves as the main navigation hub for users, offering intuitive access to different functional areas while maintaining a consistent presence throughout the user experience.

## Core Functionality

### 1. Primary Navigation

- **Screen Selection**: Allows users to switch between different functional screens (GlobeScreen, NetRunner, Analyzer, etc.)
- **Visual Indicators**: Shows the currently active screen and provides visual feedback on screen transitions
- **Contextual Actions**: Dynamically updates available actions based on the current screen

### 2. Information Display

- **Status Indicators**: Shows system status, connection quality, and other essential information
- **Notifications**: Provides subtle indicators for new notifications and updates
- **Context Information**: Displays brief contextual information relevant to the current screen

### 3. Quick Actions

- **Global Functions**: Provides access to frequently used functions regardless of current screen
- **Shortcuts**: Offers customizable shortcuts to specific tools or features
- **Mode Toggles**: Allows quick switching between different operational modes

## Component Structure

### Layout

- **Main Container**: Horizontal bar fixed to the bottom of the MainPage
- **Navigation Section**: Central section containing primary screen navigation buttons
- **Action Sections**: Left and right sections containing context-specific actions and global functions

### Visual Design

- **Compact Design**: Minimizes vertical space while providing clear touch/click targets
- **Consistent Styling**: Follows global design language with high-contrast icons and labels
- **Visual Hierarchy**: Uses size, color, and position to indicate importance and relationships

## Interactions

### User Interactions

- **Click/Tap**: Primary method for selecting screens and activating functions
- **Long Press**: Access to secondary options or additional information
- **Swipe**: Alternative navigation between adjacent screens (mobile/touch optimization)

### System Interactions

- **ViewContext Integration**: Synchronized with the ViewContext to reflect and control current view state
- **Route Management**: Works with the router to handle URL-based navigation
- **State Persistence**: Maintains selected state across sessions and page refreshes

## Technical Implementation

### Component Architecture

- **MainBottomBar Container**: Wrapper component managing state and layout
- **BottomBarButton**: Reusable button component for navigation items
- **BottomBarActionItem**: Component for action buttons and toggles
- **BottomBarIndicator**: Component for status and notification indicators

### State Management

- **Selected Screen**: Tracks and synchronizes the currently active screen
- **Available Actions**: Dynamic list of actions available in the current context
- **Notification States**: Manages indicators for new information and alerts

### Data Flow

- Receives state updates from ViewContext
- Dispatches navigation actions to ViewContext and Router
- Subscribes to notification system for indicator updates

## Usage Guidelines

### Integration

- Should be a direct child of the MainPage component
- Requires ViewContext provider to be present in the component tree
- Should have access to the notification system and router

### Customization

- Allows for theming via global theme variables
- Supports configurable button ordering and visibility
- Can be extended with custom action items for specific deployments

### Accessibility

- All interactive elements must have appropriate ARIA labels
- Navigation should be fully keyboard accessible
- Color contrasts must meet WCAG AA standards

## Related Components

- **MainPage**: Parent container that hosts the MainBottomBar
- **ViewContext**: Provides and receives view state information
- **GlobalHeader**: Complements the MainBottomBar with top-level navigation
- **ScreenContainer**: Displays the content associated with the selected navigation item
