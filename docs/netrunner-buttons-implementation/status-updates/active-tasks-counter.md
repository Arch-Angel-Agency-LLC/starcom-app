# 📊 Active Tasks Counter - Implementation Guide

## 📋 **Component Overview**
- **Location**: NetRunner → Status Panel → Active Tasks Counter
- **Type**: Real-time Task Monitoring Component
- **Status**: 🔴 Not Implemented (Mock UI Only)
- **Priority**: High - Operational awareness

## 🎯 **Functionality Goals**

### **Primary Purpose**
Real-time monitoring and management of all active tasks, operations, and background processes with detailed progress tracking, performance metrics, and interactive controls.

### **Key Monitoring Areas**
1. **Active Operations** - Running scans, workflows, and bot activities
2. **Queue Management** - Pending tasks and execution priorities
3. **Performance Tracking** - Task completion rates and resource usage
4. **Error Monitoring** - Failed tasks and retry mechanisms
5. **Resource Allocation** - CPU, memory, and API quota usage per task

## 🎮 **User Interface Design**

### **Main Tasks Counter Display**
```
┌─ Active Tasks Monitor ──────────────────────────┐
│                                                │
│ ┌─ Task Summary ─────────────────────────────┐ │
│ │ 🔄 Active: 7    ⏳ Queued: 12              │ │
│ │ ✅ Completed: 245  ❌ Failed: 3            │ │
│ │ 📊 Success Rate: 94.2% (Last 24h)          │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌─ Currently Running ────────────────────────┐ │
│ │ 🌐 Domain Investigation: example.com       │ │
│ │    Step 8/12 | ████████░░ 67% | 00:23:15  │ │
│ │    CPU: 15% | RAM: 256MB | APIs: 12 calls │ │
│ │    [⏸️ Pause] [⏹️ Stop] [📊 Details]       │ │
│ │                                           │ │
│ │ 🤖 Social Media Bot: @target_user         │ │
│ │    Collecting | ██████░░░░ 60% | 00:45:20 │ │
│ │    CPU: 8% | RAM: 128MB | APIs: 34 calls  │ │
│ │    [⏸️ Pause] [⏹️ Stop] [📊 Details]       │ │
│ │                                           │ │
│ │ 🔍 Vulnerability Scan: 192.168.1.0/24     │ │
│ │    Scanning | ████░░░░░░ 40% | 00:12:08   │ │
│ │    CPU: 25% | RAM: 512MB | Tools: Nuclei  │ │
│ │    [⏸️ Pause] [⏹️ Stop] [📊 Details]       │ │
│ └───────────────────────────────────────────┘ │
│                                                │
│ ┌─ Task Queue (Next 5) ──────────────────────┐ │
│ │ 1. 🎯 IP Reputation: 203.0.113.1           │ │
│ │    Priority: High | ETA: 2 min             │ │
│ │ 2. 🔍 Port Scan: internal-server.com       │ │
│ │    Priority: Medium | ETA: 5 min           │ │
│ │ 3. 🌐 Subdomain Enum: company.com          │ │
│ │    Priority: Low | ETA: 8 min              │ │
│ │ 4. 🤖 Data Mining: competitor.com          │ │
│ │    Priority: Medium | ETA: 12 min          │ │
│ │ 5. 📧 Phishing Analysis: suspicious.eml    │ │
│ │    Priority: High | ETA: 15 min            │ │
│ └───────────────────────────────────────────┘ │
│                                                │
│ [🔄 Refresh] [⚙️ Manage Queue] [📊 Analytics]   │
└────────────────────────────────────────────────┘
```

### **Detailed Task Management**
```
┌─ Task Management Console ──────────────────────┐
│                                                │
│ ┌─ Filters & Controls ───────────────────────┐ │
│ │ Status: [Active ▼] Type: [All ▼]           │ │
│ │ Priority: [All ▼] User: [All ▼]            │ │
│ │ Search: [________________] [🔍 Filter]     │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌─ Active Tasks Detail ──────────────────────┐ │
│ │                                           │ │
│ │ 📋 Task: Domain Investigation             │ │
│ │ 🎯 Target: example.com                    │ │
│ │ 👤 User: analyst_001                      │ │
│ │ ⏰ Started: 2025-01-11 18:23:15 UTC       │ │
│ │ 📊 Progress: 67% (Step 8/12)              │ │
│ │ ⏱️ Elapsed: 00:23:15 | ETA: 00:11:45      │ │
│ │                                           │ │
│ │ 📈 Resource Usage:                         │ │
│ │ • CPU: ████░░░░░░ 15% (0.6 cores)         │ │
│ │ • RAM: ██████░░░░ 256MB / 1GB             │ │
│ │ • Network: 2.3MB ↓ 0.8MB ↑               │ │
│ │ • API Calls: 12 (Shodan: 4, VT: 8)       │ │
│ │                                           │ │
│ │ 🔄 Current Activity:                       │ │
│ │ "Running Nuclei vulnerability scan..."    │ │
│ │                                           │ │
│ │ [⏸️ Pause] [⏹️ Stop] [🔄 Restart] [📋 Log] │ │
│ └───────────────────────────────────────────┘ │
│                                                │
│ ┌─ Performance Metrics ──────────────────────┐ │
│ │ 📊 Throughput (Last Hour):                 │ │
│ │ • Tasks Completed: 23                     │ │
│ │ • Average Duration: 8m 34s                │ │
│ │ • Success Rate: 95.7%                     │ │
│ │ • CPU Efficiency: 78%                     │ │
│ │                                           │ │
│ │ 🚨 Recent Issues:                          │ │
│ │ • 2 tasks failed due to API timeout       │ │
│ │ • 1 task cancelled by user                │ │
│ │ • Queue backed up for 5 minutes           │ │
│ └───────────────────────────────────────────┘ │
│                                                │
│ [📈 Performance] [⚙️ Settings] [🔔 Alerts]     │
└────────────────────────────────────────────────┘
```

