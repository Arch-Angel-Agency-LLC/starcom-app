import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom', // For React component testing
        globals: true,        // Enables global `describe`, `it`, etc.
        setupFiles: './src/setupTests.ts', // Optional setup file
        env: {
        VITE_EIA_API_KEY: 'ZJD7rrc41ozM4JikBBOM3Q4CAeEVYhdmxaHemuGo', // Mock env for tests
        },
        deps: {
            inline: [/@testing-library/, 'react', 'react-dom'],
        },
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        exclude: ['node_modules', 'dist'],
        tsconfig: './tsconfig.vitest.json',
    },
});