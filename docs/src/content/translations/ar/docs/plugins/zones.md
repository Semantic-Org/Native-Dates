---
source: a3a6297a2309
title: zones
lede: تحليل أسماء المدن والاختصارات الإقليمية ورموز المناطق الزمنية المرتبطة بالإعداد المحلي والأسماء البديلة المخصّصة في كل موضع يقبل منطقة زمنية.
---

## تحليل المدن والاختصارات

يقبل القلب الأساسي معرّفات IANA الكاملة وإزاحات UTC الثابتة والقيمة `'UTC'`. وعند استيراد هذه الإضافة، يقبل كل معامل منطقة زمنية في المكتبة أسماء مدن IANA بالإنجليزية والاختصارات الشائعة والأسماء البديلة المخصّصة.

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'Beijing').zone; // 'Asia/Shanghai'
today('JST').toString(); // التاريخ الحالي في Asia/Tokyo
```

تُوحَّد كل صيغة كتابة إلى معرّف IANA القياسي على الكائن الناتج، فتبقى مقارنة المناطق الزمنية وتحويل القيم إلى نص متسقَين بغض النظر عن طريقة كتابة المنطقة.

## أسماء المدن

تُحلَّل أسماء مدن IANA بالإنجليزية الموجودة في قاعدة بيانات المناطق الزمنية لبيئة التشغيل بغض النظر عن حالة الأحرف أو علامات التشكيل اللاتينية أو المسافات أو الشرطات السفلية. كما تعمل مباشرةً الأسماء البديلة المضمّنة للمدن الكبرى التي تدرجها IANA تحت اسم آخر، إضافةً إلى استثناءات مكتوبة بأحرفها المحلية مثل `'東京'` و`'Москва'` و`'北京'` و`'서울'`.

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('Mumbai').zone; // 'Asia/Kolkata'
moment.in('Rio de Janeiro').zone; // 'America/Sao_Paulo'
moment.in('東京').zone; // 'Asia/Tokyo'
moment.in('Москва').zone; // 'Europe/Moscow'
```

