import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setupEnv.js'],
    // Disable parallel execution to prevent database write conflicts
    sequence: {
      concurrent: false,
    },
    maxWorkers: 1,
    forks: {
      singleFork: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['customer/**/*.js']
    }
  },
});
