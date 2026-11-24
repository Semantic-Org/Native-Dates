---
source: df57e2243cc3
title: CalendarDate
lede: Календарная дата без времени суток и часового пояса.
---

## Создание CalendarDate

Создайте экземпляр из строки ISO, отдельных чисел для года, месяца и дня или существующего значения через [`date()`](/api/date-fn/) либо получите текущий день через [`today()`](/api/date-fn/#today). Функции [`tomorrow()`](/api/date-fn/#tomorrow) и [`yesterday()`](/api/date-fn/#yesterday) работают так же, а каждый метод возвращает новый неизменяемый экземпляр.

```js title="create.js"
import { date, today, tomorrow } from 'native-dates';

const birthday = date('2026-05-10');
const launch = date(2026, 11, 16);
const current = today();
const nextDay = tomorrow('America/New_York');
```

У календарной даты нет ни времени суток, ни часового пояса, поэтому 10 мая остаётся 10 мая для любого пользователя независимо от того, где он находится. Локальную календарную дату можно также получить из любого экземпляра [`DateTime`](/api/date-time/):

```js
import { datetime } from 'native-dates';

const flight = datetime('2026-11-16T23:30:00Z', 'Asia/Tokyo');
flight.date.toString(); // '2026-11-17'
```

## Свойства

Свойства напрямую возвращают календарные поля ISO.

| Свойство | Тип | Описание |
|---|---|---|
| `text` | `string` | Календарная дата в формате активной локали, например `'Nov 16, 2026'`. |
| `year`, `month`, `day` | `number` | Календарный год, месяц (1–12) и день месяца (1–31). |
| `yearMonth` | [`YearMonth`](/api/year-month/) | Календарный год и месяц без дня. |
| `monthDay` | [`MonthDay`](/api/month-day/) | Календарный месяц и день без года. |
| `dayOfWeek` | `number` | День недели по ISO: от 1 (понедельник) до 7 (воскресенье). |
| `weekStart` | `number` | Первый день недели для этой даты (от 1 до 7) согласно [`configure()`](/api/configure/) или активной локали. |
| `quarter` | `number` | Календарный квартал (1–4). |
| `weekOfYear`, `dayOfYear` | `number` | Номер недели по ISO (1–53) и день года (1–366). |
| `daysInMonth`, `daysInYear` | `number` | Число дней в текущем месяце (28–31) и году (365 или 366). |

## Объединение и поля

Прикрепите время суток и часовой пояс, чтобы получить конкретный момент времени, или замените отдельные календарные поля.

:::entry
### `at()` :kind[method]

```js signature
d.at(time?, zone?): DateTime
```

Объединяет эту календарную дату со временем суток в указанном часовом поясе и возвращает [`DateTime`](/api/date-time/). Если не передать время, используется полночь в начале дня.

**Параметры**

```params
- name: time
  type: TimeInput
  default: "'00:00'"
  description: Строка времени (например, `'9:30am'`), экземпляр `Time`, объект полей времени или `Date`.
- name: zone
  type: Zone
  description: Идентификатор часового пояса IANA, фиксированное смещение UTC или `'UTC'`. По умолчанию — настроенный часовой пояс.
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` для этой даты в указанное время `time` и в часовом поясе `zone`.
```

```js
const day = date('2026-11-16');

day.at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
day.at(undefined, 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
d.set(fields): CalendarDate
d.set(unit, value): CalendarDate
```

Возвращает новый экземпляр `CalendarDate` с заменёнными календарными полями. Несуществующие даты вроде 30 февраля выбрасывают `RangeError`, а не переходят на следующий месяц. Если изменить `month` или `year`, не передавая `day`, выходящий за границы день ограничивается последним днём целевого месяца.

**Параметры**

```params
- name: fields
  type: DateTimeFields | DateUnit
  required: true
  description: Объект с полями `year`, `month` или `day` либо английское название одной календарной единицы.
- name: value
  type: number
  description: Целочисленное значение для указанной единицы `unit`.
```

**Возвращает**

```returns
type: CalendarDate
description: Новый экземпляр `CalendarDate` с обновлёнными календарными полями.
```

```js
const due = date('2026-11-16');

due.set('day', 1).toString(); // '2026-11-01'
due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
```
:::

## Арифметика и границы

Сдвигайте дату на календарные единицы, выравнивайте по границам периодов или переходите к нужному дню недели. Единицы времени суток вроде часов и минут выбрасывают `RangeError`, так как у календарной даты нет времени суток.

:::note[Ограничение по последнему дню месяца]
При прибавлении месяцев или лет результат ограничивается последним допустимым днём целевого месяца, а не переходит на следующий. Если прибавить один месяц к 31 января, получится 28 февраля (или 29 февраля в високосном году).
:::

:::entry
### `plus()` :kind[method]

```js signature
d.plus(amount, unit?): CalendarDate
d.add(amount, unit?): CalendarDate
```

Сдвигает дату вперёд на годы, кварталы, месяцы, недели или дни и возвращает новый экземпляр `CalendarDate`. Также доступен псевдоним `add()`.

**Параметры**

```params
- name: amount
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, строка с английской фразой длительности или ISO 8601 либо объект полей.
- name: unit
  type: DateUnit
  description: Английское название календарной единицы, если `amount` — число (например, `'days'` или `'months'`).
```

**Возвращает**

```returns
type: CalendarDate
description: Новый экземпляр `CalendarDate`, сдвинутый вперёд по календарю.
```

```js
const billing = date('2026-01-31');

billing.plus(1, 'month').toString(); // '2026-02-28'
billing.plus('2 weeks').toString(); // '2026-02-14'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
d.minus(amount, unit?): CalendarDate
d.subtract(amount, unit?): CalendarDate
```

Сдвигает дату назад на календарную длительность. Принимает те же аргументы, что и [`plus()`](#plus); также доступен псевдоним `subtract()`.

**Параметры**

```params
- name: amount
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, строка с английской фразой длительности или ISO 8601 либо объект полей.
- name: unit
  type: DateUnit
  description: Английское название календарной единицы, если `amount` — число.
```

**Возвращает**

```returns
type: CalendarDate
description: Новый экземпляр `CalendarDate`, сдвинутый назад по календарю.
```

```js
const launch = date('2026-03-01');

launch.minus(1, 'day').toString(); // '2026-02-28'
launch.minus({ weeks: 2, days: 1 }).toString(); // '2026-02-14'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
d.startOf(unit, firstDay?): CalendarDate
```

Возвращает первый день календарной единицы, содержащей эту дату. Границы недели определяются аргументом `firstDay`, настройкой `weekStart` из [`configure()`](/api/configure/) или активной локалью этой даты.

**Параметры**

```params
- name: unit
  type: DateUnit
  required: true
  description: Английское название календарной единицы от `'year'` до `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Первый день недели при выравнивании по неделе — английское название (например, `'sunday'`) или номер ISO (например, `7`).
```

**Возвращает**

```returns
type: CalendarDate
description: Первый календарный день единицы `unit`.
```

```js
const wed = date('2026-11-18', { locale: 'en-US' });

wed.startOf('month').toString(); // '2026-11-01'
wed.startOf('quarter').toString(); // '2026-10-01'
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
d.endOf(unit, firstDay?): CalendarDate
```

Возвращает последний день календарной единицы, содержащей эту дату.

**Параметры**

```params
- name: unit
  type: DateUnit
  required: true
  description: Английское название календарной единицы от `'year'` до `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: CalendarDate
description: Последний календарный день единицы `unit`.
```

```js
date('2026-02-10').endOf('month').toString(); // '2026-02-28'
date('2028-02-10').endOf('month').toString(); // '2028-02-29'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
d.startOfNext(unit, firstDay?): CalendarDate
```

Возвращает первый день календарной единицы, следующей за той, в которой находится эта дата. Результат всегда позже исходной даты, поэтому для 1 декабря следующий месяц начнётся 1 января.

Передайте английское название дня недели вместо единицы, чтобы получить следующий день с этим названием — ту же дату, которую возвращает [`next()`](#next).

**Параметры**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: Английское название календарной единицы от `'year'` до `'day'` либо английское название дня недели (например, `'wednesday'`).
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: CalendarDate
description: Первый календарный день следующей единицы `unit` или следующий указанный день недели.
```

```js
const mon = date('2026-11-16', { locale: 'en-US' });

mon.startOfNext('month').toString(); // '2026-12-01'
mon.startOfNext('quarter').toString(); // '2027-01-01'
mon.startOfNext('week').toString(); // '2026-11-22'
mon.startOfNext('wednesday').toString(); // '2026-11-18'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
d.startOfPrevious(unit, firstDay?): CalendarDate
```

Возвращает первый день календарной единицы, предшествующей той, в которой находится эта дата. Если передать английское название дня недели вместо единицы, метод вернёт ближайший предыдущий день с этим названием — так же, как [`previous()`](#previous).

**Параметры**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: Английское название календарной единицы от `'year'` до `'day'` либо английское название дня недели (например, `'wednesday'`).
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: CalendarDate
description: Первый календарный день предыдущей единицы `unit` или предыдущий указанный день недели.
```

```js
const mon = date('2026-11-16');

mon.startOfPrevious('month').toString(); // '2026-10-01'
mon.startOfPrevious('year').toString(); // '2025-01-01'
mon.startOfPrevious('wednesday').toString(); // '2026-11-11'
```
:::

:::entry
### `next()` :kind[method]

```js signature
d.next(target): CalendarDate
```

Переходит вперёд к следующему указанному дню недели или ежегодной дате [`MonthDay`](/api/month-day/) после этой даты. Если дата уже приходится на этот день недели или ежегодную дату, переходит к следующему повторению.

**Параметры**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Английское название дня недели (например, `'friday'`), номер ISO от 1 до 7 или повторяющаяся дата `MonthDay`.
```

**Возвращает**

```returns
type: CalendarDate
description: Новый экземпляр `CalendarDate` на следующий подходящий день.
```

```js
import { date, monthDay } from 'native-dates';

const mon = date('2026-11-16');

mon.next('friday').toString(); // '2026-11-20'
mon.next('monday').toString(); // '2026-11-23'
mon.next(monthDay('12-25')).toString(); // '2026-12-25'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
d.previous(target): CalendarDate
```

Переходит назад к ближайшему предыдущему указанному дню недели или ежегодной дате [`MonthDay`](/api/month-day/) до этой даты. Если дата уже приходится на этот день недели или ежегодную дату, отступает к предыдущему повторению.

**Параметры**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: Английское название дня недели, его трёхбуквенное сокращение, номер ISO от 1 до 7 или повторяющаяся дата `MonthDay`.
```

**Возвращает**

```returns
type: CalendarDate
description: Новый экземпляр `CalendarDate` на предыдущий подходящий день.
```

```js
date('2026-11-16').previous('friday').toString(); // '2026-11-13'
date('2026-11-16').previous(monthDay('10-31')).toString(); // '2026-10-31'
```
:::

## Сравнение дат

Сравнивайте экземпляры `CalendarDate` напрямую или передавайте любое значение, которое принимает [`date()`](/api/date-fn/).

:::warning[Не используйте числовые операторы сравнения]
Календарная дата не приводится к временной метке, поэтому числовые операторы выбрасывают `RangeError`, а не преобразуют её в миллисекунды. Сравнивайте даты методами вроде [`isBefore()`](#isbefore) или сортируйте массивы с помощью [`compare()`](/api/compare/).
:::

:::entry
### `equals()` :kind[method]

```js signature
d.equals(other): boolean
```

Возвращает `true`, если оба значения обозначают один и тот же календарный год, месяц и день.

**Параметры**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Другой экземпляр `CalendarDate` или любое значение, принимаемое функцией `date()`.
```

**Возвращает**

```returns
type: boolean
description: '`true`, если оба значения обозначают один и тот же календарный день.'
```

```js
const due = date('2026-11-16');

due.equals('2026-11-16'); // true
due.equals(date(2026, 11, 16)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
d.isBefore(other): boolean
```

Возвращает `true`, если эта дата раньше другой по календарю.

```js
date('2026-11-15').isBefore('2026-11-16'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
d.isAfter(other): boolean
```

Возвращает `true`, если эта дата позже другой по календарю.

```js
date('2026-11-17').isAfter('2026-11-16'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
d.isSame(other, unit?, firstDay?): boolean
```

Проверяет, попадает ли другая дата в ту же календарную единицу — например, в тот же месяц или неделю. Вызов `isSame()` без единицы проверяет совпадение с точностью до дня.

**Параметры**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Дата для сравнения.
- name: unit
  type: DateUnit
  description: Английское название сравниваемой календарной единицы от `'year'` до `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: boolean
description: '`true`, если обе даты попадают в одну и ту же единицу `unit`.'
```

```js
const wed = date('2026-09-09', { locale: 'en-US' });

wed.isSame('2026-09-30', 'month'); // true
wed.isSame('2026-09-06', 'week'); // true
wed.isSame('2026-09-06', 'week', 'monday'); // false
```
:::

### Календарные предикаты

Проверки относительно сегодняшнего дня принимают необязательный часовой пояс, потому что текущий календарный день зависит от того, где вы находитесь. Если пояс не указан, используется значение по умолчанию из [`configure()`](/api/configure/).

| Метод | Тип | Описание |
|---|---|---|
| `isToday(zone?)`, `isTomorrow(zone?)`, `isYesterday(zone?)` | `boolean` | Совпадает ли эта дата с сегодняшним, завтрашним или вчерашним днём в указанном или настроенном часовом поясе. |
| `isPast(zone?)`, `isFuture(zone?)` | `boolean` | Раньше или позже эта дата по сравнению с сегодняшним днём в указанном или настроенном часовом поясе. |
| `isWeekday()`, `isWeekend()` | `boolean` | Будний или выходной день в активной локали (например, суббота и воскресенье в `en-US` или пятница и суббота в `ar-SA`). |
| `isLeapYear()` | `boolean` | Есть ли в году этой даты 366 дней. |

## Измерение промежутков

:::entry
### `until()` :kind[method]

```js signature
d.until(other): Duration
d.until(other, unit): number
```

Измеряет календарный промежуток от этой даты до другой; если целевая дата раньше, возвращает отрицательную длительность. Возвращённый экземпляр [`Duration`](/api/duration/) запоминает начальную дату, чтобы месяцы и годы можно было точно пересчитать в общую длительность.

**Параметры**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: Целевая дата, до которой идёт отсчёт.
- name: unit
  type: Unit
  description: Английское название единицы, в которой нужно получить общую длительность в виде числа с плавающей точкой.
```

**Возвращает**

```returns
type: Duration | number
description: Экземпляр `Duration` в днях либо число при указании `unit`.
```

```js
const start = date('2026-01-01');

start.until('2027-04-05').toString(); // 'P459D'
start.until('2027-04-05').balance('year').toString(); // 'P1Y3M4D'
start.until('2027-04-05', 'days'); // 459
start.until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `since()` :kind[method]

```js signature
d.since(other): Duration
d.since(other, unit): number
```

Измеряет календарный промежуток, прошедший с более ранней даты. Передайте английское название единицы, чтобы получить общую длительность одним числом.

```js
date('2026-11-16').since('2026-11-02', 'weeks'); // 2
```
:::

:::entry
### `to()` :kind[method]

```js signature
d.to(end): DateRange
d.to(count, unit): DateRange
d.through(end): DateRange
d.through(count, unit): DateRange
d.for(length): DateRange
d.for(count, unit): DateRange
```

Создаёт диапазон [`DateRange`](/api/ranges/#daterange), включающий обе границы, — от этой даты до конечной даты или на заданную длительность. В диапазон входят и первый, и последний день. Также доступен псевдоним `through()`; используйте `for()`, чтобы явно передать длительность (конечные даты и числа без единиц при этом отклоняются).

**Параметры**

```params
- name: end
  type: CalendarDateInput | DurationInput | number
  required: true
  description: Конечная дата (включительно), календарная длительность или числовое значение `count` в паре с `unit`.
- name: unit
  type: DateUnit
  description: Английское название календарной единицы, если первый аргумент — число (например, `'days'` или `'weeks'`).
```

**Возвращает**

```returns
type: DateRange
description: Диапазон `DateRange`, включающий обе границы и начинающийся с этой даты.
```

```js
date('2026-11-01').to('2026-11-07').duration.days; // 7
date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
```

Возвращает диапазон [`DateRange`](/api/ranges/#daterange), включающий обе границы и охватывающий каждый день календарной единицы, в которой находится эта дата, — от первого дня до последнего.

**Параметры**

```params
- name: unit
  type: DateUnit
  required: true
  description: Английское название календарной единицы от `'year'` до `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Первый день недели, если `unit` равен `'week'` (английское название или номер ISO от 1 до 7).
```

**Возвращает**

```returns
type: DateRange
description: Диапазон `DateRange`, включающий обе границы от начала до конца единицы `unit`.
```

```js
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```
:::

:::entry
### `every()` :kind[method]

```js signature
d.every(step, zone?): DateTime[]
d.every(count, unit, zone?): DateTime[]
```

Проходит по этому календарному дню с положительным шагом в указанном или настроенном часовом поясе и возвращает массив моментов [`DateTime`](/api/date-time/), начиная с полуночи. В дни перехода на летнее или зимнее время почасовой шаг автоматически даёт 23 или 25 точек.

**Параметры**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Английское название единицы (например, `'hour'`), длительность (например, `'30m'`) или число в паре с `unit`.
- name: unit
  type: Unit
  description: Английское название единицы, если первый аргумент — число.
- name: zone
  type: Zone
  description: Часовой пояс для определения границ дня. По умолчанию — настроенный часовой пояс.
```

**Возвращает**

```returns
type: DateTime[]
description: Массив моментов времени в пределах этого календарного дня в часовом поясе `zone`.
```

```js
const slots = date('2026-11-16').every(6, 'hours', 'UTC');

slots.length; // 4
slots[1].toString(); // '2026-11-16T06:00:00.000Z'
```
:::

:::entry
### `split()` :kind[method]

```js signature
d.split(step, zone?): DateTimeRange[]
d.split(count, unit, zone?): DateTimeRange[]
d.splitBy(step, zone?): DateTimeRange[]
d.splitBy(count, unit, zone?): DateTimeRange[]
```

Разбивает этот календарный день на смежные полуоткрытые интервалы [`DateTimeRange`](/api/ranges/#datetimerange) в указанном или настроенном часовом поясе. Также доступен псевдоним `splitBy()`.

**Параметры**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Английское название единицы, длительность или число в паре с `unit`.
- name: unit
  type: Unit
  description: Английское название единицы, если первый аргумент — число.
- name: zone
  type: Zone
  description: Часовой пояс для определения границ дня. По умолчанию — настроенный часовой пояс.
```

**Возвращает**

```returns
type: DateTimeRange[]
description: Массив смежных отрезков `DateTimeRange`, покрывающих этот день в часовом поясе `zone`.
```

```js
const halves = date('2026-11-16').split(12, 'hours', 'UTC');

halves.map(String);
// ['2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z']
```
:::

## Форматирование и преобразование

:::entry
### `format()` :kind[method]

```js signature
d.format(spec?, locale?): string
```

Форматирует дату с помощью встроенных пресетов, пользовательских имён из [`configure()`](/api/configure/), объектов опций или шаблонов токенов.

Локализованные пресеты от `'L'` до `'LLLL'` уже встроены, а ключи времени суток и часового пояса в объектах опций автоматически игнорируются. Полный справочник пресетов и токенов — в руководстве [Форматирование](/guides/formatting/).

**Параметры**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Встроенный или настроенный пресет, объект опций `Intl` либо шаблон токенов.
- name: locale
  type: string
  description: Тег локали BCP 47, переопределяющий локаль этой даты или конфигурации для одного вызова.
```

**Возвращает**

```returns
type: string
description: Отформатированная строка даты.
```

```js
const day = date('2026-11-16');

day.format('short', 'en-US'); // '11/16/26'
day.format('medium', 'en-US'); // 'Nov 16, 2026'
day.format('long', 'en-US'); // 'November 16, 2026'
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('L', 'en-US'); // '11/16/2026'
day.format('YYYY-MM-DD'); // '2026-11-16'
day.format('ddd, MMM D', 'en-US'); // 'Mon, Nov 16'
day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
```
:::

:::entry
### `from()` :kind[method]

```js signature
d.from(other?, locale?): string
d.formatRelative(other?, locale?): string
```

Форматирует календарный промежуток от другой даты до этой в виде локализованной фразы через `Intl.RelativeTimeFormat` — например, «вчера» или «через 3 недели» (в английской локали `'yesterday'` или `'in 3 weeks'`).

Если опустить первый аргумент, сравнение идёт с [`today()`](/api/date-fn/#today); также доступен псевдоним [`formatRelative()`](#formatrelative). Для промежутков короче семи дней используются естественные слова вроде «вчера», «сегодня», «завтра» (в русской локали `Intl.RelativeTimeFormat('ru')` — ещё «позавчера» и «послезавтра»), а для недель, месяцев и лет — числовые значения.

**Параметры**

```params
- name: other
  type: CalendarDateInput
  description: Опорная календарная дата для отсчёта. По умолчанию — `today()` в активном часовом поясе.
- name: locale
  type: Locale
  description: Тег локали BCP 47, переопределяющий локаль этой даты или конфигурации для одного вызова.
```

**Возвращает**

```returns
type: string
description: Локализованная фраза с относительной датой.
```

```js
const anchor = date('2026-11-16');

date('2026-11-15').from(anchor, 'en-US'); // 'yesterday'
date('2026-11-16').from(anchor, 'en-US'); // 'today'
date('2026-11-17').from(anchor, 'en-US'); // 'tomorrow'
date('2026-11-30').from(anchor, 'en-US'); // 'in 2 weeks'
date('2026-11-15').from(anchor, 'de'); // 'gestern'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
d.fromNow(locale?): string
```

Форматирует, как далеко эта дата отстоит от сегодняшнего дня, в виде локализованной фразы — эквивалент вызова [`from()`](#from) без опорной даты.

**Параметры**

```params
- name: locale
  type: Locale
  description: Тег локали BCP 47, переопределяющий локаль этой даты или конфигурации для одного вызова.
```

**Возвращает**

```returns
type: string
description: Локализованная фраза с относительной датой от сегодняшнего дня.
```

```js
today().minus(1, 'day').fromNow('en-US'); // 'yesterday'
today().plus(3, 'days').fromNow('en-US'); // 'in 3 days'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
d.formatRelative(other?, locale?): string
```

Псевдоним метода [`from()`](#from), форматирующий календарный промежуток от `other` (или от сегодняшнего дня, если аргумент не передан) в виде локализованной фразы.
:::

:::entry
### `locale()` :kind[method]

```js signature
d.locale(): Locale | undefined
d.locale(tag): CalendarDate
```

Возвращает локаль, привязанную к этой дате, либо создаёт копию с другой локалью для форматирования, пресетов, границ недели и всех производных значений. Теги с подчёркиванием и заголовки `Accept-Language` нормализуются автоматически, пустой тег сбрасывает локаль, а [`lang()`](#lang) работает как псевдоним.

**Параметры**

```params
- name: tag
  type: Locale | null | undefined
  description: Тег локали, массив тегов или заголовок `Accept-Language` для сохранения либо `null` для сброса.
```

**Возвращает**

```returns
type: CalendarDate | Locale | undefined
description: Активный тег при вызове без аргументов либо новый экземпляр `CalendarDate` с прикреплённым тегом `tag`.
```

```js
const trip = date('2026-05-15').locale('fr-FR');

trip.locale(); // 'fr-FR'
trip.format('long'); // '15 mai 2026'
trip.to('2026-05-19').format('long'); // '15–19 mai 2026'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
d.lang(): Locale | undefined
d.lang(tag): CalendarDate
```

Краткий псевдоним [`locale()`](#locale) для чтения или привязки тега локали BCP 47 к этой дате.
:::

:::entry
### `as()` :kind[method]

```js signature
d.as('date'): CalendarDate
d.as('datetime', zone?): DateTime
d.as('yearMonth'): YearMonth
d.as('monthDay'): MonthDay
```

Преобразует эту дату к другому типу прямо внутри цепочки вызовов — включая [`YearMonth`](/api/year-month/) и [`MonthDay`](/api/month-day/). Преобразование в момент времени возвращает полночь в начале этой даты в указанном или настроенном часовом поясе.

**Параметры**

```params
- name: kind
  type: "'date' | 'datetime' | 'yearMonth' | 'monthDay'"
  required: true
  description: Целевой тип, к которому нужно привести эту календарную дату.
- name: zone
  type: Zone
  description: Часовой пояс для преобразования в `'datetime'`. По умолчанию — настроенный часовой пояс.
```

**Возвращает**

```returns
type: CalendarDate | DateTime | YearMonth | MonthDay
description: Преобразованное значение.
```

```js
const due = date('2026-11-16');

due.as('datetime', 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
due.as('yearMonth').toString(); // '2026-11'
due.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
d.toString(): string
d.toJSON(): string
```

Возвращает дату в виде строки ISO 8601 в формате `YYYY-MM-DD`. Метод `toJSON()` возвращает ту же строку для `JSON.stringify()`.

**Возвращает**

```returns
type: string
description: Строка даты ISO 8601, например `'2026-11-16'`.
```

```js
const due = date('2026-11-16');

due.toString(); // '2026-11-16'
JSON.stringify({ due }); // '{"due":"2026-11-16"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
d.toJSDate(zone?): Date
```

Возвращает стандартный объект JavaScript `Date`, соответствующий полуночи этой даты в указанном или настроенном часовом поясе.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
d.toTemporal(): Temporal.PlainDate
```

Возвращает базовый экземпляр `Temporal.PlainDate`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
d.valueOf(): never
```

Выбрасывает `RangeError`, чтобы числовые операторы никогда не приводили календарную дату к числу неявно.
:::
