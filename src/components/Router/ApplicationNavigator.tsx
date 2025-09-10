import React from 'react';
import { useApplicationRouter } from '../../hooks/useApplicationRouter';
import type { ApplicationId, PresentationMode } from './ApplicationRouter';
import './ApplicationNavigator.css';

interface ApplicationNavigatorProps {
  className?: string;
  showCurrentApp?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

/**
 * ApplicationNavigator - Provides navigation UI for switching between applications
 * 
 * This component renders a navigation interface allowing users to switch between
 * available applications. It excludes protected applications like CyberCommand.
 */
export const ApplicationNavigator: React.FC<ApplicationNavigatorProps> = ({
  className = '',
  showCurrentApp = true,
  layout = 'horizontal'
}) => {
  const { 
    currentApp,
    navigateToApp,
    getAllApplications,
    goBack,
    history
  } = useApplicationRouter();

  const applications = getAllApplications().filter(app => !app.isProtected);

  const handleNavigate = (appId: ApplicationId, mode?: PresentationMode) => {
    navigateToApp(appId, mode);
  };

  const canGoBack = history.length > 0;

  return (
    <nav className={`application-navigator ${layout} ${className}`}>
      {/* Back button */}
      {canGoBack && (
        <button 
          className="nav-button back-button"
          onClick={goBack}
          title="Go back to previous application"
        >
          ← Back
        </button>
      )}

      {/* Application buttons */}
      <div className="app-buttons">
        {applications.map(app => (
          <button
            key={app.id}
            className={`nav-button app-button ${currentApp === app.id ? 'active' : ''}`}
            data-app={app.id}
            onClick={() => handleNavigate(app.id)}
            title={app.description}
            disabled={!showCurrentApp && currentApp === app.id}
          >
            <span className="app-icon">{app.icon}</span>
            <span className="app-name">{app.name}</span>
          </button>
        ))}
      </div>

      {/* Current app indicator */}
      {showCurrentApp && currentApp && (
        <div className="current-app-indicator">
          <span className="current-label">Current:</span>
          <span className="current-app">
            {applications.find(app => app.id === currentApp)?.icon} 
            {applications.find(app => app.id === currentApp)?.name}
          </span>
        </div>
      )}
    </nav>
  );
};

export default ApplicationNavigator;
