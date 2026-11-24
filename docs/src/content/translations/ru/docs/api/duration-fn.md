---
source: 6f9a2cfc4ed9
title: duration()
lede: Создание Duration из английской фразы длительности, строки ISO 8601, числа с единицей или вспомогательных функций единиц.
---

## Создание длительностей

:::entry
### `duration()` :kind[function]

```js signature
duration(input, unit?): Duration
duration(input, options?): Duration
```

Создаёт [`Duration`](/api/duration/) из числа и единицы, английской фразы длительности, строки ISO 8601, объекта полей или миллисекунд. Поля сохраняются в исходном виде до вызова [`balance()`](/api/duration/#balance), поэтому 90 минут остаются 90 минутами и не превращаются автоматически в полтора часа.

```js title="lengths.js"
import { duration } from 'native-dates';

const phrase = duration('1h 30m');
const words = duration('2 weeks and 3 days');
const iso = duration('PT1H30M');
const count = duration(90, 'minutes');
const spilled = duration(1.5, 'days');
const fields = duration({ hours: 1, minutes: 30 });
const ms = duration(1500);

spilled.days; // 1
spilled.hours; // 12
ms.seconds; // 0
ms.milliseconds; // 1500
```

**Параметры**

```params
- name: input
  type: DurationInput
  required: true
  description: Число в паре с `unit`, английская фраза длительности, строка ISO 8601, объект полей, экземпляр `Duration` или миллисекунды.
- name: unitOrOptions
  type: "Unit | { locale?: Locale, loose?: boolean }"
  description: Английское название единицы при числовом `input` или объект опций.
  options:
    - name: locale
      type: Locale
      description: Тег локали BCP 47, сохраняемый в возвращаемом `Duration` и во всех производных значениях.
    - name: loose
      type: boolean
      default: 'false'
      description: "Возврат `null` при нечитаемом вводе с `@native-dates/plugins/loose`."
```

**Возвращает**

```returns
type: Duration
description: "Экземпляр `Duration` с исходными полями либо `null`, если нестрогий режим не смог разобрать `input`."
```

Когда подключён плагин [`@native-dates/plugins/loose`](/plugins/loose/), нестрогий режим возвращает `null` вместо исключения, если введённый пользователем текст нельзя разобрать как длительность:

```js
import { duration } from 'native-dates';
import '@native-dates/plugins/loose';

duration('45 mins', { loose: true })?.minutes; // 45
duration('soon', { loose: true }); // null
```
:::

### Поддерживаемые входные значения

| Входное значение | Пример | Как разбирается |
|---|---|---|
| Число и единица | `duration(90, 'minutes')`, `duration(1.5, 'days')` | Соединяет число или числовую строку с английской единицей, перенося дробную часть в следующую меньшую единицу. |
| Английская фраза длительности | `'1h 30m'`, `'2 weeks and 3 days'`, `'-15m'` | Разбирает значения с полными английскими названиями единиц или сокращениями, разделённые пробелами, запятыми или `and`. |
| Строка ISO 8601 | `'PT1H30M'`, `'P2W3D'` | Разбирает стандартные строки длительности ISO 8601. |
| Объект полей | `{ hours: 1, minutes: 30 }` | Разбирает ключи единиц в единственном или множественном числе, если все ненулевые поля имеют один знак. |
| Миллисекунды | `duration(1500)`, `duration(0)` | Трактует отдельное число или числовую строку без единицы как миллисекунды. |
| Duration или Temporal | `hours(2)`, `Temporal.Duration` | Возвращает существующий `Duration` без изменений или оборачивает `Temporal.Duration`. |

:::note[Дробные единицы и единый знак]
Дробные значения переносятся в более мелкие точные единицы, поэтому `duration(1.5, 'days')` становится 1 днём и 12 часами. Поскольку у месяцев нет фиксированного числа дней, дробные месяцы выбрасывают `RangeError` — так же, как фразы со смешанными знаками вроде `'1h -30m'`.
:::

## Вспомогательные функции единиц

Функции единиц создают длительности с одной единицей, которые естественно читаются в арифметических вызовах и выражениях. Каждая функция принимает положительное или отрицательное число либо числовую строку.

```js
import { days, hours, minutes, today } from 'native-dates';

const reminder = today().plus(days(3)).at('9:00am');
const block = hours(1).plus(minutes(30));

block.format('short', 'en-US'); // '1 hr, 30 min'
```

:::entry
### `years()` :kind[function]

```js signature
years(count): Duration
```

Создаёт длительность для заданного числа лет, перенося дробную часть в месяцы.
:::

:::entry
### `months()` :kind[function]

```js signature
months(count): Duration
```

Создаёт длительность для целого числа календарных месяцев.
:::

:::entry
### `weeks()` :kind[function]

```js signature
weeks(count): Duration
```

Создаёт длительность для заданного числа недель, перенося дробную часть в дни.
:::

:::entry
### `days()` :kind[function]

```js signature
days(count): Duration
```

Создаёт длительность для заданного числа календарных дней, перенося дробную часть в часы.
:::

:::entry
### `hours()` :kind[function]

```js signature
hours(count): Duration
```

Создаёт длительность для заданного числа часов, перенося дробную часть в минуты.
:::

:::entry
### `minutes()` :kind[function]

```js signature
minutes(count): Duration
```

Создаёт длительность для заданного числа минут, перенося дробную часть в секунды.
:::

:::entry
### `seconds()` :kind[function]

```js signature
seconds(count): Duration
```

Создаёт длительность для заданного числа секунд, перенося дробную часть в миллисекунды.
:::

:::entry
### `milliseconds()` :kind[function]

```js signature
milliseconds(count): Duration
```

Создаёт длительность для заданного числа миллисекунд, перенося дробную часть вплоть до микросекунд и наносекунд.
:::
