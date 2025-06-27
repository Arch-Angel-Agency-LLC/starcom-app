#!/bin/bash

# AI Security RelayNode Development Validation Script
# This script validates the current state and guides next steps

set -e

echo "🔍 AI Security RelayNode Development Validation"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/Users/jono/Documents/GitHub/starcom-app/starcom-mk2/ai-security-relaynode"
cd "$PROJECT_ROOT"

echo "📂 Project Location: $PROJECT_ROOT"
echo ""

# Function to check if file exists
check_file() {
    local file_path=$1
    if [[ -f "$file_path" ]]; then
        echo -e "  ${GREEN}✅${NC} $file_path"
        return 0
    else
        echo -e "  ${RED}❌${NC} $file_path (missing)"
        return 1
    fi
}

# Function to check if directory exists
check_dir() {
    local dir_path=$1
    if [[ -d "$dir_path" ]]; then
        echo -e "  ${GREEN}✅${NC} $dir_path/"
        return 0
    else
        echo -e "  ${RED}❌${NC} $dir_path/ (missing)"
        return 1
    fi
}

# Check project structure
echo "🏗️  PROJECT STRUCTURE VALIDATION"
echo "─────────────────────────────────"

echo "Core Files:"
check_file "Cargo.toml"
check_file "src/main.rs"
check_file "src/lib.rs"

echo ""
echo "Clean Architecture Modules:"
check_file "src/clean_subnet.rs"
check_file "src/clean_gateway.rs"
check_file "src/network_coordinator.rs"
check_file "src/clean_config.rs"

echo ""
echo "Legacy Modules (to be refactored):"
check_file "src/config.rs"
check_file "src/subnet_manager.rs"
check_file "src/services.rs"

echo ""
echo "Core Services:"
check_file "src/nostr_relay.rs"
check_file "src/ipfs_node.rs"
check_file "src/security_layer.rs"
check_file "src/api_gateway.rs"

echo ""
echo "Documentation:"
check_file "docs/DEVELOPMENT-ROADMAP.md"
check_file "docs/TESTING-STRATEGY.md"

echo ""

# Check Rust compilation
echo "🦀 RUST COMPILATION CHECK"
echo "──────────────────────────"

echo "Running cargo check..."
if cargo check --quiet 2>/dev/null; then
    echo -e "${GREEN}✅ Compilation successful${NC}"
    COMPILATION_SUCCESS=true
else
    echo -e "${RED}❌ Compilation failed${NC}"
    echo "Running cargo check with output:"
    cargo check 2>&1 | head -20
    COMPILATION_SUCCESS=false
fi

echo ""

# Check for tests
echo "🧪 TESTING INFRASTRUCTURE"
echo "──────────────────────────"

echo "Test Directories:"
check_dir "tests"
check_dir "tests/unit" || mkdir -p tests/unit
check_dir "tests/integration" || mkdir -p tests/integration
check_dir "tests/e2e" || mkdir -p tests/e2e

echo ""
echo "Test Files:"
check_file "tests/unit/mod.rs" || echo -e "  ${YELLOW}⚠️${NC}  tests/unit/mod.rs (to be created)"
check_file "tests/integration/mod.rs" || echo -e "  ${YELLOW}⚠️${NC}  tests/integration/mod.rs (to be created)"

echo ""

# Analyze module dependencies
echo "🔗 MODULE DEPENDENCY ANALYSIS"
echo "──────────────────────────────"

echo "Checking for clean separation..."

# Check if clean modules exist and have proper separation
if [[ -f "src/clean_subnet.rs" ]] && [[ -f "src/clean_gateway.rs" ]]; then
    echo -e "${GREEN}✅ Clean architecture modules present${NC}"
    
    # Check for cross-dependencies (this is a simple check)
    if grep -q "clean_gateway" src/clean_subnet.rs 2>/dev/null; then
        echo -e "${RED}❌ Subnet has gateway dependency - violates clean architecture${NC}"
    else
        echo -e "${GREEN}✅ Subnet module is gateway-independent${NC}"
    fi
    
    if grep -q "clean_subnet" src/clean_gateway.rs 2>/dev/null; then
        echo -e "${RED}❌ Gateway has subnet dependency - violates clean architecture${NC}"
    else
        echo -e "${GREEN}✅ Gateway module is subnet-independent${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Clean architecture modules need completion${NC}"
fi

echo ""

# Check configuration
echo "⚙️  CONFIGURATION ANALYSIS"
echo "──────────────────────────"

