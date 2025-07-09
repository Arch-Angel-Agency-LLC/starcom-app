#!/bin/bash

# TARGETED CYBERPUNK CSS FIX
# Fix hardcoded colors while preserving important rounded elements

echo "🔧 TARGETED CYBERPUNK CSS FIXES"
echo "================================"

# Function to apply color fixes to a file
apply_color_fixes() {
    local file="$1"
    echo "Fixing colors in: $file"
    
    # Common hardcoded colors to replace
    sed -i.tmp 's/background-color: #0a1520/background-color: var(--bg-primary)/g' "$file"
    sed -i.tmp 's/background-color: rgba(20, 40, 60, 0\.5)/background-color: var(--bg-secondary)/g' "$file"
    sed -i.tmp 's/background-color: rgba(25, 45, 65, 0\.5)/background-color: var(--bg-tertiary)/g' "$file"
    sed -i.tmp 's/background-color: rgba(30, 50, 70, 0\.3)/background-color: var(--bg-tertiary)/g' "$file"
    sed -i.tmp 's/background-color: rgba(35, 55, 75, 0\.5)/background-color: var(--bg-quaternary)/g' "$file"
    
    # Text colors
    sed -i.tmp 's/color: #d0e0f0/color: var(--text-primary)/g' "$file"
    sed -i.tmp 's/color: #80c0ff/color: var(--cyber-cyan)/g' "$file"
    sed -i.tmp 's/color: #00ff41/color: var(--cyber-green)/g' "$file"
    
    # Border colors
    sed -i.tmp 's/border: 1px solid rgba(60, 100, 140, 0\.3)/border: 2px solid var(--border-primary)/g' "$file"
    sed -i.tmp 's/border-bottom: 1px solid rgba(60, 100, 140, 0\.3)/border-bottom: 2px solid var(--border-primary)/g' "$file"
    
    # Remove border-radius ONLY from panels, cards, buttons (NOT dots, circles, orbits)
    # First, identify lines that should keep border-radius
    grep -v -E "(orbit|planet|dot|circle|loader|spinner|avatar|chip|icon)" "$file" | \
    sed -i.tmp 's/border-radius: [0-9.]*[rempx]*/border-radius: 0/g' "$file"
    
    # Padding/margin using variables
    sed -i.tmp 's/padding: 2rem/padding: var(--space-xl)/g' "$file"
    sed -i.tmp 's/padding: 1\.5rem/padding: var(--space-xl)/g' "$file"
    sed -i.tmp 's/padding: 1rem/padding: var(--space-lg)/g' "$file"
    sed -i.tmp 's/padding: 16px/padding: var(--space-lg)/g' "$file"
    sed -i.tmp 's/padding: 8px/padding: var(--space-sm)/g' "$file"
    
    # Clean up temp files
    rm -f "$file.tmp"
    
    echo "✅ Fixed: $file"
}

# Find key screen files that need color fixes
key_files=(
    "src/pages/MainPage/Screens/IntelAnalyzerScreen.module.css"
    "src/pages/MainPage/Screens/NetRunnerScreen.module.css"
    "src/pages/Teams/TeamsDashboard.module.css"
    "src/components/MainPage/MainBottomBar.module.css"
    "src/components/MainPage/GlobalHeader.module.css"
    "src/pages/OSINT/OSINTDashboard.module.css"
)

echo "Processing key files for color fixes..."
for file in "${key_files[@]}"; do
    if [[ -f "$file" ]]; then
        apply_color_fixes "$file"
    fi
done

echo ""
echo "🎨 TARGETED FIXES COMPLETE"
echo "=========================="
echo "✅ Key files updated with cyberpunk colors"
echo "✅ Important rounded elements preserved"
echo "🚀 Ready for testing!"
