---
source: 9606dd7fa967
title: Диапазоны
lede: Промежутки между двумя датами, моментами времени или значениями времени суток с проверкой вхождения, пересечением и шагами.
---

## Классы диапазонов

Создавайте диапазоны напрямую с помощью [фабричных функций диапазонов](/api/range-fn/) (`dateRange()`, `datetimeRange()`, `timeRange()`) или вызывайте [`to()`](#to), [`for()`](#to) и [`range()`](#range) в цепочке на существующей точке. Все экземпляры диапазонов неизменяемые.

:::note[Даты включительно, а DateTimeRange и TimeRange — полуоткрытые]
Диапазоны календарных дат включают конечный день, потому что «с 1 по 7 сентября» — это все семь дней. Диапазоны моментов времени (`DateTimeRange`) и времени суток (`TimeRange`) исключают верхнюю границу, чтобы идущие подряд слоты стыковались без пересечения.
:::

:::entry
### `DateRange` :kind[class]

```js signature
new DateRange(start, end, options?)
new DateRange(interval, options?)
```

Охватывает промежуток между двумя [календарными датами](/api/calendar-date/) и включает обе границы. Если конечная дата раньше начальной, выбрасывается `RangeError`.

`DateRange` поддерживает ленивый перебор день за днём через `for...of` или оператор расширения, выдавая каждую календарную дату от начальной до конечной включительно.

```js title="ranges.js"
import { dateRange } from 'native-dates';

const trip = dateRange('2026-09-01', '2026-09-07');
const week = dateRange('2026-09-01', '7 days');

trip.duration.days; // 7
week.toString(); // '2026-09-01/2026-09-07'
for (const day of trip) {
  day.toString(); // '2026-09-01', '2026-09-02', ...
}
[...dateRange('2026-09-01', '2026-09-03')].map(String); // ['2026-09-01', '2026-09-02', '2026-09-03']
```
:::

:::entry
### `DateTimeRange` :kind[class]

```js signature
new DateTimeRange(start, end, options?)
new DateTimeRange(interval, options?)
```

Охватывает промежуток между двумя [моментами времени](/api/date-time/), включая начало и исключая конец. Если у конечной границы не указан часовой пояс, она разбирается в часовом поясе начального момента; если конец раньше начала, выбрасывается `RangeError`.

```js
import { datetimeRange } from 'native-dates';

const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
const standup = datetimeRange('2026-09-01T09:00', '30m', 'America/New_York');

standup.duration.minutes; // 30
block.end.hour; // 10
```
:::

:::entry
### `TimeRange` :kind[class]

```js signature
new TimeRange(start, end, options?)
new TimeRange(interval, options?)
```

Охватывает промежуток между двумя значениями [времени суток](/api/time/), включая начало и исключая конец. Если конечное время суток на циферблате раньше начального, диапазон переходит через полночь и описывает ночной промежуток.

```js
import { timeRange } from 'native-dates';

const dayShift = timeRange('9:00am', '5:00pm');
const nightShift = timeRange('22:00', '06:00');

dayShift.duration.hours; // 8
nightShift.duration.hours; // 8
```
:::

## Свойства

У каждого диапазона доступны отформатированный текст, типизированные границы, метка типа и измеренная длительность.

| Свойство | Тип | Описание |
|---|---|---|
| `text` | `string` | Диапазон в формате активной локали, например `'Sep 1 – 7, 2026'`. |
| `start`, `end` | `CalendarDate \| DateTime \| Time` | Начальная и конечная точки, соответствующие классу диапазона. |
| `kind` | `'date' \| 'datetime' \| 'time'` | Метка типа точек, хранящихся в диапазоне. |
| `duration` | [`Duration`](/api/duration/) | Полная длительность с привязкой к `start`: включает последний день в диапазонах дат и учитывает переход через полночь в ночных диапазонах времени суток. |

## Построение от точки

:::entry
### `to()` :kind[method]

```js signature
d.to(end, unit?): DateRange
d.through(end, unit?): DateRange
d.for(length, unit?): DateRange
dt.to(end, unit?): DateTimeRange
dt.for(length, unit?): DateTimeRange
t.to(end, unit?): TimeRange
t.for(length, unit?): TimeRange
```

Строит диапазон от этой точки до конечной точки или на заданную длительность. На [календарной дате](/api/calendar-date/) диапазон длительностью 7 дней заканчивается на шесть дней позже начальной даты, потому что обе границы включены.

Используйте `for()`, чтобы строить диапазон строго по длительности (конечные точки и числа без единицы отклоняются). У календарной даты также есть псевдоним `through()` для `to()`, подчёркивающий, что конечный день входит в диапазон.

**Параметры**

```params
- name: end
  type: Point | DurationInput | number
  required: true
  description: Конечная точка того же типа, ввод длительности (экземпляр `Duration`, строка с английской фразой длительности или ISO 8601, объект полей) либо число `count` в паре с `unit`.
- name: unit
  type: Unit
  description: Английское название единицы, если первый аргумент — число.
```

**Возвращает**

```returns
type: DateRange | DateTimeRange | TimeRange
description: Диапазон того же типа, что и исходная точка.
```

```js
import { date, datetime, time } from 'native-dates';

date('2026-09-01').for(7, 'days').toString(); // '2026-09-01/2026-09-07'
datetime('2026-09-01T09:00Z', 'UTC').for(90, 'minutes').toString(); // '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z'
time('9:00am').to('5:00pm').toString(); // '09:00:00/17:00:00'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

Возвращает полную календарную единицу или единицу времени суток, в которую попадает дата или момент времени. Диапазоны дат охватывают с первого по последний день единицы включительно, а диапазоны моментов времени — от начала единицы до начала следующей единицы.

**Параметры**

```params
- name: unit
  type: Unit
  required: true
  description: Английское название охватывающей единицы, например `'week'`, `'month'` или `'day'`.
- name: firstDay
  type: DayOfWeek
  description: Английское название первого дня недели при `unit`, равном `'week'`; переопределяет `configure()` и активную локаль.
```

**Возвращает**

```returns
type: DateRange | DateTimeRange
description: Охватывающий диапазон для единицы `unit`.
```

```js
import { date, datetime } from 'native-dates';

date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString(); // '2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z'
```
:::

## Вхождение и пересечение

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
range.includes(value): boolean
```

Проверяет, лежит ли точка или другой диапазон того же типа внутри этого диапазона. Диапазоны дат включают `end`, диапазоны моментов времени и времени суток исключают его, а ночные диапазоны времени суток охватывают значения по обе стороны от полуночи. Доступен псевдоним `includes()`.

**Параметры**

```params
- name: value
  type: Point | Range
  required: true
  description: Точка или диапазон того же типа.
```

**Возвращает**

```returns
type: boolean
description: "`true`, если `value` попадает внутрь этого диапазона."
```

```js
const stay = dateRange('2026-09-01', '2026-09-07');
stay.contains('2026-09-07'); // true

const night = timeRange('22:00', '06:00');
night.contains('23:30'); // true
night.contains('02:15'); // true
night.contains('06:00'); // false
```
:::

:::entry
### `overlaps()` :kind[method]

```js signature
range.overlaps(other): boolean
```

Возвращает `true`, если у двух диапазонов одного типа есть хотя бы один общий день или момент времени. Идущие подряд слоты `DateTimeRange` или `TimeRange`, где первый заканчивается в начале второго, не пересекаются.

**Параметры**

```params
- name: other
  type: Range | string
  required: true
  description: Экземпляр диапазона или строка интервала того же типа.
```

**Возвращает**

```returns
type: boolean
description: "`true`, если у диапазонов есть общая часть."
```

```js
const firstSlot = timeRange('09:00', '10:00');
const nextSlot = timeRange('10:00', '11:00');

firstSlot.overlaps(nextSlot); // false
dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10'); // true
```
:::

:::entry
### `intersection()` :kind[method]

```js signature
range.intersection(other): Range | null
```

Возвращает новый диапазон, охватывающий только общую часть обоих диапазонов, или `null`, если они не пересекаются. Два ночных диапазона времени суток, пересекающихся двумя раздельными участками, выбрасывают `RangeError`.

**Параметры**

```params
- name: other
  type: Range | string
  required: true
  description: Экземпляр диапазона или строка интервала того же типа.
```

**Возвращает**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: Диапазон пересечения того же типа или `null`, если диапазоны не пересекаются.
```

```js
const a = dateRange('2026-09-01', '2026-09-10');
const b = dateRange('2026-09-05', '2026-09-15');

a.intersection(b)?.toString(); // '2026-09-05/2026-09-10'
a.intersection('2026-09-20/2026-09-25'); // null
```
:::

:::entry
### `equals()` :kind[method]

```js signature
range.equals(other): boolean
```

Возвращает `true`, если у обоих диапазонов совпадают начальная и конечная точки. Массивы диапазонов также можно сортировать хронологически с помощью [`compare()`](/api/compare/).

```js
dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

Возвращает `true`, если у диапазона моментов времени или времени суток совпадают начальная и конечная точки. На [`DateRange`](#daterange) всегда возвращает `false`, потому что одна календарная дата охватывает целый день.

```js
timeRange('09:00', '09:00').isEmpty(); // true
dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
```
:::

## Шаги, разбиение и часовые пояса

:::entry
### `every()` :kind[method]

```js signature
range.every(step): Point[]
range.every(count, unit): Point[]
```

Проходит вперёд от `start` с положительным шагом и возвращает все точки внутри диапазона. Каждый шаг отсчитывается от начальной точки, а не прибавляется к предыдущему результату, поэтому ежемесячный шаг от 31 января попадает на последний день каждого месяца.

Чтобы лениво обходить [`DateRange`](#daterange) по одному дню без создания массива, перебирайте его напрямую через `for...of` или оператор расширения.

**Параметры**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: Английское название единицы вроде `'day'`, ввод длительности (экземпляр `Duration`, строка с английской фразой длительности или ISO 8601, объект полей) либо число `count` в паре с `unit`.
- name: unit
  type: Unit
  description: Английское название единицы, если `step` — число.
```

**Возвращает**

```returns
type: Array<CalendarDate | DateTime | Time>
description: Упорядоченный массив точек внутри диапазона.
```

```js
dateRange('2026-01-31', '2026-04-30').every('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

timeRange('22:00', '02:00').every(1, 'hour').map(String);
// ['22:00:00', '23:00:00', '00:00:00', '01:00:00']
```
:::

:::entry
### `count()` :kind[method]

```js signature
dateRange.count(kind?): number
```

Подсчитывает календарные дни внутри [`DateRange`](#daterange) без создания промежуточных экземпляров дат. Принимает `'days'` (по умолчанию), `'weekdays'`, `'weekends'` или английское название дня недели, например `'mondays'`. Режимы `'weekdays'` и `'weekends'` учитывают выходные дни активной локали.

**Параметры**

```params
- name: kind
  type: string
  default: "'days'"
  description: "`'days'`, `'weekdays'`, `'weekends'` или английское название дня недели, например `'mondays'`."
```

**Возвращает**

```returns
type: number
description: Количество подходящих календарных дней в диапазоне.
```

```js
const sprint = dateRange('2026-05-01', '2 weeks');

sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('weekends'); // 4
sprint.count('mondays'); // 2
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
range.splitBy(step): Range[]
range.splitBy(count, unit): Range[]
```

Делит диапазон на смежные поддиапазоны заданного шага, ограничивая последний фрагмент конечной границей диапазона. Принимает те же аргументы шага, что и [`every()`](#every); также доступен псевдоним `splitBy()`.

```js
dateRange('2026-09-01', '2026-09-10').split(4, 'days').map(String);
// ['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']
```
:::

:::entry
### `in()` :kind[method]

```js signature
dateRange.in(zone?): DateTimeRange
dtRange.in(zone): DateTimeRange
```

Преобразует включающий обе границы [`DateRange`](#daterange) в полуоткрытый [`DateTimeRange`](#datetimerange) — от полуночи начального дня (`start`) до полуночи дня, следующего за конечным (`end`), не включая верхнюю границу, что удобно для запросов по меткам времени. У диапазона моментов времени переводит обе границы в указанный часовой пояс.

Вызов `in()` на диапазоне времени суток выбрасывает `RangeError`, поскольку у времени суток нет календарной даты.

**Параметры**

```params
- name: zone
  type: Zone
  description: Идентификатор часового пояса IANA, фиксированное смещение UTC или `'UTC'`. На `DateRange` по умолчанию используется настроенный часовой пояс.
```

**Возвращает**

```returns
type: DateTimeRange
description: Полуоткрытый диапазон моментов времени в часовом поясе `zone`.
```

```js
dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
// '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
```
:::

## Форматирование и преобразование

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

Для пресетов и объектов опций использует локализованное форматирование диапазонов `Intl`, автоматически схлопывая общие даты или месяцы. При использовании шаблонов токенов каждая граница форматируется отдельно, после чего они соединяются через `' – '`.

Пользовательские форматы, зарегистрированные в [`configure()`](/api/configure/), тоже поддерживаются. Подробности о пресетах и токенах — в руководстве [Форматирование](/guides/formatting/).

**Параметры**

```params
- name: spec
  type: FormatSpec
  description: Имя пресета, объект `Intl.DateTimeFormatOptions` или шаблон токенов.
- name: locale
  type: Locale
  description: Тег локали BCP 47, переопределяющий локаль этого диапазона или настроенную локаль для одного вызова.
```

**Возвращает**

```returns
type: string
description: Отформатированная строка диапазона.
```

```js
const trip = dateRange('2026-09-01', '2026-09-07');

trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('22:00', '06:00').format('HH:mm'); // '22:00 – 06:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
range.locale(): Locale | undefined
range.locale(tag): Range
```

Читает локаль, привязанную к этому диапазону, или возвращает копию, которая форматируется в другой локали в текстовых представлениях, пресетах, границах и поддиапазонах. Пустой тег сбрасывает привязанную локаль; [`lang()`](#lang) работает как псевдоним.

**Параметры**

```params
- name: tag
  type: Locale | null | undefined
  description: Тег локали BCP 47, который сохраняется в цепочке, или `null` для сброса существующего тега.
```

**Возвращает**

```returns
type: Range | Locale | undefined
description: Активный тег при вызове без аргументов или новый диапазон того же типа с тегом `tag`.
```

```js
const stay = dateRange('2026-09-01', '2026-09-07').locale('de-DE');

stay.locale(); // 'de-DE'
stay.format('medium'); // '01.–07.09.2026'
stay.duration.text; // '7 Tage'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
range.lang(): Locale | undefined
range.lang(tag): Range
```

Короткий псевдоним [`locale()`](#locale), который читает или привязывает тег локали BCP 47 к этому диапазону.
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

Возвращает длительность диапазона при запросе `'duration'` в цепочках вызовов; для других типов выбрасывает `RangeError`.

```js
dateRange('2026-09-01', '2026-09-07').as('duration').days; // 7
```
:::

:::entry
### `toString()` :kind[method]

```js signature
range.toString(): string
range.toJSON(): string
```

Возвращает строку интервала ISO 8601 `'start/end'`, которая напрямую разбирается обратно в [фабричных функциях диапазонов](/api/range-fn/). `toJSON()` возвращает ту же строку при сериализации в JSON.

```js
dateRange('2026-09-01', '2026-09-07').toString(); // '2026-09-01/2026-09-07'
timeRange('9am', '5pm').toJSON(); // '09:00:00/17:00:00'
```
:::

:::entry
### `valueOf()` :kind[method]

```js signature
range.valueOf(): never
```

Выбрасывает `RangeError`, чтобы числовые операторы никогда не приводили диапазон к числу.

Для сужения неизвестных значений во время выполнения используйте [`kindOf()`](/api/kind-of/) или экспортированные [функции проверки типа диапазонов](/api/kind-of/#type-guards):

```js
import { dateRange, isDateRange, isDateTimeRange, isTimeRange } from 'native-dates';

const stay = dateRange('2026-09-01', '2026-09-07');
isDateRange(stay); // true
isDateTimeRange(stay); // false
isTimeRange(stay); // false
```
:::
