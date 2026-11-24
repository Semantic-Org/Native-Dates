---
source: e681c4b680b0
title: monthDay()
lede: Преобразование строки с месяцем и днём, чисел, объекта полей или даты в MonthDay.
---

## Чтение месяца и дня

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(input, zone?): MonthDay
monthDay(month, day): MonthDay
```

Создаёт [`MonthDay`](/api/month-day/) из строки с месяцем в начале, чисел с нумерацией с 1, объекта полей или существующей даты. 29 февраля поддерживается, поэтому дни рождения и годовщины в високосный день сохраняются без искажений.

```js title="birthday.js"
import { datetime, monthDay } from 'native-dates';

const fromIso = monthDay('10-17');
const fromSlash = monthDay('10/17');
const fromNumbers = monthDay(2, 29);
const fromFields = monthDay({ month: 10, day: 17 });
const fromInstant = monthDay(datetime('2026-10-18T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '02-29'
fromInstant.toString(); // '10-17'
```

**Параметры**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: Строка с месяцем в начале, объект полей, дата, временная метка или `month` с нумерацией с 1 (от 1 до 12).
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Часовой пояс или объект опций, а также целое число для дня (`day`) от 1 до 31 при передаче двух чисел.
  options:
    - name: zone
      type: Zone
      description: Часовой пояс для определения месяца и дня из строки момента времени, `DateTime` или `Date`.
    - name: locale
      type: Locale
      description: Тег локали BCP 47, сохраняемый в возвращаемом `MonthDay` и во всех производных значениях.
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "Разбор строк с косой чертой, точкой или строк из однозначных чисел через дефис в порядке с днём в начале, аналогично `dayMonth()`."
    - name: loose
      type: boolean
      default: 'false'
      description: "Разбор английских или локализованных названий месяцев вроде `'17 février'` и возврат `null` при нечитаемом вводе с `@native-dates/plugins/loose`."
```

**Возвращает**

```returns
type: MonthDay
description: "Экземпляр `MonthDay` без года либо `null`, если нестрогий режим не смог разобрать `input`."
```

Когда подключён [плагин `loose`](/plugins/loose/), нестрогий режим разбирает названия месяцев на английском или в активной локали (`locale`) и возвращает `null` при нечитаемом вводе:

```js
import { monthDay } from 'native-dates';
import '@native-dates/plugins/loose';

monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
monthDay('17 février', { loose: true, locale: 'fr' })?.toString(); // '02-17'
monthDay('whenever', { loose: true }); // null
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

Разбирает строки и числа с днём в начале — в порядке, привычном для большей части мира, например `'17/10'`. Эта фабричная функция всегда разбирает ввод с днём в начале независимо от глобальных настроек.

Двузначные строки ISO через дефис вроде `'10-17'` в обеих функциях по-прежнему разбираются с месяцем в начале. Благодаря этому сериализованные в JSON значения всегда однозначно восстанавливаются в ту же дату.

**Параметры**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: Строка с днём в начале вроде `'17/10'`, любое значение `MonthDayInput` или целое число для дня (`day`) от 1 до 31.
- name: options
  type: Zone | MonthDayOptions | number | string
  description: Часовой пояс, опции чтения (включая `locale`) или `month` с нумерацией с 1 (от 1 до 12) при передаче двух чисел.
```

**Возвращает**

```returns
type: MonthDay
description: "Экземпляр `MonthDay` либо `null`, если нестрогий режим не смог разобрать `input`."
```

```js
import { dayMonth } from 'native-dates';

dayMonth('17/10').toString(); // '10-17'
dayMonth('06.05').toString(); // '05-06'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## Поддерживаемые входные значения

Числовые строки без года никогда не передаются во встроенный разборщик `Date`. Так удаётся избежать подстановки невисокосного года по умолчанию и переноса недопустимых дней на следующий месяц.

| Входное значение | Пример | Как разбирается |
|---|---|---|
| Строка ISO с месяцем и днём | `'10-17'`, `'--10-17'` | Разбирает двузначные месяц и день с месяцем в начале и в [`monthDay()`](#monthday), и в [`dayMonth()`](#daymonth). |
| Числовая пара в строке | `'10/17'`, `'17.10'`, `'5-6'` | Разбирает числа через `/`, `.` или `-`: с месяцем в начале в `monthDay()` и с днём в начале в `dayMonth()`. |
| Два числа | `monthDay(10, 17)`, `dayMonth(17, 10)` | Принимает целые числа в порядке месяц-день или день-месяц. |
| Объект полей | `{ month: 10, day: 17 }` | Разбирает поля с нумерацией с 1 и отклоняет невозможные пары вроде 31 апреля. |
| Дата или временная метка | `'1990-10-17'`, `datetime(...)`, `new Date()` | Определяет календарные месяц и день в указанном часовом поясе или в поясе по умолчанию и отбрасывает год. |
| Название месяца в нестрогом режиме | `'Oct 17'`, `'17 février'` | В нестрогом режиме разбирает названия месяцев на английском или в активной локали и порядковые числа в любом порядке. |
| Значение Temporal | `Temporal.PlainMonthDay`, `Temporal.PlainDate` | Напрямую оборачивает значения Temporal в календаре ISO 8601. |

:::tip[Получение сегодняшних месяца и дня]
Чтобы получить текущие месяц и день в любом часовом поясе, используйте [`today()`](/api/date-fn/#today) — например, `today('Europe/Berlin').monthDay`.
:::
