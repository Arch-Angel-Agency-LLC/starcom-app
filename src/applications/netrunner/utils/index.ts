/**
 * NetRunner Utilities
 * 
 * Common utility functions for data processing, validation, formatting,
 * and other shared functionality across the NetRunner application.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { VALIDATION_REGEX } from '../constants';

/**
 * Data Validation Utilities
 */
export class ValidationUtils {
  /**
   * Validate email address
   */
  static isValidEmail(email: string): boolean {
    return VALIDATION_REGEX.EMAIL.test(email);
  }

  /**
   * Validate IP address
   */
  static isValidIP(ip: string): boolean {
    return VALIDATION_REGEX.IP_ADDRESS.test(ip);
  }

  /**
   * Validate domain name
   */
  static isValidDomain(domain: string): boolean {
    return VALIDATION_REGEX.DOMAIN.test(domain);
  }

  /**
   * Validate URL
   */
  static isValidURL(url: string): boolean {
    return VALIDATION_REGEX.URL.test(url);
  }

  /**
   * Validate hash (MD5, SHA1, SHA256)
   */
  static isValidHash(hash: string, type: 'md5' | 'sha1' | 'sha256' = 'sha256'): boolean {
    switch (type) {
      case 'md5':
        return VALIDATION_REGEX.HASH_MD5.test(hash);
      case 'sha1':
        return VALIDATION_REGEX.HASH_SHA1.test(hash);
      case 'sha256':
        return VALIDATION_REGEX.HASH_SHA256.test(hash);
      default:
        return false;
    }
  }

  /**
   * Validate search query
   */
  static isValidSearchQuery(query: string): boolean {
    return query.trim().length >= 2 && query.trim().length <= 500;
  }
}

/**
 * Date and Time Utilities
 */
export class DateUtils {
  /**
   * Format date to ISO string
   */
  static toISOString(date: Date = new Date()): string {
    return date.toISOString();
  }

  /**
   * Parse time range string to date range
   */
  static parseTimeRange(timeRange: string): { start?: Date; end?: Date } {
    const now = new Date();
    const end = new Date(now);
    let start: Date | undefined;

    switch (timeRange) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '1d':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1w':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = undefined;
    }

    return { start, end };
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

/**
 * String Utilities
 */
export class StringUtils {
  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Sanitize string for safe display
   */
  static sanitize(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Generate random ID
   */
  static generateId(prefix: string = 'nr'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Convert string to slug
   */
  static toSlug(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Highlight search terms in text
   */
  static highlightSearchTerms(text: string, terms: string[]): string {
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }
}

/**
 * Array Utilities
 */
export class ArrayUtils {
  /**
   * Remove duplicates from array
   */
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Sort array by multiple fields
   */
  static sortBy<T>(array: T[], ...keys: (keyof T)[]): T[] {
    return array.sort((a, b) => {
      for (const key of keys) {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  }

  /**
   * Group array by key
   */
  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}

/**
 * Object Utilities
 */
export class ObjectUtils {
  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as unknown as T;
    
    if (typeof obj === 'object') {
      const clonedObj = {} as { [key: string]: unknown };
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          clonedObj[key] = this.deepClone(obj[key as keyof T]);
        }
      }
      return clonedObj as T;
    }
    
    return obj;
  }

  /**
   * Check if object is empty
   */
  static isEmpty(obj: Record<string, unknown>): boolean {
    return Object.keys(obj).length === 0;
  }

  /**
   * Pick specific keys from object
   */
  static pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    const rec = obj as unknown as Record<string, unknown>;
      keys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(rec, key as string)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result as any)[key] = (obj as any)[key];
        }
      });
    return result;
  }

  /**
   * Omit specific keys from object
   */
  static omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }
}

/**
 * Performance Utilities
 */
export class PerformanceUtils {
  /**
   * Debounce function
   */
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T, 
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T, 
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Measure execution time
   */
  static async measureTime<T>(
    operation: () => Promise<T> | T, 
    label?: string
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    
    if (label) {
      console.log(`${label} took ${duration.toFixed(2)}ms`);
    }
    
    return { result, duration };
  }
}

/**
 * Data Format Utilities
 */
export class FormatUtils {
  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format number with commas
   */
  static formatNumber(num: number): string {
    return num.toLocaleString();
  }

  /**
   * Format confidence score as percentage
   */
  static formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  }

  /**
   * Format JSON for display
   */
  static formatJSON(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
  }
}
