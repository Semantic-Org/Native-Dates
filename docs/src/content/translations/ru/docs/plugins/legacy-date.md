---
source: a8aba5e485f9
title: legacy-date
lede: Геттеры Date.prototype только для чтения и методы форматирования на экземплярах DateTime при поэтапной миграции.
---

## Поэтапная миграция кода с Date

Импортируйте плагин один раз, чтобы добавить на прототип [`DateTime`](/api/date-time/) геттеры только для чтения. Существующие утилиты, функции форматирования и компоненты, ожидающие стандартные методы `Date`, смогут принимать экземпляр `DateTime` напрямую, пока вы переводите код файл за файлом.

```js title="legacy-date.js"
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const moment = datetime('2026-09-06T14:30:15.250', 'America/New_York');

moment.getFullYear(); // 2026
moment.getMonth(); // 8 (сентябрь, нумерация с нуля, как в Date)
moment.getDate(); // 6
moment.getHours(); // 14 (в America/New_York, а не в часовом поясе ОС)
moment.getUTCHours(); // 18
```

Стандартный объект `Date` в JavaScript всегда читает локальные поля в часовом поясе операционной системы. Экземпляр `DateTime` вычисляет каждый локальный геттер и выполняет форматирование с учётом локали в собственном часовом поясе `zone`.

:::warning[Нумерация месяцев с нуля и воскресенье = 0]
Устаревшие геттеры сохраняют нумерацию стандартного `Date`, чтобы существующий код не сломался незаметно. Метод `getMonth()` возвращает значения от 0 до 11, а `getDay()` возвращает 0 для воскресенья, тогда как основные свойства `DateTime` отсчитывают месяцы с 1, а дни недели — с понедельника.
:::

## Геттеры часового пояса и UTC

Все стандартные геттеры чтения доступны на каждом экземпляре `DateTime`.

| Метод | Возвращаемое значение | Поведение в DateTime |
|---|---|---|
| `getTime()` | `number` | Миллисекунды с начала эпохи Unix, идентично `dt.epochMilliseconds`. |
| `getFullYear()` | `number` | Четырёхзначный календарный год в `dt.zone`. |
| `getMonth()` | `number` | Номер месяца с нуля: от 0 (январь) до 11 (декабрь) в `dt.zone`. |
| `getDate()` | `number` | День месяца от 1 до 31 в `dt.zone`. |
| `getDay()` | `number` | День недели от 0 (воскресенье) до 6 (суббота) в `dt.zone`. |
| `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()` | `number` | Поля времени суток, вычисленные в `dt.zone`. |
| `getTimezoneOffset()` | `number` | Смещение в минутах к западу от UTC для `dt.zone`, например `240` для `-04:00` или `-330` для `+05:30`. |
| `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()` | `number` | Календарные поля в UTC с нумерацией месяцев с нуля и воскресеньем, равным 0. |
| `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`, `getUTCMilliseconds()` | `number` | Поля времени суток в UTC. |

```js
const kolkata = datetime('2026-01-06T09:00', 'Asia/Kolkata');

kolkata.getTimezoneOffset(); // -330
kolkata.getHours(); // 9
kolkata.getUTCHours(); // 3
```

## Строковые методы и форматирование по локали

Устаревшие строковые методы повторяют вывод стандартного `Date`, но при форматировании с учётом локали по умолчанию используют часовой пояс самого экземпляра.

| Метод | Возвращаемое значение | Поведение в DateTime |
|---|---|---|
| `toISOString()` | `string` | Метка времени UTC с точностью до миллисекунд, даже если экземпляр хранит более мелкие доли миллисекунды. |
| `toLocaleString(locales?, options?)` | `string` | Дата и время в `dt.zone` и локали [`dt.locale()`](/api/date-time/#locale), если не переопределено в аргументах. |
| `toLocaleDateString(locales?, options?)` | `string` | Дата в `dt.zone` и локали `dt.locale()`, если не переопределено в аргументах. |
| `toLocaleTimeString(locales?, options?)` | `string` | Время суток в `dt.zone` и локали `dt.locale()`, если не переопределено в аргументах. |

```js
const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');

flight.toISOString(); // '2026-09-06T18:30:15.250Z'
flight.toLocaleDateString('en-US'); // '9/6/2026'
flight.toLocaleTimeString('en-US'); // '2:30:15 PM'
flight.toLocaleTimeString('en-US', { timeZone: 'UTC' }); // '6:30:15 PM'
```

## Сеттеры выбрасывают ошибку при попытке мутации

Экземпляры `DateTime` неизменяемы, поэтому все мутирующие сеттеры выбрасывают ошибку и предлагают использовать [`set()`](/api/date-time/#set) или [`plus()`](/api/date-time/#plus).

| Группа | Заблокированные методы | Неизменяемая замена |
|---|---|---|
| Эпоха Unix | `setTime()` | Передайте миллисекунды с начала эпохи Unix в [`datetime()`](/api/datetime-fn/). |
| Локальные поля | `setFullYear()`, `setMonth()`, `setDate()`, `setHours()`, `setMinutes()`, `setSeconds()`, `setMilliseconds()` | Обновите поля в `dt.zone` через [`dt.set()`](/api/date-time/#set). |
| Поля UTC | `setUTCFullYear()`, `setUTCMonth()`, `setUTCDate()`, `setUTCHours()`, `setUTCMinutes()`, `setUTCSeconds()`, `setUTCMilliseconds()` | Сначала переключитесь на UTC через [`dt.in('UTC').set()`](/api/date-time/#in). |

```js
const reminder = datetime('2026-09-06T14:30Z');

try {
  reminder.setHours(9);
} catch (err) {
  err.code; // 'immutable'
}

const updated = reminder.set('hour', 9);
updated.hour; // 9
```

## Когда вместо плагина нужен toJSDate

Экземпляр `DateTime` не имитирует `instanceof Date` и внутренний тег стандартного `Date`. Если вы передаёте метку времени в библиотеку графиков, драйвер базы данных или валидатор, который проверяет тип объекта или изменяет полученную копию, вызовите встроенный метод [`toJSDate()`](/api/date-time/#tojsdate):

```js
const nativeDate = datetime('2026-09-06T14:30Z').toJSDate();
nativeDate instanceof Date; // true
```
