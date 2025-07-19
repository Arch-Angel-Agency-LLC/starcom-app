/**
 * NetRunner Bottom Bar - Bot Roster
 * 
 * Horizontal scrolling bot roster with autonomous bots that can be controlled by AI Agent.
 * Supports default Starcom bots and user-created custom bots.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card
} from '@mui/material';
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Pause,
  Settings,
  Trash2,
  Bot,
  Globe,
  Search,
  Database,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Import real bot services
import { OsintBot, BotCapability, AutonomyLevel } from '../../integration/BotRosterIntegration';
import { IntelType } from '../../tools/NetRunnerPowerTools';
import { WorkflowEngine } from '../../integration/WorkflowEngine';
import { netRunnerPowerTools } from '../../tools/NetRunnerPowerTools';

interface NetRunnerBottomBarProps {
  open: boolean;
  height: number;
  onToggle: () => void;
}

interface BotInstance {
  id: string;
  name: string;
  type: 'default' | 'custom';
  category: string;
  status: 'active' | 'paused' | 'idle' | 'error';
  icon: React.ComponentType<{ size?: number | string; color?: string }>;
  description: string;
  tasksCompleted: number;
  uptime: string;
  autonomyLevel: number; // 0-100
  aiControlled: boolean;
  capabilities: string[];
  specialization?: string;
  currentActivity?: string;
  currentOperation?: NodeJS.Timeout | null;
  metrics?: {
    tasksCompleted: number;
    lastActive: string;
    operationsPerformed?: number;
    lastOperation?: string;
    successRate?: number;
  };
}

// Service layer to bridge OsintBot to BotInstance
class BotRosterService {
  private workflowEngine: WorkflowEngine;
  private registeredBots: Map<string, OsintBot> = new Map();
  // Runtime state tracking for active bots
  private botOperations: Map<string, NodeJS.Timeout> = new Map();
  private botActivities: Map<string, string> = new Map();

  constructor() {
    this.workflowEngine = new WorkflowEngine([], netRunnerPowerTools);
    this.initializeDefaultBots();
  }

  private initializeDefaultBots() {
    // Create real OSINT bots that map to the original mock data functionality
    const defaultBots: OsintBot[] = [
      {
        id: 'spider-01',
        name: 'WebSpider Alpha',
        description: 'Advanced web crawling and data extraction bot',
        avatar: '🕷️',
        capabilities: ['collection', 'analysis'],
        compatibleTools: netRunnerPowerTools.filter(t => t.category === 'discovery').map(t => t.id),
        specializations: ['network', 'infrastructure'],
        autonomyLevel: 'semi-autonomous',
        scope: 'specialized',
        author: 'Starcom Systems',
        version: '1.0.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        performance: {
          accuracy: 0.85,
          speed: 120,
          successRate: 0.89,
          intelQualityScore: 0.82,
          totalOperations: 1247,
          totalIntelGenerated: 892,
          lastEvaluation: new Date().toISOString()
        },
        status: 'active',
        configuration: {
          maxConcurrentOperations: 5,
          maxDailyOperations: 1000,
          rateLimiting: true,
          proxyRotation: true,
          obfuscation: false,
          loggingLevel: 'standard',
          notifyOnCompletion: true,
          saveResultsAutomatically: true,
          customParameters: {}
        }
      },
      {
        id: 'recon-02',
        name: 'ReconBot Beta',
        description: 'OSINT reconnaissance and intelligence gathering specialist',
        avatar: '🔍',
        capabilities: ['collection', 'analysis', 'correlation'],
        compatibleTools: netRunnerPowerTools.filter(t => t.name.includes('Shodan') || t.name.includes('Harvester')).map(t => t.id),
        specializations: ['identity', 'network', 'infrastructure'],
        autonomyLevel: 'autonomous',
        scope: 'general',
        author: 'Starcom Systems',
        version: '2.1.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        performance: {
          accuracy: 0.92,
          speed: 95,
          successRate: 0.94,
          intelQualityScore: 0.88,
          totalOperations: 892,
          totalIntelGenerated: 1156,
          lastEvaluation: new Date().toISOString()
        },
        status: 'active',
        configuration: {
          maxConcurrentOperations: 3,
          maxDailyOperations: 500,
          rateLimiting: true,
          proxyRotation: true,
          obfuscation: true,
          loggingLevel: 'verbose',
          notifyOnCompletion: true,
          saveResultsAutomatically: true,
          customParameters: {}
        }
      },
      {
        id: 'data-04',
        name: 'DataMiner Delta',
        description: 'Big data processing and correlation engine',
        avatar: '⛏️',
        capabilities: ['analysis', 'correlation', 'reporting'],
        compatibleTools: netRunnerPowerTools.filter(t => t.category === 'analysis').map(t => t.id),
        specializations: ['financial', 'social', 'temporal'],
        autonomyLevel: 'semi-autonomous',
        scope: 'specialized',
        author: 'Starcom Systems',
        version: '1.5.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        performance: {
          accuracy: 0.67,
          speed: 45,
          successRate: 0.78,
          intelQualityScore: 0.84,
          totalOperations: 2341,
          totalIntelGenerated: 1876,
          lastEvaluation: new Date().toISOString()
        },
        status: 'active',
        configuration: {
          maxConcurrentOperations: 10,
          maxDailyOperations: 2000,
          rateLimiting: false,
          proxyRotation: false,
          obfuscation: false,
          loggingLevel: 'minimal',
          notifyOnCompletion: false,
          saveResultsAutomatically: true,
          customParameters: {}
        }
      }
    ];

    defaultBots.forEach(bot => this.registeredBots.set(bot.id, bot));
  }

  getBots(): BotInstance[] {
    return Array.from(this.registeredBots.values()).map(bot => this.mapOsintBotToBotInstance(bot));
  }

  private mapOsintBotToBotInstance(osintBot: OsintBot): BotInstance {
    // Map OsintBot to BotInstance format for UI
    const getIconForBot = (name: string) => {
      if (name.includes('Spider')) return Globe;
      if (name.includes('Recon')) return Search;
      if (name.includes('DataMiner')) return Database;
      return Bot;
    };

    const getCategoryFromSpecializations = (specializations: string[]) => {
      if (specializations.includes('network')) return 'crawler';
      if (specializations.includes('identity')) return 'reconnaissance';
      if (specializations.includes('financial')) return 'data';
      return 'general';
    };

    const getUptimeString = (created: string) => {
      const hours = Math.floor((Date.now() - new Date(created).getTime()) / (1000 * 60 * 60));
      return `${hours}h ${Math.floor(Math.random() * 60)}m`;
    };

    return {
      id: osintBot.id,
      name: osintBot.name,
      type: osintBot.author === 'Starcom Systems' ? 'default' : 'custom',
      category: getCategoryFromSpecializations(osintBot.specializations),
      status: osintBot.status === 'active' ? 'active' : 
              osintBot.status === 'inactive' ? 'idle' : 'error',
      icon: getIconForBot(osintBot.name),
      description: osintBot.description,
      tasksCompleted: osintBot.performance.totalOperations,
      uptime: getUptimeString(osintBot.created),
      autonomyLevel: Math.floor(osintBot.performance.successRate * 100),
      aiControlled: osintBot.autonomyLevel === 'autonomous',
      capabilities: osintBot.capabilities.map(cap => 
        cap.charAt(0).toUpperCase() + cap.slice(1).replace('-', ' ')
      )
    };
  }

  createBot(name: string, category: string, description: string): string {
    // Enhanced specialization logic based on category/description keywords
    const specialization = this.determineSpecialization(category, description, name);
    const capabilities = this.getCapabilitiesForSpecialization(specialization);
    const compatibleTools = this.getToolsForSpecialization(specialization);
    const autonomyLevel = this.getAutonomyForSpecialization(specialization);

    const newBot: OsintBot = {
      id: `custom-${Date.now()}`,
      name,
      description: description || `Custom ${category} bot`,
      avatar: this.getAvatarForSpecialization(specialization),
      capabilities,
      compatibleTools,
      specializations: [specialization],
      autonomyLevel,
      scope: specialization === 'identity' ? 'general' : 'specialized',
      author: 'User',
      version: '1.0.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      performance: {
        // Enhanced starting performance based on specialization
        accuracy: 0.7 + (Math.random() * 0.2), // 0.7-0.9 for specialized bots
        speed: this.getSpeedForSpecialization(specialization),
        successRate: 0.6 + (Math.random() * 0.3), // 0.6-0.9
        intelQualityScore: 0.7 + (Math.random() * 0.2),
        totalOperations: 0,
        totalIntelGenerated: 0,
        lastEvaluation: new Date().toISOString()
      },
      status: 'active',
      configuration: {
        maxConcurrentOperations: 1,
        maxDailyOperations: 100,
        rateLimiting: true,
        proxyRotation: false,
        obfuscation: false,
        loggingLevel: 'standard',
        notifyOnCompletion: true,
        saveResultsAutomatically: true,
        customParameters: {}
      }
    };

    this.registeredBots.set(newBot.id, newBot);
    return newBot.id;
  }

  createCustomBot(name: string, specialization: IntelType, description: string, autonomyLevel: AutonomyLevel): string {
    // Enhanced bot creation with direct specialization control
    const capabilities = this.getCapabilitiesForSpecialization(specialization);
    const compatibleTools = this.getToolsForSpecialization(specialization);

    const newBot: OsintBot = {
      id: `custom-${Date.now()}`,
      name,
      description,
      avatar: this.getAvatarForSpecialization(specialization),
      capabilities,
      compatibleTools,
      specializations: [specialization],
      autonomyLevel,
      scope: specialization === 'identity' ? 'general' : 'specialized',
      author: 'User',
      version: '1.0.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      performance: {
        // Enhanced starting performance based on specialization
        accuracy: 0.7 + (Math.random() * 0.2), // 0.7-0.9 for specialized bots
        speed: this.getSpeedForSpecialization(specialization),
        successRate: 0.6 + (Math.random() * 0.3), // 0.6-0.9
        intelQualityScore: 0.7 + (Math.random() * 0.2),
        totalOperations: 0,
        totalIntelGenerated: 0,
        lastEvaluation: new Date().toISOString()
      },
      status: 'active',
      configuration: {
        maxConcurrentOperations: autonomyLevel === 'autonomous' ? 3 : autonomyLevel === 'semi-autonomous' ? 2 : 1,
        maxDailyOperations: autonomyLevel === 'autonomous' ? 500 : autonomyLevel === 'semi-autonomous' ? 250 : 100,
        rateLimiting: true,
        proxyRotation: autonomyLevel !== 'supervised',
        obfuscation: autonomyLevel === 'autonomous',
        loggingLevel: autonomyLevel === 'autonomous' ? 'minimal' : 'standard',
        notifyOnCompletion: true,
        saveResultsAutomatically: true,
        customParameters: {}
      }
    };

    this.registeredBots.set(newBot.id, newBot);
    return newBot.id;
  }

  deleteBot(botId: string): boolean {
    return this.registeredBots.delete(botId);
  }

  getBot(botId: string): OsintBot | undefined {
    return this.registeredBots.get(botId);
  }

  // Enhanced specialization determination
  private determineSpecialization(category: string, description: string, name: string): IntelType {
    const text = `${category} ${description} ${name}`.toLowerCase();
    
    if (text.match(/domain|dns|infrastructure|network|ip|ssl|certificate/)) {
      return 'network';
    } else if (text.match(/social|people|person|employee|email|linkedin|twitter/)) {
      return 'social';
    } else if (text.match(/vuln|security|scan|port|cve|vulnerability|threat/)) {
      return 'vulnerability';
    } else if (text.match(/company|business|financial|competitive|market/)) {
      return 'financial';
    } else if (text.match(/dark|tor|underground|breach|leak/)) {
      return 'darkweb';
    } else {
      return 'identity'; // Default fallback
    }
  }

  getCapabilitiesForSpecialization(specialization: IntelType): BotCapability[] {
    const capabilityMap: Record<IntelType, BotCapability[]> = {
      'identity': ['collection', 'analysis', 'verification'],
      'network': ['collection', 'analysis', 'monitoring'],
      'social': ['collection', 'correlation', 'monitoring'],
      'financial': ['collection', 'analysis', 'reporting'],
      'vulnerability': ['collection', 'analysis', 'alerting'],
      'darkweb': ['collection', 'monitoring', 'alerting'],
      'infrastructure': ['collection', 'analysis', 'monitoring'],
      'geospatial': ['collection', 'analysis', 'correlation'],
      'temporal': ['collection', 'analysis', 'correlation'],
      'threat': ['collection', 'analysis', 'alerting']
    };
    return capabilityMap[specialization] || ['collection'];
  }

  getToolsForSpecialization(specialization: IntelType): string[] {
    // Map specializations to compatible PowerTools
    const toolMap: Record<IntelType, string[]> = {
      'identity': netRunnerPowerTools.slice(0, 3).map(t => t.id), // General tools
      'network': netRunnerPowerTools.filter(t => 
        t.name.includes('Shodan') || t.name.includes('DNS') || t.name.includes('SSL')
      ).map(t => t.id),
      'social': netRunnerPowerTools.filter(t => 
        t.name.includes('Harvester') || t.name.includes('Social')
      ).map(t => t.id),
      'vulnerability': netRunnerPowerTools.filter(t => 
        t.name.includes('Nmap') || t.name.includes('Vuln') || t.name.includes('Security')
      ).map(t => t.id),
      'financial': netRunnerPowerTools.filter(t => 
        t.name.includes('Business') || t.name.includes('Financial')
      ).map(t => t.id),
      'darkweb': netRunnerPowerTools.filter(t => 
        t.name.includes('Dark') || t.name.includes('Breach')
      ).map(t => t.id),
      'infrastructure': netRunnerPowerTools.slice(0, 4).map(t => t.id),
      'geospatial': netRunnerPowerTools.slice(0, 3).map(t => t.id),
      'temporal': netRunnerPowerTools.slice(0, 3).map(t => t.id),
      'threat': netRunnerPowerTools.slice(0, 4).map(t => t.id)
    };
    
    const tools = toolMap[specialization] || netRunnerPowerTools.slice(0, 3).map(t => t.id);
    return tools.length > 0 ? tools : netRunnerPowerTools.slice(0, 3).map(t => t.id);
  }

  getAutonomyForSpecialization(specialization: IntelType): AutonomyLevel {
    // More specialized bots get higher autonomy
    const autonomyMap: Record<IntelType, AutonomyLevel> = {
      'identity': 'supervised',
      'network': 'semi-autonomous',
      'social': 'supervised', // Social intel requires more oversight
      'financial': 'semi-autonomous',
      'vulnerability': 'semi-autonomous',
      'darkweb': 'autonomous',
      'infrastructure': 'semi-autonomous',
      'geospatial': 'semi-autonomous',
      'temporal': 'semi-autonomous',
      'threat': 'autonomous'
    };
    return autonomyMap[specialization] || 'supervised';
  }

  getAvatarForSpecialization(specialization: IntelType): string {
    const avatarMap: Record<IntelType, string> = {
      'identity': '🤖',
      'network': '🌐',
      'social': '👥',
      'financial': '💼',
      'vulnerability': '🛡️',
      'darkweb': '🕵️',
      'infrastructure': '⚙️',
      'geospatial': '�️',
      'temporal': '⏰',
      'threat': '⚠️'
    };
    return avatarMap[specialization] || '🤖';
  }

  getSpeedForSpecialization(specialization: IntelType): number {
    // Different specializations have different operational speeds
    const speedMap: Record<IntelType, number> = {
      'identity': 45,      // Fast general queries
      'network': 35,       // Network scans take time
      'social': 25,        // Social intel requires careful gathering
      'financial': 40,     // Business data queries
      'vulnerability': 20, // Security scans are thorough
      'darkweb': 15,       // Dark web searches are slow
      'infrastructure': 30, // Infrastructure analysis
      'geospatial': 35,    // Location analysis
      'temporal': 40,      // Time-based analysis
      'threat': 25         // Threat analysis
    };
    return speedMap[specialization] || 30;
  }

  toggleBotStatus(botId: string) {
    // Update bot status in real service
    const osintBot = this.getBot(botId);
    if (osintBot) {
      // Toggle between active and inactive
      osintBot.status = osintBot.status === 'active' ? 'inactive' : 'active';
      
      // If bot is being activated, start specialized execution
      if (osintBot.status === 'active') {
        this.executeSpecializedBot(osintBot);
      } else {
        // Stop bot execution
        this.stopBotExecution(osintBot);
      }
    }
  }

  // Enhanced bot execution system based on specializations
  executeSpecializedBot(bot: OsintBot) {
    const specialization = bot.specializations?.[0] || 'generalist';
    
    // Update performance metrics
    if (bot.performance) {
      bot.performance.totalOperations = (bot.performance.totalOperations || 0) + 1;
      bot.performance.lastEvaluation = new Date().toISOString();
    }

    // Execute based on specialization
    switch (specialization) {
      case 'social':
        this.executeSocialIntelligence(bot);
        break;
      case 'network':
        this.executeNetworkIntelligence(bot);
        break;
      case 'threat':
        this.executeThreatIntelligence(bot);
        break;
      case 'identity':
        this.executeIdentityIntelligence(bot);
        break;
      case 'financial':
        this.executeFinancialIntelligence(bot);
        break;
      case 'infrastructure':
        this.executeInfrastructureIntelligence(bot);
        break;
      case 'vulnerability':
        this.executeVulnerabilityIntelligence(bot);
        break;
      case 'darkweb':
        this.executeDarkwebIntelligence(bot);
        break;
      case 'geospatial':
        this.executeGeospatialIntelligence(bot);
        break;
      case 'temporal':
        this.executeTemporalIntelligence(bot);
        break;
      default:
        this.executeGeneralistOperations(bot);
    }
  }

  stopBotExecution(bot: OsintBot) {
    // Clear any ongoing operations
    const currentOperation = this.botOperations.get(bot.id);
    if (currentOperation) {
      clearTimeout(currentOperation);
      this.botOperations.delete(bot.id);
    }
    
    // Clear current activity
    this.botActivities.delete(bot.id);
    
    // Update performance
    if (bot.performance) {
      bot.performance.lastEvaluation = new Date().toISOString();
    }
  }

  private executeSocialIntelligence(bot: OsintBot) {
    const operations = [
      'Scanning social media platforms...',
      'Analyzing social connections...',
      'Monitoring social sentiment...',
      'Cross-referencing social profiles...'
    ];
    this.simulateIntelligenceWork(bot, operations, 3000);
  }

  private executeNetworkIntelligence(bot: OsintBot) {
    const operations = [
      'Scanning network infrastructure...',
      'Mapping network topology...',
      'Identifying network assets...',
      'Analyzing network traffic patterns...'
    ];
    this.simulateIntelligenceWork(bot, operations, 4000);
  }

  private executeThreatIntelligence(bot: OsintBot) {
    const operations = [
      'Hunting threat indicators...',
      'Analyzing attack patterns...',
      'Tracking threat actors...',
      'Correlating threat data...'
    ];
    this.simulateIntelligenceWork(bot, operations, 5000);
  }

  private executeIdentityIntelligence(bot: OsintBot) {
    const operations = [
      'Researching identity records...',
      'Validating identity information...',
      'Cross-referencing databases...',
      'Analyzing identity patterns...'
    ];
    this.simulateIntelligenceWork(bot, operations, 3500);
  }

  private executeFinancialIntelligence(bot: OsintBot) {
    const operations = [
      'Tracing financial transactions...',
      'Analyzing payment patterns...',
      'Monitoring financial markets...',
      'Investigating financial networks...'
    ];
    this.simulateIntelligenceWork(bot, operations, 6000);
  }

  private executeInfrastructureIntelligence(bot: OsintBot) {
    const operations = [
      'Mapping digital infrastructure...',
      'Analyzing server configurations...',
      'Identifying infrastructure vulnerabilities...',
      'Monitoring infrastructure changes...'
    ];
    this.simulateIntelligenceWork(bot, operations, 4500);
  }

  private executeVulnerabilityIntelligence(bot: OsintBot) {
    const operations = [
      'Scanning for vulnerabilities...',
      'Analyzing security weaknesses...',
      'Monitoring exploit databases...',
      'Assessing security posture...'
    ];
    this.simulateIntelligenceWork(bot, operations, 5500);
  }

  private executeDarkwebIntelligence(bot: OsintBot) {
    const operations = [
      'Monitoring darkweb forums...',
      'Tracking illegal marketplaces...',
      'Analyzing criminal communications...',
      'Gathering underground intelligence...'
    ];
    this.simulateIntelligenceWork(bot, operations, 7000);
  }

  private executeGeospatialIntelligence(bot: OsintBot) {
    const operations = [
      'Analyzing location data...',
      'Mapping geographic patterns...',
      'Tracking movement patterns...',
      'Correlating spatial information...'
    ];
    this.simulateIntelligenceWork(bot, operations, 4000);
  }

  private executeTemporalIntelligence(bot: OsintBot) {
    const operations = [
      'Analyzing time-based patterns...',
      'Tracking temporal correlations...',
      'Monitoring time sequences...',
      'Identifying temporal anomalies...'
    ];
    this.simulateIntelligenceWork(bot, operations, 3500);
  }

  private executeGeneralistOperations(bot: OsintBot) {
    const operations = [
      'Performing general reconnaissance...',
      'Collecting open source intelligence...',
      'Monitoring public sources...',
      'Analyzing available data...'
    ];
    this.simulateIntelligenceWork(bot, operations, 3000);
  }

  // Core intelligence simulation engine
  private simulateIntelligenceWork(bot: OsintBot, operations: string[], baseInterval: number) {
    if (bot.status !== 'active') return;
    
    // Pick random operation
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    // Update bot's current activity
    this.botActivities.set(bot.id, operation);
    
    // Simulate work with realistic timing
    const workTime = baseInterval + (Math.random() * 2000); // Add some randomness
    
    const timeoutId = setTimeout(() => {
      if (bot.status === 'active') {
        // Complete the operation
        if (bot.performance) {
          bot.performance.totalOperations = (bot.performance.totalOperations || 0) + 1;
          bot.performance.lastEvaluation = new Date().toISOString();
          bot.performance.successRate = Math.min(
            (bot.performance.successRate || 0.7) + 0.01, 
            0.98
          ); // Gradually improve success rate
        }
        
        // Continue with next operation
        this.simulateIntelligenceWork(bot, operations, baseInterval);
      }
    }, workTime);
    
    // Store the timeout ID for later cleanup
    this.botOperations.set(bot.id, timeoutId);
  }

  // Get current bot activity for UI display
  getBotCurrentActivity(botId: string): string | undefined {
    return this.botActivities.get(botId);
  }

  /**
   * Get bot performance metrics and health status
   */
  getBotMetrics(botId: string): {
    successRate: number;
    operationsCompleted: number;
    currentLoad: number;
    healthStatus: 'excellent' | 'good' | 'warning' | 'error';
    uptime: string;
  } {
    const osintBot = this.registeredBots.get(botId);
    
    if (!osintBot) {
      return {
        successRate: 0,
        operationsCompleted: 0,
        currentLoad: 0,
        healthStatus: 'error',
        uptime: '00:00:00'
      };
    }

    // Simulate realistic metrics based on bot status and runtime
    const runtime = Date.now() - new Date(osintBot.created).getTime();
    const hoursRunning = Math.floor(runtime / (1000 * 60 * 60));
    const minutesRunning = Math.floor((runtime % (1000 * 60 * 60)) / (1000 * 60));
    const secondsRunning = Math.floor((runtime % (1000 * 60)) / 1000);
    
    const uptime = `${hoursRunning.toString().padStart(2, '0')}:${minutesRunning.toString().padStart(2, '0')}:${secondsRunning.toString().padStart(2, '0')}`;
    
    // Generate realistic metrics based on bot characteristics
    const baseSuccessRate = osintBot.autonomyLevel === 'autonomous' ? 90 : 
                           osintBot.autonomyLevel === 'semi-autonomous' ? 85 : 80;
    const successRate = Math.max(60, baseSuccessRate + Math.floor(Math.random() * 15) - 7);
    
    const operationsCompleted = osintBot.performance.totalOperations + Math.floor(Math.random() * 10); // Operations every 30 seconds
    
    // Determine health status
    let healthStatus: 'excellent' | 'good' | 'warning' | 'error' = 'excellent';
    if (osintBot.status === 'inactive') healthStatus = 'error';
    else if (successRate < 70) healthStatus = 'error';
    else if (successRate < 80) healthStatus = 'warning';
    else if (successRate < 90) healthStatus = 'good';
    
    // Calculate current load based on activity
    const currentLoad = osintBot.status === 'active' ? 
      Math.floor(Math.random() * 40) + 30 : // 30-70% when active
      Math.floor(Math.random() * 20); // 0-20% when idle

    return {
      successRate,
      operationsCompleted,
      currentLoad,
      healthStatus,
      uptime
    };
  }

  /**
   * Get bot status color based on health and activity
   */
  getBotStatusColor(botId: string): string {
    const metrics = this.getBotMetrics(botId);
    const osintBot = this.registeredBots.get(botId);
    
    if (!osintBot || osintBot.status === 'inactive') return '#666666';
    
    switch (metrics.healthStatus) {
      case 'excellent': return '#00ff88';
      case 'good': return '#88ff00';
      case 'warning': return '#ffaa00';
      case 'error': return '#ff4444';
      default: return '#666666';
    }
  }
}

