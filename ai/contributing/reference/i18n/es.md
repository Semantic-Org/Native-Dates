# Spanish (`es`) Localization Glossary & Title Map

> Status (2026-11-23): Locked terminology glossary and title map for Spanish (`es`).

## 1. Voice, Register & Punctuation

- **Register:** Neutral international Spanish open-source documentation prose (MDN ES / Vue / Vite / Svelte style), using informal `tú` (`pasa`, `llama`, `configura`). Avoid Spain-only or regional slang; prefer `archivo`, `navegador`, `zona horaria`, `horario de verano`, `código`, `paquete`.
- **Punctuation:** Use standard Spanish opening and closing marks (`¿...?`, `¡...!`) and curly double quotes (`“...”`, not guillemets `«...»`). Keep decimal dots inside code and standard Spanish typography in prose.
- **Brand & identifiers:** Keep `Native Dates` in prose, `native-dates` in packages/code, and JS class, function, and plugin names (`CalendarDate`, `DateTime`, `Time`, `Duration`, `YearMonth`, `MonthDay`, `DateRange`, `DateTimeRange`, `TimeRange`, `loose`, `zones`, `legacy-date`) untranslated.
- **English-only API inputs:** Explicitly qualify inputs that core only accepts in English (`duration()` unit phrases, `dayOfWeek()`/`configure()` weekday names, `zones` English city names) so readers never assume `'2 semanas'` or `'lunes'` works without plugins.
- **Frontmatter & `inline()` fields:** Never put raw backticks in frontmatter `lede` or `description` (`<meta name="description">`). Never use `*italic*` or raw HTML in `inline()` fields (`lede`, `description`, `try`, `params`/`returns`, `plugins.*.description`).
- **`locale` vs. `idioma`:** Use `locale` in technical API prose wherever regional differences matter (`es-ES` vs. `es-MX`, `en-US` vs. `en-GB`). Use `configuración regional` only when introducing the concept, and `idioma` only for human language.

## 2. Core API Nouns & Concepts

| English term | Canonical Spanish | Usage notes |
|---|---|---|
| `CalendarDate` | `fecha de calendario` / `fecha` | Date without time or zone; never `fecha y hora`. |
| `Time` | `hora del día` / `hora` | Strictly wall-clock time; never use `hora` alone for `DateTime`. |
| `DateTime` | `fecha y hora` / `instante con zona horaria` | Full calendar date, wall time, and time zone. |
| moment | `instante` / `momento` | Point on the timeline. |
| `Duration` | `duración` | Length of time, never `plazo` or `lapso`. |
| `YearMonth` | `año y mes` | Partial date without a day. |
| `MonthDay` | `mes y día` | Recurring annual date without a year. |
| `Range` | `rango` | `rango de fechas`, `rango de horas`, `rango de fechas y horas`. |
| partial date | `fecha parcial` | Collective term for `YearMonth` and `MonthDay`. |
| time zone | `zona horaria` | Never `huso horario` in API docs. |
| offset | `desplazamiento UTC` / `desplazamiento` | Signed distance from UTC (e.g., `-06:00`). |
| preset | `preset` | Locked single term; never `preajuste`. |
| token pattern | `patrón de tokens` | Format strings like `'YYYY-MM-DD'`. |
| loose mode | `modo loose` | Lenient parser from `@native-dates/plugins/loose`. |
| immutable | `inmutable` | Operations always return a new instance. |
| daylight saving time | `horario de verano` | Spell out on first mention; avoid bare `DST` in prose. |
| overflow / clamp | `desbordamiento` / `ajustar al límite del mes` | Strictly distinct from `truncate` (`truncar`). |
| rounding | `redondeo` | Rounding to a unit or increment. |
| relative time | `tiempo relativo` | Phrases like `hace 3 días` or `en 2 horas`. |
| disambiguation | `desambiguación` | Resolving repeated or skipped local times at DST transitions. |
| polyfill | `polyfill` | Unadapted technical term. |
| AI Agent | `agente de IA` | Coding assistant or LLM agent. |
| locale | `locale` / `configuración regional` | `locale` in API docs; never `idioma` when region matters. |

## 3. Standard MDN ES Verbs & Grammar Rules

- **Canonical verbs:** `call` → `llamar` (a), `pass` → `pasar`, `return` → `devolver` (never `retornar`), `throw` → `lanzar`, `parse` → `interpretar` (date strings) / `analizar` (syntax), `format` → `formatear`, `compare` → `comparar`, `chain` → `encadenar`, `clamp` → `ajustar al límite`, `truncate` → `truncar`, `round` → `redondear`.
- **`params` / `returns` descriptions:** Concise noun phrase starting with a capital letter and ending with a period, with no leading verb (e.g., `Zona horaria de destino en formato IANA.`, `Nueva instancia ajustada al inicio de la unidad.`).
- **H2 / H3 headings:** Sentence case with no trailing period (e.g., `## Zonas horarias y horario de verano`).

## 4. CLDR Plural Policy

