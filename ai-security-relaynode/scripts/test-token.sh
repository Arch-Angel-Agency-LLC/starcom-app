#!/bin/bash
# Generate test JWT token for RelayNode API testing
# Using a pre-generated token with the correct claims

# Test token for admin user (expires in 8 hours from generation)
# Generated with secret: 'your-secret-key-change-in-production'
# Claims: {"user_id":"test-admin","role":"admin","permissions":["create_investigation","read_investigation","update_investigation","delete_investigation","create_tasks","read_tasks","update_tasks","delete_tasks","create_evidence","read_evidence","update_evidence","delete_evidence","read_activities","read_status","manage_users","view_audit_logs","admin"],"exp":1719964800,"iat":1719936000,"iss":"ai-security-relaynode"}

# Note: This is a test token - in production, tokens should be generated dynamically
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoidGVzdC1hZG1pbiIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjpbImNyZWF0ZV9pbnZlc3RpZ2F0aW9uIiwicmVhZF9pbnZlc3RpZ2F0aW9uIiwidXBkYXRlX2ludmVzdGlnYXRpb24iLCJkZWxldGVfaW52ZXN0aWdhdGlvbiIsImNyZWF0ZV90YXNrcyIsInJlYWRfdGFza3MiLCJ1cGRhdGVfdGFza3MiLCJkZWxldGVfdGFza3MiLCJjcmVhdGVfZXZpZGVuY2UiLCJyZWFkX2V2aWRlbmNlIiwidXBkYXRlX2V2aWRlbmNlIiwiZGVsZXRlX2V2aWRlbmNlIiwicmVhZF9hY3Rpdml0aWVzIiwicmVhZF9zdGF0dXMiLCJtYW5hZ2VfdXNlcnMiLCJ2aWV3X2F1ZGl0X2xvZ3MiLCJhZG1pbiJdLCJleHAiOjE5Mzc4ODcyMDAsImlhdCI6MTkzNzg1ODQwMCwiaXNzIjoiYWktc2VjdXJpdHktcmVsYXlub2RlIn0.DUfrLvR7OOWPmVJMUztCcGOe4fhx-iQI4vw1E1dkXlk"

echo "Generated test token:"
echo "$TOKEN"
echo ""
echo "Usage examples:"
echo "# Test health endpoint (public)"
echo "curl http://127.0.0.1:8081/api/v1/health"
echo ""
echo "# List investigations (requires auth)"
echo "curl -H \"Authorization: Bearer $TOKEN\" http://127.0.0.1:8081/api/v1/investigations"
echo ""
echo "# Create investigation (requires auth)"
echo "curl -X POST http://127.0.0.1:8081/api/v1/investigations \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -d '{"
echo "    \"title\": \"Cyber Threat Analysis - RelayNode Integration Test\","
echo "    \"description\": \"Testing integration between Starcom dApp and AI Security RelayNode\","
echo "    \"type\": \"cyber_threat\","
echo "    \"priority\": \"high\","
echo "    \"assigned_to\": \"earth_alliance_ops\","
echo "    \"classification\": \"CONFIDENTIAL\""
echo "  }'"
echo ""
echo "Export token for easy use:"
echo "export RELAY_TOKEN=\"$TOKEN\""
