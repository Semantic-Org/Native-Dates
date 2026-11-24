---
source: 68d49ce6b3ea
title: monthNames()
lede: Получение локализованных массивов названий месяцев и дней недели для заголовков календарей и меню.
---

## Календарные подписи

Обе функции читают данные из кешированных таблиц `Intl` в ядре библиотеки и возвращают новый массив при каждом вызове. Полученный список можно свободно преобразовывать через `map`, `slice` или `reverse`, не изменяя общее состояние.

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

Возвращает массив из 12 локализованных названий месяцев григорианского календаря от января до декабря. По умолчанию используются полные названия в [настроенной локали](/api/configure/).

**Параметры**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: Полные названия месяцев вроде `'January'` или сокращённые вроде `'Jan'`.
- name: locale
  type: Locale
  description: Тег локали BCP 47, переопределяющий настроенное значение по умолчанию.
```

**Возвращает**

```returns
type: string[]
description: Двенадцать подписей месяцев в порядке от индекса `0` (январь) до `11` (декабрь).
```

```js title="months.js"
import { monthNames } from 'native-dates';

monthNames('short', 'en-US');
// ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

monthNames('long', 'fr-FR').slice(0, 3);
// ['janvier', 'février', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

Возвращает массив из 7 локализованных подписей дней недели, сдвинутый так, чтобы начинаться с `firstDay`, настроенного `weekStart` из [настроек приложения](/api/configure/) или первого дня недели активной локали.

Границы недели в [`startOf('week')`](/api/calendar-date/#startof) и недельные диапазоны следуют тому же правилу первого дня, поэтому заголовки календаря всегда совпадают с сеткой недель. Пользовательские подписи дней недели, заданные через [`configure()`](/api/configure/), действуют и здесь.

**Параметры**

```params
- name: style
  type: "'short' | 'long' | 'narrow'"
  default: "'short'"
  description: "Сокращённые подписи вроде `'Mon'`, полные названия вроде `'Monday'` либо компактные двухбуквенные и однобуквенные заголовки вроде `'Mo'`."
- name: firstDay
  type: DayOfWeek
  description: Английское название начального дня недели или номер по ISO от 1 (понедельник) до 7 (воскресенье).
- name: locale
  type: Locale
  description: Тег локали BCP 47, переопределяющий настроенное значение по умолчанию.
```

**Возвращает**

```returns
type: string[]
description: Семь подписей дней недели, начиная с `firstDay`, настроенного `weekStart` или первого дня недели локали.
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', undefined, 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

weekdayNames('narrow', undefined, 'en-US');
// ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

weekdayNames('narrow', undefined, 'pt-BR');
// ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInGrid = date('2026-11-18', { locale: 'en-US' }).range('week').every('day');
daysInGrid[0].format({ weekday: 'short' }); // 'Sun'
```
:::
