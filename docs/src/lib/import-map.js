import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { PACKAGE_DIR, shippedPlugins } from './sizes.js';

// maps bare specifiers in sandbox previews to /libs/* populated by scripts/sync-sandbox.mjs.
// Plugins import native-dates/helpers/* without extensions, so each helper must be mapped explicitly
const helpers = readdirSync(resolve(PACKAGE_DIR, 'src/helpers')).map((file) => file.replace(/\.js$/, ''));

export const IMPORT_MAP = {
  imports: {
    'native-dates': '/libs/native-dates/index.js',
    ...Object.fromEntries(helpers.map((name) => [`native-dates/helpers/${name}`, `/libs/native-dates/helpers/${name}.js`])),
    ...Object.fromEntries(shippedPlugins().map((name) => [`@native-dates/plugins/${name}`, `/libs/plugins/${name}.js`])),
    '@native-dates/polyfill': '/libs/polyfill/index.js',
    'temporal-polyfill': '/libs/temporal-polyfill.js',
  },
};
