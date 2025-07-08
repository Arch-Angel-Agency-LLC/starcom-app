import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useToolExecution } from '../../../../src/pages/NetRunner/hooks/useToolExecution';

// Mock the tool adapter function
vi.mock('../../../../src/pages/NetRunner/tools/NetRunnerPowerTools', () => ({
  getToolAdapter: vi.fn(() => ({
    execute: vi.fn()
  }))
}));

describe('useToolExecution', () => {
  const mockToolId = 'test-tool-id';
  const mockParameters = { query: 'test query' };
  
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  test('should initialize with default state', () => {
    const { result } = renderHook(() => useToolExecution(mockToolId, mockParameters));
    
    expect(result.current.executionState).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  test('should execute a tool and update state', async () => {
    // Mock successful execution
    const mockResponse = {
      requestId: 'test-request-id',
      status: 'completed',
      result: { data: 'Test result data' },
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      executionTime: 0.5
    };
    
    const { getToolAdapter } = require('../../../../src/pages/NetRunner/tools/NetRunnerPowerTools');
    getToolAdapter.mockReturnValue({
      execute: vi.fn().mockResolvedValue(mockResponse)
    });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useToolExecution(mockToolId, mockParameters)
    );
    
    act(() => {
      result.current.executeTool();
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.executionState).toBeDefined();
    expect(result.current.executionState?.status).toBe('completed');
    expect(result.current.executionState?.result).toEqual({ data: 'Test result data' });
    expect(result.current.error).toBeNull();
    
    // Verify the tool adapter was called with correct parameters
    expect(getToolAdapter).toHaveBeenCalledWith(mockToolId);
    expect(getToolAdapter().execute).toHaveBeenCalledWith(expect.objectContaining({
      toolId: mockToolId,
      parameters: mockParameters
    }));
  });
  
  test('should handle execution errors', async () => {
    // Mock failed execution
    const { getToolAdapter } = require('../../../../src/pages/NetRunner/tools/NetRunnerPowerTools');
    getToolAdapter.mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error('Execution failed'))
    });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useToolExecution(mockToolId, mockParameters)
    );
    
    act(() => {
      result.current.executeTool();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Execution failed');
  });
  
  test('should reset execution state', async () => {
    // Mock successful execution first
    const mockResponse = {
      requestId: 'test-request-id',
      status: 'completed',
      result: { data: 'Test result data' },
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      executionTime: 0.5
    };
    
    const { getToolAdapter } = require('../../../../src/pages/NetRunner/tools/NetRunnerPowerTools');
    getToolAdapter.mockReturnValue({
      execute: vi.fn().mockResolvedValue(mockResponse)
    });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useToolExecution(mockToolId, mockParameters)
    );
    
    // Execute the tool
    act(() => {
      result.current.executeTool();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.executionState).toBeDefined();
    
    // Reset the execution state
    act(() => {
      result.current.resetExecution();
    });
    
    expect(result.current.executionState).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  test('should cancel execution', async () => {
    const mockExecute = vi.fn();
    const mockCancel = vi.fn().mockResolvedValue(true);
    
    const { getToolAdapter } = require('../../../../src/pages/NetRunner/tools/NetRunnerPowerTools');
    getToolAdapter.mockReturnValue({
      execute: mockExecute,
      cancelExecution: mockCancel
    });
    
    const { result } = renderHook(() => 
      useToolExecution(mockToolId, mockParameters)
    );
    
    // Cancel execution
    await act(async () => {
      await result.current.cancelExecution();
    });
    
    expect(mockCancel).toHaveBeenCalled();
  });
  
  test('should auto-execute if autoExecute option is true', async () => {
    const mockResponse = {
      requestId: 'test-request-id',
      status: 'completed',
      result: { data: 'Test result data' },
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      executionTime: 0.5
    };
    
    const { getToolAdapter } = require('../../../../src/pages/NetRunner/tools/NetRunnerPowerTools');
    getToolAdapter.mockReturnValue({
      execute: vi.fn().mockResolvedValue(mockResponse)
    });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useToolExecution(mockToolId, mockParameters, { autoExecute: true })
    );
    
    // Should start loading immediately due to autoExecute
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.executionState).toBeDefined();
    expect(result.current.executionState?.status).toBe('completed');
  });
});
