// runs bench/*.js in headless Chrome via tachometer, either standalone or interleaved head-vs-base

import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const listSuites = (benchDir = join(root, 'bench')) =>
  existsSync(benchDir)
    ? readdirSync(benchDir)
      .filter((file) => file.endsWith('.js'))
      .map((file) => file.replace(/\.js$/, ''))
      .sort()
    : [];

// resolve bare package specifiers from checkoutDir so head and base each bundle their own sources
export const resolveFromCheckout = (checkoutDir) => ({
  name: 'resolve-from-checkout',
  setup({ onResolve, resolve: find }) {
    onResolve(
      { filter: /^[^./]/ },
      ({ path, kind, pluginData }) =>
        pluginData?.resolved ? null : find(path, { kind, resolveDir: checkoutDir, pluginData: { resolved: true } }),
    );
  },
});

function verifyInputs(metafile, checkoutDir, benchDir) {
  const checkoutRoot = resolve(checkoutDir);
  const benchRoot = resolve(benchDir);
  const inputs = [];
  for (const input of Object.keys(metafile.inputs)) {
    if (input === '<stdin>') { continue; }
    const abs = resolve(checkoutRoot, input);
    if (abs === benchRoot || abs.startsWith(`${benchRoot}/`)) { continue; }
    if (!abs.startsWith(`${checkoutRoot}/`)) {
      throw new Error(`import resolved outside ${checkoutRoot} (${input}). Run npm install in ${checkoutRoot}`);
    }
    const rel = relative(checkoutRoot, abs);
    // omit installed third-party packages from git diff inputs since lockfile changes already select all suites
    if (rel.startsWith('node_modules/')) { continue; }
    inputs.push(rel);
  }
  return inputs.sort();
}

export async function inspectSuite(suiteFile, checkoutDir = root, { benchDir = dirname(suiteFile) } = {}) {
  const resolvedCheckout = resolve(checkoutDir);
  const result = await build({
    entryPoints: [resolve(suiteFile)],
    bundle: true,
    format: 'esm',
    write: false,
    metafile: true,
    absWorkingDir: resolvedCheckout,
    define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false' },
    plugins: [resolveFromCheckout(resolvedCheckout)],
    logLevel: 'silent',
  });
  // preserve declaration order from bench source while confirming esbuild exported each function
  const exported = new Set(Object.values(result.metafile.outputs)[0]?.exports ?? []);
  const source = readFileSync(suiteFile, 'utf8');
  const declared = [
    ...new Set([...source.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)].map(([, name]) => name)),
  ];
  const exports = declared.filter((name) => exported.has(name));
  if (!exports.length) {
    throw new Error(`${suiteFile} must export at least one benchmark function`);
  }
  const inputs = verifyInputs(result.metafile, resolvedCheckout, benchDir);
  return { exports, inputs };
}

// force a synchronous full GC before each op so allocations in earlier ops do not skew later ops
const benchmarkPage = (suiteFile, opNames) =>
  `import * as ops from ${JSON.stringify(resolve(suiteFile))};

function collectGarbage() {
  if (!globalThis.gc) { return; }
  try { globalThis.gc({ type: 'major', execution: 'sync', flavor: 'last-resort' }); }
  catch { globalThis.gc(); }
}

for (const name of ${JSON.stringify(opNames)}) {
  collectGarbage();
  performance.mark(name + '-start');
  await ops[name]();
  performance.measure(name, name + '-start');
}
`;

export async function bundleSuiteSide({ suiteFile, benchDir = dirname(suiteFile), checkoutDir, outfile, opNames }) {
  const resolvedCheckout = resolve(checkoutDir);
  const resolvedOut = resolve(outfile);
  const names = opNames ?? (await inspectSuite(suiteFile, resolvedCheckout, { benchDir })).exports;
  const result = await build({
    stdin: { contents: benchmarkPage(suiteFile, names), resolveDir: resolve(benchDir) },
    bundle: true,
    format: 'esm',
    outfile: resolvedOut,
    metafile: true,
    absWorkingDir: resolvedCheckout,
    define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false' },
    plugins: [resolveFromCheckout(resolvedCheckout)],
    logLevel: 'silent',
  });
  const inputs = verifyInputs(result.metafile, resolvedCheckout, benchDir);
  const htmlFile = resolvedOut.replace(/\.js$/, '.html');
  const scriptName = resolvedOut.split('/').pop();
  writeFileSync(htmlFile, `<!doctype html><script type="module" src="./${scriptName}"></script>`);
  return { exports: names, inputs, htmlFile };
}

