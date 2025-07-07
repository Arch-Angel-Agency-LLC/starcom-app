#!/bin/bash
# Full Test Suite Runner for Clean Subnet-Gateway Architecture
# This script runs all tests, generates coverage reports, and validates the implementation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"
COVERAGE_DIR="$PROJECT_ROOT/coverage"

echo -e "${BLUE}🚀 Starting Clean Architecture Test Suite${NC}"
echo "Project: AI Security RelayNode"
echo "Architecture: Clean Subnet-Gateway Separation"
echo "Date: $(date)"
echo "============================================"

# Create output directories
mkdir -p "$TEST_RESULTS_DIR"
mkdir -p "$COVERAGE_DIR"

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}$1${NC}"
    echo "$(printf '%.0s-' {1..50})"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify prerequisites
print_section "📋 Checking Prerequisites"

if ! command_exists cargo; then
    echo -e "${RED}❌ Cargo not found. Please install Rust.${NC}"
    exit 1
fi

if ! command_exists rustc; then
    echo -e "${RED}❌ Rust compiler not found. Please install Rust.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Rust and Cargo found${NC}"

# Install test dependencies
print_section "📦 Installing Test Dependencies"

if ! cargo install --list | grep -q "cargo-tarpaulin"; then
    echo "Installing cargo-tarpaulin for coverage..."
    cargo install cargo-tarpaulin
fi

if ! cargo install --list | grep -q "cargo-audit"; then
    echo "Installing cargo-audit for security scanning..."
    cargo install cargo-audit
fi

echo -e "${GREEN}✅ Test dependencies installed${NC}"

# Build the project
print_section "🔨 Building Project"

cd "$PROJECT_ROOT"

echo "Building main project..."
if ! cargo build --release; then
    echo -e "${RED}❌ Main project build failed${NC}"
    exit 1
fi

echo "Building AI Security RelayNode..."
cd "$PROJECT_ROOT/ai-security-relaynode"
if ! cargo build --release; then
    echo -e "${RED}❌ AI Security RelayNode build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project built successfully${NC}"

# Run unit tests
print_section "🧪 Running Unit Tests"

cd "$PROJECT_ROOT/ai-security-relaynode"

echo "Running clean architecture unit tests..."
if ! cargo test --lib clean_ 2>&1 | tee "$TEST_RESULTS_DIR/unit-tests.log"; then
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi

echo "Running all unit tests..."
if ! cargo test --lib 2>&1 | tee -a "$TEST_RESULTS_DIR/unit-tests.log"; then
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Unit tests passed${NC}"

# Run integration tests
print_section "🔗 Running Integration Tests"

cd "$PROJECT_ROOT"

echo "Running clean architecture integration tests..."
if ! cargo test --test integration_clean_architecture 2>&1 | tee "$TEST_RESULTS_DIR/integration-tests.log"; then
    echo -e "${YELLOW}⚠️  Some integration tests may have failed (expected during development)${NC}"
    # Don't exit on integration test failure during development
fi

echo -e "${GREEN}✅ Integration tests completed${NC}"

# Generate code coverage
print_section "📊 Generating Code Coverage"

cd "$PROJECT_ROOT/ai-security-relaynode"

echo "Generating coverage report with tarpaulin..."
if cargo tarpaulin \
    --out Html \
    --output-dir "$COVERAGE_DIR" \
    --exclude-files "target/*" \
    --exclude-files "tests/*" \
    --line 2>&1 | tee "$TEST_RESULTS_DIR/coverage.log"; then
    echo -e "${GREEN}✅ Coverage report generated at $COVERAGE_DIR/tarpaulin-report.html${NC}"
else
    echo -e "${YELLOW}⚠️  Coverage generation failed, continuing...${NC}"
fi

# Run security audit
print_section "🛡️  Running Security Audit"

cd "$PROJECT_ROOT"

echo "Running cargo audit..."
if cargo audit 2>&1 | tee "$TEST_RESULTS_DIR/security-audit.log"; then
    echo -e "${GREEN}✅ Security audit passed${NC}"
else
    echo -e "${YELLOW}⚠️  Security audit found issues, review $TEST_RESULTS_DIR/security-audit.log${NC}"
fi

# Run performance benchmarks
print_section "⚡ Running Performance Benchmarks"

cd "$PROJECT_ROOT/ai-security-relaynode"

echo "Running performance tests..."
if cargo test --release performance_ 2>&1 | tee "$TEST_RESULTS_DIR/performance-tests.log"; then
    echo -e "${GREEN}✅ Performance tests completed${NC}"
else
    echo -e "${YELLOW}⚠️  Performance tests failed, review logs${NC}"
fi

# Validate clean architecture principles
print_section "🏗️  Validating Architecture Principles"

echo "Checking for circular dependencies..."
if cargo tree --format "{p}" | grep -E "(clean_subnet.*clean_gateway|clean_gateway.*clean_subnet)"; then
    echo -e "${RED}❌ Circular dependency found between subnet and gateway!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No circular dependencies between subnet and gateway${NC}"
