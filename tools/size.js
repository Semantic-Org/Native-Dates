// measures production minified, gzip, and Brotli-11 sizes for core, a single import, marginal plugins, and all plugins

import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// pass explicit resolveDir when imported by Astro's bundled build pipeline
export async function measure(contents, resolveDir = root, { dev = false, map = false } = {}) {
  const result = await build({
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
    metafile: true,
    absWorkingDir: resolveDir,
    // NODE_ENV: 'production' folds isDevelopment in src/helpers/environment.js so dev explanations strip out
    define: {
      'process.env.NODE_ENV': dev ? '"development"' : '"production"',
      __DEV__: dev ? 'true' : 'false',
    },
    // external sourcemaps keep the emitted JS bundle identical to a build without sourcemaps
    ...(map ? { sourcemap: 'external', outfile: resolve(resolveDir, 'bundle.js') } : {}),
    stdin: { contents, resolveDir },
  });
  const output = (suffix) => result.outputFiles.find((file) => file.path.endsWith(suffix));
  const bundle = map ? output('.js') : result.outputFiles[0];
  const raw = bundle.contents;
  const br = brotliCompressSync(raw, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  // per-file minified byte attribution excluding the synthetic <stdin> entry snippet
  const [, { inputs }] = Object.entries(result.metafile.outputs).find(([file]) => !file.endsWith('.map'));
  delete inputs['<stdin>'];
  return {
    min: raw.length,
    gz: gzipSync(raw, { level: 9 }).length,
    br: br.length,
    text: bundle.text,
    inputs: Object.fromEntries(Object.entries(inputs).map(([file, { bytesInOutput }]) => [file, bytesInOutput])),
    map: map ? JSON.parse(output('.js.map').text) : null,
  };
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

const CORE = 'native-dates (full)';

// shared target list printed by `npm run size`, checked by budget.js, and rendered by reporter.js
// headline    full core package, used for the size ceiling and headline PR delta
// diagnostic  reference row shown in All bundles without failing budget checks
// plugin      marginal bytes added when importing one plugin alongside core
// overhead    dev-only diagnostic bytes stripped in production builds
export const rowsFrom = (plugins) => [
  { label: 'import { now }', part: 'diagnostic', entry: `import { now } from 'native-dates'; console.log(now());` },
  { label: CORE, part: 'headline', entry: entryWith() },
  ...plugins.map((name) => ({ label: `plugins/${name}`, part: 'plugin', entry: entryWith([name]), beside: CORE })),
  ...(plugins.length ? [{ label: 'core + all plugins', part: 'diagnostic', entry: entryWith(plugins) }] : []),
  {
    label: 'dev-mode overhead (development vs production)',
    part: 'overhead',
    entry: entryWith(),
    dev: true,
    minus: CORE,
  },
];

function firstLine(error) {
  const first = error?.errors?.[0];
  if (first) { return `${first.location ? `${first.location.file}:${first.location.line}: ` : ''}${first.text}`; }
  return String(error?.message ?? error).split('\n')[0];
}

// builds every target for `dir`, recording per-target build errors so remaining targets still measure
export async function measureRows(dir = root) {
  const builds = {};
  const rows = [];
  for (const { label, part, entry, beside, minus, dev } of rowsFrom(pluginNames(dir))) {
    const row = { label, part, entry, ...(beside ? { beside } : {}) };
    try {
      const apart = builds[beside ?? minus];
      if ((beside || minus) && !apart) { throw new Error(`${beside ?? minus} did not build`); }
      const built = await measure(entry, dir, { dev, map: part === 'headline' || part === 'plugin' });
      // un-installed git worktrees resolve workspace packages to the parent checkout's node_modules
      const outside = Object.keys(built.inputs).find((file) => file.startsWith('..'));
      if (outside) { throw new Error(`import resolved outside ${dir} (${outside}). Run npm install in ${dir}`); }
      builds[label] = built;
      const less = (key) => built[key] - (apart ? apart[key] : 0);
      row.sizes = { min: less('min'), gz: less('gz'), br: less('br') };
      if (beside) {
        row.inputs = Object.fromEntries(
          Object.entries(built.inputs)
            .map(([file, bytes]) => [file, bytes - (apart.inputs[file] ?? 0)])
            .filter(([file, bytes]) => bytes !== 0 || !(file in apart.inputs)),
        );
      }
      else if (!minus) { row.inputs = built.inputs; }
    }
    catch (error) {
      row.error = firstLine(error);
    }
    rows.push(row);
  }
  return { rows, builds };
}

export function printRows(rows) {
  const kb = (bytes, sign = '') => `${sign}${(bytes / 1000).toFixed(2)} kB`;
  console.log('\nTarget'.padEnd(28) + 'Minified'.padStart(12) + 'Brotli (q11)'.padStart(15));
  console.log('-'.repeat(54));
  for (const { label, part, sizes, error } of rows.filter((row) => row.part !== 'overhead')) {
    const adds = part === 'plugin';
    const name = adds ? `  + ${label}` : label;
    if (error) {
      console.log(name.padEnd(27) + 'did not build'.padStart(27));
      continue;
    }
    console.log(
      name.padEnd(27) + kb(sizes.min, adds ? '+' : '').padStart(12) + kb(sizes.br, adds ? '+' : '').padStart(15),
    );
  }
  console.log('');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  printRows((await measureRows()).rows);
}
