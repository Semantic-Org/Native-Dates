---
title: Authoring Code Structures, Classes, and Idioms
description: How to shift from procedural agent defaults to the house class anatomy, stateful domain classes, stage decomposition, @semantic-ui/utils idioms, and callsite-first naming.
keywords: [classes, anatomy, static-fields, signatures, utils, each, naming, legibility, code-structures]
skill: code-structures
type: skill
---

# code-structures — domain classes, anatomy, `@semantic-ui/utils`, and naming

Load this skill before designing or refactoring classes, method signatures, option bags, loops, or internal mechanisms in `packages/*/src/`. Read [`naming-lessons.md`](../../legibility/naming-lessons.md) and [`simplicity-lessons.md`](../../legibility/simplicity-lessons.md) alongside it as the companion pedagogical ledgers, and [`coding-standards.md`](../../../../next/ai/skills/contributing/coding-standards.md) for cross-repo foundations.

Every rule below is grounded in the 84 turn-by-turn pair-programming commits on PR `#371` (`161c417c..e47b2d30`), where an agent's passing clean-room router (`161c417c`) was reshaped into the maintainer's shipped architecture (`e47b2d30`), plus the component plugin and ambient-writer simplifications in `simplicity-lessons.md`.

---

## 1. Mechanism & Class Boundaries — Stateful Domain Classes Over Procedural Bags

### Convert Procedural Helper Bags Into Domain Classes Holding Context (`71a890a3`, `496c9a62`)

Left unsteered, models default to flat modules of freestanding functions that thread the same 3–5 context arguments (`router`, `querySpecs`, `segmentNames`, `caseSensitive`, `path`) through every call (`simplicity-lessons.md` §1.3 `Plugin`, PR `#371` `args.js`).

When a group of functions shares configuration, pre-parsed descriptors, or an owning instance (`router`, `template`), **turn the noun into a class and store the owner on `this`**:

```js
// [Not This] — procedural function bag at 161c417c threading specs and router through every call
export const parseQuery = (search, querySpecs, segmentNames = new Set(), caseSensitive = true, path = '/') => { ... };
export const formatQuery = (inputArgs = {}, { querySpecs, segmentNames }, router, options = {}) => { ... };
export const Args = { compileSpec, coerceValue, parseQuery, formatQuery };

// [This] — compiled per-route Args class at e47b2d30 storing this.router on the instance
export class Args {
  constructor(node) {
    this.router = node.router;
    this.path = node.path;
    this.paramSpecs = new Map();
    this.querySpecs = new Map();
    // ...
  }
  parseQuery(search, { caseSensitive = this.router?.config?.caseSensitive ?? true } = {}) { ... }
  formatQuery(inputArgs = {}, options = {}) { ... }
}
```

### Lowercase `static` Class Fields Over Module-Top `UPPER_CASE` Constants (`011c929d`, `2549ed57`, `a2c723b3`, `07054be2`, `19355023`)

Models scatter `const TYPES = ...`, `const OUTCOMES = ...`, `const RUNG_LITERAL = 5`, and loose regexes at the top of a file (`naming-lessons.md`: *"Author Classes as Single Files and Dont Encode Settings in Consts"*).

Move registries, option key lists, regex tables, and default configs onto the owning class as **lowercase `static` fields** so subclasses can extend them (`root.constructor.optionKeys`) and callers can inspect or retune them:

- **Unified type/coercer registries (`011c929d`, `2549ed57`):** Replace parallel `TYPES`, `TYPE_NAMES`, and `COERCERS` constants with `static types = new Map([[String, ...], ...])` and `static registerType(type, coerce)`.
- **Option & outcome key sets (`07054be2`, `e7a38888`):** Declare `static outcomes = ['notFound', 'forbidden', 'loading', 'unavailable']`, `static optionKeys = [...]`, `static hookKeys = [...]`, and `static reservedCallParamKeys = [...]` on `Route` / `Router`, then copy declared options at construction with `extend(this, onlyKeys(options, root.constructor.optionKeys))`.
- **Static config & tuning defaults (`19355023`):** Declare `static defaultTunings = { maxHold: '1s', ... }` and `static defaultConfig = { base: '/', ... }` on `Router` instead of inlining fallback literals inside `#validateSite`.
- **Named regex tables (`a2c723b3`):** Group regular expressions into `Route.regExp = { componentName: /^[A-Z]/, lazyBody: ... }`, `Navigation.regExp = { chunkError: ... }`, or `urlRegExp` in `url.js` instead of inline `/.../` literals.

