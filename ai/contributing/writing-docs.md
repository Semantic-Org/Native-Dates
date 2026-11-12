# Writing Documentation and API Pages

Every guide, API reference, plugin page, and example in `docs/` should read like hand-authored open-source prose that sits comfortably beside Svelte, Luxon, Vue, Vite, and MDN.

Use [`docs/src/content/docs/guides/types-of-time.md`](../../docs/src/content/docs/guides/types-of-time.md) and [`docs/src/content/docs/api/date-time.md`](../../docs/src/content/docs/api/date-time.md) as the reference pair for voice, structure, and density.

## 1. Empirical Cohort Targets

Measured across prose `<p>` paragraphs (excluding headings, tables, lists, and fenced code blocks) in reference open-source documentation:

| Source | `<p>` count | Code blocks | Callouts | Inline `` `code` `` / `<p>` (avg / med) | `<p>`s with `0-2` code spans | Parens / `<p>` | Words / sentence (med, p25-p75) |
|---|---|---|---|---|---|---|---|
| Luxon `Tour` (intro guide) | 36 | 22 | 0 | 0.33 / 0 | 100% | 0.06 | 12 (8-16) |
| Luxon `Math` (topic guide) | 43 | 26 | 0 | 0.44 / 0 | 95% | 0.16 | 14 (8-18) |
| Svelte `$state` (guide) | 33 | 21 | 3 | 1.27 / 1 | 88% | 0.09 | 17 (10-24) |
| Vue `Reactivity: Core` (API) | 50 | 33 | 1 | 0.48 / 0 | 98% | 0.06 | 14 (7-18) |
| Vite `Shared Options` (API) | 81 | 22 | 8 | 1.36 / 1 | 83% | 0.19 | 11 (7-16) |

Hold every page in `docs/` to these bounds:

- **Inline `` `code` `` per `<p>`:** Mean `<= 1.4`, median `<= 1`. At least `85%` of `<p>` paragraphs have `0`, `1`, or `2` inline code spans. **Hard ceiling: `3` inline code spans in any `<p>`** (`0` paragraphs with `4+`).
- **Parameter and return descriptions:** At most `3` inline code spans per YAML `description` line. Summarize unit or preset ranges in plain English (`from 'year' down to 'second'`) instead of listing nine string literals in a row.
- **Parentheticals per `<p>`:** Mean `<= 0.15`. Do not tuck examples, caveats, or type lists inside parentheses in prose.
- **Sentence length:** Median `12-17` words, interquartile range `8-22` words, max `<= 28` words. Mix short declarative sentences (`7-10` words) with explanatory sentences (`15-22` words).
- **Paragraph length:** `1-3` sentences per `<p>` (mean `1.2-1.8`). Default to `1-2` sentences for API method summaries.
- **Show code in blocks, not inline:** Aim for roughly one short (`2-6` line) fenced code block every `1.5-2.5` prose paragraphs in guides.

## 2. Model the Audience and Their Needs

Before writing a page, decide who opened it and what job they are trying to finish:

- **Introductory guides (`Overview`, `Installation`, `Types of time`):** The reader is meeting the library for the first time and wants to write working callsites in two minutes. Introduce one concept per heading, use everyday callsites (`today().plus(2, 'weeks')`, `time('9:00am')`, `date('2026-11-16').at('9:30am')`), and avoid multi-column wire-format tables or `Temporal` taxonomy lectures.
- **Topic and migration guides (`Time zones`, `Date math`, `Formatting`, `Coming from Day.js`):** The reader is solving one concrete problem. Lead with the everyday 80% pattern, show clear code examples, and place advanced cases or interop details near the end.
- **API and plugin references (`DateTime`, `date()`, `ranges`):** The reader is mid-task looking up an exact signature, return type, or edge behavior. Group entries by task so scanning the right-hand table of contents answers where to click.

Use plain developer speech rather than specification language:

- Write *a time of day*, not *a wall-clock reading*.
- Write *a specific moment in time*, not *an exact instant on the timeline*.
- Write *earlier than* / *later than*, not *occurs strictly before*.
- Write *moves forward to the next Friday at the same time of day*, not *advances to the next occurrence of the given weekday at the same wall-clock time*.
- Never hardcode counts of shipped classes or plugins (*the four nouns*, *all six plugins*) in titles or prose. New types (such as `YearMonth` or `MonthDay`) and plugins should land without invalidating surrounding pages.

## 3. Never Narrate Internal Code Tracing

The most recognizable failure mode in AI-authored documentation is reading source files line-by-line and typing the control flow back to the reader as prose. Write from what the caller expresses and what comes back, never from the implementation body:

