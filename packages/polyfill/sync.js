// synchronous entry for CJS or bundler environments that disallow top-level await
import { Temporal } from 'temporal-polyfill';
import { installDurationFormat } from './duration-format.js';

if (!globalThis.Temporal) {
  globalThis.Temporal = Temporal;
}
if (!Intl.DurationFormat) {
  installDurationFormat();
}
