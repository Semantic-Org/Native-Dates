---
source: 7c459605683f
title: Испанский
lede: Региональные форматы дат и правила отображения времени для Испании, Латинской Америки и США.
---

Базовый тег `'es'` использует принятые в Испании неделю с понедельника и 24-часовой формат. Для аудитории в Латинской Америке или США передавайте региональный тег вроде `'es-MX'` любым способом из руководства [Локализация](/guides/localization/).

## Испания, Латинская Америка и США

В Испании принят 24-часовой формат. В Латинской Америке и испаноязычных регионах США используется 12-часовой формат с региональными пробелами в AM/PM, разными разделителями дат и перуанским вариантом *setiembre*:

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');

cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('long', 'es-PE'); // '16 de setiembre de 2026 a las 5:30 p. m.'
cita.date.format('short', 'es-PR'); // '09/16/26'
```

Первый день недели тоже различается по испаноязычному миру. Общий тег `'es-419'` начинает неделю с понедельника, в отличие от Мексики и Колумбии:

| Теги | Начало недели и время | Региональные правила |
|---|---|---|
| `'es'`, `'es-ES'` | `1`, `17:30` | Неделя с понедельника, 24-часовой формат и сокращение сентября *sept*. |
| `'es-MX'`, `'es-US'` | `7`, `5:30 p.m.` | Неделя с воскресенья и 12-часовой формат без пробела в маркере. |
| `'es-AR'`, `'es-CL'` | `1`, `5:30 p. m.` | Неделя с понедельника и маркер с пробелом; в Чили краткие даты пишутся через дефис. |
| `'es-CO'`, `'es-PE'` | `7`, `5:30 p. m.` | Неделя с воскресенья, числовые средние даты в Колумбии и *setiembre* в Перу. |
| `'es-PR'` | `7`, `5:30 p. m.` | Неделя с воскресенья и американский порядок месяц/день/год. |

Для группировки еженедельных отчётов в базе данных зафиксируйте понедельник через английское название дня недели в [`startOf('week', 'monday')`](/api/calendar-date/#startof), чтобы Мадрид и Мехико попадали в одну неделю:

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Предлоги, строчные названия и дни недели

Длинные испанские даты соединяют части предлогами *de*, *del* и *a las*. В шаблонах токенов берите буквальные связки в квадратные скобки, чтобы незаэкранированные буквы не выбрасывали [`unknownFormat`](/api/errors/#units-zones-and-formats):

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

Названия месяцев, дней недели и маркеры AM/PM в испанском пишутся со строчной буквы. Делайте заглавной только первую букву, когда дата открывает заголовок.

Однобуквенные сокращения дней недели повторяют *M* для *martes* и *miércoles*. Двухбуквенный токен `'dd'` сразу устраняет это совпадение, а [`configure()`](/api/configure/) позволяет задать для среды *X* или порядковое *1.º* для первого числа месяца:

```js
import { configure, date, weekdayNames } from 'native-dates';

const s = date('2026-05-01').format('full', 'es'); // 'viernes, 1 de mayo de 2026'
s[0].toUpperCase() + s.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX'); // ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

configure({
  weekdayNames: { es: { narrow: { tue: 'M', wed: 'X' } } },
  ordinals: { es: (day) => (day === 1 ? '1.º' : day) },
});
date('2026-05-06').format('dd', 'es-MX'); // 'X'
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo'
```

## Разбор испанских дат и месяцев

С [плагином loose](/plugins/loose/) числовые даты автоматически подстраиваются под активную локаль: Испания и Чили разбирают их с днём в начале, а Пуэрто-Рико — с месяцем в начале:

```js
import '@native-dates/plugins/loose';
import { date, datetime, dayMonth, monthDay, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-06'
date('16-09-2026', { loose: true, locale: 'es-CL' })?.toString(); // '2026-09-16'
date('06/11/2026', { loose: true, locale: 'es-PR' })?.toString(); // '2026-06-11'
```

В нестрогом режиме также разбираются полные словесные даты, предлоги, день недели в начале строки, перуанский *setiembre* и 12-часовое время с пробелом, а числовой [`dayMonth()`](/api/month-day-fn/#daymonth) работает в ядре без плагинов:

```js
date('16 de noviembre de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-16'
date('mar, 16 jun 2026', { loose: true, locale: 'es' })?.toString(); // '2026-06-16'
datetime('el 16 de noviembre de 2026 a las 14:30', {
  loose: true,
  locale: 'es',
  zone: 'Europe/Madrid',
})?.hour; // 14
time('5:30 p. m.', { loose: true, locale: 'es-MX' })?.toString(); // '17:30:00'
dayMonth('16/11').toString(); // '11-16'
monthDay('16 set.', { loose: true, locale: 'es-PE' })?.toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-01'
```

## Часовые пояса и полуночный переход на летнее время

Большая часть Мексики живёт по UTC-6 круглый год, за исключением северных приграничных городов и штата Кинтана-Роо. Аббревиатура `CST` зависит от активной локали: по умолчанию она разрешается в Чикаго, а для Кубы — в Гавану:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', { zone: 'CST', locale: 'es-CU' }).zone; // 'America/Havana'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

[Плагин zones](/plugins/zones/) из коробки распознаёт английские и местные названия крупных испаноязычных городов, а также латиноамериканские аббревиатуры вроде `'CDMX'` и `'COT'`. Запрос `'San Juan'` разрешается в Пуэрто-Рико при локали `'es-PR'` и в Аргентину во всех остальных случаях:

```js
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'
datetime('2026-07-15T12:00', { zone: 'San Juan', locale: 'es-PR' }).zone; // 'America/Puerto_Rico'
```

В Чили и на Кубе переход на летнее время происходит в полночь со скачком сразу с 00:00 на 01:00. Вызов [`at('00:00', zone)`](/api/calendar-date/#at) или `startOf('day')` аккуратно попадает на 01:00 той же даты:

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## Относительное время

В испанском языке есть особые слова для пяти дней подряд — от *anteayer* («позавчера») до *pasado mañana* («послезавтра»). [`CalendarDate`](/api/calendar-date/) возвращает эти относительные обозначения дней, а [`DateTime`](/api/date-time/) считает прошедшие часы:

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

На общих серверах передавайте [`today(zone)`](/api/date-fn/#today) вместо [`fromNow()`](/api/calendar-date/#fromnow), чтобы полуночный переход между *hoy* и *mañana* совпадал с часовым поясом пользователя.