### **Queue Management Interface**
```
┌─ Task Queue Management ────────────────────────┐
│                                                │
│ ┌─ Queue Statistics ─────────────────────────┐ │
│ │ 📊 Total Queued: 12 tasks                  │ │
│ │ ⏱️ Average Wait: 3m 45s                    │ │
│ │ 🔄 Processing Rate: 8 tasks/hour           │ │
│ │ 🎯 Queue Capacity: 85% (17/20 slots)      │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌─ Queue Contents ───────────────────────────┐ │
│ │ Pos | Task | Target | Priority | ETA       │ │
│ │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │ │
│ │  1  | 🎯 IP Rep | 203.0.113.1 | 🔴 | 2min │ │
│ │     [🔺 Priority] [⏯️ Pause] [❌ Remove]   │ │
│ │                                           │ │
│ │  2  | 🔍 Port Scan | internal.com | 🟡 | 5min │ │
│ │     [🔺 Priority] [⏯️ Pause] [❌ Remove]   │ │
│ │                                           │ │
│ │  3  | 🌐 Subdomain | company.com | 🔵 | 8min │ │
│ │     [🔺 Priority] [⏯️ Pause] [❌ Remove]   │ │
│ │                                           │ │
│ │  4  | 🤖 Data Mine | competitor.com | 🟡 | 12min │ │
│ │     [🔺 Priority] [⏯️ Pause] [❌ Remove]   │ │
│ │                                           │ │
│ │  5  | 📧 Phishing | suspicious.eml | 🔴 | 15min │ │
│ │     [🔺 Priority] [⏯️ Pause] [❌ Remove]   │ │
│ └───────────────────────────────────────────┘ │
│                                                │
│ ┌─ Queue Controls ───────────────────────────┐ │
│ │ [⏸️ Pause All] [▶️ Resume All] [🔄 Reorder] │ │
│ │ [📊 Optimize] [⚙️ Settings] [🧹 Clear]     │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ [⬅️ Back to Tasks] [📊 Queue Analytics]        │
└────────────────────────────────────────────────┘
```

## 📊 **Task Monitoring Data Structure**

### **Active Tasks JSON**
```json
{
  "taskMonitor": {
    "timestamp": "2025-01-11T21:30:00Z",
    "summary": {
      "active": 7,
      "queued": 12,
      "completed": 245,
      "failed": 3,
      "successRate": 94.2
    }
  },
  "activeTasks": [
    {
      "id": "task_domain_inv_001",
      "type": "domain_investigation",
      "target": "example.com",
      "user": "analyst_001",
      "status": "running",
      "progress": {
        "currentStep": 8,
        "totalSteps": 12,
        "percentage": 67,
        "description": "Running Nuclei vulnerability scan"
      },
      "timing": {
        "startTime": "2025-01-11T21:06:45Z",
        "elapsed": 1395,
        "estimatedRemaining": 705,
        "eta": "2025-01-11T21:42:30Z"
      },
      "resources": {
        "cpu": 15.0,
        "memory": 268435456,
        "networkIn": 2411724,
        "networkOut": 838860,
        "apiCalls": {
          "total": 12,
          "breakdown": {
            "shodan": 4,
            "virustotal": 8
          }
        }
      },
      "priority": "medium",
      "controls": {
        "canPause": true,
        "canStop": true,
        "canRestart": false
      }
    }
  ],
  "queuedTasks": [
    {
      "id": "task_ip_rep_002",
      "type": "ip_reputation",
      "target": "203.0.113.1",
      "user": "analyst_002",
      "priority": "high",
      "position": 1,
      "estimatedWait": 120,
      "estimatedDuration": 300,
      "eta": "2025-01-11T21:34:00Z"
    }
  ],
  "performance": {
    "lastHour": {
      "tasksCompleted": 23,
      "averageDuration": 514,
      "successRate": 95.7,
      "cpuEfficiency": 78.0
    },
    "systemLoad": {
      "cpuUsage": 42.5,
      "memoryUsage": 67.8,
      "queueCapacity": 85.0,
      "processingRate": 8.0
    }
  },
  "recentIssues": [
    {
      "timestamp": "2025-01-11T21:15:00Z",
      "type": "api_timeout",
      "task": "task_vuln_scan_003",
      "description": "VirusTotal API timeout after 30 seconds",
      "action": "retrying_with_fallback"
    }
  ]
}
```

