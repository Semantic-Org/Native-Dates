---
source: 3e14665094ab
title: Time
lede: Время суток без календарной даты и часового пояса.
---

## Создание Time

Разбирайте строки 12-часового или 24-часового времени, передавайте числа часов и минут или преобразуйте существующее значение через [`time()`](/api/time-fn/). Экземпляры неизменяемые, поэтому каждый метод, меняющий значение, возвращает новый экземпляр.

```js title="create.js"
import { time } from 'native-dates';

const morning = time('9:30am');
const evening = time('17:30');
const alarm = time(6, 45);
```

Локальное время суток можно получить из любого экземпляра [`DateTime`](/api/date-time/) через свойство `time`:

```js
import { datetime, now } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.time.toString(); // '09:30:00'
const currentClock = now().time;
```

## Свойства

Свойства возвращают поля 24-часового времени от часов до наносекунд.

| Свойство | Тип | Описание |
|---|---|---|
| `text` | `string` | Время суток в формате активной локали, например `'9:30 AM'`. |
| `hour`, `minute`, `second` | `number` | Поля 24-часового времени (0–23, 0–59, 0–59). |
| `millisecond`, `microsecond`, `nanosecond` | `number` | Доли секунды (0–999). |

## Объединение и поля

Привяжите время суток к календарной дате или замените отдельные поля времени.

:::entry
### `on()` :kind[method]

```js signature
t.on(date, zone?): DateTime
```

