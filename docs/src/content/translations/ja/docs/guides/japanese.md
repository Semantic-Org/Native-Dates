---
source: 'ec47c2d916bc'
reviewed: false
title: 日本語の日付と時刻
lede: 和暦や括弧付き曜日のフォーマットから全角入力の正規化、週の始まりの統一までを扱います。
---

共通の[国際化設定](/guides/internationalization/)に加え、日本語アプリでは改元や括弧付き曜日、全角 IME 入力、日曜始まりの週境界への対応が必要になります。

## 和暦と元年のフォーマット

公文書や帳票で和暦を出すには `'ja-u-ca-japanese'` を渡します。改元日の境界や初年度の元年表記、1文字の略記まで自動で切り替わります。

```js
import { date } from 'native-dates';

date('2019-04-30').format('long', 'ja-u-ca-japanese'); // '平成31年4月30日'
date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
date('2026-11-16').format('short', 'ja-u-ca-japanese'); // 'R8/11/16'
date('2026-11-16').format('llll', 'ja-u-ca-japanese'); // '令和8年11月16日(月)'
```

`'YYYY年M月D日'` のようなトークン文字列や年プロパティは、和暦ロケールを付けていても常に西暦を返します。元号を出すにはプリセットかオプションオブジェクトを使います。

```js
const reiwa = date('2026-11-16').locale('ja-u-ca-japanese');

reiwa.year; // 2026
reiwa.format('long'); // '令和8年11月16日'
reiwa.format('YYYY年M月D日'); // '2026年11月16日'
```

日を持たない `YearMonth` は月初の元号でフォーマットされます。1989年1月のように月途中で改元した月を正確に表すには、先に `on()` で日を指定します。

```js
import { yearMonth } from 'native-dates';

const jan1989 = yearMonth('1989-01');
jan1989.format('long', 'ja-u-ca-japanese'); // '昭和64年1月'
jan1989.on(8).format('long', 'ja-u-ca-japanese'); // '平成元年1月8日'
```

## 括弧付きの曜日と12時間表記

日本語の標準プリセットは区切り文字と曜日の形式が異なります。

| プリセット | 出力結果 | 特徴と主な用途 |
|---|---|---|
| `'medium'` | `'2026/11/16'` | 一覧表や入力欄に向くコンパクトなスラッシュ表記です。 |
| `'long'` | `'2026年11月16日'` | 曜日を含まない標準的な漢字表記です。 |
| `'full'` | `'2026年11月16日月曜日'` | 空白や括弧なしで `月曜日` のような完全な曜日名が続く形式です。 |
| `'llll'` | `'2026年11月16日(月)'` | 半角括弧で1文字の曜日 `月` を添える定番の UI 表記です。 |

`'ddd'` は括弧なしの1文字曜日を返すため、全角括弧も自由に組めます。`'MMMM'` には月、`'Do'` には日が最初から含まれるため、単位の漢字を直接書く場合は数値トークンを合わせて 11月月 のような重複を防ぎます。

```js
import { date } from 'native-dates';

const day = date('2026-11-16').locale('ja-JP');
day.format('YYYY年M月D日（ddd）'); // '2026年11月16日（月）'
day.format('MMMMDo(ddd)'); // '11月16日(月)'
day.format({ month: 'long', day: 'numeric', weekday: 'short' }); // '11月16日(月)'
```

時刻は24時間制が既定です。深夜0時台や正午12時台を日本の慣習どおり午前0時・午後0時と表すには `hour12: true` を渡し、1〜12時制で動く `'Ah:mm'` と使い分けます。

```js
import { datetime } from 'native-dates';

const midnight = datetime('2026-11-16T00:30', 'Asia/Tokyo').locale('ja-JP');
midnight.format('time'); // '0:30'
midnight.format({ hour: 'numeric', minute: '2-digit', hour12: true }); // '午前0:30'
midnight.format('Ah:mm'); // '午前12:30'
```

## スラッシュ表記と日本語入力のパース

日本の CSV や業務アプリで一般的な年先頭のスラッシュ区切りやドット区切りは、プラグインなしでコア機能のままパースできます。

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026/11/16'); // CalendarDate(2026-11-16)
date('2026/1/5'); // CalendarDate(2026-01-05)
datetime('2026/11/16 9:30', 'Asia/Tokyo'); // 2026-11-16T00:30:00.000Z
yearMonth('2026/11'); // YearMonth(2026-11)
```

漢字日付や元号表記、IME 未確定の全角数字はコアではエラーになり、[loose プラグイン](/plugins/loose/)でも `null` が返ります。

全角入力は先に NFKC 正規化で半角へ揃え、元号と年数が分かれた入力は `Temporal.PlainDate` で西暦へ変換してから渡します。

```js
import '@native-dates/plugins/loose';
import { date } from 'native-dates';

date('２０２６／１１／１６'.normalize('NFKC')); // CalendarDate(2026-11-16)
date('2026年11月16日', { loose: true }); // null

const reiwaInput = Temporal.PlainDate.from({
  calendar: 'japanese', era: 'reiwa', eraYear: 8, month: 11, day: 16,
}).withCalendar('iso8601');
date(reiwaInput).toString(); // '2026-11-16'
```

## 日本のタイムゾーンと週の始まり

コアは `'Asia/Tokyo'` と固定オフセットを受け付け、[zones プラグイン](/plugins/zones/)で JST も使えます。IANA には日本の都市として東京しか登録されていないため、大阪や福岡などの拠点名はエイリアス登録して `unknownZone` を防ぎます。

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'JST').zone; // 'Asia/Tokyo'
configure({ zoneAliases: { osaka: 'Asia/Tokyo', fukuoka: 'Asia/Tokyo' } });
datetime('2026-11-16T09:30', 'osaka').zone; // 'Asia/Tokyo'
configure({ zoneAliases: null });
```

日本語ロケールは壁掛けカレンダーと同じ日曜始まりになるため、月曜始まりの業務スケジュールでは `'monday'` を渡すか `weekStart` で固定します。

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

## 期間の全角チルダと相対表現

期間のプリセットはスラッシュ日付や漢字時刻を全角チルダで結びます。両端に漢字の日付と曜日を出したい場合は `format()` にトークン文字列を渡します。

```js
import { date, time } from 'native-dates';

const span = date('2026-11-16').to('2026-11-20').locale('ja-JP');
span.format('long'); // '2026/11/16～2026/11/20'
span.format('M月D日(ddd)'); // '11月16日(月) – 11月20日(金)'
time('09:00').to('17:30').format('short', 'ja-JP'); // '9時00分～17時30分'
```

相対表現は `CalendarDate` なら前後2日までを一昨日から明後日までの語で表し、`DateTime` は時刻差による日付の誤認を防ぐため常に数値と単位で返します。

```js
import { date, datetime, duration } from 'native-dates';

const baseDate = date('2026-11-16').locale('ja-JP');
baseDate.minus(2, 'days').from(baseDate); // '一昨日'
baseDate.plus(2, 'days').from(baseDate); // '明後日'

const baseTime = datetime('2026-11-16T12:00', 'Asia/Tokyo').locale('ja-JP');
baseTime.minus(1, 'day').from(baseTime); // '1 日前'
duration({ hours: 2, minutes: 30 }).format('long', 'ja-JP'); // '2 時間 30 分'
```

:::tip[空白と全角チルダの文字コード]
日本語の相対時刻や期間ではエンジンの標準データに従い数値の前後に半角スペースが入ります。範囲の区切りには U+301C の波ダッシュではなく U+FF5E の全角チルダが出るため、アサーションでは文字コードに注意してください。
:::
