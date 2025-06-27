// NOAA Endpoint Validation Tool
// Tests the availability and structure of NOAA data endpoints
// Use this to validate that URLs in NOAADataConfig.ts are correct

import { NOAA_DATA_PRIORITIES, NOAAEndpointConfig } from './NOAADataConfig';

interface EndpointValidationResult {
  id: string;
  url: string;
  status: 'success' | 'error' | 'warning';
  httpStatus?: number;
  dataSize?: number;
  dataStructure?: string;
  errorMessage?: string;
  responseTime?: number;
}

export class NOAAEndpointValidator {
  private readonly timeout = 10000; // 10 seconds

  async validateAllEndpoints(): Promise<EndpointValidationResult[]> {
    const allDatasets = [
      ...NOAA_DATA_PRIORITIES.primary,
      ...NOAA_DATA_PRIORITIES.secondary,
      ...NOAA_DATA_PRIORITIES.tertiary
    ];

    const results: EndpointValidationResult[] = [];
    
    console.log(`Starting validation of ${allDatasets.length} NOAA endpoints...`);

    // Validate primary endpoints first (highest priority)
    for (const dataset of NOAA_DATA_PRIORITIES.primary) {
      const result = await this.validateSingleEndpoint(dataset);
      results.push(result);
      console.log(`Primary [${result.status.toUpperCase()}] ${dataset.id}: ${result.errorMessage || 'OK'}`);
    }

    // Then secondary
    for (const dataset of NOAA_DATA_PRIORITIES.secondary) {
      const result = await this.validateSingleEndpoint(dataset);
      results.push(result);
      console.log(`Secondary [${result.status.toUpperCase()}] ${dataset.id}: ${result.errorMessage || 'OK'}`);
    }

    // Finally tertiary
    for (const dataset of NOAA_DATA_PRIORITIES.tertiary) {
      const result = await this.validateSingleEndpoint(dataset);
      results.push(result);
      console.log(`Tertiary [${result.status.toUpperCase()}] ${dataset.id}: ${result.errorMessage || 'OK'}`);
    }

    return results;
  }

  async validateSingleEndpoint(dataset: NOAAEndpointConfig): Promise<EndpointValidationResult> {
    const startTime = performance.now();
    
    try {
      // Handle special case of electric field endpoints that need directory listing
      if (dataset.url.endsWith('/')) {
        return await this.validateDirectoryEndpoint(dataset, startTime);
      } else {
        return await this.validateJSONEndpoint(dataset, startTime);
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        id: dataset.id,
        url: dataset.url,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      };
    }
  }

  private async validateJSONEndpoint(dataset: NOAAEndpointConfig, startTime: number): Promise<EndpointValidationResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(dataset.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Starcom-NOAA-Validator/1.0'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;

      if (!response.ok) {
        return {
          id: dataset.id,
          url: dataset.url,
          status: 'error',
          httpStatus: response.status,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }

      const data = await response.json();
      const dataSize = JSON.stringify(data).length;
      
      // Validate data structure
      const structureValidation = this.validateDataStructure(data);
      
      return {
        id: dataset.id,
        url: dataset.url,
        status: structureValidation.isValid ? 'success' : 'warning',
        httpStatus: response.status,
        dataSize,
        dataStructure: structureValidation.description,
        errorMessage: structureValidation.isValid ? undefined : structureValidation.warning,
        responseTime
      };

    } catch (error) {
      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;
      
      return {
        id: dataset.id,
        url: dataset.url,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Request failed',
        responseTime
      };
    }
  }

