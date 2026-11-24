---
source: "e011cab2c85c"
title: configure()
lede: 读取或更新进程级的时区、区域、周起始日、自定义格式、星期与序数名称及插件默认配置。
---

## 全局默认配置

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

更新一项或多项进程级默认配置，并返回当前生效配置的快照。不传参数调用时，仅读取当前配置，不做修改。

省略的字段保持原值不变；将任意配置项设为 `null` 即可恢复为运行时或内置默认值。

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

// 重置回运行时默认时区、默认区域以及该区域的周起始日
configure({ zone: null, locale: null, weekStart: null });
```

**参数**

```params
- name: settings
  type: Settings
  description: 要更新的进程级默认配置，省略的键保持不变。
  options:
    - name: zone
      type: Zone | null
      description: 工厂函数与 `now()` 使用的默认时区。传入 `null` 恢复为运行时本地时区。
    - name: locale
      type: Locale | null
      description: 用于格式化、周边界、周末判定及插件的默认区域标签、标签列表或 `Accept-Language` 请求头。传入 `null` 或 `''` 恢复为运行时区域。
    - name: weekStart
      type: DayOfWeek | null
      description: 周边界与 `weekdayNames()` 的每周起始日，从 1（周一）到 7（周日）。未设置或传入 `null` 时遵循当前区域。
    - name: weekdayNames
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: "按语言、宽度（`narrow`、`short` 或 `long`）与英文星期名索引的自定义星期标签。地区标签会叠加在基础语言之上，传空值可恢复运行时默认名称。"
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: "以语言标签为键的自定义 `Do` 日序数格式化函数。传入 `null` 恢复内置英文序数后缀与各区域日期标记。"
    - name: formats
      type: "Record<string, string | Intl.DateTimeFormatOptions> | null"
      description: "可供 `format(name)` 复用的自定义格式，值为占位符模板或 `Intl` 选项对象。自定义名称优先于内置预设，传入 `null` 清除。"
    - name: dayFirst
      type: boolean | null
      description: "宽松模式下未传入单次 `dayFirst` 和 `locale` 时的默认数字日期顺序。未设置或传入 `null` 时遵循当前区域。"
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: "配合 `@native-dates/plugins/zones` 使用的自定义时区别名映射。将单个键或整个对象设为 `null` 可清除别名。"
```

**返回值**

```returns
type: "{ zone, locale, weekStart, dayFirst, zoneAliases, weekdayNames, ordinals, formats }"
description: 应用更新后当前生效配置的浅拷贝；未设置的键返回 `undefined`。
```

无需任何插件，`weekdayNames` 和 `ordinals` 即可直接控制占位符模板与 [`weekdayNames()`](/api/month-names/#weekdaynames) 的输出：

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

自定义命名格式可为整个应用提供统一的专属预设，适用于所有支持格式化的日期与时间类型：

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

插件在导入后会向 `configure()` 扩展专属配置项。如果在导入对应插件前就设置其配置项，会抛出 `RangeError`：

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

:::warning[服务端请在启动时统一配置]
全局配置会修改整个 JavaScript 进程共享的状态。服务端应在启动阶段一次性完成默认配置，并在请求处理函数内把各用户的时区与 [`locale()`](/api/date-time/#locale) 绑定到具体实例上。详见[本地化](/guides/localization/)。
:::

## 星期辅助函数

将星期名称转换为数字，沿用整个库统一的 ISO 星期编号。

:::entry
### `dayOfWeek()` :kind[function]

```js signature
dayOfWeek(day): number
```

将英文星期全称、三字母缩写或 ISO 编号转换为 1（周一）到 7（周日）的整数。遇到无法识别的名称或超出范围的数字时，抛出 `RangeError`。

**参数**

```params
- name: day
  type: DayOfWeek
  required: true
  description: 英文星期名称（如 `'monday'`）、不区分大小写的三字母前缀（如 `'Fri'`），或 1 到 7 的整数。
```

**返回值**

```returns
type: number
description: 从 1（周一）到 7（周日）的星期编号。
```

```js
import { dayOfWeek } from 'native-dates';

dayOfWeek('monday'); // 1
dayOfWeek('Fri'); // 5
dayOfWeek('sunday'); // 7
dayOfWeek(3); // 3
```
:::
