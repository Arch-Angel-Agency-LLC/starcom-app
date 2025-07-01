#!/bin/bash

# TODO Cleanup and Refactor Implementation Script  
# Starcom dApp - Phase 2: Replace TODOs with Updated Requirements
# Date: July 1, 2025

set -e

echo "🔄 Starting TODO Cleanup and Refactor - Phase 2: Replace TODOs"
echo "==============================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log actions
log_action() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    log_error "Please run this script from the dapp root directory"
    exit 1
fi

log_info "Working directory: $(pwd)"

# Function to replace TODO content in files
replace_todo() {
    local file="$1"
    local old_pattern="$2"
    local new_content="$3"
    local description="$4"
    
    if [ -f "$file" ]; then
        if sed -i.bak "s|$old_pattern|$new_content|g" "$file" 2>/dev/null; then
            log_action "Updated TODO: $description in $file"
            rm -f "$file.bak"
        else
            log_warning "Could not update TODO in $file"
        fi
    else
        log_warning "File not found: $file"
    fi
}

echo
echo "Phase 2.1: Update Authentication System TODOs"
echo "=============================================="

# TokenGatedPage test TODO
replace_todo \
    "src/components/Auth/TokenGatedPage.test.tsx" \
    "TODO: Implement proper TokenGatedPage tests without RainbowKit/Wagmi circular deps" \
    "TODO: Implement Solana SPL token/NFT gating tests using @solana/wallet-adapter-react" \
    "TokenGatedPage test strategy"

echo
echo "Phase 2.2: Update Wallet Integration TODOs"  
echo "=========================================="

# Update wallet.ts TODOs
if [ -f "src/utils/wallet.ts" ]; then
    log_info "Updating wallet.ts integration TODOs..."
    
    replace_todo \
        "src/utils/wallet.ts" \
        "TODO: In production, integrate with @solana/wallet-adapter-react" \
        "TODO: Enhance Solana wallet adapter with multi-wallet support (Phantom, Solflare, Ledger)" \
        "wallet adapter enhancement"
fi

echo
echo "Phase 2.3: Update Intel Report Service TODOs"
echo "============================================="

# Intel Report Service updates
replace_todo \
    "src/services/IntelReportService.ts" \
    "TODO: Re-enable when Anchor integration is ready" \
    "TODO: Implement Solana program deployment and anchor client integration" \
    "Anchor integration readiness"

replace_todo \
    "src/services/IntelReportService.ts" \
    "TODO: Use actual wallet keypair" \
    "TODO: Integrate with Solana wallet adapter for transaction signing" \
    "wallet keypair integration"

echo
echo "Phase 2.4: Update Blockchain Anchor TODOs"
echo "=========================================="

# Blockchain Anchor Service updates
if [ -f "src/services/BlockchainAnchorService.ts" ]; then
    log_info "Updating BlockchainAnchorService.ts TODOs..."
    
    replace_todo \
        "src/services/BlockchainAnchorService.ts" \
        "TODO: Replace with actual deployed program ID when ready" \
        "TODO: Deploy intelligence marketplace program to Solana devnet and update program ID" \
        "program deployment"
    
    replace_todo \
        "src/services/BlockchainAnchorService.ts" \
        "TODO: Implement actual integrity check" \
        "TODO: Implement Solana transaction signature verification for intel report integrity" \
        "integrity verification"
fi

echo
echo "Phase 2.5: Update Investigation Integration TODOs"
echo "================================================="

# Investigation components
replace_todo \
    "src/components/Investigation/TaskKanban.tsx" \
    "TODO: Get from auth context" \
    "TODO: Integrate with unified auth context for operator identification and access control" \
    "auth context integration"

replace_todo \
    "src/components/Investigation/InvestigationGrid.tsx" \
    "TODO: Connect to actual task counts" \
    "TODO: Integrate with investigation data service for real-time task and evidence counts" \
    "investigation data integration"

echo
echo "Phase 2.6: Update Globe and 3D Interaction TODOs"
echo "================================================"

# Globe component updates
replace_todo \
    "src/components/Globe/Globe.tsx" \
    "TODO: Add user setting for fast loading" \
    "TODO: Implement user preference for globe loading optimization (cached vs real-time data)" \
    "globe loading preferences"

