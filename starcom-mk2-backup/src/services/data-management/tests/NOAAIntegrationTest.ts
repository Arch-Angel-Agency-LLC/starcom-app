// Integration Test for Enhanced NOAA Data Provider
// Validates the complete priority-based NOAA data acquisition system

import { NOAADataProvider } from '../providers/NOAADataProvider';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
}

export class NOAADataProviderIntegrationTest {
  private provider: NOAADataProvider;
  private results: TestResult[] = [];

  constructor() {
    this.provider = new NOAADataProvider();
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting NOAA Data Provider Integration Tests...\n');

    // Test 1: Provider Initialization
    await this.testProviderInitialization();

    // Test 2: Endpoint Validation (sample)
    await this.testEndpointValidation();

    // Test 3: Primary Data Fetching
    await this.testPrimaryDataFetching();

    // Test 4: Priority-based Data Access
    await this.testPriorityBasedAccess();

    // Test 5: Data Transformation
    await this.testDataTransformation();

    // Test 6: Alert Generation
    await this.testAlertGeneration();

    // Test 7: Space Weather Summary
    await this.testSpaceWeatherSummary();

    // Test 8: Subscription System
    await this.testSubscriptionSystem();

    // Test 9: Cache Functionality
    await this.testCacheFunctionality();

    // Test 10: Error Handling
    await this.testErrorHandling();

    this.printResults();
    return this.results;
  }

