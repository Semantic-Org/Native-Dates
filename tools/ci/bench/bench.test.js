import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { bundleSuiteSide, inspectSuite, listSuites } from '../../bench.js';
import { discoverSuites, selectSuites } from './discover.js';

const root = resolve(import.meta.dirname, '../../..');
const benchDir = join(root, 'bench');

describe('bench/ configuration and suites', () => {
  it('defines valid tachometer sampling parameters in bench/tachometer.json', () => {
    const sampling = JSON.parse(readFileSync(join(benchDir, 'tachometer.json'), 'utf8'));
    expect(sampling.sampleSize).toBeGreaterThanOrEqual(30);
    expect(sampling.timeout).toBeGreaterThan(0);
    expect(sampling.autoSampleConditions).toEqual(['2%']);
  });

  it('exports at least one benchmark function from every bench/*.js file and bundles cleanly', async () => {
    const suites = listSuites(benchDir);
    expect(suites.length).toBeGreaterThanOrEqual(2);

    const outDir = mkdtempSync(join(tmpdir(), 'bench-smoke-'));
    try {
      for (const suite of suites) {
        const suiteFile = join(benchDir, `${suite}.js`);
        const info = await inspectSuite(suiteFile, root, { benchDir });
        expect(info.exports.length, suite).toBeGreaterThan(0);
        expect(info.inputs.some((input) => input.startsWith('src/')), suite).toBe(true);

        const built = await bundleSuiteSide({
          suiteFile,
          benchDir,
          checkoutDir: root,
          outfile: join(outDir, `${suite}.js`),
          opNames: info.exports,
        });
        expect(built.exports).toEqual(info.exports);
        expect(readFileSync(built.htmlFile, 'utf8')).toContain(`./${suite}.js`);
      }
    }
    finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('bundles package imports from the target checkout rather than benchDir parent', async () => {
    const altCheckout = mkdtempSync(join(tmpdir(), 'bench-alt-checkout-'));
    try {
      mkdirSync(join(altCheckout, 'src'), { recursive: true });
      writeFileSync(
        join(altCheckout, 'package.json'),
        JSON.stringify({ name: 'native-dates', type: 'module', exports: { '.': './src/index.js' } }),
      );
      writeFileSync(
        join(altCheckout, 'src/index.js'),
        `export const date = () => 'SENTINEL_FROM_ALT_CHECKOUT';\n`,
      );
      mkdirSync(join(altCheckout, 'node_modules'), { recursive: true });
      symlinkSync(altCheckout, join(altCheckout, 'node_modules/native-dates'));

      const outFile = join(altCheckout, 'out.js');
      const built = await bundleSuiteSide({
        suiteFile: join(benchDir, 'parse.js'),
        benchDir,
        checkoutDir: altCheckout,
        outfile: outFile,
      });
      expect(built.inputs).toEqual(['src/index.js']);
      expect(readFileSync(outFile, 'utf8')).toContain('SENTINEL_FROM_ALT_CHECKOUT');
    }
    finally {
      rmSync(altCheckout, { recursive: true, force: true });
    }
  });

  it('preserves source declaration order rather than alphabetical order for cold-first operations', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'bench-order-'));
    try {
      const suiteFile = join(tempDir, 'order.js');
      writeFileSync(
        suiteFile,
        [
          "import { date } from 'native-dates';",
          'export function uncachedFirst() { return date("2026-01-01"); }',
          'export function cachedSecond() { return date("2026-01-01"); }',
        ].join('\n'),
      );
      const info = await inspectSuite(suiteFile, root, { benchDir: tempDir });
      expect(info.exports).toEqual(['uncachedFirst', 'cachedSecond']);
    }
    finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('selectSuites() and bench.yml path triggers', () => {
  const suites = ['format', 'parse', 'plugins'];
  const inputsBySuite = {
    format: ['src/index.js', 'src/date-time.js'],
    parse: ['src/index.js', 'src/calendar-date.js'],
    plugins: ['src/index.js', 'packages/plugins/src/zones.js'],
  };

  it('selects all suites on shared inputs, root manifest, lockfile, or workflow changes', () => {
    for (
      const file of [
        'src/index.js',
        'package.json',
        'package-lock.json',
        '.node-version',
        '.github/workflows/bench.yml',
      ]
    ) {
      expect(selectSuites({ suites, inputsBySuite, changedFiles: [file] }), file).toEqual(suites);
    }
    expect(selectSuites({ suites, inputsBySuite, changedFiles: ['src/calendar-date.js'] })).toEqual(['parse']);
  });

  it('selects only matching suites when a PR touches subpackage sources or manifests', () => {
    expect(
      selectSuites({ suites, inputsBySuite, changedFiles: ['packages/plugins/src/zones.js'] }),
    ).toEqual(['plugins']);
    expect(
      selectSuites({ suites, inputsBySuite, changedFiles: ['packages/plugins/package.json'] }),
    ).toEqual(['plugins']);
    expect(
      selectSuites({ suites, inputsBySuite, changedFiles: ['packages/plugins/src/loose.js'] }),
    ).toEqual([]);
  });

  it('skips all suites on docs, tests, and bench-only changes', () => {
    expect(
      selectSuites({
        suites,
        inputsBySuite,
        changedFiles: ['README.md', 'docs/astro.config.mjs', 'test/time.test.js', 'bench/parse.js'],
      }),
    ).toEqual([]);
    expect(selectSuites({ suites, inputsBySuite, changedFiles: [], all: true })).toEqual(suites);
  });

  it('discovers live suites in bench/ against changed files', async () => {
    const all = await discoverSuites({ benchDir, checkoutDir: root, all: true });
    expect(all).toEqual(listSuites(benchDir));
    const none = await discoverSuites({ benchDir, checkoutDir: root, changedFiles: ['README.md'] });
    expect(none).toEqual([]);
  });

  it('triggers bench.yml for every bundled source file imported by bench/*.js', async () => {
    const workflow = readFileSync(join(root, '.github/workflows/bench.yml'), 'utf8');
    const globs = [...workflow.match(/^ {4}paths:\n((?: {6}.*\n)+)/m)[1].matchAll(/^ {6}- '(.+)'$/gm)].map(
      ([, glob]) => glob,
    );
    const literal = (text) => text.replace(/[.^$(){}|\\]/g, '\\$&');
    const pattern = (glob) =>
      new RegExp(`^${glob.split('**').map((part) => part.split('*').map(literal).join('[^/]*')).join('.*')}$`);
    const triggers = (file) => globs.some((glob) => pattern(glob).test(file));

    const suitesInRepo = listSuites(benchDir);
    const bundledFiles = new Set();
    for (const suite of suitesInRepo) {
      const { inputs } = await inspectSuite(join(benchDir, `${suite}.js`), root, { benchDir });
      for (const file of inputs) { bundledFiles.add(file); }
    }
    expect(bundledFiles.size).toBeGreaterThan(0);
    expect([...bundledFiles].filter((file) => !triggers(file))).toEqual([]);
    expect(triggers('bench/parse.js')).toBe(false);
    expect(triggers('tools/ci/bench/reporter.js')).toBe(false);
  });
});
