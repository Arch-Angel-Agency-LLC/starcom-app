// Moved from src/__tests__/FallbackProvider.unit.test.ts
// FallbackProvider comprehensive unit tests
// Artifacts: data-service-interfaces, data-service-testing-strategy
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FallbackProvider, DataProvider, StreamProvider, ProviderObserver } from './FallbackProvider';

describe('FallbackProvider', () => {
  let provider1: DataProvider;
  let provider2: DataProvider;
  let streamProvider: StreamProvider & DataProvider;
  let fallbackProvider: FallbackProvider;

  beforeEach(() => {
    provider1 = { fetchData: vi.fn() };
    provider2 = { fetchData: vi.fn() };
    streamProvider = { 
      fetchData: vi.fn(),
      subscribe: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Fallback Functionality', () => {
    it('returns data from the first successful provider', async () => {
      provider1.fetchData = vi.fn().mockRejectedValue(new Error('fail'));
      provider2.fetchData = vi.fn().mockResolvedValue('success');
      fallbackProvider = new FallbackProvider([provider1, provider2]);

      const result = await fallbackProvider.fetchData('test-key');

      expect(result).toBe('success');
      expect(provider1.fetchData).toHaveBeenCalledWith('test-key');
      expect(provider2.fetchData).toHaveBeenCalledWith('test-key');
    });

    it('returns data from first provider if successful', async () => {
      provider1.fetchData = vi.fn().mockResolvedValue('first-success');
      provider2.fetchData = vi.fn().mockResolvedValue('second-success');
      fallbackProvider = new FallbackProvider([provider1, provider2]);

      const result = await fallbackProvider.fetchData('test-key');

      expect(result).toBe('first-success');
      expect(provider1.fetchData).toHaveBeenCalledWith('test-key');
      expect(provider2.fetchData).not.toHaveBeenCalled();
    });

    it('throws if all providers fail', async () => {
      provider1.fetchData = vi.fn().mockRejectedValue(new Error('fail1'));
      provider2.fetchData = vi.fn().mockRejectedValue(new Error('fail2'));
      fallbackProvider = new FallbackProvider([provider1, provider2]);

      await expect(fallbackProvider.fetchData('test-key')).rejects.toThrow('All providers failed: fail1, fail2');
    });
  });

  describe('Observer Hooks', () => {
    let observer: ProviderObserver;

    beforeEach(() => {
      observer = {
        onSuccess: vi.fn(),
        onError: vi.fn(),
        onFallback: vi.fn()
      };
      fallbackProvider = new FallbackProvider([provider1, provider2]);
      fallbackProvider.addObserver(observer);
    });

    it('notifies observer on successful fetch', async () => {
      provider1.fetchData = vi.fn().mockResolvedValue('test-data');

      await fallbackProvider.fetchData('test-key');

      expect(observer.onSuccess).toHaveBeenCalledWith('test-key', 'test-data', 'provider-0');
      expect(observer.onError).not.toHaveBeenCalled();
      expect(observer.onFallback).not.toHaveBeenCalled();
    });

    it('notifies observer on provider error and fallback', async () => {
      provider1.fetchData = vi.fn().mockRejectedValue(new Error('provider1-error'));
      provider2.fetchData = vi.fn().mockResolvedValue('fallback-data');

      await fallbackProvider.fetchData('test-key');

      expect(observer.onError).toHaveBeenCalledWith('test-key', expect.any(Error), 'provider-0');
      expect(observer.onFallback).toHaveBeenCalledWith('test-key', 'provider-0', 'provider-1');
      expect(observer.onSuccess).toHaveBeenCalledWith('test-key', 'fallback-data', 'provider-1');
    });

    it('removes observer correctly', async () => {
      fallbackProvider.removeObserver(observer);
      provider1.fetchData = vi.fn().mockResolvedValue('test-data');

      await fallbackProvider.fetchData('test-key');

      expect(observer.onSuccess).not.toHaveBeenCalled();
    });

    it('handles observer notification errors gracefully', async () => {
      observer.onSuccess = vi.fn().mockImplementation(() => {
        throw new Error('Observer error');
      });
      provider1.fetchData = vi.fn().mockResolvedValue('test-data');

      // Should not throw despite observer error
      const result = await fallbackProvider.fetchData('test-key');
      expect(result).toBe('test-data');
    });
  });

  describe('Streaming/Subscription Support', () => {
    let mockCallback: (data: unknown) => void;
    let mockUnsubscribe: () => void;

    beforeEach(() => {
      mockCallback = vi.fn();
      mockUnsubscribe = vi.fn();
      streamProvider.subscribe = vi.fn().mockReturnValue(mockUnsubscribe);
      fallbackProvider = new FallbackProvider([streamProvider]);
    });

    it('subscribes to streaming provider when available', () => {
      const unsubscribe = fallbackProvider.subscribe('test-key', mockCallback);

      expect(streamProvider.subscribe).toHaveBeenCalledWith('test-key', expect.any(Function));
      expect(typeof unsubscribe).toBe('function');
    });

    it('forwards streamed data to subscribers', () => {
      fallbackProvider.subscribe('test-key', mockCallback);

      // Simulate the stream provider calling back with data
      const subscribedCallback = (streamProvider.subscribe as any).mock.calls[0][1];
      subscribedCallback('streamed-data');

      expect(mockCallback).toHaveBeenCalledWith('streamed-data');
    });

    it('handles multiple subscribers for the same key', () => {
      const callback2 = vi.fn();
      
      fallbackProvider.subscribe('test-key', mockCallback);
      fallbackProvider.subscribe('test-key', callback2);

      const subscribedCallback = (streamProvider.subscribe as any).mock.calls[0][1];
      subscribedCallback('streamed-data');

      expect(mockCallback).toHaveBeenCalledWith('streamed-data');
      expect(callback2).toHaveBeenCalledWith('streamed-data');
    });

    it('removes subscription when unsubscribe is called', () => {
      const unsubscribe = fallbackProvider.subscribe('test-key', mockCallback);
      unsubscribe();

      const subscribedCallback = (streamProvider.subscribe as any).mock.calls[0][1];
      subscribedCallback('streamed-data');

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('falls back to polling when no streaming provider available', () => {
      vi.useFakeTimers();
      const nonStreamProvider = { fetchData: vi.fn().mockResolvedValue('polled-data') };
      fallbackProvider = new FallbackProvider([nonStreamProvider]);

      fallbackProvider.subscribe('test-key', mockCallback);

      // Fast-forward time to trigger polling
      vi.advanceTimersByTime(5100); // Slightly more than 5 second polling interval

      expect(nonStreamProvider.fetchData).toHaveBeenCalledWith('test-key');
      vi.useRealTimers();
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      fallbackProvider = new FallbackProvider([provider1, provider2]);
    });

    it('returns correct provider count', () => {
      expect(fallbackProvider.getProviderCount()).toBe(2);
    });

    it('tracks active subscriptions', () => {
      expect(fallbackProvider.getActiveSubscriptions()).toEqual([]);
      
      fallbackProvider.subscribe('key1', vi.fn());
      fallbackProvider.subscribe('key2', vi.fn());
      
      expect(fallbackProvider.getActiveSubscriptions()).toEqual(['key1', 'key2']);
    });

    it('tracks observer count', () => {
      expect(fallbackProvider.getObserverCount()).toBe(0);
      
      const observer1 = { onSuccess: vi.fn() };
      const observer2 = { onError: vi.fn() };
      
      fallbackProvider.addObserver(observer1);
      fallbackProvider.addObserver(observer2);
      
      expect(fallbackProvider.getObserverCount()).toBe(2);
    });
  });
});
