import React from 'react';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

jest.mock('../../services/pollerScopes', () => ({ makeModeScope: (mode: string) => `mode:${mode}` }));
const stopAll = jest.fn();
jest.mock('../../services/pollerRegistry', () => ({ pollerRegistry: { stopAll: (...args: unknown[]) => stopAll(...args) } }));
const purgeCache = jest.fn();
jest.mock('../../utils/assetLoader', () => ({ assetLoader: { purgeCache: (...args: unknown[]) => purgeCache(...args) } }));
const settingsStorage = {
  loadSettings: jest.fn((_: string, fallback: unknown) => fallback),
  saveSettings: jest.fn(),
};
jest.mock('../../utils/settingsStorage', () => ({ settingsStorage }));

jest.mock('../VisualizationModeContext', () => {
  const React = require('react');
  const ctx = React.createContext(null);
  const Provider = ({ children }: { children: React.ReactNode }) => {
    const [mode, setMode] = React.useState({ mode: 'CyberCommand', subMode: 'IntelReports' });
    const setVisualizationMode = (next: any) => setMode(next);
    const setPrimaryMode = (primary: 'CyberCommand' | 'GeoPolitical' | 'EcoNatural') => {
      const prev = mode.mode;
      setMode({ mode: primary, subMode: mode.subMode });
      const heavy = new Set(['CyberCommand', 'EcoNatural']);
      if (heavy.has(prev) && !heavy.has(primary)) {
        const { makeModeScope } = require('../../services/pollerScopes');
        const { pollerRegistry } = require('../../services/pollerRegistry');
        const { assetLoader } = require('../../utils/assetLoader');
        pollerRegistry.stopAll(makeModeScope(prev));
        assetLoader.purgeCache('mode-change');
      }
    };
    const resetVisualizationMode = () => setMode({ mode: 'CyberCommand', subMode: 'IntelReports' });
    return React.createElement(ctx.Provider, {
      value: { visualizationMode: mode, setVisualizationMode, setPrimaryMode, resetVisualizationMode }
    }, children);
  };
  const useVisualizationMode = () => React.useContext(ctx);
  return { VisualizationModeProvider: Provider, useVisualizationMode };
});


describe('VisualizationModeProvider teardown', () => {
  let VisualizationModeProvider: any;
  let useVisualizationMode: any;

  beforeEach(() => {
    stopAll.mockClear();
    purgeCache.mockClear();
    settingsStorage.loadSettings.mockClear();
    settingsStorage.saveSettings.mockClear();
    const module = require('../VisualizationModeContext');
    VisualizationModeProvider = module.VisualizationModeProvider;
    useVisualizationMode = module.useVisualizationMode;
  });

  it('stops scoped pollers and purges cache when leaving heavy mode', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VisualizationModeProvider>{children}</VisualizationModeProvider>
    );

    const { result } = renderHook(() => useVisualizationMode(), { wrapper });

    act(() => {
      result.current.setPrimaryMode('GeoPolitical');
    });

    expect(stopAll).toHaveBeenCalledWith('mode:CyberCommand');
    expect(purgeCache).toHaveBeenCalledWith('mode-change');
  });
});
