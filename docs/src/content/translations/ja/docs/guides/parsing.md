---
source: "326d94af83a9"
title: 解析
lede: ISO 文字列、期間、範囲、自由形式のユーザー入力を、あいまいな推測なしに読み取ります。
---

コアパッケージは、あいまいさのない標準的な入力を指定した型へ直接解析します。

- [`datetime()`](/api/datetime-fn/)：特定の時点、エポックミリ秒、タイムスタンプ
- [`date()`](/api/date-fn/)：時刻やタイムゾーンを持たないカレンダー日付
- [`time()`](/api/time-fn/)：24時間制および12時間制の時刻
- [`duration()`](/api/duration-fn/)：英語の単位表現および ISO 8601 の期間文字列
- [`yearMonth()`](/api/year-month-fn/) と [`monthDay()`](/api/month-day-fn/)：請求対象月、カードの有効期限、毎年の誕生日
- [`dateRange()`](/api/range-fn/#daterange)、[`datetimeRange()`](/api/range-fn/#datetimerange)、[`timeRange()`](/api/range-fn/#timerange)：区間文字列および開始・終了のペア

## ISO 日付とタイムスタンプ

`date()` には、年・月・日順の文字列、年・月・日の3つの数値、またはフィールドオブジェクトを渡します。年・月・日順の文字列は1桁・2桁どちらの月日も受け付け、英字とコロン以外の区切り文字に対応します。日本語・中国語・韓国語の日付表記やスペース入りドット区切りも、コアだけでそのまま解析できます。

月は1始まりの1〜12で指定します。2月30日のような存在しない日付や、`'2026-W05-1'` のような ISO 週・四半期文字列は推測せずエラーをスローします。

```js
import { date } from 'native-dates';

date('2026-11-16');
date('2026/11/6');
date('2026年11月16日');
date('2026. 11. 16.');
date(2026, 11, 16);
date({ year: 2026, month: 11, day: 16 });
```

`datetime()` には ISO 8601 文字列またはフィールドオブジェクトを渡します。末尾に `Z` や数値オフセットが付いていればその正確な時点として解釈され、オフセットがない場合は指定タイムゾーンのローカル日時として解釈されます。

```js
import { datetime } from 'native-dates';

datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30[Europe/Berlin]'); // 9:30 AM CET
datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
```

オフセット付きタイムスタンプを `date()` や `time()` に渡すと、指定したタイムゾーンにおけるカレンダー日付またはローカル時刻を取り出せます。

```js
import { time } from 'native-dates';

date('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 2026-11-16
date('2026-11-17T01:30:00Z', 'Asia/Tokyo'); // 2026-11-17
time('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 17:30:00
```

## 時刻と期間

`time()` には、24時間制の ISO 時刻、`'14h30'` のような時分表記、12時間制の時刻文字列、数値引数、またはフィールドオブジェクトを渡します。期間表記との混同を避けるため、`'14h'` のように時だけの表記はエラーになります。

```js
import { time } from 'native-dates';

time('09:30');
time('14h30');
time('9:30am');
time('5:15 PM');
time(17, 15, 30);
time({ hour: 9, minute: 30 });
```

`duration()` には、英語の単位表現、ISO 8601 の期間文字列、数値と英語の単位名、またはフィールドオブジェクトを渡します。

```js
import { duration } from 'native-dates';

duration('1h 30m');
duration('2 weeks and 3 days');
duration('PT90M');
duration(90, 'minutes');
duration({ hours: 1, minutes: 30 });
```

## 部分日付と範囲

ISO 形式の年月文字列は [`yearMonth()`](/api/year-month-fn/) で、月が先に来るカード有効期限などは [`monthYear()`](/api/year-month-fn/#monthyear) で解析します。

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

yearMonth('2026-11');
monthYear('11/28'); // YearMonth(2028-11)

monthDay('10/17');
dayMonth('17/10'); // MonthDay(10-17)
```

年のない毎年の日付も同様に [`monthDay()`](/api/month-day-fn/) と [`dayMonth()`](/api/month-day-fn/#daymonth) で扱えます。区間については、[範囲のファクトリ](/api/range-fn/) が開始・終了のペアと単一の区間文字列の両方を受け付けます。

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01/2026-11-07');
timeRange('9am - 5pm');
```

## エポックタイムスタンプ・Date・Temporal

エポックミリ秒、JavaScript 標準の `Date`、[Temporal との連携](/guides/temporal/) で扱う `Temporal` オブジェクトは、そのまま `datetime()` に渡せます。

`date()` に単体の数値を渡すとタイムゾーンがあいまいになるためエラーになります。エポックミリ秒から日付を得たい場合は、まずタイムゾーンを指定して日時に変換してからカレンダー日付を取得してください。

```js
import { date, datetime } from 'native-dates';

const fromEpoch = datetime(1794850200000, 'UTC');
const fromJSDate = datetime(new Date('2026-11-16T17:30:00Z'));
const localDay = date(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
```

## あいまいな文字列がエラーになる理由

先頭に4桁の年がある文字列は解釈が1通りに決まりますが、`'03/05/2026'` は米国では3月5日、欧州や中南米では5月3日を意味します。本番環境で月と日を取り違えないよう、コアパッケージはあいまいな数値日付を推測せず拒否します。

:::warning[空の値は現在日時にフォールバックしない]
どのファクトリでも空の値を渡すと現在日時を返さずにエラーをスローするため、API の欠損フィールドが誤って「今日」として扱われることはありません。現在の日時や日付が必要なときは [`now()`](/api/datetime-fn/#now) または [`today()`](/api/date-fn/#today) を明示的に呼び出してください。
:::

## loose プラグインによるユーザー入力の解析

ユーザーの自由入力、CSV エクスポート、RFC 2822 ヘッダーなどを解析するときは、[`@native-dates/plugins/loose`](/plugins/loose/) をインポートして `{ loose: true }` を渡します。loose モード（緩やかな解析）では、各言語の月名、午前・午後などの時間帯表記、ドット区切りの時刻、ASCII 以外の数字を含め、現在のロケールの書き方に沿って日付や時刻を読み取ります。

```js
import '@native-dates/plugins/loose';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('Nov 16, 2026', { loose: true }); // 2026-11-16
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // 2026-11-16
datetime('Mon, 16 Nov 2026 17:30:00 GMT', { loose: true });
time('오후 2:30', { loose: true, locale: 'ko' }); // 14:30:00
yearMonth('Nov 2026', { loose: true }); // 2026-11
monthDay('17 février', { loose: true, locale: 'fr' }); // 02-17
```

スラッシュやドット区切りの数値日付は現在のロケールの並び順に従います。ロケールと異なる順序の入力を扱う場合は、呼び出しごとに `dayFirst` を渡すか [`configure()`](/api/configure/) で設定します。

```js
date('03/05/2026', { loose: true, locale: 'en-US' }); // 2026-03-05
date('03/05/2026', { loose: true, locale: 'fr' }); // 2026-05-03
date('03/05/2026', { loose: true, locale: 'en-US', dayFirst: true }); // 2026-05-03
```

loose モードでは、解析できない入力に対してエラーをスローせず、すべてのファクトリと範囲で `null` を返します。ただし、未知のタイムゾーン名のような無効なオプション値は引き続きエラーをスローします。

```js
import { duration } from 'native-dates';

date('not a date', { loose: true }); // null
duration('soon', { loose: true }); // null
```

CSV エクスポート（`'24112026'`）、サーバーログ、ISO 週日付や通算日など、書式が決まった非 ISO 入力を扱う場合は、[`@native-dates/plugins/parse`](/plugins/parse/) をインポートして `{ format }` を渡してください。ヒューリスティックな推測ではなく、トークンによる確定的な照合で解析できます。

```js
import '@native-dates/plugins/parse';
import { date, datetime } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }); // 2026-11-24
datetime('24/Nov/2026:12:40:01 -0500', { format: 'DD/MMM/YYYY:HH:mm:ss ZZ' });
```