  private async validateDirectoryEndpoint(dataset: NOAAEndpointConfig, startTime: number): Promise<EndpointValidationResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(dataset.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Starcom-NOAA-Validator/1.0'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;

      if (!response.ok) {
        return {
          id: dataset.id,
          url: dataset.url,
          status: 'error',
          httpStatus: response.status,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }

      const html = await response.text();
      const dataSize = html.length;
      
      // Check for JSON files in directory listing
      const isInterMag = dataset.id.includes('intermag');
      const filePattern = isInterMag
        ? /href="(\d{8}T\d{6}-\d{2}-Efield-empirical-EMTF-[\d.-]+x[\d.-]+\.json)"/g
        : /href="(\d{8}T\d{6}-\d{2}-Efield-US-Canada\.json)"/g;
      
      const fileMatches = Array.from(html.matchAll(filePattern));
      
      if (fileMatches.length === 0) {
        return {
          id: dataset.id,
          url: dataset.url,
          status: 'warning',
          httpStatus: response.status,
          dataSize,
          dataStructure: 'Directory listing - no JSON files found',
          errorMessage: 'No matching JSON files found in directory',
          responseTime
        };
      }

      return {
        id: dataset.id,
        url: dataset.url,
        status: 'success',
        httpStatus: response.status,
        dataSize,
        dataStructure: `Directory listing - ${fileMatches.length} JSON files found`,
        responseTime
      };

    } catch (error) {
      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;
      
      return {
        id: dataset.id,
        url: dataset.url,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Request failed',
        responseTime
      };
    }
  }

  private validateDataStructure(data: unknown): { isValid: boolean; description: string; warning?: string } {
    if (!data) {
      return { isValid: false, description: 'No data', warning: 'Empty response' };
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { isValid: false, description: 'Empty array', warning: 'No data points available' };
      }

      const firstItem = data[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        const keys = Object.keys(firstItem);
        const hasTimeTag = keys.some(key => key.toLowerCase().includes('time'));
        
        if (!hasTimeTag) {
          return { 
            isValid: false, 
            description: `Array of ${data.length} objects (keys: ${keys.slice(0, 5).join(', ')})`,
            warning: 'No time_tag field found'
          };
        }

        return { 
          isValid: true, 
          description: `Array of ${data.length} objects with time series data`
        };
      }

      return { 
        isValid: false, 
        description: `Array of ${data.length} ${typeof firstItem} values`,
        warning: 'Expected array of objects'
      };
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return { 
        isValid: true, 
        description: `Object with keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`
      };
    }

    return { 
      isValid: false, 
      description: `${typeof data} value`,
      warning: 'Expected object or array'
    };
  }

  // Generate validation report
  generateReport(results: EndpointValidationResult[]): string {
    const successful = results.filter(r => r.status === 'success');
    const warnings = results.filter(r => r.status === 'warning');
    const errors = results.filter(r => r.status === 'error');

    const report = `
NOAA Endpoint Validation Report
================================

Summary:
- Total endpoints: ${results.length}
- Successful: ${successful.length}
- Warnings: ${warnings.length}
- Errors: ${errors.length}
- Success rate: ${((successful.length / results.length) * 100).toFixed(1)}%

Errors:
${errors.map(r => `  ❌ ${r.id}: ${r.errorMessage}`).join('\n')}

Warnings:
${warnings.map(r => `  ⚠️  ${r.id}: ${r.errorMessage}`).join('\n')}

Response Times:
- Average: ${(results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length).toFixed(0)}ms
- Fastest: ${Math.min(...results.map(r => r.responseTime || 0))}ms
- Slowest: ${Math.max(...results.map(r => r.responseTime || 0))}ms

Primary Dataset Status:
${results.filter(r => NOAA_DATA_PRIORITIES.primary.some(p => p.id === r.id))
  .map(r => `  ${r.status === 'success' ? '✅' : r.status === 'warning' ? '⚠️' : '❌'} ${r.id}`)
  .join('\n')}
`;

    return report;
  }
}

// Export for use in testing
export async function validateNOAAEndpoints(): Promise<void> {
  const validator = new NOAAEndpointValidator();
  const results = await validator.validateAllEndpoints();
  const report = validator.generateReport(results);
  
  console.log(report);
  
  // Log detailed results for debugging
  console.log('\nDetailed Results:');
  results.forEach(result => {
    console.log(`${result.id}:`, result);
  });
}
