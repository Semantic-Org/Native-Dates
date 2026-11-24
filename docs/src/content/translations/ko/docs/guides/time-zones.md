---
source: 21708b5b4a6f
title: 시간대
lede: 모든 IANA 시간대에서 시점을 조회하고 서머타임 전환 구간도 오차 없이 계산합니다.
---

[`DateTime`](/api/date-time/)은 실제 발생한 시점과 이를 바라보는 시간대, 두 가지 정보를 함께 지닙니다. 시간대를 바꾸면 동일한 시점을 다른 지역의 기준으로 보여 주며, 모든 UTC 오프셋과 서머타임(일광 절약 시간제) 전환은 플랫폼이 직접 처리합니다.

## 시점에 시간대 연결하기

시점을 생성할 때 `'America/New_York'` 같은 IANA 시간대 이름, `'UTC'`, 또는 고정 UTC 오프셋을 전달할 수 있습니다.

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const eastCoast = datetime('2026-11-16T12:30', 'America/New_York');
const audit = datetime('2026-11-16T17:30:00Z', 'UTC');

standup.zone; // 'America/Los_Angeles'
standup.offset; // '-08:00'
```

시간대를 생략하면 전역 설정값을 사용하며, 설정된 값이 없으면 런타임의 로컬 시간대로 대체됩니다.

앱 전역 기본 시간대는 시작 시 [`configure()`](/api/configure/)로 한 번만 설정해 두세요.

```js
import { configure, now } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
now().zone; // 'Europe/Berlin'
```

## 같은 시점을 다른 지역에서 보기

[`in()`](/api/date-time/#in)을 호출하면 동일한 시점을 다른 도시의 시간대로 확인할 수 있습니다. 현지 달력과 시계 프로퍼티는 대상 시간대에 맞춰 갱신되지만 내부 타임스탬프는 그대로 유지됩니다.

```js
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');
const tokyo = standup.in('Asia/Tokyo');

berlin.format('time', 'en-US'); // '6:30 PM'
tokyo.day; // 17
berlin.equals(standup); // true
```

## 시간대가 아니라 시점을 고정하는 오프셋

데이터베이스나 API에서 오는 문자열 끝에는 `Z`나 숫자 오프셋이 붙는 경우가 많습니다. 이 접미사는 정확한 시점을 고정할 뿐이며, 새로 생성되는 `DateTime`은 호출 시 지정한 시간대를 그대로 사용합니다.

```js
import { datetime } from 'native-dates';

const created = datetime('2026-03-07T14:00:00Z', 'America/New_York');
const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');

created.zone; // 'America/New_York'
created.hour; // 9
berlin.hour; // 15
```

서머타임 전환을 가로질러 일이나 월을 더해야 하는 순간부터 실제 IANA 시간대를 유지하는 일이 중요해집니다.

고정 오프셋은 계절이 바뀌어도 변하지 않지만, IANA 시간대는 해당 지역의 모든 전환 규칙을 알고 있습니다.

:::note[UTC 기준으로 작업하기]
프로퍼티 조회와 달력 계산을 UTC 기준으로 수행하려면 시간대에 `'UTC'`를 전달하세요. [`toString()`](/api/date-time/#tostring) 같은 직렬화 메서드는 현재 조회 중인 시간대와 관계없이 항상 UTC 문자열을 출력합니다. 자세한 내용은 [저장과 전송](/guides/storing-and-sending/)을 참고하세요.
:::

## 서머타임 전환

시계가 앞당겨지거나 되돌아가는 날에는 달력 단위와 시각 단위가 다르게 동작합니다. 2026년 3월 8일 뉴욕에서는 오전 2시가 오전 3시로 건너뛰어 그 일요일이 23시간이 됩니다.

이때 1일을 더하면 현지 오전 9시 약속 시각이 유지되는 반면, 24시간을 더하면 실제로 경과한 24시간을 셉니다.

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
saturday.plus(1, 'day').hoursInDay; // 23
```

:::warning[서머타임 시작으로 건너뛴 시각]
시계가 오전 2시에서 오전 3시로 건너뛸 때 오전 2시 30분 같은 현지 시각은 그 시간대에 존재하지 않습니다. 이처럼 누락된 현지 시각을 요청하면 오류를 던지지 않고 건너뛴 간격만큼 앞으로 이동합니다.
:::

```js
const skipped = datetime('2026-03-08T02:30', 'America/New_York');
skipped.text; // 'Mar 8, 2026, 3:30 AM EDT'
```

:::details[중복·누락 시각 처리 제어하기]
일정 예약이나 감사 로그처럼 서머타임 전환 구간의 누락·중복 시각에 다른 규칙을 적용해야 한다면 [`datetime()`](/api/datetime-fn/)이나 `at()`에 모호한 시각 처리 옵션인 `disambiguation`을 전달하세요. 기본값은 `'compatible'`이며 `'earlier'`, `'later'`, `'reject'`도 지정할 수 있습니다.

```js
const fallBack = datetime('2026-11-01T01:30', {
  zone: 'America/New_York',
  disambiguation: 'later',
});
fallBack.offset; // '-05:00'

datetime('2026-03-08T02:30', {
  zone: 'America/New_York',
  disambiguation: 'reject',
}); // RangeError [invalidDateTime]을 던집니다
```
:::

## 도시명과 약어

코어는 표준 IANA 시간대 이름, `'UTC'`, 고정 오프셋을 받습니다. 영어 도시명과 내장 원어 별칭(`'서울'`, `'東京'`, `'北京'`, `'москва'`), 지역 약어, 사용자 정의 별칭을 사용하려면 [`@native-dates/plugins/zones`](/plugins/zones/)를 불러오세요.

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'los angeles').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'

configure({ zoneAliases: { hq: 'Europe/Berlin' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```

`CST`나 `IST`처럼 여러 지역에서 함께 쓰이는 약어는 활성 로케일의 지역을 따르며, Beijing, Mumbai, Osaka 같은 주요 영어 도시명은 별도 별칭 없이 바로 해석됩니다.
