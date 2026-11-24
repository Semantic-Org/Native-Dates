---
source: fb90df20f99e
title: 포맷
lede: 현지화된 프리셋, 토큰 패턴, 상대 표현으로 날짜와 시각, 기간을 포맷합니다.
---

Native Dates는 플랫폼에 내장된 `Intl` 포매터를 직접 활용하고 자동으로 캐시합니다. 번들에 로케일 파일을 추가하지 않고도 모든 언어와 지역에 맞는 출력을 얻을 수 있습니다.

## text와 프리셋으로 빠르게 출력하기

모든 인스턴스에는 활성 로케일로 포맷된 `.text` 프로퍼티가 있습니다. 인수 없이 [`format()`](/api/date-time/#format)을 호출하면 각 타입의 기본 프리셋이 적용됩니다.

```js
import { date, datetime, duration, time } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.text; // 'Nov 16, 2026, 9:30 AM PST'
standup.format(); // 'Nov 16, 2026, 9:30 AM'

date('2026-11-16').text; // 'Nov 16, 2026'
time('9:30am').text; // '9:30 AM'
duration('1h 30m').text; // '1 hour, 30 minutes'
```

표시할 상세 수준을 고르려면 `format()`에 프리셋 이름을 전달하세요.

| 프리셋 | 예시 | 지원 타입 및 출력 |
|---|---|---|
| `'short'` | `'5/4/26, 9:30 AM'` | 날짜, 시각, 부분 날짜의 숫자 날짜나 짧은 시각 표기, 또는 기간의 축약 단위 표기. |
| `'medium'` | `'May 4, 2026, 9:30 AM'` | 날짜와 시점의 약식 월명, 또는 [`Time`](/api/time/)의 초 포함 시각. |
| `'long'` | `'May 4, 2026 at 9:30 AM'` | 전체 월명, `Time`의 초 포함 시각, 또는 [`Duration`](/api/duration/)의 풀어쓴 단위. |
| `'full'` | `'Monday, May 4, 2026 at 9:30 AM'` | 날짜와 시점의 전체 요일과 월명, 또는 부분 날짜의 전체 월명. |
| `'date'` | `'May 4, 2026'` | [`DateTime`](/api/date-time/)과 [`CalendarDate`](/api/calendar-date/)의 날짜 부분. |
| `'time'` | `'9:30 AM'` | `DateTime`과 `Time`의 짧은 시각. |
| `'month'` | `'May 2026'` | `DateTime`, `CalendarDate`, [`YearMonth`](/api/year-month/)의 전체 월명과 연도. |
| `'text'` | `'May 4, 2026, 9:30 AM PDT'` | `DateTime`의 날짜·시각·짧은 시간대명, 그 외 타입은 각 타입이 지닌 필드. |

:::details[Moment 및 Day.js 프리셋 이름]
코어는 Moment와 Day.js에서 쓰던 현지화 프리셋 이름도 지원합니다.

| 프리셋 | 예시 | 현지화 필드 |
|---|---|---|
| `'LT'`, `'LTS'` | `'9:30 AM'`, `'9:30:00 AM'` | 짧은 시각 또는 초를 포함한 시각. |
| `'L'`, `'l'` | `'05/04/2026'`, `'5/4/2026'` | 앞자리 0 채움 여부에 따른 숫자 연·월·일. |
| `'LL'`, `'ll'` | `'May 4, 2026'` | 전체 또는 약식 월명과 일·연도. |
| `'LLL'`, `'lll'` | `'May 4, 2026 at 9:30 AM'` | 전체 또는 약식 날짜와 짧은 시각. |
| `'LLLL'`, `'llll'` | `'Monday, May 4, 2026 at 9:30 AM'` | 전체 또는 약식 요일, 날짜, 짧은 시각. |
:::

날짜, 시각, [연월](/api/year-month/), [월일](/api/month-day/) 모두 위 프리셋을 받으며 각 타입이 실제로 지닌 필드만 출력합니다. [기간](/api/duration/)은 간결한 형식(`'narrow'`)과 디지털 형식(`'digital'`)도 추가로 지원합니다.

```js
import { date, duration, time, yearMonth } from 'native-dates';

date('2026-11-16').format('full', 'en-US'); // 'Monday, November 16, 2026'
yearMonth('2026-11').format('LL', 'en-US'); // 'November 2026'
time('9:30:15am').format('LTS', 'en-US'); // '9:30:15 AM'

const span = duration({ hours: 2, minutes: 15 });
span.format('narrow', 'en-US'); // '2h 15m'
span.format('digital', 'en-US'); // '2:15:00'
```

## 로케일과 Intl 옵션

[`configure()`](/api/configure/)로 전역 기본 로케일을 한 번 설정하거나, [`locale()`](/api/date-time/#locale)로 특정 값에 로케일을 연결하거나, 단일 `format()` 호출에 태그를 직접 전달할 수 있습니다. 클라이언트 앱과 다중 사용자 서버의 구성 기준은 [현지화](/guides/localization/)를 참고하세요.

```js
import { configure, datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'Europe/Berlin');
standup.locale('de-DE').plus(1, 'week').format('long'); // '23. November 2026 um 09:30'
standup.format('long', 'ja-JP'); // '2026年11月16日 9:30'

configure({ locale: 'en-GB' });
configure({ locale: null });
```

원하는 구성에 맞는 프리셋이 없다면 내부 `Intl` 포매터로 바로 전달되는 옵션 객체를 넘기세요.

```js
import { date } from 'native-dates';

const day = date('2026-11-16');

day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
day.format({ month: 'short', day: 'numeric' }, 'en-US'); // 'Nov 16'
```

각 타입이 자기 필드만 보관하므로, 별도의 로케일 파일 없이도 각 언어의 문법, 복수형, 문자 체계, 역법에 맞춰 프리셋이 자연스럽게 적용됩니다. 대상 언어의 세부 동작은 [언어별 예제](/examples/)에서 확인해 보세요.

```js
import { date, days, yearMonth } from 'native-dates';

date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
date('2026-05-01').format('long', 'ru'); // '1 мая 2026 г.'
days(2).format('long', 'ar'); // 'يومان'
```

:::tip[화면 표시용 문자열과 전송용 문자열]
`format()`은 화면에 사람에게 보여 줄 텍스트에만 사용하세요. 값을 저장하거나 네트워크로 전송할 때는 안정적인 ISO 8601 형식을 유지하도록 [`toString()`](/api/date-time/#tostring)을 호출하거나 JSON으로 직렬화하세요. 자세한 내용은 [저장과 전송](/guides/storing-and-sending/)을 참고하세요.
:::

## 토큰 패턴

고정된 출력 형식이 필요하면 `format()`에 토큰 패턴을 전달하세요. 그대로 출력할 일반 텍스트는 대괄호(`[...]`)로 감쌉니다.

```js
import { datetime, monthDay, yearMonth } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('YYYY-MM-DDTHH:mmZ'); // '2026-11-16T09:30-08:00'
standup.format('dddd, MMM D [at] h:mm A', 'en-US'); // 'Monday, Nov 16 at 9:30 AM'
yearMonth('2026-11').format('MMM YYYY', 'en-US'); // 'Nov 2026'
monthDay('11-16').format('MMMM Do', 'en-US'); // 'November 16th'
```

토큰 패턴 안의 월명과 요일명은 활성 로케일의 `Intl` 데이터를 따릅니다. 반면 숫자와 연도는 `'YYYY-MM-DD'` 같은 패턴이 어느 로케일에서나 기계 판독 가능하도록 아라비아 숫자와 ISO 연도 형식을 유지합니다. 토큰 대소문자는 Moment와 Day.js 규칙을 따릅니다(LDML이나 date-fns의 소문자 `yyyy`, `dd`와 달리 `YYYY`와 `DD`는 대문자를 쓰며, 여기에서 `dd`는 두 글자 요일명입니다).

:::details[전체 포맷 토큰]
| 토큰 | 예시 | 출력 |
|---|---|---|
| `YYYY` | `'2026'` | 네 자리 연도(음수 연도는 부호 포함). |
| `YY` | `'26'` | 두 자리 연도. |
| `Q` | `'4'` | 1부터 4까지의 분기. |
| `M`, `MM` | `'11'`, `'05'` | 월 숫자(그대로 또는 두 자리 0 채움). |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | 현지화된 그레고리력 월명(일 토큰 뒤에 오면 중간에 일반 텍스트가 있어도 자동으로 문맥 격변화 적용). |
| `D`, `DD` | `'5'`, `'05'` | 일 숫자(그대로 또는 두 자리 0 채움). |
| `Do` | `'16th'` | 영어 서수, 로케일별 일 표기(`'6.'`, `'6日'` 등), 또는 사용자 정의 [`ordinals`](/api/configure/)가 적용된 일. |
| `DDD`, `DDDD` | `'320'`, `'045'` | 연중 일수(그대로 또는 세 자리 0 채움). |
| `E` | `'7'` | `dayOfWeek`와 동일한 월요일(1)부터 일요일(7)까지의 ISO 요일 번호. |
| `d` | `'0'` | Moment 및 Day.js와 동일한 일요일(0)부터 토요일(6)까지의 요일 번호. |
| `dd`, `ddd`, `dddd` | `'Mo'`, `'Mon'`, `'Monday'` | 현지화된 최단, 약식, 전체 요일명([`weekdayNames`](/api/configure/)로 재정의 가능). |
| `W`, `WW` | `'47'`, `'05'` | ISO 연도별 주차(그대로 또는 두 자리 0 채움). |
| `H`, `HH` | `'9'`, `'09'` | 24시간제 시(그대로 또는 두 자리 0 채움). |
| `h`, `hh` | `'9'`, `'09'` | 1부터 12까지의 12시간제 시. |
| `m`, `mm` | `'5'`, `'05'` | 분(그대로 또는 두 자리 0 채움). |
| `s`, `ss` | `'8'`, `'08'` | 초(그대로 또는 두 자리 0 채움). |
| `S`, `SS`, `SSS` | `'4'`, `'42'`, `'420'` | 0.1초, 0.01초, 밀리초. |
| `A`, `a` | `'AM'`, `'am'` | 영어의 대문자·소문자 `'AM'`/`'PM'`, 또는 로케일별 오전·오후 표기(`'午後'`, `'م'` 등). |
| `Z`, `ZZ` | `'-08:00'`, `'-0800'` | 콜론 포함 또는 미포함 UTC 오프셋. |
| `z`, `zz` | `'PST'` | 현지화된 짧은 시간대 이름. |
| `zzz`, `zzzz` | `'Pacific Standard Time'` | 현지화된 전체 시간대 이름. |
| `X` | `'1794850200'` | 정수 초 단위의 유닉스 에포크 타임스탬프. |
| `x` | `'1794850200000'` | 밀리초 단위의 유닉스 에포크 타임스탬프. |
| `[text]` | `'[at]'` | 해석하지 않고 그대로 출력하는 이스케이프 리터럴 텍스트. |
:::

대괄호 바깥에 인식할 수 없는 문자가 있으면 글자를 그대로 출력하는 대신 [`unknownFormat`](/api/errors/#units-zones-and-formats) 오류를 던집니다. `'às'`처럼 악센트 문자에 붙은 토큰이나 `'HHhmm'`처럼 섞인 시각 토큰도 마찬가지로 오류를 던집니다. 단, 단독 `T`는 ISO 타임스탬프 편의를 위해 이스케이프 없이 그대로 통과합니다.

해당 타입에 없는 필드를 요구하면 자정을 억지로 만들어 내지 않고 [`unsupportedToken`](/api/errors/#units-zones-and-formats) 오류를 던집니다. 예를 들어 달력 날짜에서 `'HH:mm'` 같은 시각 토큰을 포맷하면 즉시 실패합니다.

코어는 현지화된 달력 헤더와 월 선택 드롭다운을 만들 수 있도록 [`monthNames()`](/api/month-names/)와 요일용 함수인 `weekdayNames()`도 함께 내보냅니다. `weekdayNames()`의 시작 요일 인수에는 영어 요일명을 전달합니다.

```js
import { monthNames, weekdayNames } from 'native-dates';

monthNames('short', 'en-US'); // ['Jan', 'Feb', 'Mar', ...]
weekdayNames('short', undefined, 'en-US'); // ['Sun', 'Mon', 'Tue', ...]
weekdayNames('narrow', 'monday', 'en-US'); // ['Mo', 'Tu', 'We', ...]
```

## 사용자 정의 포맷 등록

여러 화면에서 같은 토큰 패턴이나 `Intl` 옵션 객체를 반복 사용한다면 [`configure()`](/api/configure/)에 이름을 붙여 등록해 두세요. 사용자 정의 이름은 날짜, 시각, 부분 날짜, 범위에서 모두 사용할 수 있으며 내장 프리셋보다 우선합니다. 자세한 예시는 [이름 붙인 포맷](/guides/customization/#named-formats)을 참고하세요.

## 범위 포맷

모든 [범위](/api/ranges/)는 프리셋과 옵션을 `Intl`로 포맷해 공통된 월이나 연도를 자동으로 축약합니다. 토큰 패턴을 전달하면 양 끝점을 각각 포맷해 `' – '`로 이어 붙입니다.

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');
const shift = timeRange('9:00am', '5:00pm');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
shift.format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

## 상대 표현

시점이나 달력 날짜에서 [`from()`](/api/date-time/#from)이나 [`fromNow()`](/api/date-time/#fromnow)를 호출하면 런타임의 상대 시간 포매터를 통해 현지화된 상대 표현을 얻을 수 있습니다. [`formatRelative()`](/api/date-time/#formatrelative)도 별칭으로 사용할 수 있습니다.

```js
import { date, datetime, now, today } from 'native-dates';

now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
today().plus(1, 'day').fromNow('en-US'); // 'tomorrow'

const anchor = datetime('2026-11-16T12:00', 'UTC');
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'

const currentDay = date('2026-11-16');
currentDay.minus(1, 'day').from(currentDay, 'en-US'); // 'yesterday'
currentDay.plus(14, 'days').from(currentDay, 'en-US'); // 'in 2 weeks'
```

달력 날짜는 온전한 일 단위로 비교하므로 7일 이내에서는 `from()`과 `fromNow()`가 ‘어제’, ‘오늘’, ‘내일’ 같은 자연어 표현을 사용합니다. 반면 `DateTime` 시점은 23시간 전이라도 같은 날일 수 있으므로 실제 경과 시간을 기준으로 계산해 `'now'`를 벗어나면 숫자 기반 표현을 유지합니다.

다음으로 [파싱](/guides/parsing/)에서 외부 문자열과 데이터를 코드의 타입으로 읽어 들이는 방법을 살펴보세요.
