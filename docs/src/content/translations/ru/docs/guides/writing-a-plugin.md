---
source: 46b27cf4cf7e
title: Написание плагина
lede: Расширяйте Native Dates подключаемыми методами прототипа и дополняйте объявления типов TypeScript.
---

Плагины активируются в момент импорта.

Вы можете публиковать переиспользуемые пакеты или добавлять прикладные методы внутри собственного приложения по тому же принципу, что и [`zones`](/plugins/zones/) или [`legacy-date`](/plugins/legacy-date/) из [`@native-dates/plugins`](/plugins/).

## Добавление методов в прототип

Импортируйте класс, который нужно расширить, и добавьте метод в его `prototype`.

Каждый экземпляр замораживается при создании. Методы плагина должны оставаться чистыми и возвращать новое значение или вычисленный результат, не изменяя `this`.

```js
import { CalendarDate, date } from 'native-dates';

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

date('2026-11-13').nextBusinessDay().toString(); // '2026-11-16'
```

Считывайте публичные свойства экземпляра или вызывайте [`this.toTemporal()`](/api/calendar-date/#totemporal), а новые значения создавайте через существующие методы вроде [`this.plus()`](/api/calendar-date/#plus).

Когда вы расширяете уже существующий метод, например [`format()`](/api/calendar-date/#format), сначала сохраните ссылку на исходную реализацию и передавайте ей все входные данные, которые плагин не обрабатывает сам:

```js
const baseFormat = CalendarDate.prototype.format;

CalendarDate.prototype.format = function format(spec, locale) {
  if (spec === 'compact') {
    return this.toString().replaceAll('-', '');
  }
  return baseFormat.call(this, spec, locale);
};

date('2026-11-16').format('compact'); // '20261116'
date('2026-11-16').format('short', 'en-US'); // '11/16/26'
```

## Проверка типов между бандлами

Не проверяйте `value.constructor.name` во вспомогательных функциях плагина. В монорепозиториях, микрофронтендах или iframe в памяти могут одновременно оказаться две копии пакета.

Каждый класс помечен глобальным символом-брендом. Предикаты типа, [`kindOf()`](/api/kind-of/) и символы-бренды вроде [`IS_DATE_TIME`](/api/kind-of/#cross-realm-instanceof-and-brands) распознают значения даже между разными окружениями и дублирующимися бандлами.

```js
import { date, IS_CALENDAR_DATE, IS_DATE_TIME, kindOf, now } from 'native-dates';

export function isDateOrMoment(value) {
  return Boolean(value?.[IS_CALENDAR_DATE] || value?.[IS_DATE_TIME]);
}

isDateOrMoment(date('2026-11-16')); // true
kindOf(now()); // 'datetime'
```

## Поле sideEffects в package.json

Пользователи подключают плагин импортом ради побочного эффекта. Перечислите точки входа плагина в `"sideEffects"` и укажите `"native-dates"` в `peerDependencies`, чтобы сборщики не удалили импорт и использовали те же классы, что и основное приложение:

```json title="package.json"
{
  "name": "my-dates-plugin",
  "type": "module",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "default": "./index.js"
    }
  },
  "sideEffects": ["./index.js"],
  "peerDependencies": {
    "native-dates": "^1.0.0"
  }
}
```

:::warning[Не задавайте sideEffects со значением false для плагинов с побочными эффектами]
Если указать `"sideEffects": false`, сборщики вырежут импорт плагина без привязки в продакшен-бандле, даже если модульные тесты в Node проходят успешно.
:::

## Расширение типов TypeScript

Объявите `module 'native-dates'` в файле деклараций, чтобы добавить сигнатуры новых методов в существующие классы или параметры конфигурации:

```ts title="index.d.ts"
import 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
}
```

После импорта плагина TypeScript сразу начнёт подсказывать ваш метод наряду со встроенными во всех точках вызова.
