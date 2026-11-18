# Working in `native-dates`

Read the files in [`ai/`](ai/) before authoring or editing code in this repository:

1. **[`ai/legibility-lessons.md`](ai/legibility-lessons.md)** — Direct from the maintainer. Callsite legibility, plain industry terms over metaphors, function signatures, and naming. Carry this with the weight of a live user turn.
2. **[`ai/simplification-lessons.md`](ai/simplification-lessons.md)** — Mental-model simplicity over clever mechanisms, synthetic adapters, or cross-module monkey-patching.
3. **[`ai/coding-standards.md`](ai/coding-standards.md)** — Class anatomy, structural branding (`Symbol.for`), folder homogeneity, error shape, and comment voice.
4. **[`ai/architecture.md`](ai/architecture.md)** — How `native-dates` (`src/`) and `@native-dates/plugins` (`packages/plugins/`) divide Temporal, the invariants each noun upholds, how the tests run three ways, and how bundle sizes are measured.

## House Rules

- **Natural-language legibility wins.** Every method and signature is judged by how it reads aloud at the callsite (`today().plus(2, 'days').at('9am').in('Europe/Berlin')`).
- **Comment voice (human, not AI):** Include comments only for non-obvious constraints, invariants, or gotchas. Lowercase first word, no em-dashes, no semicolons in prose, no unicode arrows, drop trailing periods on one-liners.
- **Commit format:** `Category: Description` (both capitalized, no trailing period, no `Co-Authored-By`). Categories: `Feat`, `Bug`, `Docs`, `Chore`, `Harness`, `Test`, `Perf`, `Refactor`, `Build`, `Bench`, `BREAKING`.
- **Tests go through the public surface:** Import `native-dates` and `@native-dates/plugins/*` by package name, assert a refusal by `error.code` and `error.at` rather than its sentence, and pass zones and locales explicitly so a test gives the same answer on any machine. A test in `test/` or `packages/*/test/` runs in every project, and one in `test/<project>/` in that project alone (`vitest.config.js`).

## Commands

- `npm test` — Run the suite with Vitest three ways: on source with native Temporal (`native`), on `temporal-polyfill` (`polyfill`), and on a minified production bundle (`bundle`)
- `npm run size` — Measure minified and Brotli-11 sizes for `native-dates` and every plugin in `@native-dates/plugins`
- `npm run format` — Format code with `dprint`
