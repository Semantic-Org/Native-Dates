---
source: 9de557f3ce5d
title: Компоненты выбора даты и UI
lede: Подключайте браузерные поля ввода и компоненты выбора даты к Native Dates, оставляя устаревшие виджеты на Date на границе интерфейса.
---

Храните значения Native Dates в состоянии приложения и бизнес-логике.

Преобразуйте их в строки ISO или нативные объекты JavaScript `Date` только на границе компонента — там, где этого требует браузерное поле ввода или сторонний виджет. Так правила часовых поясов и календарная арифметика не смешиваются с особенностями UI-библиотек.

## Нативные поля ввода HTML

Нативные поля даты и времени HTML напрямую читают и записывают стандартные строки ISO. Им не нужна библиотека календаря, и они никогда не сдвигают календарный день между часовыми поясами.

| Поле ввода | Запись в поле | Чтение обратно в ядро |
|---|---|---|
| `<input type="date">` | `d.toString()` | Передайте непустую строку в [`date()`](/api/date-fn/), чтобы получить календарную дату без часового пояса. |
| `<input type="time">` | `t.format('HH:mm')` или `t.toString()` при `step="1"` | Передайте `value` в [`time()`](/api/time-fn/), чтобы получить время суток без часового пояса. |
| `<input type="month">` | `ym.toString()` | Передайте `value` в [`yearMonth()`](/api/year-month-fn/) для расчётного периода или срока действия карты. |
| `<input type="datetime-local">` | `dt.format('YYYY-MM-DDTHH:mm')` | Передайте `value` и часовой пояс в [`datetime()`](/api/datetime-fn/), чтобы получить точный момент времени. |

Привяжите состояние к значению и границам поля ввода, а при изменении разбирайте обновлённую строку подходящей фабричной функцией:

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

Если в форме дата и время суток вводятся в разных полях, привяжите каждое поле к своему типу. Объедините их через [`at()`](/api/calendar-date/#at), когда нужно получить момент времени:

```js
const rawDate = '2026-11-16';
const rawTime = '09:30';

const day = rawDate ? date(rawDate) : null;
const clock = rawTime ? time(rawTime) : null;
const startsAt = day && clock ? day.at(clock, 'America/Los_Angeles') : null;

startsAt?.toString(); // '2026-11-16T17:30:00.000Z'
```

:::warning[Проверяйте пустые значения перед разбором]
При очистке HTML-поля приходит пустая строка, а при ручном вводе в текстовый компонент выбора даты может прийти некорректный объект `Date`. Проверяйте значения на пустоту и `NaN` до вызова фабричной функции, потому что ядро выбрасывает ошибку, а не подставляет сегодняшнюю дату.
:::

## React Day Picker

React Day Picker представляет выбранные дни объектами JavaScript `Date` с локальной полуночью. Храните в состоянии [`CalendarDate`](/api/calendar-date/), а преобразование выполняйте на границе пропсов:

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

Для выбора диапазона вынесите преобразование в две небольшие вспомогательные функции и храните [`DateRange`](/api/ranges/). Пока пользователь выбирает вторую дату, конечная граница может быть `undefined` или совпадать с начальной — подстановка `picked.to ?? picked.from` сохраняет диапазон корректным:

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

По умолчанию [`toJSDate()`](/api/calendar-date/#tojsdate) и `date()` используют часовой пояс браузера. Если приложение переопределяет пояс по умолчанию через [`configure()`](/api/configure/), передайте активный пояс браузера в оба вызова, чтобы сетка календаря не сдвинулась:

```js
const host = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pickerDate = due.toJSDate(host);
const picked = date(pickerDate, host);
```

## MUI X и компоненты на базе Date

С адаптером `AdapterDateFns` компоненты MUI X Date Pickers принимают и возвращают нативные объекты `Date` через пропсы `value` и `onChange`. Оставьте этот адаптер внутри `LocalizationProvider` и одной тонкой обёртки, чтобы устаревшие объекты `Date` не попадали в состояние приложения.

Текстовые поля выбора даты вызывают обработчик на каждое нажатие клавиши и передают некорректный `Date`, пока пользователь не закончил ввод. Перед преобразованием проверяйте `Number.isNaN()`:

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

Для компонента выбора даты и времени используйте такую же вспомогательную функцию, передавая явный часовой пояс IANA в [`datetime()`](/api/datetime-fn/), чтобы полученный момент времени остался привязан к нужному поясу:

```js
import { datetime } from 'native-dates';

function fromPickerMoment(next, zone) {
  if (!next || Number.isNaN(next.getTime())) return null;
  return datetime(next, zone);
}

const meeting = fromPickerMoment(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
meeting.format('short', 'en-US'); // '11/16/26, 9:30 AM'
```

## Формы и валидация схем

Инструменты для форм вроде React Hook Form и Zod удобнее всего работают, когда значения полей остаются строками на время редактирования. Разбирайте их в типизированные объекты на этапе валидации схемы.

Для строгих ISO-полей преобразуйте каждую строку прямо в схеме и выполняйте проверки предметной области на уже разобранных значениях:

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

Если пользователи вводят в текстовое поле даты в свободной форме вроде `'Nov 16, 2026'`, подключите [плагин loose](/plugins/loose/) и передайте `{ loose: true }`. На нечитаемых строках возвращается `null` вместо ошибки, поэтому блок `try` не понадобится:

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

Функции проверки типа вроде [`isCalendarDate()`](/api/kind-of/) и `isDateTime()` также легко встраиваются в пользовательские правила схем, когда нужно проверить уже разобранное состояние.

## Графики, таблицы и доступ к Date только для чтения

Графики и таблицы данных часто читают временные метки через нативные геттеры вроде `getTime()` и `getHours()`.

Импортируйте [плагин legacy-date](/plugins/legacy-date/) один раз на старте приложения, чтобы добавить эти геттеры только для чтения в [`DateTime`](/api/date-time/). Локальные геттеры вычисляются в собственном часовом поясе экземпляра, а не в поясе машины, тогда как мутирующие сеттеры выбрасывают ошибку:

```js
import '@native-dates/plugins/legacy-date';
import { compare, datetime } from 'native-dates';

const rows = [
  { id: 'b', createdAt: datetime('2026-11-16T18:00:00Z', 'America/New_York') },
  { id: 'a', createdAt: datetime('2026-11-16T14:30:00Z', 'America/New_York') },
];

// Передаём значения DateTime в геттеры Date только для чтения
rows[0].createdAt.getHours(); // 13
rows[0].createdAt.getTime(); // 1794852000000

// Сортируем строки по одному базовому типу
const sorted = [...rows].sort((a, b) => compare(a.createdAt, b.createdAt));
sorted[0].id; // 'a'
```

Вызывайте [`compare()`](/api/compare/) в функции сортировки таблицы для любого столбца со значениями одного вида — например, только с датами или только с моментами времени. Смешивание разных видов в одном сравнении выбрасывает ошибку.

:::tip[Если виджет проверяет instanceof Date]
Плагин `legacy-date` расширяет только `DateTime` и никогда не подделывает принадлежность к нативному `Date`. Если график или таблица проверяют тип объекта через `instanceof` либо изменяют значения на месте, передавайте на границе данных `dt.toJSDate()` или `dt.epochMilliseconds`.
:::

## Отправка в API и базы данных

После разбора значений формы на границе интерфейса передавайте их напрямую в `JSON.stringify()` без ручного преобразования. Подробности о форматах ISO для передачи по сети и обратном разборе JSON или строк базы данных в фабричные функции описаны в руководстве [Хранение и передача](/guides/storing-and-sending/).
