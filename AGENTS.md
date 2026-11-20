# Working in `native-dates`

Read [`ai/contributing/README.md`](ai/contributing/README.md) first for the contributor routing table (`ai/skills/` is reserved for downstream user skills published with the npm package, while `ai/contributing/` holds internal repository records).

**Fixing or reporting a bug, or adding a feature?** Read [`CONTRIBUTING.md`](CONTRIBUTING.md), then load [`ai/contributing/workflows/contribute.md`](ai/contributing/workflows/contribute.md) for the reading order, workflow steps, and human-author requirements.

Before authoring or editing code in this repository, read:

1. **[`ai/contributing/north-star.md`](ai/contributing/north-star.md)**: Hand-authored by the maintainer on project goals, the Golden Rule, call-site SNR, lowercase-"c" correctness, conciseness, and Bayesian rulings. Read with the weight of a live user turn, and never edit or polish its human voice.
2. **[`ai/contributing/standards/lessons/naming-lessons.md`](ai/contributing/standards/lessons/naming-lessons.md)**: Hand-authored by the maintainer on callsite legibility, plain industry terms over metaphors, function signatures, and naming. Read with the weight of a live user turn.
3. **[`ai/contributing/standards/lessons/simplicity-lessons.md`](ai/contributing/standards/lessons/simplicity-lessons.md)**: Mental-model simplicity over clever mechanisms, synthetic adapters, or cross-module monkey-patching.
4. **[`ai/contributing/standards/coding-standards.md`](ai/contributing/standards/coding-standards.md)** and **[`ai/contributing/standards/code-comments.md`](ai/contributing/standards/code-comments.md)**: Class anatomy with `Symbol.for` branding, plus folder homogeneity and comment standards.
5. **[`ai/contributing/reference/architecture.md`](ai/contributing/reference/architecture.md)**: Package boundaries across `native-dates` (`src/`), `@native-dates/plugins` (`packages/plugins/`), `@native-dates/polyfill` (`packages/polyfill/`), and `ai/skills/`, plus invariants and size measurement.
6. **[`ai/contributing/budget.md`](ai/contributing/budget.md)**: Bundle ceilings, per-PR byte limits, and the size budget rules.
7. **[`ai/contributing/decisions.md`](ai/contributing/decisions.md)**: Package design decisions. Grep the noun you are about to touch and check the latest dated entry.

Load task-specific guides when relevant:

- **[`ai/contributing/standards/legibility/`](ai/contributing/standards/legibility/README.md)**: Craft guides for `code-structures`, `errors-and-logs`, `folders-and-filenames`, `tests-and-test-names`, and `traces-and-timelines`. Paths in those files reference the upstream repo they were written in, while the rules apply here.
- **[`ai/contributing/workflows/author-user-skill.md`](ai/contributing/workflows/author-user-skill.md)** and **[`ai/contributing/standards/ai-author-context.md`](ai/contributing/standards/ai-author-context.md)**: Authoring, chunking, and evaluating downstream user skills in `ai/skills/`.
- **[`ai/contributing/workflows/clean-room-dx-review.md`](ai/contributing/workflows/clean-room-dx-review.md)**: Running a quarantined fresh-reader DX review over candidate public API surface.
- **[`ai/contributing/workflows/read-ci-reports.md`](ai/contributing/workflows/read-ci-reports.md)**: Interpreting Bundle Size and Bench pull request comments (`Unsure` is unresolved noise, and within budget does not mean free).
- **[`ai/contributing/workflows/extend-bench-suite.md`](ai/contributing/workflows/extend-bench-suite.md)**: Adding or modifying benchmark operations in `bench/`.
- **[`ai/contributing/workflows/docs-writing.md`](ai/contributing/workflows/docs-writing.md)**: Writing or editing guide, API, or plugin pages under `docs/src/content/`.
- **[`ai/contributing/workflows/docs-authoring.md`](ai/contributing/workflows/docs-authoring.md)**: Updating the Astro docs site and its required features.
- **[`ai/contributing/workflows/docs-i18n.md`](ai/contributing/workflows/docs-i18n.md)**: Translating finalized documentation before a release or changing locale routing.
- **[`ai/contributing/standards/name-public-api.md`](ai/contributing/standards/name-public-api.md)** and **[`ai/contributing/standards/author-pull-requests.md`](ai/contributing/standards/author-pull-requests.md)**: Naming public API symbols and titling pull requests.
- **[`ai/contributing/standards/types.md`](ai/contributing/standards/types.md)**: Hand-authoring `.d.ts` files in `types/` and `packages/plugins/types/`. Their doc comments power editor hover/autocomplete, and each `@see` link opens the matching docs page on `nativedates.dev`.
- **[`ai/contributing/standards/utility-functions.md`](ai/contributing/standards/utility-functions.md)**: Reference for `@semantic-ui/utils`. **`native-dates` has zero runtime dependencies** — never install or import `@semantic-ui/utils`; check here for canonical names and behavior, then copy only the minimal reached implementation into `src/helpers/utils.js` or `src/helpers/environment.js`.

