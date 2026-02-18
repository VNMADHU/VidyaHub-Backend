import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/test/**', 'src/index.js'],
    },
  },
})
