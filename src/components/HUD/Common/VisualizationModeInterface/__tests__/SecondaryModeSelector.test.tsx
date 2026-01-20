import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import SecondaryModeSelector from '../SecondaryModeSelector';

const setVisualizationMode = vi.fn();
vi.mock('../../../../../context/VisualizationModeContext', () => ({
  useVisualizationMode: () => ({ setVisualizationMode })
}));

describe('SecondaryModeSelector (EcoNatural)', () => {
  afterEach(() => {
    setVisualizationMode.mockClear();
  });

  it('shows Ecological Disasters control with volcano emoji and tooltip', () => {
    render(<SecondaryModeSelector primaryMode="EcoNatural" activeSubMode="EcologicalDisasters" />);

    const button = screen.getByRole('button', {
      name: /Ecological Disasters - Natural Disasters & Environmental Crises/i
    });

    expect(button).toBeInTheDocument();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.querySelector('[aria-hidden="true"]')?.textContent).toBe('🌋');
    expect(screen.queryByText('🌪️')).toBeNull();
  });

  it('invokes mode change with EcologicalDisasters payload on click', () => {
    render(<SecondaryModeSelector primaryMode="EcoNatural" activeSubMode="SpaceWeather" />);

    const button = screen.getByRole('button', {
      name: /Ecological Disasters - Natural Disasters & Environmental Crises/i
    });
    fireEvent.click(button);

    expect(setVisualizationMode).toHaveBeenCalledWith({
      mode: 'EcoNatural',
      subMode: 'EcologicalDisasters'
    });
  });
});
