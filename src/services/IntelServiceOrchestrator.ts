/**
 * IntelServiceOrchestrator - Service Coordination Implementation
 * 
 * Orchestrates all Phase 2 Intel services for end-to-end workflows
 * Provides unified interface for complex Intel operations across multiple services
 * 
 * Key Features:
 * - End-to-end Intel workflow coordination
 * - Service dependency injection and management
 * - Cross-service error handling and recovery
 * - Workflow state management and monitoring
 * - Performance optimization across service boundaries
 */

// Service interfaces for type safety
interface DataVaultServiceInterface {
  exportToVault(items: Intel[], password?: string): Promise<DataVault>;
  importFromVault(vaultId: string): Promise<Intel[]>;
  listVaults(): Promise<unknown[]>;
}

interface WorkspaceServiceInterface {
  saveIntel(intel: Intel, workspacePath: string): Promise<unknown>;
  createWorkspace(path: string, name: string): Promise<unknown>;
  listWorkspaces(): Promise<unknown[]>;
}

interface RepositoryServiceInterface {
  saveAndCommitIntel(intel: Intel, message: string): Promise<unknown>;
  commitChanges(message: string): Promise<unknown>;
  createBranch(name: string, from: string): Promise<unknown>;
  getStatus(): Promise<unknown>;
}

interface StorageServiceInterface {
  store(intel: Intel, options?: Record<string, unknown>): Promise<string>;
  retrieve(intelId: string): Promise<Intel | null>;
  getHealthStatus(): Promise<unknown[]>;
}

interface ServiceCollection {
  dataVaultService: DataVaultServiceInterface;
  workspaceService: WorkspaceServiceInterface;
  repositoryService: RepositoryServiceInterface;
  storageService: StorageServiceInterface;
}
interface WorkflowResult {
  success: boolean;
  workflowId: string;
  steps: WorkflowStep[];
  duration: number;
  errors: string[];
  metadata: Record<string, unknown>;
}

interface WorkflowStep {
  stepId: string;
  service: string;
  operation: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: unknown;
  error?: string;
}

interface CollaborationSession {
  sessionId: string;
  intelId: string;
  collaborators: string[];
  initiator: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  activities: CollaborationActivity[];
}

interface CollaborationActivity {
  activityId: string;
  collaborator: string;
  action: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

interface Intel {
  id: string;
  title: string;
  type: string;
  content?: string;
  metadata: {
    created: Date;
    lastModified: Date;
    version: string;
    tags?: string[];
  };
}

interface DataVault {
  id: string;
  title: string;
  description: string;
  exportDate: Date;
  exportedBy: string;
  contents: string[];
}

interface ImportResult {
  success: boolean;
  importedItems: string[];
  errors: string[];
  warnings: string[];
  duration: number;
}

interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  errors: string[];
}

interface OrchestrationConfig {
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableMonitoring: boolean;
  enableCaching: boolean;
  timeoutMs: number;
}

/**
 * Orchestrates all Intel services for complex workflows
 */
export class IntelServiceOrchestrator {
  private config: OrchestrationConfig;
  private activeWorkflows: Map<string, WorkflowResult> = new Map();
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();

  // Service dependencies
  private dataVaultService: DataVaultServiceInterface;
  private workspaceService: WorkspaceServiceInterface;
  private repositoryService: RepositoryServiceInterface;
  private storageService: StorageServiceInterface;

  constructor(
    services: {
      dataVaultService: DataVaultServiceInterface;
      workspaceService: WorkspaceServiceInterface;
      repositoryService: RepositoryServiceInterface;
      storageService: StorageServiceInterface;
    },
    config?: Partial<OrchestrationConfig>
  ) {
    this.dataVaultService = services.dataVaultService;
    this.workspaceService = services.workspaceService;
    this.repositoryService = services.repositoryService;
    this.storageService = services.storageService;

    this.config = {
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableMonitoring: true,
      enableCaching: true,
      timeoutMs: 30000,
      ...config
    };

    this.initializeHealthMonitoring();
  }

