---
source: "7b49470321d3"
title: 本地化
lede: 按运行场景灵活选择浏览器默认语言、全局应用配置、值级语言环境或单次调用覆盖。
---

Native Dates 直接基于 JavaScript 引擎内置的 `Intl` 数据进行格式化，无需下载额外语言包即可支持全球各类语言、文字系统、复数规则与历法。

在哪一层设置语言环境取决于你的运行方式，请按应用架构选择对应的作用域：

- **运行时默认**：浏览器应用直接跟随用户的系统设置
- **应用级 [`configure()`](/api/configure/)**：客户端应用拥有独立语言切换器或固定语言环境
- **值级 [`locale()`](/api/date-time/#locale)**：服务端按请求格式化，或需要让一条调用链携带专属语言
- **单次 [`format()`](/api/date-time/#format)**：仅某一处展示文案需要切换历法或地区变体

## 浏览器端零配置

在未配置也未显式传入语言环境时，所有 `.text` 属性、`format()` 调用、范围、时长及名称辅助函数都会自动采用运行时的当前语言环境。

跟随用户系统语言的单用户浏览器应用无需任何配置：

```js
import { dateRange, hours, today } from 'native-dates';

today().text;
dateRange('2026-09-01', '2026-09-07').format('medium');
hours(2).format('long');
```

## 客户端应用全局默认设置

当应用自带语言选择器或面向固定语言环境时，在启动时调用一次 [`configure()`](/api/configure/) 即可；用户切换语言时再次更新。

随后所有值、范围、时长、部分日期和名称辅助函数都会按该语言环境格式化：

```js title="main.js"
import { configure, date, days, monthNames, yearMonth } from 'native-dates';

configure({ locale: 'es-ES' });

date('2026-05-15').format('long'); // '15 de mayo de 2026'
yearMonth('2026-05').format('long'); // 'mayo de 2026'
days(2).text; // '2 días'
monthNames('short').slice(0, 3); // ['ene', 'feb', 'mar']

configure({ locale: null });
```

传入 `locale: null` 可恢复为运行时的默认语言环境。

## 在值上携带语言环境

对任意值调用 [`locale()`](/api/date-time/#locale) 会返回一个采用该语言环境的副本，也可以在调用工厂函数时传入 `{ locale }`。如果想写得更简短，[`lang()`](/api/date-time/#lang) 可作为别名使用。

从该值派生出的一切结果都会继承同一语言环境，包括加减运算、时区切换、提取日期或时钟时间、构建范围以及计算时长：

```js
import { date, datetime } from 'native-dates';

const arrival = datetime('2026-05-15T14:30:00Z', 'Europe/Paris').locale('fr-FR');

arrival.text; // '15 mai 2026, 16:30 UTC+2'
arrival.plus(3, 'days').date.format('long'); // '18 mai 2026'

const stay = date('2026-09-01', { locale: 'de-DE' }).to('2026-09-07');
stay.format('medium'); // '01.–07.09.2026'
```

在多用户服务端中，请在读取数据时把每个请求的语言环境附加到具体值上，而不要修改整个进程的全局设置：

```js title="orders.js"
import { datetime } from 'native-dates';

function formatOrder(order, user) {
  const placed = datetime(order.placedAt, user.zone).locale(user.locale);
  return {
    placed: placed.format('long'),
    shipBy: placed.plus(2, 'days').date.format('medium'),
  };
}

formatOrder({ placedAt: '2026-05-15T14:30:00Z' }, { zone: 'Asia/Tokyo', locale: 'ja-JP' });
```

:::warning[不要在服务端按请求调用 configure]
全局配置会改动整个 JavaScript 进程共享的状态。在多用户服务端中，另一个请求可能跨越异步边界覆盖前一个请求的 `configure()` 设置。请改用值级 `locale()`。
:::

不带参数调用 `locale()` 会返回当前绑定的语言标签；未设置时返回 `undefined`。传入空值则会清除绑定，因此即便数据库列为空，链式调用 `locale(user.locale)` 依然安全。

原始语言字符串和 HTTP `Accept-Language` 请求头无需预处理即可直接传入。带下划线的标签（如 `'en_US'`）会自动规范化，请求头中的多个标签会按权重排序并丢弃权重为 0 的条目。无效的语言字符串会抛出 [`unknownLocale`](/api/errors/#units-zones-and-formats) 错误：

```js
datetime('2026-05-15T14:30:00Z').locale('en_US').locale(); // 'en-US'
datetime('2026-05-15T14:30:00Z').locale('fr-CH;q=0.8, de;q=0.9, es;q=0').locale(); // ['de', 'fr-CH']
```

实例级语言环境只影响本地化文本、周边界和周末判定；精确比较、排序、[`equals()`](/api/date-time/#equals) 以及 [`toString()`](/api/date-time/#tostring) 的 ISO 序列化均不受其影响：

```js
import { date } from 'native-dates';

const french = date('2026-05-15').locale('fr');
const japanese = date('2026-05-15').locale('ja');

french.equals(japanese); // true
french.toString(); // '2026-05-15'
french.to(japanese).locale(); // 'fr'
```

当某个方法组合两个带有不同语言环境的值时，结果会沿用方法调用方自身的语言环境。

## 单次覆盖历法与地区变体

如果只有某一处展示文本需要使用其他历法、数字系统或地区变体，直接向 `format()` 传入 BCP 47 语言标签即可，原值自身绑定的语言环境保持不变：

```js
import { date } from 'native-dates';

const reiwa = date('2019-05-01').locale('ja-JP');
reiwa.format('long'); // '2019年5月1日'
reiwa.format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'

const eid = date('2026-03-20').locale('ar-SA');
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

## 语言环境的解析优先级

格式化任何值、范围、时长或相对时间短语时，Native Dates 会按以下顺序查找，并采用最先命中的语言环境：

| 优先级 | 来源 | 适用场景 |
|---|---|---|
| 1 | `value.format(spec, locale)` | 单次输出需要切换其他历法、文字系统或地区变体。 |
| 2 | `value.locale(tag)` 或 `{ locale }` | 服务端请求、可复用的链式调用或局部多语言 UI 区块。 |
| 3 | `configure({ locale })` | 客户端应用的全局语言配置或语言切换器。 |
| 4 | 运行时 `Intl` 默认值 | 浏览器应用直接跟随用户的系统语言。 |

## 每周起始日与周末

周边界和星期表头会自动跟随当前语言环境：运行时在美国、日本、韩国和巴西将周日作为一周之始，在埃及为周六，而在欧洲大部分地区与中国则为周一。

由于 [`startOf('week')`](/api/calendar-date/#startof)、[`range('week')`](/api/calendar-date/#range) 与 [`weekdayNames()`](/api/month-names/#weekdaynames) 共用同一套每周起始日规则，日历表头始终能与周网格严丝合缝地对齐：

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('en-US').startOf('week').toString(); // '2026-11-15'
wed.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'

weekdayNames('short', undefined, 'en-US')[0]; // 'Sun'
weekdayNames('short', undefined, 'de-DE')[0]; // 'Mo'
```

传入具体的星期名称可覆盖单次调用，或在 [`configure()`](/api/configure/) 中设置 `weekStart` 以在所有语言环境下固定每周起始日。传入空值则恢复跟随语言环境；在缺少周数据的运行时中会回退到周一。

:::details[保护按固定周划分的报表]
派生出的实例会沿用原值的语言环境。每当报表或计费周期等存储数据以周为键时，请固定 `weekStart`，或检查 `day.weekStart`（1 表示周一，7 表示周日）：

```js title="reports.js"
function weekKey(day) {
  if (day.weekStart !== 1) {
    throw new Error('weekly reports are keyed by Monday weeks');
  }
  return day.startOf('week').toString();
}
```

`weekOfYear` 返回的 ISO 周数始终从周一开始计算，`dayOfWeek` 也遵循同样的以周一为起点的编号规则。
:::

周末判定同样跟随当前语言环境。[`isWeekend()`](/api/calendar-date/#calendar-predicates) 和 [`isWeekday()`](/api/calendar-date/#calendar-predicates) 在沙特阿拉伯和埃及将周五与周六视为周末，在伊朗仅将周五视为周末，在印度仅将周日视为周末，而在大多数其他地区则将周六与周日视为周末：

```js
const friday = date('2026-11-20');

friday.locale('en-US').isWeekend(); // false
friday.locale('ar-SA').isWeekend(); // true
```

## 自定义星期名称与序数

月份和星期名称均来自运行时，与用户设备上的原生显示保持一致。只有两个格式占位符没有对应的平台标准字段：两位字母星期缩写 `dd` 与日期序数 `Do`。

默认情况下，对于支持双字母缩写的文字系统，`dd` 会将短星期名截断为两个字母，其余情况则采用运行时的极短星期名；`Do` 在英语中输出序数后缀，在其他语言中则输出当地的日期标记（例如德语中的 `'6.'`）。

你可以通过 [`configure()`](/api/configure/) 中的 `weekdayNames` 和 `ordinals` 对两者进行全局覆盖。像 `'fr-CA'` 这样的地区标签会继承基础语言的配置并在其上叠加覆盖，而预设与 `Intl` 选项不会受到任何影响。示例见[自定义](/guides/customization/#custom-weekday-names-and-ordinals)。

浏览[语言示例](/examples/#localization)以及侧边栏**各语言时间处理**分组下的各语言指南，了解更多地区、文字系统与历法的边界情况。接下来可阅读[时间类型](/guides/types-of-time/)，为应用中的每个时间值选用最合适的类型。
