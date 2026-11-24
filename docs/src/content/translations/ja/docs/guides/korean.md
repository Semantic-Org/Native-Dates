---
source: "1ff5dd8e887b"
title: 韓国語
lede: ドット区切りの韓国語日付の解析や、括弧付き曜日・旧暦の祝日フォーマットに対応します。
---

韓国語でフォーマットするには `'ko-KR'` を指定します（設定方法は[ローカライズ](/guides/localization/)を参照）。韓国語のプリセットは `'2026. 11. 16.'` のようにスペース付きのドットと末尾ピリオドを出力し、時刻の前に「오전」（午前）または「오후」（午後）を置きます。

## ドット区切りの日付と韓国語文字列の解析

末尾にピリオドが付くスペース入りドット区切り日付や、ハングル単位を含む日付文字列はプラグインなしでコアから直接解析できます。

```js
import { date, datetime, yearMonth } from 'native-dates';

date('2026. 11. 16.').toString(); // '2026-11-16'
date('2026년 11월 16일').toString(); // '2026-11-16'
datetime('2026. 11. 16. 14:30', 'Asia/Seoul').toString(); // '2026-11-16T05:30:00.000Z'
yearMonth('2026년 11월').toString(); // '2026-11'
```

[loose プラグイン](/plugins/loose/)を読み込んで韓国語ロケールを指定すると、2桁年の年・月・日順表記、「오전」「오후」付きの時刻、ハングルの月日表記も解析できます。

```js
import '@native-dates/plugins/loose';
import { date, monthDay, time } from 'native-dates';

date('26. 5. 5.', { loose: true, locale: 'ko' })?.toString(); // '2026-05-05'
date('12.11.26', { loose: true, locale: 'ko' })?.toString(); // '2012-11-26'
time('오후 2:30', { loose: true, locale: 'ko' })?.toString(); // '14:30:00'
monthDay('11월 16일', { loose: true })?.toString(); // '11-16'
```

2桁年の入力を解析するときは必ず `locale: 'ko'` を渡してください。米国英語のランタイムでは `'12.11.26'` が2026年12月11日として解釈されます。

| 入力 | 結果 | 扱い |
|---|---|---|
| `'2026. 11. 16.'`、`'2026년 11월 16일'` | コアで解析 | プラグインなしでそのまま渡せます。 |
| `'26. 5. 5.'`、`'12.11.26'`、`'오후 2:30'` | loose モードで解析 | `loose` プラグインをインポートし、`{ loose: true, locale: 'ko' }` を渡します。 |

## 括弧付き曜日と午前・午後の語順

`'full'` プリセットは火曜日の「화요일」のような完全な曜日名を出力します。`'llll'` や短い曜日オプションは1文字の曜日を括弧で囲み、範囲はチルダ（`~`）でつなぎます。

```js
import { date, dateRange } from 'native-dates';

const holiday = date('2026-05-05').locale('ko-KR');

holiday.format('llll'); // '2026년 5월 5일 (화)'
holiday.format({ month: 'long', day: 'numeric', weekday: 'short' });
// '5월 5일 (화)'

const week = dateRange('2026-11-16', '2026-11-20');
week.format({ month: 'long', day: 'numeric', weekday: 'short' }, 'ko-KR');
// '11월 16일 (월)~20일 (금)'
```

ハングルは角括弧でエスケープしなくてもトークンパターンをそのまま通ります。短縮月トークンと序数日トークンにはすでに「월」（月）・「일」（日）が含まれており、`'ddd'` は1文字の曜日を出力します。

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-05-05T14:05:00', 'Asia/Seoul').locale('ko-KR');

