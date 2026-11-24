# Brazilian Portuguese (`pt-BR`) Localization Glossary

> Status (2026-11-23): Locked terminology glossary and title map for Brazilian Portuguese (`pt-BR`).

## Voice, Register & Punctuation

- **Register:** Natural Brazilian Portuguese OSS developer documentation (MDN PT-BR / Vite / Vue / Svelte Brazil). Short, active, direct sentences addressing the reader with `você` (never `tu`, `o senhor`, or bureaucratic phrasing).
- **Brazilian lexicon only:** Use `arquivo`, `usuário`, `salvar`, `navegador`, `tela`, `requisição`, `caractere`, `padrão`, `fuso horário`, `horário de verão`, and Brazilian gerunds (`formatando`, `convertendo`). Never use European Portuguese (`ficheiro`, `utilizador`, `gravar`, `ecrã`, `a formatar`).
- **Punctuation & numerals:** Use Brazilian typographic double quotes `“...”` (never European `«...»` guillemets). Use comma decimals in prose (`14,9 kB`, `2,4×`) and keep code literals unchanged.
- **Brand & identifiers:** Keep `Native Dates` in prose, `native-dates` in packages/code, and JS class, function, and plugin identifiers (`CalendarDate`, `DateTime`, `Time`, `Duration`, `YearMonth`, `MonthDay`, `DateRange`, `DateTimeRange`, `TimeRange`, `loose`, `zones`, `legacy-date`) untranslated.
- **English-only API inputs:** Explicitly qualify inputs that core only accepts in English (`duration()` unit phrases, `dayOfWeek()`/`configure()` weekday names, `zones` English city names) so readers never assume `'2 semanas'` or `'segunda'` works in core.
- **Frontmatter & `inline()` safety:** Never put raw backticks in frontmatter `lede` or `description` (`<meta name="description">`); never use `*italic*` or raw HTML in `inline()` fields (`lede`, `description`, `try`, `params`/`returns`, `plugins.*.description`).

## Core API Nouns & Concepts

| English | Locked `pt-BR` term | Usage & guardrails |
|---|---|---|
| `CalendarDate` | `data de calendário` (short: `data`) | Calendar day without clock or zone; never `dia civil`. |
| `Time` | `horário` / `hora do dia` | Strictly wall-clock time; NEVER use `horário` alone for `DateTime`. |
| `DateTime` | `data e hora` / `instante com fuso` | Zoned date-and-time value; distinct from `Time`. |
| `moment` | `instante` (casual: `momento`) | Exact point on the timeline. |
| `Duration` | `duração` | Elapsed span of time. |
| `YearMonth` | `ano e mês` | Partial year-and-month value. |
| `MonthDay` | `mês e dia` | Recurring annual month-and-day value. |
| `Range` | `intervalo` | `intervalo de datas` (`DateRange`), `intervalo de horários` (`TimeRange`), `intervalo de datas e horas` (`DateTimeRange`). |
| `partial date` | `data parcial` | Umbrella term for `YearMonth` and `MonthDay`. |
| `time zone` | `fuso horário` (short: `fuso`) | IANA time zone; use `fuso horário` on first mention per section. |
| `offset` | `deslocamento UTC` (short: `deslocamento`) | Keep `offset` only when naming the `.offset` property. |
| `preset` | `preset` | Locked; avoid `predefinição` (PT-PT) and `pré-configuração`. |
| `token pattern` | `padrão de tokens` | Locked; never `máscara`. |
| `loose mode` | `modo loose` | Locked to match `{ loose: true }` and the `loose` plugin. |
| `immutable` | `imutável` | Values never mutate in place. |
| `daylight saving time` | `horário de verão` | Never `hora de verão` (PT-PT). |
| `overflow` / `clamp` | `estouro` / `limitar ao fim do mês` (or `ajustar ao limite`) | Strictly distinct from `truncate` (`truncar`). |
| `rounding` | `arredondamento` | Numeric/unit rounding on `Time`, `DateTime`, `Duration`. |
| `relative time` | `tempo relativo` | Phrases like `ontem`, `em 2 dias`, `há 3 horas`. |
| `disambiguation` | `desambiguação` | Resolving repeated or skipped DST wall times. |
| `polyfill` | `polyfill` | Untranslated loanword. |
| `AI Agent` | `agente de IA` | Also `seu agente` in casual hero/reads UI slots. |

## Standard MDN PT-BR Verbs & Grammar

- **Canonical verbs:** `call` -> `chamar`, `pass` -> `passar`, `return` -> `retornar`, `throw` -> `lançar`, `parse` -> `interpretar` (`analisar` only for syntax/parser internals), `format` -> `formatar`, `compare` -> `comparar`, `chain` -> `encadear`, `clamp` -> `limitar` / `ajustar ao limite`, `truncate` -> `truncar`, `round` -> `arredondar`.
- **`params` / `returns` descriptions:** Concise noun phrase starting with a capital letter and ending with a period (`.`), without a leading verb (e.g., `Fuso horário IANA de destino.`, `Nova instância de DateTime no fuso informado.`).
- **H2 / H3 headings:** Sentence case, no trailing period. Prefer natural Portuguese noun phrases or infinitives over calqued English gerunds.

