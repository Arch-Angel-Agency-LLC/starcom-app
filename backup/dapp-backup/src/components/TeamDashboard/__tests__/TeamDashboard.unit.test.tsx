import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamDashboard from '../TeamDashboard';
import { CyberTeam } from '../../../context/TeamContext';

describe('TeamDashboard', () => {
  it('renders "No teams" when list is empty', () => {
    render(<TeamDashboard teams={[]} />);
    expect(screen.getByText('No teams')).toBeDefined();
  });

  it('renders team cards when provided', () => {
    const teams: CyberTeam[] = [
      { id: '1', name: 'Alpha', members: ['a', 'b'] },
      { id: '2', name: 'Bravo', members: ['c'] }
    ];
    render(<TeamDashboard teams={teams} />);
    expect(screen.queryByText('No teams')).toBeNull();
    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Members: 2')).toBeDefined();
    expect(screen.getByText('Bravo')).toBeDefined();
    expect(screen.getByText('Members: 1')).toBeDefined();
  });
});
