---
source: "6291509fd7f2"
title: 年月と月日
lede: 日のない年月や、年のない毎年の誕生日をそのままの形で扱います。
---

標準の JavaScript でカードの有効期限を保存しようとすると、仮の「1日」を付け足す必要があります。生まれ年なしの誕生日を扱う場合も、2000年のようなダミーのうるう年を補うしかありません。[`YearMonth`](/api/year-month/) と [`MonthDay`](/api/month-day/) を使えば、実際に存在する要素だけをそのまま保持できます。

## 請求対象月とカードの有効期限

ISO 文字列や年・月の数値には [`yearMonth()`](/api/year-month-fn/) を、`11/28` のようなカードの有効期限には [`monthYear()`](/api/year-month-fn/#monthyear) を使います。

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

[`contains()`](/api/year-month/#contains) で日付がその月に含まれるかを判定し、[`plus()`](/api/year-month/#plus) で月・四半期単位の移動を行い、[`on()`](/api/year-month/#on) でその月の特定の日を取り出せます。

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

日数の少ない月に31日を指定すると、うるう年の2月29日を含め、その月の最終日に自動的にクランプされます。

## 誕生日と毎年の祝日

月・日順の文字列には [`monthDay()`](/api/month-day-fn/)、日・月順の文字列には [`dayMonth()`](/api/month-day-fn/#daymonth) を使います。関数名で順序が明示されるため、`05/10` の解釈が環境によってぶれることはありません。

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

[`next()`](/api/month-day/#next) と [`previous()`](/api/month-day/#previous) を使うと、今日または任意の基準日から見て次回・前回の該当する日付を求められます。

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

2月29日は平年には2月28日として扱われます。特定の日付が該当するかどうかは [`fallsOn()`](/api/month-day/#fallson) で判定できます。

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## 年月・月日と完全な日付の相互変換

任意の日付や日時から `.yearMonth` や `.monthDay` プロパティを取得するか、メソッドチェーンの途中で [`as()`](/api/date-time/#as) を呼び出します。

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

逆方向の変換では、`YearMonth` に日を渡して `on()` を呼び出すか、`MonthDay` に年を渡して [`in()`](/api/month-day/#in) を呼び出すと、完全なカレンダー日付を得られます。

## フォーマットと保存

どちらの型も `.text` や [`format()`](/api/year-month/#format) でフォーマットでき、[`toString()`](/api/year-month/#tostring) で ISO 文字列に変換できます。

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

`'2026-11'` や `'10-17'` といった文字列はデータベースや URL にそのまま保存でき、`yearMonth()` や `monthDay()` で元の型に復元できます。
