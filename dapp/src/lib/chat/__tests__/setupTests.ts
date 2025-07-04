/**
 * Setup file for chat system tests
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the logger
vi.mock('../../../utils', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Setup global fetch mock
global.fetch = vi.fn();

// Mock EventEmitter
vi.mock('events', () => {
  return {
    EventEmitter: class MockEventEmitter {
      private listeners: Record<string, Function[]>;
      
      constructor() {
        this.listeners = {};
      }
      
      on(event: string, listener: Function) {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
        return this;
      }
      
      off(event: string, listener: Function) {
        if (!this.listeners[event]) {
          return this;
        }
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        return this;
      }
      
      emit(event: string, ...args: any[]) {
        if (!this.listeners[event]) {
          return false;
        }
        this.listeners[event].forEach(listener => listener(...args));
        return true;
      }
      
      once(event: string, listener: Function) {
        const onceListener = (...args: any[]) => {
          this.off(event, onceListener);
          listener(...args);
        };
        return this.on(event, onceListener);
      }
      
      removeAllListeners(event?: string) {
        if (event) {
          delete this.listeners[event];
        } else {
          this.listeners = {};
        }
        return this;
      }
    }
  };
});
