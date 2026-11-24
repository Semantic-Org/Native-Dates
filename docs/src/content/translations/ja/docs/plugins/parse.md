---
source: "8dc73060ce55"
title: parse
lede: トークンパターンと { format } を使い、固定形式の日付・時刻文字列を厳格に解析します。
---

## フォーマットパターンによる解析

コアパッケージはデフォルトで厳格な ISO 8601 文字列を解析し、[`@native-dates/plugins/loose`](/plugins/loose/) は現在のロケールで自由形式のテキストを読み取ります。このプラグインをインポートすると、銀行データのエクスポートやサーバーログなどの固定形式文字列を解析するための `{ format }` オプションが利用できるようになります。

```js title="parse.js"
import '@native-dates/plugins/parse';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
datetime('24/Nov/2026:12:40:01 -0500', {
  format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
  zone: 'America/New_York',
  locale: 'en-US',
}).toString(); // '2026-11-24T17:40:01.000Z'
time('1430', { format: 'HHmm' }).toString(); // '14:30:00'
yearMonth('11/2026', { format: 'MM/YYYY' }).toString(); // '2026-11'
monthDay('29/02', { format: 'DD/MM' }).toString(); // '02-29'
```

`format` オプションを省略した呼び出しでは、引き続き厳格な ISO 解析が行われます。このプラグインをインポートせずに `{ format }` 付きでファクトリを呼び出すと、[`missingPlugin`](/api/errors/#plugins) エラーをスローします。

## 厳格な照合と名前付きフォーマット

パターンにはコアの[トークンパターン](/guides/formatting/#token-patterns)と同じ語彙を使います。固定桁トークンには厳密な桁数が必要で、リテラル文字列も大文字・小文字を区別して文字列全体と一致しなければなりません。

2月30日のような存在しない日付や、日付と一致しない曜日が渡された場合は、自動で繰り上げずエラーをスローします。重複したトークンや、12時間制と24時間制が矛盾する時刻フィールドも同様に拒否されます。

```js
import { configure, date, dateRange } from 'native-dates';

date('Tue 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' }).toString();
// '2026-11-24'
date('6/9/26', { format: 'D/M/YY' }).toString(); // '2026-09-06'

configure({ formats: { bank: 'DDMMYYYY' } });
date('24112026', { format: 'bank' }).toString(); // '2026-11-24'
dateRange('24112026', '30112026', { format: 'bank' }).toString();
// '2026-11-24/2026-11-30'
configure({ formats: null });
```

[`configure()`](/api/configure/) に登録した名前付きパターンは、解析とフォーマットのどちらでも利用できます。範囲ファクトリでは、`format` オプションが開始・終了の両端に引き継がれます（第2引数に期間の長さを渡す場合も同様です）。

## ローカライズされた名称と序数

月名・曜日名・午前/午後や時間帯表現・序数は現在のロケールに従います。月名は単独形と格変化形のどちらも大文字・小文字を区別せずに照合されるため、ロシア語やギリシャ語の日付も追加ルールなしで解析できます。

使用するロケールの優先順位はフォーマット時と同じです。呼び出し時の `locale` オプション、[`configure()`](/api/configure/)、実行環境のデフォルトの順に決まります。英語のサーバーログのように言語が固定された入力には、ロケールを明示的に渡してください。

```js
import { date, time, yearMonth } from 'native-dates';

date('November 24th, 2026', { format: 'MMMM Do, YYYY', locale: 'en-US' }).toString();
// '2026-11-24'
date('6 ноября 2026', { format: 'D MMMM YYYY', locale: 'ru' }).toString();
// '2026-11-06'
date('6. November 2026', { format: 'Do MMMM YYYY', locale: 'de' }).toString();
// '2026-11-06'
date('2026年11月6日', { format: 'YYYY[年]M[月]Do', locale: 'ja' }).toString();
// '2026-11-06'
yearMonth('février 2026', { format: 'MMMM YYYY', locale: 'fr' }).toString();
// '2026-02'
time('9:05:12.5 pm', { format: 'h:mm:ss.S a', locale: 'en-US' }).toString();
// '21:05:12.500'
```

英語の序数トークンは接尾辞まで厳密に検証するため `'24st'` は拒否されます。また、アプリ設定に登録したカスタムの[曜日名](/api/configure/)も自動的に適用されます。

## ISO 週日付と年間通算日

年間通算日や ISO 週パターンは、カレンダー日付や日時へ直接変換されます。週トークンと組み合わせた場合、`YYYY` は `format()` が出力する暦年ではなく ISO 週年として読み取られるため、`'2026-W01-1'` は2025年12月29日に解決されます。

うるう年や52週・53週の年の境界も厳密に検証され、ISO 週パターンで曜日を省略した場合は月曜日になります。

```js
import { date } from 'native-dates';

date('2026-328', { format: 'YYYY-DDDD' }).toString(); // '2026-11-24'
date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString(); // '2026-11-24'
date('2026-W48', { format: 'YYYY-[W]WW' }).toString(); // '2026-11-23'
date('2026-W01-1', { format: 'YYYY-[W]WW-E' }).toString(); // '2025-12-29'
```

## タイムゾーンとタイムスタンプ

オフセットトークンを含むパターンは正確な瞬間を特定し、指定先のタイムゾーンへ変換します。文字列内の `z` トークンは IANA 識別子を解決し、[`@native-dates/plugins/zones`](/plugins/zones/) を併用している場合は都市名や `JST` のような略称も解決します（`GMT+2` のようなオフセット表記は対象外です）。

変換先の `zone` オプションを指定しない限り、文字列内のタイムゾーンがそのまま結果に保持されます。1つの文字列にオフセットとタイムゾーン名の両方が含まれており、その瞬間で両者が矛盾する場合はエラーをスローします。

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  locale: 'en-US',
}).zone; // 'Asia/Tokyo'

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  zone: 'UTC',
  locale: 'en-US',
}).toString(); // '2026-11-24T06:45:00.000Z'

