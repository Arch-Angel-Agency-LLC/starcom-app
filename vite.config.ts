import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

// Define directories to exclude from Vite processing
const EXCLUDED_DIRS = [
  'backup',
  'starcom-mk2-backup',
  'backup_logs',
  'ai-security-relaynode'
];

export default defineConfig(({ mode }) => {
  // Environment-specific configuration
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  const target = process.env.VITE_TARGET || '';
  const isIPFS = target === 'ipfs';
  
  return {
  // Use relative base for IPFS builds so assets resolve under /ipfs/<CID>/
  base: isIPFS ? './' : '/',
  assetsInclude: ['**/*.glb', '**/*.gltf'], // Include 3D model files as assets
  define: {
    global: 'globalThis',
    'process.env': {},
    'import.meta.env.VITE_TARGET': JSON.stringify(target),
    // Environment variables for feature flag defaults
    __STARCOM_PROD__: isProduction,
    __STARCOM_DEV__: isDevelopment,
    // Disable verbose logging in production by default
    __VERBOSE_LOGGING_DEFAULT__: !isProduction,
    __ASSET_DEBUG_DEFAULT__: isDevelopment,
    __DEPLOYMENT_DEBUG_DEFAULT__: isDevelopment,
  },
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
    // Custom plugin to exclude backup directories from Vite's scanning
    {
      name: 'exclude-backup-files',
      configureServer(server) {
        // Hook into Vite's HTML transform to skip backup files
        return () => {
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            
            // Handle Google Analytics API endpoint
            if (url === '/api/analytics/realtime' && req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              
              // For now, return a note about server-side implementation needed
              res.statusCode = 501;
              res.end(JSON.stringify({
                error: 'Google Analytics API requires server-side implementation',
                message: 'Real GA4 data fetching needs backend with proper JWT signing and OAuth flow',
                note: 'Service account credentials are available but need secure server-side handling'
              }));
              return;
            }
            
            if (EXCLUDED_DIRS.some(dir => url.includes(`/${dir}/`))) {
              res.statusCode = 404;
              res.end('Not found');
              return;
            }
            next();
          });
        };
      },
    },
  ],

  css: {
    postcss: './postcss.config.cjs',
    devSourcemap: false, // Disable CSS source maps in development
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js', 
      '@solana/wallet-adapter-react', 
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-base',
      '@metaplex-foundation/umi',
      '@metaplex-foundation/umi-bundle-defaults',
      'buffer',
      'stream-browserify',
      'crypto-browserify',
      'path-browserify',
      'vm-browserify',
      'bs58',
      'tweetnacl',
      '@metaplex-foundation/mpl-token-metadata',
      'uuid',
      'crypto-js',
      'nostr-tools',
      'axios',
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      'three',
      'zustand',
      'zod',
      'd3',
      'styled-components',
      'react-leaflet',
      'leaflet'
    ],
    exclude: [
      'wasm_mini_server', 
      'gun', 
      '@gun-extras/sea',
      'vite-plugin-node-polyfills/shims/buffer',
      'vite-plugin-node-polyfills/shims/global',
      'vite-plugin-node-polyfills/shims/process'
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
      // Enable JSX in TS files
      jsx: 'automatic',
      // Target latest browsers for better compatibility
      target: 'es2020',
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0', // Allow external connections
    // Enhanced HMR configuration for WebSocket stability
    hmr: {
      port: 5175, // Use different port for HMR WebSocket
      host: 'localhost',
      timeout: 15000, // 15 seconds for large project
      overlay: true,
    },
    // Enable CORS for development
    cors: true,
    // Watch options for better file monitoring
    watch: {
      usePolling: false,
      interval: 100,
      ignored: ['**/node_modules/**', '**/backup/**', '**/starcom-mk2-backup/**', '**/backup_logs/**'],
    },
    fs: {
      // Explicitly allow these directories
      allow: ['.', './src', './public', './asset development'],
      // Strict allow mode to prevent scanning of unwanted directories
      strict: false // Changed to false to allow more flexibility
    },
  },
  build: {
    assetsInlineLimit: 0, // Ensure all assets are properly externalized
    rollupOptions: {
      // Explicitly set the input file to avoid scanning backup directories
      input: path.resolve(__dirname, 'index.html'),
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
  // NetRunner engine alias (to avoid deep fragile relative paths on some build environments)
  '@netrunner-engine': path.resolve(__dirname, './src/applications/netrunner/scripts/engine'),
  '@netrunnerEngine': path.resolve(__dirname, './src/netrunnerEngine.ts'),
      // Polyfill Node.js modules for browser compatibility
      stream: 'stream-browserify',
      util: 'util',
      path: 'path-browserify',
      crypto: 'crypto-browserify',
      vm: 'vm-browserify',
    },
  },
  };
});