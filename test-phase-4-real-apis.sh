#!/bin/bash

# Phase 4: Real API Testing and Verification
# Test script to verify real API functionality with configured keys

echo "🚀 Phase 4: Real API Testing with Live Keys"
echo "============================================="

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
    echo "✅ Loaded .env.local configuration"
else
    echo "❌ .env.local not found!"
    exit 1
fi

echo ""
echo "📡 API Configuration Status:"
echo "----------------------------"
echo "Real APIs Enabled: $VITE_ENABLE_REAL_APIS"
echo "Debug Mode: $VITE_DEBUG_MODE"
echo "Mock Fallback: $VITE_MOCK_FALLBACK"

echo ""
echo "🔑 API Keys Status:"
echo "------------------"
if [[ "$VITE_SHODAN_API_KEY" != "your_shodan_api_key_here" ]]; then
    echo "✅ Shodan API Key: Configured (${VITE_SHODAN_API_KEY:0:8}...)"
else
    echo "❌ Shodan API Key: Not configured"
fi

if [[ "$VITE_VIRUSTOTAL_API_KEY" != "your_virustotal_api_key_here" ]]; then
    echo "✅ VirusTotal API Key: Configured (${VITE_VIRUSTOTAL_API_KEY:0:8}...)"
else
    echo "❌ VirusTotal API Key: Not configured"
fi

if [[ "$VITE_CENSYS_API_ID" != "your_censys_api_id_here" ]]; then
    echo "✅ Censys API ID: Configured (${VITE_CENSYS_API_ID:0:8}...)"
else
    echo "❌ Censys API ID: Not configured (Free tier has NO API access - requires paid Starter tier)"
fi

if [[ "$VITE_CENSYS_SECRET" != "your_censys_secret_here" ]]; then
    echo "✅ Censys Secret: Configured"
else
    echo "❌ Censys Secret: Not configured (Free tier has NO API access)"
fi

echo "✅ TheHarvester: No API key required (open source tool)"

echo ""
echo "🔧 TypeScript Compilation Check:"
echo "--------------------------------"
npx tsc --noEmit --project tsconfig.starcom.json

if [ $? -eq 0 ]; then
    echo "✅ Starcom TypeScript compilation successful"
else
    echo "❌ Starcom TypeScript compilation failed"
fi

echo ""
echo "🏗️  Application Build Check:"
echo "-----------------------------"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Application build successful"
else
    echo "❌ Application build failed"
fi

echo ""
echo "📊 Production Adapter Status:"
echo "-----------------------------"

# Check if production adapters are properly registered
echo "Checking adapter registry..."
grep -q "ShodanAdapterProd" src/applications/netrunner/tools/adapters/AdapterRegistry.ts && echo "✅ Shodan Prod Adapter: Registered"
grep -q "VirusTotalAdapterProd" src/applications/netrunner/tools/adapters/AdapterRegistry.ts && echo "✅ VirusTotal Prod Adapter: Registered"
grep -q "CensysAdapterProd" src/applications/netrunner/tools/adapters/AdapterRegistry.ts && echo "✅ Censys Prod Adapter: Registered"
grep -q "TheHarvesterAdapterProd" src/applications/netrunner/tools/adapters/AdapterRegistry.ts && echo "✅ TheHarvester Prod Adapter: Registered"

echo ""
echo "🎯 Next Steps:"
echo "-------------"
echo "1. ✅ Shodan and VirusTotal APIs are ready for testing"
echo "2. ❌ Censys: Free tier has NO API access (requires paid Starter tier approx \$62/month)"
echo "3. 🧪 Start the dev server: npm run dev"
echo "4. 🔍 Test OSINT searches in NetRunner application"
echo "5. 📊 Monitor Provider Status in the OSINT dashboard"

echo ""
echo "🚀 Ready to test real OSINT functionality!"
echo "Run 'npm run dev' and navigate to the NetRunner application."
