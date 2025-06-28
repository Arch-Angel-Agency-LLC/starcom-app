#!/usr/bin/env python3
"""
Generate test JWT token for RelayNode API testing
"""

import jwt
import time
from datetime import datetime

secret = 'your-secret-key-change-in-production'
issuer = 'ai-security-relaynode'

# Create test claims for an admin user
now = int(time.time())
exp = now + (8 * 60 * 60)  # 8 hours

claims = {
    'user_id': 'test-admin',
    'role': 'admin',
    'permissions': [
        'create_investigation',
        'read_investigation',
        'update_investigation',
        'delete_investigation',
        'create_tasks',
        'read_tasks',
        'update_tasks',
        'delete_tasks',
        'create_evidence',
        'read_evidence',
        'update_evidence',
        'delete_evidence',
        'read_activities',
        'read_status',
        'manage_users',
        'view_audit_logs',
        'admin'
    ],
    'exp': exp,
    'iat': now,
    'iss': issuer
}

try:
    token = jwt.encode(claims, secret, algorithm='HS256')
    print('Generated test token:')
    print(token)
    print('\nUsage:')
    print(f'curl -H "Authorization: Bearer {token}" http://127.0.0.1:8081/api/v1/investigations')
    print('\nToken expires:', datetime.fromtimestamp(exp))
except Exception as error:
    print('Error generating token:', error)
    exit(1)
