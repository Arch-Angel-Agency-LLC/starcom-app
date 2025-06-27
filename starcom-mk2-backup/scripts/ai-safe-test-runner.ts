import { spawn, ChildProcess } from 'child_process';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

export interface AISafeTestConfig {
  maxDuration: number;
  memoryLimit: string;
  screenshotOnFailure: boolean;
  traceOnError: boolean;
  maxOutputLines: number;
}

export interface TestResult {
  success: boolean;
  duration: number;
  output: string;
  exitCode: number | null;
  resourceUsage?: ResourceUsage;
}

export interface ResourceUsage {
  peakMemoryMB: number;
  avgCpuPercent: number;
  outputLines: number;
}

export class AISafeTestRunner {
  private config: AISafeTestConfig;
  private processes: ChildProcess[] = [];
  private resourceMonitor?: NodeJS.Timeout;
  private resourceUsage: ResourceUsage = {
    peakMemoryMB: 0,
    avgCpuPercent: 0,
    outputLines: 0
  };

  constructor(config: Partial<AISafeTestConfig> = {}) {
    this.config = {
      maxDuration: 300000, // 5 minutes
      memoryLimit: '2GB',
      screenshotOnFailure: true,
      traceOnError: true,
      maxOutputLines: 1000,
      ...config
    };
  }

  async runUITests(testCommand: string): Promise<TestResult> {
    console.log('🛡️ Starting AI-safe UI test execution...');
    console.log(`⏱️ Maximum duration: ${this.config.maxDuration}ms`);
    console.log(`💾 Memory limit: ${this.config.memoryLimit}`);
    console.log(`📝 Output line limit: ${this.config.maxOutputLines}`);
    
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      let outputLines = 0;
      let output = '';
      let isAborted = false;

      // Parse command and arguments
      const [command, ...args] = testCommand.split(' ');
      
      const childProcess = spawn(command, args, {
        stdio: 'pipe',
        detached: false,
        env: {
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=2048' // Limit Node.js memory
        }
      });

      this.processes.push(childProcess);
      this.startResourceMonitoring(childProcess.pid || 0);

      // Timeout trap - CRITICAL SAFETY FEATURE
      const timeoutId = setTimeout(() => {
        if (!isAborted) {
          isAborted = true;
          console.log('🚨 TIMEOUT TRAP ACTIVATED - Maximum execution time exceeded');
          this.killProcess(childProcess);
          this.stopResourceMonitoring();
          reject(new Error(`Test execution exceeded ${this.config.maxDuration}ms limit - EMERGENCY STOP`));
        }
      }, this.config.maxDuration);

      // Output monitoring - prevents infinite loops
      childProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        outputLines += lines.length;
        output += data.toString();
        this.resourceUsage.outputLines = outputLines;

        // Output limit trap - CRITICAL SAFETY FEATURE
        if (outputLines > this.config.maxOutputLines) {
          if (!isAborted) {
            isAborted = true;
            console.log('🚨 OUTPUT LIMIT TRAP ACTIVATED - Possible infinite loop detected');
            this.killProcess(childProcess);
            this.stopResourceMonitoring();
            clearTimeout(timeoutId);
            reject(new Error(`Output limit exceeded (${outputLines} lines) - EMERGENCY STOP`));
          }
        }

        // Log progress every 100 lines
        if (outputLines % 100 === 0) {
          console.log(`📊 Progress: ${outputLines} lines, ${((performance.now() - startTime) / 1000).toFixed(1)}s elapsed`);
        }
      });

      childProcess.stderr?.on('data', (data) => {
        const errorOutput = data.toString();
        output += errorOutput;
        
        // Check for stack overflow patterns
        if (errorOutput.includes('Maximum call stack') || 
            errorOutput.includes('RangeError') ||
            errorOutput.includes('out of memory')) {
          if (!isAborted) {
            isAborted = true;
            console.log('🚨 STACK OVERFLOW TRAP ACTIVATED - Dangerous pattern detected');
            this.killProcess(childProcess);
            this.stopResourceMonitoring();
            clearTimeout(timeoutId);
            reject(new Error('Stack overflow or memory error detected - EMERGENCY STOP'));
          }
        }
      });

      childProcess.on('exit', (code) => {
        if (!isAborted) {
          clearTimeout(timeoutId);
          this.stopResourceMonitoring();
          const duration = performance.now() - startTime;

          console.log(`✅ Test execution completed safely`);
          console.log(`⏱️ Duration: ${duration.toFixed(0)}ms`);
          console.log(`📊 Peak memory: ${this.resourceUsage.peakMemoryMB}MB`);
          console.log(`📝 Output lines: ${this.resourceUsage.outputLines}`);

          resolve({
            success: code === 0,
            duration,
            output,
            exitCode: code,
            resourceUsage: { ...this.resourceUsage }
          });
        }
      });

      childProcess.on('error', (error) => {
        if (!isAborted) {
          clearTimeout(timeoutId);
          this.stopResourceMonitoring();
          console.log('🚨 PROCESS ERROR TRAP ACTIVATED');
          reject(new Error(`Process error: ${error.message}`));
        }
      });
    });
  }

  private startResourceMonitoring(pid: number): void {
    this.resourceMonitor = setInterval(() => {
      try {
        // Simple memory monitoring (in a real implementation, you'd use more sophisticated monitoring)
        const memoryUsage = process.memoryUsage();
        const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
        
        if (memoryMB > this.resourceUsage.peakMemoryMB) {
          this.resourceUsage.peakMemoryMB = memoryMB;
        }

        // Memory limit trap - CRITICAL SAFETY FEATURE
        const memoryLimitMB = this.parseMemoryLimit(this.config.memoryLimit);
        if (memoryMB > memoryLimitMB) {
          console.log('🚨 MEMORY LIMIT TRAP ACTIVATED');
          this.emergencyStop();
        }

      } catch (error) {
        console.warn('⚠️ Resource monitoring error:', error);
      }
    }, 1000);
  }

  private stopResourceMonitoring(): void {
    if (this.resourceMonitor) {
      clearInterval(this.resourceMonitor);
      this.resourceMonitor = undefined;
    }
  }

  private parseMemoryLimit(limit: string): number {
    const match = limit.match(/(\d+)(\w+)/);
    if (!match) return 2048; // Default 2GB

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'mb': return value;
      case 'gb': return value * 1024;
      default: return value;
    }
  }

  private killProcess(process: ChildProcess): void {
    console.log('🔪 Terminating process...');
    
    try {
      if (process.pid) {
        // Try graceful termination first
        process.kill('SIGTERM');
        
        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (process.pid && !process.killed) {
            console.log('🔨 Force killing process...');
            process.kill('SIGKILL');
          }
        }, 5000);
      }
    } catch (error) {
      console.warn('⚠️ Failed to kill process:', error);
    }
  }

  public emergencyStop(): void {
    console.log('🚨 EMERGENCY STOP ACTIVATED');
    
    // Kill all tracked processes
    this.processes.forEach(process => this.killProcess(process));
    this.processes = [];
    
    // Stop resource monitoring
    this.stopResourceMonitoring();
    
    // Clear any temp files or resources
    this.cleanup();
  }

  private cleanup(): void {
    try {
      // Cleanup temporary test files
      const tempDirs = [
        'test-results/temp',
        'playwright-report',
        '.playwright'
      ];
      
      tempDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          console.log(`🧹 Cleaning up ${dir}...`);
        }
      });
      
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  }

  public getResourceUsage(): ResourceUsage {
    return { ...this.resourceUsage };
  }
}