### Keep Base Classes Pure of Subclass & Adapter State (`0ae48673`, `e626c0de`, `e7a38888`, `07d0370f`)

Never leak adapter-specific state into a base class just because the base orchestrator runs the lifecycle:
- In `161c417c`, the native `Router` base class carried `doc` resolution (`isDocNotFound`), reactivity `reactions` and subscription `handles` cleanup, `useDoc()` in Solid, and `'subscriptions'` / `'max-hold'` timeline specs in `timeline.js`.
- In `0ae48673`–`07d0370f`, all `doc`, `reactions`, and `handles` state moved out of the native base `Router` into the `SemanticRouter` subclass (and `disposers` into the Solid `Router` subclass) behind subclass hooks (`holdChain(run)`, `prepareNodeCallParams(node, callParams, run)`, `releaseRunResources(run)`, `canUpdateInPlace(options)`), while `SemanticRouter` extended `static optionKeys = [...super.optionKeys, 'subscriptions', 'doc', 'readyWhen']` and `timeline.specs`.

### Eager Constructor Initialization (`8613d061`)

Initialize every instance property (`this.browserNavigation = globalThis.navigation`, registries, state slots, `this.raw`) eagerly in `constructor()` so a cold reader sees the instance's full shape in one place and methods read `this.browserNavigation` instead of `globalThis.navigation`.

---

## 2. Class Anatomy & Stage Decomposition

### Class Overview Block, Member Ordering, and Section Banners (`1dbfe788..42f95294`, `720f91b6..5f635484`)

Every class file follows one top-to-bottom anatomy:

1. **Class overview block comment (`/* ... */`) above `export class`:** State the class's role, its inputs/outputs or node types (`Route`: `site`, `section`, `route`, `index`, `group`), and 1–2 structural invariants (`Args`: how `params` + `query` synthesize `args` via normalized `spec`s).
2. **Brand & `Symbol.hasInstance` first** (for public nouns crossing bundle/package boundaries): `get [IS_ROUTE]() { return true; }` + `static [Symbol.hasInstance](value) { return isRoute(value); }`.
3. **Lowercase `static` fields & static extension points second:** `static outcomes`, `static optionKeys`, `static defaultTunings`, `static defaultConfig`, `static regExp`, `static types`.
4. **`constructor()` third:** Validate options, initialize instance fields (`extend(this, ...)`), and set up internal state (`this.raw`).
5. **Boxed section banners in use order, not alphabetical:**

```js
  /*******************************
            Tree Building
  *******************************/
```

   Order sections from primary public verbs -> queries -> hierarchy/getters -> lifecycle/integration hooks -> private stage & validation helpers colocated under the section they serve (`Route`: `Tree Building`, `Queries`, `Hierarchy`, `Validation`; `Navigation`: `Browser Listeners`, `Evaluation`, `Reconciliation`, `View Helpers`, `Scroll & Events`; `Router`: `Lifecycle`, `Navigation`, `URL & Matching`, `State & Queries`, `Integration Hooks`, `Validation`).

### Decompose Multi-Stage Orchestrators Into Named Stage Helpers (`1f6458ac`, `3e9b22a7`)

Models often write 150–350 line orchestrators (`Navigation.evaluateRoute`, `Args.compileSpec`) that inline validation, fast paths, async coordination, DOM updates, and cleanup inside one giant method with local closures.

Extract each distinct phase into a private or static stage method so the orchestrator reads like a table of contents:

- **`Navigation.evaluateRoute` (`1f6458ac`):** Extracted `#updateInPlace`, `#checkLeaveBlockers`, `#followRedirect`, `#propagateDataUpdate`, `#resolveDataEntries`, `#evaluateMeta`, `#composeTitle`, `#commitScroll`, and `#runPostCommitHooks` out of `evaluateRoute`, while holding per-navigation state on a `run` object (`{ id, controller, signal, match, outcome, chain, failedNode, nodeData, reconciled }`).
- **`Args.normalizeSpec` vs. `#validateSpec` (`3e9b22a7`, `d39485f2`):** Separated validation (`static #validateSpec` and `static validateArg`) from descriptor construction (`static normalizeSpec`) instead of tangling 30 lines of `throwError` guards inside the spec builder.

### Options Bags & Callsite-Inferrable Signatures (`dac48a79`, `naming-lessons.md`)

