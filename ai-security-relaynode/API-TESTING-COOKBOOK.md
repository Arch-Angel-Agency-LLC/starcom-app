# API Testing Cookbook

## 🍳 Complete API Testing Recipes

This cookbook provides ready-to-use commands for testing all RelayNode API endpoints.

## 🥗 Preparation (Do This First)

### 1. Start the RelayNode
```bash
cd /path/to/starcom-app/ai-security-relaynode
./target/release/ai-security-relaynode &
```

### 2. Get a Fresh Token
```bash
source venv/bin/activate
export TOKEN=$(python scripts/generate_test_token.py | grep "eyJ" | head -1)
echo "Token: $TOKEN"
```

### 3. Verify Setup
```bash
# Test public endpoint
curl -s http://127.0.0.1:8081/api/v1/health | jq

# Test authentication
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8081/api/v1/investigations | jq
```

## 🍎 Public Endpoints (No Authentication)

### Health Check
```bash
curl -s http://127.0.0.1:8081/api/v1/health | jq
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": [
    {"name": "nostr-relay", "healthy": true, "details": "Running on ws://127.0.0.1:8080"},
    {"name": "ipfs-node", "healthy": true, "details": "Storage service active"}
  ],
  "timestamp": "2025-06-27T22:17:12.686701Z"
}
```

### Services Status
```bash
curl -s http://127.0.0.1:8081/api/v1/services | jq
```

## 🥩 Investigation Endpoints (Authentication Required)

### List All Investigations
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations | jq
```

### Create New Investigation
```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Suspicious Network Activity",
    "description": "Investigating unusual traffic patterns from external IP",
    "priority": "High"
  }' \
  http://127.0.0.1:8081/api/v1/investigations | jq
```

### Get Specific Investigation
```bash
# Replace {id} with actual investigation ID
INVESTIGATION_ID="1"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID | jq
```

### Update Investigation
```bash
INVESTIGATION_ID="1"
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated: Suspicious Network Activity",
    "description": "Investigation updated with new findings",
    "priority": "Critical",
    "status": "In Progress"
  }' \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID | jq
```

### Delete Investigation
```bash
INVESTIGATION_ID="1"
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID | jq
```

## 📋 Task Management

### List Tasks for Investigation
```bash
INVESTIGATION_ID="1"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID/tasks | jq
```

### Create Task
```bash
INVESTIGATION_ID="1"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Analyze Network Logs",
    "description": "Review firewall logs for the suspicious IP range",
    "priority": "High",
    "assigned_to": "analyst-01",
    "due_date": "2025-06-28T10:00:00Z"
  }' \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID/tasks | jq
```

## 🔍 Evidence Management

### List Evidence for Investigation
```bash
INVESTIGATION_ID="1"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID/evidence | jq
```

### Add Evidence
```bash
INVESTIGATION_ID="1"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Firewall Log Extract",
    "description": "Extracted logs showing suspicious connections",
    "file_path": "/evidence/firewall-logs-20250627.txt",
    "file_hash": "sha256:abcd1234...",
    "collected_by": "investigator-01",
    "evidence_type": "Digital Log"
  }' \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID/evidence | jq
```

## 📊 Activity Logs

### Get Investigation Activities
```bash
INVESTIGATION_ID="1"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID/activities | jq
```

## 📈 System Status

### Get Investigation Status Overview
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations/status | jq
```

## 🔧 Advanced Service Endpoints

### Nostr Relay Status
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/nostr/status | jq
```

### IPFS Node Status
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/ipfs/status | jq
```

### Store Content in IPFS
```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is test evidence content",
    "filename": "test-evidence.txt"
  }' \
  http://127.0.0.1:8081/api/v1/ipfs/store | jq
```

## 🧪 Test Scenarios

