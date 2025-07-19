/**
 * NetRunner Scripts Engine - Script Registry
 * 
 * Central registry for managing script definitions, dependencies,
 * and metadata. Provides registration, discovery, and lifecycle
 * management for all NetRunner scripts.
 * 
 * @author GitHub Copilot
 * @date July 17, 2025
 */

import {
  ScriptDefinition,
  ScriptRegistry,
  ScriptCategory,
  RegistryMetadata,
  RegistryStatistics,
  DEFAULT_SCRIPT_CONFIGS,
  DefaultScriptType
} from '../types/ScriptTypes';

import { EmailExtractorScript } from '../library/EmailExtractorScript';
import { DomainParserScript } from '../library/DomainParserScript';
import { TechStackAnalyzerScript } from '../library/TechStackAnalyzerScript';
import { ContactHarvesterScript } from '../library/ContactHarvesterScript';
import { ScriptExecutionEngine } from './ScriptExecutionEngine';

export class NetRunnerScriptRegistry {
  private static instance: NetRunnerScriptRegistry;
  private registry: ScriptRegistry;
  private executionEngine: ScriptExecutionEngine;

  private constructor() {
    this.executionEngine = ScriptExecutionEngine.getInstance();
    this.registry = {
      scripts: new Map(),
      categories: new Map(),
      dependencies: new Map(),
      metadata: this.createInitialMetadata()
    };
    
    this.initializeDefaultScripts();
  }

  public static getInstance(): NetRunnerScriptRegistry {
    if (!NetRunnerScriptRegistry.instance) {
      NetRunnerScriptRegistry.instance = new NetRunnerScriptRegistry();
    }
    return NetRunnerScriptRegistry.instance;
  }

  /**
   * Initialize default NetRunner scripts
   */
  private initializeDefaultScripts(): void {
    console.log('[ScriptRegistry] Initializing default scripts...');

    try {
      // Register all default scripts
      this.registerScript(EmailExtractorScript);
      this.registerScript(DomainParserScript);
      this.registerScript(TechStackAnalyzerScript);
      this.registerScript(ContactHarvesterScript);

      console.log(`[ScriptRegistry] Initialized ${this.registry.scripts.size} default scripts`);
    } catch (error) {
      console.error('[ScriptRegistry] Failed to initialize default scripts:', error);
    }
  }