  /**
   * Create Intel with full workflow coordination
   */
  async createIntelWorkflow(intel: Intel): Promise<WorkflowResult> {
    const workflowId = `create-intel-${Date.now()}`;
    const workflow: WorkflowResult = {
      success: false,
      workflowId,
      steps: [],
      duration: 0,
      errors: [],
      metadata: {
        intelId: intel.id,
        operation: 'create',
        timestamp: new Date()
      }
    };

    const startTime = Date.now();
    this.activeWorkflows.set(workflowId, workflow);

    try {
      // Step 1: Store Intel in unified storage
      await this.executeStep(
        workflow,
        'storage',
        'store',
        () => this.storageService.store(intel, { caching: true })
      );

      // Step 2: Save to workspace
      await this.executeStep(
        workflow,
        'workspace',
        'saveIntel',
        () => this.workspaceService.saveIntel(intel, './intel-workspace')
      );

      // Step 3: Initialize Git tracking
      await this.executeStep(
        workflow,
        'repository',
        'saveAndCommit',
        () => this.repositoryService.saveAndCommitIntel(intel, `Add new Intel: ${intel.title}`)
      );

      // Step 4: Create backup vault
      await this.executeStep(
        workflow,
        'vault',
        'createBackup',
        () => this.dataVaultService.exportToVault([intel], 'auto-backup')
      );

      workflow.success = workflow.errors.length === 0;
      workflow.duration = Date.now() - startTime;

      return workflow;
    } catch (error) {
      workflow.errors.push(`Workflow failed: ${(error as Error).message}`);
      workflow.duration = Date.now() - startTime;
      return workflow;
    } finally {
      // Clean up after delay
      setTimeout(() => this.activeWorkflows.delete(workflowId), 300000); // 5 minutes
    }
  }

  /**
   * Export Intel collection with multi-service coordination
   */
  async exportIntelWorkflow(intelIds: string[]): Promise<DataVault> {
    const workflowId = `export-intel-${Date.now()}`;
    const workflow: WorkflowResult = {
      success: false,
      workflowId,
      steps: [],
      duration: 0,
      errors: [],
      metadata: {
        intelIds,
        operation: 'export',
        timestamp: new Date()
      }
    };

    const startTime = Date.now();
    this.activeWorkflows.set(workflowId, workflow);

    try {
      // Step 1: Retrieve all Intel items from storage
      const retrievedIntel: Intel[] = [];
      for (const intelId of intelIds) {
        const step = await this.executeStep(
          workflow,
          'storage',
          'retrieve',
          () => this.storageService.retrieve(intelId)
        );
        if (step.result) {
          retrievedIntel.push(step.result as Intel);
        }
      }

      // Step 2: Validate Intel items
      await this.executeStep(
        workflow,
        'orchestrator',
        'validate',
        () => this.validateIntelCollection(retrievedIntel)
      );

      // Step 3: Create workspace export
      await this.executeStep(
        workflow,
        'workspace',
        'prepareExport',
        () => this.prepareWorkspaceExport(retrievedIntel)
      );

      // Step 4: Create Git snapshot
      await this.executeStep(
        workflow,
        'repository',
        'createSnapshot',
        () => this.createRepositorySnapshot(intelIds)
      );

      // Step 5: Create encrypted vault
      const vaultStep = await this.executeStep(
        workflow,
        'vault',
        'export',
        () => this.dataVaultService.exportToVault(retrievedIntel, 'export-collection')
      );

      workflow.success = workflow.errors.length === 0;
      workflow.duration = Date.now() - startTime;

      return vaultStep.result as DataVault;
    } catch (error) {
      workflow.errors.push(`Export workflow failed: ${(error as Error).message}`);
      workflow.duration = Date.now() - startTime;
      throw error;
    } finally {
      setTimeout(() => this.activeWorkflows.delete(workflowId), 300000);
    }
  }

