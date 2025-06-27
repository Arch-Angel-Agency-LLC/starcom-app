import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import '@solana/wallet-adapter-react-ui/styles.css';

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
        console.error('Wallet Provider Error:', error);
        // Suppress MetaMask-related errors in console to reduce noise
        if (!error.message?.toLowerCase().includes('metamask')) {
          console.error('Non-MetaMask wallet error:', error);
        }
      }}
      localStorageKey="solana-wallet-adapter"
    >
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
));

root.render(
  <React.StrictMode>
    <AppWithWallets />
  </React.StrictMode>
);