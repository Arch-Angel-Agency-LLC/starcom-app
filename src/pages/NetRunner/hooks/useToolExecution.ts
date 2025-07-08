/**
 * useToolExecution.ts
 * 
 * Custom hook for executing NetRunner tools.
 * Provides a simple interface for components to use tools and track execution state.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ToolExecutionRequest,
  ToolExecutionResponse,
  ExecutionState,
  ExecutionStatus,
  createExecutionRequest,
  createInitialExecutionState,
  updateExecutionStateFromResponse,
  getToolAdapter
} from '../tools/NetRunnerPowerTools';

interface UseToolExecutionOptions {
  pollingInterval?: number;
  autoExecute?: boolean;
  maxPollingAttempts?: number;
}

interface UseToolExecutionReturn {
  executionState: ExecutionState | null;
  isLoading: boolean;
  error: string | null;
  executeTool: () => Promise<ToolExecutionResponse | null>;
  cancelExecution: () => Promise<boolean>;
  resetExecution: () => void;
}

/**
 * Hook for executing NetRunner tools
 * 
 * @param toolId - The ID of the tool to execute
 * @param parameters - The parameters to pass to the tool
 * @param options - Configuration options for the hook
 */
export const useToolExecution = (
  toolId: string,
  parameters: Record<string, unknown>,
  options: UseToolExecutionOptions = {}
): UseToolExecutionReturn => {
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get default options
  const { 
    pollingInterval = 2000, 
    autoExecute = false,
    maxPollingAttempts = 30
  } = options;
  
  // Use refs to avoid dependency cycles in useCallbacks
  const pollingRef = useRef<{
    timer: NodeJS.Timeout | null;
    attempts: number;
    isPolling: boolean;
  }>({
    timer: null,
    attempts: 0,
    isPolling: false
  });
  
  // Function to execute the tool
  const executeTool = useCallback(async (): Promise<ToolExecutionResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the adapter for this tool
      const adapter = getToolAdapter(toolId);
      if (!adapter) {
        throw new Error(`No adapter registered for tool with ID: ${toolId}`);
      }
      
      // Create initial state
      const initialState = createInitialExecutionState(toolId, parameters);
      setExecutionState(initialState);
      
      // Create execution request
      const request = createExecutionRequest(toolId, parameters);
      
      // Execute the tool
      const response = await adapter.execute(request);
      
      // Update execution state
      const updatedState = updateExecutionStateFromResponse(initialState, response);
      setExecutionState(updatedState);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error executing tool:', errorMessage);
      
      // Update execution state to failed
      if (executionState) {
        setExecutionState({
          ...executionState,
          status: 'failed',
          error: errorMessage,
          endTime: Date.now()
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toolId, parameters, executionState]);
  
  // Start polling for status updates
  const startPolling = useCallback(() => {
    if (
      !executionState || 
      executionState.status !== 'running' ||
      pollingInterval <= 0 ||
      pollingRef.current.isPolling
    ) {
      return;
    }
    
    const adapter = getToolAdapter(toolId);
    if (!adapter) {
      setError(`No adapter registered for tool with ID: ${toolId}`);
      return;
    }
    
    // Reset polling state
    pollingRef.current.attempts = 0;
    pollingRef.current.isPolling = true;
    
    const poll = async () => {
      if (pollingRef.current.attempts >= maxPollingAttempts) {
        setError('Execution timed out');
        setExecutionState(prev => prev ? {
          ...prev,
          status: 'failed',
          error: 'Execution timed out',
          endTime: Date.now()
        } : null);
        pollingRef.current.isPolling = false;
        return;
      }
      
      try {
        // Create a status check request
        const statusRequest = createExecutionRequest(toolId, {
          executionId: executionState.id,
          operation: 'status'
        });
        
        // Get status update
        const response = await adapter.execute(statusRequest);
        
        // Update execution state
        const updatedState = updateExecutionStateFromResponse(executionState, response);
        setExecutionState(updatedState);
        
        // If execution completed or failed, stop polling
        if (updatedState.status === 'completed' || updatedState.status === 'failed') {
          pollingRef.current.isPolling = false;
        } else {
          // Continue polling
          pollingRef.current.attempts++;
          pollingRef.current.timer = setTimeout(poll, pollingInterval);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Error polling tool execution status:', errorMessage);
        pollingRef.current.isPolling = false;
      }
    };
    
    // Start first poll
    pollingRef.current.timer = setTimeout(poll, pollingInterval);
    
  }, [executionState, toolId, pollingInterval, maxPollingAttempts]);
  
  // Auto-execute if option is set
  useEffect(() => {
    if (autoExecute && !executionState && !isLoading) {
      executeTool().then(response => {
        if (response?.status === 'in_progress') {
          startPolling();
        }
      });
    }
  }, [autoExecute, executeTool, executionState, isLoading, startPolling]);
  
  // Start polling when execution state changes to running
  useEffect(() => {
    if (executionState?.status === 'running' && !pollingRef.current.isPolling) {
      startPolling();
    }
    
    // Clean up polling on unmount
    return () => {
      if (pollingRef.current.timer) {
        clearTimeout(pollingRef.current.timer);
        pollingRef.current.timer = null;
      }
      pollingRef.current.isPolling = false;
    };
  }, [executionState, startPolling]);
  
  // Function to cancel execution
  const cancelExecution = useCallback(async (): Promise<boolean> => {
    if (!executionState || executionState.status !== 'running') {
      return false;
    }
    
    // Clear any polling
    if (pollingRef.current.timer) {
      clearTimeout(pollingRef.current.timer);
      pollingRef.current.timer = null;
    }
    pollingRef.current.isPolling = false;
    
    try {
      const adapter = getToolAdapter(toolId);
      if (!adapter) {
        throw new Error(`No adapter registered for tool with ID: ${toolId}`);
      }
      
      // Create cancel request
      const cancelRequest = createExecutionRequest(toolId, {
        executionId: executionState.id,
        operation: 'cancel'
      });
      
      // Execute cancel request
      const response = await adapter.execute(cancelRequest);
      
      // Update execution state
      const updatedState = updateExecutionStateFromResponse(executionState, response);
      setExecutionState(updatedState);
      
      return updatedState.status === 'failed'; // If status is 'failed', cancellation was successful
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error cancelling tool execution:', errorMessage);
      return false;
    }
  }, [executionState, toolId]);
  
  // Reset function to clear execution state
  const resetExecution = useCallback(() => {
    // Clear any polling
    if (pollingRef.current.timer) {
      clearTimeout(pollingRef.current.timer);
      pollingRef.current.timer = null;
    }
    pollingRef.current.isPolling = false;
    
    setExecutionState(null);
    setIsLoading(false);
    setError(null);
  }, []);
  
  return {
    executionState,
    isLoading,
    error,
    executeTool,
    cancelExecution,
    resetExecution
  };
};

export default useToolExecution;
