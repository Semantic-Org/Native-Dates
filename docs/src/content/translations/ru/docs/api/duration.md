---
source: 05899a15dfff
title: Duration
lede: Длительность в календарных единицах и единицах времени суток.
---

## Создание Duration

Разбирайте английские фразы длительности и строки ISO 8601 с помощью [`duration()`](/api/duration-fn/), вызывайте функции для отдельных единиц вроде [`hours()`](/api/duration-fn/#hours) либо измеряйте промежуток между двумя датами или значениями времени суток. Экземпляры неизменяемые, поэтому каждый метод возвращает новое значение.

```js title="create.js"
import { date, days, duration, hours } from 'native-dates';

const breakTime = duration('1h 30m');
const trial = days(14);
const timeout = hours(1.5);
const quarter = date('2026-01-01').until('2026-04-01');
```

:::note[Поля сохраняются как заданы]
Если создать длительность из 90 минут, в поле `minutes` останется `90` — оно не пересчитается автоматически в 1 час 30 минут. Календарные дни тоже хранятся отдельно от часов из-за переходов на летнее время, пока вы не вызовете [`balance()`](#balance).
:::

## Свойства

Свойства отражают количество единиц, записанное в экземпляре длительности.

| Свойство | Тип | Описание |
|---|---|---|
| `text` | `string` | Длительность в длинном формате активной локали, например `'1 hour, 30 minutes'`. |
| `years`, `months`, `weeks`, `days` | `number` | Количество календарных единиц со знаком. |
| `hours`, `minutes`, `seconds` | `number` | Количество единиц времени суток со знаком. |
| `milliseconds`, `microseconds`, `nanoseconds` | `number` | Количество долей секунды со знаком. |
| `sign` | `number` | Общее направление длительности: `1`, `0` или `-1`. |
| `anchor` | `TemporalValue` | Начальная точка, сохранённая методами [`until()`](/api/date-time/#until) или [`since()`](/api/date-time/#since), либо `undefined` для автономных длительностей. |

## Арифметика и знак

Складывайте и вычитайте длительности, умножайте их на число или меняйте знак. Все ненулевые поля одной длительности должны иметь одинаковый знак.

:::entry
### `plus()` :kind[method]

```js signature
dur.plus(other, unit?): Duration
dur.add(other, unit?): Duration
```

Прибавляет другую длительность и возвращает новый экземпляр `Duration`. Календарные единицы складываются по полям, а единицы времени суток объединяются с переносом; `add()` — псевдоним этого метода.

**Параметры**

```params
- name: other
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, строка с английской фразой длительности или ISO 8601, объект полей либо миллисекунды.
- name: unit
  type: Unit
  description: Английское название единицы, если `other` — число (например, `'minutes'` или `'days'`).
```

**Возвращает**

```returns
type: Duration
description: Новый суммарный экземпляр `Duration`.
```

```js
hours(2).plus(30, 'minutes').toString(); // 'PT2H30M'
days(1).plus('6h').toString(); // 'P1DT6H'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dur.minus(other, unit?): Duration
dur.subtract(other, unit?): Duration
```

Вычитает другую длительность, при необходимости занимая из лет в месяцы или из недель в дни. Несовместимые пары с противоположными знаками (например, дни минус часы) выбрасывают `RangeError`; `subtract()` работает как псевдоним.

**Параметры**

```params
- name: other
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, строка с английской фразой длительности или ISO 8601, объект полей либо миллисекунды.
- name: unit
  type: Unit
  description: Английское название единицы, если `other` — число.
```

**Возвращает**

```returns
type: Duration
description: Новый экземпляр `Duration` с вычтенным значением `other`.
```

```js
import { months, weeks, years } from 'native-dates';

hours(2).minus('30m').toString(); // 'PT1H30M'
years(1).minus(months(1)).toString(); // 'P11M'
weeks(1).minus(days(1)).toString(); // 'P6D'
```
:::

:::entry
### `times()` :kind[method]

```js signature
dur.times(factor): Duration
```

Умножает каждое поле на число, перенося дробную часть в более мелкие единицы.

**Параметры**

```params
- name: factor
  type: number
  required: true
  description: Множитель для масштабирования длительности, включая дробные и отрицательные числа.
```

**Возвращает**

```returns
type: Duration
description: Новый масштабированный экземпляр `Duration`.
```

```js
hours(1).times(1.5).toString(); // 'PT1H30M'
days(1).times(3).toString(); // 'P3D'
```
:::

:::entry
### `abs()` :kind[method]

```js signature
dur.abs(): Duration
```

Возвращает копию с положительными значениями всех полей.

```js
duration('-1h 30m').abs().toString(); // 'PT1H30M'
```
:::

:::entry
### `negated()` :kind[method]

```js signature
dur.negated(): Duration
```

Меняет знак каждого поля длительности на противоположный.

```js
hours(2).negated().toString(); // '-PT2H'
```
:::

## Балансировка, округление и итоговые значения

Переносите переполнение из мелких единиц в крупные, округляйте до нужной точности или выражайте весь промежуток одним числом.

:::warning[Перевод месяцев и лет в дни]
Длительности, состоящие только из месяцев и лет, балансируются, суммируются и сравниваются между собой из расчёта 12 месяцев в году. Чтобы перевести их в недели, дни или единицы времени суток, нужна начальная дата от [`until()`](/api/calendar-date/#until) или [`since()`](/api/calendar-date/#since), потому что в разных календарных месяцах разное число дней.
:::

:::entry
### `balance()` :kind[method]

```js signature
dur.balance(largestUnit?): Duration
```

Переносит переполнение из более мелких единиц в более крупные. По умолчанию автономные длительности приводят единицы времени суток к часам, а месяцы — к годам; измеренные промежутки балансируются до дней, если не передать более крупную целевую единицу.

**Параметры**

```params
- name: largestUnit
  type: Unit
  description: Английское название самой крупной единицы для переноса переполнения, например `'hour'`, `'day'` или `'week'`.
```

**Возвращает**

```returns
type: Duration
description: Новый сбалансированный экземпляр `Duration`.
```

```js
import { minutes, months } from 'native-dates';

minutes(150).balance().toString(); // 'PT2H30M'
months(18).balance().toString(); // 'P1Y6M'
duration('36h').balance('day').toString(); // 'P1DT12H'
duration('10d').balance('week').toString(); // 'P1W3D'
```
:::

:::entry
### `total()` :kind[method]

```js signature
dur.total(unit): number
dur.as(unit): number
```

Возвращает общую длительность одним числом с плавающей точкой в указанной единице. Для цепочек вызовов также доступен псевдоним [`as()`](#as).

**Параметры**

```params
- name: unit
  type: Unit
  required: true
  description: Английское название целевой единицы для расчёта общей длительности, например `'hours'` или `'days'`.
```

**Возвращает**

```returns
type: number
description: Общая длительность в единицах `unit`, включая дробную часть.
```

```js
import { months } from 'native-dates';

minutes(90).total('hours'); // 1.5
months(18).total('years'); // 1.5
date('2026-01-01').until('2026-04-01').total('days'); // 90
```
:::

:::entry
### `as()` :kind[method]

```js signature
dur.as(unit): number
```

Удобный в цепочках вызовов псевдоним метода [`total()`](#total), который переводит длительность в число указанных единиц.

```js
hours(36).as('days'); // 1.5
date('2026-11-01').until('2026-11-16').as('days'); // 15
```
:::

:::entry
### `round()` :kind[method]

```js signature
dur.round(smallestUnit): Duration
```

Округляет длительность до ближайшей целой единицы; при точном попадании на середину значение округляется от нуля.

**Параметры**

```params
- name: smallestUnit
  type: Unit
  required: true
  description: Английское название наименьшей единицы, сохраняемой после округления, например `'minute'` или `'hour'`.
```

**Возвращает**

```returns
type: Duration
description: Новый округлённый экземпляр `Duration`.
```

```js
minutes(90).round('hour').toString(); // 'PT2H'
duration('1h 20m').round('hour').toString(); // 'PT1H'
```
:::

## Сравнение длительностей

Сравнение идёт по общей длительности, а не по тому, в каких полях она записана, поэтому 60 минут равны 1 часу.

:::entry
### `equals()` :kind[method]

```js signature
dur.equals(other): boolean
```

Возвращает `true`, если обе длительности равны по величине.

**Параметры**

```params
- name: other
  type: DurationInput
  required: true
  description: Другой экземпляр `Duration` или любой ввод, принимаемый `duration()` (включая английские фразы длительности и строки ISO 8601).
```

**Возвращает**

```returns
type: boolean
description: "`true`, если обе длительности равны по величине."
```

```js
import { months, years } from 'native-dates';

hours(1).equals(minutes(60)); // true
years(1).equals(months(12)); // true
```
:::

:::entry
### `compare()` :kind[method]

```js signature
dur.compare(other): number
```

Сравнивает эту длительность с другой по величине для сортировки.

**Параметры**

```params
- name: other
  type: DurationInput
  required: true
  description: Другой экземпляр `Duration` или любой ввод, принимаемый `duration()` (включая английские фразы длительности и строки ISO 8601).
```

**Возвращает**

```returns
type: number
description: "`-1`, если короче, `0`, если равны, или `1`, если длиннее."
```

```js
hours(1).compare(minutes(90)); // -1
date('2026-01-01').until('2026-02-01').compare(days(31)); // 0
```
:::

### Проверки знака

Методы без аргументов для проверки нулевых и отрицательных промежутков:

| Метод | Тип | Описание |
|---|---|---|
| `isZero()` | `boolean` | Все ли единицы в длительности равны нулю. |
| `isNegative()` | `boolean` | Отрицательная ли эта длительность. |

## Форматирование и преобразование

:::entry
### `format()` :kind[method]

```js signature
dur.format(style?, locale?): string
```

Форматирует длительность в активной локали с помощью `Intl.DurationFormat`. Переполнение единиц времени суток автоматически переносится в часы, а доли секунды скрываются, если есть более крупные единицы.

**Параметры**

```params
- name: style
  type: "'long' | 'short' | 'narrow' | 'digital'"
  default: "'long'"
  description: Стиль отображения названий единиц или `'digital'` для таймера с двоеточиями.
- name: locale
  type: string
  description: Тег локали BCP 47, переопределяющий локаль этой длительности или настроенную локаль для одного вызова.
```

**Возвращает**

```returns
type: string
description: Строка длительности в формате локали.
```

```js
const span = duration('2h 30m');

span.format('long', 'en-US'); // '2 hours, 30 minutes'
span.format('short', 'en-US'); // '2 hr, 30 min'
span.format('narrow', 'en-US'); // '2h 30m'
span.format('digital', 'en-US'); // '2:30:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
dur.locale(): Locale | undefined
dur.locale(tag): Duration
```

Читает локаль, привязанную к этой длительности, или возвращает копию, которая форматируется в другой локали в текстовых представлениях, пресетах и цепочках арифметических операций. Пустой тег сбрасывает привязанную локаль; [`lang()`](#lang) работает как псевдоним.

**Параметры**

```params
- name: tag
  type: Locale | null | undefined
  description: Тег локали BCP 47, который сохраняется в цепочке, или `null` для сброса существующего тега.
```

**Возвращает**

```returns
type: Duration | Locale | undefined
description: Активный тег при вызове без аргументов или новый экземпляр `Duration` с тегом `tag`.
```

```js
import { days } from 'native-dates';

const wait = days(2).locale('ar');

wait.locale(); // 'ar'
wait.text; // 'يومان'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dur.lang(): Locale | undefined
dur.lang(tag): Duration
```

Короткий псевдоним [`locale()`](#locale), который читает или привязывает тег локали BCP 47 к этой длительности.
:::

:::entry
### `toFields()` :kind[method]

```js signature
dur.toFields(): DurationFields
```

Возвращает обычный объект только с ненулевыми полями единиц (ключи во множественном числе).

```js
duration('1h 30m').toFields(); // { hours: 1, minutes: 30 }
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dur.toString(): string
dur.toJSON(): string
```

Возвращает строку длительности в формате ISO 8601. `toJSON()` возвращает ту же строку для `JSON.stringify()`.

**Возвращает**

```returns
type: string
description: Строка длительности ISO 8601, например `'PT1H30M'`.
```

```js
const ttl = duration('1h 30m');

ttl.toString(); // 'PT1H30M'
JSON.stringify({ ttl }); // '{"ttl":"PT1H30M"}'
```
:::

:::entry
### `toMilliseconds()` :kind[method]

```js signature
dur.toMilliseconds(): number
```

Возвращает общую длительность в миллисекундах. Длительности с месяцами или годами без привязки к начальной дате выбрасывают `RangeError`.

```js
hours(2).toMilliseconds(); // 7200000
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dur.toTemporal(): Temporal.Duration
```

Возвращает базовый экземпляр `Temporal.Duration`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dur.valueOf(): number
```

Возвращает общее число миллисекунд, чтобы длительности из фиксированных единиц или с привязкой к дате работали с таймерами и числовыми операторами сравнения.
:::
