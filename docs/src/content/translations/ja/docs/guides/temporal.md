---
source: "ed93e959dec0"
title: Temporal との連携
lede: Native Dates が JavaScript の Temporal API にどう対応し、生の Temporal の値と相互運用するかを解説します。
---

Native Dates は JavaScript 組み込みの `Temporal` および `Intl` API をラップしています。

`Temporal` は厳密なカレンダーとタイムゾーンのプリミティブを、明示的なオプションオブジェクトと組み合わせて扱う設計です。Native Dates は日常的な呼び出しを簡潔なメソッドでラップしつつ、生の `Temporal` インスタンスと自由に相互運用できます。

## 各型と Temporal の対応

コアの各値クラスは対応する `Temporal` 型を1つ内部に保持しており、低レベルな制御が必要なときはいつでも取り出せます。

| 型 | ラップ対象 | Native Dates が追加する機能 |
|---|---|---|
| [`DateTime`](/api/date-time/) | `Temporal.ZonedDateTime` | ISO インスタント・オフセット・`Date`・エポック数値を1つのタイムゾーン付き型へ統合し、UTC にシリアライズ |
| [`CalendarDate`](/api/calendar-date/) | `Temporal.PlainDate` | `at(time, zone)` による時刻・タイムゾーン結合と、プリセットおよびトークンパターンによる直接フォーマット |
| [`Time`](/api/time/) | `Temporal.PlainTime` | 24時間制の ISO 時刻に加え、`'9:30am'` のような12時間制文字列を解析 |
| [`Duration`](/api/duration/) | `Temporal.Duration` | `'1h 30m'` のような英語の単位表現を解析し、小数の単位繰り下げや `until()` の基準点保持に対応 |
| [`YearMonth`](/api/year-month/) | `Temporal.PlainYearMonth` | 請求月やカード有効期限向けの組み込みクラス（[`monthYear()`](/api/year-month-fn/#monthyear) と `on()` を搭載） |
| [`MonthDay`](/api/month-day/) | `Temporal.PlainMonthDay` | 誕生日や毎年の記念日向けの組み込みクラス（[`dayMonth()`](/api/month-day-fn/#daymonth)・`fallsOn()`・`next()` を搭載） |

`Temporal` の仕様には範囲型が含まれていません。コアでは開始点と終了点のペアをもとに、包含判定・重複判定・反復処理を備えた [`DateRange`・`DateTimeRange`・`TimeRange`](/api/ranges/) を提供しています。

## Temporal オブジェクトの受け渡し

すべてのファクトリ関数、加減算メソッド、比較メソッドは生の `Temporal` の値をそのまま受け付けます。

```js
import { date, datetime, time, yearMonth } from 'native-dates';

const instant = Temporal.Instant.from('2026-11-16T17:30:00Z');
const standup = datetime(instant, 'America/Los_Angeles');

const plainDate = Temporal.PlainDate.from('2026-11-16');
date(plainDate).plus(Temporal.Duration.from({ weeks: 2 }));

const plainTime = Temporal.PlainTime.from('09:30');
time(plainTime).format('short', 'en-US'); // '9:30 AM'

const ym = yearMonth(Temporal.PlainYearMonth.from('2026-11'));
ym.daysInMonth; // 30
```

`Temporal.ZonedDateTime` を [`datetime()`](/api/datetime-fn/) に渡すと、別のタイムゾーンを明示しない限り元のタイムゾーンが維持されます。`Temporal.Instant` やタイムゾーンを持たない `PlainDateTime` を渡した場合は、指定したタイムゾーンまたは設定済みのデフォルトタイムゾーンに配置されます。

和暦やペルシャ暦など非 ISO 暦を使う `Temporal` の値や文字列も、事前に `withCalendar()` を呼び出さずに同じ ISO 日付へ変換されます。

比較や差分計算でも `Temporal` の値を直接渡せます。

```js
const berlin = Temporal.ZonedDateTime.from('2026-11-16T18:30:00+01:00[Europe/Berlin]');
standup.equals(berlin); // true
```

## toTemporal() による内部オブジェクトの取得

任意の値に対して [`toTemporal()`](/api/date-time/#totemporal) を呼び出すと、内部の `Temporal` インスタンスを取得できます。

`Temporal` オブジェクトを期待するサードパーティライブラリと連携する場合や、非 ISO 暦を直接操作したい場合に便利です。

```js
import { date } from 'native-dates';

const d = date('2026-11-16');
const plain = d.toTemporal(); // Temporal.PlainDate

const japanese = plain.withCalendar('japanese');
japanese.era; // 'reiwa'
japanese.eraYear; // 8
```

:::note[ゼロコピーで取得]
各インスタンスは内部に本物の `Temporal` オブジェクトを保持しているため、`toTemporal()` は再解析やコピー生成を行わずにそのオブジェクトを直接返します。
:::

## 古いランタイム向けのポリフィル

最新の Chrome・Edge・Firefox、Node 26 以降、Deno、Bun には `Temporal` が標準搭載されているため、コアにはポリフィルコードが含まれていません。

Safari・古いブラウザ・Node 22〜25 に対応する場合は、アプリ起動時に `temporal-polyfill` とあわせて `@native-dates/polyfill` を読み込んでください（Node 22〜23 向けの `Intl.DurationFormat` フォールバックも含まれます）。セットアップ手順と同期読み込みのオプションは、[Safari と旧バージョンの Node への対応](/guides/installation/#supporting-safari-and-older-node)を参照してください。