## CLDR Plural Policy (`pt-BR`)

- `new Intl.PluralRules('pt-BR').resolvedOptions().pluralCategories` returns **`['one', 'many', 'other']`**. Every plural key family in `docs/src/content/translations/pt-br/strings.json` MUST define `.one`, `.many`, and `.other`.
- In numeric `{count}` slots, Portuguese digits do not take `de` (`1000000 dias`, unlike `1 milhão de dias`), so `.many` uses the same plural form as `.other`.
- **Embedded keys (sentence-internal lowercase):**
  - `home.year.changes.{one,many,other}`: `"{count} vez"`, `"{count} vezes"`, `"{count} vezes"`
  - `home.year.days.{one,many,other}`: `"{count} dia"`, `"{count} dias"`, `"{count} dias"`
  - `home.bench.rounds.{one,many,other}`: `"{count} execução"`, `"{count} execuções"`, `"{count} execuções"` (inside `Medianas de {rounds} no Chrome headless {chrome}, medidas em {date}.`)
- **Standalone badge / summary keys:**
  - `home.year.gap.{one,many,other}`: `"{hours} hora de diferença"`, `"{hours} horas de diferença"`, `"{hours} horas de diferença"`
  - `home.xray.lines.{one,many,other}`: `"{count} linha"`, `"{count} linhas"`, `"{count} linhas"`
  - `plugins.count.{one,many,other}`: `"{count} plugin"`, `"{count} plugins"`, `"{count} plugins"`
  - `api.options.{one,many,other}`: `"{count} opção"`, `"{count} opções"`, `"{count} opções"`

## Self-Language Reframing (`portuguese`)

