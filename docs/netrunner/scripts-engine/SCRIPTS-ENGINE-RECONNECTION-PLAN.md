# NetRunner Scripts Engine Reconnection Plan

**Project**: NetRunner Scripts Engine Repair  
**Date**: July 27, 2025  
**Status**: Planning Phase  
**Priority**: High - Critical functionality currently disabled

---

## 📋 **EXECUTIVE SUMMARY**

The NetRunner Scripts Engine is fully implemented but **disconnected** from the application flow. All 4 production-ready scripts (EmailExtractor, DomainParser, TechStackAnalyzer, ContactHarvester) exist but are disabled due to "VERCEL DEBUG" issues. This document outlines a 4-phase reconnection plan to restore full scripts functionality.

### **Current Status**
- ❌ **Scripts Engine**: Disabled/Mocked (shows "No scripts available")
- ❌ **Pipeline Integration**: Missing (WebsiteScanner → Scripts → Results)
- ❌ **IntelAnalyzer**: Placeholder implementation only
- ✅ **Script Implementations**: Complete and production-ready
- ✅ **UI Infrastructure**: Built and ready

---

## 🎯 **PHASE 1: ENABLE AND TEST BASIC SCRIPTS**
**Risk Level**: Low  
**Duration**: 1-2 hours  
**Objective**: Restore basic scripts functionality and verify engine works

### **1.1 Core Issues to Address**
```typescript
// CURRENT PROBLEM: NetRunnerLeftSideBar.tsx lines 33-47
// Import Scripts Engine - TEMPORARILY DISABLED FOR VERCEL DEBUG
// import { NetRunnerScriptsUIService, UIEventData } from '../../scripts/engine/NetRunnerScriptsUIService';
// import { ScriptDefinition } from '../../scripts/types/ScriptTypes';

// MOCK SERVICE RETURNS EMPTY:
getDefaultScripts: () => [] as ScriptDefinition[], // ← This causes "No scripts available"
```

### **1.2 Implementation Steps**
1. **Re-enable Real Imports**
   - Uncomment actual NetRunnerScriptsUIService import
   - Remove mock service implementation
   - Test for TypeScript compilation errors

2. **Verify Script Registration**
   - Check NetRunnerScriptRegistry loads 4 default scripts
   - Verify scripts appear in left sidebar
   - Test script metadata display

3. **Test Basic Script Execution**
   - Execute scripts manually from UI
   - Verify execution logging works
   - Test error handling with invalid inputs

### **1.3 Success Criteria**
- [x] Scripts sidebar shows 4 available scripts instead of "No scripts available" **(Testing in progress)**
- [ ] Scripts can be triggered manually without errors
- [ ] Script execution status indicators work (running/completed)
- [x] No TypeScript compilation errors **(✅ VERIFIED - Build successful)**
- [ ] No runtime errors in browser console

### **1.4 Risk Mitigation**
- Keep mock service code as comments for quick rollback
- Test in development environment first
- Add feature flag to enable/disable scripts engine

---

## 🔗 **PHASE 2: CONNECT WEBSITESCANNER PIPELINE**
**Risk Level**: Medium  
**Duration**: 2-4 hours  
**Objective**: Automatically trigger scripts when WebsiteScanner completes

### **2.1 Core Integration Points**

#### **NetRunnerCenterView.tsx Integration**
```typescript
// CURRENT: Scan completes but doesn't trigger scripts
const result = await websiteScanner.scanWebsite(target, progressCallback);
setScanResult(result);
// ← MISSING: Script pipeline execution

// NEEDED: Add pipeline trigger
import { ScriptPipelineOrchestrator } from '../../scripts/engine/ScriptPipelineOrchestrator';

const pipeline = ScriptPipelineOrchestrator.getInstance();
const scriptResults = await pipeline.executePipeline(result);
```

#### **WebCrawlerResults.tsx Integration**
```typescript
// CURRENT: Results display scan data only
// NEEDED: Display both scan data + script-processed intelligence
```

