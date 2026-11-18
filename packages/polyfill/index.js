// await import() splits temporal-polyfill into a separate chunk so runtimes with native Temporal skip downloading it
if (!globalThis.Temporal) {
  const { Temporal } = await import('temporal-polyfill');
  globalThis.Temporal = Temporal;
}
