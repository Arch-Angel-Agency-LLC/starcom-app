import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NewReportPage from './NewReportPage';
import { intelReportService } from '../../services/intel/IntelReportService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Spy on service methods in tests

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('NewReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields and submits new report with latitude, longitude, and timestamp', async () => {
    // Stub report creation via centralized intelReportService
    const createSpy = vi.spyOn(intelReportService, 'createReport').mockResolvedValue({
      id: 'intel-1',
      title: 'Test Report',
      content: 'Some intel details',
      author: '123',
      category: 'OSINT',
      tags: ['tag1', 'tag2'],
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      latitude: 12.34,
      longitude: 56.78,
      summary: '',
      conclusions: [],
      recommendations: [],
      methodology: [],
      confidence: 0.5,
      priority: 'ROUTINE',
      targetAudience: [],
      sourceIntelIds: [],
      version: 1,
      manualSummary: false,
      history: []
    } as any);

    render(
      <MemoryRouter initialEntries={["/team/123/new-report"]}>
        <Routes>
          <Route path="/team/:teamId/new-report" element={<NewReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Test Report' } });
    fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: 'Some intel details' } });
    fireEvent.change(screen.getByPlaceholderText('Tags (comma-separated)'), { target: { value: 'tag1, tag2' } });
    fireEvent.change(screen.getByPlaceholderText('Latitude'), { target: { value: '12.34' } });
    fireEvent.change(screen.getByPlaceholderText('Longitude'), { target: { value: '56.78' } });
    fireEvent.change(screen.getByPlaceholderText('Timestamp'), { target: { value: '2025-07-02T10:00' } });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        {
          title: 'Test Report',
          content: 'Some intel details',
          tags: ['tag1', 'tag2'],
          category: 'OSINT',
          classification: 'UNCLASSIFIED',
          status: 'DRAFT',
          latitude: 12.34,
          longitude: 56.78,
          summary: '',
          conclusions: [],
          recommendations: [],
          methodology: [],
          confidence: 0.5,
          priority: 'ROUTINE',
          targetAudience: [],
          sourceIntelIds: []
        },
        '123'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/team/123');
    });
  });
});
