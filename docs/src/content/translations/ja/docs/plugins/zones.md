---
source: "a3a6297a2309"
title: zones
lede: タイムゾーンを受け取るすべての場所で、都市名や地域略称、ロケールに応じたゾーンコード、カスタムエイリアスを解決します。
---

## 都市名と略称の解決

コア本体は完全な IANA 識別子、固定の UTC オフセット、`'UTC'` のみを受け付けます。このプラグインをインポートすると、ライブラリ全体でタイムゾーンを受け取るすべてのパラメーターが、都市名・一般的な略称・カスタムエイリアスを解釈できるようになります。

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'Beijing').zone; // 'Asia/Shanghai'
today('JST').toString(); // Asia/Tokyo における現在の日付
```

どの表記で指定しても、生成されたインスタンス上では正規の IANA 識別子に統一されます。入力の書き方にかかわらず、タイムゾーンの比較やシリアライズの結果が一貫します。

## 都市名

実行環境のタイムゾーンデータベースに含まれる都市は、大文字小文字、アクセント記号、スペース、アンダースコアの違いを問わず解決されます。IANA 上で別都市名に分類されている主要都市も、現地文字の表記を含めてそのまま利用できます。

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('Mumbai').zone; // 'Asia/Kolkata'
moment.in('Rio de Janeiro').zone; // 'America/Sao_Paulo'
moment.in('東京').zone; // 'Asia/Tokyo'
moment.in('Москва').zone; // 'Europe/Moscow'
```

