import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import { buildReport } from '../tools/ci/bundle/reporter.js';
import { budget, checkTree } from '../tools/gates/budget.js';
import { sentences } from '../tools/gates/prose.js';
import { rowsFrom } from '../tools/size.js';

const root = resolve(import.meta.dirname, '..');

describe('sentences', () => {
  it('extracts developer prose strings and templates while ignoring short tokens and operators', () => {
    const code = [
      "const id = 'native-dates/id';",
      "const expr = 'a === b && c !== d';",
      "const msg = 'expected a function listener';",
      'const hint = `expected function, got ${typeof x}. Pass \\`call((v) => {})\\``;',
    ].join('\n');

    expect(sentences(code)).toEqual([
      'expected a function listener',
      'expected function, got ${…}. Pass `call((v) => {})`',
    ]);
  });
});

describe('rowsFrom', () => {
  it('lists the rows npm run size prints, each with the part it plays in the comment', () => {
    expect(rowsFrom(['loose', 'zones']).map((row) => [row.label, row.part])).toEqual([
      ['import { now }', 'diagnostic'],
      ['native-dates (full)', 'headline'],
      ['plugins/loose', 'plugin'],
      ['plugins/zones', 'plugin'],
      ['core + all plugins', 'diagnostic'],
      ['dev-mode overhead (development vs production)', 'overhead'],
    ]);
    // a plugin is what it adds to an app that already has all of native-dates, so it is weighed beside it
    expect(rowsFrom(['zones']).filter((row) => row.part === 'plugin').map((row) => row.beside)).toEqual([
      'native-dates (full)',
    ]);
  });
});

// the numbers are whatever the tree weighs today, so these are about shape and units, never bytes
describe('checkTree', () => {
  let measured;
  beforeAll(async () => {
    measured = await checkTree(root);
  });
  const row = (label) => measured.rows.find((entry) => entry.label === label);

  it('measures every row in whole bytes with the source files behind it', () => {
    expect(measured.rows.every((entry) => entry.error === undefined)).toBe(true);
    for (const entry of measured.rows) {
      for (const key of ['min', 'gz', 'br']) {
        expect(Number.isInteger(entry.sizes[key]) && entry.sizes[key] > 0, `${entry.label} ${key}`).toBe(true);
      }
    }
    const core = row('native-dates (full)');
    expect(core.inputs['src/index.js']).toBeGreaterThan(0);
    expect(Object.keys(core.inputs).every((file) => file.startsWith('src/'))).toBe(true);
    expect(row('import { now }').sizes.br).toBeLessThan(core.sizes.br);
    expect(row('core + all plugins').sizes.br).toBeGreaterThan(core.sizes.br);
    expect(row('dev-mode overhead (development vs production)').inputs).toBe(undefined);
  });

  it('weighs a plugin as what it adds beside core, with no second copy of core', () => {
    const core = row('native-dates (full)');
    const plugins = measured.rows.filter((entry) => entry.part === 'plugin');
    expect(plugins.length).toBeGreaterThan(0);
    for (const plugin of plugins) {
      expect(plugin.sizes.min).toBeLessThan(core.sizes.min);
      expect(plugin.inputs[`packages/${plugin.label}`.replace('plugins/', 'plugins/src/') + '.js']).toBeGreaterThan(0);
      expect(plugin.inputs['src/index.js']).toBe(undefined);
      const own = Object.values(plugin.inputs).reduce((total, bytes) => total + bytes, 0);
      expect(own).toBe(plugin.sizes.min);
    }
  });

  it("reports core's distance to the ceiling and both checks on development text", () => {
    const core = row('native-dates (full)');
    expect(measured.ceiling).toEqual({
      limit: budget.ceiling,
      headline: core.sizes.br,
      distance: budget.ceiling - core.sizes.br,
      ok: core.sizes.br <= budget.ceiling,
    });
    expect(measured.sizes).toEqual(budget.sizes);
    expect(Object.keys(measured.strip).sort()).toEqual(['folded', 'ok', 'present']);
    expect(measured.strip.ok).toBe(measured.strip.present && measured.strip.folded);
    expect(Object.keys(measured.prose).sort()).toEqual(['leaked', 'ok', 'skipped', 'stale', 'survivors']);
    expect(measured.prose.skipped).toEqual([]);
    expect(measured.prose.ok).toBe(measured.prose.leaked.length === 0);
  });

  it('is a measurement the reporter judges, with an edge in the budget for every size it names', () => {
    const report = buildReport({ measurements: { head: measured, base: measured, changed: {} }, head: {} });
    expect(report.bands.map((band) => band.upTo)).toEqual([-1, 0, ...Object.values(budget.sizes)]);
    expect(report.checks.limits).toEqual({
      bug: budget.sizes['bug sized'],
      change: Object.values(budget.sizes).at(-1),
    });
  });

  it('is started by a change to any file a bundle is built from', () => {
    const workflow = readFileSync(resolve(root, '.github/workflows/bundle-size.yml'), 'utf8');
    const globs = [...workflow.match(/^ {4}paths:\n((?: {6}.*\n)+)/m)[1].matchAll(/^ {6}- '(.+)'$/gm)].map(([, glob]) =>
      glob
    );
    // GitHub's filter patterns as far as the list uses them: * stays inside a folder, ** crosses folders
    const literal = (text) => text.replace(/[.^$(){}|\\]/g, '\\$&');
    const pattern = (glob) =>
      new RegExp(`^${glob.split('**').map((part) => part.split('*').map(literal).join('[^/]*')).join('.*')}$`);
    const starts = (file) => globs.some((glob) => pattern(glob).test(file));
    const built = [...new Set(measured.rows.flatMap((entry) => Object.keys(entry.inputs ?? {})))];
    expect(built.length).toBeGreaterThan(20);
    expect(built.filter((file) => !starts(file))).toEqual([]);
    for (
      const file of [
        'tools/size.js',
        'tools/gates/budget.js',
        'tools/ci/bundle/reporter.js',
        'ai/contributing/budget.md',
      ]
    ) {
      expect(starts(file), file).toBe(true);
    }
    for (
      const file of ['docs/astro.config.mjs', 'test/time.test.js', 'packages/plugins/test/zones.test.js', 'README.md']
    ) {
      expect(starts(file), file).toBe(false);
    }
  });
});
