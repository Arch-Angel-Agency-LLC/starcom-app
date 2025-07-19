/**
 * NetRunner Scripts Engine - UI Integration Service
 * 
 * Connects the Scripts Engine to the NetRunner user interface,
 * providing seamless integration with the left sidebar Scripts tab
 * and right sidebar Results display.
 * 
 * @author GitHub Copilot
 * @date July 17, 2025
 */

import { NetRunnerScriptRegistry } from './NetRunnerScriptRegistry';
import { ScriptExecutionEngine } from './ScriptExecutionEngine';
import {
  ScriptDefinition,
  ScriptResult,
  ScriptInput,
  ConfigurationValue,
  ScriptCategory,
  ScriptErrorType
} from '../types/ScriptTypes';
import { OSINTData } from '../../services/WebsiteScanner';

export interface ScriptExecutionRequest {
  scriptId: string;
  targetUrl: string;
  osintData: OSINTData;
  configuration?: Record<string, ConfigurationValue>;
  callback?: (result: ScriptResult) => void;
}

export interface ScriptMetrics {
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  errorRate: number;
  popularityScore: number;
  recentMetrics: unknown[];
}

export type UIEventData = {
  scriptId?: string;
  targetUrl?: string;
  result?: ScriptResult;
  error?: Error;
  scriptIds?: string[];
  results?: Record<string, ScriptResult>;
};

export interface ScriptUIState {
  availableScripts: ScriptDefinition[];
  executingScripts: Set<string>;
  recentResults: ScriptResult[];
  selectedScript?: string;
  executionHistory: Map<string, ScriptResult[]>;
}

export class NetRunnerScriptsUIService {
  private static instance: NetRunnerScriptsUIService;
  private registry: NetRunnerScriptRegistry;
  private executionEngine: ScriptExecutionEngine;
  private uiState: ScriptUIState;
  private eventListeners: Map<string, ((data: UIEventData) => void)[]> = new Map();

  private constructor() {
    this.registry = NetRunnerScriptRegistry.getInstance();
    this.executionEngine = ScriptExecutionEngine.getInstance();
    this.uiState = {
      availableScripts: [],
      executingScripts: new Set(),
      recentResults: [],
      executionHistory: new Map()
    };
    
    this.initializeUIState();
  }

  public static getInstance(): NetRunnerScriptsUIService {
    if (!NetRunnerScriptsUIService.instance) {
      NetRunnerScriptsUIService.instance = new NetRunnerScriptsUIService();
    }
    return NetRunnerScriptsUIService.instance;
  }

  /**
   * Initialize UI state with available scripts
   */
  private initializeUIState(): void {
    this.uiState.availableScripts = this.registry.getAllScripts();
    console.log(`[ScriptsUIService] Initialized with ${this.uiState.availableScripts.length} scripts`);
  }

  /**
   * Get current UI state
   */
  public getUIState(): ScriptUIState {
    return {
      ...this.uiState,
      availableScripts: [...this.uiState.availableScripts],
      executingScripts: new Set(this.uiState.executingScripts),
      recentResults: [...this.uiState.recentResults],
      executionHistory: new Map(this.uiState.executionHistory)
    };
  }

  /**
   * Get scripts by category for UI display
   */
  public getScriptsByCategory(): Record<ScriptCategory, ScriptDefinition[]> {
    const categories: Record<string, ScriptDefinition[]> = {};
    
    for (const script of this.uiState.availableScripts) {
      if (!categories[script.metadata.category]) {
        categories[script.metadata.category] = [];
      }
      categories[script.metadata.category].push(script);
    }
    
    return categories as Record<ScriptCategory, ScriptDefinition[]>;
  }

  /**
   * Get default scripts for quick access
   */
  public getDefaultScripts(): ScriptDefinition[] {
    return this.registry.getDefaultScripts();
  }

