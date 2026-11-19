---
title: Authoring Tests and Test Names
description: How to assert errors and warnings without coupling to dev prose, when substring checks are legitimately required, how to name describe() and test() blocks for high CI signal, and where to place and name test files.
keywords: [tests, assertions, createErrors, error.code, error.at, describe, test-names, legibility]
skill: tests-and-test-names
type: skill
---

# tests-and-test-names — error assertions, test names, and suite layout

Load this skill before adding or editing any test assertion on thrown errors or console warnings, naming a `describe()` or `test()` / `it()` block, or creating or moving a test file under `packages/*/test/` or `tests/`.

---

## 1. Mechanism — Asserting Errors & Warnings Without Pinning Dev Essays (`#405`)

### How `createErrors` Structures Errors

Every error thrown through `createErrors` (`throwError`, `throwTypeError`, `error`) attaches structured properties onto the `Error` instance alongside a two-line `error.message`:

```text
<namespace> <verb> [<code>] <at>
<explanation>
```

- **`error.code`** — the camelCase condition identifier (`'conflictingBind'`, `'missingArgsSchema'`, `'invalidElementId'`).
- **`error.at`** — the callsite or configuration path (`'orders.registerCollection'`, `'accounts.passwordHash.memoryCost'`).
- **`error.detail`** — optional structured metadata (`{ bound: 'server', attempted: 'client' }`).
- **`error.message.split('\n')[1]`** — the developer explanation and remediation sentence(s).

### Why Regex-Matching Full Prose Sentences Is an Anti-Pattern Here

1. **Client dev prose folds out of production builds:** In client and shared modules (`packages/schema/`, `packages/db/`, `packages/sync/src/{client,shared}/`, `packages/{accounts,files}/src/{client,shared}/`), `explanation` is gated behind `isDevelopment ? '...' : 0` so production bundles ship only `sync refused [code] at`.
2. **Pinning prose turns copy improvements into multi-package test breakage:** During the 2026-10-25 legibility sweep (`#389`, `#391`, `#396`, `#399`–`#401`), rewriting error prose broke **207 regex assertions across 100 test files** when zero runtime error codes or behaviors had changed. PR `#405` decoupled those assertions so error prose can evolve freely.

### The Standard Error Assertion Shape

1. **Assert `error.code` and `error.at` (plus `error.detail` when supplied):**
   ```js
   assert.throws(
     () => Twice._bind({ _side: 'client' }),
     (error) => error.code === 'conflictingBind'
       && error.at.endsWith('.registerCollection')
       && error.detail.bound === 'server',
   );

   // Or with assert.rejects / object matching:
   await assert.rejects(() => server.registerAction('naked.op', () => {}), {
     code: 'missingArgsSchema',
     at: 'registerAction:naked.op',
   });
   ```
2. **When verifying that dev explanation prose rendered (`isDevelopment`), assert Line 2 exists structurally:**
   ```js
   assert.throws(
     () => new Accounts({ tunings: { password: { memoryCost: 1024 } } }),
     (error) => error.code === 'weakPasswordHash'
       && error.at === 'accounts.passwordHash.memoryCost'
       && Boolean(error.message.split('\n')[1]),
   );
   ```
3. **When verifying that a runtime identifier was interpolated into the error, match only the identifier token — never the surrounding sentence:**
   ```js
   // [Not This] — pins the English sentence around the interpolated token
   assert.throws(() => server.registerAction('things.spin', { args: {}, run: () => {} }), /collides with a registered mutator/);

   // [This] — pins the error code and the interpolated collision kind
   assert.throws(
     () => server.registerAction('things.spin', { args: {}, run: () => {} }),
     (error) => error.code === 'duplicateRegistration' && /mutator/.test(error.message),
   );
   ```

---

## 2. Declined Edges — When Substring or Prose Assertions Are Required

Evaluating all 84 prose-coupled test files in PR `#405` modified **49 files** and intentionally preserved substring or regex checks in **35 files** (plus specific sub-branches inside the 49 modified files). Keep a minimal regex or substring assertion in these five cases:

1. **Shared `error.code` across distinct validation sub-branches:**
   When a single code (`invalidRule`, `invalidCall`, `invalidField`, `invalidConfig`, `invalidIndex`, `invalidOperand`, `invalidComposite`, `invalidPublication`, `invalidAddress`, `unknownOption`) covers multiple validation failures at the same `at` callsite, assert `error.code` plus the **minimal distinguishing option, type, or token** (`/'onlyFields'/`, `/'compute'/`, `/Point/`, `/\$regex/`, `/stream.*sort/`, ``/`mutate`/``), never the full sentence:
   ```js
   assert.throws(
     () => compileSelector({ location: { $gt: new Point(1, 2) } }),
     (error) => error.code === 'invalidOperand' && /Point/.test(error.message),
   );
   ```
2. **Console warnings and server log lines without an `error.code`:**
   Warnings and logs emitted via `warn`, `warnOnce`, `info`, or `logError` are formatted strings with no `.code` property. Match the `[namespace]` badge (when relevant) and the **minimal technical token, option path, or clamped value** (`/"1h".*token\.life.*"60d"/`, `line.includes('accounts.origin')`), not multi-clause prose.
3. **Native runtime, SQLite, Postgres, Redis, or OS/socket errors:**
   Errors thrown directly by the JS runtime, `node:sqlite`, `pg`, `redis`, or OS primitives (`ENOENT`, `EADDRINUSE`, `ECONNREFUSED`, `crypto.argon2` checks, or raw SQL errors before adapter translation) do not pass through `createErrors` and must be matched by native `error.code` or driver tokens.
4. **Tests whose subject is the diagnostic formatter or bundle-stripping machinery itself:**
   Suites that directly unit-test `createErrors`, `formatServerLog` (`fadeSecondary` ANSI splitting), computation log formatting (`computation-logs.test.js`, `live-server.test.js`), fault redaction (`fault-isolation.test.js`), `[trace]` formatting (`trace.test.js`), or dev-vs-prod bundle stripping (`prod-bundle-stripping.test.js`, `unhandled-error-reporting.test.js`) must assert the rendered prose.
5. **Wire-protocol rejection `reason` tokens:**
   Assertions on short wire-frame rejection identifiers (`pull-error` reasons like `'unknown publication'`, or numeric wire fault codes like `4201` / `4300` paired with `/schema mismatch/`) test the wire contract rather than dev essays.

---

## 3. Words — Maximize Conceptual SNR in `describe()` and `test()` / `it()`

When a test fails in CI (`npm test`), the `describe > test` line is the first diagnostic the developer reads. Over **1,350** test and suite descriptions were rewritten across `#389`, `#391`, and `#396`:

- **`describe()` names the class, method, module, or protocol mechanism under test:** Write `describe('DatagramPlane sequence loss and silence detection')` — never literary chapter headings (`describe('the carriage')`, `describe('the lag valve')`, `describe('the fork and the join')`) or historical milestones (`describe('Row 55 Phase 2')`).
- **`test()` / `it()` states the observable behavior, condition, and outcome:** Start with an active verb or clear condition (`'resolves presence (30 Hz, connection) and animation (60 Hz, 30s) presets...'`). Never personify code (`hears notFresh`, `until the map learns it`) or write proverbs.
- **Assertion messages state the broken invariant:** In `assert.equal(actual, expected, message)`, explain *why* the value must hold (`'returns 500 (server misconfiguration) rather than 400 (client error) when accounts.guestName returns a non-string'`), not a riddle (`"the deployment's error, never the person's"`).

### Calibrated Examples (`[Not This]` -> `[This]`)