`new Intl.PluralRules('es').resolvedOptions().pluralCategories` reports `['one', 'many', 'other']`. Every plural family in `strings.json` **must** define all three keys. Because UI counters interpolate raw digits (`{count}` / `{hours}`) rather than spelled-out millions, `.many` mirrors `.other` to avoid ungrammatical `"1000000 de ..."` output.

| Family | Context | `.one` | `.many` | `.other` |
|---|---|---|---|---|
| `home.year.changes.*` | Embedded (`year.lede`) | `{count} vez` | `{count} veces` | `{count} veces` |
| `home.year.days.*` | Embedded (`year.caption`) | `{count} día` | `{count} días` | `{count} días` |
| `home.bench.rounds.*` | Embedded (`home.bench.run`) | `{count} ejecución` | `{count} ejecuciones` | `{count} ejecuciones` |
| `home.year.gap.*` | Standalone badge | `{hours} hora de diferencia` | `{hours} horas de diferencia` | `{hours} horas de diferencia` |
| `home.xray.lines.*` | Standalone badge | `{count} línea` | `{count} líneas` | `{count} líneas` |
| `plugins.count.*` | Standalone counter | `{count} plugin` | `{count} plugins` | `{count} plugins` |
| `api.options.*` | Standalone `<summary>` | `{count} opción` | `{count} opciones` | `{count} opciones` |

## 5. Self-Language Reframing Rule

For `docs/guides/spanish.md` (promoted into `Inicio` by `nav.js`) and `examples/spanish/example.md`, write native-to-native Spanish prose for Spanish-speaking developers. Omit English-learner glosses of everyday Spanish (`de`, `a las`, lowercase months/weekdays, `ayer`, `anteayer`, `pasado mañana`, `de la mañana`), and focus directly on engineering contrasts: regional tags (`es-ES` vs. `es-MX`/`es-AR`/`es-CO`/`es-CL`/`es-PE`/`es-PR`), escaping `[de]` and `[a las]` in token patterns, 24h vs. 12h clocks and AM/PM spacing, and `weekStart` splits. Keep natural Spanish cross-cultural glosses on the other 7 language guides and all non-Spanish examples.

## 6. Locked `nav.*` Labels & All 61 Page Titles

- **Navigation chrome (`nav.*`):** `home` `Inicio de native-dates`, `skip` `Ir al contenido`, `open` `Abrir navegación`, `sections` `Secciones`, `github` `GitHub`, `theme` `Cambiar tema de color`, `themeToDark` `Cambiar a tema oscuro`, `themeToLight` `Cambiar a tema claro`, `notWritten` `Aún sin escribir`, `guides` `Guías`, `api` `API`, `examples` `Ejemplos`, `plugins` `Plugins`.
- **Sidebar groups & items:** `group.start` `Inicio`, `group.time` `Trabajar con el tiempo`, `group.going-further` `Más allá`, `group.classes` `Clases`, `group.functions` `Funciones`, `group.setup` `Configuración`, `group.zones` `Zonas horarias`, `group.lengths` `Duraciones`, `group.calendars` `Calendarios`, `group.handling` `Fechas y horas en` *(match verbatim in `guides/localization.md`)*, `group.localization` `Localización`, `group.reference` `Referencia`, `item.allExamples` `Todos los ejemplos`, `item.allPlugins` `Todos los plugins`, `item.errors` `Errores`.
- **Language labels (`nav.lang.*`):** `japanese` `Japonés`, `chinese` `Chino`, `korean` `Coreano`, `arabic` `Árabe`, `russian` `Ruso`, `spanish` `Español`, `portuguese` `Portugués`, `french` `Francés`, `german` `Alemán`.
- **20 verbatim symbol-named pages (keep `title` identical to English):**
  - Classes (6): `docs/api/date-time.md` (`DateTime`), `docs/api/calendar-date.md` (`CalendarDate`), `docs/api/time.md` (`Time`), `docs/api/duration.md` (`Duration`), `docs/api/year-month.md` (`YearMonth`), `docs/api/month-day.md` (`MonthDay`).
  - Functions (11): `docs/api/date-fn.md` (`date()`), `docs/api/datetime-fn.md` (`datetime()`), `docs/api/time-fn.md` (`time()`), `docs/api/duration-fn.md` (`duration()`), `docs/api/year-month-fn.md` (`yearMonth()`), `docs/api/month-day-fn.md` (`monthDay()`), `docs/api/range-fn.md` (`dateRange()`), `docs/api/compare.md` (`compare()`), `docs/api/configure.md` (`configure()`), `docs/api/kind-of.md` (`kindOf()`), `docs/api/month-names.md` (`monthNames()`).
  - Plugins (3): `docs/plugins/legacy-date.md` (`legacy-date`), `docs/plugins/loose.md` (`loose`), `docs/plugins/zones.md` (`zones`).

