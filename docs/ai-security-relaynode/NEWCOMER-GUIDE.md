# 🚀 AI Security RelayNode - Complete Newcomer Guide

Welcome to the AI Security RelayNode project! This guide will take you from zero to running and testing the RelayNode in about 10 minutes.

## 📖 What You'll Learn

By the end of this guide, you'll be able to:
- ✅ Build and run the AI Security RelayNode
- ✅ Generate JWT tokens for API authentication
- ✅ Test all API endpoints (both public and protected)
- ✅ Understand the system architecture
- ✅ Troubleshoot common issues

---

## 🎯 What is the AI Security RelayNode?

The RelayNode is the **backend brain** of the Starcom dApp. Think of it as a Swiss Army knife that provides:

| Service | What it does | Why it matters |
|---------|-------------|----------------|
| **Nostr Relay** | Decentralized messaging | Secure, censorship-resistant communication |
| **IPFS Node** | Distributed file storage | Files stored across multiple nodes, not just one server |
| **API Gateway** | Handles all web requests | Single entry point with authentication |
| **Investigation System** | Manages security investigations | Track threats and incidents |
| **Security Layer** | Controls access | Only authenticated users can access sensitive data |

---

## 🛠️ Prerequisites (5 minutes)

Make sure you have these installed:

### Required Tools
```bash
# Check if you have these (run each command):
rust --version     # Should show 1.70+
node --version     # Should show 16+
python3 --version  # Should show 3.7+
git --version      # Any recent version
```

### If you're missing any:
- **Rust**: Visit [rustup.rs](https://rustup.rs/) and follow the one-line install
- **Node.js**: Download from [nodejs.org](https://nodejs.org/)
- **Python**: Usually pre-installed on Mac/Linux, download from [python.org](https://python.org/) if needed

---

## 🚀 Quick Start (5 minutes)

### Step 1: Navigate to the Project
```bash
cd ai-security-relaynode
```

### Step 2: Build the RelayNode
```bash
# This might take 2-3 minutes the first time
cargo build --release
```

**What's happening?** Rust is compiling all the code and dependencies into a single executable.

### Step 3: Start the RelayNode
```bash
# Run the compiled binary
./target/release/ai-security-relaynode
```

**Success looks like this:**
```
[INFO] Starting AI Security RelayNode...
[INFO] Nostr relay started on ws://localhost:8080
[INFO] IPFS node started on http://localhost:5001
[INFO] API gateway started on http://localhost:8081
[INFO] Security layer initialized
[INFO] All services operational ✓
```

**Keep this terminal window open!** The RelayNode is now running.

---

## 🧪 Test the System (3 minutes)

Open a **new terminal window** and let's test the API:

### Test 1: Health Check (No authentication needed)
```bash
curl http://localhost:8081/api/v1/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### Test 2: Services Status (No authentication needed)
```bash
curl http://localhost:8081/api/v1/services
```

**Expected response:**
```json
{
  "nostr": {"status": "active", "port": 8080},
  "ipfs": {"status": "active", "port": 5001},
  "api_gateway": {"status": "active", "port": 8081}
}
```

### Test 3: Protected Endpoint (Authentication required)
```bash
curl http://localhost:8081/api/v1/investigations
```

**Expected response:**
```json
{"error": "Unauthorized"}
```

**This is correct!** Protected endpoints require authentication.

---

## 🔐 Authentication Setup (2 minutes)

The RelayNode uses JWT (JSON Web Tokens) for authentication. Let's generate a token:

### Option A: Quick Token Generation (Recommended)
```bash
# Navigate to scripts directory
cd scripts

# Generate a token using Node.js
node generate-test-token.js
```

**Copy the token** that appears - you'll need it for testing!

### Option B: Use Python
```bash
# Set up Python environment (one-time setup)
python3 -m venv venv
source venv/bin/activate
pip install PyJWT

# Generate token
python generate_test_token.py
```

---

## 🔑 Test Authenticated Endpoints

Now let's test with authentication:

### Replace YOUR_TOKEN_HERE with your actual token:
```bash
# Test investigations endpoint
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:8081/api/v1/investigations

# Test investigations creation
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Investigation","description":"Testing API"}' \
     http://localhost:8081/api/v1/investigations
```

**Success looks like:**
```json
{
  "investigations": []
}
```

---

## 📚 Understanding the Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Starcom dApp  │───▶│  AI Security     │───▶│   External      │
│   (Frontend)    │    │  RelayNode       │    │   Services      │
│                 │    │  (Backend)       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   Storage   │
                       │ (IPFS/DB)   │
                       └─────────────┘
```

### Key Files and What They Do:

| File | Purpose | When to modify |
|------|---------|----------------|
| `src/main.rs` | Entry point, starts all services | Rarely |
| `src/api_gateway.rs` | Handles HTTP requests | Add new endpoints |
| `src/auth.rs` | JWT authentication logic | Change auth rules |
| `src/nostr_relay.rs` | Nostr messaging | Modify messaging |
| `src/ipfs_service.rs` | File storage | Change storage logic |
| `Cargo.toml` | Dependencies and metadata | Add new libraries |

---

## 🐛 Common Issues & Solutions

### ❌ "cargo: command not found"
**Solution:** Install Rust from [rustup.rs](https://rustup.rs/)

### ❌ "Port already in use"
**Solution:** 
```bash
# Kill processes on RelayNode ports
lsof -ti:8080,8081,5001 | xargs kill -9
```

### ❌ "401 Unauthorized" even with token
**Solutions:**
1. Check token hasn't expired (valid for 24 hours)
2. Verify you're using the correct secret key
3. Restart the RelayNode: `Ctrl+C` then `./target/release/ai-security-relaynode`

### ❌ "Module not found" in Python
**Solution:**
```bash
source venv/bin/activate  # Activate virtual environment
pip install PyJWT        # Install missing package
```

---

## 🎓 Next Steps

Now that you have the basics working:

1. **📖 Read the detailed guides:**
   - `JWT-AUTHENTICATION-GUIDE.md` - Deep dive into authentication
   - `API-TESTING-COOKBOOK.md` - More API testing examples
   - `TROUBLESHOOTING.md` - Advanced troubleshooting

2. **🔨 Start developing:**
   - Modify `src/api_gateway.rs` to add new endpoints
   - Update `src/auth.rs` to change authentication logic
   - Add new services in `src/main.rs`

3. **🧪 Run tests:**
   ```bash
   cargo test
   ```

4. **📦 Build for production:**
   ```bash
   cargo build --release
   ```

---

## 🆘 Getting Help

**Stuck?** Here's where to look:

1. **Check the logs** - The RelayNode prints helpful error messages
2. **Read `TROUBLESHOOTING.md`** - Common issues and solutions
3. **Test step-by-step** - Use the testing cookbook
4. **Check the code** - All source code is well-commented

---

## 🎉 Success Checklist

- [ ] RelayNode builds without errors
- [ ] All services start (Nostr, IPFS, API Gateway)
- [ ] Public endpoints respond correctly
- [ ] JWT token generates successfully
- [ ] Protected endpoints work with authentication
- [ ] You understand the basic architecture

**Congratulations!** You're now ready to work with the AI Security RelayNode. Welcome to the team! 🚀

---

## 📋 Quick Reference Commands

```bash
# Build and run
cargo build --release
./target/release/ai-security-relaynode

# Generate token
node scripts/generate-test-token.js

# Test endpoints
curl http://localhost:8081/api/v1/health
curl -H "Authorization: Bearer TOKEN" http://localhost:8081/api/v1/investigations

# Clean build
cargo clean && cargo build --release

# Run tests
cargo test
```
