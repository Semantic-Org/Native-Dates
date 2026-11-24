---
source: ec38498f1427
title: Арифметика дат
lede: Прибавляйте длительности, выравнивайте значения по границам календаря и переходите по дням недели или диапазонам без изменения исходных объектов.
---

Все даты, значения времени суток и моменты времени в Native Dates неизменяемы. Методы, которые сдвигают или округляют значение, всегда возвращают новый экземпляр, оставляя исходный без изменений.

## Прибавление и вычитание

Вызовите [`plus()`](/api/date-time/#plus) или [`minus()`](/api/date-time/#minus), чтобы сдвинуть значение вперёд или назад:

```js
import { date } from 'native-dates';

const created = date('2026-11-16');
const due = created.plus(2, 'weeks');

created.toString(); // '2026-11-16'
due.toString(); // '2026-11-30'
```

Оба метода принимают число с единицей измерения, английскую фразу длительности, объект с полями или экземпляр [`Duration`](/api/duration/). В качестве псевдонимов также работают привычные [`add()`](/api/date-time/#plus) и [`subtract()`](/api/date-time/#minus):

```js
import { datetime, hours } from 'native-dates';

const kickoff = datetime('2026-11-16T09:00', 'America/New_York');

kickoff.plus(2, 'weeks');
kickoff.plus('1h 30m');
kickoff.plus({ days: 2, hours: 4 });
kickoff.minus(hours(3));
```

:::tip[Единицы должны соответствовать типу]
Календарная дата не принимает единицы времени суток вроде часов, потому что у неё нет времени суток. Время суток не принимает календарные единицы вроде дней, так как оно замыкается по 24-часовому кругу. Если расчёты затрагивают и то, и другое, сначала объедините их через [`at()`](/api/calendar-date/#at).
:::

## Концы месяцев и переход на летнее время

Прибавление месяцев или лет ограничивает результат последним днём целевого месяца, а не переносит лишние дни на следующий месяц. Прибавление одного месяца к 31 января даёт 28 февраля или 29 февраля в високосный год:

```js
import { date } from 'native-dates';

date('2026-01-31').plus(1, 'month').toString(); // '2026-02-28'
date('2028-01-31').plus(1, 'month').toString(); // '2028-02-29'
```

Для [`DateTime`](/api/date-time/) календарные единицы сохраняют местное время суток при сезонном переводе часов. Единицы времени суток, напротив, отсчитывают точное количество прошедших часов и минут:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

Подробнее о весеннем и осеннем переводе часов читайте в руководстве [Часовые пояса](/guides/time-zones/).

## Выравнивание по границам единиц

Вызовите [`startOf()`](/api/date-time/#startof) или [`endOf()`](/api/date-time/#endof), чтобы перейти к началу или концу года, квартала, месяца, недели, дня либо единицы времени суток.

Для календарной даты конец месяца — это его последний день. Для момента времени конец единицы — её последняя миллисекунда:

```js
import { date, datetime } from 'native-dates';

const midMonth = date('2026-11-18');
midMonth.startOf('month').toString(); // '2026-11-01'
midMonth.endOf('month').toString(); // '2026-11-30'

const stamp = datetime('2026-11-18T14:20', 'UTC');
stamp.endOf('day').toString(); // '2026-11-18T23:59:59.999Z'
```

Недели начинаются с первого дня, принятого в активной локали — например, с воскресенья в `'en-US'` или с понедельника в `'de-DE'`. Чтобы переопределить это для одного вызова, передайте вторым аргументом английское название дня недели либо задайте глобальное правило через [`configure()`](/api/configure/):

```js
const wednesday = date('2026-11-18');

wednesday.locale('en-US').startOf('week').toString(); // '2026-11-15'
wednesday.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wednesday.startOf('week', 'monday').toString(); // '2026-11-16'
```

Вызовите [`startOfNext()`](/api/date-time/#startofnext) или [`startOfPrevious()`](/api/date-time/#startofprevious), чтобы получить начало следующей или предыдущей единицы. Оба метода всегда переходят в соседнюю единицу, поэтому `startOfNext('month')` от 1 декабря вернёт 1 января:

```js
const invoiced = date('2026-11-16');

invoiced.startOfNext('month').toString(); // '2026-12-01'
invoiced.startOfNext('quarter').toString(); // '2027-01-01'
invoiced.startOfPrevious('month').toString(); // '2026-10-01'
```

## Округление времени суток

Вызовите [`round()`](/api/date-time/#round) на моменте времени или времени суток, чтобы округлить значение до ближайшей единицы или шага, либо округлите его в нужную сторону с помощью `floor()` (вниз) и `ceil()` (вверх):

```js
import { time } from 'native-dates';

const logged = time('9:23am');

logged.round('hour').format('short', 'en-US'); // '9:00 AM'
logged.round(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
logged.floor(15, 'minutes').format('short', 'en-US'); // '9:15 AM'
logged.ceil(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
```

Шаг округления (например, 5, 10, 15 или 30 минут) должен нацело делить следующую более крупную единицу.

## Переход по дням недели и повторяющимся датам

Вызовите [`next()`](/api/calendar-date/#next) или [`previous()`](/api/calendar-date/#previous) на дате или моменте времени и передайте английское название дня недели, чтобы перейти к ближайшему будущему или прошедшему дню. Если дата уже приходится на этот день недели, метод сдвигает её ровно на семь дней:

```js
import { date } from 'native-dates';

const monday = date('2026-11-16');

monday.next('friday').toString(); // '2026-11-20'
monday.next('monday').toString(); // '2026-11-23'
monday.previous('friday').toString(); // '2026-11-13'
```

Передайте [`MonthDay`](/api/month-day/), чтобы сразу найти следующее или предыдущее наступление дня рождения или ежегодного праздника:

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');
monday.next(birthday).toString(); // '2027-10-17'
```

На моменте времени метод `next()` сохраняет время суток. Если вместо этого нужно начало того дня, передайте английское название дня недели в `startOfNext()`:

```js
import { datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
```

## Построение и обход диапазонов

Создайте [диапазон](/guides/ranges/) с помощью [`dateRange()`](/api/range-fn/#daterange) или вызовите [`for()`](/api/ranges/#to) и [`to()`](/api/ranges/#to) на готовом значении. По диапазону можно пройтись с нужным шагом или разбить его на более мелкие поддиапазоны:

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2 weeks');

sprint.end.toString(); // '2026-11-15'
sprint.every('week').map(String); // ['2026-11-02', '2026-11-09']
sprint.split(1, 'week').length; // 2
```
