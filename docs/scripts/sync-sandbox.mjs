// copies playground worker assets and workspace package sources into public/ so browser sandboxes
// resolve imports statically without entering Vite's transform pipeline
import { build } from 'esbuild';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../public');
const root = resolve(here, '../..');

const copy = async (from, to) => {
  await fs.rm(to, { recursive: true, force: true });
  await fs.cp(from, to, { recursive: true });
  console.log(`[site] ${from} -> ${to}`);
};

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf-8'));

// build virtual /node_modules declarations for the workspace packages so the playground
// TypeScript service resolves native-dates and plugin imports without external fetches
const buildTypesBundle = async () => {
  const files = {};
  const addTypesDir = async (pkgName, dir, prefix) => {
    const entries = (await fs.readdir(dir, { recursive: true }))
      .map((entry) => entry.split(sep).join('/'))
      .filter((entry) => entry.endsWith('.d.ts'))
      .sort();
    for (const entry of entries) {
      files[`/node_modules/${pkgName}/${prefix}/${entry}`] = await fs.readFile(resolve(dir, entry), 'utf-8');
    }
  };
  const addPackageJson = (pkg, overrides = {}) => {
    files[`/node_modules/${pkg.name}/package.json`] = JSON.stringify({
      name: pkg.name,
      version: pkg.version,
      type: pkg.type,
      ...overrides,
      ...(pkg.exports ? { exports: pkg.exports } : {}),
    });
  };

  const mainPkg = await readJson(resolve(root, 'package.json'));
  addPackageJson(mainPkg, { types: './types/index.d.ts' });
  await addTypesDir(mainPkg.name, resolve(root, 'types'), 'types');

  const coreDir = resolve(root, 'packages/core');
  const corePkg = await readJson(resolve(coreDir, 'package.json'));
  addPackageJson(corePkg, { types: './index.d.ts' });
  files[`/node_modules/${corePkg.name}/index.d.ts`] = await fs.readFile(resolve(coreDir, 'index.d.ts'), 'utf-8');

  const pluginsDir = resolve(root, 'packages/plugins');
  const pluginsPkg = await readJson(resolve(pluginsDir, 'package.json'));
  addPackageJson(pluginsPkg);
  await addTypesDir(pluginsPkg.name, resolve(pluginsDir, 'types'), 'types');

  const polyfillDir = resolve(root, 'packages/polyfill');
  const polyfillPkg = await readJson(resolve(polyfillDir, 'package.json'));
  addPackageJson(polyfillPkg, { types: './index.d.ts' });
  files[`/node_modules/${polyfillPkg.name}/index.d.ts`] = await fs.readFile(
    resolve(polyfillDir, 'index.d.ts'),
    'utf-8',
  );

  const out = resolve(pub, 'sandbox/chunks/types.json');
  const json = JSON.stringify(files);
  await fs.writeFile(out, json);
  console.log(`[site] types.json -> ${out} (${(Buffer.byteLength(json) / 1024).toFixed(1)} KB, ${Object.keys(files).length} files)`);
};

const playgroundAssets = resolve(dirname(require.resolve('@semantic-ui/playground/package.json')), 'dist/assets');
await copy(playgroundAssets, resolve(pub, 'sandbox'));
await buildTypesBundle();
await copy(resolve(root, 'src'), resolve(pub, 'libs/native-dates'));
await copy(resolve(root, 'packages/plugins/src'), resolve(pub, 'libs/plugins'));
await copy(resolve(root, 'packages/polyfill'), resolve(pub, 'libs/polyfill'));

// bundle temporal-polyfill into a single ESM file so the playground import map needs only one entry
const polyfill = resolve(pub, 'libs/temporal-polyfill.js');
await build({
  entryPoints: [require.resolve('temporal-polyfill')],
  bundle: true,
  format: 'esm',
  minify: true,
  outfile: polyfill,
  logLevel: 'silent',
});
console.log(`[site] temporal-polyfill -> ${polyfill}`);
