---
source: "be45ccc1b61a"
title: loose
lede: フォームや CSV、レガシーフィード由来の未検証テキスト向けに、ロケール対応の緩やかな解析と null 返却をオプトインで有効化します。
---

## オプトインの loose モード解析

各ファクトリ関数はデフォルトで厳格な ISO 8601 文字列のみを解析し、不正な入力ではエラーをスローします。このプラグインをインポートすると、未検証のユーザー入力や CSV の列、レガシーヘッダーを扱うための `{ loose: true }` が使えるようになります。

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

loose モードを指定しない呼び出しでは引き続き厳格な解析が行われます。プラグインをインポートしても、コードベース内の既存呼び出しの動作は変わりません。

## 現在のロケールに基づく解析

loose モード（緩やかな解析）は、現在のロケールで `Intl` が出力する日付と時刻の表現をそのまま読み戻します。月名、午前・午後や時間帯の表現、数値日付の並び順はすべて実行環境から取得され、どの文字体系の数字も自動的に変換されます。

使用するロケールの優先順位はフォーマット時と同じです。呼び出し時の `locale` オプション、[`configure()`](/api/configure/)、実行環境のデフォルトの順に決まります。

```js locale="en-US" label="English"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'en-US' });

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
time('9:10 in the evening', { loose: true })?.toString(); // '21:10:00'
datetime('Sep 6, 2026, 5:30 PM', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 17
```

```js locale="fr" label="Français"
import '@native-dates/plugins/loose';
import { configure, date, datetime, monthDay } from 'native-dates';

configure({ locale: 'fr' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('1er mai 2026', { loose: true })?.toString(); // '2026-05-01'
monthDay('1er mai', { loose: true })?.toString(); // '05-01'
datetime('16 novembre 2026 à 14:30', {
  loose: true,
  zone: 'Europe/Paris',
})?.hour; // 14
```

```js locale="es" label="Español"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'es' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de noviembre de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 de la noche', { loose: true })?.toString(); // '21:10:00'
datetime('16 nov 2026, 14:30', {
  loose: true,
  zone: 'Europe/Madrid',
})?.hour; // 14
```

```js locale="pt-BR" label="Português"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'pt-BR' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de novembro de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 da noite', { loose: true })?.toString(); // '21:10:00'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  zone: 'America/Sao_Paulo',
})?.hour; // 14
```

```js locale="zh-CN" label="中文"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'zh-CN' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('晚上9:10', { loose: true })?.toString(); // '21:10:00'
datetime('2026年11月16日 下午2:30', {
  loose: true,
  zone: 'Asia/Shanghai',
})?.hour; // 14
```

```js locale="ja" label="日本語"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ja' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026年11月16日 14:30', {
  loose: true,
  zone: 'Asia/Tokyo',
})?.hour; // 14
```

```js locale="ko" label="한국어"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ko' });

date('26. 5. 5.', { loose: true })?.toString(); // '2026-05-05'
date('2026년 11월 16일', { loose: true })?.toString(); // '2026-11-16'
time('오후 2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026년 11월 16일 오후 2:30', {
  loose: true,
  zone: 'Asia/Seoul',
})?.hour; // 14
```

```js locale="ru" label="Русский"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ru' });

date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('16 ноября 2026 г.', { loose: true })?.toString(); // '2026-11-16'
time('9:10 вечера', { loose: true })?.toString(); // '21:10:00'
datetime('16 нояб. 2026 г., 14:30', {
  loose: true,
  zone: 'Europe/Moscow',
})?.hour; // 14
```

```js locale="ar-EG" label="العربية"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ar-EG' });

date('١٦‏/١١‏/٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
date('١٦ نوفمبر ٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true })?.toString(); // '14:30:00'
datetime('١٦ نوفمبر ٢٠٢٦، ٢:٣٠ م', {
  loose: true,
  zone: 'Africa/Cairo',
})?.hour; // 14
```

韓国語のような年・月・日順のロケールでは先頭の2桁の年を読み取るため、韓国語ロケールでの `'26. 5. 5.'` は2026年5月5日として解析されます。完全な日付でも部分日付でも、接続語・序数標識・先頭の曜日名は自動的に読み飛ばされます。

