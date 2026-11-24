---
source: 8bfe5a8d41c8
title: Типы времени
lede: Выберите подходящий тип для календарной даты, времени суток, момента времени, частичной даты, диапазона или длительности.
---

Встроенный `Date` в JavaScript использует один объект для всего — будь то день рождения, будильник на 9:30 или точная секунда оформления заказа.

В Native Dates у каждой сущности свой тип, поэтому вы работаете только с теми полями, которые действительно есть у значения:

- **[`CalendarDate`](/api/calendar-date/)** — календарная дата, например 10 мая 2026 года
- **[`Time`](/api/time/)** — время суток, например 9:30
- **[`DateTime`](/api/date-time/)** — конкретный момент времени в заданном часовом поясе
- **[`Duration`](/api/duration/)** — длительность, например 2 часа или 3 недели
- **[`YearMonth`](/api/year-month/)** и **[`MonthDay`](/api/month-day/)** — месяц без дня или повторяющаяся дата без года
- **[Диапазоны](/api/ranges/)** — промежуток между двумя датами, значениями времени суток или моментами времени

## CalendarDate

Используйте [`CalendarDate`](/api/calendar-date/), когда событие привязано ко дню, а не к конкретной секунде: дни рождения, сроки оплаты, праздники или значения из календаря выбора даты.

Создайте экземпляр с помощью [`today()`](/api/date-fn/#today) или [`date()`](/api/date-fn/):

```js
import { date, today } from 'native-dates';

const birthday = date('2026-05-10');
const due = today().plus(2, 'weeks');

birthday.month; // 5
birthday.day; // 10
```

У календарной даты нет времени суток и часового пояса, поэтому 10 мая остаётся 10 мая для любого пользователя, где бы он ни находился.

## Time

Используйте [`Time`](/api/time/) для времени суток без привязки к конкретной дате — например, для часов работы магазина или ежедневного напоминания.

```js
import { time } from 'native-dates';

const opens = time('9:00am');
const closes = opens.plus(8, 'hours');

closes.hour; // 17
closes.format('short', 'en-US'); // '5:00 PM'
```

При прибавлении часов за полночь значение аккуратно переходит по 24-часовому кругу, так как у времени суток нет даты, которую можно перевести на следующий день.

## DateTime

Используйте [`DateTime`](/api/date-time/), когда событие происходит в конкретный момент времени: встреча, вылет рейса или метка времени из базы данных.

Создайте его с помощью [`now()`](/api/datetime-fn/#now) или [`datetime()`](/api/datetime-fn/), либо добавьте время суток к календарной дате:

```js
import { date, datetime, now } from 'native-dates';

const current = now();
const created = datetime('2026-11-16T17:30:00Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
```

Каждый момент времени хранит и то, когда событие произошло, и то, в каком часовом поясе вы на него смотрите. Вызовите [`in()`](/api/date-time/#in), чтобы увидеть тот же момент в другом городе:

```js
standup.in('Europe/Berlin').format('time', 'en-US'); // '6:30 PM'
```

## Duration

Используйте [`Duration`](/api/duration/), чтобы задать длительность. Создайте её с помощью вспомогательных функций единиц вроде [`hours()`](/api/duration-fn/#hours) или передайте английскую фразу длительности в [`duration()`](/api/duration-fn/):

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
```

Измерение промежутка между двумя значениями тоже возвращает длительность:

```js
const opens = time('9:00am');
const lunch = time('12:30pm');

opens.until(lunch).format('long', 'en-US'); // '3 hours, 30 minutes'
```

## YearMonth

Используйте [`YearMonth`](/guides/months-and-days/#billing-months-and-card-expiries), когда у значения есть год и месяц без дня: расчётный период, срок действия карты или поле выбора месяца.

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.on(15); // CalendarDate для 2026-11-15
```

Этот тип считает в месяцах и годах, а метод [`on()`](/api/year-month/#on) выбирает любой день внутри месяца и возвращает календарную дату.

## MonthDay

Используйте [`MonthDay`](/guides/months-and-days/#birthdays-and-annual-holidays) для повторяющейся даты без года — например, дня рождения или ежегодного праздника.

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');

birthday.in(2026); // CalendarDate для 2026-10-17
birthday.fallsOn('2026-10-17'); // true
```

В невисокосные годы 29 февраля автоматически переносится на 28 февраля при вызове [`fallsOn()`](/api/month-day/#fallson) или [`in()`](/api/month-day/#in).

## Диапазоны

Используйте [Диапазоны](/guides/ranges/) для промежутка между двумя датами, значениями времени суток или моментами времени. Создавайте их напрямую через [`dateRange()`](/api/range-fn/#daterange), [`timeRange()`](/api/range-fn/#timerange) или [`datetimeRange()`](/api/range-fn/#datetimerange):

```js
import { dateRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');

sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8
```

Диапазоны дат включают конечный день, а диапазоны моментов времени и времени суток исключают верхнюю границу, поэтому смежные слоты никогда не пересекаются.

## Переход между типами

Типы напрямую связаны между собой: можно добавлять недостающие части или отбрасывать лишние. Присоедините время суток к календарной дате через [`at()`](/api/calendar-date/#at), чтобы получить момент времени, или постройте диапазон от существующей точки через [`for()`](/api/ranges/#to) или [`to()`](/api/ranges/#to):

```js
const reminder = today().plus(1, 'day').at('9:00am');
const upcoming = today().for(2, 'weeks');
```

В обратную сторону нужную часть можно получить прямо из свойств момента времени или даты либо вызвать [`as()`](/api/date-time/#as) в цепочке вызовов:

```js
reminder.date; // CalendarDate на завтра
reminder.time; // Time для 09:00:00
reminder.yearMonth; // YearMonth
reminder.monthDay; // MonthDay
reminder.in('Asia/Tokyo').as('time'); // Time в Токио
```

:::tip[DateTime или CalendarDate?]
Спросите себя, должна ли смена часового пояса менять то, что видит пользователь. Созвон в 9:30 по Лос-Анджелесу проходит в 18:30 по Берлину, поэтому для него подходит `DateTime`. День рождения 10 мая остаётся 10 мая везде, поэтому здесь нужен `CalendarDate`.
:::
