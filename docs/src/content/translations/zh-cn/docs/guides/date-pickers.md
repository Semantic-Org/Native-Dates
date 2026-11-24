---
source: "9de557f3ce5d"
title: 日期选择器与 UI
lede: 将浏览器原生输入控件与日期选择器接入 Native Dates，同时把旧版 Date 组件隔离在 UI 边界处。
---

在应用状态与业务逻辑中，始终保留 Native Dates 的值类型。

只在组件边界处（浏览器输入控件或第三方组件需要接收数据时）再转换为 ISO 字符串或原生 JavaScript `Date`。这样就能把时区规则、日历运算与 UI 库的特有行为隔离开来。

## 原生 HTML 输入控件

浏览器原生的日期与时间控件直接读写标准 ISO 字符串，无需引入第三方选择器，也绝不会因时区换算导致日历日期偏移一天。

| 控件 | 写入输入框 | 读回核心类型 |
|---|---|---|
| `<input type="date">` | `d.toString()` | 将非空字符串传入 [`date()`](/api/date-fn/)，得到不含时区的日历日期。 |
| `<input type="time">` | `t.format('HH:mm')`，或配合 `step="1"` 使用 `t.toString()` | 将 `value` 传入 [`time()`](/api/time-fn/)，得到不含时区的时钟时间。 |
| `<input type="month">` | `ym.toString()` | 将 `value` 传入 [`yearMonth()`](/api/year-month-fn/)，表示账单周期或卡片有效期。 |
| `<input type="datetime-local">` | `dt.format('YYYY-MM-DDTHH:mm')` | 将 `value` 与时区传入 [`datetime()`](/api/datetime-fn/)，得到具体时刻。 |

将应用状态绑定到输入框的值和可选范围上，发生变更时再将字符串传回对应的工厂函数解析：

```js
import { date, time, today, yearMonth } from 'native-dates';

const due = date('2026-11-16');
const opens = time('9:30am');
const billing = yearMonth('2026-11');

// <input type="date" value={due.toString()} min={today().toString()}>
due.toString(); // '2026-11-16'

// <input type="time" value={opens.format('HH:mm')}>
opens.format('HH:mm'); // '09:30'

// <input type="month" value={billing.toString()}>
billing.toString(); // '2026-11'
```

