---
title: "Docs i18n: Translating the Docs Site"
description: How to localize the native-dates documentation site into additional languages, manage draft vs. reviewed states, verify RTL layouts, and keep translations synchronized.
keywords: [docs, i18n, internationalization, translation, localization, rtl, right-to-left, arabic, plurals, hreflang, machine translation]
audience: contributing
workflow: docs-i18n
type: workflow
---

# Docs i18n: Translating the Docs Site

> **Workflow:** `docs-i18n`
> **Load when:** running a translation or review pass on finalized English documentation or modifying locale routing

---

## Where Localization Stands

`docs/` serves English at `/` and enables 8 additional locales (`zh-CN`, `ja`, `es`, `pt-BR`, `ko`, `fr`, `ru`, `ar`) configured in `docs/src/lib/locales.js` and `docs/src/lib/i18n.js`, validated by `docs/scripts/check-i18n.mjs`. Run full Markdown page translations only once English guides, API pages, and examples have settled (`ai/contributing/plan/roadmap.md`) so pre-release copy edits do not multiply maintenance churn across locales.

---

## Architecture

- **URL structure:** English serves from `/` while translated locales serve under lowercase path prefixes (`/ja/...`, `/zh-cn/...`) with canonical BCP-47 `<html lang="zh-CN">` tags (subdomains are reserved for archived major versions like `v1.nativedates.dev`).
- **Per-locale directory:** `docs/src/content/translations/<locale>/` mirrors `docs/src/content/`, containing `strings.json` for UI strings and translated Markdown files (`docs/guides/...`, `examples/...`). Translators add files there without touching Astro or JS code.
- **Source hash tracking:** Translated Markdown frontmatter carries only translated text fields (`title`, `lede`, `description`, `try`) plus `source` (the 12-char SHA-256 hash from `node docs/src/lib/source-hash.js <english-file>`). Metadata such as `kind`, `import`, `size`, and `updated` is inherited from the English entry. When the English file changes, `inLanguage()` detects the hash mismatch and renders a staleness notice.
- **Zero-404 locale switching:** Every page route renders across all enabled locales, falling back to English content (`lang="en" dir="ltr"`) inside the localized shell when a page has not been translated yet.

---

## Three Translation States

1. **Untranslated:** No twin file exists yet. Renders the English body inside the localized chrome with `language.untranslated` notice (`language.*` keys are required before enabling any locale).
2. **Machine draft (`reviewed: false` or `"$reviewed": false`):** Displays `language.draft` notice so readers know a human has not reviewed it yet. Agent-authored translations always start here.
3. **Reviewed:** `reviewed` / `"$reviewed"` flag removed. Renders without notice.

Search engine indexing (`hreflang`, sitemap, and self-canonical URLs) is restricted to **Reviewed** pages. Untranslated and draft pages point `rel="canonical"` at the English URL.

---

## Right-to-Left (RTL) Checklist

- Use CSS logical properties everywhere (`margin-inline`, `padding-inline`, `inset-inline-start`, `border-inline-start`).
- Keep code blocks, sandboxes, and timeline strips (`year-strip`, `console`, `say-code`, `xr`) `dir="ltr"`, while keeping prose captions inside them (`xr-count`, `pg-status`, `console-miss`) in the page's direction.
- Wrap numeric measurements and symbols (`14.1 kB`, `now()`) in `<bdi>` so bidirectional text reordering never detaches units or parentheses.
- Disable positive `letter-spacing` on Arabic and other joined scripts, and ensure monospace UI labels include a clean sans-serif fallback for scripts `Fragment Mono` lacks.
- Inspect rendered Arabic pages (`/ar/`) at `1440px` and `390px` in a real browser rather than relying on static CSS inspection.

---

## Translation Workflow

- **Delegate one agent per target language** with an explicit brief covering developer audience, tone, untranslated JavaScript identifiers, and UI label width constraints. Have each agent return its terminology glossary and flag any ambiguous English source sentences.
- **Adapt idioms rather than translating literally:** Each language writes its own name inside its own sentence rather than interpolating a menu label into a shared template. Where English copy says *"in plain English"* (`home.hero.title` and prose), adapt the phrase to the target language's idiomatic equivalent (*"in plain Japanese"*, *"en español claro"*) while keeping JavaScript method names in English.
- **Fix ambiguous English upstream** whenever multiple language passes stumble on the same passage.
- **Run `npm -w docs run check:i18n`** (`docs/scripts/check-i18n.mjs`) to catch missing `language.*` keys, unused or orphaned keys, `{placeholder}` mismatches, orphaned Markdown twins, heading-depth mismatches, and stale `source` hashes (pass `--strict` to fail on stale hashes, or run `npm -w docs run prune:i18n` to strip orphaned locale keys and orphaned Markdown twins).
- **Keep English heading structure and root-relative links:** `remark-docs.js` automatically prefixes root-relative URLs and assigns each translated heading its English twin's anchor ID, while `rehype-docs.js` carries `Type` column `.t` styling over by column index from the English twin. Translators keep root-relative links (`/api/...#...`) and match the English heading count and depth rather than rewriting anchor hashes.
- **Sync pure code edits directly:** When only code fences change in an English page (e.g., an import path or option rename), copy the code edit across translated twins and update their `source` hash without re-translating prose.
- **Respect user language choice:** Never auto-redirect based on `Accept-Language` / `navigator.languages`. Offer an opt-in toast in the matched language, and only auto-navigate future visits if the reader explicitly confirms "Always".
- **Use native CLDR plural forms (`Intl.PluralRules`):** Provide the exact plural suffixes each language distinguishes (`one`/`other` in English, `other` in Japanese, all six forms in Arabic).

---

## Rollout Priority

1. Simplified Chinese (`zh-CN`) and Japanese (`ja`)
2. Brazilian Portuguese (`pt-BR`) and Spanish (`es`)
3. Korean (`ko`), followed by Russian (`ru`) or French (`fr`)
4. Arabic (`ar`, primary RTL verification target)
