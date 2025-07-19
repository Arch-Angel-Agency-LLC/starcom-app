import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { UnifiedAuthProvider } from './security/context/AuthContext';
import { debugLogger, DebugCategory } from './utils/debugLogger';
import '@solana/wallet-adapter-react-ui/styles.css';

// Global debugging setup
debugLogger.info(DebugCategory.COMPONENT_LOAD, 'main.tsx loaded - setting up global error monitoring');

// Capture ALL unhandled errors
window.addEventListener('error', (event) => {
  debugLogger.error(DebugCategory.CONSOLE_ERROR, 'GLOBAL ERROR EVENT', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    timestamp: new Date().toISOString()
  });
  
  if (event.error?.name === 'WalletNotSelectedError' || event.message?.includes('WalletNotSelectedError')) {
    console.error('🎯 GLOBAL: WalletNotSelectedError caught!');
    alert('GLOBAL ERROR: WalletNotSelectedError! Check console.');
  }
});

// Capture ALL unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨🚨🚨 GLOBAL UNHANDLED PROMISE REJECTION:', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString()
  });
  
  if (event.reason?.name === 'WalletNotSelectedError' || String(event.reason).includes('WalletNotSelectedError')) {
    console.error('🎯 GLOBAL PROMISE: WalletNotSelectedError caught!');
    alert('GLOBAL PROMISE REJECTION: WalletNotSelectedError! Check console.');
  }
});

// Import console optimization to reduce noise
import './utils/consoleOptimization';

// Use specific wallet adapters directly to avoid conflicts from the general wallets package
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

// Log wallet details to debug (filter out MetaMask-related logs to reduce noise)
wallets.forEach((wallet, index) => {
  if (!wallet.name.toLowerCase().includes('metamask')) {
    console.log(`Wallet ${index}:`, {
      name: wallet.name,
      url: wallet.url,
      icon: wallet.icon,
      readyState: wallet.readyState
    });
  }
});

console.log('Registered wallets:', wallets.map(w => w.name));

const endpoint = 'https://api.devnet.solana.com';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Create a memoized component to prevent re-renders that might cause duplicate detection
const AppWithWallets = React.memo(() => (
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider 
      wallets={wallets} 
      autoConnect={false}
      onError={(error) => {
        // 🚨🚨🚨 CRITICAL DEBUGGING: WalletProvider error handler called!
        console.error('🚨🚨🚨 WALLET PROVIDER ERROR HANDLER CALLED!');
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        
        // Check if this is the WalletNotSelectedError we're hunting
        if (error.name === 'WalletNotSelectedError' || error.message?.includes('WalletNotSelectedError')) {
          console.error('🎯 FOUND IT! WalletNotSelectedError caught in WalletProvider onError');
          console.error('This means the error is coming from Solana wallet adapter, NOT our code');
          alert('🎯 WalletNotSelectedError caught in WalletProvider! Check console for details.');
        }
        
        console.error('Wallet Provider Error:', error);
        // Suppress MetaMask-related errors in console to reduce noise
        if (!error.message?.toLowerCase().includes('metamask')) {
          console.error('Non-MetaMask wallet error:', error);
        }
      }}
      localStorageKey="solana-wallet-adapter"
    >
      <WalletModalProvider>
        <UnifiedAuthProvider>
          <App />
        </UnifiedAuthProvider>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
));

root.render(
  <React.StrictMode>
    <AppWithWallets />
  </React.StrictMode>
);