1. **Keep internal mechanisms out of user docs.** Do not mention `Object.freeze`, own enumerable properties vs. prototype getters, `[Symbol.toPrimitive]` hints, rounding mode strings (`halfExpand`), or internal `Temporal` helper calls unless the page is specifically `Working with Temporal` or `Writing a plugin`.
2. **Do not transcribe one-line method bodies into prose.** Write `Returns a native JavaScript Date for the same instant`, not `Returns new Date(dt.epoch) for passing to legacy APIs`.
3. **Do not dump string literal unions into prose.** Types and `params` blocks already carry signatures. Refer to *calendar units*, *hours and minutes*, or *format presets* in English, and demonstrate concrete calls in a code block.
4. **Never write callouts or hedges around unintended code bugs.** If reading source reveals an asymmetric edge case or potential bug, leave defensive hedges out of the docs and surface the issue separately as a code candidate for the maintainer.

## 4. Callout Budget (`:::note`, `:::tip`, `:::warning`, `:::danger`)

Callouts work only when used selectively. Match the cohort budget per page:

- **Short function or plugin pages (`< 18 <p>`s):** `0-1` callout.
- **Guides (`12-30 <p>`s):** `1` callout (up to `2` on pitfall-heavy topics like DST in `Time zones`; `0` on minimal setup pages if nothing warrants a box).
- **Full class references (`25-40 <p>`s):** `1-2` callouts across the entire page.

Spend a page's callout budget on its highest-leverage rule of thumb or real-world JavaScript/time pitfall (for example, choosing `DateTime` vs. `CalendarDate`, `===` vs. `equals()`, or how trailing `Z` offsets interact with zones). Always include a short sentence-case bracketed title with no backticks so the icon aligns beside the heading:

```markdown
:::tip[DateTime or CalendarDate?]
Ask whether changing time zones should change what the user sees.
:::
```

## 5. Proportional Word Budget

Check section word counts before finishing a page so word share matches how much time downstream developers spend on each topic:

- **Guides:** Spend roughly 80-85% of words on choosing types, creating values, and everyday operations. Keep advanced interop notes to the final 10-15%.
- **API references:** Spend roughly 85% of words on creation, properties, field/zone updates, core arithmetic, comparisons, measuring spans, and `format()` / `toString()`. Keep aliases (`floor`, `ceil`), zero-argument predicates (`isToday()`, `isWeekend()`), and trivial conversions (`toJSDate()`, `toTemporal()`, `valueOf()`) to one sentence or a compact table.

## 6. Astro Markdown and Layout Rules (`docs/`)

1. **Frontmatter:**
   - Guides: `title`, `lede`, `updated`.
   - API pages: `title`, `kind` (`class` or `function`; omit on non-symbol pages like `Errors`), `lede`, `import`, `size` (`core`), `updated`.
   - Plugin pages: `title`, `kind: plugin`, `lede`, `import`, `size` (plugin slug), `updated`.
2. **Method and function entries:** Wrap each reference entry in `:::entry` ... `:::` with `### \`name()\` :kind[method]` (or `:kind[function]`, `:kind[guard]`) so the table of contents renders monospace symbols and clean `#name` anchors. Follow with a ```` ```js signature ```` block, 1-2 prose sentences, optional `**Parameters**` + ```` ```params ```` and `**Returns**` + ```` ```returns ```` blocks, and a runnable ```` ```js ```` example.
3. **YAML quoting in `params` and `returns`:** Wrap any `description:` value containing `: ` (such as `{ days: 2 }`) in double quotes. Unquoted colons throw a `YAMLParseError` and leave `astro dev` serving stale cached data. Always run `npx --workspace docs astro sync --force` after editing docs.
4. **Headings and tables:**
   - Never put backticks in `##` headings or `<th>` cells (`docs.css` only strips code-chip backgrounds inside `h1` and `.entry > h3`).
   - In 3+ column tables (`.stacks`), the final column **must** be prose because narrow screens (`<= 600px`) render the last cell full-width without a column label. Separate grouped identifiers in earlier columns with commas (`year, month, day`).
   - Use `:::truth` around 2-column expression/result tables where `true` and `false` cells are tinted.
5. **Inline formatting limits:** Keep inline `` `code` `` spans under ~32 characters (`white-space: nowrap` overflows on `390px` mobile viewports). In frontmatter `lede` and YAML `description` strings, `inline.js` supports only `` `code` ``, `**strong**`, and `[text](href)` (never `*italic*`).
6. **Verification before committing:** Run every fenced `js` example against `src/index.js` and `packages/plugins/src/*.js` in Node, run `npm run format` and `npx --workspace docs astro sync --force`, and inspect rendered pages in headless Chrome across light, dark, and mobile viewports.
