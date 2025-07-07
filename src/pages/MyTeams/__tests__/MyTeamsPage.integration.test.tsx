import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyTeamsPage from '../MyTeamsPage';
import { TeamProvider } from '../../../context/TeamContext';
import { anchorService } from '../../../services/anchor/AnchorService';

describe('MyTeamsPage', () => {
  it('renders loading, then team list, and handles create', async () => {
    const mockTeams = [{ id: '1', name: 'Alpha', members: ['a'] }];
    vi.spyOn(anchorService, 'createCyberTeam').mockResolvedValue('txid');
    vi.spyOn(anchorService, 'getUserTeams').mockResolvedValue(mockTeams as any);

    render(
      <TeamProvider>
        <MyTeamsPage />
      </TeamProvider>
    );

    // loading state
    expect(screen.getByText('Loading teams...')).toBeDefined();

    // after load
    await waitFor(() => screen.getByText('Alpha (1 members)'));
    expect(screen.getByText('Alpha (1 members)')).toBeDefined();

    // create new
    fireEvent.change(screen.getByPlaceholderText('New team name'), { target: { value: 'Beta' } });
    fireEvent.click(screen.getByText('Create Team'));

    await waitFor(() => {
      expect(anchorService.createCyberTeam).toHaveBeenCalledWith('Beta');
    });
  });

  it('shows error when creation fails', async () => {
    vi.spyOn(anchorService, 'createCyberTeam').mockRejectedValue(new Error('fail'));
    vi.spyOn(anchorService, 'getUserTeams').mockResolvedValue([] as any);

    render(
      <TeamProvider>
        <MyTeamsPage />
      </TeamProvider>
    );

    await waitFor(() => screen.getByText('No teams found.'));

    fireEvent.change(screen.getByPlaceholderText('New team name'), { target: { value: 'Gamma' } });
    fireEvent.click(screen.getByText('Create Team'));

    // error logged but page stays stable
    await waitFor(() => screen.getByText('No teams found.'));
  });
});
