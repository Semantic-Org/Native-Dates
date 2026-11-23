# Working in `native-dates`

Read [`ai/contributing/curriculum.md`](ai/contributing/curriculum.md) before authoring or editing code (`ai/skills/` holds the skills published with the npm package, while [`ai/contributing/`](ai/contributing/README.md) holds internal agent context and repository records).

**Fixing or reporting a bug, or adding a feature?** Read [`CONTRIBUTING.md`](CONTRIBUTING.md), follow [`ai/contributing/curriculum.md`](ai/contributing/curriculum.md), and load [`ai/contributing/workflows/contribute.md`](ai/contributing/workflows/contribute.md) for the workflow steps and human-author requirements.

## House Rules

- **Natural-language legibility wins:** Judge every method and signature by how clearly it reads aloud at the callsite (`today().plus(2, 'days').at('9am').in('Europe/Berlin')`).
- **Zero runtime dependencies:** `native-dates` installs nothing. Fork and copy only minimal needed helpers from `@semantic-ui/utils` into `src/helpers/` rather than adding dependencies or inventing ad-hoc names.
- **Comment voice:** Comment only non-obvious constraints, invariants, or gotchas (`npm run comments`). Start with a lowercase word, avoid em-dashes, prose semicolons, and unicode arrows, and omit trailing periods on single-line comments.
- **Commit and PR format:** Single-line commit subject only: `Category: Description` (both capitalized, without a body, trailing period, `Co-Authored-By`, or session trailer). Leave pull request descriptions blank (`--body ""`) for human authorship. Categories: `Feat`, `Bug`, `Docs`, `Chore`, `Harness`, `Test`, `Perf`, `Refactor`, `Build`, `Bench`, `BREAKING`. Git hooks in `tools/hooks/` enforce this format and block agent commits directly to `main`.
- **Hand-authored maintainer files (`README.md`, `ai/contributing/north-star.md`, `ai/contributing/standards/lessons/naming-lessons.md`):** Written by the maintainer in his own voice. Leave them untouched and never edit or polish them unless explicitly asked; keep READMEs under `packages/` as brief factual descriptions until the maintainer authors them.
- **Bespoke homepage:** `docs/src/views/Home.astro` is custom-built around `native-dates`'s specific value proposition with interactive demos verified at build time.
- **Bundle size budget:** Run `npm run size` after editing `src/` or `packages/`. Bug fixes aim for 0 added bytes, features declare expected bytes up front, and unused headroom is not a justification (`ai/contributing/budget.md`).
- **Structured errors:** Build every error via `refuse()` or `refuseType()` in `src/helpers/errors.js` (`dates refused [code] at`). Explanations are gated behind `isDevelopment` (`NODE_ENV !== 'production'`) so production builds omit diagnostic prose (`ai/contributing/standards/legibility/errors-and-logs.md`, checked by `npm run errors` and `npm run size`).
- **Behavioral tests and environments:** Assert `error.code` and `error.at` rather than matching prose sentences (`ai/contributing/standards/legibility/tests-and-test-names.md`). Each package's tests live with it (`test/` for `native-dates` and `packages/<name>/test/` for the others) and import packages by their public names; repo and CI tooling tests live under `tools/`. Place pure Node tests in `test/` (core nouns at the top, cross-cutting suites in subfolders like `test/format/` and `test/helpers/`), DOM tests in `test/dom/`, and real Chromium Playwright tests in `test/browser/` (`vitest.config.js`).
- **Category-grouped helpers:** Group free functions by domain in `src/helpers/` (`intl.js`, `zones.js`, `parse.js`, `format.js`, `errors.js`, `utils.js`, `environment.js`).
- **Decision records:** Check [`ai/contributing/decisions.md`](ai/contributing/decisions.md) for active decisions, and always read [`ai/contributing/decisions/README.md`](ai/contributing/decisions/README.md) in full before recording, editing, or reopening a decision (never record an entry from summary context alone).
- **Scratch directory:** Put temporary plans and notes in git-ignored `ai/workspace/`.

## Undecided

Ask the maintainer rather than inventing conventions for:

- **Changelog format:** No `CHANGELOG.md` convention is settled. The docs version menu links directly to GitHub Releases.
- **MCP and CDN (`tools/mcp`, `tools/cdn`):** Standalone MCP server (`tools/mcp`) and CDN worker/bundle infrastructure (`tools/cdn`) from `next` are iceboxed until requested (`ai/contributing/plan/roadmap.md`).

## Commands

- `npm run check`: Run `test`, `ai`, and `size`
- `npm test`: Run Vitest across `node`, `jsdom`, and `browser` projects in every package (`vitest.config.js`)
- `npm run types`: Type-check `.d.ts` declarations via `tsc --noEmit` under NodeNext and `bundler` resolution (`test/types.ts`)
- `npm run errors`: Check error and log prose register (`tools/gates/errors.js`)
- `npm run comments`: Check comment density, overlap, and banned jargon (`tools/gates/comments.js`)
- `npm run ai`: Validate markdown links, `#anchors`, GFM tables, `ai/` paths, skill frontmatter, `decisions.md`, and `AGENTS.md` symlinks (`tools/gates/ai.js`)
- `npm run ai:index`: Regenerate `ai/contributing/decisions.md` from `ai/contributing/decisions/package.md` (`tools/gates/decisions-index.js`)
- `npm run size`: Measure minified and Brotli-11 sizes for `native-dates` and every plugin in `@native-dates/plugins`, and check `ai/contributing/budget.md` ([`tools/ci/bundle/README.md`](tools/ci/bundle/README.md))
- `npm run bench`: Run headless Chrome benchmarks in `bench/` via `tachometer` ([`tools/ci/bench/README.md`](tools/ci/bench/README.md))
- `npm run setup:demo`: Run `npx native-dates` from this checkout in a throwaway project, served by a registry on loopback (`tools/setup-demo.js`)
- `npm run docs`: Start the Astro docs dev server (`docs/`, see [`docs/README.md`](docs/README.md))
- `npm run format`: Format files with `dprint`
- `npm run setup`: Install git hooks from `tools/hooks/`
