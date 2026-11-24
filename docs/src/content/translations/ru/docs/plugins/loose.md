---
source: be45ccc1b61a
title: loose
lede: Подключаемый разбор текста с учётом локали и возврат null для ненадёжных данных из форм, CSV и устаревших источников.
---

## Подключаемый нестрогий разбор

По умолчанию каждая фабричная функция разбирает только строгие строки ISO 8601 и выбрасывает ошибку на некорректном вводе. Импорт этого плагина включает опцию `{ loose: true }` для пользовательского ввода, столбцов CSV и устаревших заголовков.

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

Строгий разбор остаётся поведением по умолчанию везде, где нестрогий режим не указан. Импорт плагина никак не меняет существующие вызовы в проекте.

## Разбор в активной локали

Нестрогий режим разбирает те же форматы дат и времени суток, которые `Intl` выводит для активной локали. Названия месяцев, обозначения AM/PM и частей суток, а также порядок дня и месяца в числовых датах берутся из среды выполнения, а цифры из любой письменности распознаются автоматически.

Активная локаль выбирается в том же порядке, что и при форматировании: сначала опция `locale`, затем настройки [`configure()`](/api/configure/), а при их отсутствии — локаль среды выполнения по умолчанию.

```js locale="en-US" label="English"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'en-US' });

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
time('9:10 in the evening', { loose: true })?.toString(); // '21:10:00'
datetime('Sep 6, 2026, 5:30 PM', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 17
```

```js locale="fr" label="Français"
import '@native-dates/plugins/loose';
import { configure, date, datetime, monthDay } from 'native-dates';

configure({ locale: 'fr' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('1er mai 2026', { loose: true })?.toString(); // '2026-05-01'
monthDay('1er mai', { loose: true })?.toString(); // '05-01'
datetime('16 novembre 2026 à 14:30', {
  loose: true,
  zone: 'Europe/Paris',
})?.hour; // 14
```

```js locale="es" label="Español"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'es' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de noviembre de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 de la noche', { loose: true })?.toString(); // '21:10:00'
datetime('16 nov 2026, 14:30', {
  loose: true,
  zone: 'Europe/Madrid',
})?.hour; // 14
```

```js locale="pt-BR" label="Português"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'pt-BR' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de novembro de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 da noite', { loose: true })?.toString(); // '21:10:00'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  zone: 'America/Sao_Paulo',
})?.hour; // 14
```

```js locale="zh-CN" label="中文"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'zh-CN' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('晚上9:10', { loose: true })?.toString(); // '21:10:00'
datetime('2026年11月16日 下午2:30', {
  loose: true,
  zone: 'Asia/Shanghai',
})?.hour; // 14
```

```js locale="ja" label="日本語"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ja' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026年11月16日 14:30', {
  loose: true,
  zone: 'Asia/Tokyo',
})?.hour; // 14
```

```js locale="ko" label="한국어"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ko' });

date('26. 5. 5.', { loose: true })?.toString(); // '2026-05-05'
date('2026년 11월 16일', { loose: true })?.toString(); // '2026-11-16'
time('오후 2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026년 11월 16일 오후 2:30', {
  loose: true,
  zone: 'Asia/Seoul',
})?.hour; // 14
```

```js locale="ru" label="Русский"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ru' });

date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('16 ноября 2026 г.', { loose: true })?.toString(); // '2026-11-16'
time('9:10 вечера', { loose: true })?.toString(); // '21:10:00'
datetime('16 нояб. 2026 г., 14:30', {
  loose: true,
  zone: 'Europe/Moscow',
})?.hour; // 14
```

```js locale="ar-EG" label="العربية"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ar-EG' });

date('١٦‏/١١‏/٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
date('١٦ نوفمبر ٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true })?.toString(); // '14:30:00'
datetime('١٦ نوفمبر ٢٠٢٦، ٢:٣٠ م', {
  loose: true,
  zone: 'Africa/Cairo',
})?.hour; // 14
```

