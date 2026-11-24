---
title: "Docs i18n: Translating the Docs Site"
description: How to localize the native-dates documentation site, maintain translations after English edits, run a full-locale backfill with blind review, and verify builds and RTL layouts.
keywords: [docs, i18n, internationalization, translation, localization, rtl, right-to-left, arabic, plurals, hreflang, glossary, review]
audience: contributing
workflow: docs-i18n
type: workflow
---

# Docs i18n: Translating the Docs Site

> **Workflow:** `docs-i18n`
> **Load when:** updating stale translations, adding UI strings or locales, or running a full-locale translation and review pass on `docs/`

---

## Architecture

- **URL structure:** English serves from `/` while translated locales serve under lowercase path prefixes (`/ja/...`, `/zh-cn/...`) with canonical BCP-47 `<html lang="zh-CN">` tags (`docs/src/lib/locales.js`). Subdomains are reserved for archived major versions (`v1.nativedates.dev`).
- **Per-locale directory:** `docs/src/content/translations/<locale>/` mirrors `docs/src/content/`, containing `strings.json` for UI strings and translated Markdown files (`docs/...`, `examples/...`). Never place glossaries or notes inside `docs/src/content/translations/`, because `docs/src/content.config.js` globs `*/**/*.md` there as strict page twins.
- **Glossaries and slot context:** Checked-in UI copywriting context lives at [`ai/contributing/reference/i18n/slots.md`](../reference/i18n/slots.md). Each shipped locale's terminology glossary lives alongside it at `ai/contributing/reference/i18n/<locale>.md`.
- **Source hash tracking:** Translated Markdown frontmatter carries only translated text fields (`title`, `lede`, or `description` and `try` for examples) plus `source` (the 12-char SHA-256 hash from `node docs/src/lib/source-hash.js <english-file>`). Metadata (`kind`, `import`, `size`, `updated`) is inherited from the English twin. When the English file changes, `inLanguage()` flags the mismatch as stale.
- **Zero-404 fallback and language choice:** Missing pages fall back to English (`lang="en" dir="ltr"`) inside the localized shell. Never auto-redirect on `Accept-Language` or `navigator.languages`; offer an opt-in toast and redirect future visits only after explicit "Always" confirmation.

---

## Translation States

1. **Untranslated:** No twin file exists yet. Renders English body inside localized chrome with `language.untranslated`.
2. **Draft (`reviewed: false` or `"$reviewed": false`):** Displays `language.draft` notice and points `rel="canonical"` at English.
3. **Reviewed:** `reviewed` / `"$reviewed"` omitted. Renders without notice and enters `hreflang`, self-canonical tags, and `sitemap.xml`.

By maintainer decision, the 1.0 rollout ships localized pages in the **Reviewed** state, paired with blind native-editor review and automated Chromium DOM verification rather than claiming LLM review equals human review. Provenance conventions for agent-coauthored prose vs. contributor edits will be revisited after 1.0.

---

## Routine Maintenance

### Updating a Stale Page

1. Run `npm -w docs run check:i18n` to list stale `source` hashes and the expected hash for each file.
2. **Code-only English edits:** Even code-only edits change `sourceHash` (`source-hash.js` hashes the full trimmed body). Copy the code edit into every translated twin and update its `source` hash without re-translating prose.
3. **Prose edits:** Run `git log -p <english-file>` to isolate what changed since the previous sync, read the locale's glossary at `ai/contributing/reference/i18n/<locale>.md`, update only the affected sections plus the `source` hash, run a targeted blind review pass on the diff, and run the verification gates below.

### Adding or Changing `strings.json` Keys

1. Update `docs/src/content/strings.json`. When English wording changes meaningfully, rename the key rather than mutating copy in place so untranslated locales fall back safely.
2. If a key renders via `set:html`/`innerHTML` or `inline()`, register it in `HTML_KEYS` or `INLINE_KEYS` in `docs/scripts/check-i18n.mjs`, and document non-obvious DOM or grammatical constraints in [`slots.md`](../reference/i18n/slots.md).
3. Update every shipped locale's `strings.json` (providing all CLDR plural forms for any plural family) and sync `docs/src/data/home-locales.js` if homepage slots changed.
4. Run `npm -w docs run prune:i18n` if keys or English pages were removed, then run `npm -w docs run check:i18n -- --complete --locale=<shipped>` (omit `--locale` once all locales ship).

