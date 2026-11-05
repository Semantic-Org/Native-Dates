# `@native-dates`

Temporal, spoken plainly. Datetimes, dates, times, durations, and ranges built directly on the browser's `Temporal` and `Intl` APIs with zero runtime dependencies.

## Packages

- **[`@native-dates/core`](packages/core)** — Lean core (`DateTime`, `CalendarDate`, `Time`, `Duration`) plus opt-in subpath plugins (`ranges`, `tokens`, `relative`, `zones`, `loose`, `legacy-date`).
- **[`@native-dates/polyfill`](packages/polyfill)** — Loads `temporal-polyfill` only when `globalThis.Temporal` is absent.

## Commands

```bash
npm test      # run node:test suite
npm run size  # measure min + brotli-11 sizes
npm run format
```