  /**
   * Import Intel from vault with full integration
   */
  async importIntelWorkflow(vault: DataVault): Promise<ImportResult> {
    const workflowId = `import-intel-${Date.now()}`;
    const workflow: WorkflowResult = {
      success: false,
      workflowId,
      steps: [],
      duration: 0,
      errors: [],
      metadata: {
        vaultId: vault.id,
        operation: 'import',
        timestamp: new Date()
      }
    };

    const startTime = Date.now();
    this.activeWorkflows.set(workflowId, workflow);

    try {
      // Step 1: Import from vault
      const importStep = await this.executeStep(
        workflow,
        'vault',
        'import',
        () => this.dataVaultService.importFromVault(vault.id)
      );

      const importedIntel = importStep.result as Intel[];

      // Step 2: Store in unified storage
      const storagePromises = importedIntel.map(intel =>
        this.executeStep(
          workflow,
          'storage',
          'store',
          () => this.storageService.store(intel, { backend: 'file' })
        )
      );
      await Promise.all(storagePromises);

      // Step 3: Save to workspace
      const workspacePromises = importedIntel.map(intel =>
        this.executeStep(
          workflow,
          'workspace',
          'saveIntel',
          () => this.workspaceService.saveIntel(intel, './intel-workspace')
        )
      );
      await Promise.all(workspacePromises);

      // Step 4: Initialize Git tracking
      await this.executeStep(
        workflow,
        'repository',
        'bulkCommit',
        () => this.repositoryService.commitChanges(`Import from vault: ${vault.title}`)
      );

      workflow.success = workflow.errors.length === 0;
      workflow.duration = Date.now() - startTime;

      return {
        success: workflow.success,
        importedItems: importedIntel.map(intel => intel.id),
        errors: workflow.errors,
        warnings: [],
        duration: workflow.duration
      };
    } catch (error) {
      workflow.errors.push(`Import workflow failed: ${(error as Error).message}`);
      workflow.duration = Date.now() - startTime;
      
      return {
        success: false,
        importedItems: [],
        errors: workflow.errors,
        warnings: [],
        duration: workflow.duration
      };
    } finally {
      setTimeout(() => this.activeWorkflows.delete(workflowId), 300000);
    }
  }

  /**
   * Start collaboration session on Intel
   */
  async collaborateOnIntel(intelId: string, collaborators: string[]): Promise<CollaborationSession> {
    const sessionId = `collab-${intelId}-${Date.now()}`;
    const session: CollaborationSession = {
      sessionId,
      intelId,
      collaborators,
      initiator: 'current-user', // Would get from auth context
      status: 'active',
      startTime: new Date(),
      activities: []
    };

    this.activeSessions.set(sessionId, session);

    try {
      // Step 1: Create collaboration branch
      await this.repositoryService.createBranch(`collab-${intelId}`, 'main');

      // Step 2: Set up workspace for collaboration
      await this.workspaceService.createWorkspace(`./collab-${sessionId}`, `Collaboration: ${intelId}`);

      // Step 3: Notify collaborators (mock implementation)
      await this.notifyCollaborators(session);

      // Step 4: Initialize real-time sync (mock implementation)
      await this.initializeRealtimeSync(session);

      session.activities.push({
        activityId: `activity-${Date.now()}`,
        collaborator: session.initiator,
        action: 'session_started',
        timestamp: new Date(),
        details: { collaborators }
      });

      return session;
    } catch (error) {
      session.status = 'cancelled';
      session.endTime = new Date();
      throw new Error(`Failed to start collaboration: ${(error as Error).message}`);
    }
  }

  /**
   * Execute workflow step with error handling and monitoring
   */
  private async executeStep(
    workflow: WorkflowResult,
    service: string,
    operation: string,
    action: () => Promise<unknown>
  ): Promise<WorkflowStep> {
    const stepId = `${service}-${operation}-${Date.now()}`;
    const step: WorkflowStep = {
      stepId,
      service,
      operation,
      status: 'pending',
      startTime: new Date()
    };

    workflow.steps.push(step);
    step.status = 'running';

    try {
      const result = await this.executeWithRetry(action);
      
      step.status = 'completed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      step.result = result;

      return step;
    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      step.error = (error as Error).message;
      
      workflow.errors.push(`${service}.${operation}: ${step.error}`);
      
      return step;
    }
  }