### Complete Investigation Workflow
```bash
# 1. Create investigation
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Investigation Workflow",
    "description": "Testing complete investigation lifecycle",
    "priority": "Medium"
  }' \
  http://127.0.0.1:8081/api/v1/investigations)

# Extract investigation ID
INVESTIGATION_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "Created investigation: $INVESTIGATION_ID"

# 2. Add a task
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Initial Analysis",
    "description": "Perform initial threat assessment",
    "priority": "High"
  }' \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID/tasks | jq

# 3. Add evidence
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Initial Evidence",
    "description": "First piece of evidence collected",
    "evidence_type": "Digital"
  }' \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID/evidence | jq

# 4. Update investigation status
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress"
  }' \
  http://127.0.0.1:8081/api/v1/investigations/$INVESTIGATION_ID | jq

echo "Investigation workflow completed for ID: $INVESTIGATION_ID"
```

### Bulk Operations
```bash
# Create multiple investigations
for i in {1..3}; do
  curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Bulk Investigation $i\",
      \"description\": \"Generated investigation number $i\",
      \"priority\": \"Low\"
    }" \
    http://127.0.0.1:8081/api/v1/investigations | jq '.data.id'
done
```

## 🚨 Error Testing

### Test Invalid Authentication
```bash
# No token
curl -s http://127.0.0.1:8081/api/v1/investigations | jq

# Invalid token
curl -s -H "Authorization: Bearer invalid-token" \
  http://127.0.0.1:8081/api/v1/investigations | jq

# Malformed token
curl -s -H "Authorization: invalid-format" \
  http://127.0.0.1:8081/api/v1/investigations | jq
```

### Test Invalid Data
```bash
# Missing required fields
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://127.0.0.1:8081/api/v1/investigations | jq

# Invalid priority value
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "description": "Test",
    "priority": "InvalidPriority"
  }' \
  http://127.0.0.1:8081/api/v1/investigations | jq
```

## 📊 Monitoring and Performance

### Response Time Testing
```bash
# Time a request
time curl -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations > /dev/null

# Multiple requests for load testing
for i in {1..10}; do
  curl -s -H "Authorization: Bearer $TOKEN" \
    http://127.0.0.1:8081/api/v1/health > /dev/null &
done
wait
echo "Load test completed"
```

### Logging and Debugging
```bash
# Verbose output for debugging
curl -v -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations

# Save response headers
curl -D headers.txt -s -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8081/api/v1/investigations
cat headers.txt
```

## 🔄 Automation Scripts

### Daily Health Check
```bash
#!/bin/bash
# daily-health-check.sh

echo "=== RelayNode Health Check ===" 
date

# Check if service is running
if curl -s http://127.0.0.1:8081/api/v1/health > /dev/null; then
  echo "✅ RelayNode is responding"
  
  # Check authentication
  source venv/bin/activate
  TOKEN=$(python scripts/generate_test_token.py | grep "eyJ" | head -1)
  
  if curl -s -H "Authorization: Bearer $TOKEN" \
     http://127.0.0.1:8081/api/v1/investigations > /dev/null; then
    echo "✅ Authentication is working"
  else
    echo "❌ Authentication failed"
  fi
else
  echo "❌ RelayNode is not responding"
fi
```

### Test All Endpoints
```bash
#!/bin/bash
# test-all-endpoints.sh

source venv/bin/activate
TOKEN=$(python scripts/generate_test_token.py | grep "eyJ" | head -1)

endpoints=(
  "GET /api/v1/health"
  "GET /api/v1/services"
  "GET /api/v1/investigations"
  "GET /api/v1/investigations/status"
)

for endpoint in "${endpoints[@]}"; do
  method=$(echo $endpoint | cut -d' ' -f1)
  path=$(echo $endpoint | cut -d' ' -f2)
  
  echo -n "Testing $endpoint... "
  
  if [ "$method" = "GET" ]; then
    if [[ "$path" == *"investigations"* ]]; then
      response=$(curl -s -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:8081$path")
    else
      response=$(curl -s "http://127.0.0.1:8081$path")
    fi
  fi
  
  if echo "$response" | jq . > /dev/null 2>&1; then
    echo "✅"
  else
    echo "❌"
  fi
done
```

## 📝 Tips for Effective Testing

1. **Always use fresh tokens** for consistent results
2. **Save successful responses** for comparison
3. **Test error scenarios** to ensure proper error handling
4. **Use jq** for pretty-printing JSON responses
5. **Monitor RelayNode logs** while testing
6. **Test with different user roles** and permissions
7. **Verify CORS headers** for frontend integration

---

Happy testing! 🚀
