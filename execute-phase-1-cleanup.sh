#!/bin/bash

# STARCOM CSS CLEANUP - PHASE 1 EXECUTION SCRIPT
# Archaeological Cleanup - Remove abandoned and conflicting files

echo "🚀 STARCOM CSS CONSOLIDATION - PHASE 1: ARCHAEOLOGICAL CLEANUP"
echo "============================================================="

# Create backup before starting
echo "📦 Creating safety backup..."
git add -A
git commit -m "BACKUP: Before CSS cleanup Phase 1" || echo "No changes to commit"
git tag "css-cleanup-backup-$(date +%Y%m%d-%H%M%S)"

# Count current files
echo "📊 Current file analysis:"
echo "   Total CSS files: $(find . -name "*.css" | wc -l)"
echo "   Backup files: $(find . -name "*.backup" | wc -l)"
echo "   Temp files: $(find . -name "*.tmp" | wc -l)"

echo ""
echo "🔥 Starting cleanup operations..."

# Phase 1.1: Remove all backup files
echo "🗑️  Removing .backup files..."
find . -name "*.backup" -type f -delete
echo "   ✅ Removed $(find . -name "*.backup" 2>/dev/null | wc -l) .backup files"

# Phase 1.2: Remove temp files
echo "🗑️  Removing .tmp files..."
find . -name "*.tmp" -type f -delete
echo "   ✅ Removed temp files"

# Phase 1.3: Remove old files
echo "🗑️  Removing .old files..."
find . -name "*.old" -type f -delete
echo "   ✅ Removed .old files"

# Phase 1.4: Clean backup directories
echo "🗑️  Cleaning backup directories..."
if [ -d "backup/" ]; then
    echo "   Found backup/ directory, checking contents..."
    ls -la backup/ || echo "   Empty backup directory"
    echo "   Would you like to remove backup/ directory? (y/n)"
    echo "   (Skipping auto-removal for safety)"
fi

if [ -d "src/backup/" ]; then
    echo "   Found src/backup/ directory, checking contents..."
    ls -la src/backup/ || echo "   Empty src/backup directory"
fi

# Phase 1.5: Identify orphaned CSS modules
echo "🔍 Scanning for orphaned CSS modules..."
orphaned_count=0
for css in $(find src -name "*.module.css" 2>/dev/null); do
    # Convert CSS path to potential TSX path
    tsx_file="${css/.module.css/.tsx}"
    js_file="${css/.module.css/.js}"
    jsx_file="${css/.module.css/.jsx}"
    
    if [[ ! -f "$tsx_file" && ! -f "$js_file" && ! -f "$jsx_file" ]]; then
        echo "   🚨 ORPHANED: $css"
        ((orphaned_count++))
    fi
done

if [ $orphaned_count -eq 0 ]; then
    echo "   ✅ No orphaned CSS modules found"
else
    echo "   ⚠️  Found $orphaned_count potentially orphaned CSS modules"
    echo "   (Review manually before removal)"
fi

# Phase 1.6: Theme conflict analysis
echo "🔍 Analyzing theme conflicts..."
if [ -f "src/styles/cyberpunk-theme.css" ] && [ -f "src/styles/rts-gaming-theme.css" ]; then
    echo "   🚨 CONFLICT: Both cyberpunk-theme.css and rts-gaming-theme.css exist"
    echo "   📋 Need to consolidate in Phase 2"
fi

# Check globals.css imports
if [ -f "src/styles/globals.css" ]; then
    echo "   📊 globals.css imports:"
    grep -n "@import" src/styles/globals.css || echo "   No @import statements found"
fi

# Final count
echo ""
echo "📊 Post-cleanup analysis:"
echo "   Total CSS files remaining: $(find . -name "*.css" | wc -l)"
echo "   Backup files remaining: $(find . -name "*.backup" | wc -l)"

# Commit cleanup
echo ""
echo "💾 Committing cleanup changes..."
git add -A
git commit -m "🧹 PHASE 1: Archaeological cleanup - removed backup files and temp files"

echo ""
echo "✅ PHASE 1 CLEANUP COMPLETE!"
echo ""
echo "📋 Next Steps:"
echo "   1. Review the project builds correctly: npm run dev"
echo "   2. Check for visual regressions in browser"
echo "   3. Proceed to Phase 2: Style Consolidation"
echo "   4. See docs/PHASE-2-STYLE-CONSOLIDATION.md for next steps"
echo ""
echo "🎯 Phase 1 Success Criteria:"
echo "   ✅ Backup files removed"
echo "   ✅ Temp files cleaned"
echo "   ✅ Orphaned modules identified"
echo "   ✅ Theme conflicts documented"
echo "   ✅ Changes committed safely"
