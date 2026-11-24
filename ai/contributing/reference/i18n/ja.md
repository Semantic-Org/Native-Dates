# Japanese (`ja`) Localization Glossary

> Status (2026-11-23): Locked terminology glossary and title map for Japanese (`ja`).

## Voice, Spacing & Punctuation

- **Register:** Polite technical OSS prose (`です・ます`, matching MDN Japan / Vite / Vue / Svelte JP). Keep sentences short, active, and direct; cut bureaucratic padding (`〜することができます` -> `〜できます`, redundant `〜という`).
- **Spacing (locked rule):** Insert a single half-width space between Japanese text and standalone Latin words, inline `` `code` ``, or Latin SI units (`Intl と Temporal`, `` `DateTime` を返す ``, `0 kB`). **Omit** spaces adjacent to Japanese punctuation (`、`, `。`, `「`, `」`, `（`, `）`, `・`) and **never** insert spaces between digits/numeric placeholders and Japanese counters (`1日`, `2日前後`, `0バイト`, `2026年`, `{year}年`, `{far}時間`).
- **Punctuation & numerals:** Use Japanese punctuation (`、`, `。`, `「...」`, `（...）`, `・`) and Western digits `0-9` everywhere in prose (full-width digits only in explicit loose-parsing input examples).
- **Identifiers & brand:** Keep `Native Dates` in prose, `native-dates` in package/code contexts, and JS class, function, and plugin names (`CalendarDate`, `DateTime`, `Time`, `loose`, `zones`, `legacy-date`) untranslated.
- **English-only API inputs:** Explicitly qualify English-only string inputs (`duration()` unit phrases, `dayOfWeek()`/`configure()` weekday names) as `英語の単位表現` / `英語の曜日名` so readers never assume `'2週間'` or `'月曜日'` is accepted.
- **Formatting constraints:** Never use raw backticks in frontmatter `lede` (rendered into `<meta name="description">`), never italicize Japanese kanji/kana (use `「...」` for cited forms or `**...**` for emphasis), and never use `*italic*` or raw HTML in `inline()` fields.

## Core API Nouns & Concepts

| English | Locked Japanese | Usage & guardrails |
|---|---|---|
| `CalendarDate` | カレンダー日付（略称：日付） | Class name stays `CalendarDate`. Date with no clock or zone. |
| `Time` | 時刻 | Strictly wall-clock time of day; **never** use `時刻` for `DateTime`. |
| `DateTime` | 日時 | Zoned instant/datetime. Keep `日時` distinct from `日付` and `時刻`. |
| `moment` / `instant` | 時点 / 瞬間 | `時点` for timeline points and comparisons; `瞬間` for an exact instant. |
| `Duration` | 期間 | Class name stays `Duration`. |
| `YearMonth` / `MonthDay` | 年月 / 月日 | Class names stay `YearMonth` / `MonthDay`. |
| `Range` | 範囲 | `DateRange`: 日付範囲、`TimeRange`: 時刻範囲、`DateTimeRange`: 日時範囲。 |
| `partial date` | 部分日付 | Collective term for `YearMonth` and `MonthDay`. |
| `time zone` | タイムゾーン | Use `UTC オフセット` when contrasting fixed offsets with IANA zones. |
| `offset` | オフセット | Fixed UTC offset (`+09:00` etc.). |
| `preset` | プリセット | Built-in format presets (`'short'`, `'long'`, `'llll'`, etc.). |
| `token pattern` | トークンパターン | Custom format strings like `'YYYY年M月D日'`. |
| `loose mode` | loose モード | First guide mention may gloss `loose モード（緩やかな解析）`. |
| `immutable` | イミュータブル | Natural OSS term; clarify `元の値を変更しない` when illustrating behavior. |
| `daylight saving time` | 夏時間 | Gloss `夏時間（DST）` on first mention where helpful. |
| `overflow` / `clamp` | オーバーフロー / クランプ | Verb: `クランプする`（範囲内に収める）. Strictly distinct from `truncate`. |
| `truncate` | 切り捨て | Verb: `切り捨てる`. Never confuse with `clamp` or `round`. |
| `rounding` | 丸め | Verb: `丸める`. **Never** narrow to `四捨五入` (covers `ceil`/`floor`/`trunc`). |
| `relative time` | 相対時間 | Use `相対日付` when referring specifically to day-level output (`昨日`, `一昨日`). |
| `disambiguation` | あいまいさの解消 | Clarify with `重複・欠落時刻の解決` when explaining DST transitions. |
| `polyfill` | ポリフィル | Standard katakana. |
| `AI Agent` | AI エージェント | Keep half-width space after `AI`. |

## Standard MDN JP Verbs & Grammar

