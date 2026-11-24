# Arabic (`ar`) Localization Guide & Glossary

> Status (2026-11-24): Authoritative style guide, locked terminology glossary, CLDR 6-form plural specification, RTL/BiDi safety rules, and 61-page title map for the Arabic (`ar`) localization of `docs/` — our primary **RTL** locale. Pair with [`slots.md`](slots.md) for UI/homepage DOM slots and [`docs-i18n.md`](../../workflows/docs-i18n.md) for the workflow and gates.

---

## 1. Voice, Register & Anti-Translationese

- **Target register:** Clear, crisp **Modern Standard Arabic for software engineering (العربية الفصحى التقنية المعاصرة)** — matching modern Arab developer documentation and MDN Arabic. Active voice, concise sentences, direct technical precision.
- **Reader address:** Address the reader directly in standard 2nd-person masculine singular imperative/present (`مرّر`, `استدعِ`, `اضبط`, `تستطيع`, `تُرجع`, `تحصّل`). Avoid passive bureaucratic constructions (`يتم تمرير`, `ينبغي على المستخدم القيام بـ`).
- **Zero AI-translationese (الترجمة الحرفية):** After drafting every file, run a target-language-only rewrite pass without looking at English to strip syntactic calques:
  - Replace `يقوم بـ` + masdar with a direct verb (`يقوم بإرجاع` -> **`يُرجع`**، `يقوم بتحويل` -> **`يحوّل`**، `يقوم بتحليل` -> **`يحلّل`**).
  - Replace `الذي يمتلك` / `التي تمتلك` for *has* with **`له`** / **`يتضمّن`** / **`يحمل`** (`التاريخ التقويمي بلا منطقة زمنية` instead of `التاريخ الذي لا يمتلك منطقة زمنية`).
  - Avoid `عن طريق` / `من خلال` overuse; use **`بـ`**، **`عبر`**، أو فعل مباشر (`استدعِ format()`).
  - Avoid literal phrasal-verb calques (`falls back to` -> **`يرجع افتراضيًا إلى`**، `rolling into` -> **`ينتقل إلى`**، `read off` -> **`استخرج`** / **`اقرأ`**، `1-indexed` -> **`يبدأ العدّ من 1`**، `year-first` -> **`بترتيب السنة أولًا`**، `day-first` -> **`بترتيب اليوم أولًا`**).
  - Never translate *"Pass `'ar-EG'` through [Localization]"* literally as `مرّر 'ar-EG' عبر [التوطين]` (passing a tag through a guide title). Rewrite naturally: **`مرّر وسم دولة مثل 'ar-EG' أو 'ar-SA' (انظر [التوطين](/guides/localization/)) بدل الوسم العام 'ar'.`**
  - Avoid English zeugma in `lede` (e.g., *"handling X and Y"* or mismatched object governance); split or balance the Arabic structure cleanly.
  - Adapt *"in plain English"* to **`بصياغة مقروءة قريبة من اللغة الطبيعية`** without falsely claiming JavaScript method names are written in Arabic.
- **Brand, identifiers & runnable code:**
  - Keep **`Native Dates`** in prose and **`native-dates`** in package names, install commands, and code.
  - Keep all JS class names, functions, methods, options, error codes, and plugin identifiers untouched (`CalendarDate`, `DateTime`, `Time`, `Duration`, `YearMonth`, `MonthDay`, `DateRange`, `TimeRange`, `DateTimeRange`, `loose`, `zones`, `legacy-date`).
  - Keep every runnable JS code block and every literal return-value comment (`// '5:00 PM'`, `// '١٦ نوفمبر ٢٠٢٦'`, `// true`) **byte-for-byte identical** to English. Translate only explanatory prose comments while preserving class/method identifiers.

---

## 2. Core Technical Glossary (Locked Terms)

Every translator and reviewer MUST use the locked Arabic term below and reject the listed forbidden alternatives.

