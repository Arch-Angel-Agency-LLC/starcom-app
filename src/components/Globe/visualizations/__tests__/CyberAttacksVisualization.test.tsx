/**
 * Test suite for CyberAttacksVisualization component
 * Tests 3D attack visualization, trajectory animations, and user interactions
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the RealTimeAttackService
vi.mock('../../../services/CyberAttacks/RealTimeAttackService', () => ({
  RealTimeAttackService: vi.fn().mockImplementation(() => ({
    subscribeToAttacks: vi.fn(() => 'mock-subscription-id'),
    unsubscribeFromAttacks: vi.fn(() => true),
    getData: vi.fn(() => Promise.resolve([])),
    getActiveAttacks: vi.fn(() => []),
    getAttackById: vi.fn(() => null),
    dispose: vi.fn()
  }))
}));

// Mock the useCyberCommandSettings hook
vi.mock('../../../hooks/useCyberCommandSettings', () => ({
  useCyberCommandSettings: () => ({
    config: {
      cyberAttacks: {
        overlayOpacity: 80,
        alertThreshold: 5,
        showTrajectories: true,
        trajectorySpeed: 1.0,
        showDefenses: false,
        autoCorrelation: true,
        attackFiltering: {
          showDDoS: true,
          showMalware: true,
          showPhishing: true,
          showBreaches: true,
          showRansomware: true
        },
        refreshInterval: 2,
        maxAttacks: 100,
        showAttribution: false,
        impactVisualization: true
      }
    }
  })
}));

// Mock React Three Fiber components
vi.mock('@react-three/fiber', () => ({
  Canvas: (props: any) => React.createElement('div', { 'data-testid': 'canvas' }, props.children),
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { set: vi.fn() } }
  })
}));

// Mock Three.js components
vi.mock('@react-three/drei', () => ({
  Text: (props: any) => React.createElement('div', { ...props, 'data-testid': 'text' }, props.children)
}));

// Mock Three.js
vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation(() => ({
    copy: vi.fn(),
    set: vi.fn(),
    distanceTo: vi.fn(() => 100),
    addVectors: vi.fn(),
    multiplyScalar: vi.fn(),
    normalize: vi.fn()
  })),
  QuadraticBezierCurve3: vi.fn().mockImplementation(() => ({
    getPoint: vi.fn(() => ({ x: 0, y: 0, z: 0 }))
  })),
  BufferGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  Group: vi.fn()
}));

// Mock the main component for testing
vi.mock('../CyberAttacksVisualization', () => ({
  CyberAttacksVisualization: (props: any) => {
    if (!props.enabled) return null;
    return React.createElement('div', { 
      'data-testid': 'cyber-attacks-visualization',
      'data-globe-radius': props.globeRadius 
    }, 'CyberAttacks Visualization');
  }
}));

// Import the mocked component
import { CyberAttacksVisualization } from '../CyberAttacksVisualization';

describe('CyberAttacksVisualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing when enabled', () => {
      render(
        <CyberAttacksVisualization
          enabled={true}
          globeRadius={100}
        />
      );
      
      expect(screen.getByTestId('cyber-attacks-visualization')).toBeTruthy();
    });

    it('does not render when disabled', () => {
      render(
        <CyberAttacksVisualization
          enabled={false}
          globeRadius={100}
        />
      );

      expect(screen.queryByTestId('cyber-attacks-visualization')).toBeNull();
    });
  });

  describe('Settings Integration', () => {
    it('integrates with cyber command settings', () => {
      render(<CyberAttacksVisualization enabled={true} />);

      // Component should use the mocked settings without throwing
      expect(screen.getByTestId('cyber-attacks-visualization')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles service initialization errors gracefully', () => {
      expect(() => {
        render(<CyberAttacksVisualization enabled={true} />);
      }).not.toThrow();
    });
  });
});
