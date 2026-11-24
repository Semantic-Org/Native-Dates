---
source: "e095c0bff2bd"
title: 日本語
lede: 和暦や括弧付き曜日のフォーマットから、スラッシュ日付の解析、日曜始まりの週計算まで日本語特有の扱いを解説します。
---

日本語でフォーマットするには `'ja-JP'` を指定します（ロケールの設定方法は[ローカライズ](/guides/localization/)を参照）。既定では西暦が使われ、和暦が必要な箇所だけ `'ja-u-ca-japanese'` に切り替えられます。

## 和暦と元年表記

`'ja-u-ca-japanese'` を渡すと、2019年4月30日の `'平成31年4月30日'` や翌日の `'令和元年5月1日'` を含め、公的な和暦形式でフォーマットできます。

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese'); // '平成31年4月30日'
date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16'
date('2026-11-16').format('llll', 'ja-u-ca-japanese'); // '令和8年11月16日(月)'
```

`'YYYY年M月D日'` のようなトークンパターンや `year` プロパティは、和暦ロケールを付けていても常に西暦を参照します。元号を含めて出力したい場合は、プリセットかオプションオブジェクトを使ってください。

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日'
reiwa.format('YYYY年M月D日'); // '2026年11月16日'
```

[`YearMonth`](/api/year-month/) は日を持たないため、その月の1日時点で有効な元号でフォーマットされます。1989年1月のように月の途中で改元がある場合は、先に [`on()`](/api/year-month/#on) で日付を指定してください。

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');

jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月'
jan1989.on(8).format('long', 'ja-u-ca-japanese'); // '平成元年1月8日'
```

## 括弧付き曜日と12時間制

日本語の標準プリセットは、区切り文字と曜日の付け方によって次のように分かれます。

| プリセット | 出力 | 表記の特徴と主な用途 |
|---|---|---|
| `'medium'` | `'2026/11/16'` | テーブルやフォーム入力欄に向いたコンパクトなスラッシュ表記。 |
| `'long'` | `'2026年11月16日'` | 曜日なしの標準的な年月日表記。 |
| `'full'` | `'2026年11月16日月曜日'` | スペースや括弧を挟まずに「〜曜日」を末尾に付与。 |
| `'llll'` | `'2026年11月16日(月)'` | 半角括弧で1文字曜日を添える UI 向けの定番表記。 |

トークン `'ddd'` は括弧を含まない曜日1文字だけを返すため、全角括弧で囲みたい場合はパターン側へ直接記述します。`MMMM` や `Do` にはすでに「月」「日」が含まれるため、漢字と組み合わせるときは数値トークンの `M`・`D` を使ってください。

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');

day.format('YYYY年M月D日（ddd）'); // '2026年11月16日（月）'
day.format('MMMMDo(ddd)'); // '11月16日(月)'
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

時刻の既定は24時間制です。`hour12: true` を指定すると0時始まりの `'午前0:30'`・`'午後0:30'` になり、1〜12時で表記したい場合は `'Ah:mm'` を使います。

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');

midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true }); // '午前0:30'
midnight.format('Ah:mm'); // '午前12:30'
```

## スラッシュ表記と日本語入力の解析

日本の CSV やフォームでよく扱われる年月日表記・スラッシュ区切り・ドット区切りは、プラグインなしでコアから直接解析できます。

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
date('2026/1/5').toString(); // '2026-01-05'
datetime('2026年11月16日 9:30', 'Asia/Tokyo').toString(); // '2026-11-16T00:30:00.000Z'
yearMonth('2026年11月').toString(); // '2026-11'
```

[loose プラグイン](/plugins/loose/)を読み込むと、全角の数字や記号、午前・午後付きの時刻、月日のみの入力も事前の正規化なしで解析できます。

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('２０２６／１１／１６', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true, locale: 'ja' })?.toString(); // '14:30:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
```

`'令和8年11月16日'` のような和暦文字列の直接解析には対応していません。フォームで元号と和暦年を分けて受け取る場合は、和暦の `Temporal.PlainDate` を組み立ててそのまま [`date()`](/api/date-fn/) に渡せば、手動で暦変換せずに西暦の日付として取り込めます。

```js
const reiwaInput = Temporal.PlainDate.from({
  calendar: 'japanese',
  era: 'reiwa',
  eraYear: 8,
  month: 11,
  day: 16,
});

date(reiwaInput).toString(); // '2026-11-16'
```

## タイムゾーンと週の開始曜日

コアは `'Asia/Tokyo'` と固定オフセットを標準で受け付けます。[zones プラグイン](/plugins/zones/)を読み込むと、`JST` や国内の主要都市名（英語・日本語）がそのまま解決されます。

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', 'Osaka').zone; // 'Asia/Tokyo'
datetime('2026-11-16T09:30', '東京').zone; // 'Asia/Tokyo'
```

日本語ロケールは壁掛けカレンダーと同様に日曜始まり（`weekStart === 7`）が既定です。月曜始まりの業務スケジュールや週次集計では `'monday'` を明示するか、`weekStart` を固定してください。

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18').locale('ja-JP');

wed.weekStart; // 7
wed.startOf('week').toString(); // '2026-11-15'
wed.startOf('week', 'monday').toString(); // '2026-11-16'
weekdayNames('short', undefined, 'ja-JP');
// ['日', '月', '火', '水', '木', '金', '土']
weekdayNames('short', 'monday', 'ja-JP');
// ['月', '火', '水', '木', '金', '土', '日']
```

## 範囲表記と相対表現

範囲プリセットはスラッシュ日付や漢字表記の時刻を全角チルダでつなぎます。開始・終了の両方に月日と曜日を付けたい場合は、[`format()`](/api/ranges/#format) にトークンパターンを渡してください。

```js
import { dateRange, timeRange } from 'native-dates';

const span = dateRange('2026-11-16', '2026-11-20').locale('ja-JP');

span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)'); // '11月16日(月) – 11月20日(金)'
timeRange('09:00', '17:30').format('short', 'ja-JP'); // '9時00分～17時30分'
```

[`CalendarDate`](/api/calendar-date/) は「一昨日」「明後日」まで自然な語彙を返します。一方 [`DateTime`](/api/date-time/) は常に数値付きの単位で返すため、経過時間の差がカレンダー日として誤読されません。

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日'
baseDate.plus(2, 'days').from(baseDate); // '明後日'

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前'
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP'); // '2 時間 30 分'
```

:::tip[半角スペースと全角チルダのコードポイント]
日本語の相対表現や期間のフォーマット結果には、標準の CLDR データに従って数値の前後に半角スペースが入ります。また範囲プリセットの区切りには波ダッシュ（`U+301C`）ではなく全角チルダ（`U+FF5E`）が出力されるため、テストのアサーションではコードポイントを確認してください。
:::
