import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/geopolitical/geometry/__tests__/**/*.test.ts'],
    environment: 'node',
    globals: true,
    reporters: 'default',
    passWithNoTests: false,
    hookTimeout: 10000,
  }
});
