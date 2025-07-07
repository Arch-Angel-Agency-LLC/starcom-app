import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NewReportPage from './NewReportPage';
import { anchorService } from '../../services/anchor/AnchorService';
import { IPFSContentOrchestrator } from '../../services/IPFSContentOrchestrator';
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
    const fakeSig = 'report-sig';
    // Stub report creation
    vi.spyOn(anchorService, 'createIntelReport').mockResolvedValue(fakeSig);
    // Spy on static uploadIntelPackage
    const uploadSpy = vi.spyOn(IPFSContentOrchestrator, 'uploadIntelPackage').mockResolvedValue();

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
      expect(anchorService.createIntelReport).toHaveBeenCalledWith({
        title: 'Test Report',
        content: 'Some intel details',
        tags: ['tag1', 'tag2'],
        teamId: '123',
        latitude: 12.34,
        longitude: 56.78,
        timestamp: '2025-07-02T10:00'
      });
      expect(uploadSpy).toHaveBeenCalledWith(expect.objectContaining({ id: fakeSig }));
      expect(mockNavigate).toHaveBeenCalledWith('/team/123');
    });
  });
});
