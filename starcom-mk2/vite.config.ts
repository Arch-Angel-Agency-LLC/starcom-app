import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(),
    nodePolyfills({
      // Minimal polyfills for development compatibility
      include: ['buffer', 'process'],
      globals: {
        Buffer: true,
        global: false,  // Let Vite handle this naturally
        process: true,
      },
    }),
  ],
  define: {
    global: 'globalThis',
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  optimizeDeps: {
    include: ['@solana/web3.js', '@solana/wallet-adapter-react', 'buffer'],
    exclude: ['wasm_mini_server'],
  },
});