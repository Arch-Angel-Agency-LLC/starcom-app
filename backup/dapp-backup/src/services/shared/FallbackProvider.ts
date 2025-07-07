// FallbackProvider.ts
// Data service with fallback provider pattern for resilient data fetching

export interface DataProvider<T = unknown> {
  fetchData(key: string): Promise<T>;
}

export interface StreamProvider<T = unknown> {
  subscribe(key: string, callback: (data: T) => void): () => void;
}

export interface ObservableProvider<T = unknown> extends DataProvider<T> {
  addObserver(observer: ProviderObserver<T>): void;
  removeObserver(observer: ProviderObserver<T>): void;
}

export interface ProviderObserver<T = unknown> {
  onSuccess?(key: string, data: T, provider: string): void;
  onError?(key: string, error: Error, provider: string): void;
  onFallback?(key: string, fromProvider: string, toProvider: string): void;
}

export class FallbackProvider<T = unknown> implements DataProvider<T>, ObservableProvider<T>, StreamProvider<T> {
  private observers: ProviderObserver<T>[] = [];
  private subscriptions: Map<string, Set<(data: T) => void>> = new Map();

  constructor(private providers: DataProvider<T>[]) {}

  async fetchData(key: string): Promise<T> {
    const errors: Error[] = [];
    
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const providerName = `provider-${i}`;
      
      try {
        const data = await provider.fetchData(key);
        this.notifyObservers('onSuccess', key, data, providerName);
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        this.notifyObservers('onError', key, err, providerName);
        
        // Notify fallback if there's a next provider
        if (i < this.providers.length - 1) {
          this.notifyObservers('onFallback', key, providerName, `provider-${i + 1}`);
        }
      }
    }
    
    throw new Error(`All providers failed: ${errors.map(e => e.message).join(', ')}`);
  }

  subscribe(key: string, callback: (data: T) => void): () => void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key)!.add(callback);
    
    // Start subscription with the first available provider that supports streaming
    this.startStreamingForKey(key);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(key);
          // Stop streaming for this key if no more subscribers
        }
      }
    };
  }

  private async startStreamingForKey(key: string): Promise<void> {
    // Try to establish streaming with fallback providers
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      if (this.isStreamProvider(provider)) {
        try {
          provider.subscribe(key, (data: T) => {
            const callbacks = this.subscriptions.get(key);
            if (callbacks) {
              callbacks.forEach(callback => callback(data));
            }
          });
          return; // Successfully started streaming
        } catch {
          // Try next provider
          continue;
        }
      }
    }
    
    // If no streaming provider available, fall back to polling
    this.startPollingForKey(key);
  }

  private startPollingForKey(key: string): void {
    const pollInterval = 5000; // 5 seconds
    const intervalId = setInterval(async () => {
      if (!this.subscriptions.has(key)) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        const data = await this.fetchData(key);
        const callbacks = this.subscriptions.get(key);
        if (callbacks) {
          callbacks.forEach(callback => callback(data));
        }
      } catch {
        // Handle polling error silently or notify observers
      }
    }, pollInterval);
  }

  private isStreamProvider(provider: unknown): provider is StreamProvider<T> & DataProvider<T> {
    return typeof (provider as StreamProvider<T>).subscribe === 'function';
  }

  addObserver(observer: ProviderObserver<T>): void {
    this.observers.push(observer);
  }

  removeObserver(observer: ProviderObserver<T>): void {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
    }
  }

  private notifyObservers(
    method: keyof ProviderObserver<T>,
    key: string,
    ...args: unknown[]
  ): void {
    this.observers.forEach(observer => {
      const fn = observer[method];
      if (typeof fn === 'function') {
        try {
          (fn as (...args: unknown[]) => void).call(observer, key, ...args);
        } catch (error) {
          console.warn('Observer notification failed:', error);
        }
      }
    });
  }

  // Utility methods for testing and monitoring
  getProviderCount(): number {
    return this.providers.length;
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  getObserverCount(): number {
    return this.observers.length;
  }
}
