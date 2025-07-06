# Navigation Architecture

This document outlines the navigation architecture of the Starcom application UI overhaul.

## Provider Structure

### Top-Level Providers

The application uses several React Context Providers to manage state and functionality across components. These providers are arranged in a hierarchical structure in the `App` component:

```
App
├── SecureChatProvider
├── ViewProvider 
│   └── All application screens and components
```

Key points:
- `SecureChatProvider` is positioned at the top level to ensure all components have access to chat functionality
- `ViewProvider` manages the current view/screen state and navigation

### Provider Responsibilities

#### SecureChatProvider
- Manages secure chat state and operations
- Provides the `useSecureChat` hook for components that need chat functionality
- Must wrap any component that uses the `useSecureChat` hook

#### ViewProvider
- Manages the application's navigation state
- Provides view-related hooks (`useView`, `useNavigation`, etc.)
- Synchronizes with URL routes through the `useRouteSync` hook

## Routing Structure

The application uses React Router's nested routes for better organization and feature support:

```
/                               - MainPage (Globe)
├── netrunner                   - NetRunnerDashboard
│   └── :searchQuery            - NetRunnerDashboard with search term
├── analyzer                    - AnalyzerScreen
├── nodeweb                     - NodeWebScreen
│   └── :nodeId                 - NodeWebScreen with specific node
├── timeline                    - TimelineScreen
│   └── :timeframeId            - TimelineScreen with specific timeframe
├── cases                       - CaseManagerScreen
│   └── :caseId                 - CaseManagerScreen with specific case
├── teams                       - TeamsScreen
│   └── :teamId                 - TeamsScreen with specific team
├── aiagent                     - AIAgentScreen
└── bots                        - BotRosterScreen
    └── :botId                  - BotRosterScreen with specific bot

/settings                       - SettingsPage (redirects to profile)
├── profile                     - ProfileSettings
├── appearance                  - AppearanceSettings
├── security                    - SecuritySettings
├── notifications               - NotificationSettings
└── advanced                    - AdvancedSettings
```

### MainBottomBar Navigation

The MainBottomBar now organizes navigation items into logical categories:

1. **Tools**
   - Globe - Global visualization

2. **Collaboration**
   - Teams - Team collaboration
   - AI Agent - AI assistance
   - Bot Roster - Automated agents

3. **Intelligence**
   - NetRunner - Intelligence gathering
   - Analyzer - Information analysis
   - Node Web - Network visualization
   - Timeline - Chronological analysis
   - Case Manager - Case management

Navigation items include:
- Direct links to routes
- Visual indicators for active/connected status
- Category labels for better organization
- Support for deep linking

## Navigation Flow

### Route-to-Screen Synchronization

1. URL changes (by direct navigation or browser history)
2. `useRouteSync` hook detects the change
3. It maps the URL path to the corresponding screen type
4. Updates ViewContext with the new screen and parameters
5. MainPage and ScreenLoader render the appropriate screen

### Screen-to-Route Synchronization

1. User clicks navigation item in MainBottomBar
2. Navigation handler calls `navigate()` with the appropriate route
3. React Router updates the URL
4. `useRouteSync` detects the URL change
5. Updates ViewContext to match the route
6. Screen components reflect the new state

### Parameter Handling

- URL query parameters are automatically synchronized with ViewContext params
- Route parameters (e.g., `:searchQuery`) are extracted and added to screen params
- Both are passed to screen components via the ScreenLoader

## Navigation Hooks

### useView
- Provides access to the current view state
- Returns methods for navigation within the application
- Used for screen and page navigation

### useRouteSync
- Synchronizes URL routes with the ViewContext
- Handles bidirectional updates between routes and screens
- Uses a ref-based mechanism to prevent circular updates

### useParams (React Router)
- Used to access route parameters
- Integrated with ViewContext for unified parameter access

## Preventing Navigation Loops

To prevent circular updates (where a route change triggers a ViewContext update, which triggers another route change):

1. A reference (`isUpdatingRef`) tracks when an update is in progress
2. Updates are skipped if already in an update cycle
3. The reference is reset after a short timeout
4. Parameter updates are batched to reduce update frequency

## Main Components

### MainPage
- Serves as the container for main application screens
- Renders the global layout (header, navigation, content)
- Uses the Outlet component for nested routes

### SettingsPage
- Container for settings screens
- Has its own navigation sidebar
- Also uses Outlet for nested routes

### MainBottomBar
- Primary navigation component
- Organizes navigation items into categories
- Uses direct routing with React Router
- Highlights active routes based on current path

### ScreenLoader
- Renders the appropriate screen based on ViewContext
- Handles screen transitions and animations
- Passes screen parameters to components

## Best Practices

1. Use React Router's navigation functions (`navigate`, `useParams`) for routing
2. Use ViewContext for screen-specific state and transitions
3. Keep providers at the appropriate level in the component tree
4. Use the ScreenLoader for consistent transitions and parameter passing
5. Follow the established module pattern for new screens
