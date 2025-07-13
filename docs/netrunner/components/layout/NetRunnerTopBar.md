# NetRunnerTopBar Component

## Overview

The NetRunnerTopBar serves as the primary navigation and system status interface, providing critical operational information, navigation controls, and system-wide status monitoring for the NetRunner platform.

## Component Specification

### Purpose
- Primary navigation and application header
- Real-time system status and operational metrics
- User authentication and session management
- Global notifications and alert system
- Quick access to critical functions and settings

### Props Interface
```typescript
interface NetRunnerTopBarProps {
  currentUser?: UserProfile;
  operationMode?: OperationMode;
  systemStatus?: SystemStatus;
  onNavigate?: (route: string) => void;
  onLogout?: () => void;
  onEmergencyStop?: () => void;
  notifications?: Notification[];
  onDismissNotification?: (id: string) => void;
  isOnline?: boolean;
}
```

### State Management
```typescript
interface TopBarState {
  isMenuOpen: boolean;
  activeNotifications: Notification[];
  systemHealth: SystemHealthStatus;
  currentTime: number;
  operationalStatus: OperationalStatus;
  connectionStatus: ConnectionStatus;
}

type OperationMode = 'standard' | 'stealth' | 'aggressive' | 'training';
type SystemStatus = 'operational' | 'degraded' | 'offline' | 'maintenance';
```

## Key Features

### 1. **System Status Dashboard**
- Real-time operational status indicators
- System health monitoring and alerts
- Connection status to external services
- Performance metrics display
- Resource utilization monitoring

### 2. **Navigation Control Center**
- Primary application navigation menu
- Breadcrumb navigation for complex operations
- Quick access shortcuts to key functions
- Recent operations and bookmarks
- Search functionality for rapid access

### 3. **Authentication and Security**
- User profile display and management
- Session timeout warnings
- Security clearance level indicators
- Multi-factor authentication status
- Secure logout and session management

### 4. **Notification Management**
- Real-time alert and notification display
- Priority-based notification sorting
- Notification history and acknowledgment
- Emergency alert broadcasting
- Custom notification filtering

### 5. **Operational Controls**
- Emergency stop functionality
- Operation mode switching
- Global settings access
- System maintenance controls
- Performance optimization toggles

## UI Architecture

### Layout Structure
```typescript
const topBarLayout = {
  left: {
    components: ['Logo', 'MainNavigation', 'Breadcrumbs'],
    width: '40%'
  },
  center: {
    components: ['SystemStatus', 'OperationMode', 'Clock'],
    width: '30%'
  },
  right: {
    components: ['Notifications', 'UserProfile', 'Settings', 'EmergencyControls'],
    width: '30%'
  }
};
```

### Component Hierarchy
```typescript
interface TopBarComponents {
  logo: LogoComponent;
  navigation: NavigationMenuComponent;
  breadcrumbs: BreadcrumbComponent;
  systemStatus: SystemStatusComponent;
  operationMode: OperationModeComponent;
  clock: DigitalClockComponent;
  notifications: NotificationCenterComponent;
  userProfile: UserProfileComponent;
  settings: SettingsMenuComponent;
  emergencyControls: EmergencyControlsComponent;
}
```

## Status Monitoring System

### System Health Indicators
```typescript
interface SystemHealthIndicators {
  cpu: {
    usage: number;
    status: 'normal' | 'elevated' | 'critical';
    trend: 'stable' | 'increasing' | 'decreasing';
  };
  memory: {
    usage: number;
    available: number;
    status: 'normal' | 'elevated' | 'critical';
  };
  network: {
    latency: number;
    bandwidth: number;
    status: 'optimal' | 'degraded' | 'poor';
  };
  services: {
    scanner: ServiceStatus;
    crawler: ServiceStatus;
    intelligence: ServiceStatus;
    database: ServiceStatus;
  };
}

interface ServiceStatus {
  health: 'healthy' | 'degraded' | 'offline';
  responseTime: number;
  lastCheck: number;
  errorRate: number;
}
```

### Real-Time Status Updates
```typescript
class SystemStatusMonitor {
  private statusUpdaters = new Map<string, StatusUpdater>();
  private updateInterval = 5000; // 5 seconds
  
  startMonitoring(): void {
    setInterval(async () => {
      const healthData = await this.collectSystemHealth();
      this.updateStatusIndicators(healthData);
      this.checkThresholds(healthData);
    }, this.updateInterval);
  }
  
  private async collectSystemHealth(): Promise<SystemHealthData> {
    return {
      cpu: await this.getCPUMetrics(),
      memory: await this.getMemoryMetrics(),
      network: await this.getNetworkMetrics(),
      services: await this.getServiceMetrics()
    };
  }
  
  private checkThresholds(health: SystemHealthData): void {
    // CPU threshold monitoring
    if (health.cpu.usage > 85) {
      this.triggerAlert('high-cpu-usage', health.cpu);
    }
    
    // Memory threshold monitoring
    if (health.memory.usage > 90) {
      this.triggerAlert('high-memory-usage', health.memory);
    }
    
    // Service health monitoring
    Object.entries(health.services).forEach(([service, status]) => {
      if (status.health === 'offline') {
        this.triggerAlert('service-offline', { service, status });
      }
    });
  }
}
```

