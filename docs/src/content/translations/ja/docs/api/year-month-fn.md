---
source: "91937c1bc2c8"
title: yearMonth()
lede: ISO 年月文字列、カードの有効期限、数値、または日付から YearMonth を作成します。
---

## 年月の読み取り

:::entry
### `yearMonth()` :kind[function]

```js signature
yearMonth(input, options?): YearMonth
yearMonth(input, zone?): YearMonth
yearMonth(year, month): YearMonth
```

年・月順の文字列、年と1始まりの月の数値、フィールドオブジェクトから、あるいは任意の日付・タイムスタンプの日を除いて [`YearMonth`](/api/year-month/) を作成します。入力が欠けている場合は今月にフォールバックせず、`TypeError` をスローします。

```js title="billing.js"
import { datetime, yearMonth } from 'native-dates';

const fromIso = yearMonth('2026-11');
const fromNumbers = yearMonth(2026, 11);
const fromFields = yearMonth({ year: 2026, month: 11 });
const fromDate = yearMonth('2026-11-16');
const fromInstant = yearMonth(datetime('2026-11-01T02:00:00Z'), 'America/Los_Angeles');

fromNumbers.toString(); // '2026-11'
fromInstant.toString(); // '2026-10'
```

**引数**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: ISO 年月文字列、フィールドオブジェクト、日付またはタイムスタンプ、あるいは西暦の `year`。
- name: options
  type: Zone | ReadOptions | number | string
  description: タイムスタンプや loose 文字列を読み取る際のタイムゾーンまたはオプションオブジェクト、あるいは1〜12の1始まりの `month`。
  options:
    - name: zone
      type: Zone
      description: 瞬間を表す文字列、`DateTime`、または `Date` からカレンダーの年月を判定するタイムゾーン。
    - name: locale
      type: Locale
      description: 返される `YearMonth` とそこから派生するすべての値に引き継がれる BCP 47 ロケールタグ。
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose` を使用し、`'février 2026'` のような英語・各言語の月名を読み取り、読み取れない入力には `null` を返す設定。"
```

**戻り値**

```returns
type: YearMonth
description: "日を持たない `YearMonth`。loose モードで `input` を読み取れない場合は `null`。"
```

[loose プラグイン](/plugins/loose/)を読み込むと、loose モードでは英語またはアクティブな `locale` の月名と4桁の年の組み合わせを解析でき、読み取れない文字列には `null` を返します。

```js
import { yearMonth } from 'native-dates';
import '@native-dates/plugins/loose';

yearMonth('Nov 2026', { loose: true })?.toString(); // '2026-11'
yearMonth('février 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
yearMonth('not-a-month', { loose: true }); // null
```
:::

:::entry
### `monthYear()` :kind[function]

```js signature
monthYear(input, options?): YearMonth
monthYear(month, year): YearMonth
```

`'11/26'` のように、クレジットカードの有効期限と同じ月・年順の文字列や数値を読み取ります。0〜99の2桁の年は [`YearMonth.century`](/api/year-month/#properties)（デフォルトは2000）に加算されます。

`'2026-11'` のような ISO 文字列はどちらの関数でも年・月順として読み取られるため、シリアライズされた値は常にそのまま往復変換できます。

**引数**

```params
- name: input
  type: YearMonthInput | number | string
  required: true
  description: "`'11/26'` のようなカード有効期限文字列、任意の `YearMonthInput`、または1〜12の1始まりの `month`。"
- name: options
  type: Zone | ReadOptions | number | string
  description: タイムゾーン、`locale` を含む読み取りオプション、または2つの数値を渡す際の2桁もしくは4桁の `year`。
```

**戻り値**

```returns
type: YearMonth
description: "`YearMonth`。loose モードで `input` を読み取れない場合は `null`。"
```

```js
import { monthYear } from 'native-dates';

monthYear('11/26').toString(); // '2026-11'
monthYear('05/2028').toString(); // '2028-05'
monthYear(11, 26).toString(); // '2026-11'
monthYear('2026-11').toString(); // '2026-11'
```
:::

## 受け付ける入力

数値・文字列・フィールドオブジェクトのいずれでも、月は常に1月が1、12月が12です。

| 入力 | 例 | 読み取り方 |
|---|---|---|
| 年・月順の文字列 | `'2026-11'`, `'2026/11'`, `'2026年11月'` | ラテン文字とコロン以外の区切り文字で、4桁の年と1〜2桁の月を読み取ります。 |
| カード有効期限文字列 | `monthYear('11/26')`, `monthYear('11.2026')` | `/`、`-`、`.` 区切りを月・年順で読み取り、2桁の年は `YearMonth.century` で展開します。 |
| 2つの数値 | `yearMonth(2026, 11)`, `monthYear(11, 26)` | 年・月順または月・年順の2つの整数を受け取ります。 |
| フィールドオブジェクト | `{ year: 2026, month: 11 }` | 1始まりのカレンダーフィールドを読み取り、1〜12の範囲外の月を拒否します。 |
| 日付またはタイムスタンプ | `'2026-11-16'`, `datetime(...)`, `new Date()` | 指定したタイムゾーン（省略時は設定済みのデフォルト）の年月を取り出し、日を除きます。 |
| loose モードの月名 | `'Nov 2026'`, `'février 2026'` | loose モードで英語またはアクティブなロケールの月名と4桁の年を読み取ります。 |
| Temporal の値 | `Temporal.PlainYearMonth`, `Temporal.PlainDate` | ISO 8601 の Temporal 値をそのままラップします。 |

:::tip[現在の年月の取得]
任意のタイムゾーンにおける現在の年月を取得するには、[`today()`](/api/date-fn/#today) を使って `today('Asia/Tokyo').yearMonth` のように記述します。
:::
