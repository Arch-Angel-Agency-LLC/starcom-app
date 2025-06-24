import React from 'react';
import AuthGate from '../Auth/AuthGate';
import WalletStatusMini from '../Auth/WalletStatusMini';
import { useAuth } from '../../hooks/useAuth';
import { useAuthFeatures } from '../../hooks/useAuthFeatures';
import { FEATURE_REQUIREMENTS } from '../../hooks/useAuthFeatures';
import styles from './AuthDemoPage.module.css';

/**
 * Demo page showcasing the enhanced authentication system
 * AI-NOTE: This page demonstrates the new AuthGate component, SIWS auth, and feature gating
 */
const AuthDemoPage: React.FC = () => {
  const auth = useAuth();
  const authFeatures = useAuthFeatures();
  const { isAuthenticated, address, connectionStatus, session } = auth;

  return (
    <div className={styles.demoPage}>
      <div className={styles.header}>
        <h1>🔐 Enhanced Authentication System Demo</h1>
        <div className={styles.currentStatus}>
          <span>Status: </span>
          <WalletStatusMini />
        </div>
      </div>

      <div className={styles.statusInfo}>
        <div className={styles.statusCard}>
          <h3>Current Authentication State</h3>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.label}>Wallet Connected:</span>
              <span className={`${styles.value} ${authFeatures.isWalletConnected ? styles.success : styles.error}`}>
                {authFeatures.isWalletConnected ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Authenticated (SIWS):</span>
              <span className={`${styles.value} ${isAuthenticated ? styles.success : styles.error}`}>
                {isAuthenticated ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Address:</span>
              <span className={styles.value}>
                {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Not connected'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Connection:</span>
              <span className={`${styles.value} ${styles[connectionStatus]}`}>
                {connectionStatus.toUpperCase()}
              </span>
            </div>
            {session && (
              <>
                <div className={styles.statusItem}>
                  <span className={styles.label}>Session Expires:</span>
                  <span className={styles.value}>
                    {new Date(session.expiresAt).toLocaleString()}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.label}>Session Valid:</span>
                  <span className={`${styles.value} ${session.verified ? styles.success : styles.error}`}>
                    {session.verified ? '✅ Valid' : '❌ Invalid'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Role and Token Information */}
        {authFeatures.isAuthenticated && (
          <div className={styles.statusCard}>
            <h3>On-Chain Roles & Access</h3>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.label}>Roles:</span>
                <span className={styles.value}>
                  {authFeatures.roles.length > 0 
                    ? authFeatures.roles.map(r => r.role).join(', ')
                    : 'No roles detected'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.label}>Admin Access:</span>
                <span className={`${styles.value} ${authFeatures.hasRole('ADMIN') ? styles.success : styles.error}`}>
                  {authFeatures.hasRole('ADMIN') ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.label}>Loading:</span>
                <span className={styles.value}>
                  {authFeatures.isLoading ? '⟳ Checking...' : '✅ Complete'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.demoSection}>
        <h2>AuthGate Component Variants</h2>
        
        <div className={styles.variantDemo}>
          <h3>Button Variant (Small)</h3>
          <p>Inline button for quick actions</p>
          <AuthGate 
            requirement="wallet"
            action="view this demo"
            variant="button"
            size="small"
          >
            <button className={styles.protectedAction}>
              🎯 Protected Action (Button Small)
            </button>
          </AuthGate>
        </div>

        <div className={styles.variantDemo}>
          <h3>Button Variant (Medium)</h3>
          <p>Standard inline button</p>
          <AuthGate 
            requirement="wallet"
            action="access this feature"
            variant="button"
            size="medium"
          >
            <button className={styles.protectedAction}>
              🚀 Protected Action (Button Medium)
            </button>
          </AuthGate>
        </div>

        <div className={styles.variantDemo}>
          <h3>Card Variant</h3>
          <p>Prominent contextual prompt</p>
          <AuthGate 
            requirement="wallet"
            action="access premium features"
            variant="card"
            size="medium"
          >
            <div className={styles.premiumFeature}>
              <h4>🌟 Premium Feature</h4>
              <p>This premium feature requires wallet authentication</p>
              <button className={styles.premiumButton}>Access Premium</button>
            </div>
          </AuthGate>
        </div>

        <div className={styles.variantDemo}>
          <h3>Banner Variant</h3>
          <p>Full-width notification style</p>
          <AuthGate 
            requirement="wallet"
            action="perform blockchain operations"
            variant="banner"
            size="medium"
          >
            <div className={styles.blockchainSection}>
              <h4>⛓️ Blockchain Operations</h4>
              <p>Perform secure transactions on the blockchain</p>
              <div className={styles.actionButtons}>
                <button className={styles.blockchainAction}>Transfer Assets</button>
                <button className={styles.blockchainAction}>Create Contract</button>
                <button className={styles.blockchainAction}>Mint NFT</button>
              </div>
            </div>
          </AuthGate>
        </div>

        <div className={styles.variantDemo}>
          <h3>Session + Wallet Requirement</h3>
          <p>Requires both wallet connection and session</p>
          <AuthGate 
            requirement="both"
            action="access classified intelligence"
            variant="card"
            size="large"
          >
            <div className={styles.classifiedSection}>
              <h4>🕵️ Classified Intelligence Access</h4>
              <p>This section requires both wallet connection and authenticated session</p>
              <button className={styles.classifiedButton}>View Intelligence</button>
            </div>
          </AuthGate>
        </div>

        {/* Enhanced Feature Requirements Demo */}
        <div className={styles.variantDemo}>
          <h3>Feature Requirements Demo</h3>
          <p>Advanced authentication with role and token requirements</p>
          
          <div className={styles.subDemo}>
            <h4>Public Access (No Requirements)</h4>
            <AuthGate 
              requirements={FEATURE_REQUIREMENTS.PUBLIC}
              action="view public content"
            >
              <div className={styles.publicContent}>
                📖 Public content - always accessible
              </div>
            </AuthGate>
          </div>

          <div className={styles.subDemo}>
            <h4>Authenticated Only</h4>
            <AuthGate 
              requirements={FEATURE_REQUIREMENTS.AUTHENTICATED}
              action="view authenticated content"
              variant="card"
              showRoleInfo={true}
              showTokenInfo={true}
            >
              <div className={styles.authenticatedContent}>
                🔐 Authenticated content - requires SIWS
              </div>
            </AuthGate>
          </div>

          <div className={styles.subDemo}>
            <h4>Admin Only</h4>
            <AuthGate 
              requirements={FEATURE_REQUIREMENTS.ADMIN}
              action="access admin panel"
              variant="card"
              showRoleInfo={true}
            >
              <div className={styles.adminContent}>
                👑 Admin content - requires admin role
              </div>
            </AuthGate>
          </div>

          <div className={styles.subDemo}>
            <h4>Marketplace Access</h4>
            <AuthGate 
              requirements={FEATURE_REQUIREMENTS.MARKETPLACE}
              action="trade intelligence"
              variant="card"
              showRoleInfo={true}
              showTokenInfo={true}
            >
              <div className={styles.marketplaceContent}>
                🛒 Intelligence Marketplace - requires analyst role or tokens
              </div>
            </AuthGate>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p>
          This demo page showcases the enhanced authentication system built for Starcom MK2.
          The system provides contextual prompts while allowing the app to work without forced authentication.
        </p>
      </div>
    </div>
  );
};

export default AuthDemoPage;
