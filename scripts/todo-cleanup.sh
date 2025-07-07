#!/bin/bash

# Starcom dApp TODO Cleanup Master Script
# Orchestrates all phases of TODO cleanup and refactor
# Date: July 1, 2025

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    log_error "Please run this script from the dapp root directory"
    exit 1
fi

echo "🧹 Starcom dApp TODO Cleanup and Refactor Master Script"
echo "========================================================"
echo

# Make scripts executable
chmod +x scripts/todo-cleanup-phase1.sh 2>/dev/null || true
chmod +x scripts/todo-cleanup-phase2.sh 2>/dev/null || true

# Show usage options
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  analyze     - Run TODO analysis and generate report"
    echo "  phase1      - Execute Phase 1: Remove legacy TODOs"
    echo "  phase2      - Execute Phase 2: Replace TODOs with updated requirements"
    echo "  all         - Execute all phases in sequence"
    echo "  help        - Show this help message"
    echo
    echo "Individual phases:"
    echo "  Phase 1: Remove legacy authentication, EVM, and server-side TODOs"
    echo "  Phase 2: Replace outdated TODOs with Solana-first requirements"
    echo "  Phase 3: Enhance TODOs with detailed context (manual)"
    echo "  Phase 4: Add new priority TODOs (manual)"
}

# Run TODO analysis
run_analysis() {
    log_info "Running comprehensive TODO analysis..."
    
    if [ -f "scripts/todo-manager.cjs" ]; then
        node scripts/todo-manager.cjs
        log_success "TODO analysis complete"
    else
        log_error "TODO manager script not found"
        return 1
    fi
}

# Execute Phase 1
run_phase1() {
    log_info "Executing Phase 1: Remove Legacy TODOs"
    
    if [ -f "scripts/todo-cleanup-phase1.sh" ]; then
        bash scripts/todo-cleanup-phase1.sh
        log_success "Phase 1 complete"
    else
        log_error "Phase 1 script not found"
        return 1
    fi
}

# Execute Phase 2  
run_phase2() {
    log_info "Executing Phase 2: Replace TODOs with Updated Requirements"
    
    if [ -f "scripts/todo-cleanup-phase2.sh" ]; then
        bash scripts/todo-cleanup-phase2.sh
        log_success "Phase 2 complete"
    else
        log_error "Phase 2 script not found"
        return 1
    fi
}

# Run build verification
verify_build() {
    log_info "Verifying build after changes..."
    
    if command -v npm >/dev/null 2>&1; then
        if npm run build >/dev/null 2>&1; then
            log_success "Build verification: PASS"
            return 0
        else
            log_warning "Build verification: ISSUES DETECTED"
            log_info "Run 'npm run build' manually to see detailed errors"
            return 1
        fi
    else
        log_warning "npm not available - skipping build verification"
        return 0
    fi
}

# Execute all phases
run_all() {
    log_info "Executing complete TODO cleanup and refactor process"
    echo
    
    # Pre-analysis
    log_info "Step 1: Initial TODO analysis"
    run_analysis || log_warning "Analysis failed, continuing..."
    echo
    
    # Phase 1
    log_info "Step 2: Phase 1 - Remove Legacy TODOs"
    run_phase1 || {
        log_error "Phase 1 failed"
        return 1
    }
    echo
    
    # Phase 2
    log_info "Step 3: Phase 2 - Replace TODOs"
    run_phase2 || {
        log_error "Phase 2 failed"
        return 1
    }
    echo
    
    # Verification
    log_info "Step 4: Build verification"
    verify_build || {
        log_warning "Build issues detected - manual review required"
    }
    echo
    
    # Post-analysis
    log_info "Step 5: Final TODO analysis"
    run_analysis || log_warning "Final analysis failed"
    echo
    
    log_success "🎯 Complete TODO cleanup process finished!"
    echo
    log_info "Next steps:"
    echo "  1. Review changes and test application functionality"
    echo "  2. Manually execute Phase 3: Enhance TODOs with detailed context"
    echo "  3. Add Phase 4 TODOs for current development priorities"
    echo "  4. See docs/development/todo-cleanup-refactor-plan.md for details"
}

# Main execution logic
case "${1:-help}" in
    "analyze")
        run_analysis
        ;;
    "phase1")
        run_phase1
        ;;
    "phase2") 
        run_phase2
        ;;
    "all")
        run_all
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        log_error "Unknown command: $1"
        echo
        show_usage
        exit 1
        ;;
esac
