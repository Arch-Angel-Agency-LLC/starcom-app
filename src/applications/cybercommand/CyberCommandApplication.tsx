import React from 'react';
import CyberCommandHUDLayout from '../../layouts/CyberCommandHUDLayout/CyberCommandHUDLayout';
import { ApplicationContext } from '../../components/Router/ApplicationRouter';
import './CyberCommandApplication.css';

/**
 * CyberCommand Application - The flagship 3D Globe interface with cyberpunk HUD
 * 
 * This application provides:
 * - Real-time 3D globe visualization
 * - Cyberpunk-themed HUD interface
 * - Command and control interface
 * - Advanced floating panel system
 * - Secure communications
 * - Performance monitoring
 * - Gaming enhancements
 */
interface CyberCommandApplicationProps extends ApplicationContext {
  className?: string;
}

const CyberCommandApplication: React.FC<CyberCommandApplicationProps> = () => {
  return (
    <div 
      className="cybercommand-application"
    >
      {/* 
        Use the existing CyberCommandHUDLayout in embedded mode 
        This ensures it integrates properly with the Enhanced Application Router
        while maintaining all the sophisticated HUD functionality
      */}
      <CyberCommandHUDLayout isEmbedded={true} />
    </div>
  );
};

export default CyberCommandApplication;
