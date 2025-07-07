#!/usr/bin/env node
/**
 * Generate test JWT token for RelayNode API testing
 */

const jwt = require('jsonwebtoken');

const secret = 'your-secret-key-change-in-production';
const issuer = 'ai-security-relaynode';

// Create test claims for an admin user
const claims = {
  user_id: 'test-admin',
  role: 'admin',
  permissions: [
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
  exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
  iat: Math.floor(Date.now() / 1000),
  iss: issuer
};

try {
  const token = jwt.sign(claims, secret, { algorithm: 'HS256' });
  console.log('Generated test token:');
  console.log(token);
  console.log('\nUsage:');
  console.log(`curl -H "Authorization: Bearer ${token}" http://127.0.0.1:8081/api/v1/investigations`);
} catch (error) {
  console.error('Error generating token:', error);
  process.exit(1);
}
