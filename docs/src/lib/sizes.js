// min+br sizes, measured at build from the package above these docs with the package's own recipe
// (tools/size.js, which `npm run size` prints), so the site's numbers are the package's.

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { entryWith, measure, pluginNames } from '../../../tools/size.js';

// from the working directory, not this file: the build bundles this module elsewhere
export const PACKAGE_DIR = resolve('..');
const cache = new Map();

// all of core with a set of plugins, as an app that imports them ships it. plugins share helpers
// with core and with each other, so a set is measured whole, never summed from its parts
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

// 'core' is everything native-dates exports. a plugin is what it adds to that
// a size that can't be measured fails the build: a stale or missing number is worse than none
export async function sizeOf(name) {
  const core = await sizeWith();
  return name === 'core' ? core : await sizeWith([name]) - core;
}

// the plugins the package ships, read from its folder
export const shippedPlugins = () => pluginNames(PACKAGE_DIR);

export const formatSize = (bytes) => (bytes == null ? null : `${(bytes / 1000).toFixed(1)} kB`);
