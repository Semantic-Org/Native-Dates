---
source: "8bfe5a8d41c8"
title: 日付と時刻の型
lede: カレンダー日付、時刻、特定の時点、部分日付、範囲、期間それぞれに適した型を選びます。
---

JavaScript 標準の `Date` は、誰かの誕生日、午前9時30分のアラーム、注文が確定した正確な1秒といった異なる概念を、すべて1つのオブジェクトで表現します。

Native Dates では概念ごとに専用の型を用意しているため、実際に必要な要素だけを安全に扱えます。

- **[`CalendarDate`](/api/calendar-date/)**：2026年5月10日のようなカレンダー日付
- **[`Time`](/api/time/)**：午前9時30分のような時刻
- **[`DateTime`](/api/date-time/)**：タイムゾーンと結びついた特定の時点を表す日時
- **[`Duration`](/api/duration/)**：2時間や3週間といった期間
- **[`YearMonth`](/api/year-month/)** と **[`MonthDay`](/api/month-day/)**：日のない年月、または年のない毎年の月日
- **[範囲](/api/ranges/)**：2つの日付・時刻・時点の区間

## CalendarDate

誕生日、期限日、祝日、日付ピッカーの選択値など、特定の秒ではなく「その日」を表す場合は [`CalendarDate`](/api/calendar-date/) を使います。

[`today()`](/api/date-fn/#today) または [`date()`](/api/date-fn/) で作成します。

```js
import { date, today } from 'native-dates';

const birthday = date('2026-05-10');
const due = today().plus(2, 'weeks');

birthday.month; // 5
birthday.day; // 10
```

カレンダー日付は時刻もタイムゾーンも持たないため、5月10日はどの地域にいるユーザーにとっても常に5月10日のままです。

## Time

店舗の営業時間や毎日のリマインダーなど、特定の日付に紐づかない時刻には [`Time`](/api/time/) を使います。

```js
import { time } from 'native-dates';

const opens = time('9:00am');
const closes = opens.plus(8, 'hours');

closes.hour; // 17
closes.format('short', 'en-US'); // '5:00 PM'
```

日付の概念がないため、24時を超えて時間を加算しても日付は進まず、0時をまたいで自然に循環します。

## DateTime

会議、フライトの出発、データベースのタイムスタンプなど、時間軸上の実際の時点を表す場合は [`DateTime`](/api/date-time/) を使います。

[`now()`](/api/datetime-fn/#now) や [`datetime()`](/api/datetime-fn/) で直接作成するか、カレンダー日付に時刻を組み合わせて作成します。

```js
import { date, datetime, now } from 'native-dates';

const current = now();
const created = datetime('2026-11-16T17:30:00Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
```

`DateTime` は「いつ起きたか」と「どのタイムゾーンで表示するか」の両方を保持します。[`in()`](/api/date-time/#in) を呼び出せば、同じ時点を別の都市での日時として確認できます。

```js
standup.in('Europe/Berlin').format('time', 'en-US'); // '6:30 PM'
```

## Duration

ある出来事がどれくらい続くかを表すには [`Duration`](/api/duration/) を使います。[`hours()`](/api/duration-fn/#hours) などの単位ヘルパーを使うか、英語の単位表現を [`duration()`](/api/duration-fn/) に渡して作成します。

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
```

2つの値の差分を計測した場合も `Duration` が返ります。

```js
const opens = time('9:00am');
const lunch = time('12:30pm');

opens.until(lunch).format('long', 'en-US'); // '3 hours, 30 minutes'
```

## YearMonth

請求対象月、クレジットカードの有効期限、月入力欄の値など、年と月だけがあって日を持たない値には [`YearMonth`](/guides/months-and-days/#billing-months-and-card-expiries) を使います。

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.on(15); // 2026-11-15 の CalendarDate
```

月単位・年単位で加減算でき、[`on()`](/api/year-month/#on) でその月の特定の日を指定すれば `CalendarDate` を得られます。

## MonthDay

誕生日や毎年の祝日など、年を持たず毎年繰り返す日付には [`MonthDay`](/guides/months-and-days/#birthdays-and-annual-holidays) を使います。

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');

birthday.in(2026); // 2026-10-17 の CalendarDate
birthday.fallsOn('2026-10-17'); // true
```

[`fallsOn()`](/api/month-day/#fallson) や [`in()`](/api/month-day/#in) を呼び出すと、2月29日は平年には自動的に2月28日として扱われます。

## 範囲

2つの日付・時刻・時点の区間を扱うには [範囲](/guides/ranges/) を使います。[`dateRange()`](/api/range-fn/#daterange)、[`timeRange()`](/api/range-fn/#timerange)、[`datetimeRange()`](/api/range-fn/#datetimerange) で直接作成できます。

```js
import { dateRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');

sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8
```

日付範囲は終了日を含む閉区間です。一方、日時範囲と時刻範囲は連続する枠が重複しないよう、終了境界を含まない半開区間になります。

## 型どうしの変換

各型は要素を追加・削除するだけで直接行き来できます。カレンダー日付に [`at()`](/api/calendar-date/#at) で時刻を付ければ `DateTime` になり、既存の値から [`for()`](/api/ranges/#to) や [`to()`](/api/ranges/#to) をチェーンすれば範囲を作成できます。

```js
const reminder = today().plus(1, 'day').at('9:00am');
const upcoming = today().for(2, 'weeks');
```

逆方向の変換では、日時や日付から各要素のプロパティを直接取得するか、メソッドチェーンの途中で [`as()`](/api/date-time/#as) を呼び出します。

```js
reminder.date; // 明日の CalendarDate
reminder.time; // 09:00:00 の Time
reminder.yearMonth; // YearMonth
reminder.monthDay; // MonthDay
reminder.in('Asia/Tokyo').as('time'); // 東京での Time
```

:::tip[DateTime と CalendarDate の使い分け]
タイムゾーンが変わったときにユーザーへの表示も変わるべきかで判断してください。ロサンゼルスで午前9時30分の会議はベルリンでは午後6時30分になるため `DateTime` が適しています。一方、5月10日の誕生日は世界中どこでも5月10日のままなので `CalendarDate` を使います。
:::