const NetRunnerBottomBar: React.FC<NetRunnerBottomBarProps> = ({
  open,
  height,
  onToggle
}) => {
  const [createBotOpen, setCreateBotOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotDescription, setNewBotDescription] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<IntelType>('identity');
  const [selectedAutonomy, setSelectedAutonomy] = useState<AutonomyLevel>('supervised');
  const [previewBot, setPreviewBot] = useState<{
    name: string;
    specialization: IntelType;
    autonomy: AutonomyLevel;
    description: string;
    capabilities: BotCapability[];
    tools: number;
    avatar: string;
    speed: number;
  } | null>(null);

  // Initialize real bot service
  const botService = useMemo(() => new BotRosterService(), []);
  const [bots, setBots] = useState<BotInstance[]>([]);

  // Load real bots on component mount
  useEffect(() => {
    setBots(botService.getBots());
  }, [botService]);

  // Real-time bot activity updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh bot list to show updated activities and performance
      setBots(botService.getBots());
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [botService]);

  // Update preview bot when creation form changes
  useEffect(() => {
    if (createBotOpen && newBotName) {
      const mockPreview = {
        name: newBotName,
        specialization: selectedSpecialization,
        autonomy: selectedAutonomy,
        description: newBotDescription || `Custom ${selectedSpecialization} intelligence bot`,
        capabilities: botService.getCapabilitiesForSpecialization(selectedSpecialization),
        tools: botService.getToolsForSpecialization(selectedSpecialization).length,
        avatar: botService.getAvatarForSpecialization(selectedSpecialization),
        speed: botService.getSpeedForSpecialization(selectedSpecialization)
      };
      setPreviewBot(mockPreview);
    }
  }, [createBotOpen, newBotName, selectedSpecialization, selectedAutonomy, newBotDescription, botService]);

  const getBotStatusIcon = (status: BotInstance['status']) => {
    switch (status) {
      case 'active': return <Activity size={12} />;
      case 'paused': return <Pause size={12} />;
      case 'idle': return <Clock size={12} />;
      case 'error': return <AlertTriangle size={12} />;
      default: return <CheckCircle size={12} />;
    }
  };

  const handleCreateBot = () => {
    if (!newBotName || !selectedSpecialization) return;

    // Create real bot using service with enhanced parameters
    botService.createCustomBot(
      newBotName, 
      selectedSpecialization,
      newBotDescription || `Custom ${selectedSpecialization} intelligence bot`,
      selectedAutonomy
    );
    
    // Refresh bot list from service
    setBots(botService.getBots());
    
    // Reset form
    setCreateBotOpen(false);
    setNewBotName('');
    setNewBotDescription('');
    setSelectedSpecialization('identity');
    setSelectedAutonomy('supervised');
    setPreviewBot(null);
  };

  const toggleBotStatus = (botId: string) => {
    // Update bot status in real service
    const osintBot = botService.getBot(botId);
    if (osintBot) {
      // Toggle between active and inactive
      osintBot.status = osintBot.status === 'active' ? 'inactive' : 'active';
      
      // If bot is being activated, start specialized execution
      if (osintBot.status === 'active') {
        botService.executeSpecializedBot(osintBot);
      } else {
        // Stop bot execution
        botService.stopBotExecution(osintBot);
      }
      
      // Refresh UI from service
      setBots(botService.getBots());
    }
  };

  const deleteBot = (botId: string) => {
    if (botService.deleteBot(botId)) {
      setBots(botService.getBots());
    }
  };

  return (
    <Box
      sx={{
        height: `${height}px`,
        width: '100%',
        backgroundColor: '#000000',
        borderTop: '1px solid #00f5ff',
        display: 'flex',
        transition: 'height 0.3s ease',
        overflow: 'hidden',
        fontFamily: "'Aldrich', 'Courier New', monospace"
      }}
    >
      {/* Left Control Panel */}
      <Box
        sx={{
          width: '48px',
          backgroundColor: '#0a0a0a',
          borderRight: '1px solid #00f5ff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 0.5,
          gap: 0.5
        }}
      >
        {/* Expand/Collapse Toggle */}
        <Tooltip title={open ? "Collapse Bot Roster" : "Expand Bot Roster"}>
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{ 
              color: '#ffffff',
              p: 0.25,
              '&:hover': { color: '#00f5ff' }
            }}
          >
            {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </IconButton>
        </Tooltip>

        {/* Create Bot Button */}
        <Tooltip title="Create New Bot">
          <IconButton
            onClick={() => setCreateBotOpen(true)}
            size="small"
            sx={{
              color: '#00ff88',
              border: '1px solid #00ff88',
              borderRadius: 0,
              p: 0.25,
              minWidth: 20,
              minHeight: 20,
              '&:hover': {
                backgroundColor: 'rgba(0, 255, 136, 0.1)'
              }
            }}
          >
            <Plus size={12} />
          </IconButton>
        </Tooltip>

        {/* Bot Management */}
        <Tooltip title="Bot Settings">
          <IconButton
            size="small"
            sx={{ 
              color: '#aaaaaa',
              p: 0.25,
              '&:hover': { color: '#ffffff' }
            }}
          >
            <Settings size={12} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Bot Roster - Horizontal Scroll */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            borderBottom: '1px solid #00f5ff',
            backgroundColor: '#0a0a0a'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              flex: 1,
              color: '#00f5ff',
              fontWeight: 500,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {/* Logo or Title */}
            <Box
              component="span"
              sx={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 0.3
              }}
            >
              <Bot size={24} />
              NetRunner Bot Roster
            </Box>

            {/* Version and Status */}
            <Box
              component="span"
              sx={{
                fontSize: '0.8rem',
                color: '#aaaaaa',
                display: 'flex',
                alignItems: 'center',
                gap: 0.2
              }}
            >
              <Chip
                label="v2.5.1"
                size="small"
                sx={{
                  backgroundColor: '#1e1e1e',
                  color: '#00ff88',
                  border: '1px solid #00ff88',
                  borderRadius: 1,
                  height: 24,
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              />
              <Box
                component="span"
                sx={{
                  height: '8px',
                  width: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#00ff88',
                  display: 'inline-block'
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#00ff88',
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              >
                All systems operational
              </Typography>
            </Box>
          </Typography>
        </Box>

        {/* Bot List - Horizontal Scrollable */}
        <Box
          sx={{
            flex: 1,
            overflowX: 'auto',
            display: 'flex',
            p: 1,
            gap: 1,
            '&::-webkit-scrollbar': {
              height: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#00f5ff',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#0a0a0a'
            }
          }}
        >
          {bots.map(bot => (
            <Card
              key={bot.id}
              sx={{
                minWidth: 180,
                backgroundColor: '#1e1e1e',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${botService.getBotStatusColor(bot.id)}`,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  borderColor: '#00f5ff'
                }
              }}
            >
              {/* Status Indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  height: 12,
                  width: 12,
                  borderRadius: '50%',
                  backgroundColor: botService.getBotStatusColor(bot.id),
                  border: '2px solid #000000'
                }}
              />

              {/* Bot Avatar and Name */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: 'transparent',
                    color: '#00ff88',
                    border: '2px solid #00ff88',
                    width: 32,
                    height: 32,
                    mr: 1
                  }}
                >
                  {bot.icon && <bot.icon size={24} />}
                </Avatar>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    flex: 1
                  }}
                >
                  {bot.name}
                </Typography>
              </Box>

              {/* Bot Details - Status, Uptime, Tasks */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#aaaaaa',
                      fontWeight: 400,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.2
                    }}
                  >
                    {/* Status Icon */}
                    {getBotStatusIcon(bot.status)}
                    {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                  </Typography>

                  <Chip
                    label={`Ops: ${botService.getBotMetrics(bot.id).operationsCompleted}`}
                    size="small"
                    sx={{
                      backgroundColor: '#0a0a0a',
                      color: '#00ff88',
                      border: '1px solid #00ff88',
                      borderRadius: 1,
                      height: 24,
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#aaaaaa',
                      fontWeight: 400,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.2
                    }}
                  >
                    <Clock size={12} />
                    Uptime: {botService.getBotMetrics(bot.id).uptime}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* Success Rate Indicator */}
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: botService.getBotMetrics(bot.id).successRate >= 85 ? '#00ff88' : 
                                        botService.getBotMetrics(bot.id).successRate >= 70 ? '#ffaa00' : '#ff4444'
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#cccccc',
                        fontSize: '0.7rem'
                      }}
                    >
                      {botService.getBotMetrics(bot.id).successRate}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Bot Actions - Play/Pause, Delete */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => toggleBotStatus(bot.id)}
                  sx={{
                    bgcolor: bot.status === 'active' ? '#ff4444' : '#00ff88',
                    color: '#ffffff',
                    borderRadius: 1,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: bot.status === 'active' ? '#ff6666' : '#00ff99'
                    }
                  }}
                >
                  {bot.status === 'active' ? 'Pause' : 'Resume'}
                </Button>

                {/* Mission Assignment Button - Phase 1 Implementation */}
                <Tooltip title="Assign Mission (Phase 1)">
                  <IconButton
                    size="small"
                    onClick={() => {
                      import('../../execution/BotMissionExecutor').then(({ BotMissionExecutor }) => {
                        const executor = new BotMissionExecutor();
                        const target = prompt('Enter target URL or domain:');
                        if (target) {
                          console.log(`🎯 Executing mission for bot ${bot.name} on target: ${target}`);
                          
                          // Convert BotInstance to OsintBot format for mission execution
                          const osintBot: OsintBot = {
                            id: bot.id,
                            name: bot.name,
                            description: bot.description,
                            avatar: "🤖",
                            status: bot.status === 'active' ? 'active' : 'inactive',
                            capabilities: bot.capabilities as BotCapability[],
                            compatibleTools: [],
                            specializations: [bot.specialization as IntelType || 'identity'],
                            scope: 'specialized',
                            autonomyLevel: bot.autonomyLevel > 80 ? 'autonomous' : 
                                         bot.autonomyLevel > 50 ? 'semi-autonomous' : 'supervised',
                            author: 'user',
                            version: '1.0.0',
                            created: new Date().toISOString(),
                            updated: new Date().toISOString(),
                            performance: {
                              accuracy: 0.85,
                              speed: 30,
                              successRate: 0.85,
                              intelQualityScore: 0.8,
                              totalOperations: bot.tasksCompleted,
                              totalIntelGenerated: bot.tasksCompleted * 2,
                              lastEvaluation: new Date().toISOString()
                            },
                            configuration: {
                              maxConcurrentOperations: 3,
                              maxDailyOperations: 100,
                              rateLimiting: true,
                              proxyRotation: false,
                              obfuscation: false,
                              loggingLevel: 'standard',
                              notifyOnCompletion: true,
                              saveResultsAutomatically: true,
                              customParameters: {}
                            }
                          };
                          
                          executor.executeSimpleMission(osintBot, target, 'reconnaissance')
                            .then(result => {
                              console.log(`✅ Mission completed:`, result);
                              console.log(`📊 Mission Results: ${result.intelCollected} intel items collected in ${result.duration}ms`);
                              console.log(`🔧 Operations performed: ${result.operationsPerformed.join(', ')}`);
                              
                              // Show success notification in console
                              if (result.status === 'success') {
                                console.log(`🎉 Bot ${bot.name} successfully completed autonomous mission!`);
                              }
                              
                              // Refresh bot display to show updated metrics
                              setBots(botService.getBots());
                            })
                            .catch(err => {
                              console.error(`❌ Mission failed:`, err);
                            });
                        }
                      });
                    }}
                    sx={{
                      color: '#00f5ff',
                      border: '1px solid #00f5ff',
                      borderRadius: 0.5,
                      p: 0.5,
                      mr: 0.5,
                      '&:hover': { 
                        backgroundColor: 'rgba(0, 245, 255, 0.1)',
                        color: '#ffffff'
                      }
                    }}
                  >
                    🎯
                  </IconButton>
                </Tooltip>

                <IconButton
                  size="small"
                  onClick={() => deleteBot(bot.id)}
                  sx={{
                    color: '#ff4444',
                    p: 0.5,
                    '&:hover': { color: '#ffffff' }
                  }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Box>

              {/* Bot Activity - Current operation or activity */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  right: 8,
                  bgcolor: '#0a0a0a',
                  borderRadius: 1,
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  borderTop: `1px solid ${botService.getBotStatusColor(bot.id)}`,
                  opacity: bot.status === 'active' ? 1 : 0.7
                }}
              >
                {/* Activity Indicator */}
                {bot.status === 'active' && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#00ff88',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': {
                          opacity: 1,
                          transform: 'scale(1)'
                        },
                        '50%': {
                          opacity: 0.5,
                          transform: 'scale(1.2)'
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'scale(1)'
                        }
                      }
                    }}
                  />
                )}
                
                <Typography
                  variant="body2"
                  sx={{
                    color: '#00ff88',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {botService.getBotCurrentActivity(bot.id) || (bot.status === 'active' ? 'Initializing...' : 'Idle')}
                </Typography>

                <Chip
                  label={bot.aiControlled ? 'AI' : 'Manual'}
                  size="small"
                  sx={{
                    backgroundColor: bot.aiControlled ? '#00ff88' : '#ffaa00',
                    color: '#000000',
                    borderRadius: 1,
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    minWidth: 40
                  }}
                />
              </Box>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Create Bot Dialog */}
      <Dialog
        open={createBotOpen}
        onClose={() => setCreateBotOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#1e1e1e',
            borderRadius: 1,
            border: '1px solid #00f5ff',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            color: '#00f5ff',
            fontWeight: 500,
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            borderBottom: '1px solid #333333',
            pb: 2
          }}
        >
          <Bot size={24} />
          NetRunner Bot Designer
          <Chip
            label="v2.5.1"
            size="small"
            sx={{
              ml: 'auto',
              backgroundColor: '#00ff88',
              color: '#000000',
              fontWeight: 600
            }}
          />
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', height: '500px' }}>
            {/* Left Panel - Configuration */}
            <Box
              sx={{
                width: '60%',
                p: 3,
                borderRight: '1px solid #333333',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                overflowY: 'auto'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#ffffff',
                  fontWeight: 500,
                  fontSize: '1rem',
                  mb: 1
                }}
              >
                Bot Configuration
              </Typography>

              {/* Bot Name */}
              <TextField
                label="Bot Name"
                variant="outlined"
                value={newBotName}
                onChange={e => setNewBotName(e.target.value)}
                fullWidth
                required
                placeholder="Enter a unique name for your bot"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#00f5ff'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00ff88'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00ff88'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#aaaaaa',
                    '&.Mui-focused': {
                      color: '#00ff88'
                    }
                  }
                }}
              />

              {/* Intelligence Specialization */}
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    color: '#aaaaaa',
                    '&.Mui-focused': {
                      color: '#00ff88'
                    }
                  }}
                >
                  Intelligence Specialization
                </InputLabel>
                <Select
                  value={selectedSpecialization}
                  onChange={e => setSelectedSpecialization(e.target.value as IntelType)}
                  label="Intelligence Specialization"
                  sx={{
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff',
                    '& .MuiSelect-icon': {
                      color: '#00f5ff'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00f5ff'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff88'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff88'
                    }
                  }}
                >
                  <MenuItem value="identity" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🤖</span>
                      <Box>
                        <Typography variant="body1">Identity Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Person & entity identification and verification
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="network" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🌐</span>
                      <Box>
                        <Typography variant="body1">Network Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Network infrastructure analysis and mapping
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="social" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>👥</span>
                      <Box>
                        <Typography variant="body1">Social Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Social media monitoring and analysis
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="financial" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>💼</span>
                      <Box>
                        <Typography variant="body1">Financial Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Financial transaction tracking and analysis
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="vulnerability" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🛡️</span>
                      <Box>
                        <Typography variant="body1">Vulnerability Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Security vulnerability scanning and assessment
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="darkweb" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🕵️</span>
                      <Box>
                        <Typography variant="body1">Darkweb Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Dark web monitoring and investigation
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="threat" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>⚠️</span>
                      <Box>
                        <Typography variant="body1">Threat Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Threat hunting and actor tracking
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="geospatial" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🗺️</span>
                      <Box>
                        <Typography variant="body1">Geospatial Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Location-based analysis and tracking
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="infrastructure" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>⚙️</span>
                      <Box>
                        <Typography variant="body1">Infrastructure Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Digital infrastructure analysis
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="temporal" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>⏰</span>
                      <Box>
                        <Typography variant="body1">Temporal Intelligence</Typography>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Time-based pattern analysis
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Autonomy Level */}
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    color: '#aaaaaa',
                    '&.Mui-focused': {
                      color: '#00ff88'
                    }
                  }}
                >
                  Autonomy Level
                </InputLabel>
                <Select
                  value={selectedAutonomy}
                  onChange={e => setSelectedAutonomy(e.target.value as AutonomyLevel)}
                  label="Autonomy Level"
                  sx={{
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff',
                    '& .MuiSelect-icon': {
                      color: '#00f5ff'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00f5ff'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff88'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff88'
                    }
                  }}
                >
                  <MenuItem value="supervised" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box>
                      <Typography variant="body1">Supervised</Typography>
                      <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                        Requires human oversight for all operations
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="semi-autonomous" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box>
                      <Typography variant="body1">Semi-Autonomous</Typography>
                      <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                        Can operate independently with periodic checkpoints
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="autonomous" sx={{ color: '#ffffff', backgroundColor: '#1e1e1e' }}>
                    <Box>
                      <Typography variant="body1">Autonomous</Typography>
                      <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                        Fully independent operation with minimal oversight
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Description */}
              <TextField
                label="Description"
                variant="outlined"
                value={newBotDescription}
                onChange={e => setNewBotDescription(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="Describe the bot's purpose and capabilities..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#00f5ff'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00ff88'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00ff88'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#aaaaaa',
                    '&.Mui-focused': {
                      color: '#00ff88'
                    }
                  }
                }}
              />

              {/* Phase 1 Mission Capabilities Preview */}
              <Box
                sx={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #00f5ff',
                  borderRadius: 1,
                  p: 2,
                  mt: 1
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#00f5ff',
                    fontWeight: 600,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  🚀 Phase 1 Mission Capabilities
                </Typography>
                
                <Typography
                  variant="body2"
                  sx={{
                    color: '#cccccc',
                    fontSize: '0.8rem',
                    mb: 1,
                    lineHeight: 1.4
                  }}
                >
                  This bot will be equipped with autonomous mission execution capabilities:
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#00ff88', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ✅ Real OSINT tool execution (WebsiteScanner, Shodan*, TheHarvester*)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#00ff88', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ✅ Autonomous target analysis and intelligence generation
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#00ff88', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ✅ Specialized processing based on {selectedSpecialization} intelligence
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#00ff88', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ✅ Real-time mission status and intel generation tracking
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#ffaa00', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    🔄 Mission assignment interface (Click 🎯 button on bot cards)
                  </Typography>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: '#888888',
                    fontSize: '0.7rem',
                    mt: 1,
                    display: 'block',
                    fontStyle: 'italic'
                  }}
                >
                  * Shodan and TheHarvester integration coming in Phase 1 completion
                </Typography>
              </Box>
            </Box>

            {/* Right Panel - Preview */}
            <Box
              sx={{
                width: '40%',
                p: 3,
                backgroundColor: '#0a0a0a',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#ffffff',
                  fontWeight: 500,
                  fontSize: '1rem',
                  mb: 1
                }}
              >
                Bot Preview
              </Typography>

              {previewBot ? (
                <Card
                  sx={{
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #00ff88',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    {/* Bot Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'transparent',
                          color: '#00ff88',
                          border: '2px solid #00ff88',
                          width: 40,
                          height: 40,
                          mr: 1.5,
                          fontSize: '1.5rem'
                        }}
                      >
                        {previewBot.avatar}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: '#ffffff',
                            fontWeight: 500,
                            fontSize: '0.95rem'
                          }}
                        >
                          {previewBot.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#00ff88',
                            fontWeight: 500
                          }}
                        >
                          {previewBot.specialization.charAt(0).toUpperCase() + previewBot.specialization.slice(1)} Specialist
                        </Typography>
                      </Box>
                    </Box>

                    {/* Bot Stats */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Autonomy Level:
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00ff88' }}>
                          {previewBot.autonomy.charAt(0).toUpperCase() + previewBot.autonomy.slice(1)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Capabilities:
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00ff88' }}>
                          {previewBot.capabilities.length}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Compatible Tools:
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00ff88' }}>
                          {previewBot.tools}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Base Speed:
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00ff88' }}>
                          {previewBot.speed} ops/min
                        </Typography>
                      </Box>
                    </Box>

                    {/* Capabilities List */}
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#aaaaaa',
                          fontWeight: 500,
                          mb: 1,
                          display: 'block'
                        }}
                      >
                        Core Capabilities:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {previewBot.capabilities.map((cap: string, index: number) => (
                          <Chip
                            key={index}
                            label={cap.charAt(0).toUpperCase() + cap.slice(1)}
                            size="small"
                            sx={{
                              backgroundColor: '#00ff88',
                              color: '#000000',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Description */}
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#aaaaaa',
                          fontWeight: 500,
                          mb: 0.5,
                          display: 'block'
                        }}
                      >
                        Description:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          lineHeight: 1.4
                        }}
                      >
                        {previewBot.description}
                      </Typography>
                    </Box>

                    {/* Phase 1 Readiness Indicator */}
                    <Box 
                      sx={{ 
                        mt: 2, 
                        p: 1.5, 
                        backgroundColor: '#0a0a0a', 
                        border: '1px solid #00ff88',
                        borderRadius: 1 
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#00ff88',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 0.5
                        }}
                      >
                        🚀 Phase 1 Ready
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#cccccc',
                          fontSize: '0.7rem',
                          display: 'block',
                          lineHeight: 1.3
                        }}
                      >
                        This bot is configured for autonomous intelligence missions with real OSINT tool execution and specialized {previewBot.specialization} processing.
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ) : (
                <Box
                  sx={{
                    border: '2px dashed #333333',
                    borderRadius: 1,
                    p: 3,
                    textAlign: 'center'
                  }}
                >
                  <Bot size={48} color="#333333" />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666666',
                      mt: 1
                    }}
                  >
                    Enter a bot name to see preview
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #333333' }}>
          <Button
            onClick={() => setCreateBotOpen(false)}
            sx={{
              color: '#ffffff',
              borderRadius: 1,
              px: 3,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: '#333333',
              '&:hover': {
                backgroundColor: '#444444'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateBot}
            disabled={!newBotName || !selectedSpecialization}
            sx={{
              color: '#000000',
              borderRadius: 1,
              px: 3,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: '#00ff88',
              '&:hover': {
                backgroundColor: '#00ff99'
              },
              '&:disabled': {
                backgroundColor: '#333333',
                color: '#666666'
              }
            }}
          >
            Deploy Bot
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NetRunnerBottomBar;