| `[Not This]` (Chapter Title or Koan) | `[This]` (Shipped in `#389` / `#391` / `#396`) | Why / Loose Rule |
| :--- | :--- | :--- |
| `describe('the carriage', () => {` | `describe('WebTransport datagram downlink fan-out and fallback', () => {` | Name the transport mechanism and direction, not a private metaphor (`the carriage`). |
| `describe('the lag valve', () => {` | `describe('server pong-lag detection, ping.lagged marker, and replace recovery', () => {` | Name the exact protocol signals (`pong-lag`, `ping.lagged`, `replace`). |
| `test('the chain refuses after the seal, like a width', () => {` | `test('chaining a condition after _sealRules() throws rulesSealed, matching field restriction methods', () => {` | Name `_sealRules()`, `rulesSealed`, and replace `a width` with `field restriction methods`. |
| `test('a condition this side does not check never refuses: unknown from the first one a grant meets, and a deny carrying one never holds', () => {` | `test('assertRuleConditions skips conditions excluded by the checks filter: an allow grant passes on its first unchecked condition and a deny with an unchecked condition does not trigger', () => {` | Name `assertRuleConditions`, the `checks` filter, and the exact `allow` vs. `deny` behavior. |
| `test('a person with no password sets a first one inside the freshness window, and hears notFresh outside it', () => {` | `test('allows setting an initial password within the fresh-session window and rejects with notFresh after it expires', () => {` | Cut personification (`hears notFresh`) and state the allowed vs. rejected conditions. |
| `test('every route answers its own refusal to a bare body, never a 500: the eleven run with the instance intact', () => {` | `test('all eleven /accounts/* routes handle an empty \'{}\' JSON body without throwing an unhandled 500 error', () => {` | State the input (`empty '{}' JSON body`), target (`/accounts/*`), and outcome (`no unhandled 500`). |
| `test('upsert-creates: a write IS presence, and the return is the shared settled shape', () => {` | `test('creates absent keys on update() and returns { id, settled } with a shared pre-resolved promise', () => {` | Replace slogans (`a write IS presence`) with the method (`update()`) and return shape (`{ id, settled }`). |

---

## 4. Structure & Placement — Package Suites vs. Global Tests & File Naming

### Test File Naming

Name test files for the **feature, subsystem, or contract they verify** — never for a schedule row, decision number, PR review, or vignette (`#390`–`#397`). Drop redundant middle nouns (`persistence-retention.test.js` over `persistence-tombstone-retention.test.js`, `element-id-divergence.test.js` over `element-id-divergence-warning.test.js` in `maintainer-rewrites.md` §5):

| `[Not This]` (Incident, Decision, or Vignette) | `[This]` (Feature / Contract Name) | Location |
| :--- | :--- | :--- |
| `postgres-decision11.test.js` | `postgres-jsonb-pushdown.test.js` | `packages/sync/test/adapters/` |
| `derive-tripwire.test.js` | `element-id-divergence.test.js` | `packages/sync/test/client/` |
| `ghost-strand-factory.test.js` | `persistence-retention.test.js` | `packages/sync/test/client/` |
| `day1-wall.test.js` | `inline-blob-size-guard.test.js` | `packages/files/test/` |
| `essay-fold.test.js` | `prod-bundle-stripping.test.js` | `packages/{accounts,db}/test/` |
| `stranger-ledger.js` / `closed-laptop.js` | `foreign-ledger-rejection.js` / `suspend-lease-handoff.js` | `tests/persistence/` |

### Package Suites (`packages/*/test/`) vs. Global Integration Scripts (`tests/`)

1. **Package suites (`packages/*/test/**/*.test.js` under `node:test`):** Test a single package's classes, functions, wire codecs, channels, or adapters. In `packages/sync/test/`, place files inside one of the **8 domain subfolders** (`packages/sync/test/{adapters,channels,client,ephemeral,server,session,transport,wire}/`), with shared harnesses in `packages/sync/test/helpers/` (`#helpers/*`) and static data in `packages/sync/test/fixtures/` (`#fixtures/*`).
2. **Global integration scripts (`tests/<subsystem>/<name>.js`, exiting `0`/`1`):** Reserved for cross-package integration, multi-node topologies (`tests/multinode/`), transport-ladder conformance (`tests/conformance/`), deploy recipes (`tests/deploy/`), and Playwright browser verification (`tests/demos/browser.js`).
3. **Never spawn standalone `tests/` scripts for fast unit checks (`#397`):** Each file in `tests/` boots a separate Node process. In `#397`, 25 wire-trace scripts (`tests/trace/*.js`) were folded into `packages/sync/test/wire/trace.test.js` and 5 pure DB unit scripts moved into `packages/db/test/`, eliminating 29 process spawns per battery run.
4. **Gates:** Run `npm run comments:tests` to check test comment density and prose register, and `npm test -- --changed` to run suites reached by your diff (never pass `--test-force-exit` to `node --test`).
