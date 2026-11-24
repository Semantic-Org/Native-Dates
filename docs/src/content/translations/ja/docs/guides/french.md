---
source: "a214ff99444f"
title: フランス語
lede: 地域ごとの時刻表記や週の開始曜日を踏まえて、フランス語の日付をフォーマット・解析します。
---

単独の `'fr'` はフランス本土の慣習に従います。地域ごとの日付順・時刻区切り・週の開始曜日を反映させたい場合は、`'fr-CA'` のような地域タグを指定してください（設定方法は[ローカライズ](/guides/localization/)を参照）。

## 地域ごとのバリエーション

フランス語圏では、短い日付の並び順・時刻の区切り記号・週の開始曜日が地域によって異なります。

| ロケール | 短い形式 | 週の開始曜日 | 地域差 |
|---|---|---|---|
| `fr-FR`、`fr-SN`、`fr-MA` | `'01/11/2026 14:30'` | `1`（月曜日） | スラッシュ区切り、24時間制、7月の省略形は `'juil.'`。 |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7`（日曜日） | カナダは ISO 順の日付、スペース付きの `'h'` 時刻表記、7月は `'juill.'`。 |
| `fr-CH` | `'01.11.26 14:30'` | `1`（月曜日） | ドット区切りで `'short'` は2桁年、`'L'` は4桁年。 |
| `fr-BE` | `'1/11/26 14:30'` | `1`（月曜日） | ゼロ埋めなしの日と2桁年の `'short'`、`'L'` は4桁年。 |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6`（土曜日） | 土曜始まり、既定は12時間制。 |

地域の区切り記号を正しく出力するには、完全な地域タグを渡してください。

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');

rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

カナダのフランス語では週が日曜始まりになり、[`startOf('week')`](/api/calendar-date/#startof) と [`weekdayNames()`](/api/month-names/#weekdaynames) も自動でその規則に従います。データベース集計で ISO 週が必要な場合は月曜始まりを明示してください。

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');

mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## フランス語の表記慣習とフォーマットトークン

`'HH[h]mm'` のように、トークンパターン内にリテラルのラテン文字を含めるときは角括弧で囲んでください。括弧なしで `'HHhmm'` と書くと [`unknownFormat`](/api/errors/#units-zones-and-formats) がスローされますが、アクセント付きの「à」は単独でエスケープせずにそのまま通ります。

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');

depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM à HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

フランス語では月の1日だけを「1er」と書き、2日以降は通常の数字を使います。`'fr'` に対して [`ordinals`](/api/configure/) ルールを登録すると、地域タグにも自動で継承されます。

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'

configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

フランス語の文章中では曜日名・月名ともに小文字のまま書きます。見出しの先頭に日付を置く場合だけ先頭の1文字を大文字にしてください。

`MMM` の後ろにピリオドを手動で足さないでください。省略月名にはすでにピリオドが含まれており、「mars」「mai」「juin」「août」のような短い月名にはピリオドが付きません。

```js
import { monthNames } from 'native-dates';

const s = date('2026-11-01').format('full', 'fr'); // 'dimanche 1 novembre 2026'
s[0].toUpperCase() + s.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## フランス語の日付・時刻入力の解析

コアだけでカナダ式の ISO 文字列や `'14h30'` のようなフランス語の時分表記を直接解析できます。[loose プラグイン](/plugins/loose/)を読み込むと、フランス語ロケールでは日・月・年順のスラッシュ日付、ドット区切り日付、序数、月名を含む自然な日付表現も自動で解析できます。

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

time('14h30').toString(); // '14:30:00'
time('14 h 30').toString(); // '14:30:00'
date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('14.07.2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-14'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
datetime('lundi 16 novembre 2026 à 14h30', {
  loose: true,
  locale: 'fr',
  zone: 'Europe/Paris',
})?.hour; // 14
```

短縮月名は1つの月に一意に定まる必要があります。「juil」は7月として解析されますが、「jui」は「juin」（6月）と「juillet」（7月）の両方に一致するため `null` を返します。

loose モードでは部分日付でもフランス語の月名とアクセント付き省略形を解析できます。[`dayMonth()`](/api/month-day-fn/#daymonth) と [`duration()`](/api/duration-fn/) はプラグインなしでコアから動作します。

```js
import { dayMonth, duration, monthDay, yearMonth } from 'native-dates';

dayMonth('14/07').toString(); // '07-14'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
yearMonth('févr. 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
duration('2h 30m').toString(); // 'PT2H30M'
```

## タイムゾーン

北米は春に欧州より2〜3週間早く夏時間へ入り、秋は1週間遅く終わるため、その期間はパリとモントリオールの時差が6時間から5時間に縮まります。

モロッコもラマダン期間中は UTC+0 に戻るため、固定時間を加減算するのではなく [`in()`](/api/date-time/#in) で時点を変換してください。

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');

hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

[zones プラグイン](/plugins/zones/)を使うと、フランス語圏の主要都市やカナダのタイムゾーン略称を別名登録なしで直接解決できます。

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Bruxelles').zone; // 'Europe/Brussels'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Toronto'
```

## 相対日付とノーブレークスペース

カレンダー日付では2日前に「avant-hier」、2日後に「après-demain」を返します。一方 [`DateTime`](/api/date-time/) は正確な単位で経過時間を数えるため、深夜の数時間差が「昨日」と表示されることはありません。

テストのアサーションでは、「aujourd’hui」（今日）に含まれるカーリーアポストロフィ（`’`）や、短い期間フォーマット内の狭いノーブレークスペース・通常のノーブレークスペースに注意してください。

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');

ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
datetime('2026-11-09T14:00Z').from('2026-11-10T14:00Z', 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
```
