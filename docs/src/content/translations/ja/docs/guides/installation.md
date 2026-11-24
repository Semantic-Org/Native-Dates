---
source: "f1aec8a13183"
title: インストール
lede: コマンド1つで Native Dates を導入できます。Safari や旧バージョンの Node 向けポリフィルも用意しています。
---

Native Dates は、TypeScript の型定義を同梱したランタイム依存ゼロの ES モジュールパッケージです。

## インストール

npm からインストールするか、AI コーディングエージェントを利用している場合はセットアップコマンドを実行してください。

```bash label="npm"
npm i native-dates
```

```bash label="AI スキル付き"
npx @native-dates/setup@latest
```

インストール後、アプリから `native-dates` をインポートして使います。

```js title="app.js"
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
```

## Safari と旧バージョンの Node への対応

Native Dates は、実行環境に組み込まれた `Temporal` と `Intl` API の上で直接動作します。最新版の Chrome、Edge、Firefox、Node 26 以降、Deno、Bun では追加パッケージ不要です。

Safari、旧バージョンのブラウザ、Node 24〜25 を対象とする場合は、ポリフィルと `temporal-polyfill` をあわせてインストールしてください。

```bash
npm i @native-dates/polyfill temporal-polyfill
```

日付処理を読み込む前に、エントリーファイルの先頭で一度だけインポートします。

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[モダンブラウザでは追加コストゼロ]
ネイティブの `Temporal` を備えたランタイムでは、`temporal-polyfill` 自体はダウンロードされません。
:::

:::details[旧ランタイムでの互換性に関する注意点]
- **同期読み込み**：インポートしたモジュールがトップレベル `await` の完了前に日付を評価する場合は、代わりに `@native-dates/polyfill/sync` をインポートしてください。
- **Node での期間フォーマット**：サーバー側で [`Duration.format()`](/api/duration/#format) を呼び出す場合、`Intl.DurationFormat` のため Node 24 以降が必要です。ブラウザ向けバンドルのビルド自体は旧バージョンの Node でも問題なく動作します。
:::

続いて、[カスタマイズ](/guides/customization/) でアプリ全体のデフォルト設定やオプションプラグインの追加方法を確認してください。
