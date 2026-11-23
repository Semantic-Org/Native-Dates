// runs bench/*.js in headless Chrome via tachometer, either standalone or interleaved head-vs-base
//   node tools/bench.js                             measure current working tree
//   node tools/bench.js --head <dir> --base <dir>   compare head against base (--json <dir> saves output)
//   node tools/bench.js --check                     run every op once in Node and check its answers, without a browser
//   node tools/bench.js records calendar            name bench files to run only those

import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args, positionals: only } = parseArgs({
  allowPositionals: true,
  options: {
    head: { type: 'string', default: root },
    base: { type: 'string' },
    json: { type: 'string' },
    check: { type: 'boolean', default: false },
  },
});

const sides = args.base
  ? [['this-change', resolve(args.head)], ['tip-of-tree', resolve(args.base)]]
  : [['this-tree', resolve(args.head)]];
const benchDir = join(root, 'bench');
const sampling = JSON.parse(readFileSync(join(benchDir, 'tachometer.json'), 'utf8'));

// resolve bare package imports from the target checkout so head and base bundle their own code
const resolveFromCheckout = (checkoutDir) => ({
  name: 'resolve-from-checkout',
  setup({ onResolve, resolve: find }) {
    onResolve(
      { filter: /^[^./]/ },
      ({ path, kind, pluginData }) =>
        pluginData?.resolved ? null : find(path, { kind, resolveDir: checkoutDir, pluginData: { resolved: true } }),
    );
  },
});

const isInside = (file, dir) => !relative(dir, file).startsWith('..');

// un-installed git worktrees resolve workspace packages to the parent checkout's node_modules
function refuseOutsideImports(metafile, checkoutDir) {
  const outside = Object.keys(metafile.inputs)
    .map((input) => resolve(checkoutDir, input))
    .find((file) => !isInside(file, checkoutDir) && !isInside(file, benchDir));
  if (outside) {
    throw new Error(`import resolved outside ${checkoutDir} (${outside}). Run npm install in ${checkoutDir}`);
  }
}

// an op is an exported function declaration, measured in the order its file declares them
const OP = /^export\s+(?:async\s+)?function\s+([\w$]+)/gm;
const opsIn = (file) => [...readFileSync(join(benchDir, file), 'utf8').matchAll(OP)].map(([, op]) => op);

// a full GC before each op keeps one op's allocations out of the next, and each answer is checked after its
// measure so a faster but wrong change fails instead of reading as a win
const benchmarkPage = (file, ops) =>
  `import * as bench from ${JSON.stringify(join(benchDir, file))};

function collectGarbage() {
  if (!globalThis.gc) { return; }
  try { globalThis.gc({ type: 'major', execution: 'sync', flavor: 'last-resort' }); }
  catch { globalThis.gc(); }
}

for (const name of ${JSON.stringify(ops)}) {
  const check = bench.checks?.[name];
  if (!check) { throw new Error(${JSON.stringify(`bench/${file} exports no check for `)} + name); }
  collectGarbage();
  performance.mark(name + '-start');
  const answer = await bench[name]();
  performance.measure(name, name + '-start');
  check(answer);
}
`;

const workDir = mkdtempSync(join(tmpdir(), 'bench-'));
const resultsDir = resolve(args.json ?? join(workDir, 'results'));
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(workDir, 'package.json'), '{ "type": "module" }');

const files = readdirSync(benchDir)
  .filter((file) => file.endsWith('.js'))
  .filter((file) => !only.length || only.includes(file.replace(/\.js$/, '')));
if (!files.length) { throw new Error(`no bench file matches ${only.join(', ')}`); }

for (const file of files) {
  const name = file.replace(/\.js$/, '');
  const ops = opsIn(file);
  if (!ops.length) { throw new Error(`bench/${file} must export at least one benchmark function`); }

  for (const [side, checkoutDir] of sides) {
    const outfile = join(workDir, side, `${name}.js`);
    const bundled = await build({
      stdin: { contents: benchmarkPage(file, ops), resolveDir: benchDir },
      bundle: true,
      format: 'esm',
      outfile,
      metafile: true,
      absWorkingDir: checkoutDir,
      define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false' },
      plugins: [resolveFromCheckout(checkoutDir)],
      logLevel: 'silent',
    });
    refuseOutsideImports(bundled.metafile, checkoutDir);
    // a page that throws records no measure and tachometer only reports a timeout, so run it here first for the message
    try {
      await import(pathToFileURL(outfile).href);
    }
    catch (error) {
      throw new Error(`bench/${file} failed on ${side}: ${error.message}`, { cause: error });
    }
    writeFileSync(
      join(workDir, side, `${name}.html`),
      `<!doctype html><script type="module" src="./${name}.js"></script>`,
    );
  }
  if (args.check) {
    console.log(`bench/${file}: ${ops.length} ops ran and their answers checked`);
    continue;
  }

  const configPath = join(workDir, `${name}.json`);
  writeFileSync(
    configPath,
    JSON.stringify({
      root: '.',
      ...sampling,
      benchmarks: sides.map(([side]) => ({
        name: side,
        url: `${side}/${name}.html`,
        // required so globalThis.gc() is exposed for inter-op heap cleanup
        browser: { name: 'chrome', headless: true, addArguments: ['--js-flags=--expose-gc'] },
        measurement: ops.map((entryName) => ({ mode: 'performance', entryName })),
      })),
    }),
  );
  execFileSync('npx', ['tachometer', '--config', configPath, '--json-file', join(resultsDir, `${name}.json`)], {
    cwd: root,
    stdio: 'inherit',
  });
}