如果表单用两个独立输入框分别收集日期和时钟时间，让每个控件各自绑定对应的类型；需要组合为具体时刻时，再通过 [`at()`](/api/calendar-date/#at) 拼接：

```js
const rawDate = '2026-11-16';
const rawTime = '09:30';

const day = rawDate ? date(rawDate) : null;
const clock = rawTime ? time(rawTime) : null;
const startsAt = day && clock ? day.at(clock, 'America/Los_Angeles') : null;

startsAt?.toString(); // '2026-11-16T17:30:00.000Z'
```

:::warning[解析前先拦截空输入]
清空 HTML 输入框会得到空字符串，在支持手动输入文本的选择器里键入内容也可能产生无效的 `Date`。调用工厂函数前务必先检查空值或 `NaN`，因为核心包会直接抛出错误，而不会默认回退到今天。
:::

## React Day Picker

React Day Picker 使用本地午夜的原生 JavaScript `Date` 表示选中的日期。状态里保持 [`CalendarDate`](/api/calendar-date/)，只在 props 边界处做转换：

```jsx
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { date, today } from 'native-dates';

function DueDateField() {
  const [due, setDue] = useState(() => date('2026-11-16'));

  return (
    <DayPicker
      mode="single"
      selected={due?.toJSDate()}
      disabled={{ before: today().toJSDate() }}
      onSelect={(picked) => setDue(picked ? date(picked) : null)}
    />
  );
}
```

对于日期范围选择，可以写两个简短的转换函数，在状态里继续保存 [`DateRange`](/api/ranges/)。用户还在选择区间终点时，结束日期可能是 `undefined`，也可能与起始日期相同，用 `picked.to ?? picked.from` 兜底即可保证范围始终有效：

```js
import { date, dateRange } from 'native-dates';

function toPickerRange(range) {
  if (!range) return undefined;
  return { from: range.start.toJSDate(), to: range.end.toJSDate() };
}

function fromPickerRange(picked) {
  if (!picked?.from) return null;
  return dateRange(date(picked.from), date(picked.to ?? picked.from));
}

const stay = dateRange('2026-11-16', '2026-11-20');
const pickerValue = toPickerRange(stay);
const restored = fromPickerRange(pickerValue);

restored.count('days'); // 5
restored.toString(); // '2026-11-16/2026-11-20'
```

默认情况下，[`toJSDate()`](/api/calendar-date/#tojsdate) 和 `date()` 都会跟随浏览器所在时区。如果你的应用通过 [`configure()`](/api/configure/) 覆盖了默认时区，请把浏览器当前时区显式传给这两处调用，确保日历网格与选中的日期保持对齐：

```js
const host = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pickerDate = due.toJSDate(host);
const picked = date(pickerDate, host);
```

## MUI X 与基于 Date 的选择器

配合 `AdapterDateFns` 使用时，MUI X Date Pickers 会通过 `value` 和 `onChange` 属性传递原生 JavaScript `Date`。把适配器收口在 `LocalizationProvider` 与一层薄封装组件里，就能把旧版 `Date` 挡在应用状态之外。

支持手动输入文本的选择器每次按键都会触发变更回调，用户还没输完时会传来无效的 `Date`。转换前先用 `Number.isNaN()` 检查一下：

```jsx
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { date, today } from 'native-dates';

function CalendarDatePicker({ value, onChange, ...props }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        {...props}
        value={value ? value.toJSDate() : null}
        minDate={today().toJSDate()}
        onChange={(next) => {
          if (!next || Number.isNaN(next.getTime())) {
            onChange(null);
            return;
          }
          onChange(date(next));
        }}
      />
    </LocalizationProvider>
  );
}
```

日期时间选择器也可以沿用同样的边界辅助函数，并向 [`datetime()`](/api/datetime-fn/) 显式传入 IANA 时区，让返回的具体时刻始终绑定在目标时区上：

```js
import { datetime } from 'native-dates';

function fromPickerMoment(next, zone) {
  if (!next || Number.isNaN(next.getTime())) return null;
  return datetime(next, zone);
}

const meeting = fromPickerMoment(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
meeting.format('short', 'en-US'); // '11/16/26, 9:30 AM'
```

## 表单与校验 Schema

使用 React Hook Form、Zod 这类表单工具时，让字段在编辑阶段保持字符串形态，在 schema 校验环节再解析成带类型的值，整个流程最顺畅。

对于严格输出 ISO 格式的输入控件，可以直接在 schema 中转换字符串，并在解析后的类型上编写业务校验规则：

```js
import { z } from 'zod';
import { date } from 'native-dates';

const isoDate = z.string().transform((raw, ctx) => {
  try {
    return date(raw);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid YYYY-MM-DD date' });
    return z.NEVER;
  }
});

const bookingSchema = z
  .object({ checkIn: isoDate, checkOut: isoDate })
  .refine(({ checkIn, checkOut }) => checkOut.isAfter(checkIn), {
    message: 'Check-out must come after check-in',
    path: ['checkOut'],
  });
```

如果允许用户在文本框中输入 `Nov 16, 2026` 这类非正式日期，可加载 [loose 插件](/plugins/loose/)并传入 `{ loose: true }`。无法识别的字符串会直接返回 `null` 而非抛出异常，省去额外的 `try/catch` 代码块：

```js
import '@native-dates/plugins/loose';
import { date, isCalendarDate } from 'native-dates';

function parseTypedDate(raw, locale = 'en-US') {
  const parsed = date(raw, { loose: true, locale });
  return isCalendarDate(parsed) ? parsed : null;
}

parseTypedDate('Nov 16, 2026')?.toString(); // '2026-11-16'
parseTypedDate('not a date'); // null
```

校验已经解析完成的状态对象时，[`isCalendarDate()`](/api/kind-of/) 和 `isDateTime()` 等类型守卫函数也能直接接入自定义 schema 规则。

## 图表、表格与只读 Date 视图

图表与数据表格组件常通过 `getTime()`、`getHours()` 等原生方法读取时间戳。

在应用启动时导入一次 [legacy-date 插件](/plugins/legacy-date/)，即可将这些只读访问方法挂载到 [`DateTime`](/api/date-time/) 上。本地字段读取方法会按实例自身的时区求值，而非宿主机器的时区；所有会修改原值的 setter 则会直接抛出错误：

```js
import '@native-dates/plugins/legacy-date';
import { compare, datetime } from 'native-dates';

const rows = [
  { id: 'b', createdAt: datetime('2026-11-16T18:00:00Z', 'America/New_York') },
  { id: 'a', createdAt: datetime('2026-11-16T14:30:00Z', 'America/New_York') },
];

// 将 DateTime 值传给只读 Date 访问方法
rows[0].createdAt.getHours(); // 13
rows[0].createdAt.getTime(); // 1794852000000

// 按任意单一核心类型对数据行排序
const sorted = [...rows].sort((a, b) => compare(a.createdAt, b.createdAt));
sorted[0].id; // 'a'
```

在表格排序比较函数中调用 [`compare()`](/api/compare/)，即可对存放单一核心类型（例如全是日历日期或全是具体时刻）的列进行排序。若在同一次比较中混用不同类型，会直接抛出错误。

:::tip[当组件检查 instanceof Date 时]
`legacy-date` 插件只扩展 `DateTime`，不会伪造原生 `Date` 的类型身份。如果图表或表格组件会检查对象实例类型，或原地修改日期对象，请在数据边界处改传 `dt.toJSDate()` 或 `dt.epochMilliseconds`。
:::

## 提交到 API 与数据库

表单值在 UI 边界完成解析后，直接传入 `JSON.stringify()` 即可，无需手动转换。关于 ISO 传输格式，以及如何通过工厂函数将 JSON 或数据库记录还原为对应值，请参阅[存储与传输](/guides/storing-and-sending/)。
