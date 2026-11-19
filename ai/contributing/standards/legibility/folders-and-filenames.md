---
title: Organizing Folders, Filenames, and Intra-Package Imports
description: How to structure package source and test trees, name files and exported classes, consolidate category helpers, and use package.json # subpath imports without over-nesting or path churn.
keywords: [folders, filenames, imports, subpath, helpers, taxonomy, legibility, package-structure]
skill: folders-and-filenames
type: skill
---

# folders-and-filenames — package layout, filenames, and `#` imports

Load this skill before adding, moving, splitting, or renaming files or folders in `packages/*/src/`, `packages/*/test/`, `tests/`, or `scripts/`, or when configuring `package.json` `"imports"` / `"exports"`.

---

## 1. Mechanism — Package-Internal `#` Subpath Imports (`#398`)

### Declaring Subpath Imports in `package.json`

Packages whose source tree spans multiple domain subfolders declare Node subpath `"imports"` in `package.json` so deep files never climb parent directories with `../../` or `../../../`:

- **`@semantic-ui/sync`:** `"#client/*": "./src/client/*"`, `"#server/*": "./src/server/*"`, `"#shared/*": "./src/shared/*"`
- **`@semantic-ui/accounts`:** `"#client/*": "./src/client/*"`, `"#collections/*": "./src/collections/*"`, `"#shared/*": "./src/shared/*"`
- **`@semantic-ui/emails`:** `"#helpers/*": "./src/helpers/*"`, `"#templates/*": "./src/templates/*"`, `"#subtemplates/*": "./src/templates/subtemplates/*"`, plus conditional `"#registry"` (`browser` vs. `default`)
- **`@semantic-ui/db`:** Conditional `"#ambient"` (`"node": "./src/helpers/ambient-server.js"`, `"default": "./src/helpers/ambient-browser.js"`)

### When to Use Relative `./` vs. `#subpath` vs. `@semantic-ui/<pkg>`

Do not convert every import in a package to a `#` path from root. Use `#` imports only where they replace multi-level parent walks and eliminate path churn when files move:

1. **Same-directory siblings (`./foo.js`) and 1-level local neighbors (`'./helpers/http.js'`, `'../fixtures/harness.js'`):** Keep standard relative imports. A 1-level walk to an immediate neighbor is clear on its own and should not be rewritten to a root subpath.
2. **Cross-subfolder or deep parent walks (`../../` or `../../../`):** Always use a `#` subpath import (`#shared/protocol.js`, `#helpers/context.js`, `#subtemplates/buttons/buttons.js`, `#collections/sessions/sessions.js`, `#server/adapters/sqlite/adapter.js`). Never write `../../` or `../../../` inside `packages/*/src/`, and use `#server/*` / `#client/*` / `#shared/*` from `packages/sync/test/<domain>/*.test.js` instead of `'../../src/...'`.
3. **Cross-package imports:** Always import through the package name (`@semantic-ui/utils`, `@semantic-ui/schema`, `@semantic-ui/db`, `@semantic-ui/sync`), never via relative paths across `packages/*/`.

### Tooling & Diff Discipline

- **Static reach analysis (`scripts/test/select.js`):** The test runner's `Reach` graph reads `package.json` `"imports"` for each package so `npm test -- --changed` and `--reaches` trace `#client/*`, `#server/*`, and `#shared/*` edges accurately. Whenever you add a new `#` subpath pattern in `package.json`, verify `node --test scripts/test/select.test.js` passes.
- **Separate `git mv` PRs from import-style sweeps:** When reorganizing folders across a package, keep file moves (`git mv`) in their own commit or PR before doing broad import rewrites so Git rename detection stays at 95–100% similarity.

---

## 2. Structure — Controlling Directory Entropy Without Over-Nesting

### Keep Root `packages/*/src/` and Plane Roots Clean

Top-level `packages/*/src/` (and plane roots `packages/sync/src/client/`, `packages/sync/src/server/`, `packages/sync/src/shared/`) hold **only**:
- Public barrels and entrypoints (`index.js`, `kernel.js`, `server.js`, `sync-client.js`)
- Primary domain classes and core engine modules (`schema.js`, `field.js`, `type.js`, `collection.js`, `pool.js`, `query.js`, `query-registry.js`, `cached.js`, `live.js`, `connection.js`, `outbox.js`, `rebase-engine.js`)

Evict free-function utilities, brand symbols, proxy IP tables, MIME tables, and error/logger wrappers out of root `packages/*/src/` into `helpers/`.

### One Class Per File (`05a-1`)

Author classes as dedicated single files with their `static tunings` and static constants on the class (`naming-lessons.md`: *"Author Classes as Single Files and Dont Encode Settings in Consts"*). When a file grows two distinct classes — such as `'packages/db/src/queries.js'` housing both `Query` and `QueryRegistry` — split it into one file per class (`packages/db/src/query.js` and `packages/db/src/query-registry.js`).

