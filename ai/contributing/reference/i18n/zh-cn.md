# Simplified Chinese (`zh-CN`) Glossary & Title Map

> Status (2026-11-23): Locked terminology glossary and title map for Simplified Chinese (`zh-CN`).

## Voice, Spacing & Punctuation

- **Register:** Natural Mainland Simplified Chinese OSS technical prose (Vite / Vue / MDN China). Concise, active, direct, using second-person `你` (never stiff `您` or bureaucratic `对其进行……`). Rewrite English calques from scratch (`year-first` -> `年-月-日顺序`, `1-indexed` -> `从 1 开始计数`, `rolling into` -> `进位到`, `falls back to` -> `回退到`, `read off` -> `读取`). Adapt *"in plain English"* to `用自然语言` / `如自然语言般直白` without implying JS method names are Chinese.
- **CJK/Latin spacing:** Always insert one half-width ASCII space between Chinese characters and Latin letters, digits, or inline `` `code` `` (e.g., “24 小时制”、“传入 `locale` 参数”、“UTC+8 时区”), except adjacent to full-width Chinese punctuation or inside literal Chinese formatted output (`2026年11月16日`).
- **Punctuation, numerals & identifiers:** Use full-width Mainland punctuation (`，`, `。`, `：`, `；`, `（`, `）`, `、`, `？`, `！`), standard Mainland quotes `“...”` (never `「...」`), and Western digits `0-9`. Keep `Native Dates` in prose, `native-dates` in packages/code, and JS class/function/plugin identifiers (`CalendarDate`, `DateTime`, `Time`, `loose`, `zones`, `legacy-date`) untranslated.

## Core API Nouns & Concepts

| English | Locked `zh-CN` | Usage & Disambiguation |
|---|---|---|
| `CalendarDate` | 日历日期 | 语境明确且不与 `DateTime` 混淆时可简称“日期”；代码标识保留 `CalendarDate`。 |
| `Time` (wall-clock time of day) | 时钟时间 | 不含日期的一天内时间（如 `9:30`）；严禁译为“时刻”或“日期时间”，避免与 `DateTime` 冲突。 |
| `DateTime` (zoned instant) | 日期时间 | 带时区的具体时间点；英文散文以 `moment` 指代 `DateTime` 实例时译为“具体时刻”或“时间点”。 |
| `Duration` | 时长 | 表示时间长度（如“2 小时”“3 周”）；不译冗长的“持续时间”。 |
| `YearMonth` | 年月 | 不含日字段的年月值；代码标识保留 `YearMonth`。 |
| `MonthDay` | 月日 | 不含年字段的周期性月日值；代码标识保留 `MonthDay`。 |
| `Range` (`DateRange` / `TimeRange` / `DateTimeRange`) | 范围 | 分别对应“日期范围”“时钟时间范围”“日期时间范围”；讨论端点开闭时可辅称“区间”。 |
| `partial date` | 部分日期 | 统称 `YearMonth` 与 `MonthDay` 等缺省部分字段的类型。 |
| `time zone` | 时区 | IANA 名称（如 `'Asia/Shanghai'`）称“IANA 时区”或“时区标识”。 |
| `offset` | 偏移量 | 明确上下文时称“UTC 偏移量”或“时区偏移量”（如 `+08:00`）。 |
| `preset` | 预设 | 或“预设格式”（如 `'short'`、`'medium'`、`'long'`、`'full'`）。 |
| `token pattern` | 占位符模板 | 与 `template` 统一称“占位符模板”或“格式模板”；`YYYY`、`HH` 等单个符号称“格式占位符”。 |
| `loose mode` | 宽松模式 | 对应 `{ loose: true }` 与 `loose` 插件；插件名 `loose` 保持英文。 |
| `immutable` | 不可变 | 所有修改操作均返回新实例，不改动原值。 |
| `daylight saving time` (DST) | 夏令时 | 必要时首次写为“夏令时（DST）”，后文统一用“夏令时”。 |
| `overflow` / `clamp` | 溢出 / 限制到边界 | `overflow` 译为“溢出”；`clamp` 译为“限制到边界”（或“约束至月末”），严禁与 `truncate` 混译“截断”。 |
| `rounding` | 舍入 | 覆盖 `halfExpand`、`floor`、`ceil`、`trunc` 等全部模式，不狭义译为“四舍五入”。 |
| `relative time` | 相对时间 | 如“3 天前”“前天”“2 小时后”。 |
| `disambiguation` | 消歧 | 夏令时跳变或回拨导致时钟时间不存在或重复时的处理策略。 |
| `polyfill` | polyfill | 遵循 MDN China / Vite 中文惯例保留小写英文，必要时首次括注“垫片”。 |

