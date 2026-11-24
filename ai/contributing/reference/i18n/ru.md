# Russian (`ru`) Localization Guide & Glossary

> Status (2026-11-24): Authoritative reference for all Russian translators and blind reviewers working on `docs/src/content/translations/ru/` and the `ru` block in `docs/src/data/home-locales.js`. Pair with [`slots.md`](slots.md) and [`docs-i18n.md`](../../workflows/docs-i18n.md).

---

## 1. Voice, Register & Anti-Translationese

- **Voice anchor:** Modern Russian developer documentation (Doka.guide, MDN `ru`, Vite/Vue RU docs). Short, concrete, active sentences without bureaucratic stiffness or marketing fluff.
- **Address:** Always lowercase polite **`вы` / `ваш` / `вам`** — **NEVER** capitalized `Вы` / `Ваш`. Prefer direct active verbs and imperatives (`передайте`, `вызовите`, `вернёт`, `используйте`, `получите`).
- **Mandatory `ё` policy:** ALWAYS write **`ё`** wherever standard Russian orthography requires it (`ещё`, `всё`, `вернёт`, `счёт`, `отсчёт`, `подсчёт`, `чёткий`, `перейдёт`, `идёт`, `переведёт`, `приведёт`, `найдёт`, `пройдёт`, `учтёт`, `возьмёт`, `начнёт`, `объём`, `трёх`, `четырёх`, `введённый`). Never drop dots inconsistently.
- **Zero канцелярит / AI filler:**
  - **Forbidden:** `осуществлять`, `являться`, `данный` (use `этот`), `в данном случае` (use `здесь`), `имеет место`, `в рамках`, `представляет собой`, `производить расчёт`, `функционал` (use `возможности`), `посредством` (use `через` or instrumental case), `на сегодняшний день`, `обеспечивает возможность`.
- **Zero English syntactic calques (mandatory Russian-only rewrite pass):** After drafting each file, re-read the Russian without looking at English and rewrite awkward calques from scratch:
  - *"Pass `'ru'` through [Localization]"* → **NEVER** «Передайте `'ru'` через [Локализацию]». Write «Передайте `'ru'` любым способом из руководства [Локализация](/guides/localization/)» or «Чтобы форматировать даты по-русски, передайте `'ru'` (подробнее — в [Локализации](/guides/localization/)).»
  - *"year-first"* → `с годом в начале` (`ГГГГ-ММ-ДД`); *"day-first"* → `с днём в начале` (`ДД.ММ.ГГГГ`); *"month-first"* → `с месяцем в начале` (`ММ/ДД/ГГГГ`).
  - *"1-indexed"* → `нумерация с 1` (never `1-индексированный`).
  - *"no date to advance"* → `у времени суток нет даты, которую можно перевести на следующий день`.
  - *"rolling into"* → `переходить на следующий день/месяц`.
  - *"falls back to"* → `использует … по умолчанию` / `возвращается к`.
  - *"read off"* → `извлечь из` / `получить из`.
  - *"belongs in"* → `подходит для` / `уместен в`.
  - *"in plain English"* → `на естественном языке` / `читаемым языком` (never imply English JS method names are written in Russian).
  - Avoid zeugma in `lede` (e.g., awkward *"handling X and Y"*).
- **Brand, identifiers, and plugins:** Keep `Native Dates` in prose, `native-dates` in packages/commands/code, and JS identifiers and plugin names (`loose`, `zones`, `legacy-date`) untouched.

---

## 2. Core Technical Glossary (Locked Terms)

All translators and reviewers MUST enforce these exact terms. Do not mix synonyms across pages.

