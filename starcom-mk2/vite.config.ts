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
    }),
  ],
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  optimizeDeps: {
    include: ['wagmi', '@rainbow-me/rainbowkit', 'viem', 'buffer'],
    exclude: ['wasm_mini_server'],
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
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    // Optimize for browser extension compatibility
    rollupOptions: {
      output: {
        format: 'esm', // Ensure ESM output
      },
    },
  }
});