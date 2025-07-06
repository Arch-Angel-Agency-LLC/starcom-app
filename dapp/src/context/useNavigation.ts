import { useNavigate } from 'react-router-dom';
import { useView } from './useView';
import { ScreenType, ScreenParams, PageType } from './ViewContext';
import { screenToPathMap } from './useRouteSync';

/**
 * Hook that provides navigation utilities for the application
 * Combines React Router navigation with ViewContext screen navigation
 */
export const useNavigation = () => {
  const navigate = useNavigate();
  const { 
    navigateToScreen, 
    navigateToPage,
    goBack: contextGoBack,
    currentScreen,
    currentPage
  } = useView();

  /**
   * Navigate to a screen by screen type
   * @param screen The screen type to navigate to
   * @param params Optional parameters to pass to the screen
   * @param options Navigation options
   */
  const goToScreen = (
    screen: ScreenType, 
    params: ScreenParams = {}, 
    options: { updateUrl?: boolean } = { updateUrl: true }
  ) => {
    // Determine if we're staying on the same page or changing pages
    const isSettingsScreen = ['profile', 'appearance', 'security', 'notifications', 'advanced'].includes(screen);
    const targetPage: PageType = isSettingsScreen ? 'settings' : 'main';
    
    if (targetPage !== currentPage) {
      navigateToPage(targetPage, screen, params);
    } else {
      navigateToScreen(screen, params);
    }
    
    // Optionally update the URL (default is true)
    if (options.updateUrl !== false) {
      const path = screenToPathMap[screen];
      if (path) {
        // Convert params to URL query params
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        
        const queryString = queryParams.toString();
        const url = queryString ? `${path}?${queryString}` : path;
        
        navigate(url);
      }
    }
  };

  /**
   * Navigate back in the screen history
   * @param fallbackScreen Screen to navigate to if there's no history
   */
  const goBack = (fallbackScreen?: ScreenType) => {
    // Try to go back in the ViewContext history
    contextGoBack();
    
    // If there's no history and a fallback is provided, go to that screen
    if (fallbackScreen) {
      goToScreen(fallbackScreen);
      return true;
    }
    
    return false;
  };

  /**
   * Navigate to the home screen (globe)
   */
  const goHome = () => {
    goToScreen('globe');
  };

  /**
   * Navigate to settings
   * @param settingsScreen Optional specific settings screen to navigate to
   */
  const goToSettings = (settingsScreen: ScreenType = 'profile') => {
    // Validate that this is a settings screen
    if (!['profile', 'appearance', 'security', 'notifications', 'advanced'].includes(settingsScreen)) {
      console.error(`Invalid settings screen: ${settingsScreen}`);
      settingsScreen = 'profile';
    }
    
    // Navigate to the settings page with the specified screen
    navigateToPage('settings', settingsScreen);
    
    // Update URL to match
    const path = screenToPathMap[settingsScreen];
    navigate(path);
  };

  return {
    goToScreen,
    goBack,
    goHome,
    goToSettings,
    currentScreen,
    currentPage
  };
};
