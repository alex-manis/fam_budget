import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Resolve `.js` extension imports emitted by NodeNext module mode
    // so tests can import TypeScript source files without the build step.
    alias: [{ find: /^(\.{1,2}\/.+)\.js$/, replacement: '$1' }],
  },
});
