---
title: "Docs Writing: Guides, API Reference, and Plugins"
description: Prose standards, quantitative cohort targets, callout budgets, and custom Markdown syntax for pages under docs/src/content/.
keywords: [docs, writing, guides, api reference, plugins, prose, cohort targets, callout budget, markdown]
audience: contributing
workflow: docs-writing
type: workflow
---

# Docs Writing: Guides, API Reference, and Plugins

> **Workflow:** `docs-writing`
> **Load when:** writing or editing guide, API reference, plugin, or example Markdown pages in `docs/src/content/`

Every guide, API reference, plugin page, and example in `docs/` should read like hand-authored open-source prose that sits comfortably beside Svelte, Luxon, Vue, Vite, and MDN.

---

## Before Writing

1. **Read the calibration pair** first to match voice, structure, and density:
   - Guide exemplar: [`docs/src/content/docs/guides/types-of-time.md`](../../../docs/src/content/docs/guides/types-of-time.md)
   - API exemplar: [`docs/src/content/docs/api/date-time.md`](../../../docs/src/content/docs/api/date-time.md)
2. **Read `HEAD` source files directly** (`src/`, `types/`, `packages/plugins/src/`, `packages/polyfill/`, and `docs/src/content/examples/`). Verify every option name, default value, signature, error code, and return type from source code rather than memory.
3. **Document only implemented exports.** Leave unbuilt sidebar stubs unwritten rather than inventing speculative APIs.
4. **Never hardcode total counts** of classes or plugins (*"the four nouns"*, *"all six plugins"*) so future additions land without invalidating surrounding pages.

---

## Quantitative Cohort Targets

Measured across `<p>` body paragraphs (excluding headings, tables, lists, and fenced code blocks) in reference open-source documentation:

| Reference doc | `<p>` count | Code blocks | Callouts | Inline `` `code` `` / `<p>` (mean / med) | `<p>` with `0-2` code spans | Parens / `<p>` | Words / sentence (med, p25-p75) |
|---|---|---|---|---|---|---|---|
| Luxon `Tour` (intro guide) | 36 | 22 | 0 | 0.33 / 0 | 100% | 0.06 | 12 (8-16) |
| Luxon `Math` (topic guide) | 43 | 26 | 0 | 0.44 / 0 | 95% | 0.16 | 14 (8-18) |
| Svelte `$state` (guide) | 33 | 21 | 3 | 1.27 / 1 | 88% | 0.09 | 17 (10-24) |
| Vue `Reactivity: Core` (API) | 50 | 33 | 1 | 0.48 / 0 | 98% | 0.06 | 14 (7-18) |
| Vite `Shared Options` (API) | 81 | 22 | 8 | 1.36 / 1 | 83% | 0.19 | 11 (7-16) |

Hold every page in `docs/` within these targets:

- **Inline `` `code` `` per `<p>`:** Mean `<= 1.4` and median `<= 1`, with at least `85%` of `<p>` paragraphs containing `0-2` spans and **at most `3` inline code spans in any `<p>`** (`0` paragraphs with `4+`).
- **Parameter and return descriptions:** At most `3` inline code spans per YAML `description` line. Summarize unit or preset ranges in plain English (`from 'year' down to 'second'`) instead of listing nine string literals in a row.
- **Parentheticals per `<p>`:** Mean `<= 0.15`. Keep caveats, examples, and type lists in normal clauses rather than parentheses.
- **Sentence length:** Median `12-17` words, IQR `8-22` words, max `<= 28` words. Mix short declarative sentences (`7-10` words) with explanatory sentences (`15-22` words).
- **Paragraph length:** `1-3` sentences per `<p>` (mean `1.2-1.8`). Default to `1-2` sentences for API method summaries.
- **Code block cadence:** Aim for roughly one short (`2-6` line) fenced code block every `1.5-2.5` prose paragraphs in guides.

---

## Model the Audience and Synthesize (Never Narrate Source)

Before writing a page, decide who opened it and what job they are trying to finish:

- **Introductory guides (`Overview`, `Installation`, `Types of time`):** The reader is meeting `native-dates` for the first time and wants working callsites in two minutes. Introduce one concept per heading, use everyday callsites (`today().plus(2, 'weeks')`, `time('9:00am')`, `date('2026-11-16').at('9:30am')`), and avoid multi-column wire-format tables or `Temporal` taxonomy lectures.
- **Topic and migration guides (`Time zones`, `Date math`, `Formatting`, `Coming from Day.js`):** Lead with the everyday 80% pattern, show clear code examples, and place advanced cases or interop details near the end.
- **API and plugin references (`DateTime`, `date()`, `ranges`):** Group entries by task so scanning the right-hand table of contents answers where to click.

Use plain developer speech rather than specification jargon:

- Write *a time of day*, not *a wall-clock reading*.
- Write *a specific moment in time*, not *an exact instant on the timeline*.
- Write *earlier than* / *later than*, not *occurs strictly before*.
- Write *moves forward to the next Friday at the same time of day*, not *advances to the next occurrence of the given weekday at the same wall-clock time*.

### Proportional Word Budget

