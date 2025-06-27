#!/bin/bash
# Quick validation script for Clean Architecture Implementation
# This script checks the current state and validates the clean separation

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_RELAYNODE_DIR="$PROJECT_ROOT/ai-security-relaynode"

echo -e "${BLUE}🔍 Clean Architecture Validation${NC}"
echo "=================================="

# Check if we're in the right directory
if [[ ! -d "$AI_RELAYNODE_DIR" ]]; then
    echo -e "${RED}❌ AI Security RelayNode directory not found${NC}"
    exit 1
fi

cd "$AI_RELAYNODE_DIR"

echo -e "\n${BLUE}📁 Checking File Structure${NC}"

# Check for clean architecture modules
CLEAN_MODULES=(
    "src/clean_subnet.rs"
    "src/clean_gateway.rs" 
    "src/network_coordinator.rs"
    "src/clean_config.rs"
    "src/lib.rs"
)

for module in "${CLEAN_MODULES[@]}"; do
    if [[ -f "$module" ]]; then
        echo -e "${GREEN}✅ $module${NC}"
    else
        echo -e "${RED}❌ $module${NC}"
    fi
done

# Check for documentation
echo -e "\n${BLUE}📚 Checking Documentation${NC}"

DOCS=(
    "../docs/CLEAN-SUBNET-GATEWAY-SEPARATION.md"
    "../docs/IMPLEMENTATION-CHECKLIST.md"
    "../docs/CONFIGURATION-GUIDE.md"
    "../docs/TESTING-STRATEGY.md"
    "../docs/DEVELOPMENT-ROADMAP.md"
    "../docs/MIGRATION-PHASE-1.md"
    "../docs/BEFORE-AFTER-COMPARISON.md"
)

for doc in "${DOCS[@]}"; do
    if [[ -f "$doc" ]]; then
        echo -e "${GREEN}✅ $(basename "$doc")${NC}"
    else
        echo -e "${RED}❌ $(basename "$doc")${NC}"
    fi
done

# Check for examples
echo -e "\n${BLUE}🎯 Checking Examples${NC}"

if [[ -f "../examples/clean_architecture_demo.rs" ]]; then
    echo -e "${GREEN}✅ clean_architecture_demo.rs${NC}"
else
    echo -e "${RED}❌ clean_architecture_demo.rs${NC}"
fi

# Check for tests
echo -e "\n${BLUE}🧪 Checking Tests${NC}"

if [[ -f "../tests/integration_clean_architecture.rs" ]]; then
    echo -e "${GREEN}✅ integration_clean_architecture.rs${NC}"
else
    echo -e "${RED}❌ integration_clean_architecture.rs${NC}"
fi

# Check for circular dependencies
echo -e "\n${BLUE}🔄 Checking for Circular Dependencies${NC}"

if [[ -f "src/clean_subnet.rs" ]] && [[ -f "src/clean_gateway.rs" ]]; then
    if grep -q "clean_gateway" src/clean_subnet.rs; then
        echo -e "${RED}❌ clean_subnet.rs imports clean_gateway (circular dependency!)${NC}"
    else
        echo -e "${GREEN}✅ clean_subnet.rs does not import clean_gateway${NC}"
    fi
    
    if grep -q "clean_subnet" src/clean_gateway.rs; then
        echo -e "${RED}❌ clean_gateway.rs imports clean_subnet (circular dependency!)${NC}"
    else
        echo -e "${GREEN}✅ clean_gateway.rs does not import clean_subnet${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot check - modules not found${NC}"
fi

# Check build status
echo -e "\n${BLUE}🔨 Checking Build Status${NC}"

if cargo check --quiet 2>/dev/null; then
    echo -e "${GREEN}✅ Project compiles successfully${NC}"
else
    echo -e "${RED}❌ Project has compilation errors${NC}"
    echo "Run 'cargo check' for details"
fi

# Check for lib.rs exports
echo -e "\n${BLUE}📤 Checking lib.rs Exports${NC}"

