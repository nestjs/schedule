import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    decorators: {
      legacy: true,
      emitDecoratorMetadata: true,
    },
  },
  test: {
    root: './',
    include: ['tests/**/*.spec.ts'],
    hookTimeout: 30000,
    testTimeout: 30000,
    sequence: {
      hooks: 'stack',
    },
  },
});