Files in [`ai/contributing/standards/`](ai/contributing/standards/README.md) are synced from upstream Semantic repositories. Some internal links reference skills outside this repo, and those files are not edited directly here.

## House Rules

- **Natural-language legibility wins:** Judge every method and signature by how clearly it reads aloud at the callsite (`today().plus(2, 'days').at('9am').in('Europe/Berlin')`).
- **Zero runtime dependencies:** `native-dates` installs nothing. Fork and copy only minimal needed helpers from `@semantic-ui/utils` into `src/helpers/` rather than adding dependencies or inventing ad-hoc names.
- **Comment voice:** Comment only non-obvious constraints, invariants, or gotchas (`npm run comments`). Start with a lowercase word, avoid em-dashes, prose semicolons, and unicode arrows, and omit trailing periods on single-line comments.
- **Commit format:** `Category: Description` (both capitalized, without a trailing period or `Co-Authored-By` trailer). Categories: `Feat`, `Bug`, `Docs`, `Chore`, `Harness`, `Test`, `Perf`, `Refactor`, `Build`, `Bench`, `BREAKING`. Git hooks in `tools/hooks/` enforce this format and block agent commits directly to `main`.
- **Hand-authored maintainer files (`README.md`, `ai/contributing/north-star.md`, `ai/contributing/standards/lessons/naming-lessons.md`):** Written by the maintainer in his own voice. Leave them untouched and never edit or polish them unless explicitly asked; keep READMEs under `packages/` as brief factual descriptions until the maintainer authors them.
- **Bespoke homepage:** `docs/src/views/Home.astro` is custom-built around `native-dates`'s specific value proposition with interactive demos verified at build time.
- **Bundle size budget:** Run `npm run size` after editing `src/` or `packages/`. Bug fixes aim for 0 added bytes, features declare expected bytes up front, and unused headroom is not a justification (`ai/contributing/budget.md`).
- **Structured errors:** Build every error via `refuse()` or `refuseType()` in `src/helpers/errors.js` (`dates refused [code] at`). Explanations are gated behind `isDevelopment` (`NODE_ENV !== 'production'`) so production builds omit diagnostic prose (`ai/contributing/standards/legibility/errors-and-logs.md`, checked by `npm run errors` and `npm run size`).
- **Behavioral tests and environments:** Assert `error.code` and `error.at` rather than matching prose sentences (`ai/contributing/standards/legibility/tests-and-test-names.md`). Each package's tests live with it (`test/` for `native-dates` and `packages/<name>/test/` for the others) and import packages by their public names; repo and CI tooling tests live under `tools/`. Place pure Node tests in `test/` (core nouns at the top, cross-cutting suites in subfolders like `test/format/` and `test/helpers/`), DOM tests in `test/dom/`, and real Chromium Playwright tests in `test/browser/` (`vitest.config.js`).
- **Category-grouped helpers:** Group free functions by domain in `src/helpers/` (`intl.js`, `zones.js`, `parse.js`, `format.js`, `errors.js`, `utils.js`, `environment.js`).
- **Decision records:** Record package behavior decisions in `ai/contributing/decisions.md` and repository process decisions in `ai/contributing/project-decisions.md`, each dated with the maintainer's confidence score and a reopen condition.
- **Scratch directory:** Put temporary plans and notes in git-ignored `ai/workspace/`.

## Undecided

Ask the maintainer rather than inventing conventions for:

- **Changelog format:** No `CHANGELOG.md` convention is settled. The docs version menu links directly to GitHub Releases.
- **Post-launch MCP and CDN (`tools/mcp`, `tools/cdn`):** Standalone MCP server (`tools/mcp`) and CDN worker/bundle infrastructure (`tools/cdn`) from `next` are optional post-launch additions.

## Commands

- `npm run check`: Run `test`, `ai`, and `size`
- `npm test`: Run Vitest across `node`, `jsdom`, and `browser` projects in every package (`vitest.config.js`)
- `npm run types`: Type-check `.d.ts` declarations via `tsc --noEmit` under NodeNext and `bundler` resolution (`test/types.ts`)
- `npm run errors`: Check error and log prose register (`tools/gates/errors.js`)
- `npm run comments`: Check comment density, overlap, and banned jargon (`tools/gates/comments.js`)
- `npm run ai`: Validate markdown links, `#anchors`, GFM tables, `ai/` paths, and `AGENTS.md` symlinks (`tools/gates/ai.js`)
- `npm run size`: Measure minified and Brotli-11 sizes for `native-dates` and every plugin in `@native-dates/plugins`, and check `ai/contributing/budget.md` ([`tools/ci/bundle/README.md`](tools/ci/bundle/README.md))
- `npm run docs`: Start the Astro docs dev server (`docs/`, see [`docs/README.md`](docs/README.md))
- `npm run format`: Format files with `dprint`
- `npm run setup`: Install git hooks from `tools/hooks/`
