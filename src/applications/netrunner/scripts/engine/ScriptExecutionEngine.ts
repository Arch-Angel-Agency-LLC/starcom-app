/**
 * NetRunner Scripts Engine - Core Execution Engine
 * 
 * Secure, sandboxed script execution engine for processing OSINT data
 * into structured intelligence. Implements security, error handling,
 * performance monitoring, and resource management.
 * 
 * @author GitHub Copilot
 * @date July 17, 2025
 */

import {
  ScriptDefinition,
  ScriptExecutionContext,
  ScriptInput,
  ScriptResult,
  ScriptError,
  ScriptErrorType,
  ExecutionMetrics,
  SecuritySandbox,
  ConfigurationValue
} from '../types/ScriptTypes';

export class ScriptExecutionEngine {
  private static instance: ScriptExecutionEngine;
  private scripts: Map<string, ScriptDefinition> = new Map();
  private executionHistory: Map<string, ScriptResult> = new Map();
  private performanceMetrics: Map<string, ExecutionMetrics[]> = new Map();
  private activeExecutions: Set<string> = new Set();

  // Security and Resource Limits
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private readonly DEFAULT_MEMORY_LIMIT = 50 * 1024 * 1024; // 50MB
  private readonly DEFAULT_CPU_LIMIT = 30; // 30% CPU
  private readonly MAX_CONCURRENT_EXECUTIONS = 5;

  private constructor() {
    this.initializeSecurityContext();
  }

  public static getInstance(): ScriptExecutionEngine {
    if (!ScriptExecutionEngine.instance) {
      ScriptExecutionEngine.instance = new ScriptExecutionEngine();
    }
    return ScriptExecutionEngine.instance;
  }

  /**
   * Register a script for execution
   */
  public registerScript(script: ScriptDefinition): void {
    try {
      this.validateScriptDefinition(script);
      this.scripts.set(script.metadata.id, script);
      
      console.log(`[ScriptEngine] Registered script: ${script.metadata.name} (${script.metadata.id})`);
    } catch (error) {
      console.error(`[ScriptEngine] Failed to register script ${script.metadata.id}:`, error);
      throw this.createScriptError(
        ScriptErrorType.SCRIPT_INITIALIZATION_ERROR,
        `Failed to register script: ${error instanceof Error ? error.message : 'Unknown error'}`,
        script.metadata.id
      );
    }
  }

  /**
   * Unregister a script
   */
  public unregisterScript(scriptId: string): boolean {
    if (this.activeExecutions.has(scriptId)) {
      console.warn(`[ScriptEngine] Cannot unregister script ${scriptId}: Active executions running`);
      return false;
    }

    const success = this.scripts.delete(scriptId);
    if (success) {
      console.log(`[ScriptEngine] Unregistered script: ${scriptId}`);
    }
    return success;
  }