### Adding a New Locale

Touch `docs/src/lib/locales.js`, `docs/src/lib/nav.js` (`LANGUAGE_GUIDES` and examples), `docs/src/content/strings.json` (`nav.lang.<lang>`), `docs/src/data/home-locales.js`, `docs/src/scripts/home/{sentences,consoles,samples,primitives}.js`, `docs/src/scripts/language-globe.js`, an English `docs/src/content/docs/guides/<lang>.md` guide, `docs/src/content/translations/<locale>/`, and a checked-in glossary at `ai/contributing/reference/i18n/<locale>.md`.

---

## Full-Locale Backfill Playbook

Run a full backfill only once English docs settle so pre-release copy edits do not multiply churn. Execute each locale in five stages:

1. **Lock glossary and title map:** Write `ai/contributing/reference/i18n/<locale>.md` before translating any file. Lock canonical terms for every core class and concept (`CalendarDate`, `Time`, `DateTime`, `Duration`, `YearMonth`, `MonthDay`, `Range`, `partial date`, `time zone`, `offset`, `preset`, `token pattern`, `loose mode`, `immutable`, `daylight saving time`), **every translated page `title` and `nav.*` label** so cross-page links match destination titles, MDN-standard verbs (`call`, `throw`, `return`), `params`/`returns` grammatical form, H2 style, and script/numeral/BiDi/punctuation rules.
2. **Dedicated UI & homepage copywriter:** Holding the glossary and [`slots.md`](../reference/i18n/slots.md), translate `strings.json` with complete CLDR plural forms and update that locale's section in `docs/src/data/home-locales.js` in lockstep (switching `year.lede`/`caption` to `{changes}` and `{days}`). Serialize `home-locales.js` edits across concurrent locale waves so parallel runs do not collide. Verify all 5 `home.say.*` chains end to end.
3. **Focused Markdown batches (`<= 10k` English words per batch):** Split guides into 2–3 batches, core API classes into 2 batches, and remaining API functions, plugins, and examples into 2 batches so neither translator nor reviewer skims tail-end files. Never trust an existing stale twin blindly — diff it against current English. After drafting each file, run a **mandatory target-language-only rewrite pass** without looking at English to strip syntactic calques.
4. **Matched-scope blind native review:** Assign one fresh read-only reviewer per batch holding only the English source, glossary, [`slots.md`](../reference/i18n/slots.md) (for UI), and translated output. Audit for English calques, SVO/OVS ambiguity, glossary drift, case/gender agreement, self-language-guide awkwardness, BiDi inversion, and Markdown/YAML issues.
5. **Adjudication, pushback, and sign-off (max 2 cycles):** Orchestrator filters false positives against the glossary and codebase rules, sends blocking findings back to the batch's original translator via `send_message` (translators may push back with evidence when a reviewer edit hurts accuracy or clarity), and sends revisions back to the same blind reviewer for sign-off. Cap revision loops at 2 cycles per batch so unattended runs do not thrash.

---

## Authoring & Markdown DSL Invariants

