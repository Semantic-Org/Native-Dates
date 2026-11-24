---
source: 450f88efed26
title: Переход с Day.js
lede: Замените обёртки dayjs() и цепочки плагинов отдельными типами дат и встроенными часовыми поясами.
---

Day.js оборачивает стандартную дату JavaScript в один объект `dayjs()`, а часовые пояса, UTC, диапазоны и длительности подключает через плагины. В Native Dates сохраняется лёгкий и неизменяемый стиль работы, но календарные даты, время суток, моменты времени, частичные даты, диапазоны и длительности представлены в ядре отдельными типами.

## Выбирайте date() или datetime()

В Day.js и день рождения, и временная метка из API проходят через `dayjs()`.

В Native Dates для календарных дат используются [`date()`](/api/date-fn/) и [`today()`](/api/date-fn/#today), а для [расчётных месяцев](/api/year-month-fn/) и [повторяющихся дней рождения](/api/month-day-fn/) в ядре есть отдельные фабричные функции частичных дат.

Точные моменты времени создаются через [`datetime()`](/api/datetime-fn/) или [`now()`](/api/datetime-fn/#now):

```js
import { date, datetime, monthDay, now, today, yearMonth } from 'native-dates';

const current = now(); // заменяет dayjs() для момента времени
const due = today().plus(2, 'weeks'); // заменяет dayjs().add(2, 'week') для календарной даты
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
const billing = yearMonth('2026-11');
const recurring = monthDay('05-10');
```

Привычные имена `add()` и `subtract()` поддерживаются как псевдонимы, если они уже используются в кодовой базе. При передаче пустого значения фабричная функция выбрасывает ошибку вместо того, чтобы молча вернуть текущий момент времени — так отсутствующие поля API обнаруживаются сразу.

## Нумерация месяцев с 1

Day.js унаследовал нумерацию месяцев с нуля (январь — это `0`), а день месяца в нём читается методом `.date()`. В Native Dates поля календаря — это обычные свойства, а месяцы нумеруются от `1` до `12`.

```js
import { date } from 'native-dates';

const d = date('2026-11-16');

d.year; // 2026
d.month; // 11, ноябрь
d.day; // 16
d.dayOfWeek; // 1, понедельник
```

:::warning[Проверьте нумерацию месяцев и дней недели]
В Day.js месяцы нумеруются от 0 до 11, а неделя начинается с воскресенья (`0`). В Native Dates `month` принимает значения от `1` до `12`, а `dayOfWeek` — от `1` (понедельник) до `7` (воскресенье). В шаблонах токенов `'E'` выводит ISO-номер `1–7`, тогда как `'d'` сохраняет принятую в Day.js нумерацию `0–6`.
:::

## Встроенные часовые пояса, длительности и диапазоны

В Day.js нужны отдельные плагины, чтобы переводить дату и время между городами, работать с длительностями или проверять попадание даты в диапазон. В ядро Native Dates уже встроены часовые пояса IANA, [длительности](/api/duration/) и [диапазоны](/api/ranges/) без дополнительной настройки.

```js
import { dateRange, datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // заменяет .tz('Europe/Berlin')

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120

const november = dateRange('2026-11-01', '2026-11-30');
november.contains('2026-11-16'); // true
dateRange('2026-11-01', '2026-11-15').overlaps(november); // true
```

Вместо передачи строковых скобок вроде `'[]'` в `isBetween()` диапазоны календарных дат включают обе границы, а диапазоны моментов времени и времени суток автоматически исключают правую границу.

## Пресеты и шаблоны токенов

Ядро поддерживает пресеты `Intl`, локализованные форматы Day.js и пользовательские [шаблоны токенов](/guides/formatting/#token-patterns) прямо в [`format()`](/api/date-time/#format) — без файлов локалей и плагинов:

```js
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('LLL', 'en-US'); // 'November 16, 2026 at 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## Подключаемые плагины

В [`@native-dates/plugins`](/plugins/) вынесены только разбор строк вне формата ISO, поиск часовых поясов по английским названиям городов, аббревиатурам и встроенным национальным псевдонимам (вроде `'москва'` или `'東京'`), а также геттеры совместимости со старым `Date`. Импортируйте нужный подмодуль один раз на старте приложения:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

## Сравнительная таблица

| Day.js | Native Dates | Примечания |
|---|---|---|
| `dayjs()` | `now()` или `today()` | Явный выбор между точным моментом времени и календарной датой |
| `d.month()`, `d.date()` | `d.month`, `d.day` | Обычные свойства с нумерацией месяцев от 1 до 12 |
| `d.day()`, `d.isoWeekday()` | `d.dayOfWeek` | Стандарт ISO: от 1 (понедельник) до 7 (воскресенье); токены `'E'` для 1–7 и `'d'` для 0–6 |
| `d.unix()`, `d.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | Единица отсчёта от эпохи Unix указана прямо в имени свойства |
| `d.add(2, 'day')` | `d.plus(2, 'days')` | Псевдонимы `add()` и `subtract()` тоже работают |
| `dayjs.tz(x, zone)` | `datetime(x, zone)` | В ядре, плагин `timezone` не нужен |
| `d.tz(zone)` | `dt.in(zone)` | Показывает тот же момент времени в другом часовом поясе IANA |
| `dayjs.utc(x)` | `datetime(x, 'UTC')` | В ядре, плагин `utc` не нужен |
| `b.diff(a, 'day', true)` | `a.until(b, 'days')` | Дробная разность в запрошенных единицах |
| `dayjs.duration(90, 'm')` | `minutes(90)` или `duration('90m')` | В ядре, плагин `duration` не нужен |
| `d.format('LLL')` | `dt.format('LLL')` | Локализованные пресеты от `'LT'` до `'llll'` |
| `d.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [Шаблоны токенов](/guides/formatting/#token-patterns) в ядре |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | [Диапазоны](/api/ranges/) с методами `to()`, `for()` и `overlaps()` |
| `d.fromNow()`, `d.from(other)` | `d.fromNow()`, `d.from(other)` | В ядре, плагин `relativeTime` не нужен |
| `customParseFormat` | `{ loose: true }` | Добавляется плагином [`@native-dates/plugins/loose`](/plugins/loose/) |