| English | Locked Arabic | Forbidden / Avoid | Notes |
|---|---|---|---|
| `CalendarDate` | `CalendarDate` / **تاريخ تقويمي** (أو **تاريخ** عند وضوح السياق) | `تاريخ مدني` (خلط عشوائي) | Calendar day with no time or zone. |
| `Time` | `Time` / **وقت اليوم** (أو **وقت** لوقت الساعة فقط) | استخدام **وقت** وحده لـ `DateTime`؛ استخدام `أمس`/`غدًا` مع `Time` | `Time` has no calendar date; never attach past/future calendar wording to it. |
| `DateTime` | `DateTime` / **تاريخ ووقت** (أو **لحظة زمنية** عند التركيز على اللحظة الدقيقة) | **وقت** وحده | Full zoned instant. |
| `Duration` | `Duration` / **مدة** / **مدة زمنية** | `فترة` كمرادف لـ `Duration` | Reserve `فترة` for mathematical intervals (`فترة نصف مفتوحة`). |
| `YearMonth` | `YearMonth` / **سنة وشهر** | `شهر وسنة` كاسم للنوع | Partial date with year and month. |
| `MonthDay` | `MonthDay` / **شهر ويوم** | `يوم وشهر` كاسم للنوع | Partial date with month and day. |
| `partial date` | **تاريخ جزئي** (ج: **تواريخ جزئية**) | `تاريخ ناقص` | Covers `YearMonth` and `MonthDay`. |
| `DateRange` | `DateRange` / **نطاق تواريخ** | `مدى تواريخ` | Calendar date span. |
| `TimeRange` | `TimeRange` / **نطاق أوقات** | `نطاق ساعات` كمرادف غير متسق | Clock time span (may cross midnight). |
| `DateTimeRange` | `DateTimeRange` / **نطاق تواريخ وأوقات** | `نطاق زمني` مبهم | Zoned instant span. |
| `Range` (generic) | **نطاق** (ج: **نطاقات**) | `فترة` لاسم الكائن | Reserve `فترة نصف مفتوحة` for `[start, nextStart)`. |
| `locale` | **الإعداد المحلي** (ج: **الإعدادات المحلية**) | `اللغة` وحدها لوسم إقليمي مثل `ar-EG`، `ar-SA`، `es-MX`؛ خلط `اللغة المحلية` | Lock **الإعداد المحلي** everywhere for BCP 47 locales. Use `اللغة` only for human languages (العربية، الفرنسية). |
| `localization` | **التوطين** | `الترجمة`، `الأقلمة` | Matches `nav.group.localization` and guide title. |
| `time zone` | **المنطقة الزمنية** (ج: **المناطق الزمنية**) | `النطاق الزمني` (يلتبس بـ `Range`) | Always **المنطقة الزمنية**. |
| `offset` | **الإزاحة** / **إزاحة UTC** | `الفرق` المبهم في التوثيق التقني | Use **الفارق الزمني** only for city-to-city differences in homepage UI (`YearStrip`). |
| `DST` / `daylight saving time` | **التوقيت الصيفي** | إبقاء `DST` دون ترجمة في النص العربي | Never leave bare `DST` in Arabic prose. |
| `preset` | **قالب جاهز** (ج: **قوالب جاهزة**) | `تنسيق جاهز`، `نمط جاهز` | Strictly distinct from **نمط الرموز** (`token pattern`). |
| `token pattern` | **نمط الرموز** (ج: **أنماط الرموز**) | `قالب الرموز` (حتى في المسودة القديمة لـ `arabic.md`!) | Must NEVER collide with **قالب جاهز** (`preset`). |
| `narrow / short / medium / long / full / digital` | **مضغوط** / **مختصر** / **متوسط** / **طويل** / **كامل** / **رقمي** | خلط `ضيّق` و`موجز` لـ `narrow` | Keep literal English preset tokens (`'short'`, `'narrow'`) in backticks. |
| `loose mode` / `loose` | **الوضع المرن** (والإضافة: **إضافة `loose`** أو **الإضافة المرنة**) | `وضع loose`، `الوضع الفضفاض` | Match `loose: true` -> **الوضع المرن**. |
| `immutable` | **غير قابل للتعديل** | `ثابت` وحده (يلتبس بـ `const` أو `fixed`) | Always **غير قابل للتعديل**. |
| `clamp` / `clamping` | **التقييد** / **التقييد بآخر يوم في الشهر** / **التقييد بالحدود** | `الاقتطاع` (مخصص لـ `truncate`) | E.g. Jan 31 + 1 month clamps to Feb 28/29. |
| `truncate` | **الاقتطاع** / **إسقاط الجزء العشري** | `التقييد`، `التقريب` | Rounding toward zero (`Math.trunc`). |
| `round` / `floor` / `ceil` | **التقريب** (`التقريب إلى الأقرب`، `التقريب للأسفل`، `التقريب للأعلى`) | خلط `الاقتطاع` بـ `التقريب للأسفل` | Critical for negative timestamps and `epochSeconds`. |
| `half-open interval` | **فترة نصف مفتوحة** (`[start, nextStart)`) | `نطاق نصف مفتوح` | Mathematical interval excluding upper bound. |
| `inclusive` / `exclusive` | **شامل** (أو **شامل للحدّين**) / **غير شامل** (أو **حصري**) | `تضميني` / `استثنائي` | Clear, natural math register. |
| `factory function` | **دالة مصنعية** (ج: **دوال مصنعية**) | `باني الصنف`، `دالة مُنشئة` | Strictly distinct from **باني الصنف** (`class constructor`). |
| `class constructor` | **باني الصنف** | `دالة مصنعية` | `new DateTime(...)` vs `datetime(...)`. |
| `mutating setters` | **دوال الضبط المُعدِّلة** (أو **دوال ضبط تُعدِّل الكائن في موضعه**) | `دوال ضبط قابلة للتعديل` | Describe what the setter does to the instance. |
| `disambiguation` | **إزالة اللبس** | `توضيح`، `فكّ الغموض` | Resolving skipped (متخطّاة) or repeated (متكرّرة) local times at DST transitions. |
| `prompt` (AI) | **الموجّه** | `الموجة` (بدون شدّة)، `الموجه` (ملتبس بـ router) | Always include shadda on `ج`: **الموجّه**. |
| `bundle` / `bundle size` | **الحزمة** / **حجم الحزمة** | `الرزمة` | Consistent across homepage, plugins, and guides. |
| `polyfill` | **حزمة التوافق (polyfill)** (عند أول ذكر، ثم **حزمة التوافق**) | `بوليفيل` | Explains `@native-dates/polyfill` cleanly. |
| `epoch` / `Unix epoch` | **عصر Unix** | `الحقبة` (مخصصة لـ Japanese era `الحقبة اليابانية`) | **Critical accuracy rule:** `epochSeconds` uses `Math.floor` (**التقريب للأسفل**), NOT `Math.trunc` (**الاقتطاع**)! |
| `median` vs `mean` | **الوسيط** (ج: **القيم الوسيطة**) مقابل **المتوسط** (أو **المتوسط الحسابي**) | استخدام `المتوسط` لـ `Medians` في `home.bench.run` | Statistical distinction is strict. |
| `weekday` | **يوم عمل** (في مقابل العطلة: `isWeekday()`، `count('weekdays')`) / **يوم من أيام الأسبوع** (الاثنين–الأحد: `weekdayNames()`، `dayOfWeek()`) | الخلط بين المعنيين | Distinguish workday vs calendar day-of-week by context. |
| `weekend` | **عطلة نهاية الأسبوع** (ج: **أيام عطلة نهاية الأسبوع**) | `إجازة الأسبوع` | Consistent everywhere. |
| `plugin` / `subpath` | **إضافة** (ج: **إضافات**) / **مسار فرعي** | `ملحق`، `مكوّن إضافي` | Keep package subpath imports literal. |
| `runtime` | **بيئة التشغيل** | `وقت التشغيل` (يلتبس بالوقت) | Browser, Node, Deno, Bun. |
| `relative time` | **الوقت النسبي** | `التوقيت النسبي` | E.g. `from()`, `fromNow()`. |
| `chain` / `chainable` | **سلسلة استدعاءات** / **قابل للتسلسل** | `متسلسل` مبهم | API chaining. |
| `return` (verb) | **تُرجع** (للدالة/الطريقة) / **يُرجع** (للاستدعاء) | `تقوم بإرجاع`، `تُعيد` (لغير التوحيد) | Standard MDN Arabic verb. |
| `throw` (verb) | **ترمي** / **يرمي** (`يرمي RangeError`، `ترمي TypeError`) | `يطرح استثناء`، `يلقي خطأ` | Standard concise error verb. |
| `call` / `pass` | **استدعِ** (**استدعاء**) / **مرّر** (**تمرير**) | `قم باستدعاء`، `قم بتمرير` | Crisp imperatives. |
| `parse` / `format` | **تحلّل** (**تحليل**) / **تنسّق** (**تنسيق**) | `تفسّر` لـ `parse` | Locked pair across guides and API. |