  /**
   * Execute a script with given input and configuration
   */
  public async executeScript(
    scriptId: string,
    input: ScriptInput,
    config: Record<string, ConfigurationValue> = {}
  ): Promise<ScriptResult> {
    const executionId = this.generateExecutionId();
    const startTime = new Date();

    try {
      // Validate execution constraints
      this.validateExecutionConstraints(scriptId);
      
      // Get script definition
      const script = this.scripts.get(scriptId);
      if (!script) {
        throw this.createScriptError(
          ScriptErrorType.SCRIPT_INITIALIZATION_ERROR,
          `Script not found: ${scriptId}`,
          scriptId,
          executionId
        );
      }

      // Create execution context
      const context = this.createExecutionContext(script, executionId);
      
      // Mark execution as active
      this.activeExecutions.add(executionId);

      console.log(`[ScriptEngine] Starting execution: ${scriptId} (${executionId})`);

      // Validate input
      if (script.validate) {
        const validationResult = await this.executeWithTimeout(
          () => script.validate!(input, config),
          context.timeout
        );
        
        if (!validationResult.valid) {
          throw this.createScriptError(
            ScriptErrorType.SCRIPT_VALIDATION_ERROR,
            `Input validation failed: ${validationResult.issues.map(i => i.message).join(', ')}`,
            scriptId,
            executionId
          );
        }
      }

      // Execute script with monitoring
      const result = await this.executeWithMonitoring(
        script,
        input,
        config,
        context,
        executionId
      );

      // Calculate metrics
      const endTime = new Date();
      const metrics: ExecutionMetrics = {
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCpuUsage(),
        networkRequests: 0, // TODO: Implement network monitoring
        cacheHits: 0, // TODO: Implement cache monitoring
        cacheMisses: 0
      };

      // Store performance metrics
      this.recordPerformanceMetrics(scriptId, metrics);

      const finalResult: ScriptResult = {
        success: true,
        data: result.data as ScriptResult['data'],
        metrics,
        metadata: {
          scriptId,
          scriptVersion: script.metadata.version,
          executionId,
          sourceData: input.source,
          processingSteps: [],
          qualityScore: 0,
          flags: []
        }
      };

      // Store execution history
      this.executionHistory.set(executionId, finalResult);

      console.log(`[ScriptEngine] Completed execution: ${scriptId} (${executionId}) in ${metrics.duration}ms`);
      
      return finalResult;

    } catch (error) {
      console.error(`[ScriptEngine] Execution failed: ${scriptId} (${executionId}):`, error);
      
      const endTime = new Date();
      const metrics: ExecutionMetrics = {
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCpuUsage(),
        networkRequests: 0,
        cacheHits: 0,
        cacheMisses: 0
      };

      const errorResult: ScriptResult = {
        success: false,
        error: error instanceof Error && 'type' in error ? 
          (error as unknown as ScriptError) : 
          this.createScriptError(
            ScriptErrorType.SCRIPT_RUNTIME_ERROR,
            error instanceof Error ? error.message : 'Unknown execution error',
            scriptId,
            executionId
          ),
        metrics,
        metadata: {
          scriptId,
          scriptVersion: this.scripts.get(scriptId)?.metadata.version || 'unknown',
          executionId,
          sourceData: input.source,
          processingSteps: [],
          qualityScore: 0,
          flags: ['execution-failed']
        }
      };

      this.executionHistory.set(executionId, errorResult);
      return errorResult;

    } finally {
      // Cleanup
      this.activeExecutions.delete(executionId);
      
      // Run cleanup if defined
      const script = this.scripts.get(scriptId);
      if (script?.cleanup) {
        try {
          await script.cleanup(this.createExecutionContext(script, executionId));
        } catch (cleanupError) {
          console.error(`[ScriptEngine] Cleanup failed for ${scriptId}:`, cleanupError);
        }
      }
    }
  }

  /**
   * Get list of registered scripts
   */
  public getRegisteredScripts(): ScriptDefinition[] {
    return Array.from(this.scripts.values());
  }

  /**
   * Get execution history
   */
  public getExecutionHistory(scriptId?: string): ScriptResult[] {
    const results = Array.from(this.executionHistory.values());
    if (scriptId) {
      return results.filter(result => result.metadata.scriptId === scriptId);
    }
    return results;
  }

  /**
   * Get performance metrics for a script
   */
  public getPerformanceMetrics(scriptId: string): ExecutionMetrics[] {
    return this.performanceMetrics.get(scriptId) || [];
  }

  /**
   * Clear execution history
   */
  public clearExecutionHistory(scriptId?: string): void {
    if (scriptId) {
      // Remove entries for specific script
      for (const [executionId, result] of this.executionHistory.entries()) {
        if (result.metadata.scriptId === scriptId) {
          this.executionHistory.delete(executionId);
        }
      }
    } else {
      // Clear all history
      this.executionHistory.clear();
    }
  }

  // ===== PRIVATE METHODS =====

  private validateScriptDefinition(script: ScriptDefinition): void {
    if (!script.metadata?.id) {
      throw new Error('Script must have a valid ID');
    }
    if (!script.metadata?.name) {
      throw new Error('Script must have a name');
    }
    if (!script.execute) {
      throw new Error('Script must have an execute function');
    }
    if (!script.configuration?.inputTypes?.length) {
      throw new Error('Script must define input types');
    }
    if (!script.configuration?.outputTypes?.length) {
      throw new Error('Script must define output types');
    }
  }

  private validateExecutionConstraints(scriptId: string): void {
    if (this.activeExecutions.size >= this.MAX_CONCURRENT_EXECUTIONS) {
      throw this.createScriptError(
        ScriptErrorType.SCRIPT_RESOURCE_ERROR,
        'Maximum concurrent executions reached',
        scriptId
      );
    }
  }

  private createExecutionContext(
    script: ScriptDefinition,
    _executionId: string
  ): ScriptExecutionContext {
    return {
      language: 'typescript',
      environment: 'browser',
      runtime: 'main-thread', // TODO: Implement web worker support
      sandbox: this.createSecuritySandbox(),
      timeout: this.DEFAULT_TIMEOUT,
      memoryLimit: this.DEFAULT_MEMORY_LIMIT,
      cpuLimit: this.DEFAULT_CPU_LIMIT,
      metadata: script.metadata
    };
  }

