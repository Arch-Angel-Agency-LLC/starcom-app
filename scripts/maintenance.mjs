#!/usr/bin/env node
/**
 * Automated maintenance script for Starcom dApp
 * Performs routine cleanup and system health checks
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🔧 Starcom Maintenance Script');
console.log('==============================\n');

// Check system status first
console.log('📊 Running storage check...');
try {
  execSync('npm run storage-check', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Storage check failed:', error.message);
}

console.log('\n🧹 Running comprehensive cleanup...');
try {
  execSync('npm run cleanup:all', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Cleanup failed:', error.message);
}

// Check if target directory was recreated (indicates recent Rust build)
const targetExists = existsSync('./target');
if (targetExists) {
  console.log('\n⚠️  Note: Rust target directory detected after cleanup.');
  console.log('   This is normal if you\'ve built recently.');
  console.log('   Run "npm run cleanup:rust" if storage becomes an issue.');
}

console.log('\n✅ Maintenance complete!');
console.log('💡 Recommendation: Run this monthly or when experiencing performance issues.');
console.log('📖 See docs/STORAGE-MANAGEMENT.md for detailed information.');
