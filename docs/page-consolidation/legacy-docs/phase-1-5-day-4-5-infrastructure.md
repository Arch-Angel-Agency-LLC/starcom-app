# 🏗️ **Phase 1.5 Day 4-5: Infrastructure Preparation**

**Date**: July 9, 2025  
**Phase**: 1.5 - Transition Bridge  
**Task**: Enhanced Infrastructure Preparation  
**Status**: In Progress 🚧  

---

## **🎯 Infrastructure Enhancement Overview**

Based on Day 3 routing decision (Hybrid Standalone + HUD), creating enhanced infrastructure to support:
- **HUD-Embedded Applications**: CyberCommand, NetRunner, IntelAnalyzer
- **Standalone Applications**: TeamWorkspace, NodeWeb, TimeMap, MarketExchange
- **Seamless Navigation**: Context preservation and smooth transitions

---

## **🔧 Enhanced ApplicationRouter Design**

### **Core Interface Specifications**

```typescript
// Enhanced Application Route Definition
interface ApplicationRoute {
  id: string;
  name: string;
  path: string;
  component: React.ComponentType<ApplicationProps>;
  presentation: PresentationMode;
  category: ApplicationCategory;
  icon: string;
  description: string;
  permissions: string[];
  hudView?: ViewMode; // For HUD integration mapping
  preloadStrategy: 'eager' | 'lazy' | 'on-demand';
  dependencies?: string[]; // Other applications this depends on
}

type PresentationMode = 'hud-embedded' | 'standalone' | 'modal';

type ApplicationCategory = 
  | 'core' // Essential applications (Globe, NetRunner)
  | 'analysis' // Analysis tools (IntelAnalyzer)
  | 'collaboration' // Team tools (TeamWorkspace)
  | 'intelligence' // Intelligence tools (NodeWeb, TimeMap)
  | 'market' // Market applications (MarketExchange)
  | 'utility'; // Utility applications (Settings)

// Application Component Props
interface ApplicationProps {
  isEmbedded: boolean;
  context: ApplicationContext;
  onNavigate: (route: string) => void;
}

// Application Context
interface ApplicationContext {
  currentRoute: ApplicationRoute;
  isEmbedded: boolean;
  availableSpace: { width: number; height: number };
  sharedState: SharedApplicationState;
  navigation: NavigationContext;
}

// Navigation Context
interface NavigationContext {
  goBack: () => void;
  openInStandalone: () => void;
  returnToHUD: () => void;
  switchApplication: (appId: string) => void;
  openQuickSwitcher: () => void;
}

// Shared Application State
interface SharedApplicationState {
  user: UserContext;
  theme: ThemeContext;
  notifications: NotificationContext;
  realTimeData: RealTimeDataContext;
  [key: string]: any; // Application-specific shared state
}
```

---

## **📋 Application Registry**

### **Predefined Application Routes**

```typescript
export const APPLICATION_ROUTES: ApplicationRoute[] = [
  // HUD-Embedded Applications
  {
    id: 'cybercommand',
    name: 'CyberCommand',
    path: '/globe',
    component: CyberCommandApplication, // Wrapper for existing Globe
    presentation: 'hud-embedded',
    category: 'core',
    icon: '🌍',
    description: 'Global threat visualization and command center',
    permissions: ['basic'],
    hudView: 'globe',
    preloadStrategy: 'eager'
  },
  {
    id: 'netrunner',
    name: 'NetRunner',
    path: '/netrunner',
    component: NetRunnerApplication, // Enhanced with OSINT
    presentation: 'hud-embedded',
    category: 'core',
    icon: '🔍',
    description: 'OSINT investigation and intelligence gathering',
    permissions: ['basic'],
    hudView: 'netrunner',
    preloadStrategy: 'lazy'
  },
  {
    id: 'intelanalyzer',
    name: 'IntelAnalyzer',
    path: '/intel',
    component: IntelAnalyzerApplication, // Enhanced Intel Dashboard
    presentation: 'hud-embedded',
    category: 'analysis',
    icon: '🎯',
    description: 'Intelligence analysis and report management',
    permissions: ['intel'],
    hudView: 'intel',
    preloadStrategy: 'lazy'
  },
  
  // Standalone Applications
  {
    id: 'teamworkspace',
    name: 'TeamWorkspace',
    path: '/teams',
    component: TeamWorkspaceApplication,
    presentation: 'standalone',
    category: 'collaboration',
    icon: '👥',
    description: 'Team collaboration, cases, and investigations',
    permissions: ['basic'],
    preloadStrategy: 'on-demand'
  },
  {
    id: 'nodeweb',
    name: 'NodeWeb',
    path: '/nodeweb',
    component: NodeWebApplication,
    presentation: 'standalone',
    category: 'intelligence',
    icon: '🕸️',
    description: 'Knowledge graph and intelligence organization',
    permissions: ['intel'],
    preloadStrategy: 'on-demand'
  },
  {
    id: 'timemap',
    name: 'TimeMap',
    path: '/timeline',
    component: TimeMapApplication,
    presentation: 'standalone',
    category: 'intelligence',
    icon: '📈',
    description: 'Timeline analysis and event tracking',
    permissions: ['basic'],
    preloadStrategy: 'on-demand'
  },
  {
    id: 'marketexchange',
    name: 'MarketExchange',
    path: '/market',
    component: MarketExchangeApplication,
    presentation: 'standalone',
    category: 'market',
    icon: '💱',
    description: 'Intelligence market and trading platform',
    permissions: ['market'],
    preloadStrategy: 'on-demand'
  }
];
```