- **Voice anchor:** Write like a native open-source maintainer authoring Vite, Vue, Svelte, or MDN docs in the target language. Short, active, concrete sentences. No AI filler, no automatic tricolons, low parenthetical density, no bureaucratic stiffness.
- **Strip English calques:** Rewrite modifier and phrasal-verb calques (`year-first`, `1-indexed`, `no date to advance`, `rolling into`, `falls back to`, `read off`, `belongs in`, `handling X and Y` zeugma in ledes, or translating `Pass 'ja-JP' through [Localization]` literally as passing a tag through a guide title) from scratch in the target language.
- **Brand, identifiers, and plugins:** Keep `Native Dates` in prose, `native-dates` in packages/code, and JS identifiers and plugin names (`loose`, `zones`, `legacy-date`) recognizable.
- **Self-language guide and example reframing:** Write the locale's own promoted language guide and own language example native-to-native without English-learner glosses of everyday local words. Keep cross-cultural explanations on the other language guides.
- **Idioms:** Adapt *"in plain English"* to natural-language / readable expressions without claiming English JS method names are written in the target language.
- **Code blocks & comments:** Never change runnable JS expressions or literal return-value comments (`// '5:00 PM'`, `// true`). Translate explanatory prose comments while keeping class names intact.
- **Frontmatter & YAML:** Include only `source`, `title`, and `lede` (or `description` and `try` for `example.md`). Quote YAML values containing `: ` or starting with `` ` ``, `'`, `"`, `{`, `[`, or `!`.
- **`inline()` fields:** Frontmatter `lede`, `description`, `try`, ```` ```params ```` / ```` ```returns ```` descriptions, and `plugins.*.description` parse only `` `code` ``, `**strong**`, and `[label](href)`. Never use `*italic*` or raw HTML tags in them.
- **Headings, tables, and links:** Match English heading count/depth and table count exactly so `remark-docs.js` and `rehype-docs.js` inherit stable English anchor IDs and `.t` Type-column styling automatically. Keep internal links root-relative (`/api/...`, `/guides/...`) with English `#anchor` hashes untouched.
- **Directives, YAML fences, and tabs:**
  - Keep `:::entry`, `:::steps`, `:::truth`, and callout directive names (`:::note`, `:::tip`, `:::warning`, `:::danger`) untranslated; translate only `[Title]`.
  - Keep literal `true` and `false` cells inside `:::truth` tables untranslated (`rehype-docs.js` styles them by exact string match).
  - Keep `:kind[method]` / `:kind[function]` / `:kind[guard]` tags intact.
  - In ```` ```params ```` and ```` ```returns ```` blocks, translate only `description:` — never alter YAML keys (`name`, `type`, `required`, `default`, `options`) or `type:` strings.
  - In `plugins/loose.md`, translate `label="..."` variant tabs while preserving `locale="..."` autonym fence attributes.
  - In `example.md` `try:` steps, keep visible English playground button/tab labels recognizable because sandbox UI stays in English.

---

## Right-to-Left (RTL) Checklist

- Use CSS logical properties everywhere (`margin-inline`, `padding-inline`, `inset-inline-start`, `border-inline-start`).
- Keep code blocks, sandboxes, and timeline strips (`year-strip`, `console`, `say-code`, `xr`) `dir="ltr"`, while keeping prose captions inside them (`xr-count`, `pg-status`, `console-miss`) in the page's direction.
- Wrap inline numeric measurements and symbols (`14.9 kB`, `now()`) in `<bdi>` only inside HTML-rendered keys (`HTML_KEYS`) or Markdown prose — never inside plain-text `strings.json` keys.
- Lock one consistent numeral policy per RTL locale: `ar` technical prose uses Western `0-9` to match code and Latin metrics (normalize existing Eastern prose digits in `home-locales.js` and `translations/ar/docs/guides/arabic.md` during the `ar` wave, separate from live `ar-EG` Intl widget output). Disable positive `letter-spacing` on joined scripts.
- Verify rendered `/ar/` pages at `1440px` and `390px` in headless Chromium.

---

## Verification Gates

Run these gates for every localization PR (note: `npm run format` excludes `docs/`, `*.json`, and `*.md` in `dprint.json` and is not a docs gate):

1. `npm -w docs run check:i18n -- --strict --complete --locale=<code>` (omit `--locale` once all locales ship): verifies key coverage, CLDR plural sets, placeholder parity, `HTML_KEYS`/`INLINE_KEYS` safety, required frontmatter, heading/table/directive/`:::truth` parity, `params`/`returns` YAML schemas, and fresh `source` hashes.
2. `npm -w docs run build`: verifies Astro static build across every locale route, build-time widget checks, and Pagefind indexing.
3. `npm -w docs run verify:i18n -- --strict --locale=<code>`: runs headless Chromium DOM assertions at `1440px` and `390px` (HTTP 200, zero `pageerror`, `lang`/`dir` parity, zero horizontal overflow, zero leaked `{var}` placeholders, zero escaped HTML tags, zero `undefined`, zero stray `.locale-notice` banners).
4. Spot-check rendered homepage widgets (`Say`, `LocaleProof`, `Bench`, `Consoles`, `YearStrip`, `Xray`, `Try`) and `/ar/` RTL layout visually.

---

## Rollout Priority

1. Simplified Chinese (`zh-CN`) and Japanese (`ja`)
2. Brazilian Portuguese (`pt-BR`) and Spanish (`es`)
3. Korean (`ko`)
4. Russian (`ru`) and French (`fr`)
5. Arabic (`ar`, primary RTL verification target)
