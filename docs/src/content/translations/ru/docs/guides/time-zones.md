---
source: 21708b5b4a6f
title: Часовые пояса
lede: Просматривайте моменты времени в любом часовом поясе IANA и корректно выполняйте расчёты при сезонном переводе часов.
---

[`DateTime`](/api/date-time/) объединяет две вещи: когда именно происходит момент времени и в каком часовом поясе вы его рассматриваете. Смена часового пояса даёт другой взгляд на тот же момент, а все смещения UTC и переходы на летнее и зимнее время платформа берёт на себя.

## Привязка момента к часовому поясу

При создании момента времени передайте имя часового пояса IANA вроде `'America/New_York'`, `'UTC'` или фиксированное смещение UTC:

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const eastCoast = datetime('2026-11-16T12:30', 'America/New_York');
const audit = datetime('2026-11-16T17:30:00Z', 'UTC');

standup.zone; // 'America/Los_Angeles'
standup.offset; // '-08:00'
```

Если часовой пояс не указан, используется значение из глобальной конфигурации, а если оно не задано — локальный часовой пояс среды выполнения.

Задайте часовой пояс по умолчанию для всего приложения один раз при запуске через [`configure()`](/api/configure/):

```js
import { configure, now } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
now().zone; // 'Europe/Berlin'
```

## Просмотр того же момента в другом поясе

Вызовите [`in()`](/api/date-time/#in), чтобы увидеть тот же момент времени в другом городе. Местная дата и время суток обновятся под целевой часовой пояс, а сам момент времени останется тем же:

```js
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');
const tokyo = standup.in('Asia/Tokyo');

berlin.format('time', 'en-US'); // '6:30 PM'
tokyo.day; // 17
berlin.equals(standup); // true
```

## Смещение фиксирует момент, но не часовой пояс

Строки из баз данных и API часто оканчиваются на `Z` или числовое смещение UTC. Этот суффикс фиксирует, когда именно произошёл момент, а созданный `DateTime` всё равно использует указанный вами часовой пояс:

```js
import { datetime } from 'native-dates';

const created = datetime('2026-03-07T14:00:00Z', 'America/New_York');
const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');

created.zone; // 'America/New_York'
created.hour; // 9
berlin.hour; // 15
```

Сохранять настоящий идентификатор IANA важно, как только вы начинаете прибавлять дни или месяцы через переход на летнее время.

Фиксированное смещение никогда не меняется по сезонам, тогда как часовой пояс IANA знает все местные правила перевода часов.

:::note[Работа в UTC]
Передавайте `'UTC'` в качестве часового пояса, когда свойства и календарную арифметику нужно вычислять по UTC. Методы сериализации вроде [`toString()`](/api/date-time/#tostring) всегда записывают строки в UTC независимо от выбранного часового пояса. Подробнее — в руководстве [Хранение и передача](/guides/storing-and-sending/).
:::

## Переходы на летнее и зимнее время

При сезонном переводе часов календарные единицы и единицы времени суток ведут себя по-разному. 8 марта 2026 года Нью-Йорк переводит стрелки вперёд с 2:00 на 3:00, поэтому это воскресенье длится 23 часа.

Прибавление 1 дня сохраняет местное время встречи — 9:00. Прибавление 24 часов отсчитывает ровно 24 прошедших часа:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
saturday.plus(1, 'day').hoursInDay; // 23
```

:::warning[Время, пропущенное при переводе на летнее время]
Когда стрелки переводят с 2:00 на 3:00, местное время вроде 2:30 в этом часовом поясе вообще не наступает. При запросе такого пропущенного времени оно сдвигается вперёд на длину разрыва, а ошибка не выбрасывается.
:::

```js
const skipped = datetime('2026-03-08T02:30', 'America/New_York');
skipped.text; // 'Mar 8, 2026, 3:30 AM EDT'
```

:::details[Управление пропущенным и повторяющимся временем при переводе часов]
Передайте параметр `disambiguation` (разрешение неоднозначности) в [`datetime()`](/api/datetime-fn/) или `at()`, если при планировании или аудите нужно другое правило для пропущенного или повторяющегося времени. По умолчанию используется `'compatible'`, также поддерживаются `'earlier'`, `'later'` и `'reject'`:

```js
const fallBack = datetime('2026-11-01T01:30', {
  zone: 'America/New_York',
  disambiguation: 'later',
});
fallBack.offset; // '-05:00'

datetime('2026-03-08T02:30', {
  zone: 'America/New_York',
  disambiguation: 'reject',
}); // выбрасывает RangeError [invalidDateTime]
```
:::

## Названия городов и аббревиатуры

Ядро принимает канонические имена IANA, `'UTC'` и фиксированные смещения. Подключите [`@native-dates/plugins/zones`](/plugins/zones/), чтобы использовать английские названия городов, региональные аббревиатуры, собственные псевдонимы, а также встроенные национальные варианты (`'москва'`, `'мск'`, `'東京'`, `'北京'`, `'서울'`).

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'los angeles').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'

configure({ zoneAliases: { hq: 'Europe/Berlin' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```

Неоднозначные аббревиатуры вроде CST и IST разрешаются с учётом региона активной локали, а крупные города вроде Пекина, Мумбаи и Осаки определяются без ручной настройки псевдонимов.
