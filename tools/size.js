// measures production min + brotli-11 sizes for core, tree-shaken entry, each plugin delta, and all combined

import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// resolveDir is passed by callers whose bundler moves this file, so import.meta.url no longer finds the repo
export async function measure(contents, resolveDir = root, { development = false } = {}) {
  const result = await build({
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': development ? '"development"' : '"production"' },
    stdin: { contents, resolveDir },
  });
  const raw = result.outputFiles[0].contents;
  const br = brotliCompressSync(raw, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  return { min: raw.length, br: br.length, text: result.outputFiles[0].text };
}

// logging the namespace keeps every export, so this is all of core plus the named plugins
export const entryWith = (plugins = []) =>
  [
    `import * as core from 'native-dates';`,
    ...plugins.map((name) => `import '@native-dates/plugins/${name}';`),
    `console.log(core);`,
  ].join('\n');

export const pluginNames = (resolveDir = root) =>
  readdirSync(resolve(resolveDir, 'packages/plugins/src'))
    .filter((file) => file.endsWith('.js'))
    .map((file) => file.replace(/\.js$/, ''))
    .sort();

// every row of the size table for one checkout. the table printed below and the pull request comment
// both read these, so a number has one source
export async function measureTargets(resolveDir = root) {
  const bytesOf = async (contents) => {
    const { min, br } = await measure(contents, resolveDir);
    return { min, br };
  };
  const minimal = await bytesOf(`import { now } from 'native-dates'; console.log(now());`);
  const coreBarrel = await bytesOf(entryWith());

  const targets = [
    { label: 'import { now }', ...minimal },
    { label: 'native-dates (full)', ...coreBarrel },
  ];

  const plugins = pluginNames(resolveDir);
  for (const name of plugins) {
    const withPlugin = await bytesOf(entryWith([name]));
    targets.push({
      label: `+ plugins/${name}`,
      min: withPlugin.min - coreBarrel.min,
      br: withPlugin.br - coreBarrel.br,
      isDelta: true,
    });
  }

  targets.push({ label: 'core + all plugins', ...(await bytesOf(entryWith(plugins))) });
  return targets;
}

async function report() {
  const kb = (bytes, sign = '') => `${sign}${(bytes / 1000).toFixed(2)} kB`;

  console.log('\nTarget'.padEnd(28) + 'Minified'.padStart(12) + 'Brotli (q11)'.padStart(15));
  console.log('-'.repeat(54));
  for (const { label, min, br, isDelta } of await measureTargets()) {
    const sign = isDelta ? '+' : '';
    const indent = isDelta ? '  ' : '';
    console.log(`${indent}${label}`.padEnd(27) + kb(min, sign).padStart(12) + kb(br, sign).padStart(15));
  }
  console.log('');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await report();
}
