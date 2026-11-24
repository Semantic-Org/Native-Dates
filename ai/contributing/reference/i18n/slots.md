# UI & Homepage Slot Context

> Status (2026-11-23): Reference for localizing `docs/src/content/strings.json` and `docs/src/data/home-locales.js`. HTML and inline-markdown allowlists are enforced mechanically in `docs/scripts/check-i18n.mjs` (`HTML_KEYS`, `INLINE_KEYS`) rather than duplicated here.

UI micro-copy is copywriting, not prose translation. Every string must fit its DOM slot, rendered placeholder value, and neighboring chips.

## `home-locales.js` Rendering & Coupling

`docs/src/data/home-locales.js` holds per-locale homepage examples and overrides. Edit it in lockstep with `docs/src/content/translations/<locale>/strings.json`:

| Field(s) | Renders as | Coupling & traps |
|---|---|---|
| `setupNote`, `consoles.*.ask`, `consoles.*.why`, `year.lede`, `year.caption` | HTML (`set:html`) | Keep inline `<code>` and `<bdi>` tags intact. |
| `title`, `lede`, `proofs[].label`, `proofs[].note`, `consoles.*.miss`, `fromCity`, `toCity`, `xray.inviteCity`, `try.city` | Plain text | Never put HTML tags here. |
| `year.lede`, `year.caption` | HTML (`set:html`) | `YearStrip.astro` prefers `home-locales.js` over `strings.json`. Migrate existing `{changeCount}`/`{dayCount}` templates in `home-locales.js` to `{changes}` and `{days}` (pluralized from `home.year.changes.*` / `home.year.days.*`) rather than hardcoding nouns. For `ar`, also fix the London–Cairo DST wording and normalize prose digits to Western `0-9`. |
| `xray.inviteCity` vs. `try.city` | Plain text | Two separate fields with different cities and sentence roles: `home.xray.invite` reads `xray.inviteCity` (`Xray.astro`), while `home.try.title` reads `try.city` (`Home.astro`). Match grammatical case in inflected languages (`ru` prepositional `в {city}`, `ar`, etc.). |

## Interactive `home.say.*` Chains

The hero `Say` widget renders three stacked rows (`You want`, `You write`, `You get`) across `.swap` cells. On desktop, `.say-words` uses `white-space: nowrap` (it wraps below `1180px`), so keep every cell short enough to avoid horizontal scrolling on desktop.

Verify every combinatorial sentence in `docs/src/scripts/home/sentences.js` end to end in the target language, checking for repeated prepositions across adjacent cells and cross-chip gender or case clashes:

1. **`meeting`:** `today` + `next.{monday,wednesday,friday,sunday}` + `at.<locale-cities>` + `in.<locale-cities>`
2. **`time`:** `time.{920am,10pm,640am}` + `plus.{8.hours,45.minutes,3.hours}` + `round.{15m,hour}` + `format.{24h,short}`
3. **`length`:** `duration.{90m,45m,2d6h}` + `plus.{45.minutes,3.hours,1.day}` + `times.{2,3}` + `format.{narrow,short,digital}`
4. **`range`:** `range.{may,jan,nov}` + `count.{weekdays,weekends,mondays,days}`
5. **`birthday`:** `birthday.{oct17,feb29,dec25}` + `birthday.{next,in2028,prev}` + `{birthday.fromNow, format.full, birthday.weekday}` — keep `birthday.*` warm and conversational, and note that `home.say.format.full` appears only in `birthday` step 3 alongside two question chips.

## Copywriting Context by Key

| Key(s) | DOM slot | Constraints & pitfalls |
|---|---|---|
| `home.hero.title` | Hero `<h1>` | Display headline. Keep punchy and scannable rather than turning it into a multi-clause sentence. |
| `home.hero.lede` | Hero subhead `<p>` | Present tense for what `Temporal` and `Intl` give browsers today. Preserve `<a ...>` and `<span class="ltr">`, keep literal `br` inside `<abbr title="...">br</abbr>`, and translate the `title="..."` attribute. |
| `home.hero.start`, `home.hero.api` | Hero primary & ghost buttons | 1–3 words max. Keep `API` recognizable. |
| `home.consoles.title` | Section `<h2>` | Preserve `<em class="is-wrong">` and `<em class="is-right">` for `verdict.js`. Avoid an orphaned pronoun ("gets them wrong") in languages that require a clear referent. |
| `home.year.changes.*`, `home.year.days.*`, `home.bench.rounds.*` | Embedded inside `year.lede`, `year.caption`, and `home.bench.run` | Must take the grammatical case required inside the enclosing sentence (e.g. genitive/construct after *"Medians of"* in `home.bench.run`), not standalone nominative badge case. Provide all CLDR plural categories. |
| `home.year.gap.*`, `home.xray.lines.*`, `plugins.count.*`, `api.options.*` | Standalone badges and `<summary>` counters | Use nominative/citation case and provide all CLDR plural categories (`Intl.PluralRules`). |
| `home.bench.title` | Plain-text `<h2>` | `{ratio}` is a bare multiplier (e.g. `2.4`). Plain text only: no `<bdi>` or other HTML tags. |
| `home.bench.lede` | HTML `<p>` | Keep conversational developer voice and preserve both `<a href="{run}">` and `<a href="{add}">`. |
| `home.bench.run` | Plain-text footnote `<p>` | `{rounds}` arrives formatted from `home.bench.rounds.*`. `Medians` means statistical median, never arithmetic mean. |
| `home.bench.note.invalidDate` | Benchmark cell footnote | Ultra-short (2–4 words), e.g. `"accepts Feb 31"`. |
| `home.bytes.title` | HTML `<h2>` | `{size}` already arrives with `&nbsp;` between the number and unit. |
| `home.reads.*` | Model cold-read carousel | Casual, inviting developer tone. `testimonials` means evaluations/reviews, not certificates or diplomas. In Arabic, vocalize `الموجّه` (*prompt*) so it does not read as *router*. |
| `home.closer.title` | Bottom CTA `<h2>` (`Start {call}`) | `{call}` renders `<button class="closer-call"><code>now()</code></button>`. Never attach a bound prefix (`بـ`) directly to `{call}`, and never double the word "now" around `now()`. |
| `search.hint` | HTML empty-search hint | `{function}` and `{word}` already arrive wrapped in `<code>...</code>` from `search.js`. |
| `examples.readMore` | HTML footer line | `{links}` is formatted by `Intl.ListFormat(locale, { type: 'unit', style: 'short' })`; do not add extra commas or conjunctions around `{links}`. |
| `playground.paused` | HTML sandbox banner | **Must** preserve `<button class="pg-run" type="button">...</button>` or `Playground.astro` throws when attaching the click handler. |
| `plugins.stats.picked`, `plugins.callout.body` | HTML stats and tip callout | Preserve `<small>...</small>` in `plugins.stats.picked` and `<a href="{href}">...</a>` in `plugins.callout.body`. |
| `page.prompt` | Pre-filled LLM chat prompt | Translate naturally so Claude, ChatGPT, and Gemini reply in the reader's language. Keep `{url}` intact. |
| `nav.group.handling` | Sidebar group above the other language guides | `nav.js` promotes the active locale's own language guide into `Start`. Match `guides/localization.md`'s prose reference to this exact label. |
| `plugins.*.description` | Plugin card descriptions (`inline()`) | Supports only `` `code` ``, `**strong**`, and `[label](href)`. Never use `*italic*` or raw HTML tags. |
