import { Page } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export interface VisualRegressionResults {
  baseline: string;
  current: string;
  diff?: string;
  pixelDifference: number;
  threshold: number;
  passed: boolean;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface VisualRegressionConfig {
  threshold: number;
  includeAA: boolean;
  alpha: number;
  baselineDir: string;
  currentDir: string;
  diffDir: string;
}

/**
 * Handles visual regression testing for UI components
 */
export class VisualRegression {
  private config: VisualRegressionConfig;

  constructor(config: Partial<VisualRegressionConfig> = {}) {
    this.config = {
      threshold: 0.2,
      includeAA: false,
      alpha: 0.1,
      baselineDir: 'test-results/visual/baseline',
      currentDir: 'test-results/visual/current',
      diffDir: 'test-results/visual/diff',
      ...config
    };
  }

  /**
   * Compare current screenshot with baseline
   */
  async compareScreenshot(page: Page, testId: string): Promise<VisualRegressionResults> {
    try {
      // Ensure directories exist
      await this.ensureDirectoriesExist();

      // Take current screenshot
      const currentPath = path.join(this.config.currentDir, `${testId}.png`);
      await page.screenshot({
        path: currentPath,
        fullPage: true,
        animations: 'disabled'
      });

      // Check if baseline exists
      const baselinePath = path.join(this.config.baselineDir, `${testId}.png`);
      const baselineExists = await this.fileExists(baselinePath);

      if (!baselineExists) {
        // Create baseline from current screenshot
        await fs.copyFile(currentPath, baselinePath);
        
        return {
          baseline: baselinePath,
          current: currentPath,
          pixelDifference: 0,
          threshold: this.config.threshold,
          passed: true
        };
      }

      // Compare images
      const comparisonResult = await this.compareImages(baselinePath, currentPath, testId);
      
      return {
        baseline: baselinePath,
        current: currentPath,
        diff: comparisonResult.diffPath,
        pixelDifference: comparisonResult.pixelDifference,
        threshold: this.config.threshold,
        passed: comparisonResult.pixelDifference <= this.config.threshold,
        dimensions: comparisonResult.dimensions
      };

    } catch (error) {
      console.error(`Visual regression test failed for ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Compare two images and generate diff
   */
  private async compareImages(
    baselinePath: string,
    currentPath: string,
    testId: string
  ): Promise<{
    pixelDifference: number;
    diffPath?: string;
    dimensions: { width: number; height: number };
  }> {
    try {
      // Read images
      const baselineBuffer = await fs.readFile(baselinePath);
      const currentBuffer = await fs.readFile(currentPath);

      const baselineImg = PNG.sync.read(baselineBuffer);
      const currentImg = PNG.sync.read(currentBuffer);

      // Check dimensions match
      if (baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height) {
        throw new Error(
          `Image dimensions don't match. Baseline: ${baselineImg.width}x${baselineImg.height}, ` +
          `Current: ${currentImg.width}x${currentImg.height}`
        );
      }

      const { width, height } = baselineImg;
      const diff = new PNG({ width, height });

      // Compare images
      const numDiffPixels = pixelmatch(
        baselineImg.data,
        currentImg.data,
        diff.data,
        width,
        height,
        {
          threshold: this.config.threshold,
          includeAA: this.config.includeAA,
          alpha: this.config.alpha
        }
      );

      const totalPixels = width * height;
      const pixelDifference = numDiffPixels / totalPixels;

      let diffPath: string | undefined;

      // Save diff image if there are differences
      if (numDiffPixels > 0) {
        diffPath = path.join(this.config.diffDir, `${testId}.png`);
        await fs.writeFile(diffPath, PNG.sync.write(diff));
      }

      return {
        pixelDifference,
        diffPath,
        dimensions: { width, height }
      };

    } catch (error) {
      console.error('Error comparing images:', error);
      throw error;
    }
  }

  /**
   * Take screenshot of specific element
   */
  async compareElementScreenshot(
    page: Page,
    selector: string,
    testId: string
  ): Promise<VisualRegressionResults> {
    try {
      await this.ensureDirectoriesExist();

      const element = page.locator(selector);
      await element.waitFor({ state: 'visible' });

      const currentPath = path.join(this.config.currentDir, `${testId}_element.png`);
      await element.screenshot({
        path: currentPath,
        animations: 'disabled'
      });

      const baselinePath = path.join(this.config.baselineDir, `${testId}_element.png`);
      const baselineExists = await this.fileExists(baselinePath);

      if (!baselineExists) {
        await fs.copyFile(currentPath, baselinePath);
        
        return {
          baseline: baselinePath,
          current: currentPath,
          pixelDifference: 0,
          threshold: this.config.threshold,
          passed: true
        };
      }

      const comparisonResult = await this.compareImages(baselinePath, currentPath, `${testId}_element`);
      
      return {
        baseline: baselinePath,
        current: currentPath,
        diff: comparisonResult.diffPath,
        pixelDifference: comparisonResult.pixelDifference,
        threshold: this.config.threshold,
        passed: comparisonResult.pixelDifference <= this.config.threshold,
        dimensions: comparisonResult.dimensions
      };

    } catch (error) {
      console.error(`Element visual regression test failed for ${selector}:`, error);
      throw error;
    }
  }

  /**
   * Update baseline with current screenshot
   */
  async updateBaseline(testId: string): Promise<void> {
    const currentPath = path.join(this.config.currentDir, `${testId}.png`);
    const baselinePath = path.join(this.config.baselineDir, `${testId}.png`);

    const currentExists = await this.fileExists(currentPath);
    if (!currentExists) {
      throw new Error(`Current screenshot not found: ${currentPath}`);
    }

    await fs.copyFile(currentPath, baselinePath);
    console.log(`Baseline updated for ${testId}`);
  }

  /**
   * Batch update baselines from current screenshots
   */
  async updateAllBaselines(): Promise<void> {
    try {
      const currentFiles = await fs.readdir(this.config.currentDir);
      const pngFiles = currentFiles.filter(file => file.endsWith('.png'));

      for (const file of pngFiles) {
        const testId = path.basename(file, '.png');
        await this.updateBaseline(testId);
      }

      console.log(`Updated ${pngFiles.length} baselines`);
    } catch (error) {
      console.error('Error updating baselines:', error);
      throw error;
    }
  }

  /**
   * Clean up old test results
   */
  async cleanup(olderThanDays = 7): Promise<void> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    const directories = [this.config.currentDir, this.config.diffDir];
    
    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          }
        }
      } catch {
        console.debug(`Error cleaning up directory ${dir}:`);
      }
    }
  }

  /**
   * Get test results summary
   */
  async getTestSummary(): Promise<{
    total: number;
    passed: number;
    failed: number;
    new: number;
    results: Array<{
      testId: string;
      status: 'passed' | 'failed' | 'new';
      pixelDifference?: number;
    }>;
  }> {
    try {
      const currentFiles = await fs.readdir(this.config.currentDir);
      const pngFiles = currentFiles.filter(file => file.endsWith('.png'));
      
      const results = [];
      let passed = 0;
      let failed = 0;
      let newTests = 0;

      for (const file of pngFiles) {
        const testId = path.basename(file, '.png');
        const baselinePath = path.join(this.config.baselineDir, file);
        const baselineExists = await this.fileExists(baselinePath);

        if (!baselineExists) {
          newTests++;
          results.push({ testId, status: 'new' as const });
        } else {
          const currentPath = path.join(this.config.currentDir, file);
          const comparison = await this.compareImages(baselinePath, currentPath, testId);
          
          if (comparison.pixelDifference <= this.config.threshold) {
            passed++;
            results.push({ 
              testId, 
              status: 'passed' as const, 
              pixelDifference: comparison.pixelDifference 
            });
          } else {
            failed++;
            results.push({ 
              testId, 
              status: 'failed' as const, 
              pixelDifference: comparison.pixelDifference 
            });
          }
        }
      }

      return {
        total: pngFiles.length,
        passed,
        failed,
        new: newTests,
        results
      };

    } catch (error) {
      console.error('Error generating test summary:', error);
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectoriesExist(): Promise<void> {
    const directories = [
      this.config.baselineDir,
      this.config.currentDir,
      this.config.diffDir
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch {
        console.debug(`Directory creation skipped (already exists): ${dir}`);
      }
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): VisualRegressionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VisualRegressionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
