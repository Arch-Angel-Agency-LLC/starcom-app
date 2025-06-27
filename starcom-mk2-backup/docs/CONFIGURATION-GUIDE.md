# Configuration Guide: Clean Subnet-Gateway Architecture

**Purpose:** Complete guide to configuring nodes with clean separation  
**Audience:** DevOps, System Administrators, Developers  
**Version:** 1.0 (Clean Architecture)  

---

## 🎯 **OVERVIEW**

The clean architecture supports **four distinct deployment patterns**:

1. **Subnet-Only Node** - Team membership and internal communication
2. **Gateway-Only Node** - Protocol translation and external access
3. **Combined Node** - Both subnet and gateway functionality
4. **Pure Relay Node** - Neither subnet nor gateway, just message routing

---

## 📝 **CONFIGURATION STRUCTURE**

### Base Configuration (`config.toml`)
```toml
[node]
id = "node-001"
name = "Team Alpha Command Node"
listen_address = "0.0.0.0:8080"
log_level = "info"

# Optional: Enable subnet functionality
[subnet]
enabled = true
team_id = "team-alpha"
discovery_mode = "bootstrap"
bootstrap_nodes = ["192.168.1.100:8080", "192.168.1.101:8080"]

# Optional: Enable gateway functionality  
[gateway]
enabled = true
protocols = ["http", "websocket", "tcp"]
access_control = "strict"

[gateway.policies]
allow_anonymous = false
require_authentication = true
rate_limit_requests_per_minute = 100
```

---

## 🏗️ **DEPLOYMENT PATTERNS**

### Pattern 1: Subnet-Only Node
**Use Case:** Team member node for internal communication

```toml
[node]
id = "alpha-member-001"
name = "Team Alpha Member Node"
listen_address = "0.0.0.0:8080"

[subnet]
enabled = true
team_id = "team-alpha"
role = "member"
discovery_mode = "bootstrap"
bootstrap_nodes = ["alpha-leader.internal:8080"]

# Gateway section omitted - not enabled
```

**Features Available:**
- Team membership management
- Internal team communication
- Resource sharing within team
- Subnet topology maintenance

**Features NOT Available:**
- External protocol translation
- Access control for external clients
- Public API endpoints

### Pattern 2: Gateway-Only Node
**Use Case:** Protocol bridge for external systems

```toml
[node]
id = "external-gateway-001"
name = "External Integration Gateway"
listen_address = "0.0.0.0:8080"

[gateway]
enabled = true
protocols = ["http", "grpc", "websocket"]
access_control = "strict"

[gateway.policies]
allow_anonymous = false
require_authentication = true
external_api_key_required = true

[gateway.protocol_mappings]
"/api/v1/intelligence" = "internal://intelligence-service"
"/api/v1/communication" = "internal://comm-service"

# Subnet section omitted - not enabled
```

**Features Available:**
- Protocol translation (HTTP ↔ internal protocols)
- External access control
- API endpoint management
- Authentication and authorization

**Features NOT Available:**
- Team membership
- Internal subnet communication
- Subnet topology management

### Pattern 3: Combined Node
**Use Case:** All-in-one node for smaller deployments

```toml
[node]
id = "combined-node-001"
name = "Team Alpha Combined Node"
listen_address = "0.0.0.0:8080"

[subnet]
enabled = true
team_id = "team-alpha"
role = "leader"
discovery_mode = "static"
member_nodes = ["alpha-member-001", "alpha-member-002"]

[gateway]
enabled = true
protocols = ["http", "websocket"]
access_control = "moderate"

[gateway.policies]
allow_team_members = true
external_access_requires_auth = true
```

**Features Available:**
- Full subnet functionality
- Full gateway functionality
- Internal and external communication
- Complete node capabilities

**Trade-offs:**
- Higher resource usage
- More complex configuration
- Single point of failure

### Pattern 4: Pure Relay Node
**Use Case:** Message routing without subnet or gateway logic

```toml
[node]
id = "relay-node-001"
name = "Pure Message Relay"
listen_address = "0.0.0.0:8080"

[relay]
enabled = true
routing_table = "dynamic"
discovery_mode = "announce"

# Neither subnet nor gateway enabled
```

**Features Available:**
- Message routing and forwarding
- Network discovery
- Load balancing
- Traffic analysis

**Features NOT Available:**
- Team membership
- Protocol translation
- Access control policies

---

## 🔧 **CONFIGURATION VALIDATION**

### Required Fields
```toml
[node]
id = "unique-node-identifier"        # Required
listen_address = "0.0.0.0:8080"      # Required
```

### Optional Sections
- `[subnet]` - Enable subnet functionality
- `[gateway]` - Enable gateway functionality  
- `[relay]` - Enable pure relay functionality
- `[security]` - Security policies
- `[logging]` - Logging configuration

