---
title: Authoring Errors and Logs
description: How to author thrown errors, warnings, console logs, option hints, and fault tooltips across client and server packages — dev-fold vs. server-inline mechanics, callsite verification, conceptual SNR, house prose register, and gates.
keywords: [errors, logs, warnings, legibility, createErrors, createLogger, fadeSecondary, isDevelopment, size, prose]
skill: errors-and-logs
type: skill
---

# errors-and-logs — authoring errors, warnings, and logs

Load this skill before adding or editing any thrown error, `checkOptions` hint, `copy` table entry, `warn` / `warnOnce` / `info` / `logError` call, or DevTools fault/timeline tooltip in `packages/*/src/`.

---

## 1. Mechanism — Client Fold vs. Server Wrapper, Caught Throws, and Logger Split

### The Unified Error Contract (`createErrors`)

Every package binds `createErrors({ namespace })` and `createLogger({ namespace, fadeSecondary: true })` from `@semantic-ui/utils` in its `helpers/errors.js` (or `server/helpers/log.js`). `@semantic-ui/schema`, `@semantic-ui/db`, and `@semantic-ui/sync` share the `'sync'` error namespace; `@semantic-ui/accounts`, `@semantic-ui/files`, and `@semantic-ui/emails` use their own package name.

Every error uses `throwError(code, at, options)`, `throwTypeError(code, at, options)`, or `error(code, at, options)` and produces a two-line `Error.message`:

```text
<namespace> <verb> [<code>] <at>
<explanation>
```

- `<verb>` defaults to `'refused'` (`'caught'` and `'noted'` are the other two verbs).
- `error.code`, `error.at`, and `error.detail` sit on the `Error` instance for programmatic handling and test assertions.
- Never call raw `console.log`, `console.warn`, or `console.error` in `packages/*/src/`.

### Client & Shared Dev-Shed Posture (`isDevelopment ? '...' : 0`)

Client and shared modules (`packages/schema/`, `packages/db/`, `packages/sync/src/{client,shared}/`, `packages/{accounts,files}/src/{client,shared}/`) strip developer prose from production builds so the client ships only `sync refused [code] at`.

Always gate `explanation` with an **inline ternary at the callsite**, and gate `checkOptions` hint tables with `isDevelopment ? { ... } : null`:

