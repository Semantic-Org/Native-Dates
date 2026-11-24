---
source: "97915c43145b"
title: カスタマイズ
lede: アプリ全体のデフォルト値を設定し、カスタムフォーマットやオプトインのプラグインで Native Dates を拡張します。
---

デフォルトでは、Native Dates はランタイムのローカルタイムゾーンとロケールに従います。アプリ全体で固定のデフォルト値や名前付きフォーマットを使いたい場合、あるいは解析やタイムゾーンの拡張機能が必要な場合は、[`configure()`](/api/configure/) とオプトインのプラグインを使います。

## アプリ全体のデフォルト設定

起動時に [`configure()`](/api/configure/) を呼び出すと、アプリ全体で使うデフォルトのタイムゾーン、ロケール、週の開始曜日（英語の曜日名）を設定できます。省略したキーは現在の設定を維持し、`null` を渡すとランタイムのデフォルトに戻ります。

```js title="main.js"
import { configure, date, now } from 'native-dates';

configure({
  zone: 'America/New_York',
  locale: 'en-US',
  weekStart: 'monday',
});

now().zone; // 'America/New_York'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
```

デフォルトを設定したあとも、個別の呼び出しでタイムゾーン、[`locale()`](/api/date-time/#locale)、週の開始曜日を指定すれば、その呼び出しだけ上書きできます。

:::warning[サーバーでは起動時に一度だけ設定する]
グローバルなデフォルト設定は JavaScript プロセス全体で共有されます。マルチユーザー環境で動作するサーバーでは、リクエストごとに `configure()` を書き換えず、各値にリクエストごとのタイムゾーンやロケールを直接付与してください。
:::

## 名前付きフォーマット

`formats` に名前付きフォーマットを登録しておくと、その名前を [`format()`](/guides/formatting/) に渡して再利用できます。各エントリにはトークンパターンまたは `Intl` オプションオブジェクトを指定します。

```js title="main.js"
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
const placed = datetime('2026-11-06T09:05', 'Europe/Berlin');
placed.format('receipt'); // 'Friday, November 6'
```

名前付きフォーマットは日付・日時・時刻・部分日付・範囲で利用できます（期間は組み込みスタイルのみ対応）。カスタム名は組み込みプリセットより優先されるため、たとえば `'short'` を登録するとアプリ全体で `'short'` の出力を上書きできます。

## プラグインの追加

都市名検索、緩やかな解析、従来の `Date` 互換ゲッターを提供するオプションプラグインは [`@native-dates/plugins`](/plugins/) にまとまっています。

```bash
npm i @native-dates/plugins
```

使いたい機能のサブパスを起動時に一度だけインポートすると有効になります。

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

プラグインを読み込むと、専用の [`configure()`](/api/configure/) オプションも追加されます。`zones` プラグインはカスタム別名を指定する `zoneAliases` を、`loose` プラグインは数値日付の日・月順を切り替える `dayFirst` を追加します。

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, date, now } from 'native-dates';

configure({
  zoneAliases: { hq: 'Europe/Berlin' },
  dayFirst: true,
});

now('hq').zone; // 'Europe/Berlin'
date('07.09.2026', { loose: true }).toString(); // '2026-09-07'
```

各サブパスのサイズは [すべてのプラグイン](/plugins/) で確認できます。独自プラグインを作成したい場合は [プラグインの作成](/guides/writing-a-plugin/) を参照してください。

## 曜日名と序数のカスタマイズ

月名と曜日名はランタイムの `Intl` データから取得されます。UI の要件に合わせて独自の曜日略称や日の序数表記を使いたい場合は、`weekdayNames` と `ordinals` で上書きできます（`weekdayNames` のキーには英語の曜日略称を指定します）。

```js title="main.js"
import { configure, date } from 'native-dates';

configure({
  weekdayNames: {
    en: { short: { tue: 'Tues', thu: 'Thurs' } },
  },
  ordinals: {
    fr: (day) => (day === 1 ? '1er' : day),
  },
});

date('2026-11-03').format('ddd', 'en-US'); // 'Tues'
date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
```

どちらのキーも `null` を渡せばランタイムと組み込みのデフォルトに戻ります。次は [ローカライズ](/guides/localization/) で、ユーザーごとの言語設定、週の境界、暦の切り替え方法を確認してください。
