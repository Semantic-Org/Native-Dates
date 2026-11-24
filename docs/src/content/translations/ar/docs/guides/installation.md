---
source: 84e8bf9a4705
title: التثبيت
lede: أضف Native Dates بأمر واحد، مع حزمة توافق اختيارية لـ Safari وإصدارات Node الأقدم.
---

تأتي Native Dates في صورة حزمة ES module مزوّدة بأنواع TypeScript مدمجة، وبلا أي اعتماديات في بيئة التشغيل.

## التثبيت

ثبّت الحزمة من npm، أو استخدم أمر الإعداد إذا كنت تعمل مع وكيل برمجة:

```bash label="npm"
npm i native-dates
```

```bash label="مع المهارات"
npx @native-dates/setup@latest
```

بعد ذلك استورد ما تحتاجه من `native-dates` في تطبيقك:

```js title="app.js"
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
```

## دعم Safari وإصدارات Node الأقدم

تعمل Native Dates مباشرةً على واجهتي `Temporal` و`Intl` المدمجتين في بيئة التشغيل. لا تحتاج الإصدارات الحالية من Chrome وEdge وFirefox و<bdi>Node 26+</bdi> وDeno وBun إلى أي حزمة إضافية.

لدعم Safari أو المتصفحات الأقدم أو إصدارات <bdi>Node 22–25</bdi>، ثبّت حزمة التوافق (polyfill) إلى جانب `temporal-polyfill`:

```bash
npm i @native-dates/polyfill temporal-polyfill
```

استورد حزمة التوافق مرة واحدة في أعلى ملف البداية قبل تحميل أي شيفرة تتعامل مع التواريخ:

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[بلا تكلفة على المتصفحات الحديثة]
تتخطّى بيئات التشغيل الداعمة لـ `Temporal` و`Intl.DurationFormat` أصليًا تنزيل أيٍّ من حزمتَي التوافق بالكامل.
:::

:::details[ملاحظات التوافق لبيئات التشغيل الأقدم]
- **التحميل المتزامن:** إذا كانت إحدى الوحدات المستوردة تحسب تواريخ عند التحميل قبل اكتمال `await` في المستوى الأعلى، فاستورد `@native-dates/polyfill/sync` بدلًا من ذلك.
- **تنسيق المدد الزمنية على <bdi>Node 22–23</bdi>:** تتضمّن حزمة `@native-dates/polyfill` بديلًا لـ `Intl.DurationFormat` بلا أي اعتماديات، فتعمل [`Duration.format()`](/api/duration/#format) و`Duration.text` على إصداري <bdi>Node 22–23</bdi> أيضًا (بينما توفره المتصفحات وإصدارات <bdi>Node 24+</bdi> أصليًا ولا تنزّله أبدًا).
:::

اقرأ تاليًا دليل [التخصيص](/guides/customization/) لضبط الإعدادات الافتراضية وتثبيت الإضافات الاختيارية.