  /**
   * Execute a script with OSINT data
   */
  public async executeScript(request: ScriptExecutionRequest): Promise<ScriptResult> {
    const { scriptId, targetUrl, osintData, configuration = {}, callback } = request;

    try {
      // Check if script exists
      const script = this.registry.getScript(scriptId);
      if (!script) {
        throw new Error(`Script not found: ${scriptId}`);
      }

      // Mark as executing
      this.uiState.executingScripts.add(scriptId);
      this.notifyListeners('execution-started', { scriptId, targetUrl });

      // Prepare script input
      const scriptInput: ScriptInput = {
        data: osintData,
        source: 'netrunner-ui',
        timestamp: new Date(),
        metadata: {
          scanId: `ui-${Date.now()}`,
          targetUrl,
          scanType: 'ui-triggered',
          confidence: 0.9
        }
      };

      console.log(`[ScriptsUIService] Executing script: ${script.metadata.name} for ${targetUrl}`);

      // Execute script
      const result = await this.executionEngine.executeScript(
        scriptId,
        scriptInput,
        configuration
      );

      // Update UI state
      this.uiState.executingScripts.delete(scriptId);
      this.addToRecentResults(result);
      this.addToExecutionHistory(scriptId, result);

      // Update registry statistics
      this.registry.updateExecutionStatistics(
        scriptId,
        result.success,
        result.metrics.duration
      );

      // Notify callback
      if (callback) {
        callback(result);
      }

      // Notify listeners
      this.notifyListeners('execution-completed', { scriptId, targetUrl, result });

      console.log(`[ScriptsUIService] Script execution completed: ${scriptId}`);
      return result;

    } catch (error) {
      // Clean up execution state
      this.uiState.executingScripts.delete(scriptId);

      // Create error result
      const errorResult: ScriptResult = {
        success: false,
        error: {
          type: ScriptErrorType.SCRIPT_RUNTIME_ERROR,
          code: 'UI_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: `Failed to execute script ${scriptId} for ${targetUrl}`,
          context: {
            scriptId,
            executionId: `ui-error-${Date.now()}`,
            step: 'ui-execution',
            environment: 'browser',
            userAgent: navigator.userAgent
          },
          timestamp: new Date(),
          recoverable: true,
          suggestions: [
            'Check script configuration',
            'Verify OSINT data format',
            'Try again with different parameters'
          ]
        },
        metrics: {
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        },
        metadata: {
          scriptId,
          scriptVersion: '0.0.0',
          executionId: `ui-error-${Date.now()}`,
          sourceData: 'netrunner-ui',
          processingSteps: [],
          qualityScore: 0,
          flags: ['ui-execution-error']
        }
      };

      this.addToRecentResults(errorResult);
      this.addToExecutionHistory(scriptId, errorResult);

      // Notify listeners
      this.notifyListeners('execution-failed', { scriptId, targetUrl, error });

      console.error(`[ScriptsUIService] Script execution failed: ${scriptId}`, error);
      return errorResult;
    }
  }

  /**
   * Execute multiple scripts in parallel
   */
  public async executeMultipleScripts(
    scriptIds: string[],
    targetUrl: string,
    osintData: OSINTData,
    configuration: Record<string, Record<string, ConfigurationValue>> = {}
  ): Promise<Record<string, ScriptResult>> {
    console.log(`[ScriptsUIService] Executing ${scriptIds.length} scripts for ${targetUrl}`);

    const results: Record<string, ScriptResult> = {};
    const promises = scriptIds.map(async (scriptId) => {
      const scriptConfig = configuration[scriptId] || {};
      const result = await this.executeScript({
        scriptId,
        targetUrl,
        osintData,
        configuration: scriptConfig
      });
      results[scriptId] = result;
      return result;
    });

    await Promise.all(promises);
    
    this.notifyListeners('batch-execution-completed', { scriptIds, targetUrl, results });
    
    return results;
  }

  /**
   * Execute default scripts for a target
   */
  public async executeDefaultScripts(
    targetUrl: string,
    osintData: OSINTData
  ): Promise<Record<string, ScriptResult>> {
    const defaultScripts = this.getDefaultScripts();
    const scriptIds = defaultScripts.map(script => script.metadata.id);
    
    console.log(`[ScriptsUIService] Executing default scripts for ${targetUrl}`);
    
    return await this.executeMultipleScripts(scriptIds, targetUrl, osintData);
  }

