import React from 'react';
import { useApplicationRouter } from '../../hooks/useApplicationRouter';
import ApplicationRenderer from '../../components/Router/ApplicationRenderer';
import ApplicationNavigator from '../../components/Router/ApplicationNavigator';
import './EnhancedApplicationDemo.css';

/**
 * Demo page to test the Enhanced Application Router system
 * 
 * This page demonstrates the new Phase 2 application routing system
 * with standalone applications, navigation, and state management.
 */
const EnhancedApplicationDemo: React.FC = () => {
  const { 
    currentApp, 
    navigateToApp, 
    getAllApplications,
    setContext,
    getContext 
  } = useApplicationRouter();

  const applications = getAllApplications().filter(app => !app.isProtected);

  const handleQuickTest = () => {
    // Test navigation with context
    navigateToApp('netrunner', 'standalone', { 
      testMode: 'demo',
      timestamp: Date.now().toString()
    });
  };

  return (
    <div className="enhanced-app-demo">
      <div className="demo-header">
        <h1>🚀 Enhanced Application Router Demo</h1>
        <p>Phase 2 implementation - Standalone applications with advanced routing</p>
        
        <div className="demo-stats">
          <div className="stat">
            <span className="stat-label">Current App:</span>
            <span className="stat-value">{currentApp || 'None'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Available Apps:</span>
            <span className="stat-value">{applications.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Test Context:</span>
            <span className="stat-value">{getContext('testMode') || 'None'}</span>
          </div>
        </div>

        <div className="demo-actions">
          <button onClick={handleQuickTest} className="test-button">
            🧪 Quick Test Navigation
          </button>
          <button 
            onClick={() => setContext('demoFlag', 'active')} 
            className="test-button"
          >
            🎯 Set Demo Context
          </button>
        </div>
      </div>

      <div className="demo-navigation">
        <h2>Application Navigator</h2>
        <ApplicationNavigator 
          layout="horizontal" 
          showCurrentApp={true}
          className="demo-nav"
        />
      </div>

      <div className="demo-renderer">
        <h2>Application Renderer</h2>
        <div className="renderer-container">
          <ApplicationRenderer className="demo-app-renderer" />
        </div>
      </div>

      <div className="demo-info">
        <h2>Phase 2 Features Demonstrated</h2>
        <ul>
          <li>✅ <strong>Standalone Applications</strong> - Each app runs independently</li>
          <li>✅ <strong>Type-Safe Navigation</strong> - Context and state preservation</li>
          <li>✅ <strong>Application Registry</strong> - Dynamic app registration and discovery</li>
          <li>✅ <strong>Multiple Presentation Modes</strong> - Standalone, modal, embedded</li>
          <li>✅ <strong>Protected Applications</strong> - CyberCommand exclusion enforced</li>
          <li>✅ <strong>Context Management</strong> - Cross-application data sharing</li>
          <li>✅ <strong>Navigation History</strong> - Back/forward navigation support</li>
        </ul>
      </div>

      <div className="demo-apps-list">
        <h2>Available Applications</h2>
        <div className="apps-grid">
          {applications.map(app => (
            <div key={app.id} className="app-card">
              <div className="app-icon-large">{app.icon}</div>
              <h3>{app.name}</h3>
              <p>{app.description}</p>
              <div className="app-modes">
                {app.supportedModes.map(mode => (
                  <span key={mode} className={`mode-tag ${mode}`}>
                    {mode}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigateToApp(app.id)}
                className="app-launch-button"
                disabled={currentApp === app.id}
              >
                {currentApp === app.id ? 'Current' : 'Launch'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedApplicationDemo;