slot.format('YYYY. MM. DD. (ddd)'); // '2026. 05. 05. (화)'
slot.format('YYYY년 M월 D일 A h시 m분'); // '2026년 5월 5일 오후 2시 5분'
slot.format('MMM Do (dd)'); // '5월 5일 (화)'
```

韓国語では時刻の前に午前の「오전」、午後の「오후」を置きます。12時間制のプリセットを24時間制へ切り替えたい場合は `'ko-KR-u-hc-h23'` を指定してください。

```js
slot.format('medium'); // '2026. 5. 5. 오후 2:05'
slot.format('medium', 'ko-KR-u-hc-h23'); // '2026. 5. 5. 14:05'
```

## 韓国標準時とタイムゾーンの別名

コアは `'Asia/Seoul'` と固定オフセットを受け付けます。[zones プラグイン](/plugins/zones/)をインポートすると、`KST`・釜山（`Busan`）などの韓国都市名・ハングル都市名が設定なしで解決され、loose モードで解析する文字列内の略称にも対応します。

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:30', 'KST').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', '서울').zone; // 'Asia/Seoul'
datetime('2026-11-16T14:30', 'Busan').zone; // 'Asia/Seoul'
datetime('2026. 11. 16. 14:30 KST', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T05:30:00.000Z'
```

韓国語の短縮タイムゾーン表記は `GMT+9` を出力し、`'zzz'` は完全な韓国語名「한국 표준시」を出力します。UTC サーバーは韓国時間の 8:59 まで前日の日付のままになるため、[`today()`](/api/date-fn/#today) には `'Asia/Seoul'` を明示してください。

```js
import { datetime, today } from 'native-dates';

const meeting = datetime('2026-11-16T05:30:00Z', 'Asia/Seoul').locale('ko-KR');

meeting.text; // '2026년 11월 16일 오후 2:30 GMT+9'
meeting.format('A h:mm zzz'); // '오후 2:30 한국 표준시'
today('Asia/Seoul');
```

## 日曜始まりのカレンダーと月曜始まりの業務週

ロケール `'ko-KR'` は壁掛けカレンダーと同様に日曜始まりが既定です。一方、韓国の業務週・精算期間・ISO の `weekOfYear` は月曜始まりで数えます。

```js
import { date, weekdayNames } from 'native-dates';

const sun = date('2026-11-15').locale('ko-KR');

sun.weekStart; // 7
sun.startOf('week').toString(); // '2026-11-15'
sun.weekOfYear; // 46
weekdayNames('short', undefined, 'ko-KR');
// ['일', '월', '화', '수', '목', '금', '토']
weekdayNames('short', 'monday', 'ko-KR');
// ['월', '화', '수', '목', '금', '토', '일']
```

呼び出しごとに `'monday'` を渡すか、[設定](/api/configure/)で開始曜日を固定するか、韓国語表記のまま月曜始まりにできる `'ko-KR-u-fw-mon'` を指定してください。

```js
const wed = date('2026-11-18').locale('ko-KR-u-fw-mon');

wed.weekStart; // 1
wed.startOf('week').toString(); // '2026-11-16'
```

## 相対日付と旧暦の祝日

韓国語のカレンダー日付は、2日前に「그저께」（一昨日）、2日後に「모레」（明後日）を返します。[`DateTime`](/api/date-time/) は0秒差で「지금」（今）を返し、それ以外は数値付きの単位を返します。

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ko-KR');
day.minus(2, 'days').from(day); // '그저께'
day.plus(2, 'days').from(day); // '모레'

const moment = datetime('2026-11-16T12:00', 'Asia/Seoul').locale('ko-KR');
moment.minus(2, 'days').from(moment); // '2일 전'
```

ソルラル（旧正月）・チュソク（秋夕）・旧暦の誕生日には、閏月の「윤6월」などにも対応する `'ko-KR-u-ca-dangi'` を指定します。`'short'` プリセットは年の代わりに 1〜60 の干支番号を出力するため、`'long'` または月日オプションを使ってください。

```js
const chuseok = date('2026-09-25');
const leapDay = date('2025-07-25');

chuseok.format('long', 'ko-KR-u-ca-dangi'); // '병오년 8월 15일'
chuseok.format({ month: 'long', day: 'numeric' }, 'ko-KR-u-ca-dangi'); // '8월 15일'
leapDay.format('long', 'ko-KR-u-ca-dangi'); // '을사년 윤6월 1일'
```

:::tip[毎年の旧暦日付のフォーマット]
[`MonthDay`](/api/month-day/) と [`YearMonth`](/api/year-month/) は旧暦ロケールタグを渡してもグレゴリオ暦のままになります。旧暦の誕生日や祝日は、その年のグレゴリオ暦 [`CalendarDate`](/api/calendar-date/) からフォーマットしてください。
:::
