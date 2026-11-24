---
source: "5365132bf9e2"
title: Moment からの移行
lede: Moment と moment-timezone から、トークン対応かつ tzdata 同梱不要のイミュータブルな値へ移行します。
---

Moment と `moment-timezone` は長年にわたり JavaScript の日付処理を支えてきましたが、ミュータブルなオブジェクト、0始まりの月番号、肥大化するタイムゾーンバンドルが課題でした。

Native Dates へ移行すると、防御的なクローン呼び出しとバンドル肥大化を解消しながら、大規模なリポジトリでもモジュール単位で段階的に置き換えられます。

## すべての値がイミュータブル

Moment では日数の加算や月初への移動がインスタンス自身を書き換えます。共有された日付オブジェクトをヘルパー関数に渡すと、呼び出し側でクローンし忘れたときに元の状態が意図せず壊れる恐れがあります。

Native Dates の値はすべてイミュータブルです。[`plus()`](/api/date-time/#plus) や [`in()`](/api/date-time/#in) のようなメソッドは常に新しいインスタンスを返し、元の値を変更しません。

```js
import { date } from 'native-dates';

const start = date('2026-11-16');
const deadline = start.plus(7, 'days');

start.toString(); // '2026-11-16'
deadline.toString(); // '2026-11-23'
```

:::tip[防御的な clone() 呼び出しを削除できる]
移行時には `.clone()` の呼び出しをすべて削除できます。イミュータブルな `add()`・`subtract()` エイリアスも用意されているため、既存の加減算コードをそのまま移行できます。
:::

## 用途別の専用型と1始まりの月

Moment はあらゆる概念を1つのクラスにまとめ、月を 0〜11（11月が `10`）で表します。Native Dates では `month` が通常のプロパティになっており、1〜12 の値を返します。

カレンダー日付には [`date()`](/api/date-fn/)、タイムゾーン付きの日時には [`datetime()`](/api/datetime-fn/)、さらに[時刻](/api/time-fn/)・[請求月](/api/year-month-fn/)・[毎年の誕生日](/api/month-day-fn/)にもコアの専用ファクトリを使い分けます。

```js
import { date, datetime, monthDay, yearMonth } from 'native-dates';

const invoiceDate = date(2026, 11, 16);
invoiceDate.month; // 11（11月）

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
sentAt.hour; // 12

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

## タイムゾーンデータの同梱が不要

`moment-timezone` は IANA データベースのコピーをブラウザへバンドルして配信します。

Native Dates のコアはランタイムの `Temporal` と `Intl` エンジンからタイムゾーン規則を直接参照します。すべての IANA タイムゾーンが追加設定なしで動作し、都市名や略称（`Berlin` や `Pacific Time` など）を受け取りたい場合は [`@native-dates/plugins/zones`](/plugins/zones/) を追加できます。

```js
import { datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');

kickoff.in('Europe/London').format('short', 'en-GB'); // '16/11/2026, 17:30'
kickoff.in('Asia/Tokyo').format('short', 'en-US'); // '11/17/26, 2:30 AM'
```

## コアに含まれるトークン・プリセット・範囲

Moment 互換の[トークンパターン](/guides/formatting/#token-patterns)、`'LT'`〜`'llll'` のローカライズ済みプリセット、相対時間表現、[範囲](/api/ranges/)はすべてプラグインなしでコアから利用できます。

```js
import { dateRange, datetime } from 'native-dates';

const kickoff = datetime('2026-11-16T09:30', 'America/Los_Angeles');
kickoff.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
kickoff.format('LLL', 'en-US'); // 'November 16, 2026 at 9:30 AM'
kickoff.from('2026-11-16T07:30-08:00', 'en-US'); // 'in 2 hours'

const quarter = dateRange('2026-10-01', '2026-12-31');
quarter.contains('2026-11-16'); // true
quarter.overlaps(dateRange('2026-12-15', '2027-01-15')); // true
```

## 機能対応表

| Moment | Native Dates | 補足 |
|---|---|---|
| `moment()` | `now()` または `today()` | 特定の時点とカレンダー日付を明確に区別 |
| `moment.tz(str, zone)` | `datetime(str, zone)` | コア標準対応（tzdata の同梱不要） |
| `m.clone().add(7, 'days')` | `d.plus(7, 'days')` | 常にイミュータブル（`add()` エイリアスも利用可能） |
| `m.tz('Europe/Berlin')` | `dt.in('Europe/Berlin')` | 同じ時点を別のタイムゾーンで表示 |
| `m.month()`, `m.date()` | `d.month`, `d.day` | 通常のプロパティ（月は 1〜12） |
| `m.day()`, `m.isoWeekday()` | `d.dayOfWeek` | ISO 準拠の月曜 1〜日曜 7（トークンは `'E'` が 1〜7、`'d'` が 0〜6） |
| `m.unix()`, `m.valueOf()` | `dt.epochSeconds`, `dt.epochMilliseconds` | 1970年からの経過単位をプロパティ名で明示 |
| `b.diff(a, 'hours', true)` | `a.until(b, 'hours')` | 指定した単位での小数を含む合計値 |
| `moment.duration(2, 'h')` | `hours(2)` または `duration('2h')` | コア標準の期間ヘルパー |
| `m.format('LLL')` | `dt.format('LLL')` | ロケールファイル不要の `'LT'`〜`'llll'` プリセット |
| `m.format('YYYY-MM-DD HH:mm')` | `dt.format('YYYY-MM-DD HH:mm')` | [トークンパターン](/guides/formatting/#token-patterns) |
| `m.isBetween(a, b)` | `dateRange(a, b).contains(d)` | `to()`・`for()`・`overlaps()` を備えた[範囲](/api/ranges/) |
| `m.fromNow()`, `m.from(other)` | `dt.fromNow()`, `dt.from(other)` | [相対表現](/guides/formatting/#relative-phrases) |
| 非 ISO 文字列の解析 | `{ loose: true }` | ロケール対応や口語的な文字列解析は [`@native-dates/plugins/loose`](/plugins/loose/) を読み込み |

## 段階的な移行

大規模なコードベースを1回のプルリクエストで全面移行するのは現実的ではありません。ネイティブの `Date` を期待する境界では [`toJSDate()`](/api/date-time/#tojsdate) を呼び出し、再び取り込む際に [`datetime()`](/api/datetime-fn/) へ渡すことで段階的に移行できます。

```js
import { datetime } from 'native-dates';

const sentAt = datetime('2026-11-16T17:30:00Z', 'America/New_York');
const legacy = sentAt.toJSDate();
const restored = datetime(legacy, 'America/New_York');
```

下流のヘルパーが `getFullYear()` のようなレガシーゲッターを値に対して直接呼び出している場合は、[`legacy-date`](/plugins/legacy-date/) プラグインをインポートしてください。

ゲッターメソッドは値自身のタイムゾーンで各フィールドを読み取りつつ、互換性のため0始まりの月番号を維持します。値を書き換えるセッターは即座にエラーをスローするため、隠れた破壊的変更をテストで確実に検出できます。

```js
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const dt = datetime('2026-11-16T09:30', 'America/Los_Angeles');

dt.getFullYear(); // 2026
dt.getMonth(); // 10（Date.prototype.getMonth() と同じ0始まり）
dt.getHours(); // 9（America/Los_Angeles の時刻）
```
