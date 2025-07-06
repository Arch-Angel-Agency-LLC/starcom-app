# Route Synchronization Implementation

**Created:** July 6, 2025  
**Status:** Complete

This document outlines the implementation of route synchronization in the Starcom App, which provides bidirectional updates between URL routes and the application's screen state managed by ViewContext.

## Overview

Route synchronization ensures that:

1. When a user navigates to a URL, the application shows the corresponding screen
2. When a screen changes within the application, the URL is updated to match
3. Browser history and deep linking work correctly with our screen-based navigation

This enables bookmarking, sharing links to specific screens, and proper browser back/forward navigation.

## Implementation Components

### 1. `useRouteSync` Hook

The core of our synchronization system is the `useRouteSync` hook in `/src/context/useRouteSync.ts`. This hook:

- Maps URL paths to screen types and vice versa
- Listens for URL changes and updates the ViewContext
- Listens for screen changes in ViewContext and updates the URL
- Handles URL query parameters as screen parameters

```typescript
// Example mapping
const pathToScreenMap: Record<string, { screen: ScreenType; page: PageType }> = {
  '/': { screen: 'globe', page: 'main' },
  '/netrunner': { screen: 'netrunner', page: 'main' },
  // ...
};

// And the inverse mapping
export const screenToPathMap: Record<ScreenType, string> = {
  'globe': '/',
  'netrunner': '/netrunner',
  // ...
};
```

### 2. `RouteSynchronizer` Component

The `RouteSynchronizer` component in `/src/components/Navigation/RouteSynchronizer.tsx` is a simple wrapper that activates the `useRouteSync` hook. It's placed at the app root level in `App.tsx` to ensure synchronization is always active.

```tsx
const RouteSynchronizer: React.FC = () => {
  // Activate the route synchronization hook
  useRouteSync();
  
  // This component doesn't render anything visible
  return null;
};
```

### 3. Route Configuration

The application's routes in `/src/routes/routes.tsx` are configured to work with our screen system:

- Main application routes all use the `MainPage` component, which internally uses `ViewContext`
- Settings routes all use the `SettingsPage` component, which also uses `ViewContext`
- Legacy and standalone routes continue to use their own components

```tsx
// Example route configuration
<Route path="/netrunner" element={<MainPage />} />
<Route path="/settings/profile" element={<SettingsPage />} />
```

### 4. Navigation API

The `useNavigation` hook in `/src/context/useNavigation.ts` provides a clean API for programmatic navigation that updates both the ViewContext and the URL:

```typescript
// Example navigation API
const { goToScreen, goBack, goHome, goToSettings } = useNavigation();

// Navigate to a screen
goToScreen('netrunner', { tool: 'scanner' });

// Navigate to settings
goToSettings('security');
```

## Integration Flow

1. When a user enters a URL or clicks a link:
   - React Router updates the location
   - `useRouteSync` detects the location change
   - `useRouteSync` finds the matching screen from `pathToScreenMap`
   - `useRouteSync` calls `navigateToScreen` or `navigateToPage` on ViewContext
   - ViewContext updates the screen state
   - The application renders the appropriate screen

2. When a screen changes programmatically:
   - A component calls `navigateToScreen` from ViewContext
   - ViewContext updates the screen state
   - `useRouteSync` detects the screen change
   - `useRouteSync` finds the matching path from `screenToPathMap`
   - `useRouteSync` calls `navigate` from React Router
   - The URL is updated without a page reload

## Error Handling

- If a route doesn't match any screen, the application defaults to the home screen
- If a screen doesn't match any route, the URL defaults to the home route
- A catch-all route redirects unknown paths to the home screen

## Future Enhancements

1. **Enhanced Parameter Handling**: Improve handling of complex screen parameters in URLs
2. **Route Guards**: Add route-specific authentication and permission checks
3. **Route Analytics**: Track screen navigation for analytics
4. **Transition Persistence**: Maintain screen transition animations during route changes

## Testing

Route synchronization has been tested for:

- Direct URL navigation to all screens
- Programmatic navigation between screens
- Browser back/forward navigation
- Bookmarking and reloading specific screens
- Parameter passing through URLs

## Conclusion

The route synchronization system provides a robust foundation for the Starcom App's new navigation architecture. It ensures a consistent user experience across all navigation methods and enables proper deep linking and history management.
