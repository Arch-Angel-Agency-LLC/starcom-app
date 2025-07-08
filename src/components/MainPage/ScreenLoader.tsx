import React, { lazy, Suspense } from 'react';
import { ScreenType } from '../../context/ViewContext';

// Lazily load screen components for better performance
// Main screens
const GlobeScreen = lazy(() => import('../../pages/MainPage/Screens/GlobeScreen'));
const NetRunnerScreen = lazy(() => import('../../pages/MainPage/Screens/NetRunnerScreen'));
const TeamsScreen = lazy(() => import('../../pages/MainPage/Screens/TeamsScreen'));
const AnalyzerScreen = lazy(() => import('../../pages/MainPage/Screens/AnalyzerScreen'));
const NodeWebScreen = lazy(() => import('../../pages/MainPage/Screens/NodeWebScreen'));
const TimelineScreen = lazy(() => import('../../pages/MainPage/Screens/TimelineScreen'));

// Use PlaceholderScreen for screens that aren't fully implemented yet
// This approach allows graceful fallback while screens are being developed
const CaseManagerScreen = lazy(() => 
  import('../../pages/MainPage/Screens/CaseManagerScreen')
    .catch(error => {
      console.error('Failed to load CaseManagerScreen:', error);
      return { default: () => <PlaceholderScreen name="Case Manager (Failed to Load)" /> };
    })
);
const AIAgentScreen = () => <PlaceholderScreen name="AI Agent" />;
const BotRosterScreen = () => <PlaceholderScreen name="Bot Roster" />;

// Settings screens
const ProfileScreen = () => <PlaceholderScreen name="Profile Settings" />;
const AppearanceScreen = () => <PlaceholderScreen name="Appearance Settings" />;
const SecurityScreen = () => <PlaceholderScreen name="Security Settings" />;
const NotificationsScreen = () => <PlaceholderScreen name="Notification Settings" />;
const AdvancedScreen = () => <PlaceholderScreen name="Advanced Settings" />;

// These would be implemented as actual screens
const LoadingScreen = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100%',
    color: '#80c0ff',
    background: '#0a121a'
  }}>
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px' }}>⏳</span>
      </div>
      <div>Loading screen...</div>
    </div>
  </div>
);

const ErrorScreen = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100%',
    color: '#ff8080',
    background: '#0a121a'
  }}>
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px' }}>⚠️</span>
      </div>
      <div>Failed to load screen</div>
      <button style={{ 
        marginTop: '20px',
        background: 'rgba(80, 100, 120, 0.5)',
        border: '1px solid rgba(100, 140, 180, 0.5)',
        color: '#d0e0ff',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        Try Again
      </button>
    </div>
  </div>
);

// Placeholder screen for not-yet-implemented screens
const PlaceholderScreen = ({ name }: { name: string }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100%',
    color: '#80c0ff',
    background: '#0a121a'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '20px' }}>
        {name} Screen
      </div>
      <div style={{ 
        padding: '20px', 
        background: 'rgba(30, 50, 70, 0.5)', 
        borderRadius: '8px',
        maxWidth: '500px'
      }}>
        This screen is under construction as part of the UI overhaul. Check back soon!
      </div>
    </div>
  </div>
);

// Screen registry maps screen types to components
const screenRegistry: Record<ScreenType, React.ComponentType<unknown>> = {
  // Main screens
  'globe': GlobeScreen,
  'netrunner': NetRunnerScreen,
  'analyzer': AnalyzerScreen,
  'nodeweb': NodeWebScreen,
  'timeline': TimelineScreen,
  'casemanager': CaseManagerScreen,
  'teams': TeamsScreen,
  'aiagent': AIAgentScreen,
  'botroster': BotRosterScreen,
  
  // Settings screens
  'profile': ProfileScreen,
  'appearance': AppearanceScreen,
  'security': SecurityScreen,
  'notifications': NotificationsScreen,
  'advanced': AdvancedScreen
};

interface ScreenLoaderProps {
  screenType: ScreenType;
  params?: Record<string, unknown>;
}

// Component that handles loading the appropriate screen
const ScreenLoader: React.FC<ScreenLoaderProps> = ({ screenType, params = {} }) => {
  // Get the screen component from the registry or use fallback
  const ScreenComponent = screenRegistry[screenType] || ErrorScreen;
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ScreenComponent {...params} />
    </Suspense>
  );
};

export default ScreenLoader;
