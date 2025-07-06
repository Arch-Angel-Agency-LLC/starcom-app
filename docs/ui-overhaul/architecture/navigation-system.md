# Navigation System

## Overview

The Starcom App's navigation system is designed as a hierarchical structure that enables users to move between different levels of the application efficiently. The system integrates with React Router for URL-based navigation while providing custom UI elements for intuitive movement through the application.

## Navigation Hierarchy

### Level 1: Page Navigation
- **Controls movement between Pages**
- Primary navigation points:
  - Header → Settings Page
  - Settings Page → Main Page
  - Auth Pages → Main Page
- Implemented using React Router
- Results in URL changes

### Level 2: Screen Navigation (within MainPage)
- **Controls movement between Screens**
- Primary navigation through MainBottomBar
- Each screen has a dedicated button in the MainBottomBar
- Implemented using a combination of React Router and view state
- Updates URL and ViewContext

### Level 3: Intra-Screen Navigation
- **Controls movement within Screens**
- Screen-specific navigation elements:
  - Tabs
  - Panels
  - Menus
  - Breadcrumbs
- Handled by screen-specific logic
- May or may not update URL (depends on deep-linking requirements)

## Key Navigation Components

### MainBottomBar
- **Purpose:** Primary navigation between screens in MainPage
- **Location:** Bottom of MainPage
- **Behavior:**
  - Highlights the active screen
  - Provides tooltips for available screens
  - May show notification indicators on screens requiring attention
  - Can be extended with new screen options

### Header Navigation
- **Purpose:** Access to Settings and account functions
- **Location:** Top of application (in App Container)
- **Behavior:**
  - Settings button navigates to SettingsPage
  - User menu provides access to account functions and logout
  - May include breadcrumbs for deep navigation states

### ViewContext Integration
- Navigation system integrates with ViewContext
- Current view state is stored in context for reactive UI updates
- Navigation actions update both URL and ViewContext

## URL Structure

The application uses a structured URL approach:

- `/` - MainPage with GlobeScreen
- `/settings` - SettingsPage
- `/netrunner`, `/analyzer`, etc. - MainPage with specific screens
- `/teams/:teamId`, `/cases/:caseId`, etc. - Deep linking to specific content

## Navigation State Management

- **ViewContext:** Maintains current view state
- **React Router:** Manages URL-based navigation
- **History Management:** Supports browser back/forward navigation
- **Deep Linking:** Enables direct access to specific application states

## Implementation Example

```tsx
// MainBottomBar navigation example
const handleNavigation = (screen: ScreenType) => {
  // Update ViewContext
  setCurrentView(screen);
  
  // Navigate to corresponding route
  navigate(`/${screen}`);
  
  // Any additional logic (analytics, etc.)
  trackNavigation(screen);
};

// In component
<button 
  onClick={() => handleNavigation('netrunner')}
  className={currentView === 'netrunner' ? 'active' : ''}
>
  NetRunner
</button>
```

## Accessibility Considerations

- All navigation elements must be keyboard accessible
- Focus management between navigation events
- Proper ARIA attributes for navigation components
- Skip navigation links for screen readers

## Mobile Considerations

- Responsive navigation adapts to smaller screens
- Touch-friendly navigation elements
- Consider gesture-based navigation for mobile
- Collapsible navigation for space efficiency

## Future Enhancements

- Navigation history for quick access to recent screens
- Customizable MainBottomBar (reordering, favorites)
- Context-aware navigation suggestions
- Workflow-based navigation for common task sequences
