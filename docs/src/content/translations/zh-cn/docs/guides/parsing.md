---
source: "326d94af83a9"
title: 解析
lede: 将 ISO 字符串、时长、范围及宽松用户输入准确解析为对应类型，拒绝静默猜测。
---

核心包可直接将标准、无歧义的输入解析为你指定的类型：

- [`datetime()`](/api/datetime-fn/)：解析具体时刻、纪元毫秒数与时间戳
- [`date()`](/api/date-fn/)：解析不含时钟时间与时区的日历日期
- [`time()`](/api/time-fn/)：解析 24 小时制和 12 小时制的时钟时间
- [`duration()`](/api/duration-fn/)：解析英文单位短语和 ISO 8601 时长
- [`yearMonth()`](/api/year-month-fn/) 与 [`monthDay()`](/api/month-day-fn/)：解析账单月份、银行卡有效期和每年生日
- [`dateRange()`](/api/range-fn/#daterange)、[`datetimeRange()`](/api/range-fn/#datetimerange) 与 [`timeRange()`](/api/range-fn/#timerange)：解析区间字符串与起止端点对

## ISO 日期与时间戳

向 `date()` 传入年-月-日顺序的日期字符串、年/月/日三个数字，或字段对象即可。年-月-日顺序的字符串支持补零或一位数的月和日，分隔符可以是除拉丁字母和冒号之外的任意字符。中文、日文、韩文以及带空格的点分日期均可由核心包直接解析。

月份从 1 到 12 计数。2 月 30 日这类不存在的日历日期，以及 `'2026-W05-1'` 这类 ISO 周或季度字符串都会直接抛出错误，绝不猜测。

```js
import { date } from 'native-dates';

date('2026-11-16');
date('2026/11/6');
date('2026年11月16日');
date('2026. 11. 16.');
date(2026, 11, 16);
date({ year: 2026, month: 11, day: 16 });
```

向 `datetime()` 传入 ISO 8601 字符串或字段对象。末尾带有 `Z` 或数字偏移量的字符串会锁定精确时刻，不带偏移量的字符串则按目标时区的本地时间解读。

```js
import { datetime } from 'native-dates';

datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30[Europe/Berlin]'); // 9:30 AM CET
datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
```

将带偏移量的时间戳传给 `date()` 或 `time()` 时，会按你指定的时区提取对应的日历日期或本地时钟时间：

```js
import { time } from 'native-dates';

date('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 2026-11-16
date('2026-11-17T01:30:00Z', 'Asia/Tokyo'); // 2026-11-17
time('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 17:30:00
```

## 时钟时间与时长

向 `time()` 传入 24 小时制 ISO 时间、形如 `'14h30'` 的时分字符串、12 小时制时间字符串、数字参数或字段对象。单独的小时写法（如 `'14h'`）仍会抛出错误，以免与时长混淆。

```js
import { time } from 'native-dates';

time('09:30');
time('14h30');
time('9:30am');
time('5:15 PM');
time(17, 15, 30);
time({ hour: 9, minute: 30 });
```

向 `duration()` 传入易读的英文单位短语、ISO 8601 时长字符串、“数量 + 单位”或字段对象。

```js
import { duration } from 'native-dates';

duration('1h 30m');
duration('2 weeks and 3 days');
duration('PT90M');
duration(90, 'minutes');
duration({ hours: 1, minutes: 30 });
```

## 部分日期与范围

ISO 年月字符串交给 [`yearMonth()`](/api/year-month-fn/)，月份在前的银行卡有效期交给 [`monthYear()`](/api/year-month-fn/#monthyear)：

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

yearMonth('2026-11');
monthYear('11/28'); // YearMonth(2028-11)

monthDay('10/17');
dayMonth('17/10'); // MonthDay(10-17)
```

不带年份的周期性日期同样通过 [`monthDay()`](/api/month-day-fn/) 和 [`dayMonth()`](/api/month-day-fn/#daymonth) 解析。至于时间区间，[范围工厂函数](/api/range-fn/)既支持两个端点，也支持单个区间字符串：

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01/2026-11-07');
timeRange('9am - 5pm');
```

## 纪元时间戳、Date 与 Temporal

纪元毫秒数、原生 JavaScript `Date` 以及 [Temporal](/guides/temporal/) 对象都可直接传入 `datetime()`。

向日期工厂函数传入纯数字会因存在歧义而抛出错误。请先在目标时区下把纪元毫秒数转为具体时刻，再读取其日历日期。

```js
import { date, datetime } from 'native-dates';

const fromEpoch = datetime(1794850200000, 'UTC');
const fromJSDate = datetime(new Date('2026-11-16T17:30:00Z'));
const localDay = date(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
```

## 为何歧义字符串会抛出错误

四位年份在前的日期只有唯一读法，而 `'03/05/2026'` 在美国表示 3 月 5 日，在欧洲和拉丁美洲却表示 5 月 3 日。核心包直接拒绝这类有歧义的数字字符串，避免线上静默解析出错误的月份。

:::warning[空值绝不默认回退为当前时间]
向任何工厂函数传入空值都会抛出错误，而不会返回当前日期，从而防止缺失的 API 字段悄悄被当成今天。需要当前时间时，请显式调用 [`now()`](/api/datetime-fn/#now) 或 [`today()`](/api/date-fn/#today)。
:::

## 用 loose 插件解析用户输入

需要解析用户自由输入的文本、CSV 导出内容或 RFC 2822 邮件头时，引入 [`@native-dates/plugins/loose`](/plugins/loose/) 并传入 `{ loose: true }`。宽松模式会按当前语言环境的书写习惯解读日期与时钟时间，支持本地化月份名称、时段词、点分时钟和非 ASCII 数字。

```js
import '@native-dates/plugins/loose';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('Nov 16, 2026', { loose: true }); // 2026-11-16
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // 2026-11-16
datetime('Mon, 16 Nov 2026 17:30:00 GMT', { loose: true });
time('오후 2:30', { loose: true, locale: 'ko' }); // 14:30:00
yearMonth('Nov 2026', { loose: true }); // 2026-11
monthDay('17 février', { loose: true, locale: 'fr' }); // 02-17
```

斜杠和点号分隔的数字日期默认遵循当前语言环境的顺序。当输入顺序与当前语言环境不同时，可在单次调用中传入 `dayFirst`，或在[应用配置](/api/configure/)中全局设定。

```js
date('03/05/2026', { loose: true, locale: 'en-US' }); // 2026-03-05
date('03/05/2026', { loose: true, locale: 'fr' }); // 2026-05-03
date('03/05/2026', { loose: true, locale: 'en-US', dayFirst: true }); // 2026-05-03
```

在宽松模式下，所有工厂函数和范围在遇到无法解析的输入时都会返回 `null` 而非抛出错误。但传入无效的选项值（例如未知的时区名称）仍然会抛出错误。

```js
import { duration } from 'native-dates';

date('not a date', { loose: true }); // null
duration('soon', { loose: true }); // null
```

如果输入采用已知的固定非 ISO 格式（例如 CSV 导出的 `'24112026'`、服务端日志、ISO 周日期或序数日期），可导入 [`@native-dates/plugins/parse`](/plugins/parse/) 并传入 `{ format }`，以确定的占位符匹配替代启发式解析。

```js
import '@native-dates/plugins/parse';
import { date, datetime } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }); // 2026-11-24
datetime('24/Nov/2026:12:40:01 -0500', { format: 'DD/MMM/YYYY:HH:mm:ss ZZ' });
```
