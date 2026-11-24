---
source: "be45ccc1b61a"
title: loose
lede: 按需开启区域感知解析，面向表单、CSV 与旧版数据源中的非受控文本，无法解析时返回 `null`。
---

## 按需开启宽松解析

默认情况下，所有工厂函数都只接受严格的 ISO 8601 字符串，遇到格式错误会抛出错误。导入该插件即可启用 `{ loose: true }`，用于解析非受控的用户输入文本、CSV 列数据和旧版请求头。

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

未显式开启宽松模式时，默认仍保持严格解析。导入插件不会改变代码库中现有调用的行为。

## 按当前区域设置解析

宽松模式能够反解当前区域设置下 `Intl` 输出的日期和时钟时间。月份名称、上午/下午及各时段词、数字日期的日月顺序均直接取自运行时，各类书写系统的数字也会自动转为 `0-9` 数字。

当前区域设置的生效优先级与格式化一致：单次调用传入的 `locale` 选项优先，其次是 [`configure()`](/api/configure/)，最后是运行时默认区域设置。

```js locale="en-US" label="English"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'en-US' });

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
time('9:10 in the evening', { loose: true })?.toString(); // '21:10:00'
datetime('Sep 6, 2026, 5:30 PM', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 17
```

```js locale="fr" label="Français"
import '@native-dates/plugins/loose';
import { configure, date, datetime, monthDay } from 'native-dates';

configure({ locale: 'fr' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('1er mai 2026', { loose: true })?.toString(); // '2026-05-01'
monthDay('1er mai', { loose: true })?.toString(); // '05-01'
datetime('16 novembre 2026 à 14:30', {
  loose: true,
  zone: 'Europe/Paris',
})?.hour; // 14
```

```js locale="es" label="Español"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'es' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de noviembre de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 de la noche', { loose: true })?.toString(); // '21:10:00'
datetime('16 nov 2026, 14:30', {
  loose: true,
  zone: 'Europe/Madrid',
})?.hour; // 14
```

```js locale="pt-BR" label="Português"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'pt-BR' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de novembro de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 da noite', { loose: true })?.toString(); // '21:10:00'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  zone: 'America/Sao_Paulo',
})?.hour; // 14
```

```js locale="zh-CN" label="中文"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'zh-CN' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('晚上9:10', { loose: true })?.toString(); // '21:10:00'
datetime('2026年11月16日 下午2:30', {
  loose: true,
  zone: 'Asia/Shanghai',
})?.hour; // 14
```

```js locale="ja" label="日本語"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ja' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026年11月16日 14:30', {
  loose: true,
  zone: 'Asia/Tokyo',
})?.hour; // 14
```

```js locale="ko" label="한국어"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ko' });

date('26. 5. 5.', { loose: true })?.toString(); // '2026-05-05'
date('2026년 11월 16일', { loose: true })?.toString(); // '2026-11-16'
time('오후 2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026년 11월 16일 오후 2:30', {
  loose: true,
  zone: 'Asia/Seoul',
})?.hour; // 14
```

```js locale="ru" label="Русский"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ru' });

date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('16 ноября 2026 г.', { loose: true })?.toString(); // '2026-11-16'
time('9:10 вечера', { loose: true })?.toString(); // '21:10:00'
datetime('16 нояб. 2026 г., 14:30', {
  loose: true,
  zone: 'Europe/Moscow',
})?.hour; // 14
```

```js locale="ar-EG" label="العربية"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ar-EG' });

date('١٦‏/١١‏/٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
date('١٦ نوفمبر ٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true })?.toString(); // '14:30:00'
datetime('١٦ نوفمبر ٢٠٢٦، ٢:٣٠ م', {
  loose: true,
  zone: 'Africa/Cairo',
})?.hour; // 14
```

对于采用年-月-日顺序的区域设置（例如韩语），开头的两位年份也能正常识别，因此 `'26. 5. 5.'` 在韩语下会解析为 2026 年 5 月 5 日。无论是完整日期还是部分日期，其中的连接词、序数标记和开头的星期名称都会自动跳过。

## 无效数据返回 null

启用宽松模式后，无法识别的字符串、空字段、缺失值以及 2 月 30 日这类不存在的日历日期都会返回 `null`，而不是抛出错误。表单处理程序和导入脚本可以直接判断返回值，无需为每个字段套上 `try` 语句块。

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

[范围](/api/ranges/)、[`YearMonth`](/api/year-month/) 和 [`MonthDay`](/api/month-day/) 的工厂函数同样支持该选项：

```js
import { dateRange, monthDay, yearMonth } from 'native-dates';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

缺少“年”或“日”的不完整日期在 `date()` 和 `datetime()` 中会直接返回 `null`，不会擅自补全默认值。当输入只包含年月或月日时，应改用对应的部分日期工厂函数。

非英语月份名称旁的两位年份、存在歧义的月份缩写、搭配 AM 或 PM 但超过 12 的小时数，以及传入 [`datetime()`](/api/datetime-fn/) 的纯时钟时间都会被拒绝。无法识别的大写时区缩写和 `'14h'` 这类孤立的小时写法同样会返回 `null`。

:::note[无效数据返回 null，错误选项仍会抛出]
宽松模式只处理无法解析的输入数据。传入 `'Mars/Olympus'` 这类无效时区属于应用代码错误而非用户输入问题，因此仍会立即抛出错误。
:::

## 宽松字符串中的时区

带有 UTC 标识或数字偏移量的字符串代表具体时刻，解析后会转换到你的目标时区或全局配置时区。不带偏移量的字符串则保留文本中原有的日期和时钟时间，直接放入目标时区。

```js
datetime('Sat, 06 Sep 2026 14:30:00 GMT', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 10

datetime('September 6, 2026 5:30 PM', {
  loose: true,
  zone: 'America/Los_Angeles',
})?.hour; // 17
```

时钟时间后的时区缩写遵循与 `zone` 选项相同的解析规则。除了 UTC、GMT 和标准 IANA 时区标识之外，加载 [`@native-dates/plugins/zones`](/plugins/zones/) 后还能识别更多时区缩写，包括中文区域设置下的 `CST` 等随区域变化的缩写。

## 日-月-年顺序的数字日期

使用斜杠、点号或连字符分隔的数字日期会自动遵循当前区域设置的顺序。如果输入文本的顺序与当前区域设置不同，可以在单次调用中传入 `dayFirst`，或通过 [`configure()`](/api/configure/) 全局指定。

```js
import { configure } from 'native-dates';

date('07.09.2026', { loose: true, locale: 'en-US' })?.toString(); // '2026-07-09'
date('07.09.2026', { loose: true, locale: 'de-DE' })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, locale: 'en-US', dayFirst: true })?.toString(); // '2026-09-07'

