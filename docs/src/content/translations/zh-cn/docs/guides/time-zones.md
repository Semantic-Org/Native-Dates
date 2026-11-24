---
source: "21708b5b4a6f"
title: 时区
lede: 在任意 IANA 时区下查看具体时刻，并稳妥处理夏令时切换。
---

[`DateTime`](/api/date-time/) 同时记录两件事：具体时刻的发生时间，以及你查看它所用的时区。切换时区相当于换一个视角观察同一时刻，而所有 UTC 偏移量与夏令时规则都由运行平台自动处理。

## 为具体时刻指定时区

创建具体时刻时，可传入 `'America/New_York'` 等 IANA 时区名、`'UTC'` 或固定偏移量：

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const eastCoast = datetime('2026-11-16T12:30', 'America/New_York');
const audit = datetime('2026-11-16T17:30:00Z', 'UTC');

standup.zone; // 'America/Los_Angeles'
standup.offset; // '-08:00'
```

未指定时区时，默认使用已配置的全局时区；若未配置，则回退到运行时的本地时区。

可以在应用启动时调用 [`configure()`](/api/configure/) 设置一次应用级默认时区：

```js
import { configure, now } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
now().zone; // 'Europe/Berlin'
```

## 在其他时区查看同一时刻

调用 [`in()`](/api/date-time/#in) 可在其他城市时区下查看同一时刻。本地日历与时钟属性会随之更新为目标时区的值，底层的真实时间戳保持不变：

```js
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');
const tokyo = standup.in('Asia/Tokyo');

berlin.format('time', 'en-US'); // '6:30 PM'
tokyo.day; // 17
berlin.equals(standup); // true
```

## 偏移量只锁定时刻，不决定时区

来自数据库和 API 的时间字符串常以 `Z` 或数字偏移量结尾。该后缀只用来确定事件发生的精确时刻，新创建的 `DateTime` 仍会使用你指定的目标时区：

```js
import { datetime } from 'native-dates';

const created = datetime('2026-03-07T14:00:00Z', 'America/New_York');
const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');

created.zone; // 'America/New_York'
created.hour; // 9
berlin.hour; // 15
```

一旦需要跨越夏令时加减天数或月份，保留真实的 IANA 时区就至关重要。

固定偏移量不会随季节变化，而 IANA 时区掌握每个地区完整的夏令时切换规则。

:::note[在 UTC 下运算]
如果希望属性读取与日历运算都按 UTC 执行，将 `'UTC'` 作为时区传入即可。无论当前查看的是哪个时区，[`toString()`](/api/date-time/#tostring) 等序列化方法始终输出 UTC 字符串。详见[存储与传输](/guides/storing-and-sending/)。
:::

## 夏令时切换

时钟拨快或拨慢时，日历单位与时钟单位的表现并不相同。2026 年 3 月 8 日，纽约时钟从凌晨 2:00 直接拨快到 3:00，这个周日只有 23 小时。

加 1 天会保持本地上午 9:00 的预约时间不变；加 24 小时则会严格推移 24 个实际流逝的小时：

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
saturday.plus(1, 'day').hoursInDay; // 23
```

:::warning[夏令时拨快导致的缺失时间]
当时钟从凌晨 2:00 跳到 3:00 时，像 2:30 这样的本地时钟时间在该时区根本不存在。请求这种被跳过的本地时间时，Native Dates 不会抛出错误，而是按跳变长度向后顺延。
:::

```js
const skipped = datetime('2026-03-08T02:30', 'America/New_York');
skipped.text; // 'Mar 8, 2026, 3:30 AM EDT'
```

:::details[控制夏令时跳变与回拨行为]
当排班或审计场景对夏令时缺失或重复时间有特定要求时，可向 [`datetime()`](/api/datetime-fn/) 或 `at()` 传入 `disambiguation` 消歧选项。默认值为 `'compatible'`，也支持 `'earlier'`、`'later'` 和 `'reject'`：

```js
const fallBack = datetime('2026-11-01T01:30', {
  zone: 'America/New_York',
  disambiguation: 'later',
});
fallBack.offset; // '-05:00'

datetime('2026-03-08T02:30', {
  zone: 'America/New_York',
  disambiguation: 'reject',
}); // 抛出 RangeError [invalidDateTime]
```
:::

## 城市名称与时区缩写

核心包接受标准 IANA 时区名、`'UTC'` 和固定偏移量。引入 [`@native-dates/plugins/zones`](/plugins/zones/) 后，还可以按城市名称、地区缩写和自定义别名解析时区。

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'los angeles').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'

configure({ zoneAliases: { hq: 'Europe/Berlin' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```

像 CST 和 IST 这类存在歧义的缩写会自动遵循当前语言环境所属地区；北京（Beijing）、孟买（Mumbai）、大阪（Osaka）等主要城市也能直接解析，无需手动配置别名。
