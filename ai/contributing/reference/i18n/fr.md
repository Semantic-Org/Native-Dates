# French (`fr`) Localization Guide & Glossary

> Status (2026-11-24): Authoritative terminology, typography, UI coupling, and title lock for the `fr` localization of `docs/`. Follow alongside [slots.md](slots.md) and [docs-i18n.md](../../workflows/docs-i18n.md). All 7 French translators and 7 blind French reviewers must enforce every rule here strictly.

---

## 1. Voice, Register & Anti-Translationese

- **Voice anchor:** Modern, direct French developer documentation (MDN Web Docs en français, Vue/Vite FR). Address the reader with polite **`vous`** (`passez`, `appelez`, `obtenez`, `définissez`). Use short, active sentences. Zero bureaucratic padding (`il convient de noter`, `permet de`, `afin de pouvoir`, `en effet`).
- **Rewrite English calques from scratch** (and run a mandatory French-only rewrite pass after drafting each file):
  - `return` -> **`renvoyer`** (forbid `retourner`)
  - `support` -> **`prendre en charge`** / **`prise en charge`** (forbid `supporter`)
  - `library` -> **`bibliothèque`** (forbid `librairie`)
  - `throw` -> **`lever`** (`lève une RangeError`, `lève une TypeError`; forbid `jeter`, `lancer`)
  - `parse` -> **`analyser`** / **`analyse`** (forbid the verb `parser`)
  - `based on` -> avoid overusing `basé sur`; prefer `construit sur`, `reposant sur`, `appuyé sur`, `à partir de`
  - `Pass 'fr-CA' through [Localization]` -> NEVER translate literally (« Passez `'fr-CA'` via [Localisation] »); write naturally (« Définissez une étiquette régionale comme `'fr-CA'` — voir [Localisation](/guides/localization/) » or « Appliquez une étiquette régionale comme `'fr-CA'` comme détaillé dans [Localisation](/guides/localization/) »)
  - `year-first` / `day-first` -> **`année en premier`** / **`jour en premier`**
  - `1-indexed` / `0-indexed` -> **`numéroté à partir de 1`** / **`numéroté à partir de 0`** (forbid `1-indexé`)
  - `no date to advance` -> **`sans date à faire avancer`** / **`sans date associée`**
  - `rolling into` -> **`qui bascule sur le mois suivant`** / **`qui passe à l’année suivante`**
  - `falls back to` -> **`se replie sur`** / **`utilise par défaut`**
  - `read off` -> **`lire directement`** / **`extraire`**
  - `belongs in` -> **`a sa place dans`** / **`relève de`**
  - `in plain English` -> **`en langage naturel`** / **`sous forme lisible`** (never claim JS method names are written in French)
  - **No zeugma in `lede`:** Never translate English *"handling X and Y"* with one mismatched verb; split cleanly or use a natural French noun phrase.
- **Brand, identifiers & runnable code:**
  - Keep **`Native Dates`** in prose, **`native-dates`** in packages, commands, and code, and JS identifiers / class names / method names / plugin names (`loose`, `zones`, `legacy-date`) untouched.
  - **Runnable JS code blocks MUST stay byte-for-byte identical to the English twin.** Never translate or rename JS variables, parameters, or property names inside runnable code (e.g., never rename `meeting` -> `rdv` or `day` -> `jour`; keep whatever identifiers the English source uses). Keep literal return-value comments (`// '5:00 PM'`, `// true`) untouched; translate only explanatory prose comments while keeping class and method names intact.

---

## 2. Core Technical Glossary (Locked)

Every writer and reviewer must use the locked French term below and reject every forbidden alternative.

