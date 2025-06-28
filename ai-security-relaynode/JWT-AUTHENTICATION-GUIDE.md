# JWT Token Management Guide

## 🔐 Understanding JWT Authentication

This guide explains how JWT (JSON Web Tokens) work in the AI Security RelayNode and how to manage them effectively.

## 🧠 What is JWT?

JWT is a secure way to transmit information between parties. In our RelayNode:
- **Stateless**: No need to store session information
- **Secure**: Cryptographically signed tokens
- **Self-contained**: All necessary information is in the token

## 🔑 Token Structure

A JWT has three parts separated by dots (`.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdC1hZG1pbiIsInJvbGUiOiJhZG1pbiJ9.signature
|                                        |                                          |
|                                        |                                          └── Signature
|                                        └── Payload (Claims)
└── Header
```

### Header
Contains the signing algorithm and token type:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload (Claims)
Contains the actual data:
```json
{
  "user_id": "test-admin",
  "role": "admin",
  "permissions": ["create_investigation", "read_investigation", ...],
  "exp": 1751091441,
  "iat": 1751062641,
  "iss": "ai-security-relaynode"
}
```

### Signature
Ensures the token hasn't been tampered with.

## 🛠️ Token Generation Scripts

### Python Script (`scripts/generate_test_token.py`)

**Advantages:**
- More readable and maintainable
- Better error handling
- Virtual environment isolation
- Cross-platform compatibility

**Usage:**
```bash
source venv/bin/activate
python scripts/generate_test_token.py
```

**Output:**
```
Generated test token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Usage:
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." http://127.0.0.1:8081/api/v1/investigations

Token expires: 2025-06-27 23:07:17
```

### Node.js Script (`scripts/generate-test-token.js`)

**Advantages:**
- JavaScript ecosystem
- Fast execution
- npm package management

**Usage:**
```bash
node scripts/generate-test-token.js
```

### Pre-generated Token (`scripts/test-token.sh`)

**When to use:**
- Quick testing
- Environment issues with Python/Node.js
- Emergency access

**Note:** Pre-generated tokens expire and need to be updated regularly.

## 🎯 Token Claims Explained

### Standard Claims
- `exp` (Expiration): When the token expires (Unix timestamp)
- `iat` (Issued At): When the token was created (Unix timestamp)
- `iss` (Issuer): Who created the token (`ai-security-relaynode`)

### Custom Claims
- `user_id`: Unique identifier for the user (`test-admin`)
- `role`: User's role in the system (`admin`, `investigator`, `analyst`, `viewer`)
- `permissions`: Array of specific permissions

### Permission Types
```
create_investigation    - Create new investigations
read_investigation     - View investigations
update_investigation   - Modify investigations
delete_investigation   - Remove investigations
create_tasks          - Add tasks to investigations
read_tasks            - View tasks
update_tasks          - Modify tasks
delete_tasks          - Remove tasks
create_evidence       - Add evidence
read_evidence         - View evidence
update_evidence       - Modify evidence
delete_evidence       - Remove evidence
read_activities       - View activity logs
read_status           - Check system status
manage_users          - User management (admin only)
view_audit_logs       - Access audit logs (admin only)
admin                 - Full administrative access
```

## 🔧 Customizing Tokens

### Creating Custom User Roles

Edit the token generation script to create different user types:

```python
# Investigator role (limited permissions)
claims = {
    'user_id': 'investigator-01',
    'role': 'investigator',
    'permissions': [
        'create_investigation',
        'read_investigation',
        'update_investigation',
        'create_tasks',
        'read_tasks',
        'create_evidence',
        'read_evidence',
        'read_activities'
    ],
    'exp': now + (8 * 60 * 60),  # 8 hours
    'iat': now,
    'iss': 'ai-security-relaynode'
}
```

```python
# Viewer role (read-only)
claims = {
    'user_id': 'viewer-01',
    'role': 'viewer',
    'permissions': [
        'read_investigation',
        'read_tasks',
        'read_evidence',
        'read_activities'
    ],
    'exp': now + (4 * 60 * 60),  # 4 hours
    'iat': now,
    'iss': 'ai-security-relaynode'
}
```

### Adjusting Token Expiration

```python
# Short-lived token (1 hour)
exp = now + (1 * 60 * 60)

# Long-lived token (24 hours)
exp = now + (24 * 60 * 60)

# Very short for testing (5 minutes)
exp = now + (5 * 60)
```

## 🔒 Security Best Practices

### Secret Key Management
- **Never commit secrets** to version control
- **Use environment variables** in production
- **Rotate secrets regularly**
- **Use strong, random keys** (256-bit minimum)

### Token Lifecycle
- **Short expiration times** for production
- **Secure transmission** (HTTPS only)
- **Proper storage** on client side
- **Logout/revocation** mechanisms

### Development vs Production

**Development (current setup):**
```rust
let secret_key = "your-secret-key-change-in-production";
```

**Production (recommended):**
```rust
let secret_key = std::env::var("JWT_SECRET")
    .expect("JWT_SECRET environment variable must be set");
```

## 🧪 Testing Different Scenarios

### Test Expired Token
```bash
# Generate a token with 1-second expiration
python scripts/generate_test_token.py  # modify exp time
sleep 2
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations
# Should return 401 Unauthorized
```

### Test Invalid Signature
```bash
# Manually modify the last part of a token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdC1hZG1pbiJ9.invalid-signature"
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations
# Should return 401 Unauthorized
```

### Test Missing Permissions
Create a token with limited permissions and try accessing admin endpoints.

## 🔍 Debugging Token Issues

### Common Error Messages

**"Token verification failed"**
- Check secret key consistency
- Verify token format
- Ensure proper signing

**"Token expired"**
- Generate a fresh token
- Check system time
- Verify expiration time

**"Invalid authorization header format"**
- Ensure `Bearer ` prefix
- Check for extra spaces
- Verify header name

### Debugging Commands

```bash
# Decode token payload (without verification)
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdC1hZG1pbiJ9.signature" | \
  cut -d. -f2 | base64 -d | jq

# Check token expiration
python -c "
import jwt
import time
token = 'your-token-here'
decoded = jwt.decode(token, verify=False)
exp = decoded.get('exp', 0)
now = time.time()
print(f'Token expires at: {time.ctime(exp)}')
print(f'Current time: {time.ctime(now)}')
print(f'Valid: {exp > now}')
"
```

## 📋 Quick Reference

### Generate Token
```bash
source venv/bin/activate && python scripts/generate_test_token.py
```

### Test Protected Endpoint
```bash
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations
```

### Check Token Validity
```bash
python scripts/test_token_decode.py
```

### Environment Setup
```bash
# One-time setup
python3 -m venv venv
source venv/bin/activate
pip install PyJWT

# Daily usage
source venv/bin/activate
```

---

Remember: **Security is only as strong as your weakest link.** Always validate inputs, use HTTPS in production, and keep secrets secure!
