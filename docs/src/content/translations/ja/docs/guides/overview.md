---
source: "c85157f664b2"
title: 概要
lede: ブラウザ標準の Temporal と Intl API を基盤とした、読みやすくイミュータブルな日付・時刻ライブラリです。
---

最新の JavaScript エンジンには、暦やタイムゾーンの計算を担う `Temporal` と、ローカライズ出力を担う `Intl` が標準搭載されています。Native Dates は、これらの組み込み API をランタイム依存ゼロ・直感的な書き方で扱えるようにラップしたライブラリです。

```js
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const standup = date('2026-11-16')
  .at('9:30am', 'America/Los_Angeles')
  .in('Europe/Berlin');
```

IANA タイムゾーンデータベースやロケール規則はランタイム側に組み込まれているため、追加のゾーンデータやロケールファイルをバンドルに含めなくても世界中の地域・言語に対応できます。

## 用途ごとに分かれた型

JavaScript 標準の `Date` は、祝日であっても、店舗の開店時刻であっても、データベースのタイムスタンプであっても、すべて同じ1つのオブジェクトで扱います。Native Dates では概念ごとに専用の型を用意し、それぞれの値に意味のあるフィールドだけを保持します。

- [`CalendarDate`](/api/calendar-date/)：タイムゾーンの影響を受けないカレンダー日付（2026年5月10日など）
- [`Time`](/api/time/)：0時をまたいで循環する時刻（午前9時30分など）
- [`DateTime`](/api/date-time/)：タイムゾーンと結びついた特定の時点を表す日時
- [`Duration`](/api/duration/)：90分や2週間といった期間
- [`YearMonth`](/api/year-month/) と [`MonthDay`](/api/month-day/)：請求対象月、カードの有効期限、毎年の誕生日
- [範囲](/api/ranges/)：2つの日付・時刻・時点の区間

差分の計測、範囲の構築、ローカライズされたプリセットやトークンパターンによるフォーマットも、すべて追加設定なしで使えます。

```js
import { dateRange, datetime, monthDay, now, timeRange, yearMonth } from 'native-dates';

const deadline = datetime('2027-01-01T00:00:00Z');
now().until(deadline).format('long');

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');
sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

型の選び方と相互変換については、次の [日付と時刻の型](/guides/types-of-time/) を参照してください。

## イミュータブルな値

すべてのインスタンスはイミュータブルです。[`plus()`](/api/date-time/#plus) や [`in()`](/api/date-time/#in) などのメソッドを呼び出しても元の値は変更されず、常に新しい値が返されます。

そのため、ヘルパー関数や UI コンポーネントに日付を渡しても、呼び出し元の状態が意図せず書き換わることはありません。

```js
const original = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const moved = original.plus(1, 'hour');

original.text; // 'Nov 16, 2026, 9:30 AM PST'
moved.text; // 'Nov 16, 2026, 10:30 AM PST'
```

また、すべての値には現在のロケールで読みやすくフォーマットした `.text` ゲッターと、カスタムの `util.inspect` 出力が用意されているため、Node の `console.log()` でも1行の簡潔なプレビューが表示されます。

```js
import { time } from 'native-dates';

date('2026-05-10').text; // 'May 10, 2026'
time('9:30am').text; // '9:30 AM'
```

:::tip[値の比較]
メソッドは常に新しいインスタンスを返すため、`===` では値の一致ではなくオブジェクト参照が比較されます。2つのインスタンスが同じ日付・時刻・時点を表すかどうかを調べるには [`equals()`](/api/date-time/#equals) を呼び出してください。
:::

## コアとプラグイン

コアパッケージの [`native-dates`](/guides/installation/) には、値の生成、タイムゾーン、暦計算、部分日付、範囲、期間、相対時間表現、ローカライズされたプリセット、トークンパターンが含まれます。

都市名・略称によるタイムゾーン解決、loose モード（緩やかな解析）、従来の `Date` 互換メソッドといったオプション機能は、[`@native-dates/plugins`](/plugins/) からサブパス単位で個別にインポートできます。プラグインの追加やアプリ全体のデフォルト設定は [カスタマイズ](/guides/customization/#adding-plugins) を確認してください。

プロジェクトへの導入や Safari 向けポリフィルの設定は、[インストール](/guides/installation/) から進められます。