# 3D Interaction updates
replace_todo \
    "src/hooks/useIntel3DInteraction.ts" \
    "TODO: Track previous models to unregister removed ones" \
    "TODO: Implement 3D model lifecycle management with proper cleanup for intel markers on globe" \
    "3D model lifecycle"

echo
echo "Phase 2.7: Update Team Communication TODOs"
echo "==========================================="

# Team communication updates
replace_todo \
    "src/components/CyberInvestigation/TeamCommunication.tsx" \
    "TODO: Implement Nostr DM when available" \
    "TODO: Implement Nostr direct messaging using NIP-04 encryption for secure team communications" \
    "Nostr DM implementation"

echo
echo "Phase 2.8: Update Service Integration TODOs"
echo "==========================================="

# Real-time team service
replace_todo \
    "src/services/RealTimeTeamService.ts" \
    "TODO: Implement actual sync with Nostr relays and IPFS" \
    "TODO: Implement real-time team sync using Nostr events and IPFS content addressing for investigation data" \
    "team sync implementation"

# IPFS/Nostr bridge service  
replace_todo \
    "src/services/IPFSNostrBridgeService.ts" \
    "TODO: Get from IPFS service" \
    "TODO: Integrate with UnifiedIPFSNostrService for decentralized content retrieval" \
    "IPFS service integration"

echo
echo "Phase 2.9: Update Error Handling TODOs"
echo "======================================"

# Error boundary updates
replace_todo \
    "src/components/Shared/ErrorBoundary.tsx" \
    "TODO: Send to error monitoring service (e.g., Sentry)" \
    "TODO: Implement client-side error logging for decentralized accountability (IPFS-based)" \
    "decentralized error logging"

echo
echo "Phase 2.10: Verification and Quality Check"
echo "=========================================="

# Check for any remaining legacy patterns
log_info "Scanning for remaining legacy TODO patterns..."

if command -v grep >/dev/null 2>&1; then
    # Check for old patterns that should have been replaced
    legacy_patterns=(
        "RainbowKit"
        "Wagmi" 
        "ethers.js"
        "server-side"
        "when ready"
        "actual implementation"
    )
    
    for pattern in "${legacy_patterns[@]}"; do
        count=$(grep -r "TODO.*$pattern" src/ 2>/dev/null | wc -l | tr -d ' ')
        if [ "$count" -gt 0 ]; then
            log_warning "Found $count TODOs still containing '$pattern'"
            grep -r "TODO.*$pattern" src/ 2>/dev/null | head -3
        else
            log_action "Pattern '$pattern': Clean ✅"
        fi
    done
    
    # Count total TODOs after replacement
    total_todos=$(grep -r "TODO" src/ 2>/dev/null | wc -l | tr -d ' ')
    log_info "Total TODOs remaining in src/: $total_todos"
fi

echo
echo "Phase 2 Quality Verification"
echo "============================"

# Verify files still compile
log_info "Verifying TypeScript compilation..."
if command -v npx >/dev/null 2>&1; then
    if npx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
        log_action "TypeScript compilation: PASS ✅"
    else
        log_warning "TypeScript compilation: Issues detected - review changes"
    fi
else
    log_info "TypeScript compiler not available - manual verification recommended"
fi

echo
echo "Phase 3 Preparation"
echo "==================="

log_info "Files ready for Phase 3 (TODO Enhancement):"
echo "  - IPFS/Nostr service integration files"
echo "  - 3D interaction and performance files"
echo "  - Team collaboration service files"  
echo "  - Investigation workflow components"

echo
echo "Summary of Phase 2 Changes"
echo "=========================="

log_action "✅ Authentication TODOs: Updated to Solana-first approach"
log_action "✅ Wallet Integration TODOs: Updated with multi-wallet support goals"
log_action "✅ Service TODOs: Updated with specific implementation targets"
log_action "✅ Component TODOs: Updated with integration context"
log_action "✅ Error Handling: Updated for decentralized architecture"

echo
echo "Next Steps"
echo "=========="
log_info "1. Test the application to verify no regressions"
log_info "2. Review TODO changes for accuracy and completeness"  
log_info "3. Execute Phase 3: Enhance TODOs with detailed context"
log_info "4. Begin implementing high-priority TODOs from the updated list"

echo
echo "🎯 Phase 2 Complete! TODOs now reflect current Solana-first architecture."
echo "========================================================================"
