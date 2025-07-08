import { describe, test, expect } from 'vitest';
import { 
  netRunnerPowerTools,
  findToolById,
  findToolsByCategory,
  findToolsByIntelType,
  ToolCategory,
  IntelType,
  NetRunnerTool
} from '../../../src/pages/NetRunner/tools/NetRunnerPowerTools';

describe('NetRunnerPowerTools', () => {
  test('should have a non-empty list of tools', () => {
    expect(netRunnerPowerTools).toBeDefined();
    expect(Array.isArray(netRunnerPowerTools)).toBe(true);
    expect(netRunnerPowerTools.length).toBeGreaterThan(0);
  });

  test('should have tools with all required properties', () => {
    netRunnerPowerTools.forEach(tool => {
      expect(tool).toHaveProperty('id');
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('category');
      expect(tool).toHaveProperty('capabilities');
      expect(tool).toHaveProperty('premium');
      expect(tool).toHaveProperty('automationCompatible');
      expect(tool).toHaveProperty('source');
      expect(tool).toHaveProperty('license');
      expect(tool).toHaveProperty('intelTypes');
      
      // Array properties should be arrays
      expect(Array.isArray(tool.capabilities)).toBe(true);
      expect(Array.isArray(tool.intelTypes)).toBe(true);
      
      // Check that intelTypes values are valid
      tool.intelTypes.forEach(intelType => {
        expect([
          'identity', 'network', 'financial', 'geospatial', 'social',
          'infrastructure', 'vulnerability', 'darkweb', 'threat', 'temporal'
        ]).toContain(intelType);
      });
      
      // Check that category is valid
      expect([
        'discovery', 'scraping', 'aggregation', 'analysis',
        'verification', 'visualization', 'automation'
      ]).toContain(tool.category);
    });
  });

  test('findToolById should return the correct tool', () => {
    // Get first tool for testing
    const testTool = netRunnerPowerTools[0];
    const foundTool = findToolById(testTool.id);
    
    expect(foundTool).toBeDefined();
    expect(foundTool?.id).toBe(testTool.id);
    expect(foundTool?.name).toBe(testTool.name);
    
    // Non-existent ID should return undefined
    expect(findToolById('non-existent-id')).toBeUndefined();
  });

  test('findToolsByCategory should return tools of specified category', () => {
    // Get tools for each category
    const categories: ToolCategory[] = [
      'discovery', 'scraping', 'aggregation', 'analysis',
      'verification', 'visualization', 'automation'
    ];
    
    categories.forEach(category => {
      const tools = findToolsByCategory(category);
      
      // Should return an array
      expect(Array.isArray(tools)).toBe(true);
      
      // Each tool should have the matching category
      tools.forEach(tool => {
        expect(tool.category).toBe(category);
      });
      
      // Should match manual filter
      const manualFilter = netRunnerPowerTools.filter(tool => tool.category === category);
      expect(tools.length).toBe(manualFilter.length);
    });
  });

  test('findToolsByIntelType should return tools with specified intel type', () => {
    // Get tools for each intel type
    const intelTypes: IntelType[] = [
      'identity', 'network', 'financial', 'geospatial', 'social',
      'infrastructure', 'vulnerability', 'darkweb', 'threat', 'temporal'
    ];
    
    intelTypes.forEach(intelType => {
      const tools = findToolsByIntelType(intelType);
      
      // Should return an array
      expect(Array.isArray(tools)).toBe(true);
      
      // Each tool should support the intel type
      tools.forEach(tool => {
        expect(tool.intelTypes).toContain(intelType);
      });
      
      // Should match manual filter
      const manualFilter = netRunnerPowerTools.filter(tool => tool.intelTypes.includes(intelType));
      expect(tools.length).toBe(manualFilter.length);
    });
  });
});
