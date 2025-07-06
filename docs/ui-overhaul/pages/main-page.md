# MainPage

**Layer:** Page Layer (Second Level)

## Overview

MainPage is the primary interface for the Starcom application. It serves as a container for all the main functional screens and provides consistent navigation between them. The MainPage is the default landing point after authentication and houses all the core functionality of the application.

## Key Components

### MarqueTopBar
- **Purpose:** Displays scrolling news, alerts, and updates
- **Behavior:** 
  - Automatically scrolls through important information
  - Can be paused on hover
  - Clickable items open relevant details
- **Data Sources:**
  - System alerts and notifications
  - News feeds
  - Team updates
  - Mission critical information

### MainCenter
- **Purpose:** Primary content area where screens are displayed
- **Behavior:**
  - Contains only one active screen at a time
  - Handles transitions between screens
  - Adapts to different screen types and layouts
- **Technical Implementation:**
  - Uses conditional rendering based on active screen
  - May implement transitions for smooth screen changes
  - Handles screen-specific layouts and requirements

### MainBottomBar
- **Purpose:** Primary navigation between screens
- **Behavior:**
  - Shows all available screens as navigation buttons
  - Highlights the currently active screen
  - May show notification indicators on screens requiring attention
- **Visual Design:**
  - Compact yet accessible
  - Clear visual hierarchy
  - Consistent with app's design language

### Chat System
- **Purpose:** Enables communication within the application
- **Implementation:**
  - Available as both an expandable sidebar and a floating button
  - Persists across all screens within MainPage
  - Maintains conversation context during navigation
- **Features:**
  - Direct messaging
  - Team channels
  - AI assistant integration
  - File sharing
  - Security features

## Screen Management

The MainPage is responsible for:
1. Loading the appropriate screen based on navigation
2. Maintaining screen state during navigation
3. Handling screen transitions
4. Providing context and services to active screens

## State Management

- **Current Screen:** Tracks which screen is currently active
- **Screen History:** Maintains navigation history for back functionality
- **Persistent State:** Preserves important application state across screen changes
- **User Context:** Maintains user session and permissions

## Implementation Guidelines

### Component Structure
```tsx
<MainPage>
  <MarqueTopBar />
  <MainCenter>
    {/* Only one of these is rendered based on active screen */}
    {activeScreen === 'globe' && <GlobeScreen />}
    {activeScreen === 'netrunner' && <NetRunnerScreen />}
    {/* Other screens */}
  </MainCenter>
  <Chat />
  <MainBottomBar 
    activeScreen={activeScreen} 
    onScreenChange={handleScreenChange} 
  />
</MainPage>
```

### Routing Integration
MainPage integrates with React Router to:
- Update URLs based on active screen
- Support deep linking to specific screens
- Enable browser history navigation
- Preserve state during navigation

## Performance Considerations

- Implement lazy loading for screens to reduce initial load time
- Consider screen preloading for common navigation paths
- Optimize re-renders during screen transitions
- Cache screen state to improve navigation performance

## Accessibility

- Ensure keyboard navigation through all elements
- Maintain focus management during screen transitions
- Provide screen reader announcements for screen changes
- Support high contrast mode and text scaling

## Future Enhancements

- Screen grouping for related functionality
- Custom screen layouts for different user roles
- Multi-screen view for advanced workflows
- Enhanced screen transition animations