تغطي الأسماء البديلة المضمّنة مراكز كبرى مثل `NYC` و`San Francisco` و`Beijing` و`Mumbai` و`Munich` و`Osaka`. وتظل الأسماء غير المعروفة ترمي خطأ [`unknownZone`](/api/errors/#units-zones-and-formats) بدل الرجوع إلى ساعة النظام المحلية.

## اختصارات تتبع الإعداد المحلي

تحمل بعض الاختصارات معاني مختلفة باختلاف البلدان. وعندما يشترك أكثر من إقليم في الاسم نفسه، تفحص الإضافة إقليم الإعداد المحلي النشط أولًا ثم ترجع افتراضيًا إلى القراءة الرئيسية في غير ذلك.

```js
const call = datetime('2026-11-16T09:30Z');

call.locale('en-US').in('CST').zone; // 'America/Chicago'
call.locale('zh-CN').in('CST').zone; // 'Asia/Shanghai'
call.locale('he-IL').in('IST').zone; // 'Asia/Jerusalem'
```

يؤخذ الإعداد المحلي من القيمة نفسها، أو من خيار `{ locale }`، أو من [`configure()`](/api/configure/)، أو من الإعداد الافتراضي لبيئة التشغيل.

| الاسم | القراءة الافتراضية والإقليمية |
|---|---|
| `CST` | `'America/Chicago'` افتراضيًا؛ `'Asia/Shanghai'` في `zh` و`zh-CN`؛ `'Asia/Taipei'` في `zh-TW`؛ `'America/Havana'` في `es-CU`. |
| `IST` | `'Asia/Kolkata'` افتراضيًا؛ `'Europe/Dublin'` في `en-IE`؛ `'Asia/Jerusalem'` في `he`. |
| `PST` | `'America/Los_Angeles'` افتراضيًا؛ `'Asia/Manila'` في `fil` و`en-PH`. |
| `BST` | `'Europe/London'` افتراضيًا؛ `'Asia/Dhaka'` في `bn`. |
| `AST` | `'America/Halifax'` افتراضيًا؛ `'Asia/Riyadh'` في `ar-SA`. |
| `ACT` | `'Australia/Adelaide'` افتراضيًا؛ `'America/Rio_Branco'` في `pt-BR`. |
| `AMT` | `'America/Manaus'` افتراضيًا؛ `'Asia/Yerevan'` في `hy`. |
| `San Juan` | `'America/Argentina/San_Juan'` افتراضيًا؛ `'America/Puerto_Rico'` في `es-PR`. |

## الاختصارات الشائعة

ترتبط الاختصارات والأسماء الإقليمية بمنطقة IANA الرئيسية المراعية للتوقيت الصيفي في ذلك الإقليم.

| الاختصارات | المنطقة القياسية | الإقليم |
|---|---|---|
| `PT`، `PST`، `PDT`، `Pacific` | `'America/Los_Angeles'` | توقيت المحيط الهادئ في أمريكا الشمالية (`PST` يتبع الإعداد المحلي). |
| `MT`، `MST`، `MDT`، `Mountain` | `'America/Denver'` | التوقيت الجبلي في أمريكا الشمالية. |
| `CT`، `CST`، `CDT`، `Central` | `'America/Chicago'` | التوقيت المركزي في أمريكا الشمالية (`CST` يتبع الإعداد المحلي). |
| `ET`، `EST`، `EDT`، `Eastern` | `'America/New_York'` | التوقيت الشرقي في أمريكا الشمالية. |
| `HNE`، `HAE` | `'America/Toronto'` | التوقيت الشرقي في كندا الناطقة بالفرنسية. |
| `AKT`، `AKST`، `AKDT`، `Alaska` | `'America/Anchorage'` | توقيت ألاسكا. |
| `HT`، `HST`، `Hawaii` | `'Pacific/Honolulu'` | توقيت هاواي. |
| `AT`، `AST` | `'America/Halifax'` | التوقيت الأطلسي (`AST` يتبع الإعداد المحلي). |
| `BRT`، `FNT` | `'America/Sao_Paulo'`، `'America/Noronha'` | توقيت برازيليا وفرناندو دي نورونيا. |
| `ART`، `COT`، `CLT` | `'America/Argentina/Buenos_Aires'`، `'America/Bogota'`، `'America/Santiago'` | توقيت الأرجنتين وكولومبيا وتشيلي. |
| `GMT`، `Z` | `'UTC'` | التوقيت العالمي المنسّق. |
| `UK`، `WET`، `BST` | `'Europe/London'` | المملكة المتحدة وغرب أوروبا (`BST` يتبع الإعداد المحلي). |
| `CET`، `CEST`، `ECT` | `'Europe/Paris'` | توقيت وسط أوروبا. |
| `EET` | `'Europe/Helsinki'` | توقيت شرق أوروبا. |
| `MSK`، `мск` | `'Europe/Moscow'` | توقيت موسكو القياسي. |
| `WAT`، `EAT`، `SAST` | `'Africa/Lagos'`، `'Africa/Nairobi'`، `'Africa/Johannesburg'` | توقيت غرب وشرق وجنوب إفريقيا. |
| `GST`، `IRST`، `PKT` | `'Asia/Dubai'`، `'Asia/Tehran'`، `'Asia/Karachi'` | توقيت الخليج وإيران وباكستان. |
| `IST`، `INST` | `'Asia/Kolkata'` | التوقيت القياسي للهند (`IST` يتبع الإعداد المحلي). |
| `ICT`، `WIB`، `PHT` | `'Asia/Bangkok'`، `'Asia/Jakarta'`، `'Asia/Manila'` | توقيت الهند الصينية وغرب إندونيسيا والفلبين. |
| `JST`، `KST` | `'Asia/Tokyo'`، `'Asia/Seoul'` | التوقيت القياسي لليابان وكوريا. |
| `SGT`، `HKT` | `'Asia/Singapore'`، `'Asia/Hong_Kong'` | توقيت سنغافورة وهونغ كونغ. |
| `AET`، `AEST`، `AEDT` | `'Australia/Sydney'` | التوقيت الشرقي لأستراليا. |
| `ACT`، `AWT` | `'Australia/Adelaide'`، `'Australia/Perth'` | التوقيت المركزي والغربي لأستراليا (`ACT` يتبع الإعداد المحلي). |
| `NZT`، `NZST`، `NZDT` | `'Pacific/Auckland'` | توقيت نيوزيلندا. |

:::note[الاختصارات تراعي التوقيت الصيفي]
في بيانات IANA الخام، يمثّل الاختصار `EST` إزاحة ثابتة قدرها 5 ساعات لا تتقدّم في مارس. تربط هذه الإضافة اختصارات توقيت المحيط الهادئ والتوقيت الشرقي بـ `'America/Los_Angeles'` و`'America/New_York'` لتبقى حسابات التوقيت الصيفي دقيقة. مرّر إزاحة رقمية مثل `'-08:00'` عندما تريد إزاحة ثابتة طوال العام.
:::

## الأسماء البديلة المخصّصة

سجّل أسماءً مختصرة للمكاتب أو الفرق أو تجاوزات ثابتة للاختصارات مرة واحدة عند بدء التشغيل عبر [`configure()`](/api/configure/). تتقدّم الأسماء البديلة المخصّصة على التحليل المعتمد على الإعداد المحلي.

:::entry
### `configure()` :kind[function]

```js signature
configure({ zoneAliases }): Settings
```

تضيف أو تحذف أسماء مناطق زمنية مخصّصة في جدول الإعدادات العام. تُطابَق مفاتيح الأسماء البديلة دون حساسية لحالة الأحرف أو علامات التشكيل اللاتينية، ويمكن أن تكون القيم الهدف أسماء IANA كاملة أو مدنًا أو اختصارات. اضبط مفتاحًا على `null` لحذف اسم بديل واحد، أو مرّر `zoneAliases: null` لمسحها جميعًا.

**المعاملات**

```params
- name: zoneAliases
  type: Record<string, Zone | null> | null
  description: "خريطة تربط الأسماء المخصّصة بمناطق زمنية صالحة أو `null`، أو القيمة `null` لمسح جميع الأسماء البديلة المخصّصة."
```

**القيمة المُرجَعة**

```returns
type: Settings
description: "لقطة من الإعدادات النشطة بعد توحيد قيم الأسماء البديلة إلى معرّفات قياسية."
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

تصدّر الإضافة أيضًا خريطة البحث القابلة للتعديل `timezones` لفحص الاختصارات الأساسية أو تثبيتها مباشرةً عند بدء التشغيل. يؤدي ضبط مدخل مثل `timezones.IST = 'Asia/Jerusalem'` إلى تجاوز التحليل المعتمد على الإعداد المحلي في جميع الإعدادات المحلية:

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
