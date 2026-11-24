# Korean (`ko`) Localization Glossary

> Status (2026-11-24): Locked terminology glossary, grammar conventions, and title map for Korean (`ko`). All Korean translators and blind reviewers follow this guide strictly alongside [`slots.md`](slots.md) and [`docs-i18n.md`](../../workflows/docs-i18n.md).

## 1. Voice, Register & Anti-Translationese

- **Register:** Natural, direct Korean developer prose matching MDN Korean and modern Korean open-source docs (Vite, Vue, Svelte).
  - Explanations and body prose: polite formal **합쇼체 (`~합니다 / ~입니다`)**.
  - Direct calls to action, tips, and UI/guide instructions: polite **해요체 (`~하세요`)**.
  - Short UI labels, buttons, table headers, H2/H3 headings, and ```` ```params ```` / ```` ```returns ```` descriptions: concise **명사형 (noun-phrase style)**.
- **Zero AI-translationese ("번역투"):** Write active, concrete Korean sentences instead of mirroring English syntax.
  - Avoid clunky passive calques (`~에 의해`, `~되어집니다`, literal English passive voice).
  - Avoid `~을 가지고 있다` for English *"has"* (prefer `~이 있습니다`, `~을 포함합니다`, `~을 지닙니다`).
  - Avoid literal `그것` / `이것` pronouns — name the referent or omit it naturally.
  - Address the reader directly without `당신` (omit the subject in Korean).
  - Avoid automatic tricolons, bureaucratic padding (`~하는 것이 가능합니다` -> `~할 수 있습니다`), and stacked parentheticals.
- **English calques to rewrite natively:**
  - `year-first` / `day-first` / `month-first` -> `연-월-일 순` / `일-월-연 순` / `월-일-연 순`
  - `1-indexed` -> `1부터 시작하는`
  - `no date to advance` -> `넘어갈 날짜가 없으므로`
  - `rolling into [next month]` -> `다음 달로 넘어가는`
  - `falls back to` -> `~을 기본값으로 사용합니다` / `~로 대체됩니다`
  - `read off` -> `바로 읽습니다` / `추출합니다`
  - `belongs in` -> `~에 두는 것이 적절합니다` / `~에서 다룹니다`
  - `in plain English` -> `자연스러운 표현으로` / `읽기 쉬운 자연어 형태로` (never claim English JS method names are written in Korean)
  - `Pass 'ko-KR' through [Localization]` -> `[현지화](/guides/localization/) 안내에 따라 'ko-KR'을 설정하세요` (never translate *"through [Guide]"* literally as passing a value through a guide title)
- **Identifiers & brand:** Keep `Native Dates` in prose, `native-dates` in package/code contexts, and JS class, function, method, and plugin names (`CalendarDate`, `DateTime`, `Time`, `Duration`, `YearMonth`, `MonthDay`, `loose`, `zones`, `legacy-date`) untranslated.

## 2. Core Technical Glossary (Locked Terms)

