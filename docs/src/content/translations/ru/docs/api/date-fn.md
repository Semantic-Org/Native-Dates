---
source: af294e4ed659
title: date()
lede: Создание CalendarDate из строки даты с годом в начале, чисел года, месяца и дня, объекта полей или текущего дня.
---

## Чтение календарных дат

:::entry
### `date()` :kind[function]

```js signature
date(input, options?): CalendarDate
date(input, zone?): CalendarDate
date(year, month, day): CalendarDate
```

Создаёт [`CalendarDate`](/api/calendar-date/) из строки даты с годом в начале, трёх чисел с нумерацией с 1, объекта полей, существующей даты или временной метки. Невозможные даты вроде 30 февраля выбрасывают `RangeError`, а не переходят на март.

```js title="create.js"
import { date, datetime } from 'native-dates';

const fromIso = date('2026-11-16');
const fromSlashes = date('2026/11/6');
const fromNumbers = date(2026, 11, 16);
const fromFields = date({ year: 2026, month: 11, day: 16 });
const fromMoment = date(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'));

fromSlashes.toString(); // '2026-11-06'
fromMoment.toString(); // '2026-11-16'
```

**Параметры**

```params
- name: input
  type: CalendarDateInput | number
  required: true
  description: Строка даты ISO, объект полей, существующая дата, временная метка или четырёхзначный `year`.
- name: options
  type: Zone | ReadOptions | number
  description: Часовой пояс или объект опций при чтении временной метки либо неформальной строки, а также `month` с нумерацией с 1 (от 1 до 12).
  options:
    - name: zone
      type: Zone
      description: Часовой пояс для определения календарного дня из строки момента времени, `DateTime` или `Date`.
    - name: locale
      type: Locale
      description: Тег локали BCP 47, сохраняемый в возвращаемом `CalendarDate` и во всех производных значениях.
    - name: loose
      type: boolean
      default: 'false'
      description: "Разбор неформальных строк дат и возврат `null` при нечитаемом вводе с `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Переопределение числового порядка даты активной локали для строк вроде `'07.09.2026'` в нестрогом режиме."
- name: day
  type: number
  description: День месяца от 1 до 31 при передаче `year`, `month` и `day`.
```

**Возвращает**

```returns
type: CalendarDate
description: "Экземпляр `CalendarDate` без времени суток и часового пояса либо `null`, если нестрогий режим не смог разобрать `input`."
```

При чтении временной метки ISO или нативного объекта `Date` передайте часовой пояс, по которому нужно определить календарный день:

```js
date('2026-11-17T02:00:00Z', 'America/Los_Angeles').toString(); // '2026-11-16'
date('2026-11-17T02:00:00Z', 'Asia/Tokyo').toString(); // '2026-11-17'
```
:::

### Поддерживаемые входные значения

Месяцы всегда нумеруются от 1 (январь) до 12 (декабрь), в отличие от конструктора `Date` в JavaScript с нумерацией с 0. Входные значения с годом и месяцем без дня выбрасывают `RangeError` вместо подстановки первого числа месяца — для таких значений используйте [`yearMonth()`](/api/year-month-fn/).

| Входное значение | Пример | Как разбирается |
|---|---|---|
| Строка даты с годом в начале | `'2026-11-16'`, `'2026/11/6'`, `'2026年11月16日'` | Разбирает четырёхзначный год, месяц и день с любым разделителем, кроме латинских букв и двоеточий. |
| Локальная строка даты и времени | `'2026-11-16T09:30'` | Сохраняет календарную дату и отбрасывает время суток. |
| Строка момента ISO | `'2026-11-17T02:00:00Z'` | Определяет календарный день этого момента в указанном часовом поясе или в поясе по умолчанию. |
| Год, месяц и день | `date(2026, 11, 16)` | Принимает три целых числа: от `1` для января до `12` для декабря. |
| Объект полей | `{ year: 2026, month: 11, day: 16 }` | Разбирает календарные поля с нумерацией с 1 и отклоняет невозможные даты. |
| [DateTime](/api/date-time/) | `date(dt, 'Asia/Tokyo')` | Извлекает календарную дату в указанном часовом поясе или в `dt.zone`, если пояс не задан. |
| Объект JavaScript Date | `date(jsDate, 'America/Los_Angeles')` | Определяет календарный день этой временной метки в указанном часовом поясе или в поясе по умолчанию. |
| Значение Temporal | `Temporal.PlainDate`, `Temporal.Instant` | Преобразует обычные даты в любом календаре в тот же день ISO, а моменты времени переводит в целевой часовой пояс. |

:::note[Временные метки зависят от часового пояса]
Строка ISO с завершающим `Z` или смещением UTC обозначает момент времени, который в разных точках мира может приходиться на два разных календарных дня. На сервере всегда передавайте часовой пояс явно, когда извлекаете календарный день пользователя.
:::

## Относительные календарные дни

Сегодняшняя дата зависит от того, в какой точке Земли вы находитесь. Каждая вспомогательная функция ниже принимает необязательный часовой пояс, а если его не передать, использует [настроенное значение по умолчанию](/api/configure/).

:::entry
### `today()` :kind[function]

```js signature
today(zone?): CalendarDate
```

Возвращает сегодняшнюю календарную дату в указанном часовом поясе или в поясе по умолчанию. Поздним вечером в Северной и Южной Америке в Азии и Океании уже наступила полночь и начался следующий календарный день.

**Параметры**

```params
- name: zone
  type: Zone
  description: Часовой пояс для определения текущей календарной даты, например `'Asia/Tokyo'` или `'America/Los_Angeles'`.
```

**Возвращает**

```returns
type: CalendarDate
description: Сегодняшняя `CalendarDate` в часовом поясе `zone`.
```

```js
import { datetime, today } from 'native-dates';

const inLosAngeles = today('America/Los_Angeles');
const inTokyo = today('Asia/Tokyo');

// В 02:00 UTC 17 ноября в Лос-Анджелесе ещё 16 ноября, а в Токио уже 17 ноября
const moment = '2026-11-17T02:00:00Z';
datetime(moment, 'America/Los_Angeles').date.toString(); // '2026-11-16'
datetime(moment, 'Asia/Tokyo').date.toString(); // '2026-11-17'
```
:::

:::entry
### `tomorrow()` :kind[function]

```js signature
tomorrow(zone?): CalendarDate
```

Возвращает завтрашнюю календарную дату в указанном часовом поясе — на один календарный день позже [`today(zone)`](#today).

**Параметры**

```params
- name: zone
  type: Zone
  description: Часовой пояс, по календарю которого определяется завтрашний день.
```

**Возвращает**

```returns
type: CalendarDate
description: Завтрашняя `CalendarDate` в часовом поясе `zone`.
```

```js
import { tomorrow } from 'native-dates';

const nextDay = tomorrow();
const londonTomorrow = tomorrow('Europe/London');
```
:::

:::entry
### `yesterday()` :kind[function]

```js signature
yesterday(zone?): CalendarDate
```

Возвращает вчерашнюю календарную дату в указанном часовом поясе — на один календарный день раньше [`today(zone)`](#today).

**Параметры**

```params
- name: zone
  type: Zone
  description: Часовой пояс, по календарю которого определяется вчерашний день.
```

**Возвращает**

```returns
type: CalendarDate
description: Вчерашняя `CalendarDate` в часовом поясе `zone`.
```

```js
import { yesterday } from 'native-dates';

const priorDay = yesterday();
const londonYesterday = yesterday('Europe/London');
```
:::
