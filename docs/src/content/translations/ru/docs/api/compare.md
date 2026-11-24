---
source: a03fe5ee9f3b
title: compare()
lede: Сортировка и выбор крайних значений среди календарных дат, моментов времени, времени суток, длительностей и диапазонов.
---

## Сортировка и упорядочивание

:::entry
### `compare()` :kind[function]

```js signature
compare(a, b): -1 | 0 | 1
```

Упорядочивает два значения одного вида для `Array.prototype.sort()`, возвращая отрицательное число, ноль или положительное число. Работает с моментами времени, временными метками эпохи Unix, календарными датами, временем суток, длительностями, значениями [года и месяца](/api/year-month/) и [диапазонами](/api/ranges/).

Любым из аргументов может быть сырая строка ISO, нативный объект `Date` или временная метка в миллисекундах с эпохи Unix. При сравнении со временем суток число трактуется как час, а сравнение значений разных видов выбрасывает `TypeError`.

```js title="sort.js"
import { compare, date, datetime, hours, minutes } from 'native-dates';

const dates = [date('2026-12-01'), date('2026-05-10'), date('2026-08-20')];
dates.sort(compare).map(String); // ['2026-05-10', '2026-08-20', '2026-12-01']

const moments = [
  datetime('2026-11-16T18:00', 'Europe/Berlin'),
  datetime('2026-11-16T08:00', 'America/Los_Angeles'),
];
moments.sort(compare)[0].zone; // 'America/Los_Angeles'

compare(1794840000000, datetime('2026-11-16T18:00Z')); // -1

const spans = [hours(2), minutes(45), minutes(90)].sort(compare);
spans[0].minutes; // 45
```

**Параметры**

```params
- name: a
  type: Point | Duration | YearMonth | Range
  required: true
  description: Первое типизированное значение, строка ISO, объект `Date` или временная метка в миллисекундах с эпохи Unix для сравнения.
- name: b
  type: Point | Duration | YearMonth | Range
  required: true
  description: Второе значение того же вида или сырое входное значение, совместимое с `a`.
```

**Возвращает**

```returns
type: -1 | 0 | 1
description: "Значение `-1`, если первый аргумент раньше, `0` — если значения равны, и `1` — если позже."
```

Диапазоны одного вида сортируются сначала по начальной границе, а при совпадении — по конечной:

```js
import { compare, dateRange } from 'native-dates';

const windows = [
  dateRange('2026-11-10', '2026-11-20'),
  dateRange('2026-11-10', '2026-11-14'),
  dateRange('2026-11-01', '2026-11-05'),
];

windows.sort(compare).map(String);
// ['2026-11-01/2026-11-05', '2026-11-10/2026-11-14', '2026-11-10/2026-11-20']
```
:::

:::note[Сравнение моментов времени в разных часовых поясах]
`compare()` упорядочивает значения [`DateTime`](/api/date-time/) по их точному моменту времени, а не по локальным показаниям часов. Встреча в 9:00 в Нью-Йорке идёт раньше встречи в 8:00 того же дня в Лос-Анджелесе.
:::

## Выбор крайних точек

Найдите минимальное или максимальное значение среди набора календарных дат, моментов времени, значений времени суток или [`YearMonth`](/api/year-month/). Обе функции принимают аргументы через запятую или один непустой массив.

:::entry
### `earliest()` :kind[function]

```js signature
earliest(...points): DateTime | CalendarDate | Time | YearMonth
earliest(points): DateTime | CalendarDate | Time | YearMonth
```

Возвращает самое раннее значение из одного или нескольких аргументов либо непустого массива одного вида; нативные объекты `Date` и временные метки в миллисекундах с эпохи Unix преобразуются в [`DateTime`](/api/date-time/). Передача пустого массива выбрасывает `RangeError`.

**Параметры**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: "Одно или несколько значений одного вида: календарные даты, моменты времени, объекты `Date`, временные метки эпохи Unix, время суток или пары год-месяц."
```

**Возвращает**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: Самое раннее значение. При равных моментах времени сохраняется элемент, встретившийся в списке раньше.
```

```js
import { date, earliest, time } from 'native-dates';

earliest(date('2026-11-20'), date('2026-11-04'), date('2026-11-16')).toString(); // '2026-11-04'
earliest([time('5:30pm'), time('9:00am'), time('12:15pm')]).toString(); // '09:00:00'
earliest(1794850200000, 1794840000000).epochMilliseconds; // 1794840000000
```
:::

:::entry
### `latest()` :kind[function]

```js signature
latest(...points): DateTime | CalendarDate | Time | YearMonth
latest(points): DateTime | CalendarDate | Time | YearMonth
```

Возвращает самое позднее значение из одного или нескольких аргументов либо непустого массива одного вида; нативные объекты `Date` и временные метки в миллисекундах с эпохи Unix также преобразуются в `DateTime`. Передача пустого массива выбрасывает `RangeError`.

**Параметры**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: "Одно или несколько значений одного вида: календарные даты, моменты времени, объекты `Date`, временные метки эпохи Unix, время суток или пары год-месяц."
```

**Возвращает**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: Самое позднее значение. При равных моментах времени сохраняется элемент, встретившийся в списке раньше.
```

Объедините [`earliest()`](#earliest) и `latest()`, чтобы ограничить значение двумя границами:

```js
import { date, earliest, latest } from 'native-dates';

const minDate = date('2026-11-01');
const maxDate = date('2026-11-30');
const picked = date('2026-12-12');

const clamped = earliest(maxDate, latest(minDate, picked));
clamped.toString(); // '2026-11-30'
```
:::
