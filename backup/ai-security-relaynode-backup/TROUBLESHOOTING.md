# Troubleshooting Guide

## 🔧 Common Issues and Solutions

This guide helps you quickly diagnose and fix common problems when working with the AI Security RelayNode.

## 🚨 Quick Diagnostics

### Health Check Command
```bash
# Run this first to check overall system health
curl -s http://127.0.0.1:8081/api/v1/health || echo "❌ RelayNode not responding"
```

### Environment Check
```bash
# Check if all tools are available
echo "=== Environment Check ==="
which cargo && echo "✅ Rust/Cargo installed" || echo "❌ Rust missing"
which python3 && echo "✅ Python installed" || echo "❌ Python missing"
which node && echo "✅ Node.js installed" || echo "❌ Node.js missing"
which curl && echo "✅ curl installed" || echo "❌ curl missing"
which jq && echo "✅ jq installed" || echo "❌ jq missing (optional)"
```

## 🔥 Critical Issues

### Issue: RelayNode Won't Start

**Symptoms:**
- `./target/release/ai-security-relaynode` fails
- No response from health endpoint
- "Connection refused" errors

**Diagnosis:**
```bash
# Check if binary exists
ls -la target/release/ai-security-relaynode

# Check for build errors
cargo build --release

# Check port availability
lsof -i :8081
```

**Solutions:**

1. **Build the project:**
```bash
cargo build --release
```

2. **Check for port conflicts:**
```bash
# Kill any process using port 8081
sudo lsof -ti:8081 | xargs kill -9

# Or use a different port (requires code changes)
```

3. **Check permissions:**
```bash
chmod +x target/release/ai-security-relaynode
```

4. **Run with detailed logs:**
```bash
RUST_LOG=debug ./target/release/ai-security-relaynode
```

### Issue: Database Errors

**Symptoms:**
- "Failed to connect to database" errors
- "Migration failed" messages
- Crash during startup

**Solutions:**

1. **Reset database:**
```bash
rm -f data/relaynode.db
./target/release/ai-security-relaynode
```

2. **Check data directory permissions:**
```bash
mkdir -p data
chmod 755 data
```

3. **Manual database setup:**
```bash
# If SQLite issues persist
sudo apt-get install sqlite3  # Linux
brew install sqlite3          # macOS
```

## 🔐 Authentication Issues

### Issue: 401 Unauthorized on Protected Endpoints

**Symptoms:**
- `curl` returns `401 Unauthorized`
- "Token verification failed" in logs
- Authentication works sometimes but not always

**Diagnosis:**
```bash
# Test token generation
source venv/bin/activate
python scripts/generate_test_token.py

# Test token format
TOKEN="your-token-here"
echo $TOKEN | cut -d. -f1 | base64 -d  # Should show header
echo $TOKEN | cut -d. -f2 | base64 -d  # Should show claims
```

**Solutions:**

1. **Generate fresh token:**
```bash
source venv/bin/activate
TOKEN=$(python scripts/generate_test_token.py | grep "eyJ" | head -1)
echo "New token: $TOKEN"
```

2. **Check token expiration:**
```bash
python scripts/test_token_decode.py
```

3. **Verify header format:**
```bash
# Correct format
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations

# Common mistakes
curl -H "Authorization: $TOKEN"           # Missing "Bearer "
curl -H "Authorization: Bearer$TOKEN"     # Missing space
curl -H "Auth: Bearer $TOKEN"             # Wrong header name
```

4. **Check secret key consistency:**
```bash
# Verify Python script uses correct secret
grep "secret.*=" scripts/generate_test_token.py

# Should match the Rust code in src/auth.rs
grep "your-secret-key" src/auth.rs
```

### Issue: Token Expires Too Quickly

**Solution:**
Edit `scripts/generate_test_token.py`:
```python
# Change from 8 hours to 24 hours
exp = now + (24 * 60 * 60)  # 24 hours instead of 8
```

## 🐍 Python Environment Issues

### Issue: "module jwt not found"

**Symptoms:**
- `ImportError: No module named 'jwt'`
- Python script fails to run

**Solutions:**

1. **Activate virtual environment:**
```bash
source venv/bin/activate
pip list | grep PyJWT  # Should show PyJWT
```

2. **Reinstall PyJWT:**
```bash
source venv/bin/activate
pip uninstall PyJWT
pip install PyJWT
```

3. **Create new virtual environment:**
```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install PyJWT
```

### Issue: Virtual Environment Won't Activate

**Solutions:**

1. **Check venv directory:**
```bash
ls -la venv/bin/activate
```

2. **Recreate if missing:**
```bash
python3 -m venv venv
```

3. **Use absolute path:**
```bash
source /full/path/to/ai-security-relaynode/venv/bin/activate
```

4. **Alternative activation methods:**
```bash
# If bash
source venv/bin/activate

# If fish
source venv/bin/activate.fish

# If csh
source venv/bin/activate.csh
```

## 🟢 Node.js Issues

### Issue: "jsonwebtoken module not found"

