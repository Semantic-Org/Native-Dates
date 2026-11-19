import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

const exclude = [
  ...configDefaults.exclude,
  '**/.claude/**',
  'docs/**',
];

export default defineConfig({
  test: {
    watch: false,
    passWithNoTests: true,
    pool: 'threads',
    projects: [
      {
        test: {
          include: [
            '**/test/**/*.test.{ts,js}',
            'tools/**/*.test.{ts,js}',
          ],
          exclude: [
            ...exclude,
            '**/test/dom/**',
            '**/test/browser/**',
          ],
          name: 'node',
          environment: 'node',
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
