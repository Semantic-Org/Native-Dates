---
source: 97915c43145b
title: 커스터마이징
lede: 앱 전역 기본값을 지정하고 사용자 정의 포맷이나 선택적 플러그인으로 Native Dates를 확장합니다.
---

기본적으로 Native Dates는 런타임의 로컬 시간대와 로케일을 따릅니다. 앱에 고정 기본값이나 이름 붙인 포맷, 추가 파싱 및 시간대 기능이 필요할 때 [`configure()`](/api/configure/)와 선택적 플러그인을 사용하세요.

## 앱 전역 기본값

앱 시작 시 [`configure()`](/api/configure/)를 호출하면 전역 기본 시간대, 로케일, 주 시작 요일(영어 요일명)을 지정할 수 있습니다. 생략한 키는 기존 값을 유지하고, `null`을 전달하면 런타임 기본값으로 되돌아갑니다.

```js title="main.js"
import { configure, date, now } from 'native-dates';

configure({
  zone: 'America/New_York',
  locale: 'en-US',
  weekStart: 'monday',
});

now().zone; // 'America/New_York'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
```

개별 호출에서는 여전히 시간대, [`locale()`](/api/date-time/#locale), 또는 주 시작 요일을 직접 지정해 전역 기본값을 덮어쓸 수 있습니다.

:::warning[서버에서는 시작 시 한 번만 설정하세요]
전역 기본값은 JavaScript 프로세스 전체에서 공유됩니다. 다중 사용자 서버에서는 요청마다 `configure()`를 바꾸지 말고, 각 요청의 시간대와 로케일을 값에 직접 연결하세요.
:::

## 이름 붙인 포맷

`formats`에 이름을 붙여 포맷을 등록하면 [`format()`](/guides/formatting/)에 해당 이름을 전달해 재사용할 수 있습니다. 각 항목에는 토큰 패턴이나 `Intl` 옵션 객체를 지정합니다.

```js title="main.js"
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
const placed = datetime('2026-11-06T09:05', 'Europe/Berlin');
placed.format('receipt'); // 'Friday, November 6'
```

이름 붙인 포맷은 날짜, 시각, 부분 날짜, 범위에 모두 적용되며, 기간(`Duration`)은 내장 스타일만 사용합니다. 사용자 정의 이름은 내장 프리셋보다 우선하므로 `'short'`를 등록하면 앱 전체에서 해당 프리셋을 덮어씁니다.

## 플러그인 추가

영어 도시명과 내장 원어 별칭(`'서울'`, `'東京'`, `'北京'`, `'москва'`) 조회, 느슨한 파싱, 기존 `Date` 게터를 지원하는 선택적 플러그인은 [`@native-dates/plugins`](/plugins/)에 포함되어 있습니다.

```bash
npm i @native-dates/plugins
```

앱 시작 시 필요한 서브패스를 한 번만 불러오면 기능이 활성화됩니다.

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

플러그인을 불러오면 해당 플러그인 전용 [`configure()`](/api/configure/) 옵션도 함께 등록됩니다. `zones` 플러그인은 사용자 정의 별칭을 위한 `zoneAliases`를, `loose` 플러그인은 숫자 날짜 순서를 지정하는 `dayFirst`를 추가합니다.

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, date, now } from 'native-dates';

configure({
  zoneAliases: { hq: 'Europe/Berlin' },
  dayFirst: true,
});

now('hq').zone; // 'Europe/Berlin'
date('07.09.2026', { loose: true }).toString(); // '2026-09-07'
```

각 서브패스의 번들 크기는 [플러그인 개요](/plugins/)에서 확인할 수 있으며, 직접 플러그인을 만들어 배포하려면 [플러그인 작성](/guides/writing-a-plugin/)을 참고하세요.

## 사용자 정의 요일명과 서수

월명과 요일명은 런타임의 `Intl` 데이터에서 가져옵니다. 디자인상 별도의 약어나 날짜 서수가 필요하면 `weekdayNames`와 `ordinals`로 재정의할 수 있습니다. `weekdayNames`의 요일 키는 영어 요일 약어를 사용합니다.

```js title="main.js"
import { configure, date } from 'native-dates';

configure({
  weekdayNames: {
    en: { short: { tue: 'Tues', thu: 'Thurs' } },
  },
  ordinals: {
    fr: (day) => (day === 1 ? '1er' : day),
  },
});

date('2026-11-03').format('ddd', 'en-US'); // 'Tues'
date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
```

두 키 중 어느 쪽이든 `null`을 전달하면 런타임 및 내장 기본값으로 복원됩니다. 다음으로 [현지화](/guides/localization/)를 읽고 사용자별 언어, 주 경계, 역법 처리 방법을 살펴보세요.