### **2.2 Implementation Steps**
1. **Import Pipeline Orchestrator**
   - Add imports to NetRunnerCenterView
   - Initialize pipeline instance
   - Test basic pipeline creation

2. **Connect Scan → Scripts Flow**
   - Trigger pipeline after successful scan
   - Pass OSINTData from scanner to scripts
   - Handle pipeline execution errors gracefully

3. **Add Progress Indicators**
   - Show script execution progress
   - Display which scripts are running
   - Update UI when scripts complete

4. **Error Handling**
   - Continue showing scan results if scripts fail
   - Log script errors without breaking UI
   - Provide user feedback on partial failures

### **2.3 Data Flow Architecture**
```
WebsiteScanner.scanWebsite(url)
  ↓ (returns ScanResult with OSINTData)
ScriptPipelineOrchestrator.executePipeline(scanResult)
  ↓ (processes with 4 scripts in parallel)
NetRunnerRightSideBar (displays enriched results)
```

### **2.4 Success Criteria**
- [ ] Scripts automatically execute when scan completes
- [ ] Pipeline processes real OSINTData from scanner
- [ ] Progress indicators show script execution status
- [ ] Scan results display even if scripts fail
- [ ] Performance remains acceptable (< 10s total pipeline time)

### **2.5 Risk Mitigation**
- Add timeout limits for script execution
- Implement graceful degradation if scripts fail
- Allow users to skip script processing
- Add logging for debugging pipeline issues

---

## 📊 **PHASE 3: CONNECT RESULTS DISPLAY**
**Risk Level**: Low  
**Duration**: 2-3 hours  
**Objective**: Display script-processed intelligence in NetRunnerRightSideBar

### **3.1 Current Results Display Gap**
```typescript
// CURRENT: NetRunnerRightSideBar shows scan results only
// NEEDED: Show both raw scan data + script-enriched intelligence
```

### **3.2 Implementation Steps**
1. **Extend Results Interface**
   - Add script results to ScanResult type
   - Update WebCrawlerResults to handle script data
   - Create new result categories for script output

2. **Results Categorization**
   - Email intelligence (from EmailExtractorScript)
   - Domain relationships (from DomainParserScript)
   - Technology stack (from TechStackAnalyzerScript)
   - Contact information (from ContactHarvesterScript)

3. **UI Enhancements**
   - Add new tabs for script results
   - Create inspection modals for detailed data
   - Add confidence scores and evidence trails

4. **Results Export**
   - Export both raw and processed data
   - Add JSON/CSV export options
   - Include script metadata in exports

### **3.3 Results Display Strategy**
```typescript
// Enhanced Results Structure
interface EnhancedScanResult {
  // Original scan data
  scanData: OSINTData;
  
  // Script-processed intelligence
  scriptResults: {
    emails: EmailIntelligence;
    domains: DomainIntelligence;
    technologies: TechnicalIntelligence;
    contacts: ContactIntelligence;
  };
  
  // Processing metadata
  processingStats: {
    scriptsExecuted: number;
    totalProcessingTime: number;
    confidenceScores: Record<string, number>;
  };
}
```

### **3.4 Success Criteria**
- [ ] Right sidebar displays script-processed intelligence
- [ ] Results are categorized and easily browsable
- [ ] Confidence scores and evidence trails visible
- [ ] Export functionality includes script results
- [ ] Performance remains smooth with larger datasets

---

## 🧠 **PHASE 4: POLISH AND OPTIMIZE**
**Risk Level**: Low  
**Duration**: 3-5 hours  
**Objective**: Add advanced features and optimizations

### **4.1 Advanced Features**
1. **Script Configuration UI**
   - Allow users to configure script parameters
   - Save script preferences per user
   - Enable/disable specific scripts

2. **Batch Processing**
   - Process multiple URLs with scripts
   - Queue management for script execution
   - Bulk export of processed results

3. **IntelAnalyzer Integration**
   - Complete the placeholder integration
   - Generate intel reports from script results
   - Connect to Intelligence Exchange Marketplace

### **4.2 Performance Optimizations**
1. **Parallel Execution**
   - Run compatible scripts in parallel
   - Optimize script execution order
   - Implement script dependency management

