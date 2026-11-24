---
source: "7f0f623e1e92"
title: dateRange()
lede: 両端の値、期間、または区間文字列から DateRange・DateTimeRange・TimeRange を作成します。
---

## 範囲の作成

これらのファクトリー関数を使うと、生の入力値、始点と終点のペア、または単一の区間文字列から[範囲](/api/ranges/)を作成できます。すでに型付きの値を持っている場合は、そのインスタンスの [`to()`](/api/ranges/#to) または [`range()`](/api/ranges/#range) を直接呼び出してください。

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
```

2つのカレンダー日付を両端に含む [`DateRange`](/api/ranges/#daterange) を作成します。第2引数に `'7 days'` のような期間を渡した場合、終了日は開始日の6日後となり、合計7日間を表します。

```js title="dates.js"
import { dateRange, days } from 'native-dates';

const fromEnds = dateRange('2026-09-01', '2026-09-07');
const fromLength = dateRange('2026-09-01', days(7));
const fromInterval = dateRange('2026-09-01/2026-09-07');

fromEnds.duration.days; // 7
fromLength.toString(); // '2026-09-01/2026-09-07'
fromInterval.equals(fromEnds); // true
```

**引数**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: 開始日の入力値、または `end` を省略した場合の完全な区間文字列。
- name: end
  type: CalendarDateInput | DurationInput | ReadOptions
  description: 終了日（範囲に含む）、期間の長さ、または `start` が区間文字列のときのオプションオブジェクト。
- name: options
  type: Zone | ReadOptions
  description: 両端の値を解析する際に適用するタイムゾーンまたは読み取りオプション。
  options:
    - name: zone
      type: Zone
      description: 瞬間を表す文字列や `Date` オブジェクトからカレンダー日付を取り出す際に使うタイムゾーン。
    - name: locale
      type: Locale
      description: 返される範囲とその両端に引き継がれる BCP 47 ロケールタグ。
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose` を使用し、非定型の日付文字列を解析して読み取れない入力には `null` を返す設定。"
    - name: dayFirst
      type: boolean
      description: loose モードでアクティブなロケールの数値日付順を上書きする設定。
```

**戻り値**

```returns
type: DateRange
description: "両端を含む `DateRange`。loose モードでいずれかの端点を読み取れない場合は `null`。"
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
```

開始時点を含み終了時点を含まない半開の [`DateTimeRange`](/api/ranges/#datetimerange) を作成します。終了側の入力にタイムゾーンが明示されていない場合は、開始時点のタイムゾーンで読み取られます。

**引数**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: 開始時点の入力値、または `end` を省略した場合の区間文字列。
- name: end
  type: DateTimeInput | DurationInput | ReadOptions
  description: 終了時点（範囲に含まない）、期間の長さ、または区間文字列に対するオプションオブジェクト。
- name: options
  type: Zone | ReadOptions
  description: 両端に適用するタイムゾーン、または `zone`・`locale`・`loose` などの読み取りオプション。
```

**戻り値**

```returns
type: DateTimeRange
description: "半開の `DateTimeRange`。loose モードでいずれかの端点を読み取れない場合は `null`。"
```

```js
import { datetimeRange } from 'native-dates';

const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
meeting.end.format('short', 'en-US'); // '9/1/26, 10:30 AM'

const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
zoned.start.zone; // 'America/New_York'
```
:::

:::entry
### `timeRange()` :kind[function]

```js signature
timeRange(start, end, options?): TimeRange
timeRange(interval, options?): TimeRange
```

2つの時刻の間を表す半開の [`TimeRange`](/api/ranges/#timerange) を作成します（終了時刻は含みません）。終了時刻が開始時刻より早い場合は、深夜0時をまたぐ範囲になります。

**引数**

```params
- name: start
  type: TimeInput | string
  required: true
  description: 開始時刻の入力値、または `end` を省略した場合の区間文字列。
- name: end
  type: TimeInput | DurationInput | ReadOptions
  description: 終了時刻（範囲に含まない）、時間単位の期間、または区間文字列に対するオプションオブジェクト。
- name: options
  type: Zone | ReadOptions
  description: タイムスタンプから時刻を取り出す際に適用するタイムゾーン、または `zone`・`locale`・`loose` などの読み取りオプション。
```

**戻り値**

```returns
type: TimeRange
description: "半開の `TimeRange`。loose モードでいずれかの端点を読み取れない場合は `null`。"
```

```js
import { timeRange } from 'native-dates';

const office = timeRange('9am - 5pm');
const overnight = timeRange('22:00', '8h');

office.toString(); // '09:00:00/17:00:00'
overnight.toString(); // '22:00:00/06:00:00'
```
:::

## 区間文字列と loose モード

単一の区間文字列は、ISO 形式のスラッシュまたは前後にスペースを伴う範囲区切り文字で分割されます。角括弧内の IANA タイムゾーン名に含まれるスラッシュはそのまま保持されます。

| 形式 | 例 | 読み取り方 |
|---|---|---|
| ISO スラッシュ区間 | `'2026-09-01/2026-09-07'`, `'09:00/17:00'` | 角括弧内のタイムゾーン名を除いた `/` で分割します。[`toString()`](/api/ranges/#tostring) の出力と一致します。 |
| スペース付きハイフン・en ダッシュ | `'9am - 5pm'`, `'2026/09/01 - 2026/09/07'` | 前後にスペースがある `-` または `–` で先に分割するため、日付内のハイフンやスラッシュが壊れません。 |
| 英語の `to` 区切り | `'2026-09-01 to 2026-09-07'` | 前後にスペースがある ` to ` で分割します。 |
| 開始点と長さ | `dateRange('2026-09-01', '7d')`, `timeRange('9am', '90m')` | 第2引数が [`Duration`](/api/duration/)、期間フィールドオブジェクト、または英語の単位表現のとき、期間として読み取ります。 |

[loose プラグイン](/plugins/loose/)を読み込むと、loose モードでは非定型の端点を解析でき、いずれかの端点が読み取れない場合に `null` を返します。

```js
import { dateRange } from 'native-dates';
import '@native-dates/plugins/loose';

dateRange('Sep 1, 2026 to Sep 7, 2026', { loose: true })?.toString();
// '2026-09-01/2026-09-07'

dateRange('not a range', { loose: true }); // null
```