| English | Locked French | Forbidden / Notes |
|---|---|---|
| `CalendarDate` | `CalendarDate` / `date calendaire` (`date` when unambiguous) | Forbid `date civile` |
| `Time` | `Time` / `heure du jour` (`heure` when unambiguous) | NEVER use bare `heure` for `DateTime`; NEVER use past/future wording (`hier`, `demain`, `passé`, `futur`, `il y a`) on dateless `Time` |
| `DateTime` | `DateTime` / `date et heure`, `instant` (zoned moment) | NEVER reduce `DateTime` to bare `heure` |
| `Duration` | `Duration` / `durée` | — |
| `YearMonth` | `YearMonth` / `année-mois` | — |
| `MonthDay` | `MonthDay` / `mois-jour` | — |
| `partial date` | `date partielle` | — |
| `DateRange` | `DateRange` / `plage de dates` | — |
| `TimeRange` | `TimeRange` / `plage horaire` (`plage d’heures` when contrasting explicitly with `plage de dates`) | — |
| `DateTimeRange` | `DateTimeRange` / `plage de dates et heures` / `plage d’instants` | — |
| `Range` (generic) | `plage` | Reserve `intervalle` strictly for mathematical `intervalle semi-ouvert` |
| `locale` | `locale` (**feminine**: `une locale`, `la locale active`) | Forbid masculine `un locale`; forbid `langue` for regional BCP 47 tags (`fr-CA`, `fr-CH`, `es-MX`) |
| `localization` | `localisation` | — |
| `time zone` | `fuseau horaire` (pl. `fuseaux horaires`) | Forbid `zone horaire`, bare `zone` in prose |
| `offset` | `décalage` / `décalage UTC` | Forbid English `offset` in prose |
| `DST` / `daylight saving time` | `heure d’été` / `changement d’heure` (`passage à l’heure d’été`) | Forbid bare untranslated `DST` in prose |
| `preset` | `préréglage` | Locked across all files; forbid untranslated `preset` in prose |
| `loose mode` | `mode souple` | Forbid `mode loose`, `mode permissif`, `mode tolérant` |
| `token` / `token pattern` | `jeton` / `motif de jetons` | Forbid `token`, `pattern` in prose |
| `immutable` | `immuable` | Forbid English `immutable` in prose |
| `clamp` / `clamping` | `ramener au dernier jour du mois` (month-end) / `borner` (numeric) | Forbid `clamper`; never confuse with `tronquer` (`truncate`) |
| `truncate` | `tronquer` / `troncature` | — |
| `round` / `floor` / `ceil` | `arrondir` (`arrondir au plus proche`, `arrondir à l’inférieur`, `arrondir au supérieur`) | — |
| `half-open interval` | `intervalle semi-ouvert` (`[start, nextStart)`) | — |
| `inclusive` | `inclusif` / `bornes incluses` | — |
| `factory function` | `fonction fabrique` | Strictly distinct from `constructeur de classe`; never call `date()` or `datetime()` a `constructeur` |
| `mutating setters` | `setters mutateurs` / `méthodes de modification sur place` | Forbid `setters mutables` |
| `disambiguation` | `levée d’ambiguïté` | Clarify missing or repeated local times across `changements d’heure` |
| `prompt` (AI) | `prompt` (masculine: `un prompt`, `le prompt`) | — |
| `bundle` | `bundle` (masculine: `le bundle`, `taille du bundle`) | Forbid `paquet` for JS bundle size (`paquet` = npm package) |
| `polyfill` | `polyfill` (masculine: `le polyfill`) | — |
| `epoch` / `Unix epoch` | `époque Unix` | **CRITICAL:** `epochSeconds` uses `Math.floor` (**arrondi à l’entier inférieur**), NOT `Math.trunc` (**tronqué**) |
| `return` (verb) | `renvoyer` (`renvoie`) | Forbid `retourner` (`retourne`) |
| `throw` (verb) | `lever` (`lève une RangeError`, `lève une TypeError`) | Forbid `jeter`, `lancer` |
| `parse` (verb/noun) | `analyser` (`analyse`) / `analyse` | Forbid the verb `parser` |
| `format` (verb/noun) | `formater` (`formate`) / `formatage` | — |
| `support` (verb/noun) | `prendre en charge` (`prend en charge`) / `prise en charge` | Forbid `supporter` (`supporte`) |
| `library` | `bibliothèque` | Forbid `librairie` |

---

## 3. CLDR Plurals (`fr`), `home-locales.js` Coupling & `home.say.*` Chains

### 3.1 CLDR Plural Categories & Locked Families

`new Intl.PluralRules('fr').resolvedOptions().pluralCategories` returns **`['one', 'many', 'other']`**:

- **`one`** covers BOTH **`0` and `1`** (`0 jour`, `1 jour`, `0 option`, `1 option`, `0 ligne`, `1 ligne`).
- **`other`** covers `2+` (`2 jours`, `5 options`, `14 lignes`).
- **`many`** covers exact millions (`1 000 000`) and mirrors **`other`** when interpolating raw digit `{count}` / `{hours}`.