---

## 3. CLDR Plural Rules (`ar` — All 6 Forms) & `home-locales.js` Coupling

### 3.1 All 6 CLDR Forms for All 7 Plural Families

`Intl.PluralRules('ar')` requires **all 6 categories** (`zero`, `one`, `two`, `few`, `many`, `other`) for every plural family in `docs/src/content/translations/ar/strings.json`:

- `zero` (`0`): `0` + genitive plural (or idiomatic zero phrase like `لا فارق`)
- `one` (`1`): singular + `واحد`/`واحدة` without redundant numeral (`check-i18n.mjs` explicitly permits omitting `{count}`/`{hours}` on `.zero`, `.one`, `.two`)
- `two` (`2`): natural dual **matching the exact grammatical case of the enclosing slot** — **nominative `ـان`** in standalone badges (`خياران`، `إضافتان`، `سطران`) vs **genitive/accusative `ـين`** when embedded after a preposition, mudaf, or verb (`فارق ساعتين`، `مرتين`، `يومين`، `جولتين`)
- `few` (`3–10`, `103–110`, ...): `{count}` + genitive plural (`مجرور`)
- `many` (`11–99`, `111–199`, ...): `{count}` + accusative singular (`منصوب`) — **always write tanwin alif `ـًا`** on masculine nouns not ending in `ة` (`خيارًا`، `سطرًا`، `يومًا`); omit tanwin mark on feminine `ة` nouns in UI counters (`إضافة`، `ساعة`، `مرة`، `جولة`)
- `other` (`100+`, decimals like `5.5`): `{count}` + genitive singular (`مجرور`, no tanwin alif)

