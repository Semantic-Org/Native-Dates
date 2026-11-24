---
source: a214ff99444f
title: Французский
lede: Форматируйте и разбирайте французские даты с учётом региональных форматов времени и начала недели.
---

Базовый тег `'fr'` использует правила Франции (метрополии). Когда пользователи ожидают местный порядок компонентов даты, разделители времени и начало недели, передайте региональный тег вроде `'fr-CA'` любым способом из руководства [Локализация](/guides/localization/).

## Региональные варианты

Порядок компонентов в краткой дате, разделители часов и первый день недели меняются от региона к региону:

| Локаль | Краткий формат | Начало недели | Региональные особенности |
|---|---|---|---|
| `fr-FR`, `fr-SN`, `fr-MA` | `'01/11/2026 14:30'` | `1` — понедельник | Косые черты, 24-часовой формат и сокращение июля `'juil.'`. |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — воскресенье | Порядок даты по ISO в Канаде, время с `'h'` и пробелами, сокращение июля `'juill.'`. |
| `fr-CH` | `'01.11.26 14:30'` | `1` — понедельник | Разделители-точки и двузначный год в `'short'`, четырёхзначный год в `'L'`. |
| `fr-BE` | `'1/11/26 14:30'` | `1` — понедельник | День без ведущего нуля и двузначный год в `'short'`, четырёхзначный год в `'L'`. |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — суббота | Неделя с субботы и 12-часовой формат по умолчанию. |

Передавайте полный региональный тег, чтобы пресеты выводили местную пунктуацию:

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');

rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

В канадском французском неделя начинается с воскресенья, и методы [`startOf('week')`](/api/calendar-date/#startof) и [`weekdayNames()`](/api/month-names/#weekdaynames) учитывают это автоматически. Если для отчётов из базы данных нужны недели по ISO, зафиксируйте английское название `'monday'`:

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');

mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Французская типографика и токены форматирования

Буквальные латинские символы в шаблонах вроде `'HH[h]mm'` нужно брать в квадратные скобки. Запись `'HHhmm'` без скобок выбрасывает [`unknownFormat`](/api/errors/#units-zones-and-formats), тогда как буква с диакритикой *à* проходит как обычный текст без экранирования:

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');

depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM à HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

По-французски первое число месяца пишется как *1er*, а остальные дни — обычными числами. Задайте правило [`ordinals`](/api/configure/) для `'fr'`, и региональные теги унаследуют его автоматически:

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'

configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

Названия дней недели и месяцев во французском тексте пишутся со строчной буквы. Делайте заглавной только первую букву, когда дата открывает заголовок.

Не ставьте точку после `MMM`: сокращённые названия месяцев уже содержат точку, а короткие вроде *mars*, *mai*, *juin* и *août* обходятся без неё:

```js
import { monthNames } from 'native-dates';

const s = date('2026-11-01').format('full', 'fr'); // 'dimanche 1 novembre 2026'
s[0].toUpperCase() + s.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## Разбор французских дат и времени

Ядро напрямую разбирает канадские строки ISO и французское время суток с `h` вроде `'14h30'`. С [плагином loose](/plugins/loose/) французские локали автоматически разбирают даты через косую черту и точку с днём в начале, порядковое *1er* и полные словесные даты:

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

time('14h30').toString(); // '14:30:00'
time('14 h 30').toString(); // '14:30:00'
date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('14.07.2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-14'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
datetime('lundi 16 novembre 2026 à 14h30', {
  loose: true,
  locale: 'fr',
  zone: 'Europe/Paris',
})?.hour; // 14
```

Сокращённое название месяца должно однозначно указывать на один месяц: *juil* разбирается как июль, а *jui* возвращает `null`, поскольку совпадает с началом и *juin*, и *juillet*.

В нестрогом режиме частичные даты распознают французские названия месяцев и сокращения с диакритикой. Функции [`dayMonth()`](/api/month-day-fn/#daymonth) и [`duration()`](/api/duration-fn/) (с английскими и сокращёнными фразами вроде `'2h 30m'`) работают в ядре без плагинов:

```js
import { dayMonth, duration, monthDay, yearMonth } from 'native-dates';

dayMonth('14/07').toString(); // '07-14'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
yearMonth('févr. 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
duration('2h 30m').toString(); // 'PT2H30M'
```

## Часовые пояса

Северная Америка переводит часы на две-три недели раньше Европы весной и на неделю позже осенью, из-за чего разница между Парижем и Монреалем временно сокращается с шести часов до пяти.

Марокко к тому же возвращается к UTC+0 на время Рамадана, поэтому переводите моменты времени методом [`in()`](/api/date-time/#in), а не вычитанием фиксированного числа часов:

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');

hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

С [плагином zones](/plugins/zones/) названия крупных франкоязычных городов (включая написание с диакритикой вроде `'Montréal'` и `'Genève'`) и канадские аббревиатуры вроде `'HNE'` распознаются напрямую без настройки собственных псевдонимов:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Bruxelles').zone; // 'Europe/Brussels'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Toronto'
```

## Относительные даты и неразрывные пробелы

Для календарных дат возвращаются относительные обозначения дней *avant-hier* («позавчера») и *après-demain* («послезавтра»), а [`DateTime`](/api/date-time/) считает точные единицы времени, чтобы поздний вечер не превращался во «вчера».

В тестах учитывайте типографский апостроф в *aujourd’hui*, а также узкие и обычные неразрывные пробелы в кратких длительностях:

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');

ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
datetime('2026-11-09T14:00Z').from('2026-11-10T14:00Z', 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
```
