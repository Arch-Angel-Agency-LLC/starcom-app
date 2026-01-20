import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EcoDisastersStatusCard from '../EcoDisastersStatusCard';
import EcoDisastersLegend from '../EcoDisastersLegend';

const renderWithTheme = (ui: React.ReactElement, theme = createTheme()) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const createMatchMedia = (matches: boolean) =>
  (query: string): MediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });

const FIXED_NOW = new Date('2025-01-02T03:04:05Z');

describe('EcoDisasters cards', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    // Default to desktop viewport unless overridden per test
    window.matchMedia = createMatchMedia(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders fresh status card snapshot', () => {
    renderWithTheme(
      <EcoDisastersStatusCard
        total={5}
        filtered={3}
        stale={false}
        lastUpdated={Date.now()}
        mockVolcanoes
        onRetry={() => {}}
      />
    );

    const card = screen.getByTestId('eco-status-card');
    expect(card.textContent).toMatchInlineSnapshot(
      '"Eco Disasters StatusFreshFiltered3Total5Last updated2025-01-02 03:04:05 UTCJust nowVolcano data is mockVolcano data is synthetic placeholder data.Retry"'
    );
  });

  it('renders stale error state snapshot', () => {
    renderWithTheme(
      <EcoDisastersStatusCard
        total={0}
        filtered={0}
        stale
        error="Network down"
        lastUpdated={Date.now()}
        onRetry={() => {}}
      />
    );

    const card = screen.getByTestId('eco-status-card');
    expect(card.textContent).toMatchInlineSnapshot(
      '"Eco Disasters StatusErrorFiltered0Total0Last updated2025-01-02 03:04:05 UTCJust nowData is stale; showing last known good update.Network downRetry"'
    );
  });

  it('renders legend with counts and mock badge snapshot', () => {
    renderWithTheme(
      <EcoDisastersLegend
        counts={{ minor: 1, major: 2, catastrophic: 0 }}
        lastUpdated={Date.now()}
        stale={false}
        mockVolcanoes
      />
    );

    const legend = screen.getByTestId('eco-disasters-legend');
    expect(legend.textContent).toMatchInlineSnapshot(
      '"Volcano data is mock; see FAQ link for details.LegendFreshCatastrophic0Major2Minor1Last updated2025-01-02 03:04:05 UTCJust nowVolcano data is mockFAQTotal markers: 3"'
    );
  });

  it('renders legend stale state snapshot', () => {
    renderWithTheme(
      <EcoDisastersLegend counts={{ minor: 0, major: 0, catastrophic: 0 }} lastUpdated={null} stale mockVolcanoes={false} />
    );

    const legend = screen.getByTestId('eco-disasters-legend');
    expect(legend.textContent).toMatchInlineSnapshot(
      '"LegendStaleCatastrophic0Major0Minor0Last updated—No recent updatesData is stale; showing last known good refresh.Total markers: 0"'
    );
  });

  it('renders legend in mobile layout snapshot', () => {
    window.matchMedia = createMatchMedia(true);

    renderWithTheme(
      <EcoDisastersLegend counts={{ minor: 4, major: 1, catastrophic: 1 }} lastUpdated={Date.now()} stale={false} mockVolcanoes />
    );

    const legend = screen.getByTestId('eco-disasters-legend');
    expect(legend.textContent).toMatchInlineSnapshot(
      '"Volcano data is mock; see FAQ link for details.LegendFreshCatastrophic1Major1Minor4Last updated2025-01-02 03:04:05 UTCJust nowVolcano data is mockFAQTotal markers: 6"'
    );
  });

  it('renders legend with dark theme snapshot', () => {
    const darkTheme = createTheme({ palette: { mode: 'dark' } });

    renderWithTheme(
      <EcoDisastersLegend counts={{ minor: 2, major: 2, catastrophic: 2 }} lastUpdated={Date.now()} stale mockVolcanoes={false} />,
      darkTheme
    );

    const legend = screen.getByTestId('eco-disasters-legend');
    expect(legend.textContent).toMatchInlineSnapshot(
      '"LegendStaleCatastrophic2Major2Minor2Last updated2025-01-02 03:04:05 UTCJust nowData is stale; showing last known good refresh.Total markers: 6"'
    );
  });

  it('renders RTL without layout regression', () => {
    const rtlTheme = createTheme({ direction: 'rtl' });
    renderWithTheme(
      <EcoDisastersLegend
        counts={{ minor: 1, major: 1, catastrophic: 1 }}
        lastUpdated={Date.now()}
        stale={false}
        mockVolcanoes={false}
      />,
      rtlTheme
    );

    expect(screen.getByLabelText('Legend freshness: Fresh')).toBeInTheDocument();
  });

  it('provides mock volcano FAQ link and screenreader text', () => {
    renderWithTheme(
      <EcoDisastersLegend
        counts={{ minor: 0, major: 0, catastrophic: 0 }}
        lastUpdated={null}
        stale={false}
        mockVolcanoes
      />
    );

    expect(screen.getByText('Volcano data is mock')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /faq/i })).toHaveAttribute('href');
  });
});
