import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// Load environment variables
const isProd = process.env.NODE_ENV === 'production';
const API_MARKET_URL = isProd
  ? process.env.VITE_MARKET_API_URL || 'https://real-market-data.com'
  : 'http://localhost:3001';
const API_INTELLIGENCE_URL = process.env.VITE_INTELLIGENCE_API_URL || 'https://osint-data-provider.com';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  css: {
    postcss: './postcss.config.cjs',
  },
  optimizeDeps: {
    include: ['wagmi', '@rainbow-me/rainbowkit', 'viem'],
    exclude: ['wasm_mini_server'],
    esbuildOptions: {
      // Ensure ESM compatibility for browser extensions
      target: 'esnext',
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