| Plural Family | Slot & Grammatical Case | `.zero` | `.one` | `.two` | `.few` | `.many` | `.other` |
|---|---|---|---|---|---|---|---|
| `api.options.*` | Standalone `<summary>` (nominative / مرفوع) | `0 خيارات` | `خيار واحد` | `خياران` | `{count} خيارات` | `{count} خيارًا` | `{count} خيار` |
| `plugins.count.*` | Standalone badge (nominative / مرفوع) | `0 إضافات` | `إضافة واحدة` | `إضافتان` | `{count} إضافات` | `{count} إضافة` | `{count} إضافة` |
| `home.xray.lines.*` | Standalone badge (nominative / مرفوع) | `0 أسطر` | `سطر واحد` | `سطران` | `{count} أسطر` | `{count} سطرًا` | `{count} سطر` |
| `home.year.gap.*` | Standalone badge after mudaf `فارق` (genitive / مضاف إليه) | `لا فارق` | `فارق ساعة` | `فارق ساعتين` | `فارق {hours} ساعات` | `فارق {hours} ساعة` | `فارق {hours} ساعة` |
| `home.year.changes.*` | Embedded in `year.lede`: `فيتبدّل الفارق الزمني {changes} في السنة` (accusative / نائب عن المفعول المطلق) | `0 مرات` | `مرة واحدة` | `مرتين` | `{count} مرات` | `{count} مرة` | `{count} مرة` |
| `home.year.days.*` | Embedded in `year.caption`: `على مدار {days}` (genitive / مجرور بعد `على مدار` أو `لمدة`) | `0 أيام` | `يوم واحد` | `يومين` | `{count} أيام` | `{count} يومًا` | `{count} يوم` |
| `home.bench.rounds.*` | Embedded in `home.bench.run`: `القيم الوسيطة عبر {rounds} في Chrome {chrome} بدون واجهة، قِيست في {date}.` (genitive / مجرور بعد `عبر`) | `0 جولات` | `جولة واحدة` | `جولتين` | `{count} جولات` | `{count} جولة` | `{count} جولة` |

> Note: In `home.bench.run`, always use **القيم الوسيطة** (or **الوسيط**), **NEVER** `المتوسط`.

### 3.2 Required Fixes in `docs/src/data/home-locales.js` (`ar` block, lines 238–313)

For `ar` (`Europe/London` -> `Africa/Cairo` in 2026), `YearStrip.astro` computes: `changes = 4`, `usual ({far}) = 2`, `shiftedGap ({near}) = 1`, `shiftedTime ({time}) = '10:30 ص'`, `shiftedDays = 31` (26 spring days at 1h gap + 5 autumn days at 3h gap).

Apply **all 6 fixes** when updating the `ar` block in `docs/src/data/home-locales.js`:

1. **Normalize all prose digits to Western `0-9`:**
   - L250 (`proofs[0].note`): change `٣ إلى ١٠` and `١١ إلى ٩٩` to **`3 إلى 10`** and **`11 إلى 99`**.
   - L282 (`consoles.clocks.why`): change `٢٣`, `٢٤`, `١٠`, `٩` to **`23`**, **`24`**, **`10`**, **`9`**.
2. **Fix L276 `consoles.day.miss`:** `'متأخر بيوم'` ("a day late") is factually wrong for `2026-09-01` -> `2026-08-31` ("a day early"). Replace with **`'مبكّر بيوم'`**.
3. **Fix L302 `year.lede`:** Replace hardcoded `{changeCount} مرات` with **`{changes}`**, and replace `"في عطلات نهاية أسبوع مختلفة"` (inaccurate because Egypt switches Thu/Fri, not Sun) with **`في مواعيد مختلفة في الربيع والخريف`**. Locked copy:
   ```text
   تُغيّر لندن والقاهرة التوقيت الصيفي في مواعيد مختلفة في الربيع والخريف، فيتبدّل الفارق الزمني {changes} في السنة دون بايت واحد إضافي في حزمتك.
   ```
4. **Fix L304 `year.caption`:** Replace hardcoded `{dayCount} يومًا` with **`{days}`**, and avoid awkward `من 2 إلى 1 ساعة` while accurately reflecting 31 shifted days where the usual `{far}`-hour gap narrows in spring to `{near}` hour (`{time}`). Locked copy:
   ```text
   اجتماع الساعة 9:30 صباحًا بتوقيت لندن محوّلًا إلى توقيت القاهرة خلال عام {year}. على مدار {days} يتغيّر الفارق المعتاد ({far} س) ليصل في الربيع إلى {near} س فينتقل الموعد إلى {time}.
   ```
   Also review `proofs` copy in L243–271 to use locked glossary terms (**الإعداد المحلي** instead of `رمز اللغة`, **التقويم الهجري** / **وسم التقويم الهجري** instead of `علامة التقويم الإسلامية`, **النطاقات** instead of `النطاقات الزمنية` for `dateRange`).
