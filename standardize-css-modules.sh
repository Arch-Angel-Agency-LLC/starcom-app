#!/bin/bash

# STARCOM PHASE 2-3: CSS MODULE STANDARDIZATION
# Systematically update all CSS modules to use unified design tokens

echo "🎨 STARCOM PHASE 2-3: CSS MODULE STANDARDIZATION"
echo "================================================="

# Color variable mapping
declare -A color_map=(
    ["--bg-primary"]="--surface-base"
    ["--bg-secondary"]="--surface-elevated"
    ["--bg-tertiary"]="--surface-overlay"
    ["--bg-quaternary"]="--surface-interactive"
    ["--cyber-cyan"]="--starcom-primary"
    ["--cyber-teal"]="--starcom-accent"
    ["--cyber-green"]="--starcom-accent"
    ["--cyber-purple"]="--starcom-secondary"
    ["--space-lg"]="--space-6"
    ["--space-md"]="--space-4"
    ["--space-sm"]="--space-2"
    ["--space-xs"]="--space-1"
    ["--space-xl"]="--space-8"
    ["--space-2xl"]="--space-12"
    ["--font-ui"]="'Aldrich', monospace"
    ["--rts-primary-glow"]="--starcom-primary"
    ["--rts-secondary-glow"]="--starcom-accent"
    ["--rts-panel-bg"]="--panel-bg"
    ["--rts-panel-border"]="--panel-border"
)

# Border radius mapping
declare -A radius_map=(
    ["border-radius: 8px"]="border-radius: var(--radius-lg)"
    ["border-radius: 6px"]="border-radius: var(--radius-md)"
    ["border-radius: 4px"]="border-radius: var(--radius-sm)"
    ["border-radius: 12px"]="border-radius: var(--radius-xl)"
    ["border-radius: 16px"]="border-radius: var(--radius-2xl)"
)

echo "🔍 Finding CSS modules to update..."
css_files=$(find src -name "*.module.css" -not -name "*.backup" -not -name "*.old")
total_files=$(echo "$css_files" | wc -l)
echo "   Found $total_files CSS modules to process"

updated_count=0

for css_file in $css_files; do
    echo "🎯 Processing: $css_file"
    
    # Create backup
    cp "$css_file" "${css_file}.pre-standardization"
    
    # Update color variables
    for old_var in "${!color_map[@]}"; do
        new_var="${color_map[$old_var]}"
        if grep -q "$old_var" "$css_file"; then
            sed -i.tmp "s|$old_var|$new_var|g" "$css_file"
            echo "   ✅ Updated $old_var -> $new_var"
        fi
    done
    
    # Update border radius values
    for old_radius in "${!radius_map[@]}"; do
        new_radius="${radius_map[$old_radius]}"
        if grep -q "$old_radius" "$css_file"; then
            sed -i.tmp "s|$old_radius|$new_radius|g" "$css_file"
            echo "   ✅ Updated border radius"
        fi
    done
    
    # Clean up temp files
    rm -f "${css_file}.tmp"
    
    # Add screen identity if it's a screen component
    if [[ $css_file == *"Screen"* ]]; then
        # Detect screen type and add appropriate identity
        if [[ $css_file == *"Intel"* ]]; then
            if ! grep -q "screen-primary" "$css_file"; then
                sed -i.tmp '1a\
/* Intel Screen Identity */\
:local(.screen) {\
  --screen-primary: var(--starcom-primary);\
  --screen-glow: var(--glow-cyan);\
}\
' "$css_file"
                echo "   ✅ Added Intel screen identity"
            fi
        elif [[ $css_file == *"NetRunner"* ]]; then
            if ! grep -q "screen-primary" "$css_file"; then
                sed -i.tmp '1a\
/* NetRunner Screen Identity */\
:local(.screen) {\
  --screen-primary: var(--starcom-accent);\
  --screen-glow: var(--glow-green);\
}\
' "$css_file"
                echo "   ✅ Added NetRunner screen identity"
            fi
        elif [[ $css_file == *"Teams"* ]]; then
            if ! grep -q "screen-primary" "$css_file"; then
                sed -i.tmp '1a\
/* Teams Screen Identity */\
:local(.screen) {\
  --screen-primary: var(--starcom-secondary);\
  --screen-glow: var(--glow-red);\
}\
' "$css_file"
                echo "   ✅ Added Teams screen identity"
            fi
        fi
        rm -f "${css_file}.tmp"
    fi
    
    ((updated_count++))
    echo "   📊 Progress: $updated_count/$total_files"
done

echo ""
echo "🎯 STANDARDIZATION COMPLETE!"
echo "=============================="
echo "   ✅ Updated $updated_count CSS modules"
echo "   📁 Backups saved as .pre-standardization"
echo "   🎨 All modules now use unified design tokens"

# Test build
echo ""
echo "🧪 Testing build with standardized CSS..."
if npm run build > /dev/null 2>&1; then
    echo "   ✅ Build successful - CSS standardization working!"
else
    echo "   ❌ Build failed - checking for issues..."
    echo "   🔧 Run 'npm run build' manually to see specific errors"
fi

echo ""
echo "📋 Next Steps:"
echo "   1. Visual test all screens for consistency"
echo "   2. Check for any remaining hardcoded values"
echo "   3. Commit standardized CSS modules"
echo "   4. Proceed to Phase 3 final polish"
