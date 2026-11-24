---
source: 50f6c5cb4f97
title: datetime()
lede: Создание DateTime из временной метки, строки, объекта Date или объекта полей, а также получение текущего момента.
---

## Чтение моментов времени

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, zone?): DateTime
datetime(input, options?): DateTime
```

Преобразует строку, временную метку, объект полей или календарную дату в [`DateTime`](/api/date-time/) в заданном часовом поясе. Если не передавать часовой пояс, используется [настроенное значение по умолчанию](/api/configure/) или локальный пояс среды выполнения.

```js title="read.js"
import { date, datetime } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const fromWall = datetime('2026-11-16 09:30', 'Europe/Berlin');
const fromZone = datetime('2026-11-16T09:30[America/New_York]');
const fromEpoch = datetime(1794850200000, 'UTC');
const fromDate = datetime(date('2026-11-16'), 'America/New_York');
```

**Параметры**

```params
- name: input
  type: DateTimeInput
  required: true
  description: Строка ISO, миллисекунды с эпохи Unix, объект `Date`, объект полей, календарная дата или значение Temporal.
- name: zoneOrOptions
  type: Zone | ReadOptions
  description: Строка часового пояса (например, `'Europe/Berlin'` или `'UTC'`) либо объект опций.
  options:
    - name: zone
      type: Zone
      description: Часовой пояс для отображения момента времени; переопределяет пояс в квадратных скобках из `input`.
    - name: locale
      type: Locale
      description: Тег локали BCP 47, сохраняемый в возвращаемом `DateTime` и во всех производных значениях.
    - name: loose
      type: boolean
      default: 'false'
      description: "Разбор неформальных строк дат и возврат `null` при нечитаемом вводе с `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Переопределение числового порядка даты активной локали для строк вроде `'07/09/2026'` в нестрогом режиме."
```

**Возвращает**

```returns
type: DateTime
description: "Экземпляр `DateTime` в итоговом часовом поясе либо `null`, если нестрогий режим не смог разобрать `input`."
```

Когда подключён плагин [`@native-dates/plugins/loose`](/plugins/loose/), нестрогий режим разбирает неформальные даты и время в активной локали, а для машинных форматов прибегает к встроенному разбору движка и возвращает `null`, если строку не удалось разобрать:

```js
import { datetime } from 'native-dates';
import '@native-dates/plugins/loose';

datetime('Mon, 16 Nov 2026 17:30:00 GMT', { zone: 'America/New_York', loose: true });
datetime('not a timestamp', { loose: true }); // null
```
:::

### Поддерживаемые входные значения

Любое входное значение создаёт неизменяемый экземпляр в целевом часовом поясе:

| Входное значение | Пример | Как разбирается |
|---|---|---|
| Строка ISO со смещением | `'2026-11-16T17:30:00Z'`, `'2026-11-16 12:30-05:00'` | Фиксирует точный момент времени и отображает его в целевом часовом поясе. |
| Строка с часовым поясом в скобках | `'2026-11-16T09:30[America/New_York]'` | Сохраняет часовой пояс из скобок, если второй аргумент не переопределяет его. |
| Локальные дата и время | `'2026-11-16T09:30'`, `'2026年11月16日 14:30'` | Разбирает дату с годом в начале и время суток напрямую в целевом часовом поясе. |
| Строка даты или [CalendarDate](/api/calendar-date/) | `'2026-11-16'`, `date(2026, 11, 16)` | Устанавливает начало этого календарного дня в целевом часовом поясе. |
| Миллисекунды или Date | `1794850200000`, `new Date()` | Переводит временную метку Unix в целевой часовой пояс, усекая дробные миллисекунды так же, как `Date`. |
| Объект полей | `{ year: 2026, month: 11, day: 16, hour: 9 }` | Разбирает календарные поля с нумерацией с 1 и поля времени суток с нумерацией с 0 в целевом часовом поясе и отклоняет невозможные даты. |
| DateTime или Temporal | `dt`, `Temporal.Instant`, `Temporal.ZonedDateTime` | Сохраняет существующий часовой пояс, если пояс не передан явно. |

:::note[Отсутствующие значения никогда не превращаются в текущий момент]
Отсутствующие значения вроде `undefined` или `null` выбрасывают ошибку, чтобы пустая колонка из базы данных случайно не превратилась в текущую дату и время. Когда нужен текущий момент, вызывайте [`now()`](#now).
:::

## Текущий момент и сегодняшний день

Получите текущий момент времени или границы сегодняшнего дня для запросов в любом часовом поясе.

:::entry
### `now()` :kind[function]

```js signature
now(zone?): DateTime
```

Возвращает текущий момент с точностью до миллисекунды в указанном часовом поясе или в поясе по умолчанию. Миллисекундная точность совпадает с `Date.now()`, поэтому временные метки проходят через JSON без потерь.

**Параметры**

```params
- name: zone
  type: Zone
  description: Часовой пояс для отображения текущего момента, например `'Asia/Tokyo'` или `'UTC'`.
```

**Возвращает**

```returns
type: DateTime
description: Экземпляр `DateTime` для текущей миллисекунды в часовом поясе `zone`.
```

```js
import { now } from 'native-dates';

const local = now();
const tokyo = now('Asia/Tokyo');
const utc = now('UTC');
```
:::

:::entry
### `startOfToday()` :kind[function]

```js signature
startOfToday(zone?): DateTime
```

Возвращает начало сегодняшнего дня в указанном часовом поясе, соответствующее началу локального календарного дня. Удобно использовать как нижнюю границу при выборке событий или записей, созданных сегодня.

**Параметры**

```params
- name: zone
  type: Zone
  description: Часовой пояс, для которого определяется текущий день.
```

**Возвращает**

```returns
type: DateTime
description: Экземпляр `DateTime` в начале сегодняшнего дня в часовом поясе `zone`.
```

```js
import { startOfToday } from 'native-dates';

const opens = startOfToday('America/New_York');
opens.hour; // 0
opens.minute; // 0
```
:::

:::entry
### `endOfToday()` :kind[function]

```js signature
endOfToday(zone?): DateTime
```

Возвращает последнюю миллисекунду сегодняшнего дня в указанном часовом поясе.

**Параметры**

```params
- name: zone
  type: Zone
  description: Часовой пояс, для которого определяется текущий день.
```

**Возвращает**

```returns
type: DateTime
description: Экземпляр `DateTime` в `23:59:59.999` сегодняшней даты в часовом поясе `zone`.
```

```js
import { endOfToday } from 'native-dates';

const cutoff = endOfToday('America/New_York');
cutoff.hour; // 23
cutoff.millisecond; // 999
```
:::
