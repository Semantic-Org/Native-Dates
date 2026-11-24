---
source: 9de557f3ce5d
title: منتقيات التاريخ وواجهات المستخدم
lede: اربط حقول المتصفح ومنتقيات التاريخ بـ Native Dates، واعزل عناصر Date التقليدية عند حدود واجهة المستخدم.
---

احتفظ بقيم Native Dates داخل حالة تطبيقك ومنطق العمل الأساسي.

لا تحوّلها إلى نصوص ISO أو كائنات `Date` القياسية في JavaScript إلا عند حدود المكوّن حيث يتطلبها حقل متصفح أو أداة خارجية. بذلك تبقى قواعد المناطق الزمنية وحسابات التقويم معزولة تمامًا عن غرائب مكتبات الواجهة.

## حقول إدخال HTML الأصلية

تقرأ عناصر إدخال التاريخ والوقت الأصلية في HTML نصوص ISO القياسية وتكتبها مباشرةً، فلا تحتاج إلى مكتبة منتقي تاريخ ولا تُزيح اليوم التقويمي أبدًا عبر المناطق الزمنية.

| عنصر الإدخال | الكتابة إلى الحقل | القراءة مجددًا إلى النواة |
|---|---|---|
| `<input type="date">` | `d.toString()` | مرّر النصوص غير الفارغة إلى [`date()`](/api/date-fn/) للحصول على تاريخ تقويمي بلا منطقة زمنية. |
| `<input type="time">` | `t.format('HH:mm')`، أو `t.toString()` مع `step="1"` | مرّر `value` إلى [`time()`](/api/time-fn/) للحصول على وقت يوم بلا منطقة زمنية. |
| `<input type="month">` | `ym.toString()` | مرّر `value` إلى [`yearMonth()`](/api/year-month-fn/) لفترة فوترة أو تاريخ انتهاء بطاقة. |
| `<input type="datetime-local">` | `dt.format('YYYY-MM-DDTHH:mm')` | مرّر `value` ومنطقة زمنية إلى [`datetime()`](/api/datetime-fn/) لتمثيل لحظة زمنية محدّدة. |

اربط حالة تطبيقك بقيمة الحقل وحدوده، ثم حلّل النص المتغيّر مجددًا عبر الدالة المصنعية المطابقة له:

```js
import { date, time, today, yearMonth } from 'native-dates';

const due = date('2026-11-16');
const opens = time('9:30am');
const billing = yearMonth('2026-11');

// <input type="date" value={due.toString()} min={today().toString()}>
due.toString(); // '2026-11-16'

// <input type="time" value={opens.format('HH:mm')}>
opens.format('HH:mm'); // '09:30'

// <input type="month" value={billing.toString()}>
billing.toString(); // '2026-11'
```