Every plural key family in `docs/src/content/translations/fr/strings.json` **MUST** define `.one`, `.many`, and `.other`:

| Key family | `.one` | `.many` | `.other` | Slot context |
|---|---|---|---|---|
| `api.options` | `{count} option` | `{count} options` | `{count} options` | Standalone `<summary>` counter |
| `plugins.count` | `{count} plugin` | `{count} plugins` | `{count} plugins` | Standalone badge |
| `home.xray.lines` | `{count} ligne` | `{count} lignes` | `{count} lignes` | Standalone badge |
| `home.year.gap` | `{hours} heure d’écart` | `{hours} heures d’écart` | `{hours} heures d’écart` | Standalone badge (`{hours}` placeholder) |
| `home.year.changes` | `{count} fois` | `{count} fois` | `{count} fois` | Embedded in `year.lede` (`fois` invariable) |
| `home.year.days` | `{count} jour` | `{count} jours` | `{count} jours` | Embedded in `year.caption` (`Pendant {days}`) |
| `home.bench.rounds` | `{count} exécution` | `{count} exécutions` | `{count} exécutions` | Embedded in `home.bench.run` (`Médianes sur {rounds}`) |

### 3.2 Required Updates in `docs/src/data/home-locales.js` (`fr` Block) & Coupled UI Keys

Edit `docs/src/data/home-locales.js` (lines 546–621) in lockstep with `docs/src/content/translations/fr/strings.json`:

1. **`consoles.day.why` (L585):** Replace `date civile` with **`date calendaire`** to match the locked glossary.
2. **`year.lede` (L610):** Replace `{changeCount} fois` with **`{changes}`**.
3. **`year.caption` (L612):** Replace `{dayCount} jours` with **`{days}`**.
4. **`xray.inviteCity: 'Tokyo'` + `home.xray.invite`:** Lock `home.xray.invite` to **`Inviter un collègue basé à {city}`** (`Inviter un collègue basé à Tokyo`).
5. **`try.city: 'Montréal'` + `home.try.title`:** Lock `home.try.title` to **`Essayez comme si vous étiez à {city}`** (`Essayez comme si vous étiez à Montréal`).
6. **High-risk UI keys (locked in `strings.json`):**
   - `home.bench.run`: **`Médianes sur {rounds} dans Chrome headless {chrome}, mesurées le {date}.`** (Use **`Médianes`**, NEVER `Moyennes`; **`sur {rounds}`** avoids `de/d’` elision conflicts across counts.)
   - `home.bench.overall.task`: **`Moyenne globale`** (NEVER `Total`, as the row reports mean time, not a sum).
   - `home.bench.overall.detail`: **`Temps moyen, avec native-dates à 1×`**.
   - `home.reads.inspect`: **`Voir le prompt`** (concise button paired with `Copier le prompt`).
   - `home.consoles.start.miss`: **`valeur d’origine modifiée`** (unambiguous; avoids physical-location reading of bare « sur place »).
   - `home.consoles.start.why`: **`<code>setDate()</code> modifie l’instance <code>Date</code> d’origine. Les valeurs <code>native-dates</code> sont immuables : <code>plus()</code> renvoie une nouvelle instance.`**
   - `home.consoles.title`: **`Date se <em class="is-wrong">trompe</em>. Temporal voit <em class="is-right">juste</em>.`** (preserves both `<em class="is-wrong">` and `<em class="is-right">` with no orphaned pronoun).
   - `home.closer.title`: **`Commencez avec {call}`** (never double `maintenant` around `now()`).
   - `home.hero.lede`: preserve `<a ...>`, `<span class="ltr">`, and literal `br` inside `<abbr title="minifié et compressé en Brotli">br</abbr>`.
   - `playground.paused`: preserve `<button class="pg-run" type="button">Exécuter</button>` verbatim.

### 3.3 Verified `home.say.*` Chains (`docs/src/scripts/home/sentences.js`)

Desktop `.say-words` uses `white-space: nowrap`; keep every chip short so every combination fits cleanly on one line with zero gender, number, tense, or preposition clashes:

1. **`meeting`** (`today` + `next.*` + `at.{paris,london,saoPaulo,tokyo}` + `in.{montreal,tokyo,kolkata,sydney}`):
   - `today`: `aujourd’hui`
   - `next.{monday,wednesday,friday,sunday}`: `lundi prochain`, `mercredi prochain`, `vendredi prochain`, `dimanche prochain`
   - `at.*`: `à 15 h à Paris`, `à 8 h à Londres`, `à 9 h 30 à São Paulo`, `à 18 h 45 à Tokyo` (and for remaining `strings.json` `at.*` keys: `à 9 h 30 à Los Angeles`, `à 14 h à New York`, `à 18 h à Tokyo`, `à 17 h à Shanghai`, `à 18 h à Séoul`, `à 11 h au Caire`, `à 12 h à Moscou`, `à 9 h 30 à Mexico`)
   - `in.*`: `heure de Montréal`, `heure de Tokyo`, `heure de Kolkata`, `heure de Sydney` (and remaining `in.*`: `heure de Berlin`, `heure de São Paulo`, `heure de Londres`, `heure de Madrid`, `heure de Lisbonne`)
   - Sample check: `aujourd’hui` | `lundi prochain` | `à 15 h à Paris` | `heure de Montréal`
2. **`time`** (`time.*` + `plus.*` + `round.*` + `format.{24h,short}`):
   - `time.{920am,10pm,640am}`: `9 h 20`, `22 h 00`, `6 h 40`
   - `plus.{8.hours,45.minutes,3.hours,1.day}`: `plus 8 heures`, `plus 45 minutes`, `plus 3 heures`, `plus 1 jour`
   - `round.{15m,hour}`: `arrondi à 15 min`, `arrondi à l’heure`
   - `format.{24h,short}`: `format 24 h`, `format court`
   - Sample check: `9 h 20` | `plus 45 minutes` | `arrondi à 15 min` | `format 24 h`
3. **`length`** (`duration.*` + `plus.*` + `times.{2,3}` + `format.{narrow,short,digital}`):
   - `duration.{90m,45m,2d6h}`: `1 h 30`, `45 minutes`, `2 jours 6 heures`
   - `times.{2,3}`: `fois 2`, `fois 3` (avoids feminine/masculine plural participle clashes across `45 minutes` and `2 jours 6 heures`)
   - `format.{narrow,short,digital}`: `format compact`, `format court`, `format numérique`
   - Sample check: `2 jours 6 heures` | `plus 45 minutes` | `fois 2` | `format numérique`
4. **`range`** (`range.*` + `count.*`):
   - `range.{may,jan,nov}`: `2 semaines à partir du 1er mai`, `du 1er au 14 janvier`, `tout le mois de novembre`
   - `count.{weekdays,weekends,mondays,days}`: `combien de jours ouvrés`, `combien de jours de week-end`, `combien de lundis`, `combien de jours`
   - Sample check: `2 semaines à partir du 1er mai` | `combien de jours de week-end`
5. **`birthday`** (`birthday.{oct17,feb29,dec25}` + `birthday.{next,in2028,prev}` + `{birthday.fromNow, format.full, birthday.weekday}`):
   - `birthday.{oct17,feb29,dec25}`: `17 octobre`, `29 février`, `25 décembre`
   - `birthday.{next,in2028,prev}`: `le prochain`, `en 2028`, `le dernier`
   - `birthday.fromNow`: `à combien de temps d’ici` (works naturally for BOTH future `le prochain` / `en 2028` AND past `le dernier` — NEVER use future-only `dans combien de temps`)
   - `format.full`: `format complet` (used only in `birthday` step 3)
   - `birthday.weekday`: `quel jour de la semaine`
   - Sample check: `29 février` | `le dernier` | `à combien de temps d’ici`

---

## 4. Typography, Punctuation & Markdown DSL Invariants

