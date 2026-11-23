#!/usr/bin/env node
// emits the parallel CI benchmark matrix by matching changed files against each suite's esbuild input graph

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { inspectSuite, listSuites } from '../../bench.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const GLOBAL_TRIGGERS = [
  'package.json',
  'package-lock.json',
  '.node-version',
  '.github/workflows/bench.yml',
];

export function selectSuites({ suites, inputsBySuite, changedFiles = [], all = false }) {
  if (all) { return [...suites]; }
  if (changedFiles.length === 0) { return []; }
  if (changedFiles.some((file) => GLOBAL_TRIGGERS.includes(file))) { return [...suites]; }

  const changedSet = new Set(changedFiles);
  const changedManifestDirs = changedFiles
    .filter((file) => file.endsWith('/package.json'))
    .map((file) => file.slice(0, -'package.json'.length));

  return suites.filter((suite) => {
    const inputs = inputsBySuite[suite] ?? [];
    if (inputs.some((input) => changedSet.has(input))) { return true; }
    return changedManifestDirs.some((dir) => inputs.some((input) => input.startsWith(dir)));
  });
}

export async function discoverSuites({
  benchDir = join(root, 'bench'),
  checkoutDir = root,
  changedFiles = [],
  all = false,
} = {}) {
  const resolvedBenchDir = resolve(benchDir);
  const resolvedCheckout = resolve(checkoutDir);
  const suites = listSuites(resolvedBenchDir);
  const inputsBySuite = {};
  for (const suite of suites) {
    const { inputs } = await inspectSuite(join(resolvedBenchDir, `${suite}.js`), resolvedCheckout, {
      benchDir: resolvedBenchDir,
    });
    inputsBySuite[suite] = inputs;
  }
  return selectSuites({ suites, inputsBySuite, changedFiles, all });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      'bench-dir': { type: 'string', default: join(root, 'bench') },
      checkout: { type: 'string', default: root },
      changed: { type: 'string', default: '' },
      all: { type: 'boolean', default: false },
    },
  });
  const changedFiles = values.changed && existsSync(values.changed)
    ? readFileSync(values.changed, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean)
    : [];
  const selected = await discoverSuites({
    benchDir: values['bench-dir'],
    checkoutDir: values.checkout,
    changedFiles,
    all: values.all,
  });
  const json = JSON.stringify(selected);
  const hasSuites = selected.length > 0 ? 'true' : 'false';

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `suites=${json}\nhas-suites=${hasSuites}\n`);
  }
  console.log(`Changed files: ${changedFiles.length}`);
  console.log(`Selected suites (${selected.length}): ${selected.join(', ') || 'none'}`);
}
