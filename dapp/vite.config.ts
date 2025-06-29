import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  assetsInclude: ['**/*.glb', '**/*.gltf'], // Include 3D model files as assets
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
  build: {
    assetsInlineLimit: 0, // Ensure all assets are properly externalized
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  resolve: {
    alias: {
      // Source code aliases for reliable path resolution
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@models': path.resolve(__dirname, './src/models'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      // Polyfill Node.js modules for browser compatibility
      stream: 'stream-browserify',
      util: 'util',
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      vm: 'vm-browserify',
    },
  },
});