---
source: "91f647c820ea"
title: エラー
lede: 不正な入力や未対応の操作は、機械判読可能なコードを持つ標準の Error をスローします。
---

## エラーの構造

不正な呼び出しは、壊れた日付オブジェクトや `NaN` を返して後続の計算を壊すのではなく、その場で即座に失敗します。スローされるエラーはすべて標準の JavaScript エラーであり、次の2つのプロパティを持ちます。

- **`error.code`** には `'invalidDate'` や `'unknownZone'` のような安定したキャメルケースの識別子が入ります。
- **`error.at`** には `'2026-02-30'` のように、問題となった入力値や操作対象が文字列として入ります。

引数の型誤りや異なる種類の組み合わせでは `TypeError` をスローします。存在しない日付、解析できない文字列、未認識の単位やタイムゾーン、未対応の操作では `RangeError` をスローします。

```js title="catch.js"
import { date } from 'native-dates';

try {
  date('2026-02-30');
} catch (error) {
  error instanceof RangeError; // true
  error.code; // 'invalidDate'
  error.at; // '2026-02-30'
}
```

開発環境では、`error.message` の2行目に呼び出しの修正方法を説明する英語のヒントが含まれます。`NODE_ENV` が `'production'` の本番ビルドでは、エラーコードと入力値の記録を残したまま、英語のヒント文字列が自動的に取り除かれます。

## 信頼できない入力の処理

失敗の種類ごとに独自のバリデーションメッセージを出したい場合は `error.code` を確認し、想定外のエラーは再スローします。

```js
import { datetime } from 'native-dates';

function parseTimestamp(raw, zone) {
  try {
    return datetime(raw, zone);
  } catch (error) {
    if (error.code === 'invalidDateTime') {
      return null;
    }
    throw error;
  }
}

parseTimestamp('not-a-date', 'UTC'); // null
```

ユーザーが手入力したフォーム欄、クエリパラメーター、CSV セルなど、読み取れない文字列に対して `null` を返したい場合は、[`@native-dates/plugins/loose`](/plugins/loose/) をインポートして loose モードを有効にします。

```js
import { date, duration } from 'native-dates';
import '@native-dates/plugins/loose';

date('2026-02-30', { loose: true }); // null
duration('whenever', { loose: true }); // null
```

:::tip[loose モードにおけるデータエラーとコードエラーの違い]
loose モードが `null` を返すのは、入力値そのものを読み取れない場合だけです。未認識のタイムゾーンや開始と終了が逆転した範囲など、呼び出し側コードのオプション誤りはバグを見逃さないよう引き続き例外をスローします。
:::

## TypeError コード一覧

`TypeError` は、必須の入力が欠けている場合、JavaScript の型が異なる場合、または想定と異なる時間概念の値が渡された場合にスローされます。

| コード | スロー元 | 原因 |
|---|---|---|
| `missingDateTime` | `datetime()`, `DateTime` | 入力が `null` または `undefined`。 |
| `missingDate` | `date()`, `CalendarDate` | 入力が `null` または `undefined`。 |
| `missingTime` | `time()`, `Time` | 入力が `null` または `undefined`。 |
| `missingYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | 入力が `null` または `undefined`。 |
| `missingMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | 入力が `null` または `undefined`。 |
| `invalidDateTime` | `datetime()`, `DateTime` | 真偽値など未対応の型が渡された。 |
| `invalidDate` | `date()`, `CalendarDate` | 単一の数値や未対応の型が渡された。 |
| `invalidTime` | `time()`, `Time` | 未対応の型が渡された。 |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | 単一の数値や未対応の型が渡された。 |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | 単一の数値や未対応の型が渡された。 |
| `invalidDuration` | `duration()`, `Duration`, `plus()`, `minus()` | 入力が `null`・`undefined` または未対応の型であるか、すでに単位を持つ期間にさらに単位引数が渡された。 |
| `unsupportedCalendar` | `yearMonth()`, `monthDay()`, `YearMonth`, `MonthDay` | ISO 以外の暦を持つ `Temporal.PlainYearMonth` または `PlainMonthDay` が渡された。 |
| `invalidPoint` | `compare()`, `earliest()`, `latest()` | `DateTime`、`CalendarDate`、`Time`、`YearMonth`、`Date`、エポックタイムスタンプ、Temporal の日付・時刻・日時オブジェクト、または解析可能な文字列のいずれでもない。 |
| `conflictingKinds` | `compare()`, `earliest()`, `latest()` | `CalendarDate` と `DateTime` のように異なる種類同士を比較した。 |
| `conflictingRanges` | `DateRange`, `DateTimeRange`, `TimeRange` | ある種類の範囲を別の種類の範囲コンストラクターやファクトリーに渡した。 |

## RangeError コード一覧

`RangeError` は、値が解析できない場合、有効範囲を外れている場合、または未対応の単位・タイムゾーン・操作を指定した場合にスローされます。

### 解析と値

