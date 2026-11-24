---
source: "1f74e099bd7a"
title: 中国語
lede: 中国語圏各地域の日付フォーマットや太陰太陽暦（旧暦）に対応します。
---

`'zh-CN'` や `'zh-TW'` のような地域タグを指定してください（設定方法は[ローカライズ](/guides/localization/)を参照）。地域ごとに字体・日付の並び順・時刻表記・週の開始曜日が切り替わります。

## 中国標準時と CST

北京時間には `'Asia/Shanghai'` を指定します。固定の UTC+8 オフセットとは異なり、「中国标准时间」のようなローカライズ済みタイムゾーン名を出力でき、1986〜1991年に実施された中国の夏時間オフセットも保持されます。

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');

release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

[zones プラグイン](/plugins/zones/)を使うと、`CST` はアクティブなロケールに従って中国本土では上海、台湾では台北に解決されます。本土の主要都市も設定なしで解決でき、ウルムチは UTC+6 の新疆時間のまま扱われます。

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-TW' }).zone; // 'Asia/Taipei'
datetime('2026-11-16T09:30:00Z', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', 'Shenzhen').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'
```

## 地域ごとの違い

中国本土・台湾・香港・マカオ・シンガポールでは、既定の時刻表記・短い日付の並び順・曜日の漢字・週の開始曜日が異なります。

| ロケールタグ | 短い日付 | 週の開始曜日 | 既定の時刻表記と曜日の慣習 |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | 月曜日 | 24時間制がデフォルト。簡体字の `周一`〜`周日`（月〜日）を使用。 |
| `zh-TW` | `2026/11/16` | 日曜日 | `上午`・`下午` を付ける12時間制と、繁体字の `週一`（月曜）系曜日表記。 |
| `zh-HK` | `16/11/2026` | 日曜日 | 12時間制と日・月・年順の短い日付（マカオと共通）。 |
| `zh-SG` | `16/11/26` | 日曜日 | 12時間制、簡体字の `周` 曜日表記、2桁年の日・月・年順日付。 |

同じ時点でも、各地域のプリセットに応じて出力が変わります。

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');

meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05'
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05'
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

日曜日は中国本土ではその週の最終日になりますが、台湾・香港・シンガポールでは新しい週の開始日になります。地域をまたいだ週次集計キーをそろえるには、[`startOf()`](/api/calendar-date/#startof) に `'monday'` を渡してください。

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');

sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

簡体字中国語では `'Ah:mm'` が「上午」または「下午」を出力します。深夜の「凌晨」、朝の「早上」、正午の「中午」、夜の「晚上」といった自然な時間帯表現を出すには `dayPeriod: 'short'` を指定してください。

```js
import { time } from 'native-dates';

const night = time('20:30').locale('zh-CN');

night.format('short'); // '20:30'
night.format('Ah:mm'); // '下午8:30'
night.format({
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  dayPeriod: 'short',
}); // '晚上8:30'
```

## トークンパターンと入力の解析

トークンパターンではラテン文字だけがトークンとして解釈されるため、「年」「月」「日」や中国語の句読点を角括弧でエスケープする必要はありません。`'MMMM'` は「十一月」のような漢数字の月名を、`'dd'` は1文字の曜日を出力します。

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');

slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

コアのファクトリは漢字の年・月・日表記やスラッシュ・ドット区切りをそのまま解析でき、プラグインなしで `'long'` プリセットの出力を往復変換できます。香港向けの日・月・年順スラッシュ日付、全角数字、時間帯付きの時刻、文字列中の `CST` を解析するには [loose プラグイン](/plugins/loose/)を読み込んでください。

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
yearMonth('2026年11月').toString(); // '2026-11'
date('16/11/2026', { loose: true, locale: 'zh-HK' })?.toString(); // '2026-11-16'
date('２０２６年１１月１６日', { loose: true })?.toString(); // '2026-11-16'
time('下午5:05', { loose: true, locale: 'zh-TW' })?.toString(); // '17:05:00'
time('晚上9:10', { loose: true, locale: 'zh-CN' })?.toString(); // '21:10:00'
time('凌晨12:00', { loose: true, locale: 'zh-TW' })?.toString(); // '00:00:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
datetime('2026年11月16日 14:30 CST', {
  loose: true,
  locale: 'zh-CN',
  zone: 'UTC',
})?.toString(); // '2026-11-16T06:30:00.000Z'
```

loose モードでは `'zh-CN'`・`'zh-TW'` の両方で、「上午」「下午」に加えて「凌晨」「中午」「晚上」などの時間帯表現も解析できます。

## 中国の旧暦と民国紀元

日付や日時をフォーマットするときに `'zh-CN-u-ca-chinese'` を指定すると、干支年・1月の「正月」・「闰六月」のような閏月を含む旧暦（農暦）で出力されます。

トークンパターンは常にグレゴリオ暦のフィールドを参照します。部分日付は日を持たないため旧暦指定でもグレゴリオ暦にフォールバックしますが、台湾の民国紀元 `'zh-TW-u-ca-roc'` はグレゴリオ暦の月と一致するためそのままフォーマットできます。

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## 相対時間

[`CalendarDate`](/api/calendar-date/) はカレンダー日単位で数えるため、2日前は「前天」、2日後は「后天」を返します。[`DateTime`](/api/date-time/) は経過秒数で計算するため、23時間前が「昨日」と表示されることはありません。

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

UTC サーバー上で引数なしの [`fromNow()`](/api/calendar-date/#fromnow) を呼び出すと、北京時間の 0:00〜8:00 は UTC の前日として扱われます。基準日には [`today('Asia/Shanghai')`](/api/date-fn/#today) を明示的に渡してください。
