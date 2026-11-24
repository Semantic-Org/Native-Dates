---
source: a8aba5e485f9
title: legacy-date
lede: 단계적 마이그레이션을 위해 DateTime에 읽기 전용 Date.prototype 게터와 포매터를 추가합니다.
---

## Date 호출부의 단계적 마이그레이션

플러그인을 한 번 가져오면 [`DateTime`](/api/date-time/) 프로토타입에 읽기 전용 게터가 등록됩니다. 기존 네이티브 `Date` 메서드를 사용하는 헬퍼, 포매터, 컴포넌트에 `DateTime` 인스턴스를 바로 전달하면서 파일 단위로 점진적으로 마이그레이션할 수 있습니다.

```js title="legacy-date.js"
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const moment = datetime('2026-09-06T14:30:15.250', 'America/New_York');

moment.getFullYear(); // 2026
moment.getMonth(); // 8 (9월, Date와 동일하게 0부터 시작)
moment.getDate(); // 6
moment.getHours(); // 14 (호스트 OS 시간대가 아닌 America/New_York 기준)
moment.getUTCHours(); // 18
```

네이티브 JavaScript `Date`는 항상 실행 환경의 OS 시간대를 기준으로 로컬 필드를 읽습니다. 반면 `DateTime`은 모든 로컬 게터와 로케일 포매터를 인스턴스 자체의 `zone` 기준으로 평가합니다.

:::warning[0부터 시작하는 월과 일요일 = 0]
기존 호출부가 예기치 않게 오작동하지 않도록 레거시 게터는 네이티브 `Date`의 번호 체계를 그대로 유지합니다. `getMonth()`는 0부터 11까지, `getDay()`는 일요일을 0으로 반환하는 반면, 코어 속성은 월을 1부터, 요일을 월요일부터 셉니다.
:::

## 시간대 기준 및 UTC 게터

모든 `DateTime` 인스턴스에서 표준 읽기 게터를 사용할 수 있습니다.

| 메서드 | 반환값 | DateTime에서의 동작 |
|---|---|---|
| `getTime()` | `number` | 유닉스 에포크 기준 밀리초이며 `dt.epochMilliseconds`와 동일합니다. |
| `getFullYear()` | `number` | `dt.zone` 기준 4자리 연도입니다. |
| `getMonth()` | `number` | `dt.zone` 기준 0부터 시작하는 월(1월 = 0, 12월 = 11)입니다. |
| `getDate()` | `number` | `dt.zone` 기준 1부터 31 사이의 일입니다. |
| `getDay()` | `number` | `dt.zone` 기준 0(일요일)부터 6(토요일) 사이의 요일입니다. |
| `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()` | `number` | `dt.zone` 기준으로 평가한 시각 필드입니다. |
| `getTimezoneOffset()` | `number` | `dt.zone`의 UTC 서쪽 기준 분 단위 오프셋입니다(예: `-04:00`은 `240`, `+05:30`은 `-330`). |
| `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()` | `number` | 0부터 시작하는 월과 일요일 = 0 체계를 사용하는 UTC 기준 날짜 필드입니다. |
| `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`, `getUTCMilliseconds()` | `number` | UTC 기준 시각 필드입니다. |

```js
const kolkata = datetime('2026-01-06T09:00', 'Asia/Kolkata');

kolkata.getTimezoneOffset(); // -330
kolkata.getHours(); // 9
kolkata.getUTCHours(); // 3
```

## 문자열 및 로케일 메서드

레거시 문자열 메서드는 네이티브 `Date`와 동일한 출력을 유지하면서 로케일 포맷의 기본 시간대로 인스턴스 자체의 시간대를 사용합니다.

| 메서드 | 반환값 | DateTime에서의 동작 |
|---|---|---|
| `toISOString()` | `string` | 인스턴스에 밀리초보다 정밀한 값이 있더라도 밀리초 정밀도의 UTC 타임스탬프를 반환합니다. |
| `toLocaleString(locales?, options?)` | `string` | 별도로 재정의하지 않으면 `dt.zone`과 [`dt.locale()`](/api/date-time/#locale) 기준으로 포맷한 날짜와 시각을 반환합니다. |
| `toLocaleDateString(locales?, options?)` | `string` | 별도로 재정의하지 않으면 `dt.zone`과 `dt.locale()` 기준으로 포맷한 날짜 부분을 반환합니다. |
| `toLocaleTimeString(locales?, options?)` | `string` | 별도로 재정의하지 않으면 `dt.zone`과 `dt.locale()` 기준으로 포맷한 시각 부분을 반환합니다. |

```js
const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');

flight.toISOString(); // '2026-09-06T18:30:15.250Z'
flight.toLocaleDateString('en-US'); // '9/6/2026'
flight.toLocaleTimeString('en-US'); // '2:30:15 PM'
flight.toLocaleTimeString('en-US', { timeZone: 'UTC' }); // '6:30:15 PM'
```

## 변경 시도 시 예외를 던지는 세터

`DateTime` 인스턴스는 불변이므로 인스턴스를 변경하는 세터를 호출하면 예외를 던지고, 대신 [`set()`](/api/date-time/#set)이나 [`plus()`](/api/date-time/#plus)를 사용하도록 안내합니다.

| 분류 | 차단되는 메서드 | 불변 대체 방법 |
|---|---|---|
| 유닉스 에포크 | `setTime()` | [`datetime()`](/api/datetime-fn/)에 유닉스 에포크 밀리초를 전달합니다. |
| 로컬 필드 | `setFullYear()`, `setMonth()`, `setDate()`, `setHours()`, `setMinutes()`, `setSeconds()`, `setMilliseconds()` | [`dt.set()`](/api/date-time/#set)으로 `dt.zone` 기준 필드를 교체합니다. |
| UTC 필드 | `setUTCFullYear()`, `setUTCMonth()`, `setUTCDate()`, `setUTCHours()`, `setUTCMinutes()`, `setUTCSeconds()`, `setUTCMilliseconds()` | [`dt.in('UTC').set()`](/api/date-time/#in)처럼 먼저 UTC로 전환한 뒤 필드를 교체합니다. |

```js
const reminder = datetime('2026-09-06T14:30Z');

try {
  reminder.setHours(9);
} catch (err) {
  err.code; // 'immutable'
}

const updated = reminder.set('hour', 9);
updated.hour; // 9
```

## toJSDate를 대신 사용해야 하는 경우

`DateTime`은 `instanceof Date`나 네이티브 객체 태그를 흉내 내지 않습니다. 객체 타입을 직접 검사하거나 전달받은 인스턴스를 변경하는 차트 라이브러리, 데이터베이스 드라이버, 유효성 검사기에 타임스탬프를 넘겨야 한다면 코어의 [`toJSDate()`](/api/date-time/#tojsdate)를 호출하세요.

```js
const nativeDate = datetime('2026-09-06T14:30Z').toJSDate();
nativeDate instanceof Date; // true
```