5. **Verify `xray.inviteCity` and `try.city`:**
   - `xray.inviteCity: 'دبي'` + `home.xray.invite`: **`أريد دعوة شخص في {city}`** -> `أريد دعوة شخص في دبي`
   - `try.city: 'لندن'` + `home.try.title`: **`جرّبه وكأنك في {city}`** -> `جرّبه وكأنك في لندن`
   - Also lock `home.closer.title`: **`ابدأ من {call}`** (separate preposition; NEVER attach bound `بـ` to `{call}`, and NEVER repeat `الآن` next to `now()`).
6. **Verify all 5 `home.say.*` chains end to end (`docs/src/scripts/home/sentences.js`):**
   Keep every chip short (`.say-words` is `white-space: nowrap` on desktop) and ensure zero repeated prepositions or gender/tense clashes across every combination:
   - **`meeting`** (`today` + `next.*` + `at.*` + `in.*`):
     - `today`: `اليوم`
     - `next.{monday,wednesday,friday,sunday}`: `الاثنين القادم` / `الأربعاء القادم` / `الجمعة القادمة` / `الأحد القادم`
     - `at.*` (`cairo`, `london`, `paris`, `tokyo`, plus all other cities in `strings.json`): `الساعة 11 ص في القاهرة` / `الساعة 8 ص في لندن` / `الساعة 3 م في باريس` / `الساعة 6:45 م في طوكيو` (same concise pattern for all other `at.*` keys)
     - `in.*` (`london`, `tokyo`, `kolkata`, `saoPaulo`, plus all other cities): `بتوقيت لندن` / `بتوقيت طوكيو` / `بتوقيت كولكاتا` / `بتوقيت ساو باولو` (uses `بتوقيت` so `في` never repeats across steps 3 and 4)
   - **`time`** (`time.*` + `plus.*` + `round.*` + `format.{24h,short}`):
     - `time.{920am,10pm,640am}`: `9:20 ص` / `10:00 م` / `6:40 ص`
     - `plus.{8.hours,45.minutes,3.hours,1.day}` (shared with `length`): `زائد 8 ساعات` / `زائد 45 دقيقة` / `زائد 3 ساعات` / `زائد يوم واحد`
     - `round.{15m,hour}`: `تقريب لأقرب 15 دقيقة` / `تقريب لأقرب ساعة` (noun phrase avoids gender clash)
     - `format.{24h,short}`: `بتنسيق 24 ساعة` / `بتنسيق مختصر`
   - **`length`** (`duration.*` + `plus.*` + `times.{2,3}` + `format.{narrow,short,digital}`):
     - `duration.{90m,45m,2d6h}`: `ساعة و30 دقيقة` / `45 دقيقة` / `يومان و6 ساعات`
     - `times.{2,3}`: `الضعف` / `ثلاثة أضعاف`
     - `format.{narrow,short,digital}`: `بتنسيق مضغوط` / `بتنسيق مختصر` / `بتنسيق رقمي`
   - **`range`** (`range.{may,jan,nov}` + `count.{weekdays,weekends,mondays,days}`):
     - `range.{jan,may,nov}`: `من 1 إلى 14 يناير` / `من 1 مايو لمدة أسبوعين` / `شهر نوفمبر كاملًا`
     - `count.{weekdays,weekends,mondays,days}`: `كم يوم عمل` / `كم يوم عطلة` / `كم يوم اثنين` / `كم يومًا`
   - **`birthday`** (`birthday.{oct17,feb29,dec25}` + `birthday.{next,in2028,prev}` + `{birthday.fromNow, format.full, birthday.weekday}`):
     - `birthday.{oct17,feb29,dec25}`: `17 أكتوبر` / `29 فبراير` / `25 ديسمبر`
     - `birthday.{next,in2028,prev}`: `القادم` / `في عام 2028` / `الماضي`
     - `birthday.fromNow`: **`كم يبعد عن اليوم`** (works naturally for `القادم`, `في عام 2028`, AND `الماضي` — never use future-only `كم بقي عليه`!)
     - `format.full`: `بالتنسيق الكامل`
     - `birthday.weekday`: `أي يوم في الأسبوع`

---

## 4. Typography, Punctuation, Numerals & RTL / BiDi Safety

- **Numeral policy (strict):**
  - **Prose, headings, tables, UI strings, and `home-locales.js` prose:** ALWAYS use **Western Arabic numerals (`0-9`)** to align cleanly with code, ISO dates, and performance metrics.
  - **Eastern Arabic numerals (`٠-٩`):** Preserve ONLY inside verbatim JS return-value comments (`// '١٦ نوفمبر ٢٠٢٦'`), literal quoted Intl output examples, and live `ar-EG` / `ar-SA` widget outputs.
- **Arabic punctuation:**
  - Use Arabic comma **`،`**, Arabic semicolon **`؛`**, Arabic question mark **`؟`**, and guillemets **`«...»`** with **no interior spaces** (`«يومان»`، `«بعد الغد»`).
  - Never use Latin `,`, `;`, or `?` in Arabic prose. Use a standard period `.` at the end of sentences.
