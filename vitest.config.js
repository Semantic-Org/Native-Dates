import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

const exclude = [
  ...configDefaults.exclude,
  '**/.claude/**',
  'docs/**',
];

const nodeTests = [
  '**/test/unit/**/*.test.{ts,js}',
  '**/test/*.test.{ts,js}',
];

export default defineConfig({
  test: {
    watch: false,
    passWithNoTests: true,
    pool: 'threads',
    projects: [
      {
        test: {
          include: nodeTests,
          exclude,
          name: 'node',
          environment: 'node',
        },
      },
      {
        // the node tests again on a runtime with no Temporal of its own, where the polyfill stands in
        test: {
          include: nodeTests,
          exclude: [...exclude, 'packages/polyfill/**'],
          name: 'polyfill',
          environment: 'node',
          setupFiles: ['packages/polyfill/test/polyfilled-runtime.js'],
        },
      },
      {
        test: {
          include: ['**/test/dom/**/*.test.{ts,js}'],
          exclude,
          name: 'jsdom',
          environment: 'jsdom',
        },
      },
      {
        test: {
          include: ['**/test/browser/**/*.test.{ts,js}'],
          exclude,
          name: 'browser',
          testTimeout: 30000,
          fileParallelism: false,
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
    ],
  },
});
