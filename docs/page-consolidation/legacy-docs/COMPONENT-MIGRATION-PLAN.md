# 🔄 **Component Migration Plan**

## **Components Still Being Used**

### **NetRunner Components** (Used by NetRunnerApplication)
- `src/pages/NetRunner/components/PowerToolsPanel.tsx`
- `src/pages/NetRunner/components/BotControlPanel.tsx` 
- `src/pages/NetRunner/components/WorkflowControlPanel.tsx`

**Action**: These should be moved to `/src/applications/netrunner/components/`

### **Next Steps**
1. **Move Components**: Migrate used components to application directories
2. **Update Imports**: Fix import paths in application files
3. **Test Functionality**: Ensure everything still works
4. **Remove Legacy**: Delete unused legacy directories
5. **Clean Dependencies**: Update any other references

### **Migration Strategy**
- Move components one by one to avoid breaking changes
- Update imports immediately after moving
- Test build after each migration
- Keep directory structure organized within applications

---

**Status**: Ready to begin component migration