## MDN Verbs & Grammar Rules

| English | `zh-CN` | English | `zh-CN` | English | `zh-CN` |
|---|---|---|---|---|---|
| `call` | 调用 | `parse` | 解析 | `clamp` | 限制到边界 |
| `pass` | 传入 | `format` | 格式化 | `truncate` | 截断 |
| `return` | 返回 | `compare` | 比较 | `round` | 舍入 |
| `throw` | 抛出 | `chain` | 链式调用 | — | — |

- **```` ```params ```` / ```` ```returns ```` descriptions:** Concise noun phrases or predicate clauses ending with `。` (e.g., “要解析的日期字符串或时间戳。”、“按目标时区转换后的新 `DateTime` 实例。”). Use only `` `code` ``, `**strong**`, and `[label](href)`.
- **H2 headings:** Concise noun or verb-object phrases with no trailing punctuation (`。`/`：`). Keep exact English heading count/depth and leave JS identifiers intact.

## CLDR Plurals & Self-Language Reframing

- **CLDR plural policy:** `Intl.PluralRules('zh-CN')` uses **only `.other`**. Provide only `*.other` keys in `docs/src/content/translations/zh-cn/strings.json` (`home.year.changes.other`: `"{count} 次"`, `home.year.days.other`: `"{count} 天"`, `home.bench.rounds.other`: `"{count} 轮"`).
- **Self-language reframing (`docs/guides/chinese.md` & `examples/chinese/example.md`):** Write native-to-native Chinese prose for Chinese developers. Never add English-learner glosses of everyday Chinese words (`上午`、`下午`、`凌晨`、`晚上`、`年`、`月`、`日`、`正月`、`前天`、`后天`), avoid phrasing like “Han months” (use `汉字月份`) or “Chinese-speaking markets” (use `各中文地区`), and focus directly on Mainland (`zh-CN`), Taiwan (`zh-TW`), Hong Kong/Macau (`zh-HK`), and Singapore (`zh-SG`) technical differences. Keep cross-cultural glosses on the other 7 language guides and non-Chinese examples.

## Locked `nav.*` Labels

| Key | `zh-CN` | Key | `zh-CN` |
|---|---|---|---|
| `nav.guides` | 指南 | `nav.group.calendars` | 日历 |
| `nav.api` | API | `nav.group.handling` | 各语言时间处理 |
| `nav.examples` | 示例 | `nav.group.localization` | 本地化 |
| `nav.plugins` | 插件 | `nav.group.reference` | 参考 |
| `nav.group.start` | 入门 | `nav.item.allExamples` | 全部示例 |
| `nav.group.time` | 处理时间 | `nav.item.allPlugins` | 全部插件 |
| `nav.group.going-further` | 进阶 | `nav.item.errors` | 错误 |
| `nav.group.classes` | 类 | `nav.lang.japanese` / `chinese` / `korean` | 日语 / 中文 / 韩语 |
| `nav.group.functions` | 函数 | `nav.lang.arabic` / `russian` / `spanish` | 阿拉伯语 / 俄语 / 西班牙语 |
| `nav.group.setup` | 配置 | `nav.lang.portuguese` / `french` / `german` | 葡萄牙语 / 法语 / 德语 |
| `nav.group.zones` / `lengths` | 时区 / 时长 | *(match `guides/localization.md` -> `nav.group.handling`)* | **各语言时间处理** |

## All 61 Page Titles

