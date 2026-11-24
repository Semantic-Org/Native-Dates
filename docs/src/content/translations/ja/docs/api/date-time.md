---
source: "62b87452c7ee"
title: DateTime
lede: あるタイムゾーンから見た特定の時点。
---

## DateTime の作成

[`datetime()`](/api/datetime-fn/) で既存の値からインスタンスを作成するか、[`now()`](/api/datetime-fn/#now) で現在の日時を取得するか、[`at()`](/api/calendar-date/#at) でカレンダー日付と時刻を結合して作成します。インスタンスはイミュータブルであり、値を変更するメソッドは元の値を変更せず、常に新しいインスタンスを返します。

```js title="create.js"
import { date, datetime, now } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const current = now();
```

タイムゾーンを渡すと、そのタイムゾーンから見た瞬間としてインスタンスを作成します。省略した場合は [`configure()`](/api/configure/) で設定されたデフォルトのタイムゾーンが使われます。

```js
const event = datetime('2026-11-16T17:30:00Z', 'America/New_York');
event.zone; // 'America/New_York'
event.hour; // 12
```

:::note[オフセットは時点を決め、タイムゾーンは決めない]
入力文字列の末尾にある `Z` や数値のオフセットは「その瞬間がいつ起きたか」を特定するために使われ、インスタンス自体のタイムゾーンには引数で渡したタイムゾーンまたは設定済みのデフォルトが使われます。UTC 基準のフィールド取得や日付計算を行いたい場合は、タイムゾーンに `'UTC'` を渡してください。
:::

## プロパティ

各プロパティは、このインスタンスのタイムゾーンにおける日付と時刻を返します。

| プロパティ | 型 | 説明 |
|---|---|---|
| `text` | `string` | ロケールに合わせてフォーマットされた日付・時刻・短縮タイムゾーン名（例：`'Nov 16, 2026, 9:30 AM PST'`）。 |
| `year`, `month`, `day` | `number` | カレンダーの年、月（1〜12）、日（1〜31）。 |
| `hour`, `minute`, `second` | `number` | 24時間制の時（0〜23）、分（0〜59）、秒（0〜59）。 |
| `millisecond`, `microsecond`, `nanosecond` | `number` | 秒未満のフィールド（0〜999）。 |
| `zone` | `string` | 正規化された IANA タイムゾーン ID または固定オフセット（例：`'America/Los_Angeles'`、`'UTC'`）。 |
| `offset` | `string` | この瞬間における有効な UTC オフセット（例：`'-08:00'`）。 |
| `epochSeconds` | `number` | Unix エポックからの経過秒数（切り下げ）。 |
| `epochMilliseconds` | `number` | Unix エポックからの経過ミリ秒数。 |
| `epochNanoseconds` | `bigint` | Unix エポックからの正確な経過ナノ秒数。 |
| `date` | [`CalendarDate`](/api/calendar-date/) | このタイムゾーンにおけるカレンダー日付。 |
| `time` | [`Time`](/api/time/) | このタイムゾーンにおける時刻。 |
| `yearMonth` | [`YearMonth`](/api/year-month/) | このタイムゾーンにおける年月。 |
| `monthDay` | [`MonthDay`](/api/month-day/) | このタイムゾーンにおける月日。 |
| `dayOfWeek` | `number` | ISO 曜日番号（1：月曜〜7：日曜）。 |
| `weekStart` | `number` | この時点における週の開始曜日（1〜7。[`configure()`](/api/configure/) の設定またはロケールに従う）。 |
| `quarter` | `number` | 四半期（1〜4）。 |
| `weekOfYear`, `dayOfYear` | `number` | ISO 週番号（1〜53）および年間通算日（1〜366）。 |
| `daysInMonth`, `daysInYear`, `hoursInDay` | `number` | その月の日数、その年の日数、およびこのタイムゾーンにおける1日の時間数。 |

## タイムゾーンとフィールド

同じ時点を別のタイムゾーンで表示したり、個々のカレンダー・時刻フィールドを置き換えたりします。

:::entry
### `in()` :kind[method]

```js signature
dt.in(zone): DateTime
```

同じ瞬間を別のタイムゾーンから見た新しい `DateTime` を返します。日付や時刻のプロパティは指定したタイムゾーンに合わせて更新されますが、内部のタイムスタンプは変わりません。

**引数**

```params
- name: zone
  type: Zone
  required: true
  description: IANA タイムゾーン名（`'Europe/Berlin'` など）、固定 UTC オフセット、または `'UTC'`。
```

**戻り値**

```returns
type: DateTime
description: 同じ瞬間を `zone` から見た新しい `DateTime`。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');

berlin.hour; // 18
berlin.equals(standup); // true
```
:::

:::entry
### `at()` :kind[method]

```js signature
dt.at(time): DateTime
```

同じ日付・同じタイムゾーンのまま、時刻だけを置き換えた新しい `DateTime` を返します。

**引数**

```params
- name: time
  type: TimeInput
  required: true
  description: 時刻文字列（`'9:30am'` など）、`Time` インスタンス、フィールドオブジェクト、または `Date`。
```

**戻り値**

```returns
type: DateTime
description: 同じ日付で時刻を `time` に置き換えた新しい `DateTime`。
```

```js
const morning = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const wrapUp = morning.at('5:00pm');

wrapUp.hour; // 17
```
:::

:::entry
### `set()` :kind[method]

```js signature
dt.set(fields): DateTime
dt.set(unit, value): DateTime
```

現在のタイムゾーンのまま、1つ以上のカレンダーまたは時刻フィールドを置き換えた新しい `DateTime` を返します。2月30日のような範囲外の日付は翌月に繰り上がらず、`RangeError` をスローします。`day` を指定せずに `month` や `year` だけを更新して日がオーバーフローする場合は、対象月の末日にクランプされます。

**引数**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: カレンダーまたは時刻フィールドのオブジェクト、あるいは `value` と組にする単一の単位名。
- name: value
  type: number
  description: 指定した `unit` に設定する整数値。
```

**戻り値**

```returns
type: DateTime
description: 同じタイムゾーンでフィールドを更新した新しい `DateTime`。
```

```js
const cutoff = datetime('2026-11-16T09:30', 'America/New_York');

cutoff.set('hour', 17);
cutoff.set({ month: 12, day: 1, hour: 0, minute: 0 });
```
:::

## 演算と丸め

日・週・月・年を加算すると、夏時間（DST）の切り替えをまたいでも同じ時刻を維持します。時間・分・秒の加算は正確な経過時間をカウントします。

:::entry
### `plus()` :kind[method]

```js signature
dt.plus(amount, unit?): DateTime
dt.add(amount, unit?): DateTime
```

指定した期間だけ未来へ進めた新しい `DateTime` を同じタイムゾーンで返します。エイリアスとして `add()` も利用できます。

**引数**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit` と組にする数値、`Duration` インスタンス、期間文字列（英語の単位表現や ISO 形式）、フィールドオブジェクト、またはミリ秒数。"
- name: unit
  type: Unit
  description: "`amount` が数値のときに指定する単位名（`'days'` や `'hours'` など）。"
```

**戻り値**

```returns
type: DateTime
description: 同じタイムゾーンの新しい `DateTime`。
```

```js
// ニューヨークで夏時間へ切り替わる週末（3月8日は23時間）
const sat = datetime('2026-03-07T09:00', 'America/New_York');

sat.plus(1, 'day').hour; // 9
sat.plus(24, 'hours').hour; // 10
sat.plus('1h 30m').format('time', 'en-US'); // '10:30 AM'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dt.minus(amount, unit?): DateTime
dt.subtract(amount, unit?): DateTime
```

指定した期間だけ過去へ戻した新しい `DateTime` を同じタイムゾーンで返します。[`plus()`](#plus) と同じ入力を受け取り、エイリアスとして `subtract()` も利用できます。

**引数**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit` と組にする数値、`Duration`、英語の単位表現、ISO 期間文字列、またはフィールドオブジェクト。"
- name: unit
  type: Unit
  description: "`amount` が数値のときに指定する単位名。"
```

**戻り値**

```returns
type: DateTime
description: 同じタイムゾーンの新しい `DateTime`。
```

```js
const deadline = datetime('2026-11-16T17:00', 'America/New_York');

deadline.minus(48, 'hours');
deadline.minus({ weeks: 1, days: 2 });
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
dt.startOf(unit, firstDay?): DateTime
```

このタイムゾーンにおける指定したカレンダー単位または時刻単位の開始時点へ戻します。週の境界は `firstDay`、[`configure()`](/api/configure/) の `weekStart`、またはこの時点に設定されたロケールの順に従います。

**引数**

```params
- name: unit
  type: Unit
  required: true
  description: "`'year'` から `'millisecond'` までのカレンダー単位または時刻単位。"
- name: firstDay
  type: DayOfWeek
  description: 週単位で揃えるときの週の開始曜日（英語の曜日名 `'sunday'` や `7` など）。
```

**戻り値**

```returns
type: DateTime
description: "`unit` の開始時点を表す新しい `DateTime`。"
```

```js
const wed = datetime('2026-11-18T14:45:12', 'America/New_York').locale('en-US');

wed.startOf('day').format('time'); // '12:00 AM'
wed.startOf('week').day; // 15
wed.startOf('week', 'monday').day; // 16
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
dt.endOf(unit, firstDay?): DateTime
```

このタイムゾーンにおける指定カレンダー単位または時刻単位の最後のミリ秒へ移動します。

**引数**

```params
- name: unit
  type: Unit
  required: true
  description: "`'year'` から `'nanosecond'` までのカレンダー単位または時刻単位。"
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: DateTime
description: "`unit` の最後のミリ秒を表す新しい `DateTime`。"
```

```js
const nov = datetime('2026-11-18T14:45', 'UTC');

nov.endOf('month').toString(); // '2026-11-30T23:59:59.999Z'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
dt.startOfNext(unit, firstDay?): DateTime
```

このタイムゾーンで、現在の時点を含むカレンダー単位または時刻単位の「次の単位」の開始時点へ進めます。結果は常に元の時点より後になるため、0時ちょうどから呼び出した場合も翌日の0時を返します。

単位の代わりに英語の曜日名を渡すと、次にその曜日となる日の開始時点（0時）を返します。同じ日を求めつつ時刻を維持したい場合は [`next()`](#next) を呼び出してください。

**引数**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: "`'year'` から `'nanosecond'` までのカレンダー単位・時刻単位、または英語の曜日名（`'wednesday'` など）。"
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: DateTime
description: 次の `unit`、または次の指定曜日の開始時点を表す新しい `DateTime`。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfNext('month').text; // 'Dec 1, 2026, 12:00 AM EST'
standup.startOfNext('hour').text; // 'Nov 16, 2026, 10:00 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
dt.startOfPrevious(unit, firstDay?): DateTime
```

このタイムゾーンで、現在の時点を含むカレンダー単位または時刻単位の「前の単位」の開始時点へ戻します。単位の代わりに英語の曜日名を渡すと、直前のその曜日の開始時点を返します。時刻を維持したい場合は [`previous()`](#previous) を使用してください。

**引数**

```params
- name: unit
  type: Unit | Exclude<DayOfWeek, number>
  required: true
  description: "`'year'` から `'nanosecond'` までのカレンダー単位・時刻単位、または英語の曜日名（`'wednesday'` など）。"
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: DateTime
description: 前の `unit`、または直前の指定曜日の開始時点を表す新しい `DateTime`。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.startOfPrevious('day').text; // 'Nov 15, 2026, 12:00 AM EST'
standup.startOfPrevious('month').text; // 'Oct 1, 2026, 12:00 AM EDT'
standup.startOfPrevious('wednesday').text; // 'Nov 11, 2026, 12:00 AM EST'
```
:::

:::entry
### `next()` :kind[method]

```js signature
dt.next(target): DateTime
```

同じ時刻を保ったまま、次の指定曜日または [`MonthDay`](/api/month-day/) へ進めます。すでにその曜日や毎年の月日に一致している場合は、さらに次の該当日へ進みます。

**引数**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: 英語の曜日名（`'friday'` など）、ISO 曜日番号（1〜7）、または毎年繰り返す `MonthDay`。
```

**戻り値**

```returns
type: DateTime
description: 同じ時刻のまま次に一致する日付へ進めた新しい `DateTime`。
```

```js
import { datetime, monthDay } from 'native-dates';

const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.next('friday').day; // 20
mon.next('monday').day; // 23
mon.next(monthDay('12-25')).month; // 12
```
:::

:::entry
### `previous()` :kind[method]

```js signature
dt.previous(target): DateTime
```

同じ時刻を保ったまま、この日付より前で直近の指定曜日または [`MonthDay`](/api/month-day/) へ戻します。

**引数**

```params
- name: target
  type: DayOfWeek | MonthDay
  required: true
  description: 英語の曜日名（3文字の省略形を含む）、ISO 曜日番号（1〜7）、または毎年繰り返す `MonthDay`。
```

**戻り値**

```returns
type: DateTime
description: 同じ時刻のまま直前に一致する日付へ戻した新しい `DateTime`。
```

```js
const mon = datetime('2026-11-16T09:30', 'America/Los_Angeles');

mon.previous('friday').day; // 13
mon.previous(monthDay('10-31')).month; // 10
```
:::

:::entry
### `round()` :kind[method]

```js signature
dt.round(unit): DateTime
dt.round(increment, unit): DateTime
```

最も近い単位または刻み幅に丸めます。ちょうど中間の値は切り上げます。

**引数**

```params
- name: increment
  type: number | Unit
  required: true
  description: 上位の単位を割り切れる刻み幅、または刻み幅を `1` とするときの対象 `unit`。
- name: unit
  type: Unit
  description: 丸め対象の単位（`'day'` から `'nanosecond'` まで）。
```

**戻り値**

```returns
type: DateTime
description: 同じタイムゾーンで丸められた新しい `DateTime`。
```

```js
const stamp = datetime('2026-11-16T09:23:40', 'UTC');

stamp.round('hour').toString(); // '2026-11-16T09:00:00.000Z'
stamp.round(15, 'minutes').toString(); // '2026-11-16T09:30:00.000Z'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
dt.floor(unit): DateTime
dt.floor(increment, unit): DateTime
```

指定した単位または刻み幅の開始時点へ切り下げます。[`round()`](#round) と同じ引数を受け取ります。

```js
datetime('2026-11-16T09:29:00Z').floor(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
dt.ceil(unit): DateTime
dt.ceil(increment, unit): DateTime
```

次の単位または刻み幅へ切り上げます。[`round()`](#round) と同じ引数を受け取ります。

```js
datetime('2026-11-16T09:01:00Z').ceil(15, 'minutes').toString(); // '2026-11-16T09:15:00.000Z'
```
:::

## 時点の比較

2つの値が異なるタイムゾーンを持っていても、それぞれが指す瞬間の前後を比較します。

:::warning[=== による比較]
JavaScript の `===` 演算子は、2つの変数がメモリ上の同一オブジェクトを指しているかどうかを比較します。2つの `DateTime` インスタンスが同じ時点を表すか確認するには [`equals()`](#equals) を呼び出してください。
:::

:::entry
### `equals()` :kind[method]

```js signature
dt.equals(other): boolean
```

タイムゾーンの違いに関わらず、両方の値がまったく同じ瞬間を表すときに `true` を返します。

**引数**

```params
- name: other
  type: DateTimeInput
  required: true
  description: 比較対象の `DateTime`、または `datetime()` が受け付ける任意の入力。
```

**戻り値**

```returns
type: boolean
description: 両方の値が同じ瞬間を指す場合は `true`。
```

```js
const ny = datetime('2026-11-16T12:00', 'America/New_York');
const utc = datetime('2026-11-16T17:00Z', 'UTC');

ny.equals(utc); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
dt.isBefore(other): boolean
```

この時点が比較対象より前の場合に `true` を返します。

```js
datetime('2026-11-16T16:59Z').isBefore('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
dt.isAfter(other): boolean
```

この時点が比較対象より後の場合に `true` を返します。

```js
datetime('2026-11-16T17:01Z').isAfter('2026-11-16T17:00Z'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
dt.isSame(other, unit?, firstDay?): boolean
```

両方の時点をこのインスタンスのタイムゾーンから見たとき、同じカレンダー単位または時刻単位に属するかを判定します。単位を省略して `isSame()` を呼び出すと、瞬間としての完全一致を確認します。

**引数**

```params
- name: other
  type: DateTimeInput
  required: true
  description: 比較対象の時点（このインスタンスのタイムゾーンで評価）。
- name: unit
  type: Unit
  description: 比較するカレンダー単位または時刻単位（`'day'` や `'month'` など）。
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: boolean
description: このタイムゾーンで両方の時点が同じ `unit` に属する場合は `true`。
```

```js
const la = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const lateUtc = datetime('2026-11-17T02:00Z', 'UTC');

la.isSame(lateUtc, 'day'); // true（ロサンゼルス時間では11月16日 18:00）
lateUtc.isSame(la, 'day'); // false（UTC では11月17日と11月16日）
```
:::

### カレンダー判定メソッド

このインスタンスのタイムゾーンで評価される引数なしの判定メソッドです。

| メソッド | 型 | 説明 |
|---|---|---|
| `isPast()`, `isFuture()` | `boolean` | この瞬間が現在より過去か未来か。 |
| `isToday()`, `isTomorrow()`, `isYesterday()` | `boolean` | このタイムゾーンにおけるカレンダー日付が今日・明日・昨日と一致するか。 |
| `isWeekday()`, `isWeekend()` | `boolean` | 適用中のロケールで平日か週末か（`en-US` では土日、`ar-SA` では金土など）。 |
| `isLeapYear()` | `boolean` | このタイムゾーンにおける年がうるう年かどうか。 |

## 時間の計測

:::entry
### `until()` :kind[method]

```js signature
dt.until(other): Duration
dt.until(other, unit): number
```

この時点から別の時点までの時間差を計測します。対象がこの時点より前の場合は負の期間を返します。単位名を渡すと、[`Duration`](/api/duration/) ではなく合計の長さを単一の数値で取得できます。

**引数**

```params
- name: other
  type: DateTimeInput
  required: true
  description: 計測先の時点。
- name: unit
  type: Unit
  description: 合計の長さを浮動小数点数で返すときの単位。
```

**戻り値**

```returns
type: Duration | number
description: 日数と時刻単位で表した `Duration`、または `unit` 指定時は数値。
```

```js
const doors = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

doors.until(standup).format('long', 'en-US'); // '1 hour, 30 minutes'
doors.until(standup, 'hours'); // 1.5
```
:::

:::entry
### `since()` :kind[method]

```js signature
dt.since(other): Duration
dt.since(other, unit): number
```

より前の時点からこの時点までの時間差を計測します。単位名を渡すと合計を数値で返します。

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.since('2026-11-16T08:00', 'minutes'); // 90
```
:::

:::entry
### `to()` :kind[method]

```js signature
dt.to(end): DateTimeRange
dt.to(count, unit): DateTimeRange
dt.for(length): DateTimeRange
dt.for(count, unit): DateTimeRange
```

この時点を開始時点とし、指定した終了時点、または指定期間が経過した時点の手前まで（終端を含まない）の半開区間 [`DateTimeRange`](/api/ranges/#datetimerange) を作成します。終了時点が開始時点より前の場合は `RangeError` をスローします。期間の長さを明示的に渡したい場合は `for()` を使います（終了時点や単位なしの数値は受け付けません）。

**引数**

```params
- name: end
  type: DateTimeInput | DurationInput | number
  required: true
  description: 終了時点、期間、または `unit` と組にする数値 `count`。
- name: unit
  type: Unit
  description: 第1引数が数値のときに指定する単位名（`'hours'` や `'days'` など）。
```

**戻り値**

```returns
type: DateTimeRange
description: このインスタンスのタイムゾーンにおける半開区間の `DateTimeRange`。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.to('2026-11-16T10:00').duration.minutes; // 30
standup.for(2, 'hours').end.hour; // 11
```
:::

:::entry
### `range()` :kind[method]

```js signature
dt.range(unit, firstDay?): DateTimeRange
```

この時点を含むカレンダー単位または時刻単位について、その開始時点から次の単位の開始時点（終端を含まない）までの半開区間 [`DateTimeRange`](/api/ranges/#datetimerange) を返します。

**引数**

```params
- name: unit
  type: Unit
  required: true
  description: "`'year'` から `'nanosecond'` までのカレンダー単位または時刻単位。"
- name: firstDay
  type: DayOfWeek
  description: "`unit` が `'week'` のときの週の開始曜日。"
```

**戻り値**

```returns
type: DateTimeRange
description: このタイムゾーンで `unit` 全体を表す半開区間の `DateTimeRange`。
```

```js
const event = datetime('2026-11-16T14:45', 'UTC');

event.range('day').toString();
// '2026-11-16T00:00:00.000Z/2026-11-17T00:00:00.000Z'
```
:::

## フォーマットと変換

:::entry
### `format()` :kind[method]

```js signature
dt.format(spec?, locale?): string
```

組み込みのプリセット、[`configure()`](/api/configure/) で登録したカスタム名、`Intl` オプションオブジェクト、またはトークンパターンを使って、現在のタイムゾーンで日時をフォーマットします。

`'LT'` から `'llll'` までのローカライズ済みプリセットと、そのまま出力する語句を囲む `[角括弧]` を標準でサポートしています。プリセットとトークンの全一覧は[フォーマット](/guides/formatting/)を参照してください。

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
description: このインスタンスのタイムゾーンでフォーマットされた文字列。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('medium', 'en-US'); // 'Nov 16, 2026, 9:30 AM'
standup.format('full', 'en-US'); // 'Monday, November 16, 2026 at 9:30 AM'
standup.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
standup.format('text', 'en-US'); // 'Nov 16, 2026, 9:30 AM PST'
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('MMM D [at] h:mm a', 'en-US'); // 'Nov 16 at 9:30 am'
standup.format(
  { weekday: 'short', hour: '2-digit', minute: '2-digit' },
  'de-DE',
); // 'Mo., 09:30'
```
:::

:::entry
### `from()` :kind[method]

```js signature
dt.from(other?, locale?): string
dt.formatRelative(other?, locale?): string
```

別の時点からこの時点までの時間差を、`Intl.RelativeTimeFormat` を使って `'3 hours ago'` や `'in 2 days'` のようなローカライズ済み表現にフォーマットします。

第1引数を省略すると現在時点と比較します。エイリアスとして [`formatRelative()`](#formatrelative) も利用できます。差が0秒のときは `'now'` となり、日・月・年には「昨日」のようなカレンダー表現ではなく数値が使われます。

**引数**

```params
- name: other
  type: DateTimeInput
  description: 基準とする時点。タイムゾーン未指定の入力はこのインスタンスのタイムゾーンで解釈。省略時は現在時点。
- name: locale
  type: Locale
  description: この呼び出し限定でインスタンスまたは設定済みのロケールを上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: ローカライズされた相対時間表現。
```

```js
const anchor = datetime('2026-11-16T12:00', 'UTC');

anchor.from(anchor, 'en-US'); // 'now'
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'
anchor.plus(45, 'minutes').from(anchor, 'en-US'); // 'in 1 hour'
anchor.minus(3, 'hours').from(anchor, 'es'); // 'hace 3 horas'
```
:::

:::entry
### `fromNow()` :kind[method]

```js signature
dt.fromNow(locale?): string
```

現在時点からこの時点までの相対時間をローカライズ表現でフォーマットします。基準時点を省略して [`from()`](#from) を呼び出すのと同じです。

**引数**

```params
- name: locale
  type: Locale
  description: この呼び出し限定でインスタンスまたは設定済みのロケールを上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: 現在時点を基準にしたローカライズ済み相対時間表現。
```

```js
now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
now().plus(2, 'hours').fromNow('en-US'); // 'in 2 hours'
```
:::

:::entry
### `formatRelative()` :kind[method]

```js signature
dt.formatRelative(other?, locale?): string
```

[`from()`](#from) のエイリアスです。`other`（省略時は現在時点）からの時間差をローカライズ表現でフォーマットします。
:::

:::entry
### `locale()` :kind[method]

```js signature
dt.locale(): Locale | undefined
dt.locale(tag): DateTime
```

この時点が保持しているロケールを取得するか、別のロケールを設定したコピーを返します。設定したロケールはプリセットのフォーマットや週の境界に適用され、すべての派生値にも引き継がれます。アンダースコア区切りのタグや `Accept-Language` ヘッダーは自動で正規化され、空の値を渡すと解除されます。エイリアスとして [`lang()`](#lang) も利用できます。

**引数**

```params
- name: tag
  type: Locale | null | undefined
  description: 設定して派生値へ引き継ぐ BCP 47 ロケールタグ、タグの配列、または `Accept-Language` ヘッダー。解除する場合は `null`。
```

**戻り値**

```returns
type: DateTime | Locale | undefined
description: 引数なしの場合は設定中のタグ、指定した場合は `tag` を保持して派生値へ引き継ぐ新しい `DateTime`。
```

```js
const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');

standup.locale(); // 'es-ES'
standup.plus(1, 'week').date.format('long'); // '23 de noviembre de 2026'
standup.locale(null).locale(); // undefined
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dt.lang(): Locale | undefined
dt.lang(tag): DateTime
```

[`locale()`](#locale) の短縮エイリアスです。この時点に紐づく BCP 47 ロケールタグの取得または設定を行います。
:::

:::entry
### `as()` :kind[method]

```js signature
dt.as('datetime'): DateTime
dt.as('date'): CalendarDate
dt.as('time'): Time
dt.as('yearMonth'): YearMonth
dt.as('monthDay'): MonthDay
```

プロパティアクセスでメソッドチェーンを途切れさせることなく、現在のタイムゾーンのまま別の型へ変換します。[`YearMonth`](/api/year-month/) や [`MonthDay`](/api/month-day/) への変換にも対応しています。

**引数**

```params
- name: kind
  type: "'datetime' | 'date' | 'time' | 'yearMonth' | 'monthDay'"
  required: true
  description: 現在のタイムゾーンで変換する対象の種別。
```

**戻り値**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay
description: このインスタンスのタイムゾーンで変換された値。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.in('Asia/Tokyo').as('date').toString(); // '2026-11-17'
standup.in('Asia/Tokyo').as('time').toString(); // '02:30:00'
standup.as('yearMonth').toString(); // '2026-11'
standup.as('monthDay').toString(); // '11-16'
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dt.toString(): string
dt.toJSON(): string
```

データベース保存・URL・ネットワーク送信に適した UTC の ISO 8601 文字列を返します。`toJSON()` は `JSON.stringify()` 向けに同じ文字列を返します。

**戻り値**

```returns
type: string
description: UTC の ISO 8601 タイムスタンプ（`'2026-11-16T17:30:00.000Z'` など）。
```

```js
const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.toString(); // '2026-11-16T17:30:00.000Z'
JSON.stringify({ standup }); // '{"standup":"2026-11-16T17:30:00.000Z"}'
```
:::

:::entry
### `toJSDate()` :kind[method]

```js signature
dt.toJSDate(): Date
```

同じ瞬間を表す JavaScript 標準の `Date` インスタンスを返します。
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dt.toTemporal(): Temporal.ZonedDateTime
```

内部の `Temporal.ZonedDateTime` インスタンスを返します。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dt.valueOf(): number
```

エポックミリ秒を返します。これにより、2つの `DateTime` を減算したり数値演算子で比較したりできます。
:::
