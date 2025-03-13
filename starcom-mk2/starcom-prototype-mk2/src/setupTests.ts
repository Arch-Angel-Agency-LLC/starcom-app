// src/setupTests.ts
import '@testing-library/jest-dom'; // Import the package directly
import { vi } from 'vitest';

global.fetch = vi.fn(); // Mock fetch globally