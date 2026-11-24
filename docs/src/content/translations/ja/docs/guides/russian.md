---
source: "621cb0fa9e99"
title: ロシア語
lede: ロシア語の月名の格変化や3種類の複数形、ドット区切り日付と各地域のタイムゾーンに対応します。
---

ロシア語でフォーマットするには `'ru'` を指定します（設定方法は[ローカライズ](/guides/localization/)を参照）。ロケールファイルを追加しなくても、組み込みの `Intl` データが月名の格変化と3種類の期間複数形を自動で処理します。

## 月名の格変化と年記号「г.」

プリセットは日の数字と並ぶ月名を生格で出力し、単独の年月表記では主格を保ちつつ、末尾に年を示す「г.」を付与します。

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');

release.format('long'); // '16 ноября 2026 г.'
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru'); // 'ноябрь 2026 г.'
```

コンパクトな UI ラベル向けに、カスタムのトークンパターンでは「г.」を省略します。日トークンの直後に置かれた `MMMM` と `MMM` は、主格の「май」（5月）から生格の「мая」へ自動で切り替わります。

```js
const may = date('2026-05-06').locale('ru');

may.format('MMMM YYYY'); // 'май 2026'
may.format('D MMMM YYYY'); // '6 мая 2026'
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.'
```

日と月の間に `-го` のようなリテラルの格語尾を挟んだ場合も、角括弧の有無にかかわらず `MMMM` は生格のまま出力されます。

```js
may.format('D-го MMMM'); // '6-го мая'
```

## 曜日・小文字表記・日の表記

ロシア語では月名も曜日名も小文字で表記し、週は月曜始まり（`weekStart === 1`）です。

ロシア語の曜日は1文字の頭文字が複数の曜日で重複するため、`narrow`・`short` ともに月曜から日曜まで2文字の「пн」〜「вс」を返します。

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
date('2026-11-16').format('dddd, D MMMM', 'ru'); // 'понедельник, 16 ноября'
```

ロシア語の日付は日の数字の後ろにピリオドを付けないため、`Do` はそのまま数字を出力します。序数表記や先頭大文字の曜日名を使いたい場合は [`configure()`](/api/configure/) でカスタマイズしてください。

```js
import { configure, date } from 'native-dates';

configure({
  weekdayNames: { ru: { short: { mon: 'Пн', fri: 'Пт' } } },
  ordinals: { ru: (day) => `${day}-е` },
});

date('2026-11-16').format('ddd, Do MMMM', 'ru'); // 'Пн, 16-е ноября'
```

## 期間の複数形と相対日付

ロシア語では数量に応じて、1・21 などの単数形、2〜4 の少数形、5〜20 の複数形の3種類を使い分けます。[`Duration`](/api/duration/) をフォーマットすると適切な語形が自動で選択されます。

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день'
days(2).format('long', 'ru'); // '2 дня'
days(5).format('long', 'ru'); // '5 дней'
days(21).format('long', 'ru'); // '21 день'
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута'
```

[`DateTime`](/api/date-time/) の [`from()`](/api/date-time/#from) は経過時間や経過分をそのまま数えるため、日付が変わる22時間前でも数値表現のまま保たれます。

[`CalendarDate`](/api/calendar-date/) ではカレンダー日を比較し、2日前の「позавчера」（一昨日）から2日後の「послезавтра」（明後日）まで自然なロシア語を返します。

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ru');
day.minus(2, 'days').from(day); // 'позавчера'
day.minus(1, 'day').from(day); // 'вчера'
day.plus(2, 'days').from(day); // 'послезавтра'

const moment = datetime('2026-11-16T12:00:00Z', 'Europe/Moscow').locale('ru');
moment.minus(1, 'minute').from(moment); // '1 минуту назад'
moment.plus(2, 'days').from(moment); // 'через 2 дня'
```

## ドット区切り日付とロシア語月名の解析

コアは年・月・日順の `'2026.11.16'` をそのまま受け付けます。[loose プラグイン](/plugins/loose/)を読み込むと、ロシア語ロケールでは日・月・年順のドット区切り日付、格変化した月名、年記号「г.」を自動で解析できます。

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('16.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
date('06.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-06'
date('16 ноября 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
datetime('16.11.2026, 14:30', {
  zone: 'Europe/Moscow',
  locale: 'ru',
  loose: true,
})?.hour; // 14
```

ドット区切りの日・月ペアや月・年ペアはコアで直接解析できます。loose モードでは部分日付でも主格・生格どちらのロシア語月名にも対応します。

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' })?.toString(); // '11-16'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
```

## ロシアおよび周辺国のタイムゾーン

ロシアは夏時間なしで11のタイムゾーンにまたがり、カザフスタンは2024年に全土を UTC+5 へ統一しました。完全な IANA 識別子を使えば、すべてのタイムゾーンで過去のオフセット変更履歴が保持されます。

[zones プラグイン](/plugins/zones/)を読み込むと、IANA の都市名、ロシア・カザフスタンの主要拠点、モスクワ時間の略称を別名登録なしで直接解決できます。

| 入力 | 既定の対応状況 | 解決方法 |
|---|---|---|
| `'Europe/Moscow'`、`'Asia/Almaty'` | コアで対応 | 完全な IANA 識別子がそのまま動作し、過去のオフセット規則も保持します。 |
| `'Moscow'`、`'Yekaterinburg'`、`'Minsk'` | プラグインで対応 | `zones` プラグインにより IANA 識別子内の都市名を大文字・小文字を問わず解決します。 |
| `'MSK'`、`'мск'`、`'SPB'`、`'Kazan'`、`'Astana'` | プラグインで対応 | 組み込みの地域略称・別表記・キリル文字表記をそのまま解決します。 |

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T12:00:00Z', 'MSK').format('HH:mm', 'ru'); // '15:00'
datetime('2026-11-16T12:00:00Z', 'мск').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'SPB').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'Astana').offset; // '+05:00'
datetime('16 ноября 2026 14:30 мск', {
  loose: true,
  locale: 'ru',
  zone: 'UTC',
})?.toString(); // '2026-11-16T11:30:00.000Z'
```
