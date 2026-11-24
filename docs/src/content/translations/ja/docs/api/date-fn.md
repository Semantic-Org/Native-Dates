---
source: "af294e4ed659"
title: date()
lede: 年・月・日順の日付文字列、年・月・日の数値、フィールドオブジェクト、または今日の日付から CalendarDate を作成します。
---

## カレンダー日付の読み取り

:::entry
### `date()` :kind[function]

```js signature
date(input, options?): CalendarDate
date(input, zone?): CalendarDate
date(year, month, day): CalendarDate
```

年・月・日順の日付文字列、1始まりの3つの数値、フィールドオブジェクト、または既存の日付・タイムスタンプから [`CalendarDate`](/api/calendar-date/) を作成します。2月30日のような存在しない日付は、3月に繰り上がることなく `RangeError` をスローします。

```js title="create.js"
import { date, datetime } from 'native-dates';

const fromIso = date('2026-11-16');
const fromSlashes = date('2026/11/6');
const fromNumbers = date(2026, 11, 16);
const fromFields = date({ year: 2026, month: 11, day: 16 });
const fromMoment = date(datetime('2026-11-17T02:00:00Z', 'America/Los_Angeles'));

fromSlashes.toString(); // '2026-11-06'
fromMoment.toString(); // '2026-11-16'
```

**引数**

```params
- name: input
  type: CalendarDateInput | number
  required: true
  description: ISO 日付文字列、フィールドオブジェクト、既存の日付またはタイムスタンプ、あるいは4桁の `year`。
- name: options
  type: Zone | ReadOptions | number
  description: タイムスタンプや loose 文字列を読み取る際のタイムゾーンまたはオプションオブジェクト、あるいは1〜12の1始まりの `month`。
  options:
    - name: zone
      type: Zone
      description: 瞬間を表す文字列、`DateTime`、または `Date` からカレンダー日付を取り出す際に使うタイムゾーン。
    - name: locale
      type: Locale
      description: 返される `CalendarDate` とそこから派生するすべての値に引き継がれる BCP 47 ロケールタグ。
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose` で非定型の日付文字列を解析し、読み取れない入力には `null` を返す設定。"
    - name: dayFirst
      type: boolean
      description: "loose モードで `'07.09.2026'` のような数値日付を解析する際、アクティブなロケールの並び順を上書きする設定。"
- name: day
  type: number
  description: "`year`、`month`、`day` の3引数で渡す際の1〜31の日。"
