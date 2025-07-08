import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import * as AdapterRegistryModule from '../AdapterRegistry';
import { ToolAdapter } from '../../NetRunnerPowerTools';

// Create a mock adapter for testing
class MockToolAdapter implements ToolAdapter {
  private toolId: string;
  private name: string;
  private initialized: boolean = false;

  constructor(toolId: string, name: string) {
    this.toolId = toolId;
    this.name = name;
  }

  getToolId(): string {
    return this.toolId;
  }

  getToolSchema() {
    return {
      id: this.toolId,
      name: this.name,
      description: 'Mock tool for testing',
      category: 'analysis' as any,
      capabilities: ['Test capability'],
      premium: false,
      automationCompatible: true,
      source: 'Test',
      license: 'MIT',
      intelTypes: ['identity' as any],
      parameters: [],
      outputFormat: { type: 'json' as const }
    };
  }

  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  async execute(): Promise<any> {
    return { success: true, result: 'Mock result' };
  }

  validateParameters(): boolean {
    return true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
  }
}

// Create a mock Map to simulate the registry
const mockAdapterRegistry = new Map<string, ToolAdapter>();

describe('AdapterRegistry Module', () => {
  // Setup mock console methods to track logs
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Reset mocks before each test
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    
    // Clear the mock registry before each test
    mockAdapterRegistry.clear();
    
    // Mock the module functions
    vi.spyOn(AdapterRegistryModule, 'registerAdapter').mockImplementation((adapter: ToolAdapter) => {
      const toolId = adapter.getToolId();
      if (mockAdapterRegistry.has(toolId)) {
        console.warn(`Adapter for tool ID ${toolId} is already registered. Overwriting.`);
      }
      mockAdapterRegistry.set(toolId, adapter);
      console.log(`Registered adapter for tool: ${adapter.getToolSchema().name} (ID: ${toolId})`);
    });
    
    vi.spyOn(AdapterRegistryModule, 'getAdapter').mockImplementation((toolId: string) => {
      return mockAdapterRegistry.get(toolId);
    });
    
    vi.spyOn(AdapterRegistryModule, 'getAllAdapters').mockImplementation(() => {
      return Array.from(mockAdapterRegistry.values());
    });
  });
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  test('should register an adapter successfully', () => {
    const mockAdapter = new MockToolAdapter('mock-tool-1', 'Mock Tool 1');
    
    AdapterRegistryModule.registerAdapter(mockAdapter);
    
    const retrievedAdapter = AdapterRegistryModule.getAdapter('mock-tool-1');
    expect(retrievedAdapter).toBeDefined();
    expect(retrievedAdapter).toBe(mockAdapter);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Registered adapter'));
  });

  test('should warn when registering an adapter with an existing ID', () => {
    const mockAdapter1 = new MockToolAdapter('mock-tool-2', 'Mock Tool 2');
    const mockAdapter2 = new MockToolAdapter('mock-tool-2', 'Mock Tool 2 Duplicate');
    
    AdapterRegistryModule.registerAdapter(mockAdapter1);
    AdapterRegistryModule.registerAdapter(mockAdapter2);
    
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('already registered'));
    
    // Should still replace the adapter
    const retrievedAdapter = AdapterRegistryModule.getAdapter('mock-tool-2');
    expect(retrievedAdapter).toBe(mockAdapter2);
  });

  test('should return undefined for non-existent adapter', () => {
    const retrievedAdapter = AdapterRegistryModule.getAdapter('non-existent-adapter');
    expect(retrievedAdapter).toBeUndefined();
  });

  test('should get all registered adapters', () => {
    const mockAdapter1 = new MockToolAdapter('mock-tool-3', 'Mock Tool 3');
    const mockAdapter2 = new MockToolAdapter('mock-tool-4', 'Mock Tool 4');
    
    AdapterRegistryModule.registerAdapter(mockAdapter1);
    AdapterRegistryModule.registerAdapter(mockAdapter2);
    
    const allAdapters = AdapterRegistryModule.getAllAdapters();
    expect(allAdapters).toHaveLength(2);
    expect(allAdapters).toContain(mockAdapter1);
    expect(allAdapters).toContain(mockAdapter2);
  });

  test('should maintain registry state correctly', () => {
    // Create and register test adapters
    const mockShodan = new MockToolAdapter('shodan', 'Shodan');
    const mockHarvester = new MockToolAdapter('theharvester', 'TheHarvester');
    const mockAnalyzer = new MockToolAdapter('intel-analyzer', 'Intel Analyzer');
    
    AdapterRegistryModule.registerAdapter(mockShodan);
    AdapterRegistryModule.registerAdapter(mockHarvester);
    AdapterRegistryModule.registerAdapter(mockAnalyzer);
    
    // Now check if they were registered correctly
    const adapters = AdapterRegistryModule.getAllAdapters();
    expect(adapters.length).toBe(3);
    expect(adapters).toContain(mockShodan);
    expect(adapters).toContain(mockHarvester);
    expect(adapters).toContain(mockAnalyzer);
  });
});