2. **Caching Strategy**
   - Cache script results for repeated URLs
   - Implement smart cache invalidation
   - Reduce redundant processing

3. **Resource Management**
   - Monitor memory usage during execution
   - Implement script timeout handling
   - Add resource limit enforcement

### **4.3 Advanced Error Handling**
1. **Recovery Mechanisms**
   - Retry failed scripts with exponential backoff
   - Partial result recovery
   - Script health monitoring

2. **User Experience**
   - Better error messages with suggestions
   - Script execution history
   - Performance metrics display

### **4.4 Success Criteria**
- [ ] Scripts run efficiently in parallel when possible
- [ ] Users can configure script behavior
- [ ] Results are cached to improve performance
- [ ] Advanced error recovery works smoothly
- [ ] IntelAnalyzer integration is functional

---

## 🛠️ **IMPLEMENTATION CHECKLIST**

### **Pre-Implementation**
- [ ] Backup current NetRunnerLeftSideBar.tsx
- [ ] Create feature branch for scripts reconnection
- [ ] Set up local testing environment
- [ ] Document current error states

### **Phase 1 Tasks**
- [x] Uncomment NetRunnerScriptsUIService imports **(✅ COMPLETED)**
- [x] Remove mock service implementation **(✅ COMPLETED)**
- [x] Test script registry initialization **(🔧 DEBUGGING - Added debug component)**
- [ ] Verify 4 scripts appear in UI
- [ ] Test manual script execution

### **Phase 2 Tasks**
- [ ] Import ScriptPipelineOrchestrator in NetRunnerCenterView
- [ ] Add pipeline execution after scan completion
- [ ] Implement progress indicators
- [ ] Add error handling for pipeline failures
- [ ] Test with real scan data

### **Phase 3 Tasks**
- [ ] Extend ScanResult interface for script data
- [ ] Update NetRunnerRightSideBar to display script results
- [ ] Add result categorization
- [ ] Implement results export
- [ ] Create inspection modals

### **Phase 4 Tasks**
- [ ] Add script configuration UI
- [ ] Implement parallel execution
- [ ] Add caching layer
- [ ] Complete IntelAnalyzer integration
- [ ] Performance monitoring

---

## 🚨 **RISK ASSESSMENT**

### **High-Risk Areas**
1. **TypeScript Compilation**: Scripts were disabled for a reason - may have build issues
2. **Memory Usage**: 4 scripts processing large datasets simultaneously
3. **Network Requests**: Scripts may make external API calls affecting performance

### **Mitigation Strategies**
1. **Gradual Rollout**: Enable one script at a time to isolate issues
2. **Feature Flags**: Environment variables to enable/disable functionality
3. **Monitoring**: Add comprehensive logging and error tracking
4. **Fallback Options**: Always show basic scan results even if scripts fail

### **Rollback Plan**
- Keep mock service code available
- Quick revert to disabled state if critical issues found
- Staged deployment with canary testing

---

## 📈 **SUCCESS METRICS**

### **Functional Metrics**
- Scripts execute successfully on >95% of scans
- Pipeline completes within 30 seconds for typical websites
- UI remains responsive during script execution
- Zero critical errors in production

### **User Experience Metrics**
- Scripts provide valuable additional intelligence beyond basic scans
- Results are clearly organized and actionable
- Error messages are helpful and actionable
- Performance is acceptable to users

### **Technical Metrics**
- Memory usage stays within acceptable limits
- CPU usage doesn't block UI thread
- Error rates are low and properly handled
- Code maintainability is preserved

---

## 🔄 **MAINTENANCE CONSIDERATIONS**

### **Ongoing Monitoring**
- Script execution performance metrics
- Error rate tracking and alerting
- Memory and CPU usage monitoring
- User feedback on script usefulness

### **Future Enhancements**
- Additional script types (vulnerability scanning, social media analysis)
- Machine learning for better confidence scoring
- API integrations with external OSINT tools
- Custom script development framework

---

**Next Action**: Begin Phase 1 by re-enabling the scripts engine and testing basic functionality.
