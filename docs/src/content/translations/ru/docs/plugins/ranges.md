---
source: c784c44bf2d7
title: ranges
lede: Вычитайте пересекающиеся участки и объединяйте смежные диапазоны для всех типов диапазонов.
---

## Операции над множествами диапазонов

Базовые [диапазоны](/api/ranges/) поддерживают проверку вхождения, пересечений и нахождение общей части. Импорт этого плагина добавляет методы `subtract()` и `union()` в `DateRange`, `DateTimeRange` и `TimeRange`, а также экспортирует функцию `mergeRanges()` для слияния коллекций диапазонов.

```js title="ranges.js"
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

const trip = dateRange('2026-11-01', '2026-11-10');
trip.subtract('2026-11-04/2026-11-06').map(String);
// ['2026-11-01/2026-11-03', '2026-11-07/2026-11-10']

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

mergeRanges([
  timeRange('22:00', '02:00'),
  timeRange('01:00', '06:00'),
  timeRange('10:00', '12:00'),
]).map(String);
// ['10:00:00/12:00:00', '22:00:00/06:00:00']
```

Каждый класс диапазонов сохраняет собственное правило границ. Диапазоны календарных дат включают обе границы, а диапазоны моментов времени и времени суток исключают конечную точку.

## Методы экземпляра

:::entry
### `subtract()` :kind[method]

```js signature
range.subtract(other): Range[]
```

Удаляет участок, покрытый `other`, из этого диапазона и возвращает ноль, один или два оставшихся диапазона того же вида. Возвращаемые диапазоны сохраняют локаль и часовой пояс исходного диапазона.

Вычитание непересекающегося или пустого диапазона возвращает исходный диапазон в массиве из одного элемента. Вызов `subtract()` на пустом диапазоне моментов времени или времени суток возвращает пустой массив.

**Параметры**

```params
- name: other
  type: Range | string
  required: true
  description: Экземпляр диапазона или строка интервала того же вида для вычитания.
```

**Возвращаемое значение**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Упорядоченный массив оставшихся диапазонов того же вида.
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, datetimeRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-10').subtract('2026-11-01/2026-11-03').map(String);
// ['2026-11-04/2026-11-10']

const day = datetimeRange('2026-11-02T09:00', '2026-11-02T17:00', 'America/New_York');
day.subtract('2026-11-02T12:00/2026-11-02T13:00').map((part) => `${part.start.hour}-${part.end.hour}`);
// ['9-12', '13-17']

timeRange('22:00', '06:00').subtract('23:00 - 02:00').map(String);
// ['22:00:00/23:00:00', '02:00:00/06:00:00']
```
:::

:::entry
### `union()` :kind[method]

```js signature
range.union(other): Range | null
```

Объединяет этот диапазон с пересекающимся или непосредственно смежным диапазоном того же вида и возвращает `null`, если между ними есть разрыв. Возвращаемые диапазоны сохраняют локаль и часовой пояс исходного диапазона.

Два `DateRange` считаются смежными, если второй начинается на следующий день после окончания первого. Два `DateTimeRange` или `TimeRange` считаются смежными, если один заканчивается ровно в начале другого, а пустые диапазоны не изменяют результат.

**Параметры**

```params
- name: other
  type: Range | string
  required: true
  description: Экземпляр диапазона или строка интервала того же вида для объединения.
```

**Возвращаемое значение**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "Объединённый диапазон того же вида или `null`, если между диапазонами есть разрыв."
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

dateRange('2026-11-01', '2026-11-05').union('2026-11-07/2026-11-10');
// null

timeRange('22:00', '06:00').union('06:00 - 08:00')?.toString();
// '22:00:00/08:00:00'
```
:::

## Объединение коллекций

:::entry
### `mergeRanges()` :kind[function]

```js signature
mergeRanges(ranges): Range[]
```

Сортирует итерируемую коллекцию диапазонов одного вида и объединяет все пересекающиеся или смежные участки в минимальный набор непересекающихся диапазонов. Пустые диапазоны моментов времени и времени суток из результата исключаются.

Передача диапазонов разных видов выбрасывает `TypeError` с кодом `conflictingRanges`, а передача элементов, не относящихся к диапазонам, выбрасывает `TypeError` с кодом `invalidRange`.

**Параметры**

```params
- name: ranges
  type: Iterable<DateRange> | Iterable<DateTimeRange> | Iterable<TimeRange>
  required: true
  description: Массив, `Set` или другой итерируемый объект с диапазонами одного вида.
```

**Возвращаемое значение**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: Минимальный отсортированный массив непересекающихся диапазонов того же вида.
```

```js
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, datetimeRange } from 'native-dates';

mergeRanges([
  dateRange('2026-11-12', '2026-11-15'),
  dateRange('2026-11-01', '2026-11-05'),
  dateRange('2026-11-06', '2026-11-08'),
]).map(String);
// ['2026-11-01/2026-11-08', '2026-11-12/2026-11-15']

mergeRanges([
  datetimeRange('2026-11-02T11:00', '2026-11-02T12:00', 'UTC'),
  datetimeRange('2026-11-02T09:00', '2026-11-02T11:00', 'UTC'),
]).map((part) => part.duration.hours);
// [3]
```
:::

## Ночные диапазоны времени суток

Ночные `TimeRange` корректно переходят через полночь в `subtract()`, `union()` и `mergeRanges()`. Смежные участки, стыкующиеся в полночь, снова собираются в один ночной диапазон.

```js
import '@native-dates/plugins/ranges';
import { timeRange } from 'native-dates';

timeRange('22:00', '06:00').subtract('01:00 - 03:00').map(String);
// ['22:00:00/01:00:00', '03:00:00/06:00:00']

timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString();
// '22:00:00/06:00:00'
```

:::note[Покрытие всех 24 часов]
`TimeRange` с совпадающими началом и концом считается пустым, поэтому один `TimeRange` не может охватить все 24 часа суток. Вызов `union()` или `mergeRanges()` на диапазонах времени суток, покрывающих все 24 часа, выбрасывает `RangeError` с кодом `unsupportedUnion`.
:::
