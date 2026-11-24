---
source: "6291509fd7f2"
title: 年月与月日
lede: 分别表示不含“日”的年月，以及不含“年”的周期性生日或纪念日。
---

在原生 JavaScript 中，存银行卡有效期往往要在末尾硬拼一个虚假的 1 号，存不带出生年份的生日则要借用 2000 年这样的占位闰年。[`YearMonth`](/api/year-month/) 和 [`MonthDay`](/api/month-day/) 只存储实际存在的字段。

## 账单月份与银行卡有效期

ISO 字符串或“年、月”数字用 [`yearMonth()`](/api/year-month-fn/) 解析，形如 `11/28` 的银行卡有效期用 [`monthYear()`](/api/year-month-fn/#monthyear) 解析：

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

用 [`contains()`](/api/year-month/#contains) 检查某天是否落在该月内，用 [`plus()`](/api/year-month/#plus) 按月或季度推进，用 [`on()`](/api/year-month/#on) 选定该月内的具体某一天：

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

传入 31 号时，较短的月份会自动限制到月末最后一天，闰年 2 月则会落到 2 月 29 日。

## 生日与年度节假日

月在前的字符串用 [`monthDay()`](/api/month-day-fn/)，日在前的字符串用 [`dayMonth()`](/api/month-day-fn/#daymonth)。字段顺序由函数名明确决定，因此 `05/10` 在任何地区都不会产生歧义：

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

调用 [`next()`](/api/month-day/#next) 和 [`previous()`](/api/month-day/#previous)，可以从今天或任意参考日期出发，找到下一次或上一次出现的日期：

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

2 月 29 日在平年会自动落到 2 月 28 日。调用 [`fallsOn()`](/api/month-day/#fallson) 可判断给定日期是否匹配：

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## 在年月、月日与完整日期之间转换

你可以直接读取任意日期或具体时刻的 `.yearMonth` 与 `.monthDay` 属性，或在链式调用中使用 [`as()`](/api/date-time/#as)：

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

反向转换时，对年月调用 `on()` 传入日，或对月日调用 [`in()`](/api/month-day/#in) 传入年，即可得到完整的日历日期。

## 格式化与存储

两种类型都支持通过 `.text` 和 [`format()`](/api/year-month/#format) 进行格式化，并通过 [`toString()`](/api/year-month/#tostring) 转为 ISO 字符串：

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

像 `2026-11` 和 `10-17` 这样的字符串可直接存入数据库或放进 URL，读取时再原样传回 `yearMonth()` 和 `monthDay()` 即可。
