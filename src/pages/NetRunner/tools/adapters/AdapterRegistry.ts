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
  // Create instances of all adapters
  const adapters: ToolAdapter[] = [
    new ShodanAdapter(),
    new TheHarvesterAdapter(),
    new IntelAnalyzerAdapter(),
    // Add more adapter instances here as they're implemented
  ];
  
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
export { ShodanAdapter, TheHarvesterAdapter, IntelAnalyzerAdapter };
