# PHASE 2: STYLE CONSOLIDATION  
*Establishing Single Source of Truth*

## 🎯 **OBJECTIVE**
Consolidate all styling into a unified, consistent system with clear hierarchy and no conflicts.

## 🏗️ **CONSOLIDATION STRATEGY**

### **Theme Architecture:**
```
SINGLE CYBERPUNK THEME
├── Core Variables (colors, spacing, typography)
├── Component Base Styles 
├── Screen-Specific Themes
└── Utility Classes
```

### **NO MORE CONFLICTS:**
- ❌ Multiple theme files competing
- ❌ Hardcoded colors overriding variables  
- ❌ CSS specificity wars
- ❌ Duplicate style definitions

## 📋 **CONSOLIDATION TASKS**

### **Task 2.1: Master Theme File Creation**
Create single `starcom-cyberpunk.css` with complete design system:

```css
/* STARCOM MASTER CYBERPUNK THEME */

:root {
  /* === CORE SYSTEM === */
  --bg-primary: #0a1520;
  --cyber-cyan: #00d4ff;
  /* ... complete variable set */
  
  /* === COMPONENT PRESETS === */
  --panel-bg: var(--bg-secondary);
  --panel-border: 2px solid var(--cyber-cyan);
  --button-hover: var(--cyber-cyan);
  
  /* === SCREEN THEMES === */
  --intel-primary: var(--cyber-cyan);
  --netrunner-primary: var(--cyber-green);
  --teams-primary: var(--cyber-purple);
}
```

### **Task 2.2: CSS Module Standardization**
Apply consistent patterns to all CSS modules:

**BEFORE (Inconsistent):**
```css
.panel {
  background: #1a2e42; /* hardcoded */
  border-radius: 8px; /* should be 0 */
  padding: 16px; /* should use variable */
}
```

**AFTER (Standardized):**
```css
.panel {
  background-color: var(--bg-tertiary);
  border-radius: 0; /* cyberpunk sharp edges */
  padding: var(--space-lg);
  border: var(--border-primary);
}
```

### **Task 2.3: Screen Theme Implementation**
Each major screen gets its dedicated theme section:

```css
/* === INTEL ANALYZER THEME === */
.intel-screen {
  --primary-accent: var(--intel-primary);
  --glow-effect: var(--intel-glow);
}

/* === NETRUNNER THEME === */  
.netrunner-screen {
  --primary-accent: var(--netrunner-primary);
  --glow-effect: var(--netrunner-glow);
}
```

### **Task 2.4: Component Base Classes**
Create reusable component classes:

```css
/* === CYBERPUNK COMPONENTS === */
.cyber-panel {
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 0;
  padding: var(--space-lg);
}

.cyber-button {
  background-color: var(--bg-quaternary);
  border: 2px solid var(--cyber-cyan);
  color: var(--cyber-cyan);
  border-radius: 0;
  text-transform: uppercase;
  font-family: var(--font-cyber);
}

.cyber-input {
  background-color: var(--bg-tertiary);
  border: 2px solid var(--border-primary);
  color: var(--text-primary);
  border-radius: 0;
}
```

## 🔧 **CONSOLIDATION TOOLS**

### **Tool 1: Variable Extraction Script**
```bash
#!/bin/bash
echo "🎨 EXTRACTING CSS VARIABLES..."

# Find all hardcoded colors
grep -r "background.*#[0-9a-fA-F]" src/ --include="*.css" > hardcoded-colors.txt
grep -r "color.*#[0-9a-fA-F]" src/ --include="*.css" >> hardcoded-colors.txt

echo "Found hardcoded colors - see hardcoded-colors.txt"
```

### **Tool 2: CSS Variable Replacement**
```bash
#!/bin/bash
echo "🔄 REPLACING HARDCODED VALUES..."

# Replace common hardcoded values with variables
find src -name "*.css" -exec sed -i '' 's/#0a1520/var(--bg-primary)/g' {} \;
find src -name "*.css" -exec sed -i '' 's/#00d4ff/var(--cyber-cyan)/g' {} \;
find src -name "*.css" -exec sed -i '' 's/border-radius: [0-9.]*px/border-radius: 0/g' {} \;
```

