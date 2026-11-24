---
source: "09d43cd55ced"
title: YearMonth
lede: 日を持たない暦の年と月。請求期間、カードの有効期限、月選択 UI に適しています。
---

## YearMonth の作成

[`yearMonth()`](/api/year-month-fn/) で ISO 文字列、年と月の数値、または既存の日付からインスタンスを作成します。カードの有効期限のように月・年順の文字列を解析する場合は [`monthYear()`](/api/year-month-fn/#monthyear) を使います。インスタンスはイミュータブルであり、値を変えるメソッドは元の値を変更せず、常に新しいインスタンスを返します。

```js title="create.js"
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const quarterEnd = yearMonth(2026, 12);
const expiry = monthYear('11/26');
```

任意の[カレンダー日付](/api/calendar-date/)や[時点](/api/date-time/)の `yearMonth` プロパティから年月を取り出したり、チェーン内で `as('yearMonth')` を使って変換したりできます。

```js
import { date, datetime, today } from 'native-dates';

date('2026-11-16').yearMonth.toString(); // '2026-11'
datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString(); // '2026-10'
const currentMonth = today().yearMonth;
```

## プロパティ

ISO の年・月と、その月に属する暦の境界値を取得できます。

| プロパティ | 型 | 説明 |
|---|---|---|
| `text` | `string` | ロケールに合わせてフォーマットされた年月文字列（例：`'Nov 2026'`）。 |
| `year`, `month` | `number` | 西暦の年と、1始まりの月（1〜12）。 |
| `quarter` | `number` | 暦の四半期（1〜4）。 |
| `daysInMonth`, `daysInYear` | `number` | この月の日数（28〜31）と、この年の日数（365 または 366）。 |
| `start`, `end` | [`CalendarDate`](/api/calendar-date/) | この月の初日と最終日。 |
| `YearMonth.century` | `number` | [`monthYear()`](/api/year-month-fn/#monthyear) で2桁の年に加算される基準世紀。デフォルトは `2000`。 |

## 演算とフィールド

月・四半期・年単位で前後に移動したり、フィールドを置き換えたり、月内の特定の日を指定したりできます。

:::note[月と年の単位のみ対応]
年月は日を持たないため、月より小さい単位を指定すると `RangeError` をスローします。週や日単位の計算が必要な場合は、先に [`on()`](#on) を呼び出して日を指定してください。
:::

:::entry
### `plus()` :kind[method]

```js signature
ym.plus(amount, unit?): YearMonth
ym.add(amount, unit?): YearMonth
```

年・四半期・月単位で進めた新しい `YearMonth` を返します。`add()` はエイリアスです。

**引数**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit` と組み合わせる数値、`Duration` インスタンス、英語の単位表現または ISO 8601 の期間文字列、またはフィールドオブジェクト。"
- name: unit
  type: Unit
  description: "`amount` が数値のときの英語の単位名（`'month'`・`'quarter'`・`'year'` など）。"
```

**戻り値**

```returns
type: YearMonth
description: 暦上で進めた新しい `YearMonth`。
```

```js
const billing = yearMonth('2026-11');

billing.plus(3, 'months').toString(); // '2027-02'
billing.plus('1 year').toString(); // '2027-11'
```
:::

:::entry
### `minus()` :kind[method]

```js signature
ym.minus(amount, unit?): YearMonth
ym.subtract(amount, unit?): YearMonth
```

年・四半期・月単位で戻した新しいインスタンスを返します。[`plus()`](#plus) と同じ入力を受け付け、`subtract()` はエイリアスです。

**引数**

```params
- name: amount
  type: DurationInput
  required: true
  description: "`unit` と組み合わせる数値、`Duration` インスタンス、英語の単位表現または ISO 8601 の期間文字列、またはフィールドオブジェクト。"
- name: unit
  type: Unit
  description: "`amount` が数値のときの英語の単位名（`'month'`・`'quarter'`・`'year'` など）。"
```

**戻り値**

```returns
type: YearMonth
description: 暦上で戻した新しい `YearMonth`。
```

```js
yearMonth('2026-11').minus(1, 'year').toString(); // '2025-11'
```
:::

:::entry
### `set()` :kind[method]

```js signature
ym.set(fields): YearMonth
ym.set(unit, value): YearMonth
```

年・月、またはその両方を置き換えた新しい `YearMonth` を返します。範囲外の月や月より小さい単位を指定すると `RangeError` をスローします。

**引数**

```params
- name: fields
  type: Partial<YearMonthFields> | Unit
  required: true
  description: "`year` や `month` を含むオブジェクト、または単一の単位名。"
- name: value
  type: number
  description: 単位名を渡す場合の整数値。
```

**戻り値**

```returns
type: YearMonth
description: 暦フィールドを更新した新しい `YearMonth`。
```

```js
const billing = yearMonth('2026-11');

billing.set('month', 2).toString(); // '2026-02'
billing.set({ year: 2028, month: 2 }).daysInMonth; // 29
```
:::

:::entry
### `on()` :kind[method]

```js signature
ym.on(day): CalendarDate
```

この月に1〜31の整数で日を指定し、[`CalendarDate`](/api/calendar-date/) を返します。2月や4月のような短い月では31日がその月の最終日にクランプされ、1〜31の範囲外の数値を渡すと `RangeError` をスローします。

**引数**

```params
- name: day
  type: number | string
  required: true
  description: 1〜31の整数で表す日。
```

**戻り値**

```returns
type: CalendarDate
description: その月の指定日を表す `CalendarDate`。
```

```js
yearMonth('2026-11').on(15).toString(); // '2026-11-15'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```
:::

## 比較と包含判定

年月を時系列で比較したり、特定の日付がその月に含まれるかを判定したりできます。`<` などの比較演算子はエラーをスローするため、配列の並び替えには [`compare()`](/api/compare/) や[境界ヘルパー](/api/compare/#earliest)を使ってください。

:::entry
### `compare()` :kind[method]

```js signature
ym.compare(other): -1 | 0 | 1
```

この年月と別の年月を順序付け、ソート用の負数・0・正数を返します。完全な日付やタイムスタンプを渡すと、その日付が属する月と比較します。

**引数**

```params
- name: other
  type: YearMonthInput
  required: true
  description: 別の `YearMonth`、または `yearMonth()` が受け付ける任意の入力。
```

**戻り値**

```returns
type: -1 | 0 | 1
description: 早い場合は `-1`、等しい場合は `0`、遅い場合は `1`。
```

```js
yearMonth('2026-05').compare('2026-11'); // -1
yearMonth('2026-11').compare('2026-11-16'); // 0
```
:::

:::entry
### `equals()` :kind[method]

```js signature
ym.equals(other): boolean
```

2つの値が同じ年と月を表す場合に `true` を返します。

```js
yearMonth('2026-11').equals(yearMonth(2026, 11)); // true
```
:::

:::entry
### `isBefore()` :kind[method]

```js signature
ym.isBefore(other): boolean
```

この年月が相手より早い場合に `true` を返します。

```js
yearMonth('2026-10').isBefore('2026-11'); // true
```
:::

:::entry
### `isAfter()` :kind[method]

```js signature
ym.isAfter(other): boolean
```

この年月が相手より遅い場合に `true` を返します。

```js
yearMonth('2026-12').isAfter('2026-11'); // true
```
:::

:::entry
### `contains()` :kind[method]

```js signature
ym.contains(day): boolean
ym.includes(day): boolean
```

指定したカレンダー日付またはタイムスタンプがこの年月に含まれる場合に `true` を返します。`includes()` はエイリアスです。

**引数**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: 日付文字列、`CalendarDate`、`DateTime`、フィールドオブジェクト、または `Date`。
```

**戻り値**

```returns
type: boolean
description: "`day` がこの月に含まれる場合は `true`。"
```

```js
const nov = yearMonth('2026-11');

nov.contains('2026-11-16'); // true
nov.contains('2026-12-01'); // false
```
:::

:::entry
### `isPast()` :kind[method]

```js signature
ym.isPast(zone?): boolean
```

指定したタイムゾーン（省略時は設定済みのタイムゾーン）で、この月全体が今月より前の場合に `true` を返します。

```js
yearMonth('2020-01').isPast('UTC'); // true
```
:::

:::entry
### `isFuture()` :kind[method]

```js signature
ym.isFuture(zone?): boolean
```

指定したタイムゾーン（省略時は設定済みのタイムゾーン）で、この月が今月より後の場合に `true` を返します。

```js
yearMonth('2099-01').isFuture('UTC'); // true
```
:::

:::entry
### `isLeapYear()` :kind[method]

```js signature
ym.isLeapYear(): boolean
```

この月が属する年が366日（うるう年）の場合に `true` を返します。

```js
yearMonth('2028-02').isLeapYear(); // true
yearMonth('2026-02').isLeapYear(); // false
```
:::

## 期間の計測

:::entry
### `until()` :kind[method]

```js signature
ym.until(other): Duration
ym.until(other, unit): number
```

この月から別の月までの期間を計測します。対象が前の月なら負の期間を返します。返される [`Duration`](/api/duration/) はこの月の開始日を記憶しているため、月や年を任意の単位で合計できます。

**引数**

```params
- name: other
  type: YearMonthInput
  required: true
  description: 計測先となる年月。
- name: unit
  type: Unit
  description: 期間の合計を浮動小数点数で返すための単位名。
```

**戻り値**

```returns
type: Duration | number
description: 年と月で表す `Duration`、または `unit` を指定した場合は数値。
```

```js
const start = yearMonth('2026-03');

start.until('2027-06').toString(); // 'P1Y3M'
start.until('2027-06', 'months'); // 15
```
:::

:::entry
### `since()` :kind[method]

```js signature
ym.since(other): Duration
ym.since(other, unit): number
```

より前の年月からこの年月までに経過した期間を計測します。単位名を渡すと合計を数値で返します。

```js
yearMonth('2026-11').since('2026-05', 'months'); // 6
```
:::

## フォーマットと変換

:::entry
### `format()` :kind[method]

```js signature
ym.format(spec?, locale?): string
```

プリセット名、`Intl` オプションオブジェクト、または `'MM/YY'` のような組み込みトークンパターンで年月をフォーマットします。共有オプションオブジェクトに含まれる日・時刻・タイムゾーンのキーは自動的に無視されます。

標準プリセットおよびロケール対応プリセットは年と月だけを出力し、[`configure()`](/api/configure/) で登録したカスタムフォーマットも利用できます。プリセットとトークンの一覧は[フォーマット](/guides/formatting/)を参照してください。

**引数**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: プリセット名（`'medium'` や `'long'` など）、`Intl` オプションオブジェクト、またはトークンパターン。
- name: locale
  type: Locale
  description: この呼び出しに限り、この年月のロケールまたはグローバル設定を上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: フォーマットされた年月文字列。
```

```js
const nov = yearMonth('2026-11');

nov.format('short', 'en-US'); // '11/2026'
nov.format('medium', 'en-US'); // 'Nov 2026'
nov.format('long', 'en-US'); // 'November 2026'
nov.format('L', 'en-US'); // '11/2026'
nov.format('MM/YY'); // '11/26'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
ym.locale(): Locale | undefined
ym.locale(tag): YearMonth
```

この年月が保持するロケールを取得するか、テキスト表示・プリセット・派生するすべての値で別のロケールを使うコピーを返します。空のタグを渡すと保持されているロケールを解除します。[`lang()`](#lang) はエイリアスです。

**引数**

```params
- name: tag
  type: Locale | null | undefined
  description: 派生値に引き継ぐ BCP 47 ロケールタグ、または既存のタグを解除する `null`。
```

**戻り値**

```returns
type: YearMonth | Locale | undefined
description: 引数なしで呼び出した場合は有効なロケールタグ、引数を渡した場合は `tag` を保持する新しい `YearMonth`。
```

```js
const may = yearMonth('2026-05').locale('ru');

may.locale(); // 'ru'
may.format('long'); // 'май 2026 г.'
may.on(1).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
ym.lang(): Locale | undefined
ym.lang(tag): YearMonth
```

[`locale()`](#locale) の短縮エイリアスで、この年月の BCP 47 ロケールタグの取得または設定を行います。
:::

:::entry
### `as()` :kind[method]

```js signature
ym.as('yearMonth'): YearMonth
```

汎用的な変換チェーンで `'yearMonth'` が指定された場合にこのインスタンス自身を返し、それ以外の種別では `RangeError` をスローします。
:::

:::entry
### `toString()` :kind[method]

```js signature
ym.toString(): string
ym.toJSON(): string
```

HTML の month 入力欄と一致する ISO 8601 の年月文字列を返します。`toJSON()` も JSON シリアライズ用に同じ文字列を返します。

**戻り値**

```returns
type: string
description: ISO 8601 の年月文字列（`'2026-11'` など）。
```

```js
yearMonth(2026, 11).toString(); // '2026-11'
JSON.stringify({ billing: yearMonth(2026, 11) }); // '{"billing":"2026-11"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
ym.toTemporal(): Temporal.PlainYearMonth
```

内部の `Temporal.PlainYearMonth` インスタンスを返します。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
ym.valueOf(): never
```

数値演算子によって年月が数値へ暗黙変換されないよう、`RangeError` をスローします。型が不明な値の絞り込みには [`isYearMonth()`](/api/kind-of/#isyearmonth) または [`kindOf()`](/api/kind-of/) を使ってください。
:::
