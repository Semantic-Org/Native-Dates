---
source: "e681c4b680b0"
title: monthDay()
lede: 月日の文字列、数値、フィールドオブジェクト、または日付から MonthDay を作成します。
---

## 月日の読み取り

:::entry
### `monthDay()` :kind[function]

```js signature
monthDay(input, options?): MonthDay
monthDay(input, zone?): MonthDay
monthDay(month, day): MonthDay
```

月・日順の文字列、1始まりの数値、フィールドオブジェクト、または既存の日付から [`MonthDay`](/api/month-day/) を作成します。2月29日も受け付けるため、うるう日の誕生日や記念日もそのまま扱えます。

```js title="birthday.js"
import { datetime, monthDay } from 'native-dates';

const fromIso = monthDay('10-17');
const fromSlash = monthDay('10/17');
const fromNumbers = monthDay(2, 29);
const fromFields = monthDay({ month: 10, day: 17 });
const fromInstant = monthDay(datetime('2026-10-18T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '02-29'
fromInstant.toString(); // '10-17'
```

**引数**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: 月・日順の文字列、フィールドオブジェクト、日付またはタイムスタンプ、あるいは1〜12の1始まりの `month`。
- name: options
  type: Zone | MonthDayOptions | number | string
  description: タイムゾーンまたはオプションオブジェクト、あるいは2つの数値を渡す際の1〜31の整数 `day`。
  options:
    - name: zone
      type: Zone
      description: 瞬間を表す文字列、`DateTime`、または `Date` から月日を読み取るタイムゾーン。
    - name: locale
      type: Locale
      description: 返される `MonthDay` とそこから派生するすべての値に引き継がれる BCP 47 ロケールタグ。
    - name: dayFirst
      type: boolean
      default: 'false'
      description: "`dayMonth()` と同様に、スラッシュ・ドット区切り、または1桁を含むハイフン区切り文字列（`'5-6'` など）を日・月順で読み取る設定。"
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose` を使用し、`'17 février'` のような英語・各言語の月名を読み取り、読み取れない入力には `null` を返す設定。"
```

**戻り値**

```returns
type: MonthDay
description: "年を持たない `MonthDay`。loose モードで `input` を読み取れない場合は `null`。"
```

[loose プラグイン](/plugins/loose/)を読み込むと、loose モードでは英語またはアクティブな `locale` の月名を解析し、読み取れない入力に対しては `null` を返します。

```js
import { monthDay } from 'native-dates';
import '@native-dates/plugins/loose';

monthDay('Oct 17', { loose: true })?.toString(); // '10-17'
monthDay('17 février', { loose: true, locale: 'fr' })?.toString(); // '02-17'
monthDay('whenever', { loose: true }); // null
```
:::

:::entry
### `dayMonth()` :kind[function]

```js signature
dayMonth(input, options?): MonthDay
dayMonth(day, month): MonthDay
```

`'17/10'` のように、世界の大多数の地域で使われる日・月順の文字列や数値を読み取ります。この関数はグローバル設定に関係なく、常に日・月順として読み取ります。

`'10-17'` のようにハイフンで区切られた2桁の ISO 文字列は、どちらの関数でも月・日順として読み取られます。そのため、JSON 出力はどこで読み戻しても同じ月日に復元されます。

**引数**

```params
- name: input
  type: MonthDayInput | number | string
  required: true
  description: "`'17/10'` のような日・月順の文字列、任意の `MonthDayInput`、または1〜31の整数 `day`。"
- name: options
  type: Zone | MonthDayOptions | number | string
  description: タイムゾーン、`locale` を含む読み取りオプション、または2つの数値を渡す際の1〜12の1始まりの `month`。
```

**戻り値**

```returns
type: MonthDay
description: "`MonthDay`。loose モードで `input` を読み取れない場合は `null`。"
```

```js
import { dayMonth } from 'native-dates';

dayMonth('17/10').toString(); // '10-17'
dayMonth('06.05').toString(); // '05-06'
dayMonth(17, 10).toString(); // '10-17'
dayMonth('10-17').toString(); // '10-17'
```
:::

## 受け付ける入力

年を含まない数値文字列は標準の `Date` パーサーには渡されません。これにより、平年が勝手に補完されたり、存在しない日付が翌月に繰り上がったりするのを防ぎます。

| 入力 | 例 | 読み取り方 |
|---|---|---|
| ISO 月日文字列 | `'10-17'`, `'--10-17'` | [`monthDay()`](#monthday) と [`dayMonth()`](#daymonth) のどちらでも、2桁の月日を月・日順で読み取ります。 |
| 数値ペア文字列 | `'10/17'`, `'17.10'`, `'5-6'` | `/`、`.`、`-` 区切りを、`monthDay()` では月・日順、`dayMonth()` では日・月順で読み取ります。 |
| 2つの数値 | `monthDay(10, 17)`, `dayMonth(17, 10)` | 月・日順または日・月順の2つの整数を受け取ります。 |
| フィールドオブジェクト | `{ month: 10, day: 17 }` | 1始まりのフィールドを読み取り、4月31日のような存在しない組み合わせを拒否します。 |
| 日付またはタイムスタンプ | `'1990-10-17'`, `datetime(...)`, `new Date()` | 指定した（または設定済みの）タイムゾーンで月日を取り出し、年を除きます。 |
| loose モードの月名 | `'Oct 17'`, `'17 février'` | loose モードで英語またはアクティブなロケールの月名と日（序数表記を含む）をどちらの順序でも読み取ります。 |
| Temporal の値 | `Temporal.PlainMonthDay`, `Temporal.PlainDate` | ISO 8601 の Temporal 値をそのままラップします。 |

:::tip[今日の月日の取得]
任意のタイムゾーンにおける今日の月日を取得するには、[`today()`](/api/date-fn/#today) を使って `today('Europe/Berlin').monthDay` のように記述します。
:::
