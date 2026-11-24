---
source: c784c44bf2d7
title: ranges
lede: 모든 범위 타입에서 겹치는 구간을 빼고 맞닿은 범위를 하나로 병합합니다.
---

## 범위 집합 연산

코어의 [범위](/api/ranges/)는 포함 여부, 겹침 판별, 교집합 연산을 제공합니다. 이 플러그인을 가져오면 `DateRange`, `DateTimeRange`, `TimeRange`에 `subtract()`와 `union()` 메서드가 추가되며, 범위 목록을 하나로 합치는 `mergeRanges()` 함수도 함께 제공합니다.

```js title="ranges.js"
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

const trip = dateRange('2026-11-01', '2026-11-10');
trip.subtract('2026-11-04/2026-11-06').map(String);
// ['2026-11-01/2026-11-03', '2026-11-07/2026-11-10']

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

mergeRanges([
  timeRange('22:00', '02:00'),
  timeRange('01:00', '06:00'),
  timeRange('10:00', '12:00'),
]).map(String);
// ['10:00:00/12:00:00', '22:00:00/06:00:00']
```

각 범위 클래스는 고유한 끝점 규칙을 그대로 유지합니다. 달력 날짜 범위는 양 끝을 모두 포함하고, 시점 범위와 시각 범위는 끝 지점을 제외합니다.

## 인스턴스 메서드

:::entry
### `subtract()` :kind[method]

```js signature
range.subtract(other): Range[]
```

이 범위에서 `other`가 차지하는 구간을 제거하고, 같은 종류의 남은 범위를 0개, 1개 또는 2개 담은 배열을 반환합니다. 반환된 범위는 호출 대상의 로케일과 시간대를 유지합니다.

서로 떨어져 있거나 비어 있는 범위를 빼면 원래 범위를 요소 1개짜리 배열로 반환합니다. 비어 있는 시점 범위나 시각 범위에서 `subtract()`를 호출하면 빈 배열을 반환합니다.

**매개변수**

```params
- name: other
  type: Range | string
  required: true
  description: "제거할 같은 종류의 범위 인스턴스 또는 구간 문자열."
```

**반환값**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: "같은 종류의 남은 범위가 순서대로 담긴 배열."
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, datetimeRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-10').subtract('2026-11-01/2026-11-03').map(String);
// ['2026-11-04/2026-11-10']

const day = datetimeRange('2026-11-02T09:00', '2026-11-02T17:00', 'America/New_York');
day.subtract('2026-11-02T12:00/2026-11-02T13:00').map((part) => `${part.start.hour}-${part.end.hour}`);
// ['9-12', '13-17']

timeRange('22:00', '06:00').subtract('23:00 - 02:00').map(String);
// ['22:00:00/23:00:00', '02:00:00/06:00:00']
```
:::

:::entry
### `union()` :kind[method]

```js signature
range.union(other): Range | null
```

이 범위와 겹치거나 바로 맞닿아 있는 같은 종류의 범위를 하나로 합칩니다. 두 범위 사이에 빈 간격이 있으면 `null`을 반환합니다. 반환된 범위는 호출 대상의 로케일과 시간대를 유지합니다.

두 `DateRange`는 뒤 범위의 시작일이 앞 범위 종료일의 다음 날일 때 맞닿은 것으로 봅니다. 두 `DateTimeRange`나 `TimeRange`는 한쪽의 끝과 다른 쪽의 시작이 정확히 일치할 때 맞닿은 것으로 보며, 빈 범위는 아무 변화도 주지 않습니다.

**매개변수**

```params
- name: other
  type: Range | string
  required: true
  description: "합칠 같은 종류의 범위 인스턴스 또는 구간 문자열."
```

**반환값**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "하나로 합쳐진 같은 종류의 범위, 또는 사이에 간격이 있을 때 `null`."
```

```js
import '@native-dates/plugins/ranges';
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-05').union('2026-11-06/2026-11-10')?.toString();
// '2026-11-01/2026-11-10'

dateRange('2026-11-01', '2026-11-05').union('2026-11-07/2026-11-10');
// null

timeRange('22:00', '06:00').union('06:00 - 08:00')?.toString();
// '22:00:00/08:00:00'
```
:::

## 컬렉션 병합

:::entry
### `mergeRanges()` :kind[function]

```js signature
mergeRanges(ranges): Range[]
```

같은 종류의 범위가 담긴 이터러블을 정렬하고, 겹치거나 맞닿은 모든 구간을 최소 개수의 서로 겹치지 않는 범위로 병합합니다. 비어 있는 시점 범위와 시각 범위는 결과에서 제외됩니다.

서로 다른 종류의 범위를 섞어 전달하면 `conflictingRanges` 코드의 `TypeError`를 던지고, 범위 인스턴스가 아닌 항목을 전달하면 `invalidRange` 코드의 `TypeError`를 던집니다.

**매개변수**

```params
- name: ranges
  type: Iterable<DateRange> | Iterable<DateTimeRange> | Iterable<TimeRange>
  required: true
  description: "한 종류의 범위만 담은 배열, Set 또는 기타 이터러블."
```

**반환값**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: "겹치는 구간 없이 최소 개수로 정렬된 같은 종류의 범위 배열."
```

```js
import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, datetimeRange } from 'native-dates';

mergeRanges([
  dateRange('2026-11-12', '2026-11-15'),
  dateRange('2026-11-01', '2026-11-05'),
  dateRange('2026-11-06', '2026-11-08'),
]).map(String);
// ['2026-11-01/2026-11-08', '2026-11-12/2026-11-15']

mergeRanges([
  datetimeRange('2026-11-02T11:00', '2026-11-02T12:00', 'UTC'),
  datetimeRange('2026-11-02T09:00', '2026-11-02T11:00', 'UTC'),
]).map((part) => part.duration.hours);
// [3]
```
:::

## 자정을 넘는 시각 범위

자정을 넘는 야간 `TimeRange`도 `subtract()`, `union()`, `mergeRanges()`에서 자연스럽게 처리됩니다. 자정에서 맞닿은 두 조각은 다시 하나의 야간 시각 범위로 이어집니다.

```js
import '@native-dates/plugins/ranges';
import { timeRange } from 'native-dates';

timeRange('22:00', '06:00').subtract('01:00 - 03:00').map(String);
// ['22:00:00/01:00:00', '03:00:00/06:00:00']

timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString();
// '22:00:00/06:00:00'
```

:::note[24시간 전체를 덮는 시각 범위]
시작 시각과 종료 시각이 같은 `TimeRange`는 빈 범위를 뜻하므로, 단일 `TimeRange`로 24시간 전체를 표현할 수 없습니다. 시각 범위의 합이 하루 전체를 덮을 때 `union()`이나 `mergeRanges()`를 호출하면 `unsupportedUnion` 코드의 `RangeError`를 던집니다.
:::
