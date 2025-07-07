#!/bin/bash

# 🚀 AI Security RelayNode - One-Click Setup Script
# This script will help newcomers get the RelayNode running quickly

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            🚀 AI Security RelayNode Setup                    ║"
echo "║                                                              ║"
echo "║  This script will help you set up and run the RelayNode     ║"
echo "║  in just a few minutes!                                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
print_status "Checking prerequisites..."

# Check Rust
if command_exists rustc; then
    RUST_VERSION=$(rustc --version | awk '{print $2}')
    print_success "Rust found: $RUST_VERSION"
else
    print_error "Rust not found!"
    echo "Please install Rust from https://rustup.rs/"
    echo "Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check Cargo
if command_exists cargo; then
    print_success "Cargo found"
else
    print_error "Cargo not found! Please reinstall Rust."
    exit 1
fi

# Check Node.js (optional but recommended)
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    NODE_AVAILABLE=true
else
    print_warning "Node.js not found. JWT token generation will use Python instead."
    NODE_AVAILABLE=false
fi

# Check Python (optional)
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python found: $PYTHON_VERSION"
    PYTHON_AVAILABLE=true
else
    print_warning "Python not found. Some optional features may not work."
    PYTHON_AVAILABLE=false
fi

# Build the RelayNode
print_status "Building the AI Security RelayNode..."
echo "This may take a few minutes on the first run..."

if cargo build --release; then
    print_success "Build completed successfully!"
else
    print_error "Build failed! Please check the error messages above."
    exit 1
fi

# Set up Python virtual environment if Python is available
if [ "$PYTHON_AVAILABLE" = true ]; then
    print_status "Setting up Python virtual environment..."
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Python virtual environment created"
    else
        print_success "Python virtual environment already exists"
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install PyJWT > /dev/null 2>&1
    print_success "Python dependencies installed"
    deactivate
fi

# Generate test JWT token
print_status "Generating test JWT token..."

if [ "$NODE_AVAILABLE" = true ]; then
    # Use Node.js for token generation
    if [ -f "scripts/generate-test-token.js" ]; then
        TOKEN=$(node scripts/generate-test-token.js 2>/dev/null | tail -1)
        print_success "JWT token generated using Node.js"
    else
        print_warning "Node.js token generator not found"
        TOKEN=""
    fi
elif [ "$PYTHON_AVAILABLE" = true ]; then
    # Use Python for token generation
    if [ -f "scripts/generate_test_token.py" ]; then
        source venv/bin/activate
        TOKEN=$(python scripts/generate_test_token.py 2>/dev/null | tail -1)
        deactivate
        print_success "JWT token generated using Python"
    else
        print_warning "Python token generator not found"
        TOKEN=""
    fi
else
    print_warning "Cannot generate JWT token - neither Node.js nor Python available"
    TOKEN=""
fi

# Create a simple test script
print_status "Creating test script..."

cat > test-relaynode.sh << 'EOF'
#!/bin/bash

# Test script for AI Security RelayNode
echo "🧪 Testing AI Security RelayNode..."

# Test health endpoint
echo "Testing health endpoint..."
if curl -s http://localhost:8081/api/v1/health > /dev/null; then
    echo "✅ Health endpoint responding"
else
    echo "❌ Health endpoint not responding"
    echo "Make sure the RelayNode is running!"
    exit 1
fi

# Test services endpoint
echo "Testing services endpoint..."
if curl -s http://localhost:8081/api/v1/services > /dev/null; then
    echo "✅ Services endpoint responding"
else
    echo "❌ Services endpoint not responding"
fi

echo "🎉 Basic tests passed!"
echo ""
echo "To test authenticated endpoints, run:"
echo "  curl -H \"Authorization: Bearer YOUR_TOKEN_HERE\" http://localhost:8081/api/v1/investigations"
EOF

chmod +x test-relaynode.sh
print_success "Test script created: test-relaynode.sh"

# Print final instructions
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 Setup Complete!                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "🚀 To start the RelayNode:"
echo "   ./target/release/ai-security-relaynode"
echo ""
echo "🧪 To test the RelayNode (in another terminal):"
echo "   ./test-relaynode.sh"
echo ""

if [ -n "$TOKEN" ]; then
    echo "🔑 Your test JWT token:"
    echo "   $TOKEN"
    echo ""
    echo "🔐 To test authenticated endpoints:"
    echo "   curl -H \"Authorization: Bearer $TOKEN\" http://localhost:8081/api/v1/investigations"
    echo ""
fi

echo "📚 For more information:"
echo "   • Complete guide: NEWCOMER-GUIDE.md"
echo "   • API testing: API-TESTING-COOKBOOK.md"
echo "   • Troubleshooting: TROUBLESHOOTING.md"
echo "   • FAQ: FAQ.md"
echo ""
echo "🆘 If you run into issues:"
echo "   1. Check the logs when starting the RelayNode"
echo "   2. Make sure ports 8080, 8081, and 5001 are available"
echo "   3. Read the TROUBLESHOOTING.md guide"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
