---
source: 91937c1bc2c8
title: yearMonth()
lede: Преобразование строки ISO с годом и месяцем, срока действия карты, чисел или даты в YearMonth.
---

## Чтение года и месяца

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(input, zone?): YearMonth
yearMonth(year, month): YearMonth
```

Создаёт [`YearMonth`](/api/year-month/) из строки с годом в начале, чисел года и месяца с нумерацией с 1, объекта полей либо любой даты или временной метки с отбрасыванием дня. Отсутствующие входные значения выбрасывают `TypeError` вместо подстановки текущего месяца.

```js title="billing.js"
import { datetime, yearMonth } from 'native-dates';

const fromIso = yearMonth('2026-11');
const fromNumbers = yearMonth(2026, 11);
const fromFields = yearMonth({ year: 2026, month: 11 });
const fromDate = yearMonth('2026-11-16');
const fromInstant = yearMonth(datetime('2026-11-01T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '2026-11'
fromInstant.toString(); // '2026-10'
```

**Параметры**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: Строка ISO с годом и месяцем, объект полей, дата, временная метка или календарный год (`year`).
- name: options
  type: Zone | ReadOptions | number | string
  description: Часовой пояс или объект опций при чтении временной метки либо неформальной строки, а также `month` с нумерацией с 1 (от 1 до 12).
  options:
    - name: zone
      type: Zone
      description: Часовой пояс для определения календарного месяца из строки момента времени, `DateTime` или `Date`.
    - name: locale
      type: Locale
      description: Тег локали BCP 47, сохраняемый в возвращаемом `YearMonth` и во всех производных значениях.
    - name: loose
      type: boolean
      default: 'false'
      description: "Разбор английских или локализованных названий месяцев вроде `'février 2026'` и возврат `null` при нечитаемом вводе с `@native-dates/plugins/loose`."
```

**Возвращает**

```returns
type: YearMonth
description: "Экземпляр `YearMonth` без дня либо `null`, если нестрогий режим не смог разобрать `input`."
```

Когда подключён [плагин `loose`](/plugins/loose/), нестрогий режим разбирает названия месяцев на английском или в активной локали (`locale`) в паре с четырёхзначным годом и возвращает `null` для нечитаемых строк:

```js
import { yearMonth } from 'native-dates';
import '@native-dates/plugins/loose';

yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
yearMonth('février 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
yearMonth('not-a-month', { loose: true }); // null
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

Разбирает строки и числа с месяцем в начале — в том порядке, в котором срок действия печатают на платёжных картах, например `'11/26'`. Двузначные годы от 0 до 99 прибавляются к [`YearMonth.century`](/api/year-month/#properties), по умолчанию равному 2000.

Строки ISO вроде `'2026-11'` в обеих функциях по-прежнему разбираются с годом в начале, поэтому сериализованные значения всегда проходят обратное преобразование без потерь.

**Параметры**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: Строка срока действия карты вроде `'11/26'`, любое значение `YearMonthInput` или `month` с нумерацией с 1 (от 1 до 12).
- name: options
  type: Zone | ReadOptions | number | string
  description: Часовой пояс, опции чтения (включая `locale`) либо двузначный или четырёхзначный `year` при передаче двух чисел.
```

**Возвращает**

```returns
type: YearMonth
description: "Экземпляр `YearMonth` либо `null`, если нестрогий режим не смог разобрать `input`."
```

```js
import { monthYear } from 'native-dates';

monthYear('11/26').toString(); // '2026-11'
monthYear('05/2028').toString(); // '2028-05'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## Поддерживаемые входные значения

Месяцы нумеруются от 1 (январь) до 12 (декабрь) в числах, строках и объектах полей.

| Входное значение | Пример | Как разбирается |
|---|---|---|
| Строка с годом в начале | `'2026-11'`, `'2026/11'`, `'2026年11月'` | Разбирает четырёхзначный год и однозначный или двузначный месяц с любым разделителем, кроме латинских букв и двоеточий. |
| Строка срока действия карты | `monthYear('11/26')`, `monthYear('11.2026')` | Разбирает строку с месяцем в начале через `/`, `-` или `.` и расширяет двузначные годы с помощью `YearMonth.century`. |
| Два числа | `yearMonth(2026, 11)`, `monthYear(11, 26)` | Принимает целые числа в порядке год-месяц или месяц-год. |
| Объект полей | `{ year: 2026, month: 11 }` | Разбирает календарные поля с нумерацией с 1 и отклоняет месяцы вне диапазона от 1 до 12. |
| Дата или временная метка | `'2026-11-16'`, `datetime(...)`, `new Date()` | Определяет календарный месяц в указанном часовом поясе или в поясе по умолчанию и отбрасывает день. |
| Название месяца в нестрогом режиме | `'Nov 2026'`, `'février 2026'` | В нестрогом режиме разбирает названия месяцев на английском или в активной локали в паре с четырёхзначным годом. |
| Значение Temporal | `Temporal.PlainYearMonth`, `Temporal.PlainDate` | Напрямую оборачивает значения Temporal в календаре ISO 8601. |

:::tip[Получение текущего месяца]
Чтобы получить текущий календарный месяц в любом часовом поясе, используйте [`today()`](/api/date-fn/#today) — например, `today('Asia/Tokyo').yearMonth`.
:::
