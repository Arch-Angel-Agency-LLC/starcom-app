# AI Security RelayNode - Development Guide

## 🚀 Quick Start for Beginners

This guide will help you get the AI Security RelayNode running and understand how to test the API endpoints with authentication.

### What is the AI Security RelayNode?

The RelayNode is a Rust-based backend service that provides:
- **Nostr relay** for decentralized messaging
- **IPFS node** for distributed file storage
- **API Gateway** with JWT authentication
- **Investigation management** system
- **Security layer** for access control

## 📋 Prerequisites

Before you start, make sure you have:
- **Rust** (latest stable version)
- **Node.js** (v16+ recommended)
- **Python 3** (v3.7+)
- **Git**

## 🔧 Initial Setup

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd starcom-app/ai-security-relaynode
```

### 2. Build the RelayNode
```bash
# Build in release mode for better performance
cargo build --release
```

### 3. Set Up Python Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install JWT library
pip install PyJWT
```

### 4. Set Up Node.js Environment
```bash
# Initialize npm and install JWT library
npm init -y
npm install jsonwebtoken
```

## 🏃‍♂️ Running the RelayNode

### Start the Service
```bash
# Run in background
./target/release/ai-security-relaynode &

# Or run in foreground to see logs
./target/release/ai-security-relaynode
```

### Verify It's Running
```bash
# Check health endpoint
curl http://127.0.0.1:8081/api/v1/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": [
    {"name": "nostr-relay", "healthy": true, "details": "Running on ws://127.0.0.1:8080"},
    {"name": "ipfs-node", "healthy": true, "details": "Storage service active"}
  ],
  "timestamp": "2025-06-27T22:17:12.686701Z"
}
```

## 🔐 Authentication & JWT Tokens

The RelayNode uses JWT (JSON Web Tokens) for authentication. Some endpoints are public, others require authentication.

### Understanding Authentication

- **Public endpoints**: `/api/v1/health`, `/api/v1/services`
- **Protected endpoints**: `/api/v1/investigations/*`, `/api/v1/nostr/status`, `/api/v1/ipfs/*`

### Generating JWT Tokens

You have three ways to generate test tokens:

#### Option 1: Python Script (Recommended)
```bash
# Activate virtual environment
source venv/bin/activate

# Generate token
python scripts/generate_test_token.py
```

#### Option 2: Node.js Script
```bash
# Generate token
node scripts/generate-test-token.js
```

#### Option 3: Pre-generated Token (Emergency)
```bash
# Use pre-generated token from shell script
./scripts/test-token.sh
```

### Token Details

The generated tokens include:
- **User ID**: `test-admin`
- **Role**: `admin`
- **Permissions**: Full access to all endpoints
- **Expiration**: 8 hours from generation
- **Issuer**: `ai-security-relaynode`

## 📡 Testing API Endpoints

### Public Endpoints (No Authentication)

```bash
# Health check
curl http://127.0.0.1:8081/api/v1/health

# Services status
curl http://127.0.0.1:8081/api/v1/services
```

### Protected Endpoints (Requires Authentication)

First, generate a token:
```bash
source venv/bin/activate
TOKEN=$(python scripts/generate_test_token.py | grep "eyJ" | head -1)
```

Then use it to test protected endpoints:

```bash
# List investigations
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations

# Get investigation status
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations/status

# Create a new investigation
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Investigation",
    "description": "A test investigation for learning",
    "priority": "Medium"
  }' \
  http://127.0.0.1:8081/api/v1/investigations
```

## 🔍 Understanding the Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { /* actual response data */ },
  "error": null,
  "timestamp": "2025-06-27T22:17:12.686701Z"
}
```

For errors:
```json
{
  "success": false,
  "data": null,
  "error": "Error message here",
  "timestamp": "2025-06-27T22:17:12.686701Z"
}
```

## 🛠️ Development Workflow

### 1. Making Changes
```bash
# After modifying Rust code
cargo build --release

# Restart the RelayNode
pkill ai-security-relaynode
./target/release/ai-security-relaynode &
```

### 2. Testing Changes
```bash
# Always test public endpoints first
curl http://127.0.0.1:8081/api/v1/health

# Then test with authentication
source venv/bin/activate
TOKEN=$(python scripts/generate_test_token.py | grep "eyJ" | head -1)
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations
```

### 3. Debugging Authentication Issues

If you get `401 Unauthorized`:

1. **Check token expiration** (tokens expire after 8 hours)
2. **Regenerate token** with the Python script
3. **Verify token format** (should start with `eyJ`)
4. **Check secret key consistency** in the code

## 📁 File Structure Overview

```
ai-security-relaynode/
├── src/                     # Rust source code
│   ├── main.rs             # Application entry point
│   ├── auth.rs             # JWT authentication logic
│   ├── api_gateway.rs      # API routing and handlers
│   ├── investigation_api.rs # Investigation endpoints
│   └── ...
├── scripts/                # Utility scripts
│   ├── generate_test_token.py     # Python JWT generator
│   ├── generate-test-token.js     # Node.js JWT generator
│   └── test-token.sh              # Pre-generated token
├── venv/                   # Python virtual environment
├── data/                   # Database and storage
├── target/                 # Compiled Rust binaries
└── Cargo.toml             # Rust dependencies
```

## 🚨 Common Issues and Solutions

### Issue: `401 Unauthorized` on protected endpoints
**Solution**: Generate a fresh token and ensure proper Authorization header

### Issue: "Connection refused" on port 8081
**Solution**: Make sure the RelayNode is running: `./target/release/ai-security-relaynode`

### Issue: "command not found: python scripts/generate_test_token.py"
**Solution**: Activate the virtual environment first: `source venv/bin/activate`

### Issue: "module jwt not found" in Python
**Solution**: Install PyJWT in the virtual environment: `pip install PyJWT`

### Issue: "jsonwebtoken module not found" in Node.js
**Solution**: Install the module: `npm install jsonwebtoken`

## 🔗 Integration with Starcom dApp

The RelayNode integrates with the Starcom dApp frontend:

1. **Start the RelayNode** on port 8081
2. **Navigate to the dApp directory**: `cd ../dapp`
3. **Start the dApp**: `npm run dev`
4. **Access the dApp**: http://localhost:3000

The dApp is configured to use the RelayNode at `http://localhost:8081`.

## 📚 Next Steps

1. **Explore the API**: Try different endpoints and HTTP methods
2. **Read the Rust code**: Understand how authentication works in `src/auth.rs`
3. **Modify permissions**: Experiment with different user roles and permissions
4. **Add new endpoints**: Follow the pattern in `src/investigation_api.rs`

## 💡 Tips for Beginners

- **Always check logs** when debugging issues
- **Use verbose curl** (`curl -v`) to see full HTTP responses
- **Keep tokens fresh** - regenerate every few hours
- **Test public endpoints first** before trying authenticated ones
- **Read error messages carefully** - they usually tell you what's wrong

---

Need help? Check the logs, verify your setup steps, and don't hesitate to ask questions!