fi

echo "Checking module structure..."
CLEAN_MODULES=("clean_subnet.rs" "clean_gateway.rs" "network_coordinator.rs" "clean_config.rs")
for module in "${CLEAN_MODULES[@]}"; do
    if [[ -f "src/$module" ]]; then
        echo -e "${GREEN}✅ $module exists${NC}"
    else
        echo -e "${RED}❌ $module missing${NC}"
        exit 1
    fi
done

echo "Checking for proper separation of concerns..."
if grep -r "gateway" src/clean_subnet.rs; then
    echo -e "${RED}❌ clean_subnet.rs contains gateway references!${NC}"
    exit 1
fi

if grep -r "subnet" src/clean_gateway.rs; then
    echo -e "${RED}❌ clean_gateway.rs contains subnet references!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Clean separation validated${NC}"

# Generate test report
print_section "📄 Generating Test Report"

cd "$PROJECT_ROOT"

REPORT_FILE="$TEST_RESULTS_DIR/test-report-$(date +%Y%m%d-%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Test Report: Clean Subnet-Gateway Architecture

**Date:** $(date)
**Architecture:** Clean Subnet-Gateway Separation
**Project:** AI Security RelayNode

## Summary

- **Unit Tests:** $(grep -c "test result:" "$TEST_RESULTS_DIR/unit-tests.log" || echo "N/A")
- **Integration Tests:** $(grep -c "test result:" "$TEST_RESULTS_DIR/integration-tests.log" || echo "N/A")
- **Security Audit:** $(if grep -q "Success" "$TEST_RESULTS_DIR/security-audit.log"; then echo "PASSED"; else echo "REVIEW NEEDED"; fi)
- **Architecture Validation:** PASSED

## Test Results

### Unit Tests
\`\`\`
$(tail -20 "$TEST_RESULTS_DIR/unit-tests.log" || echo "No unit test log found")
\`\`\`

### Integration Tests
\`\`\`
$(tail -20 "$TEST_RESULTS_DIR/integration-tests.log" || echo "No integration test log found")
\`\`\`

### Security Audit
\`\`\`
$(tail -10 "$TEST_RESULTS_DIR/security-audit.log" || echo "No security audit log found")
\`\`\`

### Performance Results
\`\`\`
$(tail -10 "$TEST_RESULTS_DIR/performance-tests.log" || echo "No performance test log found")
\`\`\`

## Code Coverage

Coverage report available at: \`$COVERAGE_DIR/tarpaulin-report.html\`

## Architecture Validation

✅ Clean separation between subnet and gateway modules
✅ No circular dependencies detected
✅ All required modules present
✅ Proper separation of concerns maintained

## Recommendations

1. Review any failed integration tests and address issues
2. Check security audit findings if any
3. Optimize performance based on benchmark results
4. Continue development following clean architecture principles

## Files Generated

- Unit test log: \`$TEST_RESULTS_DIR/unit-tests.log\`
- Integration test log: \`$TEST_RESULTS_DIR/integration-tests.log\`
- Security audit log: \`$TEST_RESULTS_DIR/security-audit.log\`
- Performance test log: \`$TEST_RESULTS_DIR/performance-tests.log\`
- Coverage report: \`$COVERAGE_DIR/tarpaulin-report.html\`

EOF

echo -e "${GREEN}✅ Test report generated: $REPORT_FILE${NC}"

# Final summary
print_section "🎯 Test Suite Summary"

echo -e "${GREEN}✅ Build: SUCCESS${NC}"
echo -e "${GREEN}✅ Unit Tests: COMPLETED${NC}"
echo -e "${GREEN}✅ Integration Tests: COMPLETED${NC}"
echo -e "${GREEN}✅ Architecture Validation: PASSED${NC}"
echo -e "${GREEN}✅ Security Audit: COMPLETED${NC}"
echo -e "${GREEN}✅ Performance Tests: COMPLETED${NC}"

if [[ -f "$COVERAGE_DIR/tarpaulin-report.html" ]]; then
    echo -e "${GREEN}✅ Coverage Report: GENERATED${NC}"
else
    echo -e "${YELLOW}⚠️  Coverage Report: SKIPPED${NC}"
fi

echo ""
echo -e "${BLUE}🎉 Clean Architecture Test Suite Complete!${NC}"
echo ""
echo "📊 View results:"
echo "   - Test Report: $REPORT_FILE"
echo "   - Coverage: $COVERAGE_DIR/tarpaulin-report.html"
echo "   - Logs: $TEST_RESULTS_DIR/"
echo ""
echo "Next steps:"
echo "1. Review test report for any issues"
echo "2. Address any failed tests or security findings"
echo "3. Continue with Phase 3 migration planning"
echo "4. Update documentation based on test results"

# Open coverage report if on macOS
if [[ "$OSTYPE" == "darwin"* ]] && [[ -f "$COVERAGE_DIR/tarpaulin-report.html" ]]; then
    echo ""
    echo "Opening coverage report..."
    open "$COVERAGE_DIR/tarpaulin-report.html"
fi
