/**
 * AdapterRegistry.ts
 * 
 * Registry for all NetRunner tool adapters.
 * This file manages the registration and access to all tool adapters.
 */

import { ToolAdapter } from '../NetRunnerPowerTools';
import { ShodanAdapter } from './ShodanAdapter';
import { TheHarvesterAdapter } from './TheHarvesterAdapter';
import { IntelAnalyzerAdapter } from './IntelAnalyzerAdapter';
import { apiConfigManager } from '../../../../shared/config/ApiConfigManager';

// Production adapters - available but need interface compatibility fixes
// import { ShodanAdapter as ShodanAdapterProd } from './ShodanAdapterProd';
// import { VirusTotalAdapter as VirusTotalAdapterProd } from './VirusTotalAdapterProd';
// import { CensysAdapter as CensysAdapterProd } from './CensysAdapterProd';
// import { TheHarvesterAdapterProd } from './TheHarvesterAdapterProd';

// Environment-based adapter selection with unified config
const USE_PRODUCTION_ADAPTERS = apiConfigManager.shouldUseRealApis() ||
                                (process.env.NODE_ENV === 'production' && 
                                 process.env.NETRUNNER_USE_PROD_ADAPTERS === 'true');

// Map of tool IDs to their adapters
const adapterRegistry = new Map<string, ToolAdapter>();

// Register a tool adapter
export const registerAdapter = (adapter: ToolAdapter): void => {
  const toolId = adapter.getToolId();
  
  if (adapterRegistry.has(toolId)) {
    console.warn(`Adapter for tool ID ${toolId} is already registered. Overwriting.`);
  }
  
  adapterRegistry.set(toolId, adapter);
  console.log(`Registered adapter for tool: ${adapter.getToolSchema().name} (ID: ${toolId})`);
};

// Get an adapter by tool ID
export const getAdapter = (toolId: string): ToolAdapter | undefined => {
  return adapterRegistry.get(toolId);
};

// Get all registered adapters
export const getAllAdapters = (): ToolAdapter[] => {
  return Array.from(adapterRegistry.values());
};

// Initialize all adapters
export const initializeAdapters = async (): Promise<void> => {
  // Select adapters based on configuration and availability
  const adapters: ToolAdapter[] = [];
  
  // Add Shodan adapter - use production version if enabled and API key available
  if (USE_PRODUCTION_ADAPTERS && apiConfigManager.isProviderEnabled('shodan')) {
    try {
      // Note: Production adapters need compatibility fixes - using mock for now
      console.log('Production Shodan adapter available but using mock version for compatibility');
      adapters.push(new ShodanAdapter());
    } catch (error) {
      console.warn('Failed to load production Shodan adapter, falling back to mock', error);
      adapters.push(new ShodanAdapter());
    }
  } else {
    adapters.push(new ShodanAdapter());
  }

  // Add other adapters (production versions available but need compatibility fixes)
  adapters.push(new TheHarvesterAdapter());
  adapters.push(new IntelAnalyzerAdapter());
  
  console.log(`Initializing ${USE_PRODUCTION_ADAPTERS ? 'production' : 'mock'} adapters`);
  console.log(`API Config: Real APIs ${apiConfigManager.shouldUseRealApis() ? 'enabled' : 'disabled'}`);
  
  // Initialize and register each adapter
  for (const adapter of adapters) {
    try {
      const success = await adapter.initialize();
      if (success) {
        registerAdapter(adapter);
      } else {
        console.error(`Failed to initialize adapter: ${adapter.getToolSchema().name}`);
      }
    } catch (error) {
      console.error(`Error initializing adapter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log(`Initialized ${adapterRegistry.size} tool adapters out of ${adapters.length} attempted`);
};

// Export individual adapters for direct access
export { 
  ShodanAdapter, 
  TheHarvesterAdapter, 
  IntelAnalyzerAdapter 
};

// Export registry access functions that were already defined above
export const getAvailableAdapters = getAllAdapters;
export const hasAdapter = (toolId: string) => adapterRegistry.has(toolId);
