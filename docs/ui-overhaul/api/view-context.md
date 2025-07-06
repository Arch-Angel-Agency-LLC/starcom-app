# ViewContext API Reference

**Status:** Active  
**Last Updated:** July 6, 2025

## Overview

ViewContext is a central state management system for the Starcom App UI architecture. It manages the current view state, screen selection, and provides a consistent API for navigation throughout the application. This document serves as a comprehensive reference for developers working with the ViewContext system.

## Core Concepts

### View State

The ViewContext maintains several key pieces of state:

1. **Current Page** - The active top-level page (MainPage, SettingsPage)
2. **Current Screen** - The active screen within the current page
3. **View History** - A stack of previously visited screens for navigation
4. **Screen Parameters** - Optional parameters passed to screens

### State Structure

```typescript
interface ViewState {
  currentPage: PageType;
  currentScreen: ScreenType;
  screenParams: Record<string, any>;
  viewHistory: Array<{
    screen: ScreenType;
    params?: Record<string, any>;
  }>;
  isNavAnimating: boolean;
}

type PageType = 'main' | 'settings';

type ScreenType = 
  // Main Page Screens
  | 'globe'
  | 'netrunner'
  | 'analyzer'
  | 'nodeweb'
  | 'timeline'
  | 'casemanager'
  | 'teams'
  | 'aiagent'
  | 'botroster'
  
  // Settings Page Screens
  | 'profile'
  | 'appearance'
  | 'security'
  | 'notifications'
  | 'advanced';
```

## API Reference

### Context Provider

```typescript
<ViewProvider>
  <App />
</ViewProvider>
```

The `ViewProvider` component should wrap the entire application to make the view state available throughout the component tree.

### Hook: useView

```typescript
const {
  currentPage,
  currentScreen,
  screenParams,
  isNavAnimating,
  navigateToScreen,
  navigateToPage,
  goBack,
  setScreenParams
} = useView();
```

The `useView` hook provides access to the current view state and navigation methods.

### Navigation Methods

#### navigateToScreen

```typescript
navigateToScreen(screen: ScreenType, params?: Record<string, any>): void
```

Navigates to a specific screen within the current page. Optionally accepts parameters to pass to the screen.

Example:
```typescript
// Navigate to the NetRunner screen
navigateToScreen('netrunner');

// Navigate to a specific case in the CaseManager screen
navigateToScreen('casemanager', { caseId: '12345' });
```

#### navigateToPage

```typescript
navigateToPage(page: PageType, screen?: ScreenType, params?: Record<string, any>): void
```

Navigates to a specific page, optionally specifying the initial screen and parameters.

Example:
```typescript
// Navigate to the Settings page, default screen
navigateToPage('settings');

// Navigate to the Settings page, security screen
navigateToPage('settings', 'security');
```

#### goBack

```typescript
goBack(): void
```

Navigates back to the previous screen in the history stack.

Example:
```typescript
// Go back to the previous screen
goBack();
```

#### setScreenParams

```typescript
setScreenParams(params: Record<string, any>): void
```

Updates the parameters for the current screen without changing screens.

Example:
```typescript
// Update the current screen's parameters
setScreenParams({ filter: 'recent', sort: 'date' });
```

## Integration with Routing

The ViewContext is designed to work alongside React Router for URL-based navigation:

```typescript
// Example synchronization with React Router
useEffect(() => {
  const { currentPage, currentScreen, screenParams } = viewState;
  
  // Build the appropriate URL
  let url = '/';
  if (currentPage === 'settings') {
    url = `/settings${currentScreen !== 'profile' ? `/${currentScreen}` : ''}`;
  } else if (currentScreen !== 'globe') {
    url = `/${currentScreen}`;
    
    // Add query parameters if needed
    if (Object.keys(screenParams).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(screenParams).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }
  }
  
  // Update the browser URL
  navigate(url, { replace: true });
}, [viewState, navigate]);
```

## Usage Guidelines

### When to Use ViewContext

- For navigation between screens within the application
- To maintain state that needs to persist across screen transitions
- To track navigation history for back/forward functionality

### When Not to Use ViewContext

- For component-specific state that doesn't affect navigation
- For data fetching and API state (use a data fetching library instead)
- For authentication state (use a dedicated auth context)

### Best Practices

1. **Consistent Navigation**
   - Always use the ViewContext methods for navigation
   - Avoid direct manipulation of browser history
   
2. **Minimal Parameters**
   - Keep screen parameters focused on navigation concerns
   - Use other state management solutions for complex data
   
3. **Screen Independence**
   - Design screens to function independently
   - Avoid tight coupling between screens
   
4. **Performance Considerations**
   - Be mindful of the size of screen parameters
   - Consider memoization for components that use ViewContext

## Examples

### Basic Screen Navigation

```tsx
import { useView } from '../context/ViewContext';

const BottomNavigation: React.FC = () => {
  const { currentScreen, navigateToScreen } = useView();
  
  return (
    <nav className="bottom-nav">
      <button 
        className={currentScreen === 'globe' ? 'active' : ''}
        onClick={() => navigateToScreen('globe')}
      >
        Globe
      </button>
      <button 
        className={currentScreen === 'netrunner' ? 'active' : ''}
        onClick={() => navigateToScreen('netrunner')}
      >
        NetRunner
      </button>
      {/* Additional navigation buttons */}
    </nav>
  );
};
```

### Accessing Screen Parameters

```tsx
import { useView } from '../context/ViewContext';

const CaseManager: React.FC = () => {
  const { screenParams } = useView();
  const { caseId } = screenParams;
  
  // Fetch case data based on the caseId parameter
  useEffect(() => {
    if (caseId) {
      fetchCaseData(caseId);
    }
  }, [caseId]);
  
  // Component rendering...
};
```

### Conditional Rendering Based on Current Screen

```tsx
import { useView } from '../context/ViewContext';

const MainPage: React.FC = () => {
  const { currentScreen } = useView();
  
  return (
    <div className="main-page">
      <MarqueeTopBar />
      <MainCenter>
        {currentScreen === 'globe' && <GlobeScreen />}
        {currentScreen === 'netrunner' && <NetRunnerScreen />}
        {currentScreen === 'analyzer' && <AnalyzerScreen />}
        {/* Additional screens */}
      </MainCenter>
      <MainBottomBar />
    </div>
  );
};
```

## Related Documentation

- [Navigation System](../architecture/navigation-system.md)
- [App Container Layer](../architecture/app-container-layer.md)
- [Page Layer](../architecture/page-layer.md)
- [Screen Layer](../architecture/screen-layer.md)
