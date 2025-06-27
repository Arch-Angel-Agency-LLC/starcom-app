export const buildQueryFilters = (filters: Record<string, string | number>): string => {
    return Object.entries(filters)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  };