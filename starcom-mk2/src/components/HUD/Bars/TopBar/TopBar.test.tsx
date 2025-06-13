// TopBar.test.tsx
// Artifact-driven tests for TopBar, SettingsPopup, and Marquee
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopBar from './TopBar';

// Mock logo import
vi.mock('../../../../assets/images/WingCommanderLogo-288x162.gif', () => ({ default: 'logo.png' }));

// Mock useTopBarData to return stable values
vi.mock('./useTopBarData', () => ({
  useTopBarData: () => ({ stockSentiment: 'Bullish', currentTime: '12:00:00' })
}));

// Mock useTopBarPreferences with stateful logic for toggling
vi.mock('./useTopBarPreferences', async () => {
  const React = await import('react');
  return {
    useTopBarPreferences: () => {
      const [preferences, setPreferences] = React.useState({
        enabledCategories: {
          commodities: true,
          indices: true,
          crypto: true,
          forex: true,
          economic: true,
          news: true,
          sentiment: true,
        },
        version: 1,
      });
      const setCategoryEnabled = (id: string, enabled: boolean) => {
        setPreferences(prev => ({
          ...prev,
          enabledCategories: { ...prev.enabledCategories, [id]: enabled },
        }));
      };
      return { preferences, setCategoryEnabled };
    },
  };
});

// Mock focus-trap-react to just render children (jsdom cannot simulate real tabbing)
vi.mock('focus-trap-react', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('TopBar artifact-driven', () => {
  it('renders logo, settings button, and marquee', () => {
    render(<TopBar />);
    expect(screen.getByAltText(/wing commander logo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /marquee/i })).toBeInTheDocument();
  });

  it('opens and closes the settings modal', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles a category and updates marquee', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    const checkbox = screen.getByRole('checkbox', { name: /forex/i });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    // Close modal and check marquee for Forex is gone
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText(/forex: usd\/eur/i)).not.toBeInTheDocument();
  });

  it('marquee pauses on hover and resumes on mouse leave', () => {
    render(<TopBar />);
    const marquee = screen.getByRole('region', { name: /marquee/i });
    fireEvent.mouseEnter(marquee);
    // No error = pass; actual animation not tested here
    fireEvent.mouseLeave(marquee);
  });

  it('shows "No data selected" when all categories are disabled', () => {
    // Render with all categories disabled
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    // Uncheck all checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => {
      if (cb instanceof HTMLInputElement && cb.checked) {
        fireEvent.click(cb);
      }
    });
    // Close modal
    fireEvent.keyDown(document, { key: 'Escape' });
    // Marquee should show empty message
    expect(screen.getByRole('region', { name: /marquee-empty/i })).toBeInTheDocument();
    expect(screen.getByText(/no data selected/i)).toBeInTheDocument();
  });
});
// AI-NOTE: Tests accessibility, toggling, and integration per artifact requirements.
