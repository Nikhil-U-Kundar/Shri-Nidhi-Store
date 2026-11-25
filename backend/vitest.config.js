import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    // Set before .env is read, so tests never pick up real credentials. The driver is faked too.
    env: { JWT_SECRET: 'test-secret', DATABASE_URL: '', DB_HOST: 'localhost', PORT: '0' },
  },
});