```

**戻り値**

```returns
type: CalendarDate
description: "時刻やタイムゾーンを持たない `CalendarDate`。loose モードで `input` を読み取れない場合は `null`。"
```

ISO タイムスタンプや JavaScript 標準の `Date` を読み取る場合は、どの地域のカレンダー日付として取り出すかをタイムゾーンで指定します。

```js
date('2026-11-17T02:00:00Z', 'America/Los_Angeles').toString(); // '2026-11-16'
date('2026-11-17T02:00:00Z', 'Asia/Tokyo').toString(); // '2026-11-17'
```
:::

### 受け付ける入力

月は JavaScript の0始まりの `Date` コンストラクターとは異なり、常に1月が1、12月が12となります。年と月だけがあって日がない入力は、自動的に1日とみなさず `RangeError` をスローします。年月の値には [`yearMonth()`](/api/year-month-fn/) を使ってください。

| 入力 | 例 | 読み取り方 |
|---|---|---|
| 年・月・日順の日付文字列 | `'2026-11-16'`, `'2026/11/6'`, `'2026年11月16日'` | ラテン文字とコロン以外の区切り文字で4桁の年・月・日を読み取ります。 |
| ローカル日時文字列 | `'2026-11-16T09:30'` | カレンダー日付のみを保持し、時刻を除きます。 |
| ISO 瞬間文字列 | `'2026-11-17T02:00:00Z'` | 指定したタイムゾーン（省略時は設定済みのデフォルト）における、その時点のカレンダー日付を読み取ります。 |
| 年・月・日の数値 | `date(2026, 11, 16)` | 1月を `1`、12月を `12` とする3つの整数を受け取ります。 |
| フィールドオブジェクト | `{ year: 2026, month: 11, day: 16 }` | 1始まりのカレンダーフィールドを読み取り、存在しない日付を拒否します。 |
| [DateTime](/api/date-time/) | `date(dt, 'Asia/Tokyo')` | 指定したタイムゾーン（省略時は `dt.zone`）のカレンダー日付を取り出します。 |
| JavaScript の Date | `date(jsDate, 'America/Los_Angeles')` | 指定したタイムゾーン（省略時は設定済みのデフォルト）における、そのタイムスタンプのカレンダー日付を読み取ります。 |
| Temporal の値 | `Temporal.PlainDate`, `Temporal.Instant` | 任意の暦のプレーン日付は同じ ISO 日付として読み取り、瞬間は対象タイムゾーンへ変換します。 |

:::note[タイムスタンプはタイムゾーンに依存します]
末尾に `Z` や UTC オフセットが付いた ISO 文字列は単一の瞬間を表しますが、地域によっては2つの異なるカレンダー日付になり得ます。サーバー上でユーザーのカレンダー日付を取り出すときは、タイムゾーンを明示してください。
:::

## 相対的なカレンダー日付

「今日」が何日かは地球上の場所によって変わります。以下の各ヘルパーは任意のタイムゾーンを受け取り、省略時は[設定済みのデフォルト](/api/configure/)にフォールバックします。

:::entry
### `today()` :kind[function]

```js signature
today(zone?): CalendarDate
```

指定したタイムゾーン（省略時は設定済みのデフォルト）における今日のカレンダー日付を返します。アメリカ大陸の夜遅い時間帯には、アジアやオセアニアではすでに翌日の日付に入っています。

**引数**

```params
- name: zone
  type: Zone
  description: "現在のカレンダー日付を取得するタイムゾーン（`'Asia/Tokyo'` や `'America/Los_Angeles'` など）。"
```

**戻り値**

```returns
type: CalendarDate
description: "`zone` における今日の `CalendarDate`。"
```

```js
import { datetime, today } from 'native-dates';

const inLosAngeles = today('America/Los_Angeles');
const inTokyo = today('Asia/Tokyo');

// 11月17日 02:00 UTC の時点で、ロサンゼルスはまだ11月16日だが、東京は11月17日になっている
const moment = '2026-11-17T02:00:00Z';
datetime(moment, 'America/Los_Angeles').date.toString(); // '2026-11-16'
datetime(moment, 'Asia/Tokyo').date.toString(); // '2026-11-17'
```
:::

:::entry
### `tomorrow()` :kind[function]

```js signature
tomorrow(zone?): CalendarDate
```

指定したタイムゾーンにおける明日のカレンダー日付（[`today(zone)`](#today) の1日後）を返します。

**引数**

```params
- name: zone
  type: Zone
  description: 今日から1日進める基準となるタイムゾーン。
```

**戻り値**

```returns
type: CalendarDate
description: "`zone` における明日の `CalendarDate`。"
```

```js
import { tomorrow } from 'native-dates';

const nextDay = tomorrow();
const londonTomorrow = tomorrow('Europe/London');
```
:::

:::entry
### `yesterday()` :kind[function]

```js signature
yesterday(zone?): CalendarDate
```

指定したタイムゾーンにおける昨日のカレンダー日付（[`today(zone)`](#today) の1日前）を返します。

**引数**

```params
- name: zone
  type: Zone
  description: 今日から1日戻す基準となるタイムゾーン。
```

**戻り値**

```returns
type: CalendarDate
description: "`zone` における昨日の `CalendarDate`。"
```

```js
import { yesterday } from 'native-dates';

const priorDay = yesterday();
const londonYesterday = yesterday('Europe/London');
```
:::
