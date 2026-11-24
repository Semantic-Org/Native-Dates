---
source: "436c0292465a"
title: MonthDay
lede: 年を持たない暦の月と日。誕生日、記念日、毎年の祝日に適しています。
---

## MonthDay の作成

月・日順で作成するには [`monthDay()`](/api/month-day-fn/)、日・月順で作成するには [`dayMonth()`](/api/month-day-fn/#daymonth) を使います。インスタンスはイミュータブルであり、元の値を変更せず、すべてのメソッドが新しい値を返します。

```js title="create.js"
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);
const fromIso = monthDay('10-17');
const european = dayMonth('17/10');
```

任意の[カレンダー日付](/api/calendar-date/)や[時点](/api/date-time/)の `monthDay` プロパティから月日を取り出したり、チェーン内で `as('monthDay')` を使って変換したりできます。

```js
import { date, datetime, today } from 'native-dates';

date('1990-10-17').monthDay.toString(); // '10-17'
datetime('2026-10-18T02:00:00Z', 'America/Los_Angeles').as('monthDay').toString(); // '10-17'
const currentMonthDay = today().monthDay;
```

## プロパティ

1始まりの月と日を取得できます。

| プロパティ | 型 | 説明 |
|---|---|---|
| `text` | `string` | ロケールに合わせてフォーマットされた月日文字列（例：`'Oct 17'`）。 |
| `month`, `day` | `number` | 暦の月（1〜12）と日（1〜31）。 |

## 年の指定と前後への移動

毎年繰り返す月日に年を組み合わせて具体的な日付を得たり、前後の到来日へ移動したりできます。

:::entry
### `in()` :kind[method]

```js signature
md.in(year): CalendarDate
```

この月日に年を指定し、[`CalendarDate`](/api/calendar-date/) を返します。2月29日は、うるう日のない平年では2月28日になります。

**引数**

```params
- name: year
  type: number | string
  required: true
  description: 整数で表す西暦の年（`2027` など）。
```

**戻り値**

```returns
type: CalendarDate
description: 指定した `year` におけるこの月日の `CalendarDate`。
```

```js
const birthday = monthDay(10, 17);
const leapDay = monthDay(2, 29);

birthday.in(2027).toString(); // '2027-10-17'
leapDay.in(2027).toString(); // '2027-02-28'
leapDay.in(2028).toString(); // '2028-02-29'
```
:::

:::entry
### `next()` :kind[method]

```js signature
md.next(day?): CalendarDate
```

基準日（デフォルトは [`today()`](/api/date-fn/#today)）より後に到来する次の日付を返します。基準日がすでにこの月日と同じ場合は翌年へ進みます。

カレンダー日付や時点でも、[`d.next(md)`](/api/calendar-date/#next) や [`dt.next(md)`](/api/date-time/#next) に月日を直接渡せます。

**引数**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: この日より後の到来日を探す基準日。
```

**戻り値**

```returns
type: CalendarDate
description: 指定した `day` より後に到来する次の `CalendarDate`。
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
date('2026-11-16').next(birthday).toString(); // '2027-10-17'
```
:::

:::entry
### `previous()` :kind[method]

```js signature
md.previous(day?): CalendarDate
md.last(day?): CalendarDate
```

基準日（デフォルトは [`today()`](/api/date-fn/#today)）より前で直近の到来日を返します。カレンダー日付や時点でも `previous()` に月日を直接渡せます。`last()` はエイリアスです。

**引数**

```params
- name: day
  type: CalendarDateInput
  default: today()
  description: この日より前の到来日を遡って探す基準日。
```

**戻り値**

```returns
type: CalendarDate
description: 指定した `day` より前で直近の `CalendarDate`。
```

```js
import { date, monthDay } from 'native-dates';

const birthday = monthDay(10, 17);

birthday.previous('2026-10-17').toString(); // '2025-10-17'
date('2026-11-16').previous(birthday).toString(); // '2026-10-17'
```
:::

:::entry
### `after()` :kind[method]

```js signature
md.after(day): CalendarDate
```

必須の基準日より後に到来する次の日付を返します。今日をデフォルトにしない点を除き、[`next()`](#next) と同様に動作します。

**引数**

```params
- name: day
  type: CalendarDateInput
  required: true
  description: この日より後を探す基準日。
```

**戻り値**

```returns
type: CalendarDate
description: 指定した `day` より後に最初に到来する `CalendarDate`。
```

```js
monthDay(2, 29).after('2026-03-01').toString(); // '2027-02-28'
```
:::

:::entry
### `before()` :kind[method]

```js signature
md.before(day): CalendarDate
```

必須の基準日より前で直近の到来日を返します。今日をデフォルトにしない点を除き、[`previous()`](#previous) と同様に動作します。

```js
monthDay(10, 17).before('2026-10-01').toString(); // '2025-10-17'
```
:::

## 一致判定と等価性

月日は単一の日付ではなく毎年繰り返すため、`isBefore()` のような順序比較メソッドはありません。

:::tip[equals と fallsOn の使い分け]
あるカレンダー日付がその年の該当日にあたるかを調べるには [`fallsOn()`](#fallson) を使ってください（2月29日は平年では2月28日として扱われます）。2つの値の月と日の数値が厳密に一致するかを調べる場合に [`equals()`](#equals) を使います。
:::

:::entry
### `fallsOn()` :kind[method]

```js signature
md.fallsOn(day): boolean
md.isOn(day): boolean
```

指定した日付が、その年におけるこの月日の該当日にあたる場合に `true` を返します。2月29日は平年では2月28日に該当し、うるう年では2月29日だけに該当します。`isOn()` はエイリアスです。

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
description: 指定した `day` がその年におけるこの月日の該当日である場合は `true`。
```

```js
const leapDay = monthDay(2, 29);

leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```
:::

:::entry
### `equals()` :kind[method]

```js signature
md.equals(other): boolean
```

2つの値がまったく同じ月と日の数値を持つ場合に `true` を返します。完全な日付やタイムスタンプが渡された場合は月と日を取り出して比較します。

`'05/10'` のようなスラッシュ区切りやドット区切りのあいまいな文字列は `RangeError` をスローします。比較する前に[月日ファクトリ](/api/month-day-fn/)で月・日順または日・月順を明示して解析してください。

**引数**

```params
- name: other
  type: MonthDayInput
  required: true
  description: 別の `MonthDay`、`'10-17'` のような ISO 文字列、フィールドオブジェクト、または日付値。
```

**戻り値**

```returns
type: boolean
description: 2つの値の月と日が同じ場合は `true`。
```

```js
const birthday = monthDay(10, 17);

birthday.equals('10-17'); // true
birthday.equals('1990-10-17'); // true
monthDay(2, 29).equals('2027-02-28'); // false
```
:::

:::entry
### `isToday()` :kind[method]

```js signature
md.isToday(zone?): boolean
```

指定したタイムゾーン（省略時は設定済みのタイムゾーン）で、この月日が今日に該当する場合に `true` を返します。

```js
import { today } from 'native-dates';

today('UTC').monthDay.isToday('UTC'); // true
```
:::

:::entry
### `isTomorrow()` :kind[method]

```js signature
md.isTomorrow(zone?): boolean
```

指定したタイムゾーン（省略時は設定済みのタイムゾーン）で、この月日が明日に該当する場合に `true` を返します。

```js
import { tomorrow } from 'native-dates';

tomorrow('UTC').monthDay.isTomorrow('UTC'); // true
```
:::

:::entry
### `isYesterday()` :kind[method]

```js signature
md.isYesterday(zone?): boolean
```

指定したタイムゾーン（省略時は設定済みのタイムゾーン）で、この月日が昨日に該当する場合に `true` を返します。

```js
import { yesterday } from 'native-dates';

yesterday('UTC').monthDay.isYesterday('UTC'); // true
```
:::

## フォーマットと変換

:::entry
### `format()` :kind[method]

```js signature
md.format(spec?, locale?): string
```

ロケール固有の順序、または `'MMM Do'` のような組み込みトークンパターンで月日をフォーマットします。共有オプションオブジェクトに含まれる年・時刻・タイムゾーンのキーは自動的に無視されます。

[`configure()`](/api/configure/) で登録したカスタムフォーマットも利用できます。また、毎年の日付がずれないよう、非グレゴリオ暦のロケールでもグレゴリオ暦の月名でフォーマットされます。プリセットとトークンの詳細は[フォーマット](/guides/formatting/)を参照してください。

**引数**

```params
- name: spec
  type: FormatSpec
  default: "'medium'"
  description: プリセット名（`'short'` や `'long'` など）、`Intl` オプションオブジェクト、またはトークンパターン。
- name: locale
  type: Locale
  description: この呼び出しに限り、この月日のロケールまたはグローバル設定を上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string
description: フォーマットされた月日文字列。
```

```js
const oct17 = monthDay(10, 17);

oct17.format('short', 'en-US'); // '10/17'
oct17.format('short', 'en-GB'); // '17/10'
oct17.format('medium', 'en-US'); // 'Oct 17'
oct17.format('long', 'en-US'); // 'October 17'
oct17.format('MMM Do', 'en-US'); // 'Oct 17th'
```
:::

:::entry
### `locale()` :kind[method]

```js signature
md.locale(): Locale | undefined
md.locale(tag): MonthDay
```

この月日が保持するロケールを取得するか、テキスト表示・プリセット・派生するすべての日付で別のロケールを使うコピーを返します。空のタグを渡すと保持されているロケールを解除します。[`lang()`](#lang) はエイリアスです。

**引数**

```params
- name: tag
  type: Locale | null | undefined
  description: 派生値に引き継ぐ BCP 47 ロケールタグ、または既存のタグを解除する `null`。
```

**戻り値**

```returns
type: MonthDay | Locale | undefined
description: 引数なしで呼び出した場合は有効なロケールタグ、引数を渡した場合は `tag` を保持する新しい `MonthDay`。
```

```js
const labourDay = monthDay(5, 1).locale('ru');

labourDay.locale(); // 'ru'
labourDay.format('long'); // '1 мая'
labourDay.in(2026).format('long'); // '1 мая 2026 г.'
```
:::

:::entry
### `lang()` :kind[method]

```js signature
md.lang(): Locale | undefined
md.lang(tag): MonthDay
```

[`locale()`](#locale) の短縮エイリアスで、この月日の BCP 47 ロケールタグの取得または設定を行います。
:::

:::entry
### `as()` :kind[method]

```js signature
md.as('monthDay'): MonthDay
```

汎用的な変換チェーンで `'monthDay'` が指定された場合にこのインスタンス自身を返し、それ以外の種別では `RangeError` をスローします。
:::

:::entry
### `toString()` :kind[method]

```js signature
md.toString(): string
md.toJSON(): string
```

月・日を各2桁（ゼロ埋め）で表す ISO 月日文字列 `'MM-DD'` を返します。この形式はどちらの[月日ファクトリ](/api/month-day-fn/)でも月・日順としてそのまま復元できます。`toJSON()` も JSON シリアライズ用に同じ文字列を返します。

**戻り値**

```returns
type: string
description: ISO の月日文字列（`'10-17'` など）。
```

```js
monthDay(5, 6).toString(); // '05-06'
JSON.stringify({ birthday: monthDay(10, 17) }); // '{"birthday":"10-17"}'
```
:::

:::entry
### `toTemporal()` :kind[method]

```js signature
md.toTemporal(): Temporal.PlainMonthDay
```

内部の `Temporal.PlainMonthDay` インスタンスを返します。
:::

:::entry
### `valueOf()` :kind[method]

```js signature
md.valueOf(): never
```

数値演算子によって月日が数値へ暗黙変換されないよう、`RangeError` をスローします。型が不明な値の絞り込みには [`isMonthDay()`](/api/kind-of/#ismonthday) または [`kindOf()`](/api/kind-of/) を使ってください。
:::
