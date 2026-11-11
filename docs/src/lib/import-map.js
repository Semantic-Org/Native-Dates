// what an example's bare imports resolve to in the preview: the package's own source, copied into
// public/libs/ by scripts/sync-sandbox.mjs until it is on a cdn. the plugins import core's helpers
// by name (native-dates/helpers/zones), and an import map can't add the .js, so each one is listed
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { PACKAGE_DIR, shippedPlugins } from './sizes.js';

const helpers = readdirSync(resolve(PACKAGE_DIR, 'src/helpers')).map((file) => file.replace(/\.js$/, ''));

export const IMPORT_MAP = {
  imports: {
    'native-dates': '/libs/native-dates/index.js',
    ...Object.fromEntries(helpers.map((name) => [`native-dates/helpers/${name}`, `/libs/native-dates/helpers/${name}.js`])),
    ...Object.fromEntries(shippedPlugins().map((name) => [`@native-dates/plugins/${name}`, `/libs/plugins/${name}.js`])),
  },
};
