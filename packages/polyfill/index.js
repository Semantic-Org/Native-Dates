// runtimes that already ship Temporal skip downloading the polyfill chunk
if (!globalThis.Temporal) {
  const { Temporal } = await import('temporal-polyfill');
  globalThis.Temporal = Temporal;
}
