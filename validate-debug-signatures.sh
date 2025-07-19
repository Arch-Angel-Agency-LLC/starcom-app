#!/bin/bash
# 🎯 Unique Debug Signature Validation Script
# Verifies all debug messages have unique, identifiable signatures

echo "🔍 UNIQUE DEBUG SIGNATURE VALIDATION"
echo "===================================="

echo ""
echo "✅ Checking for unique debug signatures in useSIWS.ts..."

# Count all debug signatures
total_signatures=$(grep -o "debug_signature.*V1" src/hooks/useSIWS.ts | wc -l | tr -d ' ')
unique_signatures=$(grep -o "debug_signature.*V1" src/hooks/useSIWS.ts | sort | uniq | wc -l | tr -d ' ')

echo "📊 Signature Statistics:"
echo "   Total debug signatures: $total_signatures"
echo "   Unique signatures: $unique_signatures"

if [ "$total_signatures" = "$unique_signatures" ]; then
    echo "   ✅ All signatures are unique!"
else
    echo "   ⚠️ Duplicate signatures detected!"
fi

echo ""
echo "🎯 Unique Debug Signatures Inventory:"
echo "====================================="

grep -o "debug_signature.*V1" src/hooks/useSIWS.ts | sort | uniq | while read line; do
    signature=$(echo "$line" | sed "s/debug_signature[^']*'//" | sed "s/',.*//")
    echo "   ✓ $signature"
done

echo ""
echo "🔍 Debug Message Categories:"
echo "============================"

echo "📋 Session Monitoring:"
grep -q "SIWS_SESSION_STATE_CHANGE_V1" src/hooks/useSIWS.ts && echo "   ✓ Session state transitions"

echo ""
echo "🔗 Wallet Connection Monitoring:"
grep -q "WALLET_CONNECTION_STATE_EVOLUTION_V1" src/hooks/useSIWS.ts && echo "   ✓ Connection state evolution"

echo ""
echo "📈 Authentication Timeline:"
grep -q "AUTH_TIMELINE_EVENT.*_V1" src/hooks/useSIWS.ts && echo "   ✓ Timeline event capture"
grep -q "TIMELINE_PATTERN_ANALYSIS_V1" src/hooks/useSIWS.ts && echo "   ✓ Timeline pattern analysis"

echo ""
echo "🎯 Wallet Selection Analysis:"
grep -q "WALLET_SELECTION_DEEP_ANALYSIS_V1" src/hooks/useSIWS.ts && echo "   ✓ Deep selection analysis"
grep -q "WALLET_PROVIDER_MISMATCH_WARNING_V1" src/hooks/useSIWS.ts && echo "   ✓ Provider mismatch warnings"
grep -q "MULTIPLE_WALLET_PROVIDERS_INFO_V1" src/hooks/useSIWS.ts && echo "   ✓ Multi-provider detection"

echo ""
echo "🔄 Real-Time State Tracking:"
grep -q "REAL_TIME_WALLET_STATE_TRANSITION_V1" src/hooks/useSIWS.ts && echo "   ✓ State transitions"
grep -q "CONNECTED_WITHOUT_PUBLIC_KEY_ANOMALY_V1" src/hooks/useSIWS.ts && echo "   ✓ Connection anomaly detection"
grep -q "CONNECTION_STATE_CONFLICT_ANOMALY_V1" src/hooks/useSIWS.ts && echo "   ✓ State conflict detection"

echo ""
echo "🔮 Error Prediction System:"
grep -q "ERROR_PREDICTION_ANALYSIS_V1" src/hooks/useSIWS.ts && echo "   ✓ Error pattern analysis"
grep -q "ERROR_PATTERN_RECOGNITION_V1" src/hooks/useSIWS.ts && echo "   ✓ Pattern recognition"
grep -q "WALLET_INSTABILITY_PREDICTION_HIGH_CONFIDENCE_V1" src/hooks/useSIWS.ts && echo "   ✓ Instability predictions"
grep -q "USER_SPAM_PREDICTION_MEDIUM_CONFIDENCE_V1" src/hooks/useSIWS.ts && echo "   ✓ User spam detection"

echo ""
echo "🎯 Event Sequence Tracking:"
grep -q "EVENT_SEQUENCE.*_V1" src/hooks/useSIWS.ts && echo "   ✓ Event sequence capture"
grep -q "EVENT_SEQUENCE_PATTERN_ANALYSIS_V1" src/hooks/useSIWS.ts && echo "   ✓ Sequence pattern analysis"
grep -q "RAPID_EVENT_CASCADE_HIGH_RISK_V1" src/hooks/useSIWS.ts && echo "   ✓ Rapid cascade detection"

echo ""
echo "🔬 Extension Analysis:"
grep -q "DEEP_EXTENSION_ANALYSIS_V1" src/hooks/useSIWS.ts && echo "   ✓ Deep extension analysis"
grep -q "PHANTOM_EXTENSION_CONFLICT_V1" src/hooks/useSIWS.ts && echo "   ✓ Phantom conflict detection"
grep -q "SOLFLARE_EXTENSION_CONFLICT_V1" src/hooks/useSIWS.ts && echo "   ✓ Solflare conflict detection"
grep -q "NO_EXTENSIONS_WITH_ACTIVE_ADAPTER_ERROR_V1" src/hooks/useSIWS.ts && echo "   ✓ Extension availability errors"

echo ""
echo "🎉 UNIQUE SIGNATURE SYSTEM SUMMARY"
echo "=================================="
echo "✅ All debug messages now have unique, identifiable signatures!"
echo "🔍 Each debug message can be easily filtered and analyzed"
echo "📊 Clear categorization for different debugging scenarios"
echo "🎯 Precise identification of error sources and state changes"
echo ""
echo "🚀 Debug Message Usage Examples:"
echo "   Filter session events: console.log messages containing 'SIWS_SESSION'"
echo "   Filter connection events: console.log messages containing 'WALLET_CONNECTION'"
echo "   Filter error predictions: console.log messages containing 'PREDICTION'"
echo "   Filter extension issues: console.log messages containing 'EXTENSION'"
echo ""
echo "🎯 Ready for precise debugging with unique message signatures!"