const CHROME_CANDIDATES = [
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

// pin a DST-observing zone and English locale so headless Chrome runs identical paths across UTC CI VMs and laptops
const HOST_ENV = { TZ: 'Europe/Berlin', LC_ALL: 'en_US.UTF-8', LANGUAGE: 'en_US' };

function detectChromeMajor() {
  for (const bin of CHROME_CANDIDATES) {
    try {
      const out = execFileSync(bin, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const match = /(\d+)\./.exec(out);
      if (match) { return match[1]; }
    }
    catch {
      continue;
    }
  }
  return '';
}

// tachometer otherwise installs chromedriver@* on demand, which fails whenever npm latest leads the installed Chrome
function ensureChromedriver(repoRoot) {
  const major = detectChromeMajor();
  if (!major) { return; }
  const tachometerDir = join(repoRoot, 'node_modules/tachometer');
  const candidates = [
    join(tachometerDir, 'node_modules/chromedriver/package.json'),
    join(repoRoot, 'node_modules/chromedriver/package.json'),
  ];
  for (const pkgPath of candidates) {
    if (!existsSync(pkgPath)) { continue; }
    const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version ?? '';
    if (version.startsWith(`${major}.`)) { return; }
  }
  console.log(`Installing chromedriver@${major} in node_modules/tachometer to match local Chrome ${major}...`);
  execFileSync('npm', ['install', `chromedriver@${major}`, '--no-save', '--no-audit', '--no-fund'], {
    cwd: tachometerDir,
    stdio: 'inherit',
  });
}

function resolveGitSha(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  }
  catch {
    return '';
  }
}

export async function runBenchmarks({
  headDir = root,
  baseDir = '',
  benchDir = join(root, 'bench'),
  suites = [],
  baseSha = '',
  sampleSize = null,
  jsonDir = '',
} = {}) {
  const resolvedBenchDir = resolve(benchDir);
  const available = listSuites(resolvedBenchDir);
  if (!available.length) {
    throw new Error(`no benchmark files found in ${resolvedBenchDir}`);
  }
  const selected = suites.length ? suites : available;
  for (const suite of selected) {
    if (!available.includes(suite)) {
      throw new Error(`unknown benchmark suite '${suite}'. Available: ${available.join(', ')}`);
    }
  }

  const sides = baseDir
    ? [['this-change', resolve(headDir)], ['tip-of-tree', resolve(baseDir)]]
    : [['this-tree', resolve(headDir)]];

  const sampling = JSON.parse(readFileSync(join(resolvedBenchDir, 'tachometer.json'), 'utf8'));
  if (sampleSize !== null) {
    sampling.sampleSize = sampleSize;
  }
  // skip pairwise cross-op auto-sampling when running standalone or at a pinned sample count
  if (!baseDir || sampleSize !== null) {
    sampling.timeout = 0;
  }

  ensureChromedriver(root);

  const workDir = mkdtempSync(join(tmpdir(), 'bench-'));
  const resultsDir = jsonDir ? resolve(jsonDir) : join(workDir, 'results');
  mkdirSync(resultsDir, { recursive: true });

  const binDir = resolve(root, 'node_modules/.bin');
  const tachometerBin = join(binDir, 'tachometer');
  const env = { ...process.env, ...HOST_ENV, PATH: `${binDir}:${process.env.PATH ?? ''}` };

  try {
    for (const suite of selected) {
      const suiteFile = join(resolvedBenchDir, `${suite}.js`);
      const { exports: opNames } = await inspectSuite(suiteFile, sides[0][1], { benchDir: resolvedBenchDir });

      for (const [side, checkoutDir] of sides) {
        await bundleSuiteSide({
          suiteFile,
          benchDir: resolvedBenchDir,
          checkoutDir,
          outfile: join(workDir, side, `${suite}.js`),
          opNames,
        });
      }

      const configPath = join(workDir, `${suite}.json`);
      writeFileSync(
        configPath,
        JSON.stringify({
          root: '.',
          ...sampling,
          benchmarks: sides.map(([side]) => ({
            name: side,
            url: `${side}/${suite}.html`,
            // expose globalThis.gc() for inter-op major GC and pin browser language alongside TZ
            browser: {
              name: 'chrome',
              headless: true,
              addArguments: ['--js-flags=--expose-gc', '--lang=en-US'],
            },
            measurement: opNames.map((entryName) => ({ mode: 'performance', entryName })),
          })),
        }),
      );

      execFileSync(tachometerBin, ['--config', configPath, '--json-file', join(resultsDir, `${suite}.json`)], {
        cwd: workDir,
        env,
        stdio: 'inherit',
      });
    }

    if (baseDir && jsonDir) {
      const resolvedBaseSha = baseSha || resolveGitSha(resolve(baseDir));
      if (resolvedBaseSha) {
        writeFileSync(join(resultsDir, 'baseline-sha.txt'), `${resolvedBaseSha}\n`);
      }
    }
  }
  finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      head: { type: 'string', default: root },
      base: { type: 'string', default: '' },
      'bench-dir': { type: 'string', default: join(root, 'bench') },
      suite: { type: 'string', default: '' },
      'base-sha': { type: 'string', default: '' },
      'sample-size': { type: 'string' },
      json: { type: 'string', default: '' },
    },
  });
  const suites = values.suite
    ? values.suite.split(',').map((name) => name.trim()).filter(Boolean)
    : [];
  const sampleSize = values['sample-size'] !== undefined ? Number(values['sample-size']) : null;
  await runBenchmarks({
    headDir: values.head,
    baseDir: values.base,
    benchDir: values['bench-dir'],
    suites,
    baseSha: values['base-sha'],
    sampleSize,
    jsonDir: values.json,
  });
}
