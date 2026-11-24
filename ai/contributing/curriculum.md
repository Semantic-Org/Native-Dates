# Agent Curriculum

Required reading order for coding agents before authoring or modifying code in `native-dates` (see [`CONTRIBUTING.md`](../../CONTRIBUTING.md)).

## 1. Goals and Maintainer Lessons

Hand-authored by the maintainer in his own voice. Read with the weight of a live user turn, and never edit or polish them:

1. **[`north-star.md`](north-star.md)**: Project goals, the Golden Rule, call-site SNR, lowercase-"c" correctness, conciseness, and Bayesian rulings.
2. **[`standards/lessons/naming-lessons.md`](standards/lessons/naming-lessons.md)**: Callsite legibility, plain industry terms over metaphors, function signatures, and naming.
3. **[`standards/lessons/simplicity-lessons.md`](standards/lessons/simplicity-lessons.md)**: Mental-model simplicity over synthetic adapters or cross-module monkey-patching.

## 2. Architecture, Decisions, and Budget

Check package boundaries and constraints before designing a change:

1. **[`reference/architecture.md`](reference/architecture.md)**: Boundaries across `native-dates` (`src/`), `@native-dates/plugins` (`packages/plugins/`), `@native-dates/polyfill` (`packages/polyfill/`), and `ai/skills/`, plus zero-dependency invariants.
2. **[`decisions.md`](decisions.md)**: Topic and chronological index (`D1`..`Dn`) linking into [`decisions/package.md`](decisions/package.md). Grep the noun you are touching, and read [`decisions/README.md`](decisions/README.md) before recording or reopening a decision.
3. **[`budget.md`](budget.md)**: Brotli ceilings, per-PR byte limits, and zero-prose production bundle rules (`npm run size`).

## 3. Code, Comments, Errors, and Types

Match codebase structure and static gates (`npm run comments`, `npm run errors`, `npm run types`):

1. **[`standards/coding-standards.md`](standards/coding-standards.md)** and **[`standards/code-comments.md`](standards/code-comments.md)**: Class anatomy with `Symbol.for` branding, folder homogeneity, and intent-only comments.
2. **[`standards/legibility/`](standards/legibility/README.md)**: Craft guides for [`errors-and-logs.md`](standards/legibility/errors-and-logs.md), [`tests-and-test-names.md`](standards/legibility/tests-and-test-names.md), [`code-structures.md`](standards/legibility/code-structures.md), [`folders-and-filenames.md`](standards/legibility/folders-and-filenames.md), and [`traces-and-timelines.md`](standards/legibility/traces-and-timelines.md).
3. **[`standards/utility-functions.md`](standards/utility-functions.md)**: Canonical `@semantic-ui/utils` signatures (`native-dates` has zero runtime dependencies, so copy only minimal used branches into `src/helpers/utils.js` or `src/helpers/environment.js`).
4. **[`standards/types.md`](standards/types.md)**: Hand-authored `.d.ts` declarations in `types/` and `packages/plugins/types/` with `@see` links to `nativedates.dev`.

Files in [`standards/`](standards/README.md) are synced from upstream Semantic repositories and are not edited directly here.

## 4. Task-Specific Workflows

Load only the guides relevant to your current task, then read the target source files and tests directly on `HEAD`:

- **Bug fixes, features, and PRs:** [`workflows/contribute.md`](workflows/contribute.md), [`standards/name-public-api.md`](standards/name-public-api.md), [`standards/author-pull-requests.md`](standards/author-pull-requests.md), [`workflows/read-ci-reports.md`](workflows/read-ci-reports.md), and [`workflows/clean-room-dx-review.md`](workflows/clean-room-dx-review.md)
- **Decisions:** [`decisions/README.md`](decisions/README.md) (what belongs vs. normal features and bug fixes)
- **Documentation and i18n (`docs/`):** [`workflows/docs-writing.md`](workflows/docs-writing.md), [`workflows/docs-authoring.md`](workflows/docs-authoring.md), and [`workflows/docs-i18n.md`](workflows/docs-i18n.md)
- **Skills (`ai/skills/`):** [`workflows/author-skill.md`](workflows/author-skill.md) and [`standards/ai-author-context.md`](standards/ai-author-context.md)
- **Benchmarks and performance (`bench/`, `date-benchmark`):** [`workflows/manage-benchmarks.md`](workflows/manage-benchmarks.md) and [`workflows/extend-bench-suite.md`](workflows/extend-bench-suite.md)