- **BiDi & `<bdi>` safety (critical gate rule):**
  - **NEVER** place `<bdi>` or any raw HTML tags/entities inside:
    - plain-text `strings.json` keys (anything not listed in `HTML_KEYS` in `docs/scripts/check-i18n.mjs`),
    - `INLINE_KEYS` (`plugins.*.description`),
    - Markdown frontmatter (`title`, `lede`, `description`, `try:`),
    - YAML ```` ```params ```` / ```` ```returns ```` `description:` fields.
    (`check:i18n` rejects raw HTML in all of these!)
  - Use `<bdi>` **only** in `HTML_KEYS` (where needed) or Markdown body prose when bare LTR tokens with signs or separators (`+03:00`, `UTC-5`, `09:00 +03:00`, `2026-05-01`) appear **outside** backtick code spans. Inline `` `code` `` spans are already isolated as LTR by CSS, so do not double-wrap `` `code` `` in `<bdi>`.
- **Units:** Write **`كيلوبايت`** and **`مللي ثانية`** in prose (`0 كيلوبايت`, `{ms} مللي ثانية`). Leave `{size}` (`14.9 kB` inside `<span class="ltr">`), `br` inside `<abbr title="مصغّرة ومضغوطة بخوارزمية Brotli">br</abbr>`, and `min+br` untouched.
- **Required HTML markup in `HTML_KEYS`:** Preserve every mandatory tag and attribute enforced by `REQUIRED_HTML` (`playground.paused` `<button class="pg-run" type="button">`, `home.consoles.title` `<em class="is-wrong">` / `<em class="is-right">`, `home.bench.lede` `<a href="{run}">` / `<a href="{add}">`, `plugins.callout.body` `<a href="{href}">`, `home.hero.lede` `<a ...>` / `<span class="ltr">` / `<abbr title="...">br</abbr>`, `plugins.stats.picked` `<small>`).
- **YAML ```` ```params ```` and ```` ```returns ```` `description:` style:**
  - Write a concise Arabic **noun phrase (جملة اسمية / شبه جملة اسمية موجزة)** ending with `.`.
  - **Never** start with a verb (`يُرجع...` / `تُرجع...` is forbidden). Write `كائن DateTime جديد بالتاريخ المحدّد.` / `قيمة منطقية تكون true إذا كان اليوم عطلة نهاية أسبوع.` / `وسم الإعداد المحلي النشط أو undefined إذا لم يُضبط.`
  - Quote YAML string values if they start with `` ` ``, `'`, `"`, `{`, `[`, `!`, or contain `: `.
  - Zero `*italic*` and zero raw HTML inside `description:` (parsed by `inline()`, which supports only `` `code` ``, `**strong**`, and `[label](href)`).
- **Visible playground UI labels in `example.md` `try:` steps:**
  - Because sandbox UI controls stay in English, keep visible English button, tab, and field labels **verbatim and bolded** (e.g., `**Date**`, `**Days**`, `**Span**`, `**Time**`, `**Today**`, `**Typed date**`, `**Unreadable**`, `**Lunar New Year**`, `**+35 days**`, `**2027-01-01**`, `**平成最後の日**`, `**令和初日**`).
- **Untouchable Markdown DSL:**
  - Match English heading count/depth (`##`, `###`) and table count/columns exactly.
  - Keep directives (`:::entry`, `:::steps`, `:::truth`, `:::details`, `{open}`, `:::note`, `:::tip`, `:::warning`, `:::danger`), `:kind[...]`, `locale="..."`, and literal `true`/`false` cells inside `:::truth` tables untouched. Translate only `[Title]` (keep `:::details[Title]` plain with no backticks) and `label="..."` on tabbed code fences.
  - Keep internal links root-relative (`/guides/...`, `/api/...`, `/plugins/...`, `/examples/...`) with **no `/ar/` prefix** and English `#anchor` hashes untouched.

---

## 5. English-Only Input Qualifiers & Native Self-Language Reframing

- **Qualify English-only API inputs explicitly:** Whenever documenting methods that only accept English strings, state clearly that the input strings are in English:
  - `duration()`: عبارات المدة بالإنجليزية (مثل `'2 hours 30 minutes'`)
  - `dayOfWeek()`, `configure({ weekStart })`, `weekdayNames()`, `count()`: أسماء أيام الأسبوع بالإنجليزية (مثل `'monday'`, `'weekdays'`)
  - `zones` plugin: أسماء مدن IANA بالإنجليزية (مع الإشارة إلى الأسماء البديلة المضمّنة عند ورودها في النص)
  - `docs/api/errors.md`: توضيح أن نصوص التشخيص في وضع التطوير (`NODE_ENV !== 'production'`) تَصدر بالإنجليزية بينما تبقى `error.code` و`error.at` ثابتة برمجيًا.
