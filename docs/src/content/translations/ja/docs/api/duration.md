---
source: "05899a15dfff"
title: Duration
lede: 暦の単位と時刻の単位をまたいで表す時間の長さ。
---

## Duration の作成

[`duration()`](/api/duration-fn/) で英語の単位表現や ISO 8601 文字列を解析したり、[`hours()`](/api/duration-fn/#hours) などの単位ヘルパーを呼び出したり、2つの日付や時刻の間の長さを計測したりして作成します。インスタンスはイミュータブルであり、元の値を変更せず、すべてのメソッドが新しい値を返します。

```js title="create.js"
import { date, days, duration, hours } from 'native-dates';

const breakTime = duration('1h 30m');
const trial = days(14);
const timeout = hours(1.5);
const quarter = date('2026-01-01').until('2026-04-01');
```

:::note[フィールドは指定したまま保持される]
90分で期間を作成しても、1時間30分に自動変換されず `minutes` が `90` のまま保持されます。また、夏時間（DST）の切り替わりをまたぐ場合があるため、[`balance()`](#balance) を呼び出すまで暦の日数（`days`）と時間（`hours`）は別々に管理されます。
:::

## プロパティ

プロパティは期間に格納されている各単位の値を返します。

| プロパティ | 型 | 説明 |
|---|---|---|
| `text` | `string` | ロケールに合わせて long スタイルでフォーマットされた期間文字列（例：`'1 hour, 30 minutes'`）。 |
| `years`, `months`, `weeks`, `days` | `number` | この期間が保持する、符号付きの暦単位の値。 |
| `hours`, `minutes`, `seconds` | `number` | 符号付きの時刻単位の値。 |
| `milliseconds`, `microseconds`, `nanoseconds` | `number` | 符号付きの秒未満の単位の値。 |
| `sign` | `number` | 期間全体の符号（`1`、`0`、`-1` のいずれか）。 |
| `anchor` | `TemporalValue` | [`until()`](/api/date-time/#until) または [`since()`](/api/date-time/#since) で記録された基準点。単独の期間では `undefined`。 |

## 演算と符号

期間同士を加減算したり、倍率を掛けたり、符号を反転したりできます。1つの期間内で0以外のフィールドはすべて同じ符号である必要があります。

:::entry
### `plus()` :kind[method]

```js signature
dur.plus(other, unit?): Duration
dur.add(other, unit?): Duration
```

別の期間を加算し、新しい `Duration` を返します。暦単位はフィールドごとに加算され、時刻単位はそのまま統合されます。`add()` はエイリアスです。

**引数**

```params
- name: other
  type: DurationInput
  required: true
  description: "`unit` と組み合わせる数値、`Duration` インスタンス、英語の単位表現または ISO 8601 の期間文字列、フィールドオブジェクト、またはミリ秒数。"
- name: unit
  type: Unit
  description: "`other` が数値のときの単位名（`'minutes'` や `'days'` など）。"
```

**戻り値**

```returns
type: Duration
description: 合算された新しい `Duration`。
```

```js
hours(2).plus(30, 'minutes').toString(); // 'PT2H30M'
days(1).plus('6h').toString(); // 'P1DT6H'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
dur.minus(other, unit?): Duration
dur.subtract(other, unit?): Duration
```

別の期間を減算します。必要に応じて年と月、または週と日の間で繰り下げを行います。日から時間を引くような互換性のない異符号の組み合わせでは `RangeError` をスローします。`subtract()` はエイリアスです。

**引数**

```params
- name: other
  type: DurationInput
  required: true
  description: "`unit` と組み合わせる数値、`Duration` インスタンス、英語の単位表現または ISO 8601 の期間文字列、フィールドオブジェクト、またはミリ秒数。"
- name: unit
  type: Unit
  description: "`other` が数値のときの単位名。"
```

**戻り値**

```returns
type: Duration
description: "`other` を減算した新しい `Duration`。"
```

```js
import { months, weeks, years } from 'native-dates';

hours(2).minus('30m').toString(); // 'PT1H30M'
years(1).minus(months(1)).toString(); // 'P11M'
weeks(1).minus(days(1)).toString(); // 'P6D'
```
:::

:::entry
### `times()` :kind[method]

```js signature
dur.times(factor): Duration
```

すべてのフィールドに数値を掛け、端数が生じた場合はより小さい単位へ展開します。

**引数**

```params
- name: factor
  type: number
  required: true
  description: 期間に掛ける倍率（小数や負の数も指定可能）。
```

**戻り値**

```returns
type: Duration
description: 倍率を適用した新しい `Duration`。
```

```js
hours(1).times(1.5).toString(); // 'PT1H30M'
days(1).times(3).toString(); // 'P3D'
```
:::

:::entry
### `abs()` :kind[method]

```js signature
dur.abs(): Duration
```

すべてのフィールドを正の値にしたコピーを返します。

```js
duration('-1h 30m').abs().toString(); // 'PT1H30M'
```
:::

:::entry
### `negated()` :kind[method]

```js signature
dur.negated(): Duration
```

期間内のすべてのフィールドの符号を反転します。

```js
hours(2).negated().toString(); // '-PT2H'
```
:::

## バランス調整・丸め・合計

小さい単位を大きい単位へ繰り上げたり、指定した精度に丸めたり、期間全体を単一の数値として取得したりできます。

:::warning[月や年を日数に変換する場合]
月と年だけからなる期間は、1年を12か月として互いにバランス調整・合計・比較できます。ただし暦の月は日数が異なるため、週・日・時刻単位へ変換するには [`until()`](/api/calendar-date/#until) や [`since()`](/api/calendar-date/#since) で記録された基準日が必要です。
:::

:::entry
### `balance()` :kind[method]

```js signature
dur.balance(largestUnit?): Duration
```

小さい単位のオーバーフローを大きい単位へ繰り上げます。デフォルトでは、単独の期間は時刻単位を時間まで、月を年まで繰り上げます。2点間から計測された期間は、より大きい単位を指定しない限り日まで繰り上げます。

**引数**

```params
- name: largestUnit
  type: Unit
  description: 繰り上げ先とする最大単位（`'hour'`、`'day'`、`'week'` など）。
```

**戻り値**

```returns
type: Duration
description: バランス調整された新しい `Duration`。
```

```js
import { minutes, months } from 'native-dates';

minutes(150).balance().toString(); // 'PT2H30M'
months(18).balance().toString(); // 'P1Y6M'
duration('36h').balance('day').toString(); // 'P1DT12H'
duration('10d').balance('week').toString(); // 'P1W3D'
```
:::

:::entry
### `total()` :kind[method]

```js signature
dur.total(unit): number
dur.as(unit): number
```

期間全体の長さを、指定した単位の浮動小数点数として返します。メソッドチェーン向けのエイリアス [`as()`](#as) も利用できます。

**引数**

```params
- name: unit
  type: Unit
  required: true
  description: 合計の長さを表す単位（`'hours'` や `'days'` など）。
```

**戻り値**

```returns
type: number
description: 小数部を含む、`unit` 単位での合計の長さ。
```

```js
import { months } from 'native-dates';

minutes(90).total('hours'); // 1.5
months(18).total('years'); // 1.5
date('2026-01-01').until('2026-04-01').total('days'); // 90
```
:::

:::entry
### `as()` :kind[method]

```js signature
dur.as(unit): number
```

[`total()`](#total) のチェーン向けエイリアスで、期間を指定した単位の数値に変換します。

```js
hours(36).as('days'); // 1.5
date('2026-11-01').until('2026-11-16').as('days'); // 15
```
:::

:::entry
### `round()` :kind[method]

```js signature
dur.round(smallestUnit): Duration
```

期間を指定した最小単位の最も近い整数に丸めます。ちょうど中間の値は0から離れる方向へ丸められます。

**引数**

```params
- name: smallestUnit
  type: Unit
  required: true
  description: 丸めた後に残す最小単位（`'minute'` や `'hour'` など）。
```

**戻り値**

```returns
type: Duration
description: 丸められた新しい `Duration`。
```

```js
minutes(90).round('hour').toString(); // 'PT2H'
duration('1h 20m').round('hour').toString(); // 'PT1H'
```
:::

## 期間の比較

フィールドの書き方ではなく期間全体の長さで比較するため、60分と1時間は等しいとみなされます。

:::entry
### `equals()` :kind[method]

```js signature
dur.equals(other): boolean
```

2つの期間が同じ合計長を表す場合に `true` を返します。

**引数**

```params
- name: other
  type: DurationInput
  required: true
  description: 別の `Duration`、または `duration()` が受け付ける任意の入力。
```

**戻り値**

```returns
type: boolean
description: 2つの期間の長さが等しい場合は `true`。
```

```js
import { months, years } from 'native-dates';

hours(1).equals(minutes(60)); // true
years(1).equals(months(12)); // true
```
:::

:::entry
### `compare()` :kind[method]

```js signature
dur.compare(other): number
```

ソート用に、この期間と別の期間を合計長で順序付けます。

**引数**

```params
- name: other
  type: DurationInput
  required: true
  description: 比較対象の期間。
```

**戻り値**

```returns
type: number
description: 短い場合は `-1`、等しい場合は `0`、長い場合は `1`。
```

```js
hours(1).compare(minutes(90)); // -1
date('2026-01-01').until('2026-02-01').compare(days(31)); // 0
```
:::

### 符号の判定

引数なしで、期間が0または負であるかを判定します。

| メソッド | 型 | 説明 |
|---|---|---|
| `isZero()` | `boolean` | すべての単位が0であるかどうか。 |
| `isNegative()` | `boolean` | 負の期間を表すかどうか。 |

## フォーマットと変換

:::entry
### `format()` :kind[method]

```js signature
dur.format(style?, locale?): string
```

`Intl.DurationFormat` を使って、現在のロケールに合わせて期間をフォーマットします。時刻単位のオーバーフローは自動的に時間まで繰り上げられ、より大きい単位がある場合は秒未満のフィールドが省略されます。

**引数**

```params
- name: style
  type: "'long' | 'short' | 'narrow' | 'digital'"
  default: "'long'"
  description: 単位ラベルの表示スタイル、またはコロン区切りのタイマー表示にする `'digital'`。
- name: locale
  type: string
  description: この呼び出しに限り、期間のロケールまたはグローバル設定を上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: ロケールに合わせてフォーマットされた期間文字列。
```

```js
const span = duration('2h 30m');

span.format('long', 'en-US'); // '2 hours, 30 minutes'
span.format('short', 'en-US'); // '2 hr, 30 min'
span.format('narrow', 'en-US'); // '2h 30m'
span.format('digital', 'en-US'); // '2:30:00'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
dur.locale(): Locale | undefined
dur.locale(tag): Duration
```

この期間が保持するロケールを取得するか、テキスト表示・プリセット・演算チェーン全体で別のロケールを使うコピーを返します。空のタグを渡すと保持されているロケールを解除します。[`lang()`](#lang) はエイリアスです。

**引数**

```params
- name: tag
  type: Locale | null | undefined
  description: 派生値に引き継ぐ BCP 47 ロケールタグ、または既存のタグを解除する `null`。
```

**戻り値**

```returns
type: Duration | Locale | undefined
description: 引数なしで呼び出した場合は有効なロケールタグ、引数を渡した場合は `tag` を保持する新しい `Duration`。
```

```js
import { days } from 'native-dates';

const wait = days(2).locale('ar');

wait.locale(); // 'ar'
wait.text; // 'يومان'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
dur.lang(): Locale | undefined
dur.lang(tag): Duration
```

[`locale()`](#locale) の短縮エイリアスで、この期間の BCP 47 ロケールタグの取得または設定を行います。
:::

:::entry
### `toFields()` :kind[method]

```js signature
dur.toFields(): DurationFields
```

この期間のうち、0以外の複数形単位フィールドだけを含むプレーンオブジェクトを返します。

```js
duration('1h 30m').toFields(); // { hours: 1, minutes: 30 }
```
:::

:::entry
### `toString()` :kind[method]

```js signature
dur.toString(): string
dur.toJSON(): string
```

ISO 8601 の期間文字列を返します。`toJSON()` も `JSON.stringify()` 用に同じ文字列を返します。

**戻り値**

```returns
type: string
description: ISO 8601 の期間文字列（`'PT1H30M'` など）。
```

```js
const ttl = duration('1h 30m');

ttl.toString(); // 'PT1H30M'
JSON.stringify({ ttl }); // '{"ttl":"PT1H30M"}'
```
:::

:::entry
### `toMilliseconds()` :kind[method]

```js signature
dur.toMilliseconds(): number
```

合計の長さをミリ秒で返します。基準点のない月または年の期間では `RangeError` をスローします。

```js
hours(2).toMilliseconds(); // 7200000
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
dur.toTemporal(): Temporal.Duration
```

内部の `Temporal.Duration` インスタンスを返します。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
dur.valueOf(): number
```

合計ミリ秒数を返すため、固定長または基準点付きの期間をタイマーや数値比較演算子でそのまま使えます。
:::
