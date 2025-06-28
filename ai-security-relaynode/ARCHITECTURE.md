# 🏗️ AI Security RelayNode - Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Security Model](#security-model)
5. [Integration Points](#integration-points)
6. [Scalability Considerations](#scalability-considerations)
7. [Future Enhancements](#future-enhancements)

---

## 🌟 System Overview

The AI Security RelayNode is a **multi-protocol backend service** that serves as the central hub for the Starcom decentralized application ecosystem. It bridges traditional web APIs with decentralized protocols.

### Core Philosophy
- **Protocol Agnostic**: Works with multiple communication protocols
- **Security First**: Every component designed with security in mind
- **Modular Design**: Each service can be developed and deployed independently
- **Developer Friendly**: Clear APIs and comprehensive documentation

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI Security RelayNode                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ API Gateway │  │Security     │  │Investigation│  │   Monitoring│ │
│  │             │  │Layer        │  │Management   │  │   & Logging │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Nostr Relay │  │ IPFS Node   │  │ Database    │  │ Event System│ │
│  │             │  │             │  │ Layer       │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        External Integrations                        │
├─────────────────────────────────────────────────────────────────────┤
│   Starcom dApp   │   Other Nostr   │    IPFS        │   Blockchain  │
│   (Frontend)     │   Clients       │    Network     │   Networks    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Core Components

### 1. API Gateway (`src/api_gateway.rs`)

**Purpose**: Central HTTP/HTTPS entry point for all web requests

**Key Features**:
- RESTful API endpoints
- Request routing and middleware
- CORS handling for web clients
- Rate limiting (planned)
- Request/response transformation

**Port**: `8081`

**Architecture**:
```rust
HTTP Request → Middleware Stack → Route Handler → Response
     ↓              ↓                 ↓             ↑
   CORS        Authentication    Business Logic   JSON/HTTP
  Headers      JWT Validation     Processing     Formatting  
```

**Responsibilities**:
- Route HTTP requests to appropriate handlers
- Apply security middleware (CORS, JWT validation)
- Transform data between HTTP and internal formats
- Handle errors and return appropriate HTTP status codes

### 2. Security Layer (`src/auth.rs`, `src/security_layer.rs`)

**Purpose**: Centralized authentication and authorization

**Key Features**:
- JWT token generation and validation
- User session management
- Permission-based access control
- Security event logging

**Authentication Flow**:
```
1. Client requests token → 2. Server generates JWT → 3. Client includes in requests
   (login/register)         (signed with secret)      (Authorization: Bearer <token>)
         │                         │                            │
         ▼                         ▼                            ▼
   User credentials →     JWT with claims →         Server validates token
   validated by server    (user ID, permissions,    and extracts user info
                          expiration time)
```

**JWT Structure**:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "exp": 1640995200,
    "iat": 1640908800,
    "role": "admin"
  },
  "signature": "encrypted_signature"
}
```

### 3. Nostr Relay (`src/nostr_relay.rs`)

**Purpose**: Decentralized messaging protocol implementation

**Key Features**:
- WebSocket-based real-time communication
- Message relay between clients
- Event filtering and subscriptions
- Cryptographic message verification

**Port**: `8080` (WebSocket)

**Message Flow**:
```
Client A → Nostr Event → RelayNode → Validates → Stores → Broadcasts → Client B
           (signed)                   signature     event     to subs
```

**Event Types Supported**:
- Text notes (kind 1)
- User metadata (kind 0)
- Contact lists (kind 3)
- Direct messages (kind 4)
- Custom investigation events (kind 30000+)

### 4. IPFS Service (`src/ipfs_service.rs`)

**Purpose**: Distributed file storage and retrieval

**Key Features**:
- Content-addressed storage
- File pinning for availability
- Gateway for web access
- Integration with investigation attachments

**Port**: `5001` (API)

**Storage Flow**:
```
File → Hash Generated → Stored on IPFS → Content ID → Retrievable by CID
       (SHA-256)        (distributed)      returned    (from any node)
```

**Use Cases**:
- Investigation documents and evidence
- User avatar images
- Application assets
- Backup and archival data

### 5. Investigation Management (`src/investigation_api.rs`)

**Purpose**: Security investigation tracking and management

**Key Features**:
- Create, read, update investigations
- Evidence attachment handling
- Status tracking and workflow
- Search and filtering capabilities

**Data Model**:
```rust
struct Investigation {
    id: String,
    title: String,
    description: String,
    status: InvestigationStatus,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    assigned_to: Option<String>,
    evidence: Vec<EvidenceItem>,
    tags: Vec<String>,
}
```

---

## 🌊 Data Flow

### Request Processing Pipeline

```
1. HTTP Request → 2. CORS Check → 3. Route Matching → 4. Auth Check → 5. Handler
      │               │              │                │               │
      ▼               ▼              ▼                ▼               ▼
   Raw HTTP      Allow/Deny      Find Handler    Validate JWT    Business Logic
   from client   based on        for endpoint    extract user    process request
                 origin                          info

6. Database/IPFS → 7. Response → 8. Middleware → 9. HTTP Response
      │              │             │              │
      ▼              ▼             ▼              ▼
   Store/retrieve   Format data   Add headers    Send to client
   data as needed   as JSON       (CORS, etc.)
```

### Internal Communication

```
API Gateway ←→ Security Layer ←→ Business Logic
     │              │                  │
     ▼              ▼                  ▼
HTTP Handling  JWT Validation    Data Processing
CORS Setup     Permission Check  Investigation CRUD
Rate Limiting  Session Mgmt      File Operations
```

### External Integration

```
Starcom dApp → HTTP API → RelayNode → Nostr Network
                  │                        │
                  ▼                        ▼
              JWT Auth              Message Relay
              CRUD Ops              Event Storage

RelayNode → IPFS Network → Distributed Storage
     │            │              │
     ▼            ▼              ▼
File Upload   Content Hash    Retrieve by CID
Pin Content   Store on Net    From Any Node
```

---

## 🔒 Security Model

### Authentication Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                        │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Application  │ Business logic authorization       │
│         Security      │ Resource-specific permissions      │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: API         │ JWT token validation               │
│         Security      │ Rate limiting & DOS protection      │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Transport   │ HTTPS/TLS encryption               │
│         Security      │ Certificate validation             │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Network     │ Firewall rules                     │
│         Security      │ Network segmentation               │
└─────────────────────────────────────────────────────────────┘
```

### JWT Security Features

1. **Cryptographic Signing**: Tokens signed with HMAC-SHA256
2. **Time-based Expiry**: Tokens expire after 24 hours
3. **Claim Validation**: Subject, issuer, and audience verification
4. **Secret Rotation**: Support for secret key rotation (manual)

### IPFS Security Considerations

1. **Content Immutability**: Files cannot be modified once stored
2. **Hash Verification**: Content integrity verified by cryptographic hash
3. **Access Control**: IPFS access controlled through RelayNode API
4. **Pinning Strategy**: Critical content pinned for availability

### Nostr Security Features

1. **Message Signing**: All events cryptographically signed by authors
2. **Identity Verification**: Public key cryptography for user identity
3. **Message Integrity**: Tampering detection through signature verification
4. **Relay Filtering**: Malicious content filtering at relay level

---

## 🔗 Integration Points

### Frontend Integration (Starcom dApp)

```javascript
// Authentication
const token = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// API Requests
const investigations = await fetch('/api/v1/investigations', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// WebSocket (Nostr)
const ws = new WebSocket('ws://localhost:8080');
ws.send(JSON.stringify({
  type: 'REQ',
  subscription: 'sub1',
  filters: [{ kinds: [1], limit: 10 }]
}));
```

### Nostr Client Integration

```rust
// Connect to RelayNode
let mut client = Client::new();
client.add_relay("ws://localhost:8080").await?;

// Subscribe to events
let filter = Filter::new()
    .kinds(vec![Kind::TextNote])
    .limit(50);
client.subscribe(vec![filter]).await?;

// Send events
let event = EventBuilder::new_text_note("Hello RelayNode!")
    .to_event(&keys)?;
client.send_event(event).await?;
```

### IPFS Integration

```bash
# Add file to IPFS through RelayNode
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@document.pdf" \
  http://localhost:8081/api/v1/ipfs/add

# Retrieve file by Content ID
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8081/api/v1/ipfs/cat/QmHash...
```

---

## 📈 Scalability Considerations

### Current Limitations

1. **Single Process**: All services run in one process
2. **In-Memory Storage**: Investigations stored in RAM
3. **No Load Balancing**: Single instance handling all requests
4. **Resource Limits**: Limited by single machine resources

### Scaling Strategies

#### Horizontal Scaling
```
Load Balancer → RelayNode 1 → Shared Database
              → RelayNode 2 → Shared IPFS Cluster
              → RelayNode 3 → Shared Message Queue
```

#### Service Decomposition
```
API Gateway Service    ← Handles HTTP requests
Authentication Service ← JWT generation/validation  
Investigation Service  ← Business logic
IPFS Gateway Service   ← File operations
Nostr Relay Service    ← Message relay
Database Service       ← Data persistence
```

#### Caching Strategy
```
Client → CDN → Load Balancer → RelayNode → Redis Cache → Database
                                    │
                                    └── IPFS → Distributed Cache
```

### Performance Optimizations

1. **Database Indexing**: Index frequently queried fields
2. **Connection Pooling**: Reuse database connections
3. **Async Processing**: Non-blocking I/O for all operations
4. **Content Compression**: Gzip/Brotli for API responses
5. **Static Asset CDN**: Serve static files from CDN

---

## 🔮 Future Enhancements

### Short Term (1-3 months)
- [ ] Database persistence (PostgreSQL/SQLite)
- [ ] User management system
- [ ] Rate limiting and DOS protection
- [ ] Comprehensive logging and monitoring
- [ ] Docker containerization

### Medium Term (3-6 months)
- [ ] Multi-user investigations with permissions
- [ ] Real-time notifications via WebSocket
- [ ] Advanced IPFS integration (pinning services)
- [ ] Blockchain integration (Solana/Ethereum)
- [ ] API versioning and backward compatibility

### Long Term (6+ months)
- [ ] Microservices architecture
- [ ] Machine learning for threat detection
- [ ] Advanced analytics and reporting
- [ ] Mobile app support
- [ ] Enterprise features (SSO, audit trails)

### Potential Integrations

```
┌─────────────────────────────────────────────────────────────┐
│                    Future Ecosystem                         │
├─────────────────────────────────────────────────────────────┤
│ Frontend    │ Web App │ Mobile App │ Desktop App │ CLI Tool │
├─────────────────────────────────────────────────────────────┤
│ RelayNode   │ API Gateway │ Auth │ Business Logic │ Storage │
├─────────────────────────────────────────────────────────────┤
│ Protocols   │ Nostr │ IPFS │ Ethereum │ Solana │ Lightning │
├─────────────────────────────────────────────────────────────┤
│ External    │ AI/ML │ Threat Intel │ Compliance │ Monitoring│
│ Services    │ APIs  │ Feeds        │ Systems    │ Tools     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Development Guidelines

### Code Organization Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Dependency Injection**: Services receive dependencies via parameters
3. **Error Handling**: Comprehensive error types and handling
4. **Testing**: Unit tests for all business logic
5. **Documentation**: Code comments and API documentation

### Architecture Patterns

1. **Layered Architecture**: Clear separation between layers
2. **Repository Pattern**: Data access abstraction
3. **Middleware Pattern**: Cross-cutting concerns (auth, logging)
4. **Observer Pattern**: Event-driven communication
5. **Factory Pattern**: Service initialization and configuration

### Best Practices

1. **Async/Await**: Use async Rust for all I/O operations
2. **Error Propagation**: Use `Result<T, E>` for error handling
3. **Type Safety**: Leverage Rust's type system for correctness
4. **Memory Safety**: No unsafe code without justification
5. **Performance**: Profile and optimize critical paths

---

This architecture is designed to be **evolutionary** - starting simple but with the foundation to grow into a robust, scalable system. Each component can be enhanced or replaced independently as requirements evolve.

**Key Takeaway**: The RelayNode bridges the gap between traditional web applications and the decentralized web, providing a familiar API interface while leveraging the benefits of decentralized protocols like Nostr and IPFS.

🚀 **Ready to build the future of decentralized applications!**