- **Native-to-native reframing for `docs/guides/arabic.md` and `examples/arabic/example.md`:**
  - Write from one Arab developer directly to another. Do **not** lecture Arab readers about Arabic having six plural forms, dual `يومان`, or Hijri/Gregorian calendars as if explaining an exotic language to a foreigner.
  - Focus directly on engineering behavior in `native-dates`: regional tags (`ar-EG`, `ar-SA`, `ar-AE`, `ar-LB`, `ar-MA`, `ar-DZ`), forcing numeral scripts with `-u-nu-latn`/`-u-nu-arab`, hidden `\u200F` marks in numeric presets vs `'YYYY-MM-DD'`, `-u-ca-islamic-umalqura` with Gregorian-only `YearMonth`/`MonthDay`, regional week starts and Fri–Sat vs Sat–Sun weekends, `<bdi>` isolation for mixed BiDi tokens, loose parsing of Eastern digits and Levantine multi-word months, Casablanca Ramadan UTC+0 shift, and Cairo midnight spring-forward (`00:00` -> `01:00`, 23-hour day).
  - **Clean up existing stale draft `docs/src/content/translations/ar/docs/guides/arabic.md`:** Fix all stale draft issues against current English (`f8fde894143d`): replace `قوالب الرموز` -> **`أنماط الرموز`**, normalize prose digits `١٢` / `٢٤` -> **`12`** / **`24`**, fix the literal calque in line 8 (`مرّر وسم الدولة ... عبر [التوطين]`), remove `reviewed: false`, and update `source`.

---

## 6. Locked `nav.*` Labels

Keep `nav.group.handling` (**الوقت حسب اللغة**) in exact sync with the sidebar reference at the bottom of `docs/guides/localization.md`.

| Key | English | Locked Arabic |
|---|---|---|
| `nav.home` | native-dates home | `الصفحة الرئيسية لـ native-dates` |
| `nav.skip` | Skip to content | `تخطَّ إلى المحتوى` |
| `nav.open` | Open navigation | `افتح القائمة` |
| `nav.sections` | Sections | `الأقسام` |
| `nav.github` | GitHub | `GitHub` |
| `nav.theme` | Toggle color theme | `بدّل سمة الألوان` |
| `nav.themeToDark` | Switch to dark theme | `التبديل إلى الوضع الداكن` |
| `nav.themeToLight` | Switch to light theme | `التبديل إلى الوضع الفاتح` |
| `nav.notWritten` | Not written yet | `لم يُكتب بعد` |
| `nav.guides` | Guides | `الأدلة` |
| `nav.api` | API | `API` |
| `nav.examples` | Examples | `الأمثلة` |
| `nav.plugins` | Plugins | `الإضافات` |
| `nav.group.start` | Start | `البداية` |
| `nav.group.time` | Working with time | `التعامل مع الوقت` |
| `nav.group.going-further` | Going further | `موضوعات متقدمة` |
| `nav.group.classes` | Classes | `الأصناف` |
| `nav.group.functions` | Functions | `الدوال` |
| `nav.group.setup` | Setup | `الإعداد` |
| `nav.group.zones` | Time zones | `المناطق الزمنية` |
| `nav.group.lengths` | Durations | `المدد الزمنية` |
| `nav.group.calendars` | Calendars | `التقويمات` |
| `nav.group.handling` | Handling time in | `الوقت حسب اللغة` |
| `nav.group.localization` | Localization | `التوطين` |
| `nav.group.reference` | Reference | `المرجع` |
| `nav.item.allExamples` | All examples | `جميع الأمثلة` |
| `nav.item.allPlugins` | All plugins | `جميع الإضافات` |
| `nav.item.errors` | Errors | `الأخطاء` |
| `nav.lang.japanese` | Japanese | `اليابانية` |
| `nav.lang.chinese` | Chinese | `الصينية` |
| `nav.lang.korean` | Korean | `الكورية` |
| `nav.lang.arabic` | Arabic | `العربية` |
| `nav.lang.russian` | Russian | `الروسية` |
| `nav.lang.spanish` | Spanish | `الإسبانية` |
| `nav.lang.portuguese` | Portuguese | `البرتغالية` |
| `nav.lang.french` | French | `الفرنسية` |
| `nav.lang.german` | German | `الألمانية` |

---

## 7. Locked Page Titles (All 61 Files)

Every cross-page Markdown link (`[Title](/guides/...)`) MUST use the exact locked destination title below. The 20 symbol-named API and plugin pages stay verbatim.

### Guides (`guidesA` + `guidesB` — 25 files)