| English | Locked Russian Term | Forbidden / Notes |
|---|---|---|
| `CalendarDate` | `CalendarDate` / календарная дата, дата | Forbid `дата календаря`. |
| `Time` | `Time` / время суток, время | **NEVER** use bare `время` for `DateTime`. **NEVER** use past/future wording («вчера», «завтра», «в прошлом/будущем») on dateless `Time`. |
| `DateTime` | `DateTime` / дата и время, момент времени | Forbid bare `время` or `таймстемп` for `DateTime`. |
| `Duration` | `Duration` / длительность | Forbid `продолжительность` in technical terminology. |
| `YearMonth` | `YearMonth` / год и месяц | — |
| `MonthDay` | `MonthDay` / месяц и день | — |
| `partial date` | частичная дата | Forbid `неполная дата`. |
| `DateRange` | `DateRange` / диапазон дат | Reserve `интервал` for mathematical `полуоткрытый интервал`. |
| `TimeRange` | `TimeRange` / диапазон времени суток, диапазон времени | — |
| `DateTimeRange` | `DateTimeRange` / диапазон дат и времени | — |
| `Range` (generic) | диапазон | — |
| `locale` | локаль (**женский род**: «русская локаль», «активная локаль») | Forbid `язык` when referring to a BCP 47 regional tag (`ru-RU`, `es-MX`, `ar-EG`, `fr-CA`). |
| `localization` | локализация | — |
| `time zone` | часовой пояс | Forbid `временная зона`, `таймзона`; avoid `часовая зона` (use `часовой пояс` consistently, including in `russian.md`). |
| `offset` | смещение, смещение UTC | Forbid `сдвиг` as a noun for UTC offset (use `сдвиг` only for shifting a meeting/clock). |
| `DST` / `daylight saving time` | летнее время / переход на летнее время / сезонный перевод часов | Forbid bare untranslated `DST` in Russian prose. |
| `preset` | пресет | Forbid `предустановка`, `заготовка`. |
| `loose mode` | нестрогий режим | Forbid `свободный режим`, `мягкий режим`, `loose-режим`. |
| `token pattern` | шаблон токенов | Forbid `паттерн токенов`, `маска формата`. |
| `immutable` | неизменяемый (**locked primary term**) | Forbid mixing `иммутабельный`. |
| `clamp` / `clamping` | ограничение по последнему дню месяца / ограничение границами (verb: «ограничивает последним днём месяца») | Forbid `клэмпинг`. **NEVER** confuse with `усечение` (`truncate`). |
| `truncate` | усечение / отбрасывание дробной части (verb: «усекает», «отбрасывает дробную часть») | Distinct from `clamp` and `floor`. |
| `round` / `floor` / `ceil` | округление: `round` — округление (до ближайшего), `floor` — округление вниз, `ceil` — округление вверх | Forbid `флор`, `сейл`. |
| `half-open interval` | полуоткрытый интервал (`[start, nextStart)`) | — |
| `inclusive` | включительно / включающий обе границы | Forbid `инклюзивный`. |
| `factory function` | фабричная функция | Strictly distinct from `конструктор класса` (`date()`, `datetime()`, `time()` are фабричные функции, NOT конструкторы). |
| `mutating setters` | мутирующие сеттеры / сеттеры, изменяющие экземпляр | Forbid `изменяемые сеттеры`. |
| `disambiguation` | разрешение неоднозначности | Clarify when needed: пропущенное или повторяющееся время при переходе на летнее или зимнее время. |
| `prompt` (AI) | промпт | Forbid `подсказка`, `запрос` for LLM prompts. |
| `bundle` | бандл (`размер бандла`) | Forbid `сборка` when referring to bundle weight. |
| `polyfill` | полифил | Single `л`; forbid `полифилл`. |
| `epoch` / `Unix epoch` | эпоха Unix | **CRITICAL:** `epochSeconds` uses `Math.floor` (**округление вниз**), NOT `Math.trunc` (усечение). |
| `return` | возвращает / вернёт | Standard MDN `ru` verb. |
| `throw` | выбрасывает (`выбрасывает RangeError`, `выбрасывает TypeError`) | Forbid `кидает`, `генерирует исключение`. |
| `call` | вызывает / вызовите | Standard MDN `ru` verb. |
| `parse` | разбирает / разбор | **Locked.** Forbid mixing `парсит` / `парсинг` in prose. |
| `format` | форматирует / форматирование | — |
| `chainable` | поддерживающий цепочки вызовов / цепочка вызовов | Forbid `чейнабельный`. |
| `standalone` (month) | самостоятельная форма / отдельно стоящий (в заголовках) | — |

---

## 3. CLDR Plural Rules (`ru`) & Grammatical Case Coupling

`new Intl.PluralRules('ru').resolvedOptions().pluralCategories` returns **`['one', 'few', 'many', 'other']`**:

- `one`: 1, 21, 31, …, 101, 151 (not ending in 11)
- `few`: 2–4, 22–24, …, 154 (not ending in 12–14)
- `many`: 0, 5–20, 25–30, …, 100, 155
- `other`: decimal fractions (`1,5`, `5,5`) — in Russian, decimal fractions govern **genitive singular** (`1,5 дня`, `1,5 раза`, `1,5 прогона`, `1,5 часа`)

