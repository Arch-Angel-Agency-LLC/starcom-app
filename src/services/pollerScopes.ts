export const makeModeScope = (mode: string) => `mode:${mode}`;

export const makeRouteScope = (route: string | null | undefined) =>
  route ? `route:${route}` : 'route:root';

export const makeInstanceScope = (instanceId: string) => `instance:${instanceId}`;

export const combineScopes = (...scopes: Array<string | null | undefined>) =>
  scopes.filter(Boolean) as string[];
