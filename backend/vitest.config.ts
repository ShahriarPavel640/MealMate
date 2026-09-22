import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './'),
    },
  },
  test: {
    environment: 'node',
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setupEnv.js'],
    // Disable parallel execution to prevent database write conflicts
    sequence: {
      concurrent: false,
    },
    maxWorkers: 1,

    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      include: ['customer/**/*.ts'],
    },
  },
});