**Every plural family in `docs/src/content/translations/ru/strings.json` MUST define all 4 keys (`.one`, `.few`, `.many`, `.other`).**

### Locked Plural Families & Enclosing Templates

| Family | `one` | `few` | `many` | `other` | Enclosing Slot & Case Check |
|---|---|---|---|---|---|
| `api.options.*` | `{count} опция` | `{count} опции` | `{count} опций` | `{count} опции` | Standalone `<summary>` (nominative). Distinct from top-level `Параметры`. |
| `plugins.count.*` | `{count} плагин` | `{count} плагина` | `{count} плагинов` | `{count} плагина` | Standalone counter (nominative). |
| `home.xray.lines.*` | `{count} строка` | `{count} строки` | `{count} строк` | `{count} строки` | Standalone badge (nominative). |
| `home.year.gap.*` | `{hours} час разницы` | `{hours} часа разницы` | `{hours} часов разницы` | `{hours} часа разницы` | Standalone badge (nominative; handles integers and fractional `.5`). |
| `home.year.changes.*` | `{count} раз` | `{count} раза` | `{count} раз` | `{count} раза` | Embedded in `year.lede`: `меняется {changes} в год` (accusative = nominative). |
| `home.year.days.*` | `{count} день` | `{count} дня` | `{count} дней` | `{count} дня` | Embedded in `year.caption`: `На {days} …` (accusative = nominative). |
| `home.bench.rounds.*` | `{count} прогон` | `{count} прогона` | `{count} прогонов` | `{count} прогона` | Embedded in `home.bench.run`: `Медианы за {rounds} …` (accusative = nominative). |

### Required Edits in `docs/src/data/home-locales.js` (`ru`, lines 315–390)

Apply these exact fixes in lockstep with `docs/src/content/translations/ru/strings.json`:

1. **Typo fix (`consoles.day.why`, L354):** Change **`Полуночь`** → **`Полночь`**.
2. **Plural migration (`year.lede`, L379):** Replace `{changeCount} раза` with `{changes}`:
   `В Москве часы не переводят, а в Европе и США переводят дважды в год, поэтому разница во времени меняется {changes} в год. База IANA в Temporal учитывает это бесплатно и без лишних байтов.`
3. **Plural + preposition fix (`year.caption`, L381):** Replace `На протяжении {dayCount} дней` (genitive breaks `1 день`/`2 дня`/`154 дня`) with accusative **`На {days}`**:
   `Ежедневный созвон в 9:30 по Лондону в московском времени за {year} год. На {days} зимнего времени разница увеличивается с {far} до {near} ч, сдвигая встречу на {time}.`
   *(London → Moscow in 2026 evaluates to `{far}` = `2`, `{near}` = `3`, `{days}` = `155 дней`, `{time}` = `12:30`. Grammatical for `1 день`, `2 дня`, `154 дня`, `155 дней`, and `1,5 дня`.)*
4. **Fallback `strings.json` `home.year.lede` & `home.year.caption`:** Match the same `{changes}` and `На {days}` structure and keep the `<a href="https://www.iana.org/time-zones" target="_blank" rel="noopener">IANA</a>` link in `home.year.lede`.
5. **City slot coupling:**
   - `xray.inviteCity: 'Токио'` (L384) pairs with `home.xray.invite`: `Хочу пригласить коллегу из {city}` → «Хочу пригласить коллегу из Токио» (*someone located in Tokyo*, NOT *inviting them to travel to Tokyo*).
   - `try.city: 'Лондоне'` (L386, prepositional case) pairs explicitly with `home.try.title`: `Попробуйте, будто вы в {city}` → «Попробуйте, будто вы в Лондоне».
6. **Critical UI slots in `strings.json`:**
   - `home.bench.run`: `Медианы за {rounds} в headless Chrome {chrome}, замерено {date}.` (**MUST** use `Медианы`, **NEVER** `Средние`.)
   - `home.bench.note.invalidDate`: `принимает 31 февр.`
   - `home.consoles.title`: `Date <em class="is-wrong">ошибается</em>. Temporal отвечает <em class="is-right">точно</em>.` (Preserve both `<em class="is-wrong">` and `<em class="is-right">`; no orphaned pronoun.)
   - `home.closer.title`: `Начните с {call}` (Renders `Начните с now()` — no attached prefix, no doubling «сейчас».)
   - `home.hero.lede`: Keep `<a ...>`, `<span class="ltr">{size}&nbsp;<abbr title="минифицировано и сжато Brotli">br</abbr></span>` (keep literal `br`, translate `title`).
   - `home.reads.*`: `testimonials` → `отзывы` (`отзывы моделей`), `prompt` → `промпт`.
   - `playground.paused`: `Приостановлено для экономии трафика. <button class="pg-run" type="button">Запустить</button>` (Preserve `<button class="pg-run" type="button">...</button>`.)

