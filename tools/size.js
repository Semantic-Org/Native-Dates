// measures production minified + Brotli-11 sizes for core, named entry, each plugin delta, and all plugins

import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// pass explicit resolveDir when imported by Astro's bundled build pipeline
export async function measure(contents, resolveDir = root, { dev = false } = {}) {
  const result = await build({
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
    // NODE_ENV: 'production' folds isDevelopment in src/helpers/environment.js so dev explanations strip out
    define: {
      'process.env.NODE_ENV': dev ? '"development"' : '"production"',
      __DEV__: dev ? 'true' : 'false',
    },
    stdin: { contents, resolveDir },
  });
  const raw = result.outputFiles[0].contents;
  const br = brotliCompressSync(raw, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  return { min: raw.length, br: br.length, text: result.outputFiles[0].text };
}

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

  if (plugins.length) {
    const everything = await measure(entryWith(plugins));
    rows.push(['core + all plugins', kb(everything.min), kb(everything.br)]);
  }

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
