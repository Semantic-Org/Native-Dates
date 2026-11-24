---
source: "cd25f69b961f"
title: 错误
lede: 所有无效输入或不支持的操作都会抛出带有机器可读错误码的标准 Error。
---

## 错误结构

无效调用会立即失败，不会静默返回损坏的日期对象或 `NaN` 污染下游计算。每个抛出的异常都是标准的 JavaScript 错误，并额外附带两个属性：

- **`error.code`**：稳定的小驼峰（camelCase）错误码，例如 `'invalidDate'` 或 `'unknownZone'`。
- **`error.at`**：以字符串形式回显出错的输入值或操作目标，例如 `'2026-02-30'`。

参数类型错误或值类型不匹配会抛出 `TypeError`；不存在的日期、无法解析的字符串、未知单位或时区，以及不支持的操作则会抛出 `RangeError`。

```js title="catch.js"
import { date } from 'native-dates';

try {
  date('2026-02-30');
} catch (error) {
  error instanceof RangeError; // true
  error.code; // 'invalidDate'
  error.at; // '2026-02-30'
}
```

开发环境下，`error.message` 会附带第二行直白的英文提示，说明如何修正调用。当 `NODE_ENV` 设为 `'production'` 时，生产构建会自动剥离这些提示文本，仅保留错误码与输入回显。

## 处理不可信输入

若需针对不同失败原因展示自定义校验提示，可检查 `error.code`，并将未预期的异常继续向外抛出：

```js
import { datetime } from 'native-dates';

function parseTimestamp(raw, zone) {
  try {
    return datetime(raw, zone);
  } catch (error) {
    if (error.code === 'invalidDateTime') {
      return null;
    }
    throw error;
  }
}

parseTimestamp('not-a-date', 'UTC'); // null
```

解析用户填写的表单字段、查询参数或 CSV 单元格，且希望在文本无法识别时返回 `null` 时，可导入 [`@native-dates/plugins/loose`](/plugins/loose/) 并开启宽松模式：

```js
import { date, duration } from 'native-dates';
import '@native-dates/plugins/loose';

date('2026-02-30', { loose: true }); // null
duration('whenever', { loose: true }); // null
```

:::tip[宽松模式下的数据错误与代码错误]
宽松模式仅在输入数据本身无法解析时返回 `null`。调用选项中的代码错误（例如无法识别的时区或起止倒置的范围）依然会抛出异常，避免掩盖程序缺陷。
:::

## TypeError 错误码

`TypeError` 表示必填输入缺失、JavaScript 类型不符，或传入的值不属于预期的时间概念。

| 错误码 | 抛出位置 | 原因 |
|---|---|---|
| `missingDateTime` | `datetime()`、`DateTime` | 输入为 `null` 或 `undefined`。 |
| `missingDate` | `date()`、`CalendarDate` | 输入为 `null` 或 `undefined`。 |
| `missingTime` | `time()`、`Time` | 输入为 `null` 或 `undefined`。 |
| `missingYearMonth` | `yearMonth()`、`monthYear()`、`YearMonth` | 输入为 `null` 或 `undefined`。 |
| `missingMonthDay` | `monthDay()`、`dayMonth()`、`MonthDay` | 输入为 `null` 或 `undefined`。 |
| `invalidDateTime` | `datetime()`、`DateTime` | 输入为不支持的类型，例如布尔值。 |
| `invalidDate` | `date()`、`CalendarDate` | 输入为单个纯数字或不支持的类型。 |
| `invalidTime` | `time()`、`Time` | 输入为不支持的类型。 |
| `invalidYearMonth` | `yearMonth()`、`monthYear()`、`YearMonth` | 输入为单个数字或不支持的类型。 |
| `invalidMonthDay` | `monthDay()`、`dayMonth()`、`MonthDay` | 输入为单个数字或不支持的类型。 |
| `invalidDuration` | `duration()`、`Duration`、`plus()`、`minus()` | 输入为 `null`、`undefined`、不支持的类型，或对已带单位的时长又额外传入了单位。 |
| `unsupportedCalendar` | `yearMonth()`、`monthDay()`、`YearMonth`、`MonthDay` | 输入是采用非 ISO 历法的 `Temporal.PlainYearMonth` 或 `PlainMonthDay`。 |
| `invalidPoint` | `compare()`、`earliest()`、`latest()` | 值不是 `DateTime`、`CalendarDate`、`Time`、`YearMonth`、`Date`、Unix 时间戳、Temporal 时间点或可解析的字符串。 |
| `conflictingKinds` | `compare()`、`earliest()`、`latest()` | 比较不同类型的值，例如将 `CalendarDate` 与 `DateTime` 进行比较。 |
| `invalidRange` | `mergeRanges()` | 加载 [`@native-dates/plugins/ranges`](/plugins/ranges/) 后，传入了不可迭代的值或非范围实例的条目。 |
| `conflictingRanges` | `DateRange`、`DateTimeRange`、`TimeRange`、`subtract()`、`union()`、`mergeRanges()` | 将一种范围传给另一种范围的构造函数、工厂函数或集合运算。 |

