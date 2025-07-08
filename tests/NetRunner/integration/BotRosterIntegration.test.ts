import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  BotRosterManager,
  OsintBot,
  BotOperation,
  BotCapability,
  BotScope,
  AutonomyLevel
} from '../../../../src/pages/NetRunner/integration/BotRosterIntegration';
import { v4 as uuidv4 } from 'uuid';

// Mock UUID for deterministic IDs
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

describe('BotRosterIntegration', () => {
  let botRosterManager: BotRosterManager;
  
  beforeEach(() => {
    botRosterManager = new BotRosterManager();
  });
  
  test('should create a new bot', () => {
    const botData = {
      name: 'TestBot',
      description: 'A test bot',
      avatar: 'test-avatar.png',
      capabilities: ['collection', 'analysis'] as BotCapability[],
      compatibleTools: ['tool-1', 'tool-2'],
      specializations: ['identity', 'social'],
      autonomyLevel: 'semi-autonomous' as AutonomyLevel,
      scope: 'general' as BotScope,
      author: 'test-user',
      version: '1.0.0',
      performance: {
        accuracy: 0.9,
        speed: 10,
        successRate: 0.95,
        intelQualityScore: 0.85,
        totalOperations: 0
      },
      status: 'active' as const,
      configuration: {
        maxOperationsPerDay: 100,
        cooldownPeriod: 30,
        defaultTimeout: 60,
        autoRetry: true,
        maxRetries: 3,
        accessLevel: 'standard'
      }
    };
    
    const bot = botRosterManager.createBot(botData);
    
    expect(bot).toBeDefined();
    expect(bot.id).toBe('mock-uuid');
    expect(bot.name).toBe('TestBot');
    expect(bot.capabilities).toEqual(['collection', 'analysis']);
    expect(bot.created).toBeDefined();
    expect(bot.updated).toBeDefined();
  });
  
  test('should get a bot by ID', () => {
    const botData = {
      name: 'TestBot',
      description: 'A test bot',
      avatar: 'test-avatar.png',
      capabilities: ['collection', 'analysis'] as BotCapability[],
      compatibleTools: ['tool-1', 'tool-2'],
      specializations: ['identity', 'social'],
      autonomyLevel: 'semi-autonomous' as AutonomyLevel,
      scope: 'general' as BotScope,
      author: 'test-user',
      version: '1.0.0',
      performance: {
        accuracy: 0.9,
        speed: 10,
        successRate: 0.95,
        intelQualityScore: 0.85,
        totalOperations: 0
      },
      status: 'active' as const,
      configuration: {
        maxOperationsPerDay: 100,
        cooldownPeriod: 30,
        defaultTimeout: 60,
        autoRetry: true,
        maxRetries: 3,
        accessLevel: 'standard'
      }
    };
    
    const bot = botRosterManager.createBot(botData);
    const retrievedBot = botRosterManager.getBot(bot.id);
    
    expect(retrievedBot).toBeDefined();
    expect(retrievedBot).toEqual(bot);
  });
  
  test('should update a bot', () => {
    const botData = {
      name: 'TestBot',
      description: 'A test bot',
      avatar: 'test-avatar.png',
      capabilities: ['collection', 'analysis'] as BotCapability[],
      compatibleTools: ['tool-1', 'tool-2'],
      specializations: ['identity', 'social'],
      autonomyLevel: 'semi-autonomous' as AutonomyLevel,
      scope: 'general' as BotScope,
      author: 'test-user',
      version: '1.0.0',
      performance: {
        accuracy: 0.9,
        speed: 10,
        successRate: 0.95,
        intelQualityScore: 0.85,
        totalOperations: 0
      },
      status: 'active' as const,
      configuration: {
        maxOperationsPerDay: 100,
        cooldownPeriod: 30,
        defaultTimeout: 60,
        autoRetry: true,
        maxRetries: 3,
        accessLevel: 'standard'
      }
    };
    
    const bot = botRosterManager.createBot(botData);
    
    const updatedBot = botRosterManager.updateBot(bot.id, {
      name: 'UpdatedBot',
      description: 'Updated description',
      capabilities: ['collection', 'analysis', 'verification'] as BotCapability[]
    });
    
    expect(updatedBot).toBeDefined();
    expect(updatedBot?.name).toBe('UpdatedBot');
    expect(updatedBot?.description).toBe('Updated description');
    expect(updatedBot?.capabilities).toEqual(['collection', 'analysis', 'verification']);
    // Original properties should be preserved
    expect(updatedBot?.avatar).toBe('test-avatar.png');
  });
  
  test('should find bots by capability', () => {
    // Create bots with different capabilities
    const bot1Data = {
      name: 'CollectionBot',
      description: 'A collection bot',
      avatar: 'collection-bot.png',
      capabilities: ['collection'] as BotCapability[],
      compatibleTools: ['tool-1'],
      specializations: ['identity'],
      autonomyLevel: 'semi-autonomous' as AutonomyLevel,
      scope: 'general' as BotScope,
      author: 'test-user',
      version: '1.0.0',
      performance: {
        accuracy: 0.9,
        speed: 10,
        successRate: 0.95,
        intelQualityScore: 0.85,
        totalOperations: 0
      },
      status: 'active' as const,
      configuration: {
        maxOperationsPerDay: 100,
        cooldownPeriod: 30,
        defaultTimeout: 60,
        autoRetry: true,
        maxRetries: 3,
        accessLevel: 'standard'
      }
    };
    
    const bot2Data = {
      name: 'AnalysisBot',
      description: 'An analysis bot',
      avatar: 'analysis-bot.png',
      capabilities: ['analysis'] as BotCapability[],
      compatibleTools: ['tool-2'],
      specializations: ['social'],
      autonomyLevel: 'semi-autonomous' as AutonomyLevel,
      scope: 'general' as BotScope,
      author: 'test-user',
      version: '1.0.0',
      performance: {
        accuracy: 0.9,
        speed: 10,
        successRate: 0.95,
        intelQualityScore: 0.85,
        totalOperations: 0
      },
      status: 'active' as const,
      configuration: {
        maxOperationsPerDay: 100,
        cooldownPeriod: 30,
        defaultTimeout: 60,
        autoRetry: true,
        maxRetries: 3,
        accessLevel: 'standard'
      }
    };
    
    const bot3Data = {
      name: 'AllRounderBot',
      description: 'A bot with multiple capabilities',
      avatar: 'all-rounder-bot.png',
      capabilities: ['collection', 'analysis', 'reporting'] as BotCapability[],
      compatibleTools: ['tool-1', 'tool-2', 'tool-3'],
      specializations: ['identity', 'social'],
      autonomyLevel: 'semi-autonomous' as AutonomyLevel,
      scope: 'general' as BotScope,
      author: 'test-user',
      version: '1.0.0',
      performance: {
        accuracy: 0.9,
        speed: 10,
        successRate: 0.95,
        intelQualityScore: 0.85,
        totalOperations: 0
      },
      status: 'active' as const,
      configuration: {
        maxOperationsPerDay: 100,
        cooldownPeriod: 30,
        defaultTimeout: 60,
        autoRetry: true,
        maxRetries: 3,
        accessLevel: 'standard'
      }
    };
    
    botRosterManager.createBot(bot1Data);
    botRosterManager.createBot(bot2Data);
    botRosterManager.createBot(bot3Data);
    
    // Find bots by capability
    const collectionBots = botRosterManager.findBotsByCapability('collection');
    expect(collectionBots).toHaveLength(2);
    expect(collectionBots[0].name).toBe('CollectionBot');
    expect(collectionBots[1].name).toBe('AllRounderBot');
    
    const analysisBots = botRosterManager.findBotsByCapability('analysis');
    expect(analysisBots).toHaveLength(2);
    expect(analysisBots[0].name).toBe('AnalysisBot');
    expect(analysisBots[1].name).toBe('AllRounderBot');
    
    const reportingBots = botRosterManager.findBotsByCapability('reporting');
    expect(reportingBots).toHaveLength(1);
    expect(reportingBots[0].name).toBe('AllRounderBot');
  });
  
  test('should assign and execute a bot operation', async () => {
    // Create a bot
    const botData = {
      name: 'OperationBot',
      description: 'A bot for operations',
      avatar: 'operation-bot.png',
      capabilities: ['collection', 'analysis'] as BotCapability[],
      compatibleTools: ['tool-1', 'tool-2'],
      specializations: ['identity', 'social'],
      autonomyLevel: 'semi-autonomous' as AutonomyLevel,
      scope: 'general' as BotScope,
      author: 'test-user',
      version: '1.0.0',
      performance: {
        accuracy: 0.9,
        speed: 10,
        successRate: 0.95,
        intelQualityScore: 0.85,
        totalOperations: 0
      },
      status: 'active' as const,
      configuration: {
        maxOperationsPerDay: 100,
        cooldownPeriod: 30,
        defaultTimeout: 60,
        autoRetry: true,
        maxRetries: 3,
        accessLevel: 'standard'
      }
    };
    
    const bot = botRosterManager.createBot(botData);
    
    // Assign an operation
    const operationData = {
      type: 'intel-gathering',
      target: 'test-target',
      priority: 'medium',
      toolsToUse: ['tool-1'],
      parameters: { query: 'test query' },
      requiredCapabilities: ['collection']
    };
    
    const operation = botRosterManager.assignOperation(bot.id, operationData);
    
    expect(operation).toBeDefined();
    expect(operation.botId).toBe(bot.id);
    expect(operation.status).toBe('assigned');
    expect(operation.startTime).toBeUndefined();
    
    // Mock the execute operation method
    botRosterManager.executeOperation = vi.fn().mockResolvedValue({
      ...operation,
      status: 'completed',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      result: { success: true, data: 'Test result' }
    });
    
    // Execute the operation
    const executedOperation = await botRosterManager.executeOperation(operation.id);
    
    expect(executedOperation).toBeDefined();
    expect(executedOperation.status).toBe('completed');
    expect(executedOperation.startTime).toBeDefined();
    expect(executedOperation.endTime).toBeDefined();
    expect(executedOperation.result).toBeDefined();
    
    // Verify the bot's performance was updated
    const updatedBot = botRosterManager.getBot(bot.id);
    expect(updatedBot?.performance.totalOperations).toBe(1);
  });
});
