---
source: "7b49470321d3"
title: ローカライズ
lede: ブラウザのデフォルトロケール、アプリ全体の設定、値ごとのロケール、呼び出し単位の上書きを使い分けます。
---

Native Dates は JavaScript エンジン組み込みの `Intl` データを使ってフォーマットします。ロケールファイルをダウンロードせずに、あらゆる言語・文字体系・複数形規則・暦に対応できます。

ロケールを設定する場所は、アプリの実行形態に合わせて選びます。

- **ランタイムのデフォルト**：ブラウザアプリがユーザーのシステム設定にそのまま従う場合
- **アプリ全体の [`configure()`](/api/configure/)**：クライアントアプリに独自の言語切り替えや固定ロケールがある場合
- **値単位の [`locale()`](/api/date-time/#locale)**：サーバーでリクエストごとにフォーマットする場合や、チェーン全体で特定の言語を引き継ぎたい場合
- **単発の [`format()`](/api/date-time/#format)**：1か所のラベルだけ別の暦や地域表記にしたい場合

## ブラウザでのゼロ設定

ロケールを設定も指定もしていない場合、すべての `.text` プロパティ、`format()` 呼び出し、範囲、期間、名称取得ヘルパーはランタイムのアクティブなロケールを使用します。

ユーザーのシステム言語に従うシングルユーザーのブラウザアプリであれば、追加設定は不要です。

```js
import { dateRange, hours, today } from 'native-dates';

today().text;
dateRange('2026-09-01', '2026-09-07').format('medium');
hours(2).format('long');
```

## クライアントアプリ全体でのデフォルト設定

アプリ独自の言語スイッチャーを持つ場合や固定のロケールを使う場合は、起動時に一度 [`configure()`](/api/configure/) を呼び出します。ユーザーが言語を切り替えたタイミングで再度呼び出して更新してください。

すべての値・範囲・期間・部分日付・名称取得ヘルパーが、そのロケールでフォーマットされます。

```js title="main.js"
import { configure, date, days, monthNames, yearMonth } from 'native-dates';

configure({ locale: 'es-ES' });

date('2026-05-15').format('long'); // '15 de mayo de 2026'
yearMonth('2026-05').format('long'); // 'mayo de 2026'
days(2).text; // '2 días'
monthNames('short').slice(0, 3); // ['ene', 'feb', 'mar']

configure({ locale: null });
```

`locale: null` を渡すとランタイムのデフォルトロケールに戻ります。

## 値単位でのロケール指定

任意の値に対して [`locale()`](/api/date-time/#locale) を呼び出すと、そのロケールを保持したコピーを返します。ファクトリに `{ locale }` を渡しても同じです。短く書きたい場合はエイリアスの [`lang()`](/api/date-time/#lang) も使えます。

ロケールを付与した値から派生するすべての値（加減算の結果、タイムゾーン変換後、取り出した日付や時刻、範囲、計測した期間）は同じロケールを引き継ぎます。

```js
import { date, datetime } from 'native-dates';

const arrival = datetime('2026-05-15T14:30:00Z', 'Europe/Paris').locale('fr-FR');

arrival.text; // '15 mai 2026, 16:30 UTC+2'
arrival.plus(3, 'days').date.format('long'); // '18 mai 2026'

const stay = date('2026-09-01', { locale: 'de-DE' }).to('2026-09-07');
stay.format('medium'); // '01.–07.09.2026'
```

マルチユーザーサーバーでは、プロセス全体の設定を書き換えず、値を読み込むタイミングでリクエストごとのロケールを付与してください。

```js title="orders.js"
import { datetime } from 'native-dates';

function formatOrder(order, user) {
  const placed = datetime(order.placedAt, user.zone).locale(user.locale);
  return {
    placed: placed.format('long'),
    shipBy: placed.plus(2, 'days').date.format('medium'),
  };
}

formatOrder({ placedAt: '2026-05-15T14:30:00Z' }, { zone: 'Asia/Tokyo', locale: 'ja-JP' });
```

:::warning[サーバーではリクエストごとに configure() を呼び出さない]
グローバル設定は JavaScript プロセス全体の共有状態を書き換えます。マルチユーザーサーバーでは、非同期処理の合間に別リクエストが `configure()` を上書きしてしまう恐れがあるため、値ごとに `locale()` を付与してください。
:::

引数なしで `locale()` を呼び出すと設定中のロケールタグを返し、未設定なら `undefined` を返します。空の値を渡すと設定がクリアされるため、データベースの空カラムを渡しても `locale(user.locale)` を安全にチェーンできます。

生のロケール文字列や HTTP の `Accept-Language` ヘッダーも前処理なしでそのまま渡せます。`'en_US'` のようなアンダースコア区切りは自動で正規化され、ヘッダーのタグは品質値（q 値）の高い順に並べ替えられて `q=0` のエントリは除外されます。無効なロケール文字列を渡すと [`unknownLocale`](/api/errors/#units-zones-and-formats) エラーをスローします。

```js
datetime('2026-05-15T14:30:00Z').locale('en_US').locale(); // 'en-US'
datetime('2026-05-15T14:30:00Z').locale('fr-CH;q=0.8, de;q=0.9, es;q=0').locale(); // ['de', 'fr-CH']
```

インスタンスのロケールは、ローカライズ文字列・週の境界・週末の判定に影響します。厳密な比較、ソート、[`equals()`](/api/date-time/#equals)、[`toString()`](/api/date-time/#tostring) による ISO シリアライズには影響しません。

```js
import { date } from 'native-dates';

const french = date('2026-05-15').locale('fr');
const japanese = date('2026-05-15').locale('ja');

french.equals(japanese); // true
french.toString(); // '2026-05-15'
french.to(japanese).locale(); // 'fr'
```

異なるロケールを持つ2つの値を組み合わせるメソッドでは、メソッドを呼び出した側のロケールが保持されます。

## 呼び出し単位での暦や地域表記の上書き

1か所のラベルだけ別の暦・数字体系・地域表記を使いたい場合は、`format()` に BCP 47 タグを直接渡します。元の値が持つロケール自体は変わりません。

```js
import { date } from 'native-dates';

const reiwa = date('2019-05-01').locale('ja-JP');
reiwa.format('long'); // '2019年5月1日'
reiwa.format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'

const eid = date('2026-03-20').locale('ar-SA');
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

## ロケールの解決順序

値・範囲・期間・相対時間表現をフォーマットするとき、Native Dates は次の優先順位で最初に見つかったロケールを使用します。

| 優先順位 | 指定箇所 | 使いどころ |
|---|---|---|
| 1 | `value.format(spec, locale)` | 1回の呼び出しだけ別の暦・文字体系・地域表記を使いたいとき。 |
| 2 | `value.locale(tag)` または `{ locale }` | サーバーリクエスト、再利用するチェーン、ローカライズされた UI セクション。 |
| 3 | `configure({ locale })` | クライアントアプリ全体で言語設定や言語スイッチャーを持つとき。 |
| 4 | ランタイムの `Intl` デフォルト | ブラウザアプリがユーザーのシステム言語に従うとき。 |

## 週の開始曜日と週末

週の境界と曜日の見出しは現在のロケールに自動で従います。米国・日本・韓国・ブラジルでは日曜始まり、エジプトでは土曜始まり、欧州の大部分と中国では月曜始まりになります。

[`startOf('week')`](/api/calendar-date/#startof)、[`range('week')`](/api/calendar-date/#range)、[`weekdayNames()`](/api/month-names/#weekdaynames) が同じ週開始ルールを共有しているため、カレンダーの曜日ヘッダーと週グリッドが常に揃います。

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('en-US').startOf('week').toString(); // '2026-11-15'
wed.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'

weekdayNames('short', undefined, 'en-US')[0]; // 'Sun'
weekdayNames('short', undefined, 'de-DE')[0]; // 'Mo'
```

1回の呼び出しだけ上書きしたい場合は英語の曜日名を明示的に渡し、すべてのロケールで開始曜日を固定したい場合は [`configure()`](/api/configure/) で `weekStart` に英語の曜日名を設定します。空の値を渡すと再びロケールに従う動作へ戻り、週情報を持たないランタイムでは月曜にフォールバックします。

:::details[週単位のレポートで開始曜日を固定する]
インスタンスは派生元のロケールを引き継ぎます。週次レポートや請求期間のように週をキーとしてデータを保存する場合は、`weekStart` を固定するか、月曜を1・日曜を7とする `day.weekStart` を検証してください。

```js title="reports.js"
function weekKey(day) {
  if (day.weekStart !== 1) {
    throw new Error('weekly reports are keyed by Monday weeks');
  }
  return day.startOf('week').toString();
}
```

`weekOfYear` が返す ISO 週番号は常に月曜始まりで数えられ、`dayOfWeek` も同じく月曜を1とする番号体系に従います。
:::

週末の判定も現在のロケールに従います。[`isWeekend()`](/api/calendar-date/#calendar-predicates) と [`isWeekday()`](/api/calendar-date/#calendar-predicates) は、サウジアラビアとエジプトでは金曜と土曜を、イランでは金曜のみを、インドでは日曜のみを週末とみなします。その他の多くのロケールでは土曜と日曜が週末です。

```js
const friday = date('2026-11-20');

friday.locale('en-US').isWeekend(); // false
friday.locale('ar-SA').isWeekend(); // true
```

## 曜日名と序数のカスタマイズ

月名と曜日名はランタイムから取得されるため、ユーザーの端末表記と一致します。ただし、2文字の曜日略称（`dd`）と日の序数（`Do`）にはプラットフォーム標準のフィールドがありません。

デフォルトでは、`dd` は略称を使う文字体系では短い曜日名を2文字に切り詰め、それ以外ではランタイムの最短曜日名を使用します。`Do` は英語では序数接尾辞を、その他の言語ではドイツ語の `'6.'` のように各ロケールの日表記を出力します。

どちらも [`configure()`](/api/configure/) の `weekdayNames` と `ordinals` でグローバルに上書きできます。`'fr-CA'` のような地域タグはベース言語の設定を継承したうえで上書きが適用され、プリセットや `Intl` オプションの出力には影響しません。具体例は [カスタマイズ](/guides/customization/#custom-weekday-names-and-ordinals) を参照してください。

地域・文字体系・暦ごとの細かな違いは、[すべてのサンプル](/examples/#localization) およびサイドバーの **各言語での扱い** にある言語別ガイドを参照してください。続いて、[日付と時刻の型](/guides/types-of-time/) でアプリ内の各値に適した型の選び方を確認しましょう。
