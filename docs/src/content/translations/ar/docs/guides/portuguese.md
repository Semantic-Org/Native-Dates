---
source: 66dc60a9a9b2
title: البرتغالية
lede: نسّق التواريخ البرتغالية وحلّلها عبر البرازيل والإعدادات المحلية الأوروبية والأفريقية.
---

مرّر الوسم `'pt-BR'` أو `'pt-PT'` لتنسيق التواريخ بالبرتغالية (انظر [التوطين](/guides/localization/)). تشترك البرازيل والبرتغال في التواريخ الرقمية بترتيب اليوم أولًا وأسماء الأشهر بأحرف صغيرة، وتختلفان في القالب المتوسط والأعداد الترتيبية لليوم الأول من الشهر.

## تحليل تواريخ يوم/شهر/سنة

لا تعكس سلاسل ISO بترتيب السنة أولًا موضعَي الشهر واليوم أبدًا. ومع [الإضافة المرنة](/plugins/loose/)، تقرأ الإعدادات المحلية البرتغالية التواريخ المفصولة بشرطات مائلة أو نقاط والتواريخ المكتوبة بالكلمات بترتيب اليوم أولًا تلقائيًا:

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

أما التواريخ الجزئية، فتُحلّل أزواج اليوم والشهر، والشهر والسنة الرقمية في النواة دون إضافات، ويطابق الوضع المرن أسماء الأشهر البرتغالية:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## القوالب الجاهزة وحروف الجر والأعداد الترتيبية

تُخرج القوالب الجاهزة المدمجة أسماء الأشهر بأحرف صغيرة مع حروف الجر الطبيعية. يكتب القالب المتوسط اختصار اسم الشهر في البرازيل، بينما يطبع أرقامًا مفصولة بشرطات مائلة في البرتغال:

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

ضع الكلمات الحرفية مثل `'[de]'` و`'[às]'` بين أقواس مربعة داخل أنماط الرموز المخصّصة؛ فتركها بلا أقواس يرمي خطأ بدل تفسير أحرفها بوصفها رموز تنسيق:

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

تبقى اختصارات الأشهر وأيام الأسبوع البرازيلية بأحرف صغيرة مع نقطة ختامية. ويستخدم الرمز `dd` حرفًا واحدًا لأن «segunda» و«sexta» تشتركان في الحرفين الأولَين.

تكتب البرازيل أيضًا اليوم الأول من الشهر بصيغة «1º» مثل «1º de maio»، بينما تستخدم البرتغال أرقامًا عادية. خصّص [`ordinals`](/api/configure/) وتعديلات أيام الأسبوع للوسم `'pt-BR'` حتى تحتفظ البرتغال بإعداداتها الافتراضية:

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

## بداية الأسبوع

تعدّ أسماء أيام الأسبوع من «segunda-feira» إلى «sexta-feira» بدءًا من الأحد، بينما يتبع `dayOfWeek` ترقيم ISO من 1 يوم الاثنين إلى 7 يوم الأحد.

تتبع حدود الأسبوع خاصية `weekStart` لكل إقليم، فيبدأ الأسبوع يوم الأحد في البرازيل والبرتغال ويوم الاثنين في أنغولا وموزمبيق والرأس الأخضر:

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

مرّر `'monday'` عندما تجمع تقارير الأعمال الأسبوع من الاثنين إلى الأحد. وتعدّ أرقام `weekOfYear` وفق ISO دائمًا على أساس أسابيع تبدأ بالاثنين:

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## المناطق الزمنية والتواريخ النسبية

تمتد البرازيل عبر أربع مناطق زمنية وقد أنهت العمل بالتوقيت الصيفي عام 2019. وتبقى `'America/Sao_Paulo'` على <bdi>UTC-3</bdi> طوال العام مع الاحتفاظ بإزاحات الصيف التاريخية:

| المنطقة في البرازيل | معرّف IANA الرئيسي | المناطق الإقليمية والأسماء البديلة |
|---|---|---|
| فرناندو دي نورونيا | `America/Noronha` | <bdi>UTC-2</bdi>. يُحلّ الاسم `'Noronha'` والاختصار `'FNT'` مباشرة. |
| توقيت برازيليا | `America/Sao_Paulo` | <bdi>UTC-3</bdi>، مشتركة مع باهيا وريسيفي وفورتاليزا وبيلين؛ يُحلّ الاختصار `'BRT'` وأسماء المدن `'Brasília'` و`'Rio de Janeiro'` و`'Belo Horizonte'` و`'Salvador'` مباشرة. |
| أمازوناس وماتو غروسو | `America/Manaus` | <bdi>UTC-4</bdi>، مشتركة مع كويابا وكامبو غراندي وبورتو فيليو؛ يُحلّ الاختصار `'AMT'` مباشرة. |
| أكري | `America/Rio_Branco` | <bdi>UTC-5</bdi>، مشتركة مع إيرونيبي؛ يُحلّ الاختصار `'ACT'` تلقائيًا مع `'pt-BR'`. |

مع [إضافة المناطق الزمنية](/plugins/zones/)، تُحلّ أسماء المدن البرازيلية الكبرى (بما فيها الأسماء البرتغالية المضمّنة مثل `'Brasília'` و`'São Paulo'`) والاختصارات الإقليمية تلقائيًا، بما في ذلك اختصار BRT داخل السلاسل النصية في الوضع المرن:

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

تُرجع التواريخ التقويمية تعبيرات الأيام النسبية الطبيعية حتى «anteontem» ليومين مضيا و«depois de amanhã» ليومين قادمين. أما [`DateTime`](/api/date-time/) فتعدّ الساعات المنقضية وتصوغ المدد المستقبلية بصياغة مختلفة بين البرازيل والبرتغال.

ولأن منتصف الليل بتوقيت UTC يوافق <bdi>21:00</bdi> بتوقيت برازيليا، مرّر [`today('America/Sao_Paulo')`](/api/date-fn/#today) على خوادم UTC بدلًا من استدعاء [`fromNow()`](/api/calendar-date/#fromnow):

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
