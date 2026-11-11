// the playground's sandbox (tooling worker, service worker) into public/sandbox/, where it serves as
// static files and never enters vite's transform pipeline, as next/docs does. and, until native-dates
// is on a cdn, the libraries examples import into public/libs/: the package's own source above these
// docs, reached through the examples' import map
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
  console.log(`[site] ${from} → ${to}`);
};

const playgroundAssets = resolve(dirname(require.resolve('@semantic-ui/playground/package.json')), 'dist/assets');
await copy(playgroundAssets, resolve(pub, 'sandbox'));
await copy(resolve(root, 'src'), resolve(pub, 'libs/native-dates'));
await copy(resolve(root, 'packages/plugins/src'), resolve(pub, 'libs/plugins'));
