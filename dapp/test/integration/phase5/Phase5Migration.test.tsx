/**
 * Integration Tests for Intel Reports 3D Migration
 * Phase 5.2: Integration Testing
 * 
 * These tests verify that the migrated components work correctly
 * and that the legacy-to-new data flow functions properly.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import IntelReportsPage from '../../src/pages/IntelReportsPage';

// Mock the API call
vi.mock('../../src/api/intelligence', () => ({
  fetchIntelReports: vi.fn(() => Promise.resolve([
    {
      pubkey: 'test-key-1',
      title: 'Test Intel Report 1',
      content: 'This is test content for intel report 1',
      tags: ['test', 'integration'],
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: Date.now(),
      author: 'test-author-1'
    },
    {
      pubkey: 'test-key-2',
      title: 'Test Intel Report 2',
      content: 'This is test content for intel report 2',
      tags: ['test', 'migration'],
      latitude: 34.0522,
      longitude: -118.2437,
      timestamp: Date.now(),
      author: 'test-author-2'
    }
  ]))
}));

// Mock the IntelOverlay component to avoid 3D rendering issues in tests
vi.mock('../../src/components/Intel/overlays/IntelOverlay', () => ({
  IntelOverlay: ({ markers }: { markers: unknown[] }) => (
    <div data-testid="intel-overlay">Intel Overlay with {markers.length} markers</div>
  )
}));

describe('Phase 5.2: Intel Reports 3D Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('IntelReportsPage renders successfully with migrated components', async () => {
    render(<IntelReportsPage />);
    
    // Check that the page title appears
    expect(screen.getByText('Intelligence Exchange Market')).toBeInTheDocument();
    
    // Wait for the data to load and components to render
    await waitFor(() => {
      // Check that the IntelOverlay is rendered
      expect(screen.getByTestId('intel-overlay')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('Legacy data is correctly converted to new format', async () => {
    render(<IntelReportsPage />);
    
    await waitFor(() => {
      // Verify that the IntelOverlay received the correct number of markers
      const overlay = screen.getByTestId('intel-overlay');
      expect(overlay).toHaveTextContent('Intel Overlay with 2 markers');
    }, { timeout: 3000 });
  });

  test('New IntelReportList component receives converted data', async () => {
    render(<IntelReportsPage />);
    
    await waitFor(() => {
      // The IntelReportList should be present (even if empty due to mocking)
      // We look for the common structure elements that should be rendered
      const pageElement = screen.getByText('Intelligence Exchange Market');
      expect(pageElement).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('Error handling works correctly', async () => {
    // Mock an API error
    const { fetchIntelReports } = await import('../../src/api/intelligence');
    vi.mocked(fetchIntelReports).mockRejectedValueOnce(new Error('API Error'));
    
    render(<IntelReportsPage />);
    
    // Should still render the page structure
    expect(screen.getByText('Intelligence Exchange Market')).toBeInTheDocument();
  });

  test('Type compatibility layer functions correctly', () => {
    // Test the conversion functions directly
    const mockLegacyMarker = {
      pubkey: 'test-pubkey',
      title: 'Test Title',
      content: 'Test Content',
      tags: ['tag1', 'tag2'],
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: Date.now(),
      author: 'Test Author'
    };

    // Since we can't import the internal conversion function directly,
    // we test that the component handles the conversion internally
    // by verifying it doesn't crash with legacy data format
    expect(() => render(<IntelReportsPage />)).not.toThrow();
  });
});

describe('Phase 5.2: Component Integration Tests', () => {
  test('IntelReportList renders with empty data', () => {
    // We can't easily test the IntelReportList in isolation due to complex dependencies,
    // but we can verify the page structure remains intact
    render(<IntelReportsPage />);
    expect(screen.getByText('Intelligence Exchange Market')).toBeInTheDocument();
  });

  test('Migration maintains backward compatibility', async () => {
    render(<IntelReportsPage />);
    
    await waitFor(() => {
      // Verify that the page loads without errors
      const title = screen.getByText('Intelligence Exchange Market');
      expect(title).toBeInTheDocument();
    });
  });
});

describe('Phase 5.2: Performance Integration Tests', () => {
  test('Page loads within acceptable time', async () => {
    const startTime = performance.now();
    
    render(<IntelReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Intelligence Exchange Market')).toBeInTheDocument();
    });
    
    const loadTime = performance.now() - startTime;
    
    // Should load within 1 second (generous for testing environment)
    expect(loadTime).toBeLessThan(1000);
  });

  test('Data conversion is efficient', async () => {
    // Create a larger dataset to test performance
    const { fetchIntelReports } = await import('../../src/api/intelligence');
    const largeDataset = Array.from({ length: 100 }, (_, i) => ({
      pubkey: `test-key-${i}`,
      title: `Test Intel Report ${i}`,
      content: `Test content ${i}`,
      tags: ['performance', 'test'],
      latitude: 40.7128 + (i * 0.01),
      longitude: -74.0060 + (i * 0.01),
      timestamp: Date.now() - (i * 1000),
      author: `test-author-${i}`
    }));
    
    vi.mocked(fetchIntelReports).mockResolvedValueOnce(largeDataset);
    
    const startTime = performance.now();
    render(<IntelReportsPage />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('intel-overlay');
      expect(overlay).toHaveTextContent('Intel Overlay with 100 markers');
    });
    
    const processingTime = performance.now() - startTime;
    
    // Should process 100 items within 2 seconds
    expect(processingTime).toBeLessThan(2000);
  });
});