- **Verbs:** `call` -> **呼び出す**, `pass` -> **渡す**, `return` -> **返す**, `throw` -> **スローする** (never `投げる`), `parse` -> **解析する**, `format` -> **フォーマットする**, `compare` -> **比較する**, `chain` -> **チェーンする**, `clamp` -> **クランプする**, `truncate` -> **切り捨てる**, `round` -> **丸める**.
- **```` ```params ```` / ```` ```returns ```` descriptions:** End every `description:` with `。` using concise noun-phrase style (体言止め + `。`, e.g., ``時刻やタイムゾーンを持たない `CalendarDate`。``).
- **H2 / H3 headings:** Concise noun phrases (体言止め), no trailing `。`.
- **Calques to rewrite:** `year-first` -> `年・月・日順`, `1-indexed` -> `1始まりの`, `rolling into` -> `翌月に繰り上がる`, `falls back to` -> `〜にフォールバックする`, `in plain English` -> `自然な表現で` / `直感的な書き方で`.

## CLDR Plural Policy

`Intl.PluralRules('ja')` has **only `.other`**. Provide only `*.other` keys in `docs/src/content/translations/ja/strings.json` (never `.one`, `.few`, `.many`, `.zero`, or `.two`).

## Self-Language Reframing (`guides/japanese.md` & `examples/japanese/example.md`)

- `docs/guides/japanese.md` (promoted into `はじめに` by `docs/src/lib/nav.js`) and `examples/japanese/example.md` must read as native-to-native Japanese engineering docs: drop English-learner glosses of everyday Japanese terms (`元年`, `月曜日`, `午前`/`午後`, `一昨日`/`明後日`, `令和`, `平成`, `昭和`, `～` 波ダッシュ) and focus on real Japanese dev pitfalls.
- Keep concise Japanese cultural/linguistic explanations on the other 7 language guides and all non-Japanese language examples.

## Locked `nav.*` Labels

| Key | Locked Japanese | Key | Locked Japanese |
|---|---|---|---|
| `nav.home` | native-dates ホーム | `nav.group.classes` | クラス |
| `nav.skip` | 本文へスキップ | `nav.group.functions` | 関数 |
| `nav.open` | ナビゲーションを開く | `nav.group.setup` | 設定 |
| `nav.sections` | セクション | `nav.group.zones` | タイムゾーン |
| `nav.github` | GitHub | `nav.group.lengths` | 期間 |
| `nav.theme` | カラーテーマを切り替え | `nav.group.calendars` | カレンダー |
| `nav.themeToDark` | ダークテーマに切り替え | `nav.group.handling` | 各言語での扱い |
| `nav.themeToLight` | ライトテーマに切り替え | `nav.group.localization` | ローカライズ |
| `nav.notWritten` | 準備中 | `nav.group.reference` | リファレンス |
| `nav.guides` | ガイド | `nav.item.allExamples` | すべてのサンプル |
| `nav.api` | API | `nav.item.allPlugins` | すべてのプラグイン |
| `nav.examples` | サンプル | `nav.item.errors` | エラー |
| `nav.plugins` | プラグイン | `nav.lang.japanese` / `chinese` / `korean` | 日本語 / 中国語 / 韓国語 |
| `nav.group.start` | はじめに | `nav.lang.arabic` / `russian` / `spanish` | アラビア語 / ロシア語 / スペイン語 |
| `nav.group.time` | 日付と時刻の扱い | `nav.lang.portuguese` / `french` / `german` | ポルトガル語 / フランス語 / ドイツ語 |
| `nav.group.going-further` | さらに詳しく | | |

Sync `nav.group.handling` (`各言語での扱い`) with the sidebar reference in `docs/guides/localization.md`.

## Locked Page Titles (All 61 Pages)

The 20 symbol-named API and plugin pages keep their exact English identifier titles verbatim: `docs/api/date-time.md` (`DateTime`), `docs/api/calendar-date.md` (`CalendarDate`), `docs/api/time.md` (`Time`), `docs/api/duration.md` (`Duration`), `docs/api/year-month.md` (`YearMonth`), `docs/api/month-day.md` (`MonthDay`), `docs/api/date-fn.md` (`date()`), `docs/api/datetime-fn.md` (`datetime()`), `docs/api/time-fn.md` (`time()`), `docs/api/duration-fn.md` (`duration()`), `docs/api/year-month-fn.md` (`yearMonth()`), `docs/api/month-day-fn.md` (`monthDay()`), `docs/api/range-fn.md` (`dateRange()`), `docs/api/compare.md` (`compare()`), `docs/api/configure.md` (`configure()`), `docs/api/kind-of.md` (`kindOf()`), `docs/api/month-names.md` (`monthNames()`), `docs/plugins/legacy-date.md` (`legacy-date`), `docs/plugins/loose.md` (`loose`), `docs/plugins/zones.md` (`zones`).

