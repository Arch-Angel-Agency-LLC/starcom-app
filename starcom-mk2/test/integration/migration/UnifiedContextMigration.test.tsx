/**
 * Unified Global Command Context Migration Test
 * 
 * Tests that verify the unified context migration is working correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UnifiedGlobalCommandProvider } from '../../../src/context/UnifiedGlobalCommandContext';
import { useGlobalCommand } from '../../../src/hooks/useUnifiedGlobalCommand';

// Test component that uses the unified context
const TestComponent: React.FC = () => {
  const { state, features } = useGlobalCommand();
  
  return (
    <div>
      <div data-testid="operation-mode">Mode: {state.operationMode}</div>
      <div data-testid="features-enabled">Features: {features.enhanced ? 'Enhanced' : 'Basic'}</div>
      <div data-testid="layer-count">Layers: {state.activeLayers.length}</div>
    </div>
  );
};

describe('Unified Global Command Context Migration', () => {
  it('should provide unified context with default state', () => {
    render(
      <UnifiedGlobalCommandProvider>
        <TestComponent />
      </UnifiedGlobalCommandProvider>
    );

    expect(screen.getByTestId('operation-mode')).toHaveTextContent('Mode: CYBER');
    expect(screen.getByTestId('features-enabled')).toHaveTextContent('Features:');
    expect(screen.getByTestId('layer-count')).toHaveTextContent('Layers: 0');
  });

  it('should render without throwing errors', () => {
    expect(() => {
      render(
        <UnifiedGlobalCommandProvider>
          <TestComponent />
        </UnifiedGlobalCommandProvider>
      );
    }).not.toThrow();
  });

  it('should provide context methods', () => {
    const TestMethodsComponent: React.FC = () => {
      const { setOperationMode, addDataLayer } = useGlobalCommand();
      
      return (
        <div>
          <div data-testid="has-methods">
            Methods: {typeof setOperationMode === 'function' && typeof addDataLayer === 'function' ? 'Available' : 'Missing'}
          </div>
        </div>
      );
    };

    render(
      <UnifiedGlobalCommandProvider>
        <TestMethodsComponent />
      </UnifiedGlobalCommandProvider>
    );

    expect(screen.getByTestId('has-methods')).toHaveTextContent('Methods: Available');
  });
});
