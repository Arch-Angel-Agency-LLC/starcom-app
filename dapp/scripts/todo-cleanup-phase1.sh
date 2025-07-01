#!/bin/bash

# TODO Cleanup and Refactor Implementation Script
# Starcom dApp - Phase 1: Remove Legacy TODOs
# Date: July 1, 2025

set -e

echo "🧹 Starting TODO Cleanup and Refactor - Phase 1: Remove Legacy TODOs"
echo "================================================================="

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

echo
echo "Phase 1.1: Archive Legacy Authentication Files"
echo "=============================================="

# Create excluded-from-build directory if it doesn't exist
if [ ! -d "excluded-from-build" ]; then
    mkdir -p excluded-from-build/legacy-auth
    log_action "Created excluded-from-build/legacy-auth directory"
fi

# Move legacy auth files
if [ -f "src/backup/legacy-utils/AuthContext.tsx" ]; then
    mv "src/backup/legacy-utils/AuthContext.tsx" "excluded-from-build/legacy-auth/"
    log_action "Archived legacy AuthContext.tsx"
elif [ -f "excluded-from-build/backup/legacy-utils/AuthContext.tsx" ]; then
    log_info "Legacy AuthContext.tsx already archived"
else
    log_warning "Legacy AuthContext.tsx not found in expected location"
fi

echo
echo "Phase 1.2: Clean EVM/Ethereum Legacy TODOs"
echo "=========================================="

# Function to remove specific TODO lines from files
remove_todo_line() {
    local file="$1"
    local line_pattern="$2"
    local description="$3"
    
    if [ -f "$file" ]; then
        # Use sed to remove lines containing the pattern
        if sed -i.bak "/$line_pattern/d" "$file" 2>/dev/null; then
            log_action "Removed TODO: $description from $file"
            rm -f "$file.bak"
        else
            log_warning "Could not remove TODO from $file (pattern not found)"
        fi
    else
        log_warning "File not found: $file"
    fi
}

# Clean wallet utility TODOs
if [ -f "src/utils/wallet.ts" ]; then
    log_info "Cleaning wallet.ts TODOs..."
    remove_todo_line "src/utils/wallet.ts" "TODO.*@solana/wallet-adapter-react" "EVM wallet adapter integration"
else
    log_warning "src/utils/wallet.ts not found"
fi

echo
echo "Phase 1.3: Update Globe Component TODOs"  
echo "======================================"

# Replace placeholder Globe TODOs with integration references
if [ -f "src/components/HUD/Center/Globe3DView.tsx" ]; then
    log_info "Updating Globe3DView.tsx TODOs..."
    
    # Replace specific TODO lines with updated versions
    sed -i.bak 's|// TODO: Initialize actual 3D globe (Three.js, D3-geo, or WebGL)|// TODO: Integrate with main Globe component from src/components/Globe/Globe.tsx for 3D rendering|g' "src/components/HUD/Center/Globe3DView.tsx"
    
    sed -i.bak 's|// TODO: Update globe with context-specific data|// TODO: Connect to main Globe state management for real-time intel marker updates|g' "src/components/HUD/Center/Globe3DView.tsx"
    
    sed -i.bak 's|// TODO: Cleanup 3D resources, event listeners, etc.|// TODO: Implement cleanup coordination with main Globe component|g' "src/components/HUD/Center/Globe3DView.tsx"
    
    rm -f "src/components/HUD/Center/Globe3DView.tsx.bak"
    log_action "Updated Globe3DView.tsx TODOs with integration references"
else
    log_warning "Globe3DView.tsx not found"
fi

echo
echo "Phase 1.4: Remove Server-Side Security TODOs"
echo "============================================"

# Function to scan and report server-side TODOs for manual review
scan_server_todos() {
    log_info "Scanning for server-side security TODOs..."
    
    # Find files with server-side security TODOs
    if command -v grep >/dev/null 2>&1; then
        grep -r "TODO.*server-side" src/ 2>/dev/null | head -10 | while read -r line; do
            log_warning "Found server-side TODO: $line"
        done
        
        grep -r "TODO.*Sentry" src/ 2>/dev/null | head -5 | while read -r line; do
            log_warning "Found monitoring service TODO: $line"
        done
    fi
}

scan_server_todos

echo
echo "Phase 2 Preview: Files Ready for TODO Replacement"
echo "================================================"

# List files that need TODO updates in Phase 2
log_info "Files requiring TODO replacement in Phase 2:"
echo "  - src/components/Auth/TokenGatedPage.test.tsx"
echo "  - src/services/IntelReportService.ts"  
echo "  - src/services/BlockchainAnchorService.ts"
echo "  - src/hooks/useIntel3DInteraction.ts"
echo "  - src/services/RealTimeTeamService.ts"

echo
echo "Phase 3 Preview: TODO Enhancement Targets"
echo "========================================"

log_info "TODOs ready for context enhancement:"
echo "  - IPFS/Nostr integration TODOs"
echo "  - 3D interaction and performance TODOs"  
echo "  - Team collaboration TODOs"
echo "  - Investigation workflow TODOs"

echo
echo "Summary Report"
echo "=============="

# Count remaining TODOs
if command -v grep >/dev/null 2>&1; then
    todo_count=$(grep -r "TODO" src/ 2>/dev/null | wc -l | tr -d ' ')
    log_info "Estimated remaining TODOs in src/: $todo_count"
    
    # Count specific legacy patterns
    legacy_auth_todos=$(grep -r "TODO.*DID.*verification\|TODO.*OTK.*generation\|TODO.*PQC.*implementation" src/ 2>/dev/null | wc -l | tr -d ' ')
    evm_todos=$(grep -r "TODO.*RainbowKit\|TODO.*Wagmi\|TODO.*ethers" src/ 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$legacy_auth_todos" -gt 0 ]; then
        log_warning "Legacy auth TODOs remaining: $legacy_auth_todos"
    else
        log_action "Legacy auth TODOs: Clean ✅"
    fi
    
    if [ "$evm_todos" -gt 0 ]; then
        log_warning "EVM-related TODOs remaining: $evm_todos"  
    else
        log_action "EVM TODOs: Clean ✅"
    fi
fi

echo
echo "Next Steps"
echo "=========="
log_info "1. Review the changes made in this phase"
log_info "2. Run 'npm run build' to verify no broken imports"
log_info "3. Execute Phase 2: Replace TODOs with updated requirements"
log_info "4. See docs/development/todo-cleanup-refactor-plan.md for full plan"

echo
echo "🎯 Phase 1 Complete! Ready for Phase 2 TODO replacements."
echo "================================================================="
