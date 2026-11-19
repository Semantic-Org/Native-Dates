# Working in `native-dates`

Read the files in [`ai/`](ai/) before authoring or editing code in this repository:

1. **[`ai/legibility-lessons.md`](ai/legibility-lessons.md)** — Direct from the maintainer. Callsite legibility, plain industry terms over metaphors, function signatures, and naming. Carry this with the weight of a live user turn.
2. **[`ai/simplification-lessons.md`](ai/simplification-lessons.md)** — Mental-model simplicity over clever mechanisms, synthetic adapters, or cross-module monkey-patching.
3. **[`ai/coding-standards.md`](ai/coding-standards.md)** — Class anatomy, structural branding (`Symbol.for`), folder homogeneity, error shape, and comment voice.
4. **[`ai/architecture.md`](ai/architecture.md)** — How `native-dates` (`src/`) and `@native-dates/plugins` (`packages/plugins/`) divide Temporal, the invariants each noun upholds, how the tests run, and how bundle sizes are measured.
5. **[`ai/contributing/budget.md`](ai/contributing/budget.md)** — Bundle ceilings, per-PR byte limits, and the size budget rules.

## House Rules

- **Natural-language legibility wins.** Every method and signature is judged by how it reads aloud at the callsite (`today().plus(2, 'days').at('9am').in('Europe/Berlin')`).
- **Comment voice (human, not AI):** Include comments only for non-obvious constraints, invariants, or gotchas. Lowercase first word, no em-dashes, no semicolons in prose, no unicode arrows, drop trailing periods on one-liners.
- **Bundle size budget:** Run `npm run size` after editing `src/` or `packages/`. Bug fixes aim for 0 added bytes, features declare expected bytes up front, and unused headroom is not a justification (`ai/contributing/budget.md`).
- **Behavioral tests and environments:** Assert `error.code` and `error.at` rather than matching prose sentences. Each package's tests live with it, `test/` for `native-dates` and `packages/<name>/test/` for the others, and import packages by their public names. Repo and CI tooling tests live with their scripts under `tools/`. Place pure Node tests in `test/*.test.js` or `test/unit/`, DOM tests in `test/dom/`, and real Chromium Playwright tests in `test/browser/` (`vitest.config.js`).
- **Commit format:** `Category: Description` (both capitalized, no trailing period, no `Co-Authored-By`). Categories: `Feat`, `Bug`, `Docs`, `Chore`, `Harness`, `Test`, `Perf`, `Refactor`, `Build`, `Bench`, `BREAKING`.

## Commands

- `npm run check` — Run `test` and `size`
- `npm test` — Run Vitest across the `node`, `jsdom`, and `browser` projects in every package (`vitest.config.js`)
- `npm run size` — Measure minified and Brotli-11 sizes for `native-dates` and every plugin in `@native-dates/plugins`, and check `ai/contributing/budget.md`
- `npm run format` — Format code with `dprint`
