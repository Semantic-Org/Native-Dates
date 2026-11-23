// runs bench/*.js in headless Chrome via tachometer, either standalone or interleaved head-vs-base
//   node tools/bench.js                             measure current working tree
//   node tools/bench.js --head <dir> --base <dir>   compare head against base (--json <dir> saves output)
//   node tools/bench.js --check                     run every op once in Node and check its answers, without a browser
//   node tools/bench.js records calendar            name bench files to run only those

import { build } from 'esbuild';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { entryWith, measure } from './size.js';

// a reader's browser sits in a zone with clock changes and reads a language, where a runner's own is UTC.
// Node fixes both at startup and Chrome on Linux takes both from its environment, so start again under them
const host = { TZ: 'Europe/Berlin', LC_ALL: 'en_US.UTF-8', LANGUAGE: 'en_US' };
if (Object.entries(host).some(([name, value]) => process.env[name] !== value)) {
  const { status } = spawnSync(process.execPath, process.argv.slice(1), {
    stdio: 'inherit',
    env: { ...process.env, ...host },
  });
  process.exit(status ?? 1);
}

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
// the tree the bench has to agree with: the base when comparing, else the only tree
const [trusted] = sides.at(-1);
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

// the runner's first pass in Node lists every failing op here, where a browser page stops at the first
const failures = globalThis.benchFailures;
// an op left unmeasured still runs, so later ops find what it built
const unmeasured = new Set(globalThis.benchUnmeasured);

for (const name of ${JSON.stringify(ops)}) {
  const check = bench.checks?.[name];
  if (!check) { throw new Error(${JSON.stringify(`bench/${file} exports no check for `)} + name); }
  if (unmeasured.has(name)) {
    try { await bench[name](); }
    catch {}
    continue;
  }
  collectGarbage();
  performance.mark(name + '-start');
  try {
    const answer = await bench[name]();
    performance.measure(name, name + '-start');
    check(answer);
  }
  catch (error) {
    if (!failures) { throw error; }
    failures[name] = error.message;
  }
}
`;

const workDir = mkdtempSync(join(tmpdir(), 'bench-'));
const resultsDir = resolve(args.json ?? join(workDir, 'results'));
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(workDir, 'package.json'), '{ "type": "module" }');

// bundles one bench file against one checkout and runs it once in Node, returning the ops that failed there
async function failuresOn([side, checkoutDir], file, ops) {
  const outfile = join(workDir, side, `${file.replace(/\.js$/, '')}.js`);
  let bundled;
  try {
    bundled = await build({
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
  }
  catch (error) {
    // an import the checkout no longer exports stops every op in the file
    return Object.fromEntries(ops.map((op) => [op, error.message]));
  }
  refuseOutsideImports(bundled.metafile, checkoutDir);
  // bench files hold the clock, which the next file and the runner must not inherit
  const clock = Date.now;
  const failed = globalThis.benchFailures = {};
  try {
    await import(pathToFileURL(outfile).href);
  }
  catch (error) {
    ops.forEach((op) => failed[op] ??= error.message);
  }
  finally {
    Date.now = clock;
    delete globalThis.benchFailures;
  }
  return failed;
}

const files = readdirSync(benchDir)
  .filter((file) => file.endsWith('.js'))
  .filter((file) => !only.length || only.includes(file.replace(/\.js$/, '')));
if (!files.length) { throw new Error(`no bench file matches ${only.join(', ')}`); }

// what the report needs beside the timings: every op planned, so one that never reports shows as missing,
// the ops left untimed because their answer changed, and the bytes each side ships
const run = {
  ops: Object.fromEntries(files.map((file) => [file.replace(/\.js$/, ''), opsIn(file)])),
  answers: {},
  bytes: null,
};
const saveRun = () => writeFileSync(join(resultsDir, 'run.json'), JSON.stringify(run));
saveRun();

// a time win that ships more bytes is a trade, so the report shows both
if (args.base) {
  try {
    const [head, base] = await Promise.all(sides.map(async ([, dir]) => (await measure(entryWith(), dir)).br));
    run.bytes = { head, base };
    console.log(`native-dates (full): ${head} B on this change, ${base} B on the base`);
  }
  catch (error) {
    console.warn(`bench: could not measure bundle bytes: ${error.message}`);
  }
  saveRun();
}

for (const file of files) {
  const name = file.replace(/\.js$/, '');
  const ops = run.ops[name];
  if (!ops.length) { throw new Error(`bench/${file} must export at least one benchmark function`); }

  const failed = {};
  for (const side of sides) {
    failed[side[0]] = await failuresOn(side, file, ops);
  }
  // the bench disagreeing with the tree it was written against is a broken bench, and stops the run
  const broken = Object.entries(failed[trusted]);
  if (broken.length) {
    throw new Error(
      `bench/${file} failed on ${trusted}:\n${broken.map(([op, message]) => `  ${op}: ${message}`).join('\n')}`,
    );
  }
  // an op that fails only on the change is left untimed for a reviewer to rule on, as the new answer may be meant
  const changed = Object.entries(args.base ? failed[sides[0][0]] : {});
  // one line per cause, as a renamed export fails every op in a file the same way
  for (const [message, entries] of Map.groupBy(changed, ([, message]) => message)) {
    const names = entries.map(([op]) => op).join(', ');
    console.warn(`bench/${file} ${names} not timed, failing on this change only: ${message}`);
  }
  const untimed = changed.map(([op]) => op);
  const timed = ops.filter((op) => !untimed.includes(op));
  if (untimed.length) {
    run.answers[name] = untimed;
    saveRun();
  }
  if (args.check) {
    console.log(
      `bench/${file}: ${timed.length} ops ran and their answers checked`
        + (untimed.length ? `, ${untimed.length} failed on this change only` : ''),
    );
    continue;
  }
  if (!timed.length) { continue; }

  for (const [side] of sides) {
    writeFileSync(
      join(workDir, side, `${name}.html`),
      `<!doctype html><script>globalThis.benchUnmeasured = ${JSON.stringify(untimed)}</script>`
        + `<script type="module" src="./${name}.js"></script>`,
    );
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
        // --expose-gc lets the page collect between ops, and --lang sets the language where Chrome reads no environment
        browser: {
          name: 'chrome',
          headless: true,
          addArguments: ['--js-flags=--expose-gc', `--lang=${host.LANGUAGE.replace('_', '-')}`],
        },
        measurement: timed.map((entryName) => ({ mode: 'performance', entryName })),
      })),
    }),
  );
  execFileSync('npx', ['tachometer', '--config', configPath, '--json-file', join(resultsDir, `${name}.json`)], {
    cwd: root,
    stdio: 'inherit',
  });
}
