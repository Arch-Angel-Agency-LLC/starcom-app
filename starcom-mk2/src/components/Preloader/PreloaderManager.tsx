import React, { useState, useEffect } from 'react';
import StarcomPreloader from './StarcomPreloader';
import './PreloaderManager.css';

interface PreloaderManagerProps {
  children: React.ReactNode;
  minimumDisplayTime?: number; // Minimum time to show preloader (in ms)
}

/**
 * PreloaderManager - Controls the display and timing of the preloader
 * Ensures the preloader shows for a minimum time and handles smooth transitions
 */
const PreloaderManager: React.FC<PreloaderManagerProps> = ({ 
  children, 
  minimumDisplayTime = 1800 // Reduced to 1.8s to transition to globe loading faster
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showPreloader, setShowPreloader] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    
    // Function to hide preloader with smooth transition
    const hidePreloader = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumDisplayTime - elapsedTime);
      
      setTimeout(() => {
        setIsLoading(false);
        // After fade-out animation completes, remove preloader from DOM
        setTimeout(() => {
          setShowPreloader(false);
        }, 500); // Match CSS transition duration
      }, remainingTime);
    };

    // Detect when the main app is ready
    const checkAppReady = () => {
      // Check if critical resources are loaded
      const criticalElements = [
        document.querySelector('#root'),
        // Add other critical elements that should be loaded
      ];
      
      const allElementsReady = criticalElements.every(el => el !== null);
      
      if (allElementsReady && !appReady) {
        setAppReady(true);
        hidePreloader();
      }
    };

    // Initial check
    if (document.readyState === 'complete') {
      checkAppReady();
    } else {
      // Wait for DOM to be ready
      const handleDOMReady = () => {
        checkAppReady();
      };
      
      document.addEventListener('DOMContentLoaded', handleDOMReady);
      window.addEventListener('load', handleDOMReady);
      
      // Fallback timeout to ensure preloader doesn't stay forever
      const fallbackTimeout = setTimeout(() => {
        if (!appReady) {
          setAppReady(true);
          hidePreloader();
        }
      }, 5000);

      return () => {
        document.removeEventListener('DOMContentLoaded', handleDOMReady);
        window.removeEventListener('load', handleDOMReady);
        clearTimeout(fallbackTimeout);
      };
    }
  }, [minimumDisplayTime, appReady]);

  // Don't render children until preloader is completely hidden
  return (
    <>
      {showPreloader && (
        <div className={`preloader-overlay ${!isLoading ? 'fade-out' : ''}`}>
          <StarcomPreloader />
        </div>
      )}
      <div className={`app-content ${showPreloader ? 'hidden' : 'visible'}`}>
        {children}
      </div>
    </>
  );
};

export default PreloaderManager;
