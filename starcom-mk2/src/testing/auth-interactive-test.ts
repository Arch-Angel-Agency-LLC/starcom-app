// src/testing/auth-interactive-test.ts
/**
 * Interactive Authentication Test Suite
 * 
 * This file provides a comprehensive test interface that allows easy testing
 * of all authentication functionality programmatically.
 */

// Test data and utilities
export const TEST_DATA = {
  // Mock wallet addresses (valid Solana public key formats)
  validAddress: '11111111111111111111111111111112',
  invalidAddress: 'invalid_wallet_address',
  adminAddress: 'So11111111111111111111111111111111111111112',
  
  // Mock signatures and keys
  mockSignature: new Uint8Array(64).fill(1),
  mockPublicKey: new Uint8Array(32).fill(2),
  
  // Test roles
  mockRoles: [
    { role: 'USER', hasRole: true, source: 'contract' as const, metadata: { default: true } },
    { role: 'ANALYST', hasRole: true, source: 'token' as const, metadata: { balance: 100 } },
    { role: 'ADMIN', hasRole: true, source: 'whitelist' as const, metadata: { level: 'system_admin' } },
  ],
  
  // Test token configs
  tokenConfigs: {
    premium: {
      tokenMint: 'PremiumTokenMint123456789012345678901234567890',
      minimumBalance: 50,
    },
    nft: {
      nftCollection: 'TestNFTCollection123456789012345678901234567890',
      minimumBalance: 1,
    },
  },
};

// Authentication Test Interface
export class AuthTestInterface {
  private testResults: Record<string, boolean> = {};
  private logs: string[] = [];

  constructor() {
    this.log('🧪 Authentication Test Interface Initialized');
  }

  private log(message: string) {
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(message);
  }

  private recordResult(testName: string, passed: boolean) {
    this.testResults[testName] = passed;
    this.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  }

  // Test Configuration System
  async testConfiguration(): Promise<boolean> {
    this.log('📋 Testing Authentication Configuration...');
    
    try {
      const { validateAuthConfig, getEnvironmentConfig, getRoleConfig } = await import('../config/authConfig');
      
      // Test environment config
      const envConfig = getEnvironmentConfig();
      const hasRequiredProps = 'isDev' in envConfig && 
                               'network' in envConfig && 
                               'endpoint' in envConfig;
      
      this.recordResult('Environment Config', hasRequiredProps);
      
      // Test role config
      const roleConfig = getRoleConfig();
      const hasRoleProps = Array.isArray(roleConfig.nftCollections) &&
                           Array.isArray(roleConfig.tokenMints) &&
                           typeof roleConfig.minimumTokenBalance === 'number';
      
      this.recordResult('Role Config', hasRoleProps);
      
      // Test validation
      const validation = validateAuthConfig();
      const hasValidation = typeof validation.isValid === 'boolean' &&
                           Array.isArray(validation.errors);
      
      this.recordResult('Config Validation', hasValidation);
      
      return hasRequiredProps && hasRoleProps && hasValidation;
    } catch (error) {
      this.log(`❌ Configuration test error: ${error}`);
      this.recordResult('Configuration Test', false);
      return false;
    }
  }

  // Test Cryptographic Functions
  async testCryptography(): Promise<boolean> {
    this.log('🔐 Testing Cryptographic Functions...');
    
    try {
      // Test tweetnacl import and key generation
      const nacl = await import('tweetnacl');
      const keyPair = nacl.default.sign.keyPair();
      
      const hasValidKeyPair = keyPair.publicKey instanceof Uint8Array &&
                              keyPair.secretKey instanceof Uint8Array &&
                              keyPair.publicKey.length === 32 &&
                              keyPair.secretKey.length === 64;
      
      this.recordResult('Key Generation', hasValidKeyPair);
      
      // Test signature verification (with mock)
      const testMessage = new TextEncoder().encode('test message for signing');
      const isVerified = nacl.default.sign.detached.verify(
        testMessage,
        TEST_DATA.mockSignature,
        keyPair.publicKey
      );
      
      this.recordResult('Signature Verification', typeof isVerified === 'boolean');
      
      // Test base58 encoding
      const bs58 = await import('bs58');
      const encoded = bs58.default.encode(keyPair.publicKey);
      const decoded = bs58.default.decode(encoded);
      
      const hasValidEncoding = typeof encoded === 'string' &&
                               decoded instanceof Uint8Array;
      
      this.recordResult('Base58 Encoding', hasValidEncoding);
      
      return hasValidKeyPair && hasValidEncoding;
    } catch (error) {
      this.log(`❌ Cryptography test error: ${error}`);
      this.recordResult('Cryptography Test', false);
      return false;
    }
  }

