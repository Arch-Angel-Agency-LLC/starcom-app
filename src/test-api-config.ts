/**
 * NetRunner API Configuration Test
 * 
 * Simple test to verify the unified API configuration system is working.
 * Run this to check if API keys are properly loaded and providers are enabled.
 */

import { apiConfigManager } from './shared/config/ApiConfigManager';

async function testApiConfiguration() {
  console.log('🔧 Testing NetRunner API Configuration...\n');
  
  // Test system configuration
  const systemConfig = apiConfigManager.getSystemConfig();
  console.log('📋 System Configuration:');
  console.log(`  Real APIs Enabled: ${systemConfig.enableRealApis}`);
  console.log(`  Debug Mode: ${systemConfig.debugMode}`);
  console.log(`  Mock Fallback: ${systemConfig.mockFallback}\n`);
  
  // Test OSINT providers
  const osintProviders = apiConfigManager.getOSINTProviders();
  console.log('🕵️ OSINT Providers:');
  osintProviders.forEach(provider => {
    console.log(`  ${provider.name}: ${provider.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    if (provider.apiKey) {
      console.log(`    API Key: ${provider.apiKey.substring(0, 8)}...`);
    }
  });
  console.log('');
  
  // Test all enabled providers
  const enabledProviders = apiConfigManager.getEnabledProviders();
  console.log('✅ All Enabled Providers:');
  enabledProviders.forEach(provider => {
    console.log(`  ${provider.name} (${provider.id})`);
  });
  console.log('');
  
  // Test provider health
  console.log('🏥 Provider Health Check:');
  try {
    const healthStatus = await apiConfigManager.getProvidersHealth();
    Object.entries(healthStatus).forEach(([id, healthy]) => {
      console.log(`  ${id}: ${healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    });
  } catch (error) {
    console.error('Failed to check provider health:', error);
  }
  
  console.log('\n✨ API Configuration test complete!');
}

// Export for use in other tests
export { testApiConfiguration };

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  testApiConfiguration().catch(console.error);
}
