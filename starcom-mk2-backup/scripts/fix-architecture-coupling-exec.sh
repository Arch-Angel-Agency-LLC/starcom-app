#!/bin/bash
set -e

echo "🚨 CRITICAL DEPLOYMENT ACTION: Fixing Architecture Coupling"
echo "=========================================================="
echo "Converting from coupled architecture to clean separation"
echo ""

# Check we're in the right directory
if [ ! -f "ai-security-relaynode/Cargo.toml" ]; then
    echo "❌ Error: Must run from starcom-mk2 root directory"
    exit 1
fi

echo "📁 Switching to ai-security-relaynode directory..."
cd ai-security-relaynode/src/

echo "🔄 Step 1: Backing up current main.rs..."
if [ -f "main.rs" ]; then
    cp main.rs main_legacy_backup.rs
    echo "✅ Current main.rs backed up to main_legacy_backup.rs"
fi

echo "🔄 Step 2: Activating clean architecture main.rs..."
if [ -f "main_clean.rs" ]; then
    cp main_clean.rs main.rs
    echo "✅ Clean architecture main.rs activated"
else
    echo "❌ Error: main_clean.rs not found"
    exit 1
fi

echo "🔄 Step 3: Updating lib.rs exports..."
cd ..

# Backup lib.rs
if [ -f "src/lib.rs" ]; then
    cp src/lib.rs src/lib_backup.rs
    echo "✅ lib.rs backed up"
fi

# Update lib.rs to use clean architecture exports
cat > src/lib.rs << 'EOF'
// AI Security RelayNode - Clean Architecture
// Separated Subnet and Gateway concerns for production deployment

// Core clean architecture modules
pub mod clean_subnet;
pub mod clean_gateway;
pub mod clean_config;
pub mod network_coordinator;

// Supporting infrastructure
pub mod nostr_relay;
pub mod ipfs_node;
pub mod security_layer;
pub mod api_gateway;
pub mod config;

// Clean architecture exports
pub use clean_subnet::CleanSubnet;
pub use clean_gateway::CleanGateway;
pub use clean_config::CleanConfig;
pub use network_coordinator::NetworkCoordinator;

// Infrastructure exports
pub use nostr_relay::NostrRelay;
pub use ipfs_node::IPFSNode;
pub use security_layer::SecurityLayer;
pub use api_gateway::APIGateway;
pub use config::Config;

// Legacy modules (will be removed in production)
#[cfg(feature = "legacy")]
pub mod services;
#[cfg(feature = "legacy")]
pub mod subnet_manager;

#[cfg(feature = "legacy")]
pub use subnet_manager::{SubnetManager, SubnetStatus};

// Production-ready error types
pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;
EOF

echo "✅ lib.rs updated with clean architecture exports"

echo "🔄 Step 4: Testing clean architecture build..."
if cargo check; then
    echo "✅ Clean architecture check passed"
else
    echo "❌ Build check failed - restoring backup"
    cp src/lib_backup.rs src/lib.rs
    cp src/main_legacy_backup.rs src/main.rs
    exit 1
fi

echo "🔄 Step 5: Full build test..."
if cargo build --release; then
    echo "✅ Clean architecture build successful"
else
    echo "❌ Build failed - restoring backup"
    cp src/lib_backup.rs src/lib.rs
    cp src/main_legacy_backup.rs src/main.rs
    exit 1
fi

echo ""
echo "🎉 ARCHITECTURE COUPLING FIXED SUCCESSFULLY!"
echo "=============================================="
echo "✅ Production now uses clean Subnet/Gateway separation"
echo "✅ Architectural coupling removed"
echo "✅ Build system validated"
echo ""
echo "📋 Next Steps:"
echo "1. Implement team authentication system"
echo "2. Setup ARM64 cross-compilation for Jetson Nano"
echo "3. Create investigation workflow"
echo ""
echo "🚀 Ready for Phase 1B: Team Authentication Implementation"
