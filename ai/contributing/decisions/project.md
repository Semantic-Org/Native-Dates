# Project Decisions

> Append-only log (`P1`..`Pn`) governing repository process, CI gates, documentation workflow, and releases. Read [`README.md`](README.md) before adding an entry; package API and runtime behavior belong in [`package.md`](package.md), never here.

## P1: `ai/skills/` stays the source and `skills/<name>/SKILL.md` exists only inside the npm tarball (2026-11-21)

pnpm, `skills experimental_sync`, and TanStack Intent read `skills/<name>/SKILL.md` at the root of an installed package and found nothing in `ai/skills/<name>.md`. Committing a root `skills/` folder would have fixed that and made the repository installable with `npx skills add` and `gh skill install`, but it splits agent context across two top-level folders when `ai/` is where all of it lives, so `prepack` writes the layout from `ai/skills/` and `postpack` removes it (`tools/skills.js`).

Reopen: installing skills straight from the GitHub repository becomes a route worth serving, since both installers need committed `SKILL.md` files (a local run of each found them at `ai/skills/<name>/SKILL.md`, without a root `skills/` folder).

## P2: `@native-dates/core` points at the skills in `native-dates` instead of shipping copies (2026-11-21)

*70% confident*

With copies in both tarballs, a project listing both names lost every skill in `skills experimental_sync` (the same name from two packages installs neither), got each one twice in pnpm as `pnpm-<package>-<skill>`, and every `@native-dates/core` project listed four skills in TanStack Intent. `"skills": ["npm:native-dates"]` gives `skills experimental_sync` the two skills without copies, and Intent already reads the dependency. pnpm reads only the `skills/` folder of direct dependencies, so a pnpm project that installs just `@native-dates/core` is offered nothing.

Reopen: pnpm users of `@native-dates/core` report missing skills, or pnpm starts following a `package.json` field or transitive packages.