### Verified `home.say.*` Chains (`docs/src/scripts/home/sentences.js`)

Desktop `.say-words` uses `white-space: nowrap`; keep every chip concise, use natural Russian 24-hour clock times, and avoid repeated prepositions or gender clashes across combinations:

1. **`meeting`** (`today` + `next.*` + `at.*` + `in.*`, `ru` cities: Moscow/London/Paris/Tokyo × London/Tokyo/Kolkata/São Paulo):
   - `today`: `сегодня`
   - `next.*`: `в ближайший понедельник` / `в ближайшую среду` / `в ближайшую пятницу` / `в ближайшее воскресенье`
   - `at.*`: `в 12:00 в Москве`, `в 8:00 в Лондоне`, `в 15:00 в Париже`, `в 18:45 в Токио` (and same pattern `в HH:MM в <предложный падеж>` for all remaining `at.*` cities: `в 9:30 в Лос-Анджелесе`, `в 14:00 в Нью-Йорке`, `в 18:00 в Токио`, `в 17:00 в Шанхае`, `в 18:00 в Сеуле`, `в 11:00 в Каире`, `в 9:30 в Мехико`, `в 9:30 в Сан-Паулу`)
   - `in.*`: `по времени Лондона`, `по времени Токио`, `по времени Колкаты`, `по времени Сан-Паулу` (and `по времени Берлина`, `по времени Сиднея`, `по времени Мадрида`, `по времени Лиссабона`, `по времени Монреаля`)
   - Check: *«сегодня · в ближайшую среду · в 12:00 в Москве · по времени Лондона»* (zero repeated `по`, ~62 chars).
2. **`time`** (`time.*` + `plus.*` + `round.*` + `format.{24h,short}`):
   - `time.*`: `9:20` / `22:00` / `6:40`
   - `plus.*`: `плюс 8 часов` / `плюс 45 минут` / `плюс 3 часа` (`plus.1.day`: `плюс 1 день`)
   - `round.*`: `округлить до 15 мин` / `округлить до часа`
   - `format.24h`: `в 24-часовом формате`; `format.short`: `в кратком формате`
   - Check: *«9:20 · плюс 8 часов · округлить до 15 мин · в 24-часовом формате»*.
3. **`length`** (`duration.*` + `plus.*` + `times.*` + `format.{narrow,short,digital}`):
   - `duration.*`: `1 час 30 минут` / `45 минут` / `2 дня 6 часов`
   - `times.2`: `удвоить`; `times.3`: `утроить` (gender-neutral infinitives matching `округлить`)
   - `format.narrow`: `в компактном формате`; `format.short`: `в кратком формате`; `format.digital`: `в цифровом формате`
   - Check: *«1 час 30 минут · плюс 45 минут · удвоить · в компактном формате»*.
4. **`range`** (`range.*` + `count.*`):
   - `range.may`: `с 1 мая на 2 недели`; `range.jan`: `с 1 по 14 января`; `range.nov`: `весь ноябрь`
   - `count.*`: `сколько будней` / `сколько выходных` / `сколько понедельников` / `сколько дней`
   - Check: *«с 1 мая на 2 недели · сколько будней»*.
5. **`birthday`** (`birthday.{oct17,feb29,dec25}` + `birthday.{next,in2028,prev}` + `{birthday.fromNow, format.full, birthday.weekday}`):
   - Dates: `17 октября` / `29 февраля` / `25 декабря`
   - Step 2 (gender-neutral across all dates): `birthday.next`: `в следующий раз`; `birthday.in2028`: `в 2028 году`; `birthday.prev`: `в прошлый раз`
   - Step 3: `birthday.fromNow`: `относительно сегодня` (works cleanly for both past and future!); `format.full`: `полной датой` (used ONLY in `birthday` step 3); `birthday.weekday`: `какой день недели`
   - Check: *«29 февраля · в 2028 году · полной датой»*, *«17 октября · в прошлый раз · относительно сегодня»*.