| English | Locked Korean | Forbidden / Guardrails |
|---|---|---|
| `CalendarDate` | `CalendarDate` / 달력 날짜 (약칭: 날짜) | Keep class name `CalendarDate`. Date with no clock or time zone. |
| `Time` | `Time` / 시각 | Strictly wall-clock time of day. **Never** use bare `시간` or `시각` alone for `DateTime`, and **never** use past/future wording (어제/내일/이전 날) on dateless `Time`. |
| `DateTime` | `DateTime` / 날짜와 시각, 시점 | Zoned instant/datetime. Keep `날짜와 시각` / `시점` strictly distinct from `날짜` (`CalendarDate`), `시각` (`Time`), and `기간` (`Duration`). |
| `Duration` | `Duration` / 기간 | Length of time. Never confuse with `시각` (`Time`). |
| `YearMonth` | `YearMonth` / 연월 | Keep class name `YearMonth`. |
| `MonthDay` | `MonthDay` / 월일 | Keep class name `MonthDay`. |
| `partial date` | 부분 날짜 | Collective term for `YearMonth` and `MonthDay`. |
| `DateRange` | `DateRange` / 날짜 범위 | Keep class name `DateRange`. |
| `TimeRange` | `TimeRange` / 시각 범위 | Keep class name `TimeRange`. |
| `DateTimeRange` | `DateTimeRange` / 날짜와 시각 범위, 시점 범위 | Keep class name `DateTimeRange`. |
| `locale` | 로케일 | **Forbid** `로캘`. **Forbid** `언어` when referring to a regional BCP 47 locale tag (`ko-KR`, `es-MX`, `ar-EG`). |
| `localization` | 현지화 | Match `docs/guides/localization.md` and `nav.group.localization`. Avoid mixing `로컬라이제이션`. |
| `time zone` | 시간대 | **Forbid** mixing `타임존` in prose. Use `UTC 오프셋` when contrasting fixed offsets with IANA 시간대. |
| `offset` | 오프셋 | Fixed UTC offset (`+09:00`, `-05:00`). |
| `DST` / `daylight saving time` | 서머타임 | First mention in `time-zones.md` may gloss `서머타임(일광 절약 시간제)`. **Forbid** bare untranslated `DST` in Korean prose. |
| `preset` | 프리셋 | Built-in format presets (`'short'`, `'medium'`, `'long'`, `'full'`, `'llll'`). |
| `loose mode` | 느슨한 모드 | Lock `느슨한 모드` across all 61 files and UI (first mention in `parsing.md` / `plugins/loose.md` may gloss `느슨한 모드(\`loose\` 모드)`). **Forbid** `루즈 모드` and **forbid** mixing `loose 모드` elsewhere. |
| `token pattern` | 토큰 패턴 | Custom format strings like `'YYYY-MM-DD'` or `'YYYY년 M월 D일'`. |
| `immutable` | 불변 | Clarify `원본 값을 변경하지 않습니다` when demonstrating behavior. **Forbid** `이뮤터블`. |
| `clamp` / `clamping` | 말일로 보정 / 범위 끝으로 보정 | Use `말일로 보정` for month-end dates (1월 31일 + 1개월 -> 2월 28일) and `범위 끝으로 보정` for general bounds. **Forbid** literal calques (`클램핑`, `고정`) and never confuse with `버림` (`truncate`). |
| `truncate` | 버림 / 버립니다 | Distinct from `말일로 보정` (`clamp`) and `내림` (`floor`). |
| `round` / `rounding` | 반올림·올림·내림 / 단위 맞춤 | Use `반올림` for nearest/half-expand rounding; use `단위 맞춤` or `반올림·올림·내림` when explaining `round()` modes generally (**never** imply `round()` only does half-up `사사오입`). |
| `half-open interval` | 반개방 구간 | `[start, nextStart)` — includes `start`, excludes `nextStart`. |
| `inclusive` | 양 끝 포함 / 포함 구간 | Both start and end boundaries included. |
| `factory function` | 팩토리 함수 | Strictly distinct from `클래스 생성자` (class constructor). |
| `mutating setters` | 인스턴스를 변경하는 세터 / 값을 직접 변경하는 세터 | **Forbid** `가변 세터`. |
| `disambiguation` | 모호한 시각 처리 | Clarify `중복·누락 시각 처리` when explaining DST spring-forward/fall-back transitions. |
| `prompt` (AI) | 프롬프트 | Consistent across homepage (`home.reads.*`) and page actions (`page.ask*`). |
| `bundle` | 번들 | Bundle size -> `번들 크기`. |
| `polyfill` | 폴리필 | Standard loanword. |
| `epoch` / `Unix epoch` | 유닉스 에포크 | Note: `epochSeconds` uses `Math.floor` (**내림**), **not** `Math.trunc` (**버림**), so pre-1970 sub-second instants step toward negative infinity. |
| `return` | 반환합니다 | **Forbid** `리턴합니다`; avoid mixing `돌려줍니다`. |
| `throw` | 던집니다 | Lock `<ErrorType>를 던집니다` / `예외를 던집니다` (e.g., `` `RangeError`를 던집니다 ``, `` `TypeError`를 던집니다 ``). Avoid mixing `발생시킵니다` / `스로우합니다`. |
| `parse` | 파싱 / 파싱합니다 | Avoid mixing `구문 분석합니다` in routine API prose. |
| `format` | 포맷 / 포맷합니다 | Avoid `형식화합니다`. Noun `형식` is fine for shape/representation (e.g., `ISO 형식`, `날짜 형식`). |
| `call` / `pass` / `compare` / `chain` | 호출합니다 / 전달합니다 / 비교합니다 / 체이닝합니다 | Prefer `전달합니다` in API docs (`넘깁니다` acceptable in conversational guides). |

