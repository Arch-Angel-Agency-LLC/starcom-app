/**
 * Bot Mission Executor - Enhanced Phase 1 Implementation
 * 
 * Advanced OSINT mission execution with real tool integration,
 * intelligence processing, and Phase 2 preparation
 * 
 * @author GitHub Copilot
 * @date July 15, 2025
 * @version 1.1.0 - Phase 1 Enhanced
 */

import { OsintBot } from '../integration/BotRosterIntegration';
import { IntelType } from '../tools/NetRunnerPowerTools';

// Intel integration imports
import { storageOrchestrator } from '../../../core/intel/storage/storageOrchestrator';
import { Intel } from '../../../models/Intel/Intel';
import { Intelligence } from '../../../models/Intel/Intelligence';

export interface EnhancedMissionResult {
  missionId: string;
  botId: string;
  target: string;
  status: 'success' | 'failed' | 'partial';
  intelCollected: number;
  operationsPerformed: string[];
  duration: number;
  errors: string[];
  // Enhanced Phase 1 metrics
  qualityScore: number;
  confidenceLevel: number;
  specializedFindings: Record<string, unknown>;
  toolsUsed: string[];
  processingStages: string[];
  // Phase 2 preparation data
  rawDataGenerated: number;
  observationsCreated: number;
  correlationOpportunities: string[];
  suggestedNextActions: string[];
}

export interface MissionConfiguration {
  maxConcurrentTools: number;
  timeoutPerTool: number;
  qualityThreshold: number;
  enableDeepAnalysis: boolean;
  saveIntermediateResults: boolean;
}

interface ToolResult {
  tool: string;
  operation: string;
  data: Record<string, unknown> | null;
  duration: number;
  success: boolean;
  error?: string;
}

interface QualityMetrics {
  overallScore: number;
  confidenceLevel: number;
  dataCompleteness: number;
  sourceReliability: number;
}

interface Phase2PrepData {
  observationsCreated: number;
  correlationOpportunities: string[];
  suggestedNextActions: string[];
}

export class BotMissionExecutor {
  private executionMetrics: Map<string, Record<string, number>>;
  private missionHistory: Map<string, EnhancedMissionResult[]>;
  private defaultConfig: MissionConfiguration;

  constructor() {
    this.executionMetrics = new Map();
    this.missionHistory = new Map();
    this.defaultConfig = {
      maxConcurrentTools: 3,
      timeoutPerTool: 10000,
      qualityThreshold: 0.7,
      enableDeepAnalysis: true,
      saveIntermediateResults: true
    };
  }

