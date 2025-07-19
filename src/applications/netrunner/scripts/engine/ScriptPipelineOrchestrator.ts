/**
 * NetRunner Scripts Engine - Pipeline Orchestrator
 * 
 * Orchestrates the complete data pipeline from WebsiteScanner through Scripts Engine
 * to IntelAnalyzer, providing automated workflow management and integration.
 * 
 * This is the critical missing component that completes the intelligence pipeline.
 * 
 * @author GitHub Copilot
 * @date July 18, 2025
 */

import { NetRunnerScriptRegistry } from './NetRunnerScriptRegistry';
import { ScriptExecutionEngine } from './ScriptExecutionEngine';
import { ResultsCategorizationEngine } from '../results/ResultsCategorizationEngine';
import {
  ScriptResult,
  ScriptInput,
  ScriptErrorType,
  ProcessedIntelligenceData
} from '../types/ScriptTypes';
import { OSINTData, ScanResult } from '../../services/WebsiteScanner';

export interface PipelineConfiguration {
  enabledScripts: string[];
  enableIntelAnalyzerIntegration: boolean;
  enableResultsDisplay: boolean;
  enableParallelExecution: boolean;
  maxConcurrentScripts: number;
  pipelineTimeout: number;
}

export interface PipelineResult {
  success: boolean;
  totalScripts: number;
  successfulScripts: number;
  failedScripts: number;
  results: ScriptResult[];
  categorizedResults: unknown[]; // CategorizedResult[] - will be properly typed when Results integration is complete
  intelligenceData: ProcessedIntelligenceData[];
  executionTime: number;
  error?: string;
}

export interface PipelineStatus {
  stage: 'initializing' | 'executing-scripts' | 'categorizing-results' | 'intel-analysis' | 'completed' | 'failed';
  progress: number;
  currentScript?: string;
  message: string;
}

export class ScriptPipelineOrchestrator {
  private static instance: ScriptPipelineOrchestrator;
  private registry: NetRunnerScriptRegistry;
  private executionEngine: ScriptExecutionEngine;
  private categorizationEngine: ResultsCategorizationEngine;
  private statusCallbacks: ((status: PipelineStatus) => void)[] = [];

  private constructor() {
    this.registry = NetRunnerScriptRegistry.getInstance();
    this.executionEngine = ScriptExecutionEngine.getInstance();
    this.categorizationEngine = new ResultsCategorizationEngine();

    console.log('[PipelineOrchestrator] Initialized pipeline orchestrator');
  }

  public static getInstance(): ScriptPipelineOrchestrator {
    if (!ScriptPipelineOrchestrator.instance) {
      ScriptPipelineOrchestrator.instance = new ScriptPipelineOrchestrator();
    }
    return ScriptPipelineOrchestrator.instance;
  }

