---
source: "50f6c5cb4f97"
title: datetime()
lede: タイムスタンプ、文字列、Date、フィールドオブジェクトから DateTime を作成するか、現在の日時を取得します。
---

## 時点の読み取り

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, zone?): DateTime
datetime(input, options?): DateTime
```

文字列、タイムスタンプ、フィールドオブジェクト、またはカレンダー日付を読み取り、指定したタイムゾーンで解釈された [`DateTime`](/api/date-time/) を作成します。タイムゾーンを省略すると、[設定済みのデフォルト](/api/configure/)または実行環境のローカルタイムゾーンが使われます。

```js title="read.js"
import { date, datetime } from 'native-dates';

const fromUtc = datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles');
const fromWall = datetime('2026-11-16 09:30', 'Europe/Berlin');
const fromZone = datetime('2026-11-16T09:30[America/New_York]');
const fromEpoch = datetime(1794850200000, 'UTC');
const fromDate = datetime(date('2026-11-16'), 'America/New_York');
```

**引数**

```params
- name: input
  type: DateTimeInput
  required: true
  description: ISO 文字列、エポックミリ秒、`Date`、フィールドオブジェクト、カレンダー日付、または Temporal の値。
- name: zoneOrOptions
  type: Zone | ReadOptions
  description: "`'Europe/Berlin'` や `'UTC'` のようなタイムゾーン文字列、またはオプションオブジェクト。"
  options:
    - name: zone
      type: Zone
      description: "時点を解釈・表現するタイムゾーン。`input` に含まれる角括弧 `[...]` 内のタイムゾーンより優先。"
    - name: locale
      type: Locale
      description: 返される `DateTime` とそこから派生するすべての値に引き継がれる BCP 47 ロケールタグ。
    - name: loose
      type: boolean
      default: 'false'
      description: "`@native-dates/plugins/loose` を使用し、非定型の日付文字列を解析して読み取れない入力には `null` を返す設定。"
    - name: dayFirst
      type: boolean
      description: "loose モードで `'07/09/2026'` のような数値日付を解析する際、アクティブなロケールの並び順を上書きする設定。"
```

**戻り値**

```returns
type: DateTime
description: "解決されたタイムゾーン上の `DateTime`。loose モードで `input` を読み取れない場合は `null`。"
```

[`@native-dates/plugins/loose`](/plugins/loose/) をインポートすると、loose モードではアクティブなロケールで非定型の日付・時刻を読み取り、機械向け形式はエンジンの解析にフォールバックします。読み取れない入力に対しては `null` を返します。

```js
import { datetime } from 'native-dates';
import '@native-dates/plugins/loose';

datetime('Mon, 16 Nov 2026 17:30:00 GMT', { zone: 'America/New_York', loose: true });
datetime('not a timestamp', { loose: true }); // null
```
:::

### 受け付ける入力

どの入力からも、対象タイムゾーンで表現されたイミュータブルなインスタンスが生成されます。

| 入力 | 例 | 読み取り方 |
|---|---|---|
| オフセット付き ISO 文字列 | `'2026-11-16T17:30:00Z'`, `'2026-11-16 12:30-05:00'` | 正確な瞬間を確定したうえで、対象タイムゾーンでの日時として表現します。 |
| 角括弧付きタイムゾーン文字列 | `'2026-11-16T09:30[America/New_York]'` | 第2引数でタイムゾーンを上書きしない限り、角括弧内のタイムゾーンを維持します。 |
| ローカル日時 | `'2026-11-16T09:30'`, `'2026年11月16日 14:30'` | 年・月・日順の日付と時刻を、対象タイムゾーンで直接読み取ります。 |
| 日付文字列または [CalendarDate](/api/calendar-date/) | `'2026-11-16'`, `date(2026, 11, 16)` | 対象タイムゾーンにおける、そのカレンダー日付の開始時点として読み取ります。 |
| ミリ秒または Date | `1794850200000`, `new Date()` | Unix タイムスタンプを対象タイムゾーンに変換します。`Date` と同様にミリ秒未満の端数は切り捨てます。 |
| フィールドオブジェクト | `{ year: 2026, month: 11, day: 16, hour: 9 }` | 対象タイムゾーンで1始まりの日付・時刻フィールドを読み取り、存在しない日付を拒否します。 |
| DateTime または Temporal | `dt`, `Temporal.Instant`, `Temporal.ZonedDateTime` | 明示的なタイムゾーン引数を渡さない限り、元のタイムゾーンを維持します。 |

:::note[欠損値が現在日時になることはありません]
`undefined` や `null` などの欠損値はエラーをスローするため、空のデータベースカラムが誤って現在日時に化けることはありません。現在日時を取得する場合は [`now()`](#now) を呼び出してください。
:::

## 現在の日時と今日

現在日時を取得したり、任意のタイムゾーンで今日の検索範囲となる開始・終了日時を作成したりできます。

:::entry
### `now()` :kind[function]

```js signature
now(zone?): DateTime
```

指定したタイムゾーン（省略時は設定済みのデフォルト）における現在日時をミリ秒精度で返します。ミリ秒精度は `Date.now()` と一致するため、JSON ペイロードを介した往復変換でも値が変わりません。

**引数**

```params
- name: zone
  type: Zone
  description: "現在日時を取得するタイムゾーン（`'Asia/Tokyo'` や `'UTC'` など）。"
```

**戻り値**

```returns
type: DateTime
description: "`zone` における現在日時（ミリ秒精度）の `DateTime`。"
```

```js
import { now } from 'native-dates';

const local = now();
const tokyo = now('Asia/Tokyo');
const utc = now('UTC');
```
:::

:::entry
### `startOfToday()` :kind[function]

```js signature
startOfToday(zone?): DateTime
```

指定したタイムゾーンにおける今日の開始日時（現地カレンダー日の始まり）を返します。今日作成されたイベントやレコードを検索する際の下限として便利です。

**引数**

```params
- name: zone
  type: Zone
  description: 今日の日付を判定するタイムゾーン。
```

**戻り値**

```returns
type: DateTime
description: "`zone` における今日の開始日時を表す `DateTime`。"
```

```js
import { startOfToday } from 'native-dates';

const opens = startOfToday('America/New_York');
opens.hour; // 0
opens.minute; // 0
```
:::

:::entry
### `endOfToday()` :kind[function]

```js signature
endOfToday(zone?): DateTime
```

指定したタイムゾーンにおける今日の最終ミリ秒を返します。

**引数**

```params
- name: zone
  type: Zone
  description: 今日の日付を判定するタイムゾーン。
```

**戻り値**

```returns
type: DateTime
description: "`zone` における今日の日付の `23:59:59.999` を表す `DateTime`。"
```

```js
import { endOfToday } from 'native-dates';

const cutoff = endOfToday('America/New_York');
cutoff.hour; // 23
cutoff.millisecond; // 999
```
:::
