# Contributor Records

Internal records and workflows for developing `native-dates`. Application developers using the library should read [skills](../skills/) instead.

## Starting Points

| Task | Reading order |
|---|---|
| Fix a bug, add a feature, or file a bug report | [`CONTRIBUTING.md`](../../CONTRIBUTING.md), then [`workflows/contribute.md`](workflows/contribute.md) |
| Check or record design and process decisions | [`decisions.md`](decisions.md) for the topic index, [`decisions/README.md`](decisions/README.md) before adding or reopening an entry, [`decisions/package.md`](decisions/package.md) (`D1`..`Dn`), and [`decisions/project.md`](decisions/project.md) (`P1`..`Pn`) |
| Check bundle size limits | [`budget.md`](budget.md), checked by `npm run size` |
| Configure GitHub secrets, bots, and Vercel deploys | [`reference/setup.md`](reference/setup.md) |
| View pending and completed launch tasks | [`plan/roadmap.md`](plan/roadmap.md) and [`plan/landed.md`](plan/landed.md) |
| Design a class, method signature, or public name | [`naming-lessons.md`](standards/lessons/naming-lessons.md), [`simplicity-lessons.md`](standards/lessons/simplicity-lessons.md), and [`name-public-api.md`](standards/name-public-api.md) |
| Write or update `.d.ts` declarations and `@see` links | [`types.md`](standards/types.md), checked by `npm run types` |
| Write an error message, warning, or log line | [`errors-and-logs.md`](standards/legibility/errors-and-logs.md), checked by `npm run errors` |
| Write source comments or title a pull request | [`code-comments.md`](standards/code-comments.md) and [`author-pull-requests.md`](standards/author-pull-requests.md) |
| Author or evaluate downstream user skills | [`ai-author-context.md`](standards/ai-author-context.md) and [`workflows/author-user-skill.md`](workflows/author-user-skill.md) |
| Run a clean-room DX review on public API surface | [`workflows/clean-room-dx-review.md`](workflows/clean-room-dx-review.md) |
| Write documentation pages or update the docs site | [`workflows/docs-writing.md`](workflows/docs-writing.md) and [`workflows/docs-authoring.md`](workflows/docs-authoring.md) |
| Read the project's core goals and tradeoffs | [`north-star.md`](north-star.md) (hand-authored by the maintainer) |

## Directory Layout

| Record | Path | Policy |
|---|---|---|
| North star | [`north-star.md`](north-star.md) | Hand-authored by the maintainer on project goals, the Golden Rule, call-site SNR, lowercase-"c" correctness, conciseness, and Bayesian rulings (do not edit or polish) |
| Decisions index | [`decisions.md`](decisions.md) | Generated topic and chronological index of package decisions (`npm run ai:index`) |
| Decision logs | [`decisions/`](decisions/README.md) | Authoring rules in `README.md`, package rationales in `package.md` (`D1`..`Dn`), and repo/CI process calls in `project.md` (`P1`..`Pn`) |
| Size budget | [`budget.md`](budget.md) | Entry bundles, Brotli ceilings, and per-PR growth rules, updated only by the maintainer |
| Launch plan | [`plan/`](plan/roadmap.md) | Pending rows in `roadmap.md`, completed rows in `landed.md`, and briefs in `plan/scopes/` |
| Shared standards | [`standards/`](standards/README.md) | Synced from upstream Semantic repos and not edited directly here |
| Repo workflows | [`workflows/`](workflows/README.md) | Contributor procedures for this repository |
| Technical reference | [`reference/`](reference/architecture.md) | Architecture and external setup docs |
| Scratchpad | `../workspace/` | Git-ignored local directory at `ai/workspace/` |

Create `reopened-decisions.md` or folders for research and archived records only when a task calls for them.

## Conventions

- Read [`decisions/README.md`](decisions/README.md) before recording a decision: features, enhancements, and bug fixes do not belong in `decisions/package.md`, and repo process calls belong in `decisions/project.md`.
- Supersede an older decision by appending a new `D<n>` entry and marking the earlier entry `Superseded by D<n> (<YYYY-MM-DD>).` rather than deleting history.
- `decisions/package.md` records non-obvious design constraints, while `plan/landed.md` records milestones that merged. Source code and tests define current behavior.
- Bundle ceilings and benchmark settings are calibrated per package. Only [`standards/`](standards/README.md) is shared across repos.
- Open mutable reference docs with a dated status line instead of writing "not yet built" in body paragraphs.
- Run `npm run ai` after editing files here to check links, heading anchors, Markdown tables, and root symlinks.
