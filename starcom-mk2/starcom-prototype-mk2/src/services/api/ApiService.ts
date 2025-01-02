export interface FetchOptions {
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: any;
  }
  
  export const ApiService = {
    async fetchData<T>(url: string, options: FetchOptions = {}): Promise<T> {
      try {
        const response = await fetch(url, {
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