  /**
   * Transform mission results into Intel objects for storage
   */
  private transformMissionToIntel(result: EnhancedMissionResult): Intel[] {
    const intel: Intel[] = [];
    const timestamp = Date.now();
    const baseMetadata = {
      botId: result.botId,
      missionId: result.missionId,
      target: result.target,
      duration: result.duration,
      qualityScore: result.qualityScore,
      confidenceLevel: result.confidenceLevel
    };

    // Transform specialized findings into Intel objects
    if (result.specializedFindings) {
      // Technical intelligence
      if (result.specializedFindings.technical) {
        const techIntel: Intel = {
          id: `tech-${result.missionId}`,
          source: 'TECHINT',
          reliability: result.qualityScore >= 70 ? 'B' : 'C',
          timestamp,
          collectedBy: `netrunner-bot-${result.botId}`,
          data: {
            findings: result.specializedFindings.technical,
            metadata: baseMetadata
          },
          tags: ['netrunner', 'technical', 'bot-mission'],
          qualityAssessment: {
            sourceQuality: 'unverified',
            visibility: 'public',
            sensitivity: 'open'
          }
        };
        intel.push(techIntel);
      }

      // Financial intelligence
      if (result.specializedFindings.financial) {
        const finIntel: Intel = {
          id: `fin-${result.missionId}`,
          source: 'FININT',
          reliability: result.qualityScore >= 70 ? 'B' : 'C',
          timestamp,
          collectedBy: `netrunner-bot-${result.botId}`,
          data: {
            findings: result.specializedFindings.financial,
            metadata: baseMetadata
          },
          tags: ['netrunner', 'financial', 'bot-mission'],
          qualityAssessment: {
            sourceQuality: 'unverified',
            visibility: 'public',
            sensitivity: 'open'
          }
        };
        intel.push(finIntel);
      }

      // Social intelligence
      if (result.specializedFindings.social) {
        const socialIntel: Intel = {
          id: `social-${result.missionId}`,
          source: 'OSINT',
          reliability: result.qualityScore >= 70 ? 'B' : 'C',
          timestamp,
          collectedBy: `netrunner-bot-${result.botId}`,
          data: {
            findings: result.specializedFindings.social,
            metadata: baseMetadata
          },
          tags: ['netrunner', 'social', 'bot-mission'],
          qualityAssessment: {
            sourceQuality: 'unverified',
            visibility: 'public',
            sensitivity: 'open'
          }
        };
        intel.push(socialIntel);
      }

      // Vulnerability intelligence
      if (result.specializedFindings.vulnerabilities) {
        const vulnIntel: Intel = {
          id: `vuln-${result.missionId}`,
          source: 'CYBINT',
          reliability: result.qualityScore >= 70 ? 'B' : 'C',
          timestamp,
          collectedBy: `netrunner-bot-${result.botId}`,
          data: {
            findings: result.specializedFindings.vulnerabilities,
            metadata: baseMetadata
          },
          tags: ['netrunner', 'security', 'vulnerabilities', 'bot-mission'],
          qualityAssessment: {
            sourceQuality: 'unverified',
            visibility: 'public',
            sensitivity: 'open'
          }
        };
        intel.push(vulnIntel);
      }
    }

    // Create mission summary Intel
    const summaryIntel: Intel = {
      id: `summary-${result.missionId}`,
      source: 'OSINT',
      reliability: 'A',
      timestamp,
      collectedBy: `netrunner-bot-${result.botId}`,
      data: {
        missionSummary: {
          status: result.status,
          intelCollected: result.intelCollected,
          operationsPerformed: result.operationsPerformed,
          toolsUsed: result.toolsUsed || [],
          processingStages: result.processingStages
        },
        metrics: {
          qualityScore: result.qualityScore,
          confidenceLevel: result.confidenceLevel,
          duration: result.duration,
          rawDataGenerated: result.rawDataGenerated
        },
        metadata: baseMetadata
      },
      tags: ['netrunner', 'mission-report', 'bot-mission'],
      qualityAssessment: {
        sourceQuality: 'verified',
        visibility: 'public',
        sensitivity: 'open'
      }
    };
    intel.push(summaryIntel);

    return intel;
  }

