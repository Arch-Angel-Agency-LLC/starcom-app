import { useContext, useCallback } from 'react';
import { EnhancedApplicationRouterContext } from '../context/EnhancedApplicationRouterContext';
import { 
  type ApplicationId,
  type EnhancedApplicationRouterContextType 
} from '../components/Router/EnhancedApplicationRouter';

// Hook to use the enhanced router
export const useEnhancedApplicationRouter = (): EnhancedApplicationRouterContextType => {
  const context = useContext(EnhancedApplicationRouterContext);
  if (!context) {
    throw new Error('useEnhancedApplicationRouter must be used within an EnhancedApplicationRouterProvider');
  }
  return context;
};

// URL-based navigation support
export const useUrlNavigation = () => {
  const router = useEnhancedApplicationRouter();

  const navigateToUrl = useCallback((url: string) => {
    const urlParts = url.split('/').filter(Boolean);
    if (urlParts.length === 0) return;

    const appId = urlParts[0] as ApplicationId;
    const params = new URLSearchParams(urlParts.slice(1).join('&'));
    const context = Object.fromEntries(params.entries());

    router.navigateToApp(appId, undefined, context);
  }, [router]);

  const getCurrentUrl = useCallback(() => {
    if (!router.currentApp) return '/';
    
    // Convert context object to URLSearchParams
    const contextEntries = Object.entries(router.context)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [key, String(value)]);
    const params = new URLSearchParams(contextEntries).toString();
    return `/${router.currentApp}${params ? `?${params}` : ''}`;
  }, [router.currentApp, router.context]);

  return { navigateToUrl, getCurrentUrl };
};
