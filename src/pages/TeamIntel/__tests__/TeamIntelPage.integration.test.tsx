import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TeamIntelPage from '../TeamIntelPage';
import { TeamProvider } from '../../../context/TeamContext';
import { anchorService } from '../../../services/anchor/AnchorService';

const mockTeams = [
  { id: 'team1', name: 'Alpha', members: ['a'] },
];

describe('TeamIntelPage', () => {
  it('denies access to non-member', async () => {
    vi.spyOn(anchorService, 'getUserTeams').mockResolvedValue([] as any);
    render(
      <TeamProvider>
        <MemoryRouter initialEntries={["/team/team1"]}>
          <Routes>
            <Route path="/team/:teamId" element={<TeamIntelPage />} />
          </Routes>
        </MemoryRouter>
      </TeamProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Access denied/)).toBeDefined();
    });
  });

  it('shows intel list placeholder for member', async () => {
    vi.spyOn(anchorService, 'getUserTeams').mockResolvedValue(mockTeams as any);
    render(
      <TeamProvider>
        <MemoryRouter initialEntries={["/team/team1"]}>
          <Routes>
            <Route path="/team/:teamId" element={<TeamIntelPage />} />
          </Routes>
        </MemoryRouter>
      </TeamProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('No reports available.')).toBeDefined();
    });
  });
});
