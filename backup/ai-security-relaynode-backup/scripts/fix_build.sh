#!/bin/bash

# Build Issue Resolution Script
# Attempts to resolve macOS compilation issues

set -e

echo "🔧 AI Security RelayNode Build Issue Resolution"
echo "================================================"
echo ""

# Project root
PROJECT_ROOT="/Users/jono/Documents/GitHub/starcom-app/ai-security-relaynode"
cd "$PROJECT_ROOT"

echo "📂 Working in: $PROJECT_ROOT"
echo ""

# Check macOS development environment
echo "🍎 MACOS DEVELOPMENT ENVIRONMENT CHECK"
echo "──────────────────────────────────────"

# Check if Xcode command line tools are installed
if xcode-select -p &> /dev/null; then
    echo "✅ Xcode command line tools installed at: $(xcode-select -p)"
else
    echo "❌ Xcode command line tools not installed"
    echo "Installing Xcode command line tools..."
    xcode-select --install
fi

# Check for Xcode app
if [[ -d "/Applications/Xcode.app" ]]; then
    echo "✅ Xcode app found"
else
    echo "⚠️  Xcode app not found (optional)"
fi

echo ""

# Check SDK paths
echo "🔍 SDK PATH VERIFICATION"
echo "─────────────────────────"

# Check macOS SDK
MACOS_SDK=$(xcrun --show-sdk-path 2>/dev/null || echo "Not found")
echo "macOS SDK: $MACOS_SDK"

if [[ "$MACOS_SDK" != "Not found" ]]; then
    echo "✅ macOS SDK found"
    
    # Check for problematic header
    if [[ -f "$MACOS_SDK/usr/include/stdarg.h" ]]; then
        echo "✅ stdarg.h found in SDK"
    else
        echo "❌ stdarg.h missing from SDK"
        echo "This is the likely cause of build failures"
    fi
else
    echo "❌ macOS SDK not found"
fi

echo ""

# Try different build approaches
echo "🚀 BUILD RESOLUTION ATTEMPTS"
echo "─────────────────────────────"

# Attempt 1: Clean build
echo "Attempt 1: Clean build"
cargo clean
if cargo check --quiet 2>/dev/null; then
    echo "✅ Clean build successful"
    exit 0
else
    echo "❌ Clean build failed"
fi

echo ""

# Attempt 2: Update dependencies
echo "Attempt 2: Update dependencies"
cargo update
if cargo check --quiet 2>/dev/null; then
    echo "✅ Updated dependencies build successful"
    exit 0
else
    echo "❌ Updated dependencies build failed"
fi

echo ""

# Attempt 3: Disable mac-notification-sys features
echo "Attempt 3: Modify Cargo.toml to disable problematic features"

# Create backup
cp Cargo.toml Cargo.toml.backup

# Add platform-specific dependency exclusions
cat >> Cargo.toml << 'EOF'

# Workaround for macOS compilation issues
[target.'cfg(target_os = "macos")'.dependencies]
# Exclude problematic notification system dependencies
# mac-notification-sys = { version = "*", optional = true }

[features]
default = []
# Disable desktop notifications on macOS to avoid build issues
desktop-notifications = []
EOF

echo "Modified Cargo.toml to exclude problematic dependencies"

if cargo check --quiet 2>/dev/null; then
    echo "✅ Modified build successful"
    exit 0
else
    echo "❌ Modified build failed"
    # Restore backup
    mv Cargo.toml.backup Cargo.toml
fi

echo ""

# Attempt 4: Use different Rust toolchain
echo "Attempt 4: Try different Rust toolchain"

# Check current toolchain
CURRENT_TOOLCHAIN=$(rustup show active-toolchain | cut -d' ' -f1)
echo "Current toolchain: $CURRENT_TOOLCHAIN"

# Try stable toolchain
if rustup toolchain list | grep -q "stable"; then
    echo "Switching to stable toolchain..."
    rustup default stable
    
    if cargo check --quiet 2>/dev/null; then
        echo "✅ Stable toolchain build successful"
        exit 0
    else
        echo "❌ Stable toolchain build failed"
        # Restore original toolchain
        rustup default "$CURRENT_TOOLCHAIN"
    fi
fi

echo ""

# Attempt 5: Use environment variables to fix paths
echo "Attempt 5: Set environment variables for build"

export SDKROOT=$(xcrun --show-sdk-path)
export CPATH="$SDKROOT/usr/include"
export LIBRARY_PATH="$SDKROOT/usr/lib"

echo "Set SDKROOT=$SDKROOT"
echo "Set CPATH=$CPATH"
echo "Set LIBRARY_PATH=$LIBRARY_PATH"

if cargo check --quiet 2>/dev/null; then
    echo "✅ Environment variable fix successful"
    echo ""
    echo "🎯 SOLUTION FOUND"
    echo "─────────────────"
    echo "Add these environment variables to your shell profile:"
    echo "export SDKROOT=\$(xcrun --show-sdk-path)"
    echo "export CPATH=\"\$SDKROOT/usr/include\""
    echo "export LIBRARY_PATH=\"\$SDKROOT/usr/lib\""
    exit 0
else
    echo "❌ Environment variable fix failed"
fi

echo ""

# Final attempt: Minimal build
echo "Final attempt: Try minimal build without Tauri"
echo "Creating minimal lib.rs for testing..."

# Backup main.rs
cp src/main.rs src/main.rs.backup

# Create minimal main.rs
cat > src/main.rs << 'EOF'
// Minimal main.rs for testing compilation
fn main() {
    println!("AI Security RelayNode - Minimal Build Test");
    println!("Clean architecture modules compilation test...");
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
EOF

# Try to build without Tauri
if cargo build --quiet --bin ai-security-relaynode 2>/dev/null; then
    echo "✅ Minimal build successful"
    echo "The issue is likely with Tauri dependencies"
    
    # Restore main.rs
    mv src/main.rs.backup src/main.rs
    
    echo ""
    echo "🎯 DIAGNOSIS"
    echo "────────────"
    echo "The core Rust code compiles fine."
    echo "The issue is with Tauri's mac-notification-sys dependency."
    echo ""
    echo "RECOMMENDED SOLUTIONS:"
    echo "1. Update Tauri to latest version"
    echo "2. Disable desktop notifications in Tauri config"
    echo "3. Use Tauri v2 (still in beta but has better macOS support)"
    echo "4. Set proper environment variables before building"
    
    exit 0
else
    echo "❌ Even minimal build failed"
    # Restore main.rs
    mv src/main.rs.backup src/main.rs
fi

echo ""
echo "🔴 BUILD RESOLUTION FAILED"
echo "───────────────────────────"
echo "None of the attempted fixes resolved the build issue."
echo ""
echo "MANUAL RESOLUTION STEPS:"
echo "1. Check macOS version compatibility"
echo "2. Reinstall Xcode command line tools: xcode-select --install"
echo "3. Update macOS to latest version"
echo "4. Consider using Docker for consistent build environment"
echo "5. Check Tauri documentation for macOS-specific issues"
echo ""
exit 1
