// measures production min + brotli-11 sizes for core, tree-shaken entry, each plugin delta, and all combined

import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coreDir = resolve(root, 'packages/core');
const pluginsDir = resolve(coreDir, 'src/plugins');

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
    contents: `import { now } from './src/index.js'; console.log(now());`,
    resolveDir: coreDir,
  },
});

const coreBarrel = await measure({
  stdin: {
    contents: `import * as core from './src/index.js'; console.log(core);`,
    resolveDir: coreDir,
  },
});

const rows = [
  ['import { now }', kb(minimal.min), kb(minimal.br)],
  ['@native-dates/core (full)', kb(coreBarrel.min), kb(coreBarrel.br)],
];

const pluginFiles = readdirSync(pluginsDir).filter((file) => file.endsWith('.js')).sort();
for (const file of pluginFiles) {
  const name = file.replace(/\.js$/, '');
  const withPlugin = await measure({
    stdin: {
      contents: [
        `import * as core from './src/index.js';`,
        `import * as plugin from './src/plugins/${file}';`,
        `console.log(core, plugin);`,
      ].join('\n'),
      resolveDir: coreDir,
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
      `import * as core from './src/index.js';`,
      ...pluginFiles.map((file, i) => `import * as p${i} from './src/plugins/${file}';`),
      `console.log(core, ${pluginFiles.map((_, i) => `p${i}`).join(', ')});`,
    ].join('\n'),
    resolveDir: coreDir,
  },
});
rows.push(['core + all plugins', kb(everything.min), kb(everything.br)]);

console.log('\nTarget'.padEnd(28) + 'Minified'.padStart(12) + 'Brotli (q11)'.padStart(15));
console.log('-'.repeat(54));
for (const [label, min, br] of rows) {
  console.log(label.padEnd(27) + min.padStart(12) + br.padStart(15));
}
console.log('');
