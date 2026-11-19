---
title: Authoring and Evaluating Downstream Skills
description: Workflow for scoping, chunking, writing, cold-evaluating, and verifying downstream user skills in ai/skills/ following Semantic UI house conventions.
keywords: [skills, ai-author-context, fresh-agent evaluation, llms.txt, MCP, chunking, ground truth]
audience: contributing
workflow: author-user-skill
type: workflow
---

# Authoring and Evaluating Downstream Skills

> **Workflow:** `author-user-skill`
> **Load when:** creating, rewriting, or evaluating downstream user skills in `ai/skills/`

Read the [authoring standard](../standards/ai-author-context.md) before writing or editing any file in `ai/skills/`. That standard defines the craft rules for frontmatter, section headers, emotional register, and paired examples. This workflow covers the authoring and review process.

---

## Delivery and Layout

Skills in `ai/skills/` are published with the `native-dates` npm package (`"files"` in `package.json`) and served by the docs site through `/skills/<skill>.md` and `/llms.txt`. An optional MCP server can expose the same files to tool-calling agents.

| Layout | Path pattern | When to use |
|---|---|---|
| Flat | `ai/skills/<skill>.md` | Small packages with only a few skills |
| Grouped | `ai/skills/<audience>/<skill>.md` | Larger packages split across `essentials`, `usage`, and `authoring` |

Keep contributor records and docs workflows in `ai/contributing/` so they stay out of the npm tarball.

---

## Phase 0: Scoping and Survey

1. Discuss goals, non-goals, and edge cases with the author before drafting if no outline exists yet.
2. Read the implementation across `src/`, `types/`, `packages/plugins/`, and `packages/polyfill/`, along with the user docs and examples in `docs/src/content/`. Ignore old skills being replaced so their framing does not carry over.
3. Treat each skill as self-contained. Downstream agents load one file without repository access, so the survey shows what to distill into the skill rather than what to leave out.
4. Confirm the title, `skill` identifier, audience, and consumption subtype with the author:

| Subtype | How agents read it | Length budget |
|---|---|---|
| Procedural | Read end-to-end at task start | Under 500 lines |
| Reference | Scanned mid-task for specific values | Longer when sectioned cleanly |
| Mixed | Concepts first, lookup tables after | Concepts within the first 300 lines |

---

## Phase 1: Chunking

Decide whether `native-dates` fits in a small set of focused skills in `ai/skills/` (for example, core date/time/duration/range usage vs. opt-in `@native-dates/plugins/*` and `@native-dates/polyfill`).

Apply the decision test from the [authoring standard](../standards/ai-author-context.md) to every candidate file. Ask whether an agent loading that file alone can complete a task in its domain without guessing.

Split along user intents rather than arbitrary line counts. If Skill B is unusable without loading Skill A first, merge them or repeat the minimum shared context in Skill B. Confirm the skill boundaries and identifiers with the author before Phase 2.

---

## Phase 2: Writing

Create each file in `ai/skills/` with the frontmatter required by the [authoring standard](../standards/ai-author-context.md):

```yaml
---
title: Action-Oriented Title
description: Concise scope statement of what the skill covers and what belongs in companion skills.
keywords: [search, terms, beyond, title, "@native-dates/plugins"]
audience: usage # essentials | usage | authoring
skill: kebab-case-id
type: skill # skill | workflow | ref
---
```

Follow the house skeleton in order:

