---
source: "a8aba5e485f9"
title: legacy-date
lede: 为 `DateTime` 挂载只读的 `Date.prototype` 读取与格式化方法，便于逐步迁移旧代码。
---

## 逐步迁移旧的 Date 调用方

只需导入一次插件，即可在 [`DateTime`](/api/date-time/) 上挂载只读的原型读取方法。依赖原生 `Date` 方法的现有工具函数、格式化逻辑和组件可以直接接收日期时间实例，方便你逐文件迁移。

```js title="legacy-date.js"
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const moment = datetime('2026-09-06T14:30:15.250', 'America/New_York');

moment.getFullYear(); // 2026
moment.getMonth(); // 8（9 月，与原生 Date 一样从 0 开始计数）
moment.getDate(); // 6
moment.getHours(); // 14（按 America/New_York 计算，而非宿主机操作系统时区）
moment.getUTCHours(); // 18
```

原生 JavaScript `Date` 读取本地字段时始终以运行环境的系统时区为准。加载该插件后，`DateTime` 的所有本地读取方法和本地化格式化方法都会改为按实例自身的 `zone` 计算。

:::warning[月份从 0 开始计数，周日为 0]
兼容旧版的读取方法保留原生 `Date` 的编号规则，避免现有调用方静默出错。`getMonth()` 返回 `0` 到 `11`，`getDay()` 以 `0` 表示周日；而核心属性中月份从 `1` 开始计数，星期从周一开始。
:::

## 时区感知与 UTC 读取方法

每个 `DateTime` 实例都提供全部标准的只读读取方法。

| 方法 | 返回类型 | 在 DateTime 上的行为 |
|---|---|---|
| `getTime()` | `number` | 纪元毫秒数，与 `dt.epochMilliseconds` 相同。 |
| `getFullYear()` | `number` | `dt.zone` 下的四位日历年份。 |
| `getMonth()` | `number` | `dt.zone` 下从 0 开始计数的月份，0 表示 1 月，11 表示 12 月。 |
| `getDate()` | `number` | `dt.zone` 下的当月日期，范围为 1 到 31。 |
| `getDay()` | `number` | `dt.zone` 下的星期几，0 表示周日，6 表示周六。 |
| `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()` | `number` | 按 `dt.zone` 计算的时钟时间字段。 |
| `getTimezoneOffset()` | `number` | `dt.zone` 相对 UTC 向西的分钟偏移量，例如 `-04:00` 返回 `240`，`+05:30` 返回 `-330`。 |
| `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()` | `number` | UTC 下的日历字段，保持月份从 0 开始计数且周日为 0。 |
| `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`, `getUTCMilliseconds()` | `number` | UTC 下的时钟时间字段。 |

```js
const kolkata = datetime('2026-01-06T09:00', 'Asia/Kolkata');

kolkata.getTimezoneOffset(); // -330
kolkata.getHours(); // 9
kolkata.getUTCHours(); // 3
```

## 字符串与本地化方法

兼容旧版的字符串方法与原生 `Date` 输出格式一致，同时在本地化格式化时默认采用实例自身的时区。

| 方法 | 返回类型 | 在 DateTime 上的行为 |
|---|---|---|
| `toISOString()` | `string` | 毫秒精度的 UTC 时间戳，即使实例包含亚毫秒级精度也不例外。 |
| `toLocaleString(locales?, options?)` | `string` | 格式化日期与时钟时间，默认使用 `dt.zone` 和 [`dt.locale()`](/api/date-time/#locale)，也可通过参数覆盖。 |
| `toLocaleDateString(locales?, options?)` | `string` | 格式化日期部分，默认使用 `dt.zone` 和 `dt.locale()`，也可通过参数覆盖。 |
| `toLocaleTimeString(locales?, options?)` | `string` | 格式化时钟时间部分，默认使用 `dt.zone` 和 `dt.locale()`，也可通过参数覆盖。 |

```js
const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');

flight.toISOString(); // '2026-09-06T18:30:15.250Z'
flight.toLocaleDateString('en-US'); // '9/6/2026'
flight.toLocaleTimeString('en-US'); // '2:30:15 PM'
flight.toLocaleTimeString('en-US', { timeZone: 'UTC' }); // '6:30:15 PM'
```

## 修改方法会抛出错误

`DateTime` 实例不可变，因此所有原地修改的 setter 方法都会抛出错误，并提示调用方改用 [`set()`](/api/date-time/#set) 或 [`plus()`](/api/date-time/#plus)。

| 分组 | 被拦截的方法 | 不可变替代方案 |
|---|---|---|
| 纪元时间 | `setTime()` | 将纪元毫秒数传入 [`datetime()`](/api/datetime-fn/)。 |
| 本地字段 | `setFullYear()`, `setMonth()`, `setDate()`, `setHours()`, `setMinutes()`, `setSeconds()`, `setMilliseconds()` | 使用 [`dt.set()`](/api/date-time/#set) 替换 `dt.zone` 下的字段。 |
| UTC 字段 | `setUTCFullYear()`, `setUTCMonth()`, `setUTCDate()`, `setUTCHours()`, `setUTCMinutes()`, `setUTCSeconds()`, `setUTCMilliseconds()` | 先通过 [`dt.in('UTC').set()`](/api/date-time/#in) 切换到 UTC 再设置字段。 |

```js
const reminder = datetime('2026-09-06T14:30Z');

try {
  reminder.setHours(9);
} catch (err) {
  err.code; // 'immutable'
}

const updated = reminder.set('hour', 9);
updated.hour; // 9
```

## 何时改用 toJSDate

`DateTime` 不会伪装成 `instanceof Date`，也不会冒充原生 `Date` 的对象标签。如果需要把时间戳传给会校验对象类型或原地修改副本的图表库、数据库驱动或校验器，请直接调用核心库提供的 [`toJSDate()`](/api/date-time/#tojsdate)：

```js
const nativeDate = datetime('2026-09-06T14:30Z').toJSDate();
nativeDate instanceof Date; // true
```
