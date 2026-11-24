---
source: "c784c44bf2d7"
title: ranges
lede: あらゆる範囲型で、重複区間の減算や隣接範囲の結合を行えます。
---

## 範囲の集合演算

コアの[範囲](/api/ranges/)には包含判定・重複判定・交差計算が含まれています。このプラグインをインポートすると、`DateRange`・`DateTimeRange`・`TimeRange` に `subtract()` と `union()` が追加され、複数の範囲をまとめる `mergeRanges()` がエクスポートされます。

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

終端の扱いは各範囲クラスの規約をそのまま引き継ぎます。日付範囲は両端を含み、日時範囲と時刻範囲は終了点を含みません。

## インスタンスメソッド

:::entry
### `subtract()` :kind[method]

```js signature
range.subtract(other): Range[]
```

この範囲から `other` が占める区間を取り除き、残った0〜2個の同じ種別の範囲を配列で返します。返される範囲にはレシーバーのロケールとタイムゾーンが引き継がれます。

重ならない範囲や空の範囲を減算すると、元の範囲だけを含む長さ1の配列を返します。空の日時範囲や時刻範囲に対して `subtract()` を呼び出すと、空配列を返します。

**パラメーター**

```params
- name: other
  type: Range | string
  required: true
  description: 取り除く同じ種別の範囲インスタンスまたは区間文字列。
```

**戻り値**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: 残った同じ種別の範囲を順に並べた配列。
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

この範囲と、重なっているか直接隣接する同じ種別の範囲を1つに結合します。間に空きがある場合は `null` を返します。返される範囲にはレシーバーのロケールとタイムゾーンが引き継がれます。

2つの `DateRange` は、片方の終了日の翌日に他方が始まる場合に隣接とみなされます。`DateTimeRange` と `TimeRange` では、一方の終了点と他方の開始点が一致する場合に隣接とみなされ、空の範囲は結合結果に影響しません。

**パラメーター**

```params
- name: other
  type: Range | string
  required: true
  description: 結合する同じ種別の範囲インスタンスまたは区間文字列。
```

**戻り値**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: "結合された同じ種別の範囲。間に空きがある場合は `null`。"
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

## コレクションの結合

:::entry
### `mergeRanges()` :kind[function]

```js signature
mergeRanges(ranges): Range[]
```

同じ種別の範囲を含む反復可能オブジェクトを並べ替え、重複または隣接するすべての区間を最小限の重ならない範囲へまとめます。空の日時範囲と時刻範囲は結果から除外されます。

異なる種別の範囲を混ぜて渡すとエラーコード `conflictingRanges` の `TypeError` をスローし、範囲以外の要素を渡すとエラーコード `invalidRange` の `TypeError` をスローします。

**パラメーター**

```params
- name: ranges
  type: Iterable<DateRange> | Iterable<DateTimeRange> | Iterable<TimeRange>
  required: true
  description: "同じ種別の範囲を含む配列、`Set`、またはその他の反復可能オブジェクト。"
```

**戻り値**

```returns
type: Array<DateRange | DateTimeRange | TimeRange>
description: 重なりを持たない同じ種別の範囲を並べ替えた最小配列。
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

## 日またぎの時刻範囲

深夜0時をまたぐ `TimeRange` も、`subtract()`・`union()`・`mergeRanges()` でそのまま扱えます。深夜0時で接する断片同士は、再び1つの日またぎ範囲へとつなぎ合わされます。

```js
import '@native-dates/plugins/ranges';
import { timeRange } from 'native-dates';

timeRange('22:00', '06:00').subtract('01:00 - 03:00').map(String);
// ['22:00:00/01:00:00', '03:00:00/06:00:00']

timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString();
// '22:00:00/06:00:00'
```

:::note[24時間全体を覆う時刻範囲]
開始時刻と終了時刻が同じ `TimeRange` は空の範囲として扱われるため、単一の `TimeRange` では24時間全体を表現できません。`union()` または `mergeRanges()` に渡した時刻範囲の合計が24時間全体におよぶ場合は、エラーコード `unsupportedUnion` の `RangeError` をスローします。
:::
