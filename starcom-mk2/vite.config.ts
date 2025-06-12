import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// Load environment variables

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