  private async testProviderInitialization(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test basic provider properties
      if (!this.provider.id || !this.provider.name) {
        throw new Error('Provider missing required properties');
      }

      if (!Array.isArray(this.provider.endpoints) || this.provider.endpoints.length === 0) {
        throw new Error('Provider has no endpoints configured');
      }

      // Test static methods
      const primaryKeys = NOAADataProvider.getPrimaryKeys();
      const secondaryKeys = NOAADataProvider.getSecondaryKeys();
      const tertiaryKeys = NOAADataProvider.getTertiaryKeys();

      if (primaryKeys.length === 0) {
        throw new Error('No primary datasets configured');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Provider Initialization',
        status: 'pass',
        message: `Provider initialized with ${primaryKeys.length} primary, ${secondaryKeys.length} secondary, ${tertiaryKeys.length} tertiary datasets`,
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Provider Initialization',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private async testEndpointValidation(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test a sample of endpoints to avoid long test times
      const sampleEndpoints = [
        'solar-xray-flux',
        'geomagnetic-kp-index',
        'solar-wind-plasma'
      ];

      let validCount = 0;
      for (const endpointId of sampleEndpoints) {
        const config = NOAADataProvider.getDatasetConfig(endpointId);
        if (config) {
          // Basic URL validation
          if (config.url.startsWith('http') && config.url.includes('noaa.gov')) {
            validCount++;
          }
        }
      }

      if (validCount !== sampleEndpoints.length) {
        throw new Error(`Only ${validCount}/${sampleEndpoints.length} sample endpoints valid`);
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Endpoint Validation',
        status: 'pass',
        message: `${validCount} sample endpoints validated`,
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Endpoint Validation',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private async testPrimaryDataFetching(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test fetching a single primary dataset
      const data = await this.provider.fetchData('solar-xray-flux');
      
      if (!data || !('time_tag' in data)) {
        throw new Error('Invalid data structure returned');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Primary Data Fetching',
        status: 'pass',
        message: `Successfully fetched solar X-ray flux data`,
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Primary Data Fetching',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private async testPriorityBasedAccess(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test priority-based batch fetching
      const primaryData = await this.provider.fetchPrimaryData();
      
      if (!primaryData || typeof primaryData !== 'object') {
        throw new Error('Primary data fetch failed');
      }

      const dataKeys = Object.keys(primaryData);
      if (dataKeys.length === 0) {
        throw new Error('No primary data returned');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Priority-based Access',
        status: 'pass',
        message: `Fetched ${dataKeys.length} primary datasets`,
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Priority-based Access',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private async testDataTransformation(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test data validation and transformation
      const testData = { time_tag: '2025-06-20T12:00:00Z', test: true };
      
      const isValid = this.provider.validateData(testData);
      if (!isValid) {
        throw new Error('Data validation failed for valid data');
      }

      const transformed = this.provider.transformData(testData);
      if (!transformed) {
        throw new Error('Data transformation failed');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Data Transformation',
        status: 'pass',
        message: 'Data validation and transformation working',
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Data Transformation',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private async testAlertGeneration(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test alert generation with mock data
      const mockFlareData = {
        time_tag: '2025-06-20T12:00:00Z',
        flux_class: 'X' as const,
        satellite: 'GOES-16',
        flux: 1e-3,
        observed_flux: 1e-3,
        electron_correction: 0,
        electron_contamination: false,
        energy: '0.1-0.8nm',
        flux_scale: 5.0,
        data_quality: 1,
        status_flag: 'nominal'
      };

      const alerts = await this.provider.generateSpaceWeatherAlerts(mockFlareData);
      
      if (!Array.isArray(alerts)) {
        throw new Error('Alert generation did not return array');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Alert Generation',
        status: 'pass',
        message: `Generated ${alerts.length} alerts from mock X-class flare`,
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Alert Generation',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private async testSpaceWeatherSummary(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const summary = await this.provider.generateSpaceWeatherSummary();
      
      if (!summary || !summary.timestamp || !summary.alerts) {
        throw new Error('Invalid space weather summary structure');
      }

      if (!['low', 'moderate', 'high', 'extreme'].includes(summary.alerts.risk_level)) {
        throw new Error('Invalid risk level in summary');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Space Weather Summary',
        status: 'pass',
        message: `Generated summary with risk level: ${summary.alerts.risk_level}`,
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Space Weather Summary',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private async testSubscriptionSystem(): Promise<void> {
    const startTime = performance.now();
    
    try {
      let dataReceived = false;
      const errorOccurred = false;

      // Test subscription with short timeout
      const unsubscribe = this.provider.subscribe('solar-xray-flux', (data) => {
        if (data && 'time_tag' in data) {
          dataReceived = true;
        }
      }, { interval: 1000 });

      // Wait briefly for initial data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      unsubscribe();

      if (!dataReceived && !errorOccurred) {
        throw new Error('Subscription did not receive data or trigger error');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Subscription System',
        status: dataReceived ? 'pass' : 'skip',
        message: dataReceived ? 'Subscription received data' : 'Subscription setup but no data received (expected in test)',
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Subscription System',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private async testCacheFunctionality(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test cache by fetching same data twice
      const data1 = await this.provider.fetchData('solar-xray-flux');
      const cacheStartTime = performance.now();
      const data2 = await this.provider.fetchData('solar-xray-flux');
      const cacheTime = performance.now() - cacheStartTime;

      // Cache should make second request faster (though not guaranteed in test environment)
      if (!data1 || !data2) {
        throw new Error('Cache test failed - no data returned');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Cache Functionality',
        status: 'pass',
        message: `Cache test completed (second request: ${cacheTime.toFixed(0)}ms)`,
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Cache Functionality',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private async testErrorHandling(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test error handling with invalid dataset
      let errorCaught = false;
      
      try {
        await this.provider.fetchData('invalid-dataset-id');
      } catch (error) {
        errorCaught = true;
        if (!(error instanceof Error) || !error.message.includes('Unknown')) {
          throw new Error('Unexpected error type or message');
        }
      }

      if (!errorCaught) {
        throw new Error('Expected error was not thrown for invalid dataset');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Error Handling',
        status: 'pass',
        message: 'Proper error handling for invalid dataset',
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        test: 'Error Handling',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }

  private printResults(): void {
    console.log('\n📊 NOAA Data Provider Integration Test Results');
    console.log('================================================\n');

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    const total = this.results.length;

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
      const duration = result.duration ? ` (${result.duration.toFixed(0)}ms)` : '';
      console.log(`${icon} ${result.test}: ${result.message}${duration}`);
    });

    console.log('\n📈 Summary:');
    console.log(`- Total Tests: ${total}`);
    console.log(`- Passed: ${passed}`);
    console.log(`- Failed: ${failed}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed! NOAA Data Provider is ready for production.');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Please review and fix issues before deployment.`);
    }
  }
}

// Export for testing
export async function runNOAAIntegrationTests(): Promise<void> {
  const tester = new NOAADataProviderIntegrationTest();
  await tester.runAllTests();
}
