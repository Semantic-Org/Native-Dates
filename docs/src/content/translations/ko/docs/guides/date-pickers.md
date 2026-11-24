---
source: 9de557f3ce5d
title: 날짜 선택기와 UI
lede: 브라우저 입력 요소와 날짜 선택기를 Native Dates에 연결하고, 기존 Date 기반 위젯은 UI 경계에 격리합니다.
---

애플리케이션 상태와 도메인 로직에서는 Native Dates 값을 그대로 유지하세요.

브라우저 입력 요소나 서드파티 위젯이 ISO 문자열이나 네이티브 JavaScript `Date`를 요구할 때만 컴포넌트 경계에서 변환합니다. 이렇게 경계를 나누면 시간대 규칙과 날짜 계산 로직이 UI 라이브러리의 특이한 동작에 섞이지 않습니다.

## 네이티브 HTML 입력 요소

네이티브 HTML 날짜·시각 입력 요소는 표준 ISO 문자열을 직접 읽고 씁니다. 별도의 날짜 선택기 라이브러리가 필요 없으며, 시간대 때문에 달력 날짜가 어긋나는 일도 없습니다.

| 입력 요소 | 입력에 값 쓰기 | 코어 타입으로 다시 읽기 |
|---|---|---|
| `<input type="date">` | `d.toString()` | 빈 문자열이 아닌 값을 [`date()`](/api/date-fn/)에 전달해 시간대 없는 달력 날짜를 생성합니다. |
| `<input type="time">` | `t.format('HH:mm')`, 또는 `step="1"` 사용 시 `t.toString()` | `value`를 [`time()`](/api/time-fn/)에 전달해 시간대 없는 시각을 생성합니다. |
| `<input type="month">` | `ym.toString()` | `value`를 [`yearMonth()`](/api/year-month-fn/)에 전달해 결제 월이나 카드 만료일을 생성합니다. |
| `<input type="datetime-local">` | `dt.format('YYYY-MM-DDTHH:mm')` | `value`와 시간대를 [`datetime()`](/api/datetime-fn/)에 전달해 특정 시점을 생성합니다. |

상태를 입력 요소의 값과 경계 속성에 바인딩한 뒤, 변경된 문자열을 해당하는 팩토리 함수로 다시 파싱하세요.

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

