# skills/legibility — authoring legible code, prose, traces, tests, and folders

Standing craft instructions for shifting from raw model defaults to the repository's legibility standards across code structures, developer-facing error and log prose, DevTools timeline and wire traces, test suites, and package directory layouts.

Load the specific skill that matches the surface you are touching, alongside the maintainer's pedagogical lesson ledgers in [`../../legibility/naming-lessons.md`](../../legibility/naming-lessons.md) and [`../../legibility/simplicity-lessons.md`](../../legibility/simplicity-lessons.md):

| skill | load it when |
|---|---|
| [`code-structures.md`](code-structures.md) | designing or refactoring classes, method signatures, option bags, loops, or internal mechanisms in `packages/*/src/`. Stateful domain classes over procedural function bags, lowercase `static` registries, class anatomy & section banners, stage decomposition, `@semantic-ui/utils` idioms (`each` vs. `for-of`, guards, `isServer`), and callsite-first naming. |
| [`errors-and-logs.md`](errors-and-logs.md) | minting or editing any thrown error, `checkOptions` hint, `copy` table entry, `warn` / `warnOnce` / `info` / `logError` call, or fault tooltip. Client `isDevelopment` fold vs. server inline `createErrors` wrapper, parent-caught server throws, `. Capital` (`fadeSecondary`) split, callsite verification, conceptual SNR, and `npm run errors` / `npm run size`. |
| [`traces-and-timelines.md`](traces-and-timelines.md) | adding or editing any `measureTimeline` / `markTimeline` span, fault `DESCRIPTIONS` entry, `sync.trace` wire annotation (`_meta`), `<sync-hud>` tooltip, or multi-peer ASCII sequence diagram. |
| [`tests-and-test-names.md`](tests-and-test-names.md) | writing or updating test assertions on errors or warnings, naming `describe()` or `test()` / `it()` blocks, or placing/naming test files under `packages/*/test/` or `tests/`. Asserting `error.code` + `error.at` instead of pinning dev-essay prose, the 5 declined substring-assertion edges, and behavioral CI test naming. |
| [`folders-and-filenames.md`](folders-and-filenames.md) | adding, moving, splitting, or renaming files or folders in `packages/*/src/`, `packages/*/test/`, or `tests/`, or configuring `package.json` `"imports"`. Package-internal `#` subpath imports vs. sibling `./` imports, category-grouped `helpers/`, subfolder entropy thresholds, and class-to-filename alignment. |

## Companion Records & Gates

- **Pedagogical lesson ledgers:** [`../../legibility/naming-lessons.md`](../../legibility/naming-lessons.md) (100% maintainer-authored callsite and naming lessons) and [`../../legibility/simplicity-lessons.md`](../../legibility/simplicity-lessons.md) (mental-model and mechanism simplifications).
- **Sweep playbook & maintainer calibration:** [`../../legibility/sweeps/README.md`](../../legibility/sweeps/README.md) (the review studio and sweep workflow), [`../../legibility/sweeps/2026-10-25/README.md`](../../legibility/sweeps/2026-10-25/README.md) (the 20-PR October 2026 sweep), and [`../../legibility/sweeps/2026-10-25/maintainer-rewrites.md`](../../legibility/sweeps/2026-10-25/maintainer-rewrites.md) (all 74 maintainer hand-edits across Pass 1 and Pass 2).
- **Automated gates:**
  - `npm run errors` (`scripts/gates/errors.js`) — enforces `. Capital` sentence boundaries, advisory lowercase openers, no terminal period, no `—` / `→` / `;` in prose, no `bad*` error codes, and server `createErrors` wrapping.
  - `npm run size` (`scripts/gates/size.js`) — enforces client brotli budgets, verifies `isDevelopment` dev-vs-prod prose stripping, and rejects unallowlisted prose in production client bundles.
  - `npm run comments` / `npm run comments:tests` (`scripts/gates/comments.js`) — enforces comment density and prose register across `packages/` and test suites.
