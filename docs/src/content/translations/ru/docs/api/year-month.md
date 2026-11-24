---
source: 09d43cd55ced
title: YearMonth
lede: Календарный год и месяц без дня — для расчётных периодов, срока действия карт и выбора месяца.
---

## Создание YearMonth

Создавайте экземпляр из строки ISO, числовых значений года и месяца или существующей даты с помощью [`yearMonth()`](/api/year-month-fn/), либо разбирайте строки со сроком действия карт с месяцем в начале через [`monthYear()`](/api/year-month-fn/#monthyear). Экземпляры неизменяемые, поэтому каждый метод, меняющий значение, возвращает новый экземпляр.

```js title="create.js"
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const quarterEnd = yearMonth(2026, 12);
const expiry = monthYear('11/26');
```

Год и месяц можно получить из любой [календарной даты](/api/calendar-date/) или [момента времени](/api/date-time/) через свойство `yearMonth`, либо извлечь их внутри цепочки вызовов методом `as('yearMonth')`:

```js
import { date, datetime, today } from 'native-dates';

date('2026-11-16').yearMonth.toString(); // '2026-11'
datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString(); // '2026-10'
const currentMonth = today().yearMonth;
```

## Свойства

Свойства возвращают год и месяц по ISO, а также границы календарного месяца и года.

| Свойство | Тип | Описание |
|---|---|---|
| `text` | `string` | Месяц и год в формате активной локали, например `'Nov 2026'`. |
| `year`, `month` | `number` | Календарный год и месяц (нумерация с 1: от 1 до 12). |
| `quarter` | `number` | Календарный квартал от 1 до 4. |
| `daysInMonth`, `daysInYear` | `number` | Количество дней в этом месяце (28–31) и в этом году (365 или 366). |
| `start`, `end` | [`CalendarDate`](/api/calendar-date/) | Первый и последний календарный день этого месяца. |
| `YearMonth.century` | `number` | Базовый век, добавляемый к двузначным годам в [`monthYear()`](/api/year-month-fn/#monthyear); по умолчанию `2000`. |

## Арифметика и поля

Сдвигайте значение вперёд или назад на месяцы, кварталы или годы, заменяйте поля или выбирайте конкретный день месяца.

:::note[Только месяцы и годы]
Единицы меньше месяца выбрасывают `RangeError`, потому что в `YearMonth` нет дня. Если нужна арифметика с неделями или днями, сначала выберите день методом [`on()`](#on).
:::

:::entry
### `plus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.add(amount, unit?): YearMonth
```

Сдвигает значение вперёд на годы, кварталы или месяцы и возвращает новый экземпляр `YearMonth`. Также доступен псевдоним `add()`.

**Параметры**

```params
- name: amount
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, строка с английской фразой длительности или ISO 8601 либо объект полей.
- name: unit
  type: Unit
  description: Английское название единицы (месяц, квартал или год), если `amount` — число.
```

**Возвращает**

```returns
type: YearMonth
description: Новый экземпляр `YearMonth`, сдвинутый вперёд по календарю.
```

```js
const billing = yearMonth('2026-11');

billing.plus(3, 'months').toString(); // '2027-02'
billing.plus('1 year').toString(); // '2027-11'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
ym.minus(amount, unit?): YearMonth
ym.subtract(amount, unit?): YearMonth
```

Сдвигает значение назад на годы, кварталы или месяцы и возвращает новый экземпляр. Принимает те же аргументы, что и [`plus()`](#plus); `subtract()` работает как псевдоним.

**Параметры**

```params
- name: amount
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, строка с английской фразой длительности или ISO 8601 либо объект полей.
- name: unit
  type: Unit
  description: Английское название единицы (месяц, квартал или год), если `amount` — число.
```

**Возвращает**

```returns
type: YearMonth
description: Новый экземпляр `YearMonth`, сдвинутый назад по календарю.
```

```js
yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

Возвращает новый экземпляр `YearMonth` с заменённым годом, месяцем или обоими полями. Месяцы вне диапазона 1–12 и единицы меньше месяца выбрасывают `RangeError`.

**Параметры**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: Объект с полями `year` или `month`, либо английское название одной единицы.
- name: value
  type: number
  description: Целое число при передаче названия единицы.
```

**Возвращает**

```returns
type: YearMonth
description: Новый экземпляр `YearMonth` с обновлёнными календарными полями.
```

```js
const billing = yearMonth('2026-11');

billing.set('month', 2).toString(); // '2026-02'
billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

Подставляет день месяца (целое число от 1 до 31) в этот месяц и возвращает [`CalendarDate`](/api/calendar-date/). Значение 31 ограничивается последним днём более коротких месяцев вроде февраля или апреля, а числа вне диапазона 1–31 выбрасывают `RangeError`.

**Параметры**

```params
- name: day
  type: number | string
  required: true
  description: Номер дня месяца (целое число от 1 до 31).
```

**Возвращает**

```returns
type: CalendarDate
description: Экземпляр `CalendarDate` для указанного дня этого месяца.
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```
:::

## Сравнение и вхождение

Сравнивайте значения `YearMonth` хронологически или проверяйте, попадает ли календарный день в этот месяц. Операторы сравнения вроде `<` выбрасывают ошибку, а массивы удобно сортировать через [`compare()`](/api/compare/) и [функции поиска границ](/api/compare/#earliest).

:::entry
### `compare()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
```

Сравнивает этот год и месяц с другим, возвращая отрицательное число, ноль или положительное число для сортировки. Если передать полную дату или момент времени, сравнение идёт с месяцем, на который они приходятся.

**Параметры**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Другой экземпляр `YearMonth` или любой ввод, принимаемый `yearMonth()`.
```

**Возвращает**

```returns
type: -1 | 0 | 1
description: "`-1`, если раньше, `0`, если равны, или `1`, если позже."
```

```js
yearMonth('2026-05').compare('2026-11'); // -1
yearMonth('2026-11').compare('2026-11-16'); // 0
```
:::

:::entry
### `equals()` :kind[method]

```js signature
ym.equals(other): boolean
```

Возвращает `true`, если оба значения представляют один и тот же год и месяц.

```js
yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
ym.isBefore(other): boolean
```

Возвращает `true`, если этот год и месяц раньше указанных.

```js
yearMonth('2026-10').isBefore('2026-11'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
ym.isAfter(other): boolean
```

Возвращает `true`, если этот год и месяц позже указанных.

```js
yearMonth('2026-12').isAfter('2026-11'); // true
```
:::

:::entry
### `contains()` :kind[method]

```js signature
ym.contains(day): boolean
ym.includes(day): boolean
```

Возвращает `true`, если указанная календарная дата или момент времени попадают в этот год и месяц. Также доступен псевдоним `includes()`.

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
description: "`true`, если `day` попадает в этот месяц."
```

```js
const nov = yearMonth('2026-11');

nov.contains('2026-11-16'); // true
nov.contains('2026-12-01'); // false
```
:::

:::entry
### `isPast()` :kind[method]

```js signature
ym.isPast(zone?): boolean
```

Возвращает `true`, когда этот месяц предшествует текущему в указанном или настроенном часовом поясе.

```js
yearMonth('2020-01').isPast('UTC'); // true
```
:::

:::entry
### `isFuture()` :kind[method]

```js signature
ym.isFuture(zone?): boolean
```

Возвращает `true`, пока этот месяц ещё впереди текущего в указанном или настроенном часовом поясе.

```js
yearMonth('2099-01').isFuture('UTC'); // true
```
:::

:::entry
### `isLeapYear()` :kind[method]

```js signature
ym.isLeapYear(): boolean
```

Возвращает `true`, если в календарном году этого месяца 366 дней.

```js
yearMonth('2028-02').isLeapYear(); // true
yearMonth('2026-02').isLeapYear(); // false
```
:::

## Измерение промежутков

:::entry
### `until()` :kind[method]

```js signature
ym.until(other): Duration
ym.until(other, unit): number
```

Измеряет промежуток от этого месяца до другого и возвращает отрицательную длительность, если целевой месяц раньше. Возвращённый [`Duration`](/api/duration/) запоминает начало этого месяца, поэтому месяцы и годы можно пересчитать в любую единицу.

**Параметры**

```params
- name: other
  type: YearMonthInput
  required: true
  description: Целевой год и месяц, до которого измеряется промежуток.
- name: unit
  type: Unit
  description: Английское название единицы, в которой нужно вернуть общую длительность числом с плавающей точкой.
```

**Возвращает**

```returns
type: Duration | number
description: Экземпляр `Duration` в годах и месяцах или число, если передан `unit`.
```

```js
const start = yearMonth('2026-03');

start.until('2027-06').toString(); // 'P1Y3M'
start.until('2027-06', 'months'); // 15
```
:::

:::entry
### `since()` :kind[method]

```js signature
ym.since(other): Duration
ym.since(other, unit): number
```

Измеряет промежуток, прошедший с более раннего года и месяца. Передайте английское название единицы, чтобы получить итог числом.

```js
yearMonth('2026-11').since('2026-05', 'months'); // 6
```
:::

## Форматирование и преобразование

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

Форматирует год и месяц с помощью именованных пресетов, объектов опций `Intl` или встроенных шаблонов токенов вроде `'MM/YY'`. Из общих объектов опций ключи дня, времени суток и часового пояса отбрасываются автоматически.

Стандартные и локализованные пресеты выводят только год и месяц; пользовательские форматы, зарегистрированные через [`configure()`](/api/configure/), тоже поддерживаются. Полные таблицы пресетов и токенов собраны в руководстве [Форматирование](/guides/formatting/).

**Параметры**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: Имя пресета вроде `'medium'` или `'long'`, объект опций `Intl` либо шаблон токенов.
- name: locale
  type: Locale
  description: Тег локали BCP 47, переопределяющий локаль этого значения или настроенную локаль для одного вызова.
```

**Возвращает**

```returns
type: string
description: Отформатированная строка с месяцем и годом.
```

```js
const nov = yearMonth('2026-11');

nov.format('short', 'en-US'); // '11/2026'
nov.format('medium', 'en-US'); // 'Nov 2026'
nov.format('long', 'en-US'); // 'November 2026'
nov.format('L', 'en-US'); // '11/2026'
nov.format('MM/YY'); // '11/26'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
ym.locale(): Locale | undefined
ym.locale(tag): YearMonth
```

Читает локаль, привязанную к этому месяцу, или возвращает копию, которая форматируется в другой локали в текстовых представлениях, пресетах и во всех производных значениях. Пустой тег сбрасывает привязанную локаль; [`lang()`](#lang) работает как псевдоним.

**Параметры**

```params
- name: tag
  type: Locale | null | undefined
  description: Тег локали BCP 47, который сохраняется в цепочке, или `null` для сброса существующего тега.
```

**Возвращает**

```returns
type: YearMonth | Locale | undefined
description: Активный тег при вызове без аргументов или новый экземпляр `YearMonth` с тегом `tag`.
```

```js
const may = yearMonth('2026-05').locale('ru');

may.locale(); // 'ru'
may.format('long'); // 'май 2026 г.'
may.on(1).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
ym.lang(): Locale | undefined
ym.lang(tag): YearMonth
```

Короткий псевдоним [`locale()`](#locale), который читает или привязывает тег локали BCP 47 к этому месяцу.
:::

:::entry
### `as()` :kind[method]

```js signature
ym.as('yearMonth'): YearMonth
```

Возвращает этот экземпляр при запросе `'yearMonth'` в обобщённых цепочках преобразований; для любых других типов выбрасывает `RangeError`.
:::

:::entry
### `toString()` :kind[method]

```js signature
ym.toString(): string
ym.toJSON(): string
```

Возвращает строку года и месяца в формате ISO 8601, совместимую с HTML-полями ввода типа `month`. `toJSON()` возвращает ту же строку при сериализации в JSON.

**Возвращает**

```returns
type: string
description: Строка года и месяца ISO 8601, например `'2026-11'`.
```

```js
yearMonth(2026, 11).toString(); // '2026-11'
JSON.stringify({ billing: yearMonth(2026, 11) }); // '{"billing":"2026-11"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
ym.toTemporal(): Temporal.PlainYearMonth
```

Возвращает базовый экземпляр `Temporal.PlainYearMonth`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
ym.valueOf(): never
```

Выбрасывает `RangeError`, чтобы числовые операторы никогда не приводили год и месяц к числу. Для сужения неизвестных значений используйте [`isYearMonth()`](/api/kind-of/#isyearmonth) или [`kindOf()`](/api/kind-of/).
:::