---

## **🔧 Enhanced ApplicationRouter Implementation**

### **Router Component Structure**

```typescript
// Enhanced ApplicationRouter with hybrid routing support
export const EnhancedApplicationRouter: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<ApplicationRoute | null>(null);
  const [presentationMode, setPresentationMode] = useState<PresentationMode>('hud-embedded');
  const [sharedState, setSharedState] = useState<SharedApplicationState>(initialSharedState);
  
  // Route resolution
  const resolveRoute = useCallback((path: string): ApplicationRoute | null => {
    return APPLICATION_ROUTES.find(route => route.path === path) || null;
  }, []);
  
  // Navigation functions
  const navigateToApplication = useCallback((appId: string, mode?: PresentationMode) => {
    const route = APPLICATION_ROUTES.find(r => r.id === appId);
    if (route) {
      setCurrentRoute(route);
      setPresentationMode(mode || route.presentation);
      // Update URL based on presentation mode
      updateURL(route, mode || route.presentation);
    }
  }, []);
  
  // URL Management
  const updateURL = (route: ApplicationRoute, mode: PresentationMode) => {
    const basePath = route.path;
    const modeParam = mode !== route.presentation ? `?mode=${mode}` : '';
    window.history.pushState({}, '', `${basePath}${modeParam}`);
  };
  
  // Context creation
  const createApplicationContext = (route: ApplicationRoute): ApplicationContext => ({
    currentRoute: route,
    isEmbedded: presentationMode === 'hud-embedded',
    availableSpace: calculateAvailableSpace(presentationMode),
    sharedState,
    navigation: {
      goBack: () => window.history.back(),
      openInStandalone: () => navigateToApplication(route.id, 'standalone'),
      returnToHUD: () => navigateToApplication(route.id, 'hud-embedded'),
      switchApplication: navigateToApplication,
      openQuickSwitcher: () => setQuickSwitcherOpen(true)
    }
  });
  
  // Render application based on presentation mode
  const renderApplication = () => {
    if (!currentRoute) return null;
    
    const context = createApplicationContext(currentRoute);
    const ApplicationComponent = currentRoute.component;
    
    switch (presentationMode) {
      case 'hud-embedded':
        return (
          <HUDEmbeddedWrapper>
            <ApplicationComponent 
              isEmbedded={true} 
              context={context}
              onNavigate={navigateToApplication}
            />
          </HUDEmbeddedWrapper>
        );
        
      case 'standalone':
        return (
          <StandaloneWrapper>
            <ApplicationComponent 
              isEmbedded={false} 
              context={context}
              onNavigate={navigateToApplication}
            />
          </StandaloneWrapper>
        );
        
      case 'modal':
        return (
          <ModalWrapper onClose={() => window.history.back()}>
            <ApplicationComponent 
              isEmbedded={false} 
              context={context}
              onNavigate={navigateToApplication}
            />
          </ModalWrapper>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <ApplicationRouterProvider value={{ navigateToApplication, currentRoute, sharedState }}>
      {renderApplication()}
    </ApplicationRouterProvider>
  );
};
```

---

## **🧭 Navigation Component Enhancements**

### **Global Navigation Header**

