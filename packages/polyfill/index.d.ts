/**
 * Side-effect entry that installs `temporal-polyfill` onto `globalThis.Temporal` only when the
 * runtime lacks native `Temporal` support (Safari, older browsers, and Node 24–25; Node 26+ ships
 * `Temporal` natively).
 *
 * - `@native-dates/polyfill` loads the polyfill asynchronously via `await import()`, so runtimes
 *   with native `Temporal` skip downloading it.
 * - `@native-dates/polyfill/sync` loads the polyfill synchronously for modules that evaluate dates
 *   at import time or bundlers that disallow top-level `await`.
 *
 * @see {@link https://nativedates.dev/guides/installation/ Installation}
 */
export {};