## 不正な入力での null 返却

loose モードを有効にすると、解釈できない文字列、空欄、欠損値、さらに2月30日のような実在しない日付はエラーをスローせず `null` を返します。フォーム処理やインポートスクリプトでは、すべての項目を `try` ブロックで囲まずに戻り値をそのまま確認できます。

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

[範囲](/api/ranges/)や [`YearMonth`](/api/year-month/)、[`MonthDay`](/api/month-day/) のファクトリでも同じオプションが使えます。

```js
import { dateRange, monthDay, yearMonth } from 'native-dates';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

年や日が欠けた不完全な日付を日付や日時のファクトリに渡しても、既定値を補わず `null` を返します。年月だけ、あるいは月日だけの入力には部分日付のファクトリを使ってください。

英語以外の月名と組み合わせた2桁の年、複数の月に該当するあいまいな月名略称、AM/PM を伴う13時以上の時刻、[`datetime()`](/api/datetime-fn/) への時刻のみの入力は拒否されます。未知の大文字ゾーン略称や `'14h'` のような時（hour）のみの表記も `null` を返します。

:::note[不正な入力は null、不正なオプションはエラー]
loose モードが吸収するのは読み取れない入力データだけです。`'Mars/Olympus'` のような未知のタイムゾーン指定はユーザー入力ではなくアプリケーションコード側の誤りのため、引き続き即座にエラーをスローします。
:::

## loose モードでのタイムゾーンの扱い

UTC 標識や数値オフセットを含む文字列は特定の瞬間として解釈され、指定または設定済みのタイムゾーンへ変換されます。オフセットを含まない文字列は、書かれている日付と時刻をそのまま対象のタイムゾーンに配置します。

```js
datetime('Sat, 06 Sep 2026 14:30:00 GMT', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 10

datetime('September 6, 2026 5:30 PM', {
  loose: true,
  zone: 'America/Los_Angeles',
})?.hour; // 17
```

時刻の後ろに付いたタイムゾーン略称は、`zone` オプションと同じルールで解決されます。UTC・GMT・標準の IANA ID 以外の略称（中国語ロケールでの `CST` など地域固有のコードを含む）も読み取りたい場合は、[`@native-dates/plugins/zones`](/plugins/zones/) をあわせて読み込んでください。

## 日・月・年順の数値日付

スラッシュ・ドット・ハイフン区切りの数値日付は、現在のロケールの並び順に自動で従います。入力の並び順がロケールと異なる場合は、呼び出しごとに `dayFirst` を渡すか [`configure()`](/api/configure/) で指定します。

```js
import { configure } from 'native-dates';

date('07.09.2026', { loose: true, locale: 'en-US' })?.toString(); // '2026-07-09'
date('07.09.2026', { loose: true, locale: 'de-DE' })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, locale: 'en-US', dayFirst: true })?.toString(); // '2026-09-07'

