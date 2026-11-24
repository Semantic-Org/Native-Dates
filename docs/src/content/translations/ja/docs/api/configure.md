---
source: "e011cab2c85c"
title: configure()
lede: タイムゾーン、ロケール、週の開始曜日、フォーマット、トークン名、プラグインのプロセス共通デフォルトを読み取り・更新します。
---

## グローバルデフォルト

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

プロセス全体で共有されるデフォルト設定を1つ以上更新し、適用後の設定スナップショットを返します。引数なしで呼び出すと、設定を変更せずに現在の値を読み取ります。

省略したプロパティは現在の値が維持されます。いずれかの設定に `null` を渡すと、実行環境または組み込みのデフォルトに戻ります。

```js title="setup.js"
import { configure, date, datetime } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'de-DE',
});

datetime('2026-11-16T17:30:00Z').zone; // 'Europe/Berlin'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
configure().weekStart; // undefined

configure({ weekStart: 'sunday' });
date('2026-11-18').startOf('week').toString(); // '2026-11-15'
configure().weekStart; // 7

// 実行環境のタイムゾーン・ロケール、およびロケールの週の開始曜日にリセット
configure({ zone: null, locale: null, weekStart: null });
```

**引数**

```params
- name: settings
  type: Settings
  description: 更新するプロセス共通のデフォルト設定。省略したキーは元の値を維持。
  options:
    - name: zone
      type: Zone | null
      description: "ファクトリー関数と `now()` のデフォルトタイムゾーン。`null` を渡すと実行環境のローカルタイムゾーンにリセット。"
    - name: locale
      type: Locale | null
      description: "フォーマット、週の境界、週末判定、およびプラグインに使うデフォルトのロケールタグ、タグ配列、または `Accept-Language` ヘッダー。`null` または `''` で実行環境のロケールにリセット。"
    - name: weekStart
      type: DayOfWeek | null
      description: "週の境界と `weekdayNames()` の基準となる週の開始曜日（月曜を1、日曜を7とする数値、または英語の曜日名）。未設定または `null` の場合はアクティブなロケールを適用。"
    - name: weekdayNames
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: "言語、幅（`narrow`、`short`、`long`）、および英語の曜日名をキーとするカスタム曜日ラベル。地域付きタグは基本言語の設定に重ねて適用され、空の値を渡すと実行環境のラベルにリセット。"
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: "言語タグをキーとする `Do`（日の序数）用カスタムフォーマッター。`null` を渡すと組み込みの英語接尾辞とロケールの日表記にリセット。"
    - name: formats
      type: "Record<string, string | Intl.DateTimeFormatOptions> | null"
      description: "`format(name)` に渡す再利用可能なカスタムフォーマット。各値はトークンパターンまたは `Intl` オプションオブジェクト。カスタム名は組み込みプリセットより優先され、`null` でクリア。"
    - name: dayFirst
      type: boolean | null
      description: "呼び出しごとの `dayFirst` と `locale` を省略した loose 呼び出しにおける、数値日付のデフォルト並び順。未設定または `null` の場合はアクティブなロケールを適用。"
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: "`@native-dates/plugins/zones` と併用するカスタムのタイムゾーン別名マップ。個別キーまたはマップ全体に `null` を渡すと別名をクリア。"
```

**戻り値**

```returns
type: "{ zone, locale, weekStart, dayFirst, zoneAliases, weekdayNames, ordinals, formats }"
description: "更新適用後のアクティブな設定の浅いコピー。未設定のキーは `undefined`。"
```

`weekdayNames` と `ordinals` を使うと、プラグインなしでトークンパターンや [`weekdayNames()`](/api/month-names/#weekdaynames) の出力をカスタマイズできます。

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});

date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
weekdayNames('narrow', 'monday', 'lv'); // ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

configure({ weekdayNames: null, ordinals: null });
```

名前付きフォーマットを登録すると、日付や時刻をフォーマットできるすべての型でアプリ独自のプリセットを使えます。

```js
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt'); // 'Friday, November 6'

configure({ formats: null });
```

プラグインはインポートすると `configure()` に独自のオプションを追加します。プラグインをインポートする前にそのオプションを設定すると `RangeError` をスローします。

```js
import { configure, date, now } from 'native-dates';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';

configure({
  dayFirst: true,
  zoneAliases: { hq: 'Europe/Berlin' },
});

date('07.09.2026', { loose: true })?.toString(); // '2026-09-07'
now('hq').zone; // 'Europe/Berlin'

configure({ dayFirst: null });
```
:::

:::warning[サーバーでは起動時に一度だけ設定してください]
グローバル設定は JavaScript プロセス全体で共有される状態を更新します。サーバーでは起動時に一度だけデフォルトを設定し、リクエストハンドラー内ではユーザーごとのタイムゾーンと [`locale()`](/api/date-time/#locale) を値に付与してください。詳しくは[ローカライズ](/guides/localization/)を参照してください。
:::

## 曜日番号ヘルパー

英語の曜日名を、ライブラリ全体で使われる ISO 曜日番号に変換します。

:::entry
### `dayOfWeek()` :kind[function]

```js signature
dayOfWeek(day): number
```

英語の曜日名、3文字の省略形、または ISO 番号を、月曜を1・日曜を7とする整数に変換します。認識できない名前や範囲外の数値は `RangeError` をスローします。

**引数**

```params
- name: day
  type: DayOfWeek
  required: true
  description: "`'monday'` のような英語の曜日名、`'Fri'` のような大文字・小文字を区別しない3文字の省略形、または1〜7の整数。"
```

**戻り値**

```returns
type: number
description: 月曜を1、日曜を7とする曜日番号。
```

```js
import { dayOfWeek } from 'native-dates';

dayOfWeek('monday'); // 1
dayOfWeek('Fri'); // 5
dayOfWeek('sunday'); // 7
dayOfWeek(3); // 3
```
:::
