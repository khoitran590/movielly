import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Pure-logic unit tests run in Node. The `@` alias mirrors tsconfig paths so
// tests import modules the same way app code does.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