- **Replace positional parameter tails with destructured options bags (`dac48a79`):** Keep the primary target positional and move optional modifiers, callbacks, or flags into a trailing options bag with defaults:
  - `projectSlot(parentEl, viewEl, { slotName = 'default', isRoot = false } = {})` (not `projectSlot(parentEl, viewEl, slotName = 'default', { isRoot = false } = {})`)
  - `mountInto(parentEl, { slotEl, slotName = 'default' } = {})` (not `mountInto(parentEl, slotEl, slotName = 'default')`)
  - `evaluate(compute, { onUpdate, signal, route, kind } = {})` (not `evaluate(compute, apply, { signal } = {})`)
  - `#findNode(target, { allowUrl = false } = {})` (not `#findNode(target, allowUrl = false)`)
- **Never pass magic booleans at callsites (`naming-lessons.md`):** Split `clamp(true)` / `clamp(false)` into `resolveShorthand()` and `clampValues()`, or pass a named option (`{ isParam: true }`, `{ isQuery: true }`, `{ shouldRestore: true }`).
- **Match `extend(defaults, overrides)` argument order (`naming-lessons.md`):** Write `resolveTunings(RedisLink.tunings, tunings, { namespace: 'redis.tunings' })` — defaults first, user overrides second, config bag third.

---

## 3. `@semantic-ui/utils` Idioms & Control Flow

Before writing any type check, loop, object merge, or array lookup, check `@semantic-ui/utils` (`../../../../next/ai/skills/authoring/utility-functions.md`).

### Guards & Environment Early Exits (`d205ee9a`, `8e0bd0c1`, `e7d60853`)

1. **Always use `@semantic-ui/utils` type guards (`d205ee9a`, `e7d60853`):**
   - Use `isString`, `isNumber`, `isBoolean`, `isArray`, `isObject`, `isPlainObject`, `isFunction`, `isPromise`, `isDate`, `isNode`, and `isClassConstructor` instead of raw `typeof`, `Array.isArray`, or custom regex/prototype checks (`Route.isClassConstructor` was deleted in `e7d60853` in favor of `isClassConstructor`).
2. **Use `isServer` / `isClient` and bare `document` after early exits (`d205ee9a`, `8e0bd0c1`):**
   - Never write `typeof window === 'undefined'` or `const doc = globalThis.document; if (!doc?.createElement) return;`. Guard DOM methods at the top with `if (isServer) { return; }` and reference `document` directly:

```js
// [Not This] — verbose global probing at 161c417c
const doc = globalThis.document;
if (!doc?.createComment || !this.el?.appendChild) {
  return;
}
this.startMarker = doc.createComment(`sui-route:${this.id}`);

// [This] — isServer early exit and bare document at 8e0bd0c1
if (isServer || !this.el?.appendChild) {
  return;
}
this.startMarker = document.createComment(`sui-route:${this.id}`);
```

### Collection, Object, and String Utilities (`49201b37`, `4bc2b147`, `7560d942`, `07054be2`)

- **Objects:** `keys(obj)`, `values(obj)`, `extend(target, ...sources)` (over `Object.assign`), `onlyKeys(obj, allowedKeys)` (for declared option subsets), `pick(obj, ...keys)`, `hasProperty(obj, key)` (over `Object.prototype.hasOwnProperty.call` or `'key' in obj`), `filterEmpty(obj)`.
- **Arrays & Lookup:** `inArray(item, array)` (over `array.includes(item)`), `first(array)` (over `array[0]`), `last(array)` (over `array.at(-1)`), `firstMatch(array, fn)` (over `array.find(fn)`), `findIndex(array, fn)`, `difference(a, b)`, `flatten(array)`.
- **Templates & Values:** `fill(template, values)` for `{token}` interpolation in error/warning hints (`4bc2b147`), `noop` for default callbacks, `clone(value)` for defensive copies of defaults.

### The Exact Boundary Between `each` and `for-of` (`a3a3838b`, `32a49d3a`, `2cb169e8`, `95c8b9d6`, `c9a4cc7a`)

1. **Use `each(collection, (value, key) => ...)` for synchronous full iterations:**
   - Visit every item of an array, `Map`, `Set`, or plain object synchronously with `each`.
   - Iterate plain objects directly with `each(obj, (value, key) => ...)` — never `Object.entries(obj)` or `each(keys(obj), ...)` (unless deleting keys from the target object during iteration, as in `c9a4cc7a`).
2. **Keep native `for (const item of list)` when the loop needs `return`, `break`, `continue`, or `await` (`2cb169e8`, `95c8b9d6`):**
   - Never replace an early-returning loop with `each` + a `let blocked = false; return false;` flag, and never use `asyncEach` when iterations `break`, `return` early on `signal.aborted`, or step through a sequential pipeline (`2cb169e8` walked back `32a49d3a`).

