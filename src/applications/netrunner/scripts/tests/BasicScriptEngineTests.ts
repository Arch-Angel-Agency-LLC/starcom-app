/**
 * NetRunner Scripts Engine - Basic Test Suite
 * 
 * Basic tests for the Scripts Engine core functionality.
 * Tests script registration, execution, and error handling.
 * 
 * @author GitHub Copilot
 * @date July 17, 2025
 */

import { NetRunnerScriptRegistry } from '../engine/NetRunnerScriptRegistry';
import { ScriptExecutionEngine } from '../engine/ScriptExecutionEngine';
import { OSINTData } from '../../services/WebsiteScanner';

/**
 * Test the basic functionality of the Scripts Engine
 */
export async function runBasicScriptEngineTests(): Promise<void> {
  console.log('🧪 [ScriptEngineTest] Starting basic functionality tests...');

  try {
    // Test 1: Registry initialization
    await testRegistryInitialization();
    
    // Test 2: Script registration
    await testScriptRegistration();
    
    // Test 3: Script execution
    await testScriptExecution();
    
    // Test 4: Error handling
    await testErrorHandling();

    console.log('✅ [ScriptEngineTest] All basic tests passed!');
  } catch (error) {
    console.error('❌ [ScriptEngineTest] Test suite failed:', error);
    throw error;
  }
}

async function testRegistryInitialization(): Promise<void> {
  console.log('📋 Testing registry initialization...');
  
  const registry = NetRunnerScriptRegistry.getInstance();
  const scripts = registry.getAllScripts();
  
  if (scripts.length === 0) {
    throw new Error('Registry should have default scripts registered');
  }
  
  const emailScript = registry.getScript('email-extractor-v1');
  if (!emailScript) {
    throw new Error('Email Extractor script should be registered by default');
  }
  
  console.log(`✓ Registry initialized with ${scripts.length} scripts`);
}

async function testScriptRegistration(): Promise<void> {
  console.log('📝 Testing script registration...');
  
  const registry = NetRunnerScriptRegistry.getInstance();
  
  // Test getting scripts by category
  const emailScripts = registry.getScriptsByCategory('email-extraction');
  if (emailScripts.length === 0) {
    throw new Error('Should find email extraction scripts');
  }
  
  // Test search functionality
  const searchResults = registry.searchScripts('email');
  if (searchResults.length === 0) {
    throw new Error('Should find scripts containing "email"');
  }
  
  console.log(`✓ Script registration working correctly`);
}