| File | English Title | Locked Arabic Title |
|---|---|---|
| `docs/guides/installation.md` | Installation | `التثبيت` |
| `docs/guides/overview.md` | Overview | `نظرة عامة` |
| `docs/guides/customization.md` | Customization | `التخصيص` |
| `docs/guides/types-of-time.md` | Types of time | `أنواع الوقت` |
| `docs/guides/date-math.md` | Date math | `العمليات الحسابية على التواريخ` |
| `docs/guides/months-and-days.md` | Months and days | `الأشهر والأيام` |
| `docs/guides/time-zones.md` | Time zones | `المناطق الزمنية` |
| `docs/guides/durations.md` | Durations | `المدد الزمنية` |
| `docs/guides/ranges.md` | Ranges | `النطاقات` |
| `docs/guides/formatting.md` | Formatting | `التنسيق` |
| `docs/guides/parsing.md` | Parsing | `التحليل` |
| `docs/guides/storing-and-sending.md` | Storing and sending | `التخزين والإرسال` |
| `docs/guides/localization.md` | Localization | `التوطين` |
| `docs/guides/temporal.md` | Working with Temporal | `العمل مع Temporal` |
| `docs/guides/writing-a-plugin.md` | Writing a plugin | `كتابة إضافة` |
| `docs/guides/from-dayjs.md` | Coming from Day.js | `الانتقال من Day.js` |
| `docs/guides/from-moment.md` | Coming from Moment | `الانتقال من Moment` |
| `docs/guides/arabic.md` | Arabic | `العربية` |
| `docs/guides/chinese.md` | Chinese | `الصينية` |
| `docs/guides/french.md` | French | `الفرنسية` |
| `docs/guides/japanese.md` | Japanese | `اليابانية` |
| `docs/guides/korean.md` | Korean | `الكورية` |
| `docs/guides/portuguese.md` | Portuguese | `البرتغالية` |
| `docs/guides/russian.md` | Russian | `الروسية` |
| `docs/guides/spanish.md` | Spanish | `الإسبانية` |

### API Reference (`apiClassesA` + `apiClassesB` + `apiFunctions` — 19 files)

| File | English Title | Locked Arabic Title |
|---|---|---|
| `docs/api/date-time.md` | DateTime | `DateTime` |
| `docs/api/calendar-date.md` | CalendarDate | `CalendarDate` |
| `docs/api/time.md` | Time | `Time` |
| `docs/api/duration.md` | Duration | `Duration` |
| `docs/api/year-month.md` | YearMonth | `YearMonth` |
| `docs/api/month-day.md` | MonthDay | `MonthDay` |
| `docs/api/ranges.md` | Ranges | `النطاقات` |
| `docs/api/date-fn.md` | date() | `date()` |
| `docs/api/datetime-fn.md` | datetime() | `datetime()` |
| `docs/api/time-fn.md` | time() | `time()` |
| `docs/api/duration-fn.md` | duration() | `duration()` |
| `docs/api/year-month-fn.md` | yearMonth() | `yearMonth()` |
| `docs/api/month-day-fn.md` | monthDay() | `monthDay()` |
| `docs/api/range-fn.md` | dateRange() | `dateRange()` |
| `docs/api/compare.md` | compare() | `compare()` |
| `docs/api/configure.md` | configure() | `configure()` |
| `docs/api/errors.md` | Errors | `الأخطاء` |
| `docs/api/kind-of.md` | kindOf() | `kindOf()` |
| `docs/api/month-names.md` | monthNames() | `monthNames()` |

### Plugins & Examples (`pluginsExamples` — 17 files)

| File | English Title | Locked Arabic Title |
|---|---|---|
| `docs/plugins/legacy-date.md` | legacy-date | `legacy-date` |
| `docs/plugins/loose.md` | loose | `loose` |
| `docs/plugins/zones.md` | zones | `zones` |
| `examples/arabic/example.md` | Arabic plurals, numerals, and Hijri dates | `الجموع العربية والأرقام والتواريخ الهجرية` |
| `examples/chinese/example.md` | Chinese calendars and day periods | `التقويم الصيني وفترات اليوم` |
| `examples/countdown/example.md` | Countdown to a launch | `عدّ تنازلي لموعد إطلاق` |
| `examples/duration-input/example.md` | Typed durations | `المدد المكتوبة نصيًا` |
| `examples/french/example.md` | French casing, ranges, and regional clocks | `الأحرف الفرنسية والنطاقات والساعات الإقليمية` |
| `examples/german/example.md` | German ordinal periods, spans, and calendar weeks | `النقاط الترتيبية والنطاقات وأسابيع التقويم بالألمانية` |
| `examples/japanese/example.md` | Japanese eras, dates, and shifts | `الحقب اليابانية والتواريخ ونوبات العمل` |
| `examples/korean/example.md` | Korean spacing and collapsed ranges | `التباعد الكوري والنطاقات المدمجة` |
| `examples/meeting-planner/example.md` | A meeting across zones | `اجتماع عبر المناطق الزمنية` |
| `examples/month-grid/example.md` | A month grid | `شبكة تقويم شهري` |
| `examples/opening-hours/example.md` | Open right now | `مفتوح الآن` |
| `examples/portuguese/example.md` | Portuguese crasis, ranges, and day-first input | `صيغة crasis والنطاقات وتواريخ اليوم أولًا بالبرتغالية` |
| `examples/russian/example.md` | Russian month cases and plural counts | `إعراب الأشهر وصيغ الجمع بالروسية` |
| `examples/spanish/example.md` | Spanish connectors, casing, and day-first dates | `الروابط الإسبانية والأحرف وتواريخ اليوم أولًا` |
