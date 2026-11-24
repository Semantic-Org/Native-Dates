---
source: "66dc60a9a9b2"
title: ポルトガル語
lede: ブラジル・ポルトガル・アフリカ各地域のポルトガル語ロケールに合わせて日付をフォーマット・解析します。
---

ポルトガル語でフォーマットするには `'pt-BR'` または `'pt-PT'` を指定します（設定方法は[ローカライズ](/guides/localization/)を参照）。ブラジルとポルトガルはどちらも日・月・年順の数値表記と小文字の月名を使いますが、`'medium'` プリセットや1日の序数表記に違いがあります。

## 日/月/年順の日付解析

年・月・日順の ISO 文字列は月と日が入れ替わる心配がありません。[loose プラグイン](/plugins/loose/)を読み込むと、ポルトガル語ロケールではスラッシュ区切り・ドット区切り・語句を含む日付を自動で日・月・年順として解析します。

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true, locale: 'pt-PT' })?.toString(); // '2026-11-16'
date('16 de novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-16'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  locale: 'pt-BR',
  zone: 'America/Sao_Paulo',
})?.hour; // 14
date('29/02/2026', { loose: true, locale: 'pt-BR' }); // null
```

部分日付については、数値による日/月ペアと月/年ペアはプラグインなしでコアが解析でき、loose モードではポルトガル語の月名にも対応します。

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## プリセット・前置詞・序数

組み込みプリセットは小文字の月名と自然な前置詞を出力します。`'medium'` プリセットはブラジルでは省略月名を書き出し、ポルトガルではスラッシュ区切りの数値で出力します。

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

カスタムのトークンパターンでは、`'[de]'` や `'[às]'` のようなリテラル語句を角括弧で囲んでください。角括弧を省略すると意図しない文字展開ではなくエラーをスローします。

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

ブラジル向けの短縮月名と短縮曜日名は小文字かつ末尾ピリオド付きです。また「segunda」（月曜）と「sexta」（金曜）は先頭2文字が重なるため、`dd` は1文字の頭文字を返します。

ブラジルでは月の1日を「1º de maio」のように「1º」と表記しますが、ポルトガルでは通常の数字を使います。[`ordinals`](/api/configure/) と曜日名の上書きを `'pt-BR'` に限定しておけば、ポルトガルの既定動作を保てます。

```js
import { configure, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'pt-BR'); // ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

configure({
  ordinals: { 'pt-BR': (d) => (d === 1 ? '1º' : d) },
  weekdayNames: { 'pt-BR': { short: { fri: 'Sex', sat: 'Sáb' } } },
});
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sex, 1º de maio'
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-PT'); // 'sexta, 1 de maio'
```

## 週の開始曜日

ポルトガル語の曜日名「segunda-feira」（第2の日＝月曜）から「sexta-feira」（第6の日＝金曜）は日曜日を起点に数えますが、`dayOfWeek` は ISO 準拠で月曜を `1`、日曜を `7` とします。

週の境界は各地域の `weekStart` に従い、ブラジルとポルトガルは日曜始まり、アンゴラ・モザンビーク・カーボベルデは月曜始まりになります。

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

業務レポートを月曜〜日曜で区切る場合は `'monday'` を渡してください。ISO の `weekOfYear` 番号は常に月曜始まりの週で計算されます。

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## タイムゾーンと相対日付

ブラジルには4つのタイムゾーンがあり、2019年に夏時間（DST）を廃止しました。`'America/Sao_Paulo'` は通年 UTC-3 のまま、過去の夏時間オフセットも保持します。

| ブラジルのタイムゾーン | 主な IANA タイムゾーン | 対応地域とエイリアス |
|---|---|---|
| フェルナンド・デ・ノローニャ | `America/Noronha` | UTC-2。`'Noronha'` と `'FNT'` を直接解決。 |
| ブラジリア時間 | `America/Sao_Paulo` | UTC-3。バイーア・レシフェ・フォルタレザ・ベレンと共通。`'BRT'`・ブラジリア・リオデジャネイロ・ベロオリゾンテ・サルヴァドールを解決。 |
| アマゾナス・マットグロッソ | `America/Manaus` | UTC-4。クイアバ・カンポグランデ・ポルトヴェーリョと共通。`'AMT'` を解決。 |
| アクレ | `America/Rio_Branco` | UTC-5。エイルネペと共通。`'pt-BR'` 環境では `'ACT'` を自動解決。 |

[zones プラグイン](/plugins/zones/)を使うと、ブラジルの主要都市や地域略称が設定なしで解決され、loose モードで解析する文字列内の `BRT` にも対応します。

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:00', 'BRT').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'Brasília').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo')
  .locale('pt-BR')
  .in('ACT')
  .format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-11-16 14:30 BRT', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T17:30:00.000Z'
```

カレンダー日付は2日前に「anteontem」（一昨日）、2日後に「depois de amanhã」（明後日）といった自然な表現を返します。[`DateTime`](/api/date-time/) は経過時間で計算し、未来の表現はブラジルとポルトガルで語法が異なります。

UTC の0時はブラジリア時間の 21:00 にあたるため、UTC サーバー上では [`fromNow()`](/api/calendar-date/#fromnow) の代わりに [`today('America/Sao_Paulo')`](/api/date-fn/#today) を渡してください。

```js
import { date, today } from 'native-dates';

const ref = date('2026-11-16');

date('2026-11-14').from(ref, 'pt-BR'); // 'anteontem'
date('2026-11-18').from(ref, 'pt-BR'); // 'depois de amanhã'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-BR'); // 'em 2 dias'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-PT');
// 'dentro de 2 dias'
ref.from(today('America/Sao_Paulo'), 'pt-BR');
```
