---
source: 46b27cf4cf7e
title: كتابة إضافة
lede: وسّع قدرات Native Dates بطرق prototype اختيارية ودمج تعريفات وحدات TypeScript.
---

تتفعّل الإضافات بمجرد استيرادها.

يمكنك نشر حزم قابلة لإعادة الاستخدام أو إضافة دوال مساعدة خاصة بمجال تطبيقك بالنمط نفسه الذي تتبعه إضافتا [`zones`](/plugins/zones/) و[`legacy-date`](/plugins/legacy-date/) في [`@native-dates/plugins`](/plugins/).

## إلحاق طرق بـ prototype

استورد الصنف الذي تريد توسيعه وألحق طريقتك بكائن `prototype` الخاص به.

كل كائن مُجمَّد عند الإنشاء. يجب أن تبقى طرق الإضافة نقية وتُرجع قيمة جديدة أو نتيجة محسوبة بدل تعديل `this`.

```js
import { CalendarDate, date } from 'native-dates';

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

date('2026-11-13').nextBusinessDay().toString(); // '2026-11-16'
```

اقرأ الخصائص العامة على الكائن أو استدعِ [`this.toTemporal()`](/api/calendar-date/#totemporal)، وابنِ القيم المُرجَعة عبر طرق مثل [`this.plus()`](/api/calendar-date/#plus).

عند توسيع طريقة موجودة مثل [`format()`](/api/calendar-date/#format)، احفظ الطريقة الأصلية أولًا وفوّض إليها أي مدخلات لا تعالجها إضافتك:

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

## فحص الأنواع عبر الحزم

تجنّب فحص `value.constructor.name` داخل الدوال المساعدة في الإضافات. في المستودعات الأحادية (monorepos) والواجهات المصغّرة وإطارات `iframe`، قد تُحمَّل نسختان من الحزمة في الذاكرة في الوقت نفسه.

يحمل كل صنف رمز تمييز عامًا (global symbol brand). وتتعرف حارسات الأنواع ودالة [`kindOf()`](/api/kind-of/) ورموز التمييز مثل [`IS_DATE_TIME`](/api/kind-of/#cross-realm-instanceof-and-brands) على القيم عبر سياقات التنفيذ (realms) ونسخ الحزم المكررة.

```js
import { date, IS_CALENDAR_DATE, IS_DATE_TIME, kindOf, now } from 'native-dates';

export function isDateOrMoment(value) {
  return Boolean(value?.[IS_CALENDAR_DATE] || value?.[IS_DATE_TIME]);
}

isDateOrMoment(date('2026-11-16')); // true
kindOf(now()); // 'datetime'
```

## التصريح عن sideEffects في package.json

يفعّل المستدعون الإضافة باستيراد مجرّد (bare import). أدرج ملفات الدخول في `"sideEffects"` وضع `"native-dates"` في `peerDependencies` حتى تحافظ أدوات التحزيم على الاستيراد وتشارك أصناف التطبيق المضيف:

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

:::warning[لا تضبط sideEffects على false لإضافات التأثير الجانبي]
يُخبر ضبط `"sideEffects": false` أدوات التحزيم بحذف استيرادات الإضافات المجرّدة من بناءات الإنتاج، حتى لو نجحت اختبارات الوحدة في Node.
:::

## توسيع أنواع TypeScript

صرّح عن `module 'native-dates'` في ملف التعريفات لدمج تواقيع الطرق الجديدة على الأصناف القائمة أو إعدادات التهيئة:

```ts title="index.d.ts"
import 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
}
```

بمجرد استيراد الإضافة، يُظهر TypeScript طريقتك إلى جانب الطرق المدمجة في كل موضع استدعاء.
