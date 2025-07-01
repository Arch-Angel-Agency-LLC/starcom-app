#!/bin/bash

echo "🧪 Testing Valid JWT Authentication"

# Install jq if not available (for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found. Installing via brew..."
    brew install jq
fi

# Create a simple Node.js script to generate a valid JWT
cat > generate_jwt.cjs << 'EOF'
const crypto = require('crypto');

// JWT components
const header = {
    "alg": "HS256",
    "typ": "JWT"
};

const payload = {
    "user_id": "test-user-id",
    "role": "analyst",
    "permissions": ["read_investigation", "create_investigation", "update_investigation"],
    "exp": Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
    "iat": Math.floor(Date.now() / 1000),
    "iss": "ai-security-relaynode"
};

const secret = "your-secret-key-change-in-production";

// Base64URL encode
function base64urlEscape(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlEncode(obj) {
    return base64urlEscape(Buffer.from(JSON.stringify(obj)).toString('base64'));
}

// Create JWT
const encodedHeader = base64urlEncode(header);
const encodedPayload = base64urlEncode(payload);
const signatureInput = encodedHeader + '.' + encodedPayload;

const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64');

const encodedSignature = base64urlEscape(signature);
const jwt = signatureInput + '.' + encodedSignature;

console.log(jwt);
EOF

# Generate JWT token
echo "🔑 Generating valid JWT token..."
JWT_TOKEN=$(node generate_jwt.cjs)
echo "📝 JWT Token: $JWT_TOKEN"

# Test with valid JWT token
echo ""
echo "3. Testing Protected Endpoint with Valid JWT Token (should succeed):"
RESPONSE=$(curl -s -w "HTTP Status: %{http_code}" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    http://127.0.0.1:8081/api/v1/investigations)

echo "$RESPONSE"

# Test creating an investigation with valid JWT
echo ""
echo "4. Testing Create Investigation with Valid JWT Token:"
CREATE_RESPONSE=$(curl -s -w "HTTP Status: %{http_code}" \
    -X POST \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Test Investigation",
        "description": "Testing JWT authentication",
        "priority": "High",
        "created_by": "test-user-id"
    }' \
    http://127.0.0.1:8081/api/v1/investigations)

echo "$CREATE_RESPONSE"

# Cleanup
rm generate_jwt.cjs

echo ""
echo "✅ Valid JWT authentication test completed!"