組み込みの都市エイリアスには NYC、San Francisco、Beijing、Mumbai、Munich、Osaka などの主要都市が含まれます。未知の名前は実行環境のシステムタイムゾーンにフォールバックせず、引き続き [`unknownZone`](/api/errors/#units-zones-and-formats) エラーをスローします。

## ロケールに応じて変わる略称

略称の中には、国や地域によって指すタイムゾーンが異なるものがあります。複数の意味を持つ略称が渡された場合、プラグインはまず現在のロケールの地域を確認し、該当しない場合は既定の解釈にフォールバックします。

```js
const call = datetime('2026-11-16T09:30Z');

call.locale('en-US').in('CST').zone; // 'America/Chicago'
call.locale('zh-CN').in('CST').zone; // 'Asia/Shanghai'
call.locale('he-IL').in('IST').zone; // 'Asia/Jerusalem'
```

判定に使うロケールは、値自身が持つロケール、`{ locale }` オプション、[`configure()`](/api/configure/)、実行環境のデフォルトの順に採用されます。

| 略称・名称 | 既定の解釈と地域別の解釈 |
|---|---|
| `CST` | 既定は `'America/Chicago'`。`zh`・`zh-CN` では `'Asia/Shanghai'`、`zh-TW` では `'Asia/Taipei'`、`es-CU` では `'America/Havana'`。 |
| `IST` | 既定は `'Asia/Kolkata'`。`en-IE` では `'Europe/Dublin'`、`he` では `'Asia/Jerusalem'`。 |
| `PST` | 既定は `'America/Los_Angeles'`。`fil`・`en-PH` では `'Asia/Manila'`。 |
| `BST` | 既定は `'Europe/London'`。`bn` では `'Asia/Dhaka'`。 |
| `AST` | 既定は `'America/Halifax'`。`ar-SA` では `'Asia/Riyadh'`。 |
| `ACT` | 既定は `'Australia/Adelaide'`。`pt-BR` では `'America/Rio_Branco'`。 |
| `AMT` | 既定は `'America/Manaus'`。`hy` では `'Asia/Yerevan'`。 |
| `San Juan` | 既定は `'America/Argentina/San_Juan'`。`es-PR` では `'America/Puerto_Rico'`。 |

## 主な略称一覧

各略称と地域名は、その地域の代表的な夏時間（DST）対応の IANA タイムゾーンへ対応付けられます。

| 略称 | 正規のタイムゾーン | 地域 |
|---|---|---|
| `PT`, `PST`, `PDT`, `Pacific` | `'America/Los_Angeles'` | 北米太平洋時間（`PST` はロケールに追従）。 |
| `MT`, `MST`, `MDT`, `Mountain` | `'America/Denver'` | 北米山岳部時間。 |
| `CT`, `CST`, `CDT`, `Central` | `'America/Chicago'` | 北米中部時間（`CST` はロケールに追従）。 |
| `ET`, `EST`, `EDT`, `Eastern` | `'America/New_York'` | 北米東部時間。 |
| `HNE`, `HAE` | `'America/Toronto'` | カナダフランス語圏の東部時間。 |
| `AKT`, `AKST`, `AKDT`, `Alaska` | `'America/Anchorage'` | アラスカ時間。 |
| `HT`, `HST`, `Hawaii` | `'Pacific/Honolulu'` | ハワイ時間。 |
| `AT`, `AST` | `'America/Halifax'` | 大西洋時間（`AST` はロケールに追従）。 |
| `BRT`, `FNT` | `'America/Sao_Paulo'`, `'America/Noronha'` | ブラジリア時間およびフェルナンド・デ・ノローニャ時間。 |
| `ART`, `COT`, `CLT` | `'America/Argentina/Buenos_Aires'`, `'America/Bogota'`, `'America/Santiago'` | アルゼンチン・コロンビア・チリ時間。 |
| `GMT`, `Z` | `'UTC'` | 協定世界時（UTC）。 |
| `UK`, `WET`, `BST` | `'Europe/London'` | イギリスおよび西ヨーロッパ時間（`BST` はロケールに追従）。 |
| `CET`, `CEST`, `ECT` | `'Europe/Paris'` | 中央ヨーロッパ時間。 |
| `EET` | `'Europe/Helsinki'` | 東ヨーロッパ時間。 |
| `MSK`, `мск` | `'Europe/Moscow'` | モスクワ標準時。 |
| `WAT`, `EAT`, `SAST` | `'Africa/Lagos'`, `'Africa/Nairobi'`, `'Africa/Johannesburg'` | 西アフリカ・東アフリカ・南アフリカ時間。 |
| `GST`, `IRST`, `PKT` | `'Asia/Dubai'`, `'Asia/Tehran'`, `'Asia/Karachi'` | 湾岸・イラン・パキスタン時間。 |
| `IST`, `INST` | `'Asia/Kolkata'` | インド標準時（`IST` はロケールに追従）。 |
| `ICT`, `WIB`, `PHT` | `'Asia/Bangkok'`, `'Asia/Jakarta'`, `'Asia/Manila'` | インドシナ・インドネシア西部・フィリピン時間。 |
| `JST`, `KST` | `'Asia/Tokyo'`, `'Asia/Seoul'` | 日本標準時および韓国標準時。 |
| `SGT`, `HKT` | `'Asia/Singapore'`, `'Asia/Hong_Kong'` | シンガポール時間および香港時間。 |
| `AET`, `AEST`, `AEDT` | `'Australia/Sydney'` | オーストラリア東部時間。 |
| `ACT`, `AWT` | `'Australia/Adelaide'`, `'Australia/Perth'` | オーストラリア中部および西部時間（`ACT` はロケールに追従）。 |
| `NZT`, `NZST`, `NZDT` | `'Pacific/Auckland'` | ニュージーランド時間。 |

:::note[略称は夏時間（DST）を反映]
生の IANA データでは、単独の `EST` は3月に切り替わらない UTC-5 の固定オフセットです。このプラグインは太平洋時間や東部時間の略称を `'America/Los_Angeles'` や `'America/New_York'` に対応付けるため、夏時間（DST）の計算が正しく保たれます。通年固定のオフセットが必要な場合は `'-08:00'` のような数値オフセットを渡してください。
:::

## カスタムエイリアス

オフィス名やチーム名、略称の固定マッピングをアプリ起動時に [`configure()`](/api/configure/) でまとめて登録できます。カスタムエイリアスはロケールに応じた解決よりも優先されます。

:::entry
### `configure()` :kind[function]

```js signature
configure({ zoneAliases }): Settings
```

グローバル設定テーブルにカスタムのタイムゾーン名を追加・削除します。エイリアスのキーは大文字小文字やアクセント記号を区別せずに照合され、対象には完全な IANA 識別子・都市名・略称を指定できます。個別のキーに `null` を設定するとそのエイリアスを削除でき、`zoneAliases: null` を渡すとすべて消去できます。

**パラメーター**

```params
- name: zoneAliases
  type: Record<string, Zone | null> | null
  description: "カスタム名と有効なタイムゾーンまたは `null` の対応表。`null` を渡すとカスタムエイリアスを全件消去。"
```

**戻り値**

```returns
type: Settings
description: エイリアスの参照先を正規化した現在の設定スナップショット。
```

```js
import { configure } from 'native-dates';

configure({
  zoneAliases: {
    hq: 'Berlin',
    west: 'PT',
    ist: 'Asia/Jerusalem',
  },
});

datetime('2026-11-16T09:30', 'west').in('hq').zone; // 'Europe/Berlin'
datetime('2026-11-16T09:30Z', 'IST').zone; // 'Asia/Jerusalem'

configure({ zoneAliases: null });
```
:::

起動時に基本の略称マッピングを直接参照・固定したい場合は、プラグインがエクスポートする変更可能な `timezones` マップも利用できます。`timezones.IST = 'Asia/Jerusalem'` のように設定すると、すべてのロケールでロケール別解決を上書きします。

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
