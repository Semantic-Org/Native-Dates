---
source: "66dc60a9a9b2"
title: 葡萄牙语
lede: 覆盖巴西、葡萄牙与葡语非洲地区，格式化并解析葡萄牙语日期。
---

传入 `'pt-BR'` 或 `'pt-PT'` 即可按葡萄牙语规则格式化日期（详见[本地化](/guides/localization/)）。巴西和葡萄牙同样采用日-月-年数字日期与小写月份名，但在 `'medium'` 预设和每月 1 日的序数写法上有所不同。

## 解析日/月/年格式日期

年-月-日顺序的 ISO 字符串绝不会混淆月和日。加载 [loose 插件](/plugins/loose/)后，葡萄牙语区域会自动按日-月-年顺序解析斜杠日期、点号日期和完整文字日期：

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true, locale: 'pt-PT' })?.toString(); // '2026-11-16'
date('16 de novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-16'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  locale: 'pt-BR',
  zone: 'America/Sao_Paulo',
})?.hour; // 14
date('29/02/2026', { loose: true, locale: 'pt-BR' }); // null
```

对于部分日期，纯数字的日-月和月-年组合无需插件即可由核心库直接解析，宽松模式还能匹配葡萄牙语月份名称：

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## 预设格式、介词与序数

内置预设会输出小写月份名和自然的介词连接。`'medium'` 预设在巴西会拼出缩写月份名，在葡萄牙则输出斜杠分隔的纯数字日期：

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

在自定义占位符模板中，`'[de]'` 和 `'[às]'` 这类字面单词需要用方括号包裹；若不加方括号，将直接抛出错误，而不会把其中零散的字母误当作占位符展开：

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

巴西葡萄牙语的缩写月份和星期均为小写并带末尾句点。由于 *segunda*（周一）和 *sexta*（周五）前两个字母相同，`dd` 使用单字母缩写。

此外，巴西将每月 1 日写作序数 *1º*（如 *1º de maio*），而葡萄牙使用普通数字。将 [`ordinals`](/api/configure/) 和星期名覆盖项限定在 `'pt-BR'` 上，即可保留葡萄牙的默认规则：

```js
import { configure, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'pt-BR'); // ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

configure({
  ordinals: { 'pt-BR': (d) => (d === 1 ? '1º' : d) },
  weekdayNames: { 'pt-BR': { short: { fri: 'Sex', sat: 'Sáb' } } },
});
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sex, 1º de maio'
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-PT'); // 'sexta, 1 de maio'
```

## 周起始日

尽管葡语星期名从 *segunda-feira*（周一）到 *sexta-feira*（周五）是从周日开始计数的，但 `dayOfWeek` 遵循 ISO 编号（周一为 1，周日为 7）。

周起止边界遵循各地区的 `weekStart`：巴西和葡萄牙从周日开始，安哥拉、莫桑比克和佛得角则从周一开始：

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

如果业务报表按周一至周日分组，显式传入 `'monday'` 即可。ISO `weekOfYear` 周序号始终以周一为起点计算：

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## 时区与相对日期

巴西横跨四个时区，并已于 2019 年取消夏令时。`'America/Sao_Paulo'` 全年保持 `UTC-3`，同时保留历史夏令时偏移记录：

| 巴西时区 | 主 IANA 时区 | 地区时区与别名 |
|---|---|---|
| 费尔南多·迪诺罗尼亚群岛 | `America/Noronha` | UTC-2。可直接解析 `'Noronha'` 和 `'FNT'`。 |
| 巴西利亚时间 | `America/Sao_Paulo` | UTC-3，覆盖巴伊亚、累西腓、福塔莱萨与贝伦；可解析 `'BRT'` 及巴西利亚、里约热内卢、贝洛奥里藏特、萨尔瓦多。 |
| 亚马孙与马托格罗索 | `America/Manaus` | UTC-4，覆盖库亚巴、大坎普与韦柳港；可解析 `'AMT'`。 |
| 阿克里 | `America/Rio_Branco` | UTC-5，覆盖埃鲁内佩；在 `'pt-BR'` 下自动解析 `'ACT'`。 |

加载 [zones 插件](/plugins/zones/)后，巴西主要城市和地区缩写开箱可用，也支持宽松字符串中的内联 `BRT`：

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:00', 'BRT').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'Brasília').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo')
  .locale('pt-BR')
  .in('ACT')
  .format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-11-16 14:30 BRT', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T17:30:00.000Z'
```

日历日期的前天返回 *anteontem*，后天返回 *depois de amanhã*。[`DateTime`](/api/date-time/) 按经过的小时数计算，且巴西与葡萄牙对未来时间跨度的措辞不同。

由于 UTC 零点对应巴西利亚时间前一日 21:00，在 UTC 服务器上请传入 [`today('America/Sao_Paulo')`](/api/date-fn/#today)，不要直接调用无参 [`fromNow()`](/api/calendar-date/#fromnow)：

```js
import { date, today } from 'native-dates';

const ref = date('2026-11-16');

date('2026-11-14').from(ref, 'pt-BR'); // 'anteontem'
date('2026-11-18').from(ref, 'pt-BR'); // 'depois de amanhã'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-BR'); // 'em 2 dias'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-PT');
// 'dentro de 2 dias'
ref.from(today('America/Sao_Paulo'), 'pt-BR');
```