  /**
   * Register a new script
   */
  public registerScript(script: ScriptDefinition): void {
    try {
      // Validate script
      this.validateScript(script);

      // Check for conflicts
      if (this.registry.scripts.has(script.metadata.id)) {
        console.warn(`[ScriptRegistry] Script ${script.metadata.id} already exists, updating...`);
      }

      // Register with execution engine
      this.executionEngine.registerScript(script);

      // Add to registry
      this.registry.scripts.set(script.metadata.id, script);
      
      // Update categories
      this.updateCategoriesIndex(script);
      
      // Update dependencies
      this.updateDependenciesIndex(script);
      
      // Update metadata
      this.updateRegistryMetadata();

      console.log(`[ScriptRegistry] Registered script: ${script.metadata.name} (${script.metadata.id})`);
    } catch (error) {
      console.error(`[ScriptRegistry] Failed to register script ${script.metadata.id}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a script
   */
  public unregisterScript(scriptId: string): boolean {
    try {
      const script = this.registry.scripts.get(scriptId);
      if (!script) {
        console.warn(`[ScriptRegistry] Script ${scriptId} not found`);
        return false;
      }

      // Check for dependents
      const dependents = this.findDependentScripts(scriptId);
      if (dependents.length > 0) {
        console.error(`[ScriptRegistry] Cannot unregister ${scriptId}: has dependents`, dependents);
        return false;
      }

      // Unregister from execution engine
      const engineSuccess = this.executionEngine.unregisterScript(scriptId);
      if (!engineSuccess) {
        console.warn(`[ScriptRegistry] Failed to unregister from execution engine: ${scriptId}`);
        return false;
      }

      // Remove from registry
      this.registry.scripts.delete(scriptId);
      
      // Update indices
      this.cleanupCategoriesIndex(script);
      this.cleanupDependenciesIndex(script);
      
      // Update metadata
      this.updateRegistryMetadata();

      console.log(`[ScriptRegistry] Unregistered script: ${scriptId}`);
      return true;
    } catch (error) {
      console.error(`[ScriptRegistry] Failed to unregister script ${scriptId}:`, error);
      return false;
    }
  }

  /**
   * Get script by ID
   */
  public getScript(scriptId: string): ScriptDefinition | undefined {
    return this.registry.scripts.get(scriptId);
  }

  /**
   * Get all scripts
   */
  public getAllScripts(): ScriptDefinition[] {
    return Array.from(this.registry.scripts.values());
  }

  /**
   * Get scripts by category
   */
  public getScriptsByCategory(category: ScriptCategory): ScriptDefinition[] {
    const scriptIds = this.registry.categories.get(category) || [];
    return scriptIds
      .map(id => this.registry.scripts.get(id))
      .filter((script): script is ScriptDefinition => script !== undefined);
  }

  /**
   * Get default scripts
   */
  public getDefaultScripts(): ScriptDefinition[] {
    const defaultScriptIds = [
      'email-extractor-v1',
      'domain-parser-v1',
      'tech-stack-analyzer-v1',
      'contact-harvester-v1'
    ];
    
    return defaultScriptIds
      .map(id => this.registry.scripts.get(id))
      .filter((script): script is ScriptDefinition => script !== undefined);
  }

  /**
   * Search scripts by name or description
   */
  public searchScripts(query: string): ScriptDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllScripts().filter(script => 
      script.metadata.name.toLowerCase().includes(lowerQuery) ||
      script.metadata.description.toLowerCase().includes(lowerQuery) ||
      script.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get script dependencies
   */
  public getScriptDependencies(scriptId: string): string[] {
    return this.registry.dependencies.get(scriptId) || [];
  }

  /**
   * Find scripts that depend on the given script
   */
  public findDependentScripts(scriptId: string): string[] {
    const dependents: string[] = [];
    
    for (const [id, dependencies] of this.registry.dependencies) {
      if (dependencies.includes(scriptId)) {
        dependents.push(id);
      }
    }
    
    return dependents;
  }

  /**
   * Get registry metadata
   */
  public getRegistryMetadata(): RegistryMetadata {
    return { ...this.registry.metadata };
  }

  /**
   * Get registry statistics
   */
  public getRegistryStatistics(): RegistryStatistics {
    return { ...this.registry.metadata.statistics };
  }

  /**
   * Get default script configuration
   */
  public getDefaultScriptConfig(scriptType: DefaultScriptType): Record<string, unknown> {
    return { ...DEFAULT_SCRIPT_CONFIGS[scriptType] };
  }

  /**
   * Update script execution statistics
   */
  public updateExecutionStatistics(
    scriptId: string,
    success: boolean,
    executionTime: number
  ): void {
    const stats = this.registry.metadata.statistics;
    
    // Update execution count
    stats.executionCount[scriptId] = (stats.executionCount[scriptId] || 0) + 1;
    
    // Update success rate
    const currentSuccessRate = stats.successRate[scriptId] || 1;
    const currentCount = stats.executionCount[scriptId];
    const newSuccessRate = success 
      ? (currentSuccessRate * (currentCount - 1) + 1) / currentCount
      : (currentSuccessRate * (currentCount - 1)) / currentCount;
    stats.successRate[scriptId] = newSuccessRate;
    
    // Update average execution time
    const currentAvgTime = stats.averageExecutionTime[scriptId] || 0;
    const newAvgTime = (currentAvgTime * (currentCount - 1) + executionTime) / currentCount;
    stats.averageExecutionTime[scriptId] = newAvgTime;
    
    // Update error rates
    if (!success) {
      stats.errorRates[scriptId] = (stats.errorRates[scriptId] || 0) + 1;
    }
    
    // Update popularity score (combination of usage and success)
    const usageScore = Math.log(currentCount + 1) * 10;
    const successScore = newSuccessRate * 50;
    const recencyScore = 20; // Recent executions get bonus
    stats.popularityScore[scriptId] = usageScore + successScore + recencyScore;
  }

  /**
   * Get most popular scripts
   */
  public getMostPopularScripts(limit: number = 5): ScriptDefinition[] {
    const scripts = this.getAllScripts();
    const stats = this.registry.metadata.statistics;
    
    return scripts
      .sort((a, b) => 
        (stats.popularityScore[b.metadata.id] || 0) - 
        (stats.popularityScore[a.metadata.id] || 0)
      )
      .slice(0, limit);
  }

  /**
   * Export registry configuration
   */
  public exportRegistry(): object {
    return {
      version: this.registry.metadata.version,
      exported: new Date().toISOString(),
      scripts: this.getAllScripts().map(script => ({
        id: script.metadata.id,
        name: script.metadata.name,
        version: script.metadata.version,
        category: script.metadata.category,
        description: script.metadata.description,
        configuration: script.configuration
      })),
      statistics: this.registry.metadata.statistics
    };
  }

  // ===== PRIVATE METHODS =====

  private validateScript(script: ScriptDefinition): void {
    if (!script.metadata?.id) {
      throw new Error('Script must have a valid ID');
    }
    
    if (!script.metadata?.name) {
      throw new Error('Script must have a name');
    }
    
    if (!script.metadata?.version) {
      throw new Error('Script must have a version');
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

    // Validate dependencies exist
    for (const dep of script.metadata.dependencies) {
      if (!this.registry.scripts.has(dep)) {
        console.warn(`[ScriptRegistry] Dependency ${dep} not found for script ${script.metadata.id}`);
      }
    }
  }

  private updateCategoriesIndex(script: ScriptDefinition): void {
    const category = script.metadata.category;
    if (!this.registry.categories.has(category)) {
      this.registry.categories.set(category, []);
    }
    
    const scriptIds = this.registry.categories.get(category)!;
    if (!scriptIds.includes(script.metadata.id)) {
      scriptIds.push(script.metadata.id);
    }
  }

  private cleanupCategoriesIndex(script: ScriptDefinition): void {
    const category = script.metadata.category;
    const scriptIds = this.registry.categories.get(category);
    
    if (scriptIds) {
      const index = scriptIds.indexOf(script.metadata.id);
      if (index > -1) {
        scriptIds.splice(index, 1);
      }
      
      // Remove empty categories
      if (scriptIds.length === 0) {
        this.registry.categories.delete(category);
      }
    }
  }

  private updateDependenciesIndex(script: ScriptDefinition): void {
    this.registry.dependencies.set(script.metadata.id, [...script.metadata.dependencies]);
  }

  private cleanupDependenciesIndex(script: ScriptDefinition): void {
    this.registry.dependencies.delete(script.metadata.id);
  }

  private updateRegistryMetadata(): void {
    this.registry.metadata.lastUpdated = new Date();
    this.registry.metadata.totalScripts = this.registry.scripts.size;
    this.registry.metadata.activeScripts = this.getAllScripts().filter(
      script => script.metadata.created.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
    ).length;
  }

  private createInitialMetadata(): RegistryMetadata {
    return {
      version: '1.0.0',
      lastUpdated: new Date(),
      totalScripts: 0,
      activeScripts: 0,
      statistics: {
        executionCount: {},
        successRate: {},
        averageExecutionTime: {},
        errorRates: {},
        popularityScore: {}
      }
    };
  }

  /**
   * Reset registry (for testing purposes)
   */
  public reset(): void {
    this.registry.scripts.clear();
    this.registry.categories.clear();
    this.registry.dependencies.clear();
    this.registry.metadata = this.createInitialMetadata();
    console.log('[ScriptRegistry] Registry reset');
  }
}
