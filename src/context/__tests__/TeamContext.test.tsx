import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { TeamProvider, useTeamContext } from '../TeamContext';
import { anchorService } from '../../services/anchor/AnchorService';

// Mock data
const mockTeams = [
  { id: 'team1', name: 'Case Alpha', members: ['wallet1', 'wallet2'] },
  { id: 'team2', name: 'Case Bravo', members: ['wallet2', 'wallet3'] },
];

describe('TeamContext', () => {
  it('provides teams from anchorService.getUserTeams', async () => {
    // Stub the getUserTeams method
    vi.spyOn(anchorService, 'getUserTeams').mockResolvedValue(mockTeams as any);

    // Test component that consumes context
    const TestComponent = () => {
      const { teams, loading, error } = useTeamContext();
      if (loading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      return (
        <ul>
          {teams.map(t => (
            <li key={t.id}>{t.name}</li>
          ))}
        </ul>
      );
    };

    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>
    );

    // Initially shows Loading
    expect(screen.getByText('Loading...')).toBeDefined();

    // Wait for teams to render
    await waitFor(() => {
      expect(screen.getByText('Case Alpha')).toBeDefined();
      expect(screen.getByText('Case Bravo')).toBeDefined();
    });
  });

  it('handles errors from getUserTeams', async () => {
    const error = new Error('RPC failed');
    vi.spyOn(anchorService, 'getUserTeams').mockRejectedValue(error);

    const TestComponent = () => {
      const { teams, loading, error: err } = useTeamContext();
      if (loading) return <div>Loading...</div>;
      if (err) return <div>Error: {err.message}</div>;
      return <div>Teams count: {teams.length}</div>;
    };

    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>
    );

    // Initially loading
    expect(screen.getByText('Loading...')).toBeDefined();

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('Error: RPC failed')).toBeDefined();
    });
  });
});
