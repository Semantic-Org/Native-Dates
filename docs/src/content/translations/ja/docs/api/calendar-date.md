---
source: "df57e2243cc3"
title: CalendarDate
lede: 時刻もタイムゾーンも持たないカレンダー日付。
---

## CalendarDate の作成

[`date()`](/api/date-fn/) に ISO 文字列、年・月・日の数値、または既存の値を渡してインスタンスを作成するか、[`today()`](/api/date-fn/#today) で今日の日付を取得します。[`tomorrow()`](/api/date-fn/#tomorrow) や [`yesterday()`](/api/date-fn/#yesterday) といったヘルパーも同様に動作し、どのメソッドも元の値を変更しない新しいイミュータブルなインスタンスを返します。

```js title="create.js"
import { date, today, tomorrow } from 'native-dates';

const birthday = date('2026-05-10');
const launch = date(2026, 11, 16);
const current = today();
const nextDay = tomorrow('America/New_York');
```

カレンダー日付には時刻もタイムゾーンもないため、5月10日はどの地域に住むユーザーにとっても5月10日のままです。任意の [`DateTime`](/api/date-time/) から現地のカレンダー日付を取り出すこともできます。

```js
import { datetime } from 'native-dates';

const flight = datetime('2026-11-16T23:30:00Z', 'Asia/Tokyo');
flight.date.toString(); // '2026-11-17'
```

## プロパティ

各プロパティは ISO カレンダーのフィールドをそのまま返します。

| プロパティ | 型 | 説明 |
|---|---|---|
| `text` | `string` | ロケールに合わせてフォーマットされたカレンダー日付（例：`'Nov 16, 2026'`）。 |
| `year`, `month`, `day` | `number` | カレンダーの年、月（1〜12）、日（1〜31）。 |
| `yearMonth` | [`YearMonth`](/api/year-month/) | 日を除いたカレンダーの年月。 |
| `monthDay` | [`MonthDay`](/api/month-day/) | 年を除いたカレンダーの月日。 |
| `dayOfWeek` | `number` | ISO 曜日番号（1：月曜〜7：日曜）。 |
| `weekStart` | `number` | この日付における週の開始曜日（1〜7。[`configure()`](/api/configure/) の設定またはロケールに従う）。 |
| `quarter` | `number` | 四半期（1〜4）。 |
| `weekOfYear`, `dayOfYear` | `number` | ISO 週番号（1〜53）および年間通算日（1〜366）。 |
| `daysInMonth`, `daysInYear` | `number` | その月の日数（28〜31）と年の日数（365または366）。 |

## 結合とフィールド

タイムゾーン付きの時刻を組み合わせて特定の時点を作成したり、個々のカレンダーフィールドを置き換えたりします。

:::entry
### `at()` :kind[method]

```js signature
d.at(time?, zone?): DateTime
```

このカレンダー日付にタイムゾーン付きの時刻を結合し、[`DateTime`](/api/date-time/) を返します。時刻を省略すると、その日の始まりである0時が使われます。

**引数**

```params
- name: time
  type: TimeInput
  default: "'00:00'"
  description: 時刻文字列（`'9:30am'` など）、`Time` インスタンス、フィールドオブジェクト、または `Date`。
- name: zone
  type: Zone
  description: IANA タイムゾーン名、固定 UTC オフセット、または `'UTC'`。省略時は設定済みのタイムゾーン。
```

**戻り値**

```returns
type: DateTime
description: "`zone` における、この日付の `time` を表す新しい `DateTime`。"
```

```js
const day = date('2026-11-16');

day.at('9:30am', 'America/Los_Angeles').toString(); // '2026-11-16T17:30:00.000Z'
day.at(undefined, 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
d.set(fields): CalendarDate
d.set(unit, value): CalendarDate
```

1つ以上のカレンダーフィールドを置き換えた新しい `CalendarDate` を返します。2月30日のような範囲外の日付は翌月に繰り上がらず、`RangeError` をスローします。`day` を指定せずに `month` や `year` だけを更新して日がオーバーフローする場合は、対象月の末日にクランプされます。

**引数**

```params
- name: fields
  type: DateTimeFields | DateUnit
  required: true
  description: "`year`・`month`・`day` フィールドを持つオブジェクト、または単一の単位名。"
- name: value
  type: number
  description: 指定した `unit` に設定する整数値。
```

**戻り値**

```returns
type: CalendarDate
description: カレンダーフィールドを更新した新しい `CalendarDate`。
```

```js
const due = date('2026-11-16');

due.set('day', 1).toString(); // '2026-11-01'
due.set({ month: 12, day: 31 }).toString(); // '2026-12-31'
```
:::

## 演算と境界

カレンダー単位での加減算、単位の境界への移動、前後の曜日への移動を行います。カレンダー日付には時刻がないため、時間や分などの時刻単位を渡すと `RangeError` をスローします。

:::note[月末のクランプ]
月や年を加算した結果が対象月の日数を超える場合、翌月に繰り上がるのではなく、その月の最終有効日にクランプされます。たとえば1月31日に1か月を加算すると2月28日（うるう年なら2月29日）になります。
:::

:::entry
### `plus()` :kind[method]

```js signature
d.plus(amount, unit?): CalendarDate
d.add(amount, unit?): CalendarDate
```

年・四半期・月・週・日単位で未来へ進め、新しい `CalendarDate` を返します。エイリアスとして `add()` も利用できます。

**引数**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit` と組にする数値、`Duration` インスタンス、期間文字列（英語の単位表現や ISO 形式）、またはフィールドオブジェクト。"
- name: unit
  type: DateUnit
  description: "`amount` が数値のときに指定するカレンダー単位名（`'days'` や `'months'` など）。"
```

**戻り値**

```returns
type: CalendarDate
description: カレンダー上で未来へ進めた新しい `CalendarDate`。
```

```js
const billing = date('2026-01-31');

billing.plus(1, 'month').toString(); // '2026-02-28'
billing.plus('2 weeks').toString(); // '2026-02-14'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
d.minus(amount, unit?): CalendarDate
d.subtract(amount, unit?): CalendarDate
```

指定したカレンダー期間だけ過去へ戻します。[`plus()`](#plus) と同じ入力を受け取り、エイリアスとして `subtract()` も利用できます。

**引数**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit` と組にする数値、`Duration` インスタンス、期間文字列（英語の単位表現や ISO 形式）、またはフィールドオブジェクト。"
- name: unit
  type: DateUnit
  description: "`amount` が数値のときに指定するカレンダー単位名。"
```

**戻り値**

```returns
type: CalendarDate
description: カレンダー上で過去へ戻した新しい `CalendarDate`。
```

```js
const launch = date('2026-03-01');

launch.minus(1, 'day').toString(); // '2026-02-28'
launch.minus({ weeks: 2, days: 1 }).toString(); // '2026-02-14'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
d.startOf(unit, firstDay?): CalendarDate
```

この日付を含むカレンダー単位の最初の日を返します。週の境界は `firstDay`、[`configure()`](/api/configure/) の `weekStart`、またはこの日付に設定されたロケールの順に従います。

**引数**

```params
- name: unit
  type: DateUnit
  required: true
  description: "`'year'` から `'day'` までのカレンダー単位。"
- name: firstDay
  type: DayOfWeek
  description: 週単位で揃えるときの週の開始曜日（英語の曜日名 `'sunday'` や `7` など）。
```

**戻り値**

```returns
type: CalendarDate
description: "`unit` の最初のカレンダー日付。"
```

```js
const wed = date('2026-11-18', { locale: 'en-US' });

wed.startOf('month').toString(); // '2026-11-01'
wed.startOf('quarter').toString(); // '2026-10-01'
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
d.endOf(unit, firstDay?): CalendarDate
```

この日付を含むカレンダー単位の最終日を返します。

**引数**

```params
- name: unit
  type: DateUnit
  required: true
  description: "`'year'` から `'day'` までのカレンダー単位。"
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: CalendarDate
description: "`unit` の最後のカレンダー日付。"
```

```js
date('2026-02-10').endOf('month').toString(); // '2026-02-28'
date('2028-02-10').endOf('month').toString(); // '2028-02-29'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
d.startOfNext(unit, firstDay?): CalendarDate
```

この日付を含むカレンダー単位の「次の単位」の最初の日を返します。結果は常に元の日付より後になるため、12月1日に対して呼び出した場合も次の月の開始日である1月1日を返します。

単位の代わりに英語の曜日名を渡すと、次にその曜日となる日付を返します（[`next()`](#next) と同じ日付になります）。

**引数**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: "`'year'` から `'day'` までのカレンダー単位、または英語の曜日名（`'wednesday'` など）。"
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: CalendarDate
description: 次の `unit` の最初のカレンダー日付、または次の指定曜日。
```

```js
const mon = date('2026-11-16', { locale: 'en-US' });

mon.startOfNext('month').toString(); // '2026-12-01'
mon.startOfNext('quarter').toString(); // '2027-01-01'
mon.startOfNext('week').toString(); // '2026-11-22'
mon.startOfNext('wednesday').toString(); // '2026-11-18'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
d.startOfPrevious(unit, firstDay?): CalendarDate
```

この日付を含むカレンダー単位の「前の単位」の最初の日を返します。単位の代わりに英語の曜日名を渡すと、[`previous()`](#previous) と同様に直前のその曜日の日付を返します。

**引数**

```params
- name: unit
  type: DateUnit | Exclude<DayOfWeek, number>
  required: true
  description: "`'year'` から `'day'` までのカレンダー単位、または英語の曜日名（`'wednesday'` など）。"
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: CalendarDate
description: 前の `unit` の最初のカレンダー日付、または直前の指定曜日。
```

```js
const mon = date('2026-11-16');

mon.startOfPrevious('month').toString(); // '2026-10-01'
mon.startOfPrevious('year').toString(); // '2025-01-01'
mon.startOfPrevious('wednesday').toString(); // '2026-11-11'
```
:::

:::entry
### `next()` :kind[method]

```js signature
d.next(target): CalendarDate
```

この日付より後で、次に一致する指定曜日または [`MonthDay`](/api/month-day/) へ進めます。すでにその曜日や毎年の月日に一致している場合は、さらに次の該当日へ進みます。

**引数**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: 英語の曜日名（`'friday'` など）、ISO 曜日番号（1〜7）、または毎年繰り返す `MonthDay`。
```

**戻り値**

```returns
type: CalendarDate
description: 次に一致する日の新しい `CalendarDate`。
```

```js
import { date, monthDay } from 'native-dates';

const mon = date('2026-11-16');

mon.next('friday').toString(); // '2026-11-20'
mon.next('monday').toString(); // '2026-11-23'
mon.next(monthDay('12-25')).toString(); // '2026-12-25'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
d.previous(target): CalendarDate
```

この日付より前で、直近の指定曜日または [`MonthDay`](/api/month-day/) へ戻します。すでにその曜日や毎年の月日に一致している場合は、さらに1回前の該当日へ戻ります。

**引数**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: 英語の曜日名（3文字の省略形を含む）、ISO 曜日番号（1〜7）、または毎年繰り返す `MonthDay`。
```

**戻り値**

```returns
type: CalendarDate
description: 直前に一致する日の新しい `CalendarDate`。
```

```js
date('2026-11-16').previous('friday').toString(); // '2026-11-13'
date('2026-11-16').previous(monthDay('10-31')).toString(); // '2026-10-31'
```
:::

## 日付の比較

カレンダー日付どうしを直接比較できるほか、[`date()`](/api/date-fn/) が受け付ける任意の入力も渡せます。

:::warning[数値比較演算子は使用不可]
カレンダー日付はタイムスタンプではないため、数値演算子を使うとミリ秒へ暗黙変換せず `RangeError` をスローします。比較には [`isBefore()`](#isbefore) などのメソッドを使い、配列の並び替えには [`compare()`](/api/compare/) を使ってください。
:::

:::entry
### `equals()` :kind[method]

```js signature
d.equals(other): boolean
```

両方の値が同じカレンダーの年・月・日を表すときに `true` を返します。

**引数**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: 比較対象の `CalendarDate`、または `date()` が受け付ける任意の入力。
```

**戻り値**

```returns
type: boolean
description: 両方の値が同じカレンダー日を表す場合は `true`。
```

```js
const due = date('2026-11-16');

due.equals('2026-11-16'); // true
due.equals(date(2026, 11, 16)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
d.isBefore(other): boolean
```

この日付がカレンダー上で比較対象より前の場合に `true` を返します。

```js
date('2026-11-15').isBefore('2026-11-16'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
d.isAfter(other): boolean
```

この日付がカレンダー上で比較対象より後の場合に `true` を返します。

```js
date('2026-11-17').isAfter('2026-11-16'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
d.isSame(other, unit?, firstDay?): boolean
```

別のカレンダー日付と同じ月や同じ週など、同一のカレンダー単位に属するかを判定します。単位を省略して `isSame()` を呼び出すと、完全に同じ日かどうかを確認します。

**引数**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: 比較対象の日付。
- name: unit
  type: DateUnit
  description: 比較するカレンダー単位（`'year'` から `'day'` まで）。
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: boolean
description: 両方の日付が同じ `unit` に属する場合は `true`。
```

```js
const wed = date('2026-09-09', { locale: 'en-US' });

wed.isSame('2026-09-30', 'month'); // true
wed.isSame('2026-09-06', 'week'); // true
wed.isSame('2026-09-06', 'week', 'monday'); // false
```
:::

### カレンダー判定メソッド

今日・明日・昨日などの判定は地域によって日付が異なるため、省略可能なタイムゾーンを引数に取ります。省略した場合は [`configure()`](/api/configure/) のデフォルトのタイムゾーンが使われます。

| メソッド | 型 | 説明 |
|---|---|---|
| `isToday(zone?)`, `isTomorrow(zone?)`, `isYesterday(zone?)` | `boolean` | 指定または設定済みのタイムゾーンで、この日付が今日・明日・昨日と一致するか。 |
| `isPast(zone?)`, `isFuture(zone?)` | `boolean` | 指定または設定済みのタイムゾーンで、この日付が今日より過去か未来か。 |
| `isWeekday()`, `isWeekend()` | `boolean` | 適用中のロケールで平日か週末か（`en-US` では土日、`ar-SA` では金土など）。 |
| `isLeapYear()` | `boolean` | この日付の年が366日あるうるう年かどうか。 |

## 期間の計測

:::entry
### `until()` :kind[method]

```js signature
d.until(other): Duration
d.until(other, unit): number
```

この日付から別の日付までのカレンダー上の期間を計測します。対象がこの日付より前の場合は負の期間を返します。返される [`Duration`](/api/duration/) はこの開始日を記憶しているため、月数や年数の合計も正確に計算できます。

**引数**

```params
- name: other
  type: CalendarDateInput
  required: true
  description: 計測先の日付。
- name: unit
  type: Unit
  description: 合計の長さを浮動小数点数で返すときの単位。
```

**戻り値**

```returns
type: Duration | number
description: 日数でカウントされた `Duration`、または `unit` 指定時は数値。
```

```js
const start = date('2026-01-01');

start.until('2027-04-05').toString(); // 'P459D'
start.until('2027-04-05').balance('year').toString(); // 'P1Y3M4D'
start.until('2027-04-05', 'days'); // 459
start.until('2026-07-01').total('months'); // 6
```
:::

:::entry
### `since()` :kind[method]

```js signature
d.since(other): Duration
d.since(other, unit): number
```

より前の日付からこの日付までのカレンダー上の期間を計測します。単位名を渡すと合計を数値で返します。

```js
date('2026-11-16').since('2026-11-02', 'weeks'); // 2
```
:::

:::entry
### `to()` :kind[method]

```js signature
d.to(end): DateRange
d.to(count, unit): DateRange
d.through(end): DateRange
d.through(count, unit): DateRange
d.for(length): DateRange
d.for(count, unit): DateRange
```

この日付を開始日とし、終了日または指定した期間の長さまでをカバーする閉区間の [`DateRange`](/api/ranges/#daterange) を作成します。開始日と終了日の両方が範囲に含まれます。エイリアスとして `through()` も利用できます。期間の長さを明示的に渡したい場合は `for()` を使います（終了日や単位なしの数値は受け付けません）。

**引数**

```params
- name: end
  type: CalendarDateInput | DurationInput | number
  required: true
  description: 範囲に含める最終日、カレンダー期間、または `unit` と組にする数値 `count`。
- name: unit
  type: DateUnit
  description: 第1引数が数値のときに指定するカレンダー単位名（`'days'` や `'weeks'` など）。
```

**戻り値**

```returns
type: DateRange
description: この日付から始まる閉区間の `DateRange`。
```

```js
date('2026-11-01').to('2026-11-07').duration.days; // 7
date('2026-11-01').for(7, 'days').toString(); // '2026-11-01/2026-11-07'
```
:::

:::entry
### `range()` :kind[method]

```js signature
d.range(unit, firstDay?): DateRange
```

この日付を含むカレンダー単位について、最初の日から最終日まで全日をカバーする閉区間の [`DateRange`](/api/ranges/#daterange) を返します。

**引数**

```params
- name: unit
  type: DateUnit
  required: true
  description: "`'year'` から `'day'` までのカレンダー単位。"
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: DateRange
description: "`unit` の開始日から終了日までを含む閉区間の `DateRange`。"
```

```js
date('2026-02-10').range('month').toString(); // '2026-02-01/2026-02-28'
date('2026-11-18', { locale: 'en-US' }).range('week').toString(); // '2026-11-15/2026-11-21'
date('2026-11-18').range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```
:::

:::entry
### `every()` :kind[method]

```js signature
d.every(step, zone?): DateTime[]
d.every(count, unit, zone?): DateTime[]
```

指定または設定済みのタイムゾーンにおいて、このカレンダー日の0時から正のステップ幅で刻んだ [`DateTime`](/api/date-time/) の配列を返します。夏時間の切り替え日には、1時間刻みで自動的に23個または25個の時点を生成します。

**引数**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: 単位名（`'hour'` など）、期間（`'30m'` など）、または `unit` と組にする数値。
- name: unit
  type: Unit
  description: 第1引数が数値のときに指定する単位名。
- name: zone
  type: Zone
  description: 1日の境界を決めるタイムゾーン。省略時は設定済みのタイムゾーン。
```

**戻り値**

```returns
type: DateTime[]
description: "`zone` におけるこのカレンダー日内の時点配列。"
```

```js
const slots = date('2026-11-16').every(6, 'hours', 'UTC');

slots.length; // 4
slots[1].toString(); // '2026-11-16T06:00:00.000Z'
```
:::

:::entry
### `split()` :kind[method]

```js signature
d.split(step, zone?): DateTimeRange[]
d.split(count, unit, zone?): DateTimeRange[]
d.splitBy(step, zone?): DateTimeRange[]
d.splitBy(count, unit, zone?): DateTimeRange[]
```

指定または設定済みのタイムゾーンにおいて、このカレンダー日を連続する半開区間の [`DateTimeRange`](/api/ranges/#datetimerange) 配列に分割します。エイリアスとして `splitBy()` も利用できます。

**引数**

```params
- name: step
  type: Unit | DurationInput | number
  required: true
  description: 単位名、期間、または `unit` と組にする数値。
- name: unit
  type: Unit
  description: 第1引数が数値のときに指定する単位名。
- name: zone
  type: Zone
  description: 1日の境界を決めるタイムゾーン。省略時は設定済みのタイムゾーン。
```

**戻り値**

```returns
type: DateTimeRange[]
description: "`zone` でこの1日を隙間なく分割した `DateTimeRange` の配列。"
```

```js
const halves = date('2026-11-16').split(12, 'hours', 'UTC');

halves.map(String);
// ['2026-11-16T00:00:00.000Z/2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z/2026-11-17T00:00:00.000Z']
```
:::

## フォーマットと変換

:::entry
### `format()` :kind[method]

```js signature
d.format(spec?, locale?): string
```

組み込みのプリセット、[`configure()`](/api/configure/) で登録したカスタム名、オプションオブジェクト、またはトークンパターンを使って日付をフォーマットします。

`'L'` から `'LLLL'` までのローカライズ済みプリセットを標準で備えており、オプションオブジェクト内の時刻キーやタイムゾーンキーは自動的に無視されます。プリセットとトークンの全一覧は[フォーマット](/guides/formatting/)を参照してください。

**引数**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: 組み込みまたは設定済みのフォーマット名、`Intl` オプションオブジェクト、あるいはトークンパターン。
- name: locale
  type: string
  description: この呼び出し限定でインスタンスまたは設定済みのロケールを上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: フォーマットされた日付文字列。
```

```js
const day = date('2026-11-16');

day.format('short', 'en-US'); // '11/16/26'
day.format('medium', 'en-US'); // 'Nov 16, 2026'
day.format('long', 'en-US'); // 'November 16, 2026'
day.format('full', 'en-US'); // 'Monday, November 16, 2026'
day.format('L', 'en-US'); // '11/16/2026'
day.format('YYYY-MM-DD'); // '2026-11-16'
day.format('ddd, MMM D', 'en-US'); // 'Mon, Nov 16'
day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
```
:::

:::entry
### `from()` :kind[method]

```js signature
d.from(other?, locale?): string
d.formatRelative(other?, locale?): string
```

別の日付からこの日付までのカレンダー上の差を、`Intl.RelativeTimeFormat` を使って `'yesterday'` や `'in 3 weeks'` のようなローカライズ済み表現にフォーマットします。

第1引数を省略すると [`today()`](/api/date-fn/#today) と比較します。エイリアスとして [`formatRelative()`](#formatrelative) も利用できます。7日未満の差には「昨日」「今日」「明日」のような自然な相対日付が使われ、週・月・年は数値で表示されます。

**引数**

```params
- name: other
  type: CalendarDateInput
  description: 基準とするカレンダー日付。省略時は適用中のタイムゾーンにおける `today()`。
- name: locale
  type: Locale
  description: この呼び出し限定でインスタンスまたは設定済みのロケールを上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: ローカライズされた相対日付表現。
```

```js
const anchor = date('2026-11-16');

date('2026-11-15').from(anchor, 'en-US'); // 'yesterday'
date('2026-11-16').from(anchor, 'en-US'); // 'today'
date('2026-11-17').from(anchor, 'en-US'); // 'tomorrow'
date('2026-11-30').from(anchor, 'en-US'); // 'in 2 weeks'
date('2026-11-15').from(anchor, 'de'); // 'gestern'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
d.fromNow(locale?): string
```

今日からこの日付までの差をローカライズ表現でフォーマットします。基準日を省略して [`from()`](#from) を呼び出すのと同じです。

**引数**

```params
- name: locale
  type: Locale
  description: この呼び出し限定でインスタンスまたは設定済みのロケールを上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: 今日を基準にしたローカライズ済み相対日付表現。
```

```js
today().minus(1, 'day').fromNow('en-US'); // 'yesterday'
today().plus(3, 'days').fromNow('en-US'); // 'in 3 days'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
d.formatRelative(other?, locale?): string
```

[`from()`](#from) のエイリアスです。`other`（省略時は今日）からのカレンダー上の差をローカライズ表現でフォーマットします。
:::

:::entry
### `locale()` :kind[method]

```js signature
d.locale(): Locale | undefined
d.locale(tag): CalendarDate
```

この日付が保持しているロケールを取得するか、別のロケールを設定したコピーを返します。設定したロケールはプリセットのフォーマットや週の境界に適用され、すべての派生値にも引き継がれます。アンダースコア区切りのタグや `Accept-Language` ヘッダーは自動で正規化され、空の値を渡すと解除されます。エイリアスとして [`lang()`](#lang) も利用できます。

**引数**

```params
- name: tag
  type: Locale | null | undefined
  description: 設定して派生値へ引き継ぐ BCP 47 ロケールタグ、タグの配列、または `Accept-Language` ヘッダー。解除する場合は `null`。
```

**戻り値**

```returns
type: CalendarDate | Locale | undefined
description: 引数なしの場合は設定中のタグ、指定した場合は `tag` を保持して派生値へ引き継ぐ新しい `CalendarDate`。
```

```js
const trip = date('2026-05-15').locale('fr-FR');

trip.locale(); // 'fr-FR'
trip.format('long'); // '15 mai 2026'
trip.to('2026-05-19').format('long'); // '15–19 mai 2026'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
d.lang(): Locale | undefined
d.lang(tag): CalendarDate
```

[`locale()`](#locale) の短縮エイリアスです。この日付に紐づく BCP 47 ロケールタグの取得または設定を行います。
:::

:::entry
### `as()` :kind[method]

```js signature
d.as('date'): CalendarDate
d.as('datetime', zone?): DateTime
d.as('yearMonth'): YearMonth
d.as('monthDay'): MonthDay
```

メソッドチェーンの途中で、[`YearMonth`](/api/year-month/) や [`MonthDay`](/api/month-day/) などの別型へ変換します。日時（`'datetime'`）へ変換した場合は、指定または設定済みのタイムゾーンにおけるこの日付の0時を返します。

**引数**

```params
- name: kind
  type: "'date' | 'datetime' | 'yearMonth' | 'monthDay'"
  required: true
  description: このカレンダー日付を変換する対象の種別。
- name: zone
  type: Zone
  description: "`'datetime'` へ変換する際に使うタイムゾーン。省略時は設定済みのタイムゾーン。"
```

**戻り値**

```returns
type: CalendarDate | DateTime | YearMonth | MonthDay
description: 変換後の値。
```

```js
const due = date('2026-11-16');

due.as('datetime', 'UTC').toString(); // '2026-11-16T00:00:00.000Z'
due.as('yearMonth').toString(); // '2026-11'
due.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
d.toString(): string
d.toJSON(): string
```

日付を ISO 8601 の `YYYY-MM-DD` 文字列で返します。`toJSON()` は `JSON.stringify()` 向けに同じ文字列を返します。

**戻り値**

```returns
type: string
description: ISO 8601 の日付文字列（`'2026-11-16'` など）。
```

```js
const due = date('2026-11-16');

due.toString(); // '2026-11-16'
JSON.stringify({ due }); // '{"due":"2026-11-16"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
d.toJSDate(zone?): Date
```

指定または設定済みのタイムゾーンにおける、この日付の0時を表す JavaScript 標準の `Date` インスタンスを返します。
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
d.toTemporal(): Temporal.PlainDate
```

内部の `Temporal.PlainDate` インスタンスを返します。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
d.valueOf(): never
```

数値演算子によってカレンダー日付が暗黙的に数値へ変換されないよう、`RangeError` をスローします。
:::
