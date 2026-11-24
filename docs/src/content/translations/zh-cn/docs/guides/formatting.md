---
source: "2716034cf571"
title: 格式化
lede: 用本地化预设、占位符模板或相对时间短语格式化日期、时钟时间与时长。
---

Native Dates 直接复用平台内置的 `Intl` 格式化器并自动缓存，无需往构建产物里塞入任何语言包，即可生成符合各语言与地区习惯的文本。

## 用 text 与预设快速输出

每个实例都有按当前语言环境格式化的 `.text` 属性。不带参数调用 [`format()`](/api/date-time/#format) 时，会使用各类型对应的默认预设：

```js
import { date, datetime, duration, time } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.text; // 'Nov 16, 2026, 9:30 AM PST'
standup.format(); // 'Nov 16, 2026, 9:30 AM'

date('2026-11-16').text; // 'Nov 16, 2026'
time('9:30am').text; // '9:30 AM'
duration('1h 30m').text; // '1 hour, 30 minutes'
```

向 `format()` 传入预设名称，即可选择显示详略程度：

| 预设 | 示例 | 支持的类型与输出 |
|---|---|---|
| `'short'` | `'5/4/26, 9:30 AM'` | 适用于日期、时钟时间、部分日期和时长，输出数字日期或简短时钟时间。 |
| `'medium'` | `'May 4, 2026, 9:30 AM'` | 在日期与具体时刻上使用月份缩写；在 [`Time`](/api/time/) 上输出带秒的时钟时间。 |
| `'long'` | `'May 4, 2026 at 9:30 AM'` | 输出完整月份名；在 `Time` 上带秒输出；在 [`Duration`](/api/duration/) 上输出完整单位词。 |
| `'full'` | `'Monday, May 4, 2026 at 9:30 AM'` | 在日期与具体时刻上输出完整星期与月份；在部分日期上输出完整月份。 |
| `'date'` | `'May 4, 2026'` | 在 [`DateTime`](/api/date-time/) 和 [`CalendarDate`](/api/calendar-date/) 上仅输出日期部分。 |
| `'time'` | `'9:30 AM'` | 在 `DateTime` 和 `Time` 上输出简短时钟时间。 |
| `'month'` | `'May 2026'` | 在 `DateTime`、`CalendarDate` 和 [`YearMonth`](/api/year-month/) 上输出完整月份名与年份。 |
| `'text'` | `'May 4, 2026, 9:30 AM PDT'` | 在 `DateTime` 上输出日期、时钟时间与短时区名；在其他类型上输出各自携带的字段。 |

:::details[Moment 与 Day.js 预设名称]
核心包同样接受 Moment 和 Day.js 常用的本地化预设名：

| 预设 | 示例 | 本地化字段 |
|---|---|---|
| `'LT'`, `'LTS'` | `'9:30 AM'`, `'9:30:00 AM'` | 简短时钟时间，或带秒的时钟时间。 |
| `'L'`, `'l'` | `'05/04/2026'`, `'5/4/2026'` | 数字格式的年、月、日（补零或不补零）。 |
| `'LL'`, `'ll'` | `'May 4, 2026'` | 完整或缩写的月份名，搭配日和年。 |
| `'LLL'`, `'lll'` | `'May 4, 2026 at 9:30 AM'` | 完整或缩写日期，搭配简短时钟时间。 |
| `'LLLL'`, `'llll'` | `'Monday, May 4, 2026 at 9:30 AM'` | 完整或缩写的星期、日期与简短时钟时间。 |
:::

日期、时钟时间、[年月](/api/year-month/)和[月日](/api/month-day/)均支持上述所有预设，并只输出各自拥有的字段。[时长](/api/duration/)还额外支持紧凑风格与电子表数字风格：

```js
import { date, duration, time, yearMonth } from 'native-dates';

date('2026-11-16').format('full', 'en-US'); // 'Monday, November 16, 2026'
yearMonth('2026-11').format('LL', 'en-US'); // 'November 2026'
time('9:30:15am').format('LTS', 'en-US'); // '9:30:15 AM'

const span = duration({ hours: 2, minutes: 15 });
span.format('narrow', 'en-US'); // '2h 15m'
span.format('digital', 'en-US'); // '2:15:00'
```

## 语言环境与 Intl 选项

你可以用 [`configure()`](/api/configure/) 一次性设置全局默认语言，用 [`locale()`](/api/date-time/#locale) 把语言绑定到具体值上，或在单次 `format()` 调用时直接传入语言标签。客户端应用与多用户服务端的选型建议，请阅读[本地化](/guides/localization/)：

```js
import { configure, datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'Europe/Berlin');
standup.locale('de-DE').plus(1, 'week').format('long'); // '23. November 2026 um 09:30'
standup.format('long', 'ja-JP'); // '2026年11月16日 9:30'

configure({ locale: 'en-GB' });
configure({ locale: null });
```

如果内置预设都无法满足排版要求，可以直接向底层格式化器传入 `Intl` 选项对象：

```js
import { date } from 'native-dates';

const day = date('2026-11-16');

day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
day.format({ month: 'short', day: 'numeric' }, 'en-US'); // 'Nov 16'
```

由于每种类型只携带自身对应的字段，预设能够自动适配当地语法、复数形式、书写系统与历法，无需额外语言包。查看[语言示例](/examples/)可了解目标语言中的各类边界情况：

```js
import { date, days, yearMonth } from 'native-dates';

date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
date('2026-05-01').format('long', 'ru'); // '1 мая 2026 г.'
days(2).format('long', 'ar'); // 'يومان'
```

:::tip[界面展示与传输字符串各司其职]
`format()` 只应用于展示给人阅读的文本。存储数据或通过网络传输时，请调用 [`toString()`](/api/date-time/#tostring) 或直接序列化为 JSON，以确保载荷保持稳定的 ISO 8601 格式。详见[存储与传输](/guides/storing-and-sending/)。
:::

## 占位符模板

当界面需要固定格式时，向 `format()` 传入占位符模板。字面文本用方括号包裹，即可原样保留输出：

```js
import { datetime, monthDay, yearMonth } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('YYYY-MM-DDTHH:mmZ'); // '2026-11-16T09:30-08:00'
standup.format('dddd, MMM D [at] h:mm A', 'en-US'); // 'Monday, Nov 16 at 9:30 AM'
yearMonth('2026-11').format('MMM YYYY', 'en-US'); // 'Nov 2026'
monthDay('11-16').format('MMMM Do', 'en-US'); // 'November 16th'
```

占位符模板中的月份和星期名称取自当前语言环境的 `Intl` 数据。数字与年份始终保持西式阿拉伯数字与公历 ISO 形式，确保 `'YYYY-MM-DD'` 这类模板在任何地区都能被程序可靠解析。

:::details[全部格式占位符]
| 占位符 | 示例 | 输出说明 |
|---|---|---|
| `YYYY` | `'2026'` | 四位年份，负年份带负号。 |
| `YY` | `'26'` | 两位年份。 |
| `Q` | `'4'` | 季度，范围为 1 到 4。 |
| `M`, `MM` | `'11'`, `'05'` | 月份数字，不补零或补零至两位。 |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | 本地化公历月份名称；当紧随日期占位符之后（即使中间隔有字面文本）时自动应用对应词形变化。 |
| `D`, `DD` | `'5'`, `'05'` | 当月第几天，不补零或补零至两位。 |
| `Do` | `'16th'` | 带序数或日期标记的“日”：英语中输出序数后缀，其他语言使用当地日期标记（如 `'6.'` 或 `'6日'`），也可通过 [`ordinals`](/api/configure/) 自定义。 |
| `DDD`, `DDDD` | `'320'`, `'045'` | 当年第几天，不补零或补零至三位。 |
| `E` | `'7'` | ISO 星期序号，周一为 1、周日为 7，与 `dayOfWeek` 一致。 |
| `d` | `'0'` | 星期序号，周日为 0、周六为 6，与 Moment 和 Day.js 一致。 |
| `dd`, `ddd`, `dddd` | `'Mo'`, `'Mon'`, `'Monday'` | 本地化极短、缩写或完整星期名，可通过 [`weekdayNames`](/api/configure/) 自定义。 |
| `W`, `WW` | `'47'`, `'05'` | ISO 全年周数，不补零或补零至两位。 |
| `H`, `HH` | `'9'`, `'09'` | 24 小时制小时数，不补零或补零至两位。 |
| `h`, `hh` | `'9'`, `'09'` | 12 小时制小时数，范围为 1 到 12。 |
| `m`, `mm` | `'5'`, `'05'` | 分钟数，不补零或补零至两位。 |
| `s`, `ss` | `'8'`, `'08'` | 秒数，不补零或补零至两位。 |
| `S`, `SS`, `SSS` | `'4'`, `'42'`, `'420'` | 十分之一秒、百分之一秒或毫秒。 |
| `A`, `a` | `'AM'`, `'am'` | 英语中输出大写或小写 `'AM'` / `'PM'`，其他语言输出当地时段标记（如 `'午後'` 或 `'م'`）。 |
| `Z`, `ZZ` | `'-08:00'`, `'-0800'` | 带冒号或不带冒号的 UTC 偏移量。 |
| `z`, `zz` | `'PST'` | 本地化短时区名称。 |
| `zzz`, `zzzz` | `'Pacific Standard Time'` | 本地化完整时区名称。 |
| `X` | `'1794850200'` | 以整秒计的 Unix 时间戳。 |
| `x` | `'1794850200000'` | 以毫秒计的 Unix 时间戳。 |
| `[text]` | `'[at]'` | 转义字面文本，原样复制到输出中。 |
:::

方括号外出现无法识别的字母时，会直接抛出 [`unknownFormat`](/api/errors/#units-zones-and-formats) 错误，而不是把原始字母拼进结果里。占位符紧邻重音字母（如 `'às'`）或混用不同制式的小时字母（如 `'HHhmm'`）同样会抛出错误。单独的 `T` 无需转义即可直接透传，方便拼接 ISO 时间戳。

如果请求了当前类型并不具备的字段，会抛出 [`unsupportedToken`](/api/errors/#units-zones-and-formats) 错误，而不会凭空补出午夜零点。例如，在日历日期上格式化 `'HH:mm'` 这类时钟占位符会立即报错。

核心包还导出 [`monthNames()`](/api/month-names/) 及其星期版本，方便构建本地化的日历表头和月份下拉框：

```js
import { monthNames, weekdayNames } from 'native-dates';

monthNames('short', 'en-US'); // ['Jan', 'Feb', 'Mar', ...]
weekdayNames('short', undefined, 'en-US'); // ['Sun', 'Mon', 'Tue', ...]
weekdayNames('narrow', 'monday', 'en-US'); // ['Mo', 'Tu', 'We', ...]
```

## 注册自定义命名格式

如果应用在多处视图中复用同一个占位符模板或 `Intl` 选项对象，可在 [`configure()`](/api/configure/) 中注册自定义格式名称。命名格式适用于日期、时钟时间、部分日期和范围，且优先级高于内置预设。详见[命名格式](/guides/customization/#named-formats)。

## 格式化范围

所有[范围](/api/ranges/)在传入预设或选项对象时都会交由 `Intl` 格式化，并自动折叠相同的月份或年份。传入占位符模板时，两端点会各自格式化并以 `' – '` 连接：

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');
const shift = timeRange('9:00am', '5:00pm');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
shift.format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

## 相对时间短语

对具体时刻或日历日期调用 [`from()`](/api/date-time/#from) 或 [`fromNow()`](/api/date-time/#fromnow)，即可通过运行时的相对时间格式化器生成本地化短语。[`formatRelative()`](/api/date-time/#formatrelative) 可作为别名使用：

```js
import { date, datetime, now, today } from 'native-dates';

now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
today().plus(1, 'day').fromNow('en-US'); // 'tomorrow'

const anchor = datetime('2026-11-16T12:00', 'UTC');
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'

const currentDay = date('2026-11-16');
currentDay.minus(1, 'day').from(currentDay, 'en-US'); // 'yesterday'
currentDay.plus(14, 'days').from(currentDay, 'en-US'); // 'in 2 weeks'
```

日历日期按整天计量，因此 `from()` 和 `fromNow()` 在七天范围内会自然输出“昨天”“今天”“明天”等说法。具体时刻按实际流逝的时钟时间计量，除“现在”之外均保持数字表达，因为 23 小时前仍可能落在同一个日历日内。

接下来请阅读[解析](/guides/parsing/)，了解如何把外部字符串和各类值安全读入代码。