## 3. CLDR Plural Rules (`ko`) & `home-locales.js` Coupling

Confirmed via `new Intl.PluralRules('ko').resolvedOptions().pluralCategories`: **`['other']` only**.

- Provide **`.other` ONLY** for every plural key family in `docs/src/content/translations/ko/strings.json`. **Never** invent `.one`, `.few`, `.many`, `.zero`, or `.two`.
- Note: `search.results` in `docs/src/content/strings.json` is a plain heading (`"검색 결과"`), **not** a plural family — do not create `search.results.other`.

| Plural Key (`.other` only) | Locked Korean | Enclosing Slot & Particle Check |
|---|---|---|
| `home.year.changes.other` | `"{count}번"` | `home-locales.js` `year.lede`: `일 년에 {changes} 시차가 달라집니다.` -> `일 년에 2번 시차가 달라집니다.` |
| `home.year.days.other` | `"{count}일"` | `home-locales.js` `year.caption`: `동절기 {days} 동안 시차가 {far}시간에서 {near}시간으로 벌어져 {time}에 열립니다.` -> `동절기 154일 동안 ...` |
| `home.year.gap.other` | `"{hours}시간 차이"` | Standalone badge (`8시간 차이`, `9시간 차이`). |
| `home.bench.rounds.other` | `"{count}회"` | `home.bench.run`: `{date} 기준 헤드리스 Chrome {chrome}에서 {rounds} 측정한 중앙값입니다.` (`Medians` = `중앙값`, never `평균`). |
| `home.xray.lines.other` | `"{count}줄"` | Standalone code-line counter (`4줄`). |
| `plugins.count.other` | `"플러그인 {count}개"` | Standalone count badge (`플러그인 3개`). |
| `api.options.other` | `"옵션 {count}개"` | `<summary>` disclosure label (`옵션 4개`). |

### Audit Notes on `docs/src/data/home-locales.js` (`ko`, lines 161–236)

Update the `ko` block in lockstep with `docs/src/content/translations/ko/strings.json`:

1. **Migrate `year.lede` (L225):** Replace `{changeCount}번` with `{changes}` (`일 년에 {changes} 시차가 달라집니다.`).
2. **Migrate `year.caption` (L227):** Replace `{dayCount}일` with `{days}` (`동절기 {days} 동안 시차가 {far}시간에서 {near}시간으로 벌어져 {time}에 열립니다.`).
3. **Clarify `consoles.clocks.why` (L205):** Match `consolesEn.clocks.why` by stating that London springs forward on the last Sunday of March (making that day 23 hours long) so readers see *why* adding 24 hours lands on 10 AM while `plus(1, 'day')` keeps 9 AM.
4. **Verify `xray.inviteCity` (`시드니`) & `try.city` (`런던`):** Frame `home.xray.invite` (`{city}에 있는 동료 초대하기`) and `home.try.title` (`{city}에 있는 것처럼 실행해 보기`) with `에` so both cities work without 받침 particle mismatches.
5. **Verify `home.say.*` chains end to end** for `ko` in `docs/src/scripts/home/sentences.js` (`AT`: `seoul`, `london`, `paris`, `saoPaulo`; `IN`: `london`, `sydney`, `tokyo`, `saoPaulo`): keep every chip concise so `.say-words` stays on one line on desktop and never duplicates particles across adjacent chips.

