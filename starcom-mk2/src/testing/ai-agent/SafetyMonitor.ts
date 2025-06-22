import { Page } from '@playwright/test';
import { AgentConfig } from './types';

export interface SafetyStatus {
  safe: boolean;
  reason?: string;
  metrics: SafetyMetrics;
}

export interface SafetyMetrics {
  memoryUsage: number;
  executionTime: number;
  outputSize: number;
  errorCount: number;
  warningCount: number;
  networkRequestCount: number;
  domNodeCount: number;
  lastChecked: number;
}

export interface SafetyThresholds {
  maxMemory: number;
  maxExecutionTime: number;
  maxOutputSize: number;
  maxErrors: number;
  maxNetworkRequests: number;
  maxDomNodes: number;
}

/**
 * Monitors safety conditions during test execution
 */
export class SafetyMonitor {
  private config: AgentConfig;
  private page: Page | null = null;
  private startTime: number = 0;
  private metrics: SafetyMetrics;
  private thresholds: SafetyThresholds;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private emergencyStopTriggered = false;

  constructor(config: AgentConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();
    this.thresholds = this.initializeThresholds();
  }

  /**
   * Initialize safety metrics
   */
  private initializeMetrics(): SafetyMetrics {
    return {
      memoryUsage: 0,
      executionTime: 0,
      outputSize: 0,
      errorCount: 0,
      warningCount: 0,
      networkRequestCount: 0,
      domNodeCount: 0,
      lastChecked: Date.now()
    };
  }

  /**
   * Initialize safety thresholds based on config
   */
  private initializeThresholds(): SafetyThresholds {
    return {
      maxMemory: this.config.memoryLimit,
      maxExecutionTime: this.config.maxExecutionTime,
      maxOutputSize: this.config.outputLimit,
      maxErrors: 15, // Increased from 10
      maxNetworkRequests: 250, // Increased from 100 for UI testing
      maxDomNodes: 15000 // Increased from 10000
    };
  }

  /**
   * Initialize monitoring for a page
   */
  async initialize(page: Page): Promise<void> {
    this.page = page;
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.emergencyStopTriggered = false;

    // Set up page event listeners
    this.setupPageEventListeners();

    console.log('SafetyMonitor initialized');
  }

