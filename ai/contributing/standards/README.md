# `ai/contributing/standards/`: Organization-Wide Coding Standards

Cross-repository standards for code structure, naming, comments, and API design across Semantic open-source packages. These files are copied verbatim from their upstream repositories, so code examples and internal skill links reflect those source repos.

**Do not edit files in this folder directly.** Update the upstream source file first, then sync it here. Repo-specific procedures and overrides belong in [`../workflows/`](../workflows/README.md).

| File | Scope | Upstream source |
|---|---|---|
| [`lessons/naming-lessons.md`](lessons/naming-lessons.md) | Maintainer-authored lessons on callsite-inferrable signatures, industry terms over metaphors, and naming | `native-dates:ai/legibility-lessons.md` (`a59860b`) |
| [`lessons/simplicity-lessons.md`](lessons/simplicity-lessons.md) | Real-world rewrites replacing synthetic adapters and monkey-patching with simpler class boundaries | `native-dates:ai/simplification-lessons.md` (`a59860b`) |
| [`lessons/maintainer-rewrites.md`](lessons/maintainer-rewrites.md) | 74 line-by-line maintainer rewrites from the `sync` legibility pass | `sync:ai/legibility/sweeps/2026-10-25/maintainer-rewrites.md` (`ba83ce7f`) |
| [`coding-standards.md`](coding-standards.md) | Class anatomy, `Symbol.for` branding, registries, folder homogeneity, and naming conventions | `native-dates:ai/coding-standards.md` (`a59860b`) |
| [`code-comments.md`](code-comments.md) | Intent-over-mechanism comments, placement, density, and voice | `next:ai/skills/contributing/code-comments.md` (`89ed98a96`) |
| [`code-formatting.md`](code-formatting.md) | `dprint` formatting and section-header comment hierarchy | `next:ai/skills/contributing/code-formatting.md` (`89ed98a96`) |
| [`author-pull-requests.md`](author-pull-requests.md) | Pull request title grammar and concise human-first descriptions | `next:ai/skills/contributing/author-pull-requests.md` (`89ed98a96`) |
| [`ai-author-context.md`](ai-author-context.md) | Authoring downstream AI skills: frontmatter, structural skeleton, section-header API, emotional register, and paired examples | `next:ai/skills/contributing/ai-author-context.md` (`89ed98a96`) |
| [`types.md`](types.md) | Hand-authored `.d.ts` declarations: the doc comments an editor shows, `@see` links to the docs, the mirror of `src/`, `@internal`, and where types stop | `next:ai/skills/contributing/types.md` (`89ed98a96`) |
| [`name-public-api.md`](name-public-api.md) | Structured naming review before introducing public API symbols | `next:ai/skills/contributing/name-public-api.md` (`89ed98a96`) |
| [`legibility/`](legibility/README.md) | Five craft guides from the `sync` legibility sweep ([`code-structures`](legibility/code-structures.md), [`errors-and-logs`](legibility/errors-and-logs.md), [`folders-and-filenames`](legibility/folders-and-filenames.md), [`tests-and-test-names`](legibility/tests-and-test-names.md), [`traces-and-timelines`](legibility/traces-and-timelines.md)) | `sync:ai/skills/legibility/` (`ba83ce7f`) |
| [`utility-functions.md`](utility-functions.md) | API catalog for `@semantic-ui/utils` (`native-dates` has zero dependencies: look up canonical names and implementations here and copy only needed helpers locally) | `nav-router:ai/contributing/utility-functions.md` |