For `docs/guides/portuguese.md` (promoted into `Início` by `nav.js`) and `examples/portuguese/example.md`, write native-to-native Brazilian Portuguese prose. Drop English-learner glosses of everyday Portuguese (`de`, `às`, `segunda-feira`, `ontem`, `anteontem`, `depois de amanhã`, what crase is, or why months are lowercase). Focus directly on library behavior and developer edge cases: escaping `[de]`/`[às]` in token patterns, scoping `1º` ordinals to `'pt-BR'`, `dd` initials colliding on *segunda*/*sexta*, `weekStart` (Sunday in BR/PT vs. Monday in AO/MZ/CV), the 4 Brazilian time zones + 2019 DST abolition, UTC midnight = 21h BRT on servers, and sharp `pt-BR` vs. `pt-PT` contrasts (`medium` preset, ordinals, `em 2 dias` vs. `dentro de 2 dias`). Keep natural Portuguese cross-cultural glosses on the other 7 language guides and non-Portuguese examples.

## Locked `nav.*` Labels & All 61 Page Titles

- **Top & sidebar nav:** `nav.guides` = `Guias`, `nav.api` = `API`, `nav.examples` = `Exemplos`, `nav.plugins` = `Plugins`, `nav.group.start` = `Início`, `nav.group.time` = `Trabalhando com tempo`, `nav.group.going-further` = `Indo além`, `nav.group.classes` = `Classes`, `nav.group.functions` = `Funções`, `nav.group.setup` = `Configuração`, `nav.group.zones` = `Fusos horários`, `nav.group.lengths` = `Durações`, `nav.group.calendars` = `Calendários`, `nav.group.handling` = `Datas e horários em` (sync verbatim in `guides/localization.md`), `nav.group.localization` = `Localização`, `nav.group.reference` = `Referência`, `nav.item.allExamples` = `Todos os exemplos`, `nav.item.allPlugins` = `Todos os plugins`, `nav.item.errors` = `Erros`.
- **`nav.lang.*`:** `japanese` = `Japonês`, `chinese` = `Chinês`, `korean` = `Coreano`, `arabic` = `Árabe`, `russian` = `Russo`, `spanish` = `Espanhol`, `portuguese` = `Português`, `french` = `Francês`, `german` = `Alemão`.

| File (`docs/src/content/...`) | Locked `pt-BR` `title` | File (`docs/src/content/...`) | Locked `pt-BR` `title` |
|---|---|---|---|
| `docs/guides/installation.md` | Instalação | `docs/guides/korean.md` | Coreano |
| `docs/guides/overview.md` | Visão geral | `docs/guides/portuguese.md` | Português |
| `docs/guides/customization.md` | Personalização | `docs/guides/russian.md` | Russo |
| `docs/guides/types-of-time.md` | Tipos de tempo | `docs/guides/spanish.md` | Espanhol |
| `docs/guides/date-math.md` | Cálculos com datas | `docs/api/ranges.md` | Intervalos |
| `docs/guides/months-and-days.md` | Meses e dias | `docs/api/errors.md` | Erros |
| `docs/guides/time-zones.md` | Fusos horários | `examples/arabic/example.md` | Plurais, algarismos e datas islâmicas em árabe |
| `docs/guides/durations.md` | Durações | `examples/chinese/example.md` | Calendários e períodos do dia em chinês |
| `docs/guides/ranges.md` | Intervalos | `examples/countdown/example.md` | Contagem regressiva para um lançamento |
| `docs/guides/formatting.md` | Formatação | `examples/duration-input/example.md` | Durações digitadas |
| `docs/guides/parsing.md` | Interpretação | `examples/french/example.md` | Minúsculas, intervalos e horários regionais em francês |
| `docs/guides/storing-and-sending.md` | Armazenamento e envio | `examples/german/example.md` | Ordinais, intervalos e semanas do calendário em alemão |
| `docs/guides/localization.md` | Localização | `examples/japanese/example.md` | Eras, datas e turnos em japonês |
| `docs/guides/temporal.md` | Trabalhando com Temporal | `examples/korean/example.md` | Espaçamento e intervalos enxutos em coreano |
| `docs/guides/writing-a-plugin.md` | Criando um plugin | `examples/meeting-planner/example.md` | Reunião entre fusos horários |
| `docs/guides/from-dayjs.md` | Migrando do Day.js | `examples/month-grid/example.md` | Grade mensal |
| `docs/guides/from-moment.md` | Migrando do Moment | `examples/opening-hours/example.md` | Aberto agora |
| `docs/guides/arabic.md` | Árabe | `examples/portuguese/example.md` | Crase, intervalos e datas dia/mês em português |
| `docs/guides/chinese.md` | Chinês | `examples/russian/example.md` | Casos dos meses e plurais em russo |
| `docs/guides/french.md` | Francês | `examples/spanish/example.md` | Preposições, minúsculas e datas dia/mês em espanhol |
| `docs/guides/japanese.md` | Japonês | *(20 symbol titles below stay verbatim)* | — |

**20 verbatim symbol-named API & plugin titles (keep exact English title):**

| File (`docs/src/content/...`) | Verbatim `title` | File (`docs/src/content/...`) | Verbatim `title` |
|---|---|---|---|
| `docs/api/date-time.md` | `DateTime` | `docs/api/year-month-fn.md` | `yearMonth()` |
| `docs/api/calendar-date.md` | `CalendarDate` | `docs/api/month-day-fn.md` | `monthDay()` |
| `docs/api/time.md` | `Time` | `docs/api/range-fn.md` | `dateRange()` |
| `docs/api/duration.md` | `Duration` | `docs/api/compare.md` | `compare()` |
| `docs/api/year-month.md` | `YearMonth` | `docs/api/configure.md` | `configure()` |
| `docs/api/month-day.md` | `MonthDay` | `docs/api/kind-of.md` | `kindOf()` |
| `docs/api/date-fn.md` | `date()` | `docs/api/month-names.md` | `monthNames()` |
| `docs/api/datetime-fn.md` | `datetime()` | `docs/plugins/legacy-date.md` | `legacy-date` |
| `docs/api/time-fn.md` | `time()` | `docs/plugins/loose.md` | `loose` |
| `docs/api/duration-fn.md` | `duration()` | `docs/plugins/zones.md` | `zones` |

## Audit Notes on `docs/src/data/home-locales.js` (`'pt-BR'`)

Fix all of the following when editing the `'pt-BR'` block in lockstep with `translations/pt-br/strings.json`:

- **European guillemets `«...»` (7 pairs across 5 fields):** Replace with Brazilian `“...”` in `title` (`«às 09:30»`), `lede` (`«Maio»`), `proofs[0].note` (`«às»`, `«sexta-feira»`, `«maio»`), `proofs[1].note` (`«de maio de 2026»`), and `proofs[2].note` (`«[às]»`).
- **Anglicisms & glossary drift:** In `title`, change `em minúscula` to `em minúsculas` for parity with `proofs[0].note`; in `lede`, replace financial anglicism `capitalizar «Maio»` with `escrever “Maio” com maiúscula`; in `proofs[2].label`, replace `máscara segura` with `padrão de tokens seguro`; in `consoles.day.why`, replace `lê` / `dia civil` with `interpreta` / `data de calendário`.
- **Factual & referent bugs:** In `proofs[3].label`, `duration({ days: 2, hours: 1 })` outputs `2 dias e 1 hora` (both plural and singular), so change `Durações flexionadas no plural` to `Durações com singular e plural corretos`. In `consoles.clocks.ask`, include the concrete date `28 de março` (matching `2026-03-28` in the code). In `consoles.clocks.why`, remove the unintroduced `a reunião` (`muda a reunião para 10h` -> `desloca o horário para as 10h`).
- **Placeholder migration & seasonal clarity in `year`:** Migrate `{changeCount} vezes` in `year.lede` to `{changes}` (phrased around the offset: `alterando a diferença horária {changes} por ano`), and migrate `{dayCount} dias` in `year.caption` to `{days}`. Also replace `Uma daily às 9:30 ... levando a reunião para {time}` with `Uma reunião diária às 09:30 ... no inverno europeu ... levando a reunião para as {time}` (matching `09:30` from `pt-BR` clock format, clarifying Lisbon winter for Brazilian readers, and adding `as` before `12:30`).
