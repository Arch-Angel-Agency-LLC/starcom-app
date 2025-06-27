import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest', // Use ts-jest preset for TypeScript support
  testEnvironment: 'jsdom', // Simulate a browser environment
  roots: ['<rootDir>/src'], // Root directory for tests
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
    '\\.(svg|png|jpg|jpeg|gif)$': '<rootDir>/src/__mocks__/fileMock.ts', // Mock static assets
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'], // Setup scripts after environment
  testMatch: ['**/__tests__/**/*.(test|spec).[jt]s?(x)'], // Test files pattern
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest', // Transform TypeScript files
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'], // Ignore transformation for node_modules
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json', // Use your project's tsconfig.json
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // File extensions
  collectCoverage: true, // Enable coverage collection
  coverageDirectory: '<rootDir>/coverage', // Output directory for coverage reports
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}', // Files to collect coverage from
    '!src/**/index.ts', // Exclude index files
    '!src/**/*.d.ts', // Exclude type definition files
  ],
};

export default config;