## Navigation System

### Dynamic Menu Generation
```typescript
interface NavigationMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  route: string;
  requiredClearance?: SecurityClearance;
  submenu?: NavigationMenuItem[];
  badge?: {
    count: number;
    type: 'info' | 'warning' | 'error';
  };
}

const navigationStructure: NavigationMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Activity,
    route: '/netrunner/dashboard'
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Target,
    route: '/netrunner/operations',
    submenu: [
      {
        id: 'active-ops',
        label: 'Active Operations',
        icon: Play,
        route: '/netrunner/operations/active'
      },
      {
        id: 'history',
        label: 'Operation History',
        icon: Clock,
        route: '/netrunner/operations/history'
      }
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: Brain,
    route: '/netrunner/intelligence',
    requiredClearance: 'confidential'
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Tool,
    route: '/netrunner/tools'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    route: '/netrunner/settings'
  }
];
```

### Breadcrumb Navigation
```typescript
class BreadcrumbManager {
  private breadcrumbs: BreadcrumbItem[] = [];
  
  updateBreadcrumbs(route: string): void {
    const segments = route.split('/').filter(Boolean);
    this.breadcrumbs = segments.map((segment, index) => ({
      label: this.getSegmentLabel(segment),
      route: '/' + segments.slice(0, index + 1).join('/'),
      isActive: index === segments.length - 1
    }));
  }
  
  private getSegmentLabel(segment: string): string {
    const labelMap: Record<string, string> = {
      'netrunner': 'NetRunner',
      'operations': 'Operations',
      'intelligence': 'Intelligence',
      'tools': 'Tools',
      'settings': 'Settings',
      'dashboard': 'Dashboard'
    };
    
    return labelMap[segment] || this.capitalizeSegment(segment);
  }
}
```

## Notification Management

### Notification Types and Priorities
```typescript
interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  actions?: NotificationAction[];
  autoHide?: boolean;
  hideAfter?: number;
  source?: string;
}

type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'critical' 
  | 'security';

type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}
```

### Notification Processing Pipeline
```typescript
class NotificationProcessor {
  private notifications: Notification[] = [];
  private maxNotifications = 10;
  
  addNotification(notification: Notification): void {
    // Priority-based insertion
    const insertIndex = this.findInsertionIndex(notification.priority);
    this.notifications.splice(insertIndex, 0, notification);
    
    // Enforce notification limit
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }
    
    // Auto-hide if configured
    if (notification.autoHide && notification.hideAfter) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.hideAfter);
    }
    
    // Trigger UI update
    this.notifySubscribers();
  }
  
  private findInsertionIndex(priority: NotificationPriority): number {
    const priorityValues = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityValue = priorityValues[priority];
    
    return this.notifications.findIndex(n => 
      priorityValues[n.priority] < priorityValue
    );
  }
}
```

## Authentication and Security

### User Profile Management
```typescript
interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  clearanceLevel: SecurityClearance;
  roles: UserRole[];
  lastLogin: number;
  sessionExpiry: number;
  preferences: UserPreferences;
}

type SecurityClearance = 'unclassified' | 'confidential' | 'secret' | 'top-secret';
type UserRole = 'operator' | 'analyst' | 'administrator' | 'supervisor';

interface UserPreferences {
  theme: 'light' | 'dark' | 'military';
  notifications: NotificationPreferences;
  operationDefaults: OperationDefaults;
  dashboard: DashboardPreferences;
}
```

### Session Management
```typescript
class SessionManager {
  private sessionTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  
  startSessionMonitoring(expiryTime: number): void {
    const timeUntilExpiry = expiryTime - Date.now();
    const warningTime = timeUntilExpiry - (15 * 60 * 1000); // 15 minutes before expiry
    
    // Set warning timer
    if (warningTime > 0) {
      this.warningTimer = setTimeout(() => {
        this.showSessionWarning();
      }, warningTime);
    }
    
    // Set expiry timer
    this.sessionTimer = setTimeout(() => {
      this.handleSessionExpiry();
    }, timeUntilExpiry);
  }
  
  private showSessionWarning(): void {
    const notification: Notification = {
      id: 'session-warning',
      type: 'warning',
      priority: 'high',
      title: 'Session Expiring',
      message: 'Your session will expire in 15 minutes. Click to extend.',
      timestamp: Date.now(),
      actions: [
        {
          label: 'Extend Session',
          action: () => this.extendSession(),
          style: 'primary'
        }
      ]
    };
    
    this.notificationProcessor.addNotification(notification);
  }
}
```

## Emergency Controls

