# 🚀 AI Security RelayNode - Developer Cheat Sheet

## ⚡ Quick Commands

### 🔨 Build & Run
```bash
# Build (development)
cargo build

# Build (optimized for production)
cargo build --release

# Run directly (development)
cargo run

# Run compiled binary
./target/release/ai-security-relaynode

# Clean build artifacts
cargo clean
```

### 🧪 Testing
```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_name

# Run tests with debug info
RUST_LOG=debug cargo test
```

### 🔐 Authentication
```bash
# Generate JWT token (Node.js)
node scripts/generate-test-token.js

# Generate JWT token (Python)
python scripts/generate_test_token.py

# Test with pre-generated token
bash scripts/test-token.sh
```

### 🌐 API Testing
```bash
# Health check
curl http://localhost:8081/api/v1/health

# Service status
curl http://localhost:8081/api/v1/services

# Protected endpoint (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8081/api/v1/investigations

# Create investigation
curl -X POST \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","description":"Test investigation"}' \
     http://localhost:8081/api/v1/investigations
```

---

## 📁 File Structure Quick Reference

```
ai-security-relaynode/
├── src/
│   ├── main.rs                 # Entry point
│   ├── api_gateway.rs          # HTTP API routes
│   ├── auth.rs                 # JWT authentication
│   ├── nostr_relay.rs          # Nostr messaging
│   ├── ipfs_service.rs         # IPFS file storage
│   ├── investigation_api.rs    # Investigation endpoints
│   └── security_layer.rs       # Security middleware
├── scripts/
│   ├── generate-test-token.js  # Node.js token generator
│   ├── generate_test_token.py  # Python token generator
│   └── test-token.sh          # Shell test script
├── Cargo.toml                  # Dependencies
└── README-DEVELOPMENT.md       # Development guide
```

---

## 🔧 Configuration

### Default Ports
- **8080**: Nostr WebSocket relay
- **8081**: HTTP API gateway  
- **5001**: IPFS API (internal)

### Environment Variables
```bash
# Set log level
export RUST_LOG=debug

# Set custom ports (if implemented)
export NOSTR_PORT=8080
export API_PORT=8081
export IPFS_PORT=5001
```

### JWT Configuration
```rust
// In src/auth.rs
const JWT_SECRET: &str = "your-secret-key-change-in-production";
const TOKEN_EXPIRY_HOURS: i64 = 24;
```

---

## 🐛 Debug Commands

### Process Management
```bash
# Find processes using RelayNode ports
lsof -i :8080,8081,5001

# Kill processes on specific ports
lsof -ti:8080,8081,5001 | xargs kill -9

# Check if RelayNode is running
ps aux | grep ai-security-relaynode
```

### Log Analysis
```bash
# Run with detailed logging
RUST_LOG=debug ./target/release/ai-security-relaynode

# Run with specific module logging
RUST_LOG=ai_security_relaynode=debug ./target/release/ai-security-relaynode

# Save logs to file
./target/release/ai-security-relaynode 2>&1 | tee relaynode.log
```

### Network Testing
```bash
# Test port connectivity
nc -zv localhost 8080  # Nostr
nc -zv localhost 8081  # API
nc -zv localhost 5001  # IPFS

# Monitor network traffic
sudo tcpdump -i lo -p port 8081
```

---

## 📝 Code Snippets

### Add New API Endpoint
```rust
// In src/api_gateway.rs
.route("/api/v1/my-endpoint", get(my_handler))

// Handler function
async fn my_handler() -> impl IntoResponse {
    Json(json!({
        "message": "Hello from my endpoint!",
        "timestamp": chrono::Utc::now()
    }))
}
```

### Add JWT-Protected Endpoint
```rust
// Protected endpoint
.route("/api/v1/protected", get(protected_handler))

// Handler with JWT verification
async fn protected_handler(
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    // JWT validation happens in middleware
    Ok(Json(json!({"message": "Access granted!"})))
}
```

### Custom JWT Claims
```rust
// In src/auth.rs
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,      // subject (user ID)
    exp: usize,       // expiration
    iat: usize,       // issued at
    role: String,     // custom: user role
    permissions: Vec<String>, // custom: permissions
}
```

---

## 🔍 Troubleshooting Checklist

### Build Issues
- [ ] Rust installed and up to date (`rustup update`)
- [ ] Build tools installed (`xcode-select --install` on macOS)
- [ ] Clean build directory (`cargo clean`)
- [ ] Check `Cargo.toml` for syntax errors

### Runtime Issues
- [ ] Ports 8080, 8081, 5001 available
- [ ] No firewall blocking connections
- [ ] RelayNode process actually running
- [ ] Check logs for error messages

### Authentication Issues
- [ ] Token not expired (24-hour limit)
- [ ] Correct `Bearer ` prefix in Authorization header
- [ ] JWT secret matches between generation and validation
- [ ] Token format is valid JWT (three parts separated by dots)

### API Issues
- [ ] RelayNode running and accessible
- [ ] Correct endpoint URL and HTTP method
- [ ] Proper Content-Type headers for POST requests
- [ ] Valid JSON in request body

---

## 📊 Performance Tips

### Development
```bash
# Fast incremental builds
cargo build

# Check without building
cargo check

# Fast testing
cargo test --lib
```

### Production
```bash
# Optimized build
cargo build --release

# Profile-guided optimization
cargo build --release --profile=release-lto
```

### Monitoring
```bash
# CPU and memory usage
top -p $(pgrep ai-security-relaynode)

# Network connections
netstat -tulpn | grep -E ":(8080|8081|5001)"

# Disk usage
du -sh target/
```

---

## 🎯 Common Tasks

### Update Dependencies
```bash
# Check for updates
cargo outdated

# Update all dependencies
cargo update

# Update specific dependency
cargo update -p serde
```

### Code Quality
```bash
# Format code
cargo fmt

# Lint code
cargo clippy

# Check for vulnerabilities
cargo audit
```

### Documentation
```bash
# Generate documentation
cargo doc

# Open documentation in browser
cargo doc --open

# Document with private items
cargo doc --document-private-items
```

---

## 🚀 Deployment Checklist

### Security
- [ ] Change default JWT secret
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall
- [ ] Set up rate limiting

### Performance  
- [ ] Build with `--release` flag
- [ ] Configure appropriate system resources
- [ ] Set up monitoring and logging
- [ ] Test under load

### Maintenance
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Plan for updates and patches
- [ ] Document deployment process

---

## 📚 Useful Resources

### Rust
- [Rust Book](https://doc.rust-lang.org/book/)
- [Cargo Book](https://doc.rust-lang.org/cargo/)
- [Rust Standard Library](https://doc.rust-lang.org/std/)

### Libraries Used
- [Axum](https://docs.rs/axum/) - Web framework
- [Tokio](https://docs.rs/tokio/) - Async runtime
- [Serde](https://docs.rs/serde/) - Serialization
- [jsonwebtoken](https://docs.rs/jsonwebtoken/) - JWT handling

### Protocols
- [Nostr NIPs](https://github.com/nostr-protocol/nips)
- [IPFS Docs](https://docs.ipfs.io/)
- [JWT.io](https://jwt.io/) - JWT debugger

---

**Happy coding! 🚀**
