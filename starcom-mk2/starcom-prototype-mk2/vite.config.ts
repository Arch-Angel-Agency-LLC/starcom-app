import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["src/wasm/wasm_mini_server"],
  },
  build: {
    sourcemap: true,
  },
  server: {
    proxy: {
      "/api/market": {
        target: "https://real-market-data.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: false, // Allows HTTPS bypass for dev mode
      },
      "/api/intelligence": {
        target: "https://osint-data-provider.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: false,
      },
    },
  },
});