import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom', // For React component testing
        globals: true,        // Enables global `describe`, `it`, etc.
        // Use a specific setup file for chat adapter tests, avoiding the general setupTests.ts
        // which has Jest dependencies
        setupFiles: [
            './src/lib/chat/__tests__/setupUnifiedAdapter.ts',
            './src/lib/chat/__tests__/setupSecureChatAdapter.ts'
        ], // Chat-specific setup files
        env: {
            VITE_EIA_API_KEY: 'ZJD7rrc41ozM4JikBBOM3Q4CAeEVYhdmxaHemuGo', // Mock env for tests
        },
        deps: {
            inline: [/@testing-library/, 'react', 'react-dom', '@vanilla-extract/sprinkles', '@rainbow-me/rainbowkit', 'wagmi'],
        },
        include: ['src/lib/chat/__tests__/**/*.test.ts', 'src/lib/chat/__tests__/**/*.test.tsx'],
        exclude: ['node_modules', 'dist'],
        pool: 'forks', // Use forks to prevent memory issues
        poolOptions: {
            forks: {
                singleFork: true
            }
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    },
    esbuild: {
        target: 'node14'
    },
    optimizeDeps: {
        exclude: ['@vanilla-extract/sprinkles']
    }
});