| Path | English title | Locked Spanish title |
|---|---|---|
| `docs/guides/installation.md` | Installation | Instalación |
| `docs/guides/overview.md` | Overview | Vista general |
| `docs/guides/customization.md` | Customization | Personalización |
| `docs/guides/types-of-time.md` | Types of time | Tipos de tiempo |
| `docs/guides/date-math.md` | Date math | Aritmética de fechas |
| `docs/guides/months-and-days.md` | Months and days | Meses y días |
| `docs/guides/time-zones.md` | Time zones | Zonas horarias |
| `docs/guides/durations.md` | Durations | Duraciones |
| `docs/guides/ranges.md` | Ranges | Rangos |
| `docs/guides/formatting.md` | Formatting | Formateo |
| `docs/guides/parsing.md` | Parsing | Interpretación |
| `docs/guides/storing-and-sending.md` | Storing and sending | Almacenamiento y envío |
| `docs/guides/localization.md` | Localization | Localización |
| `docs/guides/temporal.md` | Working with Temporal | Trabajar con Temporal |
| `docs/guides/writing-a-plugin.md` | Writing a plugin | Crear un plugin |
| `docs/guides/from-dayjs.md` | Coming from Day.js | Migrar desde Day.js |
| `docs/guides/from-moment.md` | Coming from Moment | Migrar desde Moment |
| `docs/guides/arabic.md` | Arabic | Árabe |
| `docs/guides/chinese.md` | Chinese | Chino |
| `docs/guides/french.md` | French | Francés |
| `docs/guides/japanese.md` | Japanese | Japonés |
| `docs/guides/korean.md` | Korean | Coreano |
| `docs/guides/portuguese.md` | Portuguese | Portugués |
| `docs/guides/russian.md` | Russian | Ruso |
| `docs/guides/spanish.md` | Spanish | Español |
| `docs/api/ranges.md` | Ranges | Rangos |
| `docs/api/errors.md` | Errors | Errores |
| `examples/arabic/example.md` | Arabic plurals, numerals, and Hijri dates | Plurales árabes, numerales y fechas islámicas |
| `examples/chinese/example.md` | Chinese calendars and day periods | Calendarios chinos y períodos del día |
| `examples/countdown/example.md` | Countdown to a launch | Cuenta regresiva para un lanzamiento |
| `examples/duration-input/example.md` | Typed durations | Duraciones escritas |
| `examples/french/example.md` | French casing, ranges, and regional clocks | Mayúsculas, rangos y relojes regionales en francés |
| `examples/german/example.md` | German ordinal periods, spans, and calendar weeks | Puntos ordinales, intervalos y semanas del calendario en alemán |
| `examples/japanese/example.md` | Japanese eras, dates, and shifts | Eras japonesas, fechas y turnos |
| `examples/korean/example.md` | Korean spacing and collapsed ranges | Espaciado y rangos contraídos en coreano |
| `examples/meeting-planner/example.md` | A meeting across zones | Una reunión entre zonas horarias |
| `examples/month-grid/example.md` | A month grid | Cuadrícula mensual |
| `examples/opening-hours/example.md` | Open right now | Abierto ahora |
| `examples/portuguese/example.md` | Portuguese crasis, ranges, and day-first input | Crasis, rangos y fechas día/mes en portugués |
| `examples/russian/example.md` | Russian month cases and plural counts | Casos de meses y plurales en ruso |
| `examples/spanish/example.md` | Spanish connectors, casing, and day-first dates | Rangos, conectores y formato día/mes en español |

## 7. Audit Notes on `docs/src/data/home-locales.js` (`'es'`)

- **Migrate plural placeholders:** Replace `{changeCount} veces` in `year.lede` with `{changes}` and `{dayCount} días` in `year.caption` with `{days}` (pluralized via `home.year.changes.*` / `home.year.days.*`).
- **Quote style consistency:** Replace guillemets `«...»` (`title`, `lede`, `proofs[0]`, `proofs[2]`) with standard double quotes `“...”`.
- **Factual precision in `proofs[2]`:** `weekdayNames('narrow')` returns two-letter abbreviations (`lu · ma · mi · ju · vi · sá · do`), not `"sílabas únicas"` (`ma`, `mi`, `ju`, `vi` are not syllables). Replace `"sílabas únicas"` with `"abreviaturas de dos letras"`.
- **`locale` vs. `idioma` drift:** `lede` says `"Configura el idioma"` and `proofs[3].note` says `"tablas de idioma"`, while `proofs[0].note` uses `"locale"`. Standardize on `locale` (`"Configura el locale"`, `"archivos de locale"`), keeping `idioma del navegador` only in `setupNote`.
- **Clarity & phrasing polish:** In `year.caption`, remove the repeated `"durante {year}. Durante {days}"` and add `"en invierno"` (`"en {year}. Durante {days} en invierno, la diferencia se reduce de {far} a {near} horas..."`). In `year.lede`, include the Temporal IANA database link (`<a href="https://www.iana.org/time-zones" target="_blank" rel="noopener">base de datos IANA</a>`) and replace `"tu bundle"` with `"tu paquete"`. In `proofs[3].label`, tighten `"en América"` to `"en América Latina"` (or `"en México"`, matching `es-MX`). In `consoles.clocks.miss`, consider `"una hora después"` instead of `"una hora tarde"`.