- **Apostrophes:** Always use the typographic curly apostrophe **`’`** (`l’heure`, `d’un`, `aujourd’hui`) in French prose and UI strings. Never use straight `'` outside code and YAML delimiters.
- **Quotation marks:** Always use French guillemets **`« ... »`** with spaces inside (`« vendredi 15 mai 2026 »`, `« 14h30 »`). Never use straight `"..."` or English curly `“...”` in French prose.
- **Double punctuation spacing:** Put one regular space before `:`, `?`, `!`, and `;` (`selon les régions :`, `en français ?`, `attention !`) consistently across all 61 Markdown files and `strings.json`. Using regular spaces matches the existing `fr` files and keeps Markdown tables and YAML parsers clean.
- **Units & numbers:** Write **`ko`** (`0 ko`, `14,9 ko`) and **`ms`** in French prose, with a decimal comma (`14,9`) and space as thousands separator (`1 000 000`). Leave `{size}` (`formatSize()` output), `{ratio}`, `br`, and `min+br` untouched.
- **Headings:** Use French sentence case (`## Variantes régionales`, `## Analyser les dates et heures saisies`). Match English heading count, depth, and table count exactly so `remark-docs.js` and `rehype-docs.js` inherit stable English anchor IDs and `.t` column styling.
- **Frontmatter & `inline()` fields:**
  - Include only `source`, `title`, and `lede` (or `description` and `try` for `example.md`). Omit `reviewed` so pages ship Reviewed. Quote YAML values containing `: ` or starting with `` ` ``, `'`, `"`, `{`, `[`, `!`, or `«`.
  - Frontmatter **`lede`** and **`description`**: **zero raw backticks, zero `*italic*`, zero raw HTML.**
  - All **`inline()`** fields (`lede`, `description`, `try`, ```` ```params ```` / ```` ```returns ```` descriptions, `plugins.*.description`): **zero `*italic*`, zero raw HTML** (only `` `code` ``, `**strong**`, and `[label](href)` are parsed, with `lede` and `description` kept free of backticks as well).
- **```` ```params ```` and ```` ```returns ```` `description:` style:**
  - Concise French **noun phrase**, capitalized first letter, ending with a period `.`, **no leading finite verb** (NEVER `Renvoie…`, `Prend…`, `Définit…`).
  - Example: `Date calendaire décalée du nombre d’unités demandé.` (NOT `Renvoie la date calendaire décalée…`).
  - Translate only `description:`; never modify YAML keys (`name`, `type`, `required`, `default`, `options`) or `type:` strings.
- **Playground labels in `example.md` `try:` steps:** Keep visible English sandbox button, tab, and field labels verbatim and bolded (`**Date**`, `**Days**`, `**Span**`, `**Time**`, `**Today**`, `**Typed date**`, `**Unreadable**`, `**2027-01-01**`, etc.), since the interactive sandbox UI stays in English.
- **Untouchable Markdown DSL:**
  - Runnable JS code blocks and literal return-value comments (`// '5:00 PM'`, `// true`).
  - Directives (`:::entry`, `:::steps`, `:::truth`, `:::details`, `{open}`, `:::note`, `:::tip`, `:::warning`, `:::danger`): translate only `[Title]` (keep `:::details[Title]` plain with no backticks).
  - `:kind[method]`, `:kind[function]`, `:kind[guard]` tags.
  - `locale="..."` autonym attributes on tabbed code fences (translate `label="..."` attributes).
  - Literal `true` and `false` cells inside `:::truth` tables.
  - Root-relative internal links (`/guides/...`, `/api/...`, `/plugins/...`, `/examples/...`) and English `#anchor` hashes (NEVER prefix internal links with `/fr/`).

---

## 5. English-Only Input Qualifiers & Native Self-Language Reframing

- **Always qualify English-only API inputs** so French readers never pass French words where the library expects English:
  - `duration()`: specify *expressions de durée en anglais* (`'2 hours 30 minutes'`, `'1 day'`), alongside ISO 8601 and compact forms (`'2h 30m'`).
  - `dayOfWeek()`, `configure({ weekStart })`, `startOf('week', ...)`, `weekdayNames()`, `count()`: specify *noms de jours ou mots-clés en anglais* (`'monday'`, `'weekdays'`, `'mondays'`).
  - `zones` plugin: specify *noms de villes IANA en anglais* (`'New York'`, `'Berlin'`, `'Tokyo'`), noting built-in native aliases where relevant (`'Montréal'`, `'Bruxelles'`, `'Genève'`, `'HNE'`, `'東京'`, `'北京'`, `'서울'`, `'москва'`).
  - `docs/api/errors.md`: note that dev-mode diagnostic messages (`dates refused [code] at ...`) are emitted in English.