## 4. Punctuation, Spacing, Particles & Formatting Rules

### Spacing & Numerals

- **Standard Korean spacing (띄어쓰기):** Follow standard Korean orthography.
- **Attached particles:** Insert **no space** between inline `` `code` `` or Latin identifiers and an attached Korean particle (`` `CalendarDate`는 ``, `` `DateTime`을 ``, `` `null`을 ``, `Native Dates는`).
- **Standalone words:** Insert a single space between Latin/code tokens and independent Korean words (`ISO 문자열`, `UTC+9 기준`, `` `DateTime` 인스턴스 ``).
- **Digits & counters:** Use Western digits `0-9`. Insert **no space** between digits/numeric placeholders and Korean counters (`1일`, `2번`, `3시간`, `{year}년`, `{far}시간`, `30회`, `0바이트`). Keep a single space before Latin SI units (`0 kB`, `15 ms`, `{ms} ms`, `UTC+9`).

### Korean Particle (`조사`) Cheat Sheet for API Identifiers

Match `은/는`, `이/가`, `을/를`, `와/과`, and `으로/로` strictly to the Korean pronunciation of the identifier's final syllable. Remember the **ㄹ-받침 rule**: words ending in ㄹ 받침 take `은/이/을/과` **and `로`** (never `으로`).

| Ending Type | Common API Terms | Particles | Examples |
|---|---|---|---|
| **받침 있음 (non-ㄹ)** | `DateTime`(ㅁ), `Time`(ㅁ), `Duration`(ㄴ), `zone`(ㄴ), `plugin`(ㄴ), `option`(ㄴ), `token`(ㄴ), `string`(ㅇ), `JSON`(ㄴ), `datetime()`(ㅁ), `time()`(ㅁ), `duration()`(ㄴ), `format()`(ㅅ), `from()`(ㅁ), `in()`(ㄴ), `at()`(ㅅ), `toString()`(ㅇ) | `은`, `이`, `을`, `과`, **`으로`** | `` `DateTime`을 ``, `` `Time`은 ``, `` `Duration`과 ``, `` `zone`으로 ``, `` `format()`을 `` |
| **ㄹ 받침 있음** | `locale`(ㄹ), `null`(ㄹ), `Intl`(ㄹ), `Temporal`(ㄹ), `until()`(ㄹ) | `은`, `이`, `을`, `과`, **`로`** | `` `locale`을 ``, `` `locale`로 ``, `` `null`을 ``, `` `null`로 ``, `` `Intl`로 ``, `` `Temporal`은 `` |
| **받침 없음** | `CalendarDate`(ㅡ), `Date`(ㅡ), `YearMonth`(ㅡ), `MonthDay`(ㅣ), `DateRange`(ㅣ), `TimeRange`(ㅣ), `DateTimeRange`(ㅣ), `RangeError`(ㅓ), `TypeError`(ㅓ), `true`(ㅜ), `false`(ㅡ), `undefined`(ㅡ), `start`(ㅡ), `end`(ㅡ), `Native Dates`(ㅡ), `loose`(ㅡ), `zones`(ㅡ), `legacy-date`(ㅡ), `UTC`(ㅣ), `ISO`(ㅗ), `API`(ㅣ), `KST`(ㅣ), `IANA`(ㅏ), `date()`(ㅡ), `today()`(ㅣ), `now()`(ㅜ), `plus()`(ㅡ), `minus()`(ㅡ), `configure()`(ㅓ), `compare()`(ㅓ), `kindOf()`(ㅡ) | `는`, `가`, `를`, `와`, **`로`** | `` `CalendarDate`는 ``, `` `YearMonth`는 ``, `` `MonthDay`를 ``, `` `true`를 ``, `` `RangeError`를 ``, `UTC`로 |

