---
source: "3e14665094ab"
title: Time
lede: 日付もタイムゾーンも持たない時刻。
---

## Time の作成

[`time()`](/api/time-fn/) を使って、12時間制・24時間制の時刻文字列を解析するか、時・分の数値を渡すか、既存の値を変換してインスタンスを作成します。インスタンスはイミュータブルであり、値を変更するメソッドは元の値を変更せず、常に新しいインスタンスを返します。

```js title="create.js"
import { time } from 'native-dates';

const morning = time('9:30am');
const evening = time('17:30');
const alarm = time(6, 45);
```

任意の [`DateTime`](/api/date-time/) の `time` プロパティから、そのタイムゾーンの時刻を取り出すこともできます。

```js
import { datetime, now } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.time.toString(); // '09:30:00'
const currentClock = now().time;
```

## プロパティ

各プロパティは、時からナノ秒までの24時間制フィールドを返します。

| プロパティ | 型 | 説明 |
|---|---|---|
| `text` | `string` | ロケールに合わせてフォーマットされた時刻（例：`'9:30 AM'`）。 |
| `hour`, `minute`, `second` | `number` | 24時間制の時（0〜23）、分（0〜59）、秒（0〜59）。 |
| `millisecond`, `microsecond`, `nanosecond` | `number` | 秒未満のフィールド（0〜999）。 |

## 結合とフィールド

時刻とカレンダー日付を組み合わせたり、個々の時刻フィールドを置き換えたりします。

:::entry
### `on()` :kind[method]

```js signature
t.on(date, zone?): DateTime
```