1. `# Title` matching `title`, followed by the `> **Skill:**` and `> **Purpose:**` blockquote header.
2. Brief orientation and a `**Golden rule: ...**` line when one principle prevents most mistakes. Write this introduction last once all sections settle, and repeat the golden rule at the end of `Quick Reference`.
3. `## What You'd Get Wrong` frontloaded first, pairing `❌ WRONG` and `✅ RIGHT` examples for behavior an unprimed model would guess wrong (for example, `CalendarDate` vs. `DateTime`, `Z` fixing instant rather than zone, inclusive `DateRange` vs. half-open `DateTimeRange` / `TimeRange`, or unstructured error prose matching vs. `error.code` / `error.at`).
4. Symbol sections separated by `---`, using exact public names in headings (`## datetime`, `## CalendarDate`, not prose paraphrases) so section extraction works. Use tables for parameter and error lookup, and short prose for mental-model invariants.
5. `## Quick Reference` with runnable callsites and a compact lookup table on files over ~100 lines.
6. `## Related Skills` table at the end, filled in during Phase 4.

---

## Phase 3: Review, Cold Evaluation, and Ground Truth

Review the draft with the author, finalize the introduction, and run the static gates:

```sh
npm run ai
npm run format
```

### Cold Subagent Evaluation

Spawn a fresh read-only subagent with zero prior context, replacing `{FILE_PATH}` and `{PACKAGE_NAME}` while keeping the rest of the prompt verbatim:

```text
Read the file {FILE_PATH}. Do not read any other files. Evaluate this document using only its own content — treat it as the sole source of truth about the package. This simulates the downstream experience: one file lands in your context via a tool call, and you reason from it alone.

The file's YAML frontmatter contains a description field — this is the promise the document makes to agents who load it. The content should deliver on that promise. Judge the document against its own stated purpose, not against what you wish it covered.

Context: this is an AI context document for {PACKAGE_NAME}. The intended audience is downstream AI agents helping users build with {PACKAGE_NAME} — not contributors to the package source. These agents access this context via an MCP tool server or llms.txt and have their own project-level instructions.

Evaluate this document against these criteria, drawn from the project's own authoring standards:

1. Decision test. If an agent loads this file and nothing else, can it reason correctly about {PACKAGE_NAME} in conversation with a user? Where would it break down?
2. Only documents what the agent can't infer. Does every section earn its tokens by teaching something genuinely non-obvious — something the agent would get wrong without being told? Flag anything that restates knowledge already in training data.
3. Frontloads the most important rules. Are the highest-impact corrections and mental model shifts early in the document, or buried after less critical content?
4. Generative understanding. Does the document give the agent a model it can reason from in novel situations, or a list of facts it can only pattern-match against cases it's seen?
5. Structure matches consumption. Is the document structured for how an agent will actually consume it — read end-to-end on first load, then potentially never again? Does attention degrade gracefully (most critical content first, diminishing priority)?

Rate the document from 1-10 on overall utility for its stated purpose. Be specific about what earns and loses points.

Do not write any code. This is a research and evaluation task only.
```

Target `9/10` or `10/10` within at most 3 iterations:

- Review each point with the author to separate real gaps from out-of-scope requests and misreadings. When feedback asks for material from another skill, tighten `description` rather than expanding scope.
- Batch all agreed edits into a single revision pass, then spawn a new subagent rather than resuming the previous one.
- Stop immediately if the score drops between rounds and review what changed with the author.

### Ground Truth Verification

Cold evaluation checks clarity, not accuracy. Once a skill reaches `9/10`, check every signature, option default, return type, error code, and code sample against `src/` and `types/` (and `packages/plugins/`). If any claim needs a factual fix, run one final cold evaluation to confirm clarity held.

---

## Phase 4: Neighbor Integration

Read all files in `ai/skills/` together to trim duplicated material, check for unstated assumptions between skills, align terminology to one term per concept, and fill in bidirectional `## Related Skills` tables.

---

## Rewriting an Existing Skill

When updating an existing skill to house standards rather than writing from scratch:

1. Audit its frontmatter, skeleton sections, generic JavaScript padding, and source claims first, then confirm the plan with the author.
2. Verify every signature and behavioral statement against `src/` and `types/`.
3. Fix frontmatter and the blockquote header, cut generic advice, convert lookup prose to tables, add `❌` / `✅` contrasts, align symbol headings, and run Phase 3.