### Quotation Marks, Emphasis & Markdown DSL Constraints

- **Quotation marks:** Use curved single quotes `‘...’` for cited Korean words or UI terms (`‘오전’`, `‘오후’`, `‘그저께’`, `‘모레’`, `‘일’`) and curved double quotes `“...”` for direct quotations or search queries (`“{query}”`, `“3일 전”`). **Forbid** guillemets (`«...»`), Japanese brackets (`「...」`), and **forbid italicizing Hangul** (`*오전*` -> `‘오전’` or `` `오전` ``).
- **Frontmatter (`lede`, `description`):** Never put raw backticks or `*italic*` in frontmatter `lede` or `description`.
- **`inline()` fields:** Frontmatter `lede`, `description`, `try`, ```` ```params ```` / ```` ```returns ```` descriptions, and `plugins.*.description` parse only `` `code` ``, `**strong**`, and `[label](href)`. Never use `*italic*` or raw HTML tags in them.
- **```` ```params ```` / ```` ```returns ```` `description:` (locked rule):** Concise Korean noun-phrase style **ending with a period `.`** (명사형 종결 + `.`, e.g., ``시각이나 시간대 정보가 없는 `CalendarDate`.`` or ``지정된 시간대로 변환된 새 `DateTime` 인스턴스.``). Multi-sentence descriptions end every sentence with `.` (`~합니다.` for a follow-up explanation sentence). Never alter YAML keys or `type:` values.
- **H2 / H3 headings:** Concise Korean noun phrases (명사형 종결), **no trailing period `.`**.
- **Playground UI labels & code:** Never translate visible English playground UI labels in `example.md` `try:` steps (`**Date**`, `**Days**`, `**Span**`, `**Time**`, `**Today**`, `**Typed date**`, `**Unreadable**`, `**+35 days**`, `**+4 days**`, `**09:30**`, etc.). Never alter runnable JS code or literal return-value comments (`// '5:00 PM'`, `// true`); translate only explanatory prose comments.
- **Directives & `:::truth` tables:** Keep directive names (`:::entry`, `:::steps`, `:::truth`, `:::details`, `:::note`, `:::tip`, `:::warning`, `:::danger`), `{open}`, `:kind[...]`, `locale="..."`, and literal `true`/`false` cells inside `:::truth` untouched. Translate `[Title]` (plain text, no backticks in `:::details[Title]`) and tabbed fence `label="..."` attributes.

## 5. English-Only Input Qualifiers & Self-Language Reframing

### English-Only API Inputs

Always qualify English-only string inputs explicitly so Korean developers never assume localized strings are accepted:

- `duration()` unit phrases -> `영어 단위 문자열` / `영어 기간 표현` (readers must know `'2 weeks'` is accepted, not `'2주'`).
- `dayOfWeek()` / `configure()` / `weekdayNames()` weekday arguments -> `영어 요일명` (`'monday'`, not `'월요일'`).
- `zones` plugin city names -> `영어 도시명` (explicitly noting the built-in native-script exceptions `'서울'`, `'東京'`, `'北京'`, `'москва'`).
- `docs/api/errors.md` -> clarify that development-mode diagnostic messages and prose hints are emitted in English; programmatic error handling should check `error.code` and `error.at`.

### Self-Language Reframing (`docs/guides/korean.md` & `examples/korean/example.md`)

- `docs/guides/korean.md` (promoted into `시작하기` by `docs/src/lib/nav.js`) and `examples/korean/example.md` must read **native-to-native** for Korean developers.
- **Do not** explain everyday Korean conventions as if teaching an English learner (do not gloss `화요일` as Tuesday, `오전`/`오후` as AM/PM, `그저께`/`모레`, 추석/설날, or why Korean puts spaces after `년`/`월`/`일`).
- Instead, focus directly on practical Korean engineering edge cases: core vs. loose parsing boundaries for dotted/Hangul dates, requiring `locale: 'ko'` for 2-digit years, UTC server `today()` off-by-one before 09:00 KST, Sunday wall calendars vs. Monday workweeks/ISO `weekOfYear`, and Gregorian-only `MonthDay`/`YearMonth` with lunar tags. Also replace any `*오전*` italics from the unreviewed draft with `‘오전’`.
- Keep concise Korean explanations of cultural and linguistic specifics on the other 7 language guides and all non-Korean language examples.