### Validation Rules
1. **Node ID must be unique** across the network
2. **At least one functionality** must be enabled (subnet, gateway, or relay)
3. **Listen address must be valid** IP:PORT format
4. **Team ID required** if subnet is enabled
5. **Protocol list required** if gateway is enabled

---

## 🛡️ **SECURITY CONFIGURATION**

### Authentication Options
```toml
[security]
authentication_mode = "jwt"          # jwt, oauth2, api_key, mutual_tls
certificate_path = "/etc/certs/node.crt"
private_key_path = "/etc/certs/node.key"
ca_certificate_path = "/etc/certs/ca.crt"

[security.jwt]
secret_key = "your-secret-key"
expiration_hours = 24
issuer = "starcom-network"
```

### Access Control Policies
```toml
[gateway.access_control]
default_policy = "deny"
team_member_policy = "allow"
external_policy = "require_auth"

[[gateway.access_rules]]
path = "/api/public/*"
policy = "allow"
rate_limit = 10

[[gateway.access_rules]]
path = "/api/internal/*"
policy = "team_only"
require_role = "member"
```

---

## 🚀 **DEPLOYMENT EXAMPLES**

### Development Environment
```bash
# Start subnet-only node for development
./ai-security-relaynode --config configs/dev-subnet-only.toml

# Start gateway-only node for API testing
./ai-security-relaynode --config configs/dev-gateway-only.toml
```

### Production Environment
```bash
# Start combined node with full monitoring
./ai-security-relaynode \
  --config configs/prod-combined.toml \
  --log-level info \
  --metrics-port 9090 \
  --health-check-port 8081
```

### Docker Deployment
```yaml
version: '3.8'
services:
  subnet-node:
    image: starcom/ai-security-relaynode:latest
    volumes:
      - ./configs/subnet-only.toml:/etc/starcom/config.toml
    ports:
      - "8080:8080"
    environment:
      - STARCOM_CONFIG_PATH=/etc/starcom/config.toml
      - STARCOM_LOG_LEVEL=info
```

---

## 🔍 **TROUBLESHOOTING**

### Configuration Validation
```bash
# Validate configuration before starting
./ai-security-relaynode --config myconfig.toml --validate-only

# Check configuration with verbose output
./ai-security-relaynode --config myconfig.toml --dry-run --verbose
```

### Common Issues

**Issue:** "Subnet enabled but no team_id specified"
```toml
# Fix: Add team_id to subnet section
[subnet]
enabled = true
team_id = "your-team-id"  # Add this line
```

**Issue:** "Gateway enabled but no protocols specified"
```toml
# Fix: Add protocols to gateway section
[gateway]
enabled = true
protocols = ["http", "websocket"]  # Add this line
```

**Issue:** "No functionality enabled"
```toml
# Fix: Enable at least one of subnet, gateway, or relay
[subnet]
enabled = true
# OR
[gateway]
enabled = true
# OR  
[relay]
enabled = true
```

---

## 📚 **CONFIGURATION TEMPLATES**

### Template: Team Leader Node
```toml
[node]
id = "team-${TEAM_ID}-leader"
name = "Team ${TEAM_NAME} Leader Node"
listen_address = "0.0.0.0:8080"

[subnet]
enabled = true
team_id = "${TEAM_ID}"
role = "leader"
discovery_mode = "static"

[gateway]
enabled = true
protocols = ["http", "websocket"]
access_control = "team_plus_external"
```

### Template: External Integration Gateway
```toml
[node]
id = "external-gateway-${REGION}"
name = "External Gateway - ${REGION}"
listen_address = "0.0.0.0:8080"

[gateway]
enabled = true
protocols = ["http", "grpc", "websocket"]
access_control = "strict"

[gateway.policies]
external_api_key_required = true
rate_limit_requests_per_minute = 1000
```

### Template: Development Node
```toml
[node]
id = "dev-node-${USER}"
name = "Development Node - ${USER}"
listen_address = "127.0.0.1:8080"

[subnet]
enabled = true
team_id = "dev-team"
role = "member"

[gateway]
enabled = true
protocols = ["http"]
access_control = "permissive"

[security]
authentication_mode = "development"
```

---

## ✅ **VALIDATION CHECKLIST**

Before deploying:
- [ ] Node ID is unique across network
- [ ] Listen address is accessible from required networks
- [ ] Team ID is specified if subnet is enabled
- [ ] Protocols are specified if gateway is enabled
- [ ] Security configuration is appropriate for environment
- [ ] Required certificates and keys are present
- [ ] Network connectivity to bootstrap nodes (if applicable)
- [ ] Firewall rules allow required ports
- [ ] Resource limits are appropriate for expected load

---

## 🔗 **RELATED DOCUMENTATION**

- `IMPLEMENTATION-CHECKLIST.md` - Development progress tracker
- `CLEAN-SUBNET-GATEWAY-SEPARATION.md` - Architecture overview
- `DEVELOPMENT-ROADMAP.md` - Technical implementation details
- `MIGRATION-PHASE-1.md` - Migration from legacy architecture
