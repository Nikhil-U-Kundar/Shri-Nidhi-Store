import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.{ts,tsx}'],
      setupFiles: ['tests/setup.ts'],
      testTimeout: 15000,
      // Same-origin API calls, whatever a developer's local .env says.
      env: { VITE_API_URL: '' },
    },
  })
);