## 6. Locked `nav.*` Labels

| Key | Locked Korean | Key | Locked Korean |
|---|---|---|---|
| `nav.home` | native-dates 홈 | `nav.group.classes` | 클래스 |
| `nav.skip` | 본문으로 건너뛰기 | `nav.group.functions` | 함수 |
| `nav.open` | 내비게이션 열기 | `nav.group.setup` | 설정 |
| `nav.sections` | 섹션 | `nav.group.zones` | 시간대 |
| `nav.github` | GitHub | `nav.group.lengths` | 기간 |
| `nav.theme` | 색상 테마 전환 | `nav.group.calendars` | 달력 |
| `nav.themeToDark` | 다크 테마로 전환 | `nav.group.handling` | 언어별 다루기 |
| `nav.themeToLight` | 라이트 테마로 전환 | `nav.group.localization` | 현지화 |
| `nav.notWritten` | 작성 예정 | `nav.group.reference` | 레퍼런스 |
| `nav.guides` | 가이드 | `nav.item.allExamples` | 모든 예제 |
| `nav.api` | API | `nav.item.allPlugins` | 모든 플러그인 |
| `nav.examples` | 예제 | `nav.item.errors` | 오류 |
| `nav.plugins` | 플러그인 | `nav.lang.japanese` / `chinese` / `korean` | 일본어 / 중국어 / 한국어 |
| `nav.group.start` | 시작하기 | `nav.lang.arabic` / `russian` / `spanish` | 아랍어 / 러시아어 / 스페인어 |
| `nav.group.time` | 날짜와 시각 다루기 | `nav.lang.portuguese` / `french` / `german` | 포르투갈어 / 프랑스어 / 독일어 |
| `nav.group.going-further` | 더 알아보기 | | |

Sync `nav.group.handling` (`언어별 다루기`) with the sidebar prose reference in `docs/guides/localization.md`.

## 7. Locked Page Titles (All 61 Files)

All cross-page links must match these exact destination titles. The 20 symbol-named API and plugin pages keep their exact English symbol titles verbatim.

### Guides (25 Files)

| Path | English Title | Locked Korean Title |
|---|---|---|
| `docs/guides/installation.md` | Installation | 설치 |
| `docs/guides/overview.md` | Overview | 개요 |
| `docs/guides/customization.md` | Customization | 커스터마이징 |
| `docs/guides/types-of-time.md` | Types of time | 날짜와 시각 타입 |
| `docs/guides/date-math.md` | Date math | 날짜 계산 |
| `docs/guides/months-and-days.md` | Months and days | 연월과 월일 |
| `docs/guides/time-zones.md` | Time zones | 시간대 |
| `docs/guides/durations.md` | Durations | 기간 |
| `docs/guides/ranges.md` | Ranges | 범위 |
| `docs/guides/formatting.md` | Formatting | 포맷 |
| `docs/guides/parsing.md` | Parsing | 파싱 |
| `docs/guides/storing-and-sending.md` | Storing and sending | 저장과 전송 |
| `docs/guides/localization.md` | Localization | 현지화 |
| `docs/guides/temporal.md` | Working with Temporal | Temporal과 함께 쓰기 |
| `docs/guides/writing-a-plugin.md` | Writing a plugin | 플러그인 작성 |
| `docs/guides/from-dayjs.md` | Coming from Day.js | Day.js에서 전환하기 |
| `docs/guides/from-moment.md` | Coming from Moment | Moment에서 전환하기 |
| `docs/guides/arabic.md` | Arabic | 아랍어 |
| `docs/guides/chinese.md` | Chinese | 중국어 |
| `docs/guides/french.md` | French | 프랑스어 |
| `docs/guides/japanese.md` | Japanese | 일본어 |
| `docs/guides/korean.md` | Korean | 한국어 |
| `docs/guides/portuguese.md` | Portuguese | 포르투갈어 |
| `docs/guides/russian.md` | Russian | 러시아어 |
| `docs/guides/spanish.md` | Spanish | 스페인어 |

