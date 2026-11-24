---
source: "8dc73060ce55"
title: parse
lede: 通过 `{ format }` 按占位符模板严格解析固定格式的日期与时间字符串。
---

## 按格式模板解析

核心包默认严格解析 ISO 8601 字符串，[`@native-dates/plugins/loose`](/plugins/loose/) 则按当前区域设置读取自由格式的文本。导入本插件后会新增 `{ format }` 选项，用于解析银行导出文件、服务端日志等固定格式的字符串。

```js title="parse.js"
import '@native-dates/plugins/parse';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
datetime('24/Nov/2026:12:40:01 -0500', {
  format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
  zone: 'America/New_York',
  locale: 'en-US',
}).toString(); // '2026-11-24T17:40:01.000Z'
time('1430', { format: 'HHmm' }).toString(); // '14:30:00'
yearMonth('11/2026', { format: 'MM/YYYY' }).toString(); // '2026-11'
monthDay('29/02', { format: 'DD/MM' }).toString(); // '02-29'
```

未传入 `format` 选项时，依然保持默认的严格 ISO 解析。如果在导入本插件之前就携带 `{ format }` 调用任意工厂函数，会抛出 [`missingPlugin`](/api/errors/#plugins) 错误。

## 严格匹配与命名格式

模板沿用核心包的[占位符语法](/guides/formatting/#token-patterns)。定宽占位符要求位数严格一致，字面文本也必须区分大小写地完整匹配整个字符串。

2 月 30 日这类不存在的日期，以及与日期对不上的星期名称都会直接抛出错误，绝不自动向后进位。模板中出现重复占位符，或混用冲突的 12 小时制与 24 小时制字段时，同样会被拒绝。

```js
import { configure, date, dateRange } from 'native-dates';

date('Tue 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' }).toString();
// '2026-11-24'
date('6/9/26', { format: 'D/M/YY' }).toString(); // '2026-09-06'

configure({ formats: { bank: 'DDMMYYYY' } });
date('24112026', { format: 'bank' }).toString(); // '2026-11-24'
dateRange('24112026', '30112026', { format: 'bank' }).toString();
// '2026-11-24/2026-11-30'
configure({ formats: null });
```

通过 [`configure()`](/api/configure/) 注册的命名格式同时适用于解析与格式化。范围工厂函数会自动将 `format` 选项透传给起止两端点，也兼容将时长作为第二个参数传入的写法。

## 本地化名称与序数

月份名称、星期名称、时段词与序数标记均遵循当前区域设置。独立形式与屈折变化形式的月份名称都会不区分大小写地匹配，因此俄语、希腊语等语言的日期无需额外规则即可直接解析。

当前区域设置的生效顺序与格式化一致：单次调用的选项优先，其次是 [`configure()`](/api/configure/)，最后是运行时默认设置。如果输入文本来自固定语言（例如英文服务端日志），请显式传入 `locale`。

```js
import { date, time, yearMonth } from 'native-dates';

date('November 24th, 2026', { format: 'MMMM Do, YYYY', locale: 'en-US' }).toString();
// '2026-11-24'
date('6 ноября 2026', { format: 'D MMMM YYYY', locale: 'ru' }).toString();
// '2026-11-06'
date('6. November 2026', { format: 'Do MMMM YYYY', locale: 'de' }).toString();
// '2026-11-06'
date('2026年11月6日', { format: 'YYYY[年]M[月]Do', locale: 'ja' }).toString();
// '2026-11-06'
yearMonth('février 2026', { format: 'MMMM YYYY', locale: 'fr' }).toString();
// '2026-02'
time('9:05:12.5 pm', { format: 'h:mm:ss.S a', locale: 'en-US' }).toString();
// '21:05:12.500'
```

英语序数占位符会严格校验后缀拼写，因此 `'24st'` 会被拒绝；在应用配置中注册的自定义[星期名称](/api/configure/)则会自动生效。

## ISO 周日期与序数日期

年内序数日与 ISO 周模板可直接解析为日历日期或具体时刻。与周数占位符搭配时，`YYYY` 按 ISO 周所属年份而非 `format()` 输出的日历年解读，因此 `'2026-W01-1'` 会解析为 2025 年 12 月 29 日。

闰年以及一年包含 52 周还是 53 周都会严格校验；ISO 周模板中省略星期几时，默认落在该周周一。

```js
import { date } from 'native-dates';

date('2026-328', { format: 'YYYY-DDDD' }).toString(); // '2026-11-24'
date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString(); // '2026-11-24'
date('2026-W48', { format: 'YYYY-[W]WW' }).toString(); // '2026-11-23'
date('2026-W01-1', { format: 'YYYY-[W]WW-E' }).toString(); // '2025-12-29'
```

## 时区与时间戳

包含偏移量占位符的模板会锁定一个精确时刻，并转换到你的目标时区。行内 `z` 占位符支持解析 IANA 时区标识；加载 [`@native-dates/plugins/zones`](/plugins/zones/) 后还支持城市名或 `JST` 等缩写，但不解析 `GMT+2` 这类任意偏移量标签。

除非额外传入目标 `zone` 选项进行转换，否则结果会保留行内解析出的时区。如果字符串同时包含偏移量与时区名称，且两者在该时刻互相矛盾，解析会直接抛出错误。

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  locale: 'en-US',
}).zone; // 'Asia/Tokyo'

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  zone: 'UTC',
  locale: 'en-US',
}).toString(); // '2026-11-24T06:45:00.000Z'

