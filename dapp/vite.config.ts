import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(),
    nodePolyfills({
      // Enhanced polyfills for browser compatibility including IPFS
      include: [
        'buffer', 
        'process', 
        'stream', 
        'util', 
        'crypto', 
        'http', 
        'https', 
        'zlib',
        'path',
        'vm',
        'fs',
        'url',
        'querystring',
        'events'
      ],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js', 
      '@solana/wallet-adapter-react', 
      '@metaplex-foundation/umi',
      '@metaplex-foundation/umi-bundle-defaults',
      'buffer',
      'stream-browserify',
      'crypto-browserify',
      'path-browserify',
      'vm-browserify'
    ],
    exclude: ['wasm_mini_server'],
  },
  server: {
    port: 5174,
    host: true,
  },
  resolve: {
    alias: {
      // Polyfill Node.js modules for browser compatibility
      stream: 'stream-browserify',
      util: 'util',
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      vm: 'vm-browserify',
    },
  },
});