- **Guides:** Spend roughly 80-85% of words on choosing types, creating values, and everyday operations. Keep advanced interop notes to the final 10-15%.
- **API references:** Spend roughly 85% of words on creation, properties, field/zone updates, core arithmetic, comparisons, measuring spans, and `format()` / `toString()`. Keep aliases (`floor`, `ceil`), zero-argument predicates (`isToday()`, `isWeekend()`), and trivial conversions (`toJSDate()`, `toTemporal()`, `valueOf()`) to one sentence or a compact table. Omit redundant `**Parameters**` and `**Returns**` blocks on 0- or 1-argument methods when the signature and summary sentence already state everything.

---

## Anti-AI Prose Checklist

1. **Avoid automatic tricolons (`X, Y, and Z`)**, especially in ledes and opening sentences.
2. **Keep internal mechanisms out of user docs.** Do not mention `Object.freeze`, own enumerable properties vs. prototype getters, `[Symbol.toPrimitive]` hints, rounding mode strings (`halfExpand`), or internal `Temporal` helper calls unless the page is specifically `Working with Temporal` or `Writing a plugin`.
3. **Never transcribe one-line method bodies into prose.** Write `Returns a native JavaScript Date for the same instant`, not `Returns new Date(dt.epochMilliseconds) for passing to legacy APIs`.
4. **Never dump string literal unions into prose** when `params` blocks and `.d.ts` files already specify them.
5. **Never write callouts or hedges around unintended code bugs.** Surface potential code defects to the maintainer separately instead of documenting defensive workarounds.
6. **Avoid tautological openings** under headings (do not follow `` ### `balance()` `` with *"`balance()` balances the duration"*).
7. **Cut filler intensifiers and clichés:** `seamlessly`, `effortlessly`, `powerful`, `first-class`, `under the hood`, `it is worth noting that`, `let's take a look at`.
8. **Do not copy terse source-comment shorthand** into user-facing prose.

---

## Pages and Headings Are Link Targets

Every public declaration in `types/` will carry an `@see` link to the page, or the heading on a page, that documents it ([`ai/contributing/standards/types.md`](../standards/types.md)). That link is how a reader gets from a hover in their editor to `nativedates.dev`, so a reference page's path and its entry headings are part of the package's public surface:

- Give each public symbol a heading of its own (`` ### `name()` :kind[method] `` inside `:::entry`), since the heading's id is what the link ends in.
- When a page moves or a heading is renamed, update any `@see` links that point at it in the same change.

---

## Callout Budget (`:::note`, `:::tip`, `:::warning`, `:::danger`)

| Page type | Callouts per page | Valid use |
|---|---|---|
| Short function or plugin page (`< 18 <p>`s) | `0-1` | Essential behavioral constraint not visible in the signature |
| Guide (`12-30 <p>`s) | `0-2` | Non-obvious rule of thumb or real-world time/DST pitfall |
| Full class reference (`25-40 <p>`s) | `1-2` | Highest-leverage invariants across the entire page |

- **Zero callouts is normal.** Never add callouts for visual variety or to repeat adjacent prose.
- Keep callouts to **1-2 sentences** with a short sentence-case bracketed title and no backticks so the icon aligns beside the heading:

```markdown
:::tip[DateTime or CalendarDate?]
Ask whether changing time zones should change what the user sees.
:::
```

---

## Astro Markdown and Layout Constraints (`docs/`)

1. **Frontmatter:**
   - Guides: `title`, `lede`, `updated`.
   - API pages: `title`, `kind` (`class` or `function`; omit on non-symbol pages like `Errors`), `lede`, `import`, `size` (`core`), `updated`.
   - Plugin pages: `title`, `kind: plugin`, `lede`, `import`, `size` (plugin slug), `updated`.
2. **Method and function entries:** Wrap each reference entry in `:::entry` ... `:::` with `` ### `name()` :kind[method] `` (or `:kind[function]`, `:kind[guard]`), followed by a ```` ```js signature ```` block, 1-2 prose sentences, optional `**Parameters**` + ```` ```params ```` and `**Returns**` + ```` ```returns ```` blocks, and a runnable ```` ```js ```` example.
3. **YAML quoting in `params` and `returns`:** Wrap any `description:` value containing `: ` (such as `{ days: 2 }`) or starting with `{`, `[`, `'`, `` ` ``, or `!` in double quotes. Unquoted colons throw a `YAMLParseError` and leave `astro dev` serving stale cached data.
4. **Headings and tables:**
   - Never put backticks in `##` headings or `<th>` cells (`docs.css` strips code-chip backgrounds only inside `h1` and `.entry > h3`).
   - In 3+ column tables (`.stacks`), the final column **must** be prose because narrow screens (`<= 600px`) render the last cell full-width without a column label. Separate grouped identifiers in earlier columns with commas (`year, month, day`).
   - Use `:::truth` around 2-column expression/result tables where `true` and `false` cells render as tinted status words.
5. **Inline formatting limits:** Keep inline `` `code` `` spans under ~32 characters (`white-space: nowrap` overflows on `390px` mobile viewports) and avoid attaching suffixes directly onto closing backticks (write `` `DateTime` instances `` rather than `` `DateTime`s ``). In frontmatter `lede` and YAML `description` strings, `inline.js` parses only `` `code` ``, `**strong**`, and `[text](href)` (never `*italic*`).
6. **Verify before finishing:**
   - Execute standalone `js` code samples in Node against `src/index.js` and `packages/plugins/src/*.js`.
   - Run `npm run format`, `npx --workspace docs astro sync --force`, and `npm -w docs run build`.
   - Inspect rendered pages in headless Chrome across light, dark, and mobile (`390px`) viewports.
