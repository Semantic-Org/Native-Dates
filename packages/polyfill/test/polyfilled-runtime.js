// stands in for a runtime that never had Temporal, such as Safari, before a test file loads
delete globalThis.Temporal;
delete Date.prototype.toTemporalInstant;

await import('@native-dates/polyfill');

// temporal-polyfill hands back the runtime's own Temporal when it loads while one is present
if (String(Temporal.Now.instant).includes('[native code]')) {
  throw new Error('the polyfill project is running on the Temporal of the runtime');
}