---

## 4. Punctuation, Typography & Markdown DSL Rules

- **Quotes:** Russian guillemets **`«...»`** in all Russian prose (nested `„...“` if needed). Never straight `"..."` in Russian prose.
- **Dashes:** Em-dash **` — `** (with spaces) in prose; en-dash **`–`** (without spaces) for numeric and calendar ranges (`1–31`, `11–14`, `пн–вс`).
- **Units (`кБ` vs `kB`):**
  - **In Russian prose** (Markdown guides/API/examples, `strings.json` prose, `home-locales.js` prose): ALWAYS use **`кБ`** (`0 кБ`, `5 кБ`) and **`мс`** (`{ms} мс`).
  - **In injected `{size}` metrics:** `formatSize()` in `docs/src/lib/sizes.js` outputs Latin `14.9 kB` with `&nbsp;`; leave `{size}` untouched and do not append another unit. Keep compact technical labels `br` (inside `<abbr>`) and `min+br` (`plugins.minBr`).
- **Frontmatter `lede` and `description`:** Zero raw backticks, zero `*italic*`, zero raw HTML. Quote YAML strings containing `: ` or starting with `'`, `"`, `{`, `[`, or `!`. Include only `source`, `title`, and `lede` (or `description` and `try` for `example.md`).
- **`inline()` fields** (`lede`, `description`, `try`, ```` ```params ```` / ```` ```returns ```` descriptions, `plugins.*.description`): Zero `*italic*`, zero raw HTML tags.
- **```` ```params ```` and ```` ```returns ```` `description:` style:** Concise Russian **noun phrase**, capitalized, ending with `.`, **no leading finite verb** (matching English `docs/src/content/docs/api/*.md`).
  - Good: `Идентификатор часового пояса IANA, фиксированное смещение UTC или 'UTC'. По умолчанию — настроенный часовой пояс.`
  - Good: `Новый экземпляр DateTime для этой даты в указанное время и часовом поясе.`
  - Bad: `Возвращает новый экземпляр DateTime…`
- **Visible playground UI labels in `example.md` `try:` steps:** Keep English sandbox controls verbatim and bolded: `**Date**`, `**Days**`, `**Span**`, `**Time**`, `**Today**`, `**Typed date**`, `**Unreadable**`, `**Lunar New Year**`, `**平成最後の日**`, `**令和初日**`, `**+35 days**`, `**+4 days**`, plus numeric/date button chips (`**1**`, `**2**`, `**2027-01-01**`, etc.).
- **Untouchable Markdown DSL:**
  - Never modify runnable JS code, literal return-value comments (`// '5:00 PM'`, `// true`), or internal links/English `#anchor` hashes (`/api/date-time/#from`).
  - Keep `:::entry`, `:::steps`, `:::truth`, `:::details`, `{open}`, and callout directive names (`:::note`, `:::tip`, `:::warning`, `:::danger`) untranslated; translate only `[Title]` (plain text with no backticks in `:::details[Title]`).
  - Keep `:kind[method]`, `:kind[function]`, `:kind[guard]` intact.
  - Keep literal `true` and `false` cells in `:::truth` tables untranslated.
  - Preserve `locale="..."` autonym attributes on tabbed code fences; translate `label="..."` attributes.
  - Match English heading count/depth and table count exactly.

---

## 5. English-Only Input Qualifiers & Native Self-Language Reframing

### Always Qualify English-Only API Inputs

Whenever a page documents an API that parses English strings only, state explicitly that the input is English so Russian readers do not pass Russian words:

- **`duration()`:** принимает **английские фразы длительности** (`'2 hours 30 minutes'`, `'1 week'`) и строки ISO 8601 (`'PT90M'`).
- **`dayOfWeek()`, `configure({ weekStart })`, `weekdayNames()`, `.next()`, `.previous()`:** принимают **английские названия дней недели** (`'monday'`, `'mon'`).
- **`@native-dates/plugins/zones`:** принимает **английские названия городов** и аббревиатуры (`'Berlin'`, `'Moscow'`, `'PST'`), а также встроенные национальные псевдонимы (`'москва'`, `'мск'`, `'東京'`, `'北京'`, `'서울'`).
- **`docs/api/errors.md`:** диагностические пояснения в режиме разработки (dev-mode hints) выводятся на английском языке.

