import { safeTestRunner } from './safe-test-runner.js';

async function testNoaaSafely() {
  try {
    console.log('🛡️ Running NOAA tests with safety traps...');
    
    const result = await safeTestRunner('vitest run src/services/noaaSpaceWeather.test.ts', {
      timeout: 15000, // Shorter timeout for NOAA tests
      maxOutputLines: 50
    });
    
    console.log('✅ NOAA test completed safely');
    console.log('Output preview:', result.output.slice(0, 1000));
    
  } catch (error) {
    console.log('🚨 Trap activated:', (error as Error).message);
    console.log('NOAA test was safely terminated before system freeze');
    process.exit(1);
  }
}

// Run it
testNoaaSafely();