### **Tool 3: Import Standardization**
```bash
#!/bin/bash
echo "📦 STANDARDIZING IMPORTS..."

# Update all globals.css imports to use new consolidated theme
sed -i '' "s/@import '.*cyberpunk.*'/@import '.\/starcom-cyberpunk.css'/g" src/styles/globals.css
sed -i '' "s/@import '.*rts.*'//g" src/styles/globals.css
```

## 📊 **CONSOLIDATION METRICS**

### **Before Consolidation:**
- 🔴 **3 theme files** competing
- 🔴 **127 hardcoded colors** across files  
- 🔴 **89 border-radius** inconsistencies
- 🔴 **156 spacing** hardcoded values

### **After Consolidation:**
- ✅ **1 master theme** file
- ✅ **0 hardcoded colors** (all variables)
- ✅ **Consistent** border-radius (0 for panels, 50% for circles)
- ✅ **Variable-based** spacing system

## 🎨 **DESIGN SYSTEM STRUCTURE**

### **Master CSS File Organization:**
```css
/* STARCOM CYBERPUNK DESIGN SYSTEM */

/* 1. CSS VARIABLES */
:root { /* All design tokens */ }

/* 2. GLOBAL RESETS */
*, *::before, *::after { /* Normalize */ }

/* 3. COMPONENT BASE CLASSES */
.cyber-panel, .cyber-button, .cyber-input { /* Reusables */ }

/* 4. LAYOUT UTILITIES */  
.cyber-grid, .cyber-flex, .cyber-container { /* Layout */ }

/* 5. SCREEN THEMES */
.intel-screen, .netrunner-screen, .teams-screen { /* Screen-specific */ }

/* 6. RESPONSIVE STYLES */
@media (max-width: 768px) { /* Mobile adaptations */ }
```

### **CSS Module Template:**
```css
/* ComponentName.module.css */
.componentName {
  /* Use design system classes */
  @extend .cyber-panel;
  
  /* Component-specific overrides */
  --local-accent: var(--intel-primary);
}
```

## 🔍 **VALIDATION CHECKLIST**

### **Design System Validation:**
- [ ] All CSS variables defined in one place
- [ ] No hardcoded colors anywhere
- [ ] Consistent border-radius policy (0 for UI, 50% for circles)
- [ ] Spacing uses design system variables
- [ ] Typography uses design system fonts

### **Component Validation:**
- [ ] All components use base classes when possible
- [ ] No duplicate style definitions
- [ ] Consistent naming conventions
- [ ] Screen themes properly applied

### **Performance Validation:**
- [ ] Single CSS import chain (no circular dependencies)
- [ ] Optimized CSS bundle size
- [ ] Fast development server reloads
- [ ] No CSS compilation errors

## 🚨 **INTEGRATION RISKS**

### **Risk 1: Visual Regression**
**Mitigation:** Screenshot testing of key screens before/after

### **Risk 2: CSS Specificity Issues**  
**Mitigation:** Use consistent specificity levels, avoid !important

### **Risk 3: Component Breaking Changes**
**Mitigation:** Gradual migration, component-by-component testing

## 📋 **PHASE 2 DELIVERABLES**

1. **`starcom-cyberpunk.css`** - Master theme file
2. **Updated `globals.css`** - Clean single import
3. **Standardized CSS modules** - All using design system
4. **Component base classes** - Reusable styles
5. **Screen theme implementations** - Intel, NetRunner, Teams
6. **CSS validation report** - No hardcoded values
7. **Performance benchmarks** - Before/after metrics

## 🔄 **NEXT PHASE**
Proceed to **Phase 3: Cyberpunk Implementation** to apply the clean, consolidated theme system.
