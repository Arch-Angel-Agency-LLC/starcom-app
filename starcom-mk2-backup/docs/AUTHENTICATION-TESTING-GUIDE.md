# Authentication Testing Guide

## 🧪 Comprehensive Authentication Testing Suite

This guide explains how to test the robust authentication system in Starcom MK2. The testing suite provides multiple interfaces for thorough validation of all authentication functionality.

## 📁 Test Files Overview

### Core Test Files
- **`src/testing/auth-unit.test.ts`** - Unit tests for all authentication components
- **`src/testing/auth-interactive-test.ts`** - Interactive test interface for programmatic testing
- **`src/testing/AuthTestComponent.tsx`** - React component for visual testing
- **`scripts/test-auth.cjs`** - Automated test runner script

## 🚀 Quick Start Testing

### 1. Run All Tests (Automated)
```bash
# Run the comprehensive test suite
node scripts/test-auth.cjs

# Or run unit tests directly
npx vitest run src/testing/auth-unit.test.ts
```

### 2. Interactive Testing (Programmatic)
```typescript
// Import the test interface
import { createAuthTest, runQuickAuthTest } from './src/testing/auth-interactive-test';

// Quick test
const success = await runQuickAuthTest();

// Detailed testing
const tester = createAuthTest();
const results = await tester.runAllTests();
console.log(results);
```

### 3. Browser Console Testing
```javascript
// Available in browser after build
window.runQuickAuthTest();

// Or create detailed test interface
const tester = window.createAuthTest();
tester.runAllTests();
```

## 🧩 Component Integration Testing

Use the `AuthTestComponent` to test authentication in a React environment:

```typescript
import { AuthTestComponent } from './src/testing/AuthTestComponent';

// Add to your app for testing
function App() {
  return (
    <div>
      {/* Your app content */}
      <AuthTestComponent />
    </div>
  );
}
```

## 🔍 Detailed Testing Scenarios

### Configuration Testing
```typescript
import { validateAuthConfig, getEnvironmentConfig } from './src/config/authConfig';

// Test configuration validity
const validation = validateAuthConfig();
console.log('Config valid:', validation.isValid);
console.log('Errors:', validation.errors);

// Test environment settings
const envConfig = getEnvironmentConfig();
console.log('Environment:', envConfig);
```

### Cryptographic Functions Testing
```typescript
import nacl from 'tweetnacl';
import bs58 from 'bs58';

// Test Ed25519 signature verification
const keyPair = nacl.sign.keyPair();
const message = new TextEncoder().encode('test message');
const signature = nacl.sign.detached(message, keyPair.secretKey);
const isValid = nacl.sign.detached.verify(message, signature, keyPair.publicKey);

console.log('Signature valid:', isValid);

// Test base58 encoding
const encoded = bs58.encode(keyPair.publicKey);
const decoded = bs58.decode(encoded);
console.log('Base58 roundtrip successful:', 
  Buffer.compare(keyPair.publicKey, decoded) === 0);
```

### Role System Testing
```typescript
import { hasRole, getHighestRole } from './src/hooks/useOnChainRoles';

const testRoles = [
  { role: 'USER', hasRole: true, source: 'contract', metadata: {} },
  { role: 'ADMIN', hasRole: true, source: 'whitelist', metadata: {} }
];

console.log('Has USER role:', hasRole(testRoles, 'USER'));
console.log('Has ADMIN role:', hasRole(testRoles, 'ADMIN'));
console.log('Highest role:', getHighestRole(testRoles));
```

### Address Validation Testing
```typescript
import { solanaWalletService } from './src/services/wallet/SolanaWalletService';

// Test various address formats
const validAddress = '11111111111111111111111111111112';
const invalidAddress = 'invalid_address';

console.log('Valid address check:', solanaWalletService.isValidAddress(validAddress));
console.log('Invalid address check:', !solanaWalletService.isValidAddress(invalidAddress));
```

## 🎯 Hook Testing in Components

