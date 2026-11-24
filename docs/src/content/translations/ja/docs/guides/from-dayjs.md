---
source: "450f88efed26"
title: Day.js からの移行
lede: dayjs() のラッパーやプラグインチェーンを、用途別の専用型と組み込みタイムゾーンへ置き換えます。
---

Day.js は JavaScript の日付を単一の `dayjs()` オブジェクトでラップし、タイムゾーン・UTC・範囲・期間をプラグインで追加する設計です。Native Dates へ移行すると、軽量でイミュータブルな使い勝手はそのままに、カレンダー日付・時刻・日時・部分日付・範囲・期間をそれぞれ専用の型としてコアだけで扱えます。

## date() と datetime() の使い分け

Day.js では誕生日も API タイムスタンプも同じ `dayjs()` に渡します。

Native Dates では、カレンダー日付には [`date()`](/api/date-fn/) または [`today()`](/api/date-fn/#today) を使い、[請求月](/api/year-month-fn/)や[毎年の誕生日](/api/month-day-fn/)向けの部分日付ファクトリもコアに用意されています。

タイムゾーンを伴う特定の時点には [`datetime()`](/api/datetime-fn/) または [`now()`](/api/datetime-fn/#now) を使います。

```js
import { date, datetime, monthDay, now, today, yearMonth } from 'native-dates';

const current = now(); // タイムスタンプ用途の dayjs() を置き換え
const due = today().plus(2, 'weeks'); // 日付用途の dayjs().add(2, 'week') を置き換え
const created = datetime('2026-11-16T17:30:00Z');
const birthday = date('2026-05-10');
const billing = yearMonth('2026-11');
const recurring = monthDay('05-10');
```

既存のコードベースで `add()` や `subtract()` を呼び出している場合も、エイリアスとしてそのまま動作します。空の値をファクトリに渡すと現在日時を暗黙に返すのではなくエラーをスローするため、API フィールドの欠落を早い段階で検出できます。

## 月は1始まり

Day.js は1月を `0` とする0始まりの月番号を引き継いでおり、日付の「日」は `.date()` で読み取ります。Native Dates ではカレンダーの各フィールドが通常のプロパティになっており、月は 1〜12 の値で表します。

```js
import { date } from 'native-dates';

const d = date('2026-11-16');

d.year; // 2026
d.month; // 11（11月）
d.day; // 16
d.dayOfWeek; // 1（月曜日）
```

:::warning[月番号と曜日番号の違いに注意]
Day.js では月が 0〜11、曜日は日曜を 0 とする 0〜6 で表されます。Native Dates では `month` が 1〜12、`dayOfWeek` が月曜 1〜日曜 7 です。トークンパターンでは `'E'` が ISO の 1〜7 を出力し、`'d'` は Day.js と同じ 0〜6 を維持します。
:::

## タイムゾーン・期間・範囲を標準搭載

Day.js では都市間のタイムゾーン変換、期間の計算、日付が区間内にあるかの判定にそれぞれ別プラグインが必要です。Native Dates では IANA タイムゾーン、[期間](/api/duration/)、[範囲](/api/ranges/)が設定不要でコアに含まれています。

```js
import { dateRange, datetime, duration, hours } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin'); // .tz('Europe/Berlin') を置き換え

const span = duration('1h 30m').plus(hours(0.5));
span.total('minutes'); // 120

const november = dateRange('2026-11-01', '2026-11-30');
november.contains('2026-11-16'); // true
dateRange('2026-11-01', '2026-11-15').overlaps(november); // true
```

`isBetween()` に境界の開閉を示す括弧文字列を渡す必要はありません。日付範囲は両端を含み、日時範囲と時刻範囲は終了境界を自動で除外します。

## プリセットとトークンパターン

ロケールファイルやプラグインを追加しなくても、[`format()`](/api/date-time/#format) だけで `Intl` プリセット、Day.js 互換のローカライズ形式、カスタムの[トークンパターン](/guides/formatting/#token-patterns)をそのまま使えます。

```js
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T17:30:00Z', 'America/New_York');

dt.format('medium', 'en-US'); // 'Nov 16, 2026, 12:30 PM'
dt.format('LLL', 'en-US'); // 'November 16, 2026 at 12:30 PM'
dt.format('YYYY-MM-DD HH:mm'); // '2026-11-16 12:30'
```

## オプトインのプラグイン

[`@native-dates/plugins`](/plugins/) に分かれているのは、非 ISO 形式のテキスト解析、都市名・略称によるタイムゾーン解決、レガシー `Date` 互換ゲッターだけです。必要なサブパスを起動時に一度だけインポートしてください。

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

## 機能対応表

| Day.js | Native Dates | 補足 |
|---|---|---|
| `dayjs()` | `now()` または `today()` | 特定の時点かカレンダー日付かを明示的に選択 |
| `d.month()`, `d.date()` | `d.month`, `d.day` | 通常のプロパティ（月は 1〜12） |
| `d.day()`, `d.isoWeekday()` | `d.dayOfWeek` | ISO 準拠の月曜 1〜日曜 7（トークンは `'E'` が 1〜7、`'d'` が 0〜6） |
| `d.unix()`, `d.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | 1970年からの経過単位をプロパティ名で明示 |
| `d.add(2, 'day')` | `d.plus(2, 'days')` | `add()`・`subtract()` エイリアスも利用可能 |
| `dayjs.tz(x, zone)` | `datetime(x, zone)` | コア標準対応（`timezone` プラグイン不要） |
| `d.tz(zone)` | `dt.in(zone)` | 同じ時点を別の IANA タイムゾーンで表示 |
| `dayjs.utc(x)` | `datetime(x, 'UTC')` | コア標準対応（`utc` プラグイン不要） |
| `b.diff(a, 'day', true)` | `a.until(b, 'days')` | 指定した単位での小数を含む合計値 |
| `dayjs.duration(90, 'm')` | `minutes(90)` または `duration('90m')` | コア標準対応（`duration` プラグイン不要） |
| `d.format('LLL')` | `dt.format('LLL')` | `'LT'`〜`'llll'` のローカライズ済みプリセット |
| `d.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | コア標準の[トークンパターン](/guides/formatting/#token-patterns) |
| `d.isBetween(a, b)` | `dateRange(a, b).contains(d)` | `to()`・`for()`・`overlaps()` を備えた[範囲](/api/ranges/) |
| `d.fromNow()`, `d.from(other)` | `d.fromNow()`, `d.from(other)` | コア標準対応（`relativeTime` プラグイン不要） |
| `customParseFormat` | `{ loose: true }` | [`@native-dates/plugins/loose`](/plugins/loose/) で提供 |
