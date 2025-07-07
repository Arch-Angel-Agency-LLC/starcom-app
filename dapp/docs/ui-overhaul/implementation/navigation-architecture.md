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

## Navigation Component Structure

The MainPage component is structured to ensure proper component hierarchy and layout:

```
MainPage
├── GlobalHeader (top bar with logo, search)
├── MarqueeTopBar (status indicators)
├── MainCenter (main content area)
│   └── ScreenLoader (renders the active screen)
│       └── Actual Screen Component
└── MainBottomBar (navigation bar)
```

Key points:
- `MainBottomBar` is positioned at the same level as `MainCenter` and `GlobalHeader`
- `MainBottomBar` uses relative positioning rather than fixed positioning
- Screen components fill the available space in `MainCenter`
- Each screen component is lazy-loaded for better performance

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

## GlobeScreen and HUDLayout Integration

The GlobeScreen is a special case with additional considerations:

```
GlobeScreen
└── HUDLayout (isEmbedded=true)
    ├── TopLeftCorner, TopRightCorner, etc.
    ├── NewBottomBar (embeddedBottomBar)
    └── CenterViewManager (globeOnly=true)
```

Key points:
- `GlobeScreen` contains `HUDLayout` in embedded mode
- `HUDLayout` has its own `NewBottomBar` that's distinct from `MainBottomBar`
- The positioning is handled through CSS classes rather than dynamic JavaScript adjustments
- `CenterViewManager` in globe-only mode focuses exclusively on the 3D globe visualization

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

## Screen Components

### Common Structure
Each screen follows a similar pattern:

```tsx
const ScreenName: React.FC = () => {
  return (
    <div className={styles.screenName}>
      <div className={styles.container}>
        <h1 className={styles.title}>Screen Title</h1>
        <div className={styles.content}>
          {/* Screen-specific content */}
        </div>
      </div>
    </div>
  );
};
```

### Implemented Screens
- **GlobeScreen**: Displays the 3D globe visualization within HUDLayout
- **TeamsScreen**: Team collaboration with TeamCollaborationHub integration
- **NetRunnerScreen**: Intelligence gathering with search and entity extraction
- **AnalyzerScreen**: Intelligence analysis with dashboard cards and visualization
- **NodeWebScreen**: Network topology visualization with filters and node details

## Best Practices

1. Use React Router's navigation functions (`navigate`, `useParams`) for routing
2. Use ViewContext for screen-specific state and transitions
3. Keep providers at the appropriate level in the component tree
4. Use the ScreenLoader for consistent transitions and parameter passing
5. Follow the established module pattern for new screens
6. Use relative positioning for navigation bars to maintain proper document flow
7. Implement responsive layouts for all screen components
8. Lazy-load screen components for better performance
