/**
 * FeatureDetection.ts
 * 
 * Defines interfaces for feature detection and capability handling
 * in the chat adapter system.
 */

import { ChatProviderCapabilities } from '../types/ProtocolTypes';

/**
 * Interface for feature detection in chat providers.
 */
export interface FeatureDetectionInterface {
  /**
   * Checks if a specific feature is supported.
   * @param feature The feature to check
   * @returns True if the feature is supported, false otherwise
   */
  hasFeature(feature: string): boolean;
  
  /**
   * Gets all supported features.
   * @returns Array of supported feature names
   */
  getFeatures(): string[];
  
  /**
   * Gets detailed capabilities of the provider.
   * @returns Capabilities object
   */
  getCapabilities(): ChatProviderCapabilities;
  
  /**
   * Checks if a specific capability is supported.
   * @param capability The capability to check
   * @returns True if the capability is supported, false otherwise
   */
  hasCapability(capability: string): boolean;
  
  /**
   * Checks if the provider supports a set of required capabilities.
   * @param capabilities Array of required capabilities
   * @returns Object containing the result of the check
   */
  supportsCapabilities(capabilities: string[]): CapabilityCheckResult;
  
  /**
   * Registers a handler for the case when a feature is not supported.
   * @param handler The handler function
   * @returns A function to unregister the handler
   */
  onUnsupportedFeature(
    handler: (featureName: string, context: Record<string, unknown>) => void
  ): () => void;
}

/**
 * Result of a capability check operation.
 */
export interface CapabilityCheckResult {
  supported: boolean;          // Whether all capabilities are supported
  missingCapabilities: string[]; // List of missing capabilities
  matchScore: number;          // Percentage of capabilities supported (0-1)
  context?: Record<string, unknown>; // Additional context
}

/**
 * Function to handle when a feature is not supported.
 */
export type UnsupportedFeatureHandler = (
  featureName: string,
  fallbackBehavior?: 'throw' | 'warn' | 'silent',
  context?: Record<string, unknown>
) => void;

/**
 * Options for feature detection.
 */
export interface FeatureDetectionOptions {
  initialFeatures?: string[];
  fallbackBehavior?: 'throw' | 'warn' | 'silent';
  capabilities?: Partial<ChatProviderCapabilities>;
}

/**
 * Creates a feature detection handler that throws an error when an unsupported feature is requested.
 * @param providerName The name of the provider for error messages
 * @returns The feature detection handler
 */
export function createThrowingHandler(providerName: string): UnsupportedFeatureHandler {
  return (featureName: string, _, context?: Record<string, unknown>) => {
    throw new Error(
      `Unsupported feature: ${featureName} is not supported by the ${providerName} provider.` +
      (context ? ` Context: ${JSON.stringify(context)}` : '')
    );
  };
}

/**
 * Creates a feature detection handler that logs a warning when an unsupported feature is requested.
 * @param providerName The name of the provider for warning messages
 * @returns The feature detection handler
 */
export function createWarningHandler(providerName: string): UnsupportedFeatureHandler {
  return (featureName: string, _, context?: Record<string, unknown>) => {
    console.warn(
      `Unsupported feature: ${featureName} is not supported by the ${providerName} provider.` +
      (context ? ` Context: ${JSON.stringify(context)}` : '')
    );
  };
}

/**
 * Creates a feature detection handler that silently ignores unsupported features.
 * @returns The feature detection handler
 */
export function createSilentHandler(): UnsupportedFeatureHandler {
  return () => { /* No-op */ };
}
