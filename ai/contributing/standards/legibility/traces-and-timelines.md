---
title: Authoring Traces and Timelines
description: How to author DevTools Performance Timeline spans, wire trace annotations, HUD tooltips, and ASCII sequence diagrams — dev-only prose stripping, conceptual SNR, punctuation rhythm, and wire metadata rules.
keywords: [traces, timelines, measureTimeline, markTimeline, trace, hud, diagnostics, isDevelopment, size, legibility]
skill: traces-and-timelines
type: skill
---

# traces-and-timelines — authoring timeline spans, wire traces, and HUD tooltips

Load this skill before adding or editing any `measureTimeline` / `markTimeline` call, `DESCRIPTIONS` fault entry in `diagnostics.js`, `sync.trace` event or `_meta` field in `client/debug/trace.js`, `<sync-hud>` card tooltip in `components/hud/hud.js`, or multi-peer ASCII sequence diagram in comments and tests.

---

## 1. Mechanism — `measureTimeline`, Wire Trace Annotations (`trace.js`), and Dev-Only Stripping

### Structure Ships in Production; `tooltipText` Folds on `isDevelopment`

Client timeline instrumentation uses `markTimeline` and `measureTimeline` from `@semantic-ui/utils` (paired with `wireDetail(color, tooltipText, properties)` in `packages/sync/src/client/helpers/diagnostics.js`).

By kernel ruling, **timeline structure (`track`, `trackGroup`, `color`, `properties`) ships in both development and production** so production profiles render colored custom tracks (`wire`, `boot`, `disk`, `channels`) in Chrome DevTools. Only human-readable prose (`tooltipText` and fault `DESCRIPTIONS`) strips in production:

```js
measureTimeline('sync:establish', {
  from: 'sync:welcome',
  to: 'sync:live',
  detail: () => ({
    track: 'boot',
    trackGroup: 'sync',
    color: 'tertiary-light',
    tooltipText: isDevelopment
      ? 'time from handshake welcome to first live subscription (initial snapshot load and queued delta apply)'
      : 0,
  }),
});
```

- **Inline `isDevelopment ? '...' : 0` ternary at the callsite:** esbuild's `PROD_DEFINE` (`__DEV__: 'false'`) folds the ternary only when the string literal sits directly inside the expression. Never hide `isDevelopment` inside `wireDetail` or a helper, or the prose survives in the production bundle and fails `npm run size` (`scripts/gates/size.js`).
- **Fault description bank (`diagnostics.js`):** Wrap `DESCRIPTIONS` in `isDevelopment ? { ... } : null` and guard `describeFault(reason, fallback)` with `isDevelopment` so the fault table folds out of production builds.
- **On-demand production wire tracing (`client/debug/trace.js`):** `createTrace` ships a stub in production (`tracing is not loaded by default in production to reduce bundle size. Run \`await import('${toolUrl()}')\` in the console to load it`). The full `traceTool` recorder installs at construction in development and loads on demand from `/sync/debug/trace.js` in production.

### Wire Trace Annotations (`trace.js` and `diagnostics.js`)

`sync.trace` records wire frames (`hello`, `welcome`, `sub`, `snapshot`, `delta`, `call`, `result`, `ephemeral`), binary QUIC datagrams, and lifecycle events (`dial`, `socket-open`, `close`, `write-queued`, `webtransport-offer`, `webtransport-demoted`, `webtransport-unavailable`).

1. **Never mutate wire fields on the row itself:** `trace.raw()` returns the exact wire text (`frame`) or `Uint8Array` datagram bytes. Decoded rows (`trace.stop()`, `trace.frames()`, `trace.filter()`) lead with the wire message's fields (`type`, `channel`, `code`, `docId`) and place `_meta` last.
2. **Attach human-readable annotations under `_meta`:**
   - `_meta.codeName`: Lowercase kebab name from `slugFor(code)` or `CLOSE_NAMES` (`'unknown-channel'`, `'call-failed'`, `'shutting-down'`, `'no-status-received'`, `'no-code'`), leaving numeric `row.code` / `row.error.code` untouched.
   - `_meta.ownCall`: Added to inbound `delta` rows when a `result` frame's `positions` map matches `${channel} ${cursor}`, linking a self-echoed delta to its client mutation `id`.
   - `_meta.packed`: `{ position, count }` when one wire frame carries a batched array of messages.
   - `_meta.sync`: Snapshot of `{ pendingWrites, connection, online, session }` (plus `subscriptions` when opted in) as the frame crossed.
   - Close & dial metadata: `closedBy` (`'disconnect()'`, `'close()'`, or `'server'` — only when certain), `state`, `silentFor` beside `heartbeat`, and `attempt` / `waited` on reconnect dials.

---

## 2. Words — Maximize Conceptual SNR in Timeline & Trace Lines

### Who Reads a Timeline Span or Trace Entry

A developer inspecting a DevTools waterfall, `<sync-hud>`, or `sync.trace.stop()` is diagnosing latency or transport behavior: *Why did a transport switch? What was a handshake waiting on? How many mutations rebased after a snapshot?*