この時刻にカレンダー日付とタイムゾーンを結合し、[`DateTime`](/api/date-time/) を返します。[`CalendarDate`](/api/calendar-date/) の [`at()`](/api/calendar-date/#at) と対になるメソッドです。

**引数**

```params
- name: date
  type: CalendarDateInput
  required: true
  description: ISO 日付文字列、`CalendarDate`、`DateTime`、フィールドオブジェクト、または `Date`。
- name: zone
  type: Zone
  description: IANA タイムゾーン名、固定 UTC オフセット、または `'UTC'`。省略時は設定済みのタイムゾーン。
```

**戻り値**

```returns
type: DateTime
description: "`date` とこの時刻を `zone` で結合した新しい `DateTime`。"
```

```js
const opens = time('9:30am');

opens.on('2026-11-16', 'America/New_York').toString(); // '2026-11-16T14:30:00.000Z'
```
:::

:::entry
### `set()` :kind[method]

```js signature
t.set(fields): Time
t.set(unit, value): Time
```

1つ以上の時刻フィールドを置き換えた新しい `Time` を返します。75分のような範囲外の値を渡すと `RangeError` をスローします。

**引数**

```params
- name: fields
  type: DateTimeFields | Unit
  required: true
  description: 時刻フィールドのオブジェクト、または `value` と組にする単一の単位名。
- name: value
  type: number
  description: 指定した `unit` に設定する整数値。
```

**戻り値**

```returns
type: Time
description: 時刻フィールドを更新した新しい `Time`。
```

```js
const reminder = time('9:30am');

reminder.set('minute', 45).toString(); // '09:45:00'
reminder.set({ hour: 17, minute: 0 }).toString(); // '17:00:00'
```
:::

## 演算と丸め

時刻単位の加減算、単位境界への移動、刻み幅での丸めを行います。時刻は日付を持たないため、日や週などのカレンダー単位を渡すと `RangeError` をスローします。

:::note[0時をまたぐ折り返し]
時刻の演算は時計の文字盤のように24時間の枠内で折り返すため、23:00 に2時間を足すと 01:00 になります。0時をまたいだときに日付を進めたい場合は、先に [`on()`](#on) で日付と結合してください。
:::

:::entry
### `plus()` :kind[method]

```js signature
t.plus(amount, unit?): Time
t.add(amount, unit?): Time
```

24時間制の時刻を進め、必要に応じて0時をまたいで折り返した新しい `Time` を返します。エイリアスとして `add()` も利用できます。

**引数**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit` と組にする数値、`Duration` インスタンス、期間文字列（英語の単位表現や ISO 形式）、フィールドオブジェクト、またはミリ秒数。"
- name: unit
  type: Unit
  description: "`amount` が数値のときに指定する時刻単位名（`'hours'` や `'minutes'` など）。"
```

**戻り値**

```returns
type: Time
description: 24時間内に折り返された新しい `Time`。
```

```js
time('9:00am').plus(90, 'minutes').toString(); // '10:30:00'
time('23:00').plus('2h').toString(); // '01:00:00'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
t.minus(amount, unit?): Time
t.subtract(amount, unit?): Time
```

24時間制の時刻を戻し、必要に応じて0時をまたいで折り返します。[`plus()`](#plus) と同じ入力を受け取り、エイリアスとして `subtract()` も利用できます。

**引数**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit` と組にする数値、`Duration` インスタンス、期間文字列（英語の単位表現や ISO 形式）、フィールドオブジェクト、またはミリ秒数。"
- name: unit
  type: Unit
  description: "`amount` が数値のときに指定する時刻単位名。"
```

**戻り値**

```returns
type: Time
description: 24時間内に折り返された新しい `Time`。
```

```js
time('00:30').minus(45, 'minutes').toString(); // '23:45:00'
```
:::

:::entry
### `startOf()` :kind[method]

```js signature
t.startOf(unit): Time
```

指定した単位より小さい時刻フィールドをすべて 0 にします。

**引数**

```params
- name: unit
  type: Unit
  required: true
  description: "`'hour'` から `'nanosecond'` までの時刻単位。"
```

**戻り値**

```returns
type: Time
description: "`unit` の開始時刻を表す新しい `Time`。"
```

```js
time('14:37:22').startOf('hour').toString(); // '14:00:00'
```
:::

:::entry
### `endOf()` :kind[method]

```js signature
t.endOf(unit): Time
```

指定した時刻単位の最後のミリ秒へ移動します。

**引数**

```params
- name: unit
  type: Unit
  required: true
  description: "`'hour'` から `'nanosecond'` までの時刻単位。"
```

**戻り値**

```returns
type: Time
description: "`unit` の最後のミリ秒を表す新しい `Time`。"
```

```js
time('14:37:22').endOf('hour').toString(); // '14:59:59.999'
```
:::

:::entry
### `startOfNext()` :kind[method]

```js signature
t.startOfNext(unit): Time
```

この時刻を含む単位の「次の単位」の開始時刻へ進めます（0時をまたぐ場合は折り返します）。常に次の単位へ進むため、`14:00:00` に対して `startOfNext('hour')` を呼び出すと `15:00:00` を返します。

**引数**

```params
- name: unit
  type: Unit
  required: true
  description: "`'hour'` から `'nanosecond'` までの時刻単位。"
```

**戻り値**

```returns
type: Time
description: 次の `unit` の開始時刻を表す新しい `Time`。
```

```js
time('14:37:22').startOfNext('hour').toString(); // '15:00:00'
time('23:37:22').startOfNext('hour').toString(); // '00:00:00'
```
:::

:::entry
### `startOfPrevious()` :kind[method]

```js signature
t.startOfPrevious(unit): Time
```

この時刻を含む単位の「前の単位」の開始時刻へ戻します（0時をまたぐ場合は折り返します）。

**引数**

```params
- name: unit
  type: Unit
  required: true
  description: "`'hour'` から `'nanosecond'` までの時刻単位。"
```

**戻り値**

```returns
type: Time
description: 前の `unit` の開始時刻を表す新しい `Time`。
```

```js
time('14:37:22').startOfPrevious('hour').toString(); // '13:00:00'
time('00:15:00').startOfPrevious('hour').toString(); // '23:00:00'
```
:::

:::entry
### `round()` :kind[method]

```js signature
t.round(unit): Time
t.round(increment, unit): Time
```

最も近い時刻単位または刻み幅に丸めます。ちょうど中間の値は切り上げます。

**引数**

```params
- name: increment
  type: number | Unit
  required: true
  description: 上位の単位を割り切れる刻み幅、または刻み幅を `1` とするときの対象 `unit`。
- name: unit
  type: Unit
  description: 丸め対象の時刻単位（`'hour'` から `'nanosecond'` まで）。
```

**戻り値**

```returns
type: Time
description: 丸められた新しい `Time`。
```

```js
const checkin = time('14:36:00');

checkin.round('hour').toString(); // '15:00:00'
checkin.round(15, 'minutes').toString(); // '14:30:00'
```
:::

:::entry
### `floor()` :kind[method]

```js signature
t.floor(unit): Time
t.floor(increment, unit): Time
```

指定した時刻単位または刻み幅の開始時刻へ切り下げます。[`round()`](#round) と同じ引数を受け取ります。

```js
time('14:29').floor(15, 'minutes').toString(); // '14:15:00'
```
:::

:::entry
### `ceil()` :kind[method]

```js signature
t.ceil(unit): Time
t.ceil(increment, unit): Time
```

次の時刻単位または刻み幅へ切り上げます。[`round()`](#round) と同じ引数を受け取ります。

```js
time('14:01').ceil(15, 'minutes').toString(); // '14:15:00'
```
:::

## 時刻の比較

1日の範囲（0時から1日の終わりまで）の中で時刻の前後を比較します。`<` などの関係演算子は `RangeError` をスローするため、メソッドまたは [`compare()`](/api/compare/) を使って比較してください。

:::entry
### `equals()` :kind[method]

```js signature
t.equals(other): boolean
```

両方の値がまったく同じ時刻を表すときに `true` を返します。

**引数**

```params
- name: other
  type: TimeInput
  required: true
  description: 比較対象の `Time`、または `time()` が受け付ける任意の入力。
```

**戻り値**

```returns
type: boolean
description: 両方の値がナノ秒単位まで一致する場合は `true`。
```

```js
time('5:30pm').equals('17:30'); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
t.isBefore(other): boolean
```

この時刻が同じ日の中で比較対象より早い場合に `true` を返します。

```js
time('9:00am').isBefore('5:00pm'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
t.isAfter(other): boolean
```

この時刻が同じ日の中で比較対象より遅い場合に `true` を返します。

```js
time('5:00pm').isAfter('9:00am'); // true
```
:::

:::entry
### `isSame()` :kind[method]

```js signature
t.isSame(other, unit?): boolean
```

別の時刻と同じ時や同じ分など、同一の時刻単位に属するかを判定します。単位を省略して `isSame()` を呼び出すと、完全一致を確認します。

**引数**

```params
- name: other
  type: TimeInput
  required: true
  description: 比較対象の時刻。
- name: unit
  type: Unit
  description: 比較する時刻単位（`'hour'` や `'minute'` など）。
```

**戻り値**

```returns
type: boolean
description: 両方の時刻が同じ `unit` に属する場合は `true`。
```

```js
time('9:05am').isSame('9:45am', 'hour'); // true
time('9:05am').isSame('10:05am', 'hour'); // false
```
:::

## 期間の計測

:::entry
### `until()` :kind[method]

```js signature
t.until(other): Duration
t.until(other, unit): number
```

同じ日の中でこの時刻から別の時刻までの符号付きの時間差を計測します。対象がこの時刻より早い場合は負の期間を返します。単位名を渡すと合計の長さを数値で取得できます。

**引数**

```params
- name: other
  type: TimeInput
  required: true
  description: 計測先の時刻。
- name: unit
  type: Unit
  description: 合計の長さを浮動小数点数で返すときの時刻単位。
```

**戻り値**

```returns
type: Duration | number
description: 時間単位までまとめた `Duration`、または `unit` 指定時は数値。
```

```js
const opens = time('9:00am');
const closes = time('5:30pm');

opens.until(closes).format('long', 'en-US'); // '8 hours, 30 minutes'
opens.until(closes, 'hours'); // 8.5
time('22:00').until('02:00', 'hours'); // -20
```
:::

:::entry
### `since()` :kind[method]

```js signature
t.since(other): Duration
t.since(other, unit): number
```

同じ日の中でより早い時刻からこの時刻までの経過時間を計測します。単位名を渡すと合計を数値で返します。

```js
time('5:00pm').since('9:00am', 'hours'); // 8
```
:::

:::entry
### `to()` :kind[method]

```js signature
t.to(end): TimeRange
t.to(count, unit): TimeRange
t.for(length): TimeRange
t.for(count, unit): TimeRange
```

この時刻を開始とし、指定した終了時刻、または指定期間が経過した時刻の手前まで（終端を含まない）の半開区間 [`TimeRange`](/api/ranges/#timerange) を作成します。終了時刻が開始時刻より前の場合は、0時をまたいで翌日へ折り返します。期間の長さを明示的に渡したい場合は `for()` を使います（終了時刻や単位なしの数値は受け付けません）。

**引数**

```params
- name: end
  type: TimeInput | DurationInput | number
  required: true
  description: 終了時刻、時刻期間、または `unit` と組にする数値 `count`。
- name: unit
  type: Unit
  description: 第1引数が数値のときに指定する時刻単位名（`'hours'` や `'minutes'` など）。
```

**戻り値**

```returns
type: TimeRange
description: この時刻から始まる半開区間の `TimeRange`。
```

```js
time('9:00am').to('5:00pm').duration.hours; // 8
time('9:00am').for(90, 'minutes').end.toString(); // '10:30:00'
time('22:00').to('06:00').duration.hours; // 8
```
:::

## フォーマットと変換

:::entry
### `format()` :kind[method]

```js signature
t.format(spec?, locale?): string
```

組み込みのプリセット、[`configure()`](/api/configure/) で登録したカスタム名、オプションオブジェクト、またはトークンパターンを使って時刻をフォーマットします。

ローカライズ済みの `'LT'`・`'LTS'` プリセットを標準で備えており、オプションオブジェクト内の日付キーやタイムゾーンキーは自動的に無視されます。プリセットとトークンの全一覧は[フォーマット](/guides/formatting/)を参照してください。

**引数**

```params
- name: spec
  type: FormatSpec
  default: "'short'"
  description: 組み込みまたは設定済みのフォーマット名、`Intl` オプションオブジェクト、あるいはトークンパターン。
- name: locale
  type: string
  description: この呼び出し限定でインスタンスまたは設定済みのロケールを上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: フォーマットされた時刻文字列。
```

```js
const afternoon = time('17:30:15');

afternoon.format('short', 'en-US'); // '5:30 PM'
afternoon.format('LTS', 'en-US'); // '5:30:15 PM'
afternoon.format('HH:mm:ss'); // '17:30:15'
afternoon.format('h:mm a'); // '5:30 pm'
afternoon.format({ hour12: false }, 'en-US'); // '17:30'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
t.locale(): Locale | undefined
t.locale(tag): Time
```

この時刻が保持しているロケールを取得するか、別のロケールを設定したコピーを返します。設定したロケールは `text` 表示やプリセットのフォーマットに適用され、すべての派生値にも引き継がれます。空の値を渡すと保持しているロケールを解除でき、エイリアスとして [`lang()`](#lang) も利用できます。

**引数**

```params
- name: tag
  type: Locale | null | undefined
  description: 設定して派生値へ引き継ぐ BCP 47 ロケールタグ。設定済みのタグを解除する場合は `null`。
```

**戻り値**

```returns
type: Time | Locale | undefined
description: 引数なしの場合は設定中のタグ、指定した場合は `tag` を保持して派生値へ引き継ぐ新しい `Time`。
```

```js
const closing = time('17:30').locale('ko-KR');

closing.locale(); // 'ko-KR'
closing.text; // '오후 5:30'
closing.on('2026-05-01', 'Asia/Seoul').locale(); // 'ko-KR'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
t.lang(): Locale | undefined
t.lang(tag): Time
```

[`locale()`](#locale) の短縮エイリアスです。この時刻に紐づく BCP 47 ロケールタグの取得または設定を行います。
:::

:::entry
### `toString()` :kind[method]

```js signature
t.toString(): string
t.toJSON(): string
```

24時間制の ISO 8601 時刻文字列を返します。秒未満の桁は 0 でない場合のみ3桁単位で出力されます。`toJSON()` は `JSON.stringify()` 向けに同じ文字列を返します。

**戻り値**

```returns
type: string
description: ISO 8601 の時刻文字列（`'17:30:00'` や `'17:30:15.250'` など）。
```

```js
time('5:30pm').toString(); // '17:30:00'
time('17:30:15.25').toString(); // '17:30:15.250'
JSON.stringify({ opens: time('9am') }); // '{"opens":"09:00:00"}'
```
:::

:::entry
### `as()` :kind[method]

```js signature
t.as('time'): Time
```

汎用的な変換チェーンで `'time'` が指定された場合にこの `Time` をそのまま返します。それ以外の種別を指定すると `RangeError` をスローします。
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
t.toTemporal(): Temporal.PlainTime
```

内部の `Temporal.PlainTime` インスタンスを返します。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
t.valueOf(): never
```

数値演算子によって時刻が暗黙的に数値へ変換されないよう、`RangeError` をスローします。
:::
