---
source: e011cab2c85c
title: configure()
lede: 시간대, 로케일, 주 시작 요일, 포맷, 토큰 이름, 플러그인의 프로세스 전역 기본값을 읽거나 변경합니다.
---

## 전역 기본값

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

하나 이상의 프로세스 전역 기본값을 갱신하고 현재 활성 설정의 스냅샷을 반환합니다. 인자 없이 호출하면 값을 변경하지 않고 현재 설정을 읽습니다.

생략한 프로퍼티는 기존 값을 유지합니다. 특정 설정에 `null`을 전달하면 런타임 및 내장 기본값으로 복원합니다.

```js title="setup.js"
import { configure, date, datetime } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'de-DE',
});

datetime('2026-11-16T17:30:00Z').zone; // 'Europe/Berlin'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
configure().weekStart; // undefined

configure({ weekStart: 'sunday' });
date('2026-11-18').startOf('week').toString(); // '2026-11-15'
configure().weekStart; // 7

// 런타임 시간대, 런타임 로케일, 로케일 기준 주 시작 요일로 복원
configure({ zone: null, locale: null, weekStart: null });
```

**매개변수**

```params
- name: settings
  type: Settings
  description: "갱신할 프로세스 전역 기본값 객체. 생략한 키는 변경되지 않습니다."
  options:
    - name: zone
      type: Zone | null
      description: "팩토리 함수와 `now()`에 적용할 기본 시간대. `null`을 전달하면 런타임 현지 시간대로 복원합니다."
    - name: locale
      type: Locale | null
      description: "포맷, 주 경계, 주말 판별, 플러그인에 적용할 기본 로케일 태그, 태그 목록 또는 `Accept-Language` 헤더. `null`이나 `''`을 전달하면 런타임 로케일로 복원합니다."
    - name: weekStart
      type: DayOfWeek | null
      description: "주 경계와 `weekdayNames()`에 사용할 주 시작 요일(영어 요일명 또는 월요일 `1`부터 일요일 `7`까지의 ISO 숫자). 미지정이거나 `null`이면 활성 로케일을 따릅니다."
    - name: weekdayNames
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: "로케일 태그, 너비(`narrow`, `short`, `long`), 영어 요일명 순으로 키를 구성한 사용자 지정 요일 레이블. 지역 로케일 태그는 기본 언어 로케일 설정 위에 덧씌워지며, 빈 값이나 `null`을 전달하면 런타임 기본 이름으로 복원합니다."
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: "로케일 태그를 키로 하는 사용자 지정 `Do` 일 서수 포맷 함수. `null`을 전달하면 내장 영어 서수 접미사와 로케일 일 표기로 복원합니다."
    - name: formats
      type: "Record<string, string | Intl.DateTimeFormatOptions> | null"
      description: "`format(name)`에 전달할 재사용 가능한 사용자 지정 포맷 맵. 각 값은 토큰 패턴이나 `Intl` 옵션 객체로, 사용자 지정 이름이 내장 프리셋보다 우선하며 `null`을 전달하면 초기화합니다."
    - name: dayFirst
      type: boolean | null
      description: "호출별 `dayFirst`와 `locale`을 생략한 느슨한 모드 호출에 적용할 기본 숫자 날짜 순서. 미지정이거나 `null`이면 활성 로케일을 따릅니다."
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: "`@native-dates/plugins/zones`에서 사용자 지정 이름을 시간대에 매핑하는 별칭 객체. 개별 키나 전체 맵에 `null`을 전달하면 별칭을 해제합니다."
```

**반환값**

```returns
type: "{ zone, locale, weekStart, dayFirst, zoneAliases, weekdayNames, ordinals, formats }"
description: "갱신이 반영된 활성 설정의 얕은 복사본. 설정되지 않은 키는 `undefined`입니다."
```

`weekdayNames`와 `ordinals` 설정은 플러그인 없이도 토큰 패턴과 [`weekdayNames()`](/api/month-names/#weekdaynames)의 출력 결과를 바꿉니다.

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});

date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
weekdayNames('narrow', 'monday', 'lv'); // ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

configure({ weekdayNames: null, ordinals: null });
```

이름이 붙은 포맷을 등록하면 날짜나 시각을 포맷하는 모든 타입에서 앱 전용 프리셋처럼 쓸 수 있습니다.

```js
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt'); // 'Friday, November 6'

configure({ formats: null });
```

플러그인을 가져오면 `configure()`에 각 플러그인 전용 옵션이 추가됩니다. 플러그인을 가져오기 전에 해당 옵션을 설정하면 `RangeError`를 던집니다.

```js
import { configure, date, now } from 'native-dates';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';

configure({
  dayFirst: true,
  zoneAliases: { hq: 'Europe/Berlin' },
});

date('07.09.2026', { loose: true })?.toString(); // '2026-09-07'
now('hq').zone; // 'Europe/Berlin'

configure({ dayFirst: null });
```
:::

:::warning[서버에서는 시작 시 한 번만 설정하세요]
전역 설정은 JavaScript 프로세스 전체의 공유 상태를 변경합니다. 서버가 부팅될 때 기본값을 한 번만 설정하고, 요청 핸들러 안에서는 각 사용자의 시간대와 [`locale()`](/api/date-time/#locale)을 개별 인스턴스에 직접 지정하세요. 자세한 내용은 [현지화](/guides/localization/)를 참고하세요.
:::

## 요일 번호 헬퍼

영어 요일명을 라이브러리 전체에서 쓰는 ISO 요일 번호로 변환합니다.

:::entry
### `dayOfWeek()` :kind[function]

```js signature
dayOfWeek(day): number
```

영어 요일명(`'monday'` 등, 한국어 요일명 불가), 3글자 영어 약어 또는 ISO 숫자를 월요일 `1`부터 일요일 `7`까지의 정수로 변환합니다. 인식할 수 없는 이름이나 1~7 범위를 벗어난 숫자는 `RangeError`를 던집니다.

**매개변수**

```params
- name: day
  type: DayOfWeek
  required: true
  description: "`'monday'` 같은 영어 요일명, 대소문자를 구분하지 않는 `'Fri'` 같은 3글자 영어 약어, 또는 1~7 범위의 정수."
```

**반환값**

```returns
type: number
description: "월요일 `1`부터 일요일 `7`까지의 요일 번호."
```

```js
import { dayOfWeek } from 'native-dates';

dayOfWeek('monday'); // 1
dayOfWeek('Fri'); // 5
dayOfWeek('sunday'); // 7
dayOfWeek(3); // 3
```
:::
