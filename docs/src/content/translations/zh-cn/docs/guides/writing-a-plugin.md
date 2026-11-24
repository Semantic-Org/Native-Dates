---
source: "46b27cf4cf7e"
title: 编写插件
lede: 通过按需引入的原型方法与 TypeScript 模块扩展来定制 Native Dates。
---

插件在导入时自动激活。

你可以参照 [`@native-dates/plugins`](/plugins/) 中 [`zones`](/plugins/zones/) 和 [`legacy-date`](/plugins/legacy-date/) 的实现方式，发布可复用的插件包，或在自己的应用中封装领域辅助方法。

## 挂载原型方法

导入需要扩展的类，将自定义方法挂载到它的 `prototype` 上即可。

每个实例在构造时都会被冻结。插件方法必须保持纯函数特性，返回新实例或计算结果，而不要修改 `this`。

```js
import { CalendarDate, date } from 'native-dates';

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

date('2026-11-13').nextBusinessDay().toString(); // '2026-11-16'
```

在方法内部可以读取实例的公开属性或调用 [`this.toTemporal()`](/api/calendar-date/#totemporal)，并通过 [`this.plus()`](/api/calendar-date/#plus) 等内置方法构建返回值。

如果要扩展 [`format()`](/api/calendar-date/#format) 这类已有方法，应先保存原方法引用，再把插件不处理的输入交还给原方法：

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

## 跨构建包进行类型检查

编写插件辅助函数时，不要依赖 `value.constructor.name` 判断类型。在 Monorepo、微前端或 iframe 场景中，内存中可能同时加载了同一依赖包的多份副本。

每个核心类都带有全局 Symbol 标记。内置类型守卫、[`kindOf()`](/api/kind-of/) 以及 [`IS_DATE_TIME`](/api/kind-of/#cross-realm-instanceof-and-brands) 等标记 Symbol 均可跨运行域和重复打包实例准确识别类型。

```js
import { date, IS_CALENDAR_DATE, IS_DATE_TIME, kindOf, now } from 'native-dates';

export function isDateOrMoment(value) {
  return Boolean(value?.[IS_CALENDAR_DATE] || value?.[IS_DATE_TIME]);
}

isDateOrMoment(date('2026-11-16')); // true
kindOf(now()); // 'datetime'
```

## 在 package.json 中声明 sideEffects

调用方通过裸导入激活插件。请在 `"sideEffects"` 中列出入口文件，并将 `"native-dates"` 放进 `peerDependencies`，让打包工具保留该导入并与宿主应用共享同一份类定义：

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

:::warning[切勿将副作用插件的 sideEffects 设为 false]
如果将 `"sideEffects"` 设为 `false`，即使单元测试在 Node 中全部通过，打包工具在生产构建时仍会把裸导入的插件整条移除。
:::

## 扩展 TypeScript 类型定义

在类型声明文件中声明 `module 'native-dates'`，即可将新的方法签名或配置项合并到已有类与配置类型上：

```ts title="index.d.ts"
import 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
}
```

导入该插件后，TypeScript 就会在每个调用处把你的自定义方法与内置方法一并提示出来。