## RangeError 错误码

`RangeError` 表示值无法解析、超出有效边界，或请求了不支持的单位、时区或操作。

### 解析与取值

| 错误码 | 抛出位置 | 原因 |
|---|---|---|
| `invalidDateTime` | `datetime()`、`DateTime` | 字符串无法解析为日期时间，或字段包含越界值（如 2 月 30 日）。 |
| `invalidDate` | `date()`、`CalendarDate` | 字符串无法解析为日期、数字包含小数，或字段越界。 |
| `missingDay` | `date()`、`CalendarDate` | 数字形式的 `(year, month)` 调用缺少 `day` 参数。 |
| `invalidTime` | `time()`、`Time` | 字符串无法解析为时钟时间、12 小时制小时数超出 1 到 12，或时钟字段越界。 |
| `invalidYearMonth` | `yearMonth()`、`monthYear()`、`YearMonth` | 字符串无法解析为年月、数字包含小数，或月份超出 1 到 12。 |
| `invalidMonthDay` | `monthDay()`、`dayMonth()`、`MonthDay` | 字符串无法解析为月日、向 `equals()` 传入了含歧义分隔符的字符串，或字段越界。 |
| `invalidYear` | `MonthDay.in()` | 传给 `in()` 的年份不是整数，或超出 Temporal 支持的年份范围。 |
| `invalidDay` | `YearMonth.on()` | 传给 `on()` 的日不是 1 到 31 之间的整数。 |
| `invalidDuration` | `duration()`、`Duration` | 空字符串或无法解析的英文时长短语、无效的 ISO 8601 时长，或时长字段越界。 |
| `invalidNumber` | `datetime()`、`duration()`、单位辅助函数 | 数值输入为 `NaN`、`Infinity`、`-Infinity`，或无效的 `Date` 实例。 |
| `conflictingSigns` | `duration()`、`Duration`、`minus()` | 时长混杂了无法直接抵消借位的正负单位，例如 `'1h -30m'` 或缺少参考锚点时用天数减去小时数。 |
| `invalidFraction` | `duration()`、`months()`、`times()` | 小数月或小数纳秒无法换算为更小的固定单位。 |

### 单位、时区与格式

| 错误码 | 抛出位置 | 原因 |
|---|---|---|
| `unknownUnit` | 运算、边界、舍入、`set()`、`duration()` | 无法识别的单位名称或缩写。 |
| `unknownDayOfWeek` | `dayOfWeek()`、`next()`、`previous()`、周边界、`configure()` | 无法识别的星期名称，或星期数字超出 1 到 7。 |
| `unknownSetting` | `configure()` | 传给 `configure()` 的配置键无法识别。 |
| `unknownWidth` | `configure()` | `weekdayNames` 条目指定了 `narrow`、`short`、`long` 之外的宽度，或缺少宽度键。 |
| `unknownZone` | 工厂函数、`in()`、`configure()` | 未知的 IANA 时区标识、非字符串时区，或格式错误的 UTC 偏移量。 |
| `invalidZoneAliases` | `configure()` | `zoneAliases` 既不是普通对象也不是 `null`。 |
| `unknownLocale` | `locale()`、工厂函数、`format()`、`monthNames()`、`weekdayNames()`、`configure()` | 区域标签、标签列表或 `Accept-Language` 请求头包含无效的语言标签。 |
| `unknownFormat` | `format()`、`monthNames()`、`weekdayNames()` | 无效的格式说明或 `Intl` 选项、不支持的时长或标签样式，或方括号 `[...]` 外存在无法识别或粘连的占位符。 |
| `unsupportedToken` | `format()` | 占位符模板请求了当前值不存在的字段，例如对 `CalendarDate` 使用 `HH` 或对 `Time` 使用 `YYYY`。 |
| `unknownKind` | `as()`、`DateRange.count()` | 当前对象不支持目标类型。 |