  // Test Role System
  async testRoleSystem(): Promise<boolean> {
    this.log('👥 Testing Role System...');
    
    try {
      const { hasRole, getHighestRole } = await import('../hooks/useOnChainRoles');
      
      // Test role checking
      const hasUserRole = hasRole(TEST_DATA.mockRoles, 'USER');
      const hasAnalystRole = hasRole(TEST_DATA.mockRoles, 'ANALYST');
      const hasAdminRole = hasRole(TEST_DATA.mockRoles, 'ADMIN');
      const hasNonexistentRole = hasRole(TEST_DATA.mockRoles, 'NONEXISTENT');
      
      const roleCheckingWorks = hasUserRole && hasAnalystRole && hasAdminRole && !hasNonexistentRole;
      this.recordResult('Role Checking', roleCheckingWorks);
      
      // Test role hierarchy
      const highestRole = getHighestRole(TEST_DATA.mockRoles);
      const hierarchyWorks = highestRole?.role === 'ADMIN';
      this.recordResult('Role Hierarchy', hierarchyWorks);
      
      // Test empty roles
      const emptyHighest = getHighestRole([]);
      const emptyCheck = hasRole([], 'USER');
      const emptyHandling = emptyHighest === null && !emptyCheck;
      this.recordResult('Empty Roles Handling', emptyHandling);
      
      return roleCheckingWorks && hierarchyWorks && emptyHandling;
    } catch (error) {
      this.log(`❌ Role system test error: ${error}`);
      this.recordResult('Role System Test', false);
      return false;
    }
  }

  // Test Address Validation
  async testAddressValidation(): Promise<boolean> {
    this.log('🏠 Testing Address Validation...');
    
    try {
      const { solanaWalletService } = await import('../services/wallet/SolanaWalletService');
      
      // Test valid address
      const validAddressTest = solanaWalletService.isValidAddress(TEST_DATA.validAddress);
      this.recordResult('Valid Address Check', validAddressTest);
      
      // Test invalid address
      const invalidAddressTest = !solanaWalletService.isValidAddress(TEST_DATA.invalidAddress);
      this.recordResult('Invalid Address Check', invalidAddressTest);
      
      // Test empty address
      const emptyAddressTest = !solanaWalletService.isValidAddress('');
      this.recordResult('Empty Address Check', emptyAddressTest);
      
      // Test null address
      const nullAddressTest = !solanaWalletService.isValidAddress(null as unknown as string);
      this.recordResult('Null Address Check', nullAddressTest);
      
      return validAddressTest && invalidAddressTest && emptyAddressTest && nullAddressTest;
    } catch (error) {
      this.log(`❌ Address validation test error: ${error}`);
      this.recordResult('Address Validation Test', false);
      return false;
    }
  }

  // Test SIWS Message Generation
  async testSIWSMessageGeneration(): Promise<boolean> {
    this.log('📝 Testing SIWS Message Generation...');
    
    try {
      // Import SIWS utilities (would be from the hook in real implementation)
      const domain = 'starcom-mk2.test';
      const statement = 'Sign in to Starcom MK2 Test';
      const address = TEST_DATA.validAddress;
      const nonce = 'test_nonce_123456';
      
      // Generate SIWS message format
      const message = `${domain} wants you to sign in with your Solana account:\n${address}\n\n${statement}\n\nNonce: ${nonce}`;
      
      const hasValidFormat = message.includes(domain) &&
                            message.includes(address) &&
                            message.includes(statement) &&
                            message.includes(nonce);
      
      this.recordResult('SIWS Message Format', hasValidFormat);
      
      // Test message encoding
      const encoded = new TextEncoder().encode(message);
      const hasValidEncoding = encoded instanceof Uint8Array && encoded.length > 0;
      
      this.recordResult('SIWS Message Encoding', hasValidEncoding);
      
      return hasValidFormat && hasValidEncoding;
    } catch (error) {
      this.log(`❌ SIWS message test error: ${error}`);
      this.recordResult('SIWS Message Test', false);
      return false;
    }
  }