Объединяет это время суток с календарной датой в указанном часовом поясе и возвращает [`DateTime`](/api/date-time/). Зеркальный аналог вызова [`at()`](/api/calendar-date/#at) на экземпляре [`CalendarDate`](/api/calendar-date/).

**Параметры**

```params
- name: date
  type: CalendarDateInput
  required: true
  description: Строка даты ISO, экземпляр `CalendarDate`, `DateTime`, объект полей или `Date`.
- name: zone
  type: Zone
  description: Идентификатор часового пояса IANA, фиксированное смещение UTC или `'UTC'`. По умолчанию — настроенный часовой пояс.
```

**Возвращает**

```returns
type: DateTime
description: Новый экземпляр `DateTime` для даты `date` с этим временем суток в часовом поясе `zone`.
```

```js
const opens = time('9:30am');

opens.on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
t.set(fields): Time
t.set(unit, value): Time
```

Возвращает новый экземпляр `Time` с заменёнными полями времени. Значения вне допустимого диапазона — например, 75 минут — выбрасывают `RangeError`.

**Параметры**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: Объект полей времени или английское название одной единицы времени при передаче `value`.
- name: value
  type: number
  description: Целочисленное значение для указанной единицы `unit`.
```

**Возвращает**

```returns
type: Time
description: Новый экземпляр `Time` с обновлёнными полями времени.
```

```js
const reminder = time('9:30am');

reminder.set('minute', 45).toString(); // '09:45:00'
reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
```
:::

## Арифметика и округление

Прибавляйте и вычитайте единицы времени суток, выравнивайте по границам единиц или округляйте с нужным шагом. Календарные единицы вроде дней и недель выбрасывают `RangeError`, так как у времени суток нет календарной даты.

:::note[Переход через полночь]
Арифметика времени суток работает по кругу 24-часового циферблата, поэтому прибавление 2 часов к 23:00 даёт 01:00. Если при переходе через полночь должна сдвигаться календарная дата, сначала объедините время с датой методом [`on()`](#on).
:::

:::entry
### `plus()` :kind[method]

```js signature
t.plus(amount, unit?): Time
t.add(amount, unit?): Time
```

Сдвигает время суток вперёд по 24-часовому циферблату и возвращает новый экземпляр `Time`, при необходимости переходя через полночь. Также доступен псевдоним `add()`.

**Параметры**

```params
- name: amount
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, строка с английской фразой длительности или ISO 8601, объект полей либо миллисекунды.
- name: unit
  type: Unit
  description: Английское название единицы времени, если `amount` — число (например, `'hours'` или `'minutes'`).
```

**Возвращает**

```returns
type: Time
description: Новый экземпляр `Time` в пределах 24-часового цикла.
```

```js
time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
time('23:00').plus('2h').toString(); // '01:00:00'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
t.minus(amount, unit?): Time
t.subtract(amount, unit?): Time
```

Сдвигает время суток назад по 24-часовому циферблату, при необходимости переходя через полночь. Принимает те же аргументы, что и [`plus()`](#plus); также доступен псевдоним `subtract()`.

**Параметры**

```params
- name: amount
  type: DurationInput
  required: true
  description: Число в паре с `unit`, экземпляр `Duration`, строка с английской фразой длительности или ISO 8601, объект полей либо миллисекунды.
- name: unit
  type: Unit
  description: Английское название единицы времени, если `amount` — число.
```

**Возвращает**

```returns
type: Time
description: Новый экземпляр `Time` в пределах 24-часового цикла.
```

```js
time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
t.startOf(unit): Time
```

Обнуляет все поля времени, которые меньше указанной единицы.

**Параметры**

```params
- name: unit
  type: Unit
  required: true
  description: Английское название единицы времени от `'hour'` до `'nanosecond'`.
```

**Возвращает**

```returns
type: Time
description: Новый экземпляр `Time` в начале единицы `unit`.
```

```js
time('14:37:22').startOf('hour').toString(); // '14:00:00'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
t.endOf(unit): Time
```

Переходит к последней миллисекунде указанной единицы времени.

**Параметры**

```params
- name: unit
  type: Unit
  required: true
  description: Английское название единицы времени от `'hour'` до `'nanosecond'`.
```

**Возвращает**

```returns
type: Time
description: Новый экземпляр `Time` в последнюю миллисекунду единицы `unit`.
```

```js
time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
t.startOfNext(unit): Time
```

Переходит вперёд к началу единицы времени, следующей за той, на которую приходится это время суток, с переходом через полночь. Всегда сдвигается к следующей единице, поэтому вызов `startOfNext('hour')` для `14:00:00` вернёт `15:00:00`.

**Параметры**

```params
- name: unit
  type: Unit
  required: true
  description: Английское название единицы времени от `'hour'` до `'nanosecond'`.
```

**Возвращает**

```returns
type: Time
description: Новый экземпляр `Time` в начале следующей единицы `unit`.
```

```js
time('14:37:22').startOfNext('hour').toString(); // '15:00:00'
time('23:37:22').startOfNext('hour').toString(); // '00:00:00'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
t.startOfPrevious(unit): Time
```

Переходит назад к началу единицы времени, предшествующей той, на которую приходится это время суток, с переходом через полночь.

**Параметры**

```params
- name: unit
  type: Unit
  required: true
  description: Английское название единицы времени от `'hour'` до `'nanosecond'`.
```

**Возвращает**

```returns
type: Time
description: Новый экземпляр `Time` в начале предыдущей единицы `unit`.
```

```js
time('14:37:22').startOfPrevious('hour').toString(); // '13:00:00'
time('00:15:00').startOfPrevious('hour').toString(); // '23:00:00'
```
:::

:::entry
### `round()` :kind[method]

```js signature
t.round(unit): Time
t.round(increment, unit): Time
```

Округляет время суток до ближайшей единицы времени или заданного шага; значения ровно посередине округляются вверх.

**Параметры**

```params
- name: increment
  type: number | Unit
  required: true
  description: Размер шага, на который без остатка делится следующая более крупная единица, либо целевая единица `unit` при округлении с шагом `1`.
- name: unit
  type: Unit
  description: Английское название округляемой единицы времени от `'hour'` до `'nanosecond'`.
```

**Возвращает**

```returns
type: Time
description: Новый округлённый экземпляр `Time`.
```

```js
const checkin = time('14:36:00');

checkin.round('hour').toString(); // '15:00:00'
checkin.round(15, 'minutes').toString(); // '14:30:00'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
t.floor(unit): Time
t.floor(increment, unit): Time
```

Округляет вниз до начала единицы времени или шага. Принимает те же аргументы, что и [`round()`](#round).

```js
time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
t.ceil(unit): Time
t.ceil(increment, unit): Time
```

Округляет вверх до следующей единицы времени или шага. Принимает те же аргументы, что и [`round()`](#round).

```js
time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
```
:::

## Сравнение времени суток

Сравнения упорядочивают значения времени суток в пределах одного дня — от полуночи до конца суток. Операторы сравнения вроде `<` выбрасывают `RangeError`, поэтому сравнивайте значения методами или функцией [`compare()`](/api/compare/).

:::entry
### `equals()` :kind[method]

```js signature
t.equals(other): boolean
```

Возвращает `true`, если оба значения обозначают одно и то же время суток.

**Параметры**

```params
- name: other
  type: TimeInput
  required: true
  description: Другой экземпляр `Time` или любое значение, принимаемое функцией `time()`.
```

**Возвращает**

```returns
type: boolean
description: '`true`, если оба значения совпадают с точностью до наносекунды.'
```

```js
time('5:30pm').equals('17:30'); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
t.isBefore(other): boolean
```

Возвращает `true`, если это время суток раньше другого в течение дня.

```js
time('9:00am').isBefore('5:00pm'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
t.isAfter(other): boolean
```

Возвращает `true`, если это время суток позже другого в течение дня.

```js
time('5:00pm').isAfter('9:00am'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
t.isSame(other, unit?): boolean
```

Проверяет, попадает ли другое время суток в ту же единицу времени — например, в тот же час или минуту. Вызов `isSame()` без единицы проверяет точное совпадение.

**Параметры**

```params
- name: other
  type: TimeInput
  required: true
  description: Время суток для сравнения.
- name: unit
  type: Unit
  description: Английское название сравниваемой единицы времени (например, `'hour'` или `'minute'`).
```

**Возвращает**

```returns
type: boolean
description: '`true`, если оба значения времени суток приходятся на одну и ту же единицу `unit`.'
```

```js
time('9:05am').isSame('9:45am', 'hour'); // true
time('9:05am').isSame('10:05am', 'hour'); // false
```
:::

## Измерение промежутков

:::entry
### `until()` :kind[method]

```js signature
t.until(other): Duration
t.until(other, unit): number
```

Измеряет промежуток со знаком от этого времени суток до другого в пределах одного дня; если целевое время раньше, возвращает отрицательную длительность. Передайте английское название единицы, чтобы получить общую длительность одним числом.

**Параметры**

```params
- name: other
  type: TimeInput
  required: true
  description: Целевое время суток, до которого идёт отсчёт.
- name: unit
  type: Unit
  description: Английское название единицы времени, в которой нужно получить общую длительность в виде числа с плавающей точкой.
```

**Возвращает**

```returns
type: Duration | number
description: Экземпляр `Duration`, сбалансированный до часов, либо число при указании `unit`.
```

```js
const opens = time('9:00am');
const closes = time('5:30pm');

opens.until(closes).format('long', 'en-US'); // '8 hours, 30 minutes'
opens.until(closes, 'hours'); // 8.5
time('22:00').until('02:00', 'hours'); // -20
```
:::

:::entry
### `since()` :kind[method]

```js signature
t.since(other): Duration
t.since(other, unit): number
```

Измеряет промежуток от более раннего времени суток до этого в пределах одного дня. Передайте английское название единицы, чтобы получить общую длительность одним числом.

```js
time('5:00pm').since('9:00am', 'hours'); // 8
```
:::

:::entry
### `to()` :kind[method]

```js signature
t.to(end): TimeRange
t.to(count, unit): TimeRange
t.for(length): TimeRange
t.for(count, unit): TimeRange
```

Создаёт полуоткрытый диапазон [`TimeRange`](/api/ranges/#timerange), который начинается с этого времени суток и заканчивается в указанное конечное время или по истечении заданной длительности (верхняя граница не включается). Если конечное время раньше начального, диапазон переходит через полночь. Используйте `for()`, чтобы явно передать длительность (конечные значения времени и числа без единиц при этом отклоняются).

**Параметры**

```params
- name: end
  type: TimeInput | DurationInput | number
  required: true
  description: Конечное время суток, длительность в единицах времени или числовое значение `count` в паре с `unit`.
- name: unit
  type: Unit
  description: Английское название единицы времени, если первый аргумент — число (например, `'hours'` или `'minutes'`).
```

**Возвращает**

```returns
type: TimeRange
description: Полуоткрытый диапазон `TimeRange`, начинающийся с этого времени суток.
```

```js
time('9:00am').to('5:00pm').duration.hours; // 8
time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
time('22:00').to('06:00').duration.hours; // 8
```
:::

## Форматирование и преобразование

:::entry
### `format()` :kind[method]

```js signature
t.format(spec?, locale?): string
```

Форматирует время суток с помощью встроенных пресетов, пользовательских имён из [`configure()`](/api/configure/), объектов опций или шаблонов токенов.

Локализованные пресеты `'LT'` и `'LTS'` уже встроены, а ключи даты и часового пояса в объектах опций автоматически игнорируются. Полный справочник пресетов и токенов — в руководстве [Форматирование](/guides/formatting/).

**Параметры**

```params
- name: spec
  type: FormatSpec
  default: "'short'"
  description: Встроенный или настроенный пресет, объект опций `Intl` либо шаблон токенов.
- name: locale
  type: string
  description: Тег локали BCP 47, переопределяющий локаль этого времени суток или конфигурации для одного вызова.
```

**Возвращает**

```returns
type: string
description: Отформатированная строка времени суток.
```

```js
const afternoon = time('17:30:15');

afternoon.format('short', 'en-US'); // '5:30 PM'
afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
afternoon.format('HH:mm:ss'); // '17:30:15'
afternoon.format('h:mm a'); // '5:30 pm'
afternoon.format({ hour12: false }, 'en-US'); // '17:30'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
t.locale(): Locale | undefined
t.locale(tag): Time
```

Возвращает локаль, привязанную к этому времени суток, либо создаёт копию с другой локалью для текстового представления, пресетов и всех производных значений. Пустой тег сбрасывает привязанную локаль, а [`lang()`](#lang) работает как псевдоним.

**Параметры**

```params
- name: tag
  type: Locale | null | undefined
  description: Тег локали BCP 47 для сохранения или `null` для сброса существующего тега.
```

**Возвращает**

```returns
type: Time | Locale | undefined
description: Активный тег при вызове без аргументов либо новый экземпляр `Time` с прикреплённым тегом `tag`.
```

```js
const closing = time('17:30').locale('ko-KR');

closing.locale(); // 'ko-KR'
closing.text; // '오후 5:30'
closing.on('2026-05-01', 'Asia/Seoul').locale(); // 'ko-KR'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
t.lang(): Locale | undefined
t.lang(tag): Time
```

Краткий псевдоним [`locale()`](#locale) для чтения или привязки тега локали BCP 47 к этому времени суток.
:::

:::entry
### `toString()` :kind[method]

```js signature
t.toString(): string
t.toJSON(): string
```

Возвращает строку времени ISO 8601 в 24-часовом формате, выводя доли секунды группами по три цифры только при ненулевых значениях. Метод `toJSON()` возвращает ту же строку для `JSON.stringify()`.

**Возвращает**

```returns
type: string
description: Строка времени ISO 8601, например `'17:30:00'` или `'17:30:15.250'`.
```

```js
time('5:30pm').toString(); // '17:30:00'
time('17:30:15.25').toString(); // '17:30:15.250'
JSON.stringify({ opens: time('9am') }); // '{"opens":"09:00:00"}'
```
:::

:::entry
### `as()` :kind[method]

```js signature
t.as('time'): Time
```

Возвращает этот экземпляр `Time`, когда в обобщённой цепочке преобразований запрошен тип `'time'`; для других типов выбрасывает `RangeError`.
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
t.toTemporal(): Temporal.PlainTime
```

Возвращает базовый экземпляр `Temporal.PlainTime`.
:::

:::entry
### `valueOf()` :kind[method]

```js signature
t.valueOf(): never
```

Выбрасывает `RangeError`, чтобы числовые операторы никогда не приводили время суток к числу неявно.
:::
