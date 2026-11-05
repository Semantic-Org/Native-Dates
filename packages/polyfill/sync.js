import { Temporal } from 'temporal-polyfill';

if (!globalThis.Temporal) {
  globalThis.Temporal = Temporal;
}
