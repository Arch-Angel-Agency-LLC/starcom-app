// Suppress specific React warnings that are outside our control
// This is applied at startup to reduce console noise

const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  // Convert all arguments to string to check the full message
  const fullMessage = args.join(' ');
  
  // Suppress MetaMask duplicate key warnings that we can't control
  if (
    fullMessage.includes('Encountered two children with the same key') &&
    fullMessage.includes('MetaMask')
  ) {
    return; // Suppress this specific warning
  }
  
  // Suppress React warnings about duplicate keys in wallet modal
  if (
    fullMessage.includes('Warning: Encountered two children with the same key') ||
    fullMessage.includes('Keys should be unique so that components maintain their identity')
  ) {
    return; // Suppress React key warnings
  }
  
  // Suppress other wallet-related warnings we can't control
  if (
    fullMessage.includes('StreamMiddleware') ||
    fullMessage.includes('solflare-detect-metamask') ||
    fullMessage.includes('Unknown response id') ||
    fullMessage.includes('WalletModal') ||
    fullMessage.includes('WalletProvider')
  ) {
    return; // Suppress these warnings
  }
  
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const fullMessage = args.join(' ');
  
  // Suppress MetaMask-related warnings and wallet adapter warnings
  if (
    fullMessage.includes('MetaMask') ||
    fullMessage.includes('wallet-adapter') ||
    fullMessage.includes('solflare-detect') ||
    fullMessage.includes('Encountered two children with the same key') ||
    fullMessage.includes('Keys should be unique')
  ) {
    return; // Suppress these warnings
  }
  
  originalWarn.apply(console, args);
};

export {};
