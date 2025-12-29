import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock import.meta.env for tests
vi.stubGlobal('import.meta', {
  env: {
    MODE: 'test',
    DEV: false,
    PROD: false,
  },
});