### Native-to-Native Reframing (`docs/guides/russian.md` & `examples/russian/example.md`)

Write both Russian self-language pages **native-to-native** for Russian developers — NEVER lecture a Russian reader on basic Russian grammar as if teaching a foreigner:

- Do NOT explain that Russian months decline into genitive next to a day, that Russian has 3 plural forms, that weekdays are lowercase, or translate «позавчера» / «послезавтра».
- Focus on **how `native-dates` handles Russian grammar automatically with zero locale files** and on Russian engineering edge cases: автоматическое переключение именительного и родительного падежей, суффикс «г.» в пресетах и его отсутствие в шаблонах токенов, настройка `Do` и заглавных сокращений дней недели через `configure()`, разбор дат через точку (`16.11.2026`), одиннадцать часовых поясов России и переход Казахстана на единый пояс UTC+5, а также встроенные `'MSK'`, `'мск'`, `'SPB'`, `'Kazan'`, `'Astana'`.
- Keep cross-cultural explanations on the other 7 language guides (`arabic.md`, `chinese.md`, `french.md`, `japanese.md`, `korean.md`, `portuguese.md`, `spanish.md`).

---

## 6. Locked `nav.*` Labels

Use these exact labels in `docs/src/content/translations/ru/strings.json` and in prose references (especially `nav.group.handling` in `docs/guides/localization.md`):

| Key | English | Locked Russian |
|---|---|---|
| `nav.guides` | Guides | `Руководства` |
| `nav.api` | API | `API` |
| `nav.examples` | Examples | `Примеры` |
| `nav.plugins` | Plugins | `Плагины` |
| `nav.group.start` | Start | `Начало работы` |
| `nav.group.time` | Working with time | `Работа со временем` |
| `nav.group.going-further` | Going further | `Дополнительно` |
| `nav.group.classes` | Classes | `Классы` |
| `nav.group.functions` | Functions | `Функции` |
| `nav.group.setup` | Setup | `Конфигурация` |
| `nav.group.zones` | Time zones | `Часовые пояса` |
| `nav.group.lengths` | Durations | `Длительности` |
| `nav.group.calendars` | Calendars | `Календари` |
| `nav.group.handling` | Handling time in | `Языки и локали` *(sync with `guides/localization.md`)* |
| `nav.group.localization` | Localization | `Локализация` |
| `nav.group.reference` | Reference | `Справочник` |
| `nav.item.allExamples` | All examples | `Все примеры` |
| `nav.item.allPlugins` | All plugins | `Все плагины` |
| `nav.item.errors` | Errors | `Ошибки` |
| `nav.lang.japanese` | Japanese | `Японский` |
| `nav.lang.chinese` | Chinese | `Китайский` |
| `nav.lang.korean` | Korean | `Корейский` |
| `nav.lang.arabic` | Arabic | `Арабский` |
| `nav.lang.russian` | Russian | `Русский` |
| `nav.lang.spanish` | Spanish | `Испанский` |
| `nav.lang.portuguese` | Portuguese | `Португальский` |
| `nav.lang.french` | French | `Французский` |
| `nav.lang.german` | German | `Немецкий` |

---

## 7. All 61 Locked Page Titles

Every frontmatter `title` and every cross-page Markdown link text MUST match this table (20 symbol-named API & plugin pages stay verbatim).

### Guides — Batch A (13 files)

| File | English Title | Locked Russian Title |
|---|---|---|
| `docs/guides/installation.md` | Installation | `Установка` |
| `docs/guides/overview.md` | Overview | `Обзор` |
| `docs/guides/customization.md` | Customization | `Настройка` |
| `docs/guides/types-of-time.md` | Types of time | `Типы времени` |
| `docs/guides/date-math.md` | Date math | `Арифметика дат` |
| `docs/guides/months-and-days.md` | Months and days | `Месяцы и дни` |
| `docs/guides/time-zones.md` | Time zones | `Часовые пояса` |
| `docs/guides/durations.md` | Durations | `Длительности` |
| `docs/guides/ranges.md` | Ranges | `Диапазоны` |
| `docs/guides/formatting.md` | Formatting | `Форматирование` |
| `docs/guides/parsing.md` | Parsing | `Разбор` |
| `docs/guides/storing-and-sending.md` | Storing and sending | `Хранение и передача` |
| `docs/guides/localization.md` | Localization | `Локализация` |

### Guides — Batch B (12 files)