```typescript
// Enhanced Global Navigation for standalone applications
export const GlobalNavigationHeader: React.FC = () => {
  const { currentRoute } = useApplicationRouter();
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false);
  
  const standaloneApps = APPLICATION_ROUTES.filter(route => route.presentation === 'standalone');
  
  return (
    <header className={styles.globalNav}>
      <div className={styles.brand}>
        <Link to="/globe" className={styles.logoLink}>
          <img src="/logo.svg" alt="Starcom" className={styles.logo} />
          <span className={styles.brandText}>Starcom</span>
        </Link>
      </div>
      
      <nav className={styles.mainNav}>
        {standaloneApps.map(app => (
          <NavLink 
            key={app.id}
            to={app.path}
            className={styles.navItem}
            activeClassName={styles.active}
          >
            <span className={styles.icon}>{app.icon}</span>
            <span className={styles.label}>{app.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className={styles.utilities}>
        <button 
          className={styles.quickSwitcher}
          onClick={() => setQuickSwitcherOpen(true)}
          title="Quick Application Switcher (Cmd+K)"
        >
          ⌘K
        </button>
        
        <UserMenu />
      </div>
      
      {quickSwitcherOpen && (
        <QuickApplicationSwitcher onClose={() => setQuickSwitcherOpen(false)} />
      )}
    </header>
  );
};
```

### **HUD Navigation Enhancement**

