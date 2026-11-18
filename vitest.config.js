import { configDefaults, defineConfig } from 'vitest/config';

import { bundleDir } from './test/setup/bundle.js';

const exclude = [
  ...configDefaults.exclude,
  '**/.claude/**',
  'docs/**',
];

// a test directly in a test folder runs in every project, and one in test/<project>/ in that project alone
const include = (project) => [
  '**/test/*.test.{ts,js}',
  `**/test/${project}/**/*.test.{ts,js}`,
];

export default defineConfig({
  test: {
    watch: false,
    passWithNoTests: true,
    pool: 'threads',
    projects: [
      {
        test: {
          include: include('native'),
          exclude,
          name: 'native',
          environment: 'node',
        },
      },
      {
        test: {
          include: include('polyfill'),
          exclude,
          name: 'polyfill',
          environment: 'node',
          setupFiles: ['test/setup/polyfill.js'],
        },
      },
      {
        resolve: {
          alias: [
            { find: /^native-dates$/, replacement: `${bundleDir}/src/index.js` },
            { find: /^@native-dates\/core$/, replacement: `${bundleDir}/packages/core/index.js` },
            { find: /^@native-dates\/plugins\/(.+)$/, replacement: `${bundleDir}/packages/plugins/src/$1.js` },
          ],
        },
        test: {
          include: include('bundle'),
          exclude,
          name: 'bundle',
          environment: 'node',
          globalSetup: ['test/setup/bundle.js'],
        },
      },
    ],
  },
});
