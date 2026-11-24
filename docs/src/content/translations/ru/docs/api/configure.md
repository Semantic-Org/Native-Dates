---
source: e011cab2c85c
title: configure()
lede: Чтение и обновление глобальных значений по умолчанию для часового пояса, локали, начала недели, форматов, подписей токенов и плагинов.
---

## Глобальные значения по умолчанию

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

Обновляет одну или несколько глобальных настроек процесса и возвращает снимок активной конфигурации. Вызов без аргументов читает текущие настройки без их изменения.

Пропущенные свойства сохраняют текущие значения. Передайте `null` для любой настройки, чтобы вернуть системные и встроенные значения по умолчанию.

```js title="setup.js"
import { configure, date, datetime } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'de-DE',
});

datetime('2026-11-16T17:30:00Z').zone; // 'Europe/Berlin'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
configure().weekStart; // undefined

configure({ weekStart: 'sunday' });
date('2026-11-18').startOf('week').toString(); // '2026-11-15'
configure().weekStart; // 7

// сброс к часовому поясу среды, локали среды и началу недели локали
configure({ zone: null, locale: null, weekStart: null });
```

**Параметры**

```params
- name: settings
  type: Settings
  description: Глобальные настройки процесса для обновления. Пропущенные ключи остаются без изменений.
  options:
    - name: zone
      type: Zone | null
      description: Часовой пояс по умолчанию для фабричных функций и `now()`. Значение `null` возвращает локальный пояс среды выполнения.
    - name: locale
      type: Locale | null
      description: Тег локали, список тегов или заголовок `Accept-Language` по умолчанию для форматирования, границ недели, выходных и плагинов. Значение `null` или `''` возвращает локаль среды выполнения.
    - name: weekStart
      type: DayOfWeek | null
      description: Первый день недели для границ недели и `weekdayNames()` — английское название дня недели или число от 1 (понедельник) до 7 (воскресенье). Если значение не задано или равно `null`, используется правило активной локали.
    - name: weekdayNames
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: "Пользовательские подписи дней недели по тегу локали, ширине (`narrow`, `short` или `long`) и английскому названию дня недели. Региональные теги дополняют базовую локаль, а пустое значение восстанавливает системные названия."
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: "Пользовательский форматтер дня месяца для токена `Do` по тегу локали. Значение `null` восстанавливает встроенные английские суффиксы и маркеры дня, принятые в локали."
    - name: formats
      type: "Record<string, string | Intl.DateTimeFormatOptions> | null"
      description: "Именованные пользовательские форматы для `format(name)`, где каждое значение — шаблон токенов или объект опций `Intl`. Пользовательские имена перекрывают встроенные пресеты, а `null` очищает их."
    - name: dayFirst
      type: boolean | null
      description: Числовой порядок даты по умолчанию для нестрогих вызовов без явных `dayFirst` и `locale`. Если значение не задано или равно `null`, порядок определяется активной локалью.
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: "Пользовательские псевдонимы часовых поясов для `@native-dates/plugins/zones`. Значение `null` для отдельного ключа или всего объекта очищает псевдонимы."
```

**Возвращает**

```returns
type: "{ zone, locale, weekStart, dayFirst, zoneAliases, weekdayNames, ordinals, formats }"
description: Поверхностная копия активных настроек после применения обновлений. Незаданные ключи содержат `undefined`.
```

Настройки `weekdayNames` и `ordinals` меняют вывод шаблонов токенов и [`weekdayNames()`](/api/month-names/#weekdaynames) без подключения плагинов:

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});

date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
weekdayNames('narrow', 'monday', 'lv'); // ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

configure({ weekdayNames: null, ordinals: null });
```

Именованные форматы позволяют задать собственные пресеты приложения для каждого типа, который форматирует дату или время:

```js
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt'); // 'Friday, November 6'

configure({ formats: null });
```

После импорта плагины добавляют в `configure()` свои опции. Попытка задать опцию плагина до его импорта выбрасывает `RangeError`:

```js
import { configure, date, now } from 'native-dates';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';

configure({
  dayFirst: true,
  zoneAliases: { hq: 'Europe/Berlin' },
});

date('07.09.2026', { loose: true })?.toString(); // '2026-09-07'
now('hq').zone; // 'Europe/Berlin'

configure({ dayFirst: null });
```
:::

:::warning[Настраивайте сервер один раз при запуске]
Глобальная конфигурация обновляет общее состояние всего процесса JavaScript. Задайте значения по умолчанию один раз при старте сервера, а внутри обработчиков запросов привязывайте часовой пояс и [`locale()`](/api/date-time/#locale) каждого пользователя к конкретному значению. Подробнее — в руководстве [Локализация](/guides/localization/).
:::

## Вспомогательная функция для дня недели

Преобразует английское название дня недели в его номер по той же нумерации ISO, которая принята во всей библиотеке.

:::entry
### `dayOfWeek()` :kind[function]

```js signature
dayOfWeek(day): number
```

Преобразует английское название дня недели, трёхбуквенное сокращение или номер ISO в целое число от 1 (понедельник) до 7 (воскресенье). Нераспознанные названия и числа вне этого диапазона выбрасывают `RangeError`.

**Параметры**

```params
- name: day
  type: DayOfWeek
  required: true
  description: Английское название дня недели вроде `'monday'`, трёхбуквенное сокращение без учёта регистра вроде `'Fri'` или целое число от 1 до 7.
```

**Возвращает**

```returns
type: number
description: День недели от 1 (понедельник) до 7 (воскресенье).
```

```js
import { dayOfWeek } from 'native-dates';

dayOfWeek('monday'); // 1
dayOfWeek('Fri'); // 5
dayOfWeek('sunday'); // 7
dayOfWeek(3); // 3
```
:::