  /**
   * Get execution status for a script
   */
  public isScriptExecuting(scriptId: string): boolean {
    return this.uiState.executingScripts.has(scriptId);
  }

  /**
   * Get recent execution results
   */
  public getRecentResults(limit: number = 10): ScriptResult[] {
    return this.uiState.recentResults.slice(0, limit);
  }

  /**
   * Get execution history for a specific script
   */
  public getScriptExecutionHistory(scriptId: string): ScriptResult[] {
    return this.uiState.executionHistory.get(scriptId) || [];
  }

  /**
   * Clear execution history
   */
  public clearExecutionHistory(scriptId?: string): void {
    if (scriptId) {
      this.uiState.executionHistory.delete(scriptId);
    } else {
      this.uiState.executionHistory.clear();
      this.uiState.recentResults = [];
    }
    
    this.notifyListeners('history-cleared', { scriptId });
  }

  /**
   * Search available scripts
   */
  public searchScripts(query: string): ScriptDefinition[] {
    return this.registry.searchScripts(query);
  }

  /**
   * Get script performance metrics
   */
  public getScriptMetrics(scriptId: string): ScriptMetrics {
    const executionMetrics = this.executionEngine.getPerformanceMetrics(scriptId);
    const registryStats = this.registry.getRegistryStatistics();
    
    return {
      executionCount: registryStats.executionCount[scriptId] || 0,
      successRate: registryStats.successRate[scriptId] || 0,
      averageExecutionTime: registryStats.averageExecutionTime[scriptId] || 0,
      errorRate: registryStats.errorRates[scriptId] || 0,
      popularityScore: registryStats.popularityScore[scriptId] || 0,
      recentMetrics: executionMetrics.slice(-10) // Last 10 executions
    };
  }

  /**
   * Add event listener for UI updates
   */
  public addEventListener(event: string, callback: (data: UIEventData) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: (data: UIEventData) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Export execution results for analysis
   */
  public exportResults(format: 'json' | 'csv' = 'json'): string {
    const results = this.uiState.recentResults.map(result => ({
      scriptId: result.metadata.scriptId,
      success: result.success,
      duration: result.metrics.duration,
      timestamp: result.metrics.startTime.toISOString(),
      qualityScore: result.metadata.qualityScore,
      targetUrl: result.metadata.sourceData,
      error: result.error?.message || null
    }));

    if (format === 'csv') {
      const headers = 'scriptId,success,duration,timestamp,qualityScore,targetUrl,error\n';
      const rows = results.map(r => 
        `${r.scriptId},${r.success},${r.duration},${r.timestamp},${r.qualityScore},${r.targetUrl},"${r.error || ''}"`
      ).join('\n');
      return headers + rows;
    }

    return JSON.stringify(results, null, 2);
  }

  // ===== PRIVATE METHODS =====

  private addToRecentResults(result: ScriptResult): void {
    this.uiState.recentResults.unshift(result);
    
    // Keep only last 50 results
    if (this.uiState.recentResults.length > 50) {
      this.uiState.recentResults = this.uiState.recentResults.slice(0, 50);
    }
  }

  private addToExecutionHistory(scriptId: string, result: ScriptResult): void {
    if (!this.uiState.executionHistory.has(scriptId)) {
      this.uiState.executionHistory.set(scriptId, []);
    }
    
    const history = this.uiState.executionHistory.get(scriptId)!;
    history.unshift(result);
    
    // Keep only last 20 executions per script
    if (history.length > 20) {
      this.uiState.executionHistory.set(scriptId, history.slice(0, 20));
    }
  }

  private notifyListeners(event: string, data: UIEventData): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[ScriptsUIService] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Reset UI state (for testing)
   */
  public reset(): void {
    this.uiState = {
      availableScripts: [],
      executingScripts: new Set(),
      recentResults: [],
      executionHistory: new Map()
    };
    this.eventListeners.clear();
    this.initializeUIState();
    console.log('[ScriptsUIService] UI state reset');
  }
}
