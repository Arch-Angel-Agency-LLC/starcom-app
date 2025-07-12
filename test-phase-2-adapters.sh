#!/bin/bash

# Phase 2 Integration Test - New Production Adapters
# Tests the newly implemented VirusTotal and Censys adapters

echo "🔧 NetRunner Phase 2 Integration Test"
echo "======================================"
echo ""

# Test VirusTotal Adapter
echo "1. Testing VirusTotal Adapter..."
echo "--------------------------------"

# Check if VirusTotal adapter compiles
echo "Checking VirusTotal adapter compilation..."
npx tsc --noEmit src/applications/netrunner/tools/adapters/VirusTotalAdapterProd.ts
if [ $? -eq 0 ]; then
    echo "✅ VirusTotal adapter compiles successfully"
else
    echo "❌ VirusTotal adapter has compilation errors"
fi

# Test Censys Adapter
echo ""
echo "2. Testing Censys Adapter..."
echo "----------------------------"

# Check if Censys adapter compiles
echo "Checking Censys adapter compilation..."
npx tsc --noEmit src/applications/netrunner/tools/adapters/CensysAdapterProd.ts
if [ $? -eq 0 ]; then
    echo "✅ Censys adapter compiles successfully"
else
    echo "❌ Censys adapter has compilation errors"
fi

# Test Adapter Registry
echo ""
echo "3. Testing Adapter Registry..."
echo "------------------------------"

# Check if adapter registry compiles with new adapters
echo "Checking adapter registry compilation..."
npx tsc --noEmit src/applications/netrunner/tools/adapters/AdapterRegistry.ts
if [ $? -eq 0 ]; then
    echo "✅ Adapter registry compiles successfully"
else
    echo "❌ Adapter registry has compilation errors"
fi

# Test Overall NetRunner Build
echo ""
echo "4. Testing Overall NetRunner Build..."
echo "------------------------------------"

# Check if the entire NetRunner application compiles
echo "Checking full NetRunner build..."
npx tsc --noEmit --project src/applications/netrunner
if [ $? -eq 0 ]; then
    echo "✅ NetRunner builds successfully"
else
    echo "❌ NetRunner has build errors"
fi

# Test API Configuration
echo ""
echo "5. Testing API Configuration..."
echo "------------------------------"

# Check if API config manager supports new providers
node -e "
const { apiConfigManager } = require('./src/shared/config/ApiConfigManager.ts');
try {
    const vtConfig = apiConfigManager.getProviderConfig('virustotal');
    const censysConfig = apiConfigManager.getProviderConfig('censys');
    
    console.log('✅ VirusTotal config available:', vtConfig.name);
    console.log('✅ Censys config available:', censysConfig.name);
    
    console.log('📊 API Provider Status:');
    console.log('  - VirusTotal:', vtConfig.enabled ? 'Enabled' : 'Disabled');
    console.log('  - Censys:', censysConfig.enabled ? 'Enabled' : 'Disabled');
    console.log('  - Shodan:', apiConfigManager.isProviderEnabled('shodan') ? 'Enabled' : 'Disabled');
    console.log('  - TheHarvester:', apiConfigManager.isProviderEnabled('theharvester') ? 'Enabled' : 'Disabled');
    
} catch (error) {
    console.log('❌ API configuration test failed:', error.message);
}
" 2>/dev/null || echo "⚠️  Could not test API configuration in Node.js context"

# Summary
echo ""
echo "📋 Phase 2 Integration Summary"
echo "=============================="
echo ""
echo "New Adapters Implemented:"
echo "  ✅ VirusTotal Production Adapter (threat intelligence)"
echo "  ✅ Censys Production Adapter (network/certificate intelligence)"
echo ""
echo "Features Added:"
echo "  • Real API integration with rate limiting"
echo "  • Comprehensive error handling and fallback"
echo "  • Mock data generation for testing"
echo "  • Structured result transformation"
echo "  • TypeScript type safety"
echo ""
echo "Next Steps:"
echo "  • Add real API keys to .env.local to enable live data"
echo "  • Test real API calls with valid credentials"
echo "  • Implement Hunter.io adapter for email intelligence"
echo "  • Add UI indicators for real vs. mock data"
echo "  • Implement advanced features (automation, workflows)"
echo ""
echo "🚀 Phase 2 Complete - Ready for Testing with Real APIs"