| Path | English | Locked Japanese |
|---|---|---|
| `docs/guides/installation.md` | Installation | インストール |
| `docs/guides/overview.md` | Overview | 概要 |
| `docs/guides/customization.md` | Customization | カスタマイズ |
| `docs/guides/types-of-time.md` | Types of time | 日付と時刻の型 |
| `docs/guides/date-math.md` | Date math | 日付の計算 |
| `docs/guides/months-and-days.md` | Months and days | 年月と月日 |
| `docs/guides/time-zones.md` | Time zones | タイムゾーン |
| `docs/guides/durations.md` | Durations | 期間 |
| `docs/guides/ranges.md` | Ranges | 範囲 |
| `docs/guides/formatting.md` | Formatting | フォーマット |
| `docs/guides/parsing.md` | Parsing | 解析 |
| `docs/guides/storing-and-sending.md` | Storing and sending | 保存と送信 |
| `docs/guides/localization.md` | Localization | ローカライズ |
| `docs/guides/temporal.md` | Working with Temporal | Temporal との連携 |
| `docs/guides/writing-a-plugin.md` | Writing a plugin | プラグインの作成 |
| `docs/guides/from-dayjs.md` | Coming from Day.js | Day.js からの移行 |
| `docs/guides/from-moment.md` | Coming from Moment | Moment からの移行 |
| `docs/guides/arabic.md` | Arabic | アラビア語 |
| `docs/guides/chinese.md` | Chinese | 中国語 |
| `docs/guides/french.md` | French | フランス語 |
| `docs/guides/japanese.md` | Japanese | 日本語 |
| `docs/guides/korean.md` | Korean | 韓国語 |
| `docs/guides/portuguese.md` | Portuguese | ポルトガル語 |
| `docs/guides/russian.md` | Russian | ロシア語 |
| `docs/guides/spanish.md` | Spanish | スペイン語 |
| `docs/api/ranges.md` | Ranges | 範囲 |
| `docs/api/errors.md` | Errors | エラー |
| `examples/arabic/example.md` | Arabic plurals, numerals, and Hijri dates | アラビア語の複数形・数字・ヒジュラ暦 |
| `examples/chinese/example.md` | Chinese calendars and day periods | 中国語の暦と時間帯表現 |
| `examples/countdown/example.md` | Countdown to a launch | リリースまでのカウントダウン |
| `examples/duration-input/example.md` | Typed durations | 手入力による期間解析 |
| `examples/french/example.md` | French casing, ranges, and regional clocks | フランス語の大文字小文字・範囲・地域別時刻 |
| `examples/german/example.md` | German ordinal periods, spans, and calendar weeks | ドイツ語の序数ピリオド・範囲・暦週 |
| `examples/japanese/example.md` | Japanese eras, dates, and shifts | 和暦・日付・深夜シフトの表示 |
| `examples/korean/example.md` | Korean spacing and collapsed ranges | 韓国語の分かち書きと省略範囲 |
| `examples/meeting-planner/example.md` | A meeting across zones | タイムゾーンをまたぐ会議調整 |
| `examples/month-grid/example.md` | A month grid | 月間カレンダーグリッド |
| `examples/opening-hours/example.md` | Open right now | 営業中かどうかの判定 |
| `examples/portuguese/example.md` | Portuguese crasis, ranges, and day-first input | ポルトガル語のクラージ・範囲・日優先入力 |
| `examples/russian/example.md` | Russian month cases and plural counts | ロシア語の月名の格変化と複数形 |
| `examples/spanish/example.md` | Spanish connectors, casing, and day-first dates | スペイン語の接続語・大文字小文字・日優先日付 |

## Audit Notes on `docs/src/data/home-locales.js` (`ja`)

Fix these issues in the `ja` block (L7–L82) during the UI copywriting pass:

- **L15 (`linkLabel`):** `日本語のインタラクティブ例を開く` is a calque; rewrite to `日本語の動作サンプルを開く` (or `日本語の対話サンプルを開く`).
- **L31 (`proofs[2].note`):** Remove spacing before counter (`2 日前後` -> `2日前後`); tighten `英語の昨日・明日よりも広い` to `「昨日・明日」より広い2日前後の表現を、辞書なしで返します。`.
- **L46 (`consoles.day.why`):** Two factual errors: (1) `東半球では... UTC の前日 15:00` applies only to UTC+9 (Tokyo), not the entire Eastern Hemisphere; (2) `toISOString() に渡すと` wrongly implies passing an argument to `toISOString()` instead of calling it on a `Date`. Rewrite around `東京（UTC+9）の0時は UTC の前日 15:00 にあたるため、<code>toISOString()</code> を呼ぶと <code>2026-08-31</code> になります。`.
- **L71 (`year.lede`):** Three fixes: (1) replace `欧州や北米との定例会議` with London to match the actual `Europe/London` <-> `Asia/Tokyo` chart (`ledeEn`); (2) migrate `{changeCount} 回` -> `{changes}` (from `home.year.changes.other`); (3) remove counter space (`0 バイト` -> `0バイト`).
- **L73 (`year.caption`):** Migrate `{dayCount} 日間` -> `{days}` (from `home.year.days.other`) and remove counter spaces (`{far} 時間` -> `{far}時間`, `{near} 時間` -> `{near}時間`).