- **Use standard networking and sync terms of art:** `WebTransport`, `WebSocket`, `SSE`, `HTTP polling`, `QUIC datagram`, `path MTU`, `bufferbloat`, `FIFO`, `handshake`, `outbox`, `rebase`, `snapshot`, `delta`, `watermark`, `cursor`, `IndexedDB`, `RTT`.
- **Cut private metaphors and Fable koans:** Never write `the socket` / `the socket carries` (`WebSocket` or `${fallback}`), `the carrier` (`WebTransport`), `the climb` (`the WebTransport upgrade`), `the terminator` (`the WebTransport endpoint` or `sidecar`), `ephemeral ticks` (`ephemeral updates`), `over the floor` (`above the minimum baseline`), `nothing is lost`, or `until the map learns it`.
- **Use canonical span prefixes:** Write `mutate:` (not `local write:`), `rebase:` (not `recompute:`), `ack:` (not `echo landed:`), and `snapshot:` (not `initial sync:`).
- **Interpolate live state and concrete metrics:** Never hardcode `'staying on WebSocket'` when SSE or polling may be active — interpolate `${fallbackLabel(this)}` (`'WebSocket'`, `'SSE'`, `'HTTP polling'`). Include concrete metrics and bracketed stages: `[DNS, TCP, TLS]`, `[IndexedDB]`, `${count} pending mutations`, `${ms}ms`, `${watermark}`, `${max}B`.

### Calibrated Examples (`[Not This]` -> `[This]`)

| `[Not This]` (Koan or Naive Agent Draft) | `[This]` (Maintainer Calibration) | Why / Loose Rule |
| :--- | :--- | :--- |
| `moving the session onto WebTransport — the socket carries until this completes` | `upgrading to WebTransport while ${fallbackLabel(this)} continues serving traffic` | Cut `the socket carries`; use a flowing `while` clause with live `${fallback}`. |
| `the WebTransport carrier could not reopen — falling to the socket` | `WebTransport reconnect failed, falling back to ${fallbackLabel(this)}` | Replace `carrier`, `falling to`, and `the socket` with standard transport terms. |
| `a different user signed in: unheld docs, subs and the outbox are reaped` | `user changed: clearing cached documents, inactive subscriptions, and pending writes before the server re-authorizes active subscriptions` | Translate internal GC jargon (`unheld docs... reaped`) into caller concepts. |
| `the credential presented on the live socket: signed in` / `refused ${message.code}, the socket closes` | `sign-in occurred on the open connection without reconnect` / `authentication rejected (${message.code}). Reconnecting to perform a fresh handshake` | State the concrete auth outcome; split independent clauses with `. Capital`. |
| `reading sync positions and pending writes [IndexedDB] — the sign-in goes out the moment this finishes` | `reading saved cursors and pending writes from IndexedDB before sending the handshake` | State causal ordering (`before sending the handshake`) without filler. |
| `opening the connection — DNS, TCP, and TLS; sign-in preparation runs alongside` | `opening the connection [DNS, TCP, TLS]` | Put enumerated backing stages in trailing `[...]` brackets. |
| `p95 transit over the floor, measured on stamped frames · last 60 s` | `p95 one-way transit delay above the minimum baseline, measured on timestamped frames · last 60 s` | Replace `over the floor` and `stamped frames` with standard networking terms. |

---

## 3. Structure & Punctuation — Sentence Rhythm, Wire Annotations, and ASCII Sequence Diagrams

### Timeline & Fault Prose Punctuation

1. **Never use semicolons (`;`) or em-dashes (`—`) in timeline, trace, or fault prose:**
   - When forbidden from using `—`, models reflexively stitch clauses with `; `. Both are banned (`npm run errors` rejects `—`, `→`, and `;` in `packages/*/src/`).
   - Use a comma for **short participial tails** (`'WebTransport upgrade failed, staying on ${fallback}'`) and `. Capital` for **independent clauses** (`` `authentication rejected (${message.code}). Reconnecting to perform a fresh handshake` ``).
2. **Flowing clauses and natural articles over telegraphic parentheticals:**
   - Write `'upgrading to WebTransport while the WebSocket continues serving traffic'` and `'sign-in occurred on the open connection without reconnect'`, not `'in-place sign-in (no reconnect)'` or `'while WebSocket continues'`.
   - Unpack `, usually because...` into its own sentence: `'The browser threw when initializing WebTransport. This usually happens because it does not support one of the session options.'`
3. **Bracketed stage lists (`[...]`):**
   - Use square brackets at the end of a span tooltip to name backing stages: `'opening the connection [DNS, TCP, TLS]'`, `"reading this device's saved sync identity [IndexedDB]"`.
4. **`<sync-hud>` card tooltips:**
   - Separate metric clauses in HUD `tip` strings with ` · ` and end with `· last 60 s`: `` `updates received per second vs target ${row.hz} Hz · last 60 s` ``.

### ASCII Sequence & Timeline Diagrams in Comments and Tests

When a multi-peer race, rebase ordering, or transport handoff in a comment or test is clearer as a sequence diagram than as prose, align actor columns (`client A`, `server`, `client B`), number steps sequentially (`(1)`, `(2)`, `(3)`), and use ASCII arrows (`-->`, `<--`, `->`) so `npm run comments` and `npm run errors` stay green:

```js
// client A                    server                      client B
// (1) mutate('cards.move')
//     optimistic apply -----> (2) commit seq 14 --------> (3) apply delta seq 14
//                             (4) result { positions } ->
// (5) settle & prune outbox
```
