---
source: "556537c8ff45"
title: 範囲
lede: 2つの日付・時点・時刻の間の範囲。包含判定、重複判定、反復処理に対応します。
---

## 範囲クラス

[範囲ファクトリ](/api/range-fn/)（`dateRange()`、`datetimeRange()`、`timeRange()`）で直接作成するか、既存の値から [`to()`](#to)・[`for()`](#to)・[`range()`](#range) をチェーンして作成します。すべての範囲インスタンスはイミュータブルです。

:::note[終端を含む日付範囲と半開区間の日時・時刻範囲]
カレンダーの日付範囲は最終日を含みます（9月1日〜9月7日は7日間すべてを指します）。一方、日時範囲と時刻範囲は終端を含まない半開区間なので、連続する時間枠が重ならずに隣接します。
:::

:::entry
### `DateRange` :kind[class]

```js signature
new DateRange(start, end, options?)
new DateRange(interval, options?)
```

2つの[カレンダー日付](/api/calendar-date/)の間を表し、両端の日付を含みます。開始日より前の終了日を渡すと `RangeError` をスローします。

```js title="ranges.js"
import { dateRange } from 'native-dates';

const trip = dateRange('2026-09-01', '2026-09-07');
const week = dateRange('2026-09-01', '7 days');

trip.duration.days; // 7
week.toString(); // '2026-09-01/2026-09-07'
```
:::

:::entry
### `DateTimeRange` :kind[class]

```js signature
new DateTimeRange(start, end, options?)
new DateTimeRange(interval, options?)
```

2つの[時点](/api/date-time/)の間を表し、開始時点を含み終了時点は含みません。終了側の入力に明示的なタイムゾーンがない場合は開始時点のタイムゾーンで解釈され、終了が開始より前になると `RangeError` をスローします。

```js
import { datetimeRange } from 'native-dates';

const block = datetimeRange('2026-09-01T09:00', '2026-09-01T10:30', 'America/New_York');
const standup = datetimeRange('2026-09-01T09:00', '30m', 'America/New_York');

standup.duration.minutes; // 30
block.end.hour; // 10
```
:::

:::entry
### `TimeRange` :kind[class]

```js signature
new TimeRange(start, end, options?)
new TimeRange(interval, options?)
```

2つの[時刻](/api/time/)の間を表し、開始時刻を含み終了時刻は含みません。終了時刻が開始時刻より早い場合は深夜0時をまたぐ範囲として扱われます。

```js
import { timeRange } from 'native-dates';

const dayShift = timeRange('9:00am', '5:00pm');
const nightShift = timeRange('22:00', '06:00');

dayShift.duration.hours; // 8
nightShift.duration.hours; // 8
```
:::

## プロパティ

すべての範囲クラスは、フォーマット済みラベル、型付きの始点・終点、種別タグ、計測された長さをプロパティとして持ちます。

| プロパティ | 型 | 説明 |
|---|---|---|
| `text` | `string` | ロケールに合わせてフォーマットされた範囲文字列（例：`'Sep 1 – 7, 2026'`）。 |
| `start`, `end` | `CalendarDate \| DateTime \| Time` | 範囲クラスに対応する始点と終点。 |
| `kind` | `'date' \| 'datetime' \| 'time'` | この範囲が保持する点の種別タグ。 |
| `duration` | [`Duration`](/api/duration/) | `start` を基準に計測した全体の長さ。日付範囲では最終日を含め、日またぎの時刻範囲では深夜0時をまたいで計算します。 |

## 始点からの範囲作成

:::entry
### `to()` :kind[method]

```js signature
d.to(end, unit?): DateRange
d.through(end, unit?): DateRange
d.for(length, unit?): DateRange
dt.to(end, unit?): DateTimeRange
dt.for(length, unit?): DateTimeRange
t.to(end, unit?): TimeRange
t.for(length, unit?): TimeRange
```

この点を始点として、終点まで、または指定した期間分の範囲を作成します。[カレンダー日付](/api/calendar-date/)では両端を含むため、7日間の長さを指定すると開始日の6日後が終端になります。

明示的な期間の長さから範囲を作成する場合は `for()` を使います（終点や単位なしの数値は拒否されます）。また、カレンダー日付には最終日を含む意図を明示できるエイリアス `through()` もあります。

**引数**

```params
- name: end
  type: Point | DurationInput | number
  required: true
  description: 同じ種別の終点、`Duration`・英語の単位表現・ISO 8601 の期間入力、または `unit` と組み合わせる数値 `count`。
- name: unit
  type: Unit
  description: 第1引数が数値のときの単位名。
```

**戻り値**

```returns
type: DateRange | DateTimeRange | TimeRange
description: 呼び出し元の種別に対応する範囲。
```

```js
import { date, datetime, time } from 'native-dates';

date('2026-09-01').for(7, 'days').toString(); // '2026-09-01/2026-09-07'
datetime('2026-09-01T09:00Z', 'UTC').for(90, 'minutes').toString(); // '2026-09-01T09:00:00.000Z/2026-09-01T10:30:00.000Z'
time('9:00am').to('5:00pm').toString(); // '09:00:00/17:00:00'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
dt.range(unit, firstDay?): DateTimeRange
```

日付または時点を含む、暦または時刻の単位全体を表す範囲を返します。日付範囲はその単位の初日から最終日までを含み、日時範囲はその単位の開始時点から次の単位の開始時点（終端を含まない）までを表します。

**引数**

```params
- name: unit
  type: Unit
  required: true
  description: 範囲を取得する単位（`'week'`、`'month'`、`'day'` など）。
- name: firstDay
  type: DayOfWeek
  description: 週の開始曜日を表す英語の曜日名（`unit` が `'week'` のとき、`configure()` や現在のロケール設定を上書き）。
```

**戻り値**

```returns
type: DateRange | DateTimeRange
description: 指定した `unit` 全体を表す範囲。
```

```js
import { date, datetime } from 'native-dates';

date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
datetime('2026-11-16T14:20Z', 'UTC').range('hour').toString(); // '2026-11-16T14:00:00.000Z/2026-11-16T15:00:00.000Z'
```
:::

## 包含判定と重複判定

:::entry
### `contains()` :kind[method]

```js signature
range.contains(value): boolean
range.includes(value): boolean
```

点または同じ種別の別の範囲がこの範囲内に収まるかを判定します。日付範囲は `end` を含み、日時範囲と時刻範囲は `end` を含みません。日またぎの時刻範囲は深夜0時の前後どちら側の時刻も一致対象になります。`includes()` はエイリアスです。

**引数**

```params
- name: value
  type: Point | Range
  required: true
  description: 同じ種別の単一の値または範囲。
```

**戻り値**

```returns
type: boolean
description: 指定した `value` がこの範囲内に含まれる場合は `true`。
```

```js
const stay = dateRange('2026-09-01', '2026-09-07');
stay.contains('2026-09-07'); // true

const night = timeRange('22:00', '06:00');
night.contains('23:30'); // true
night.contains('02:15'); // true
night.contains('06:00'); // false
```
:::

:::entry
### `overlaps()` :kind[method]

```js signature
range.overlaps(other): boolean
```

同じ種別の2つの範囲が1日以上または1瞬間以上重なる場合に `true` を返します。前の終了と次の開始が一致する連続した日時枠・時刻枠は重複しません。

**引数**

```params
- name: other
  type: Range | string
  required: true
  description: 同じ種別の範囲インスタンスまたは区間文字列。
```

**戻り値**

```returns
type: boolean
description: 2つの範囲が重なる場合は `true`。
```

```js
const firstSlot = timeRange('09:00', '10:00');
const nextSlot = timeRange('10:00', '11:00');

firstSlot.overlaps(nextSlot); // false
dateRange('2026-09-01', '2026-09-05').overlaps('2026-09-05/2026-09-10'); // true
```
:::

:::entry
### `intersection()` :kind[method]

```js signature
range.intersection(other): Range | null
```

2つの範囲が共有する部分だけの新しい範囲を返します。重なりがない場合は `null` を返します。2つの日またぎ時刻範囲が2か所に分かれて交差する場合は `RangeError` をスローします。

**引数**

```params
- name: other
  type: Range | string
  required: true
  description: 同じ種別の範囲インスタンスまたは区間文字列。
```

**戻り値**

```returns
type: DateRange | DateTimeRange | TimeRange | null
description: 重なり部分を表す同じ種別の範囲、重なりがない場合は `null`。
```

```js
const a = dateRange('2026-09-01', '2026-09-10');
const b = dateRange('2026-09-05', '2026-09-15');

a.intersection(b)?.toString(); // '2026-09-05/2026-09-10'
a.intersection('2026-09-20/2026-09-25'); // null
```
:::

:::entry
### `equals()` :kind[method]

```js signature
range.equals(other): boolean
```

2つの範囲の始点と終点が等しい場合に `true` を返します。範囲の配列は [`compare()`](/api/compare/) で時系列順にソートできます。

```js
dateRange('2026-09-01', '2026-09-07').equals('2026-09-01/2026-09-07'); // true
```
:::

:::entry
### `isEmpty()` :kind[method]

```js signature
range.isEmpty(): boolean
```

日時範囲または時刻範囲で始点と終点が同一の場合に `true` を返します。[`DateRange`](#daterange) は単一の日付でも丸1日を表すため、常に `false` を返します。

```js
timeRange('09:00', '09:00').isEmpty(); // true
dateRange('2026-09-01', '2026-09-01').isEmpty(); // false
```
:::

## 反復・分割・タイムゾーン変換

:::entry
### `every()` :kind[method]

```js signature
range.every(step): Point[]
range.every(count, unit): Point[]
```

`start` から正の単位または期間ごとに進め、範囲内に含まれるすべての点を配列で返します。加算を順に積み上げるのではなく常に始点から数えるため、1月31日から1か月刻みで進めると各月の最終日になります。

**引数**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: 単位名（`'day'` など）、`Duration`・英語の単位表現・ISO 8601 の期間入力、または `unit` と組み合わせる数値 `count`。
- name: unit
  type: Unit
  description: "`step` が数値のときの単位名。"
```

**戻り値**

```returns
type: Array<CalendarDate | DateTime | Time>
description: 範囲内に含まれる点の順序付き配列。
```

```js
dateRange('2026-01-31', '2026-04-30').every('month').map(String);
// ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']

timeRange('22:00', '02:00').every(1, 'hour').map(String);
// ['22:00:00', '23:00:00', '00:00:00', '01:00:00']
```
:::

:::entry
### `count()` :kind[method]

```js signature
dateRange.count(kind?): number
```

中間の日付インスタンスを生成せずに、[`DateRange`](#daterange) 内のカレンダー日数を数えます。引数には `'days'`（デフォルト）、`'weekdays'`、`'weekends'`、または `'mondays'` のような英語の曜日名（複数形）を渡せます。`'weekdays'` と `'weekends'` は現在のロケールの週末定義に従います。

**引数**

```params
- name: kind
  type: string
  default: "'days'"
  description: "`'days'`、`'weekdays'`、`'weekends'`、または `'mondays'` のような英語の曜日名。"
```

**戻り値**

```returns
type: number
description: 範囲内で条件に一致するカレンダー日数。
```

```js
const sprint = dateRange('2026-05-01', '2 weeks');

sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('weekends'); // 4
sprint.count('mondays'); // 2
```
:::

:::entry
### `split()` :kind[method]

```js signature
range.split(step): Range[]
range.split(count, unit): Range[]
range.splitBy(step): Range[]
range.splitBy(count, unit): Range[]
```

指定した刻み幅で連続する部分範囲に分割し、最後の区間は元の範囲の終端にクランプします。[`every()`](#every) と同じ刻み引数を受け付け、`splitBy()` はエイリアスです。

```js
dateRange('2026-09-01', '2026-09-10').split(4, 'days').map(String);
// ['2026-09-01/2026-09-04', '2026-09-05/2026-09-08', '2026-09-09/2026-09-10']
```
:::

:::entry
### `in()` :kind[method]

```js signature
dateRange.in(zone?): DateTimeRange
dtRange.in(zone): DateTimeRange
```

[`DateRange`](#daterange) を、開始日の0時から最終日の翌日の0時（終端を含まない）までの半開区間 [`DateTimeRange`](#datetimerange) に変換します。タイムスタンプによる範囲検索の境界とそのまま一致します。日時範囲に対して呼び出すと、両端を指定したタイムゾーンへ変換します。

時刻範囲には日付がないため、`in()` を呼び出すと `RangeError` をスローします。

**引数**

```params
- name: zone
  type: Zone
  description: 変換先の IANA タイムゾーン、固定オフセット、または `'UTC'`（`DateRange` では省略時に設定済みのタイムゾーンを使用）。
```

**戻り値**

```returns
type: DateTimeRange
description: 指定した `zone` での半開区間の日時範囲。
```

```js
dateRange('2026-09-01', '2026-09-03').in('UTC').toString();
// '2026-09-01T00:00:00.000Z/2026-09-04T00:00:00.000Z'
```
:::

## フォーマットと変換

:::entry
### `format()` :kind[method]

```js signature
range.format(spec?, locale?): string
```

プリセットやオプションオブジェクトを使う場合はロケール対応の `Intl` 範囲フォーマットで出力し、共通する日付や年月を自動的に省略します。トークンパターンを使う場合は各端点をフォーマットして `' – '` で連結します。

[`configure()`](/api/configure/) で登録したカスタムフォーマットも利用できます。プリセットとトークンの詳細は[フォーマット](/guides/formatting/)を参照してください。

**引数**

```params
- name: spec
  type: FormatSpec
  description: プリセット名、`Intl.DateTimeFormatOptions` オブジェクト、またはトークンパターン。
- name: locale
  type: Locale
  description: この呼び出しに限り、この範囲のロケールまたはグローバル設定を上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: フォーマットされた範囲文字列。
```

```js
const trip = dateRange('2026-09-01', '2026-09-07');

trip.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
trip.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('22:00', '06:00').format('HH:mm'); // '22:00 – 06:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
range.locale(): Locale | undefined
range.locale(tag): Range
```

この範囲が保持するロケールを取得するか、テキスト表示・プリセット・端点・部分範囲全体で別のロケールを使うコピーを返します。空のタグを渡すと保持されているロケールを解除します。[`lang()`](#lang) はエイリアスです。

**引数**

```params
- name: tag
  type: Locale | null | undefined
  description: 派生値に引き継ぐ BCP 47 ロケールタグ、または既存のタグを解除する `null`。
```

**戻り値**

```returns
type: Range | Locale | undefined
description: 引数なしで呼び出した場合は有効なロケールタグ、引数を渡した場合は `tag` を保持する同じ種別の新しい範囲。
```

```js
const stay = dateRange('2026-09-01', '2026-09-07').locale('de-DE');

stay.locale(); // 'de-DE'
stay.format('medium'); // '01.–07.09.2026'
stay.duration.text; // '7 Tage'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
range.lang(): Locale | undefined
range.lang(tag): Range
```

[`locale()`](#locale) の短縮エイリアスで、この範囲の BCP 47 ロケールタグの取得または設定を行います。
:::

:::entry
### `as()` :kind[method]

```js signature
range.as('duration'): Duration
```

メソッドチェーンで `'duration'` が指定された場合にこの範囲の期間を返し、それ以外の種別では `RangeError` をスローします。

```js
dateRange('2026-09-01', '2026-09-07').as('duration').days; // 7
```
:::

:::entry
### `toString()` :kind[method]

```js signature
range.toString(): string
range.toJSON(): string
```

ISO 8601 の区間文字列 `'start/end'` を返します。この形式は[範囲ファクトリ](/api/range-fn/)でそのまま再解析できます。`toJSON()` も JSON シリアライズ用に同じ文字列を返します。

```js
dateRange('2026-09-01', '2026-09-07').toString(); // '2026-09-01/2026-09-07'
timeRange('9am', '5pm').toJSON(); // '09:00:00/17:00:00'
```
:::

:::entry
### `valueOf()` :kind[method]

```js signature
range.valueOf(): never
```

数値演算子によって範囲が数値へ暗黙変換されないよう、`RangeError` をスローします。

実行時に型が不明な値を絞り込むには、[`kindOf()`](/api/kind-of/) またはエクスポートされている[範囲の型ガード関数](/api/kind-of/#type-guards)を使ってください。

```js
import { dateRange, isDateRange, isDateTimeRange, isTimeRange } from 'native-dates';

const stay = dateRange('2026-09-01', '2026-09-07');
isDateRange(stay); // true
isDateTimeRange(stay); // false
isTimeRange(stay); // false
```
:::
