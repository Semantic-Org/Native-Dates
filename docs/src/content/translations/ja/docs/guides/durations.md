---
source: "d8be401b7194"
title: 期間
lede: 単位ヘルパーや英語の単位表現から期間を作成し、2つの値の差分の計測やフォーマットを行います。
---

[`Duration`](/api/duration/) は、90分や2週間といった時間の長さを表します。日付計算のために直接作成することも、2つの値の差分を計測した結果として受け取ることもできます。

## Duration の作成

[`hours()`](/api/duration-fn/#hours) のような単位ヘルパーを使うか、英語の単位表現、ISO 8601 文字列、フィールドオブジェクトを [`duration()`](/api/duration-fn/) に渡して作成します。

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
const iso = duration('PT1H30M');
const window = duration({ hours: 2, minutes: 45 });
```

各単位の値はインスタンスから直接読み取れます。小数の入力は自動的に1つ下の単位へ繰り下がりますが、整数の入力は指定した単位のまま保持されます。

```js
call.hours; // 1
call.minutes; // 30

const ninety = duration(90, 'minutes');
ninety.hours; // 0
ninety.minutes; // 90
```

## 2つの値の差分の計測

2つの日付・時刻・[`YearMonth`](/api/year-month/)・日時に対して [`until()`](/api/date-time/#until) または [`since()`](/api/date-time/#since) を呼び出すと、そのあいだの期間を計測できます。

```js
import { datetime } from 'native-dates';

const opened = datetime('2026-11-16T08:00', 'America/Los_Angeles');
const resolved = datetime('2026-11-16T10:30', 'America/Los_Angeles');

const elapsed = opened.until(resolved);
elapsed.hours; // 2
elapsed.minutes; // 30
```

計算やプログレスバー用に単一の数値だけが欲しい場合は、第2引数に対象の英語の単位名を渡します。

```js
opened.until(resolved, 'hours'); // 2.5
resolved.since(opened, 'minutes'); // 150
```

すべての [範囲](/api/ranges/) も `.duration` プロパティで期間を直接参照できます。

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01', '2026-11-07').duration.days; // 7
timeRange('9:00am', '5:30pm').duration.hours; // 8
```

## 単位の繰り上げと合計

期間の値は明示的に変換しない限り、指定した単位のまま維持されます。上位の単位へ繰り上げたいときは [`balance()`](/api/duration/#balance) を呼び出します。

```js
import { hours, minutes, months } from 'native-dates';

minutes(90).balance().toFields(); // { hours: 1, minutes: 30 }
months(18).balance().toFields(); // { years: 1, months: 6 }
hours(36).balance('day').toFields(); // { days: 1, hours: 12 }
```

引数を省略した場合、単独の期間は月を年へ、時刻単位を時間まで繰り上げます。夏時間の境界で1日の長さがずれないよう、日単位には変換しません。

1日を24時間、1週間を7日として固定で繰り上げたい場合は、`'day'` や `'week'` を渡してください。

[`total()`](/api/duration/#total) またはエイリアスの [`as()`](/api/duration/#as) を呼び出すと、期間全体を1つの単位に換算した浮動小数点数を取得できます。

```js
import { duration } from 'native-dates';

const shift = duration('7h 30m');

shift.total('hours'); // 7.5
shift.as('minutes'); // 450
```

:::note[月・年単位での合計]
年と月は1年を12か月としてそのまま相互に合計・繰り上げできます。一方、日と月のあいだで換算するには基準となるカレンダー日付が必要であり、`until()` や `since()` で得た期間はその基準日付を自動的に記憶します。
:::

```js
import { date, months } from 'native-dates';

months(18).total('years'); // 1.5

const span = date('2026-01-15').until('2026-04-15');
span.total('months'); // 3
span.total('days'); // 90
```

## 期間のフォーマット

すべてのインスタンスでは、`.text` から現在のロケールによる完全表記を取得できます。完全表記・省略表記・最小表記・デジタル表記を選ぶには、プリセットスタイルを指定して [`format()`](/api/duration/#format) を呼び出します。

```js
import { duration } from 'native-dates';

const flight = duration({ hours: 2, minutes: 30 });

flight.text; // '2 hours, 30 minutes'
flight.format('long', 'en-US'); // '2 hours, 30 minutes'
flight.format('short', 'en-US'); // '2 hr, 30 min'
flight.format('narrow', 'en-US'); // '2h 30m'
flight.format('digital', 'en-US'); // '2:30:00'
```

第2引数にロケールタグを渡すとその言語の単位表記で出力されます。API ペイロード用に ISO 8601 文字列が必要な場合は [`toString()`](/api/duration/#tostring) を呼び出してください。