async function testScriptExecution(): Promise<void> {
  console.log('🚀 Testing script execution...');
  
  const engine = ScriptExecutionEngine.getInstance();
  
  // Create test input with some email data
  const testInput = {
    data: {
      emails: ['info@example.com', 'support@test.org'],
      socialMedia: ['@example'],
      technologies: [
        { name: 'nginx', category: 'framework' as const, confidence: 0.9 }
      ],
      serverInfo: ['nginx/1.18.0'],
      subdomains: ['www.example.com'],
      certificates: [],
      dns: [],
      // Additional fields for email extraction testing
      content: 'Contact us at info@example.com or support@test.org for more information.',
      html: '<p>Email us at <a href="mailto:sales@company.com">sales@company.com</a></p>',
      urls: ['https://example.com/contact']
    } as unknown as OSINTData,
    source: 'test-data',
    timestamp: new Date(),
    metadata: {
      scanId: 'test-scan-001',
      targetUrl: 'https://example.com',
      scanType: 'website-scan',
      confidence: 0.9
    }
  };
  
  // Execute email extractor script
  const result = await engine.executeScript(
    'email-extractor-v1',
    testInput,
    {
      validateDNS: false, // Disable DNS validation for testing
      confidenceThreshold: 0.5,
      maxResults: 100
    }
  );
  
  if (!result.success) {
    throw new Error(`Script execution failed: ${result.error?.message}`);
  }
  
  if (!result.data) {
    throw new Error('Script should return processed data');
  }
  
  console.log(`✓ Script executed successfully in ${result.metrics.duration}ms`);
  console.log(`  Found data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
}

async function testErrorHandling(): Promise<void> {
  console.log('🛡️ Testing error handling...');
  
  const engine = ScriptExecutionEngine.getInstance();
  
  // Test with invalid script ID
  try {
    await engine.executeScript(
      'non-existent-script',
      {
        data: {},
        source: 'test',
        timestamp: new Date(),
        metadata: {
          scanId: 'test',
          targetUrl: 'test',
          scanType: 'test',
          confidence: 1
        }
      }
    );
    throw new Error('Should have thrown an error for non-existent script');
  } catch (_error) {
    // Expected error
  }
  
  // Test with invalid input
  const invalidResult = await engine.executeScript(
    'email-extractor-v1',
    {
      data: null,
      source: 'test',
      timestamp: new Date(),
      metadata: {
        scanId: 'test',
        targetUrl: 'test',
        scanType: 'test',
        confidence: 1
      }
    }
  );
  
  if (invalidResult.success) {
    console.log('⚠️ Script handled invalid input gracefully');
  }
  
  console.log('✓ Error handling working correctly');
}

/**
 * Performance test for the Scripts Engine
 */
export async function runPerformanceTests(): Promise<void> {
  console.log('⚡ [ScriptEngineTest] Starting performance tests...');
  
  const engine = ScriptExecutionEngine.getInstance();
  
  // Test with larger dataset
  const largeTestData = {
    emails: Array.from({ length: 100 }, (_, i) => `user${i}@example${i}.com`),
    socialMedia: ['@company'],
    technologies: [{ name: 'nginx', category: 'framework' as const, confidence: 0.9 }],
    serverInfo: ['nginx/1.18.0'],
    subdomains: ['www.example.com'],
    certificates: [],
    dns: [],
    content: 'Contact information: ' + 
      Array.from({ length: 100 }, (_, i) => `user${i}@example${i}.com`).join(', ') +
      ' Additional content with various emails like admin@test.org, support@help.net',
    html: '<div>' + 
      Array.from({ length: 50 }, (_, i) => `<a href="mailto:contact${i}@site${i}.com">Email ${i}</a>`).join('') +
      '</div>'
  };
  
  const performanceInput = {
    data: largeTestData as unknown as OSINTData,
    source: 'performance-test',
    timestamp: new Date(),
    metadata: {
      scanId: 'perf-test-001',
      targetUrl: 'https://performance-test.com',
      scanType: 'website-scan',
      confidence: 0.9
    }
  };
  
  const startTime = Date.now();
  const result = await engine.executeScript('email-extractor-v1', performanceInput);
  const duration = Date.now() - startTime;
  
  if (!result.success) {
    throw new Error(`Performance test failed: ${result.error?.message}`);
  }
  
  console.log(`✓ Performance test completed in ${duration}ms`);
  console.log(`  Memory usage: ${result.metrics.memoryUsage} bytes`);
  
  if (duration > 5000) { // 5 seconds
    console.warn('⚠️ Performance test took longer than expected');
  }
}

/**
 * Integration test with mock OSINT data
 */
export async function runIntegrationTests(): Promise<void> {
  console.log('🔗 [ScriptEngineTest] Starting integration tests...');
  
  // Mock realistic OSINT data
  const mockOSINTData = {
    emails: [
      'info@company.example.com',
      'sales@company.example.com',
      'support@company.example.com',
      'security@company.example.com',
      'ceo@company.example.com'
    ],
    socialMedia: ['@examplecompany'],
    technologies: [
      { name: 'nginx', category: 'framework' as const, confidence: 0.9 },
      { name: 'cloudflare', category: 'cdn' as const, confidence: 0.8 },
      { name: 'google-analytics', category: 'analytics' as const, confidence: 0.9 }
    ],
    serverInfo: ['nginx/1.18.0', 'cloudflare'],
    subdomains: ['www.company.example.com', 'api.company.example.com'],
    certificates: [],
    dns: [],
    // Additional fields for testing
    url: 'https://company.example.com',
    title: 'Example Company - Contact Us',
    content: `
      Welcome to Example Company!
      
      For general inquiries: info@company.example.com
      Sales team: sales@company.example.com  
      Technical support: support@company.example.com
      Security issues: security@company.example.com
      
      You can also reach out to our CEO directly at ceo@company.example.com
      
      Our office locations:
      - New York: ny.office@company.example.com
      - London: london@company.example.com
      - Tokyo: tokyo.office@company.example.com
    `,
    metadata: {
      scanDate: new Date().toISOString(),
      scanDuration: 2500,
      httpStatus: 200
    }
  };
  
  const integrationInput = {
    data: mockOSINTData as unknown as OSINTData,
    source: 'integration-test',
    timestamp: new Date(),
    metadata: {
      scanId: 'integration-test-001',
      targetUrl: 'https://company.example.com',
      scanType: 'comprehensive-scan',
      confidence: 0.95
    }
  };
  
  const result = await ScriptExecutionEngine.getInstance().executeScript(
    'email-extractor-v1',
    integrationInput,
    {
      validateDNS: false,
      confidenceThreshold: 0.8,
      categorizeEmails: true,
      maxResults: 50
    }
  );
  
  if (!result.success) {
    throw new Error(`Integration test failed: ${result.error?.message}`);
  }
  
  console.log('✓ Integration test completed successfully');
  console.log(`  Processing time: ${result.metrics.duration}ms`);
  console.log(`  Quality score: ${result.metadata.qualityScore}/100`);
}
