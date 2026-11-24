---
source: "f8fde894143d"
title: 阿拉伯语
lede: 跨阿拉伯语地区格式化日期，兼顾不同历法与东、西阿拉伯数字体系。
---

处理阿拉伯语时，建议使用 `'ar-EG'` 或 `'ar-SA'` 这类带国家码的区域标签，而不是裸标签 `'ar'`（详见[本地化](/guides/localization/)）。阿拉伯语各国在数字体系、公历月份名称和周起始日上存在显著差异。

## 东阿拉伯数字与西阿拉伯数字

阿联酋、马格里布国家以及裸标签 `'ar'` 默认输出西阿拉伯数字（`0-9`），而埃及、沙特阿拉伯、黎凡特地区和伊拉克默认输出东阿拉伯数字（`٠-٩`）。

如果希望面向所有用户统一采用同一种数字系统，在区域标签后追加 `-u-nu-latn` 或 `-u-nu-arab` 即可：

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');

invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦'
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦'
```

占位符模板始终输出 ASCII 数字，仅本地化月份和星期名称。纯数字预设会在斜杠前插入从右到左标记 `\u200F`，因此在测试断言、CSV 和 URL 中建议优先使用 `'YYYY-MM-DD'`：

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA'); // 'الاثنين، 16 نوفمبر 2026'
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦'
```

## 伊斯兰历日期与地区月份名称

现代运行时的 `'ar-SA'` 默认采用公历。传入 `'-u-ca-islamic-umalqura'` 并搭配预设格式，即可按官方乌姆古拉历（Umm al-Qura）输出伊斯兰历日期（例如伊斯兰历 1447 年闪瓦鲁月 1 日）：

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');

eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦'
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura'); // '20 مارس 2026'
```

占位符模板和部分日期始终保持公历，因为一个公历月通常横跨两个伊斯兰历月。需要先通过 [`on()`](/api/year-month/#on) 指定具体日期再格式化：

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');

march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦'
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١٢ رمضان ١٤٤٧ هـ'
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

公历月份名称和 12/24 小时制按地区分为四大派系：

| 地区 | 示例标签 | 输出特点 |
|---|---|---|
| 埃及、海湾国家、苏丹 | `ar-EG, ar-SA` | 采用埃及/海湾系月份名（如 يناير、يوليو、نوفمبر），12 小时制使用 ص / م 表示上午和下午。 |
| 黎凡特地区与伊拉克 | `ar-LB, ar-IQ` | 采用黎凡特系月份名（如 كانون الثاني、تموز、تشرين الثاني），默认 12 小时制。 |
| 摩洛哥 | `ar-MA` | 采用摩洛哥系月份名（如 ماي、يوليوز、غشت、شتنبر、نونبر、دجنبر），默认 24 小时制。 |
| 阿尔及利亚与突尼斯 | `ar-DZ, ar-TN` | 采用马格里布系月份名（如 جانفي、فيفري、جوان、جويلية、أوت），默认 12 小时制。 |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');

july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30'
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م'
```

## 周起始日与周末规则

在埃及、约旦、卡塔尔和阿尔及利亚，每周从周六开始；沙特阿拉伯和也门从周日开始；阿联酋、摩洛哥、突尼斯和黎巴嫩则从周一开始。

本地 `weekStart`、周起止边界和星期表头都会自动跟随区域标签；跨国汇总报表则可显式传入 `'monday'` 统一口径：

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15'
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16'
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س'
```

[`isWeekend()`](/api/calendar-date/#calendar-predicates) 与 [`isWeekday()`](/api/calendar-date/#calendar-predicates) 同样遵循当前区域。在沙特阿拉伯、埃及等周五、周六双休地区，周五属于周末，而周日是工作日：

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');

fri.isWeekend(); // true
sun.isWeekend(); // false
sun.isWeekday(); // true
```

## 六种复数形式与 RTL 文本

阿拉伯语拥有六种复数形式，分别对应 0、1、双数（如 *يومان* 表示“两天”）、3–10、11–99 以及整百数。[`Duration`](/api/duration/) 和 [`from()`](/api/date-time/#from) 会自动选用正确词形；对日历日期，后天还会直接输出 *بعد الغد*：

```js
import { datetime, days } from 'native-dates';

days(1).format('long', 'ar-EG'); // 'يوم'
days(2).format('long', 'ar-EG'); // 'يومان'
days(5).format('long', 'ar-EG'); // '٥ أيام'
days(15).format('long', 'ar-EG'); // '١٥ يومًا'
days(100).format('long', 'ar-EG'); // '١٠٠ يوم'

const anchor = datetime('2026-11-16T09:00', 'Asia/Riyadh');
anchor.plus(2, 'days').from(anchor, 'ar-SA'); // 'خلال يومين'
anchor.date.plus(2, 'days').from(anchor.date, 'ar-SA'); // 'بعد الغد'
```

在从右到左（RTL）段落中，浏览器可能会重排 ISO 日期或 UTC 偏移量中的正负号，因此请使用 `<bdi>` 包裹技术型时间戳：

```html
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## 解析用户输入与时区处理

加载 [loose 插件](/plugins/loose/)后，阿拉伯语区域会自动解析日-月-年斜杠日期、带方向控制符的东阿拉伯数字、*ص* / *م* 上下午时钟时间，以及标准系和黎凡特系的多词月份名：

```js
import '@native-dates/plugins/loose';
import { date, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-06'
date('١٦‏/١١‏/٢٠٢٦', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-16'
date('16 تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true, locale: 'ar-EG' })?.toString(); // '14:30:00'
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11'
```

[zones 插件](/plugins/zones/)内置支持海湾与北非主要城市以及 GST 等地区缩写。在 `'ar-SA'` 区域下，AST 会解析为利雅得时区：

```js
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:00', 'Makkah').zone; // 'Asia/Riyadh'
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
datetime('2026-11-16T09:00', { zone: 'AST', locale: 'ar-SA' }).zone; // 'Asia/Riyadh'
```

排期调度应始终使用完整 IANA 时区，而不是固定偏移量。`'Africa/Casablanca'` 会在斋月期间回调一小时，而开罗在夏令时开始当天零点会直接跳过 `00:00` 进入 `01:00`：

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00'
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
