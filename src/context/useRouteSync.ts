import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useView } from './useView';
import { ScreenType, PageType } from './ViewContext';

// Map URL paths to screen types
const pathToScreenMap: Record<string, { screen: ScreenType; page: PageType }> = {
  '/': { screen: 'globe', page: 'main' },
  '/netrunner': { screen: 'netrunner', page: 'main' },
  '/analyzer': { screen: 'analyzer', page: 'main' },
  '/nodeweb': { screen: 'nodeweb', page: 'main' },
  '/timeline': { screen: 'timeline', page: 'main' },
  '/cases': { screen: 'casemanager', page: 'main' },
  '/teams': { screen: 'teams', page: 'main' },
  '/aiagent': { screen: 'aiagent', page: 'main' },
  '/bots': { screen: 'botroster', page: 'main' },
  '/settings/profile': { screen: 'profile', page: 'settings' },
  '/settings/appearance': { screen: 'appearance', page: 'settings' },
  '/settings/security': { screen: 'security', page: 'settings' },
  '/settings/notifications': { screen: 'notifications', page: 'settings' },
  '/settings/advanced': { screen: 'advanced', page: 'settings' }
};

// Legacy paths that need to be redirected
const legacyPathRedirects: Record<string, string> = {
  '/info-analysis': '/analyzer',
  '/node-web': '/nodeweb',
  '/ai-agent': '/aiagent',
};

// Map screen types to URL paths
export const screenToPathMap: Record<ScreenType, string> = {
  'globe': '/',
  'netrunner': '/netrunner',
  'analyzer': '/analyzer',
  'nodeweb': '/nodeweb',
  'timeline': '/timeline',
  'casemanager': '/cases',
  'teams': '/teams',
  'aiagent': '/aiagent',
  'botroster': '/bots',
  'profile': '/settings/profile',
  'appearance': '/settings/appearance',
  'security': '/settings/security',
  'notifications': '/settings/notifications',
  'advanced': '/settings/advanced'
};

/**
 * Custom hook to synchronize URL routes with ViewContext screens
 * This enables deep linking and browser history to work with our screen system
 */
export const useRouteSync = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { currentScreen, currentPage, navigateToScreen, navigateToPage, screenParams, setScreenParams } = useView();
  
  // Use a ref to prevent circular updates between URL changes and ViewContext changes
  const isUpdatingRef = useRef(false);

  // Extract the base path from the current pathname
  const getBasePath = (path: string): string => {
    // For nested routes like /netrunner/search-term, extract the base path (/netrunner)
    const firstSlashIndex = path.indexOf('/', 1);
    if (firstSlashIndex === -1) return path;
    
    // Handle settings routes specially
    if (path.startsWith('/settings/')) {
      return path;
    }
    
    return path.substring(0, firstSlashIndex);
  };

  // Handle route changes by updating ViewContext
  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    // Check for legacy path redirects
    const currentPath = location.pathname;
    if (legacyPathRedirects[currentPath]) {
      navigate(legacyPathRedirects[currentPath] + location.search, { replace: true });
      return;
    }
    
    // Get the base path for mapping
    const basePath = getBasePath(currentPath);
    const matchingInfo = pathToScreenMap[basePath];
    
    if (matchingInfo) {
      const { screen, page } = matchingInfo;
      
      // Check if we need to change the page and/or screen
      const needsPageChange = page !== currentPage;
      const needsScreenChange = screen !== currentScreen || needsPageChange;
      
      if (needsScreenChange) {
        // Extract URL params and query params
        const urlParams = new URLSearchParams(location.search);
        const newParams = {
          ...Object.fromEntries(urlParams.entries()),
          ...params // Include route params
        };
        
        // Prevent circular updates
        isUpdatingRef.current = true;
        
        // Update the page and screen in ViewContext
        if (needsPageChange) {
          navigateToPage(page, screen, newParams);
        } else {
          navigateToScreen(screen, newParams);
        }
        
        // Reset the update flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 50);
      }
    }
  }, [location, currentScreen, currentPage, navigateToScreen, navigateToPage, params, navigate]);

  // Handle ViewContext changes by updating the URL
  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    const currentPath = location.pathname;
    const targetPath = screenToPathMap[currentScreen];
    
    // Check if the URL needs updating
    const shouldUpdateUrl = targetPath && !currentPath.startsWith(targetPath);
    
    if (shouldUpdateUrl) {
      // Convert screen params to URL query params
      const queryParams = new URLSearchParams();
      Object.entries(screenParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && 
            // Don't include route params in query string
            !Object.keys(params).includes(key)) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      const url = queryString ? `${targetPath}?${queryString}` : targetPath;
      
      // Prevent circular updates
      isUpdatingRef.current = true;
      
      // Update URL without triggering a full page reload
      navigate(url, { replace: true });
      
      // Reset the update flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  }, [currentScreen, screenParams, location.pathname, navigate, params]);
  
  // Handle dynamic parameters in the URL
  useEffect(() => {
    if (Object.keys(params).length > 0 && !isUpdatingRef.current) {
      setScreenParams(params);
    }
  }, [params, setScreenParams]);
};
