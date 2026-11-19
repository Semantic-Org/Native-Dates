// copies playground worker assets and workspace package sources into public/ so browser sandboxes
// resolve imports statically without entering Vite's transform pipeline
import { build } from 'esbuild';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
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

const playgroundAssets = resolve(dirname(require.resolve('@semantic-ui/playground/package.json')), 'dist/assets');
await copy(playgroundAssets, resolve(pub, 'sandbox'));
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