폼에서 날짜와 시각을 별도의 입력 요소로 받을 때는 각 입력 요소를 대응하는 타입에 바인딩해 두세요. 특정 시점을 만들 때 [`at()`](/api/calendar-date/#at)으로 둘을 합칩니다.

```js
const rawDate = '2026-11-16';
const rawTime = '09:30';

const day = rawDate ? date(rawDate) : null;
const clock = rawTime ? time(rawTime) : null;
const startsAt = day && clock ? day.at(clock, 'America/Los_Angeles') : null;

startsAt?.toString(); // '2026-11-16T17:30:00.000Z'
```

:::warning[파싱 전 빈 입력값 확인]
HTML 입력 요소를 비우면 빈 문자열이 전달되고, 텍스트 입력을 지원하는 날짜 선택기에 입력하는 도중에는 유효하지 않은 `Date`가 전달될 수 있습니다. 코어는 빈 값을 오늘 날짜로 대체하지 않고 예외를 던지므로, 팩토리 함수를 호출하기 전에 빈 문자열이나 `NaN` 여부를 먼저 확인하세요.
:::

## React Day Picker

React Day Picker는 선택된 날짜를 로컬 자정 기준의 네이티브 JavaScript `Date`로 표현합니다. 상태에는 [`CalendarDate`](/api/calendar-date/)를 유지하고, props 경계에서만 변환하세요.

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

범위를 선택할 때는 변환 로직을 작은 헬퍼 함수 두 개로 감싸고 상태에 [`DateRange`](/api/ranges/)를 저장합니다. 사용자가 범위를 고르는 도중에는 종료 날짜가 아직 비어 있거나 시작 날짜와 같을 수 있으므로, `picked.to ?? picked.from`으로 대체하면 항상 유효한 범위를 유지할 수 있습니다.

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

기본적으로 [`toJSDate()`](/api/calendar-date/#tojsdate)와 `date()`는 브라우저의 시간대를 따릅니다. 앱에서 [`configure()`](/api/configure/)로 기본 시간대를 재정의했다면 달력 그리드가 어긋나지 않도록 두 호출 모두에 브라우저의 현재 시간대를 전달하세요.

```js
const host = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pickerDate = due.toJSDate(host);
const picked = date(pickerDate, host);
```

## MUI X 및 Date 기반 날짜 선택기

`AdapterDateFns`를 쓰는 MUI X Date Pickers는 값과 변경 props로 네이티브 JavaScript `Date`를 주고받습니다. 이 어댑터는 `LocalizationProvider`와 얇은 래퍼 컴포넌트 하나 안에만 두어, 기존 `Date`가 애플리케이션 상태에 스며들지 않게 분리하세요.

텍스트 입력을 지원하는 날짜 선택기는 키를 누를 때마다 변경 핸들러를 호출하며, 입력이 끝나지 않은 동안 유효하지 않은 `Date`를 넘깁니다. 변환하기 전에 `Number.isNaN()`으로 먼저 걸러 내세요.

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

날짜와 시각을 함께 고르는 선택기에도 같은 경계 헬퍼를 쓰고, 반환된 시점이 원하는 시간대에 고정되도록 [`datetime()`](/api/datetime-fn/)에 IANA 시간대를 명시적으로 전달하세요.

```js
import { datetime } from 'native-dates';

function fromPickerMoment(next, zone) {
  if (!next || Number.isNaN(next.getTime())) return null;
  return datetime(next, zone);
}

const meeting = fromPickerMoment(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
meeting.format('short', 'en-US'); // '11/16/26, 9:30 AM'
```

## 폼과 스키마 검증

React Hook Form이나 Zod 같은 폼 도구는 편집 중에는 필드를 문자열로 두고 스키마 검증 단계에서 타입이 지정된 값으로 파싱할 때 가장 깔끔하게 동작합니다.

엄격한 ISO 입력 요소라면 스키마 내부에서 각 문자열을 변환한 뒤 파싱된 타입으로 도메인 규칙을 바로 검증하세요.

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

사용자가 텍스트 입력란에 `'Nov 16, 2026'` 같은 비정형 날짜를 직접 입력한다면 [loose 플러그인](/plugins/loose/)을 불러오고 `{ loose: true }`를 전달하세요. 읽을 수 없는 문자열이 들어와도 예외를 던지지 않고 `null`을 반환하므로 별도의 `try/catch` 블록이 필요 없습니다.

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

[`isCalendarDate()`](/api/kind-of/)나 `isDateTime()` 같은 타입 가드 함수는 이미 파싱된 상태를 검증하는 사용자 정의 스키마 규칙에도 바로 연결할 수 있습니다.

## 차트, 테이블 및 읽기 전용 Date 뷰

차트와 데이터 테이블은 `getTime()`이나 `getHours()` 같은 네이티브 게터로 타임스탬프를 읽는 경우가 많습니다.

앱 시작 시 [legacy-date 플러그인](/plugins/legacy-date/)을 한 번만 가져오면 이러한 읽기 전용 게터가 [`DateTime`](/api/date-time/)에 추가됩니다. 로컬 게터는 호스트 기기의 시간대가 아니라 인스턴스 자체의 시간대를 기준으로 값을 읽으며, 인스턴스를 변경하는 세터는 예외를 던집니다.

```js
import '@native-dates/plugins/legacy-date';
import { compare, datetime } from 'native-dates';

const rows = [
  { id: 'b', createdAt: datetime('2026-11-16T18:00:00Z', 'America/New_York') },
  { id: 'a', createdAt: datetime('2026-11-16T14:30:00Z', 'America/New_York') },
];

// DateTime 값을 읽기 전용 Date 접근자로 사용
rows[0].createdAt.getHours(); // 13
rows[0].createdAt.getTime(); // 1794852000000

// 단일 코어 타입 기준으로 행 정렬
const sorted = [...rows].sort((a, b) => compare(a.createdAt, b.createdAt));
sorted[0].id; // 'a'
```

날짜만 담긴 열이나 시점만 담긴 열처럼 한 종류의 값만 들어 있는 열을 정렬할 때는 테이블의 정렬 비교 함수 안에서 [`compare()`](/api/compare/)를 호출하세요. 한 번의 비교에 서로 다른 종류의 값을 섞으면 예외를 던집니다.

:::tip[위젯이 instanceof Date를 검사하는 경우]
`legacy-date` 플러그인은 `DateTime`만 확장하며 네이티브 `Date`의 인스턴스 판별까지 흉내 내지는 않습니다. 차트나 테이블이 객체 타입을 직접 검사하거나 값을 직접 변경한다면, 시리즈 경계에서 `dt.toJSDate()`나 `dt.epochMilliseconds`를 전달하세요.
:::

## API 및 데이터베이스로 전송

UI 경계에서 파싱을 마친 폼 값은 별도 변환 없이 `JSON.stringify()`에 바로 넘길 수 있습니다. ISO 전송 형식과 JSON 또는 데이터베이스 행을 팩토리 함수로 다시 복원하는 방법은 [저장과 전송](/guides/storing-and-sending/)을 참고하세요.
