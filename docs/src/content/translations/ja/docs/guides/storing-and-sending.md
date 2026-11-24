---
source: "2eb400c31ff1"
title: 保存と送信
lede: JSON API、データベース、HTML 入力要素の間で、日付・時刻・期間・範囲を正確にシリアライズします。
---

すべての型は、文字列化または `JSON.stringify()` に渡すと標準の ISO 8601 文字列にシリアライズされます。受信側では、その文字列を対応するファクトリに渡すだけで元の型へ復元できます。

## JSON と通信フォーマット

カスタムの replacer やラッパーオブジェクトを用意せずに、値をそのまま `JSON.stringify()` に渡せます。

```js
import { date, duration, time } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');

JSON.stringify({
  startsAt: standup,
  dueOn: date('2026-11-16'),
  opensAt: time('9:30am'),
  length: duration('1h 30m'),
});
// '{"startsAt":"2026-11-16T17:30:00.000Z","dueOn":"2026-11-16","opensAt":"09:30:00","length":"PT1H30M"}'
```

| 型 | 出力文字列 | 主な用途 |
|---|---|---|
| [`DateTime`](/api/date-time/) | `'2026-11-16T17:30:00.000Z'` | 監査ログのタイムスタンプ、フライト出発日時、会議の開始時点 |
| [`CalendarDate`](/api/calendar-date/) | `'2026-11-16'` | 期限日、祝日、宿泊日 |
| [`Time`](/api/time/) | `'09:30:00'` | 店舗の営業時間、毎日のリマインダー時刻 |
| [`Duration`](/api/duration/) | `'PT1H30M'` | タイムアウト、SLA、課金期間、タイマー |
| [`YearMonth`](/api/year-month/) | `'2026-11'` | 請求対象月、カードの有効期限、月入力値 |
| [`MonthDay`](/api/month-day/) | `'10-17'` | 生まれ年なしの誕生日、毎年の祝日 |
| [範囲](/api/ranges/) | `'2026-11-01/2026-11-07'` | 予約期間、スプリント、ISO 8601 のスラッシュ区切り区間 |

外部 API、キャッシュキー、整数カラムなどで数値が必要な場合は、1970年からの経過値を目的の単位で取得します。システムによって秒単位・ミリ秒単位が異なるため、各プロパティ名に単位が明記されています。

```js
standup.toString(); // '2026-11-16T17:30:00.000Z'
standup.epochSeconds; // 1794850200
standup.epochMilliseconds; // 1794850200000
duration('1h 30m').toMilliseconds(); // 5400000
```

## 文字列からの復元

JSON レスポンス、データベースの行、URL パラメータから読み込んだ文字列は、それぞれ対応するファクトリへそのまま渡します。

```js
import { date, dateRange, datetime, duration, time, yearMonth } from 'native-dates';

const startsAt = datetime('2026-11-16T17:30:00.000Z', 'America/Los_Angeles');
const dueOn = date('2026-11-16');
const opensAt = time('09:30:00');
const length = duration('PT1H30M');
const billing = yearMonth('2026-11');
const window = dateRange('2026-11-01/2026-11-07');
```

`DateTime` は常に UTC でシリアライズされるため、異なる地域のクライアントが同じ出来事を記録しても同一の文字列になります。復元時にタイムゾーンを渡せば、出来事の時点をずらさずにローカル表示へ切り替えられます。

## 未来の予定と定期イベント

注文履歴やサーバーログのような過去の出来事であれば、UTC タイムスタンプだけで十分です。一方、人がスケジュールした未来の予定には、タイムスタンプとあわせて IANA の `zone` も保存してください。

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const row = {
  startsAt: standup.toString(),
  zone: standup.zone, // 'America/Los_Angeles'
};

const nextWeek = datetime(row.startsAt, row.zone).plus(1, 'week');
nextWeek.hour; // 9
```

タイムゾーンを保存しておけば、夏時間の切り替わりをまたいで週や月を加算しても、ローカルの午前9時30分が維持されます。将来その地域の標準時や夏時間ルールが法改正で変わった場合にも追従できます。

:::tip[オフセットではなく IANA タイムゾーン名を保存する]
`'-08:00'` のような固定オフセットはロサンゼルスの冬時間しか表しません。将来の暦計算で現地の夏時間切り替わりを正しく反映するには、`zone` を保存してください。
:::

## データベースのカラム型

扱う値に合わせて SQL のカラム型を選ぶと、アプリケーションコードと同じ境界条件をデータベース側でも維持できます。

| 型 | SQL カラム型 | 適している理由 |
|---|---|---|
| `DateTime` | `timestamptz` または `bigint` | あいまいさなく正確な UTC の瞬間を保存できます。 |
| `CalendarDate` | `date` | 0時のタイムゾーンずれを起こさず `YYYY-MM-DD` を保存できます。 |
| `Time` | `time` | 仮の日付を補わず `HH:MM:SS` を保存できます。 |
| `Duration` | `interval` または `text` | 構造化された区間または ISO 8601 の `PT` 文字列を保存できます。 |

実際の時点を保存する用途では、タイムゾーン情報を持たない `timestamp` カラムは避けてください。データベースドライバがサーバーのローカルタイムゾーンで再解釈してしまうことがあります。

## HTML 入力要素と URL

HTML 標準の date・month・time 入力要素は、コアの型が出力する ISO 文字列をそのまま読み書きできます。URL のクエリパラメータでも同じ簡潔な形式が使えます。

```js
import { date, time, yearMonth } from 'native-dates';

// <input type="date" value="2026-11-16">
const due = date('2026-11-16');
due.toString(); // '2026-11-16'

// <input type="month" value="2026-11">
const billing = yearMonth('2026-11');
billing.toString(); // '2026-11'

// <input type="time" value="09:30">
const opens = time('09:30');
opens.toString().slice(0, 5); // '09:30'

const params = new URLSearchParams({ from: due.toString() });
params.toString(); // 'from=2026-11-16'
```

日付入力の値を [`date()`](/api/date-fn/) で読み込めば、UTC より西のタイムゾーンで `new Date('2026-11-16')` が1日前にずれる定番のバグも防げます。