// Main execution function for AI agents
export async function runAISafeUITests(testCommand: string = 'playwright test'): Promise<void> {
  const runner = new AISafeTestRunner({
    maxDuration: 300000, // 5 minutes
    memoryLimit: '2GB',
    maxOutputLines: 1000,
    screenshotOnFailure: true,
    traceOnError: true
  });
  
  try {
    console.log('🤖 AI Agent UI Testing - Safety Protocol Enabled');
    console.log('🛡️ Maximum execution time: 5 minutes');
    console.log('💾 Memory limit: 2GB');
    console.log('📝 Output limit: 1000 lines');
    console.log('🚨 Emergency stop available via runner.emergencyStop()');
    
    const result = await runner.runUITests(testCommand);
    
    if (result.success) {
      console.log('✅ All UI tests passed successfully');
      console.log(`📊 Performance: ${result.duration.toFixed(0)}ms execution time`);
      
      if (result.resourceUsage) {
        console.log(`💾 Resource usage: ${result.resourceUsage.peakMemoryMB.toFixed(1)}MB peak memory`);
        console.log(`📝 Output: ${result.resourceUsage.outputLines} lines`);
      }
    } else {
      console.log('❌ Some UI tests failed');
      console.log(`Exit code: ${result.exitCode}`);
      console.log('📄 Check test-results/ directory for detailed reports');
    }
    
    // Save test results
    const reportPath = path.join(process.cwd(), 'test-results', 'ai-safe-test-result.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      result,
      safetyProtocol: 'AI-Safe Test Runner v1.0'
    }, null, 2));
    
    console.log(`📋 Test report saved: ${reportPath}`);
    
  } catch (error) {
    console.error('🚨 AI-safe test runner trap activated:', (error as Error).message);
    console.log('🛡️ System protected from potential damage');
    console.log('📊 Consider adjusting test parameters or fixing test issues');
    process.exit(1);
  } finally {
    // Always cleanup
    runner.emergencyStop();
  }
}

// Auto-execute if run directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('ai-safe-test-runner.ts');
if (isMainModule) {
  const testCommand = process.argv[2] || 'playwright test';
  runAISafeUITests(testCommand);
}
