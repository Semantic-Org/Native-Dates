---
source: a214ff99444f
title: الفرنسية
lede: نسّق التواريخ الفرنسية وحلّلها عبر أنظمة الساعة الإقليمية وبدايات الأسبوع المختلفة.
---

يعتمد الوسم العام `'fr'` أعراف فرنسا الأم. مرّر وسمًا إقليميًا مثل `'fr-CA'` (انظر [التوطين](/guides/localization/)) عندما يتوقع القراء ترتيب التاريخ وفواصل الساعة وبداية الأسبوع المعتمدة محليًا.

## التنويعات الإقليمية

تتبدّل صيغة التاريخ المختصر وفواصل الساعة وأول أيام الأسبوع بين المناطق الناطقة بالفرنسية:

| الإعداد المحلي | التنسيق المختصر | بداية الأسبوع | الفروق الإقليمية |
|---|---|---|---|
| `fr-FR`، `fr-SN`، `fr-MA` | `'01/11/2026 14:30'` | `1` — الاثنين | فواصل بشرطة مائلة، ونظام 24 ساعة، واختصار يوليو بصيغة `'juil.'`. |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — الأحد | ترتيب ISO للتاريخ في كندا، وتدوين الساعة بحرف `'h'` محاط بمسافتين، ويوليو بصيغة `'juill.'`. |
| `fr-CH` | `'01.11.26 14:30'` | `1` — الاثنين | فواصل بنقاط وسنة من رقمين في `'short'`، وأربعة أرقام مع `'L'`. |
| `fr-BE` | `'1/11/26 14:30'` | `1` — الاثنين | يوم بلا صفر بادئ وسنة من رقمين في `'short'`، وأربعة أرقام مع `'L'`. |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — السبت | بداية الأسبوع يوم السبت ونظام 12 ساعة افتراضيًا. |

مرّر الوسم الإقليمي الكامل لتطبع القوالب الجاهزة علامات الترقيم المحلية:

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');

rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

يبدأ الأسبوع في الفرنسية الكندية يوم الأحد، وتتبع [`startOf('week')`](/api/calendar-date/#startof) و[`weekdayNames()`](/api/month-names/#weekdaynames) هذه القاعدة تلقائيًا. ثبّت يوم الاثنين عندما تتطلب تقارير قواعد البيانات أسابيع ISO:

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');

mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## الطباعة الفرنسية ورموز التنسيق

ضع الأحرف الحرفية بين أقواس مربعة داخل أنماط الرموز مثل `'HH[h]mm'`. ترمي كتابة `'HHhmm'` دون أقواس الخطأ [`unknownFormat`](/api/errors/#units-zones-and-formats)، بينما يمرّ الحرف «à» ذو النبرة منفردًا دون حاجة إلى أقواس:

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');

depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM à HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

تكتب الفرنسية «1er» في اليوم الأول من الشهر وأرقامًا عادية في بقية الأيام. سجّل قاعدة [`ordinals`](/api/configure/) على `'fr'`، لترثها الوسوم الإقليمية تلقائيًا:

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'

configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

تبقى أسماء أيام الأسبوع والأشهر بأحرف صغيرة في النصوص الفرنسية. كبّر الحرف الأول فقط عندما يفتتح التاريخ عنوانًا.

تجنّب كتابة نقطة بعد `MMM`؛ فالأشهر المختصرة تتضمّن نقطتها الخاصة بالفعل، بينما لا تأخذ الأسماء القصيرة مثل «mars» و«mai» و«juin» و«août» أي نقطة:

```js
import { monthNames } from 'native-dates';

const s = date('2026-11-01').format('full', 'fr'); // 'dimanche 1 novembre 2026'
s[0].toUpperCase() + s.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## تحليل مدخلات التاريخ والوقت الفرنسية

تقرأ النواة سلاسل ISO الكندية وأوقات الساعة والدقيقة الفرنسية مثل `'14h30'` مباشرة. ومع [الإضافة المرنة](/plugins/loose/)، تقرأ الإعدادات المحلية الفرنسية التواريخ المفصولة بشرطات مائلة بترتيب اليوم أولًا، والتواريخ المفصولة بنقاط، والأعداد الترتيبية، والتواريخ المكتوبة بالكلمات تلقائيًا:

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

time('14h30').toString(); // '14:30:00'
time('14 h 30').toString(); // '14:30:00'
date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('14.07.2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-14'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
datetime('lundi 16 novembre 2026 à 14h30', {
  loose: true,
  locale: 'fr',
  zone: 'Europe/Paris',
})?.hour; // 14
```

يجب أن يطابق الاسم المختصر للشهر شهرًا واحدًا فقط؛ لذا تُحلّل «juil» إلى يوليو، بينما تُرجع «jui» القيمة `null` لأنها تفتتح كلًا من «juin» و«juillet».

تطابق التواريخ الجزئية أسماء الأشهر الفرنسية والاختصارات ذات النبرات في الوضع المرن. أما [`dayMonth()`](/api/month-day-fn/#daymonth) و[`duration()`](/api/duration-fn/) (بعبارات المدة بالإنجليزية) فتعملان في النواة دون إضافات:

```js
import { dayMonth, duration, monthDay, yearMonth } from 'native-dates';

dayMonth('14/07').toString(); // '07-14'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
yearMonth('févr. 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
duration('2h 30m').toString(); // 'PT2H30M'
```

## المناطق الزمنية

تبدّل أمريكا الشمالية التوقيت الصيفي قبل أوروبا بأسبوعين إلى ثلاثة أسابيع في الربيع وبعدها بأسبوع في الخريف، ما يقلّص الفارق بين باريس ومونتريال من ست ساعات إلى خمس.

كما يعود المغرب إلى <bdi>UTC+0</bdi> خلال شهر رمضان، لذا حوّل اللحظات الزمنية عبر [`in()`](/api/date-time/#in) بدل طرح عدد ثابت من الساعات:

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');

hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

مع [إضافة المناطق الزمنية](/plugins/zones/)، تُحلّ أسماء المدن الفرنكوفونية الكبرى (بما فيها الأسماء الفرنسية المضمّنة مثل `'Montréal'` و`'Bruxelles'` و`'Genève'`) والاختصارات الكندية مثل `'HNE'` مباشرة دون الحاجة إلى تعريف أسماء بديلة:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Bruxelles').zone; // 'Europe/Brussels'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Toronto'
```

## التواريخ النسبية والمسافات غير القابلة للكسر

تستخدم التواريخ التقويمية تعبيرات الأيام النسبية مثل «avant-hier» ليومين مضيا و«après-demain» ليومين قادمين، بينما تعدّ [`DateTime`](/api/date-time/) الوحدات بدقة حتى لا تُقرأ ساعات الليل المتأخرة على أنها أمس.

وفي تأكيدات الاختبارات، توقّع الفاصلة العليا المقوّسة في «aujourd’hui» والمسافات الضيقة أو القياسية غير القابلة للكسر داخل المدد المختصرة:

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');

ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
datetime('2026-11-09T14:00Z').from('2026-11-10T14:00Z', 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
```
