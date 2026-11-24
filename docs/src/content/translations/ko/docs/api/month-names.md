---
source: 68d49ce6b3ea
title: monthNames()
lede: 달력 헤더와 메뉴에 쓸 현지화된 월명과 요일명 배열을 반환합니다.
---

## 달력 레이블

두 헬퍼는 코어에 캐시된 `Intl` 테이블을 읽어 호출할 때마다 새 배열을 반환합니다. 공유 상태를 건드리지 않고 반환된 배열에 `map`, `slice`, `reverse` 등을 자유롭게 적용할 수 있습니다.

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

1월부터 12월까지 현지화된 그레고리력 월명 12개의 배열을 반환합니다. 기본값은 [설정된 로케일](/api/configure/)의 전체 월명입니다.

**매개변수**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: "`'January'` 같은 전체 월명 또는 `'Jan'` 같은 축약 월명."
- name: locale
  type: Locale
  description: "설정된 기본값을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string[]
description: "인덱스 `0`(1월)부터 `11`(12월)까지 정렬된 12개 월 레이블 배열."
```

```js title="months.js"
import { monthNames } from 'native-dates';

monthNames('short', 'en-US');
// ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

monthNames('long', 'fr-FR').slice(0, 3);
// ['janvier', 'février', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

`firstDay`, [앱 설정](/api/configure/)의 `weekStart`, 또는 활성 로케일의 주 시작 요일부터 시작하도록 순서를 맞춘 현지화 요일 레이블 7개의 배열을 반환합니다.

[`startOf('week')`](/api/calendar-date/#startof)의 주 경계와 주 단위 범위도 같은 시작 요일 규칙을 따르므로 달력 헤더가 주간 그리드와 항상 일치합니다. [`configure()`](/api/configure/)에서 지정한 사용자 지정 요일 레이블도 여기에 반영됩니다.

**매개변수**

```params
- name: style
  type: "'short' | 'long' | 'narrow'"
  default: "'short'"
  description: "`'Mon'` 같은 축약형, `'Monday'` 같은 전체형, 또는 `'Mo'` 같은 1~2글자 좁은 헤더형."
- name: firstDay
  type: DayOfWeek
  description: "시작 요일의 영어 요일명 또는 월요일 `1`부터 일요일 `7`까지의 ISO 숫자."
- name: locale
  type: Locale
  description: "설정된 기본값을 덮어쓸 BCP 47 로케일 태그."
```

**반환값**

```returns
type: string[]
description: "`firstDay`, 설정된 `weekStart` 또는 로케일의 첫 요일부터 시작하는 7개 요일 레이블 배열."
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', undefined, 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

weekdayNames('narrow', undefined, 'en-US');
// ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

weekdayNames('narrow', undefined, 'pt-BR');
// ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInGrid = date('2026-11-18', { locale: 'en-US' }).range('week').every('day');
daysInGrid[0].format({ weekday: 'short' }); // 'Sun'
```
:::
