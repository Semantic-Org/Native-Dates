---
source: f1aec8a13183
title: Установка
lede: Подключите Native Dates одной командой — с опциональным полифилом для Safari и старых версий Node.
---

Native Dates — это пакет ES-модулей со встроенными типами TypeScript и без единой внешней зависимости.

## Установка

Установите пакет из npm или запустите команду настройки, если вы работаете с ИИ-агентом:

```bash label="npm"
npm i native-dates
```

```bash label="Со скиллами"
npx native-dates@latest
```

Затем импортируйте нужные функции из `native-dates`:

```js title="app.js"
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
```

## Поддержка Safari и старых версий Node

Native Dates напрямую использует встроенные API платформы `Temporal` и `Intl`. Актуальным версиям Chrome, Edge, Firefox, Node 26+, Deno и Bun ничего дополнительного не требуется.

Для Safari, более старых браузеров и Node 24–25 установите полифил вместе с `temporal-polyfill`:

```bash
npm i @native-dates/polyfill temporal-polyfill
```

Импортируйте его один раз в самом начале точки входа до любого кода, работающего с датами:

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[Нулевые накладные расходы в современных браузерах]
Среды выполнения со встроенным `Temporal` вообще не загружают `temporal-polyfill`.
:::

:::details[Примечания по совместимости со старыми средами выполнения]
- **Синхронная загрузка:** если импортируемый модуль вычисляет даты на этапе загрузки до завершения `await` верхнего уровня, импортируйте `@native-dates/polyfill/sync`.
- **Форматирование длительностей в Node:** для серверного кода, вызывающего [`Duration.format()`](/api/duration/#format), требуется Node 24+ с поддержкой `Intl.DurationFormat`. Браузерные бандлы при этом без проблем собираются и в более старых версиях Node.
:::

Далее прочитайте руководство [Настройка](/guides/customization/), чтобы задать значения по умолчанию и подключить дополнительные плагины.