## 🔧 **Technical Implementation**

### **Task Monitoring System**
```typescript
interface TaskMonitor {
  getActiveTasks(): Promise<ActiveTask[]>
  getQueuedTasks(): Promise<QueuedTask[]>
  getTaskDetails(taskId: string): Promise<TaskDetails>
  controlTask(taskId: string, action: TaskAction): Promise<void>
}

interface ActiveTask {
  id: string
  type: TaskType
  status: TaskStatus
  progress: TaskProgress
  resources: ResourceUsage
  timing: TaskTiming
}

class TaskManagementSystem {
  private taskExecutor: TaskExecutor
  private queueManager: QueueManager
  private resourceMonitor: ResourceMonitor
  
  async monitorTasks(): Promise<TaskSummary> {
    // Real-time task monitoring and management
  }
}
```

### **Queue Management Engine**
```typescript
interface QueueManager {
  addTask(task: Task): Promise<string>
  removeTask(taskId: string): Promise<void>
  reorderTasks(newOrder: string[]): Promise<void>
  optimizeQueue(): Promise<void>
}

class TaskScheduler {
  async scheduleNext(): Promise<Task | null> {
    // Intelligent task scheduling based on priority and resources
  }
  
  async estimateWaitTime(position: number): Promise<number> {
    // Calculate estimated wait time for queued tasks
  }
}
```

## 🚀 **Implementation Roadmap**

### **Phase 1: Basic Task Monitoring (Week 1-2)**
- [ ] Create task tracking framework
- [ ] Implement active task monitoring
- [ ] Build basic progress tracking
- [ ] Create task status updates

### **Phase 2: Queue Management (Week 3-4)**
- [ ] Implement task queue system
- [ ] Build priority-based scheduling
- [ ] Add queue optimization algorithms
- [ ] Create interactive queue controls

### **Phase 3: Resource Monitoring (Week 5)**
- [ ] Implement resource usage tracking
- [ ] Build performance metrics collection
- [ ] Add efficiency calculations
- [ ] Create resource allocation optimization

### **Phase 4: Advanced Controls (Week 6)**
- [ ] Build task control interface
- [ ] Implement pause/resume functionality
- [ ] Add batch operations
- [ ] Create automated task management

### **Phase 5: Analytics & Optimization (Week 7)**
- [ ] Build performance analytics
- [ ] Implement predictive scheduling
- [ ] Add capacity planning
- [ ] Create optimization recommendations

## 🔄 **Dependencies**

### **Required Systems**
- ❌ Task Execution Framework (Not Implemented)
- ❌ Queue Management System (Not Implemented)
- ❌ Resource Monitoring Framework (Not Implemented)
- 🔄 Workflow Engine (In Progress)
- 🔄 Bot Management System (In Progress)

### **Integration Points**
- All workflow and bot systems
- System resource monitoring
- API quota management
- User session management

## 🎯 **Success Metrics**

### **Performance Goals**
- Task throughput: 100+ tasks/hour capacity
- Queue optimization: 95%+ efficiency
- Resource utilization: 80%+ optimal usage
- Response time: < 1s for task controls

### **Operational Goals**
- [ ] Real-time task visibility
- [ ] Efficient queue management
- [ ] Automated resource optimization
- [ ] Proactive issue detection

### **User Experience Goals**
- Intuitive task control interface
- Clear progress indicators
- Responsive task management
- Predictive capacity planning

---

## 💡 **Advanced Features (Future)**

### **AI-Powered Optimization**
- Machine learning-based task scheduling
- Predictive resource allocation
- Intelligent queue prioritization
- Automated performance tuning

### **Collaboration Features**
- Multi-user task management
- Team queue sharing
- Collaborative task planning
- Resource allocation coordination

### **Integration Features**
- External workflow system integration
- Enterprise task management connectors
- Custom scheduling algorithms
- Advanced reporting and analytics

---

**Status**: 🔴 Ready for Implementation
**Dependencies**: Task Framework, Queue System, Resource Monitor
**Estimated Effort**: 7 weeks full implementation
