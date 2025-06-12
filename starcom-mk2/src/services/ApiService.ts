const PROXY_URL = 'http://localhost:8081/';

export interface FetchOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
}

export const ApiService = {
  async fetchData<T>(url: string, options: FetchOptions = {}): Promise<T> {
    try {
      const response = await fetch(PROXY_URL + url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`[ApiService] Error fetching data from ${url}:`, error);
      throw error;
    }
  },
};