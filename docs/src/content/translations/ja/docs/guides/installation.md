---
source: "84e8bf9a4705"
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

Safari、旧バージョンのブラウザ、Node 22〜25 を対象とする場合は、ポリフィルと `temporal-polyfill` をあわせてインストールしてください。

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
ネイティブの `Temporal` と `Intl.DurationFormat` を備えたランタイムでは、どちらのポリフィルも一切ダウンロードされません。
:::

:::details[旧ランタイムでの互換性に関する注意点]
- **同期読み込み**：インポートしたモジュールがトップレベル `await` の完了前に日付を評価する場合は、代わりに `@native-dates/polyfill/sync` をインポートしてください。
- **Node 22〜23 での期間フォーマット**：`@native-dates/polyfill` には依存関係ゼロの `Intl.DurationFormat` フォールバックが含まれており、Node 22〜23 でも [`Duration.format()`](/api/duration/#format) と `Duration.text` が動作します（ブラウザおよび Node 24 以降には標準搭載されているためダウンロードされません）。
:::

続いて、[カスタマイズ](/guides/customization/) でアプリ全体のデフォルト設定やオプションプラグインの追加方法を確認してください。
