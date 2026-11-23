# Project Decisions

> Append-only log (`P1`..`Pn`) governing repository process, CI gates, documentation workflow, and releases. Read [`README.md`](README.md) before adding an entry; package API and runtime behavior belong in [`package.md`](package.md), never here.

## P1: Keep skills in `ai/skills/` and generate `skills/<name>/SKILL.md` only at pack time (2026-11-21)

Skill installers (`pnpm`, `skills experimental_sync`, and TanStack Intent) expect `skills/<name>/SKILL.md` at the root of an installed package and ignore `ai/skills/<name>.md`. Committing a top-level `skills/` directory would also allow `npx skills add` and `gh skill install` directly from GitHub, but it would split agent files across two top-level directories instead of keeping them under `ai/`. Instead, `tools/skills.js` generates `skills/<name>/SKILL.md` during `prepack` and cleans it up in `postpack`.

Reopen: direct GitHub installs (`npx skills add`, `gh skill install`) become worth supporting; both require committed `SKILL.md` files (which they can discover at `ai/skills/<name>/SKILL.md` without a root `skills/` directory).

## P2: `@native-dates/core` references `native-dates` skills instead of shipping copies (2026-11-21)

Shipping duplicate `skills/` in both tarballs breaks projects that depend on both packages: `skills experimental_sync` drops conflicting names altogether, `pnpm` installs each skill twice under `pnpm-<package>-<skill>`, and TanStack Intent lists four skills for every `@native-dates/core` project. Declaring `"skills": ["npm:native-dates"]` in `@native-dates/core` fixes `skills experimental_sync` without duplication, and Intent already discovers skills through the `native-dates` dependency. The tradeoff is that `pnpm` only scans `skills/` in direct dependencies, so pnpm users who install only `@native-dates/core` do not get skills automatically.

Reopen: pnpm users of `@native-dates/core` report missing skills, or pnpm adds support for a `package.json` skills pointer or transitive skill discovery.