if [[ -f "src/clean_config.rs" ]]; then
    echo -e "${GREEN}✅ Clean configuration module exists${NC}"
    
    # Check if main.rs uses clean config
    if grep -q "clean_config" src/main.rs 2>/dev/null; then
        echo -e "${GREEN}✅ Main.rs uses clean configuration${NC}"
    else
        echo -e "${YELLOW}⚠️  Main.rs needs to be updated to use clean configuration${NC}"
    fi
else
    echo -e "${RED}❌ Clean configuration module missing${NC}"
fi

echo ""

# Development environment check
echo "🛠️  DEVELOPMENT ENVIRONMENT"
echo "────────────────────────────"

echo "Rust toolchain:"
if command -v rustc &> /dev/null; then
    echo -e "  ${GREEN}✅${NC} rustc $(rustc --version | cut -d' ' -f2)"
else
    echo -e "  ${RED}❌${NC} rustc not found"
fi

if command -v cargo &> /dev/null; then
    echo -e "  ${GREEN}✅${NC} cargo $(cargo --version | cut -d' ' -f2)"
else
    echo -e "  ${RED}❌${NC} cargo not found"
fi

echo ""
echo "Dependencies:"
if [[ -f "Cargo.lock" ]]; then
    DEP_COUNT=$(grep -c "name = " Cargo.lock || echo "0")
    echo -e "  ${GREEN}✅${NC} $DEP_COUNT dependencies resolved"
else
    echo -e "  ${YELLOW}⚠️${NC}  No Cargo.lock file - run 'cargo build' first"
fi

echo ""

# Generate development status report
echo "📊 DEVELOPMENT STATUS SUMMARY"
echo "──────────────────────────────"

TOTAL_CHECKS=0
PASSED_CHECKS=0

# Core architecture check
if [[ -f "src/clean_subnet.rs" ]] && [[ -f "src/clean_gateway.rs" ]] && [[ -f "src/network_coordinator.rs" ]]; then
    echo -e "${GREEN}✅ Clean Architecture Foundation${NC} - Core modules present"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Clean Architecture Foundation${NC} - Missing core modules"
fi
((TOTAL_CHECKS++))

# Documentation check
if [[ -f "docs/DEVELOPMENT-ROADMAP.md" ]] && [[ -f "docs/TESTING-STRATEGY.md" ]]; then
    echo -e "${GREEN}✅ Documentation${NC} - Development guides present"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Documentation${NC} - Missing development guides"
fi
((TOTAL_CHECKS++))

# Compilation check
if [[ "$COMPILATION_SUCCESS" == "true" ]]; then
    echo -e "${GREEN}✅ Compilation${NC} - Project builds successfully"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Compilation${NC} - Build errors need resolution"
fi
((TOTAL_CHECKS++))

# Test infrastructure check
if [[ -d "tests" ]]; then
    echo -e "${GREEN}✅ Test Infrastructure${NC} - Test directories present"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Test Infrastructure${NC} - Missing test framework"
fi
((TOTAL_CHECKS++))

echo ""
echo "Overall Progress: $PASSED_CHECKS/$TOTAL_CHECKS checks passed"

if [[ $PASSED_CHECKS -eq $TOTAL_CHECKS ]]; then
    echo -e "${GREEN}🎉 All checks passed! Ready for implementation.${NC}"
    EXIT_CODE=0
elif [[ $PASSED_CHECKS -ge 2 ]]; then
    echo -e "${YELLOW}⚠️  Good progress, some issues to address.${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}❌ Significant issues found. Focus on foundation first.${NC}"
    EXIT_CODE=2
fi

echo ""

# Next steps recommendations
echo "🎯 RECOMMENDED NEXT STEPS"
echo "──────────────────────────"

if [[ "$COMPILATION_SUCCESS" != "true" ]]; then
    echo -e "${BLUE}1.${NC} Fix compilation errors (priority: high)"
    echo "   Run: cargo check --verbose"
    echo ""
fi

if [[ ! -f "src/clean_config.rs" ]] || ! grep -q "clean_config" src/main.rs 2>/dev/null; then
    echo -e "${BLUE}2.${NC} Complete clean configuration module"
    echo "   Update main.rs to use clean architecture"
    echo ""
fi

if [[ ! -d "tests/unit" ]] || [[ ! -f "tests/unit/mod.rs" ]]; then
    echo -e "${BLUE}3.${NC} Set up test infrastructure"
    echo "   Create unit test framework"
    echo ""
fi

echo -e "${BLUE}4.${NC} Implement integration tests"
echo "   Test subnet/gateway interaction through coordinator"
echo ""

echo -e "${BLUE}5.${NC} Create deployment pattern examples"
echo "   Demonstrate different node configurations"
echo ""

echo "📝 Run this script regularly to track progress."
echo ""

exit $EXIT_CODE
