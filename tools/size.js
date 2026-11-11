// measures production min + brotli-11 sizes for core, tree-shaken entry, each plugin delta, and all combined

import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// resolveDir is passed by callers whose bundler moves this file, so import.meta.url no longer finds the repo
export async function measure(contents, resolveDir = root) {
  const result = await build({
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    stdin: { contents, resolveDir },
  });
  const raw = result.outputFiles[0].contents;
  const br = brotliCompressSync(raw, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  return { min: raw.length, br: br.length };
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

async function report() {
  const kb = (bytes, sign = '') => `${sign}${(bytes / 1000).toFixed(2)} kB`;

  const minimal = await measure(`import { now } from 'native-dates'; console.log(now());`);
  const coreBarrel = await measure(entryWith());

  const rows = [
    ['import { now }', kb(minimal.min), kb(minimal.br)],
    ['native-dates (full)', kb(coreBarrel.min), kb(coreBarrel.br)],
  ];

  const plugins = pluginNames();
  for (const name of plugins) {
    const withPlugin = await measure(entryWith([name]));
    rows.push([
      `  + plugins/${name}`,
      kb(withPlugin.min - coreBarrel.min, '+'),
      kb(withPlugin.br - coreBarrel.br, '+'),
    ]);
  }

  const everything = await measure(entryWith(plugins));
  rows.push(['core + all plugins', kb(everything.min), kb(everything.br)]);

  console.log('\nTarget'.padEnd(28) + 'Minified'.padStart(12) + 'Brotli (q11)'.padStart(15));
  console.log('-'.repeat(54));
  for (const [label, min, br] of rows) {
    console.log(label.padEnd(27) + min.padStart(12) + br.padStart(15));
  }
  console.log('');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await report();
}