### Group by Category in `helpers/` — No Single-Function Helper Files

Model every `helpers/` folder on `@semantic-ui/utils` (`arrays.js`, `bytes.js`, `cloning.js`, `dates.js`, `objects.js`, `paths.js`, `strings.js`, `types.js`). Group related free functions by **domain category**, never one function per file:

- **Why:** Scattering 5–30 line single-function files (`promises.js` 9 LOC, `identity.js` 11 LOC, `duplicate-key.js` 11 LOC, `serve-asset.js` 14 LOC, `duration.js` 7 LOC, `plain-text.js` 21 LOC) across a package makes helpers hard to find and turns a package's `src` tree into a bag of fragments.
- **Canonical category modules across packages:**
  - `helpers/errors.js`: Combines `createErrors` (`error`, `throwError`, `throwTypeError`, `line`) and `createLogger` (`info`, `warn`, `warnOnce`, `logError`) in one module instead of separate 3-line `log.js` and 5-line `errors.js` files.
  - `packages/sync/src/server/helpers/`: Consolidated 16 small files into `http.js` (forwarded headers, `trustProxy` ranges, static asset serving, debug route), `storage.js` (changeset builders, `UniqueIndex`, `DuplicateKey`, `DuplicateCall`, `mintStorageId`, `parseHistoryMs`), `runtime.js` (brand symbols, `AsyncLocalStorage` ambient engine, server planes, query descriptions, `within`), `log.js`, `mime.js`, and `tunings.js`.
  - `packages/sync/src/client/helpers/`: Consolidated into `diagnostics.js` (client loggers, `faultOf` / `describeFault`, trace size/kind helpers) and `runtime.js` (global client registry and tunings).
  - `packages/schema/src/helpers/`: `dev.js`, `errors.js`, `identity.js`, `overrides.js`, `paths.js`, `server.js`, `types.js`.
  - `packages/db/src/helpers/`: `ambient-browser.js`, `ambient-server.js`, `errors.js`, `identity.js`, `options.js`.

### Keep Category Folders Homogeneous

Every file or subfolder inside a category directory (`types`, `dates`, `adapters`, `drivers`, `providers`, `presets`) must be a peer instance of that category:
- `packages/schema/src/types/` and `packages/schema/src/dates/`: Only type definitions (`'dates/helpers.js'` was absorbed into `packages/schema/src/helpers/types.js`).
- `packages/sync/src/server/adapters/`: Only storage adapter directories (`libsql`, `memory`, `postgres`, `sqlite`). Shared index/error helpers live in `packages/sync/src/server/helpers/storage.js`.
- `packages/files/src/server/drivers/`: Only storage drivers (`local.js`, `memory.js`, `r2.js`). Shared byte/range/sniff helpers (`'drivers/shared.js'`, `sniff.js`, `units.js`) live in `packages/files/src/server/helpers/bytes.js`.
- `packages/emails/src/providers/`: Only mail transport providers (`brevo.js`, `mailgun.js`, `mandrill.js`, `postmark.js`, `resend.js`, `sendgrid.js`, `ses.js`, `smtp.js`, plus `index.js`). Shared HTTP/header helpers (`'providers/shared.js'`) live in `packages/emails/src/helpers/provider.js`.

### When to Introduce Subfolders vs. Declined Over-Nesting Edges

Introduce domain subfolders when a flat directory grows past ~8–10 files spanning distinct concerns — and rewrite growing bags of entropy early (`scripts/` 49 flat files -> 8 subfolders; `packages/sync/test/` 196 flat files -> 8 domain subfolders `packages/sync/test/{adapters,channels,client,ephemeral,server,session,transport,wire}/`; global `tests/` 23 folders -> 15 cohesive folders).

Respect the three boundaries where the maintainer **declined** deeper nesting or flattening:

1. **Flat peer cohort in `transport/` over 2-file sub-subfolders (`#397`):** Instead of nesting `transport/webtransport/{datagram,stream}.js` another level deep, keep all transport lanes flat side-by-side in `transport/` (`index.js`, `poll.js`, `sse.js`, `websocket.js`, `webtransport-datagram.js`, `webtransport-stream.js`) so a directory listing shows the entire transport cohort at a glance.
2. **No 1-file wrapper folders for a single utility (`#393`):** Flatten single-file folders when they hold a utility or lone test (`'packages/emails/src/strings/en-us.js'` -> `packages/emails/src/helpers/copy.js`; 1-file `'tests/router/static-site.js'` -> `tests/deploy/site-serving.js`).
3. **Preserve the canonical `collections/<name>/` layout (`#394`):** Never flatten `collections/<name>/<name>.js` into `collections/<name>.js` or inline `publications/*.js` into the collection definition (`packages/accounts/src/collections/{codes,credentials,sessions,users}/` and `packages/accounts/src/collections/users/publications/current.js`). Shared collections across packages and apps follow a uniform folder contract (`<name>.js`, `schema.js`, `rules.js`, `checks.js`, and a `publications` subfolder).

