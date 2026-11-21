---
source: 'bd4f6493c9ad'
reviewed: false
title: Даты и время на русском
lede: Склоняйте месяцы и единицы времени без словарей и разбирайте русские даты и часовые пояса без скрытых сдвигов.
---

В дополнение к руководству [Интернационализация](/guides/internationalization/) в русском языке важны падежи месяцев, три формы числительных, точки в датах и одиннадцать часовых зон.

## Падежи месяцев и подпись «г.»

Готовые пресеты ставят месяц рядом с числом в родительный падеж, без числа оставляют именительный и добавляют после года «г.»:

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');
release.format('long'); // '16 ноября 2026 г.'
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru'); // 'ноябрь 2026 г.'
```

Шаблоны токенов убирают лишнее «г.» в карточках и таблицах: сразу после токена дня `MMMM` и `MMM` выводят родительный падеж, а иначе именительный:

```js
const may = date('2026-05-06').locale('ru');
may.format('MMMM YYYY'); // 'май 2026'
may.format('D MMMM YYYY'); // '6 мая 2026'
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.'
```

Если месяц идёт перед числом или отделён неэкранированным текстом, склонение отключается. Оборачивайте буквенные вставки и наращения в квадратные скобки:

```js
may.format('D-го MMMM'); // '6-го май'
may.format('D[-го] MMMM'); // '6-го мая'
```

## Дни недели, строчные буквы и числа месяца

Названия месяцев и дней недели по-русски пишутся со строчной буквы, а неделя всегда начинается с понедельника при `weekStart` равном `1`.

Однобуквенные сокращения в платформенных данных совпадают у понедельника с пятницей, вторника с воскресеньем и среды с субботой, поэтому узкий и короткий стили возвращают «пн»–«вс»:

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
date('2026-11-16').format('dddd, D MMMM', 'ru'); // 'понедельник, 16 ноября'
```

Точка после числа в русских датах не ставится, поэтому `Do` выводит само число. Заглавные дни недели и наращения задаются через [`configure()`](/api/configure/):

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: {
    ru: {
      short: {
        mon: 'Пн',
        tue: 'Вт',
        wed: 'Ср',
        thu: 'Чт',
        fri: 'Пт',
        sat: 'Сб',
        sun: 'Вс',
      },
    },
  },
  ordinals: { ru: (day) => `${day}-е` },
});
weekdayNames('short', undefined, 'ru');
// ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
date('2026-11-16').format('Do', 'ru'); // '16-е'
```

## Склонение длительностей и относительные даты

Русские числительные требуют трёх форм для целых значений и смены падежа после предлогов. Форматирование `Duration` выбирает форму автоматически и разделяет единицы пробелами:

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день'
days(2).format('long', 'ru'); // '2 дня'
days(5).format('long', 'ru'); // '5 дней'
days(21).format('long', 'ru'); // '21 день'
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута'
```

У `DateTime` метод `from()` считает секунды между моментами числом, ведь за 22 часа до полуночи ещё длится тот же день.

У `CalendarDate` метод сравнивает целые календарные дни и возвращает все пять русских наречий времени, включая «позавчера» и «послезавтра»:

```js
import { date, datetime } from 'native-dates';

const baseDay = date('2026-11-16').locale('ru');
baseDay.minus(2, 'days').from(baseDay); // 'позавчера'
baseDay.minus(1, 'day').from(baseDay); // 'вчера'
baseDay.plus(1, 'day').from(baseDay); // 'завтра'
baseDay.plus(2, 'days').from(baseDay); // 'послезавтра'

const baseMoment = datetime('2026-11-16T12:00:00Z', 'Europe/Moscow').locale('ru');
baseMoment.minus(1, 'minute').from(baseMoment); // '1 минуту назад'
baseMoment.plus(2, 'days').from(baseMoment); // 'через 2 дня'
```

## Разбор дат через точку и русских месяцев

Строгий парсер принимает запись «2026.11.16», но отклоняет «16.11.2026» с ошибкой `invalidDate`. Для дат вида ДД.ММ.ГГГГ подключите [`@native-dates/plugins/loose`](/plugins/loose/) и включите `dayFirst`:

```js
import '@native-dates/plugins/loose';
import { configure, date, datetime } from 'native-dates';

configure({ dayFirst: true });
date('16.11.2026', { loose: true }); // CalendarDate для 2026-11-16
date('06.11.2026', { loose: true }); // CalendarDate для 2026-11-06
datetime('16.11.2026, 14:30', { zone: 'Europe/Moscow', loose: true });
// 14:30 в Москве
```

:::warning[Опасность перепутать день и месяц]
Без `dayFirst` нестрогий режим читает числа в американском порядке. Строка «16.11.2026» вернёт `null`, а «06.11.2026» незаметно превратится в 11 июня вместо 6 ноября.
:::

Частичные числовые даты через точку читаются в ядре напрямую. Нестрогий режим распознаёт падежи русских месяцев в частичных датах, а для полных строк возвращает `null`:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' }).toString(); // '11-16'
yearMonth('ноябрь 2026', { loose: true, locale: 'ru' }).toString(); // '2026-11'
date('16 ноября 2026', { loose: true, locale: 'ru' }); // null
```

## Часовые пояса России и стран СНГ

Россия и Беларусь не переводят часы, а Казахстан в 2024 году перешёл на UTC+5, но в одиннадцати зонах России идентификаторы IANA сохраняют прежние переходы.

Плагин [`@native-dates/plugins/zones`](/plugins/zones/) находит города базы IANA в любом регистре, тогда как сокращения СНГ, альтернативную транслитерацию и кириллицу нужно указать в `zoneAliases`:

| Запрос | Статус по умолчанию | Обработка |
|---|---|---|
| `'Europe/Moscow'`, `'Asia/Almaty'` | Работает в ядре | Полные идентификаторы IANA доступны сразу и хранят историю переходов. |
| `'Moscow'`, `'Yekaterinburg'`, `'Minsk'` | Работает с плагином | Города из идентификаторов IANA сопоставляются без учёта регистра. |
| `'MSK'`, `'SPB'`, `'Kazan'`, `'Astana'`, `'мск'` | Ошибка `unknownZone` | Сокращения СНГ, не-IANA города и кириллицу нужно задать в `zoneAliases`. |

Задайте проектные псевдонимы один раз в [`configure()`](/api/configure/), чтобы сопоставлять их без учёта регистра:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({
  zoneAliases: {
    MSK: 'Europe/Moscow',
    мск: 'Europe/Moscow',
    SPB: 'Europe/Moscow',
    'Saint Petersburg': 'Europe/Moscow',
    Ekaterinburg: 'Asia/Yekaterinburg',
    Astana: 'Asia/Almaty',
  },
});
datetime('2026-11-16T12:00:00Z', 'MSK').format('HH:mm', 'ru'); // '15:00'
datetime('2026-11-16T12:00:00Z', 'мск').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'Astana').offset; // '+05:00'
```
