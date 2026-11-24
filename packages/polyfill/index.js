// await import() splits polyfills into lazy chunks so runtimes with native support skip downloading them
if (!globalThis.Temporal) {
  const { Temporal } = await import('temporal-polyfill');
  globalThis.Temporal = Temporal;
}
if (!Intl.DurationFormat) {
  const { installDurationFormat } = await import('./duration-format.js');
  installDurationFormat();
}
