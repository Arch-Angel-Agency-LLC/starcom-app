#!/usr/bin/env bash

# Test script for AI Security RelayNode Backend Authentication
echo "🧪 Testing AI Security RelayNode Backend Authentication"

BASE_URL="http://127.0.0.1:8081"

echo ""
echo "1. Testing Health Endpoint (should work without auth):"
curl -s "$BASE_URL/api/v1/health" | jq . || echo "No jq installed, showing raw response:"
curl -s "$BASE_URL/api/v1/health"

echo ""
echo ""
echo "2. Testing Protected Endpoint without Auth (should fail with 401):"
curl -s -w "HTTP Status: %{http_code}\n" "$BASE_URL/api/v1/investigations" | head -1

echo ""
echo "3. Testing Protected Endpoint with Invalid Token (should fail with 401):"
curl -s -w "HTTP Status: %{http_code}\n" -H "Authorization: Bearer invalid-token" "$BASE_URL/api/v1/investigations" | head -1

echo ""
echo "4. Testing CORS Headers:"
curl -s -I -H "Origin: http://localhost:3000" "$BASE_URL/api/v1/health" | grep -i "access-control"

echo ""
echo "✅ Basic authentication tests completed!"
echo "🔒 The backend now requires JWT authentication for protected endpoints."
echo "📊 Frontend will need to provide valid JWT tokens to access investigation data."
