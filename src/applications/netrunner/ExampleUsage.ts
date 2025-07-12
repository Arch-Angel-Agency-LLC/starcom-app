/**
 * NetRunner Services Usage Example
 * 
 * This file demonstrates how to use the new NetRunner logging and error handling
 * services in the consolidation implementation.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { LoggerFactory, OperationLogger } from './services/logging';
import { NetRunnerErrorHandler, ErrorFactory } from './services/error';
import { OSINTDataItem, ModelTransformers } from './models';

/**
 * Example service demonstrating the new NetRunner framework usage
 */
export class NetRunnerExampleService {
  private logger = LoggerFactory.getLogger('NetRunner:ExampleService');
  private errorHandler = new NetRunnerErrorHandler();

  /**
   * Example OSINT data collection operation
   */
  async collectOSINTData(query: string, userId: string): Promise<OSINTDataItem[]> {
    // Create operation logger for tracking
    const operationLogger = new OperationLogger(
      this.logger,
      'osint_data_collection',
      { query, userId }
    );

    operationLogger.start('Starting OSINT data collection');

    try {
      // Validate input
      if (!query || query.trim().length === 0) {
        throw ErrorFactory.invalidSearchQuery(
          query,
          'Query cannot be empty',
          operationLogger.getCorrelationId()
        );
      }

      operationLogger.step('validation', 'Input validation completed');

      // Simulate data collection (this would be real tool integration in Phase 2)
      operationLogger.step('collection', 'Executing OSINT tools');
      
      const mockData = await this.simulateDataCollection(query);
      
      // Transform raw data to structured OSINT items
      const osintItems = mockData.map(data => 
        ModelTransformers.createOSINTDataItem({
          type: 'identity',
          sourceType: 'public_web',
          classification: 'public',
          sourceName: 'Example Tool',
          sourceUrl: 'https://example.com',
          tool: 'ExampleTool',
          content: data,
          collectedBy: userId,
          correlationId: operationLogger.getCorrelationId()
        })
      );

      operationLogger.success('OSINT data collection completed', {
        itemsCollected: osintItems.length
      });

      return osintItems;

    } catch (error) {
      // Handle error using NetRunner error handler
      const context = {
        operation: 'osint_data_collection',
        component: 'NetRunner:ExampleService',
        user: userId,
        correlationId: operationLogger.getCorrelationId(),
        metadata: { query }
      };

      if (error instanceof Error) {
        await this.errorHandler.handleGenericError(error, context);
      }

      operationLogger.failure(error as Error, 'OSINT data collection failed');
      throw error;
    }
  }

  /**
   * Example search operation with comprehensive error handling
   */
  async searchWithRetry(query: string, maxRetries = 3): Promise<OSINTDataItem[]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.logger.info(`Search attempt ${attempt + 1}/${maxRetries}`, { query });
        
        return await this.collectOSINTData(query, 'system');
        
      } catch (error) {
        lastError = error as Error;
        
        const context = {
          operation: 'search_with_retry',
          component: 'NetRunner:ExampleService',
          retryCount: attempt,
          maxRetries,
          metadata: { query }
        };

        if (error instanceof Error) {
          const result = await this.errorHandler.handleGenericError(error, context);
          
          if (!result.shouldRetry) {
            this.logger.warn('Error is not recoverable, stopping retries', {
              attempt: attempt + 1,
              maxRetries
            });
            break;
          }
          
          if (result.retryDelay) {
            this.logger.info(`Waiting ${result.retryDelay}ms before retry`, {
              attempt: attempt + 1
            });
            await new Promise(resolve => setTimeout(resolve, result.retryDelay));
          }
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Simulate data collection (would be replaced with real tool integration)
   */
  private async simulateDataCollection(query: string): Promise<Record<string, unknown>[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate random failure for demonstration
    if (Math.random() < 0.3) {
      throw ErrorFactory.createToolError(
        'Simulated tool execution failure',
        'NET-TOOL-001',
        {
          component: 'NetRunner:ExampleService',
          details: { query, reason: 'Random simulation failure' }
        }
      );
    }

    return [
      {
        title: `Result for: ${query}`,
        description: 'Mock OSINT data collected successfully',
        timestamp: new Date().toISOString(),
        source: 'simulation'
      }
    ];
  }

  /**
   * Example of logging configuration
   */
  configureLogging(): void {
    // Set debug level for development
    LoggerFactory.setDefaultLogLevel('debug');
    
    this.logger.info('NetRunner example service initialized', {
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Example of error recovery strategy registration
   */
  setupErrorRecovery(): void {
    // Register custom recovery strategy for tool errors
    this.errorHandler.registerRecoveryStrategy('TOOL', {
      canRecover: (error) => error.code === 'NET-TOOL-001',
      recover: async (error, context) => {
        this.logger.info('Attempting tool error recovery', {
          errorCode: error.code,
          operation: context.operation
        });
        
        // Implement recovery logic here
        // For example: retry with different parameters, use fallback tool, etc.
        
        return false; // Return true if recovery successful
      }
    });
  }
}

// Example usage:
/*
const exampleService = new NetRunnerExampleService();
exampleService.configureLogging();
exampleService.setupErrorRecovery();

// Perform OSINT data collection
const results = await exampleService.collectOSINTData('example query', 'user123');
console.log('Collected OSINT data:', results);

// Perform search with retry logic
const searchResults = await exampleService.searchWithRetry('complex query');
console.log('Search results:', searchResults);
*/
