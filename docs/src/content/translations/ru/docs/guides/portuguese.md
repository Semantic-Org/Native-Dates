---
source: 66dc60a9a9b2
title: Португальский
lede: Форматируйте и разбирайте португальские даты для Бразилии, Европы и Африки.
---

Чтобы форматировать даты по-португальски, передайте `'pt-BR'` или `'pt-PT'` любым способом из руководства [Локализация](/guides/localization/). В Бразилии и Португалии приняты числовые даты с днём в начале и строчные названия месяцев, но различаются средний пресет и обозначение первого числа месяца.

## Разбор дат в порядке день/месяц/год

Строки ISO с годом в начале никогда не путают месяц и день. С [плагином loose](/plugins/loose/) португальские локали автоматически разбирают даты через косую черту, точку и словесные даты с днём в начале:

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true, locale: 'pt-PT' })?.toString(); // '2026-11-16'
date('16 de novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-16'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  locale: 'pt-BR',
  zone: 'America/Sao_Paulo',
})?.hour; // 14
date('29/02/2026', { loose: true, locale: 'pt-BR' }); // null
```

Частичные числовые пары день-месяц и месяц-год разбираются в ядре без плагинов, а нестрогий режим распознаёт португальские названия месяцев:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## Пресеты, предлоги и порядковые числа

Встроенные пресеты выводят строчные названия месяцев и естественные предлоги. Пресет `'medium'` в Бразилии выводит сокращённое название месяца, а в Португалии — числа через косую черту:

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

В пользовательских шаблонах токенов берите буквальные слова вроде `'[de]'` и `'[às]'` в квадратные скобки. Без скобок вызов выбросит ошибку, а не станет случайно подставлять отдельные буквы как токены:

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

В Бразилии сокращения месяцев и дней недели пишутся со строчной буквы и с точкой на конце. Токен `dd` выводит однобуквенные инициалы, потому что *segunda* и *sexta* начинаются с одних и тех же двух букв.

К тому же в Бразилии первое число месяца пишут как *1º* (*1º de maio*), а в Португалии — обычной цифрой. Ограничьте правила [`ordinals`](/api/configure/) и дней недели тегом `'pt-BR'`, чтобы в Португалии сохранились стандартные значения:

```js
import { configure, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'pt-BR'); // ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

configure({
  ordinals: { 'pt-BR': (d) => (d === 1 ? '1º' : d) },
  weekdayNames: { 'pt-BR': { short: { fri: 'Sex', sat: 'Sáb' } } },
});
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sex, 1º de maio'
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-PT'); // 'sexta, 1 de maio'
```

## Начало недели

Названия будней от *segunda-feira* до *sexta-feira* ведут счёт от воскресенья, тогда как `dayOfWeek` следует стандарту ISO: от `1` (понедельник) до `7` (воскресенье).

Границы недель определяются свойством `weekStart` каждого региона: в Бразилии и Португалии неделя начинается в воскресенье, а в Анголе, Мозамбике и Кабо-Верде — в понедельник:

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

Для деловых отчётов с понедельника по воскресенье передавайте английское название `'monday'`. Номера недель `weekOfYear` по ISO всегда считаются от понедельника:

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## Часовые пояса и относительные даты

Бразилия охватывает четыре часовых пояса и отказалась от перехода на летнее время в 2019 году. `'America/Sao_Paulo'` остаётся на UTC-3 круглый год, сохраняя при этом исторические летние смещения:

| Пояс в Бразилии | Основной пояс IANA | Региональные пояса и псевдонимы |
|---|---|---|
| Фернанду-ди-Норонья | `America/Noronha` | UTC-2. Напрямую распознаёт `'Noronha'` и `'FNT'`. |
| Время Бразилиа | `America/Sao_Paulo` | UTC-3, общий для Баии, Ресифи, Форталезы и Белена; распознаёт `'BRT'`, `'Brasília'`, `'Rio de Janeiro'`, `'Belo Horizonte'` и `'Salvador'`. |
| Амазонас и Мату-Гросу | `America/Manaus` | UTC-4, общий для Куябы, Кампу-Гранди и Порту-Велью; распознаёт `'AMT'`. |
| Акри | `America/Rio_Branco` | UTC-5, общий для Эйрунепе; в локали `'pt-BR'` автоматически распознаёт `'ACT'`. |

С [плагином zones](/plugins/zones/) названия крупных бразильских городов (как английские, так и с диакритикой вроде `'Brasília'` и `'São Paulo'`) и региональные аббревиатуры распознаются из коробки, включая сокращение `BRT` внутри строк в нестрогом режиме:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:00', 'BRT').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'Brasília').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo')
  .locale('pt-BR')
  .in('ACT')
  .format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-11-16 14:30 BRT', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T17:30:00.000Z'
```

Для календарных дат возвращаются относительные обозначения дней вплоть до *anteontem* («позавчера») и *depois de amanhã* («послезавтра»). [`DateTime`](/api/date-time/) считает прошедшие часы и формулирует будущие промежутки по-разному в Бразилии и Португалии.

Поскольку полночь по UTC наступает в 21:00 по времени Бразилиа, на серверах в UTC передавайте [`today('America/Sao_Paulo')`](/api/date-fn/#today) вместо вызова [`fromNow()`](/api/calendar-date/#fromnow):

```js
import { date, today } from 'native-dates';

const ref = date('2026-11-16');

date('2026-11-14').from(ref, 'pt-BR'); // 'anteontem'
date('2026-11-18').from(ref, 'pt-BR'); // 'depois de amanhã'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-BR'); // 'em 2 dias'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-PT');
// 'dentro de 2 dias'
ref.from(today('America/Sao_Paulo'), 'pt-BR');
```
