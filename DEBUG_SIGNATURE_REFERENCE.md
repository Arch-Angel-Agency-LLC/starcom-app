# 🎯 Starcom Debug Signature Reference Guide

## 📋 **Session Monitoring**
- `SIWS_SESSION_STATE_CHANGE_V1` - Session state transitions and validation

## 🔗 **Wallet Connection Monitoring**  
- `WALLET_CONNECTION_STATE_EVOLUTION_V1` - Connection state evolution and health scoring

## 📈 **Authentication Timeline**
- `AUTH_TIMELINE_EVENT_[EVENT_NAME]_V1` - Individual timeline events (dynamic signature)
- `TIMELINE_PATTERN_ANALYSIS_V1` - Timeline pattern analysis and timing metrics

## 🎯 **Wallet Selection Analysis**
- `WALLET_SELECTION_DEEP_ANALYSIS_V1` - Comprehensive wallet selection analysis
- `WALLET_PROVIDER_MISMATCH_WARNING_V1` - Adapter/extension mismatch warnings
- `MULTIPLE_WALLET_PROVIDERS_INFO_V1` - Multi-provider detection
- `WALLET_SELECTION_IMPOSSIBILITY_ERROR_V1` - Selection impossibility errors

## 🔄 **Real-Time State Tracking**
- `REAL_TIME_WALLET_STATE_TRANSITION_V1` - State transitions with health scoring
- `CONNECTED_WITHOUT_PUBLIC_KEY_ANOMALY_V1` - Connection anomaly detection
- `CONNECTION_STATE_CONFLICT_ANOMALY_V1` - State conflict detection
- `NO_WALLET_WITH_CONNECTION_STATES_ERROR_V1` - Critical state errors

## 🔮 **Error Prediction System**
- `ERROR_PREDICTION_ANALYSIS_V1` - Error pattern capture and metadata
- `ERROR_PATTERN_RECOGNITION_V1` - Pattern recognition and frequency analysis
- `WALLET_INSTABILITY_PREDICTION_HIGH_CONFIDENCE_V1` - High-confidence instability predictions
- `USER_SPAM_PREDICTION_MEDIUM_CONFIDENCE_V1` - Medium-confidence user spam detection

## 🎯 **Event Sequence Tracking**
- `EVENT_SEQUENCE_[EVENT_TYPE]_V1` - Individual event sequence capture (dynamic signature)
- `EVENT_SEQUENCE_PATTERN_ANALYSIS_V1` - Sequence pattern analysis with health metrics
- `RAPID_EVENT_CASCADE_HIGH_RISK_V1` - High-risk rapid event cascade detection

## 🔬 **Extension Analysis**
- `DEEP_EXTENSION_ANALYSIS_V1` - Comprehensive extension health assessment
- `PHANTOM_EXTENSION_CONFLICT_V1` - Phantom-specific conflict detection
- `SOLFLARE_EXTENSION_CONFLICT_V1` - Solflare-specific conflict detection  
- `NO_EXTENSIONS_WITH_ACTIVE_ADAPTER_ERROR_V1` - Extension availability errors

---

## 🔍 **How to Use Debug Signatures**

### Filter by Category:
```javascript
// Filter session-related messages
console.log messages containing "SIWS_SESSION"

// Filter connection-related messages  
console.log messages containing "WALLET_CONNECTION"

// Filter error predictions
console.log messages containing "PREDICTION"

// Filter extension issues
console.log messages containing "EXTENSION"
```

### Filter by Severity:
```javascript
// High-priority issues
console.log messages containing "ERROR_V1" or "CRITICAL"

// Medium-priority warnings
console.log messages containing "WARNING_V1" or "ANOMALY"

// Information/monitoring
console.log messages containing "INFO_V1" or "ANALYSIS"
```

### Filter by Component:
```javascript
// Timeline-related messages
console.log messages containing "TIMELINE"

// State monitoring messages
console.log messages containing "STATE_"

// Sequence tracking messages
console.log messages containing "SEQUENCE"
```

## 🚀 **Debug Message Structure**

Each debug message follows this structure:
```javascript
console.log('[COMPONENT-NAME] Description:', {
  'debug_signature': 'UNIQUE_SIGNATURE_V1',
  'category_data': { /* relevant data */ },
  'timing_context': { /* timing information */ },
  'diagnostic_info': { /* additional diagnostics */ }
});
```

This ensures every debug message is:
- ✅ **Uniquely identifiable**
- ✅ **Easily filterable**  
- ✅ **Consistently structured**
- ✅ **Contextually rich**
