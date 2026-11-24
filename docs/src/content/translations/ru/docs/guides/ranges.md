---
source: 8e9d9ff9bd0c
title: Диапазоны
lede: Работайте с промежутками между двумя датами, значениями времени суток или моментами времени — от проверки пересечений до форматирования.
---

[Диапазон](/api/ranges/) описывает промежуток с началом и концом — например, бронь в отеле, часы работы или запланированную встречу. Для каждого типа времени предусмотрен свой класс диапазона, поэтому календарные даты остаются календарными датами, а диапазоны времени суток не обрастают фиктивной датой.

## Создание диапазонов

Создайте диапазон напрямую с помощью [`dateRange()`](/api/range-fn/), [`timeRange()`](/api/range-fn/#timerange) или [`datetimeRange()`](/api/range-fn/#datetimerange). Каждая фабричная функция принимает две границы, начало с английской фразой длительности (или `Duration`) либо одну строку интервала:

```js
import { dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');
const trip = dateRange('2026-09-01', '2026-09-07');
const hours = timeRange('9am - 5pm');
const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
```

Если у вас уже есть дата, время суток или момент времени, вызовите [`for()`](/api/ranges/#to), [`to()`](/api/ranges/#to) или [`range()`](/api/ranges/#range) прямо на этом значении:

```js
import { today } from 'native-dates';

const upcoming = today().for(2, 'weeks');
const thisMonth = today().range('month');
```

## Даты включительно и полуоткрытые интервалы времени

Диапазоны календарных дат включают конечный день, поскольку «с 1 по 7 сентября» — это все семь дней. Диапазоны моментов времени и времени суток — это полуоткрытые интервалы `[start, end)`, исключающие верхнюю границу, поэтому смежные слоты никогда не пересекаются:

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-09-01', '2026-09-07').duration.days; // 7

const first = timeRange('9:00am', '10:00am');
const second = timeRange('10:00am', '11:00am');
first.overlaps(second); // false
```

Если диапазон времени суток заканчивается раньше, чем начинается, он переходит через полночь — это удобно для ночных смен и заведений, работающих допоздна:

```js
const nightShift = timeRange('22:00', '06:00');

nightShift.contains('02:30'); // true
nightShift.duration.hours; // 8
```

## Вхождение и пересечение

Проверяйте, попадает ли точка или поддиапазон внутрь промежутка, с помощью [`contains()`](/api/ranges/#contains), а два диапазона сравнивайте через [`overlaps()`](/api/ranges/#overlaps) и [`intersection()`](/api/ranges/#intersection):

```js
import { dateRange } from 'native-dates';

const booking = dateRange('2026-11-10', '2026-11-18');
const holiday = dateRange('2026-11-15', '2026-11-22');

booking.contains('2026-11-14'); // true
booking.overlaps(holiday); // true
booking.intersection(holiday).toString(); // '2026-11-15/2026-11-18'
```

Если два диапазона не пересекаются, `intersection()` возвращает `null`.

## Обход, подсчёт и разбиение

Вызовите [`every()`](/api/ranges/#every), чтобы пройтись по диапазону с заданным шагом и собрать все даты, значения времени суток или моменты времени. У диапазона дат можно вызвать [`count()`](/api/ranges/#count), чтобы сразу подсчитать дни, будни, выходные или конкретный день недели (передаётся английское название дня недели):

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');

sprint.every('week').map(String); // ['2026-05-01', '2026-05-08']
sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('mondays'); // 2
```

Вызовите [`split()`](/api/ranges/#split), когда вместо отдельных точек нужны поддиапазоны — например, чтобы разбить смену на слоты для записи или спринт на недели:

```js
import { timeRange } from 'native-dates';

const morning = timeRange('9:00am', '12:00pm');
const slots = morning.split(30, 'minutes');

slots.length; // 6
slots[0].toString(); // '09:00:00/09:30:00'
```

## Форматирование и сериализация

При форматировании диапазона с помощью пресета общие месяцы и годы сворачиваются по правилам активной локали. Передайте шаблон токенов, чтобы явно отформатировать обе границы:

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('9:00am', '5:00pm').format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

Каждый диапазон предоставляет свою длительность в `.duration` и сериализуется в строку интервала ISO 8601 методом [`toString()`](/api/ranges/#tostring). Передача этой строки обратно в ту же фабричную функцию восстанавливает исходный диапазон:

```js
const raw = week.toString(); // '2026-09-01/2026-09-07'
dateRange(raw).equals(week); // true
```
