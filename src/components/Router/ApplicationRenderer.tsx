import React from 'react';
import { useEnhancedApplicationRouter } from '../../hooks/useEnhancedApplicationRouter';
import './ApplicationRenderer.css';

interface ApplicationRendererProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ApplicationRenderer - Renders the current application based on router state
 * 
 * This component serves as the main renderer for the enhanced application system.
 * It automatically renders the current application based on the router state and
 * handles different presentation modes (standalone, modal, etc.)
 */
export const ApplicationRenderer: React.FC<ApplicationRendererProps> = ({ 
  className = '', 
  style = {} 
}) => {
  const { 
    currentApp, 
    presentationMode, 
    context,
    getApplication,
    goBack 
  } = useEnhancedApplicationRouter();

  const handleCloseModal = () => {
    // Use goBack to return to previous application or close modal
    goBack();
  };

  // No application selected
  if (!currentApp) {
    return (
      <div className={`application-renderer no-app ${className}`} style={style}>
        <div className="no-app-message">
          <h2>No Application Selected</h2>
          <p>Select an application to get started</p>
        </div>
      </div>
    );
  }

  // Get application configuration
  const appConfig = getApplication(currentApp);
  if (!appConfig) {
    return (
      <div className={`application-renderer app-error ${className}`} style={style}>
        <div className="app-error-message">
          <h2>Application Not Found</h2>
          <p>Application "{currentApp}" is not registered in the system</p>
        </div>
      </div>
    );
  }

  const AppComponent = appConfig.component;

  // Render application based on presentation mode
  const renderApplication = () => (
    <AppComponent {...context} />
  );

  switch (presentationMode) {
    case 'standalone':
      return (
        <div 
          className={`application-renderer standalone ${currentApp}-app ${className}`} 
          style={style}
        >
          {/* Remove redundant application headers for all sub-applications */}
          {!['cybercommand', 'netrunner', 'intelanalyzer', 'timemap', 'nodeweb', 'teamworkspace', 'marketexchange'].includes(currentApp) && (
            <div className="application-header">
              <div className="app-info">
                <span className="app-icon">{appConfig.icon}</span>
                <h1 className="app-title">{appConfig.name}</h1>
                <p className="app-description">{appConfig.description}</p>
              </div>
            </div>
          )}
          <div className="application-content">
            {renderApplication()}
          </div>
        </div>
      );

    case 'modal':
      return (
        <div className={`application-renderer modal-backdrop ${className}`} style={style}>
          <div className={`modal-container ${currentApp}-modal`}>
            <div className="modal-header">
              <div className="app-info">
                <span className="app-icon">{appConfig.icon}</span>
                <h2 className="app-title">{appConfig.name}</h2>
              </div>
              <button 
                className="modal-close" 
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              {renderApplication()}
            </div>
          </div>
        </div>
      );

    case 'embedded':
      // Embedded mode - minimal chrome
      return (
        <div 
          className={`application-renderer embedded ${currentApp}-embedded ${className}`} 
          style={style}
        >
          {renderApplication()}
        </div>
      );

    default:
      return (
        <div className={`application-renderer mode-error ${className}`} style={style}>
          <div className="mode-error-message">
            <h2>Unsupported Presentation Mode</h2>
            <p>Presentation mode "{presentationMode}" is not supported</p>
          </div>
        </div>
      );
  }
};

export default ApplicationRenderer;
