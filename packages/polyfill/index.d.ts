/**
 * Side-effect entry that installs `temporal-polyfill` onto `globalThis.Temporal` and an
 * `Intl.DurationFormat` fallback onto `Intl` only when the runtime lacks native support (Safari,
 * older browsers, and Node 22–25; Node 26+ ships both natively).
 *
 * - `@native-dates/polyfill` loads each polyfill asynchronously via `await import()`, so runtimes
 *   with native support skip downloading them.
 * - `@native-dates/polyfill/sync` loads both polyfills synchronously for modules that evaluate
 *   dates at import time or bundlers that disallow top-level `await`.
 *
 * @see {@link https://nativedates.dev/guides/installation/ Installation}
 */
export {};
