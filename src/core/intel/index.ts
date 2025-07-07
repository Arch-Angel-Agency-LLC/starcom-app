/**
 * IntelDataCore - Main Index
 * 
 * This file exports all the components of the IntelDataCore system
 * for easy importing by other modules.
 */

// Export types
export * from './types/intelDataModels';

// Export data store
export { intelDataStore } from './store/intelDataStore';

// Export event system
export {
  enhancedEventEmitter,
  EventSubscriptionOptions,
  EventHandler,
  EventFilterFunction
} from './events/enhancedEventEmitter';

// Export storage system
export {
  storageOrchestrator,
  StorageStrategy,
  Transaction,
  TransactionStatus
} from './storage/storageOrchestrator';

export {
  indexedDBAdapter
} from './storage/indexedDBAdapter';

// Export adapters
export { 
  nodeWebAdapter,
  NodeWebNode,
  NodeWebEdge,
  NodeWebGraph,
  NodeWebStats,
  NodeWebFilter,
  NodeWebAdapter
} from './adapters/nodeWebAdapter';

export {
  timelineAdapter,
  TimelineItem,
  TimelineGroup,
  TimelineData,
  TimelineStats,
  TimelineFilter,
  TimelineAdapter
} from './adapters/timelineAdapter';

export {
  caseManagerAdapter,
  CaseItem,
  CaseFilter,
  CaseStats,
  CaseManagerAdapter
} from './adapters/caseManagerAdapter';

// Export hooks
export { useNodeWebData } from './hooks/useNodeWebData';
export { useTimelineData } from './hooks/useTimelineData';
export { useCaseManager } from './hooks/useCaseManager';

// Export utilities
export { 
  generateSampleData
} from './utils/sampleDataGenerator';

export {
  generateSampleTimelineData,
  generateAttackScenario
} from './utils/timelineDataGenerator';

export {
  generateSampleCaseData,
  generateRelatedCaseSeries
} from './utils/caseDataGenerator';

// Import local modules to use in initialization
import { storageOrchestrator } from './storage/storageOrchestrator';

// Convenience initialization function
export async function initializeIntelDataCore(): Promise<void> {
  console.log('Initializing IntelDataCore...');
  
  try {
    // Initialize storage orchestrator
    const storageInitialized = await storageOrchestrator.initialize();
    if (!storageInitialized) {
      console.warn('Storage orchestrator initialization failed, falling back to in-memory only');
    } else {
      console.log('Storage orchestrator initialized successfully');
    }
    
    // Import functions to avoid TS errors
    const { generateSampleData } = await import('./utils/sampleDataGenerator');
    const { generateSampleTimelineData, generateAttackScenario } = await import('./utils/timelineDataGenerator');
    const { generateSampleCaseData, generateRelatedCaseSeries } = await import('./utils/caseDataGenerator');
    
    // In the future, this would initialize storage, load configuration, etc.
    // For now, we just load sample data
    await generateSampleData();
    
    // Initialize sample timeline data
    await generateSampleTimelineData(20);
    
    // Create a sample attack scenario
    await generateAttackScenario();
    
    // Initialize sample case data
    await generateSampleCaseData(15);
    
    // Create a related case series
    await generateRelatedCaseSeries();
    
    console.log('IntelDataCore initialized successfully');
  } catch (error) {
    console.error('Error initializing IntelDataCore:', error);
    throw error;
  }
}
