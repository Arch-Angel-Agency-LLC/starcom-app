import { useNavigate } from 'react-router-dom';
import { ViewMode } from '../../context/ViewContext';

/**
 * Hook to handle navigation between different views
 * Maps view modes to their corresponding routes
 */
export const useViewNavigation = () => {
  const navigate = useNavigate();

  /**
   * Navigate to the appropriate route based on the view mode
   */
  const navigateToView = (view: ViewMode) => {
    const viewRouteMap: Record<ViewMode, string> = {
      'globe': '/',
      'teams': '/teams',
      'ai-agent': '/ai-agent',
      'bots': '/bots',
      'netrunner': '/netrunner',
      'info-gathering': '/info-gathering',
      'info-analysis': '/info-analysis',
      'node-web': '/node-web',
      'timeline': '/timeline',
      'cases': '/cases',
      'intel': '/intel'
    };

    const route = viewRouteMap[view];
    if (route) {
      navigate(route);
    } else {
      console.warn(`No route defined for view: ${view}`);
      navigate('/');
    }
  };

  return { navigateToView };
};