  /**
   * Execute complete pipeline: WebsiteScanner → Scripts → IntelAnalyzer
   */
  public async executePipeline(
    scanResult: ScanResult,
    configuration: Partial<PipelineConfiguration> = {}
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const config = this.mergeConfiguration(configuration);
    
    console.log(`[PipelineOrchestrator] Starting pipeline for ${scanResult.url}`);
    
    try {
      // Stage 1: Initialize pipeline
      this.updateStatus({
        stage: 'initializing',
        progress: 0,
        message: 'Initializing pipeline...'
      });

      // Validate input
      if (!scanResult.osintData) {
        throw new Error('ScanResult missing OSINT data');
      }

      // Stage 2: Execute scripts
      this.updateStatus({
        stage: 'executing-scripts',
        progress: 20,
        message: 'Executing scripts...'
      });

      const scriptResults = await this.executeScripts(
        scanResult.osintData,
        scanResult.url,
        config
      );

      // Stage 3: Categorize results
      this.updateStatus({
        stage: 'categorizing-results',
        progress: 60,
        message: 'Categorizing results...'
      });

      const categorizedResults = this.categorizeResults(scriptResults);

      // Stage 4: Prepare intelligence data
      this.updateStatus({
        stage: 'intel-analysis',
        progress: 80,
        message: 'Preparing intelligence data...'
      });

      const intelligenceData = this.prepareIntelligenceData(scriptResults);

      // Stage 5: Integration points (placeholders for actual integrations)
      if (config.enableIntelAnalyzerIntegration) {
        await this.integrateWithIntelAnalyzer(intelligenceData);
      }

      if (config.enableResultsDisplay) {
        await this.integrateWithResultsDisplay(categorizedResults);
      }

      // Stage 6: Complete
      this.updateStatus({
        stage: 'completed',
        progress: 100,
        message: 'Pipeline completed successfully'
      });

      const pipelineResult: PipelineResult = {
        success: true,
        totalScripts: scriptResults.length,
        successfulScripts: scriptResults.filter(r => r.success).length,
        failedScripts: scriptResults.filter(r => !r.success).length,
        results: scriptResults,
        categorizedResults,
        intelligenceData,
        executionTime: Date.now() - startTime
      };

      console.log(`[PipelineOrchestrator] Pipeline completed in ${pipelineResult.executionTime}ms`);
      return pipelineResult;

    } catch (error) {
      this.updateStatus({
        stage: 'failed',
        progress: 0,
        message: `Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      console.error('[PipelineOrchestrator] Pipeline execution failed:', error);
      
      return {
        success: false,
        totalScripts: 0,
        successfulScripts: 0,
        failedScripts: 0,
        results: [],
        categorizedResults: [],
        intelligenceData: [],
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute all enabled scripts
   */
  private async executeScripts(
    osintData: OSINTData,
    targetUrl: string,
    config: PipelineConfiguration
  ): Promise<ScriptResult[]> {
    const scripts = this.registry.getDefaultScripts();
    const enabledScripts = config.enabledScripts.length > 0 
      ? scripts.filter(s => config.enabledScripts.includes(s.metadata.id))
      : scripts;

    console.log(`[PipelineOrchestrator] Executing ${enabledScripts.length} scripts`);

    const results: ScriptResult[] = [];
    const scriptInput: ScriptInput = {
      data: osintData,
      source: 'pipeline-orchestrator',
      timestamp: new Date(),
      metadata: {
        scanId: `pipeline-${Date.now()}`,
        targetUrl,
        scanType: 'automated-pipeline',
        confidence: 0.9
      }
    };

    if (config.enableParallelExecution) {
      // Execute scripts in parallel
      const promises = enabledScripts.map(async (script) => {
        try {
          this.updateStatus({
            stage: 'executing-scripts',
            progress: 20,
            currentScript: script.metadata.name,
            message: `Executing ${script.metadata.name}...`
          });

          const result = await this.executionEngine.executeScript(
            script.metadata.id,
            scriptInput,
            {}
          );

          return result;
        } catch (error) {
          console.error(`[PipelineOrchestrator] Script ${script.metadata.name} failed:`, error);
          return {
            success: false,
            error: {
              type: ScriptErrorType.SCRIPT_RUNTIME_ERROR,
              code: 'SRE002',
              message: error instanceof Error ? error.message : 'Script execution failed',
              details: `Script: ${script.metadata.name}`,
              context: {
                scriptId: script.metadata.id,
                executionId: `pipeline-${Date.now()}`,
                step: 'execution',
                environment: 'browser',
                userAgent: navigator.userAgent || 'unknown'
              },
              timestamp: new Date(),
              recoverable: true,
              suggestions: ['Check script configuration', 'Verify input data format', 'Review script logs']
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
              scriptId: script.metadata.id,
              executionId: `pipeline-${Date.now()}`,
              scriptVersion: script.metadata.version,
              sourceData: 'pipeline-orchestrator',
              processingSteps: [],
              qualityScore: 0,
              flags: ['execution-failed']
            }
          };
        }
      });

      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults);

    } else {
      // Execute scripts sequentially
      for (let i = 0; i < enabledScripts.length; i++) {
        const script = enabledScripts[i];
        const progress = 20 + (40 * i / enabledScripts.length);

        this.updateStatus({
          stage: 'executing-scripts',
          progress,
          currentScript: script.metadata.name,
          message: `Executing ${script.metadata.name}... (${i + 1}/${enabledScripts.length})`
        });

        try {
          const result = await this.executionEngine.executeScript(
            script.metadata.id,
            scriptInput,
            {}
          );

          results.push(result);
        } catch (error) {
          console.error(`[PipelineOrchestrator] Script ${script.metadata.name} failed:`, error);
          results.push({
            success: false,
            error: {
              type: ScriptErrorType.SCRIPT_RUNTIME_ERROR,
              code: 'SRE002',
              message: error instanceof Error ? error.message : 'Script execution failed',
              details: `Script: ${script.metadata.name}`,
              context: {
                scriptId: script.metadata.id,
                executionId: `pipeline-${Date.now()}`,
                step: 'execution',
                environment: 'browser',
                userAgent: navigator.userAgent || 'unknown'
              },
              timestamp: new Date(),
              recoverable: true,
              suggestions: ['Check script configuration', 'Verify input data format', 'Review script logs']
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
              scriptId: script.metadata.id,
              executionId: `pipeline-${Date.now()}`,
              scriptVersion: script.metadata.version,
              sourceData: 'pipeline-orchestrator',
              processingSteps: [],
              qualityScore: 0,
              flags: ['execution-failed']
            }
          });
        }
      }
    }

    return results;
  }

  /**
   * Categorize script results using Results Categorization Engine
   */
  private categorizeResults(scriptResults: ScriptResult[]): unknown[] {
    console.log(`[PipelineOrchestrator] Categorizing ${scriptResults.length} results`);
    
    const categorizedResults: unknown[] = [];
    
    for (const result of scriptResults) {
      if (result.success) {
        try {
          const categorized = this.categorizationEngine.categorizeResult(result);
          categorizedResults.push(categorized);
        } catch (error) {
          console.error('[PipelineOrchestrator] Result categorization failed:', error);
        }
      }
    }

    return categorizedResults;
  }

  /**
   * Prepare intelligence data for IntelAnalyzer integration
   */
  private prepareIntelligenceData(scriptResults: ScriptResult[]): ProcessedIntelligenceData[] {
    console.log(`[PipelineOrchestrator] Preparing intelligence data from ${scriptResults.length} results`);
    
    const intelligenceData: ProcessedIntelligenceData[] = [];
    
    for (const result of scriptResults) {
      if (result.success && result.data) {
        intelligenceData.push(result.data);
      }
    }

    return intelligenceData;
  }

  /**
   * Integration point for IntelAnalyzer (placeholder for actual integration)
   */
  private async integrateWithIntelAnalyzer(intelligenceData: ProcessedIntelligenceData[]): Promise<void> {
    console.log(`[PipelineOrchestrator] IntelAnalyzer integration: ${intelligenceData.length} intelligence items`);
    
    // TODO: Implement actual IntelAnalyzer integration
    // This is where the Scripts Engine results would be passed to IntelAnalyzer
    // for further intelligence processing and analysis
    
    // Placeholder implementation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('[PipelineOrchestrator] IntelAnalyzer integration completed (placeholder)');
  }

  /**
   * Integration point for Results Display (placeholder for actual integration)
   */
  private async integrateWithResultsDisplay(categorizedResults: unknown[]): Promise<void> {
    console.log(`[PipelineOrchestrator] Results display integration: ${categorizedResults.length} categorized results`);
    
    // TODO: Implement actual Results Display integration
    // This is where categorized results would be displayed in NetRunnerRightSideBar
    
    // Placeholder implementation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('[PipelineOrchestrator] Results display integration completed (placeholder)');
  }

  /**
   * Add status callback for pipeline monitoring
   */
  public addStatusCallback(callback: (status: PipelineStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * Remove status callback
   */
  public removeStatusCallback(callback: (status: PipelineStatus) => void): void {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  /**
   * Update pipeline status and notify callbacks
   */
  private updateStatus(status: PipelineStatus): void {
    console.log(`[PipelineOrchestrator] Status: ${status.stage} - ${status.progress}% - ${status.message}`);
    
    for (const callback of this.statusCallbacks) {
      try {
        callback(status);
      } catch (error) {
        console.error('[PipelineOrchestrator] Status callback error:', error);
      }
    }
  }

  /**
   * Merge configuration with defaults
   */
  private mergeConfiguration(config: Partial<PipelineConfiguration>): PipelineConfiguration {
    return {
      enabledScripts: config.enabledScripts || [],
      enableIntelAnalyzerIntegration: config.enableIntelAnalyzerIntegration ?? true,
      enableResultsDisplay: config.enableResultsDisplay ?? true,
      enableParallelExecution: config.enableParallelExecution ?? false,
      maxConcurrentScripts: config.maxConcurrentScripts || 2,
      pipelineTimeout: config.pipelineTimeout || 30000
    };
  }

  /**
   * Get pipeline health status
   */
  public getPipelineHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      scriptRegistry: boolean;
      executionEngine: boolean;
      categorizationEngine: boolean;
    };
  } {
    try {
      const registryHealthy = this.registry.getDefaultScripts().length > 0;
      const executionEngineHealthy = this.executionEngine !== null;
      const categorizationEngineHealthy = this.categorizationEngine !== null;

      const componentsHealthy = registryHealthy && executionEngineHealthy && categorizationEngineHealthy;

      return {
        status: componentsHealthy ? 'healthy' : 'degraded',
        components: {
          scriptRegistry: registryHealthy,
          executionEngine: executionEngineHealthy,
          categorizationEngine: categorizationEngineHealthy
        }
      };
    } catch (error) {
      console.error('[PipelineOrchestrator] Health check failed:', error);
      return {
        status: 'unhealthy',
        components: {
          scriptRegistry: false,
          executionEngine: false,
          categorizationEngine: false
        }
      };
    }
  }
}
