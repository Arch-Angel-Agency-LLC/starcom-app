import { Page } from '@playwright/test';

export interface AgentConfig {
  maxExecutionTime: number;
  memoryLimit: number;
  outputLimit: number;
  emergencyStopEnabled: boolean;
  visualRegressionEnabled: boolean;
  accessibilityEnabled: boolean;
  performanceEnabled: boolean;
  safetyChecksEnabled: boolean;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  assertions: TestAssertion[];
  cleanup?: () => Promise<void>;
}

export interface TestStep {
  type: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot' | 'custom';
  selector?: string;
  url?: string;
  text?: string;
  timeout?: number;
  customAction?: (page: Page) => Promise<void>;
}

export interface TestAssertion {
  type: 'visible' | 'text' | 'attribute' | 'count' | 'performance' | 'accessibility';
  selector?: string;
  expected: unknown;
  message?: string;
}

export interface DetectedComponent {
  id: string;
  type: string;
  selector: string;
  properties: Record<string, unknown>;
}

export interface AgentTestResult {
  scenario: TestScenario;
  success: boolean;
  duration: number;
  screenshots: string[];
  errors: Error[];
  warnings: string[];
  performance?: PerformanceResult;
  accessibility?: AccessibilityResult;
  visualRegression?: VisualRegressionResult;
}

export interface PerformanceResult {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  passed: boolean;
}

export interface AccessibilityResult {
  violations: AccessibilityViolation[];
  passed: boolean;
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityNode {
  html: string;
  impact: string;
  target: string[];
}

export interface VisualRegressionResult {
  baseline: string;
  actual: string;
  diff?: string;
  pixelDifference: number;
  threshold: number;
  passed: boolean;
}

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage?: number;
  networkRequests?: number;
}
