import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  registerAdapter,
  getAdapter,
  getAllAdapters
} from '../../../../src/pages/NetRunner/tools/adapters/AdapterRegistry';
import { ToolAdapter } from '../../../../src/pages/NetRunner/tools/NetRunnerPowerTools';

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

describe('AdapterRegistry', () => {
  // Setup mock console methods to track logs
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Reset mocks before each test
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    
    // Clear all registered adapters (we'll mock this by clearing registration before each test)
    // Note: This assumes the registry is using a Map internally which is reset for each test
  });
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  test('should register an adapter', () => {
    const mockAdapter = new MockToolAdapter('mock-tool-1', 'Mock Tool 1');
    
    registerAdapter(mockAdapter);
    
    const retrievedAdapter = getAdapter('mock-tool-1');
    expect(retrievedAdapter).toBeDefined();
    expect(retrievedAdapter).toBe(mockAdapter);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Registered adapter'));
  });

  test('should warn when registering an adapter with an existing ID', () => {
    const mockAdapter1 = new MockToolAdapter('mock-tool-2', 'Mock Tool 2');
    const mockAdapter2 = new MockToolAdapter('mock-tool-2', 'Mock Tool 2 Duplicate');
    
    registerAdapter(mockAdapter1);
    registerAdapter(mockAdapter2);
    
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('already registered'));
    
    // Should still replace the adapter
    const retrievedAdapter = getAdapter('mock-tool-2');
    expect(retrievedAdapter).toBe(mockAdapter2);
  });

  test('should return undefined for non-existent adapter', () => {
    const retrievedAdapter = getAdapter('non-existent-adapter');
    expect(retrievedAdapter).toBeUndefined();
  });

  test('should get all registered adapters', () => {
    const mockAdapter1 = new MockToolAdapter('mock-tool-3', 'Mock Tool 3');
    const mockAdapter2 = new MockToolAdapter('mock-tool-4', 'Mock Tool 4');
    
    registerAdapter(mockAdapter1);
    registerAdapter(mockAdapter2);
    
    const allAdapters = getAllAdapters();
    expect(allAdapters).toHaveLength(2);
    expect(allAdapters).toContain(mockAdapter1);
    expect(allAdapters).toContain(mockAdapter2);
  });
});

describe('AdapterRegistry', () => {
  // Setup mock console methods to track logs
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Reset mocks before each test
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    
    // Clear adapter registry by directly calling initialize with an empty array
    // This is a hack since we don't have a clear method
    (initializeAdapters as any).__resetForTesting?.();
  });
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  test('should register an adapter', () => {
    const mockAdapter = new MockToolAdapter('mock-tool-1', 'Mock Tool 1');
    
    registerAdapter(mockAdapter);
    
    const retrievedAdapter = getAdapter('mock-tool-1');
    expect(retrievedAdapter).toBeDefined();
    expect(retrievedAdapter).toBe(mockAdapter);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Registered adapter'));
  });

  test('should warn when registering an adapter with an existing ID', () => {
    const mockAdapter1 = new MockToolAdapter('mock-tool-2', 'Mock Tool 2');
    const mockAdapter2 = new MockToolAdapter('mock-tool-2', 'Mock Tool 2 Duplicate');
    
    registerAdapter(mockAdapter1);
    registerAdapter(mockAdapter2);
    
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('already registered'));
    
    // Should still replace the adapter
    const retrievedAdapter = getAdapter('mock-tool-2');
    expect(retrievedAdapter).toBe(mockAdapter2);
  });

  test('should return undefined for non-existent adapter', () => {
    const retrievedAdapter = getAdapter('non-existent-adapter');
    expect(retrievedAdapter).toBeUndefined();
  });

  test('should get all registered adapters', () => {
    const mockAdapter1 = new MockToolAdapter('mock-tool-3', 'Mock Tool 3');
    const mockAdapter2 = new MockToolAdapter('mock-tool-4', 'Mock Tool 4');
    
    registerAdapter(mockAdapter1);
    registerAdapter(mockAdapter2);
    
    const allAdapters = getAllAdapters();
    expect(allAdapters).toHaveLength(2);
    expect(allAdapters).toContain(mockAdapter1);
    expect(allAdapters).toContain(mockAdapter2);
  });
});
