import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { entryWith, measure, pluginNames } from '../../../tools/size.js';

// resolve from cwd instead of import.meta.url because Astro bundles this module into .astro/
export const PACKAGE_DIR = resolve('..');
const cache = new Map();

// bundle the full plugin set together because plugins share core helpers that deduplicate in esbuild
export function sizeWith(plugins = []) {
  if (!existsSync(resolve(PACKAGE_DIR, 'src/index.js'))) {
    throw new Error(`native-dates source not found at ${PACKAGE_DIR}. Build the docs from docs/ in the repo.`);
  }
  const key = [...plugins].sort().join(',');
  if (!cache.has(key)) {
    cache.set(key, measure(entryWith(key ? key.split(',') : []), PACKAGE_DIR).then((size) => size.br));
  }
  return cache.get(key);
}

export async function sizeOf(name) {
  const core = await sizeWith();
  return name === 'core' ? core : await sizeWith([name]) - core;
}

export const shippedPlugins = () => pluginNames(PACKAGE_DIR);

export const formatSize = (bytes) => (bytes == null ? null : `${(bytes / 1000).toFixed(1)} kB`);