- **Native-to-native reframing for `docs/guides/french.md` and `examples/french/example.md`:**
  - Write directly from one French developer to another. Do **NOT** lecture French readers on everyday French spelling they already know (never explain *that* days and months are lowercase in French, *that* the first of the month is written *1er*, or *why* *mars*, *mai*, *juin*, and *août* take no period).
  - Focus directly on library behavior and pitfalls: regional variants (`fr-FR`, `fr-CA`, `fr-CH`, `fr-BE`, `fr-DZ`), escaping literal `'h'` in `'HH[h]mm'` vs unescaped *à*, registering an `ordinals` rule on `'fr'` inherited by regional tags, omitting a trailing period after `MMM`, capitalizing `s[0].toUpperCase()` only when a date opens a heading, ambiguous `'jui'` returning `null` in mode souple, the Paris–Montréal seasonal DST gap and Morocco Ramadan UTC+0, and expecting curly `’` plus `\u202f` / `\u00a0` in test assertions.
  - Keep cross-cultural explanations intact on the other 7 language guides and other language examples.

---

## 6. Locked `nav.*` Labels

Sync `nav.group.handling` (`Guides par langue`) with the prose reference in `docs/guides/localization.md` (`**Guides par langue**`).

| Key | English | Locked French |
|---|---|---|
| `nav.home` | native-dates home | Accueil native-dates |
| `nav.skip` | Skip to content | Aller au contenu |
| `nav.open` | Open navigation | Ouvrir la navigation |
| `nav.sections` | Sections | Sections |
| `nav.github` | GitHub | GitHub |
| `nav.theme` | Toggle color theme | Changer de thème |
| `nav.themeToDark` | Switch to dark theme | Passer au thème sombre |
| `nav.themeToLight` | Switch to light theme | Passer au thème clair |
| `nav.notWritten` | Not written yet | Pas encore rédigé |
| `nav.guides` | Guides | Guides |
| `nav.api` | API | API |
| `nav.examples` | Examples | Exemples |
| `nav.plugins` | Plugins | Plugins |
| `nav.group.start` | Start | Démarrer |
| `nav.group.time` | Working with time | Manipuler le temps |
| `nav.group.going-further` | Going further | Aller plus loin |
| `nav.group.classes` | Classes | Classes |
| `nav.group.functions` | Functions | Fonctions |
| `nav.group.setup` | Setup | Configuration |
| `nav.group.zones` | Time zones | Fuseaux horaires |
| `nav.group.lengths` | Durations | Durées |
| `nav.group.calendars` | Calendars | Calendriers |
| `nav.group.handling` | Handling time in | Guides par langue |
| `nav.group.localization` | Localization | Localisation |
| `nav.group.reference` | Reference | Référence |
| `nav.item.allExamples` | All examples | Tous les exemples |
| `nav.item.allPlugins` | All plugins | Tous les plugins |
| `nav.item.errors` | Errors | Erreurs |
| `nav.lang.japanese` | Japanese | Japonais |
| `nav.lang.chinese` | Chinese | Chinois |
| `nav.lang.korean` | Korean | Coréen |
| `nav.lang.arabic` | Arabic | Arabe |
| `nav.lang.russian` | Russian | Russe |
| `nav.lang.spanish` | Spanish | Espagnol |
| `nav.lang.portuguese` | Portuguese | Portugais |
| `nav.lang.french` | French | Français |
| `nav.lang.german` | German | Allemand |

---

## 7. All 61 Locked Page Titles

Cross-page Markdown links must use these exact destination titles. The 20 symbol-named API and plugin pages stay verbatim.

