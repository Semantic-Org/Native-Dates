---
source: 7f0f623e1e92
title: dateRange()
lede: Создание DateRange, DateTimeRange и TimeRange из границ, длительностей или строк интервалов.
---

## Создание диапазонов

Отдельные фабричные функции создают [Диапазоны](/api/ranges/) из сырых входных значений, пар границ или одиночных строк интервалов. Когда у вас уже есть типизированная точка, вызывайте [`to()`](/api/ranges/#to) или [`range()`](/api/ranges/#range) напрямую на ней.

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
```

Создаёт [`DateRange`](/api/ranges/#daterange), включающий обе границы, между двумя календарными датами. Когда вторым аргументом передана длительность вроде `'7 days'`, конечный день приходится на шестой день после начальной даты, чтобы весь промежуток охватывал ровно семь дней.

```js title="dates.js"
import { dateRange, days } from 'native-dates';

const fromEnds = dateRange('2026-09-01', '2026-09-07');
const fromLength = dateRange('2026-09-01', days(7));
const fromInterval = dateRange('2026-09-01/2026-09-07');

fromEnds.duration.days; // 7
fromLength.toString(); // '2026-09-01/2026-09-07'
fromInterval.equals(fromEnds); // true
```

**Параметры**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: Начальная календарная дата либо полная строка интервала, если аргумент `end` не передан.
- name: end
  type: CalendarDateInput | DurationInput | ReadOptions
  description: Конечная дата (включительно), длительность или объект опций, если `start` — строка интервала.
- name: options
  type: Zone | ReadOptions
  description: Часовой пояс или опции чтения, применяемые при разборе границ.
  options:
    - name: zone
      type: Zone
      description: Часовой пояс для извлечения календарных дней из строк моментов времени или объектов `Date`.
    - name: locale
      type: Locale
      description: Тег локали BCP 47, сохраняемый в возвращаемом диапазоне и его границах.
    - name: loose
      type: boolean
      default: 'false'
      description: "Разбор неформальных строк дат и возврат `null` при нечитаемом вводе с `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: Переопределение числового порядка даты активной локали в нестрогом режиме.
```

**Возвращает**

```returns
type: DateRange
description: "Экземпляр `DateRange`, включающий обе границы, либо `null`, если нестрогий режим не смог разобрать одну из границ."
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
```

Создаёт полуоткрытый [`DateTimeRange`](/api/ranges/#datetimerange), включающий начальный момент и исключающий конечный (верхняя граница не включается). Если у конечной границы не указан часовой пояс, она разбирается в часовом поясе начального момента.

**Параметры**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: Начальный момент времени либо строка интервала, если аргумент `end` не передан.
- name: end
  type: DateTimeInput | DurationInput | ReadOptions
  description: Исключаемая конечная граница (момент времени), длительность или объект опций для строки интервала.
- name: options
  type: Zone | ReadOptions
  description: Часовой пояс или опции чтения (например, `zone`, `locale`, `loose`) для обеих границ.
```

**Возвращает**

```returns
type: DateTimeRange
description: "Полуоткрытый экземпляр `DateTimeRange` либо `null`, если нестрогий режим не смог разобрать одну из границ."
```

```js
import { datetimeRange } from 'native-dates';

const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
meeting.end.format('short', 'en-US'); // '9/1/26, 10:30 AM'

const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
zoned.start.zone; // 'America/New_York'
```
:::

:::entry
### `timeRange()` :kind[function]

```js signature
timeRange(start, end, options?): TimeRange
timeRange(interval, options?): TimeRange
```

Создаёт полуоткрытый [`TimeRange`](/api/ranges/#timerange) между двумя значениями времени суток, где верхняя граница не включается. Если конечное время суток на циферблате раньше начального, диапазон переходит через полночь.

**Параметры**

```params
- name: start
  type: TimeInput | string
  required: true
  description: Начальное время суток либо строка интервала, если аргумент `end` не передан.
- name: end
  type: TimeInput | DurationInput | ReadOptions
  description: Исключаемая конечная граница времени суток, длительность в единицах времени суток или объект опций для строки интервала.
- name: options
  type: Zone | ReadOptions
  description: Часовой пояс или опции чтения (например, `zone`, `locale`, `loose`) при извлечении времени суток из временных меток.
```

**Возвращает**

```returns
type: TimeRange
description: "Полуоткрытый экземпляр `TimeRange` либо `null`, если нестрогий режим не смог разобрать одну из границ."
```

```js
import { timeRange } from 'native-dates';

const office = timeRange('9am - 5pm');
const overnight = timeRange('22:00', '8h');

office.toString(); // '09:00:00/17:00:00'
overnight.toString(); // '22:00:00/06:00:00'
```
:::

## Строки интервалов и нестрогий режим

Строки интервалов разделяются по косой черте ISO или по разделителям диапазона с пробелами. Косые черты внутри названий часовых поясов IANA в квадратных скобках остаются нетронутыми.

| Форма | Пример | Как разбирается |
|---|---|---|
| Интервал ISO через косую черту | `'2026-09-01/2026-09-07'`, `'09:00/17:00'` | Разделяет строку по `/` за пределами названий часовых поясов в квадратных скобках, совпадая с форматом [`toString()`](/api/ranges/#tostring). |
| Дефис или короткое тире с пробелами | `'9am - 5pm'`, `'2026/09/01 - 2026/09/07'` | Сначала разделяет по `-` или `–`, окружённым пробелами, оставляя дефисы и косые черты внутри дат нетронутыми. |
| Английский разделитель `to` | `'2026-09-01 to 2026-09-07'` | Разделяет по ` to `, окружённому пробелами. |
| Начало и длительность | `dateRange('2026-09-01', '7d')`, `timeRange('9am', '90m')` | Разбирает второй аргумент как длительность, если передан экземпляр [`Duration`](/api/duration/), объект полей длительности или английская фраза длительности. |

Когда подключён [плагин `loose`](/plugins/loose/), нестрогий режим разбирает неформальные границы и возвращает `null`, если одну из границ не удалось разобрать:

```js
import { dateRange } from 'native-dates';
import '@native-dates/plugins/loose';

dateRange('Sep 1, 2026 to Sep 7, 2026', { loose: true })?.toString();
// '2026-09-01/2026-09-07'

dateRange('not a range', { loose: true }); // null
```
