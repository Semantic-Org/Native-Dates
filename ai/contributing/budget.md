---
title: Size Budget
description: Production Brotli bundle ceilings, per-PR byte limits, and bundle size rules for this package.
# the ceiling is the maintainer's. change and bug are the values docs-frame ships with, so set them for the package
change: 100
bug: 30
prose: []
bundles:
  - name: everything
    ceiling: 15000
    code: |
      import * as everything from 'native-dates';
      console.log(everything);
---

# Size Budget: Entry Bundles, Ceilings, and Rules

> The YAML frontmatter above is read by `npm run size` (`tools/gates/budget.js`), and pull requests are evaluated against the `main` branch copy so a PR cannot raise its own ceiling. Only the maintainer updates ceilings or bundle definitions.

## Package-Specific Thresholds

Every byte limit in this file is calibrated for this specific package's size and import patterns rather than copied from larger monorepos (a 200-byte increase is negligible in a 70 KB sync client and 20% of a 1 KB utility library):

- **`change`**: Maximum Brotli bytes a single PR may add to any bundle.
- **`bug`**: Growth threshold at which a `Bug:` PR fails the check.
- **`ceiling`**: Maximum total Brotli bytes allowed for that bundle.
- **`prose`**: Allowlist of human-readable strings permitted in production bundles (`{ text, why }`). Empty by default. Development error explanations are never allowlisted.

Only the ceiling above is set for this package. The maintainer gave 15 kB as the ceiling for now, written as 15,000 bytes and applied to all of `native-dates` without plugins (14,059 bytes on 2026-11-18), since core with its three plugins already measures 15,410. `change` and `bug` are the values `docs-frame` ships with, and no bundle covers a plugin or `import { now }` because none has a ceiling yet. They are not a judgment about what this package should cost. Define the remaining bundles from how the package is consumed, set each number from what the package should cost, and write the reasoning for each number here.

## Choosing What to Measure

Each entry under `bundles` models a realistic consumer import (`esbuild` minified with `__DEV__` set to `false`, compressed with Brotli quality 11):

| Package consumption model | Bundles to define |
|---|---|
| Imported as a single unit (e.g., router or client) | One bundle importing the full public barrel |
| Collection of independent functions | Individual entrypoints or common combinations, rather than `import *` |
| Distinct feature groups (e.g., formatting vs. ranges) | One bundle per group so changes in one group do not silently inflate another |
| Core plus optional plugins | Core alone plus representative core + plugin combinations |
| Code-split / lazy modules | Initial entry plus each lazy chunk (extend `tools/gates/budget.js` before relying on multi-chunk numbers) |

Each bundle snippet must reference what it imports (`console.log(...)`) so `esbuild` does not tree-shake the bundle to 0 bytes (`tools/gates/budget.js` rejects empty bundles). Add new bundle entries to `main` before opening PRs that depend on them.

## Per-PR Byte Limits by Category

| PR title category | Expected delta | Fails the Size check when |
|---|---|---|
| `Bug:` | 0 bytes | Any bundle grows by `bug` bytes or more |
| `Refactor:`, `Perf:` | 0 bytes | Any bundle grows by more than `change` bytes |
| `Build:`, `Harness:`, `Docs:`, `Test:`, `Chore:` | 0 bytes | Any bundle grows by more than `change` bytes |
| `Feat:` | ~0 bytes unless priced via `Expected bytes: <N>` in the PR body | Any bundle grows by more than `change` bytes |
| Any category | None | Any bundle exceeds its `ceiling` or contains unallowlisted dev prose |

## Budget Rules

1. **Default expected growth is ~0 bytes.** Unpriced features are expected to be near zero bytes.
2. **Justify deltas against expected cost, not remaining ceiling headroom.** Landing above `Expected bytes:` requires a line-by-line explanation.
3. **Thresholds catch regressions rather than setting spending targets.** Aim for 0 bytes on fixes and minimal bytes on features.
4. **Bug fixes aim for 0 bytes.** Small targeted fixes are normal. Large byte increases require a high-severity bug and maintainer sign-off.
5. **Raising a ceiling for one feature does not create slack for unrelated additions.**
6. **Optional conveniences belong in plugins** (`@native-dates/plugins/*`) unless nearly every consumer needs them on initial load.
7. **Strip diagnostic prose from production builds.** Gate error explanations inline with `isDevelopment ? '...' : 0` (`ai/contributing/standards/legibility/errors-and-logs.md`). `tools/gates/budget.js` parses both development (`__DEV__: 'true'`) and production (`__DEV__: 'false'`) bundle ASTs and fails if dev prose disappears from dev builds or survives in production builds outside `prose`.

## When a Change Exceeds the Budget

1. **Tighten the implementation.** First drafts almost always have avoidable byte overhead.
2. **Move optional behavior to a plugin** so only callers who import it pay the bytes.
3. **Price the feature up front.** Open an issue with the byte cost and value tradeoff to get maintainer agreement before coding.
4. **Drop the change** if its bundle cost outweighs its value to users.
