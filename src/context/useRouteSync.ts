import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useView } from './useView';
import { ScreenType, PageType } from './ViewContext';

// Map URL paths to screen types
const pathToScreenMap: Record<string, { screen: ScreenType; page: PageType }> = {
  '/': { screen: 'globe', page: 'main' },
  '/search': { screen: 'search', page: 'main' },
  '/netrunner': { screen: 'netrunner', page: 'main' },
  '/intelanalyzer': { screen: 'intelanalyzer', page: 'main' },
  '/marketexchange': { screen: 'marketexchange', page: 'main' },
  '/monitoring': { screen: 'monitoring', page: 'main' },
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
  '/info-analysis': '/intelanalyzer',
  '/analyzer': '/intelanalyzer',
  '/node-web': '/nodeweb',
  '/ai-agent': '/aiagent',
};

// Map screen types to URL paths
export const screenToPathMap: Record<ScreenType, string> = {
  'globe': '/',
  'search': '/search',
  'netrunner': '/netrunner',
  'intelanalyzer': '/intelanalyzer',
  'marketexchange': '/marketexchange',
  'monitoring': '/monitoring',
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
 * 
 * Uses a single source of truth approach to prevent circular updates
 */
export const useRouteSync = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { currentScreen, currentPage, navigateToScreen, navigateToPage, screenParams, setScreenParams } = useView();
  
  // Track the source of changes to prevent infinite loops
  const lastUrlChangeRef = useRef<string>('');
  const lastScreenChangeRef = useRef<ScreenType | null>(null);
  const navigationSourceRef = useRef<'url' | 'view' | null>(null);

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

  // Single effect to handle all synchronization
  useEffect(() => {
    const currentPath = location.pathname;
    console.log('🔗 useRouteSync: State change detected', {
      currentPath,
      currentScreen,
      lastUrl: lastUrlChangeRef.current,
      lastScreen: lastScreenChangeRef.current,
      navigationSource: navigationSourceRef.current
    });

    // Handle legacy redirects first
    if (legacyPathRedirects[currentPath]) {
      console.log('🔗 useRouteSync: Legacy path redirect', { from: currentPath, to: legacyPathRedirects[currentPath] });
      navigate(legacyPathRedirects[currentPath] + location.search, { replace: true });
      return;
    }

    // Determine if this is a URL change or ViewContext change
    const urlChanged = currentPath !== lastUrlChangeRef.current;
    const screenChanged = currentScreen !== lastScreenChangeRef.current;
    
    console.log('🔗 useRouteSync: Change analysis', {
      urlChanged,
      screenChanged,
      shouldSyncFromUrl: urlChanged && !screenChanged,
      shouldSyncFromView: screenChanged && !urlChanged
    });

    if (urlChanged && !screenChanged) {
      // URL changed, need to update ViewContext
      navigationSourceRef.current = 'url';
      console.log('🔗 useRouteSync: Syncing ViewContext from URL change');
      
      const basePath = getBasePath(currentPath);
      const matchingInfo = pathToScreenMap[basePath];
      
      if (matchingInfo) {
        const { screen, page } = matchingInfo;
        const needsPageChange = page !== currentPage;
        const needsScreenChange = screen !== currentScreen || needsPageChange;
        
        if (needsScreenChange) {
          // Extract URL params and query params
          const urlParams = new URLSearchParams(location.search);
          const newParams = {
            ...Object.fromEntries(urlParams.entries()),
            ...params
          };
          
          console.log('🔗 useRouteSync: Updating ViewContext', { page, screen, params: newParams });
          
          if (needsPageChange) {
            navigateToPage(page, screen, newParams);
          } else {
            navigateToScreen(screen, newParams);
          }
        }
      } else {
        console.warn('🔗 useRouteSync: No mapping found for path', { currentPath, basePath });
      }
      
      lastUrlChangeRef.current = currentPath;
      
    } else if (screenChanged && !urlChanged) {
      // ViewContext changed, need to update URL
      navigationSourceRef.current = 'view';
      console.log('🔗 useRouteSync: Syncing URL from ViewContext change');
      
      const targetPath = screenToPathMap[currentScreen];
      
      if (targetPath && !currentPath.startsWith(targetPath)) {
        // Convert screen params to URL query params
        const queryParams = new URLSearchParams();
        Object.entries(screenParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && !Object.keys(params).includes(key)) {
            queryParams.append(key, String(value));
          }
        });
        
        const queryString = queryParams.toString();
        const url = queryString ? `${targetPath}?${queryString}` : targetPath;
        
        console.log('🔗 useRouteSync: Updating URL', { from: currentPath, to: url });
        navigate(url, { replace: true });
        lastUrlChangeRef.current = url.split('?')[0]; // Store path without query
      }
      
      lastScreenChangeRef.current = currentScreen;
      
    } else if (urlChanged && screenChanged) {
      // Both changed simultaneously - this shouldn't happen but handle gracefully
      console.warn('🔗 useRouteSync: Both URL and screen changed simultaneously', {
        urlFrom: lastUrlChangeRef.current,
        urlTo: currentPath,
        screenFrom: lastScreenChangeRef.current,
        screenTo: currentScreen
      });
      
      // Update our tracking refs to prevent further confusion
      lastUrlChangeRef.current = currentPath;
      lastScreenChangeRef.current = currentScreen;
    }

    // Reset navigation source after a brief delay
    setTimeout(() => {
      navigationSourceRef.current = null;
    }, 50);

  }, [location, currentScreen, currentPage, navigateToScreen, navigateToPage, params, navigate, screenParams]);

  // Handle dynamic parameters separately to avoid interference
  useEffect(() => {
    if (Object.keys(params).length > 0) {
      console.log('🔗 useRouteSync: Setting dynamic params', params);
      setScreenParams(params);
    }
  }, [params, setScreenParams]);
};