datetime('1795542001', { format: 'X', zone: 'UTC' }).toString();
// '2026-11-24T17:40:01.000Z'
datetime('24112026', { format: 'DDMMYYYY', zone: 'America/New_York' }).toString();
// '2026-11-24T05:00:00.000Z'
```

Unix 时间戳可通过 `X`（整秒）和 `x`（毫秒）解析。向 [datetime 工厂函数](/api/datetime-fn/)传入纯日期模板时，结果会落在目标时区当天的起始时刻。

## 配合宽松模式使用

同时加载 [`@native-dates/plugins/loose`](/plugins/loose/) 与本插件时，输入文本不符合格式模板将返回 `null` 而不是抛出错误。缺失值、纯数字、不存在的日期以及被拒绝的夏令时跳变都会由工厂函数返回 `null`，而原本就已是日期或时间类型的实例会原样透传。

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('not-a-date', { format: 'DDMMYYYY', loose: true }); // null
date('30022026', { format: 'DDMMYYYY', loose: true }); // null
datetime('08/03/2026 02:30', {
  format: 'DD/MM/YYYY HH:mm',
  zone: 'America/New_York',
  disambiguation: 'reject',
  loose: true,
}); // null
```

:::note[无效数据返回 null，错误模板仍会抛出错误]
宽松模式只把不匹配的输入字符串转为 `null`。空模板或缺少必填字段的模板仍会抛出 [`unknownFormat`](/api/errors/#units-zones-and-formats)，使用了目标类型不具备的占位符则会抛出 [`unsupportedToken`](/api/errors/#units-zones-and-formats)。
:::

## 支持的格式占位符

占位符沿用格式化的符号体系；除非模板本身以空白字符开头或结尾，否则会自动裁剪输入字符串首尾的空白字符。

| 占位符 | 示例 | 匹配规则 |
|---|---|---|
| `YYYY` | `'2026'` | 四位日历年份；与 `W` 或 `WW` 搭配时表示 ISO 周所属年份。 |
| `YY` | `'26'` | 两位年份，69 至 99 解析为 1969–1999，00 至 68 解析为 2000–2068。 |
| `M`, `MM` | `'9'`, `'09'` | 1 到 12 的月份数字，不补零或补零至两位。 |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | 本地化缩写或完整公历月份名称，包含屈折变化形式。 |
| `D`, `DD` | `'6'`, `'06'` | 1 到 31 的当月日期数字，不补零或补零至两位。 |
| `Do` | `'24th'`, `'6.'` | 带英语序数后缀或当前区域日期标记的当月日期。 |
| `DDD`, `DDDD` | `'1'`, `'328'` | 1 到 366 的 ISO 年内序数日，不补零或补零至三位。 |
| `W`, `WW` | `'5'`, `'48'` | 1 到 53 的 ISO 全年周数，不补零或补零至两位。 |
| `E` | `'2'` | ISO 星期序号，周一为 1、周日为 7。 |
| `d` | `'0'` | 星期序号，周日为 0、周六为 6。 |
| `dd`, `ddd`, `dddd` | `'Tu'`, `'Tue'`, `'Tuesday'` | 本地化极短、缩写或完整星期名称。 |
| `H`, `HH` | `'9'`, `'09'` | 24 小时制小时数（0 到 23），不补零或补零至两位。 |
| `h`, `hh` | `'9'`, `'09'` | 12 小时制小时数（1 到 12），不补零或补零至两位。 |
| `m`, `mm` | `'5'`, `'05'` | 分钟数（0 到 59），不补零或补零至两位。 |
| `s`, `ss` | `'8'`, `'08'` | 秒数（0 到 59），不补零或补零至两位。 |
| `S`, `SS`, `SSS` | `'5'`, `'25'`, `'250'` | 十分之一秒、百分之一秒或毫秒。 |
| `A`, `a` | `'PM'`, `'pm'` | 英语中不区分大小写的 AM / PM，或当前区域的时段标记。 |
| `Z`, `ZZ` | `'-05:00'`, `'-0500'` | 带冒号或不带冒号的 UTC 偏移量，或表示 UTC 的 `Z`。 |
| `z`, `zz` | `'UTC'`, `'JST'` | 不含空白的 IANA 时区标识；加载 `@native-dates/plugins/zones` 后还支持城市名或缩写。不解析 `'GMT+2'` 这类偏移量标签。 |
| `X`, `x` | `'1795542001'` | 以整秒或毫秒计的 Unix 时间戳，支持负值。 |
| `[text]` | `'[W]'` | 转义字面文本，区分大小写匹配。单独的 `T` 无需转义也可直接匹配。 |

季度、完整时区名称等仅用于格式化的占位符无法用于解析，会抛出 [`unknownFormat`](/api/errors/#units-zones-and-formats)。缺少目标类型必填字段的模板会抛出相同错误；使用了目标类型不含字段的占位符则会抛出 [`unsupportedToken`](/api/errors/#units-zones-and-formats)。

## 工厂函数选项

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { format, zone?, locale?, disambiguation?, loose? }): DateTime
date(input, { format, locale?, loose? }): CalendarDate
time(input, { format, locale?, loose? }): Time
yearMonth(input, { format, locale?, loose? }): YearMonth
monthYear(input, { format, locale?, loose? }): YearMonth
monthDay(input, { format, locale?, loose? }): MonthDay
dayMonth(input, { format, locale?, loose? }): MonthDay
dateRange(start, end, { format, locale?, loose? }): DateRange
datetimeRange(start, end, { format, zone?, locale?, disambiguation?, loose? }): DateTimeRange
timeRange(start, end, { format, locale?, loose? }): TimeRange
```

在所有日期、时钟时间、部分日期与范围工厂函数中，按占位符模板或命名格式解析字符串输入。在模板校验通过后，已解析的日期、时钟时间、`Date` 与 `Temporal` 值会原样透传，而纯数字会被拒绝。

**参数**

```params
- name: format
  type: string
  required: true
  description: "占位符模板（如 `'DDMMYYYY'`），或通过 `configure({ formats })` 注册的命名格式。"
- name: zone
  type: Zone
  description: 用于解释本地日期时间字符串，或转换带偏移量字符串与纪元时间戳的目标时区。
- name: locale
  type: Locale
  description: 附加在结果值上的 BCP 47 区域标签，同时用于匹配月份名称、星期名称、时段词与序数标记。
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "本地日期时间字符串遇到夏令时跳变或重复时的消歧策略。设为 `'reject'` 会抛出 `invalidDateTime`，在宽松模式下则返回 `null`。"
- name: loose
  type: boolean
  default: "false"
  description: "需要配合 `@native-dates/plugins/loose` 使用。输入不符合格式时返回 `null` 而不是抛出错误。"
```

**返回值**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay | Range
description: "解析得到的实例；在工厂函数上设置 `{ loose: true }` 且输入不匹配时返回 `null`。"
```

```js
date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
yearMonth('202611', { format: 'YYYYMM' }).toString(); // '2026-11'
timeRange('0930', '1700', { format: 'HHmm' }).toString(); // '09:30:00/17:00:00'
```
:::
