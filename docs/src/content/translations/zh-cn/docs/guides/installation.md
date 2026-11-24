---
source: "84e8bf9a4705"
title: 安装
lede: 一条命令即可安装 Native Dates，并按需为 Safari 和旧版 Node 启用 polyfill。
---

Native Dates 是一个零运行时依赖的 ES 模块包，内置完整的 TypeScript 类型定义。

## 安装

通过 npm 安装，如果你使用 AI 编程 Agent，也可以运行引导配置命令：

```bash label="npm"
npm i native-dates
```

```bash label="附带技能"
npx @native-dates/setup@latest
```

随后在应用中从 `native-dates` 导入：

```js title="app.js"
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
```

## 兼容 Safari 与旧版 Node

Native Dates 直接基于平台内置的 `Temporal` 和 `Intl` API 运行。最新版本的 Chrome、Edge、Firefox、Node 26+、Deno 和 Bun 均可开箱即用，无需额外依赖。

如需兼容 Safari、旧版浏览器或 Node 22–25，请一并安装 polyfill 与 `temporal-polyfill`：

```bash
npm i @native-dates/polyfill temporal-polyfill
```

在入口文件顶部、任何日期代码执行之前导入一次即可：

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[现代浏览器零开销]
原生支持 `Temporal` 与 `Intl.DurationFormat` 的运行时会直接跳过下载这两个 polyfill。
:::

:::details[旧版运行时兼容说明]
- **同步加载：** 如果某个被导入的模块在顶层 `await` 完成前就会执行日期逻辑，请改为导入 `@native-dates/polyfill/sync`。
- **在 Node 22–23 中格式化时长：** `@native-dates/polyfill` 内置了零依赖的 `Intl.DurationFormat` 回退实现，让 [`Duration.format()`](/api/duration/#format) 与 `Duration.text` 在 Node 22–23 上同样可用（现代浏览器与 Node 24+ 已原生内置，不会下载该回退代码）。
:::

接下来请阅读[自定义](/guides/customization/)，了解如何设置全局默认值与按需启用插件。
