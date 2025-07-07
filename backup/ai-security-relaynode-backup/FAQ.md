# 🤔 AI Security RelayNode - Frequently Asked Questions

## 📋 Table of Contents
1. [General Questions](#general-questions)
2. [Setup and Installation](#setup-and-installation)
3. [Authentication and Security](#authentication-and-security)
4. [API and Development](#api-and-development)
5. [Troubleshooting](#troubleshooting)
6. [Architecture and Design](#architecture-and-design)

---

## 🌟 General Questions

### Q: What exactly is the AI Security RelayNode?
**A:** The RelayNode is a multi-service backend that acts as the central hub for the Starcom dApp. It combines:
- A Nostr relay for decentralized messaging
- An IPFS node for distributed file storage
- An API gateway for web requests
- A security investigation management system
- JWT-based authentication

Think of it as the "backend brain" that handles all the heavy lifting for the frontend dApp.

### Q: Why is it called a "RelayNode"?
**A:** Because it **relays** data between different services and protocols. It's a **node** in the decentralized network that can:
- Relay Nostr messages between clients
- Relay IPFS content across the network
- Relay API requests to appropriate services

### Q: Is this production-ready?
**A:** This is currently a development/MVP version. Key areas for production hardening:
- Change default JWT secret (`your-secret-key-change-in-production`)
- Add rate limiting and DOS protection
- Implement proper logging and monitoring
- Add database persistence for investigations
- Set up SSL/TLS encryption

---

## 🛠️ Setup and Installation

### Q: What do I need installed to run this?
**A:** You need:
- **Rust** (1.70+) - The main programming language
- **Node.js** (16+) - For JavaScript token generation
- **Python 3** (3.7+) - For Python token generation (optional)
- **Git** - For version control

### Q: How long does the initial build take?
**A:** First build: 5-10 minutes (downloads and compiles all dependencies)
Subsequent builds: 30 seconds - 2 minutes (only recompiles changed code)

### Q: Can I run this on Windows?
**A:** Yes! The commands are slightly different:
```bash
# Windows PowerShell
.\target\release\ai-security-relaynode.exe

# Windows Command Prompt
target\release\ai-security-relaynode.exe
```

### Q: Do I need Docker?
**A:** No, Docker is not required. The RelayNode runs natively on your system.

### Q: What ports does it use?
**A:** 
- **8080**: Nostr WebSocket relay
- **8081**: HTTP API gateway
- **5001**: IPFS API (internal)

Make sure these ports are available.

---

## 🔐 Authentication and Security

### Q: How does authentication work?
**A:** The RelayNode uses JWT (JSON Web Tokens):
1. You generate a token with a secret key
2. Include the token in API requests: `Authorization: Bearer <token>`
3. The server validates the token and grants access

### Q: How long do tokens last?
**A:** 24 hours by default. After that, you need to generate a new token.

### Q: Can I change the token expiration time?
**A:** Yes! Edit `src/auth.rs` and modify this line:
```rust
.exp((Utc::now() + Duration::hours(24)).timestamp() as usize)
//                            ^^
//                            Change this number
```

### Q: What's the default JWT secret?
**A:** `your-secret-key-change-in-production` - **NEVER use this in production!**

### Q: How do I change the JWT secret?
**A:** Edit `src/auth.rs` and update the `JWT_SECRET` constant:
```rust
const JWT_SECRET: &str = "your-super-secure-secret-key-here";
```

### Q: Is the current authentication secure?
**A:** For development: Yes
For production: **No** - you must:
- Change the default secret
- Use environment variables for secrets
- Implement proper user management
- Add rate limiting

---

## 🔌 API and Development

### Q: What API endpoints are available?
**A:** 
**Public endpoints** (no auth required):
- `GET /api/v1/health` - System health check
- `GET /api/v1/services` - Service status

**Protected endpoints** (auth required):
- `GET /api/v1/investigations` - List investigations
- `POST /api/v1/investigations` - Create investigation
- `GET /api/v1/investigations/{id}` - Get specific investigation

### Q: How do I add a new API endpoint?
**A:** Edit `src/api_gateway.rs`:
```rust
// Add to the router configuration
.route("/api/v1/my-endpoint", get(my_handler))

// Add your handler function
async fn my_handler() -> impl IntoResponse {
    Json(json!({"message": "Hello from my endpoint!"}))
}
```

### Q: How do I test the API?
**A:** Use curl, Postman, or any HTTP client:
```bash
# Public endpoint
curl http://localhost:8081/api/v1/health

# Protected endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8081/api/v1/investigations
```

### Q: Can I use the API from a web browser?
**A:** Yes for GET requests to public endpoints. For protected endpoints, you'll need to handle CORS and authentication in your frontend JavaScript.

### Q: How do I enable CORS for web development?
**A:** The RelayNode already has CORS enabled for all origins in development mode.

---

## 🔧 Troubleshooting

### Q: "cargo: command not found" - what do I do?
**A:** Install Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### Q: The build fails with "linking" errors
**A:** You might be missing system dependencies:
```bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt update && sudo apt install build-essential

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
```

### Q: "Port already in use" error
**A:** Kill processes using the ports:
```bash
# Find processes using the ports
lsof -i :8080,8081,5001

# Kill them
lsof -ti:8080,8081,5001 | xargs kill -9
```

### Q: API returns 401 even with a valid token
**A:** Check these things:
1. Token hasn't expired (24-hour limit)
2. You're including the `Bearer ` prefix
3. The JWT secret matches between generation and validation
4. The RelayNode is actually running

### Q: How do I see debug information?
**A:** Set the Rust log level:
```bash
RUST_LOG=debug ./target/release/ai-security-relaynode
```

---

## 🏗️ Architecture and Design

### Q: Why Rust instead of Node.js or Python?
**A:** Rust provides:
- **Memory safety** without garbage collection
- **High performance** comparable to C/C++
- **Excellent concurrency** for handling many connections
- **Strong type system** that catches bugs at compile time
- **Great ecosystem** for web services and crypto

### Q: What's the difference between Nostr and traditional messaging?
**A:** 
- **Traditional**: Messages go through a central server
- **Nostr**: Messages are relayed across multiple nodes, no single point of failure

### Q: Why use IPFS instead of regular file storage?
**A:** IPFS provides:
- **Decentralization**: Files stored across multiple nodes
- **Content addressing**: Files identified by their hash
- **Deduplication**: Identical files stored only once
- **Resilience**: Files remain available even if some nodes go offline

### Q: How does this integrate with the Starcom dApp?
**A:** The dApp (frontend) makes HTTP requests to the RelayNode (backend):
```
Starcom dApp (React/Vue/etc) 
    ↓ HTTP requests
AI Security RelayNode (Rust)
    ↓ Storage/Messaging
IPFS + Nostr Network
```

### Q: Can I run multiple RelayNodes?
**A:** Yes! Each RelayNode is independent. You could run:
- One for development
- One for testing
- One for production
- Multiple for load balancing

### Q: How do I deploy this to production?
**A:** 
1. Build with `cargo build --release`
2. Copy the binary to your server
3. Set up systemd service or similar
4. Configure firewall for ports 8080, 8081
5. Set up reverse proxy (nginx) for SSL
6. Change all default secrets and keys

---

## 🚀 Advanced Topics

### Q: How do I add database persistence?
**A:** Currently, investigations are stored in memory. To add persistence:
1. Add a database dependency (e.g., `sqlx` for PostgreSQL)
2. Update `src/main.rs` to initialize the database
3. Modify handlers in `src/investigation_api.rs` to use the database

### Q: Can I add WebSocket support?
**A:** Yes! Axum (the web framework) supports WebSockets. Add to `src/api_gateway.rs`:
```rust
.route("/ws", get(websocket_handler))
```

### Q: How do I add metrics and monitoring?
**A:** Add the `metrics` crate and create endpoints for:
- Request count
- Response times
- Error rates
- System resources

### Q: Can I integrate with other blockchains?
**A:** Absolutely! Add blockchain client libraries and create new service modules.

---

## 📚 Learning Resources

### Q: I'm new to Rust, where should I start?
**A:** 
- [The Rust Book](https://doc.rust-lang.org/book/) - Official tutorial
- [Rustlings](https://rustlings.cool/) - Interactive exercises
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) - Code examples

### Q: How do I learn more about Nostr?
**A:** 
- [Nostr Protocol](https://nostr.com/) - Official documentation
- [NIPs](https://github.com/nostr-protocol/nips) - Nostr Implementation Possibilities

### Q: Where can I learn about IPFS?
**A:** 
- [IPFS Documentation](https://docs.ipfs.io/) - Comprehensive guides
- [ProtoSchool](https://proto.school/) - Interactive tutorials

---

## 🆘 Still Need Help?

If you can't find your answer here:

1. **Check the logs** - The RelayNode prints detailed error messages
2. **Read the source code** - It's well-commented and organized
3. **Try the troubleshooting guide** - `TROUBLESHOOTING.md`
4. **Create a minimal test case** - Isolate the specific issue
5. **Check GitHub issues** - Someone might have had the same problem

**Remember:** Every expert was once a beginner. Don't hesitate to dig into the code and experiment! 🚀
