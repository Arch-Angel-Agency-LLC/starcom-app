# PHASE 1: ARCHAEOLOGICAL CLEANUP
*Excavating Years of Abandoned Code*

## 🎯 **OBJECTIVE**
Remove all abandoned, duplicate, and conflicting files that are polluting the project and causing style conflicts.

## 🔍 **DISCOVERED ISSUES**
- **569 CSS files** total (many unused)
- **240 backup files** (.backup, .tmp, .old)
- **Multiple backup directories** with duplicate CSS
- **Orphaned CSS modules** with no corresponding components
- **Conflicting import chains** causing style override wars

## 📋 **CLEANUP TASKS**

### **Task 1.1: Backup File Purge**
```bash
# Remove all .backup files
find . -name "*.backup" -type f -delete

# Remove all .tmp files  
find . -name "*.tmp" -type f -delete

# Remove backup directories
rm -rf backup/
rm -rf src/backup/
```

### **Task 1.2: Identify Orphaned CSS Modules**
```bash
# Find CSS modules without corresponding TSX files
for css in $(find src -name "*.module.css"); do
  tsx_file="${css/.module.css/.tsx}"
  if [[ ! -f "$tsx_file" ]]; then
    echo "ORPHANED: $css"
  fi
done
```

### **Task 1.3: Component Usage Audit**
- Scan all TSX files for CSS imports
- Identify which CSS modules are actually imported
- Flag unused CSS files for removal

### **Task 1.4: Theme Conflict Resolution**
**FOUND CONFLICTS:**
- `cyberpunk-theme.css` vs `rts-gaming-theme.css`
- `globals.css` importing both themes
- CSS variables being overridden by hardcoded values
- Border-radius wars between themes

**RESOLUTION:**
- Keep only `cyberpunk-theme.css` as primary theme
- Remove `rts-gaming-theme.css` (phase 4 experiment)
- Consolidate `globals.css` to single theme import

## 🗂️ **FILE INVENTORY**

### **Files to KEEP:**
```
src/styles/
├── globals.css (cleaned up)
├── cyberpunk-theme.css (primary theme)
└── theme.ts (TypeScript theme config)
```

### **Files to DELETE:**
```
src/styles/
├── rts-gaming-theme.css ❌
├── *.backup ❌
└── *.tmp ❌

backup/ ❌ (entire directory)
```

### **CSS Modules to AUDIT:**
```
src/pages/**/*.module.css
src/components/**/*.module.css
```

## 🧹 **CLEANUP SCRIPTS**

### **Script 1: Mass Backup Removal**
```bash
#!/bin/bash
echo "🗑️  REMOVING BACKUP FILES..."
find . -name "*.backup" -type f -delete
find . -name "*.tmp" -type f -delete
echo "✅ Backup files removed"
```

### **Script 2: Orphaned CSS Detection**
```bash
#!/bin/bash
echo "🔍 FINDING ORPHANED CSS FILES..."
orphaned_count=0
for css in $(find src -name "*.module.css" | grep -v backup); do
  tsx_file="${css/.module.css/.tsx}"
  if [[ ! -f "$tsx_file" ]]; then
    echo "ORPHANED: $css"
    ((orphaned_count++))
  fi
done
echo "Found $orphaned_count orphaned CSS files"
```

### **Script 3: CSS Import Analysis**
```bash
#!/bin/bash
echo "📊 ANALYZING CSS IMPORTS..."
echo "=== IMPORTED CSS MODULES ==="
grep -r "import.*\.module\.css" src/ --include="*.tsx" | cut -d':' -f2 | sort | uniq

echo "=== ALL CSS MODULES ==="
find src -name "*.module.css" | grep -v backup | sort
```

## 🎯 **SUCCESS CRITERIA**

### **Quantitative Goals:**
- ✅ Reduce CSS file count from **569** to **<50**
- ✅ Remove all **240** backup files
- ✅ Eliminate backup directories
- ✅ Achieve 1:1 ratio of CSS modules to TSX components

### **Qualitative Goals:**
- ✅ No conflicting theme imports
- ✅ Clean project structure
- ✅ Fast development server startup
- ✅ Clear CSS import hierarchy

## 🚨 **RISKS & MITIGATION**

### **Risk 1: Accidental Deletion of Active Files**
**Mitigation:** Run dry-run scripts first, create git commit before cleanup

### **Risk 2: Breaking Component Styling**
**Mitigation:** Audit all CSS imports before deletion, test key components

### **Risk 3: Lost Custom Styles**
**Mitigation:** Extract any custom styles from abandoned files before deletion

## 📋 **PHASE 1 CHECKLIST**

- [ ] **1.1** Remove all backup files
- [ ] **1.2** Delete backup directories  
- [ ] **1.3** Audit CSS module usage
- [ ] **1.4** Remove orphaned CSS files
- [ ] **1.5** Resolve theme conflicts
- [ ] **1.6** Clean up globals.css
- [ ] **1.7** Test development server
- [ ] **1.8** Verify no broken imports

## 🔄 **NEXT PHASE**
After Phase 1 cleanup, proceed to **Phase 2: Style Consolidation** with a clean foundation.
