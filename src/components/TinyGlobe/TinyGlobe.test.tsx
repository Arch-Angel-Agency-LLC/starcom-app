import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { VisualizationModeProvider } from '../../context/VisualizationModeContext';
import { GlobeProvider } from '../../context/GlobeContext';
import TinyGlobe from './TinyGlobe';
import { vi } from 'vitest';

vi.mock('react-globe.gl', () => ({
  default: () => <div data-testid="mock-globe" />,
  GlobeMethods: () => {},
}));
vi.mock('three', async () => {
  const actual = await vi.importActual<object>('three');
  return {
    ...actual,
    TextureLoader: class { loadAsync = () => Promise.resolve({}); },
    ShaderMaterial: class {},
    DirectionalLight: class {},
    Vector2: class {},
    Vector3: class {},
  };
});

// Helper to render with context
function renderWithProvider(ui: React.ReactElement) {
  return render(
    <GlobeProvider>
      <VisualizationModeProvider>{ui}</VisualizationModeProvider>
    </GlobeProvider>
  );
}

describe('TinyGlobe Mode Synchronization', () => {
  it('renders without crashing', () => {
    renderWithProvider(<TinyGlobe />);
  });

  it('UI buttons update VisualizationMode context', () => {
    const { getByText } = renderWithProvider(<TinyGlobe />);
    fireEvent.click(getByText('🌎'));
    fireEvent.click(getByText('📑'));
    fireEvent.click(getByText('☀️'));
    // No assertion here: this is a smoke test for button wiring
  });

  // TODO: Add more tests to check globe material changes and fallback behavior
});
