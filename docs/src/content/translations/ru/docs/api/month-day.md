---
source: 436c0292465a
title: MonthDay
lede: Календарный месяц и день без года — для дней рождения, годовщин и ежегодных праздников.
---

## Создание MonthDay

Создавайте экземпляр в порядке с месяцем в начале через [`monthDay()`](/api/month-day-fn/) или с днём в начале через [`dayMonth()`](/api/month-day-fn/#daymonth). Экземпляры неизменяемые, поэтому каждый метод возвращает новое значение.

```js title="create.js"
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);
const fromIso = monthDay('10-17');
const european = dayMonth('17/10');
```

Месяц и день можно получить из любой [календарной даты](/api/calendar-date/) или [момента времени](/api/date-time/) через свойство `monthDay`, либо извлечь их внутри цепочки вызовов методом `as('monthDay')`:

```js
import { date, datetime, today } from 'native-dates';

date('1990-10-17').monthDay.toString(); // '10-17'
datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles').as('monthDay').toString(); // '10-17'
const currentMonthDay = today().monthDay;
```

## Свойства

Свойства возвращают месяц и день месяца (нумерация с 1).

| Свойство | Тип | Описание |
|---|---|---|
| `text` | `string` | Месяц и день в формате активной локали, например `'Oct 17'`. |
| `month`, `day` | `number` | Календарный месяц от 1 до 12 и день месяца от 1 до 31. |

## Подстановка года, переход вперёд и назад

Объединяйте повторяющийся месяц и день с конкретным годом, чтобы получить календарную дату, или переходите вперёд и назад к ближайшим датам.

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

Подставляет этот месяц и день в указанный календарный год и возвращает [`CalendarDate`](/api/calendar-date/). В невисокосные годы 29 февраля ограничивается 28 февраля.

**Параметры**

```params
- name: year
  type: number | string
  required: true
  description: Календарный год (целое число), например `2027`.
```

**Возвращает**

```returns
type: CalendarDate
description: Экземпляр `CalendarDate`, на который приходится эта дата в году `year`.
```

```js
const birthday = monthDay(10, 17);
const leapDay = monthDay(2, 29);

birthday.in(2027).toString(); // '2027-10-17'
leapDay.in(2027).toString(); // '2027-02-28'
leapDay.in(2028).toString(); // '2028-02-29'
```
:::

:::entry
### `next()` :kind[method]

```js signature
md.next(day?): CalendarDate
```

Возвращает следующую дату, на которую приходится этот месяц и день после опорной даты (по умолчанию — после [`today()`](/api/date-fn/#today)). Если опорная дата сама приходится на этот месяц и день, метод переходит к следующему году.

Календарные даты и моменты времени тоже принимают `MonthDay` напрямую в [`d.next(md)`](/api/calendar-date/#next) и [`dt.next(md)`](/api/date-time/#next).

**Параметры**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Опорная дата для отсчёта вперёд.
```

**Возвращает**

```returns
type: CalendarDate
description: Ближайший экземпляр `CalendarDate` после `day`.
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
date('2026-11-16').next(birthday).toString(); // '2027-10-17'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
md.previous(day?): CalendarDate
md.last(day?): CalendarDate
```

Возвращает ближайшую предыдущую дату, на которую приходится этот месяц и день до опорной даты (по умолчанию — до [`today()`](/api/date-fn/#today)). Календарные даты и моменты времени также принимают `MonthDay` напрямую в `previous()`. Доступен псевдоним `last()`.

**Параметры**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: Опорная дата для отсчёта назад.
```

**Возвращает**

```returns
type: CalendarDate
description: Ближайший экземпляр `CalendarDate` до `day`.
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.previous('2026-10-17').toString(); // '2025-10-17'
date('2026-11-16').previous(birthday).toString(); // '2026-10-17'
```
:::

:::entry
### `after()` :kind[method]

```js signature
md.after(day): CalendarDate
```

Возвращает следующую дату этого месяца и дня после обязательной опорной даты. Работает так же, как [`next()`](#next), но без подстановки сегодняшнего дня по умолчанию.

**Параметры**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Опорная дата, после которой нужно найти следующую дату.
```

**Возвращает**

```returns
type: CalendarDate
description: Первая дата `CalendarDate` для этого месяца и дня после `day`.
```

```js
monthDay(2, 29).after('2026-03-01').toString(); // '2027-02-28'
```
:::

:::entry
### `before()` :kind[method]

```js signature
md.before(day): CalendarDate
```

Возвращает ближайшую предыдущую дату этого месяца и дня до обязательной опорной даты. Работает так же, как [`previous()`](#previous), но без подстановки сегодняшнего дня по умолчанию.

```js
monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
```
:::

## Совпадение и равенство

Поскольку `MonthDay` повторяется каждый год и не задаёт единственную точку на временной шкале, методы упорядочения вроде `isBefore()` к нему не применимы.

:::tip[Когда выбрать equals, а когда fallsOn]
Используйте [`fallsOn()`](#fallson), чтобы проверить, приходится ли ежегодное событие на указанную календарную дату в соответствующем году — например, 29 февраля в невисокосном году выпадает на 28 февраля. Метод [`equals()`](#equals) оставляйте для точной проверки совпадения номеров месяца и дня.
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
md.isOn(day): boolean
```

Возвращает `true`, если переданная дата — это день, на который этот `MonthDay` выпадает в том же году. В невисокосном году 29 февраля выпадает на 28 февраля, а в високосном — только на 29 февраля. Также доступен псевдоним `isOn()`.

**Параметры**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: Строка даты, экземпляр `CalendarDate`, `DateTime`, объект полей или `Date`.
```

**Возвращает**

```returns
type: boolean
description: "`true`, если этот `MonthDay` выпадает на дату `day` в соответствующем году."
```

```js
const leapDay = monthDay(2, 29);

leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```
:::

:::entry
### `equals()` :kind[method]

```js signature
md.equals(other): boolean
```

Возвращает `true`, если оба значения содержат строго одинаковые номера месяца и дня; при передаче полной даты или момента времени из них извлекаются месяц и день.

Неоднозначные строки со слешем или точкой вроде `'05/10'` выбрасывают `RangeError`. Перед сравнением разберите их с помощью [фабричных функций с явным порядком месяца и дня](/api/month-day-fn/).

**Параметры**

```params
- name: other
  type: MonthDayInput
  required: true
  description: Другой экземпляр `MonthDay`, строка ISO `'10-17'`, объект полей или значение даты.
```

**Возвращает**

```returns
type: boolean
description: "`true`, если у обоих значений совпадают месяц и день."
```

```js
const birthday = monthDay(10, 17);

birthday.equals('10-17'); // true
birthday.equals('1990-10-17'); // true
monthDay(2, 29).equals('2027-02-28'); // false
```
:::

:::entry
### `isToday()` :kind[method]

```js signature
md.isToday(zone?): boolean
```

Возвращает `true`, если этот месяц и день приходятся на сегодняшнюю дату в указанном или настроенном часовом поясе.

```js
import { today } from 'native-dates';

today('UTC').monthDay.isToday('UTC'); // true
```
:::

:::entry
### `isTomorrow()` :kind[method]

```js signature
md.isTomorrow(zone?): boolean
```

Возвращает `true`, если этот месяц и день приходятся на завтрашнюю дату в указанном или настроенном часовом поясе.

```js
import { tomorrow } from 'native-dates';

tomorrow('UTC').monthDay.isTomorrow('UTC'); // true
```
:::

:::entry
### `isYesterday()` :kind[method]

```js signature
md.isYesterday(zone?): boolean
```

Возвращает `true`, если этот месяц и день приходятся на вчерашнюю дату в указанном или настроенном часовом поясе.

```js
import { yesterday } from 'native-dates';

yesterday('UTC').monthDay.isYesterday('UTC'); // true
```
:::

## Форматирование и преобразование

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

Форматирует месяц и день в порядке, принятом в локали, или по встроенному шаблону токенов вроде `'MMM Do'`. Из общих объектов опций ключи года, времени суток и часового пояса игнорируются автоматически.

Пользовательские форматы, зарегистрированные через [`configure()`](/api/configure/), тоже работают; для негригорианских локалей выводятся григорианские названия месяцев, чтобы ежегодные даты оставались стабильными. Все пресеты и токены описаны в руководстве [Форматирование](/guides/formatting/).

**Параметры**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Имя пресета вроде `'short'` или `'long'`, объект опций `Intl` либо шаблон токенов.
- name: locale
  type: Locale
  description: Тег локали BCP 47, переопределяющий локаль этого значения или настроенную локаль для одного вызова.
```

**Возвращает**

```returns
type: string
description: Отформатированная строка с месяцем и днём.
```

```js
const oct17 = monthDay(10, 17);

oct17.format('short', 'en-US'); // '10/17'
oct17.format('short', 'en-GB'); // '17/10'
oct17.format('medium', 'en-US'); // 'Oct 17'
oct17.format('long', 'en-US'); // 'October 17'
oct17.format('MMM Do', 'en-US'); // 'Oct 17th'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
md.locale(): Locale | undefined
md.locale(tag): MonthDay
```

Читает локаль, привязанную к этому `MonthDay`, или возвращает копию, которая форматируется в другой локали в текстовых представлениях, пресетах и во всех производных датах. Пустой тег сбрасывает привязанную локаль; [`lang()`](#lang) работает как псевдоним.

**Параметры**

```params
- name: tag
  type: Locale | null | undefined
  description: Тег локали BCP 47, который сохраняется в цепочке, или `null` для сброса существующего тега.
```

**Возвращает**

```returns
type: MonthDay | Locale | undefined
description: Активный тег при вызове без аргументов или новый экземпляр `MonthDay` с тегом `tag`.
```

```js
const labourDay = monthDay(5, 1).locale('ru');

labourDay.locale(); // 'ru'
labourDay.format('long'); // '1 мая'
labourDay.in(2026).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
md.lang(): Locale | undefined
md.lang(tag): MonthDay
```

Короткий псевдоним [`locale()`](#locale), который читает или привязывает тег локали BCP 47 к этому `MonthDay`.
:::

:::entry
### `as()` :kind[method]

```js signature
md.as('monthDay'): MonthDay
```

Возвращает этот экземпляр при запросе `'monthDay'` в обобщённых цепочках преобразований; для любых других типов выбрасывает `RangeError`.
:::

:::entry
### `toString()` :kind[method]

```js signature
md.toString(): string
md.toJSON(): string
```

Возвращает строку ISO `'MM-DD'` с двузначными месяцем и днём, которая однозначно разбирается обратно в порядке с месяцем в начале обеими [фабричными функциями для месяца и дня](/api/month-day-fn/). `toJSON()` возвращает ту же строку при сериализации в JSON.

**Возвращает**

```returns
type: string
description: Строка месяца и дня ISO, например `'10-17'`.
```

```js
monthDay(5, 6).toString(); // '05-06'
JSON.stringify({ birthday: monthDay(10, 17) }); // '{"birthday":"10-17"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
md.toTemporal(): Temporal.PlainMonthDay
```

Возвращает базовый экземпляр `Temporal.PlainMonthDay`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
md.valueOf(): never
```

Выбрасывает `RangeError`, чтобы числовые операторы никогда не приводили месяц и день к числу. Для сужения неизвестных значений используйте [`isMonthDay()`](/api/kind-of/#ismonthday) или [`kindOf()`](/api/kind-of/).
:::
