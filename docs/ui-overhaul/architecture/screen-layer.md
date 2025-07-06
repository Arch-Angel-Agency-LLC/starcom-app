# Screen Layer

**Layer Level:** Third Level

## Overview

The Screen Layer represents the individual functional areas within a Page. Each Screen provides a specific set of features or tools focused on a particular domain of functionality. Screens are the primary content containers where users interact with the application's features.

## Screen Characteristics

- Screens exist within Pages (primarily within MainPage)
- Only one Screen is visible at a time within its parent Page
- Each Screen has its own state, UI components, and functionality
- Screens can share services and data with other screens

## Primary Screens

### Within MainPage:

1. **GlobeScreen**
   - 3D globe visualization with threat intelligence overlay
   - Uses HUDLayout with specialized corners and sidebars
   - Primary entry point for geospatial intelligence

2. **NetRunner Screen**
   - Advanced search and information gathering capabilities
   - Combines search tools, OSINT functionality, and reconnaissance features
   - Focused on data collection and initial analysis

3. **Analyzer Screen**
   - Deep analysis of collected information
   - Pattern recognition and correlation features
   - Data visualization and reporting tools

4. **Node Web Screen**
   - Network visualization and entity relationship mapping
   - Interactive graph for exploring connections
   - Topology analysis and pathway identification

5. **Timeline Screen**
   - Chronological event visualization and analysis
   - Event correlation and causality exploration
   - Temporal pattern identification

6. **CaseManager Screen**
   - Case organization and management
   - Intelligence report creation and viewing
   - Investigation tracking and documentation

7. **Teams Screen**
   - Team management and collaboration
   - Member assignments and permissions
   - Team resources and shared assets

8. **AI Agent Screen**
   - AI assistant configuration and interaction
   - Autonomous operation setup
   - Agent training and feedback

9. **BotRoster Screen**
   - Management of automated agents
   - Bot deployment and monitoring
   - Task assignment and scheduling

### Within SettingsPage:

1. **User Settings Screen**
   - Profile management
   - Preferences and personalization
   - Account security

2. **Application Settings Screen**
   - General application configuration
   - Performance settings
   - Theme and display options

3. **Advanced Settings Screen**
   - Technical configuration
   - Integration settings
   - Developer options

## Screen Implementation

### Common Pattern
Each screen typically follows this component structure:
```tsx
<ScreenName>
  <ScreenHeader />
  <ScreenToolbar />
  <ScreenContent>
    {/* Screen-specific components */}
  </ScreenContent>
  <ScreenFooter />
</ScreenName>
```

### State Management
- Screen-specific state is contained within the screen component
- Shared state can be accessed via context or services
- Persistent state is saved to backend services or local storage

### Navigation
- Inter-screen navigation is handled by the MainBottomBar
- Intra-screen navigation (tabs, panels) is screen-specific

## Technical Considerations

- Screens should lazy-load where appropriate to improve performance
- Heavy computational tasks should be offloaded to workers
- Consider memory management for screens with large datasets
- Implement proper cleanup when unmounting screens

## Interaction Between Screens

- Screens can communicate via shared services or context
- Data can be passed between screens via URL parameters
- Screens should be designed to work both independently and as part of workflows

## Future Considerations

- Screen composition system for custom layouts
- Screen extension system for plugins
- Movable/floating screens for multi-monitor setups
- Split-screen functionality for advanced workflows