### 运算与度量

| 错误码 | 抛出位置 | 原因 |
|---|---|---|
| `unsupportedUnit` | `CalendarDate`、`Time`、`YearMonth` | 对 `CalendarDate` 使用时钟单位、对 `Time` 使用日历单位，或对 `YearMonth` 使用小于月的单位。 |
| `cannotAdd` | `plus()`、`add()` | 加法结果溢出 Temporal 可表示的日期范围。 |
| `cannotSubtract` | `minus()`、`subtract()` | 减法结果溢出 Temporal 可表示的日期范围。 |
| `cannotSet` | `set()` | 字段值为小数，或超出该日历月份或时钟单位的有效范围。 |
| `cannotRound` | `round()`、`floor()`、`ceil()`、`Time.startOf()`、`Time.startOfNext()`、`Time.startOfPrevious()` | 不支持的舍入单位，或步长不能整除上一级单位。 |
| `missingAnchor` | `Duration.balance()`、`total()`、`compare()` | 无锚点时长缺少参考起始日期，无法将月或年换算为周、天或时钟单位。 |
| `cannotBalance` | `Duration.balance()` | 对时长执行进位换算时发生溢出，或 Temporal 舍入失败。 |
| `cannotTotal` | `Duration.total()`、`until()`、`since()` | 计算总长度时发生溢出，或使用了不支持的单位。 |
| `missingPoints` | `earliest()`、`latest()` | 调用时未传参数或传入了空数组。 |
| `unsupportedComparison` | `CalendarDate`、`Time`、`YearMonth`、`MonthDay`、范围 | 对没有 Unix 时间戳数值的类型执行 `valueOf()`、一元 `+`、`-`、`<` 或 `>` 等数值强制转换。 |

### 范围

| 错误码 | 抛出位置 | 原因 |
|---|---|---|
| `invalidRange` | `DateRange`、`DateTimeRange`、`to()` | 范围的 `end` 早于 `start`。 |
| `invalidStep` | `every()`、`split()` | 传给 `every()` 或 `split()` 的步长时长为零或负数。 |
| `unsupportedIntersection` | `TimeRange.intersection()` | 两个跨午夜的时钟时间范围在午夜两侧产生两个分离的重叠区间。 |
| `unsupportedUnion` | `TimeRange.union()`、`mergeRanges()` | 时钟时间范围覆盖了全部 24 小时，无法用单个 `TimeRange` 表示。 |
| `unsupportedZone` | `TimeRange.in()` | 对 `TimeRange` 调用 `in()`（时钟时间范围不含日历日期，无法放入具体时区）。 |

### 插件

| 错误码 | 抛出位置 | 原因 |
|---|---|---|
| `missingPlugin` | 工厂函数、`configure()` | 在导入对应插件前使用了 `loose`、`dayFirst`、`format` 或 `zoneAliases`。 |
| `missingTemporal` | 工厂函数、构造函数、`configure({ zone })` | 仅在开发环境抛出的提示：缺少 `globalThis.Temporal` 且尚未加载 `@native-dates/polyfill`（生产构建会移除此检查，改由运行时直接抛出原生 `ReferenceError`）。 |
| `immutable` | `DateTime` 旧版 `Date` setter | 加载 [`@native-dates/plugins/legacy-date`](/plugins/legacy-date/) 后调用了会修改原值的 `Date` setter（如 `setHours()`）。 |
