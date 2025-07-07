/**
 * Hardware Wallet Detection Utility
 * Detects and provides enhanced security flows for hardware wallets
 * Implements TDD Feature 3: Hardware Wallet Detection
 */

export interface WalletInfo {
  adapter: {
    name: string;
    url?: string;
    icon?: string;
  };
  publicKey?: unknown;
  connected?: boolean;
}

export interface HardwareWalletDetection {
  isHardwareWallet: boolean;
  walletType: string;
  requiresAdditionalVerification: boolean;
  enhancedSecurityFeatures: string[];
  supportsSolana: boolean;
}

class HardwareWalletDetector {
  private readonly hardwareWalletPatterns = [
    'ledger',
    'trezor',
    'keystone',
    'gridplus',
    'keepkey',
    'safepal',
    'coolwallet'
  ];

  private readonly enhancedSecurityWallets = [
    'ledger',
    'trezor',
    'keystone',
    'gridplus'
  ];

  private readonly solanaCompatibleWallets = [
    'ledger',
    'phantom', // Popular Solana wallet
    'solflare',
    'sollet',
    'mathwallet',
    'coin98',
    'slope',
    'backpack'
  ];

  /**
   * Detect if wallet is a hardware wallet
   */
  detectHardwareWallet(wallet: WalletInfo): HardwareWalletDetection {
    const walletName = wallet.adapter.name.toLowerCase();
    
    const isHardwareWallet = this.hardwareWalletPatterns.some(pattern => 
      walletName.includes(pattern)
    );

    const walletType = this.identifyWalletType(walletName);
    const requiresAdditionalVerification = this.enhancedSecurityWallets.some(pattern => 
      walletName.includes(pattern)
    );

    const enhancedSecurityFeatures = this.getEnhancedSecurityFeatures(walletType);
    const supportsSolana = this.checkSolanaSupport(walletName);

    return {
      isHardwareWallet,
      walletType,
      requiresAdditionalVerification,
      enhancedSecurityFeatures,
      supportsSolana
    };
  }

  /**
   * Identify specific wallet type
   */
  private identifyWalletType(walletName: string): string {
    for (const pattern of this.hardwareWalletPatterns) {
      if (walletName.includes(pattern)) {
        return pattern.charAt(0).toUpperCase() + pattern.slice(1);
      }
    }

    // Check for popular software wallets
    if (walletName.includes('phantom')) return 'Phantom';
    if (walletName.includes('solflare')) return 'Solflare';
    if (walletName.includes('backpack')) return 'Backpack';
    if (walletName.includes('glow')) return 'Glow';
    
    return 'Unknown';
  }

  /**
   * Get enhanced security features for specific wallet types
   */
  private getEnhancedSecurityFeatures(walletType: string): string[] {
    const features: Record<string, string[]> = {
      'Ledger': [
        'Hardware-based private key storage',
        'Physical confirmation required',
        'Secure element protection',
        'Anti-tampering measures'
      ],
      'Trezor': [
        'Hardware-based private key storage',
        'Physical confirmation required',
        'Open-source firmware',
        'PIN protection'
      ],
      'Keystone': [
        'Air-gapped security',
        'QR code communication',
        'Hierarchical deterministic',
        'Multi-signature support'
      ],
      'Gridplus': [
        'Hardware-based private key storage',
        'Lattice1 secure hardware',
        'Multi-asset support',
        'DeFi transaction signing'
      ]
    };

    return features[walletType] || [];
  }

  /**
   * Check if wallet supports Solana
   */
  private checkSolanaSupport(walletName: string): boolean {
    return this.solanaCompatibleWallets.some(wallet => 
      walletName.includes(wallet)
    );
  }

  /**
   * Get security recommendations for wallet type
   */
  getSecurityRecommendations(detection: HardwareWalletDetection): string[] {
    const recommendations: string[] = [];

    if (detection.isHardwareWallet) {
      recommendations.push('✓ Hardware wallet detected - excellent security');
      recommendations.push('• Verify transaction details on device screen');
      recommendations.push('• Keep firmware updated');
      
      if (detection.walletType === 'Ledger') {
        recommendations.push('• Use Ledger Live for firmware updates');
        recommendations.push('• Enable additional PIN protection');
      }
      
      if (detection.walletType === 'Trezor') {
        recommendations.push('• Use Trezor Suite for management');
        recommendations.push('• Consider passphrase protection');
      }
    } else {
      recommendations.push('⚠ Software wallet detected');
      recommendations.push('• Consider upgrading to hardware wallet');
      recommendations.push('• Ensure device security and antivirus');
      recommendations.push('• Use secure, updated browser');
    }

    if (!detection.supportsSolana) {
      recommendations.push('⚠ Limited Solana support - verify compatibility');
    }

    return recommendations;
  }

  /**
   * Determine if enhanced authentication flow should be used
   */
  shouldUseEnhancedFlow(detection: HardwareWalletDetection): boolean {
    return detection.isHardwareWallet && detection.requiresAdditionalVerification;
  }

  /**
   * Get additional verification steps for hardware wallets
   */
  getAdditionalVerificationSteps(detection: HardwareWalletDetection): string[] {
    if (!this.shouldUseEnhancedFlow(detection)) {
      return [];
    }

    const steps = [
      'Connect and unlock your hardware wallet',
      'Open the Solana app on your device',
      'Verify the connection is secure'
    ];

    if (detection.walletType === 'Ledger') {
      steps.push('Confirm the public key on Ledger screen');
      steps.push('Sign the authentication message on device');
    }

    if (detection.walletType === 'Trezor') {
      steps.push('Confirm the public key on Trezor screen');
      steps.push('Approve the signing request on device');
    }

    return steps;
  }
}

// Create default instance
export const hardwareWalletDetector = new HardwareWalletDetector();

// Export the class for custom instances
export { HardwareWalletDetector };
