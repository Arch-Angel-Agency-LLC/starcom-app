/**
 * CyberThreats Settings Component Tests
 * Week 3 Day 2: Testing the settings panel functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CyberThreatsSettings } from '../CyberThreatsSettings';

// Mock the useCyberCommandSettings hook
vi.mock('../../../../../hooks/useCyberCommandSettings', () => ({
  useCyberCommandSettings: () => ({
    config: {
      cyberThreats: {
        overlayOpacity: 75,
        confidenceThreshold: 0.5,
        showHeatMap: true,
        heatMapIntensity: 1.0,
        showC2Networks: true,
        showBotnets: false,
        showAttribution: false,
        attributionMinConfidence: 0.7,
        threatFiltering: {
          showC2Servers: true,
          showMalwareFamilies: true,
          showThreatActors: false,
          showIOCs: true
        },
        refreshInterval: 5,
        maxThreats: 500,
        campaignGrouping: false,
        showTimelines: false
      }
    },
    updateCyberThreats: vi.fn()
  })
}));

describe('CyberThreatsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the settings panel', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByText('Threat Intelligence Display')).toBeInTheDocument();
      expect(screen.getByText('Confidence Threshold')).toBeInTheDocument();
      expect(screen.getByText('Visualization Options')).toBeInTheDocument();
    });

    it('should display current overlay opacity value', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByText('Overlay Opacity: 75%')).toBeInTheDocument();
    });

    it('should display current confidence threshold value', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByText('Minimum Confidence: 50%')).toBeInTheDocument();
    });
  });

  describe('Visualization Checkboxes', () => {
    it('should show heat map checkbox as checked', () => {
      render(<CyberThreatsSettings />);
      
      const heatMapCheckbox = screen.getByLabelText(/Threat Density Heat Map/);
      expect(heatMapCheckbox).toBeChecked();
    });

    it('should show C2 networks checkbox as checked', () => {
      render(<CyberThreatsSettings />);
      
      const c2Checkbox = screen.getByLabelText(/C2 Network Infrastructure/);
      expect(c2Checkbox).toBeChecked();
    });

    it('should show botnets checkbox as unchecked', () => {
      render(<CyberThreatsSettings />);
      
      const botnetCheckbox = screen.getByLabelText(/Botnet Activity/);
      expect(botnetCheckbox).not.toBeChecked();
    });
  });

  describe('Threat Filtering Options', () => {
    it('should display threat filtering checkboxes', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByLabelText(/C2 Servers/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Malware Families/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Threat Actors/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Indicators of Compromise/)).toBeInTheDocument();
    });

    it('should show correct initial state for filtering options', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByLabelText(/C2 Servers/)).toBeChecked();
      expect(screen.getByLabelText(/Malware Families/)).toBeChecked();
      expect(screen.getByLabelText(/Threat Actors/)).not.toBeChecked();
      expect(screen.getByLabelText(/Indicators of Compromise/)).toBeChecked();
    });
  });

  describe('Range Sliders', () => {
    it('should display heat map intensity slider', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByText('Heat Map Intensity: 1.0x')).toBeInTheDocument();
    });

    it('should display attribution confidence slider', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByText('Attribution Min Confidence: 70%')).toBeInTheDocument();
    });

    it('should display max threats slider', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByText('Max Threats: 500')).toBeInTheDocument();
    });

    it('should display refresh interval slider', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByText('Refresh Interval: 5 minutes')).toBeInTheDocument();
    });
  });

  describe('Status Summary', () => {
    it('should display status information', () => {
      render(<CyberThreatsSettings />);
      
      expect(screen.getByText(/🔒 Threat intelligence visualization configured/)).toBeInTheDocument();
      expect(screen.getByText(/📡 Confidence threshold: 50%/)).toBeInTheDocument();
      expect(screen.getByText(/🎯 Max threats: 500/)).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('should render without errors when interacting with checkboxes', () => {
      render(<CyberThreatsSettings />);
      
      const heatMapCheckbox = screen.getByLabelText(/Threat Density Heat Map/);
      
      // Should not throw when clicked
      expect(() => {
        fireEvent.click(heatMapCheckbox);
      }).not.toThrow();
    });

    it('should render without errors when interacting with sliders', () => {
      render(<CyberThreatsSettings />);
      
      const opacitySlider = screen.getByDisplayValue('75');
      
      // Should not throw when changed
      expect(() => {
        fireEvent.change(opacitySlider, { target: { value: '85' } });
      }).not.toThrow();
    });
  });
});
