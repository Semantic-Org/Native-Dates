---
source: 6291509fd7f2
title: Месяцы и дни
lede: Храните месяц без дня или повторяющийся день рождения без года.
---

В обычном JavaScript для хранения срока действия карты приходится приписывать фиктивное первое число, а для дня рождения без года — подставлять условный високосный год вроде 2000. Типы [`YearMonth`](/api/year-month/) и [`MonthDay`](/api/month-day/) хранят только те части даты, которые действительно существуют.

## Расчётные месяцы и сроки действия карт

Используйте [`yearMonth()`](/api/year-month-fn/) для строк ISO или чисел года и месяца, а [`monthYear()`](/api/year-month-fn/#monthyear) — для сроков действия карт вроде 11/28:

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

Проверяйте, попадает ли дата в месяц, с помощью [`contains()`](/api/year-month/#contains), переходите вперёд по месяцам и кварталам через [`plus()`](/api/year-month/#plus) и выбирайте конкретный день методом [`on()`](/api/year-month/#on):

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

В более коротких месяцах 31-е число автоматически ограничивается последним днём месяца, включая 29 февраля в високосные годы.

## Дни рождения и ежегодные праздники

Используйте [`monthDay()`](/api/month-day-fn/) для строк с месяцем в начале и [`dayMonth()`](/api/month-day-fn/#daymonth) для строк с днём в начале. Имя фабричной функции задаёт порядок, поэтому строка 05/10 везде трактуется однозначно:

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

Находите следующее или предыдущее наступление даты от сегодняшнего дня или любой опорной даты с помощью [`next()`](/api/month-day/#next) и [`previous()`](/api/month-day/#previous):

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

В невисокосные годы 29 февраля переносится на 28 февраля. Вызовите [`fallsOn()`](/api/month-day/#fallson), чтобы проверить, совпадает ли переданная дата:

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## Переход между частичными и полными датами

Получайте `.yearMonth` и `.monthDay` напрямую из свойств любой даты или момента времени либо вызывайте [`as()`](/api/date-time/#as) в цепочке вызовов:

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

В обратную сторону вызовите `on()` с номером дня на `YearMonth` или [`in()`](/api/month-day/#in) с номером года на `MonthDay`, чтобы получить полную календарную дату.

## Форматирование и хранение

Оба типа форматируются через `.text` и [`format()`](/api/year-month/#format), а [`toString()`](/api/year-month/#tostring) преобразует их в строки ISO:

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

Строки вроде `2026-11` и `10-17` удобно хранить в базе данных или передавать в URL, а затем разбирать обратно через `yearMonth()` и `monthDay()`.
