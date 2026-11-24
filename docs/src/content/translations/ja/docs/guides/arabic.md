---
source: "f8fde894143d"
title: アラビア語
lede: アラビア語圏の地域別カレンダーや、東部アラビア数字と西洋数字を切り替えて日付をフォーマットします。
---

単独の `'ar'` ではなく、`'ar-EG'` や `'ar-SA'` のように国別タグを指定してください（設定方法は[ローカライズ](/guides/localization/)を参照）。アラビア語圏では、使用する数字体系・グレゴリオ暦の月名・週の開始曜日が国ごとに異なります。

## 東部アラビア数字と西洋数字

アラブ首長国連邦・マグレブ諸国・単独の `'ar'` は西洋数字（`0-9`）を出力し、エジプト・サウジアラビア・レバント地域・イラクは東部アラビア数字（アラビア・インド数字、`٠-٩`）を出力します。

すべてのユーザーに対して数字表記を統一したい場合は、`-u-nu-latn` または `-u-nu-arab` を末尾に追加します。

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');

invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦'
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦'
```

トークンパターンは月名や曜日名をローカライズしつつ、数字は常に ASCII 数字で出力します。数値プリセットはスラッシュの前に右から左への制御文字 `\u200F` を挿入するため、テストのアサーション・CSV・URL には `'YYYY-MM-DD'` を使うのが安全です。

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA'); // 'الاثنين، 16 نوفمبر 2026'
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦'
```

## ヒジュラ暦と地域別の月名

最新のエンジンでは `'ar-SA'` のデフォルト暦がグレゴリオ暦になっています。サウジアラビア公式のウンム・アルクラー暦（ヒジュラ暦）でフォーマットしたい場合は、プリセットと組み合わせて `'-u-ca-islamic-umalqura'` を指定します（例：ヒジュラ暦1447年シャウワール月1日）。

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');

eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦'
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura'); // '20 مارس 2026'
```

太陽暦の1か月はヒジュラ暦の2つの月にまたがるため、トークンパターンと部分日付は常にグレゴリオ暦のままになります。ヒジュラ暦でフォーマットするには、先に [`on()`](/api/year-month/#on) で具体的な日付を確定させてください。

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');

march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦'
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١٢ رمضان ١٤٤٧ هـ'
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

グレゴリオ暦の月名と12時間制・24時間制の使い分けは、大きく4つの地域グループに分かれます。

| 地域 | 主なタグ | 出力の特徴 |
|---|---|---|
| エジプト・湾岸諸国・スーダン | `ar-EG, ar-SA` | 「يناير」「يوليو」「نوفمبر」などのエジプト・湾岸系月名と、午前・午後に「ص」「م」を使う12時間制。 |
| レバント地域・イラク | `ar-LB, ar-IQ` | 「كانون الثاني」「تموز」「تشرين الثاني」などのレバント系月名と12時間制。 |
| モロッコ | `ar-MA` | 「ماي」「يوليوز」「غشت」「شتنبر」「نونبر」「دجنبر」などのモロッコ系月名と24時間制。 |
| アルジェリア・チュニジア | `ar-DZ, ar-TN` | 「جانفي」「فيفري」「جوان」「جويلية」「أوت」などのマグレブ系月名と12時間制。 |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');

july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30'
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م'
```

## 週の開始曜日と週末

週の始まりは、エジプト・ヨルダン・カタール・アルジェリアでは土曜日、サウジアラビア・イエメンでは日曜日、アラブ首長国連邦・モロッコ・チュニジア・レバノンでは月曜日です。

`weekStart`、週の境界、曜日ヘッダーは各ロケールタグに自動で追従します。複数国をまたいだ集計では `'monday'` を明示的に渡してください。

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15'
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16'
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س'
```

[`isWeekend()`](/api/calendar-date/#calendar-predicates) と [`isWeekday()`](/api/calendar-date/#calendar-predicates) もアクティブなロケールに従います。金曜日と土曜日を週末とするサウジアラビアやエジプトでは、金曜日が週末、日曜日が平日として判定されます。

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');

fri.isWeekend(); // true
sun.isWeekend(); // false
sun.isWeekday(); // true
```

## 6種類の複数形と RTL テキスト

アラビア語には 0・1・2（双数形の「يومان」など）・3〜10・11〜99・100以上の6種類の複数形があります。[`Duration`](/api/duration/) と [`from()`](/api/date-time/#from) はそれぞれ適切な語形を自動で選択し、カレンダー日付では2日後に対して「بعد الغد」（明後日）も返します。

```js
import { datetime, days } from 'native-dates';

days(1).format('long', 'ar-EG'); // 'يوم'
days(2).format('long', 'ar-EG'); // 'يومان'
days(5).format('long', 'ar-EG'); // '٥ أيام'
days(15).format('long', 'ar-EG'); // '١٥ يومًا'
days(100).format('long', 'ar-EG'); // '١٠٠ يوم'

const anchor = datetime('2026-11-16T09:00', 'Asia/Riyadh');
anchor.plus(2, 'days').from(anchor, 'ar-SA'); // 'خلال يومين'
anchor.date.plus(2, 'days').from(anchor.date, 'ar-SA'); // 'بعد الغد'
```

右から左（RTL）の段落内で ISO 日付や UTC オフセットを表示すると、ブラウザが符号の順序を反転させることがあります。技術的なタイムスタンプは `<bdi>` で囲んで保護してください。

```html
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## 入力の解析とタイムゾーン

[loose プラグイン](/plugins/loose/)を読み込むと、アラビア語ロケールでは日・月・年順のスラッシュ日付、制御文字付きの東部アラビア数字、「ص」「م」の12時間制時刻、さらに標準月名と複数語からなるレバント系月名の両方を自動で解析できます。

```js
import '@native-dates/plugins/loose';
import { date, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-06'
date('١٦‏/١١‏/٢٠٢٦', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-16'
date('16 تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true, locale: 'ar-EG' })?.toString(); // '14:30:00'
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11'
```

[zones プラグイン](/plugins/zones/)は、湾岸諸国や北アフリカの主要都市と `GST` のような地域略称をそのまま解決します。`'ar-SA'` を指定すると、`AST` はリヤド（`Asia/Riyadh`）に解決されます。

```js
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:00', 'Makkah').zone; // 'Asia/Riyadh'
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
datetime('2026-11-16T09:00', { zone: 'AST', locale: 'ar-SA' }).zone; // 'Asia/Riyadh'
```

スケジュール計算には固定オフセットではなく完全な IANA タイムゾーンを使ってください。`'Africa/Casablanca'` はラマダン期間中に1時間戻り、カイロ（`'Africa/Cairo'`）は夏時間開始日に 00:00 から 01:00 へ飛びます。

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00'
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
