// measures production min + brotli-11 sizes for core, tree-shaken entry, each plugin delta, and all combined

import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pluginsDir = resolve(root, 'packages/plugins/src');

async function measure(options) {
  const result = await build({
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    ...options,
  });
  const raw = result.outputFiles[0].contents;
  const br = brotliCompressSync(raw, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  return { min: raw.length, br: br.length };
}

const kb = (bytes, sign = '') => `${sign}${(bytes / 1000).toFixed(2)} kB`;

const minimal = await measure({
  stdin: {
    contents: `import { now } from 'native-dates'; console.log(now());`,
    resolveDir: root,
  },
});

const coreBarrel = await measure({
  stdin: {
    contents: `import * as core from 'native-dates'; console.log(core);`,
    resolveDir: root,
  },
});

const rows = [
  ['import { now }', kb(minimal.min), kb(minimal.br)],
  ['native-dates (full)', kb(coreBarrel.min), kb(coreBarrel.br)],
];

const pluginFiles = readdirSync(pluginsDir).filter((file) => file.endsWith('.js')).sort();
for (const file of pluginFiles) {
  const name = file.replace(/\.js$/, '');
  const withPlugin = await measure({
    stdin: {
      contents: [
        `import * as core from 'native-dates';`,
        `import '@native-dates/plugins/${name}';`,
        `console.log(core);`,
      ].join('\n'),
      resolveDir: root,
    },
  });
  rows.push([
    `  + plugins/${name}`,
    kb(withPlugin.min - coreBarrel.min, '+'),
    kb(withPlugin.br - coreBarrel.br, '+'),
  ]);
}

const everything = await measure({
  stdin: {
    contents: [
      `import * as core from 'native-dates';`,
      ...pluginFiles.map((file) => `import '@native-dates/plugins/${file.replace(/\.js$/, '')}';`),
      `console.log(core);`,
    ].join('\n'),
    resolveDir: root,
  },
});
rows.push(['core + all plugins', kb(everything.min), kb(everything.br)]);

console.log('\nTarget'.padEnd(28) + 'Minified'.padStart(12) + 'Brotli (q11)'.padStart(15));
console.log('-'.repeat(54));
for (const [label, min, br] of rows) {
  console.log(label.padEnd(27) + min.padStart(12) + br.padStart(15));
}
console.log('');
