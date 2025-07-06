# App Container Layer

**Layer Level:** First Level (Top)

## Overview

The App Container is the top-most layer in the Starcom App architecture. It provides the global structure and context for the entire application.

## Components

### Header
- **Purpose:** Global navigation and application status
- **Persistence:** Present across all pages
- **Key Features:**
  - Application branding/logo
  - User account access
  - Settings button (navigates to Settings Page)
  - Notifications indicator
  - Global actions (e.g., help, logout)
- **Technical Considerations:**
  - Should be lightweight and performant
  - Must adapt to different screen sizes
  - Handles global state related to user authentication

### Pages Container
- **Purpose:** Houses all page-level components
- **Behavior:** Only one page is visible at a time
- **Technical Implementation:**
  - Implemented using React Router's routing system
  - Handles transitions between pages
  - Preserves state when navigating between pages

## State Management

The App Container manages application-wide state including:
- Authentication status
- User preferences
- Global notifications
- Application theme

## Interfaces

### To Child Components
- Provides context for global state (themes, user info)
- Supplies navigation capabilities

### To External Systems
- Handles authentication with backend services
- Manages API connections

## Implementation Guidelines

### Component Structure
```tsx
<AppContainer>
  <Header />
  <PagesContainer>
    {/* Only one of these is rendered based on routes */}
    <MainPage /> 
    <SettingsPage />
    {/* Future pages */}
  </PagesContainer>
</AppContainer>
```

### Styling Approach
- Use CSS modules for component-specific styling
- Global styles for consistent theming
- Responsive design principles for all viewports

## Future Considerations

- Support for additional standalone pages
- Enhanced theming capabilities
- Integration with native mobile capabilities
- Offline mode support