```js
throwTypeError('conflictingIdOptions', key, {
  explanation: isDevelopment
    ? '`format: \'uuid\'` cannot be combined with `prefix` because prefixed IDs are not valid UUIDs and cannot be stored in native UUID columns. Remove `prefix` or `format`'
    : 0,
});
```

For coded console lines in client/shared code, spread `line(code, at, isDevelopment ? '...' : 0, payload)` into the logger (`info(...line(...))`), which falls back to `[code] at` when `isDevelopment` folds to `0`.

**Why inline:** esbuild's `PROD_DEFINE` (`__DEV__: 'false'`) folds dead branches at the callsite where the string literal sits, but will not inline a builder across package boundaries. Deferring prose behind a helper or thunk leaves the string in the client bundle (measured: a thunk reclaimed 37 B of a ~2 KB pool; the inline ternary strips 100%).

### Server Error Posture (Unconditional `explanation`)

Server-only modules (`packages/*/src/server/**`, `packages/emails/src/**`, `packages/db/src/helpers/ambient-server.js`) never enter client bundles and run under `NODE_ENV=production` in deployed environments where operators need the full diagnostic text.

- Pass `explanation` **unconditionally** without `isDevelopment ? ... : 0`:
  ```js
  throwTypeError('unknownProvider', `files.stores.${name}`, {
    explanation: `store '${name}' specifies unknown provider '${provider}'. Pass one of [${Object.keys(FILES_PROVIDERS).join(', ')}] or a storage driver instance`,
  });
  ```
- Never use raw `throw new Error(...)` for uncaught server errors; route through `throwError` or `throwTypeError` (`npm run errors` enforces this via `server-error-wrapper`).
- For end-user HTTP/wire refusals (`Refusal` / `refusalAnswer` in `accounts`, `refuse` / `rejection` in `emails`), keep templates in `copy.js` with `{token}` placeholders filled via `fill(copy[sentence], values)`.

### Parent-Caught Internal Server Throws (`CAUGHT_SERVER_THROW_CONTEXTS`)

When an internal server helper throws only as local control flow and an enclosing `try/catch` catches and translates it into a wire rejection, `recordFault`, `logError`, or fallback value, do **not** mint a public `[code]` via `throwError`. Use a plain `throw new Error('...')` in the house prose register and register the enclosing function in `CAUGHT_SERVER_THROW_CONTEXTS` in `scripts/gates/errors.js`.

### Logger Namespace Badges & `fadeSecondary` (`. Capital` Split)

On the server, `formatServerLog` renders every `info`, `warn`, `warnOnce`, and `logError` call with:
1. A dim timestamp and bold colored `[namespace]` badge (`[sync]`, `[accounts]`, `[files]`, `[db]`, `[schema]`, `[emails]`).
2. Automatic ANSI highlighting for quoted strings (`'...'`), backticked code (`` `...` ``), object/array literals (`{ ... }`), numbers with units (`10ms`, `512B`), and file paths.
3. A **`fadeSecondary` split on the first `. ` boundary** (`text.indexOf('. ')`):
   - **Sentence 1** (diagnosis: what happened and why) prints in the bright primary color.
   - **Sentence 2+** (remediation or fallback) prints in a dimmed secondary color.

Two rules follow directly:
- **Never prefix prose with the package or function name** when the badge or `error.at` already prints it (write ``store '${name}' cannot set cacheControl...``, never ``files: store '${name}'...``; write ``storage adapter implements `lookupResult`...``, never ``createSyncServer: storage adapter...``).
- **Separate diagnosis from remediation with `. Capital`** (`explanation. Action`), never `—`, `;`, or `. lowercase`.

---

## 2. When to Warn, Log, or Error — Severity & Callsite Verification

### Silence on Startup and Default Paths

- **Do not log routine startup steps or valid default configurations.** Booting a server, mounting a plane, or running with default options is silent.
- An `info` log on startup is earned only when the runtime automatically adjusts a developer tuning and the operator needs to know why (e.g., when `accounts.tunings.timing.floor` is shorter than 3x measured Argon2 hash time and the server raises the floor to prevent timing enumeration).

### `warn` vs. `warnOnce`

- Warn **only** for a probable developer mistake or suboptimal configuration that hurts wire size, latency, or security (e.g., uncompressed JSON over WebTransport datagrams because an ephemeral field type lacks binary encoding, or declaring an element `id` under `keyed: false`). Never warn on a valid choice just to narrate tradeoffs.
- Any warning reachable on a recurring path (queries, mutations, projections, datagram flushes, proxy headers, reconnects) **must** use `warnOnce(key, message)` keyed by collection, field, or peer so a loop cannot flood the console.

### Verify the Runtime Branch Before Writing Prose

Never paraphrase an existing error string or comment without inspecting the conditional branch and caller context that trigger it.

During the 2026-10-25 sweep, verifying error prose against live callsites caught **5 real kernel bugs**:
1. **Blocked `serverOnly: true` private writes (`#387`):** The old message claimed `serverOnly` ran with client permissions, forbidding `private: true` writes. Reading `runMutator` revealed `server.js` hardcoded `plane: 'client'` even when `def.serverOnly === true`. Fixing the kernel flipped the message to teach `serverOnly` + `simulate()`.
2. **Inverted unbound-client diagnosis (`#386`):** Inside `if (isClient)`, `handle.cached()` and `handle.live()` threw `cachedIsClientOnly` (`"cached must be used on the client"`) when called in the browser before `createSyncClient()`. Checking the branch split `noClient` (`"requires a running sync client..."`) from `cachedIsClientOnly`.
3. **Rejected `prefix` on element `Id` fields (`#388`):** `assertElementIdClassFacts` rejected `prefix` on element IDs only because `mintElementIds` had not threaded `field.element.fields?.id?.prefix` through.
4. **Unbound variable & duplicate prefix (`#01b-6`, `#01e-9`):** `escapeWarning(table)` needed `${dataType}` computed from the schema field, and `Accounts.attach` prepended `"accounts.revealAccounts: "` onto a `copy.js` string that already started with `"accounts.revealAccounts: false"`.

**Rule:** If the runtime condition contradicts the prose — or rejects a combination that should work — stop and fix the kernel (or flag it). Never polish a lie.

---

## 3. Words — Maximize Conceptual SNR ("Know a Lot to Say a Little")

### Core Philosophy & Audience Calibration

Legibility is **conceptual signal-to-noise ratio (SNR)**: *"I know a lot, so I can make it easy for you by saying a little."* Error and log prose is how evaluators thin-slice a new open-source framework at the exact moment something went wrong — if a message reads like an AI koan or a vibe-coded proverb, they drop the library. Distilling a subtle failure into one effortless sentence requires understanding the local code first; do not over-correct from cryptic poetry into sterile enterprise boilerplate.

- **Say what the reader does not know and nothing they already hold:** For a *missing required option*, the developer does not yet know its purpose or shape, so explain what it does and show the syntax (`compute: async (args) => value`). For *two conflicting options*, the developer typed both and already knows what each does, so state only why they conflict and which one to remove.
- **Keep genuine CS, database, networking, and security terms of art:** *optimistic update, rebase, outbox, cursor, watermark, snapshot, delta, projection, idempotent, foreign key, QUIC datagram, path MTU, FIFO, timing attack, shared-cache poisoning, TTL*.
- **Cut private coinages, personification, and Fable koans:** Never write `the floor`, `the width`, `the carriage`, `the fork and the join`, `the settle`, `the lag valve`, `password dials`, `the hidden posture`, `the fresh branch`, `until the map learns it`, `hears notFresh`, or `beside` (for "combined with"). Code does not "hear", "learn", or "speak".
- **The Koan Litmus Test:** Append *"...and thus the developer was enlightened."* If it fits (`"serverOnly moves where a body runs, never whose write it is"`, `"only the server can pin a value only the server can see"`), rewrite it.

### Three Authoring Instincts From Maintainer Rewrites

1. **Lead with what the developer did or what is missing, not internal plumbing:** Open with `"This mutator wrote to a private field on the client"` or `"no timezone is configured so cannot compare a CalendarDate to a DateTime"`.
2. **Teach the concrete causal chain or cost:** State *why* a constraint exists (`"because the socket's port comes from the transport's welcome message"`, `"increases byte size over the wire by 5-10x"`, `"susceptible to socket limitations: FIFO, bursting"`).
3. **Interpolate live runtime state (`${fallback}`, `${dataType}`, `${watermark}`) and use plain words:** Never hardcode `"staying on WebSocket"` when `${fallback}` holds the active transport. Prefer `context` over `ctx`, `plain objects` over `non-primitives`, `Add` over `Implement`, and `retrying on interval` over `Will retry on the next interval`.

### Calibrated Examples (`[Not This]` -> `[This]`)

For all 74 maintainer hand-edits across Pass 1 and Pass 2, see [`maintainer-rewrites.md`](../../legibility/sweeps/2026-10-25/maintainer-rewrites.md).

| `[Not This]` (Koan or Naive Agent Draft) | `[This]` (Maintainer Calibration) | Why / Loose Rule |
| :--- | :--- | :--- |
| `This write came from a mutator body on a client call, and serverOnly moves where a body runs, never whose write it is — route it through an action or a server handle` | ``This mutator wrote to a private field on the client. If you want to update a private field in a mutator use the `serverOnly` flag so it only runs on the server. You can also use simulate() to simulate the client update before the server write occurs`` | Lead with what the developer did and name the exact escape hatches (`serverOnly`, `simulate()`). |
| `a day against an instant field means that day in the app's zone, and none is configured. configure({ zone: 'America/New_York' }) once in shared code` | `no timezone is configured so cannot compare a CalendarDate to a DateTime. Call configure({ zone: 'America/New_York' }) in shared code so it is configured on the server and client` | State what is missing first (`no timezone is configured`) using the actual type names (`CalendarDate`, `DateTime`). |
| ``ephemeral collection '${table.collection}' sends ${named}${rest} as JSON over WebTransport datagrams. Primitive or quantized schema fields pack 5-10x smaller`` *(agent draft)* | ``Your ephemeral collection '${table.collection}' will send ${named}${rest} as uncompressed JSON over WebTransport datagrams because ${dataType} does not support binary encoding. This increases byte size over the wire by 5-10x. Consider using a field type like String or Number that supports binary encoding`` | Name the offending `${dataType}`, the mechanism (`uncompressed JSON`), the cost (`5-10x`), and concrete replacements (`String or Number`). |
| `no transport can connect: WebTransport is the only enabled transport and no WebTransport endpoint is cached for this server` *(agent draft)* | ``WebSocket and SSE are not enabled on this server, so WebTransport cannot be negotiated since the socket's port comes from the transports `welcome` message. Enable SSE or WS on the server to fix`` | Explain the protocol dependency (`welcome` carries the WebTransport port) so the fix makes immediate sense. |
| `WebTransport upgrade failed, staying on WebSocket` *(agent draft)* | `WebTransport upgrade failed, staying on ${fallback}` | Interpolate the live `${fallback}` variable rather than assuming WebSocket is active. |
| `webtransport path MTU (${max}B) is below the ${WEBTRANSPORT_FLOOR}B datagram minimum. Falling back to the session stream for ephemeral updates` *(agent draft)* | `webtransport path MTU (${max}B) is below the ${WEBTRANSPORT_FLOOR}B datagram minimum. Still using WebTransport, but delivering datagrams over streams which is sub-optimal for ephemeral data (susceptible to socket limitations: FIFO, bursting)` | Clarify that WebTransport stays active while explaining *why* stream fallback is suboptimal (`FIFO, bursting`). |
| `server watermark is ahead of this tab's next call id, advancing outbox sequence` *(agent draft)* | `server watermark (${watermark}) is ahead of client's next call id (${outbox.nextId}). Advancing local outbox sequence number to ${watermark + 1} so new writes are not treated as duplicate replays` | Include the actual numbers (`${watermark}`, `${outbox.nextId}`) and state why the self-heal happens. |
| `files: store '${name}' access cannot be 'unlisted' — with url-is-data, 'unlisted' is 'public' under a name that promises more; use 'private' or 'public'` | `store '${name}' cannot set its access to 'unlisted' because file URLs are stored in database documents and readable by any subscriber. Use 'private' or 'public' instead` | Drop the redundant `files:` prefix, cut the insider slogan (`url-is-data`), and state the concrete exposure. |
| `the onAccess hook threw, ignored — audit must never break serving` | `onAccess threw, ignored` | Cut the philosophical moral; the error object is already passed in `{ data: error }`. |

---

## 4. Structure, Format, and Gates — `. Capital`, Vocabulary, and Declined Edges

### Sentence & Token Format

- **Lowercase opening word:** Start explanations, warnings, and logs with a lowercase word (`no timezone is configured...`, `` `stores` cannot be empty... ``), unless opening with a capitalized technical term or schema type.
- **`. Capital` boundary:** Separate primary diagnosis from secondary remediation with `. Capital` (`explanation. Action`) so `formatServerLog` dims the second sentence via `fadeSecondary`. Never write `. lowercase` between sentences.
- **No terminal period:** Drop the trailing period on every error, warning, log, and hint string.
- **Banned prose punctuation:** Never use em-dashes (`—`), unicode arrows (`→`, use `->`), or semicolons (`;`) in prose. Colons (`:`) are fine when introducing syntax or a list.
- **Quoting, brackets & live enumerations:** Backticks (`` `...` ``) for code identifiers, option keys, and syntax (`` `serverOnly` ``, `` `public: true` ``); single quotes (`'...'`) for runtime string values and names (`'orders'`, `'10m'`); square brackets (`[...]`) for enumerated sets (`[insert, update, remove]`). Build enumerated sets dynamically from the constant the validator checks (`joinWords(RULE_OPS)`, `Object.keys(FILES_PROVIDERS).join(', ')`) rather than hand-typing a list that goes stale when a new operator or provider is added.

### Error Code Vocabulary

CamelCase error codes lead with one of eight canonical prefixes: `missing` / `no`, `unknown`, `invalid`, `unsupported`, `duplicate`, `conflicting`, `expired`, `failed`. Never mint `bad*` codes (`badOption`). Name the caller-visible concept (`missingCallIdentity` over `missingDeriveIdentity`), keep a domain-specific code (`privateComputedDep`) when a generic prefix (`conflictingPrivateDep`) loses precision, and `git grep` for `code === '` across `packages/` and `tests/` before renaming any code.

### Gates & Test Assertions

1. **`npm run errors` (`scripts/gates/errors.js`):** Checks changed literals in `packages/*/src/` (or `-- --all`) against six rules: `sentence-boundary` (`. Capital`), `lowercase-open` (advisory), `no-terminal-period`, `no-banned-punct` (`—`, `→`, `;`), `code-vocabulary` (no `bad*`), and `server-error-wrapper` (no uncaught raw `throw new Error` on the server).
2. **`npm run size` (`scripts/gates/size.js` & `scripts/gates/size-prose.js`):** Verifies that `isDevelopment`-gated prose exists in the dev client build and folds out of prod, and scans all 4 deployable client bundles (`sync client`, `kernel`, `files`, `accounts`) to reject any surviving prose literal (`>= 18` chars, `>= 3` words) not in `scripts/gates/size-prose-allowlist.json`.
3. **Test assertions (`#405`):** Assert `error.code`, `error.at`, and `error.detail` (or `Boolean(error.message.split('\n')[1])`) rather than regex-matching full prose sentences, unless distinguishing branches that share one `error.code` or testing `console.warn` / `logError` output.

