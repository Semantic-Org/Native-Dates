---
source: "8e9d9ff9bd0c"
title: 范围
lede: 处理两个日期、时钟时间或具体时刻之间的区间，覆盖重叠检测与本地化格式化。
---

[范围](/api/ranges/)用于表示带有起点和终点的时间区间，例如酒店预订、营业时间或会议时段。每种时间类型都有专属的范围类，确保日历日期始终保持为日历日期，时钟时间区间也不会凭空附带一个虚假日期。

## 创建范围

使用 [`dateRange()`](/api/range-fn/)、[`timeRange()`](/api/range-fn/#timerange) 或 [`datetimeRange()`](/api/range-fn/#datetimerange) 直接创建范围。每个工厂函数都接受起止两端点、“起点 + 时长”或单个区间字符串：

```js
import { dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');
const trip = dateRange('2026-09-01', '2026-09-07');
const hours = timeRange('9am - 5pm');
const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
```

如果你手里已有日期、时钟时间或具体时刻实例，可以直接在其上链式调用 [`for()`](/api/ranges/#to)、[`to()`](/api/ranges/#to) 或 [`range()`](/api/ranges/#range)：

```js
import { today } from 'native-dates';

const upcoming = today().for(2, 'weeks');
const thisMonth = today().range('month');
```

## 闭区间日期与左闭右开时钟

日历日期范围包含结束当天，因为“9 月 1 日至 9 月 7 日”指的就是完整的 7 天。日期时间范围和时钟时间范围则采用左闭右开（不含结束边界），从而让首尾相接的时段绝不重叠：

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-09-01', '2026-09-07').duration.days; // 7

const first = timeRange('9:00am', '10:00am');
const second = timeRange('10:00am', '11:00am');
first.overlaps(second); // false
```

当时钟时间范围的终点早于起点时，它会自动跨越午夜回绕，轻松表示夜班或通宵营业时段：

```js
const nightShift = timeRange('22:00', '06:00');

nightShift.contains('02:30'); // true
nightShift.duration.hours; // 8
```

## 包含与重叠判断

调用 [`contains()`](/api/ranges/#contains) 检查某个点或子范围是否落入区间内，调用 [`overlaps()`](/api/ranges/#overlaps) 和 [`intersection()`](/api/ranges/#intersection) 判断两个范围是否重叠并求出交集：

```js
import { dateRange } from 'native-dates';

const booking = dateRange('2026-11-10', '2026-11-18');
const holiday = dateRange('2026-11-15', '2026-11-22');

booking.contains('2026-11-14'); // true
booking.overlaps(holiday); // true
booking.intersection(holiday).toString(); // '2026-11-15/2026-11-18'
```

两个范围不重叠时，`intersection()` 返回 `null`。

## 遍历、计数与拆分范围

调用 [`every()`](/api/ranges/#every) 按步长遍历范围，收集沿途的每个日期、时钟时间或具体时刻。在日期范围上，调用 [`count()`](/api/ranges/#count) 可直接统计总天数、工作日、周末或指定星期几的天数：

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');

sprint.every('week').map(String); // ['2026-05-01', '2026-05-08']
sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('mondays'); // 2
```

如果你需要的是一组子范围而非单个节点（例如把一个班次切分为预约时段，或把一个迭代按周分组），请调用 [`split()`](/api/ranges/#split)：

```js
import { timeRange } from 'native-dates';

const morning = timeRange('9:00am', '12:00pm');
const slots = morning.split(30, 'minutes');

slots.length; // 6
slots[0].toString(); // '09:00:00/09:30:00'
```

## 格式化与序列化

使用预设格式化范围时，运行时会按当前语言环境的规则自动折叠相同的月份和年份。若需明确控制两端点的输出形式，传入占位符模板即可：

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('9:00am', '5:00pm').format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

每个范围都通过 `.duration` 属性提供自身时长，并通过 [`toString()`](/api/ranges/#tostring) 输出 ISO 8601 区间字符串。将该字符串传回对应的工厂函数，即可原样还原范围：

```js
const raw = week.toString(); // '2026-09-01/2026-09-07'
dateRange(raw).equals(week); // true
```