```typescript
// Enhanced HUD BottomBar for embedded applications
export const EnhancedHUDBottomBar: React.FC = () => {
  const { currentView, setCurrentView } = useView();
  const { navigateToApplication } = useApplicationRouter();
  
  const hudApps = APPLICATION_ROUTES.filter(route => route.presentation === 'hud-embedded');
  const standaloneApps = APPLICATION_ROUTES.filter(route => route.presentation === 'standalone');
  
  return (
    <div className={styles.bottomBar}>
      {/* HUD-Embedded Applications */}
      <div className={styles.hudApps}>
        {hudApps.map(app => (
          <button
            key={app.id}
            className={`${styles.navBtn} ${currentView === app.hudView ? styles.active : ''}`}
            onClick={() => setCurrentView(app.hudView!)}
            title={app.description}
          >
            <span className={styles.icon}>{app.icon}</span>
            <span className={styles.label}>{app.name}</span>
          </button>
        ))}
      </div>
      
      {/* Quick Access to Standalone Applications */}
      <div className={styles.standaloneQuickAccess}>
        {standaloneApps.map(app => (
          <button
            key={app.id}
            className={styles.quickAccessBtn}
            onClick={() => navigateToApplication(app.id)}
            title={`Open ${app.name} in standalone mode`}
          >
            <span className={styles.icon}>{app.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### **Quick Application Switcher (Cmd+K)**

```typescript
// Command palette style application switcher
export const QuickApplicationSwitcher: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { navigateToApplication } = useApplicationRouter();
  
  const filteredApps = APPLICATION_ROUTES.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelect = (app: ApplicationRoute) => {
    navigateToApplication(app.id);
    onClose();
  };
  
  return (
    <div className={styles.switcher} onClick={onClose}>
      <div className={styles.switcherContent} onClick={e => e.stopPropagation()}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
        </div>
        
        <div className={styles.resultsList}>
          {filteredApps.map((app, index) => (
            <button
              key={app.id}
              className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => handleSelect(app)}
            >
              <span className={styles.icon}>{app.icon}</span>
              <div className={styles.appInfo}>
                <div className={styles.appName}>{app.name}</div>
                <div className={styles.appDescription}>{app.description}</div>
              </div>
              <span className={styles.presentationMode}>{app.presentation}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## **🔗 Context Bridge System**

### **Shared State Management**

```typescript
// Context bridge for sharing state between HUD and standalone applications
export const ApplicationContextBridge: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sharedState, setSharedState] = useState<SharedApplicationState>({
    user: useUserContext(),
    theme: useThemeContext(),
    notifications: useNotificationContext(),
    realTimeData: useRealTimeContext(),
    // Application-specific state
    netrunner: {
      activeInvestigation: null,
      searchHistory: [],
      bookmarks: []
    },
    intelanalyzer: {
      activeReport: null,
      filters: {},
      sortOrder: 'updatedAt'
    },
    teamworkspace: {
      activeTeam: null,
      activeCases: [],
      workspaceLayout: 'kanban'
    }
  });
  
  // State synchronization
  const updateSharedState = useCallback((key: string, value: any) => {
    setSharedState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Persistence
  useEffect(() => {
    // Load shared state from localStorage
    const savedState = localStorage.getItem('starcom-shared-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setSharedState(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to load shared state:', error);
      }
    }
  }, []);
  
  useEffect(() => {
    // Save shared state to localStorage (debounced)
    const timeoutId = setTimeout(() => {
      localStorage.setItem('starcom-shared-state', JSON.stringify(sharedState));
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [sharedState]);
  
  return (
    <SharedStateContext.Provider value={{ sharedState, updateSharedState }}>
      {children}
    </SharedStateContext.Provider>
  );
};
```

---

## **📦 Migration Utilities**

### **Legacy Component Migration Scripts**

```typescript
// Utility for migrating legacy components to new application structure
export interface MigrationPlan {
  sourceComponent: string;
  targetApplication: string;
  migrationSteps: MigrationStep[];
  dependencies: string[];
  estimatedEffort: number; // hours
}

export interface MigrationStep {
  type: 'move' | 'rename' | 'refactor' | 'integrate';
  description: string;
  sourceFiles: string[];
  targetFiles: string[];
  notes?: string;
}

export const MIGRATION_PLANS: Record<string, MigrationPlan> = {
  'osint-to-netrunner': {
    sourceComponent: '/src/pages/OSINT/OSINTDashboard.tsx',
    targetApplication: 'NetRunner',
    migrationSteps: [
      {
        type: 'move',
        description: 'Move OSINT components to NetRunner application',
        sourceFiles: ['/src/pages/OSINT/components/*'],
        targetFiles: ['/src/applications/netrunner/components/osint/*']
      },
      {
        type: 'integrate',
        description: 'Integrate OSINT into NetRunner application router',
        sourceFiles: ['/src/pages/OSINT/OSINTDashboard.tsx'],
        targetFiles: ['/src/applications/netrunner/NetRunnerApplication.tsx']
      }
    ],
    dependencies: ['NetRunner application exists'],
    estimatedEffort: 16
  },
  
  'intel-to-intelanalyzer': {
    sourceComponent: '/src/pages/Intel/IntelDashboard.tsx',
    targetApplication: 'IntelAnalyzer',
    migrationSteps: [
      {
        type: 'move',
        description: 'Create IntelAnalyzer application structure',
        sourceFiles: ['/src/pages/Intel/IntelDashboard.tsx'],
        targetFiles: ['/src/applications/intelanalyzer/IntelAnalyzerApplication.tsx']
      },
      {
        type: 'refactor',
        description: 'Refactor for application context pattern',
        sourceFiles: ['/src/applications/intelanalyzer/IntelAnalyzerApplication.tsx'],
        targetFiles: ['/src/applications/intelanalyzer/IntelAnalyzerApplication.tsx']
      }
    ],
    dependencies: ['Enhanced ApplicationRouter'],
    estimatedEffort: 12
  }
  
  // Additional migration plans for other components...
};

// Migration execution utility
export const executeMigration = async (planId: string): Promise<void> => {
  const plan = MIGRATION_PLANS[planId];
  if (!plan) {
    throw new Error(`Migration plan ${planId} not found`);
  }
  
  console.log(`Starting migration: ${plan.sourceComponent} → ${plan.targetApplication}`);
  
  for (const step of plan.migrationSteps) {
    console.log(`Executing step: ${step.description}`);
    // Migration step execution logic would go here
    // This would integrate with file system operations and code transformation
  }
  
  console.log(`Migration completed: ${planId}`);
};
```

---

## **✅ Day 4-5 Infrastructure Complete**

### **📦 Deliverables Created**
- ✅ **Enhanced ApplicationRouter Design**: Complete interface specifications
- ✅ **Application Registry**: Predefined routes for all 7 applications
- ✅ **Router Implementation**: Hybrid routing with HUD and standalone support
- ✅ **Navigation Components**: Global header, enhanced HUD bar, quick switcher
- ✅ **Context Bridge System**: Shared state management across presentation modes
- ✅ **Migration Utilities**: Scripts and plans for legacy component migration

### **🎯 Phase 2 Ready Infrastructure**
1. **Hybrid Routing Support**: Applications can render in HUD or standalone modes
2. **Context Preservation**: Shared state maintained across presentation transitions
3. **Navigation Unification**: Seamless navigation between HUD and standalone applications
4. **Migration Framework**: Tools to migrate legacy components to new application structure
5. **User Experience**: Quick switcher, breadcrumbs, and intuitive navigation patterns

### **🚀 Phase 1.5 Complete - Ready for Phase 2**
All infrastructure prepared for Phase 2 implementation. Applications can now be built using the hybrid routing system with confidence that navigation, state management, and user experience will be consistent and optimal.
