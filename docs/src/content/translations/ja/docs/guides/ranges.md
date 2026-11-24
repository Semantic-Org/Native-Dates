---
source: "8e9d9ff9bd0c"
title: 範囲
lede: 重複判定から区間のフォーマットまで、2つの日付・時刻・時点のあいだの範囲を扱います。
---

[範囲](/api/ranges/) は、ホテルの宿泊予約、営業時間、予定された会議など、開始と終了を持つ区間を表します。日付・時刻・日時それぞれに専用の範囲クラスがあるため、カレンダー日付に余計な時刻が付いたり、時刻の範囲に仮の日付が混ざったりしません。

## 範囲の作成

[`dateRange()`](/api/range-fn/)、[`timeRange()`](/api/range-fn/#timerange)、[`datetimeRange()`](/api/range-fn/#datetimerange) で直接作成します。各ファクトリは、開始と終了の2つの値、開始と期間（英語の単位表現も可）、または1つの区間文字列を受け取ります。

```js
import { dateRange, datetimeRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');
const trip = dateRange('2026-09-01', '2026-09-07');
const hours = timeRange('9am - 5pm');
const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
```

すでに日付・時刻・日時のインスタンスを持っている場合は、[`for()`](/api/ranges/#to)、[`to()`](/api/ranges/#to)、[`range()`](/api/ranges/#range) をそのままチェーンできます。

```js
import { today } from 'native-dates';

const upcoming = today().for(2, 'weeks');
const thisMonth = today().range('month');
```

## 閉区間の日付と半開区間の時刻・日時

9月1日から9月7日までといえば7日間すべてを指すため、日付範囲は終了日を含む閉区間です。一方、日時範囲と時刻範囲は連続する枠が重ならないよう、終了境界を含まない半開区間になります。

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-09-01', '2026-09-07').duration.days; // 7

const first = timeRange('9:00am', '10:00am');
const second = timeRange('10:00am', '11:00am');
first.overlaps(second); // false
```

終了時刻が開始時刻より早い時刻範囲は0時をまたぐ範囲として扱われるため、夜勤シフトや深夜営業の店舗もそのまま表現できます。

```js
const nightShift = timeRange('22:00', '06:00');

nightShift.contains('02:30'); // true
nightShift.duration.hours; // 8
```

## 包含と重複の判定

ある値や部分範囲が区間内に収まるかは [`contains()`](/api/ranges/#contains) で判定します。2つの範囲の重なりを調べたり重なる部分を取り出したりするには、[`overlaps()`](/api/ranges/#overlaps) と [`intersection()`](/api/ranges/#intersection) を使います。

```js
import { dateRange } from 'native-dates';

const booking = dateRange('2026-11-10', '2026-11-18');
const holiday = dateRange('2026-11-15', '2026-11-22');

booking.contains('2026-11-14'); // true
booking.overlaps(holiday); // true
booking.intersection(holiday).toString(); // '2026-11-15/2026-11-18'
```

2つの範囲が重ならない場合、`intersection()` は `null` を返します。

## 反復・カウント・分割

[`every()`](/api/ranges/#every) を呼び出すと、範囲内を一定間隔で進みながら各日付・時刻・日時を配列として収集できます。日付範囲では [`count()`](/api/ranges/#count) を使って、日数や、`'weekdays'`・`'weekends'`・`'mondays'` のような英語指定による平日・週末・特定曜日の日数を直接数えられます。

```js
import { dateRange } from 'native-dates';

const sprint = dateRange('2026-05-01', '2 weeks');

sprint.every('week').map(String); // ['2026-05-01', '2026-05-08']
sprint.count(); // 14
sprint.count('weekdays'); // 10
sprint.count('mondays'); // 2
```

個別の値ではなく小さな部分範囲に分割したい場合（シフトを予約枠に区切る、スプリントを週ごとの区間へ分けるなど）は、[`split()`](/api/ranges/#split) を呼び出します。

```js
import { timeRange } from 'native-dates';

const morning = timeRange('9:00am', '12:00pm');
const slots = morning.split(30, 'minutes');

slots.length; // 6
slots[0].toString(); // '09:00:00/09:30:00'
```

## フォーマットとシリアライズ

範囲をプリセットでフォーマットすると、ランタイムのロケール規則に従って共通の月や年が自動的に省略されます。開始と終了の両方を明示的に出力したい場合はトークンパターンを渡します。

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
timeRange('9:00am', '5:00pm').format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

すべての範囲は `.duration` で長さを取得でき、[`toString()`](/api/ranges/#tostring) で ISO 8601 の区間文字列を出力します。その文字列を同じファクトリへ渡せば、元の範囲をそのまま復元できます。

```js
const raw = week.toString(); // '2026-09-01/2026-09-07'
dateRange(raw).equals(week); // true
```
