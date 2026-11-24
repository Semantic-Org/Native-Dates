---
source: "68d49ce6b3ea"
title: monthNames()
lede: カレンダーの見出しやメニュー向けに、ローカライズされた月名・曜日名の配列を返します。
---

## カレンダーラベル

どちらのヘルパーもコア内にキャッシュされた `Intl` テーブルを参照し、呼び出しごとに新しい配列を返します。返されたリストは共有状態に影響を与えずに、自由に `map`、`slice`、`reverse` できます。

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

1月から12月まで、ローカライズされたグレゴリオ暦の月名12件の配列を返します。デフォルトでは[設定済みのロケール](/api/configure/)における正式名を返します。

**引数**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: "`'January'` のような正式な月名、または `'Jan'` のような省略名。"
- name: locale
  type: Locale
  description: 設定済みのデフォルトを上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string[]
description: "1月をインデックス `0`、12月を `11` とする12件の月名ラベル配列。"
```

```js title="months.js"
import { monthNames } from 'native-dates';

monthNames('short', 'en-US');
// ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

monthNames('long', 'fr-FR').slice(0, 3);
// ['janvier', 'février', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

ローカライズされた7件の曜日ラベル配列を返します。`firstDay`、[アプリ設定](/api/configure/)の `weekStart`、またはアクティブなロケールの週の開始曜日に合わせて先頭から順に並べます。

[`startOf('week')`](/api/calendar-date/#startof) の週の境界や週の範囲も同じ開始曜日ルールに従うため、カレンダーの見出しと週グリッドが常に一致します。[`configure()`](/api/configure/) で設定したカスタム曜日ラベルもここに反映されます。

**引数**

```params
- name: style
  type: "'short' | 'long' | 'narrow'"
  default: "'short'"
  description: "`'Mon'` のような省略ラベル、`'Monday'` のような正式名、または `'Mo'` のような2文字・1文字の短い見出し。"
- name: firstDay
  type: DayOfWeek
  description: 開始曜日を表す英語の曜日名、または月曜を1・日曜を7とする ISO 番号。
- name: locale
  type: Locale
  description: 設定済みのデフォルトを上書きする BCP 47 ロケールタグ。
```

**戻り値**

```returns
type: string[]
description: "`firstDay`、設定済みの `weekStart`、またはロケールの週の開始曜日から始まる7件の曜日ラベル配列。"
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', undefined, 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

weekdayNames('narrow', undefined, 'en-US');
// ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

weekdayNames('narrow', undefined, 'pt-BR');
// ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInGrid = date('2026-11-18', { locale: 'en-US' }).range('week').every('day');
daysInGrid[0].format({ weekday: 'short' }); // 'Sun'
```
:::