عندما يجمع النموذج اليوم ووقت اليوم في حقلين منفصلين، أبقِ كل حقل مرتبطًا بنوعه المستقل، ثم اجمعهما عبر [`at()`](/api/calendar-date/#at) عند إنشاء اللحظة الزمنية:

```js
const rawDate = '2026-11-16';
const rawTime = '09:30';

const day = rawDate ? date(rawDate) : null;
const clock = rawTime ? time(rawTime) : null;
const startsAt = day && clock ? day.at(clock, 'America/Los_Angeles') : null;

startsAt?.toString(); // '2026-11-16T17:30:00.000Z'
```

:::warning[تحقّق من الحقول الفارغة قبل التحليل]
يُنتج مسح حقل HTML نصًا فارغًا، كما قد تُنتج الكتابة داخل منتقي تاريخ بحقل نصي كائن `Date` غير صالح. افحص القيم الفارغة أو `NaN` قبل استدعاء أي دالة مصنعية، لأن النواة ترمي خطأً بدل الرجوع افتراضيًا إلى تاريخ اليوم.
:::

## React Day Picker

تستخدم مكتبة React Day Picker كائنات `Date` القياسية عند منتصف الليل المحلي لتمثيل الأيام المختارة. احتفظ بكائن [`CalendarDate`](/api/calendar-date/) داخل الحالة وحوّله عند حدود الخصائص (`props`):

```jsx
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { date, today } from 'native-dates';

function DueDateField() {
  const [due, setDue] = useState(() => date('2026-11-16'));

  return (
    <DayPicker
      mode="single"
      selected={due?.toJSDate()}
      disabled={{ before: today().toJSDate() }}
      onSelect={(picked) => setDue(picked ? date(picked) : null)}
    />
  );
}
```

وعند اختيار نطاق تواريخ، ضع التحويل داخل دالتين مساعدتين صغيرتين وخزّن كائن [`DateRange`](/api/ranges/) في الحالة. وأثناء اختيار المستخدم للنطاق، قد يكون تاريخ النهاية غير محدّد بعد أو مطابقًا للبداية، لذا يحافظ استخدام `picked.to ?? picked.from` على صلاحية النطاق:

```js
import { date, dateRange } from 'native-dates';

function toPickerRange(range) {
  if (!range) return undefined;
  return { from: range.start.toJSDate(), to: range.end.toJSDate() };
}

function fromPickerRange(picked) {
  if (!picked?.from) return null;
  return dateRange(date(picked.from), date(picked.to ?? picked.from));
}

const stay = dateRange('2026-11-16', '2026-11-20');
const pickerValue = toPickerRange(stay);
const restored = fromPickerRange(pickerValue);

restored.count('days'); // 5
restored.toString(); // '2026-11-16/2026-11-20'
```

تتبع [`toJSDate()`](/api/calendar-date/#tojsdate) و`date()` المنطقة الزمنية للمتصفح افتراضيًا. وإذا تجاوز تطبيقك المنطقة الافتراضية عبر [`configure()`](/api/configure/)، فمرّر المنطقة النشطة في المتصفح إلى كلا الاستدعاءين حتى تبقى شبكة التقويم متطابقة:

```js
const host = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pickerDate = due.toJSDate(host);
const picked = date(pickerDate, host);
```

## MUI X ومنتقيات التاريخ المعتمدة على Date

مع `AdapterDateFns`، تمرّر منتقيات التاريخ في MUI X كائنات `Date` قياسية عبر خصائص القيمة والتغيير. أبقِ هذا المحوّل داخل `LocalizationProvider` ومكوّن تغليف خفيف واحد حتى تبقى كائنات `Date` التقليدية خارج حالة التطبيق.

تطلق المنتقيات المزوّدة بحقل نصي معالجات التغيير مع كل ضغطة مفتاح، ممرّرةً كائن `Date` غير صالح ما دام المستخدم يكتب. تحقّق من `Number.isNaN()` قبل التحويل:

```jsx
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { date, today } from 'native-dates';

function CalendarDatePicker({ value, onChange, ...props }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        {...props}
        value={value ? value.toJSDate() : null}
        minDate={today().toJSDate()}
        onChange={(next) => {
          if (!next || Number.isNaN(next.getTime())) {
            onChange(null);
            return;
          }
          onChange(date(next));
        }}
      />
    </LocalizationProvider>
  );
}
```

استخدم الدالة المساعدة نفسها لمنتقي التاريخ والوقت، مع تمرير منطقة IANA صريحة إلى [`datetime()`](/api/datetime-fn/) حتى تبقى اللحظة المُرجَعة مربوطة بمنطقتها:

```js
import { datetime } from 'native-dates';

function fromPickerMoment(next, zone) {
  if (!next || Number.isNaN(next.getTime())) return null;
  return datetime(next, zone);
}

const meeting = fromPickerMoment(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
meeting.format('short', 'en-US'); // '11/16/26, 9:30 AM'
```

## النماذج والتحقق بالمخططات

تعمل أدوات النماذج مثل React Hook Form وZod بسلاسة عندما تبقى الحقول نصوصًا أثناء التحرير، ثم تُحلَّل إلى قيم بنوعها المحدّد في مرحلة التحقق بالمخطط.

في حقول ISO الصارمة، حوّل كل نص داخل المخطط وطبّق قواعد التحقق مباشرةً على الأنواع المحلَّلة:

```js
import { z } from 'zod';
import { date } from 'native-dates';

const isoDate = z.string().transform((raw, ctx) => {
  try {
    return date(raw);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid YYYY-MM-DD date' });
    return z.NEVER;
  }
});

const bookingSchema = z
  .object({ checkIn: isoDate, checkOut: isoDate })
  .refine(({ checkIn, checkOut }) => checkOut.isAfter(checkIn), {
    message: 'Check-out must come after check-in',
    path: ['checkOut'],
  });
```

وعندما يكتب المستخدمون تواريخ غير رسمية مثل `Nov 16, 2026` داخل مربع نص، حمّل [إضافة `loose`](/plugins/loose/) ومرّر `{ loose: true }`. تُرجع النصوص غير المقروءة `null` بدل رمي خطأ، ما يغنيك عن كتلة `try`/`catch`:

```js
import '@native-dates/plugins/loose';
import { date, isCalendarDate } from 'native-dates';

function parseTypedDate(raw, locale = 'en-US') {
  const parsed = date(raw, { loose: true, locale });
  return isCalendarDate(parsed) ? parsed : null;
}

parseTypedDate('Nov 16, 2026')?.toString(); // '2026-11-16'
parseTypedDate('not a date'); // null
```

كما تندمج دوال فحص النوع مثل [`isCalendarDate()`](/api/kind-of/) و`isDateTime()` مباشرةً في قواعد المخطط المخصّصة عند التحقق من حالة محلَّلة مسبقًا.

## الرسوم البيانية والجداول وعروض Date للقراءة فقط

كثيرًا ما تقرأ الرسوم البيانية وجداول البيانات الطوابع الزمنية عبر دوال القراءة التقليدية في `Date` مثل `getTime()` و`getHours()`.

استورد [إضافة `legacy-date`](/plugins/legacy-date/) مرة واحدة عند بدء التشغيل لإرفاق دوال القراءة هذه على [`DateTime`](/api/date-time/). تُحسب دوال القراءة المحلية في المنطقة الزمنية الخاصة بالكائن لا في المنطقة الزمنية لجهاز التشغيل، بينما ترمي دوال الضبط المُعدِّلة خطأً:

```js
import '@native-dates/plugins/legacy-date';
import { compare, datetime } from 'native-dates';

const rows = [
  { id: 'b', createdAt: datetime('2026-11-16T18:00:00Z', 'America/New_York') },
  { id: 'a', createdAt: datetime('2026-11-16T14:30:00Z', 'America/New_York') },
];

// تمرير قيم DateTime إلى دوال قراءة Date
rows[0].createdAt.getHours(); // 13
rows[0].createdAt.getTime(); // 1794852000000

// فرز الصفوف حسب أي نوع أساسي موحّد
const sorted = [...rows].sort((a, b) => compare(a.createdAt, b.createdAt));
sorted[0].id; // 'a'
```

استدعِ [`compare()`](/api/compare/) داخل دالة المقارنة لفرز الجدول في أي عمود يحمل نوعًا واحدًا، كالتواريخ التقويمية كلها أو اللحظات الزمنية كلها؛ إذ يرمي خلط أنواع مختلفة في مقارنة واحدة خطأً.

:::tip[عندما تفحص الأداة instanceof Date]
توسّع إضافة `legacy-date` صنف `DateTime` فقط ولا تنتحل هوية `Date` الأصلية. فإذا كان الرسم البياني أو الجدول يفحص هوية الكائن أو يعدّل القيم في موضعها، فمرّر `dt.toJSDate()` أو `dt.epochMilliseconds` عند حدود سلسلة البيانات بدلًا من ذلك.
:::

## الإرسال إلى واجهات API وقواعد البيانات

بعد تحليل قيم النموذج عند حدود واجهة المستخدم، مرّرها مباشرةً إلى `JSON.stringify()` دون أي تحويل يدوي. راجع دليل [التخزين والإرسال](/guides/storing-and-sending/) لتنسيقات النقل القياسية بـ ISO وإعادة قراءة حمولات JSON وصفوف قواعد البيانات عبر الدوال المصنعية.
