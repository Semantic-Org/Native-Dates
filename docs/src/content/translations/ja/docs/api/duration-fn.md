---
source: "6f9a2cfc4ed9"
title: duration()
lede: 英語の単位表現、ISO 8601 の期間文字列、数値と単位、または単位ヘルパーから Duration を作成します。
---

## 期間の作成

:::entry
### `duration()` :kind[function]

```js signature
duration(input, unit?): Duration
duration(input, options?): Duration
```

数値と単位、英語の単位表現、ISO 8601 の期間文字列、フィールドオブジェクト、またはミリ秒数から [`Duration`](/api/duration/) を作成します。各フィールドは [`balance()`](/api/duration/#balance) を呼び出すまで記述したまま保持されるため、90分が勝手に1時間30分へ変換されることはありません。

```js title="lengths.js"
import { duration } from 'native-dates';

const phrase = duration('1h 30m');
const words = duration('2 weeks and 3 days');
const iso = duration('PT1H30M');
const count = duration(90, 'minutes');
const spilled = duration(1.5, 'days');
const fields = duration({ hours: 1, minutes: 30 });
const ms = duration(1500);

spilled.days; // 1
spilled.hours; // 12
ms.seconds; // 0
ms.milliseconds; // 1500
```

**引数**

```params
- name: input
  type: DurationInput
  required: true
  description: "`unit` と組にする数値、英語の単位表現、ISO 8601 期間文字列、フィールドオブジェクト、`Duration`、またはミリ秒数。"
- name: unitOrOptions
  type: "Unit | { locale?: Locale, loose?: boolean }"
  description: "`input` が数値のときの単位名、またはオプションオブジェクト。"
  options:
    - name: locale
      type: Locale
      description: 返される `Duration` とそこから派生するすべての値に引き継がれる BCP 47 ロケールタグ。
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose` を使用し、読み取れない入力に対して `null` を返す設定。"
```

**戻り値**

```returns
type: Duration
description: "指定したフィールドをそのまま保持する `Duration`。loose モードで `input` を読み取れない場合は `null`。"
```

[`@native-dates/plugins/loose`](/plugins/loose/) をインポートしておくと、loose モードではユーザー入力の文字列を期間として解析できない場合に例外をスローせず `null` を返します。

```js
import { duration } from 'native-dates';
import '@native-dates/plugins/loose';

duration('45 mins', { loose: true })?.minutes; // 45
duration('soon', { loose: true }); // null
```
:::

### 受け付ける入力

| 入力 | 例 | 読み取り方 |
|---|---|---|
| 数値と単位 | `duration(90, 'minutes')`, `duration(1.5, 'days')` | 数値または数値文字列と単位を組み合わせ、小数部は1つ下の単位に振り分けます。 |
| 英語の単位表現 | `'1h 30m'`, `'2 weeks and 3 days'`, `'-15m'` | スペース、カンマ、または `and` で区切られた数量と、英語の正式単位名・略称を読み取ります。 |
| ISO 8601 文字列 | `'PT1H30M'`, `'P2W3D'` | 標準の ISO 8601 期間文字列を解析します。 |
| フィールドオブジェクト | `{ hours: 1, minutes: 30 }` | 単数形または複数形の単位キーを読み取ります。0以外の全フィールドは同じ符号である必要があります。 |
| ミリ秒数 | `duration(1500)`, `duration(0)` | 単位のない数値または数値文字列はミリ秒として扱います。 |
| Duration または Temporal | `hours(2)`, `Temporal.Duration` | 既存の `Duration` はそのまま返し、`Temporal.Duration` はラップします。 |

:::note[小数の単位と符号の統一]
小数の数量は、長さが固定されているより小さな単位へ振り分けられます。たとえば `duration(1.5, 'days')` は1日と12時間になります。月は日数が固定ではないため、小数の月数は `RangeError` をスローします。`'1h -30m'` のように正負が混在する表現も同様に `RangeError` をスローします。
:::

## 単位ヘルパー

単位ヘルパーは単一単位の期間を作成し、加減算の呼び出しや式を直感的に書けるようにします。各ヘルパーは正または負の数値、あるいは数値文字列を受け取ります。

```js
import { days, hours, minutes, today } from 'native-dates';

const reminder = today().plus(days(3)).at('9:00am');
const block = hours(1).plus(minutes(30));

block.format('short', 'en-US'); // '1 hr, 30 min'
```

:::entry
### `years()` :kind[function]

```js signature
years(count): Duration
```

指定した年数の期間を作成します。小数部は月へ振り分けられます。
:::

:::entry
### `months()` :kind[function]

```js signature
months(count): Duration
```

指定した月数（整数）の期間を作成します。
:::

:::entry
### `weeks()` :kind[function]

```js signature
weeks(count): Duration
```

指定した週数の期間を作成します。小数部は日へ振り分けられます。
:::

:::entry
### `days()` :kind[function]

```js signature
days(count): Duration
```

指定した日数の期間を作成します。小数部は時間へ振り分けられます。
:::

:::entry
### `hours()` :kind[function]

```js signature
hours(count): Duration
```

指定した時間数の期間を作成します。小数部は分へ振り分けられます。
:::

:::entry
### `minutes()` :kind[function]

```js signature
minutes(count): Duration
```

指定した分数の期間を作成します。小数部は秒へ振り分けられます。
:::

:::entry
### `seconds()` :kind[function]

```js signature
seconds(count): Duration
```

指定した秒数の期間を作成します。小数部はミリ秒へ振り分けられます。
:::

:::entry
### `milliseconds()` :kind[function]

```js signature
milliseconds(count): Duration
```

指定したミリ秒数の期間を作成します。小数部はマイクロ秒・ナノ秒まで振り分けられます。
:::
