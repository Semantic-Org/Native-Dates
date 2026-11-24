---
title: "Docs Authoring: Maintaining the Standalone Docs Site"
description: Required features, visual design conventions, i18n hooks, and layout pitfalls for the Astro documentation site in docs/.
keywords: [docs, documentation site, astro, design system, playground, examples, versions, i18n, translation, rtl, homepage, gotchas]
audience: contributing
workflow: docs-authoring
type: workflow
---

# Docs Authoring: Maintaining the Standalone Docs Site

> **Workflow:** `docs-authoring`
> **Load when:** customizing or extending the Astro documentation site in `docs/` (`nativedates.dev`)

---

## Reference Implementation

`docs/` shares its Astro documentation shell with sibling standalone Semantic libraries (`docs-frame` and `nav-router`), and [`docs/README.md`](../../../docs/README.md) documents its commands and file layout. Because `native-dates` is framework-agnostic JavaScript, it omits the sidebar framework switcher (`frameworks.js`) used in framework-bound libraries while keeping every other shared site capability.

Raise open design questions with the maintainer rather than improvising new chrome patterns.

---

## Pre-Change Walkthrough

Before modifying site chrome or homepage components, run `npm run docs` (`npm -w docs run dev`) in a browser and inspect:

1. Desktop (`1440px`) dark and light themes: card bevels, top-left surface sheen, callout tones, and neutral code blocks against cool chrome.
2. Guide pages: callouts, numbered steps, single-line fences, table-of-contents scrollspy, and the Copy page dropdown.
3. API pages: `:::entry` blocks, `params` / `returns` rows, and URL-hash sidebar highlighting.
4. Plugins index (`/plugins/`): live search, card/list view toggle, multi-select bundle-size calculator, and URL query sync (`?use=`, `?q=`).
5. Interactive examples (`/examples/`): lazy playground boot, zone selector (`?zone=`), split-pane resizing, live rebuilds, and preview navigation controls.
6. `⌘K` search dialog, version switcher, language menu, and raw `.md` page endpoints.
7. Mobile (`390px`, plus `320px` zoom check): navigation drawer and collapsible TOC bar, plus stacked multi-column tables (`.stacks`) with zero horizontal overflow.
8. `prefers-reduced-motion: reduce`: static fallbacks for interactive visuals (`Say`, `Verdict`, `Consoles`, `YearStrip`, `Xray`, and the wordmark clock).

---

## Stack

- **Astro** rendering plain Markdown via custom `remark` and `rehype` plugins (avoid MDX unless strictly required).
- **Vanilla JS and CSS** without external UI component libraries.
- **Static HTML output** enhanced progressively by lightweight client modules.
- **Shiki** syntax highlighting mapped to CSS custom properties for instant theme switching.
- **Pagefind** search index behind a custom `⌘K` `<dialog>` (with `/search-index.json` fallback during `astro dev`).
- **Satori + Sharp** build-time Open Graph PNG cards (`1200x630`).
- **Self-hosted `@fontsource` fonts** (`Schibsted Grotesk` and `Fragment Mono`).
- **`@semantic-ui/playground`** for interactive browser sandboxes (with hidden `@native-dates/polyfill` setup so examples run in browsers without native `Temporal`).
- **Prebuilt Vercel deploys** from GitHub Actions (`staging-deploy.yml` and `release-deploy.yml`).

---

## Required Site Features

### Live playground examples (`/examples/`)

Interactive sandboxes demonstrating core library and localization capabilities. Lazy-load playground workers as the component scrolls near the viewport.

### Page actions menu

Split button offering one-click Markdown copy, raw `.md` view, and pre-filled prompts for Claude, ChatGPT, and Gemini.

### Version switcher

Topbar menu linking to GitHub Releases, staging/released docs, and frozen major-version subdomains (`v1.nativedates.dev`). Every deployed version fetches `/versions.json` from `nativedates.dev` on menu open so archived majors list newer releases and render an upgrade banner.

### Live bundle sizes

Build-time `esbuild` + Brotli-11 measurements via `tools/size.js` (`docs/src/lib/sizes.js`), including exact subset bitmask measurements for plugin combinations (`Bytes.astro` and `Plugins.astro`). Never hardcode byte sizes or quote gzip numbers. Unmeasurable targets fail the build.

---

## Visual and Layout Conventions

- **Whole-pixel geometry:** Keep layout dimensions and split positions on integer pixels.
- **Stable control widths:** Stack swappable button/dropdown labels in a shared CSS grid cell (`.swap`) so controls reserve their widest state without layout shift (`Copy page` -> `Copied`).
- **Centered reading column:** Center `.doc` relative to the viewport and position `.docs-toc` in the remaining inline space.
- **Bespoke homepage (`docs/src/views/Home.astro`):** Interactive demonstrations (`Say`, `LocaleProof`, `Primitives`, `Consoles`, `YearStrip`, `Xray`, embedded `Playground`, and `Bytes`) verify their build-time outputs against `native-dates` and `Temporal` at build time so equivalent panes cannot drift. The benchmark table (`Bench`) reads its times, ratios, and headline from a copied run of the cross-library benchmark (`docs/src/data/bench.json`), so never type a measured time into its copy.
- **Logical CSS properties (`inline`, `block`):** Use logical margins, borders, and padding throughout so RTL locales (`ar`) mirror cleanly.

---

## Internationalization

- Store every UI string, `aria-label`, `title`, and placeholder in `docs/src/content/strings.json`, read via `t()` / `plural()` at build time and `ui()` on the client (`npm -w docs run check:i18n`).
- Keep complete sentences in single translation keys with `{variable}` placeholders rather than concatenating fragments. Bump the key name whenever English meaning changes so translations fall back cleanly until updated.
- Route links through `localePath()` and keep distinct Astro route files per page kind (`Doc`, `Examples`, `Example`, `Plugins`, `Home`) parameterized by `[...locale]` so CSS bundles stay split per view.

---

## Common Pitfalls

- **Checking CSS only on paper or at exact breakpoints:** Inspect rendered pages across intermediate widths (`320px` through `1440px`) in both light and dark themes.
- **Closing mobile drawers on same-page hash jumps:** Ensure clicking `#anchor` links inside `.docs-sidebar` or `.toc-sheet` closes the overlay.
- **Merging distinct views into one catch-all Astro route:** Astro bundles CSS per route file. Combining homepage and doc routes bloats page stylesheets and changes cascade order.
- **Forgetting to reset process-wide `configure()` during build:** Any Astro component that calls `configure({ locale })` at build time (`LocaleProof.astro`) must reset `configure({ locale: null })` in a `finally` block so later static routes render under default settings.
