# 🧹 **Legacy Code Cleanup & Migration Plan**

## **Current State Analysis**

### **Legacy Files Identified**
- `/src/pages/MainPage/Screens/` - Multiple old screen files that are now redundant
- Individual page directories under `/src/pages/` that have been consolidated
- Duplicate functionality across old and new structures
- Unused CSS files and components
- Legacy routing and import references

### **Cleanup Strategy**

#### **Phase 1: Legacy Screen Removal**
Remove old screen files that have been consolidated into applications:
- `NetRunnerScreen.tsx` → Consolidated into `NetRunnerApplication`
- `IntelAnalyzerScreen.tsx` → Consolidated into `IntelAnalyzerApplication`
- `TimelineScreen.tsx` → Consolidated into `TimeMapApplication`
- `MonitoringScreen.tsx` → Integrated into `TimeMapApplication`
- `NodeWebScreen.tsx` → Consolidated into `NodeWebApplication`
- `TeamsScreen.tsx` → Consolidated into `TeamWorkspaceApplication`
- `MarketExchangeScreen.tsx` → Consolidated into `MarketExchangeApplication`
- `BotRosterScreen.tsx` → Integrated into `NetRunnerApplication`
- `AIAgentScreen.tsx` → Integrated into `NetRunnerApplication`

#### **Phase 2: Legacy Page Directory Cleanup**
Analyze and consolidate/remove old page directories:
- `/src/pages/NetRunner/` → Components moved to applications
- `/src/pages/Intel/` → Components moved to applications
- `/src/pages/Timeline/` → Components moved to applications
- `/src/pages/NodeWeb/` → Components moved to applications
- `/src/pages/Teams/` → Components moved to applications
- `/src/pages/OSINT/` → Components moved to applications

#### **Phase 3: Code Migration**
- Extract reusable components from legacy files
- Move utility functions to shared locations
- Update import references throughout codebase
- Remove duplicate functionality

#### **Phase 4: Routing Cleanup**
- Remove legacy route handlers
- Update navigation references
- Clean up unused screen type definitions

---

## **Execution Plan** ✅ PHASE 1 COMPLETE

### **✅ Phase 1: Completed**
1. **✅ Audit Legacy Files** - Identified redundant screen wrappers and unused directories
2. **✅ Extract Reusable Code** - Migrated active components to application structure
3. **✅ Update References** - Fixed imports and dependencies
4. **✅ Remove Dead Code** - Deleted 50+ unused files and directories
5. **✅ Test Integration** - Verified build integrity throughout process

### **🚧 Phase 2: In Progress**
1. **Route System Analysis** - Review standalone routing vs MainPage routing
2. **HUD Integration** - Update HUD view system to use new applications  
3. **Advanced Dependency Cleanup** - Remove remaining legacy references
4. **CSS/Asset Consolidation** - Optimize remaining stylesheets and assets

### **📋 Phase 3: Planned**
1. **Final Build Optimization** - Tree-shaking and bundle analysis
2. **Documentation Cleanup** - Remove outdated documentation
3. **Performance Validation** - Ensure cleanup improved performance
4. **Archive Creation** - Backup any remaining useful legacy code

---

**Current Status**: Phase 1 Complete - 50+ files removed, components migrated successfully  
**Next Action**: Begin Phase 2 - Route system and HUD cleanup  
**Risk Level**: Low (build verification successful)  
**Expected Impact**: Continued reduction in codebase complexity
