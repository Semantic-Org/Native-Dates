---
source: bb49ea92ac08
title: time()
lede: Создание Time из 12- или 24-часовой строки времени суток, чисел, объекта полей или временной метки.
---

## Чтение времени суток

:::entry
### `time()` :kind[function]

```js signature
time(input, options?): Time
time(input, zone?): Time
time(hour, minute?, second?): Time
```

Создаёт [`Time`](/api/time/) из строки времени суток, целых чисел для компонентов времени, объекта полей или временной метки. Отсутствующие входные значения (`null`, `undefined` или вызов без аргументов) выбрасывают `TypeError` вместо подстановки текущего времени суток.

```js title="clock.js"
import { datetime, time } from 'native-dates';

const morning = time('9am');
const closing = time('5:30pm');
const iso = time('17:30:00');
const fromNumbers = time(9, 30);
const fromFields = time({ hour: 17, minute: 30, millisecond: 250 });
const fromInstant = time('2026-11-16T17:30:00Z', 'America/New_York');
const fromMoment = time(datetime('2026-11-16T17:30:00Z'), 'Europe/Berlin');
const fromTemporal = time(Temporal.PlainTime.from('08:15'));

closing.toString(); // '17:30:00'
fromInstant.toString(); // '12:30:00'
fromMoment.toString(); // '18:30:00'
```

**Параметры**

```params
- name: input
  type: TimeInput | number
  required: true
  description: Строка времени суток, объект полей, существующее время суток, временная метка или час в 24-часовом формате (`hour`) от 0 до 23.
- name: options
  type: Zone | ReadOptions | number
  description: Часовой пояс или объект опций при чтении временной метки либо неформальной строки, а также минуты (`minute`) от 0 до 59.
  options:
    - name: zone
      type: Zone
      description: Часовой пояс для извлечения времени суток из строки момента времени, `DateTime` или `Date`.
    - name: locale
      type: Locale
      description: Тег локали BCP 47, сохраняемый в возвращаемом `Time` и во всех производных значениях.
    - name: loose
      type: boolean
      default: 'false'
      description: "Разбор неформальных строк даты и времени и возврат `null` при нечитаемом вводе с `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: Переопределение числового порядка даты активной локали, когда нестрогий режим разбирает строку с датой и временем.
- name: second
  type: number
  description: Целое число секунд (`second`) от 0 до 59 при передаче чисел. Доли секунды указываются в строке или объекте полей.
```

**Возвращает**

```returns
type: Time
description: "Экземпляр `Time`, представляющий время суток, либо `null`, если нестрогий режим не смог разобрать `input`."
```

Когда подключён [плагин `loose`](/plugins/loose/), нестрогий режим разбирает строки времени с локализованными обозначениями части суток, записи через точку в локалях, где это принято, и неформальные строки временных меток, возвращая `null` при нечитаемом вводе:

```js
import { time } from 'native-dates';
import '@native-dates/plugins/loose';

time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('Mon, 16 Nov 2026 17:30:00 GMT', {
  zone: 'America/New_York',
  loose: true,
})?.toString(); // '12:30:00'
time('whenever', { loose: true }); // null
```
:::

## Поддерживаемые входные значения

В 12-часовых строках принимаются часы от 1 до 12 с суффиксом AM или PM. Полночь записывается как 12 AM, а полдень — как 12 PM.

| Входное значение | Пример | Как разбирается |
|---|---|---|
| 12-часовая строка времени | `'9am'`, `'5:30pm'`, `'12:15 a.m.'` | Разбирает часы от 1 до 12 с `am` или `pm` и необязательными минутами, секундами и долями секунды. |
| 24-часовая строка времени | `'09:00'`, `'14h30'`, `'17:30:15.250'` | Разбирает 24-часовые строки с двоеточием или `h` между часами и минутами с точностью до наносекунд. |
| Строка момента ISO | `'2026-11-16T17:30:00Z'` | Определяет локальное время суток этого момента в указанном часовом поясе или в поясе по умолчанию. |
| Числовые компоненты времени | `time(9)`, `time(9, 30)`, `time(17, 30, 15)` | Принимает целые числа для часа, необязательных минут и необязательных секунд. |
| Объект полей | `{ hour: 9, minute: 30, millisecond: 250 }` | Разбирает поля времени в единственном или множественном числе и отклоняет значения вне допустимого диапазона. |
| [DateTime](/api/date-time/) или Temporal | `time(dt, 'Asia/Tokyo')`, `Temporal.PlainTime` | Извлекает время суток, переводя моменты времени в указанный часовой пояс, если он передан. |
| Объект JavaScript Date | `time(jsDate, 'America/New_York')` | Определяет время суток этого момента в указанном часовом поясе или в поясе по умолчанию. |

:::tip[Получение текущего времени суток]
Чтобы получить текущее время суток в нужном часовом поясе, используйте [`now()`](/api/datetime-fn/#now) — например, `now('Europe/Berlin').time`.
:::
