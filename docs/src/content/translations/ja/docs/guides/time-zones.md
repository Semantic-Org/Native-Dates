---
source: "21708b5b4a6f"
title: タイムゾーン
lede: 任意の IANA タイムゾーンで日時を表示し、夏時間の切り替わりも正確に処理します。
---

[`DateTime`](/api/date-time/) は「いつ起きたか（時点）」と「どのタイムゾーンで見るか」の2つを組み合わせて保持します。タイムゾーンを切り替えても同じ時点に対する見え方が変わるだけで、UTC オフセットや夏時間（DST）の切り替わりはすべてランタイムが自動処理します。

## 時点とタイムゾーンの組み合わせ

日時を作成するときは、`'America/New_York'` のような IANA タイムゾーン名、`'UTC'`、または固定オフセットを渡します。

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const eastCoast = datetime('2026-11-16T12:30', 'America/New_York');
const audit = datetime('2026-11-16T17:30:00Z', 'UTC');

standup.zone; // 'America/Los_Angeles'
standup.offset; // '-08:00'
```

タイムゾーンを省略した場合は設定済みのデフォルト値が使われ、未設定ならランタイムのローカルタイムゾーンにフォールバックします。

アプリ全体のデフォルトは、起動時に [`configure()`](/api/configure/) で一度だけ設定します。

```js
import { configure, now } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
now().zone; // 'Europe/Berlin'
```

## 別のタイムゾーンでの表示

[`in()`](/api/date-time/#in) を呼び出すと、同じ時点を別の都市のタイムゾーンで表示できます。ローカルの日付・時刻プロパティは指定したタイムゾーンに合わせて更新されますが、内部のタイムスタンプは同一のままです。

```js
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');
const tokyo = standup.in('Asia/Tokyo');

berlin.format('time', 'en-US'); // '6:30 PM'
tokyo.day; // 17
berlin.equals(standup); // true
```

## オフセットとタイムゾーンの違い

データベースや API から返る文字列は、末尾に `Z` や数値オフセットが付いていることがよくあります。この末尾表記は「その時点がいつ起きたか」を確定させ、作成される `DateTime` 自体は指定したタイムゾーンで表示されます。

```js
import { datetime } from 'native-dates';

const created = datetime('2026-03-07T14:00:00Z', 'America/New_York');
const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');

created.zone; // 'America/New_York'
created.hour; // 9
berlin.hour; // 15
```

夏時間の切り替わりをまたいで日や月を加算する場合、正確な IANA タイムゾーンを保持していることが重要になります。

固定の UTC オフセットは季節が変わっても変化しませんが、IANA タイムゾーンはその地域の切り替わり規則をすべて把握しています。

:::note[UTC での処理]
プロパティの読み取りや暦計算を UTC 基準で行いたい場合は、タイムゾーンに `'UTC'` を渡します。なお、[`toString()`](/api/date-time/#tostring) などのシリアライズメソッドは表示用タイムゾーンにかかわらず常に UTC 文字列を出力します。詳しくは [保存と送信](/guides/storing-and-sending/) を参照してください。
:::

## 夏時間の切り替わり

夏時間の切り替わりをまたぐと、暦単位と時刻単位で結果が異なります。2026年3月8日、ニューヨークでは午前2時が午前3時に進み、その日曜日は23時間しかありません。

1日を加算するとローカルの午前9時が維持されますが、24時間を加算すると実際の経過時間24時間ぶん進みます。

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
saturday.plus(1, 'day').hoursInDay; // 23
```

:::warning[夏時間開始時に存在しない時刻]
時計が午前2時から午前3時に進むとき、午前2時30分のようなローカル時刻はそのタイムゾーンに存在しません。欠落したローカル時刻を指定してもエラーにはならず、飛んだ時間ぶんだけ前へ進みます。
:::

```js
const skipped = datetime('2026-03-08T02:30', 'America/New_York');
skipped.text; // 'Mar 8, 2026, 3:30 AM EDT'
```

:::details[夏時間の欠落時刻と重複時刻の制御]
予約処理や監査ログなどで重複・欠落時刻の解決（あいまいさの解消）ルールを変えたい場合は、[`datetime()`](/api/datetime-fn/) や `at()` に `disambiguation` を渡します。デフォルトは `'compatible'` で、ほかにも `'earlier'`・`'later'`・`'reject'` を指定できます。

```js
const fallBack = datetime('2026-11-01T01:30', {
  zone: 'America/New_York',
  disambiguation: 'later',
});
fallBack.offset; // '-05:00'

datetime('2026-03-08T02:30', {
  zone: 'America/New_York',
  disambiguation: 'reject',
}); // RangeError [invalidDateTime] をスロー
```
:::

## 都市名と略称

コアパッケージが受け付けるのは、正規の IANA タイムゾーン名、`'UTC'`、固定オフセットです。都市名や地域略称、カスタム別名で解決したい場合は [`@native-dates/plugins/zones`](/plugins/zones/) をインポートしてください。

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'los angeles').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'

configure({ zoneAliases: { hq: 'Europe/Berlin' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```

`CST` や `IST` のように複数地域で使われる略称は現在のロケールの地域に従って解決され、`'Beijing'`・`'Mumbai'`・`'Osaka'` といった英語の主要都市名も手動で別名を登録せずにそのまま指定できます。
