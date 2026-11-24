---
source: "46b27cf4cf7e"
title: プラグインの作成
lede: オプトインのプロトタイプメソッドと TypeScript のモジュール拡張で Native Dates を拡張します。
---

プラグインはインポートするだけで有効になります。

[`@native-dates/plugins`](/plugins/) の [`zones`](/plugins/zones/) や [`legacy-date`](/plugins/legacy-date/) と同じパターンを使って、再利用可能なパッケージとして公開したり、アプリ固有のドメインヘルパーを追加したりできます。

## プロトタイプメソッドの追加

拡張したいクラスをインポートし、その `prototype` にメソッドを追加します。

すべてのインスタンスは生成時に凍結されるため、プラグインのメソッドは `this` を変更せず、新しい値や計算結果を返す純粋な実装にしてください。

```js
import { CalendarDate, date } from 'native-dates';

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

date('2026-11-13').nextBusinessDay().toString(); // '2026-11-16'
```

インスタンスの公開プロパティを参照するか [`this.toTemporal()`](/api/calendar-date/#totemporal) を呼び出し、戻り値は [`this.plus()`](/api/calendar-date/#plus) などの既存メソッドで組み立てます。

[`format()`](/api/calendar-date/#format) のような既存メソッドを拡張する場合は、元のメソッドを先に退避しておき、プラグインが処理しない入力を元の実装へ委譲してください。

```js
const baseFormat = CalendarDate.prototype.format;

CalendarDate.prototype.format = function format(spec, locale) {
  if (spec === 'compact') {
    return this.toString().replaceAll('-', '');
  }
  return baseFormat.call(this, spec, locale);
};

date('2026-11-16').format('compact'); // '20261116'
date('2026-11-16').format('short', 'en-US'); // '11/16/26'
```

## バンドルをまたいだ型判定

プラグインのヘルパー内で `value.constructor.name` を使って型を判定しないでください。モノレポ・マイクロフロントエンド・iframe 環境では、同じパッケージのコピーが2つ同時にメモリへ読み込まれることがあります。

各クラスにはグローバルなシンボルブランドが付与されています。型ガード、[`kindOf()`](/api/kind-of/)、[`IS_DATE_TIME`](/api/kind-of/#cross-realm-instanceof-and-brands) などのブランドシンボルを使えば、レルムや重複バンドルをまたいでも正しく値を判定できます。

```js
import { date, IS_CALENDAR_DATE, IS_DATE_TIME, kindOf, now } from 'native-dates';

export function isDateOrMoment(value) {
  return Boolean(value?.[IS_CALENDAR_DATE] || value?.[IS_DATE_TIME]);
}

isDateOrMoment(date('2026-11-16')); // true
kindOf(now()); // 'datetime'
```

## package.json での sideEffects の宣言

利用者は値を受け取らない副作用インポートでプラグインを有効化します。バンドラにインポートを削除されず、ホストアプリとクラス定義を共有できるよう、エントリファイルを `"sideEffects"` に記載し、`"native-dates"` は `peerDependencies` に配置してください。

```json title="package.json"
{
  "name": "my-dates-plugin",
  "type": "module",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "default": "./index.js"
    }
  },
  "sideEffects": ["./index.js"],
  "peerDependencies": {
    "native-dates": "^1.0.0"
  }
}
```

:::warning[副作用のあるプラグインで sideEffects を false にしない]
`"sideEffects": false` を設定すると、Node 上のユニットテストが通っても、本番ビルド時にバンドラが副作用インポートを取り除いてしまいます。
:::

## TypeScript の型拡張

型宣言ファイル内で `module 'native-dates'` を宣言すると、既存のクラスや設定オプションに新しいメソッドシグネチャをマージできます。

```ts title="index.d.ts"
import 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
}
```

プラグインをインポートすれば、すべての呼び出し箇所で組み込みメソッドと並んで追加メソッドが補完・型チェックされます。