### Emergency Stop System
```typescript
class EmergencyStopSystem {
  private isEmergencyActive = false;
  private emergencyHandlers = new Set<EmergencyHandler>();
  
  activateEmergencyStop(): void {
    if (this.isEmergencyActive) return;
    
    this.isEmergencyActive = true;
    
    // Stop all active operations
    this.stopAllOperations();
    
    // Disconnect from external services
    this.disconnectExternalServices();
    
    // Clear sensitive data from memory
    this.clearSensitiveData();
    
    // Notify all handlers
    this.notifyEmergencyHandlers();
    
    // Log emergency activation
    this.logEmergencyActivation();
  }
  
  private stopAllOperations(): void {
    // Stop scanning operations
    scannerService.stopAllScans();
    
    // Stop crawling operations
    crawlerService.stopAllCrawls();
    
    // Cancel pending requests
    networkManager.cancelAllRequests();
    
    // Clear operation queues
    operationQueue.clearAll();
  }
  
  private clearSensitiveData(): void {
    // Clear intelligence cache
    intelligenceCache.clearAll();
    
    // Clear authentication tokens
    authManager.clearTokens();
    
    // Clear browser storage
    localStorage.clear();
    sessionStorage.clear();
  }
}
```

## Performance Optimization

### Efficient Rendering Strategy
```typescript
const TopBarMemo = React.memo(NetRunnerTopBar, (prevProps, nextProps) => {
  // Only re-render if critical props change
  return (
    prevProps.systemStatus === nextProps.systemStatus &&
    prevProps.notifications.length === nextProps.notifications.length &&
    prevProps.currentUser?.id === nextProps.currentUser?.id &&
    prevProps.operationMode === nextProps.operationMode
  );
});
```

### Optimized Status Updates
```typescript
class OptimizedStatusUpdater {
  private lastUpdate = 0;
  private updateThreshold = 1000; // 1 second minimum between updates
  private pendingUpdate: NodeJS.Timeout | null = null;
  
  scheduleUpdate(statusData: SystemStatus): void {
    const now = Date.now();
    
    if (now - this.lastUpdate < this.updateThreshold) {
      // Throttle updates
      if (this.pendingUpdate) {
        clearTimeout(this.pendingUpdate);
      }
      
      this.pendingUpdate = setTimeout(() => {
        this.performUpdate(statusData);
      }, this.updateThreshold - (now - this.lastUpdate));
    } else {
      this.performUpdate(statusData);
    }
  }
  
  private performUpdate(statusData: SystemStatus): void {
    this.lastUpdate = Date.now();
    this.updateUI(statusData);
  }
}
```

## Testing Strategy

### Component Testing
```typescript
describe('NetRunnerTopBar', () => {
  it('should display system status correctly', () => {
    const mockStatus: SystemStatus = 'operational';
    const component = render(
      <NetRunnerTopBar systemStatus={mockStatus} />
    );
    
    expect(component.getByTestId('system-status')).toHaveClass('status-operational');
  });
  
  it('should handle emergency stop activation', () => {
    const onEmergencyStop = jest.fn();
    const component = render(
      <NetRunnerTopBar onEmergencyStop={onEmergencyStop} />
    );
    
    fireEvent.click(component.getByTestId('emergency-stop-button'));
    expect(onEmergencyStop).toHaveBeenCalled();
  });
  
  it('should display notifications correctly', () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'warning',
        priority: 'high',
        title: 'Test Warning',
        message: 'This is a test',
        timestamp: Date.now()
      }
    ];
    
    const component = render(
      <NetRunnerTopBar notifications={mockNotifications} />
    );
    
    expect(component.getByText('Test Warning')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
describe('NetRunnerTopBar Integration', () => {
  it('should integrate with notification system', async () => {
    const notificationSystem = new NotificationProcessor();
    const component = render(
      <NetRunnerTopBar notificationSystem={notificationSystem} />
    );
    
    // Add notification
    notificationSystem.addNotification({
      id: 'test',
      type: 'info',
      priority: 'medium',
      title: 'Test',
      message: 'Integration test',
      timestamp: Date.now()
    });
    
    await waitFor(() => {
      expect(component.getByText('Test')).toBeInTheDocument();
    });
  });
});
```

## Usage Examples

### Basic Implementation
```typescript
import React from 'react';
import { NetRunnerTopBar } from './components/layout/NetRunnerTopBar';

function App() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('operational');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const handleEmergencyStop = () => {
    setSystemStatus('offline');
    // Trigger emergency protocols
  };
  
  return (
    <NetRunnerTopBar
      systemStatus={systemStatus}
      notifications={notifications}
      onEmergencyStop={handleEmergencyStop}
      currentUser={currentUser}
    />
  );
}
```

### Advanced Configuration
```typescript
const advancedTopBarConfig = {
  updateInterval: 2000,
  maxNotifications: 15,
  sessionWarningTime: 10 * 60 * 1000, // 10 minutes
  emergencyStopEnabled: true,
  statusMonitoring: {
    cpu: { threshold: 80 },
    memory: { threshold: 85 },
    network: { timeout: 5000 }
  }
};

<NetRunnerTopBar
  config={advancedTopBarConfig}
  onNavigate={handleNavigation}
  onStatusChange={handleStatusChange}
  onNotificationAction={handleNotificationAction}
/>
```

This comprehensive documentation covers all aspects of the NetRunnerTopBar component, providing detailed implementation guidance, usage examples, and testing strategies.
