# nativedates.dev

Astro documentation site for `native-dates` (`docs/` workspace). Run commands from `docs/` or from the repository root via `npm -w docs run <script>` (or `npm run docs` for `dev`).

Static HTML documentation built with Astro from plain Markdown, enhanced with vanilla CSS and client JS.

```sh
npm install       # from repo root
npm run sandbox   # copy playground workers, package source, and temporal-polyfill into public/
npm run cert      # generate local.nativedates.dev SSL cert from the local dev CA (see cert/README.md)
npm run dev       # https://local.nativedates.dev on :443, or http://localhost:4321 without a cert
npm run build     # run check:i18n + sandbox + astro sync/build into dist/, and index with Pagefind
npm run preview   # preview dist/ locally with Pagefind search
```

Reader preferences (theme, plugin view, locale) persist in `localStorage` under `nd:*` keys. Core and plugin bundle sizes (including subset bitmasks) are measured at build time via `tools/size.js` (`src/lib/sizes.js`). Unmeasurable bundle targets fail the build.

Interactive examples (`/examples/`) run inside `@semantic-ui/playground`. `npm run sandbox` (`scripts/sync-sandbox.mjs`) copies playground worker assets into git-ignored `public/sandbox/` and copies `src/`, `packages/plugins/src/`, `packages/polyfill/`, and `temporal-polyfill` into git-ignored `public/libs/` for import-map resolution (`src/lib/import-map.js`).

## Deploys

GitHub Actions builds static output and deploys prebuilt artifacts to Vercel (`nativedates` project, Root Directory `docs`, Git auto-deploys disabled in `vercel.json`). Requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_NATIVEDATES_PROJECT_ID` (see [`ai/contributing/reference/setup.md`](../ai/contributing/reference/setup.md)).

| Trigger | Target environment |
|---|---|
| Push to `main` touching `docs/`, `src/`, or `packages/` | Staging: `staging.nativedates.dev` (`.github/workflows/staging-deploy.yml`) |
| `v*` git tag or manual `workflow_dispatch` | Production: `nativedates.dev` (`.github/workflows/release-deploy.yml`) |

## Authoring Pages

Markdown pages live under `src/content/docs/{guides,api,plugins}/`, ordered by `src/lib/nav.js` (unwritten nav slugs render as disabled sidebar stubs). Follow [`ai/contributing/workflows/docs-writing.md`](../ai/contributing/workflows/docs-writing.md) for prose targets and layout rules.

```yaml
---
title: DateTime                          # formatted as <code> when kind is set
kind: class                              # class | function | plugin (optional)
lede: One complete summary sentence. `code` is allowed.
import: import { datetime, now } from 'native-dates'
size: core                               # 'core' or plugin filename in packages/plugins/src/
updated: 2026-11-16
---
```

Run `npx --workspace docs astro sync --force && npm -w docs run build` before committing, since `astro dev` continues serving cached renders when Markdown or YAML frontmatter syntax fails.

### Markdown Directives

| Syntax | Output |
|---|---|
| `:::note[Title]` ... `:::` | Callout (`note`, `tip`, `warning`, `danger`). |
| `:::steps` | Styled ordered walkthrough list (start each item with `**Bold title**`). |
| `:::entry` | API reference entry opened by `` ### `plus()` :kind[method] ``. |
| `:::truth` | Table where `true` / `false` cells render as tinted status words. |
| ` ```js title="app.js" ` | Code block with filename header. |
| ` ```js {3,5} ` | Line highlighting. |
| ` ```js signature ` | Chromeless signature block. |
| ` ```params ` / ` ```returns ` | YAML parameter/return tables (`name`, `type`, `required`, `default`, `description`, `options`). |

### Interactive Examples

Each folder under `src/content/examples/<id>/` contains runnable source files (`index.html`, `app.js`, `style.css`) alongside `example.md` metadata, registered under `examples` in `src/lib/nav.js`.

### Localization

English serves at `/` with 8 additional locales enabled in `src/lib/locales.js` (`zh-CN`, `ja`, `es`, `pt-BR`, `ko`, `fr`, `ru`, `ar`). Translations live under `src/content/translations/<locale>/`, storing UI keys in `strings.json` and translated Markdown twins carrying a `source` SHA-256 hash (`node src/lib/source-hash.js <english-page>`), checked by `npm -w docs run check:i18n`. See [`ai/contributing/workflows/docs-i18n.md`](../ai/contributing/workflows/docs-i18n.md).

## Directory Layout

| Path | Contents |
|---|---|
| `src/content/docs/` | Guide, API, and plugin Markdown pages |
| `src/content/examples/` | Live playground example directories |
| `src/content/translations/` | Per-locale `strings.json` and translated Markdown twins |
| `src/content/strings.json` | English UI string dictionary |
| `src/data/home-locales.js` | Localized homepage interactive proof configs |
| `src/lib/nav.js` | Sidebar navigation hierarchy and pagination |
| `src/lib/{plugins,locales,i18n,sizes,versions}.js` | Plugin metadata, locale routing, build-time bundle sizes, and version switcher |
| `src/lib/markdown/` | Custom `remark`, `rehype`, and Shiki transformers |
| `src/layouts/` | `Base.astro` (document head, theme, locale toast) and `DocsChrome.astro` (topbar, sidebar, TOC) |
| `src/views/` | Page templates (`Doc`, `Example`, `Examples`, `Plugins`, `Home`) |
| `src/components/` | Shared `DocsTopbar`, `LocaleNotice`, `Playground`, and `home/*` interactive widgets |
| `src/pages/` | Localized Astro routes, OG cards, search index, and `/llms*.txt` endpoints |
| `src/styles/` | `tokens.css`, `docs.css`, `home.css`, `playground.css` |
| `src/scripts/` | Client modules (`site.js`, `search.js`, `docs-client.js`, `playground.js`, `plugins.js`, `home/*`) |
| `scripts/` | `check-i18n.mjs`, `sync-sandbox.mjs`, `make-cert.sh` |
