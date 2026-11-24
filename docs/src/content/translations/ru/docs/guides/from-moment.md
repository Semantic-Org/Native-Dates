---
source: 5365132bf9e2
title: Переход с Moment
lede: Переходите с Moment и moment-timezone на неизменяемые значения со встроенными шаблонами токенов и нулевым весом базы часовых поясов.
---

Moment и `moment-timezone` много лет закрывали задачи по работе с датами в JavaScript, но ценой изменяемых объектов, нумерации месяцев с нуля и тяжёлых бандлов с таблицами часовых поясов.

Переход избавляет код от защитного клонирования и лишних килобайтов, позволяя обновлять крупные проекты постепенно — по одному модулю за раз.

## Все значения неизменяемые

В Moment добавление дней или переход к началу месяца изменяет сам экземпляр. Передав общую дату во вспомогательную функцию, можно незаметно испортить состояние вызывающего кода, если кто-то забыл сделать копию.

В Native Dates каждое значение неизменяемое. Методы вроде [`plus()`](/api/date-time/#plus) и [`in()`](/api/date-time/#in) всегда возвращают новый экземпляр, не трогая исходный.

```js
import { date } from 'native-dates';

const start = date('2026-11-16');
const deadline = start.plus(7, 'days');

start.toString(); // '2026-11-16'
deadline.toString(); // '2026-11-23'
```

:::tip[Удалите защитные вызовы clone()]
При переходе можно смело убрать все вызовы `.clone()`. Неизменяемые псевдонимы `add()` и `subtract()` тоже включены в ядро, так что существующая арифметика продолжит работать.
:::

## Отдельные типы и нумерация месяцев с 1

Moment складывает все понятия в один класс и нумерует месяцы от 0 до 11, где `10` означает ноябрь. В Native Dates `month` — это обычное свойство со значениями от `1` до `12`.

Используйте [`date()`](/api/date-fn/) для календарных дат, [`datetime()`](/api/datetime-fn/) для моментов времени в часовом поясе и встроенные фабричные функции для [времени суток](/api/time-fn/), [расчётных месяцев](/api/year-month-fn/) и [повторяющихся дней рождения](/api/month-day-fn/):

```js
import { date, datetime, monthDay, yearMonth } from 'native-dates';

const invoiceDate = date(2026, 11, 16);
invoiceDate.month; // 11, ноябрь

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
sentAt.hour; // 12

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

## Нулевой объём базы часовых поясов в бандле

Пакет `moment-timezone` включает в браузерный бандл собственную копию базы IANA.

Ядро Native Dates берёт правила часовых поясов напрямую из встроенных в среду выполнения движков `Temporal` и `Intl`. Любой часовой пояс IANA работает из коробки, а [`@native-dates/plugins/zones`](/plugins/zones/) добавляет распознавание английских названий городов и часовых поясов вроде `'Berlin'` или `'Pacific Time'`, аббревиатур и встроенных национальных псевдонимов (например, `'москва'`, `'мск'`, `'東京'`).

```js
import { datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');

kickoff.in('Europe/London').format('short', 'en-GB'); // '16/11/2026, 17:30'
kickoff.in('Asia/Tokyo').format('short', 'en-US'); // '11/17/26, 2:30 AM'
```

## Токены, пресеты и диапазоны в ядре

Привычные по Moment [шаблоны токенов](/guides/formatting/#token-patterns), локализованные пресеты от `'LT'` до `'llll'`, относительные фразы и [диапазоны](/api/ranges/) работают в ядре без единого плагина:

```js
import { dateRange, datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');
kickoff.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
kickoff.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
kickoff.from('2026-11-16T07:30-08:00', 'en-US'); // 'in 2 hours'

const quarter = dateRange('2026-10-01', '2026-12-31');
quarter.contains('2026-11-16'); // true
quarter.overlaps(dateRange('2026-12-15', '2027-01-15')); // true
```

## Сравнительная таблица

| Moment | Native Dates | Примечания |
|---|---|---|
| `moment()` | `now()` или `today()` | Явное разделение момента времени и календарной даты |
| `moment.tz(str, zone)` | `datetime(str, zone)` | Встроено в ядро без добавления базы часовых поясов в бандл |
| `m.clone().add(7, 'days')` | `d.plus(7, 'days')` | Всегда неизменяемый результат; псевдоним `add()` тоже работает |
| `m.tz('Europe/Berlin')` | `dt.in('Europe/Berlin')` | Показывает тот же момент времени в другом часовом поясе |
| `m.month()`, `m.date()` | `d.month`, `d.day` | Обычные свойства с нумерацией месяцев от 1 до 12 |
| `m.day()`, `m.isoWeekday()` | `d.dayOfWeek` | Стандарт ISO: от 1 (понедельник) до 7 (воскресенье); токены `'E'` для 1–7 и `'d'` для 0–6 |
| `m.unix()`, `m.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | Единица отсчёта от эпохи Unix указана в имени свойства |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` | Дробная разность в запрошенных единицах |
| `moment.duration(2, 'h')` | `hours(2)` или `duration('2h')` | Фабричные функции длительностей в ядре |
| `m.format('LLL')` | `dt.format('LLL')` | Локализованные пресеты от `'LT'` до `'llll'` без файлов локалей |
| `m.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [Шаблоны токенов](/guides/formatting/#token-patterns) |
| `m.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [Диапазоны](/api/ranges/) с методами `to()`, `for()` и `overlaps()` |
| `m.fromNow()`, `m.from(other)` | `dt.fromNow()`, `dt.from(other)` | [Относительные фразы](/guides/formatting/#relative-phrases) |
| Разбор строк вне формата ISO | `{ loose: true }` | Подключите [`@native-dates/plugins/loose`](/plugins/loose/) для разбора произвольных и локализованных строк |

## Постепенный переход

Крупную кодовую базу редко переписывают за один пул-реквест. Вызывайте [`toJSDate()`](/api/date-time/#tojsdate) на границах модулей, которые ещё ожидают стандартный объект `Date`, и передавайте приходящие `Date` обратно в [`datetime()`](/api/datetime-fn/).

```js
import { datetime } from 'native-dates';

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
const legacy = sentAt.toJSDate();
const restored = datetime(legacy, 'America/New_York');
```

Если сторонний или старый код вызывает на значениях геттеры `Date` вроде `getFullYear()`, подключите плагин [`legacy-date`](/plugins/legacy-date/).

Геттеры читают поля в собственном часовом поясе значения и сохраняют нумерацию месяцев с нуля ради прямой совместимости. Мутирующие сеттеры немедленно выбрасывают ошибку, поэтому скрытые изменения экземпляра на месте сразу выявляются в тестах.

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');

dt.getFullYear(); // 2026
dt.getMonth(); // 10, как в Date.prototype.getMonth()
dt.getHours(); // 9, по времени America/Los_Angeles
```
