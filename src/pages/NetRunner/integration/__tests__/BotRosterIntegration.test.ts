import { describe, test, expect, vi, beforeEach } from 'vitest';
import { 
  OsintBot,
  BotCapability,
  sampleBots,
  createBotTask,
  BotTask,
  BotPerformance,
  BotConfiguration
} from '../BotRosterIntegration';
import { v4 as uuidv4 } from 'uuid';

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

describe('BotRosterIntegration', () => {
  let mockBots: OsintBot[];
  
  beforeEach(() => {
    // Create a fresh copy of sample bots for each test
    mockBots = JSON.parse(JSON.stringify(sampleBots));
  });
  
  test('should have sample bots with all required properties', () => {
    expect(sampleBots).toBeDefined();
    expect(Array.isArray(sampleBots)).toBe(true);
    expect(sampleBots.length).toBeGreaterThan(0);
    
    sampleBots.forEach(bot => {
      expect(bot).toHaveProperty('id');
      expect(bot).toHaveProperty('name');
      expect(bot).toHaveProperty('description');
      expect(bot).toHaveProperty('avatar');
      expect(bot).toHaveProperty('capabilities');
      expect(bot).toHaveProperty('compatibleTools');
      expect(bot).toHaveProperty('specializations');
      expect(bot).toHaveProperty('autonomyLevel');
      expect(bot).toHaveProperty('scope');
      expect(bot).toHaveProperty('author');
      expect(bot).toHaveProperty('version');
      expect(bot).toHaveProperty('created');
      expect(bot).toHaveProperty('updated');
      expect(bot).toHaveProperty('performance');
      expect(bot).toHaveProperty('status');
      expect(bot).toHaveProperty('configuration');
      
      // Verify capabilities are valid
      bot.capabilities.forEach(capability => {
        expect([
          'collection', 'analysis', 'persistence', 'correlation',
          'verification', 'reporting', 'monitoring', 'alerting'
        ]).toContain(capability);
      });
      
      // Verify status is valid
      expect(['active', 'inactive', 'maintenance']).toContain(bot.status);
    });
  });
  
  test('should create a valid bot task', () => {
    const botId = 'bot-123';
    const task = createBotTask(
      botId,
      'Test Task',
      'A test OSINT task',
      'example.com',
      ['tool-1', 'tool-2'],
      'high',
      { depth: 3 }
    );
    
    expect(task).toBeDefined();
    expect(task.id).toBe('mock-uuid');
    expect(task.botId).toBe(botId);
    expect(task.name).toBe('Test Task');
    expect(task.description).toBe('A test OSINT task');
    expect(task.target).toBe('example.com');
    expect(task.toolsToUse).toEqual(['tool-1', 'tool-2']);
    expect(task.priority).toBe('high');
    expect(task.parameters).toEqual({ depth: 3 });
    expect(task.status).toBe('queued');
    expect(task.progress).toBe(0);
    expect(task.created).toBeDefined();
    expect(task.scheduledStart).toBeDefined();
    expect(task.maxDuration).toBe(60); // Default
  });
  
  test('should create a bot task with default parameters', () => {
    const botId = 'bot-456';
    const task = createBotTask(
      botId,
      'Simple Task',
      'A simple task',
      'target.com'
    );
    
    expect(task.toolsToUse).toEqual([]);
    expect(task.priority).toBe('medium');
    expect(task.parameters).toEqual({});
  });
  
  test('should have bots with different capabilities', () => {
    const botCapabilities = sampleBots.map(bot => bot.capabilities);
    
    // Check that different bots have different capabilities
    const hasCollectionBot = botCapabilities.some(caps => caps.includes('collection'));
    const hasAnalysisBot = botCapabilities.some(caps => caps.includes('analysis'));
    const hasReportingBot = botCapabilities.some(caps => caps.includes('reporting'));
    
    expect(hasCollectionBot).toBe(true);
    expect(hasAnalysisBot).toBe(true);
    expect(hasReportingBot).toBe(true);
  });
  
  test('should have bots with performance metrics', () => {
    sampleBots.forEach(bot => {
      const perf = bot.performance;
      
      expect(perf.accuracy).toBeGreaterThanOrEqual(0);
      expect(perf.accuracy).toBeLessThanOrEqual(1);
      expect(perf.speed).toBeGreaterThan(0);
      expect(perf.successRate).toBeGreaterThanOrEqual(0);
      expect(perf.successRate).toBeLessThanOrEqual(1);
      expect(perf.intelQualityScore).toBeGreaterThanOrEqual(0);
      expect(perf.intelQualityScore).toBeLessThanOrEqual(1);
      expect(perf.totalOperations).toBeGreaterThanOrEqual(0);
      expect(perf.totalIntelGenerated).toBeGreaterThanOrEqual(0);
      expect(perf.lastEvaluation).toBeDefined();
    });
  });
});
