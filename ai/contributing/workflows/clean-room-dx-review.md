---
title: "Clean-Room DX Review"
description: Commissions a fresh, quarantined reader over candidate public API surface as a first-hour adopter encounters it, then sorts findings for maintainer decisions.
keywords: [DX, clean room, fresh reader, public API, quarantine, first-hour adoption, legibility]
audience: contributing
workflow: clean-room-dx-review
type: workflow
---

# Clean-Room DX Review

> **Workflow:** `clean-room-dx-review`
> **Load when:** the core public API reaches candidate shape before 1.0, or after adding a major public surface

Adapted for standalone libraries from `sync:ai/skills/clean-room-dx-review.md`.

**Core rule: the reviewer inspects the actual public surface, never a prose summary of it.** Authors and working agents normalize awkward names and option shapes while building them. A fresh reader who has never seen `ai/contributing/` catches first-hour friction before public 1.0 locks the names in.

---

## 1. Capture the First-Contact Artifact

Before spawning the reviewer, run a short script that imports `src/index.js` and `@native-dates/plugins/*`, then writes the verbatim `Object.keys(...)` export list and `util.inspect(...)` instance output for each noun (`now()`, `today()`, `time('9am')`, `hours(2)`, `monthDay(11, 6)`, `yearMonth(2026, 11)`, and ranges) to `ai/workspace/surface-capture.txt`.

Regenerate this capture fresh before every round, and hold all source edits while a round is running.

---

## 2. Commission a Quarantined Reader

Launch one fresh read-only subagent with an explicit quarantine and reading order:

- **Role and bar:** Senior library API reviewer evaluating first-hour developer experience against reference small libraries (Vite, Svelte, Luxon, TanStack). Describe the problem domain in plain concept terms without using the package's own identifier names in the prompt.
- **Hard quarantine:** The reader may inspect `ai/workspace/surface-capture.txt`, `src/index.js`, `types/index.d.ts`, `packages/plugins/`, `packages/polyfill/`, and `src/`. It **must not** read `ai/contributing/`, `ai/skills/`, `ai/workspace/` (outside `surface-capture.txt`), git log, PR descriptions, or commit history.
- **Reading order:**
  1. `ai/workspace/surface-capture.txt` (form initial impressions from the raw exported symbols and inspected object shape before reading source)
  2. `types/index.d.ts` and `src/index.js` (public contract)
  3. `src/`, `packages/plugins/src/`, and `packages/polyfill/`
- **Required sections in the report:**
  1. **The `console.log` moment:** What shows up when logging an instance, and what should show up instead.
  2. **Identifier legibility:** Names, parameter order, boolean traps, and option keys that force a trip to the docs.
  3. **Coherence:** Whether core and plugins use one consistent word per concept.
  4. **Walked first-hour path:** Every stumble from empty file to working app in severity order, paired with a concrete rename or signature change.
  5. **What must not change:** Parts of the API that already read naturally, named explicitly so follow-up passes preserve them.

---

## 3. Verify and Bucket Findings

Treat every finding as a hypothesis. Verify each claim against `src/` before presenting it to the maintainer, then group verified findings into four buckets:

1. **Clear defect or pure simplification:** Direct usability win or dead surface removal. Propose adopting as a batch.
2. **Collides with an existing decision:** Reader flagged a name or behavior already recorded in [`../decisions.md`](../decisions.md). Present the tradeoff to the maintainer (fresh-reader friction occasionally justifies reopening a prior decision).
3. **Open design tradeoff:** Requires a maintainer decision before changing code.
4. **Already planned on `roadmap.md`:** Independent re-derivation by a quarantined reader is strong evidence to pull that milestone forward.

---

## 4. Iterate With a New Reader

After landing approved changes:

1. Record non-obvious naming or signature tradeoffs in [`../decisions/package.md`](../decisions/package.md) (following [`../decisions/README.md`](../decisions/README.md)) so later rounds do not flip-flop on taste calls.
2. Regenerate `ai/workspace/surface-capture.txt`.
3. If substantive API changes were merged, run a second round using a **brand-new** subagent with zero mention of round 1. Convergence shows up when round 1's fixes appear in round 2's "What must not change" list.