| Path | English | Locked `zh-CN` Title |
|---|---|---|
| `docs/guides/installation.md` | Installation | 安装 |
| `docs/guides/overview.md` | Overview | 概览 |
| `docs/guides/customization.md` | Customization | 自定义 |
| `docs/guides/types-of-time.md` | Types of time | 时间类型 |
| `docs/guides/date-math.md` | Date math | 日期运算 |
| `docs/guides/months-and-days.md` | Months and days | 年月与月日 |
| `docs/guides/time-zones.md` | Time zones | 时区 |
| `docs/guides/durations.md` | Durations | 时长 |
| `docs/guides/ranges.md` | Ranges | 范围 |
| `docs/guides/formatting.md` | Formatting | 格式化 |
| `docs/guides/parsing.md` | Parsing | 解析 |
| `docs/guides/storing-and-sending.md` | Storing and sending | 存储与传输 |
| `docs/guides/localization.md` | Localization | 本地化 |
| `docs/guides/temporal.md` | Working with Temporal | 与 Temporal 协作 |
| `docs/guides/writing-a-plugin.md` | Writing a plugin | 编写插件 |
| `docs/guides/from-dayjs.md` | Coming from Day.js | 从 Day.js 迁移 |
| `docs/guides/from-moment.md` | Coming from Moment | 从 Moment 迁移 |
| `docs/guides/arabic.md` | Arabic | 阿拉伯语 |
| `docs/guides/chinese.md` | Chinese | 中文 |
| `docs/guides/french.md` | French | 法语 |
| `docs/guides/japanese.md` | Japanese | 日语 |
| `docs/guides/korean.md` | Korean | 韩语 |
| `docs/guides/portuguese.md` | Portuguese | 葡萄牙语 |
| `docs/guides/russian.md` | Russian | 俄语 |
| `docs/guides/spanish.md` | Spanish | 西班牙语 |
| `docs/api/date-time.md` | DateTime | DateTime |
| `docs/api/calendar-date.md` | CalendarDate | CalendarDate |
| `docs/api/time.md` | Time | Time |
| `docs/api/duration.md` | Duration | Duration |
| `docs/api/year-month.md` | YearMonth | YearMonth |
| `docs/api/month-day.md` | MonthDay | MonthDay |
| `docs/api/ranges.md` | Ranges | 范围 |
| `docs/api/date-fn.md` | date() | date() |
| `docs/api/datetime-fn.md` | datetime() | datetime() |
| `docs/api/time-fn.md` | time() | time() |
| `docs/api/duration-fn.md` | duration() | duration() |
| `docs/api/year-month-fn.md` | yearMonth() | yearMonth() |
| `docs/api/month-day-fn.md` | monthDay() | monthDay() |
| `docs/api/range-fn.md` | dateRange() | dateRange() |
| `docs/api/compare.md` | compare() | compare() |
| `docs/api/configure.md` | configure() | configure() |
| `docs/api/errors.md` | Errors | 错误 |
| `docs/api/kind-of.md` | kindOf() | kindOf() |
| `docs/api/month-names.md` | monthNames() | monthNames() |
| `docs/plugins/legacy-date.md` | legacy-date | legacy-date |
| `docs/plugins/loose.md` | loose | loose |
| `docs/plugins/zones.md` | zones | zones |
| `examples/arabic/example.md` | Arabic plurals, numerals, and Hijri dates | 阿拉伯语复数、数字与伊斯兰历日期 |
| `examples/chinese/example.md` | Chinese calendars and day periods | 中文历法与时段格式 |
| `examples/countdown/example.md` | Countdown to a launch | 发布倒计时 |
| `examples/duration-input/example.md` | Typed durations | 手动输入时长 |
| `examples/french/example.md` | French casing, ranges, and regional clocks | 法语大小写、范围与地区时间制 |
| `examples/german/example.md` | German ordinal periods, spans, and calendar weeks | 德语序数点、范围与日历周 |
| `examples/japanese/example.md` | Japanese eras, dates, and shifts | 日语年号、日期与跨夜班次 |
| `examples/korean/example.md` | Korean spacing and collapsed ranges | 韩语空格与合并范围 |
| `examples/meeting-planner/example.md` | A meeting across zones | 跨时区会议 |
| `examples/month-grid/example.md` | A month grid | 月历网格 |
| `examples/opening-hours/example.md` | Open right now | 实时营业状态 |
| `examples/portuguese/example.md` | Portuguese crasis, ranges, and day-first input | 葡萄牙语缩合介词、范围与日-月-年输入 |
| `examples/russian/example.md` | Russian month cases and plural counts | 俄语月份变格与复数计数 |
| `examples/spanish/example.md` | Spanish connectors, casing, and day-first dates | 西班牙语连接词、大小写与日-月-年日期 |

## Audit Notes on `docs/src/data/home-locales.js` (`'zh-CN'`)

- **Migrate legacy plural placeholders (lines 148 & 150):** Replace `{changeCount} 次` in `year.lede` with `{changes}` and `{dayCount} 天` in `year.caption` with `{days}` (pluralized from `home.year.changes.other` / `home.year.days.other` in `strings.json`).
- **Clarify spring-forward date in `consoles.clocks.ask` (line 126):** `'伦敦夏令时切换前一天上午 9 点，加一天后是几点？'` is ambiguous between spring-forward and fall-back; specify the date matching `consoles.js` (`2026-03-28`), e.g. `'伦敦 3 月 28 日上午 9 点，加一天后是几点？'` or `'伦敦进入夏令时前一天（3 月 28 日）上午 9 点，加一天后是几点？'`.
- **Terminology alignment (lines 91, 102, 108, 123, 148):** Change `并置于时刻之前` (line 102) to `并置于小时数字之前` so `时刻` stays reserved for `DateTime`; unify `日历标签` (lines 91, 108) to `历法标签`; fix `将本地零点调用` (line 123) to `对本地零点调用`; polish `IANA 时区库` (line 148) to `IANA 时区数据库`.
