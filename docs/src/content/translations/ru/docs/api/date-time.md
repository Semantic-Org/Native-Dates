---
source: 62b87452c7ee
title: DateTime
lede: Конкретный момент времени в определённом часовом поясе.
---

## Создание DateTime

Создайте экземпляр из существующего значения через [`datetime()`](/api/datetime-fn/), получите текущий момент через [`now()`](/api/datetime-fn/#now) или объедините календарную дату со временем суток методом [`at()`](/api/calendar-date/#at). Экземпляры неизменяемые, поэтому каждый метод, меняющий значение, возвращает новый экземпляр.

```js title="create.js"
import { date, datetime, now } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const current = now();
```

Передайте часовой пояс, чтобы получить дату и время в этом поясе, или опустите его — тогда используется пояс по умолчанию из [`configure()`](/api/configure/):

```js
const event = datetime('2026-11-16T17:30:00Z', 'America/New_York');
event.zone; // 'America/New_York'
event.hour; // 12
```

:::note[Смещения задают момент, а не часовой пояс]
Символ `Z` или числовое смещение в конце входной строки определяют, когда именно наступил момент времени, тогда как сам экземпляр использует переданный часовой пояс или пояс по умолчанию из конфигурации. Передайте `'UTC'` в качестве часового пояса, если вам нужны поля и арифметика в UTC.
:::

## Свойства

Свойства возвращают дату и время в часовом поясе экземпляра.

| Свойство | Тип | Описание |
|---|---|---|
| `text` | `string` | Дата, время суток и краткое обозначение часового пояса в формате активной локали, например `'Nov 16, 2026, 9:30 AM PST'`. |
| `year`, `month`, `day` | `number` | Календарный год, месяц (1–12) и день месяца (1–31). |
| `hour`, `minute`, `second` | `number` | Поля 24-часового времени (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Доли секунды (0–999). |
| `zone` | `string` | Канонический идентификатор часового пояса IANA или фиксированное смещение, например `'America/Los_Angeles'` или `'UTC'`. |
| `offset` | `string` | Действующее смещение UTC в этот момент времени, например `'-08:00'`. |
| `epochSeconds` | `number` | Целое число секунд с начала эпохи Unix с округлением вниз (`Math.floor`). |
| `epochMilliseconds` | `number` | Число миллисекунд с начала эпохи Unix. |
| `epochNanoseconds` | `bigint` | Точное число наносекунд с начала эпохи Unix. |
| `date` | [`CalendarDate`](/api/calendar-date/) | Календарная дата в этом часовом поясе. |
| `time` | [`Time`](/api/time/) | Время суток в этом часовом поясе. |
| `yearMonth` | [`YearMonth`](/api/year-month/) | Календарный год и месяц в этом часовом поясе. |
| `monthDay` | [`MonthDay`](/api/month-day/) | Календарный месяц и день в этом часовом поясе. |
| `dayOfWeek` | `number` | День недели по ISO: от 1 (понедельник) до 7 (воскресенье). |
| `weekStart` | `number` | Первый день недели для этого момента (от 1 до 7) согласно [`configure()`](/api/configure/) или активной локали. |
| `quarter` | `number` | Календарный квартал (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | Номер недели по ISO (1–53) и день года (1–366). |
| `daysInMonth`, `daysInYear`, `hoursInDay` | `number` | Число дней в текущем месяце и году, а также число часов в локальном календарном дне. |

## Часовой пояс и поля

Переводите один и тот же момент в другой часовой пояс или заменяйте отдельные поля даты и времени.

:::entry
### `in()` :kind[method]

```js signature
dt.in(zone): DateTime
```

Возвращает новый экземпляр `DateTime` для того же момента времени в другом часовом поясе. Локальные свойства даты и времени суток обновляются под целевой часовой пояс, а сам момент времени остаётся прежним.

**Параметры**

```params
- name: zone
  type: Zone
  required: true
  description: Идентификатор часового пояса IANA (например, `'Europe/Berlin'`), фиксированное смещение UTC или `'UTC'`.
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` для того же момента времени в часовом поясе `zone`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.hour; // 18
berlin.equals(standup); // true
```
:::

:::entry
### `at()` :kind[method]

```js signature
dt.at(time): DateTime
```

Возвращает новый экземпляр `DateTime` на тот же день и в том же часовом поясе, но с другим временем суток.

**Параметры**

```params
- name: time
  type: TimeInput
  required: true
  description: Строка времени (например, `'9:30am'`), экземпляр `Time`, объект полей времени или `Date`.
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` на ту же дату со временем суток `time`.
```

```js
const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const wrapUp = morning.at('5:00pm');

wrapUp.hour; // 17
```
:::

:::entry
### `set()` :kind[method]

```js signature
dt.set(fields): DateTime
dt.set(unit, value): DateTime
```

Возвращает новый экземпляр `DateTime` в текущем часовом поясе с заменёнными календарными полями или полями времени. Несуществующие даты вроде 30 февраля выбрасывают `RangeError`, а не переходят на следующий месяц. Если изменить `month` или `year`, не передавая `day`, выходящий за границы день ограничивается последним днём целевого месяца.

**Параметры**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Объект с календарными полями или полями времени либо английское название одной единицы при передаче `value`.
- name: value
  type: number
  description: Целочисленное значение для указанной единицы `unit`.
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` в том же часовом поясе с обновлёнными полями.
```

```js
const cutoff = datetime('2026-11-16T09:30', 'America/New_York');

cutoff.set('hour', 17);
cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
```
:::

## Арифметика и округление

Прибавление дней, недель, месяцев или лет сохраняет то же время суток при переходе на летнее или зимнее время. Прибавление часов, минут или секунд отсчитывает точное прошедшее время.

:::entry
### `plus()` :kind[method]

```js signature
dt.plus(amount, unit?): DateTime
dt.add(amount, unit?): DateTime
```

Смещает момент времени вперёд на заданную длительность и возвращает новый экземпляр `DateTime` в том же часовом поясе. Также доступен псевдоним `add()`.

**Параметры**

```params
- name: amount
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, строка с английской фразой длительности или ISO 8601, объект полей либо миллисекунды.
- name: unit
  type: Unit
  description: Английское название единицы, если `amount` — число (например, `'days'` или `'hours'`).
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` в том же часовом поясе.
```

```js
// Выходные с переходом на летнее время в Нью-Йорке (8 марта длится 23 часа)
const sat = datetime('2026-03-07T09:00', 'America/New_York');

sat.plus(1, 'day').hour; // 9
sat.plus(24, 'hours').hour; // 10
sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dt.minus(amount, unit?): DateTime
dt.subtract(amount, unit?): DateTime
```

Смещает момент времени назад на заданную длительность в том же часовом поясе. Принимает те же аргументы, что и [`plus()`](#plus); также доступен псевдоним `subtract()`.

**Параметры**

```params
- name: amount
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, английская фраза длительности, строка ISO 8601 или объект полей.
- name: unit
  type: Unit
  description: Английское название единицы, если `amount` — число.
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` в том же часовом поясе.
```

```js
const deadline = datetime('2026-11-16T17:00', 'America/New_York');

deadline.minus(48, 'hours');
deadline.minus({ weeks: 1, days: 2 });
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
dt.startOf(unit, firstDay?): DateTime
```

Возвращает начало календарной единицы или единицы времени в этом часовом поясе. Границы недели определяются аргументом `firstDay`, настройкой `weekStart` из [`configure()`](/api/configure/) или активной локалью этого момента.

**Параметры**

```params
- name: unit
  type: Unit
  required: true
  description: Английское название календарной единицы или единицы времени от `'year'` до `'millisecond'`.
- name: firstDay
  type: DayOfWeek
  description: Первый день недели при выравнивании по неделе — английское название (например, `'sunday'`) или номер ISO (например, `7`).
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` в начале единицы `unit`.
```

```js
const wed = datetime('2026-11-18T14:45:12', 'America/New_York').locale('en-US');

wed.startOf('day').format('time'); // '12:00 AM'
wed.startOf('week').day; // 15
wed.startOf('week', 'monday').day; // 16
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
dt.endOf(unit, firstDay?): DateTime
```

Переходит к последней миллисекунде календарной единицы или единицы времени в этом часовом поясе.

**Параметры**

```params
- name: unit
  type: Unit
  required: true
  description: Английское название календарной единицы или единицы времени от `'year'` до `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` в последнюю миллисекунду единицы `unit`.
```

```js
const nov = datetime('2026-11-18T14:45', 'UTC');

nov.endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
dt.startOfNext(unit, firstDay?): DateTime
```

Переходит вперёд к началу календарной единицы или единицы времени, следующей за той, в которой находится этот момент, в этом же часовом поясе. Результат всегда позже исходного момента, поэтому для полуночи следующий день начнётся в следующую полночь.

Передайте английское название дня недели вместо единицы, чтобы получить начало ближайшего следующего дня с этим названием. Метод [`next()`](#next) находит тот же день, но сохраняет время суток.

**Параметры**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: Английское название календарной единицы или единицы времени от `'year'` до `'nanosecond'` либо английское название дня недели (например, `'wednesday'`).
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` в начале следующей единицы `unit` или следующего указанного дня недели.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfNext('month').text; // 'Dec 1, 2026, 12:00 AM EST'
standup.startOfNext('hour').text; // 'Nov 16, 2026, 10:00 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
dt.startOfPrevious(unit, firstDay?): DateTime
```

Переходит назад к началу календарной единицы или единицы времени, предшествующей той, в которой находится этот момент, в этом же часовом поясе. Если передать английское название дня недели вместо единицы, метод вернёт начало предыдущего дня с этим названием, тогда как [`previous()`](#previous) сохраняет время суток.

**Параметры**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: Английское название календарной единицы или единицы времени от `'year'` до `'nanosecond'` либо английское название дня недели (например, `'wednesday'`).
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` в начале предыдущей единицы `unit` или предыдущего указанного дня недели.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfPrevious('day').text; // 'Nov 15, 2026, 12:00 AM EST'
standup.startOfPrevious('month').text; // 'Oct 1, 2026, 12:00 AM EDT'
standup.startOfPrevious('wednesday').text; // 'Nov 11, 2026, 12:00 AM EST'
```
:::

:::entry
### `next()` :kind[method]

```js signature
dt.next(target): DateTime
```

Переходит вперёд к следующему указанному дню недели или ежегодной дате [`MonthDay`](/api/month-day/), сохраняя то же время суток. Если момент уже приходится на этот день недели или ежегодную дату, переходит к следующему повторению.

**Параметры**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Английское название дня недели (например, `'friday'`), номер ISO от 1 до 7 или повторяющаяся дата `MonthDay`.
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` на следующую подходящую дату с тем же локальным временем суток.
```

```js
import { datetime, monthDay } from 'native-dates';

const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.next('friday').day; // 20
mon.next('monday').day; // 23
mon.next(monthDay('12-25')).month; // 12
```
:::

:::entry
### `previous()` :kind[method]

```js signature
dt.previous(target): DateTime
```

Переходит назад к ближайшему предыдущему указанному дню недели или ежегодной дате [`MonthDay`](/api/month-day/) до этой даты, сохраняя то же время суток.

**Параметры**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Английское название дня недели, его трёхбуквенное сокращение, номер ISO от 1 до 7 или повторяющаяся дата `MonthDay`.
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` на предыдущую подходящую дату с тем же локальным временем суток.
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.previous('friday').day; // 13
mon.previous(monthDay('10-31')).month; // 10
```
:::

:::entry
### `round()` :kind[method]

```js signature
dt.round(unit): DateTime
dt.round(increment, unit): DateTime
```

Округляет момент времени до ближайшей единицы или заданного шага; значения ровно посередине округляются вверх.

**Параметры**

```params
- name: increment
  type: number | Unit
  required: true
  description: Размер шага, на который без остатка делится следующая более крупная единица, либо целевая единица `unit` при округлении с шагом `1`.
- name: unit
  type: Unit
  description: Английское название округляемой единицы от `'day'` до `'nanosecond'`.
```

**Возвращает**

```returns
type: DateTime
description: Новый округлённый экземпляр `DateTime` в том же часовом поясе.
```

```js
const stamp = datetime('2026-11-16T09:23:40', 'UTC');

stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
dt.floor(unit): DateTime
dt.floor(increment, unit): DateTime
```

Округляет вниз до начала единицы или шага. Принимает те же аргументы, что и [`round()`](#round).

```js
datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
dt.ceil(unit): DateTime
dt.ceil(increment, unit): DateTime
```

Округляет вверх до следующей единицы или шага. Принимает те же аргументы, что и [`round()`](#round).

```js
datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

## Сравнение моментов времени

Сравнения проверяют, когда именно наступил каждый момент времени, даже если два значения заданы в разных часовых поясах.

:::warning[Сравнение через ===]
Оператор `===` в JavaScript проверяет, указывают ли две переменные на один и тот же объект в памяти. Чтобы проверить, обозначают ли два экземпляра `DateTime` один и тот же момент времени, вызывайте [`equals()`](#equals).
:::

:::entry
### `equals()` :kind[method]

```js signature
dt.equals(other): boolean
```

Возвращает `true`, если оба значения обозначают один и тот же момент времени, независимо от их часовых поясов.

**Параметры**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Другой экземпляр `DateTime` или любое значение, принимаемое функцией `datetime()`.
```

**Возвращает**

```returns
type: boolean
description: '`true`, если оба значения указывают на один и тот же момент времени.'
```

```js
const ny = datetime('2026-11-16T12:00', 'America/New_York');
const utc = datetime('2026-11-16T17:00Z', 'UTC');

ny.equals(utc); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
dt.isBefore(other): boolean
```

Возвращает `true`, если этот момент времени раньше другого.

```js
datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
dt.isAfter(other): boolean
```

Возвращает `true`, если этот момент времени позже другого.

```js
datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
dt.isSame(other, unit?, firstDay?): boolean
```

Проверяет, попадает ли другой момент в ту же календарную единицу или единицу времени, если рассматривать оба момента в часовом поясе этого экземпляра. Вызов `isSame()` без единицы проверяет точное совпадение моментов времени.

**Параметры**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Момент времени для сравнения, приведённый к часовому поясу этого экземпляра.
- name: unit
  type: Unit
  description: Английское название сравниваемой календарной единицы или единицы времени (например, `'day'` или `'month'`).
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: boolean
description: '`true`, если оба момента попадают в одну и ту же единицу `unit` в этом часовом поясе.'
```

```js
const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');

la.isSame(lateUtc, 'day'); // true (18:00 16 ноября в Лос-Анджелесе)
lateUtc.isSame(la, 'day'); // false (17 ноября против 16 ноября в UTC)
```
:::

### Календарные предикаты

Проверки без аргументов, вычисляемые в часовом поясе экземпляра:

| Метод | Тип | Описание |
|---|---|---|
| `isPast()`, `isFuture()` | `boolean` | Раньше или позже этот момент по сравнению с текущим. |
| `isToday()`, `isTomorrow()`, `isYesterday()` | `boolean` | Совпадает ли локальная календарная дата с сегодняшним, завтрашним или вчерашним днём в этом часовом поясе. |
| `isWeekday()`, `isWeekend()` | `boolean` | Будний или выходной день в активной локали (например, суббота и воскресенье в `en-US` или пятница и суббота в `ar-SA`). |
| `isLeapYear()` | `boolean` | Високосный ли год в этом часовом поясе. |

## Измерение времени

:::entry
### `until()` :kind[method]

```js signature
dt.until(other): Duration
dt.until(other, unit): number
```

Измеряет время от этого момента до другого; если целевой момент раньше, возвращает отрицательную длительность. Передайте английское название единицы, чтобы получить общую длительность одним числом вместо [`Duration`](/api/duration/).

**Параметры**

```params
- name: other
  type: DateTimeInput
  required: true
  description: Целевой момент времени, до которого идёт отсчёт.
- name: unit
  type: Unit
  description: Английское название единицы, в которой нужно получить общую длительность в виде числа с плавающей точкой.
```

**Возвращает**

```returns
type: Duration | number
description: Экземпляр `Duration` в днях и единицах времени суток либо число при указании `unit`.
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::

:::entry
### `since()` :kind[method]

```js signature
dt.since(other): Duration
dt.since(other, unit): number
```

Измеряет время, прошедшее с более раннего момента. Передайте английское название единицы, чтобы получить общую длительность одним числом.

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.since('2026-11-16T08:00', 'minutes'); // 90
```
:::

:::entry
### `to()` :kind[method]

```js signature
dt.to(end): DateTimeRange
dt.to(count, unit): DateTimeRange
dt.for(length): DateTimeRange
dt.for(count, unit): DateTimeRange
```

Создаёт полуоткрытый диапазон [`DateTimeRange`](/api/ranges/#datetimerange), который начинается с этого момента и заканчивается в указанный конечный момент или по истечении заданной длительности (верхняя граница не включается). Если конец раньше начала, выбрасывает `RangeError`. Используйте `for()`, чтобы явно передать длительность (конечные моменты и числа без единиц при этом отклоняются).

**Параметры**

```params
- name: end
  type: DateTimeInput | DurationInput | number
  required: true
  description: Конечный момент, длительность или числовое значение `count` в паре с `unit`.
- name: unit
  type: Unit
  description: Английское название единицы, если первый аргумент — число (например, `'hours'` или `'days'`).
```

**Возвращает**

```returns
type: DateTimeRange
description: Полуоткрытый диапазон `DateTimeRange` в часовом поясе этого экземпляра.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.to('2026-11-16T10:00').duration.minutes; // 30
standup.for(2, 'hours').end.hour; // 11
```
:::

:::entry
### `range()` :kind[method]

```js signature
dt.range(unit, firstDay?): DateTimeRange
```

Возвращает полуоткрытый диапазон [`DateTimeRange`](/api/ranges/#datetimerange) для календарной единицы или единицы времени, содержащей этот момент, — от её начала до начала следующей единицы (верхняя граница не включается).

**Параметры**

```params
- name: unit
  type: Unit
  required: true
  description: Английское название календарной единицы или единицы времени от `'year'` до `'nanosecond'`.
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: DateTimeRange
description: Полуоткрытый диапазон `DateTimeRange`, охватывающий единицу `unit` в этом часовом поясе.
```

```js
const event = datetime('2026-11-16T14:45', 'UTC');

event.range('day').toString();
// '2026-11-16T00:00:00.000Z/2026-11-17T00:00:00.000Z'
```
:::

## Форматирование и преобразование

:::entry
### `format()` :kind[method]

```js signature
dt.format(spec?, locale?): string
```

Форматирует дату и время в активном часовом поясе с помощью встроенных пресетов, пользовательских имён из [`configure()`](/api/configure/), объектов опций `Intl` или шаблонов токенов.

Локализованные пресеты от `'LT'` до `'llll'` уже встроены, а квадратные скобки `[...]` позволяют вставлять буквальный текст. Полный справочник пресетов и токенов — в руководстве [Форматирование](/guides/formatting/).

**Параметры**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Встроенный или настроенный пресет, объект опций `Intl` либо шаблон токенов.
- name: locale
  type: string
  description: Тег локали BCP 47, переопределяющий локаль этого момента или конфигурации для одного вызова.
```

**Возвращает**

```returns
type: string
description: Отформатированная строка в часовом поясе экземпляра.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
standup.format('full', 'en-US'); // 'Monday, November 16, 2026 at 9:30 AM'
standup.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('MMM D [at] h:mm a', 'en-US'); // 'Nov 16 at 9:30 am'
standup.format(
  { weekday: 'short', hour: '2-digit', minute: '2-digit' },
  'de-DE',
); // 'Mo., 09:30'
```
:::

:::entry
### `from()` :kind[method]

```js signature
dt.from(other?, locale?): string
dt.formatRelative(other?, locale?): string
```

Форматирует промежуток времени от другого момента до этого в виде локализованной фразы через `Intl.RelativeTimeFormat` — например, «3 часа назад» или «через 2 дня» (в английской локали `'3 hours ago'` или `'in 2 days'`).

Если опустить первый аргумент, сравнение идёт с текущим моментом; также доступен псевдоним [`formatRelative()`](#formatrelative). Нулевая разница выводится словом «сейчас» (`'now'`), а для дней, месяцев и лет используются числовые значения вместо календарных слов вроде «вчера».

**Параметры**

```params
- name: other
  type: DateTimeInput
  description: Опорный момент времени для отсчёта (значения без пояса трактуются в часовом поясе этого экземпляра). По умолчанию — текущий момент.
- name: locale
  type: Locale
  description: Тег локали BCP 47, переопределяющий локаль этого момента или конфигурации для одного вызова.
```

**Возвращает**

```returns
type: string
description: Локализованная фраза с относительным временем.
```

```js
const anchor = datetime('2026-11-16T12:00', 'UTC');

anchor.from(anchor, 'en-US'); // 'now'
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'
anchor.plus(45, 'minutes').from(anchor, 'en-US'); // 'in 1 hour'
anchor.minus(3, 'hours').from(anchor, 'es'); // 'hace 3 horas'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
dt.fromNow(locale?): string
```

Форматирует, как далеко этот момент отстоит от текущего, в виде локализованной фразы — эквивалент вызова [`from()`](#from) без опорного момента.

**Параметры**

```params
- name: locale
  type: Locale
  description: Тег локали BCP 47, переопределяющий локаль этого момента или конфигурации для одного вызова.
```

**Возвращает**

```returns
type: string
description: Локализованная фраза с относительным временем от текущего момента.
```

```js
now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
now().plus(2, 'hours').fromNow('en-US'); // 'in 2 hours'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
dt.formatRelative(other?, locale?): string
```

Псевдоним метода [`from()`](#from), форматирующий промежуток времени от `other` (или от текущего момента, если аргумент не передан) в виде локализованной фразы.
:::

:::entry
### `locale()` :kind[method]

```js signature
dt.locale(): Locale | undefined
dt.locale(tag): DateTime
```

Возвращает локаль, привязанную к этому моменту, либо создаёт копию с другой локалью для форматирования, пресетов, границ недели и всех производных значений. Теги с подчёркиванием и заголовки `Accept-Language` нормализуются автоматически, пустой тег сбрасывает локаль, а [`lang()`](#lang) работает как псевдоним.

**Параметры**

```params
- name: tag
  type: Locale | null | undefined
  description: Тег локали, массив тегов или заголовок `Accept-Language` для сохранения либо `null` для сброса.
```

**Возвращает**

```returns
type: DateTime | Locale | undefined
description: Активный тег при вызове без аргументов либо новый экземпляр `DateTime` с прикреплённым тегом `tag`.
```

```js
const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');

standup.locale(); // 'es-ES'
standup.plus(1, 'week').date.format('long'); // '23 de noviembre de 2026'
standup.locale(null).locale(); // undefined
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dt.lang(): Locale | undefined
dt.lang(tag): DateTime
```

Краткий псевдоним [`locale()`](#locale) для чтения или привязки тега локали BCP 47 к этому моменту времени.
:::

:::entry
### `as()` :kind[method]

```js signature
dt.as('datetime'): DateTime
dt.as('date'): CalendarDate
dt.as('time'): Time
dt.as('yearMonth'): YearMonth
dt.as('monthDay'): MonthDay
```

Преобразует этот момент времени к другому типу прямо внутри цепочки вызовов, не прерывая её обращением к свойству, — включая [`YearMonth`](/api/year-month/) и [`MonthDay`](/api/month-day/) в его активном часовом поясе.

**Параметры**

```params
- name: kind
  type: "'datetime' | 'date' | 'time' | 'yearMonth' | 'monthDay'"
  required: true
  description: Целевой тип, к которому нужно привести этот момент в его активном часовом поясе.
```

**Возвращает**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay
description: Преобразованное значение в часовом поясе этого экземпляра.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.in('Asia/Tokyo').as('date').toString(); // '2026-11-17'
standup.in('Asia/Tokyo').as('time').toString(); // '02:30:00'
standup.as('yearMonth').toString(); // '2026-11'
standup.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dt.toString(): string
dt.toJSON(): string
```

Возвращает момент времени в виде строки ISO 8601 в UTC, подходящей для баз данных, URL и сетевых запросов. Метод `toJSON()` возвращает ту же строку для `JSON.stringify()`.

**Возвращает**

```returns
type: string
description: Строка даты и времени ISO 8601 в UTC, например `'2026-11-16T17:30:00.000Z'`.
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.toString(); // '2026-11-16T17:30:00.000Z'
JSON.stringify({ standup }); // '{"standup":"2026-11-16T17:30:00.000Z"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
dt.toJSDate(): Date
```

Возвращает стандартный объект JavaScript `Date` для того же момента времени.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dt.toTemporal(): Temporal.ZonedDateTime
```

Возвращает базовый экземпляр `Temporal.ZonedDateTime`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dt.valueOf(): number
```

Возвращает миллисекунды с начала эпохи Unix, чтобы два значения `DateTime` можно было вычитать или сравнивать числовыми операторами.
:::
