---
source: "fb90df20f99e"
title: フォーマット
lede: ローカライズされたプリセット、トークンパターン、相対時間表現を使って日付・時刻・期間をフォーマットします。
---

Native Dates は実行環境に組み込まれた `Intl` フォーマッターを使用し、インスタンスを自動的にキャッシュします。バンドルにロケールファイルを追加しなくても、世界中の言語や地域に合わせた出力が得られます。

## .text とプリセットによる手軽な出力

すべてのインスタンスは、現在のロケールでフォーマットされた `.text` プロパティを持ちます。引数なしで [`format()`](/api/date-time/#format) を呼び出すと、各型のデフォルトプリセットが使われます。

```js
import { date, datetime, duration, time } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.text; // 'Nov 16, 2026, 9:30 AM PST'
standup.format(); // 'Nov 16, 2026, 9:30 AM'

date('2026-11-16').text; // 'Nov 16, 2026'
time('9:30am').text; // '9:30 AM'
duration('1h 30m').text; // '1 hour, 30 minutes'
```

出力の情報量を選ぶには、`format()` にプリセット名を渡します。

| プリセット | 例 | 対応する型と出力 |
|---|---|---|
| `'short'` | `'5/4/26, 9:30 AM'` | 日付・日時・時刻・部分日付・期間に対する数値日付や短い時刻・単位表記。 |
| `'medium'` | `'May 4, 2026, 9:30 AM'` | 日付・日時では省略月名、[`Time`](/api/time/) では秒付きの時刻。 |
| `'long'` | `'May 4, 2026 at 9:30 AM'` | 完全な月名、`Time` では秒付きの時刻、[`Duration`](/api/duration/) では完全な単位表記。 |
| `'full'` | `'Monday, May 4, 2026 at 9:30 AM'` | 日付・日時では完全な曜日名と月名、部分日付では完全な月名。 |
| `'date'` | `'May 4, 2026'` | [`DateTime`](/api/date-time/) と [`CalendarDate`](/api/calendar-date/) の日付部分。 |
| `'time'` | `'9:30 AM'` | `DateTime` と `Time` の短い時刻表記。 |
| `'month'` | `'May 2026'` | `DateTime`・`CalendarDate`・[`YearMonth`](/api/year-month/) の完全な月名と年。 |
| `'text'` | `'May 4, 2026, 9:30 AM PDT'` | `DateTime` では日付・時刻・短いタイムゾーン名、ほかの型では各型が持つ要素を出力。 |

:::details[Moment・Day.js 互換のプリセット名]
コアパッケージでは、Moment や Day.js で使われているローカライズ済みプリセット名も受け付けます。

| プリセット | 例 | ローカライズされる要素 |
|---|---|---|
| `'LT'`、`'LTS'` | `'9:30 AM'`、`'9:30:00 AM'` | 短い時刻、または秒付きの時刻。 |
| `'L'`、`'l'` | `'05/04/2026'`、`'5/4/2026'` | ゼロ埋めあり・なしの数値による年・月・日。 |
| `'LL'`、`'ll'` | `'May 4, 2026'` | 完全または省略の月名と日・年。 |
| `'LLL'`、`'lll'` | `'May 4, 2026 at 9:30 AM'` | 完全または省略形式の日付と短い時刻。 |
| `'LLLL'`、`'llll'` | `'Monday, May 4, 2026 at 9:30 AM'` | 完全または省略の曜日名・日付・短い時刻。 |
:::

日付・時刻・[年月](/api/year-month/)・[月日](/api/month-day/) は上記のすべてのプリセットを受け取り、自身が保持している要素だけを出力します。[期間](/api/duration/) はコンパクト表記やデジタル表記にも対応しています。

```js
import { date, duration, time, yearMonth } from 'native-dates';

date('2026-11-16').format('full', 'en-US'); // 'Monday, November 16, 2026'
yearMonth('2026-11').format('LL', 'en-US'); // 'November 2026'
time('9:30:15am').format('LTS', 'en-US'); // '9:30:15 AM'

const span = duration({ hours: 2, minutes: 15 });
span.format('narrow', 'en-US'); // '2h 15m'
span.format('digital', 'en-US'); // '2:15:00'
```

## ロケールと Intl オプション

ロケールは [`configure()`](/api/configure/) でアプリ全体のデフォルトとして設定するか、[`locale()`](/api/date-time/#locale) で値に付与するか、`format()` の呼び出しごとに直接渡して指定できます。クライアントアプリとマルチユーザーサーバーでの使い分けは [ローカライズ](/guides/localization/) を参照してください。

```js
import { configure, datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'Europe/Berlin');
standup.locale('de-DE').plus(1, 'week').format('long'); // '23. November 2026 um 09:30'
standup.format('long', 'ja-JP'); // '2026年11月16日 9:30'

configure({ locale: 'en-GB' });
configure({ locale: null });
```

プリセットだけでは求めるレイアウトに合わない場合は、`Intl` のオプションオブジェクトを直接渡せます。

```js
import { date } from 'native-dates';

const day = date('2026-11-16');

day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
day.format({ month: 'short', day: 'numeric' }, 'en-US'); // 'Nov 16'
```

各型が自身の要素だけを保持しているため、ロケールファイルを追加しなくても各言語の文法・複数形・文字体系・暦に自動で適応します。対象言語ならではの細かい挙動は [すべてのサンプル](/examples/) で確認できます。

```js
import { date, days, yearMonth } from 'native-dates';

date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
date('2026-05-01').format('long', 'ru'); // '1 мая 2026 г.'
days(2).format('long', 'ar'); // 'يومان'
```

:::tip[人間向け表示と通信・保存用文字列の使い分け]
`format()` はユーザーに表示する文字列のために使ってください。値の保存やネットワーク送信には [`toString()`](/api/date-time/#tostring) や JSON シリアライズを使い、安定した ISO 8601 形式を保ちます。詳しくは [保存と送信](/guides/storing-and-sending/) を参照してください。
:::

## トークンパターン

固定のレイアウトが必要な場合は、`format()` にトークンパターンを渡します。そのまま出力したい固定テキストは角括弧 `[...]` で囲みます。

```js
import { datetime, monthDay, yearMonth } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('YYYY-MM-DDTHH:mmZ'); // '2026-11-16T09:30-08:00'
standup.format('dddd, MMM D [at] h:mm A', 'en-US'); // 'Monday, Nov 16 at 9:30 AM'
yearMonth('2026-11').format('MMM YYYY', 'en-US'); // 'Nov 2026'
monthDay('11-16').format('MMMM Do', 'en-US'); // 'November 16th'
```

トークンパターン内の月名と曜日名は、現在のロケールの `Intl` から取得されます。一方、数字と西暦年はどのロケールでも `'YYYY-MM-DD'` のようなパターンを機械可読に保つため、常に算用数字の ISO 形式で出力されます。トークンの大文字・小文字は Moment や Day.js に準拠しています（LDML や date-fns の小文字 `yyyy`・`dd` とは異なり、`YYYY` と `DD` は大文字、小文字の `dd` は2文字の曜日名を表します）。

:::details[すべてのフォーマットトークン]
| トークン | 例 | 出力 |
|---|---|---|
| `YYYY` | `'2026'` | 4桁の年（負の年は符号付き）。 |
| `YY` | `'26'` | 下2桁の年。 |
| `Q` | `'4'` | 1〜4の四半期。 |
| `M`、`MM` | `'11'`、`'05'` | 月番号（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `MMM`、`MMMM` | `'Nov'`、`'November'` | ローカライズされたグレゴリオ暦の月名。日トークンの後に続く場合は、間に固定テキストがあっても自動格変化に対応。 |
| `D`、`DD` | `'5'`、`'05'` | 日（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `Do` | `'16th'` | 英語の序数、`'6.'` や `'6日'` のような各ロケールの日表記、または [`ordinals`](/api/configure/) によるカスタム出力。 |
| `DDD`、`DDDD` | `'320'`、`'045'` | 年間通算日（ゼロ埋めなし、または3桁ゼロ埋め）。 |
| `E` | `'7'` | `dayOfWeek` に一致する ISO 曜日番号（1（月曜）〜7（日曜））。 |
| `d` | `'0'` | Moment や Day.js に一致する曜日番号（0（日曜）〜6（土曜））。 |
| `dd`、`ddd`、`dddd` | `'Mo'`、`'Mon'`、`'Monday'` | ローカライズされた最短・省略・完全な曜日名。[`weekdayNames`](/api/configure/) でカスタマイズ可能。 |
| `W`、`WW` | `'47'`、`'05'` | 年間 ISO 週番号（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `H`、`HH` | `'9'`、`'09'` | 24時間制の時（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `h`、`hh` | `'9'`、`'09'` | 12時間制の時（1〜12）。 |
| `m`、`mm` | `'5'`、`'05'` | 分（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `s`、`ss` | `'8'`、`'08'` | 秒（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `S`、`SS`、`SSS` | `'4'`、`'42'`、`'420'` | 0.1秒・0.01秒・ミリ秒。 |
| `A`、`a` | `'AM'`、`'am'` | 英語では大文字・小文字の `'AM'` / `'PM'`、他言語では `'午後'` や `'م'` など各ロケールの午前・午後表記。 |
| `Z`、`ZZ` | `'-08:00'`、`'-0800'` | コロンあり・なしの UTC オフセット。 |
| `z`、`zz` | `'PST'` | ローカライズされた短いタイムゾーン名。 |
| `zzz`、`zzzz` | `'Pacific Standard Time'` | ローカライズされた完全なタイムゾーン名。 |
| `X` | `'1794850200'` | 秒単位の Unix タイムスタンプ。 |
| `x` | `'1794850200000'` | ミリ秒単位の Unix タイムスタンプ。 |
| `[text]` | `'[at]'` | エスケープされた固定テキスト（そのまま出力）。 |
:::

角括弧の外に未知の英字が含まれている場合、そのまま文字を出力するのではなく [`unknownFormat`](/api/errors/#units-zones-and-formats) エラーをスローします。`'às'` のようにアクセント付き文字とくっついたトークンや、`'HHhmm'` のように時刻トークンが混在したパターンもエラーになります。ISO タイムスタンプ用に、単独の `T` だけはエスケープせずにそのまま出力できます。

その型が持っていない要素を要求した場合は、仮の0時などを補わずに [`unsupportedToken`](/api/errors/#units-zones-and-formats) エラーをスローします。たとえばカレンダー日付に `'HH:mm'` を指定すると即座に失敗します。

ローカライズされたカレンダーの見出しや月のプルダウンを作るために、コアパッケージは [`monthNames()`](/api/month-names/) と `weekdayNames()` もエクスポートしています。

```js
import { monthNames, weekdayNames } from 'native-dates';

monthNames('short', 'en-US'); // ['Jan', 'Feb', 'Mar', ...]
weekdayNames('short', undefined, 'en-US'); // ['Sun', 'Mon', 'Tue', ...]
weekdayNames('narrow', 'monday', 'en-US'); // ['Mo', 'Tu', 'We', ...]
```

## 名前付きフォーマットの登録

アプリ内の複数画面で同じトークンパターンや `Intl` オプションオブジェクトを再利用する場合は、[`configure()`](/api/configure/) に名前付きフォーマットを登録します。登録した名前は日付・日時・時刻・部分日付・範囲で使え、組み込みプリセットより優先されます。詳しくは [名前付きフォーマット](/guides/customization/#named-formats) を参照してください。

## 範囲のフォーマット

すべての [範囲](/api/ranges/) はプリセットとオプションを `Intl` 経由でフォーマットし、共通する月や年を自動的に省略します。トークンパターンを渡すと、両端の値を `' – '` でつないで出力します。

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');
const shift = timeRange('9:00am', '5:00pm');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
shift.format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

## 相対時間表現

日時やカレンダー日付に対して [`from()`](/api/date-time/#from) または [`fromNow()`](/api/date-time/#fromnow) を呼び出すと、ランタイムの相対時間フォーマッターを通じてローカライズされた表現を返します。エイリアスとして [`formatRelative()`](/api/date-time/#formatrelative) も利用できます。

```js
import { date, datetime, now, today } from 'native-dates';

now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
today().plus(1, 'day').fromNow('en-US'); // 'tomorrow'

const anchor = datetime('2026-11-16T12:00', 'UTC');
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'

const currentDay = date('2026-11-16');
currentDay.minus(1, 'day').from(currentDay, 'en-US'); // 'yesterday'
currentDay.plus(14, 'days').from(currentDay, 'en-US'); // 'in 2 weeks'
```

カレンダー日付は日単位で差を計測するため、7日以内であれば `from()` と `fromNow()` は「昨日」「今日」「明日」といった相対日付を返します。一方、日時は経過時間で計測し、23時間前でも同じ日に収まる場合があるため、`'now'` 以外は数値ベースの表現を返します。

次は [解析](/guides/parsing/) で、外部から受け取った文字列や値をコード内の型へ読み込む方法を確認してください。