configure({ dayFirst: true });
date('7/9/26', { loose: true })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, dayFirst: false })?.toString(); // '2026-07-09'
configure({ dayFirst: null });
```

向 `configure()` 传入 `dayFirst: null` 即可恢复跟随当前区域设置。像 [`monthDay()`](/api/month-day-fn/) 这类部分日期工厂函数始终按函数名本身的字段顺序读取成对数字，不受区域设置影响。

## 地区时钟与月份规则

`'14.30'` 这类点分时钟仅在芬兰语、丹麦语等使用点号分隔时分的区域设置下生效，在其他区域设置下返回 `null`。日期之后的点分秒数可以正常解析，而单独出现的三段点分数字串仍按日期处理。

英语的“in the evening”、韩语的“밤”等时段词只对 12 小时制生效，不会改动 24 小时制时间。日期与时间之间的连接词不会被误判为 AM/PM，例如威尔士语中表示“在”的“am”会保留 14:30 不变，而英语 `'AM 12:30'` 则解析为午夜 00:30。

完整日期中带有屈折变化或词缀的月份形式（包括希伯来语和巴斯克语）均可自动识别。简写月份名称必须唯一对应某个月份，因此法语“juil”会解析为 7 月，而存在歧义的“jui”会返回 `null`。

```js label="点分时钟"
datetime('16.11.2026 klo 14.30.15', {
  loose: true,
  locale: 'fi',
  zone: 'UTC',
})?.toString(); // '2026-11-16T14:30:15.000Z'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'de' }); // null
time('14.30.15', { loose: true, locale: 'fi' }); // null
```

```js label="时段词"
time('밤 11:30', { loose: true, locale: 'ko' })?.toString(); // '23:30:00'
time('밤 1:30', { loose: true, locale: 'ko' })?.toString(); // '01:30:00'
time('14:30 nachmittags', { loose: true, locale: 'de' })?.toString(); // '14:30:00'
```

```js label="连接词"
time('am 14:30', { loose: true, locale: 'cy' })?.toString(); // '14:30:00'
time('am 12:30', { loose: true, locale: 'cy' })?.toString(); // '12:30:00'
time('AM 12:30', { loose: true, locale: 'en-US' })?.toString(); // '00:30:00'
```

```js label="月份词形"
date('2026(e)ko azaroaren 16(a)', {
  loose: true,
  locale: 'eu',
})?.toString(); // '2026-11-16'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
```

## 工厂函数选项

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, locale?, dayFirst?, disambiguation? }): DateTime | null
date(input, { loose: true, zone?, locale?, dayFirst? }): CalendarDate | null
time(input, { loose: true, zone?, locale?, dayFirst? }): Time | null
duration(input, { loose: true, locale? }): Duration | null
yearMonth(input, { loose: true, zone?, locale? }): YearMonth | null
monthDay(input, { loose: true, zone?, locale?, dayFirst? }): MonthDay | null
dateRange(start, end, { loose: true, zone?, locale?, dayFirst? }): DateRange | null
```

为所有工厂函数扩展区域感知的回退解析，无法读取输入时返回 `null`。向 `new DateTime()` 等类构造函数传入 `{ loose: true }` 同样启用回退解析，但在输入无法读取时仍会抛出错误。

**参数**

```params
- name: loose
  type: boolean
  default: "false"
  description: "按当前区域设置解析非正式文本，对机器格式回退到引擎内置 `Date` 解析，无法读取时返回 `null`。"
- name: dayFirst
  type: boolean
  description: "覆盖当前区域设置对 `'07.09.2026'` 这类数字日期的解析顺序。"
- name: zone
  type: Zone
  description: "用于解释本地日期时间字符串或查看时间点的时区。"
- name: locale
  type: Locale
  description: "附加在结果值上的 BCP 47 区域标签，用于确定月份名称、时段词、时钟格式和日期顺序。"
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "本地日期时间字符串遇到夏令时跳变或重复时的消歧策略；宽松模式下传入 `'reject'` 会返回 `null`。"
```

**返回值**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: 解析得到的实例；无法读取 `input` 时返回 `null`。
```

```js
date('Sept 6, 2026', { loose: true })?.toString(); // '2026-09-06'
date('2026-09', { loose: true }); // null
yearMonth('2026-09', { loose: true })?.toString(); // '2026-09'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

覆盖默认数字日期顺序，对未单独指定 `dayFirst` 或 `locale` 的宽松模式调用生效。默认未设置，此时宽松模式会自动跟随当前区域设置。

**参数**

```params
- name: dayFirst
  type: boolean | null
  description: "将宽松模式下的数字日期固定为日-月-年（`true`）或月-日-年（`false`），传入 `null` 则恢复跟随当前区域设置。"
```
:::
