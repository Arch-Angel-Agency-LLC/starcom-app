import { spawn } from 'child_process';

interface SafeTestOptions {
  timeout?: number;
  maxOutputLines?: number;
}

export async function safeTestRunner(
  testCommand: string,
  options: SafeTestOptions = {}
): Promise<{ code: number | null; output: string }> {
  const {
    timeout = 30000, // 30 second timeout
    maxOutputLines = 100 // Limit output to prevent overflow
  } = options;

  return new Promise((resolve, reject) => {
    console.log(`🛡️ Safe Test Runner: ${testCommand}`);
    console.log(`⏱️ Timeout: ${timeout}ms | 📄 Max Lines: ${maxOutputLines}`);
    
    const child = spawn('npx', testCommand.split(' '), {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout,
      detached: false
    });

    let outputLines = 0;
    let output = '';
    let timedOut = false;

    // Timeout trap
    const timeoutId = setTimeout(() => {
      timedOut = true;
      console.log('🚨 TIMEOUT TRAP ACTIVATED - Killing process');
      child.kill('SIGKILL');
      reject(new Error(`Test timed out after ${timeout}ms - possible infinite loop`));
    }, timeout);

    // Output line counting trap
    child.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n').length;
      outputLines += lines;
      
      if (outputLines > maxOutputLines) {
        console.log('🚨 OUTPUT OVERFLOW TRAP ACTIVATED - Killing process');
        child.kill('SIGKILL');
        reject(new Error(`Test output exceeded ${maxOutputLines} lines - possible infinite logging`));
        return;
      }
      
      output += data.toString();
    });

    // Error output trap
    child.stderr?.on('data', (data) => {
      const errorText = data.toString();
      
      // Check for stack overflow patterns
      if (errorText.includes('Maximum call stack') || 
          errorText.includes('RangeError') ||
          errorText.includes('stack overflow') ||
          errorText.includes('FATAL ERROR')) {
        console.log('🚨 STACK OVERFLOW TRAP ACTIVATED - Killing process');
        child.kill('SIGKILL');
        reject(new Error('Stack overflow detected in test'));
        return;
      }
      
      output += errorText;
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        console.log(`✅ Test completed safely with code: ${code}`);
        resolve({ code, output: output.slice(0, 5000) }); // Limit output size
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      console.log('🚨 PROCESS ERROR TRAP ACTIVATED');
      reject(error);
    });
  });
}
