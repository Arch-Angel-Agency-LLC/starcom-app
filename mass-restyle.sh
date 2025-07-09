#!/bin/bash

# STARCOM CYBERPUNK MASS-RESTYLE SCRIPT
# Transforms all CSS files to use the new cyberpunk design system

echo "🚀 STARCOM CYBERPUNK MASS-RESTYLE INITIATED"
echo "============================================"

# Colors to replace (old -> new mappings)
declare -A color_replacements=(
    # Remove white backgrounds
    ["background-color: white"]="background-color: var(--bg-primary)"
    ["background-color: #ffffff"]="background-color: var(--bg-primary)"
    ["background-color: #fff"]="background-color: var(--bg-primary)"
    ["background: white"]="background: var(--bg-primary)"
    ["background: #fff"]="background: var(--bg-primary)"
    
    # Replace generic grays with cyber colors
    ["#f5f5f5"]="var(--bg-secondary)"
    ["#f0f0f0"]="var(--bg-tertiary)"
    ["#e0e0e0"]="var(--bg-quaternary)"
    
    # Replace common light colors
    ["color: black"]="color: var(--text-primary)"
    ["color: #000"]="color: var(--text-primary)"
    ["color: #333"]="color: var(--text-primary)"
    ["color: #666"]="color: var(--text-secondary)"
    ["color: #999"]="color: var(--text-muted)"
)

# Border radius replacements (remove rounded corners)
declare -A border_replacements=(
    ["border-radius: 8px"]="border-radius: 0"
    ["border-radius: 4px"]="border-radius: 0"
    ["border-radius: 12px"]="border-radius: 0"
    ["border-radius: 16px"]="border-radius: 0"
    ["border-radius: 6px"]="border-radius: 0"
    ["border-radius: 10px"]="border-radius: 0"
    ["border-radius: 0.5rem"]="border-radius: 0"
    ["border-radius: 1rem"]="border-radius: 0"
)

# Padding/margin reductions (remove fluff)
declare -A spacing_replacements=(
    ["padding: 2rem"]="padding: var(--space-lg)"
    ["padding: 1.5rem"]="padding: var(--space-lg)"
    ["padding: 24px"]="padding: var(--space-lg)"
    ["padding: 32px"]="padding: var(--space-xl)"
    ["margin: 2rem"]="margin: var(--space-lg)"
    ["margin: 1.5rem"]="margin: var(--space-lg)"
    ["margin-bottom: 2rem"]="margin-bottom: var(--space-lg)"
    ["margin-top: 2rem"]="margin-top: var(--space-lg)"
)

# Find all CSS files (excluding node_modules and backups)
css_files=$(find src -name "*.css" -not -path "*/node_modules/*" -not -path "*/backup/*")

echo "Found CSS files:"
echo "$css_files"
echo ""

# Function to apply replacements to a file
apply_replacements() {
    local file="$1"
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Apply color replacements
    for old_color in "${!color_replacements[@]}"; do
        new_color="${color_replacements[$old_color]}"
        sed -i.tmp "s|$old_color|$new_color|g" "$file"
        rm -f "$file.tmp"
    done
    
    # Apply border replacements
    for old_border in "${!border_replacements[@]}"; do
        new_border="${border_replacements[$old_border]}"
        sed -i.tmp "s|$old_border|$new_border|g" "$file"
        rm -f "$file.tmp"
    done
    
    # Apply spacing replacements
    for old_spacing in "${!spacing_replacements[@]}"; do
        new_spacing="${spacing_replacements[$old_spacing]}"
        sed -i.tmp "s|$old_spacing|$new_spacing|g" "$file"
        rm -f "$file.tmp"
    done
    
    echo "✅ Processed: $file"
}

# Process each CSS file
while IFS= read -r file; do
    if [[ -f "$file" && "$file" != *"cyberpunk-theme.css" ]]; then
        apply_replacements "$file"
    fi
done <<< "$css_files"

echo ""
echo "🎨 CYBERPUNK TRANSFORMATION COMPLETE"
echo "======================================="
echo "✅ All CSS files processed"
echo "📁 Backups created (.backup extension)"
echo "🚀 Ready for cyber command aesthetic!"
echo ""
echo "Next steps:"
echo "1. Import cyberpunk-theme.css in your main CSS"
echo "2. Test the new design"
echo "3. Remove .backup files when satisfied"
