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
  
  return {
  assetsInclude: ['**/*.glb', '**/*.gltf'], // Include 3D model files as assets
  define: {
    global: 'globalThis',
    'process.env': {},
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
    host: true,
    // Increased timeout for large project
    hmr: {
      timeout: 5000, // 5 seconds
    },
    fs: {
      // Explicitly allow these directories
      allow: ['.', './src', './public'],
      // Strict allow mode to prevent scanning of unwanted directories
      strict: true
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