В локалях с годом в начале, таких как корейская, двузначный год читается первым, поэтому `'26. 5. 5.'` в корейской локали разбирается как 5 мая 2026 года. Служебные слова, порядковые суффиксы и стоящие в начале названия дней недели пропускаются как в полных, так и в частичных датах.

## Возврат null на некорректных данных

При включённом нестрогом режиме нечитаемые строки, пустые поля, отсутствующие значения и невозможные календарные даты вроде 30 февраля возвращают `null` вместо выбрасывания ошибки. Обработчики форм и скрипты импорта могут проверять результат напрямую, не оборачивая каждое поле в блок `try`.

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

Ту же опцию принимают фабричные функции для [диапазонов](/api/ranges/), [`YearMonth`](/api/year-month/) и [`MonthDay`](/api/month-day/):

```js
import { dateRange, monthDay, yearMonth } from 'native-dates';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

Даты без года или дня в фабричных функциях `date()` и `datetime()` возвращают `null`, а не подставляют значения по умолчанию. Если во вводе есть только месяц и год или месяц и день, используйте фабричную функцию для частичной даты.

Также отклоняются двузначные годы рядом с неанглийским названием месяца, неоднозначные сокращения месяцев, часы больше 12 рядом с AM или PM и строки только со временем суток, переданные в [`datetime()`](/api/datetime-fn/). Неизвестные аббревиатуры часовых поясов в верхнем регистре и записи вроде `'14h'` без минут тоже возвращают `null`.

:::note[Некорректные данные возвращают null, а некорректные опции по-прежнему выбрасывают ошибку]
Нестрогий режим обрабатывает только нечитаемые входные данные. Передача неизвестного часового пояса вроде `'Mars/Olympus'` — это ошибка в коде приложения, а не в пользовательском вводе, поэтому она по-прежнему сразу выбрасывает ошибку.
:::

## Часовые пояса в нестрогих строках

Строки с меткой UTC или числовым смещением задают конкретный момент времени и переводят его в целевой или настроенный часовой пояс. Строки без смещения сохраняют ровно те дату и время суток, которые указаны в тексте, и сразу помещают их в целевой часовой пояс.

```js
datetime('Sat, 06 Sep 2026 14:30:00 GMT', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 10

datetime('September 6, 2026 5:30 PM', {
  loose: true,
  zone: 'America/Los_Angeles',
})?.hour; // 17
```

Аббревиатура часового пояса после времени суток разрешается по тем же правилам, что и опция `zone`. Подключите [`@native-dates/plugins/zones`](/plugins/zones/), чтобы распознавать аббревиатуры помимо UTC, GMT и стандартных идентификаторов IANA, включая зависящие от локали коды вроде `CST` в китайских локалях.

## Числовые даты с днём в начале

Числовые даты со слэшами, точками или дефисами автоматически следуют порядку активной локали. Передайте `dayFirst` в конкретный вызов или задайте его в [`configure()`](/api/configure/), если порядок во вводе расходится с активной локалью.

```js
import { configure } from 'native-dates';

date('07.09.2026', { loose: true, locale: 'en-US' })?.toString(); // '2026-07-09'
date('07.09.2026', { loose: true, locale: 'de-DE' })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, locale: 'en-US', dayFirst: true })?.toString(); // '2026-09-07'

