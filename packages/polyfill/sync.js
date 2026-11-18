// synchronous entry for CJS or bundler environments that disallow top-level await
import { Temporal } from 'temporal-polyfill';

if (!globalThis.Temporal) {
  globalThis.Temporal = Temporal;
}