```js
// [Not This] — contorting an early-return loop into each() with a flag (walked back in 2cb169e8)
let blocked = false;
each(leaveCallbacks, (blockerFn) => {
  if (isFunction(blockerFn) && blockerFn(leaveContext) === false) {
    blocked = true;
    return false;
  }
});
if (blocked) {
  return { cancelled: true, reason: 'leaveBlocked', from: fromMatch };
}

// [This] — native for-of when returning early or awaiting sequentially (2cb169e8, 95c8b9d6)
for (const blockerFn of leaveCallbacks) {
  if (isFunction(blockerFn) && blockerFn(leaveContext) === false) {
    return { cancelled: true, reason: 'leaveBlocked', from: fromMatch };
  }
}
```

---

## 4. Words — Callsite-First Naming Over Agent Jargon

Models invent private metaphors (`createDoor`, `rung`, `bag`), abbreviate properties (`idx`, `_pre`, `_inPlace`, `_noLeave`), and prefix unused callback parameters with `_` to appease linters that do not exist here.

### Calibrated Examples (`[Not This]` -> `[This]`)

| `[Not This]` (`161c417c` Raw Agent Default) | `[This]` (`e47b2d30` Maintainer Calibration) | Why / Loose Rule |
| :--- | :--- | :--- |
| `const createDoor = (method) => (arg) => (router \|\| throwError(...))[method](arg)` | `const call = (method) => (arg) => { if (!router) { throwError(...); } return router[method](arg); }` (`9de4904c`) | Cut insider jargon (`door`) and nested ternary-throw expressions; use plain `call` with an `if (!router)` guard. |
| `const door = defineCondition(permission); return door(...)` | `const condition = defineCondition(permission); return condition(...)` (`9de4904c`) | Name the variable for the domain noun (`condition`), not a metaphor (`door`). |
| `route.idx` / `this.raw.idx` | `route.indexNode` / `this.raw.indexNode` (`15c7df38`) | Spell out what the reference holds (`indexNode`, the child `index` Route node) instead of an ambiguous `idx` abbreviation. |
| `Matcher.RUNG_LITERAL = 5` & `segment.rung` | `Matcher.specificity = { literal: 5, allowed: 4, ... }` & `segment.type` (`634ef933`) | Store a semantic `segment.type` string (`'literal'`, `'param'`, `'rest'`) and look up its numeric weight in `Matcher.specificity[segment.type]`. |
| `Args.compileSpec(name, raw, isSegment, path)` & `Matcher.compileSegments(path)` | `Args.normalizeSpec(name, rawArg, { isParam, path })` & `Matcher.parseSegments(path)` (`d39485f2`, `ab1c0eaa`) | Reserve `compile` for code generation; normalizing an option object is `normalizeSpec` and tokenizing a URL path is `parseSegments`. |
| `segmentNames`, `segmentSpecs`, `isSegment`, `candidate.segments` | `paramNames`, `paramSpecs`, `isParam`, `candidate.pathSegments` (`ab1c0eaa`) | Align internal names with the public vocabulary (`params` + `query` = `args`) and qualify `pathSegments` when alongside `querySpecs`. |
| `buildBag` / `prepareNodeBag` / `getBagIdentity` / `bag` | `buildCallParams` / `prepareNodeCallParams` / `getIdentity` / `callParams` (`63f3b7db`) | Reuse the framework's established `buildCallParams` / `callParams` vocabulary from `@semantic-ui/templating` instead of `bag`. |
| `evaluateRoute(url, { _pre, _scroll, _inPlace, _noLeave })` | `evaluateRoute(url, { precommit, capturedScroll, inPlace, skipLeave })` (`e0d76d52`) | Drop leading underscores and cryptic abbreviations on internal option bags; write full, self-explanatory words. |
| `router.shouldReuseSameRouteRun(toPreview, fromMatch, options)` | `router.canUpdateInPlace(options)` & `this.#updateInPlace(...)` (`c9a4cc7a`, `e47b2d30`) | Name the capability from the caller's perspective (`canUpdateInPlace`) and read `this.current` on the instance instead of passing unused arguments. |
| `buildCallParams({ node: _node })` / `set textContent(_val) {}` | `buildCallParams({ node })` / `set textContent(val) {}` (`c9a4cc7a`) | Never prefix unused parameters with a leading `_`; either drop the unused parameter or write its normal name. |
