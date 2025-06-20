import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Load environment variables

export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Include common Node.js modules needed for browser compatibility
      include: [
        'buffer',
        'process',
        'util',
        'stream',
        'crypto',
        'events',
        'querystring',
        'url',
        'fs',
        'path',
        'os',
        'http',
        'https',
        'zlib',
        'net',
        'tls',
        'assert',
        'dns',
        'timers'
      ],
      // Don't override certain globals that can cause issues
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  resolve: {
    alias: {
      // Ensure consistent React resolution
      'react': 'react',
      'react-dom': 'react-dom'
    }
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js', 
      '@solana/wallet-adapter-react', 
      'buffer', 
      'react', 
      'react-dom',
      'react/jsx-runtime'
    ],
    exclude: ['wasm_mini_server', 'undici', 'fsevents'],
    esbuildOptions: {
      // Ensure ESM compatibility for browser extensions
      target: 'esnext',
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Ensure assets are properly included
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    // Optimize chunk splitting for performance
    rollupOptions: {
      external: (id) => {
        // Externalize problematic Node.js modules that shouldn't be bundled
        if (id === 'util/types' || id.includes('util/types')) return true;
        if (id.includes('fsevents')) return true;
        return false;
      },
      output: {
        format: 'esm', // Ensure ESM output
        assetFileNames: (assetInfo) => {
          // Organize assets by type
          if (!assetInfo.name) return `assets/[name].[hash][extname]`;
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name].[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name].[hash][extname]`;
          }
          return `assets/[name].[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js',
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor-react';
          }
          
          // Solana ecosystem
          if (id.includes('@solana/') || id.includes('solana-')) {
            return 'solana';
          }
          
          // UI/Design system
          if (id.includes('@radix-ui/') || id.includes('styled-components')) {
            return 'ui';
          }
          
          // Crypto utilities
          if (id.includes('buffer') || id.includes('crypto')) {
            return 'crypto';
          }
          
          // Globe/Visualization - separate chunk but preloaded
          if (id.includes('three') || 
              id.includes('react-globe.gl') || 
              id.includes('d3') ||
              id.includes('Globe.tsx') ||
              id.includes('GlobeEngine')) {
            return 'globe-viz';
          }
          
          // Charts and visualization
          if (id.includes('chart') || id.includes('d3-')) {
            return 'charts';
          }
          
          // Node modules vendor chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  }
});