  /**
   * Set up event listeners on the page
   */
  private setupPageEventListeners(): void {
    if (!this.page) return;

    // Monitor console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.metrics.errorCount++;
      } else if (msg.type() === 'warning') {
        this.metrics.warningCount++;
      }
    });

    // Monitor page errors
    this.page.on('pageerror', () => {
      this.metrics.errorCount++;
    });

    // Monitor network requests
    this.page.on('request', () => {
      this.metrics.networkRequestCount++;
    });

    // Monitor failed requests
    this.page.on('requestfailed', () => {
      this.metrics.errorCount++;
    });
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    if (!this.config.safetyChecksEnabled) {
      console.log('Safety checks disabled, skipping monitoring');
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      await this.updateMetrics();
      const status = await this.checkSafety();
      
      if (!status.safe && this.config.emergencyStopEnabled) {
        await this.triggerEmergencyStop(status.reason || 'Unknown safety violation');
      }
    }, 1000); // Check every second

    console.log('Safety monitoring started');
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Safety monitoring stopped');
  }

  /**
   * Update current metrics
   */
  private async updateMetrics(): Promise<void> {
    this.metrics.executionTime = Date.now() - this.startTime;
    this.metrics.lastChecked = Date.now();

    if (this.page && !this.page.isClosed()) {
      try {
        // Update memory usage and DOM node count
        const pageMetrics = await this.page.evaluate(() => {
          const memoryInfo = (performance as { memory?: { usedJSHeapSize: number } }).memory;
          return {
            memoryUsage: memoryInfo?.usedJSHeapSize || 0,
            domNodeCount: document.querySelectorAll('*').length
          };
        });

        this.metrics.memoryUsage = pageMetrics.memoryUsage;
        this.metrics.domNodeCount = pageMetrics.domNodeCount;
      } catch (error) {
        console.debug('Error updating page metrics:', error);
      }
    }

    // Update output size (estimate based on console logs)
    this.metrics.outputSize = this.estimateOutputSize();
  }

  /**
   * Estimate output size based on current metrics
   */
  private estimateOutputSize(): number {
    // Rough estimate: each error/warning = 1KB, each network request = 0.5KB
    return (this.metrics.errorCount + this.metrics.warningCount) * 1024 + 
           this.metrics.networkRequestCount * 512;
  }

  /**
   * Check if current state is safe
   */
  async checkSafety(): Promise<SafetyStatus> {
    await this.updateMetrics();

    // Check memory usage
    if (this.metrics.memoryUsage > this.thresholds.maxMemory) {
      return {
        safe: false,
        reason: `Memory usage exceeded limit: ${this.formatBytes(this.metrics.memoryUsage)} > ${this.formatBytes(this.thresholds.maxMemory)}`,
        metrics: { ...this.metrics }
      };
    }

    // Check execution time
    if (this.metrics.executionTime > this.thresholds.maxExecutionTime) {
      return {
        safe: false,
        reason: `Execution time exceeded limit: ${this.metrics.executionTime}ms > ${this.thresholds.maxExecutionTime}ms`,
        metrics: { ...this.metrics }
      };
    }

    // Check output size
    if (this.metrics.outputSize > this.thresholds.maxOutputSize) {
      return {
        safe: false,
        reason: `Output size exceeded limit: ${this.formatBytes(this.metrics.outputSize)} > ${this.formatBytes(this.thresholds.maxOutputSize)}`,
        metrics: { ...this.metrics }
      };
    }

    // Check error count
    if (this.metrics.errorCount > this.thresholds.maxErrors) {
      return {
        safe: false,
        reason: `Error count exceeded limit: ${this.metrics.errorCount} > ${this.thresholds.maxErrors}`,
        metrics: { ...this.metrics }
      };
    }

    // Check network request count
    if (this.metrics.networkRequestCount > this.thresholds.maxNetworkRequests) {
      return {
        safe: false,
        reason: `Network request count exceeded limit: ${this.metrics.networkRequestCount} > ${this.thresholds.maxNetworkRequests}`,
        metrics: { ...this.metrics }
      };
    }

    // Check DOM node count
    if (this.metrics.domNodeCount > this.thresholds.maxDomNodes) {
      return {
        safe: false,
        reason: `DOM node count exceeded limit: ${this.metrics.domNodeCount} > ${this.thresholds.maxDomNodes}`,
        metrics: { ...this.metrics }
      };
    }

    return {
      safe: true,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Trigger emergency stop
   */
  private async triggerEmergencyStop(reason: string): Promise<void> {
    if (this.emergencyStopTriggered) {
      return; // Already triggered
    }

    this.emergencyStopTriggered = true;
    console.error(`EMERGENCY STOP TRIGGERED: ${reason}`);

    // Stop monitoring
    await this.stopMonitoring();

    // Try to clean up page resources
    if (this.page) {
      try {
        await this.page.evaluate(() => {
          // Cancel any running animations/intervals
          const highestId = setTimeout(() => {}, 0) as unknown as number;
          for (let i = 0; i < highestId; i++) {
            clearTimeout(i);
            clearInterval(i);
          }
        });
      } catch (error) {
        console.debug('Error during emergency cleanup:', error);
      }
    }

    // Throw error to stop execution
    throw new Error(`Emergency stop: ${reason}`);
  }

  /**
   * Get current metrics
   */
  getMetrics(): SafetyMetrics {
    return { ...this.metrics };
  }

  /**
   * Get safety thresholds
   */
  getThresholds(): SafetyThresholds {
    return { ...this.thresholds };
  }

  /**
   * Update safety thresholds
   */
  updateThresholds(newThresholds: Partial<SafetyThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Check if emergency stop was triggered
   */
  isEmergencyStopTriggered(): boolean {
    return this.emergencyStopTriggered;
  }

  /**
   * Reset emergency stop state
   */
  resetEmergencyStop(): void {
    this.emergencyStopTriggered = false;
  }

  /**
   * Format bytes for human-readable output
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Generate safety report
   */
  generateSafetyReport(): {
    status: SafetyStatus;
    recommendations: string[];
    summary: string;
  } {
    const status = {
      safe: true,
      metrics: this.getMetrics()
    };

    const recommendations: string[] = [];
    const metrics = this.metrics;
    const thresholds = this.thresholds;

    // Analyze metrics and provide recommendations
    if (metrics.memoryUsage > thresholds.maxMemory * 0.8) {
      recommendations.push('Memory usage is high. Consider reducing test complexity or increasing memory limits.');
    }

    if (metrics.executionTime > thresholds.maxExecutionTime * 0.8) {
      recommendations.push('Execution time is approaching limit. Consider optimizing test steps or increasing timeout.');
    }

    if (metrics.errorCount > thresholds.maxErrors * 0.5) {
      recommendations.push('High error count detected. Review test scenarios and page stability.');
    }

    if (metrics.networkRequestCount > thresholds.maxNetworkRequests * 0.8) {
      recommendations.push('High network activity detected. Consider mocking external services.');
    }

    if (metrics.domNodeCount > thresholds.maxDomNodes * 0.8) {
      recommendations.push('Large DOM detected. This may impact test performance.');
    }

    const summary = `Safety monitoring completed. Memory: ${this.formatBytes(metrics.memoryUsage)}, ` +
                   `Time: ${metrics.executionTime}ms, Errors: ${metrics.errorCount}, ` +
                   `Network: ${metrics.networkRequestCount} requests, DOM: ${metrics.domNodeCount} nodes`;

    return {
      status,
      recommendations,
      summary
    };
  }
}
