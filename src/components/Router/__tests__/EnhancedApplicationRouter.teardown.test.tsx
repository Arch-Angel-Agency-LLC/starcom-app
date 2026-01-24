import React from 'react';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { EnhancedApplicationRouterProvider, type ApplicationConfig } from '../EnhancedApplicationRouter';
import { EnhancedApplicationRouterContext } from '../../../context/EnhancedApplicationRouterContext';

jest.mock('../../../utils/analytics', () => ({ trackInvestorEvents: { featureUsed: jest.fn() } }));
jest.mock('../../../services/GoogleAnalyticsService', () => ({ googleAnalyticsService: { trackEvent: jest.fn() } }));
jest.mock('../../../services/pollerScopes', () => ({ makeRouteScope: (appId: string) => `route:${appId}` }));

const stopAll = jest.fn();
jest.mock('../../../services/pollerRegistry', () => ({ pollerRegistry: { stopAll: (...args: unknown[]) => stopAll(...args) } }));
const purgeCache = jest.fn();
jest.mock('../../../utils/assetLoader', () => ({ assetLoader: { purgeCache: (...args: unknown[]) => purgeCache(...args) } }));

jest.mock('../../../applications/cybercommand/CyberCommandApplication', () => () => null);
jest.mock('../../../applications/netrunner/NetRunnerApplication', () => () => null);
jest.mock('../../../applications/intelanalyzer/AnalysisWorkbench', () => () => null);
jest.mock('../../../applications/inteldashboard/IntelDashboardApplication', () => () => null);
jest.mock('../../../applications/intelweb/IntelWebApplicationWrapper', () => () => null);
jest.mock('../../../applications/teamworkspace/TeamWorkspaceApplication', () => () => null);
jest.mock('../../../applications/marketexchange/MarketExchangeApplication', () => () => null);

const registerTestApp = (id: string): ApplicationConfig => ({
  id: id as ApplicationConfig['id'],
  name: id,
  icon: '',
  description: '',
  defaultMode: 'standalone',
  supportedModes: ['standalone'],
  component: () => null,
});

describe('EnhancedApplicationRouter teardown', () => {
  beforeEach(() => {
    stopAll.mockClear();
    purgeCache.mockClear();
  });

  it('stops pollers and purges cache on route change', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EnhancedApplicationRouterProvider>{children}</EnhancedApplicationRouterProvider>
    );

    const { result } = renderHook(() => React.useContext(EnhancedApplicationRouterContext), { wrapper });
    if (!result.current) throw new Error('Router context missing');

    act(() => {
      result.current.registerApplication(registerTestApp('cybercommand'));
      result.current.registerApplication(registerTestApp('netrunner'));
      result.current.navigateToApp('cybercommand');
    });

    act(() => {
      result.current?.navigateToApp('netrunner');
    });

    expect(stopAll).toHaveBeenCalledWith('route:cybercommand');
    expect(purgeCache).toHaveBeenCalledWith('route-change');
  });
});