| コード | スロー元 | 原因 |
|---|---|---|
| `invalidDateTime` | `datetime()`, `DateTime` | 文字列を日時として解析できない、または2月30日のようにフィールドが範囲外。 |
| `invalidDate` | `date()`, `CalendarDate` | 文字列を日付として解析できない、数値が小数、またはフィールドが範囲外。 |
| `missingDay` | `date()`, `CalendarDate` | 数値の `(year, month)` 呼び出しで `day` 引数が省略された。 |
| `invalidTime` | `time()`, `Time` | 文字列を時刻として解析できない、12時間制の値が1〜12の範囲外、または時刻フィールドが範囲外。 |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | 文字列を年月として解析できない、数値が小数、または月が1〜12の範囲外。 |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | 文字列を月日として解析できない、`equals()` にあいまいな区切り文字が渡された、またはフィールドが範囲外。 |
| `invalidYear` | `MonthDay.in()` | `in()` に渡された年が整数でない、または Temporal がサポートする年の範囲外。 |
| `invalidDay` | `YearMonth.on()` | `on()` に渡された日が1〜31の整数ではない。 |
| `invalidDuration` | `duration()`, `Duration` | 空または解析できない英語の単位表現、不正な ISO 8601 期間、または範囲外の期間フィールド。 |
| `invalidNumber` | `datetime()`、`duration()`、単位ヘルパー | 数値入力が `NaN`、`Infinity`、`-Infinity`、または無効な `Date` インスタンス。 |
| `conflictingSigns` | `duration()`, `Duration`, `minus()` | `'1h -30m'` や基準日のない日数から時間を引く操作のように、繰り下がりできない正負混在の期間。 |
| `invalidFraction` | `duration()`, `months()`, `times()` | 月やナノ秒の小数を、長さが固定されたより小さな単位へ変換できない。 |

### 単位・タイムゾーン・フォーマット

| コード | スロー元 | 原因 |
|---|---|---|
| `unknownUnit` | 加減算、境界、丸め、`set()`、`duration()` | 未認識の単位名または略称。 |
| `unknownDayOfWeek` | `dayOfWeek()`、`next()`、`previous()`、週の境界、`configure()` | 英語の曜日名が認識できない、または曜日番号が1〜7の範囲外。 |
| `unknownSetting` | `configure()` | `configure()` に渡された設定キーが認識できない。 |
| `unknownWidth` | `configure()` | `weekdayNames` の項目で幅が `narrow`・`short`・`long` 以外になっている、または幅が省略されている。 |
| `unknownZone` | ファクトリー関数、`in()`、`configure()` | 未知の IANA タイムゾーン ID、文字列以外のゾーン指定、または不正な形式の UTC オフセット。 |
| `invalidZoneAliases` | `configure()` | `zoneAliases` がプレーンオブジェクトでも `null` でもない。 |
| `unknownLocale` | `locale()`、ファクトリー関数、`format()`、`monthNames()`、`weekdayNames()`、`configure()` | ロケールタグ、タグ配列、または `Accept-Language` ヘッダーに不正な言語タグが含まれている。 |
| `unknownFormat` | `format()`, `monthNames()`, `weekdayNames()` | 不正なフォーマット指定や `Intl` オプション、未対応の期間・ラベルスタイル、または角括弧 `[...]` の外にある未認識もしくは連結されたトークン。 |
| `unsupportedToken` | `format()` | `CalendarDate` に対する `HH` や `Time` に対する `YYYY` のように、その型が持たないフィールドをトークンパターンが要求した。 |
| `unknownKind` | `as()`, `DateRange.count()` | 呼び出し元の型が対象の種類をサポートしていない。 |

### 計算と計測

| コード | スロー元 | 原因 |
|---|---|---|
| `unsupportedUnit` | `CalendarDate`, `Time`, `YearMonth` | `CalendarDate` に時刻単位、`Time` にカレンダー単位、`YearMonth` に月未満の単位を使用した。 |
| `cannotAdd` | `plus()`, `add()` | 加算の結果が Temporal で表現可能な日付範囲を超過した。 |
| `cannotSubtract` | `minus()`, `subtract()` | 減算の結果が Temporal で表現可能な日付範囲を超過した。 |
| `cannotSet` | `set()` | フィールド値が小数、またはそのカレンダー月・時刻単位の有効範囲外。 |
| `cannotRound` | `round()`, `floor()`, `ceil()`, `Time.startOf()`, `Time.startOfNext()`, `Time.startOfPrevious()` | 未対応の丸め単位、またはステップ幅が1つ上の単位を割り切れない。 |
| `missingAnchor` | `Duration.balance()`, `total()`, `compare()` | 基準日を持たない期間で、月や年を週・日・時刻単位へ変換しようとした。 |
| `cannotBalance` | `Duration.balance()` | `Duration.balance()` の処理がオーバーフローした、または Temporal の丸めに失敗した。 |
| `cannotTotal` | `Duration.total()`, `until()`, `since()` | 合計の長さの計算がオーバーフローした、または未対応の単位を指定した。 |
| `missingPoints` | `earliest()`, `latest()` | 引数なし、または空配列で呼び出した。 |
| `unsupportedComparison` | `CalendarDate`、`Time`、`YearMonth`、`MonthDay`、範囲 | エポック数値を持たない型に対して、`valueOf()`、単項 `+`、`-`、`<`、`>` による数値変換を試みた。 |

### 範囲

| コード | スロー元 | 原因 |
|---|---|---|
| `invalidRange` | `DateRange`, `DateTimeRange`, `to()` | 範囲の `end` が `start` より前になっている。 |
| `invalidStep` | `every()`, `split()` | `every()` または `split()` に渡されたステップ期間が0または負。 |
| `unsupportedIntersection` | `TimeRange.intersection()` | 深夜0時をまたぐ2つの時刻範囲が、2つの離れた区間で重なっている。 |
| `unsupportedZone` | `TimeRange.in()` | タイムゾーンに配置するためのカレンダー日付を持たない `TimeRange` に対して `in()` を呼び出した。 |

### プラグイン

| コード | スロー元 | 原因 |
|---|---|---|
| `missingPlugin` | ファクトリー関数、`configure()` | 対応するプラグインをインポートする前に `loose`、`dayFirst`、`zoneAliases` を使用した。 |
| `immutable` | `DateTime` のレガシーセッター | [`@native-dates/plugins/legacy-date`](/plugins/legacy-date/) を読み込んだ状態で、`setHours()` など破壊的な `Date` セッターを呼び出した。 |
