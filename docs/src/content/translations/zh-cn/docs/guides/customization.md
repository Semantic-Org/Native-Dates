---
source: "97915c43145b"
title: 自定义
lede: 设置应用级默认值，并通过自定义格式或可选插件扩展 Native Dates。
---

默认情况下，Native Dates 跟随运行时的本地时区与语言环境。当应用需要固定默认配置、复用命名格式，或启用更多解析与时区功能时，可使用 [`configure()`](/api/configure/) 和可选插件。

## 应用级默认值

在应用启动时调用 [`configure()`](/api/configure/)，即可设置全局默认时区、语言环境或每周起始日。未传入的键会保留当前值，传入 `null` 则恢复为运行时默认设置：

```js title="main.js"
import { configure, date, now } from 'native-dates';

configure({
  zone: 'America/New_York',
  locale: 'en-US',
  weekStart: 'monday',
});

now().zone; // 'America/New_York'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
```

单次调用仍可传入各自的时区、[`locale()`](/api/date-time/#locale) 或每周起始日，以覆盖全局默认值。

:::warning[服务端只在启动时配置一次]
全局默认值在整个 JavaScript 进程内共享。在多用户服务端中，请直接把每个请求的时区和语言环境附加到具体值上，不要在每个请求里反复修改 `configure()`。
:::

## 命名格式

在 `formats` 下注册命名格式后，即可把格式名称直接传给 [`format()`](/guides/formatting/)。每条配置都可以是占位符模板，也可以是 `Intl` 选项对象：

```js title="main.js"
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
const placed = datetime('2026-11-06T09:05', 'Europe/Berlin');
placed.format('receipt'); // 'Friday, November 6'
```

命名格式适用于日期、时钟时间、部分日期和范围；时长仅支持内置风格。自定义名称的优先级高于内置预设，因此注册 `'short'` 会在整个应用中覆盖默认 `'short'` 预设。

## 添加插件

城市查询、宽松解析以及旧版 `Date` 属性访问器等可选功能位于 [`@native-dates/plugins`](/plugins/)：

```bash
npm i @native-dates/plugins
```

在应用入口导入对应子路径一次即可启用：

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

插件加载后还可向 [`configure()`](/api/configure/) 注册专属选项。例如，`zones` 插件新增了用于自定义名称的 `zoneAliases`，`loose` 插件新增了控制数字日期顺序的 `dayFirst`：

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, date, now } from 'native-dates';

configure({
  zoneAliases: { hq: 'Europe/Berlin' },
  dayFirst: true,
});

now('hq').zone; // 'Europe/Berlin'
date('07.09.2026', { loose: true }).toString(); // '2026-09-07'
```

查看[插件概览](/plugins/)了解各子路径的包体积，或阅读[编写插件](/guides/writing-a-plugin/)封装自己的插件。

## 自定义星期名称与序数

月份和星期名称默认取自运行时的 `Intl` 数据。如果界面设计需要特定的简称或日期序数，可通过 `weekdayNames` 和 `ordinals` 进行覆盖：

```js title="main.js"
import { configure, date } from 'native-dates';

configure({
  weekdayNames: {
    en: { short: { tue: 'Tues', thu: 'Thurs' } },
  },
  ordinals: {
    fr: (day) => (day === 1 ? '1er' : day),
  },
});

date('2026-11-03').format('ddd', 'en-US'); // 'Tues'
date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
```

将任一键设为 `null` 即可恢复运行时或内置默认规则。接下来可阅读[本地化](/guides/localization/)，处理多用户语言环境、周边界与不同历法。