configure({ dayFirst: true });
date('7/9/26', { loose: true })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, dayFirst: false })?.toString(); // '2026-07-09'
configure({ dayFirst: null });
```

`configure()` に `dayFirst: null` を渡すと、再び現在のロケールの並び順に従うようになります。なお、[`monthDay()`](/api/month-day-fn/) のような部分日付ファクトリは、ロケールにかかわらず関数名どおりの順序で数値ペアを読み取ります。

## 地域ごとの時刻と月名のルール

`'14.30'` のようなドット区切りの時刻は、フィンランド語やデンマーク語などドット区切りを使うロケールでのみ解析され、それ以外のロケールでは `null` を返します。ドット区切りの秒は日付の後ろにある場合のみ解析され、単独の3要素ドット区切り文字列は日付として扱われます。

英語の「in the evening」や韓国語の「밤」のような時間帯表現は12時間制の時刻を補正し、24時間制の時刻はそのまま維持します。日付と時刻をつなぐ接続語が AM/PM と誤認されることもないため、ウェールズ語の「am」（「〜に」の意味）は 14:30 をそのまま扱い、英語の `'AM 12:30'` は午前0時30分として解析されます。

ヘブライ語やバスク語を含め、完全な日付の中に書かれた格変化形や接辞付きの月名も自動で解析されます。省略された月名は1つの月に一意に特定できる必要があるため、フランス語の「juil」は7月として解析されますが、「jui」は `null` を返します。

```js label="ドット区切りの時刻"
datetime('16.11.2026 klo 14.30.15', {
  loose: true,
  locale: 'fi',
  zone: 'UTC',
})?.toString(); // '2026-11-16T14:30:15.000Z'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'de' }); // null
time('14.30.15', { loose: true, locale: 'fi' }); // null
```

```js label="時間帯の表現"
time('밤 11:30', { loose: true, locale: 'ko' })?.toString(); // '23:30:00'
time('밤 1:30', { loose: true, locale: 'ko' })?.toString(); // '01:30:00'
time('14:30 nachmittags', { loose: true, locale: 'de' })?.toString(); // '14:30:00'
```

```js label="接続語"
time('am 14:30', { loose: true, locale: 'cy' })?.toString(); // '14:30:00'
time('am 12:30', { loose: true, locale: 'cy' })?.toString(); // '12:30:00'
time('AM 12:30', { loose: true, locale: 'en-US' })?.toString(); // '00:30:00'
```

```js label="月名の変化・略称"
date('2026(e)ko azaroaren 16(a)', {
  loose: true,
  locale: 'eu',
})?.toString(); // '2026-11-16'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
```

## ファクトリオプション

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, locale?, dayFirst?, disambiguation? }): DateTime | null
date(input, { loose: true, zone?, locale?, dayFirst? }): CalendarDate | null
time(input, { loose: true, zone?, locale?, dayFirst? }): Time | null
duration(input, { loose: true, locale? }): Duration | null
yearMonth(input, { loose: true, zone?, locale? }): YearMonth | null
monthDay(input, { loose: true, zone?, locale?, dayFirst? }): MonthDay | null
dateRange(start, end, { loose: true, zone?, locale?, dayFirst? }): DateRange | null
```

各ファクトリにロケール対応のフォールバック解析と、読み取れない入力での `null` 返却を追加します。`new DateTime()` のようなクラスコンストラクターに `{ loose: true }` を渡した場合はフォールバック解析が有効になりますが、読み取れない入力では引き続きエラーをスローします。

**パラメーター**

```params
- name: loose
  type: boolean
  default: "false"
  description: "現在のロケールで非定型テキストを解析し、機械形式では実行環境の `Date` 解析にフォールバックしたうえで、読み取れない場合に `null` を返す設定。"
- name: dayFirst
  type: boolean
  description: "`'07.09.2026'` のような数値日付における、現在のロケールの並び順を上書きするフラグ。"
- name: zone
  type: Zone
  description: ローカル日時文字列の解釈または瞬間の表示に使うタイムゾーン。
- name: locale
  type: Locale
  description: 値に保持され、月名・時間帯表現・時刻表記・日付の並び順の判定に使う BCP 47 ロケールタグ。
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "ローカル日時文字列における夏時間（DST）の重複・欠落時刻の解決方法。loose モードでは `'reject'` 指定時に `null` を返却。"
```

**戻り値**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: "解析されたインスタンス。`input` を読み取れない場合は `null`。"
```

```js
date('Sept 6, 2026', { loose: true })?.toString(); // '2026-09-06'
date('2026-09', { loose: true }); // null
yearMonth('2026-09', { loose: true })?.toString(); // '2026-09'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

個別の呼び出しで `dayFirst` も `locale` も指定しない場合に使われる、loose モードの既定の数値日付順を上書きします。デフォルトでは未設定のため、現在のロケールに従います。

**パラメーター**

```params
- name: dayFirst
  type: boolean | null
  description: "loose モードの数値日付を日優先（`true`）または月優先（`false`）に固定する設定。`null` を渡すと現在のロケールに追従。"
```
:::