### Declined Callsite Edges (When Mechanical Rules Bend)

- **Capitalized technical or schema-type openers (`PROPER_OR_TECHNICAL`):** When a sentence opens with a PascalCase schema type (`Duration`, `Money`, `CalendarDate`, `Id`), runtime/protocol noun (`WebSocket`, `WebTransport`, `IndexedDB`, `Postgres`, `SQLite`, `Redis`, `Temporal`), or acronym (`HTTP`, `CORS`, `TTL`), keep its true casing. `scripts/gates/errors.js` exempts camelCase/PascalCase identifiers, `ALL_CAPS`, and `PROPER_OR_TECHNICAL`; add legitimate proper nouns to `PROPER_OR_TECHNICAL` rather than lowercasing them.
- **Single-sentence explanations where no remediation exists:** When one clause states the entire truth (`store '${name}' must be a config object or a driver instance`, `onAccess threw, ignored`, `guest retention sweep failed, retrying on interval`), do not invent filler just to force a `. Capital` split.
- **Parent-caught internal throws (`CAUGHT_SERVER_THROW_CONTEXTS`):** Internal server helpers whose `throw new Error(...)` is caught and translated by an enclosing `try/catch` (`#reviveImage`, `_matchIdsFor`, `decodeCapture`, `fieldTest`, `assertEncodable`, `ephemeralCall`, `createSeamParser`) remain plain `Error` throws listed in `CAUGHT_SERVER_THROW_CONTEXTS`.
