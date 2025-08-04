#!/bin/bash

# Analytics Configuration Checker
# Run this before deploying to ensure analytics is properly configured

echo "🔍 Checking Analytics Configuration..."
echo "======================================="

# Check if .env files exist
if [ -f ".env.local" ]; then
    echo "✅ .env.local found"
    
    # Check if GA measurement ID is configured
    if grep -q "VITE_GA_MEASUREMENT_ID=G-" .env.local; then
        GA_ID=$(grep "VITE_GA_MEASUREMENT_ID" .env.local | cut -d'=' -f2)
        if [ "$GA_ID" != "G-XXXXXXXXXX" ] && [ "$GA_ID" != "" ]; then
            echo "✅ Google Analytics Measurement ID configured: $GA_ID"
        else
            echo "❌ Google Analytics Measurement ID not properly configured"
            echo "   Please set VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX in .env.local"
            exit 1
        fi
    else
        echo "❌ Google Analytics Measurement ID not found in .env.local"
        echo "   Please add VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX"
        exit 1
    fi
    
    # Check if analytics is enabled
    if grep -q "VITE_ANALYTICS_ENABLED=true" .env.local; then
        echo "✅ Analytics enabled"
    else
        echo "⚠️  Analytics not enabled (VITE_ANALYTICS_ENABLED should be true)"
    fi
else
    echo "❌ .env.local not found"
    echo "   Please create .env.local with your Google Analytics configuration"
    echo "   See .env.example for template"
    exit 1
fi

echo ""
echo "🚀 Deployment Readiness Check:"
echo "======================================="

# Check if analytics files exist
if [ -f "src/utils/analytics.ts" ]; then
    echo "✅ Analytics utility file exists"
else
    echo "❌ Analytics utility file missing"
    exit 1
fi

if [ -f "src/hooks/useAnalytics.ts" ]; then
    echo "✅ Analytics hooks file exists"
else
    echo "❌ Analytics hooks file missing"
    exit 1
fi

# Check if main.tsx has analytics import
if grep -q "import.*analytics" src/main.tsx; then
    echo "✅ Analytics imported in main.tsx"
else
    echo "❌ Analytics not imported in main.tsx"
    exit 1
fi

# Check if App.tsx has analytics hooks
if grep -q "useAnalytics\|useSessionTracking\|useErrorTracking" src/App.tsx; then
    echo "✅ Analytics hooks used in App.tsx"
else
    echo "❌ Analytics hooks not used in App.tsx"
    exit 1
fi

echo ""
echo "📊 Quick Test:"
echo "======================================="
echo "1. Run: npm run build && npm run preview"
echo "2. Open browser console"
echo "3. Look for: '🔍 Google Analytics initialized with ID: G-XXXXXXXXXX'"
echo "4. Visit pages and check GA4 Real-time reports"
echo ""
echo "🎯 Investor Sharing:"
echo "======================================="
echo "1. Collect data for at least 7 days"
echo "2. Create GA4 custom dashboard for investors"
echo "3. Share GA4 property access with 'Viewer' permissions"
echo "4. See ANALYTICS_SETUP.md for detailed instructions"
echo ""
echo "✅ Analytics configuration check complete!"
echo "Ready for deployment and investor sharing! 🚀"