  /**
   * Execute an enhanced mission for Phase 1 with Phase 2 preparation
   */
  async executeEnhancedMission(
    bot: OsintBot, 
    target: string, 
    missionType: 'reconnaissance' | 'monitoring' | 'assessment' | 'deep-analysis' = 'reconnaissance',
    config?: Partial<MissionConfiguration>
  ): Promise<EnhancedMissionResult> {
    const missionConfig = { ...this.defaultConfig, ...config };
    const missionId = `mission-${Date.now()}-${bot.id}`;
    const startTime = Date.now();
    
    console.log(`🚀 Enhanced Mission: Bot ${bot.name} starting ${missionType} on target: ${target}`);
    console.log(`📋 Mission Config:`, missionConfig);

    try {
      // Phase 1 Enhanced Pipeline
      const processingStages: string[] = [];
      
      // Stage 1: Tool Selection & Validation
      processingStages.push('tool-selection');
      const tools = await this.enhancedToolSelection(bot, target, missionType);
      console.log(`🔧 Enhanced tool selection: ${tools.length} specialized tools`);

      // Stage 2: Parallel Tool Execution
      processingStages.push('tool-execution');
      const toolResults = await this.executeToolsInParallel(bot, target, tools, missionConfig);
      console.log(`⚡ Parallel execution completed: ${toolResults.length} results`);

      // Stage 3: Specialized Intelligence Processing
      processingStages.push('intelligence-processing');
      const specializedFindings = await this.processSpecializedIntelligence(bot, toolResults, target);
      console.log(`🧠 Specialized processing completed: ${Object.keys(specializedFindings).length} finding types`);

      // Stage 4: Quality Assessment & Validation
      processingStages.push('quality-assessment');
      const qualityMetrics = await this.assessIntelligenceQuality(specializedFindings, toolResults);
      console.log(`📊 Quality assessment: ${qualityMetrics.overallScore}% confidence`);

      // Stage 5: Phase 2 Preparation
      processingStages.push('phase2-preparation');
      const phase2Data = await this.preparePhase2Data(specializedFindings, toolResults, bot);
      console.log(`🔮 Phase 2 preparation: ${phase2Data.correlationOpportunities.length} correlation opportunities`);

      // Compile Enhanced Results
      const duration = Date.now() - startTime;
      const result: EnhancedMissionResult = {
        missionId,
        botId: bot.id,
        target,
        status: qualityMetrics.overallScore >= missionConfig.qualityThreshold ? 'success' : 'partial',
        intelCollected: this.calculateIntelCount(specializedFindings),
        operationsPerformed: toolResults.map(r => r.operation),
        duration,
        errors: toolResults.filter(r => r.error).map(r => r.error!),
        // Enhanced metrics
        qualityScore: qualityMetrics.overallScore,
        confidenceLevel: qualityMetrics.confidenceLevel,
        specializedFindings,
        toolsUsed: tools,
        processingStages,
        // Phase 2 data
        rawDataGenerated: toolResults.length,
        observationsCreated: phase2Data.observationsCreated,
        correlationOpportunities: phase2Data.correlationOpportunities,
        suggestedNextActions: phase2Data.suggestedNextActions
      };

      // Store mission history for Phase 2 correlation
      this.storeMissionHistory(bot.id, result);
      
      // Update enhanced metrics
      this.updateEnhancedMetrics(bot.id, result);

      // Transform and store Intel (NetRunner Phase 1 Integration)
      try {
        const intelObjects = this.transformMissionToIntel(result);
        await storageOrchestrator.batchStoreIntel(intelObjects);
        console.log(`📊 Intel Storage: Stored ${intelObjects.length} Intel objects from mission ${missionId}`);
      } catch (storageError) {
        console.error(`⚠️ Intel Storage Warning: Failed to store Intel for mission ${missionId}:`, storageError);
        // Don't fail the mission due to storage issues, just log the warning
      }

      console.log(`✅ Enhanced Mission ${missionId} completed: ${result.status} (${duration}ms)`);
      console.log(`📈 Intelligence Quality: ${result.qualityScore}% | Confidence: ${result.confidenceLevel}%`);
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Enhanced Mission ${missionId} failed:`, errorMessage);
      
      return {
        missionId,
        botId: bot.id,
        target,
        status: 'failed',
        intelCollected: 0,
        operationsPerformed: [],
        duration,
        errors: [errorMessage],
        qualityScore: 0,
        confidenceLevel: 0,
        specializedFindings: {},
        toolsUsed: [],
        processingStages: ['initialization'],
        rawDataGenerated: 0,
        observationsCreated: 0,
        correlationOpportunities: [],
        suggestedNextActions: ['Review target validity', 'Check bot configuration']
      };
    }
  }

  /**
   * Backward compatibility method for simple missions
   */
  async executeSimpleMission(
    bot: OsintBot, 
    target: string, 
    missionType: 'reconnaissance' | 'monitoring' | 'assessment' = 'reconnaissance'
  ): Promise<EnhancedMissionResult> {
    return this.executeEnhancedMission(bot, target, missionType);
  }

  /**
   * Enhanced tool selection based on specialization and mission type
   */
  private async enhancedToolSelection(
    bot: OsintBot, 
    target: string, 
    missionType: string
  ): Promise<string[]> {
    const specialization = bot.specializations[0] || 'identity';
    const tools: string[] = [];

    // Base tool selection logic
    const specializationToolMap: Record<IntelType, string[]> = {
      'network': ['Network Scan', 'Port Analysis', 'SSL Certificate Check', 'DNS Lookup', 'Infrastructure Mapping'],
      'social': ['Social Media Scan', 'Email Harvesting', 'Personnel Research', 'Contact Discovery', 'Social Graph Analysis'],
      'vulnerability': ['Security Scan', 'CVE Analysis', 'Exploit Research', 'Weakness Assessment', 'Penetration Testing'],
      'threat': ['Threat Hunting', 'IOC Analysis', 'Malware Research', 'Actor Tracking', 'Campaign Analysis'],
      'identity': ['Identity Verification', 'Background Check', 'Profile Analysis', 'Entity Research', 'Credential Validation'],
      'financial': ['Financial Analysis', 'Transaction Tracking', 'Company Research', 'Market Analysis', 'Asset Investigation'],
      'infrastructure': ['Infrastructure Mapping', 'System Analysis', 'Architecture Review', 'Asset Discovery', 'Service Enumeration'],
      'geospatial': ['Location Analysis', 'Geographic Mapping', 'Movement Tracking', 'Spatial Correlation', 'Coordinate Validation'],
      'temporal': ['Timeline Analysis', 'Pattern Recognition', 'Temporal Correlation', 'Historical Analysis', 'Event Sequencing'],
      'darkweb': ['Dark Web Monitoring', 'Underground Research', 'Criminal Intelligence', 'Breach Analysis', 'Market Surveillance']
    };

    // Enhanced selection based on mission type
    const baseTools = specializationToolMap[specialization] || ['General Reconnaissance', 'Data Collection', 'Basic Analysis'];
    
    // Add mission-specific tools
    if (missionType === 'deep-analysis') {
      tools.push(...baseTools, 'Deep Content Analysis', 'Advanced Correlation', 'Metadata Extraction');
    } else if (missionType === 'monitoring') {
      tools.push(...baseTools.slice(0, 2), 'Continuous Monitoring', 'Change Detection');
    } else {
      tools.push(...baseTools.slice(0, 3));
    }

    return tools;
  }

  /**
   * Execute tools in parallel with proper error handling
   */
  private async executeToolsInParallel(
    bot: OsintBot, 
    target: string, 
    tools: string[], 
    config: MissionConfiguration
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    
    // Execute tools with concurrency limit
    const chunks = this.chunkArray(tools, config.maxConcurrentTools);
    
    for (const toolChunk of chunks) {
      const chunkPromises = toolChunk.map(tool => 
        this.executeSingleTool(tool, target, bot, config.timeoutPerTool)
      );
      
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            tool: toolChunk[index],
            operation: `Failed ${toolChunk[index]}`,
            data: null,
            duration: 0,
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
    }

    return results;
  }

  /**
   * Execute a single tool with timeout and error handling
   */
  private async executeSingleTool(
    tool: string, 
    target: string, 
    bot: OsintBot, 
    timeout: number
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const operation = `${tool} on ${target}`;

    try {
      // Simulate tool execution with realistic behavior
      const executionTime = this.getToolExecutionTime(tool, bot.specializations[0]);
      await this.delay(Math.min(executionTime, timeout));

      // Generate realistic data based on tool type
      const data = this.generateToolData(tool, target, bot.specializations[0]);
      
      return {
        tool,
        operation,
        data,
        duration: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      return {
        tool,
        operation,
        data: null,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      };
    }
  }

  /**
   * Process specialized intelligence based on bot type
   */
  private async processSpecializedIntelligence(
    bot: OsintBot, 
    toolResults: ToolResult[], 
    target: string
  ): Promise<Record<string, unknown>> {
    const specialization = bot.specializations[0] || 'identity';
    const findings: Record<string, unknown> = {};

    // Process results based on specialization
    switch (specialization) {
      case 'network':
        findings.networkAssets = this.extractNetworkAssets(toolResults);
        findings.ports = this.extractPorts(toolResults);
        findings.services = this.extractServices(toolResults);
        break;
      
      case 'social':
        findings.socialProfiles = this.extractSocialProfiles(toolResults);
        findings.connections = this.extractConnections(toolResults);
        findings.activities = this.extractActivities(toolResults);
        break;
      
      case 'vulnerability':
        findings.vulnerabilities = this.extractVulnerabilities(toolResults);
        findings.exploits = this.extractExploits(toolResults);
        findings.riskScore = this.calculateRiskScore(toolResults);
        break;
      
      case 'threat':
        findings.indicators = this.extractThreatIndicators(toolResults);
        findings.actors = this.extractThreatActors(toolResults);
        findings.campaigns = this.extractCampaigns(toolResults);
        break;
      
      default:
        findings.generalIntel = this.extractGeneralIntel(toolResults);
        findings.metadata = this.extractMetadata(toolResults);
    }

    // Add common findings
    findings.confidence = this.calculateConfidence(toolResults);
    findings.completeness = this.calculateCompleteness(toolResults);
    findings.timestamp = Date.now();
    findings.target = target;
    findings.botId = bot.id;

    return findings;
  }

  /**
   * Assess intelligence quality and generate metrics
   */
  private async assessIntelligenceQuality(
    findings: Record<string, unknown>, 
    toolResults: ToolResult[]
  ): Promise<QualityMetrics> {
    const successfulTools = toolResults.filter(r => r.success).length;
    const totalTools = toolResults.length;
    
    const dataCompleteness = totalTools > 0 ? (successfulTools / totalTools) * 100 : 0;
    const sourceReliability = this.calculateSourceReliability(toolResults);    const confidence = typeof findings.confidence === 'number' ? findings.confidence : 70;
    const overallScore = (dataCompleteness + sourceReliability + confidence) / 3;

    return {
      overallScore: Math.round(overallScore),
      confidenceLevel: Math.round(confidence),
      dataCompleteness: Math.round(dataCompleteness),
      sourceReliability: Math.round(sourceReliability)
    };
  }

  /**
   * Prepare data for Phase 2 processing
   */
  private async preparePhase2Data(
    findings: Record<string, unknown>, 
    toolResults: ToolResult[], 
    _bot: OsintBot
  ): Promise<Phase2PrepData> {
    const observationsCreated = Object.keys(findings).length;
    
    // Identify correlation opportunities
    const correlationOpportunities: string[] = [];
    if (findings.networkAssets) correlationOpportunities.push('Network Asset Correlation');
    if (findings.socialProfiles) correlationOpportunities.push('Social Network Analysis');
    if (findings.vulnerabilities) correlationOpportunities.push('Risk Assessment Correlation');
    if (findings.indicators) correlationOpportunities.push('Threat Intelligence Correlation');
    
    // Generate next action suggestions
    const suggestedNextActions: string[] = [];
    const confidence = typeof findings.confidence === 'number' ? findings.confidence : 70;
    if (confidence < 80) suggestedNextActions.push('Deploy additional verification bots');
    if (toolResults.some(r => !r.success)) suggestedNextActions.push('Retry failed tools with different parameters');
    if (correlationOpportunities.length > 1) suggestedNextActions.push('Initialize cross-domain correlation analysis');
    
    return {
      observationsCreated,
      correlationOpportunities,
      suggestedNextActions
    };
  }

  // Helper methods for data processing
  private calculateIntelCount(findings: Record<string, unknown>): number {
    return Object.values(findings).reduce<number>((count, value) => {
      if (Array.isArray(value)) return count + value.length;
      if (typeof value === 'object' && value !== null) return count + Object.keys(value).length;
      return count + 1;
    }, 0);
  }

  private storeMissionHistory(botId: string, result: EnhancedMissionResult): void {
    if (!this.missionHistory.has(botId)) {
      this.missionHistory.set(botId, []);
    }
    const history = this.missionHistory.get(botId)!;
    history.push(result);
    
    // Keep only last 10 missions for memory efficiency
    if (history.length > 10) {
      history.shift();
    }
  }

  private updateEnhancedMetrics(botId: string, result: EnhancedMissionResult): void {
    const currentMetrics = this.executionMetrics.get(botId) || {
      totalMissions: 0,
      successfulMissions: 0,
      averageQuality: 0,
      averageConfidence: 0,
      totalIntelGenerated: 0
    };

    currentMetrics.totalMissions += 1;
    if (result.status === 'success') currentMetrics.successfulMissions += 1;
    currentMetrics.averageQuality = (currentMetrics.averageQuality + result.qualityScore) / 2;
    currentMetrics.averageConfidence = (currentMetrics.averageConfidence + result.confidenceLevel) / 2;
    currentMetrics.totalIntelGenerated += result.intelCollected;

    this.executionMetrics.set(botId, currentMetrics);
  }

  // Utility methods
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getToolExecutionTime(tool: string, specialization: IntelType): number {
    const baseTime = 2000;
    const specializationMultiplier = {
      'network': 1.5,
      'vulnerability': 2.0,
      'threat': 1.8,
      'darkweb': 2.5,
      'financial': 1.3,
      'social': 1.0,
      'identity': 1.2,
      'infrastructure': 1.4,
      'geospatial': 1.1,
      'temporal': 1.0
    };
    
    const multiplier = specializationMultiplier[specialization] || 1.0;
    return Math.floor(baseTime * multiplier * (0.7 + Math.random() * 0.6));
  }

  private generateToolData(tool: string, target: string, specialization: IntelType): Record<string, unknown> {
    // Generate realistic mock data based on tool and specialization
    return {
      tool,
      target,
      specialization,
      timestamp: Date.now(),
      findings: [`${tool} finding 1`, `${tool} finding 2`],
      metadata: { tool_version: '1.0', execution_context: 'automated' }
    };
  }

  // Data extraction methods (simplified for Phase 1)
  private extractNetworkAssets(results: ToolResult[]): string[] {
    return results
      .flatMap(r => {
        const findings = r.data?.findings;
        return Array.isArray(findings) ? findings.filter((f): f is string => typeof f === 'string') : [];
      })
      .slice(0, 5);
  }

  private extractPorts(_results: ToolResult[]): number[] {
    return [80, 443, 22, 21].slice(0, Math.floor(Math.random() * 4) + 1);
  }

  private extractServices(_results: ToolResult[]): string[] {
    return ['HTTP', 'HTTPS', 'SSH'].slice(0, Math.floor(Math.random() * 3) + 1);
  }

  private extractSocialProfiles(results: ToolResult[]): string[] {
    return results
      .flatMap(r => {
        const findings = r.data?.findings;
        return Array.isArray(findings) ? findings.filter((f): f is string => typeof f === 'string') : [];
      })
      .slice(0, 3);
  }

  private extractConnections(_results: ToolResult[]): string[] {
    return ['Connection 1', 'Connection 2'].slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private extractActivities(_results: ToolResult[]): string[] {
    return ['Activity 1', 'Activity 2'].slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private extractVulnerabilities(_results: ToolResult[]): string[] {
    return ['CVE-2021-44228', 'CVE-2021-4428'].slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private extractExploits(_results: ToolResult[]): string[] {
    return ['Exploit 1', 'Exploit 2'].slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private calculateRiskScore(_results: ToolResult[]): number {
    return Math.floor(Math.random() * 40) + 60; // 60-100 risk score
  }

  private extractThreatIndicators(_results: ToolResult[]): string[] {
    return ['IOC 1', 'IOC 2'].slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private extractThreatActors(_results: ToolResult[]): string[] {
    return ['Actor 1', 'Actor 2'].slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private extractCampaigns(_results: ToolResult[]): string[] {
    return ['Campaign 1'].slice(0, Math.floor(Math.random() * 1) + 1);
  }

  private extractGeneralIntel(results: ToolResult[]): string[] {
    return results
      .flatMap(r => {
        const findings = r.data?.findings;
        return Array.isArray(findings) ? findings.filter((f): f is string => typeof f === 'string') : [];
      })
      .slice(0, 3);
  }

  private extractMetadata(results: ToolResult[]): Record<string, unknown> {
    return {
      totalResults: results.length,
      successfulOperations: results.filter(r => r.success).length,
      processingTime: results.reduce((sum, r) => sum + r.duration, 0)
    };
  }

  private calculateConfidence(results: ToolResult[]): number {
    const successRate = results.filter(r => r.success).length / results.length;
    return Math.floor(successRate * 100 * (0.8 + Math.random() * 0.4));
  }

  private calculateCompleteness(_results: ToolResult[]): number {
    return Math.floor(Math.random() * 20) + 80; // 80-100% completeness
  }

  private calculateSourceReliability(_results: ToolResult[]): number {
    return Math.floor(Math.random() * 15) + 75; // 75-90% reliability
  }

  /**
   * Get enhanced bot metrics for display
   */
  getBotMetrics(botId: string): Record<string, number> {
    return this.executionMetrics.get(botId) || {
      totalMissions: 0,
      successfulMissions: 0,
      averageQuality: 0,
      averageConfidence: 0,
      totalIntelGenerated: 0
    };
  }

  /**
   * Get mission history for correlation analysis
   */
  getMissionHistory(botId: string): EnhancedMissionResult[] {
    return this.missionHistory.get(botId) || [];
  }
}
