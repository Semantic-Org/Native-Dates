---
source: d8be401b7194
title: Длительности
lede: Создавайте длительности через вспомогательные функции единиц или текстовые фразы, измеряйте промежутки и форматируйте их.
---

[`Duration`](/api/duration/) задаёт длительность — например, 90 минут или 2 недели. Вы можете создать её напрямую для арифметики дат или получить в результате измерения промежутка между двумя значениями.

## Создание Duration

Создавайте длительность с помощью функций единиц вроде [`hours()`](/api/duration-fn/#hours) или передайте в [`duration()`](/api/duration-fn/) английскую фразу длительности, строку ISO 8601 либо объект с полями:

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
const iso = duration('PT1H30M');
const window = duration({ hours: 2, minutes: 45 });
```

Значения отдельных единиц читаются напрямую из свойств экземпляра. Дробная часть автоматически переносится в следующую меньшую единицу, а целые числа остаются в той единице, которую вы указали:

```js
call.hours; // 1
call.minutes; // 30

const ninety = duration(90, 'minutes');
ninety.hours; // 0
ninety.minutes; // 90
```

## Измерение промежутка между двумя значениями

Вызовите [`until()`](/api/date-time/#until) или [`since()`](/api/date-time/#since) для двух дат, значений времени суток, экземпляров [`YearMonth`](/api/year-month/) или моментов времени, чтобы измерить промежуток между ними:

```js
import { datetime } from 'native-dates';

const opened = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const resolved = datetime('2026-11-16T10:30', 'America/Los_Angeles');

const elapsed = opened.until(resolved);
elapsed.hours; // 2
elapsed.minutes; // 30
```

Если для вычислений или индикатора прогресса нужно одно число, передайте целевую единицу вторым аргументом:

```js
opened.until(resolved, 'hours'); // 2.5
resolved.since(opened, 'minutes'); // 150
```

Каждый [диапазон](/api/ranges/) также предоставляет свою длительность напрямую через свойство `.duration`:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-07').duration.days; // 7
timeRange('9:00am', '5:30pm').duration.hours; // 8
```

## Балансировка и подсчёт итога в одной единице

Значения остаются в исходных единицах, пока вы сами не попросите пересчитать их. Вызовите [`balance()`](/api/duration/#balance), чтобы перенести переполнение в более крупные единицы:

```js
import { hours, minutes, months } from 'native-dates';

minutes(90).balance().toFields(); // { hours: 1, minutes: 30 }
months(18).balance().toFields(); // { years: 1, months: 6 }
hours(36).balance('day').toFields(); // { days: 1, hours: 12 }
```

Без аргумента самостоятельная длительность переводит месяцы в годы, а единицы времени суток — вплоть до часов, не затрагивая дни, чтобы не исказить расчёты на границах перехода на летнее время.

Передайте `'day'` или `'week'`, если вам нужны фиксированные 24-часовые сутки или 7-дневные недели.

Вызовите [`total()`](/api/duration/#total) или его псевдоним [`as()`](/api/duration/#as), чтобы свести всю длительность к одному числу с плавающей точкой в нужной единице:

```js
import { duration } from 'native-dates';

const shift = duration('7h 30m');

shift.total('hours'); // 7.5
shift.as('minutes'); // 450
```

:::note[Подсчёт в месяцах и годах]
Годы и месяцы переводятся и балансируются друг в друга напрямую из расчёта 12 месяцев в году. Для перевода между днями и месяцами нужна опорная календарная дата — промежутки, полученные через `until()` и `since()`, запоминают её автоматически.
:::

```js
import { date, months } from 'native-dates';

months(18).total('years'); // 1.5

const span = date('2026-01-15').until('2026-04-15');
span.total('months'); // 3
span.total('days'); // 90
```

## Форматирование длительностей

Свойство `.text` любого экземпляра возвращает длительность в полном локализованном виде. Вызовите [`format()`](/api/duration/#format) с названием пресета, чтобы получить полную, сокращённую, компактную или цифровую запись:

```js
import { duration } from 'native-dates';

const flight = duration({ hours: 2, minutes: 30 });

flight.text; // '2 hours, 30 minutes'
flight.format('long', 'en-US'); // '2 hours, 30 minutes'
flight.format('short', 'en-US'); // '2 hr, 30 min'
flight.format('narrow', 'en-US'); // '2h 30m'
flight.format('digital', 'en-US'); // '2:30:00'
```

Передайте тег локали вторым аргументом, чтобы перевести названия единиц, или вызовите [`toString()`](/api/duration/#tostring), если нужна строка ISO 8601 для передачи в API.
