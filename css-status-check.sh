#!/bin/bash

# STARCOM CSS STATUS CHECKER
# Quick analysis of current CSS state

echo "🔍 STARCOM CSS CONSOLIDATION STATUS REPORT"
echo "==========================================="
echo ""

# File counts
echo "📊 FILE INVENTORY:"
echo "   CSS files total: $(find . -name "*.css" | wc -l)"
echo "   CSS modules: $(find . -name "*.module.css" | wc -l)"
echo "   Backup files: $(find . -name "*.backup" | wc -l)"
echo "   Temp files: $(find . -name "*.tmp" | wc -l)"
echo "   Old files: $(find . -name "*.old" | wc -l)"
echo ""

# Theme analysis
echo "🎨 THEME STATUS:"
if [ -f "src/styles/cyberpunk-theme.css" ]; then
    echo "   ✅ cyberpunk-theme.css exists"
else
    echo "   ❌ cyberpunk-theme.css missing"
fi

if [ -f "src/styles/rts-gaming-theme.css" ]; then
    echo "   ⚠️  rts-gaming-theme.css exists (conflict)"
else
    echo "   ✅ rts-gaming-theme.css removed"
fi

if [ -f "src/styles/globals.css" ]; then
    echo "   ✅ globals.css exists"
    echo "   📋 globals.css imports:"
    grep "@import" src/styles/globals.css | sed 's/^/      /'
else
    echo "   ❌ globals.css missing"
fi
echo ""

# Backup directory analysis
echo "🗂️  BACKUP DIRECTORIES:"
for dir in backup src/backup starcom-mk2-backup; do
    if [ -d "$dir" ]; then
        echo "   📁 $dir/ exists ($(find "$dir" -name "*.css" | wc -l) CSS files)"
    fi
done
echo ""

# Orphaned modules check
echo "🔍 ORPHANED CSS MODULES:"
orphaned_count=0
for css in $(find src -name "*.module.css" 2>/dev/null | head -10); do
    tsx_file="${css/.module.css/.tsx}"
    js_file="${css/.module.css/.js}"
    jsx_file="${css/.module.css/.jsx}"
    
    if [[ ! -f "$tsx_file" && ! -f "$js_file" && ! -f "$jsx_file" ]]; then
        echo "   🚨 $css"
        ((orphaned_count++))
    fi
done

if [ $orphaned_count -eq 0 ]; then
    echo "   ✅ No orphaned modules found (checked first 10)"
else
    echo "   ⚠️  Found $orphaned_count potentially orphaned modules"
fi
echo ""

# Phase completion status
echo "🚀 PHASE COMPLETION STATUS:"
backup_files=$(find . -name "*.backup" | wc -l)
if [ $backup_files -eq 0 ]; then
    echo "   ✅ Phase 1: Archaeological Cleanup - COMPLETE"
else
    echo "   ⏳ Phase 1: Archaeological Cleanup - PENDING ($backup_files backup files remain)"
fi

# Check for master theme
if [ -f "src/styles/starcom-cyberpunk.css" ]; then
    echo "   ✅ Phase 2: Style Consolidation - COMPLETE"
else
    echo "   ⏳ Phase 2: Style Consolidation - PENDING"
fi

# Check for design tokens
if grep -q "css-design-tokens" src/styles/globals.css 2>/dev/null; then
    echo "   ✅ Phase 3: Cyberpunk Implementation - COMPLETE"
else
    echo "   ⏳ Phase 3: Cyberpunk Implementation - PENDING"
fi

echo ""
echo "🎯 NEXT RECOMMENDED ACTION:"
if [ $backup_files -gt 0 ]; then
    echo "   Execute Phase 1 cleanup: ./execute-phase-1-cleanup.sh"
elif [ ! -f "src/styles/starcom-cyberpunk.css" ]; then
    echo "   Begin Phase 2: See docs/PHASE-2-STYLE-CONSOLIDATION.md"
else
    echo "   Begin Phase 3: See docs/PHASE-3-CYBERPUNK-IMPLEMENTATION.md"
fi
echo ""
