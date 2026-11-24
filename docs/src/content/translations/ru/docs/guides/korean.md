---
source: 1ff5dd8e887b
title: Корейский
lede: Разбирайте корейские даты через точку и форматируйте дни недели и лунные праздники.
---

Чтобы форматировать даты по-корейски, передайте тег `'ko-KR'` любым способом из руководства [Локализация](/guides/localization/). Корейские пресеты ставят точки с пробелами и завершающей точкой вроде `'2026. 11. 16.'`, а маркеры *오전* и *오후* выводят перед часом.

## Даты через точку и корейские строки

Корейские даты через точку с пробелами и точкой в конце, а также строки с единицами на хангыле разбираются прямо в ядре без плагинов:

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026. 11. 16.').toString(); // '2026-11-16'
date('2026년 11월 16일').toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', 'Asia/Seoul').toString(); // '2026-11-16T05:30:00.000Z'
yearMonth('2026년 11월').toString(); // '2026-11'
```

Подключите [плагин loose](/plugins/loose/) с корейской локалью, чтобы разбирать краткие даты с двузначным годом в начале, время суток с *오전* / *오후* и пары месяц-день на хангыле:

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('26. 5. 5.', { loose: true, locale: 'ko' })?.toString(); // '2026-05-05'
date('12.11.26', { loose: true, locale: 'ko' })?.toString(); // '2012-11-26'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
monthDay('11월 16일', { loose: true })?.toString(); // '11-16'
```

Всегда передавайте `locale: 'ko'` при разборе дат с двузначным годом, иначе в среде с локалью `en-US` строка `'12.11.26'` прочитается как 11 декабря 2026 года:

| Ввод | Результат | Обработка |
|---|---|---|
| `'2026. 11. 16.'`, `'2026년 11월 16일'` | Разбирается в ядре | Передавайте напрямую без плагинов. |
| `'26. 5. 5.'`, `'12.11.26'`, `'오후 2:30'` | Разбирается в нестрогом режиме | Подключите плагин `loose` и передайте `{ loose: true, locale: 'ko' }`. |

## Дни недели в скобках и порядок AM/PM

Пресет `'full'` выводит полное название дня недели вроде *화요일* (вторник). Пресет `'llll'` и параметр короткого дня недели берут односложные дни недели в скобки, а диапазоны соединяют тильдой:

```js
import { date, dateRange } from 'native-dates';

const holiday = date('2026-05-05').locale('ko-KR');

holiday.format('llll'); // '2026년 5월 5일 (화)'
holiday.format({ month: 'long', day: 'numeric', weekday: 'short' });
// '5월 5일 (화)'

const week = dateRange('2026-11-16', '2026-11-20');
week.format({ month: 'long', day: 'numeric', weekday: 'short' }, 'ko-KR');
// '11월 16일 (월)~20일 (금)'
```

Символы хангыля проходят через шаблоны токенов без квадратных скобок. Токены краткого месяца и порядкового дня уже включают *월* и *일*, а `'ddd'` выводит односложный день недели:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

В корейском языке *오전* (AM) и *오후* (PM) ставятся перед часом. Чтобы переключить 12-часовые пресеты на 24-часовой формат, передайте `'ko-KR-u-hc-h23'`:

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## Корейское стандартное время и псевдонимы поясов

Ядро принимает `'Asia/Seoul'` и фиксированные смещения. Подключите [плагин zones](/plugins/zones/), чтобы из коробки распознавались аббревиатура `'KST'`, английские названия корейских городов вроде `'Busan'` и встроенные названия на хангыле (например, `'서울'`), включая сокращения внутри строк в нестрогом режиме:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', 'Busan').zone; // 'Asia/Seoul'
datetime('2026. 11. 16. 14:30 KST', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T05:30:00.000Z'
```

В кратком формате корейский часовой пояс выводится как `GMT+9`, а `'zzz'` печатает полное корейское название *한국 표준시*. Поскольку серверы в UTC остаются на вчерашней дате до 8:59 по Сеулу, передавайте `'Asia/Seoul'` в [`today()`](/api/date-fn/#today):

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## Воскресные календари и рабочие недели с понедельника

Локаль `'ko-KR'` начинает неделю с воскресенья, как настенные календари. Корейские рабочие недели, расчётные периоды и ISO-свойство `weekOfYear` ведут отсчёт с понедельника:

```js
import { date, weekdayNames } from 'native-dates';

const sun = date('2026-11-15').locale('ko-KR');

sun.weekStart; // 7
sun.startOf('week').toString(); // '2026-11-15'
sun.weekOfYear; // 46
weekdayNames('short', undefined, 'ko-KR');
// ['일', '월', '화', '수', '목', '금', '토']
weekdayNames('short', 'monday', 'ko-KR');
// ['월', '화', '수', '목', '금', '토', '일']
```

Передайте английское название `'monday'` в конкретный вызов, зафиксируйте первый день недели в [конфигурации](/api/configure/) или используйте тег `'ko-KR-u-fw-mon'`, чтобы сочетать корейский вывод с неделями с понедельника:

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## Относительные даты и лунные праздники

Для корейских календарных дат возвращаются относительные обозначения дней *그저께* («позавчера») и *모레* («послезавтра»). [`DateTime`](/api/date-time/) возвращает *지금* при нулевой разнице и числовые единицы во всех остальных случаях:

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

Передайте `'ko-KR-u-ca-dangi'` для Соллаля, Чхусока и лунных дней рождения, включая високосные месяцы вроде *윤6월*. Краткие пресеты выводят номер года в цикле 1–60 вместо привычного года, поэтому лучше использовать `'long'` или параметры месяца и дня:

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[Форматирование повторяющихся лунных дат]
[`MonthDay`](/api/month-day/) и [`YearMonth`](/api/year-month/) остаются в григорианском календаре, даже если передать тег лунной локали. Форматируйте лунные дни рождения и праздники через григорианский [`CalendarDate`](/api/calendar-date/) нужного года.
:::