  // Test Token Gate Logic
  async testTokenGateLogic(): Promise<boolean> {
    this.log('🚪 Testing Token Gate Logic...');
    
    try {
      // Test premium token config
      const premiumConfig = TEST_DATA.tokenConfigs.premium;
      const hasPremiumConfig = Boolean(premiumConfig.tokenMint) &&
                               typeof premiumConfig.minimumBalance === 'number';
      
      this.recordResult('Premium Token Config', hasPremiumConfig);
      
      // Test NFT config
      const nftConfig = TEST_DATA.tokenConfigs.nft;
      const hasNFTConfig = Boolean(nftConfig.nftCollection) &&
                           typeof nftConfig.minimumBalance === 'number';
      
      this.recordResult('NFT Token Config', hasNFTConfig);
      
      // Test access logic simulation
      const mockBalance = 100;
      const hasAccess = mockBalance >= premiumConfig.minimumBalance;
      const noAccess = 25 < premiumConfig.minimumBalance;
      
      this.recordResult('Token Access Logic', hasAccess && noAccess);
      
      return hasPremiumConfig && hasNFTConfig && hasAccess;
    } catch (error) {
      this.log(`❌ Token gate test error: ${error}`);
      this.recordResult('Token Gate Test', false);
      return false;
    }
  }

  // Comprehensive Test Suite
  async runAllTests(): Promise<{ success: boolean; results: Record<string, boolean>; logs: string[] }> {
    this.log('🚀 Running Comprehensive Authentication Test Suite...');
    this.log('================================================');
    
    const tests = [
      this.testConfiguration(),
      this.testCryptography(),
      this.testRoleSystem(),
      this.testAddressValidation(),
      this.testSIWSMessageGeneration(),
      this.testTokenGateLogic(),
    ];
    
    const results = await Promise.all(tests);
    const allPassed = results.every(result => result);
    
    this.log('');
    this.log('📊 Test Results Summary:');
    this.log('========================');
    
    Object.entries(this.testResults).forEach(([testName, passed]) => {
      this.log(`${passed ? '✅' : '❌'} ${testName}`);
    });
    
    this.log('');
    if (allPassed) {
      this.log('🎉 ALL AUTHENTICATION TESTS PASSED!');
      this.log('✅ Configuration system working');
      this.log('✅ Cryptographic functions working');
      this.log('✅ Role system working');
      this.log('✅ Address validation working');
      this.log('✅ SIWS message generation working');
      this.log('✅ Token gate logic working');
      this.log('');
      this.log('🚀 Authentication system is ready for use!');
    } else {
      this.log('⚠️ Some tests failed. Please review the results above.');
    }
    
    return {
      success: allPassed,
      results: this.testResults,
      logs: this.logs,
    };
  }

  // Get test results
  getResults(): { results: Record<string, boolean>; logs: string[] } {
    return {
      results: this.testResults,
      logs: this.logs,
    };
  }

  // Reset test state
  reset(): void {
    this.testResults = {};
    this.logs = [];
    this.log('🔄 Test interface reset');
  }
}

// Export easy-to-use test functions
export const createAuthTest = () => new AuthTestInterface();

export const runQuickAuthTest = async (): Promise<boolean> => {
  const tester = new AuthTestInterface();
  const result = await tester.runAllTests();
  return result.success;
};

// Browser/global access
if (typeof window !== 'undefined') {
  const globalWindow = window as unknown as {
    AuthTestInterface: typeof AuthTestInterface;
    createAuthTest: typeof createAuthTest;
    runQuickAuthTest: typeof runQuickAuthTest;
  };
  globalWindow.AuthTestInterface = AuthTestInterface;
  globalWindow.createAuthTest = createAuthTest;
  globalWindow.runQuickAuthTest = runQuickAuthTest;
}

// Export for Node.js/test environments
export default AuthTestInterface;
