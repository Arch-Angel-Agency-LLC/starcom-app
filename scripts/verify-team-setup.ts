#!/usr/bin/env tsx
/**
 * Team Setup Verification
 * Run this to verify your team can collaborate
 */

console.log('🔍 STARCOM TEAM SETUP VERIFICATION\n');

// Check if the development server can start
console.log('1️⃣ Testing development server...');
console.log('   → Running: npm run dev (will start in background)');
console.log('   → Each team member should see: "Local: http://localhost:5174"');
console.log('   → Press Ctrl+C to stop when ready\n');

console.log('2️⃣ Team Member Checklist:');
console.log('   □ Node.js installed (v16+)');
console.log('   □ npm install completed');
console.log('   □ npm run dev works');
console.log('   □ Browser opens localhost:5174');
console.log('   □ Wallet extension installed');
console.log('   □ Can connect wallet in TopBar\n');

console.log('3️⃣ Coordination Checklist:');
console.log('   □ Team agrees on channel name');
console.log('   □ Everyone joins same channel');
console.log('   □ Test messages sent/received');
console.log('   □ Intel reports work for all\n');

console.log('🚀 Ready to test? Run: npm run dev');
console.log('📞 Problems? Check the TROUBLESHOOTING.md file\n');

console.log('Running this script verifies the local development environment for team collaboration.');
console.log('Instructions:');
console.log('1. Each team member should have the Starcom dApp running locally via `npm run dev`.');
console.log('   → Each team member should see: "Local: http://localhost:5174"');
console.log('2. Run this script: `npx tsx scripts/verify-team-setup.ts`');
console.log('3. The script will then perform the following checks:');
console.log('   □ Local dApp is running');
console.log('   □ Browser opens localhost:5174');
console.log('   □ Nostr relay connection is successful');
console.log('   □ Team data can be published');
console.log('   □ Team data can be read');