**Solutions:**

1. **Install dependencies:**
```bash
npm install jsonwebtoken
```

2. **Initialize npm if needed:**
```bash
npm init -y
npm install jsonwebtoken
```

3. **Check package.json:**
```bash
cat package.json
npm list jsonwebtoken
```

### Issue: Node.js Script Permissions

**Solution:**
```bash
chmod +x scripts/generate-test-token.js
```

## 🌐 Network and Connectivity Issues

### Issue: CORS Errors in Browser

**Symptoms:**
- Browser console shows CORS errors
- Frontend can't connect to RelayNode
- "Access-Control-Allow-Origin" errors

**Solutions:**

1. **Check CORS configuration in RelayNode logs**
2. **Verify frontend runs on expected port (3000)**
3. **Update CORS settings if needed**

### Issue: Port Already in Use

**Symptoms:**
- "Address already in use" error
- RelayNode won't start on 8081

**Solutions:**

1. **Find and kill conflicting process:**
```bash
lsof -i :8081
sudo kill -9 <PID>
```

2. **Use different port (requires code changes):**
```bash
# Edit src/api_gateway.rs to change port
grep "8081" src/api_gateway.rs
```

## 📂 File and Directory Issues

### Issue: Permission Denied

**Solutions:**

1. **Fix binary permissions:**
```bash
chmod +x target/release/ai-security-relaynode
```

2. **Fix data directory:**
```bash
chmod 755 data/
```

3. **Fix script permissions:**
```bash
chmod +x scripts/*.sh
```

### Issue: Missing Directories

**Solution:**
```bash
mkdir -p data
mkdir -p logs
mkdir -p scripts
```

## 🔍 Debugging Techniques

### Enable Detailed Logging
```bash
# Rust application logs
RUST_LOG=debug ./target/release/ai-security-relaynode

# Or specific modules
RUST_LOG=ai_security_relaynode::auth=debug ./target/release/ai-security-relaynode
```

### Verbose HTTP Testing
```bash
# See full HTTP conversation
curl -v -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations

# Save headers for analysis
curl -D response-headers.txt -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations
```

### Monitor System Resources
```bash
# Check memory and CPU usage
top -p $(pgrep ai-security-relaynode)

# Check disk space
df -h

# Check network connections
netstat -tulnp | grep 8081
```

## 🧪 Test Scripts for Verification

### Complete System Test
```bash
#!/bin/bash
# system-test.sh

set -e  # Exit on any error

echo "=== System Test ==="

# 1. Test binary exists
test -f target/release/ai-security-relaynode && echo "✅ Binary exists" || echo "❌ Binary missing"

# 2. Test Python environment
source venv/bin/activate
python -c "import jwt; print('✅ PyJWT available')" || echo "❌ PyJWT missing"

# 3. Test Node.js environment
node -e "require('jsonwebtoken'); console.log('✅ jsonwebtoken available')" || echo "❌ jsonwebtoken missing"

# 4. Test RelayNode health
curl -f http://127.0.0.1:8081/api/v1/health && echo "✅ Health check passed" || echo "❌ Health check failed"

# 5. Test authentication
TOKEN=$(python scripts/generate_test_token.py | grep "eyJ" | head -1)
curl -f -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations && echo "✅ Auth test passed" || echo "❌ Auth test failed"

echo "=== Test Complete ==="
```

### Network Connectivity Test
```bash
#!/bin/bash
# network-test.sh

echo "=== Network Test ==="

# Test local connectivity
curl -s http://localhost:8081/api/v1/health > /dev/null && echo "✅ localhost:8081 reachable" || echo "❌ localhost:8081 unreachable"
curl -s http://127.0.0.1:8081/api/v1/health > /dev/null && echo "✅ 127.0.0.1:8081 reachable" || echo "❌ 127.0.0.1:8081 unreachable"

# Test port binding
nc -z localhost 8081 && echo "✅ Port 8081 is open" || echo "❌ Port 8081 is closed"

# Test DNS resolution
nslookup localhost > /dev/null && echo "✅ DNS resolution works" || echo "❌ DNS issues"
```

## 📞 Getting Help

### Information to Collect Before Asking for Help

1. **System information:**
```bash
uname -a
rustc --version
python3 --version
node --version
```

2. **Error messages:**
```bash
# Capture RelayNode logs
./target/release/ai-security-relaynode 2>&1 | tee relaynode.log
```

3. **Configuration:**
```bash
# Show relevant config files
ls -la Cargo.toml package.json
head -20 src/main.rs
```

4. **Test results:**
```bash
# Run system test
./system-test.sh 2>&1 | tee test-results.txt
```

### Common Log Patterns to Look For

- `"Token verification failed"` → Authentication issue
- `"Failed to bind"` → Port conflict
- `"Connection refused"` → Service not running
- `"Permission denied"` → File/directory permissions
- `"No such file"` → Missing dependencies

Remember: **Most issues are environmental or configuration-related.** Double-check your setup steps and environment before diving into complex debugging! 🔍