### API (19 Files)

| Path | English Title | Locked Korean Title |
|---|---|---|
| `docs/api/date-time.md` | DateTime | DateTime |
| `docs/api/calendar-date.md` | CalendarDate | CalendarDate |
| `docs/api/time.md` | Time | Time |
| `docs/api/duration.md` | Duration | Duration |
| `docs/api/year-month.md` | YearMonth | YearMonth |
| `docs/api/month-day.md` | MonthDay | MonthDay |
| `docs/api/ranges.md` | Ranges | 범위 |
| `docs/api/date-fn.md` | date() | date() |
| `docs/api/datetime-fn.md` | datetime() | datetime() |
| `docs/api/time-fn.md` | time() | time() |
| `docs/api/duration-fn.md` | duration() | duration() |
| `docs/api/year-month-fn.md` | yearMonth() | yearMonth() |
| `docs/api/month-day-fn.md` | monthDay() | monthDay() |
| `docs/api/range-fn.md` | dateRange() | dateRange() |
| `docs/api/compare.md` | compare() | compare() |
| `docs/api/configure.md` | configure() | configure() |
| `docs/api/errors.md` | Errors | 오류 |
| `docs/api/kind-of.md` | kindOf() | kindOf() |
| `docs/api/month-names.md` | monthNames() | monthNames() |

### Plugins (3 Files)

| Path | English Title | Locked Korean Title |
|---|---|---|
| `docs/plugins/legacy-date.md` | legacy-date | legacy-date |
| `docs/plugins/loose.md` | loose | loose |
| `docs/plugins/zones.md` | zones | zones |

### Examples (14 Files)

| Path | English Title | Locked Korean Title |
|---|---|---|
| `examples/arabic/example.md` | Arabic plurals, numerals, and Hijri dates | 아랍어 복수형, 숫자, 히즈라력 날짜 |
| `examples/chinese/example.md` | Chinese calendars and day periods | 중국어 역법과 오전·오후 구분 |
| `examples/countdown/example.md` | Countdown to a launch | 출시 카운트다운 |
| `examples/duration-input/example.md` | Typed durations | 기간 문자열 직접 입력 |
| `examples/french/example.md` | French casing, ranges, and regional clocks | 프랑스어 대소문자, 범위, 지역별 시각 표기 |
| `examples/german/example.md` | German ordinal periods, spans, and calendar weeks | 독일어 서수 마침표, 날짜 범위, 연도별 주차 |
| `examples/japanese/example.md` | Japanese eras, dates, and shifts | 일본어 연호, 날짜, 야간 근무 구간 |
| `examples/korean/example.md` | Korean spacing and collapsed ranges | 한국어 날짜 표기와 축약 범위 |
| `examples/meeting-planner/example.md` | A meeting across zones | 여러 시간대의 회의 일정 맞추기 |
| `examples/month-grid/example.md` | A month grid | 월간 달력 그리드 |
| `examples/opening-hours/example.md` | Open right now | 지금 영업 중인지 확인하기 |
| `examples/portuguese/example.md` | Portuguese crasis, ranges, and day-first input | 포르투갈어 축약 전치사, 범위, 일-월-연 입력 |
| `examples/russian/example.md` | Russian month cases and plural counts | 러시아어 월명 격변화와 복수형 |
| `examples/spanish/example.md` | Spanish connectors, casing, and day-first dates | 스페인어 접속사, 대소문자, 일-월-연 날짜 |
