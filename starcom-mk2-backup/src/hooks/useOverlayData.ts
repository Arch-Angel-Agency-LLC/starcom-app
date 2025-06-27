import { useState, useEffect } from 'react';

// AI-NOTE: Shared hook for overlay data used by both Globe Controls and Globe Status
// Provides real-time simulation of globe overlay data

interface OverlayData {
  activeOverlays: string[];
  overlayStats: { [key: string]: { count: number; lastUpdate: string } };
}

export const useOverlayData = (): OverlayData => {
  const [overlayData, setOverlayData] = useState<OverlayData>({
    activeOverlays: [],
    overlayStats: {}
  });

  useEffect(() => {
    // For now, simulate realistic data that updates periodically
    const updateData = () => {
      const activeOverlays = ['geomagnetic', 'aurora', 'satellites'];
      
      // Simulate realistic counts and timestamps
      const overlayStats = {
        geomagnetic: { 
          count: Math.floor(Math.random() * 8) + 3, 
          lastUpdate: `${Math.floor(Math.random() * 5) + 1} min ago` 
        },
        aurora: { 
          count: Math.floor(Math.random() * 12) + 2, 
          lastUpdate: `${Math.floor(Math.random() * 3) + 1} min ago` 
        },
        satellites: { 
          count: Math.floor(Math.random() * 25) + 15, 
          lastUpdate: `${Math.floor(Math.random() * 2) + 1} min ago` 
        },
        alerts: { 
          count: Math.floor(Math.random() * 3), 
          lastUpdate: `${Math.floor(Math.random() * 60) + 1} sec ago` 
        }
      };

      setOverlayData({ activeOverlays, overlayStats });
    };

    updateData();
    const interval = setInterval(updateData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return overlayData;
};