datetime('1795542001', { format: 'X', zone: 'UTC' }).toString();
// '2026-11-24T17:40:01.000Z'
datetime('24112026', { format: 'DDMMYYYY', zone: 'America/New_York' }).toString();
// '2026-11-24T05:00:00.000Z'
```

Unix タイムスタンプは、秒単位を `X`、ミリ秒単位を `x` で解析できます。[日時のファクトリ](/api/datetime-fn/)に日付のみのパターンを渡すと、指定したタイムゾーンにおけるその日の開始時点を返します。

## loose モードとの併用

[`@native-dates/plugins/loose`](/plugins/loose/) をあわせて読み込むと、入力テキストがフォーマットに一致しない場合にエラーをスローせず `null` を返せます。欠損値、数値、存在しない日付、拒否された夏時間（DST）の切り替え時刻はいずれもファクトリ関数から `null` を返し、すでに解析済みの日付・時刻インスタンスはそのまま通過します。

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('not-a-date', { format: 'DDMMYYYY', loose: true }); // null
date('30022026', { format: 'DDMMYYYY', loose: true }); // null
datetime('08/03/2026 02:30', {
  format: 'DD/MM/YYYY HH:mm',
  zone: 'America/New_York',
  disambiguation: 'reject',
  loose: true,
}); // null
```

