---
source: "ec38498f1427"
title: 日付の計算
lede: 元の値を変更せずに、期間の加減算、カレンダー境界への移動、曜日や範囲に沿ったステップ処理を行います。
---

Native Dates の日付・時刻・日時はすべてイミュータブルです。値をずらしたり丸めたりするメソッドは常に新しいインスタンスを返し、元の値は変更しません。

## 加算と減算

時間を前後に進めるには [`plus()`](/api/date-time/#plus) と [`minus()`](/api/date-time/#minus) を呼び出します。

```js
import { date } from 'native-dates';

const created = date('2026-11-16');
const due = created.plus(2, 'weeks');

created.toString(); // '2026-11-16'
due.toString(); // '2026-11-30'
```

どちらのメソッドも、数値と英語の単位名、英語の単位表現、フィールドオブジェクト、[`Duration`](/api/duration/) インスタンスを受け取ります。エイリアスとして [`add()`](/api/date-time/#plus) と [`subtract()`](/api/date-time/#minus) も利用できます。

```js
import { datetime, hours } from 'native-dates';

const kickoff = datetime('2026-11-16T09:00', 'America/New_York');

kickoff.plus(2, 'weeks');
kickoff.plus('1h 30m');
kickoff.plus({ days: 2, hours: 4 });
kickoff.minus(hours(3));
```

:::tip[型に合った単位を指定する]
カレンダー日付は時刻を持たないため、時間などの時刻単位は指定できません。時刻は0時で循環するため、日などの暦単位は指定できません。両方をまたぐ計算を行うときは、先に [`at()`](/api/calendar-date/#at) で組み合わせてから計算してください。
:::

## 月末と夏時間

月や年を加算したときに日付が対象月の日数を超えると、翌月に繰り上がるのではなく、対象月の最終日にクランプされます。たとえば1月31日に1か月を加算すると、平年なら2月28日、うるう年なら2月29日になります。

```js
import { date } from 'native-dates';

date('2026-01-31').plus(1, 'month').toString(); // '2026-02-28'
date('2028-01-31').plus(1, 'month').toString(); // '2028-02-29'
```

[`DateTime`](/api/date-time/) では、夏時間（DST）の切り替わりをまたいでも、暦単位の加算はローカル時刻を維持します。一方、時間や分などの時刻単位は実際の経過時間をそのまま加算します。

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
```

夏時間の開始・終了時の挙動については [タイムゾーン](/guides/time-zones/) で詳しく解説しています。

## 単位の開始・終了への移動

[`startOf()`](/api/date-time/#startof) と [`endOf()`](/api/date-time/#endof) を呼び出すと、年・四半期・月・週・日・時刻単位の開始または終了へ移動できます。

カレンダー日付での月末はその月の最終日になり、日時での単位の終了はその単位の最終ミリ秒になります。

```js
import { date, datetime } from 'native-dates';

const midMonth = date('2026-11-18');
midMonth.startOf('month').toString(); // '2026-11-01'
midMonth.endOf('month').toString(); // '2026-11-30'

const stamp = datetime('2026-11-18T14:20', 'UTC');
stamp.endOf('day').toString(); // '2026-11-18T23:59:59.999Z'
```

週の開始曜日は現在のロケールに従います（`'en-US'` では日曜、`'de-DE'` では月曜など）。第2引数に英語の曜日名を渡せばその呼び出しだけ上書きでき、[`configure()`](/api/configure/) を使えばアプリ全体に適用できます。

```js
const wednesday = date('2026-11-18');

wednesday.locale('en-US').startOf('week').toString(); // '2026-11-15'
wednesday.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wednesday.startOf('week', 'monday').toString(); // '2026-11-16'
```

[`startOfNext()`](/api/date-time/#startofnext) や [`startOfPrevious()`](/api/date-time/#startofprevious) を呼び出すと、次または前の単位の開始地点へ移動します。どちらも必ず隣接する単位へ進むため、12月1日に `startOfNext('month')` を呼び出すと1月1日が返ります。

```js
const invoiced = date('2026-11-16');

invoiced.startOfNext('month').toString(); // '2026-12-01'
invoiced.startOfNext('quarter').toString(); // '2027-01-01'
invoiced.startOfPrevious('month').toString(); // '2026-10-01'
```

## 時刻の丸め

日時や時刻に対して [`round()`](/api/date-time/#round) を呼び出すと、最も近い単位や指定した刻み幅へ丸められます。切り下げ・切り上げには `floor()` や `ceil()` を使います。

```js
import { time } from 'native-dates';

const logged = time('9:23am');

logged.round('hour').format('short', 'en-US'); // '9:00 AM'
logged.round(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
logged.floor(15, 'minutes').format('short', 'en-US'); // '9:15 AM'
logged.ceil(15, 'minutes').format('short', 'en-US'); // '9:30 AM'
```

5分・10分・15分・30分といった刻み幅は、1つ上の単位を割り切れる値である必要があります。

## 曜日や毎年の記念日への移動

日付や日時に対して [`next()`](/api/calendar-date/#next) や [`previous()`](/api/calendar-date/#previous) に英語の曜日名を渡すと、直近の未来または過去の該当曜日へ移動します。すでにその曜日の場合は7日先（または7日前）へ移動します。

```js
import { date } from 'native-dates';

const monday = date('2026-11-16');

monday.next('friday').toString(); // '2026-11-20'
monday.next('monday').toString(); // '2026-11-23'
monday.previous('friday').toString(); // '2026-11-13'
```

[`MonthDay`](/api/month-day/) を渡せば、誕生日や毎年の祝日の次回・前回の発生日へ直接移動できます。

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');
monday.next(birthday).toString(); // '2027-10-17'
```

日時に対する `next()` は元の時刻を維持します。その日の開始時刻（0時）へ移動したい場合は、`startOfNext()` に英語の曜日名を渡してください。

```js
import { datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/New_York');

standup.next('wednesday').text; // 'Nov 18, 2026, 9:30 AM EST'
standup.startOfNext('wednesday').text; // 'Nov 18, 2026, 12:00 AM EST'
```

## 範囲の作成と反復

[`dateRange()`](/api/range-fn/#daterange) で [範囲](/guides/ranges/) を作成するか、既存の値から [`for()`](/api/ranges/#to) や [`to()`](/api/ranges/#to) をチェーンします。作成した範囲は一定間隔で反復したり、より小さな部分範囲に分割したりできます。

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2 weeks');

sprint.end.toString(); // '2026-11-15'
sprint.every('week').map(String); // ['2026-11-02', '2026-11-09']
sprint.split(1, 'week').length; // 2
```