| File | English Title | Locked Russian Title |
|---|---|---|
| `docs/guides/temporal.md` | Working with Temporal | `Работа с Temporal` |
| `docs/guides/writing-a-plugin.md` | Writing a plugin | `Написание плагина` |
| `docs/guides/from-dayjs.md` | Coming from Day.js | `Переход с Day.js` |
| `docs/guides/from-moment.md` | Coming from Moment | `Переход с Moment` |
| `docs/guides/arabic.md` | Arabic | `Арабский` |
| `docs/guides/chinese.md` | Chinese | `Китайский` |
| `docs/guides/french.md` | French | `Французский` |
| `docs/guides/japanese.md` | Japanese | `Японский` |
| `docs/guides/korean.md` | Korean | `Корейский` |
| `docs/guides/portuguese.md` | Portuguese | `Португальский` |
| `docs/guides/russian.md` | Russian | `Русский` |
| `docs/guides/spanish.md` | Spanish | `Испанский` |

### API Classes & Functions (19 files — 17 verbatim, 2 translated)

| File | English Title | Locked Russian Title |
|---|---|---|
| `docs/api/date-time.md` | DateTime | `DateTime` |
| `docs/api/calendar-date.md` | CalendarDate | `CalendarDate` |
| `docs/api/time.md` | Time | `Time` |
| `docs/api/duration.md` | Duration | `Duration` |
| `docs/api/year-month.md` | YearMonth | `YearMonth` |
| `docs/api/month-day.md` | MonthDay | `MonthDay` |
| `docs/api/ranges.md` | Ranges | `Диапазоны` |
| `docs/api/date-fn.md` | date() | `date()` |
| `docs/api/datetime-fn.md` | datetime() | `datetime()` |
| `docs/api/time-fn.md` | time() | `time()` |
| `docs/api/duration-fn.md` | duration() | `duration()` |
| `docs/api/year-month-fn.md` | yearMonth() | `yearMonth()` |
| `docs/api/month-day-fn.md` | monthDay() | `monthDay()` |
| `docs/api/range-fn.md` | dateRange() | `dateRange()` |
| `docs/api/compare.md` | compare() | `compare()` |
| `docs/api/configure.md` | configure() | `configure()` |
| `docs/api/errors.md` | Errors | `Ошибки` |
| `docs/api/kind-of.md` | kindOf() | `kindOf()` |
| `docs/api/month-names.md` | monthNames() | `monthNames()` |

### Plugins & Examples (17 files — 3 verbatim, 14 translated)

| File | English Title | Locked Russian Title |
|---|---|---|
| `docs/plugins/legacy-date.md` | legacy-date | `legacy-date` |
| `docs/plugins/loose.md` | loose | `loose` |
| `docs/plugins/zones.md` | zones | `zones` |
| `examples/arabic/example.md` | Arabic plurals, numerals, and Hijri dates | `Арабские множественные формы, цифры и календарь Хиджры` |
| `examples/chinese/example.md` | Chinese calendars and day periods | `Китайские календари и части суток` |
| `examples/countdown/example.md` | Countdown to a launch | `Обратный отсчёт до запуска` |
| `examples/duration-input/example.md` | Typed durations | `Ввод длительностей` |
| `examples/french/example.md` | French casing, ranges, and regional clocks | `Французский регистр, диапазоны и региональные форматы времени` |
| `examples/german/example.md` | German ordinal periods, spans, and calendar weeks | `Немецкие точки в датах, диапазоны и календарные недели` |
| `examples/japanese/example.md` | Japanese eras, dates, and shifts | `Японские эры, даты и смены` |
| `examples/korean/example.md` | Korean spacing and collapsed ranges | `Корейские пробелы и схлопывание диапазонов` |
| `examples/meeting-planner/example.md` | A meeting across zones | `Встреча в разных часовых поясах` |
| `examples/month-grid/example.md` | A month grid | `Календарная сетка месяца` |
| `examples/opening-hours/example.md` | Open right now | `Открыто прямо сейчас` |
| `examples/portuguese/example.md` | Portuguese crasis, ranges, and day-first input | `Португальский красис, диапазоны и даты с днём в начале` |
| `examples/russian/example.md` | Russian month cases and plural counts | `Падежи месяцев и склонение числительных по-русски` |
| `examples/spanish/example.md` | Spanish connectors, casing, and day-first dates | `Испанские предлоги, регистр и даты с днём в начале` |
