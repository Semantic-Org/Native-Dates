---
source: "a03fe5ee9f3b"
title: compare()
lede: 日付、日時、時刻、期間、および範囲を並べ替えたり、最小・最大の境界値を取り出したりします。
---

## 並べ替えと順序比較

:::entry
### `compare()` :kind[function]

```js signature
compare(a, b): -1 | 0 | 1
```

同じ種類の2つの値を `Array.prototype.sort()` 用に比較し、負・0・正の数を返します。日時、エポックタイムスタンプ、カレンダー日付、時刻、期間、[年月](/api/year-month/)、[範囲](/api/ranges/)に対応しています。

どちらの引数にも生の ISO 文字列、JavaScript 標準の `Date`、またはエポックミリ秒タイムスタンプを渡せます。時刻と数値を比較する場合、数値は「時」として解釈されます。異なる種類同士を比較すると `TypeError` をスローします。

```js title="sort.js"
import { compare, date, datetime, hours, minutes } from 'native-dates';

const dates = [date('2026-12-01'), date('2026-05-10'), date('2026-08-20')];
dates.sort(compare).map(String); // ['2026-05-10', '2026-08-20', '2026-12-01']

const moments = [
  datetime('2026-11-16T18:00', 'Europe/Berlin'),
  datetime('2026-11-16T08:00', 'America/Los_Angeles'),
];
moments.sort(compare)[0].zone; // 'America/Los_Angeles'

compare(1794840000000, datetime('2026-11-16T18:00Z')); // -1

const spans = [hours(2), minutes(45), minutes(90)].sort(compare);
spans[0].minutes; // 45
```

**引数**

```params
- name: a
  type: Point | Duration | YearMonth | Range
  required: true
  description: 比較対象となる1つ目の型付き値、ISO 文字列、`Date`、またはエポックミリ秒タイムスタンプ。
- name: b
  type: Point | Duration | YearMonth | Range
  required: true
  description: 同じ種類の2つ目の値、または `a` に対応する生の入力値。
```

**戻り値**

```returns
type: -1 | 0 | 1
description: "1つ目の値が早い場合は `-1`、等しい場合は `0`、遅い場合は `1`。"
```

同じ種類の範囲同士は、まず開始点で並べ替え、開始点が同じ場合は終了点で比較します。

```js
import { compare, dateRange } from 'native-dates';

const windows = [
  dateRange('2026-11-10', '2026-11-20'),
  dateRange('2026-11-10', '2026-11-14'),
  dateRange('2026-11-01', '2026-11-05'),
];

windows.sort(compare).map(String);
// ['2026-11-01/2026-11-05', '2026-11-10/2026-11-14', '2026-11-10/2026-11-20']
```
:::

:::note[タイムゾーンをまたぐ日時の比較]
`compare()` は、ローカルの時計表示ではなく正確な瞬間で [`DateTime`](/api/date-time/) を並べ替えます。ニューヨークの午前9時の会議は、同じ日のロサンゼルスの午前8時の会議より前に並びます。
:::

## 境界値の取得

複数の日付、日時、時刻、または [`YearMonth`](/api/year-month/) から最小値・最大値を取り出します。どちらのヘルパーも可変長引数または空でない配列を受け取ります。

:::entry
### `earliest()` :kind[function]

```js signature
earliest(...points): DateTime | CalendarDate | Time | YearMonth
earliest(points): DateTime | CalendarDate | Time | YearMonth
```

同じ種類の1つ以上の引数または空でない配列から最も早い値を返します。生の `Date` やエポックミリ秒の入力は [`DateTime`](/api/date-time/) に変換されます。空の配列を渡すと `RangeError` をスローします。

**引数**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: 同じ種類の1つ以上の日付、日時、エポックタイムスタンプ、時刻、または年月。
```

**戻り値**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: 最も早い値。同じ時点が複数ある場合は、リスト内で先に出現した要素。
```

```js
import { date, earliest, time } from 'native-dates';

earliest(date('2026-11-20'), date('2026-11-04'), date('2026-11-16')).toString(); // '2026-11-04'
earliest([time('5:30pm'), time('9:00am'), time('12:15pm')]).toString(); // '09:00:00'
earliest(1794850200000, 1794840000000).epochMilliseconds; // 1794840000000
```
:::

:::entry
### `latest()` :kind[function]

```js signature
latest(...points): DateTime | CalendarDate | Time | YearMonth
latest(points): DateTime | CalendarDate | Time | YearMonth
```

同じ種類の1つ以上の引数または空でない配列から最も遅い値を返します。空の配列を渡すと `RangeError` をスローします。

**引数**

```params
- name: points
  type: Point[] | YearMonth[]
  required: true
  description: 同じ種類の1つ以上の日付、日時、エポックタイムスタンプ、時刻、または年月。
```

**戻り値**

```returns
type: DateTime | CalendarDate | Time | YearMonth
description: 最も遅い値。同じ時点が複数ある場合は、リスト内で先に出現した要素。
```

[`earliest()`](#earliest) と `latest()` を組み合わせると、値を2つの境界内にクランプできます。

```js
import { date, earliest, latest } from 'native-dates';

const minDate = date('2026-11-01');
const maxDate = date('2026-11-30');
const picked = date('2026-12-12');

const clamped = earliest(maxDate, latest(minDate, picked));
clamped.toString(); // '2026-11-30'
```
:::