if [[ -f "src/lib.rs" ]]; then
    if grep -q "pub mod clean_subnet" src/lib.rs; then
        echo -e "${GREEN}✅ clean_subnet exported${NC}"
    else
        echo -e "${RED}❌ clean_subnet not exported${NC}"
    fi
    
    if grep -q "pub mod clean_gateway" src/lib.rs; then
        echo -e "${GREEN}✅ clean_gateway exported${NC}"
    else
        echo -e "${RED}❌ clean_gateway not exported${NC}"
    fi
    
    if grep -q "pub mod network_coordinator" src/lib.rs; then
        echo -e "${GREEN}✅ network_coordinator exported${NC}"
    else
        echo -e "${RED}❌ network_coordinator not exported${NC}"
    fi
    
    if grep -q "pub mod clean_config" src/lib.rs; then
        echo -e "${GREEN}✅ clean_config exported${NC}"
    else
        echo -e "${RED}❌ clean_config not exported${NC}"
    fi
else
    echo -e "${RED}❌ lib.rs not found${NC}"
fi

# Check implementation progress
echo -e "\n${BLUE}📊 Implementation Progress${NC}"

TOTAL_ITEMS=0
COMPLETED_ITEMS=0

# Core modules
for module in "${CLEAN_MODULES[@]}"; do
    TOTAL_ITEMS=$((TOTAL_ITEMS + 1))
    if [[ -f "$module" ]]; then
        COMPLETED_ITEMS=$((COMPLETED_ITEMS + 1))
    fi
done

# Documentation
for doc in "${DOCS[@]}"; do
    TOTAL_ITEMS=$((TOTAL_ITEMS + 1))
    if [[ -f "$doc" ]]; then
        COMPLETED_ITEMS=$((COMPLETED_ITEMS + 1))
    fi
done

# Examples and tests
TOTAL_ITEMS=$((TOTAL_ITEMS + 2))
if [[ -f "../examples/clean_architecture_demo.rs" ]]; then
    COMPLETED_ITEMS=$((COMPLETED_ITEMS + 1))
fi
if [[ -f "../tests/integration_clean_architecture.rs" ]]; then
    COMPLETED_ITEMS=$((COMPLETED_ITEMS + 1))
fi

PROGRESS_PERCENT=$((COMPLETED_ITEMS * 100 / TOTAL_ITEMS))

echo "Progress: $COMPLETED_ITEMS/$TOTAL_ITEMS items completed (${PROGRESS_PERCENT}%)"

if [[ $PROGRESS_PERCENT -ge 90 ]]; then
    echo -e "${GREEN}🎉 Implementation is nearly complete!${NC}"
elif [[ $PROGRESS_PERCENT -ge 70 ]]; then
    echo -e "${YELLOW}🚧 Implementation is mostly complete${NC}"
elif [[ $PROGRESS_PERCENT -ge 50 ]]; then
    echo -e "${YELLOW}🔄 Implementation is in progress${NC}"
else
    echo -e "${RED}🚨 Implementation needs significant work${NC}"
fi

# Summary and next steps
echo -e "\n${BLUE}🎯 Summary${NC}"

if [[ $COMPLETED_ITEMS -eq $TOTAL_ITEMS ]]; then
    echo -e "${GREEN}✅ Phase 1 (Foundation) Complete!${NC}"
    echo "Ready to proceed with Phase 2 (Integration)"
elif [[ $PROGRESS_PERCENT -ge 80 ]]; then
    echo -e "${YELLOW}🔄 Phase 1 Nearly Complete${NC}"
    echo "Finish remaining items before proceeding to Phase 2"
else
    echo -e "${RED}🚨 Phase 1 In Progress${NC}"
    echo "Complete foundation modules before integration"
fi

echo -e "\n${BLUE}📋 Next Steps${NC}"
echo "1. Address any missing items shown above"
echo "2. Run './scripts/run-full-test-suite.sh' to validate"
echo "3. Proceed with Phase 2 integration when ready"
echo "4. Update main.rs to use clean architecture"

# Check for Phase 2 readiness
echo -e "\n${BLUE}🚀 Phase 2 Readiness Check${NC}"

PHASE2_READY=true

# Must have all core modules
for module in "src/clean_subnet.rs" "src/clean_gateway.rs" "src/network_coordinator.rs" "src/clean_config.rs"; do
    if [[ ! -f "$module" ]]; then
        PHASE2_READY=false
        break
    fi
done

# Must compile
if ! cargo check --quiet 2>/dev/null; then
    PHASE2_READY=false
fi

if [[ "$PHASE2_READY" == "true" ]]; then
    echo -e "${GREEN}✅ Ready for Phase 2 Integration!${NC}"
else
    echo -e "${RED}❌ Not ready for Phase 2 - fix issues above${NC}"
fi

echo ""
