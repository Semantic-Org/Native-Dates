---
source: ed93e959dec0
title: Работа с Temporal
lede: Как Native Dates опирается на стандартный API Temporal в JavaScript и взаимодействует с его нативными объектами.
---

Native Dates — это обёртка над встроенными в JavaScript API `Temporal` и `Intl`.

`Temporal` предоставляет точные примитивы для календарей и часовых поясов с подробными объектами параметров. Native Dates делает повседневные вызовы лаконичными и свободно взаимодействует с обычными экземплярами `Temporal`.

## Соответствие типов Temporal

Каждый базовый класс значений оборачивает один нативный тип `Temporal` и возвращает его обратно, когда нужен низкоуровневый контроль:

| Тип | Оборачивает | Что добавляет Native Dates |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | Объединяет ISO-строки с моментом времени, смещения, `Date` и числа эпохи Unix в один тип с часовым поясом и сериализует в UTC |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | Сочетается с `at(time, zone)` и напрямую форматирует дату по пресетам и шаблонам токенов |
| [`Time`](/api/time/) | `Temporal.PlainTime` | Разбирает 12-часовые строки вроде `'9:30am'` наряду с 24-часовым временем суток в формате ISO |
| [`Duration`](/api/duration/) | `Temporal.Duration` | Разбирает английские и сокращённые фразы длительности вроде `'1h 30m'`, переносит дробные единицы в младшие и запоминает точку отсчёта из `until()` |
| [`YearMonth`](/api/year-month/) | `Temporal.PlainYearMonth` | Встроенный класс для расчётных месяцев и сроков действия карт с [`monthYear()`](/api/year-month-fn/#monthyear) и `on()` |
| [`MonthDay`](/api/month-day/) | `Temporal.PlainMonthDay` | Встроенный класс для дней рождения и повторяющихся дат с [`dayMonth()`](/api/month-day-fn/#daymonth), `fallsOn()` и `next()` |

В спецификации `Temporal` нет диапазонов. Ядро добавляет [`DateRange`, `DateTimeRange` и `TimeRange`](/api/ranges/) поверх пар границ для проверки вхождения, пересечения и пошагового перебора.

## Передача объектов Temporal

Любая фабричная функция, арифметический метод или сравнение принимают нативные значения `Temporal` напрямую.

```js
import { date, datetime, time, yearMonth } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'

const ym = yearMonth(Temporal.PlainYearMonth.from('2026-11'));
ym.daysInMonth; // 30
```

Если передать `Temporal.ZonedDateTime` в [`datetime()`](/api/datetime-fn/), его часовой пояс сохраняется, если вы явно не укажете другой. Если передать `Temporal.Instant` или дату-время без часового пояса, значение помещается в указанный часовой пояс или в настроенный по умолчанию.

Значения `Temporal` и строки с негригорианскими календарями (например, японским или персидским) автоматически переводятся в соответствующий день по календарю ISO — вызывать `withCalendar()` заранее не нужно.

Сравнения и расчёт промежутков также принимают объекты `Temporal` напрямую:

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## Извлечение через toTemporal()

Вызовите [`toTemporal()`](/api/date-time/#totemporal) на любом значении, чтобы получить лежащий внутри экземпляр `Temporal`.

Это удобно при работе со сторонними библиотеками, которые ожидают объекты `Temporal`, или с негригорианскими календарными системами.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');
const plain = d.toTemporal(); // Temporal.PlainDate

const japanese = plain.withCalendar('japanese');
japanese.era; // 'reiwa'
japanese.eraYear; // 8
```

:::note[Извлечение без копирования]
Каждый экземпляр хранит внутри настоящий объект `Temporal`, поэтому `toTemporal()` возвращает его напрямую — без повторного разбора и создания копий.
:::

## Полифил для старых сред выполнения

Актуальные версии Chrome, Edge, Firefox, Node 26+, Deno и Bun поддерживают `Temporal` нативно, поэтому в ядре нет ни байта полифила.

Для Safari, старых браузеров или Node 22–25 подключите `@native-dates/polyfill` вместе с `temporal-polyfill` на старте приложения (в Node 22–23 он также добавляет резервную реализацию `Intl.DurationFormat`). Варианты настройки и синхронной загрузки описаны в разделе [Поддержка Safari и старых версий Node](/guides/installation/#supporting-safari-and-older-node).