  /**
   * Execute action with retry logic
   */
  private async executeWithRetry(action: () => Promise<unknown>): Promise<unknown> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await Promise.race([
          action(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), this.config.timeoutMs)
          )
        ]);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Initialize health monitoring for all services
   */
  private initializeHealthMonitoring(): void {
    if (!this.config.enableMonitoring) return;

    const services = ['dataVault', 'workspace', 'repository', 'storage'];
    
    services.forEach(serviceName => {
      this.serviceHealth.set(serviceName, {
        serviceName,
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date(),
        errors: []
      });
    });

    // Check health every 30 seconds
    setInterval(() => this.checkServiceHealth(), 30000);
  }

  /**
   * Check health of all services
   */
  private async checkServiceHealth(): Promise<void> {
    const healthChecks = [
      { name: 'dataVault', check: () => this.dataVaultService.listVaults() },
      { name: 'workspace', check: () => this.workspaceService.listWorkspaces() },
      { name: 'repository', check: () => this.repositoryService.getStatus() },
      { name: 'storage', check: () => this.storageService.getHealthStatus() }
    ];

    for (const { name, check } of healthChecks) {
      const startTime = Date.now();
      const health = this.serviceHealth.get(name)!;
      
      try {
        await check();
        
        health.status = 'healthy';
        health.responseTime = Date.now() - startTime;
        health.lastCheck = new Date();
        health.errors = [];
      } catch (error) {
        health.status = 'unhealthy';
        health.responseTime = Date.now() - startTime;
        health.lastCheck = new Date();
        health.errors.push((error as Error).message);
      }
    }
  }

  /**
   * Get current service health status
   */
  async getServiceHealth(): Promise<ServiceHealth[]> {
    return Array.from(this.serviceHealth.values());
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): WorkflowResult[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Get active collaboration sessions
   */
  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowResult | null {
    return this.activeWorkflows.get(workflowId) || null;
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return false;

    // Mark as cancelled and clean up
    workflow.errors.push('Workflow cancelled by user');
    workflow.success = false;
    
    this.activeWorkflows.delete(workflowId);
    return true;
  }

  // Private helper methods

  private async validateIntelCollection(intel: Intel[]): Promise<boolean> {
    // Mock validation - would implement real validation logic
    console.log(`Validating ${intel.length} Intel items`);
    return intel.length > 0;
  }

  private async prepareWorkspaceExport(intel: Intel[]): Promise<string> {
    // Mock workspace export preparation
    console.log(`Preparing workspace export for ${intel.length} Intel items`);
    return `export-${Date.now()}`;
  }

  private async createRepositorySnapshot(intelIds: string[]): Promise<string> {
    // Mock repository snapshot creation
    console.log(`Creating repository snapshot for Intel: ${intelIds.join(', ')}`);
    return `snapshot-${Date.now()}`;
  }

  private async notifyCollaborators(session: CollaborationSession): Promise<void> {
    // Mock collaborator notification
    console.log(`Notifying collaborators for session ${session.sessionId}: ${session.collaborators.join(', ')}`);
  }

  private async initializeRealtimeSync(session: CollaborationSession): Promise<void> {
    // Mock real-time sync initialization
    console.log(`Initializing real-time sync for session ${session.sessionId}`);
  }

  /**
   * Clean up completed workflows and sessions
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old workflows
    for (const [workflowId, workflow] of this.activeWorkflows) {
      const workflowTime = workflow.metadata.timestamp as Date;
      if (now - workflowTime.getTime() > maxAge) {
        this.activeWorkflows.delete(workflowId);
      }
    }

    // Clean up completed sessions
    for (const [sessionId, session] of this.activeSessions) {
      if (session.status === 'completed' && session.endTime && 
          now - session.endTime.getTime() > maxAge) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

/**
 * Factory function to create IntelServiceOrchestrator
 */
export function createIntelServiceOrchestrator(
  services: {
    dataVaultService: DataVaultServiceInterface;
    workspaceService: WorkspaceServiceInterface;
    repositoryService: RepositoryServiceInterface;
    storageService: StorageServiceInterface;
  },
  config?: Partial<OrchestrationConfig>
): IntelServiceOrchestrator {
  return new IntelServiceOrchestrator(services, config);
}

/**
 * Default orchestrator instance for easy access
 */
export function createDefaultOrchestrator(): IntelServiceOrchestrator {
  // Would import actual services in real implementation
  const services = {
    dataVaultService: null as unknown as DataVaultServiceInterface,
    workspaceService: null as unknown as WorkspaceServiceInterface,
    repositoryService: null as unknown as RepositoryServiceInterface,
    storageService: null as unknown as StorageServiceInterface
  };

  return createIntelServiceOrchestrator(services);
}
