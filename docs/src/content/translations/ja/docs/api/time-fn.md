---
source: "bb49ea92ac08"
title: time()
lede: 12時間制・24時間制の時刻文字列、数値、フィールドオブジェクト、またはタイムスタンプから Time を作成します。
---

## 時刻の読み取り

:::entry
### `time()` :kind[function]

```js signature
time(input, options?): Time
time(input, zone?): Time
time(hour, minute?, second?): Time
```

時刻文字列、整数の時・分・秒、フィールドオブジェクト、またはタイムスタンプから [`Time`](/api/time/) を作成します。入力が欠けている場合は現在時刻にフォールバックせず、`TypeError` をスローします。

```js title="clock.js"
import { datetime, time } from 'native-dates';

const morning = time('9am');
const closing = time('5:30pm');
const iso = time('17:30:00');
const fromNumbers = time(9, 30);
const fromFields = time({ hour: 17, minute: 30, millisecond: 250 });
const fromInstant = time('2026-11-16T17:30:00Z', 'America/New_York');
const fromMoment = time(datetime('2026-11-16T17:30:00Z'), 'Europe/Berlin');
const fromTemporal = time(Temporal.PlainTime.from('08:15'));

closing.toString(); // '17:30:00'
fromInstant.toString(); // '12:30:00'
fromMoment.toString(); // '18:30:00'
```

**引数**

```params
- name: input
  type: TimeInput | number
  required: true
  description: 時刻文字列、フィールドオブジェクト、既存の時刻またはタイムスタンプ、あるいは0〜23の24時間制 `hour`。
- name: options
  type: Zone | ReadOptions | number
  description: タイムスタンプや loose 文字列を読み取る際のタイムゾーンまたはオプションオブジェクト、あるいは0〜59の `minute`。
  options:
    - name: zone
      type: Zone
      description: 瞬間を表す文字列、`DateTime`、または `Date` から時刻を取り出す際に使うタイムゾーン。
    - name: locale
      type: Locale
      description: 返される `Time` とそこから派生するすべての値に引き継がれる BCP 47 ロケールタグ。
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose` を使用し、非定型の日時文字列を読み取り、読み取れない入力には `null` を返す設定。"
    - name: dayFirst
      type: boolean
      description: loose モードで日付と時刻を含む文字列を解析する際、アクティブなロケールの数値日付順を上書きする設定。
- name: second
  type: number
  description: 数値で渡す際の0〜59の整数 `second`。秒未満の桁は文字列またはフィールドオブジェクトで指定。
```

**戻り値**

```returns
type: Time
description: "1日の中の時刻を表す `Time`。loose モードで `input` を読み取れない場合は `null`。"
```

[loose プラグイン](/plugins/loose/)を読み込むと、loose モードでは各言語の時間帯表記（午前・午後など）、ドット区切りを採用するロケールの時刻表記、および非定型のタイムスタンプ文字列を解析できます。読み取れない入力に対しては `null` を返します。

```js
import { time } from 'native-dates';
import '@native-dates/plugins/loose';

time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('Mon, 16 Nov 2026 17:30:00 GMT', {
  zone: 'America/New_York',
  loose: true,
})?.toString(); // '12:30:00'
time('whenever', { loose: true }); // null
```
:::

## 受け付ける入力

12時間制の文字列では、1〜12の時と英語の AM・PM 表記を受け付けます。深夜0時は 12 AM、正午は 12 PM です。

| 入力 | 例 | 読み取り方 |
|---|---|---|
| 12時間制の時刻文字列 | `'9am'`, `'5:30pm'`, `'12:15 a.m.'` | 1〜12の時と `am`・`pm`、および任意の分・秒・秒未満の桁を読み取ります。 |
| 24時間制の時刻文字列 | `'09:00'`, `'14h30'`, `'17:30:15.250'` | 時と分の間をコロンまたは `h` で区切った24時間制文字列をナノ秒まで読み取ります。 |
| ISO 瞬間文字列 | `'2026-11-16T17:30:00Z'` | 指定したタイムゾーン（省略時は設定済みのデフォルト）における、その時点のローカル時刻を読み取ります。 |
| 時刻の数値 | `time(9)`, `time(9, 30)`, `time(17, 30, 15)` | 時と、任意の分・秒を整数で受け取ります。 |
| フィールドオブジェクト | `{ hour: 9, minute: 30, millisecond: 250 }` | 単数形・複数形の時刻フィールドを読み取り、範囲外の数値は拒否します。 |
| [DateTime](/api/date-time/) または Temporal | `time(dt, 'Asia/Tokyo')`, `Temporal.PlainTime` | 時刻を取り出します。タイムゾーンを指定した場合は瞬間をそのタイムゾーンへ変換します。 |
| JavaScript の Date | `time(jsDate, 'America/New_York')` | 指定したタイムゾーン（省略時は設定済みのデフォルト）における、その瞬間の時刻を読み取ります。 |

:::tip[現在時刻の取得]
任意のタイムゾーンの現在時刻を取得するには、[`now()`](/api/datetime-fn/#now) を使って `now('Europe/Berlin').time` のように記述します。
:::
