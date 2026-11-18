// measures production minified, gzip and Brotli-11 sizes for core, a named import, what each plugin adds, and all plugins

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
    // an external map leaves the bundle byte for byte what it is without one
    ...(map ? { sourcemap: 'external', outfile: resolve(resolveDir, 'bundle.js') } : {}),
    stdin: { contents, resolveDir },
  });
  const output = (suffix) => result.outputFiles.find((file) => file.path.endsWith(suffix));
  const bundle = map ? output('.js') : result.outputFiles[0];
  const raw = bundle.contents;
  const br = brotliCompressSync(raw, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  // minified bytes each source file left in the bundle, without the measured snippet itself
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

/*
  the rows, defined once: this script prints them, tools/gates/budget.js judges them, and the
  bundle bot's reporter (tools/ci/bundle) reads the part each plays in the pull request comment
    headline    all of native-dates. the ceiling's number and the comment's title
    diagnostic  shown with every other row and never judged
    plugin      what a plugin adds to an app that already has all of native-dates
    overhead    the development text a production build folds out, a health line and never a row
*/
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

// esbuild's first message with its place, or an error's first line
function firstLine(error) {
  const first = error?.errors?.[0];
  if (first) { return `${first.location ? `${first.location.file}:${first.location.line}: ` : ''}${first.text}`; }
  return String(error?.message ?? error).split('\n')[0];
}

// every row of the tree at dir, and the builds behind them for the checks that read a bundle's text.
// a row that does not build is recorded with its error and the others are still measured
export async function measureRows(dir = root) {
  const builds = {};
  const rows = [];
  for (const { label, part, entry, beside, minus, dev } of rowsFrom(pluginNames(dir))) {
    const row = { label, part, entry, ...(beside ? { beside } : {}) };
    try {
      const apart = builds[beside ?? minus];
      if ((beside || minus) && !apart) { throw new Error(`${beside ?? minus} did not build`); }
      const built = await measure(entry, dir, { dev, map: part === 'headline' || part === 'plugin' });
      // without its own install a worktree resolves native-dates to the checkout above it
      const outside = Object.keys(built.inputs).find((file) => file.startsWith('..'));
      if (outside) { throw new Error(`an import resolved outside this tree, to ${outside}. Run npm install in it`); }
      builds[label] = built;
      const less = (key) => built[key] - (apart ? apart[key] : 0);
      row.sizes = { min: less('min'), gz: less('gz'), br: less('br') };
      // a plugin's files are what each adds to the bundle beside core
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