:::note[不正なデータは null、不正なパターンは引き続きエラー]
loose モードが `null` に変換するのは、フォーマットに一致しない入力文字列だけです。空のパターンやフィールド不足のパターンは [`unknownFormat`](/api/errors/#units-zones-and-formats) をスローし、対象の型が持たないトークンは [`unsupportedToken`](/api/errors/#units-zones-and-formats) をスローします。
:::

## 対応トークン一覧

トークンはフォーマットと同じ語彙に従います。パターン自身の先頭・末尾に空白が含まれていない限り、入力文字列の前後の空白は自動で除去されます。

| トークン | 例 | 一致する内容 |
|---|---|---|
| `YYYY` | `'2026'` | 4桁の暦年。`W` または `WW` と組み合わせた場合は ISO 週年。 |
| `YY` | `'26'` | 2桁の年。69〜99 は 1969〜1999年、00〜68 は 2000〜2068年として解釈。 |
| `M`, `MM` | `'9'`, `'09'` | 1〜12 の月番号（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | ローカライズされたグレゴリオ暦の省略・完全月名（格変化形を含む）。 |
| `D`, `DD` | `'6'`, `'06'` | 1〜31 の日（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `Do` | `'24th'`, `'6.'` | 英語の序数または現在のロケールの日表記を伴う日。 |
| `DDD`, `DDDD` | `'1'`, `'328'` | 1〜366 の ISO 年間通算日（ゼロ埋めなし、または3桁ゼロ埋め）。 |
| `W`, `WW` | `'5'`, `'48'` | 1〜53 の ISO 週番号（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `E` | `'2'` | 月曜を 1、日曜を 7 とする ISO 曜日番号。 |
| `d` | `'0'` | 日曜を 0、土曜を 6 とする曜日番号。 |
| `dd`, `ddd`, `dddd` | `'Tu'`, `'Tue'`, `'Tuesday'` | ローカライズされた最短・省略・完全な曜日名。 |
| `H`, `HH` | `'9'`, `'09'` | 0〜23 の24時間制の時（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `h`, `hh` | `'9'`, `'09'` | 1〜12 の12時間制の時（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `m`, `mm` | `'5'`, `'05'` | 0〜59 の分（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `s`, `ss` | `'8'`, `'08'` | 0〜59 の秒（ゼロ埋めなし、または2桁ゼロ埋め）。 |
| `S`, `SS`, `SSS` | `'5'`, `'25'`, `'250'` | 0.1秒・0.01秒・ミリ秒の小数秒。 |
| `A`, `a` | `'PM'`, `'pm'` | 英語の AM/PM（大文字・小文字を区別しない）、または現在のロケールの午前・午後表記。 |
| `Z`, `ZZ` | `'-05:00'`, `'-0500'` | コロンあり・なしの UTC オフセット、または UTC を表す `Z`。 |
| `z`, `zz` | `'UTC'`, `'JST'` | 空白を含まない IANA タイムゾーン ID。`@native-dates/plugins/zones` を読み込んだ状態では都市名や略称にも対応。`'GMT+2'` のようなオフセット表記は非対応。 |
| `X`, `x` | `'1795542001'` | 秒単位またはミリ秒単位の Unix タイムスタンプ（負の値を含む）。 |
| `[text]` | `'[W]'` | 大文字・小文字を区別して照合するエスケープ済みリテラル文字列。単独の `T` もエスケープ不要で通過。 |

四半期や長いタイムゾーン名といったフォーマット専用トークンは解析できず、[`unknownFormat`](/api/errors/#units-zones-and-formats) をスローします。対象の型に必要なフィールドが欠けたパターンでも同じエラーをスローし、対象の型が持たないトークンを含む場合は [`unsupportedToken`](/api/errors/#units-zones-and-formats) をスローします。

## ファクトリオプション

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { format, zone?, locale?, disambiguation?, loose? }): DateTime
date(input, { format, locale?, loose? }): CalendarDate
time(input, { format, locale?, loose? }): Time
yearMonth(input, { format, locale?, loose? }): YearMonth
monthYear(input, { format, locale?, loose? }): YearMonth
monthDay(input, { format, locale?, loose? }): MonthDay
dayMonth(input, { format, locale?, loose? }): MonthDay
dateRange(start, end, { format, locale?, loose? }): DateRange
datetimeRange(start, end, { format, zone?, locale?, disambiguation?, loose? }): DateTimeRange
timeRange(start, end, { format, locale?, loose? }): TimeRange
```

すべての日付・時刻・部分日付・範囲のファクトリで、トークンパターンまたは名前付きフォーマットに従って文字列入力を解析します。すでに解析済みの日付・時刻・`Date`・`Temporal` の値はパターンの検証後にそのまま通過し、数値は拒否されます。

**パラメーター**

```params
- name: format
  type: string
  required: true
  description: "`'DDMMYYYY'` のようなトークンパターン、または `configure({ formats })` で登録した名前付きパターン。"
- name: zone
  type: Zone
  description: ローカル日時文字列の解釈、またはオフセット・エポックタイムスタンプの変換に使うタイムゾーン。
- name: locale
  type: Locale
  description: 値に保持され、月名・曜日名・午前/午後表記・序数の判定に使う BCP 47 ロケールタグ。
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "ローカル日時文字列における夏時間（DST）の重複・欠落時刻の解決方法。`'reject'` 指定時は `invalidDateTime` をスロー（loose モードでは `null` を返却）。"
- name: loose
  type: boolean
  default: "false"
  description: "`@native-dates/plugins/loose` が必要。入力がフォーマットに一致しない場合にスローせず `null` を返す設定。"
```

**戻り値**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay | Range
description: "解析されたインスタンス。ファクトリに `{ loose: true }` を指定し入力が一致しない場合は `null`。"
```

```js
date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
yearMonth('202611', { format: 'YYYYMM' }).toString(); // '2026-11'
timeRange('0930', '1700', { format: 'HHmm' }).toString(); // '09:30:00/17:00:00'
```
:::
