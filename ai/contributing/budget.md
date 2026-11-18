---
title: Size Budget
description: The Brotli ceiling on native-dates, the sizes a pull request is read at, and the bundle size rules for this package.
# every number the size check and the bundle bot run on, each the maintainer's
ceiling: 15000
sizes:
  bug sized: 50
  small feature sized: 100
  feature sized: 250
  large feature sized: 500
prose: []
---

# Size Budget: Rows, the Ceiling, and Rules

> The YAML frontmatter above is read by `npm run size` (`tools/gates/budget.js`), and pull requests are evaluated against the `main` branch copy so a PR cannot raise its own ceiling. Only the maintainer updates the ceiling, the sizes or the rows.

## Package-Specific Thresholds

Every byte limit in this file is calibrated for this specific package's size and import patterns rather than copied from larger monorepos (a 200-byte increase is negligible in a 70 KB sync client and 20% of a 1 KB utility library):

- **`ceiling`**: Maximum total Brotli bytes allowed for all of `native-dates` without plugins.
- **`sizes`**: The edge of each size the bundle bot names a pull request by, in Brotli bytes added to all of `native-dates`. A `Bug:` PR fails the check at the first edge, and any PR fails past the last.
- **`prose`**: Allowlist of human-readable strings permitted in production bundles (`{ text, why }`). Empty by default. Development error explanations are never allowlisted.

The ceiling and the four sizes above are the maintainer's. He gave 15 kB as the ceiling for now, written as 15,000 bytes and applied to all of `native-dates` without plugins (14,063 bytes on 2026-11-18), since core with its three plugins already measures 15,412. He ruled the sizes on 2026-11-18: the sizes of the bot in the sync repo at about a fifth, as a 15,000 byte ceiling is to its 75 KB gate, checked against what landed here that month (a second spelling 10 bytes, a guard 19 to 30, a week that starts by locale 70, named formats about 80, reading an `Accept-Language` header 130, relative time 290, a locale on every value 320), with `bug sized` raised from 30 to 50. No size sits above 500, since about 940 bytes is all that is left under the ceiling. A `Bug:` PR is red at the edge of `bug sized`, as the sync bot ties the two together.

## Choosing What to Measure

The rows are `rowsFrom` in `tools/size.js`, each a realistic consumer import (`esbuild` minified with `NODE_ENV` set to `production`, compressed with Brotli quality 11), and each carries the part it plays in the pull request comment:

| Row | What it is | Part |
|---|---|---|
| `import { now }` | An app that imports one factory | Shown with every other row, never judged |
| `native-dates (full)` | All of `native-dates` without plugins | The ceiling, the sizes and the comment's title |
| `plugins/<name>` | What a plugin adds to an app that already has all of `native-dates`, one row per file in `packages/plugins/src` | Listed when it changed, never fails the check |
| `core + all plugins` | All of `native-dates` with every plugin | Shown with every other row, never judged |

Each row's snippet must reference what it imports (`console.log(...)`) so `esbuild` does not tree-shake the bundle to 0 bytes. A new plugin gets its row with no edit.

## Per-PR Byte Limits by Category

| PR title category | Expected delta | Fails the Bundle Size check when |
|---|---|---|
| `Bug:` | 0 bytes | `native-dates (full)` grows by the edge of `bug sized` or more |
| `Refactor:`, `Perf:` | 0 bytes | `native-dates (full)` grows past the edge of `large feature sized` |
| `Build:`, `Harness:`, `Docs:`, `Test:`, `Chore:` | 0 bytes | `native-dates (full)` grows past the edge of `large feature sized` |
| `Feat:` | ~0 bytes in `native-dates (full)`, since features are generally implemented as plugins, unless priced via `Expected bytes: <N>` in the PR body | `native-dates (full)` grows past the edge of `large feature sized` |
| Any category | None | `native-dates (full)` exceeds the `ceiling`, or it or a plugin contains unallowlisted dev prose |

## Budget Rules

1. **Default expected growth is ~0 bytes.** Unpriced features are expected to be near zero bytes.
2. **Justify deltas against expected cost, not remaining ceiling headroom.** Landing above `Expected bytes:` requires a line-by-line explanation.
3. **Thresholds catch regressions rather than setting spending targets.** Aim for 0 bytes on fixes and minimal bytes on features.
4. **Bug fixes aim for 0 bytes.** Small targeted fixes are normal. Large byte increases require a high-severity bug and maintainer sign-off.
5. **Raising a ceiling for one feature does not create slack for unrelated additions.**
6. **Optional conveniences belong in plugins** (`@native-dates/plugins/*`) unless nearly every consumer needs them on initial load.
7. **Strip diagnostic prose from production builds.** Gate error explanations inline with `isDevelopment ? '...' : 0` (`ai/contributing/standards/legibility/errors-and-logs.md`). `tools/gates/budget.js` parses both development (`NODE_ENV: 'development'`) and production (`NODE_ENV: 'production'`) bundle ASTs and fails if dev prose disappears from dev builds or survives in production builds outside `prose`.

## When a Change Exceeds the Budget

1. **Tighten the implementation.** First drafts almost always have avoidable byte overhead.
2. **Move optional behavior to a plugin** so only callers who import it pay the bytes.
3. **Price the feature up front.** Open an issue with the byte cost and value tradeoff to get maintainer agreement before coding.
4. **Drop the change** if its bundle cost outweighs its value to users.