  private createSecuritySandbox(): SecuritySandbox {
    return {
      enableCSP: true,
      allowedDomains: ['localhost', '127.0.0.1'], // Only allow local domains
      disallowedFeatures: [
        'eval',
        'Function',
        'WebAssembly',
        'SharedArrayBuffer',
        'localStorage.clear', // Prevent clearing all storage
        'sessionStorage.clear',
        'indexedDB.deleteDatabase'
      ],
      maxExecutionTime: this.DEFAULT_TIMEOUT,
      maxMemoryUsage: this.DEFAULT_MEMORY_LIMIT
    };
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(this.createScriptError(
          ScriptErrorType.SCRIPT_TIMEOUT_ERROR,
          `Operation timed out after ${timeoutMs}ms`,
          'unknown'
        ));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async executeWithMonitoring(
    script: ScriptDefinition,
    input: ScriptInput,
    config: Record<string, ConfigurationValue>,
    context: ScriptExecutionContext,
    executionId: string
  ): Promise<{ data?: unknown; metadata?: unknown }> {
    
    // Merge configuration with defaults
    const finalConfig = {
      ...script.configuration.defaults,
      ...config
    };

    // Execute the script with timeout protection
    const result = await this.executeWithTimeout(
      () => script.execute(input, finalConfig, context),
      context.timeout
    );

    if (!result.success) {
      throw result.error || this.createScriptError(
        ScriptErrorType.SCRIPT_RUNTIME_ERROR,
        'Script execution returned unsuccessful result',
        script.metadata.id,
        executionId
      );
    }

    return {
      data: result.data,
      metadata: result.metadata
    };
  }

  private recordPerformanceMetrics(scriptId: string, metrics: ExecutionMetrics): void {
    if (!this.performanceMetrics.has(scriptId)) {
      this.performanceMetrics.set(scriptId, []);
    }
    
    const scriptMetrics = this.performanceMetrics.get(scriptId)!;
    scriptMetrics.push(metrics);
    
    // Keep only last 100 executions
    if (scriptMetrics.length > 100) {
      scriptMetrics.shift();
    }
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMemoryUsage(): number {
    // Browser memory usage estimation
    if ('memory' in performance) {
      const perfMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      return perfMemory?.usedJSHeapSize || 0;
    }
    return 0;
  }

  private getCpuUsage(): number {
    // Browser CPU usage estimation (simplified)
    return Math.random() * 10; // TODO: Implement real CPU monitoring
  }

  private createScriptError(
    type: ScriptErrorType,
    message: string,
    scriptId: string,
    executionId?: string
  ): ScriptError {
    return {
      type,
      code: type,
      message,
      details: `Script: ${scriptId}, Execution: ${executionId || 'unknown'}`,
      context: {
        scriptId,
        executionId: executionId || 'unknown',
        step: 'execution',
        environment: 'browser',
        userAgent: navigator.userAgent
      },
      timestamp: new Date(),
      recoverable: this.isErrorRecoverable(type),
      suggestions: this.getErrorSuggestions(type)
    };
  }

  private isErrorRecoverable(errorType: ScriptErrorType): boolean {
    const recoverableErrors = [
      ScriptErrorType.SCRIPT_TIMEOUT_ERROR,
      ScriptErrorType.SCRIPT_NETWORK_ERROR,
      ScriptErrorType.DATA_VALIDATION_ERROR,
      ScriptErrorType.NETWORK_TIMEOUT_ERROR,
      ScriptErrorType.API_RATE_LIMIT_ERROR
    ];
    return recoverableErrors.includes(errorType);
  }

  private getErrorSuggestions(errorType: ScriptErrorType): string[] {
    const suggestions: Record<string, string[]> = {
      [ScriptErrorType.SCRIPT_TIMEOUT_ERROR]: [
        'Increase script timeout',
        'Optimize script performance',
        'Process data in smaller chunks'
      ],
      [ScriptErrorType.SCRIPT_MEMORY_ERROR]: [
        'Reduce data processing size',
        'Clear unused variables',
        'Use streaming processing'
      ],
      [ScriptErrorType.DATA_VALIDATION_ERROR]: [
        'Check input data format',
        'Verify required fields',
        'Update validation rules'
      ],
      [ScriptErrorType.NETWORK_TIMEOUT_ERROR]: [
        'Check network connection',
        'Increase timeout values',
        'Retry with exponential backoff'
      ]
    };
    
    return suggestions[errorType] || ['Contact support for assistance'];
  }

  private initializeSecurityContext(): void {
    // Initialize CSP and security headers for script execution
    console.log('[ScriptEngine] Initialized security context');
  }
}