---

## 3. Words — Naming Files, Classes, and Folders

### Align Filenames and Exported Classes to Public Concepts

Every class file is kebab-cased to match its exported class name (`hasher.js` -> `Hasher`, `files-plane.js` -> `FilesPlane`, `connection.js` -> `Connection`, `rebase-engine.js` -> `RebaseEngine`, `funnel.js` -> `RedisFunnel`).

When a filename and its exported class disagree, **resolve the mismatch toward the public concept or industry term, never internal planning jargon**:
- In `#05b-46`, `packages/sync/src/server/cached.js` exported `class CachedTier`. Renaming the file to `cached-tier.js` was rejected because `"tier"` is internal architecture jargon while client callers write `cached('name')`. The filename stayed `packages/sync/src/server/cached.js` and the class became `export class Cached` (matching `export class Accounts` in `packages/accounts/src/server/accounts.js`).
- Inside a domain subfolder that already names the namespace (`packages/sync/src/server/redis/`), omit the redundant prefix on the filename while keeping it on the exported class (`redis/funnel.js` exporting `RedisFunnel`, `redis/lane.js` exporting `RedisLane`, `redis/link.js` exporting `RedisLink`).

### Singular vs. Plural Folder Names

- **Plural for open sets of peer instances or category modules:** `'adapters'`, `'channels'`, `'collections'`, `'components'`, `'dates'`, `'drivers'`, `'fixtures'`, `'helpers'`, `'presets'`, `'providers'`, `'templates'`, `'types'`.
- **Singular for a runtime plane, architectural role, or protocol mechanism:** `'client'`, `'server'`, `'shared'`, `'sidecar'`, `'transport'`, `'redis'`, `'search'`, `'convert'`, `'debug'`, `'session'`, `'wire'`, `'ephemeral'`.

### Calibrated Examples (`[Not This]` -> `[This]`)

| `[Not This]` (Before / Naive Agent Proposal) | `[This]` (Shipped Maintainer Calibration) | Why / Loose Rule |
| :--- | :--- | :--- |
| `'src/server/cached-tier.js'` (`export class CachedTier`) *(agent proposal)* | `packages/sync/src/server/cached.js` (`export class Cached`) | Rename the class to match the clean public filename when the class name carries internal jargon (`Tier`). |
| `'src/server/webtransport-socket.js'` or `'src/server/transport/webtransport/stream.js'` | `packages/sync/src/server/transport/webtransport-stream.js` (`WebTransportStreamSocket`) | Keep transport lanes flat inside `transport/` alongside `poll.js`, `sse.js`, `websocket.js`, and `webtransport-datagram.js`. |
| `src/server/helpers/{promises,serve-asset,forwarded,proxies,debug,identity,ambient,planes}.js` *(16 tiny files)* | `packages/sync/src/server/helpers/{http,storage,runtime,log,mime,tunings}.js` | Group `helpers/` by category like `@semantic-ui/utils`; never create single-function helper files. |
| `'src/queries.js'` exporting both `Query` and `QueryRegistry` | `packages/db/src/query.js` (`Query`) + `packages/db/src/query-registry.js` (`QueryRegistry`) | One class per file (`#05a-1`). |
| `'src/server/password.js'` (`export class Hasher`) & `'src/server/plane.js'` (`export class FilesPlane`) | `packages/accounts/src/server/hasher.js` (`Hasher`) & `packages/files/src/server/files-plane.js` (`FilesPlane`) | Match the filename to the exported class name (`#05a-23`, `#395`). |
| `'src/providers/shared.js'`, `'src/server/drivers/shared.js'`, `'src/dates/helpers.js'` | `packages/emails/src/helpers/provider.js`, `packages/files/src/server/helpers/bytes.js`, `packages/schema/src/helpers/types.js` | Keep `'providers'`, `'drivers'`, and `'dates'` 100% homogeneous; move shared helpers to `helpers/`. |
| `collections/{codes,credentials,sessions}.js` + inlined `'users/publications/current.js'` *(agent proposal)* | `packages/accounts/src/collections/{codes,credentials,sessions,users}/` + `packages/accounts/src/collections/users/publications/current.js` | Preserve the canonical `collections/<name>/` and `'publications'` folder structure even when a collection is small. |
| `import { codes } from '../../shared/protocol.js'` or `'../../../helpers/theme.js'` | `import { codes } from '#shared/protocol.js'` or `'#helpers/theme.js'` | Use `package.json` `#` subpath imports for cross-subfolder walks (`../../`+), while keeping `./` for local siblings (`#398`). |
