---
source: "a3a6297a2309"
title: zones
lede: 在任何接受时区的位置解析城市名称、常见缩写、随区域变化的时区代码和自定义别名。
---

## 解析城市名称与时区缩写

核心库支持完整的 IANA 时区标识、固定 UTC 偏移量以及 `'UTC'`。导入该插件后，整个库中所有接受时区的参数都可以直接传入城市名称、常见缩写和自定义别名。

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'Beijing').zone; // 'Asia/Shanghai'
today('JST').toString(); // Asia/Tokyo 时区的当前日期
```

无论输入写法如何，结果实例上的时区都会规范化为对应的标准 IANA 时区标识。比较时区或序列化值时，结果始终保持一致。

## 城市名称

运行时时区数据库中的任意城市名称都能直接识别，不区分大小写、重音符号、空格或下划线。在 IANA 数据库中归属其他城市名下的主要城市同样开箱即用，并支持当地文字拼写。

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('Mumbai').zone; // 'Asia/Kolkata'
moment.in('Rio de Janeiro').zone; // 'America/Sao_Paulo'
moment.in('東京').zone; // 'Asia/Tokyo'
moment.in('Москва').zone; // 'Europe/Moscow'
```

内置城市别名覆盖纽约（NYC）、旧金山（San Francisco）、北京（Beijing）、孟买（Mumbai）、慕尼黑（Munich）、大阪（Osaka）等主要枢纽城市。遇到无法识别的名称时，仍会抛出 [`unknownZone`](/api/errors/#units-zones-and-formats) 错误，而不会静默回退到本地系统时钟。

## 随区域设置变化的缩写

部分时区缩写在不同的国家和地区代表不同时区。遇到这类同名缩写时，插件会先根据当前区域设置的地区信息进行解析，在其他地区则回退到默认含义。

```js
const call = datetime('2026-11-16T09:30Z');

call.locale('en-US').in('CST').zone; // 'America/Chicago'
call.locale('zh-CN').in('CST').zone; // 'Asia/Shanghai'
call.locale('he-IL').in('IST').zone; // 'Asia/Jerusalem'
```

当前区域设置的来源依次为值本身携带的区域标签、`{ locale }` 选项、[`configure()`](/api/configure/) 或运行时默认区域设置。

| 名称 | 默认与地区解析规则 |
|---|---|
| `CST` | 默认为 `'America/Chicago'`；在 `zh` 与 `zh-CN` 下为 `'Asia/Shanghai'`；在 `zh-TW` 下为 `'Asia/Taipei'`；在 `es-CU` 下为 `'America/Havana'`。 |
| `IST` | 默认为 `'Asia/Kolkata'`；在 `en-IE` 下为 `'Europe/Dublin'`；在 `he` 下为 `'Asia/Jerusalem'`。 |
| `PST` | 默认为 `'America/Los_Angeles'`；在 `fil` 与 `en-PH` 下为 `'Asia/Manila'`。 |
| `BST` | 默认为 `'Europe/London'`；在 `bn` 下为 `'Asia/Dhaka'`。 |
| `AST` | 默认为 `'America/Halifax'`；在 `ar-SA` 下为 `'Asia/Riyadh'`。 |
| `ACT` | 默认为 `'Australia/Adelaide'`；在 `pt-BR` 下为 `'America/Rio_Branco'`。 |
| `AMT` | 默认为 `'America/Manaus'`；在 `hy` 下为 `'Asia/Yerevan'`。 |
| `San Juan` | 默认为 `'America/Argentina/San_Juan'`；在 `es-PR` 下为 `'America/Puerto_Rico'`。 |

## 常见缩写

各类缩写与地区名称均映射到当地遵循夏令时规则的主要 IANA 时区。

| 缩写 | 标准时区 | 地区 |
|---|---|---|
| `PT`, `PST`, `PDT`, `Pacific` | `'America/Los_Angeles'` | 北美太平洋时间（`PST` 随区域设置变化）。 |
| `MT`, `MST`, `MDT`, `Mountain` | `'America/Denver'` | 北美山地时间。 |
| `CT`, `CST`, `CDT`, `Central` | `'America/Chicago'` | 北美中部时间（`CST` 随区域设置变化）。 |
| `ET`, `EST`, `EDT`, `Eastern` | `'America/New_York'` | 北美东部时间。 |
| `HNE`, `HAE` | `'America/Toronto'` | 加拿大法语区东部时间。 |
| `AKT`, `AKST`, `AKDT`, `Alaska` | `'America/Anchorage'` | 阿拉斯加时间。 |
| `HT`, `HST`, `Hawaii` | `'Pacific/Honolulu'` | 夏威夷时间。 |
| `AT`, `AST` | `'America/Halifax'` | 大西洋时间（`AST` 随区域设置变化）。 |
| `BRT`, `FNT` | `'America/Sao_Paulo'`, `'America/Noronha'` | 巴西利亚时间与费尔南多·迪诺罗尼亚时间。 |
| `ART`, `COT`, `CLT` | `'America/Argentina/Buenos_Aires'`, `'America/Bogota'`, `'America/Santiago'` | 阿根廷、哥伦比亚与智利时间。 |
| `GMT`, `Z` | `'UTC'` | 协调世界时。 |
| `UK`, `WET`, `BST` | `'Europe/London'` | 英国与西欧时间（`BST` 随区域设置变化）。 |
| `CET`, `CEST`, `ECT` | `'Europe/Paris'` | 中欧时间。 |
| `EET` | `'Europe/Helsinki'` | 东欧时间。 |
| `MSK`, `мск` | `'Europe/Moscow'` | 莫斯科标准时间。 |
| `WAT`, `EAT`, `SAST` | `'Africa/Lagos'`, `'Africa/Nairobi'`, `'Africa/Johannesburg'` | 西非、东非与南非时间。 |
| `GST`, `IRST`, `PKT` | `'Asia/Dubai'`, `'Asia/Tehran'`, `'Asia/Karachi'` | 海湾、伊朗与巴基斯坦时间。 |
| `IST`, `INST` | `'Asia/Kolkata'` | 印度标准时间（`IST` 随区域设置变化）。 |
| `ICT`, `WIB`, `PHT` | `'Asia/Bangkok'`, `'Asia/Jakarta'`, `'Asia/Manila'` | 中南半岛、印度尼西亚西部与菲律宾时间。 |
| `JST`, `KST` | `'Asia/Tokyo'`, `'Asia/Seoul'` | 日本与韩国标准时间。 |
| `SGT`, `HKT` | `'Asia/Singapore'`, `'Asia/Hong_Kong'` | 新加坡与香港时间。 |
| `AET`, `AEST`, `AEDT` | `'Australia/Sydney'` | 澳大利亚东部时间。 |
| `ACT`, `AWT` | `'Australia/Adelaide'`, `'Australia/Perth'` | 澳大利亚中部与西部时间（`ACT` 随区域设置变化）。 |
| `NZT`, `NZST`, `NZDT` | `'Pacific/Auckland'` | 新西兰时间。 |

:::note[缩写遵循夏令时规则]
在原始 IANA 数据中，单独的 EST 是全年固定的 `-05:00` 偏移量，不会在 3 月进入夏令时拨快一小时。该插件将太平洋和东部时间缩写分别映射到 `'America/Los_Angeles'` 和 `'America/New_York'`，从而保证夏令时计算准确无误。若需全年固定偏移量，请直接传入数字偏移量（如 `'-08:00'`）。
:::

## 自定义别名

应用启动时，可以通过 [`configure()`](/api/configure/) 一次性注册办公室、团队简称，或固定覆盖特定缩写。自定义别名的优先级高于按区域设置的解析规则。

:::entry
### `configure()` :kind[function]

```js signature
configure({ zoneAliases }): Settings
```

在全局配置表中添加或移除自定义时区名称。别名键名匹配不区分大小写与重音符号，目标值可以是完整 IANA 时区标识、城市名称或时区缩写。将某个键设为 `null` 可删除单条别名，传入 `zoneAliases: null` 则清空全部自定义别名。

**参数**

```params
- name: zoneAliases
  type: Record<string, Zone | null> | null
  description: "自定义名称到有效时区或 `null` 的映射表；传入 `null` 可清空全部自定义别名。"
```

**返回值**

```returns
type: Settings
description: 当前生效配置的快照，其中别名目标均已规范化为标准时区标识。
```

```js
import { configure } from 'native-dates';

configure({
  zoneAliases: {
    hq: 'Berlin',
    west: 'PT',
    ist: 'Asia/Jerusalem',
  },
});

datetime('2026-11-16T09:30', 'west').in('hq').zone; // 'Europe/Berlin'
datetime('2026-11-16T09:30Z', 'IST').zone; // 'Asia/Jerusalem'

configure({ zoneAliases: null });
```
:::

该插件还导出了可变的 `timezones` 映射表，便于在启动阶段直接查看或固定基础缩写。设置 `timezones.IST = 'Asia/Jerusalem'` 等条目会在所有区域设置下覆盖按区域解析的规则：

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
