# Page Layer

**Layer Level:** Second Level

## Overview

The Page Layer contains the major sections of the application. Each Page is a distinct, full-screen context that serves a specific purpose within the application. Pages are switched via top-level navigation.

## Primary Pages

### MainPage
- **Purpose:** Primary workspace for all core application functionality
- **Content:** Contains multiple screens navigable via MainBottomBar
- **Key Components:**
  - MainBottomBar - Navigation between screens
  - MarqueTopBar - Updates and announcements
  - MainCenter - Container for the active screen
  - Chat System - Messaging and collaboration
- **Technical Notes:**
  - Manages screen-level navigation and state
  - Houses most of the application's interactive features

### SettingsPage
- **Purpose:** Configuration and user preferences
- **Content:** Multiple settings screens for different configuration categories
- **Key Components:**
  - Settings navigation menu
  - Settings content area
  - Save/apply mechanism
- **Technical Notes:**
  - Isolated from MainPage functionality
  - Focused on configuration only
  - May require special permission handling

## Page Layer Characteristics

- Only one page is visible at a time
- Pages represent major context shifts in the application
- Each page has its own routing and navigation patterns
- Pages maintain their state when navigating between them

## State Management

- Page-specific state is maintained within the page component
- Global state (user info, permissions) is accessed from the App Container
- Navigation state (current screen, history) is managed at the Page level

## Navigation

### Between Pages
- Primary navigation occurs through dedicated UI elements:
  - Settings button in Header navigates to Settings Page
  - "Return to Main" button in Settings Page returns to Main Page
- Uses React Router for URL-based navigation
- Pages have distinct URLs (e.g., /, /settings)

### Within Pages
- Each page implements its own internal navigation system
- MainPage uses MainBottomBar for screen navigation
- SettingsPage uses a settings menu for navigating between settings screens

## Implementation Guidelines

### Component Structure
```tsx
// MainPage structure
<MainPage>
  <MarqueTopBar />
  <MainCenter>
    {/* Only one screen is active at a time */}
    <GlobeScreen /> or <NetRunnerScreen /> or <other screens...>
  </MainCenter>
  <Chat />
  <MainBottomBar />
</MainPage>

// SettingsPage structure
<SettingsPage>
  <SettingsSidebar />
  <SettingsContent>
    {/* Only one settings screen is active */}
    <UserSettingsScreen /> or <AppSettingsScreen /> or <other settings...>
  </SettingsContent>
</SettingsPage>
```

## Future Considerations

- Additional standalone pages for specialized functionality
- Modal overlay pages for focused tasks
- Multi-page workflows for complex processes
