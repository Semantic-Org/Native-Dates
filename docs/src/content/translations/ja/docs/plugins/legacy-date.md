---
source: "a8aba5e485f9"
title: legacy-date
lede: 段階的な移行に向けて、DateTime に読み取り専用の Date.prototype ゲッターとフォーマッターを追加します。
---

## Date 利用コードの段階的な移行

このプラグインを一度インポートすると、読み取り専用のプロトタイプゲッターが [`DateTime`](/api/date-time/) に追加されます。標準の `Date` メソッドを前提とする既存のヘルパーやフォーマッター、コンポーネントにも `DateTime` インスタンスをそのまま渡せるため、ファイル単位で段階的に移行できます。

```js title="legacy-date.js"
import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';

const moment = datetime('2026-09-06T14:30:15.250', 'America/New_York');

moment.getFullYear(); // 2026
moment.getMonth(); // 8（9月。Date と同じく0始まり）
moment.getDate(); // 6
moment.getHours(); // 14（OS のタイムゾーンではなく America/New_York 基準）
moment.getUTCHours(); // 18
```

JavaScript 標準の `Date` は常に実行環境の OS タイムゾーンでローカルフィールドを読み取ります。一方、`DateTime` はすべてのローカルゲッターとロケールフォーマッターを自身の `zone` 基準で評価します。

:::warning[0始まりの月と日曜日 = 0]
既存コードが暗黙に壊れないよう、レガシーゲッターは標準 `Date` の番号付けを維持します。`getMonth()` は 0〜11 を、`getDay()` は日曜日を 0 として返します。なお、コアのプロパティは月を1始まり、曜日を月曜日始まりで数えます。
:::

## タイムゾーン対応ゲッターと UTC ゲッター

標準の読み取りゲッターはすべて、どの `DateTime` インスタンスでも利用できます。

| メソッド | 戻り値 | DateTime 上での動作 |
|---|---|---|
| `getTime()` | `number` | エポックミリ秒。`dt.epochMilliseconds` と同じ値。 |
| `getFullYear()` | `number` | `dt.zone` における4桁の西暦年。 |
| `getMonth()` | `number` | `dt.zone` における0始まりの月（1月が 0、12月が 11）。 |
| `getDate()` | `number` | `dt.zone` における日（1〜31）。 |
| `getDay()` | `number` | `dt.zone` における曜日（日曜日が 0、土曜日が 6）。 |
| `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()` | `number` | `dt.zone` 基準で評価した時刻フィールド。 |
| `getTimezoneOffset()` | `number` | `dt.zone` における UTC より西側のオフセット（分単位）。`-04:00` なら `240`、`+05:30` なら `-330`。 |
| `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()` | `number` | UTC 基準のカレンダーフィールド（月は0始まり、日曜日は 0）。 |
| `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`, `getUTCMilliseconds()` | `number` | UTC 基準の時刻フィールド。 |

```js
const kolkata = datetime('2026-01-06T09:00', 'Asia/Kolkata');

kolkata.getTimezoneOffset(); // -330
kolkata.getHours(); // 9
kolkata.getUTCHours(); // 3
```

## 文字列変換とロケール対応メソッド

レガシー文字列メソッドは標準 `Date` と同じ形式を出力しつつ、ロケールフォーマットの既定タイムゾーンにインスタンス自身のタイムゾーンを使います。

| メソッド | 戻り値 | DateTime 上での動作 |
|---|---|---|
| `toISOString()` | `string` | ミリ秒精度の UTC タイムスタンプ。インスタンスがミリ秒未満の精度を持つ場合もミリ秒単位で出力。 |
| `toLocaleString(locales?, options?)` | `string` | 明示的な上書きがない限り、`dt.zone` と [`dt.locale()`](/api/date-time/#locale) でフォーマットした日付と時刻。 |
| `toLocaleDateString(locales?, options?)` | `string` | 明示的な上書きがない限り、`dt.zone` と `dt.locale()` でフォーマットした日付部分。 |
| `toLocaleTimeString(locales?, options?)` | `string` | 明示的な上書きがない限り、`dt.zone` と `dt.locale()` でフォーマットした時刻部分。 |

```js
const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');

flight.toISOString(); // '2026-09-06T18:30:15.250Z'
flight.toLocaleDateString('en-US'); // '9/6/2026'
flight.toLocaleTimeString('en-US'); // '2:30:15 PM'
flight.toLocaleTimeString('en-US', { timeZone: 'UTC' }); // '6:30:15 PM'
```

## 変更系セッターのエラー送出

インスタンスはイミュータブル（元の値を変更しない設計）のため、値を書き換えるセッターはすべてエラーをスローし、[`set()`](/api/date-time/#set) や [`plus()`](/api/date-time/#plus) の使用を案内します。

| 分類 | 禁止されたメソッド | イミュータブルな代替手段 |
|---|---|---|
| エポック | `setTime()` | エポックミリ秒を [`datetime()`](/api/datetime-fn/) に渡す。 |
| ローカルフィールド | `setFullYear()`, `setMonth()`, `setDate()`, `setHours()`, `setMinutes()`, `setSeconds()`, `setMilliseconds()` | [`dt.set()`](/api/date-time/#set) で `dt.zone` のフィールドを差し替える。 |
| UTC フィールド | `setUTCFullYear()`, `setUTCMonth()`, `setUTCDate()`, `setUTCHours()`, `setUTCMinutes()`, `setUTCSeconds()`, `setUTCMilliseconds()` | 先に [`dt.in('UTC').set()`](/api/date-time/#in) で UTC に切り替えてから変更する。 |

```js
const reminder = datetime('2026-09-06T14:30Z');

try {
  reminder.setHours(9);
} catch (err) {
  err.code; // 'immutable'
}

const updated = reminder.set('hour', 9);
updated.hour; // 9
```

## toJSDate を使うべき場面

`DateTime` は `instanceof Date` や標準オブジェクトの型タグを偽装しません。オブジェクトの型判定を行うチャートライブラリやデータベースドライバー、バリデーター、あるいは受け取った値を直接書き換えるライブラリにタイムスタンプを渡す場合は、コアの [`toJSDate()`](/api/date-time/#tojsdate) を呼び出してください。

```js
const nativeDate = datetime('2026-09-06T14:30Z').toJSDate();
nativeDate instanceof Date; // true
```
