import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// Separate config for the RLS security tests. They talk to the REAL Supabase
// project, so they are not part of `npm test` or CI. Run with `npm run test:rls`.
export default defineConfig({
  test: {
    include: ['tests/rls/**/*.test.ts'],
    environment: 'node',
    // Loads .env, .env.local, .env.test and .env.test.local (all prefixes).
    env: loadEnv('test', process.cwd(), ''),
    // Tests share setup data and hit the network, so run them one at a time.
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
