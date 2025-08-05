import { useCallback } from 'react';
import { usePopup } from '../components/Popup/PopupManager';
import IntelDashboardPopup from '../components/Intel/IntelDashboardPopup';

export interface UseIntelDashboardOptions {
  filterMode?: 'PUBLIC' | 'TEAM' | 'PERSONAL' | 'ALL';
}

export const useIntelDashboard = () => {
  const { showPopup } = usePopup();

  const openIntelDashboard = useCallback((options: UseIntelDashboardOptions = {}) => {
    const { filterMode = 'ALL' } = options;

    const popupId = showPopup({
      component: IntelDashboardPopup,
      props: {
        filterMode
      },
      zIndex: 10000, // Highest hierarchy layer
      backdrop: true,
    });

    return popupId;
  }, [showPopup]);

  return {
    openIntelDashboard,
  };
};

export default useIntelDashboard;