| File | English Title | Locked French Title |
|---|---|---|
| `docs/guides/installation.md` | Installation | Installation |
| `docs/guides/overview.md` | Overview | Vue d’ensemble |
| `docs/guides/customization.md` | Customization | Personnalisation |
| `docs/guides/types-of-time.md` | Types of time | Types de temps |
| `docs/guides/date-math.md` | Date math | Calculs de dates |
| `docs/guides/months-and-days.md` | Months and days | Mois et jours |
| `docs/guides/time-zones.md` | Time zones | Fuseaux horaires |
| `docs/guides/durations.md` | Durations | Durées |
| `docs/guides/ranges.md` | Ranges | Plages |
| `docs/guides/formatting.md` | Formatting | Formatage |
| `docs/guides/parsing.md` | Parsing | Analyse |
| `docs/guides/storing-and-sending.md` | Storing and sending | Stockage et échange |
| `docs/guides/localization.md` | Localization | Localisation |
| `docs/guides/temporal.md` | Working with Temporal | Travailler avec Temporal |
| `docs/guides/writing-a-plugin.md` | Writing a plugin | Écrire un plugin |
| `docs/guides/from-dayjs.md` | Coming from Day.js | Migrer depuis Day.js |
| `docs/guides/from-moment.md` | Coming from Moment | Migrer depuis Moment |
| `docs/guides/arabic.md` | Arabic | Arabe |
| `docs/guides/chinese.md` | Chinese | Chinois |
| `docs/guides/french.md` | French | Français |
| `docs/guides/japanese.md` | Japanese | Japonais |
| `docs/guides/korean.md` | Korean | Coréen |
| `docs/guides/portuguese.md` | Portuguese | Portugais |
| `docs/guides/russian.md` | Russian | Russe |
| `docs/guides/spanish.md` | Spanish | Espagnol |
| `docs/api/date-time.md` | DateTime | `DateTime` (verbatim) |
| `docs/api/calendar-date.md` | CalendarDate | `CalendarDate` (verbatim) |
| `docs/api/time.md` | Time | `Time` (verbatim) |
| `docs/api/duration.md` | Duration | `Duration` (verbatim) |
| `docs/api/year-month.md` | YearMonth | `YearMonth` (verbatim) |
| `docs/api/month-day.md` | MonthDay | `MonthDay` (verbatim) |
| `docs/api/ranges.md` | Ranges | Plages |
| `docs/api/date-fn.md` | date() | `date()` (verbatim) |
| `docs/api/datetime-fn.md` | datetime() | `datetime()` (verbatim) |
| `docs/api/time-fn.md` | time() | `time()` (verbatim) |
| `docs/api/duration-fn.md` | duration() | `duration()` (verbatim) |
| `docs/api/year-month-fn.md` | yearMonth() | `yearMonth()` (verbatim) |
| `docs/api/month-day-fn.md` | monthDay() | `monthDay()` (verbatim) |
| `docs/api/range-fn.md` | dateRange() | `dateRange()` (verbatim) |
| `docs/api/compare.md` | compare() | `compare()` (verbatim) |
| `docs/api/configure.md` | configure() | `configure()` (verbatim) |
| `docs/api/errors.md` | Errors | Erreurs |
| `docs/api/kind-of.md` | kindOf() | `kindOf()` (verbatim) |
| `docs/api/month-names.md` | monthNames() | `monthNames()` (verbatim) |
| `docs/plugins/legacy-date.md` | legacy-date | `legacy-date` (verbatim) |
| `docs/plugins/loose.md` | loose | `loose` (verbatim) |
| `docs/plugins/zones.md` | zones | `zones` (verbatim) |
| `examples/arabic/example.md` | Arabic plurals, numerals, and Hijri dates | Pluriels arabes, chiffres et calendrier hégirien |
| `examples/chinese/example.md` | Chinese calendars and day periods | Calendriers chinois et périodes de la journée |
| `examples/countdown/example.md` | Countdown to a launch | Compte à rebours avant un lancement |
| `examples/duration-input/example.md` | Typed durations | Saisie de durées |
| `examples/french/example.md` | French casing, ranges, and regional clocks | Casse française, plages et horloges régionales |
| `examples/german/example.md` | German ordinal periods, spans, and calendar weeks | Points ordinaux allemands, plages et semaines calendaires |
| `examples/japanese/example.md` | Japanese eras, dates, and shifts | Ères japonaises, dates et horaires de nuit |
| `examples/korean/example.md` | Korean spacing and collapsed ranges | Espacement coréen et plages condensées |
| `examples/meeting-planner/example.md` | A meeting across zones | Une réunion sur plusieurs fuseaux |
| `examples/month-grid/example.md` | A month grid | Une grille mensuelle |
| `examples/opening-hours/example.md` | Open right now | Ouvert en ce moment |
| `examples/portuguese/example.md` | Portuguese crasis, ranges, and day-first input | Crase portugaise, plages et saisie jour en premier |
| `examples/russian/example.md` | Russian month cases and plural counts | Déclinaisons russes des mois et pluriels |
| `examples/spanish/example.md` | Spanish connectors, casing, and day-first dates | Prépositions espagnoles, casse et dates jour en premier |