### SIWS (Sign-In with Solana) Testing
```typescript
import { useSIWS } from './src/hooks/useSIWS';

function TestSIWS() {
  const { signIn, signOut, isAuthenticated, session, error } = useSIWS();
  
  return (
    <div>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>Session: {session ? 'Active' : 'None'}</p>
      <button onClick={signIn}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### On-Chain Roles Testing
```typescript
import { useOnChainRoles } from './src/hooks/useOnChainRoles';

function TestRoles({ address }: { address: string }) {
  const { roles, loading, error, refetch } = useOnChainRoles(address);
  
  return (
    <div>
      <p>Loading: {loading ? 'Yes' : 'No'}</p>
      <p>Roles: {roles.length}</p>
      <button onClick={refetch}>Refresh</button>
      {error && <p>Error: {error}</p>}
      {roles.map(role => (
        <div key={role.role}>
          {role.role} ({role.source})
        </div>
      ))}
    </div>
  );
}
```

### Token Gate Testing
```typescript
import { useTokenGate } from './src/hooks/useTokenGate';

function TestTokenGate({ address }: { address: string }) {
  const { hasAccess, loading, error, refresh } = useTokenGate(address, {
    tokenMint: 'YourTokenMint123456789',
    minimumBalance: 10
  });
  
  return (
    <div>
      <p>Has Access: {hasAccess ? 'Yes' : 'No'}</p>
      <p>Loading: {loading ? 'Yes' : 'No'}</p>
      <button onClick={refresh}>Refresh</button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Feature Access Testing
```typescript
import { useFeatureAccess } from './src/hooks/useAuthFeatures';

function TestFeatureAccess() {
  const premiumAccess = useFeatureAccess('PREMIUM');
  const adminAccess = useFeatureAccess('ADMIN');
  
  return (
    <div>
      <p>Premium Access: {premiumAccess.hasAccess ? 'Yes' : 'No'}</p>
      <p>Admin Access: {adminAccess.hasAccess ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## 🎛️ AI Agent Testing Interface

As an AI agent, I can easily test the authentication system using these methods:

### 1. Quick Validation
```bash
node scripts/test-auth.cjs
```

### 2. Detailed Component Testing
```typescript
// Test specific authentication functionality
const tester = new AuthTestInterface();
await tester.testConfiguration();
await tester.testCryptography();
await tester.testRoleSystem();
```

### 3. Build and Integration Testing
```bash
# Ensure TypeScript compilation
npx tsc --noEmit

# Run unit tests
npx vitest run src/testing/auth-unit.test.ts

# Test build process
npm run build
```

## 📊 Test Results Interpretation

### Success Indicators
- ✅ All unit tests pass
- ✅ TypeScript compilation succeeds
- ✅ Build process completes
- ✅ Configuration validation passes
- ✅ Cryptographic functions work
- ✅ Role hierarchy logic correct
- ✅ Address validation working

### Failure Scenarios
- ❌ Configuration errors
- ❌ Cryptographic failures
- ❌ Role logic errors
- ❌ Address validation issues
- ❌ Build failures

## 🛠️ Debugging and Troubleshooting

### Common Issues
1. **TypeScript Errors**: Check imports and type definitions
2. **Test Failures**: Verify mock data and test conditions
3. **Build Issues**: Check dependencies and configuration
4. **Address Validation**: Ensure valid Solana public key format

### Debug Commands
```bash
# Check TypeScript
npx tsc --noEmit --skipLibCheck

# Run specific test
npx vitest run src/testing/auth-unit.test.ts --reporter=verbose

# Check dependencies
npm list tweetnacl @metaplex-foundation/umi-bundle-defaults
```

## 🎯 Production Testing Checklist

Before deploying to production:

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Build succeeds without errors
- [ ] Configuration validated for production
- [ ] Real wallet addresses tested
- [ ] Real NFT collections verified
- [ ] Real token contracts tested
- [ ] Performance tested with multiple users

## 🚀 Continuous Testing

The testing suite is designed for:
- **Development**: Continuous validation during coding
- **Integration**: Testing component interactions
- **Production**: Pre-deployment validation
- **Monitoring**: Ongoing health checks

All tests are designed to be easily run by AI agents for automated validation and continuous integration.