configure({ dayFirst: true });
date('7/9/26', { loose: true })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, dayFirst: false })?.toString(); // '2026-07-09'
configure({ dayFirst: null });
```

Передайте `dayFirst: null` в `configure()`, чтобы снова следовать активной локали. Фабричные функции частичных дат вроде [`monthDay()`](/api/month-day-fn/) всегда читают пару чисел в порядке, указанном в их имени, независимо от локали.

## Региональные правила времени и месяцев

Время через точку вроде `'14.30'` разбирается только в локалях, где часы и минуты разделяют точкой (например, в финской и датской), а в остальных возвращает `null`. Секунды через точку разбираются после даты, тогда как отдельные строки из трёх чисел через точку остаются датами.

Обозначения частей суток вроде английского *in the evening* и корейского *밤* сдвигают 12-часовое время, но не трогают 24-часовое. Предлоги между датой и временем никогда не трактуются как AM или PM: валлийский предлог *am* («в») оставляет 14:30 без изменений, тогда как английское `'AM 12:30'` разбирается как `00:30` (полчаса после полуночи).

Склонённые и аффиксальные формы месяцев в полных датах разбираются автоматически — в том числе в иврите и баскском языке. Сокращённое название месяца должно однозначно указывать на один месяц: французское *juil* разбирается как июль, а *jui* возвращает `null`.

```js label="Время через точку"
datetime('16.11.2026 klo 14.30.15', {
  loose: true,
  locale: 'fi',
  zone: 'UTC',
})?.toString(); // '2026-11-16T14:30:15.000Z'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'de' }); // null
time('14.30.15', { loose: true, locale: 'fi' }); // null
```

```js label="Части суток"
time('밤 11:30', { loose: true, locale: 'ko' })?.toString(); // '23:30:00'
time('밤 1:30', { loose: true, locale: 'ko' })?.toString(); // '01:30:00'
time('14:30 nachmittags', { loose: true, locale: 'de' })?.toString(); // '14:30:00'
```

```js label="Предлоги"
time('am 14:30', { loose: true, locale: 'cy' })?.toString(); // '14:30:00'
time('am 12:30', { loose: true, locale: 'cy' })?.toString(); // '12:30:00'
time('AM 12:30', { loose: true, locale: 'en-US' })?.toString(); // '00:30:00'
```

```js label="Формы месяцев"
date('2026(e)ko azaroaren 16(a)', {
  loose: true,
  locale: 'eu',
})?.toString(); // '2026-11-16'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
```

## Опции фабричных функций

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, locale?, dayFirst?, disambiguation? }): DateTime | null
date(input, { loose: true, zone?, locale?, dayFirst? }): CalendarDate | null
time(input, { loose: true, zone?, locale?, dayFirst? }): Time | null
duration(input, { loose: true, locale? }): Duration | null
yearMonth(input, { loose: true, zone?, locale? }): YearMonth | null
monthDay(input, { loose: true, zone?, locale?, dayFirst? }): MonthDay | null
dateRange(start, end, { loose: true, zone?, locale?, dayFirst? }): DateRange | null
```

Добавляет во все фабричные функции разбор с учётом локали и возврат `null` при нечитаемом вводе. Вызов конструкторов классов вроде `new DateTime()` с `{ loose: true }` тоже включает такой разбор, но по-прежнему выбрасывает ошибку, если строку не удаётся разобрать.

**Параметры**

```params
- name: loose
  type: boolean
  default: "false"
  description: "Разбор неформального текста в активной локали, запасной разбор машинных форматов через встроенный `Date` и возврат `null` при нечитаемом вводе."
- name: dayFirst
  type: boolean
  description: "Переопределение порядка числовой даты активной локали для строк вроде `'07.09.2026'`."
- name: zone
  type: Zone
  description: Часовой пояс для интерпретации локальных строк даты и времени или отображения моментов времени.
- name: locale
  type: Locale
  description: Тег локали BCP 47, сохраняемый в значении и используемый для названий месяцев, частей суток, формата часов и порядка даты.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "Способ разрешения неоднозначности при переходе на летнее или зимнее время для локальных строк даты и времени. Значение `'reject'` в нестрогом режиме возвращает `null`."
```

**Возвращаемое значение**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: Разобранный экземпляр или `null`, если `input` не удаётся разобрать.
```

```js
date('Sept 6, 2026', { loose: true })?.toString(); // '2026-09-06'
date('2026-09', { loose: true }); // null
yearMonth('2026-09', { loose: true })?.toString(); // '2026-09'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

Переопределяет порядок числовых дат по умолчанию для вызовов в нестрогом режиме, где `dayFirst` и `locale` не переданы явно. По умолчанию не задано, поэтому нестрогий режим следует активной локали.

**Параметры**

```params
- name: dayFirst
  type: boolean | null
  description: "Фиксация порядка числовых дат в нестрогом режиме: с днём в начале (`true`), с месяцем в начале (`false`) или `null` для следования активной локали."
```
:::
